import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useGet, toggleCompare, getCompare } from "../hooks.js";
import { post } from "../api.js";
import { Loading, ErrorBox, EligibilityBadge, VerifiedBadge, FitBars, Evidence, UpgradeNote, eur, titleCase } from "../components/ui.jsx";

const KINDS = [["incorrect_info", "Incorrect information"], ["expired", "Expired"], ["broken_link", "Broken link"], ["incorrect_deadline", "Wrong deadline"], ["incorrect_eligibility", "Wrong eligibility"], ["duplicate", "Duplicate"], ["suspicious", "Suspicious / scam"]];

function Pathways({ id }) {
  const { data, error, loading } = useGet(`/opportunities/${id}/pathways`);
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  if (!data.routes.length) return <p className="muted">We couldn't find closely related programs that fit your profile right now.</p>;
  return data.routes.map((r) => (
    <div key={r.opportunityId} className="row" style={{ marginBottom: 8 }}>
      <div style={{ flex: 1 }}><Link to={`/opportunity/${r.opportunityId}`}>{r.title}</Link><div className="muted">{r.why}</div></div>
      <EligibilityBadge value={r.decision.eligibility} />
    </div>
  ));
}

export default function OpportunityDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data, error, loading } = useGet(`/opportunities/${id}`);
  const ready = useGet(`/opportunities/${id}/readiness`);
  const [msg, setMsg] = useState(null);
  const [cmp, setCmp] = useState(getCompare());
  const [report, setReport] = useState({ open: false, kind: "incorrect_info", message: "" });

  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const { opportunity: o, deadlines, decision: d } = data;
  const oid = Number(id);
  const act = async (fn, ok) => { try { await fn(); setMsg(ok); } catch (e) { setMsg(e.status === 402 ? "Free plan limit reached — see Premium." : e.message); } };
  const failing = d.eligibilityDetail.filter((x) => x.outcome === "unmet");

  return (
    <>
      <p><Link to="/search">← Back</Link></p>
      <div className="card">
        <div className="spread">
          <div><h1>{o.title}</h1><span className="muted">{titleCase(o.type)} · {titleCase(o.degree_level)} · {o.country} · {o.field}</span></div>
          <div><EligibilityBadge value={d.eligibility} /> <VerifiedBadge status={o.verification_status} /></div>
        </div>
        {o.sponsored && <p><span className="badge warn">Sponsored{o.sponsor_label ? `: ${o.sponsor_label}` : ""}</span> <span className="muted">Sponsorship never affects eligibility or match results.</span></p>}
        {o.description && <p>{o.description}</p>}
        <p className="muted">
          {o.source_url ? <>Source: <a href={o.source_url} target="_blank" rel="noreferrer">{o.source_url}</a></> : "Source not recorded."}
          {o.application_url && <> · <a href={o.application_url} target="_blank" rel="noreferrer">Official application page</a></>}
        </p>
        {deadlines.length > 0 && <p><strong>Deadlines:</strong> {deadlines.map((x) => `${titleCase(x.type)}: ${x.rolling ? "rolling" : x.closes_on ? String(x.closes_on).slice(0, 10) : "not published"}`).join(" · ")}</p>}
        <div className="row">
          <button className="primary" onClick={() => act(() => post(`/saved/${oid}`), "Saved.")}>Save</button>
          <button onClick={() => act(async () => { await post(`/applications/${oid}`); nav("/applications"); }, "Tracking started.")}>Track application</button>
          <button onClick={() => setCmp(toggleCompare(oid))}>{cmp.includes(oid) ? "Remove from compare" : "Add to compare"}</button>
          {cmp.length >= 2 && <Link className="btn" to={`/compare?ids=${cmp.join(",")}`}>Compare ({cmp.length})</Link>}
          <button className="link" onClick={() => setReport({ ...report, open: !report.open })}>Report a problem</button>
        </div>
        {msg && <p className="muted">{msg}</p>}
        {report.open && (
          <div className="card" style={{ marginTop: 10 }}>
            <label>What's wrong?</label>
            <select value={report.kind} onChange={(e) => setReport({ ...report, kind: e.target.value })}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            <label>Details (optional)</label><textarea rows={2} value={report.message} onChange={(e) => setReport({ ...report, message: e.target.value })} />
            <p><button onClick={() => act(async () => { await post(`/opportunities/${oid}/report`, { kind: report.kind, message: report.message }); setReport({ ...report, open: false, message: "" }); }, "Thanks — our team will review it.")}>Send report</button></p>
          </div>
        )}
      </div>

      <div className="grid2">
        <div className="card"><h2>Why this matches</h2><Evidence items={d.evidence} polarity={["positive", "warning"]} /></div>
        <div className="card"><h2>Why not</h2><Evidence items={d.evidence} polarity={["negative"]} />
          {failing.length > 0 && <p className="muted">A published requirement isn't currently met. See alternatives below.</p>}</div>
      </div>

      <div className="grid2">
        <div className="card"><h2>Fit</h2><FitBars fit={d.fit} /></div>
        <div className="card"><h2>Cost</h2>
          <p>Estimated yearly cost after verified funding: <strong>{eur(d.netCostEur)}</strong></p>
          <p className="muted">Tuition and living costs are estimates unless marked verified. Scholarships are not assumed to combine unless confirmed.</p>
        </div>
      </div>

      <div className="card"><h2>Requirement check</h2>
        <div className="scroll"><table><thead><tr><th>Requirement</th><th>Required</th><th>Your record</th><th>Result</th></tr></thead><tbody>
          {d.eligibilityDetail.map((x, i) => (
            <tr key={i}><td>{x.text || titleCase(x.kind)}{x.unconfirmed && <div className="muted">Requirement not yet verified</div>}</td><td>{x.reqValue || "—"}</td><td>{x.userValue || "—"}</td><td>{x.outcome === "met" ? "✓ Met" : x.outcome === "unmet" ? "✕ Not met" : "? Unknown"}</td></tr>
          ))}
          {d.eligibilityDetail.length === 0 && <tr><td colSpan={4} className="muted">No published requirements recorded yet.</td></tr>}
        </tbody></table></div>
        <p className="muted">Eligibility is based on published requirements only. It never guarantees admission.</p>
      </div>

      <div className="card"><h2>Application readiness</h2>
        {ready.loading ? <Loading /> : ready.error ? <ErrorBox error={ready.error} /> : (
          <>
            <p><strong>{ready.data.percent}%</strong> ready</p>
            <ul className="ev">{ready.data.items.map((it, i) => <li key={i} className={it.status === "met" ? "positive" : it.status === "in_progress" ? "warning" : it.status === "missing" ? "negative" : ""}>{it.label}</li>)}</ul>
            {ready.data.nextActions.length > 0 && <><strong>Next actions</strong><ul>{ready.data.nextActions.map((a, i) => <li key={i}>{a}</li>)}</ul></>}
          </>
        )}
      </div>

      {(d.eligibility === "Not Eligible" || d.eligibility === "Unknown") && (
        <div className="card"><h2>Closest realistic alternatives</h2><Pathways id={oid} /></div>
      )}
    </>
  );
}
