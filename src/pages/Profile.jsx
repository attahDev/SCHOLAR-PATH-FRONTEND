import { Link } from "react-router-dom";
import { useGet } from "../hooks.js";
import { useAuth } from "../auth.jsx";
import { Loading, ErrorBox, titleCase } from "../components/ui.jsx";

export default function Profile() {
  const { me } = useAuth();
  const { data, error, loading } = useGet("/profile");
  const comp = useGet("/profile/completeness");
  if (loading) return <Loading />;
  const p = data?.profile, pr = data?.preferences;
  return (
    <>
      <div className="spread"><h1>Profile</h1><Link className="btn" to="/onboarding">Edit</Link></div>
      <ErrorBox error={error} />
      {comp.data && (
        <div className="card"><strong>{comp.data.percent}% complete</strong>
          {comp.data.missing.length > 0 && <ul>{comp.data.missing.slice(0, 5).map((m) => <li key={m.key}>{m.label} <span className="muted">(+{m.gain}%)</span></li>)}</ul>}
        </div>
      )}
      {data && (<>
        <div className="card"><h2>About you</h2>
          <p>{p?.full_name || "—"} · {me?.email}</p>
          <p className="muted">{[p?.city, p?.academic_status && titleCase(p.academic_status)].filter(Boolean).join(" · ") || "Not provided"}</p></div>
        <div className="card"><h2>Education</h2>
          {data.education.length === 0 && <p className="muted">None added.</p>}
          {data.education.map((e) => <p key={e.id}><strong>{e.institution_name}</strong> — {e.degree_title || titleCase(e.degree_level)}{e.field_name && ` (${e.field_name})`}<br /><span className="muted">{e.current_gpa != null ? `${e.current_gpa} / ${e.current_scale}` : "No GPA recorded"}{e.end_year && ` · ${e.end_year}`}</span></p>)}</div>
        <div className="card"><h2>Goals</h2>
          <p>{pr?.target_degree_level ? titleCase(pr.target_degree_level) : "—"} · {data.fields.map((x) => x.name).join(", ") || "No fields chosen"}</p>
          <p className="muted">{pr?.anywhere ? "Open to anywhere" : data.locations.map((l) => l.name).join(", ") || "No countries chosen"}</p>
          <p className="muted">Budget: {pr?.max_annual_total_eur ? `up to €${Number(pr.max_annual_total_eur).toLocaleString()}/year` : "not set"} · Funding: {titleCase(pr?.funding_pref || "no_preference")}</p></div>
        <div className="card"><h2>English</h2>
          {data.languageTests.length === 0 ? <p className="muted">No test recorded.</p> : data.languageTests.map((t) => <p key={t.id}>{String(t.type).toUpperCase()} {t.overall}</p>)}</div>
        <div className="card"><h2>Documents</h2>
          <div className="scroll"><table><tbody>{data.documents.map((d) => <tr key={d.type}><td>{titleCase(d.type)}</td><td>{titleCase(d.status)}</td></tr>)}</tbody></table></div>
          <p className="muted">Document upload isn't available yet; statuses update once file storage is connected.</p></div>
      </>)}
    </>
  );
}
