import { useState } from "react";
import { useGet } from "../hooks.js";
import { post, patch } from "../api.js";
import { Loading, ErrorBox } from "../components/ui.jsx";

const EXAMPLE = JSON.stringify({ type: "program", title: "MSc Example", degreeLevel: "master", fieldSlug: "computer-science", university: { name: "Example University", countryIso2: "DE" }, source: { url: "https://example.edu/msc", type: "university" }, program: { durationMonths: 24, tuitionAmount: 2000, tuitionCurrency: "EUR", tuitionPeriod: "year" }, requirements: [], deadlines: [] }, null, 2);

export default function Admin() {
  const staging = useGet("/admin/staging"), reports = useGet("/admin/reports?status=open");
  const [json, setJson] = useState(EXAMPLE); const [out, setOut] = useState(null); const [error, setError] = useState(null);
  const [oppId, setOppId] = useState("");
  const run = async (fn, okMsg) => { setError(null); try { const r = await fn(); setOut(okMsg ?? JSON.stringify(r)); staging.reload(); reports.reload(); } catch (e) { setError(e); } };
  return (
    <>
      <h1>Admin</h1>
      <ErrorBox error={error} />{out && <div className="banner">{out}</div>}
      <div className="card"><h2>Stage a record</h2>
        <p className="muted">Everything lands in staging first; nothing reaches the catalog until you publish and then activate it.</p>
        <textarea rows={12} value={json} onChange={(e) => setJson(e.target.value)} style={{ fontFamily: "monospace" }} />
        <p><button className="primary" onClick={() => run(async () => { const r = await post("/admin/staging", { extracted: JSON.parse(json) }); return r.errors.length ? `Staged #${r.id} with validation errors: ${r.errors.join("; ")}` : `Staged #${r.id}`; })}>Stage</button></p></div>
      <div className="card"><h2>Pending review</h2>
        {staging.loading ? <Loading /> : staging.data?.staged.length === 0 ? <p className="muted">Nothing pending.</p> : staging.data?.staged.map((s) => (
          <div key={s.id} className="spread" style={{ borderTop: "1px solid var(--ln)", padding: "8px 0" }}>
            <div><strong>#{s.id} {s.extracted?.title}</strong><div className="muted">{s.source_url}</div>{s.validation_errors?.length > 0 && <div style={{ color: "var(--no)" }}>{s.validation_errors.join("; ")}</div>}</div>
            <div className="row">
              <button disabled={s.validation_errors?.length > 0} onClick={() => run(async () => { const r = await post(`/admin/staging/${s.id}/publish`); return `Draft opportunity #${r.opportunityId} created.${r.possibleDuplicates.length ? ` Possible duplicates: ${r.possibleDuplicates.map((d) => `#${d.id} ${d.title}`).join(", ")}` : ""}`; })}>Publish as draft</button>
              <button className="danger" onClick={() => { const note = window.prompt("Reason for rejecting?"); if (note) run(() => post(`/admin/staging/${s.id}/reject`, { note }), "Rejected."); }}>Reject</button>
            </div>
          </div>
        ))}</div>
      <div className="card"><h2>Opportunity lifecycle</h2>
        <div className="row"><input style={{ width: 140 }} placeholder="Opportunity id" value={oppId} onChange={(e) => setOppId(e.target.value)} />
          <button onClick={() => run(() => post(`/admin/opportunities/${oppId}/activate`), "Activated.")}>Activate</button>
          <button className="danger" onClick={() => { const reason = window.prompt("Reason for archiving?"); if (reason) run(() => post(`/admin/opportunities/${oppId}/archive`, { reason }), "Archived."); }}>Archive</button></div>
        <p className="muted">Activation checks verification rules on the server. Field-level verification is available at POST /admin/verify; a UI for it isn't built yet.</p></div>
      <div className="card"><h2>User reports</h2>
        {reports.loading ? <Loading /> : reports.data?.reports.length === 0 ? <p className="muted">No open reports.</p> : reports.data?.reports.map((r) => (
          <div key={r.id} className="spread" style={{ borderTop: "1px solid var(--ln)", padding: "8px 0" }}>
            <div><strong>{r.title}</strong> <span className="badge neutral">{r.kind}</span><div className="muted">{r.message || "No details"}</div></div>
            <div className="row"><button onClick={() => run(() => patch(`/admin/reports/${r.id}`, { status: "resolved" }), "Resolved.")}>Resolve</button><button onClick={() => run(() => patch(`/admin/reports/${r.id}`, { status: "dismissed" }), "Dismissed.")}>Dismiss</button></div>
          </div>
        ))}</div>
    </>
  );
}
