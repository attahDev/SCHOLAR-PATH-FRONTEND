import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { ErrorBox } from "../components/ui.jsx";

export default function Auth({ mode }) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(null); const [busy, setBusy] = useState(false);
  const register = mode === "register";

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError(null);
    try { await (register ? signUp : signIn)(email, password); }
    catch (err) { setError(err); setBusy(false); }
  };

  return (
    <div className="authbox">
      <h1>ScholarPath</h1>
      <p className="muted">Don't just search for opportunities. Understand which ones actually make sense for you.</p>
      <form className="card" onSubmit={submit}>
        <h2>{register ? "Create your account" : "Sign in"}</h2>
        <ErrorBox error={error} />
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <label htmlFor="pw">Password</label>
        <input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={register ? "new-password" : "current-password"} />
        {register && <p className="muted">Use a long password; avoid common ones.</p>}
        <p><button className="primary" disabled={busy}>{busy ? "Please wait…" : register ? "Create account" : "Sign in"}</button></p>
        <p className="muted">{register ? <>Already have an account? <Link to="/login">Sign in</Link></> : <>New here? <Link to="/register">Create an account</Link></>}</p>
      </form>
    </div>
  );
}
