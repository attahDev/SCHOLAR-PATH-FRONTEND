import { useState } from "react";
import { Link } from "react-router-dom";
import { useGet, useReference } from "../hooks.js";
import { Loading, ErrorBox, VerifiedBadge, titleCase } from "../components/ui.jsx";

export default function Search() {
  const ref = useReference();
  const [f, setF] = useState({ q: "", country: "", type: "", level: "" });
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
  const { data, error, loading } = useGet(`/opportunities?${qs}`);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <>
      <h1>Programs & scholarships</h1>
      <div className="card grid2">
        <div><label>Search</label><input value={f.q} onChange={set("q")} placeholder="e.g. data science" /></div>
        <div><label>Country</label><select value={f.country} onChange={set("country")}><option value="">Any</option>{ref?.countries.filter((c) => c.launch_destination).map((c) => <option key={c.iso2} value={c.iso2}>{c.name}</option>)}</select></div>
        <div><label>Type</label><select value={f.type} onChange={set("type")}><option value="">Any</option><option value="program">Programs</option><option value="scholarship">Scholarships</option></select></div>
        <div><label>Level</label><select value={f.level} onChange={set("level")}><option value="">Any</option><option value="bachelor">Bachelor's</option><option value="master">Master's</option><option value="phd">PhD</option></select></div>
      </div>
      <ErrorBox error={error} />
      {loading && <Loading />}
      {data?.results.length === 0 && <p className="muted">Nothing matches those filters yet.</p>}
      {data?.results.map((o) => (
        <div className="card spread" key={o.id}>
          <div>
            <h3><Link to={`/opportunity/${o.id}`}>{o.title}</Link></h3>
            <span className="muted">{titleCase(o.type)} · {titleCase(o.degree_level)} · {o.country} · {o.field}</span>
            {o.sponsored && <> <span className="badge warn">Sponsored{o.sponsor_label ? `: ${o.sponsor_label}` : ""}</span></>}
          </div>
          <VerifiedBadge status={o.verification_status} />
        </div>
      ))}
    </>
  );
}
