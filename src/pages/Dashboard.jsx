import { useState } from "react";
import { Link } from "react-router-dom";
import { useGet } from "../hooks.js";
import { post } from "../api.js";
import { useAuth } from "../auth.jsx";
import { Loading, ErrorBox, EligibilityBadge, FitBars, Evidence, UpgradeNote, eur, titleCase } from "../components/ui.jsx";

function Card({ r, onSaved }) {
  const [msg, setMsg] = useState(null);
  const save = async () => {
    try { await post(`/saved/${r.opportunity_id}`); setMsg("Saved"); onSaved?.(); }
    catch (e) { setMsg(e.status === 402 ? "Free plan save limit reached — see Premium." : e.message); }
  };
  return (
    <div className="card">
      <div className="spread">
        <div>
          <h3><Link to={`/opportunity/${r.opportunity_id}`}>{r.title}</Link></h3>
          <span className="muted">{titleCase(r.type)}</span>
        </div>
        <EligibilityBadge value={r.eligibility} />
      </div>
      <div className="grid2" style={{ marginTop: 10 }}>
        <div><strong>Why you're seeing this</strong><Evidence items={(r.evidence || []).slice(0, 4)} polarity={["positive", "warning", "negative"]} /></div>
        <div><FitBars fit={r.fit} /><p className="muted">Estimated yearly cost after verified funding: <strong>{eur(r.net_cost_eur)}</strong></p></div>
      </div>
      <div className="row"><Link className="btn" to={`/opportunity/${r.opportunity_id}`}>Details</Link><button onClick={save}>Save</button>{msg && <span className="muted">{msg}</span>}</div>
    </div>
  );
}

export default function Dashboard() {
  const { me } = useAuth();
  const { data, error, loading, reload } = useGet("/dashboard?limit=30");
  return (
    <>
      <h1>For you</h1>
      {me && !me.onboardingComplete && (
        <div className="banner">Your profile is {me.completeness?.percent ?? 0}% complete. Better answers need more detail. <Link to="/onboarding">Continue setup</Link></div>
      )}
      <ErrorBox error={error} />
      {loading && <Loading />}
      {data?.limited && <UpgradeNote>Free plans show your top {data.weeklyLimit} recommendations each week. Premium shows all of them.</UpgradeNote>}
      {data && data.results.length === 0 && <div className="card">No matches yet. Finish your profile — education, GPA, target field, countries and budget — and we'll start matching. <Link to="/onboarding">Complete profile</Link></div>}
      {data?.results.map((r) => <Card key={r.opportunity_id} r={r} onSaved={reload} />)}
    </>
  );
}
