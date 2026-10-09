import { useCallback, useEffect, useState } from "react";
import { get } from "./api.js";

/** Loads a GET endpoint; `reload` refetches. Re-runs when `path` changes. */
export function useGet(path) {
  const [state, setState] = useState({ data: null, error: null, loading: !!path });
  const load = useCallback(async () => {
    if (!path) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try { setState({ data: await get(path), error: null, loading: false }); }
    catch (e) { setState({ data: null, error: e, loading: false }); }
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}

/** Reference lists (countries, fields, grading systems) are static; fetch once per session. */
let refCache = null;
export function useReference() {
  const [ref, setRef] = useState(refCache);
  useEffect(() => { if (!refCache) get("/reference").then((r) => { refCache = r; setRef(r); }).catch(() => {}); }, []);
  return ref;
}

// Compare list lives in localStorage so it survives navigation (max 3, per the backend).
const CK = "sp_compare";
export const getCompare = () => { try { return JSON.parse(localStorage.getItem(CK) || "[]"); } catch { return []; } };
export const toggleCompare = (id) => {
  const cur = getCompare();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-3);
  try { localStorage.setItem(CK, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
};
