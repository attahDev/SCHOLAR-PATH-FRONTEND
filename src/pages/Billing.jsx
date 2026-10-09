import { useState } from "react";
import { useGet } from "../hooks.js";
import { post } from "../api.js";
import { Loading, ErrorBox, titleCase } from "../components/ui.jsx";

const FEATURE_LABEL = {
  FEATURE_ADVANCED_MATCHING: "Unlimited personalized recommendations with fit detail", FEATURE_ELIGIBILITY_ANALYSIS: "Detailed per-requirement eligibility analysis",
  FEATURE_AFFORDABILITY_ANALYSIS: "Affordability analysis", FEATURE_APPLICATION_READINESS: "Application readiness", FEATURE_WHATSAPP_ALERTS: "WhatsApp alerts",
  FEATURE_SEARCH_ALERTS: "Search subscriptions", FEATURE_PATHWAYS: "Alternative pathways", FEATURE_OPPORTUNITY_COMPARISON: "Opportunity comparison",
  FEATURE_UNLIMITED_SAVED_OPPORTUNITIES: "Unlimited saves", FEATURE_ADVANCED_APPLICATION_TRACKER: "Advanced application tracking",
};

export default function Billing() {
  const sub = useGet("/subscription"), plans = useGet("/plans");
  const [error, setError] = useState(null); const [busy, setBusy] = useState(false);
  const buy = async (planCode) => {
    setBusy(true); setError(null);
    try { window.location.href = (await post("/billing/checkout", { planCode })).authorizationUrl; }
    catch (e) { setError(e); setBusy(false); }
  };
  const cancel = async () => {
    if (!window.confirm("Cancel your subscription? You keep Premium until the end of the period you've paid for.")) return;
    try { await post("/billing/cancel"); sub.reload(); } catch (e) { setError(e); }
  };
  const s = sub.data?.subscription;
  const free = plans.data?.plans.find((p) => p.code === "free");
  return (
    <>
      <h1>My subscription</h1>
      <ErrorBox error={error || sub.error || plans.error} />
      {sub.loading ? <Loading /> : sub.data && (
        <div className="card">
          <p>Current plan: <strong>{titleCase(sub.data.effectivePlan.replace("_", " "))}</strong>{s && <> · Status: <strong>{titleCase(s.status)}</strong></>}</p>
          {s?.current_period_end && <p className="muted">{s.cancel_at_period_end ? "Access ends" : "Renews"} {new Date(s.current_period_end).toLocaleDateString()}</p>}
          <p className="muted">Recommendations this week: {sub.data.usage.recommendations.limit == null ? "unlimited" : `${sub.data.usage.recommendations.used} of ${sub.data.usage.recommendations.limit}`} · Saved: {sub.data.usage.savedOpportunities.limit == null ? "unlimited" : `${sub.data.usage.savedOpportunities.used} of ${sub.data.usage.savedOpportunities.limit}`}</p>
          {s && s.provider && s.status === "active" && <button className="danger" onClick={cancel}>Cancel subscription</button>}
        </div>
      )}
      <h2>Plans</h2>
      <p className="muted">Free is a real product: profile, GPA calculator, search, some recommendations, saves and basic alerts. Premium saves you research time.</p>
      <div className="grid2">
        {plans.data?.plans.filter((p) => p.code !== "free").map((p) => {
          const extra = p.features.filter((f) => !free?.features.includes(f));
          return (
            <div className="card" key={p.code}>
              <h3>{p.name}</h3>
              <p><strong>{p.purchasable ? `${(p.price_cents / 100).toLocaleString()} ${p.currency}` : "Pricing coming soon"}</strong>{p.purchasable && <span className="muted"> / {p.billing_interval === "annual" ? "year" : "month"}</span>}</p>
              <ul>{extra.map((f) => <li key={f}>{FEATURE_LABEL[f] ?? titleCase(f.replace("FEATURE_", "").toLowerCase())}</li>)}</ul>
              <button className="primary" disabled={!p.purchasable || busy || sub.data?.effectivePlan === p.code} onClick={() => buy(p.code)}>{sub.data?.effectivePlan === p.code ? "Current plan" : "Upgrade"}</button>
            </div>
          );
        })}
      </div>
    </>
  );
}
