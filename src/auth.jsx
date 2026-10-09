import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { get, post, getToken, setToken, setUnauthorizedHandler } from "./api.js";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(!getToken());

  const refresh = useCallback(async () => {
    try { setMe(await get("/me")); } catch { setMe(null); }
  }, []);

  const signOut = useCallback(async () => {
    try { await post("/auth/logout"); } catch { /* token may already be invalid */ }
    setToken(null); setMe(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => { setToken(null); setMe(null); });
    if (getToken()) refresh().finally(() => setReady(true));
  }, [refresh]);

  const signIn = async (email, password) => {
    const r = await post("/auth/login", { email, password });
    setToken(r.token); await refresh();
  };
  const signUp = async (email, password) => { await post("/auth/register", { email, password }); await signIn(email, password); };

  return <Ctx.Provider value={{ me, ready, refresh, signIn, signUp, signOut }}>{children}</Ctx.Provider>;
}
