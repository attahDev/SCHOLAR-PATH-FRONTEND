import { Link } from "react-router-dom";

export const Loading = () => <p className="muted">Loading…</p>;
export const ErrorBox = ({ error }) => error ? <div className="banner err">{error.message}</div> : null;

const ELIG = { Eligible: "ok", "Potentially Eligible": "warn", "Not Eligible": "no", Unknown: "neutral" };
export const EligibilityBadge = ({ value }) => <span className={`badge ${ELIG[value] ?? "neutral"}`}>{value}</span>;

const VERIF = { verified: "ok", needs_verification: "warn", expired: "no", conflicting: "no" };
export const VerifiedBadge = ({ status }) =>
  <span className={`badge ${VERIF[status] ?? "neutral"}`}>{status === "verified" ? "Verified" : status === "needs_verification" ? "Needs verification" : status === "expired" ? "Expired" : status === "conflicting" ? "Conflicting info" : "Not verified"}</span>;

/** Fit dimensions are shown separately and never summed into a single score or described as admission odds. */
export function FitBars({ fit }) {
  if (!fit) return null;
  return (
    <div>
      {Object.entries(fit).map(([k, v]) => {
        const na = !v || v.band === "NA" || v.score == null;
        return (
          <div className="fit" key={k}>
            <span>{k}</span>
            <div className="track">{!na && <div className="fill" style={{ width: `${Math.max(0, Math.min(100, Math.round(v.score)))}%` }} />}</div>
            <span className="muted">{na ? "Not enough data" : `${v.band}${v.confidence === "low" ? " (low confidence)" : ""}`}</span>
          </div>
        );
      })}
      <p className="muted" style={{ margin: "6px 0 0" }}>Fit shows how well an opportunity suits your profile. It is not an admission probability.</p>
    </div>
  );
}

export function Evidence({ items, polarity }) {
  const list = (items || []).filter((e) => polarity.includes(e.polarity));
  if (!list.length) return <p className="muted">Nothing to show here.</p>;
  return (
    <ul className="ev">
      {list.map((e, i) => (
        <li key={i} className={e.polarity}>
          {e.text}
          {e.userValue && e.reqValue && <span className="muted"> — required: {e.reqValue}; your record: {e.userValue}</span>}
          {e.unconfirmed && <span className="muted"> (requirement not yet verified)</span>}
        </li>
      ))}
    </ul>
  );
}

export const UpgradeNote = ({ children }) => (
  <div className="banner warn">🔒 {children} <Link to="/billing">See Premium</Link></div>
);

export const eur = (n) => (n == null ? "Not provided" : `€${Number(n).toLocaleString()}`);
export const titleCase = (s) => String(s ?? "").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
