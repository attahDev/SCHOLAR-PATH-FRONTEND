import { useState } from "react";
import { Link } from "react-router-dom";
import { useGet } from "../hooks.js";
import { patch, post } from "../api.js";
import { Loading, ErrorBox, titleCase } from "../components/ui.jsx";

const STATUSES = ["saved", "interested", "preparing", "ready", "applied", "interview", "accepted", "rejected", "withdrawn"];

function Readiness({ id }) {
  const { data, error, loading, reload } = useGet(`/applications/${id}/readiness`);
  if (loading) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  return (
    <div>
      <p><strong>{data.percent}%</strong> ready <button className="link" onClick={async () => { await post(`/applications/${id}/refresh`); reload(); }}>Re-check against my documents</button></p>
      <ul className="ev">{data.items.map((it, i) => <li key={i} className={it.status === "met" ? "positive" : it.status === "in_progress" ? "warning" : it.status === "missing" ? "negative" : ""}>{it.label}</li>)}</ul>
      {data.nextActions.length > 0 && <><strong>Next actions</strong><ul>{data.nextActions.map((a, i) => <li key={i}>{a}</li>)}</ul></>}
    </div>
  );
}

export default function Applications() {
  const { data, error, loading, reload } = useGet("/applications");
  const [open, setOpen] = useState(null);
  const [err, setErr] = useState(null);
  const update = async (a, status, notes) => {
    try { await patch(`/applications/${a.id}`, { status, notes }); setErr(null); reload(); } catch (e) { setErr(e); }
  };
  return (
    <>
      <h1>Applications</h1>
      <ErrorBox error={error || err} />
      {loading && <Loading />}
      {data?.applications.length === 0 && <div className="card">You're not tracking anything yet. Open an opportunity and choose "Track application".</div>}
      {data?.applications.map((a) => (
        <div className="card" key={a.id}>
          <div className="spread">
            <div><h3><Link to={`/opportunity/${a.opportunity_id}`}>{a.title}</Link></h3><span className="muted">{a.closes_on ? `Deadline ${String(a.closes_on).slice(0, 10)}` : "No published deadline"}</span></div>
            <select style={{ width: "auto" }} value={a.status} onChange={(e) => update(a, e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</select>
          </div>
          <label>Notes</label>
          <textarea rows={2} defaultValue={a.notes ?? ""} onBlur={(e) => e.target.value !== (a.notes ?? "") && update(a, a.status, e.target.value)} />
          <p><button className="link" onClick={() => setOpen(open === a.id ? null : a.id)}>{open === a.id ? "Hide" : "Show"} readiness checklist</button></p>
          {open === a.id && <Readiness id={a.id} />}
        </div>
      ))}
    </>
  );
}
