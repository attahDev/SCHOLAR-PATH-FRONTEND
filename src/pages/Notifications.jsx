import { useGet } from "../hooks.js";
import { post, put } from "../api.js";
import { Loading, ErrorBox, titleCase } from "../components/ui.jsx";

const CHANNELS = ["email", "whatsapp", "in_app"], TYPES = ["new_match", "deadline", "digest", "readiness"];

export default function Notifications() {
  const list = useGet("/notifications"), prefs = useGet("/notification-prefs");
  const on = (c, t) => prefs.data?.prefs.find((p) => p.channel === c && p.type === t)?.enabled ?? false;
  const toggle = async (c, t) => { await put(`/notification-prefs/${c}/${t}`, { enabled: !on(c, t) }); prefs.reload(); };
  return (
    <>
      <h1>Alerts</h1>
      <div className="card">
        <h2>How we contact you</h2>
        <ErrorBox error={prefs.error} />
        {prefs.loading ? <Loading /> : (
          <div className="scroll"><table><thead><tr><th></th>{CHANNELS.map((c) => <th key={c}>{titleCase(c)}</th>)}</tr></thead><tbody>
            {TYPES.map((t) => <tr key={t}><th>{titleCase(t)}</th>{CHANNELS.map((c) => <td key={c}><input style={{ width: "auto" }} type="checkbox" checked={on(c, t)} onChange={() => toggle(c, t)} aria-label={`${t} via ${c}`} /></td>)}</tr>)}
          </tbody></table></div>
        )}
        <p className="muted">WhatsApp is off by default and isn't delivered yet. We cap alerts per channel each day.</p>
      </div>
      <ErrorBox error={list.error} />
      {list.loading && <Loading />}
      {list.data?.notifications.length === 0 && <p className="muted">No alerts yet.</p>}
      {list.data?.notifications.map((n) => (
        <div key={n.id} className="card spread" style={{ opacity: n.read_at ? 0.65 : 1 }}>
          <div><strong>{n.payload?.subject ?? titleCase(n.type)}</strong><div>{n.payload?.body}</div><span className="muted">{titleCase(n.type)} · {new Date(n.created_at).toLocaleString()}</span></div>
          {!n.read_at && <button onClick={async () => { await post(`/notifications/${n.id}/read`); list.reload(); }}>Mark read</button>}
        </div>
      ))}
    </>
  );
}
