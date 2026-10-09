import { Link, useSearchParams } from "react-router-dom";
import { useGet } from "../hooks.js";
import { Loading, ErrorBox } from "../components/ui.jsx";

export default function Compare() {
  const [sp] = useSearchParams();
  const ids = sp.get("ids") || "";
  const { data, error, loading } = useGet(ids.split(",").filter(Boolean).length >= 2 ? `/compare?ids=${ids}` : null);
  return (
    <>
      <h1>Compare</h1>
      {!ids && <div className="card">Pick 2–3 opportunities to compare from <Link to="/saved">Saved</Link> or an opportunity page.</div>}
      <ErrorBox error={error} />
      {loading && <Loading />}
      {data && (
        <div className="card scroll"><table>
          <thead><tr><th></th>{data.opportunities.map((o) => <th key={o.id}><Link to={`/opportunity/${o.id}`}>{o.title}</Link></th>)}</tr></thead>
          <tbody>{data.rows.map((r) => <tr key={r.label}><th>{r.label}</th>{r.values.map((v, i) => <td key={i}>{v}</td>)}</tr>)}</tbody>
        </table>
        <p className="muted">We don't rank these for you. "Not provided" means the information isn't published or verified — not that the answer is no.</p></div>
      )}
    </>
  );
}
