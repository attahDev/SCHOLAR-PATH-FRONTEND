import { useState } from "react";
import { Link } from "react-router-dom";
import { useGet, getCompare, toggleCompare } from "../hooks.js";
import { del } from "../api.js";
import { Loading, ErrorBox, EligibilityBadge } from "../components/ui.jsx";

export default function Saved() {
  const { data, error, loading, reload } = useGet("/saved");
  const [cmp, setCmp] = useState(getCompare());
  return (
    <>
      <h1>Saved</h1>
      <ErrorBox error={error} />
      {loading && <Loading />}
      {data?.saved.length === 0 && <div className="card">Nothing saved yet. Save opportunities from <Link to="/">For you</Link> or <Link to="/search">search</Link>.</div>}
      {cmp.length >= 2 && <p><Link className="btn primary" to={`/compare?ids=${cmp.join(",")}`}>Compare {cmp.length} selected</Link></p>}
      {data?.saved.map((s) => {
        const id = s.id;
        return (
          <div className="card spread" key={id}>
            <div><h3><Link to={`/opportunity/${id}`}>{s.title}</Link></h3>{s.eligibility && <EligibilityBadge value={s.eligibility} />}</div>
            <div className="row">
              <label style={{ margin: 0, display: "flex", gap: 6, alignItems: "center", color: "var(--ink)" }}><input style={{ width: "auto" }} type="checkbox" checked={cmp.includes(id)} onChange={() => setCmp(toggleCompare(id))} /> Compare</label>
              <button onClick={async () => { await del(`/saved/${id}`); setCmp(getCompare().filter((x) => x !== id)); reload(); }}>Remove</button>
            </div>
          </div>
        );
      })}
    </>
  );
}
