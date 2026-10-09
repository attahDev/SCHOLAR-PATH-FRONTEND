import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReference, useGet } from "../hooks.js";
import { get, post, put } from "../api.js";
import { useAuth } from "../auth.jsx";
import { ErrorBox, titleCase } from "../components/ui.jsx";

const STEPS = ["About you", "Education", "Goals", "Budget & funding", "English"];
const STATUSES = ["high_school", "undergraduate", "final_year_undergraduate", "recent_graduate", "graduate", "masters_student", "phd_student", "working_professional", "researcher", "other"];
const FUNDING = [["full_only", "Fully funded only"], ["full_pref", "Prefer fully funded"], ["partial_ok", "Partial funding is fine"], ["waiver_ok", "Tuition waiver is fine"], ["self", "Self-funded is fine"], ["no_preference", "No preference"]];
const num = (v) => (v === "" || v == null ? undefined : Number(v));

export default function Onboarding() {
  const ref = useReference();
  const { refresh } = useAuth();
  const nav = useNavigate();
  const profile = useGet("/profile");
  const [step, setStep] = useState(0);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    fullName: "", citizenshipCountryId: "", residenceCountryId: "", city: "", whatsappNumber: "", status: "",
    institutionName: "", institutionCountryIso2: "NG", degreeLevel: "bachelor", degreeTitle: "", fieldSlug: "", endYear: "", gpa: "", scale: "5",
    targetDegreeLevel: "master", fields: [], countries: [], anywhere: false,
    maxAnnualTotalEur: "", maxTuitionEur: "", availableFundsEur: "", fundingPref: "no_preference",
    testType: "ielts", overall: "", englishMedium: false,
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const toggle = (k, v) => setF({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] });

  // Prefill from anything already saved so returning users don't retype.
  useEffect(() => {
    const p = profile.data?.profile; if (!p) return;
    setF((cur) => ({ ...cur, fullName: cur.fullName || p.full_name || "", citizenshipCountryId: cur.citizenshipCountryId || p.citizenship_country_id || "",
      residenceCountryId: cur.residenceCountryId || p.residence_country_id || "", city: cur.city || p.city || "", whatsappNumber: cur.whatsappNumber || p.whatsapp_number || "", status: cur.status || p.academic_status || "" }));
  }, [profile.data]);

  const run = async (fn, next) => {
    setBusy(true); setError(null);
    try { await fn(); if (next === "done") { await put("/profile/step", { step: 10 }); await refresh(); nav("/"); } else setStep(next); }
    catch (e) { setError(e); } finally { setBusy(false); }
  };

  const steps = [
    () => run(async () => {
      await put("/profile/personal", { fullName: f.fullName || undefined, citizenshipCountryId: num(f.citizenshipCountryId), residenceCountryId: num(f.residenceCountryId), city: f.city || undefined, whatsappNumber: f.whatsappNumber || undefined });
      if (f.status) await put("/profile/status", { status: f.status });
      await put("/profile/step", { step: 2 });
    }, 1),
    () => run(async () => {
      if (f.institutionName) {
        const { educationId } = await post("/profile/education", { institutionName: f.institutionName, institutionCountryIso2: f.institutionCountryIso2 || undefined, degreeLevel: f.degreeLevel, degreeTitle: f.degreeTitle || undefined, fieldSlug: f.fieldSlug || undefined, endYear: num(f.endYear) });
        if (f.gpa) await post(`/profile/education/${educationId}/gpa`, { value: Number(f.gpa), scale: Number(f.scale), source: "entered" });
      }
      await put("/profile/step", { step: 4 });
    }, 2),
    () => run(async () => {
      await put("/profile/preferences", { targetDegreeLevel: f.targetDegreeLevel, anywhere: f.anywhere });
      if (f.fields.length) await put("/profile/fields", { slugs: f.fields, role: "primary" });
      if (f.countries.length) await put("/profile/locations", { countries: f.countries, role: "preferred" });
      await put("/profile/step", { step: 7 });
    }, 3),
    () => run(async () => {
      await put("/profile/preferences", { maxAnnualTotalEur: num(f.maxAnnualTotalEur), maxTuitionEur: num(f.maxTuitionEur), availableFundsEur: num(f.availableFundsEur), fundingPref: f.fundingPref });
      await put("/profile/step", { step: 9 });
    }, 4),
    () => run(async () => {
      if (f.overall) await post("/profile/language", { type: f.testType, overall: Number(f.overall) });
      if (f.englishMedium) {
        const edu = (await get("/profile/education")).education;
        if (edu[0]) await put(`/profile/education/${edu[0].id}/english-medium`, { claimed: true });
      }
    }, "done"),
  ];

  const fieldsTop = ref?.fields.filter((x) => x.level === 1) ?? [];
  const fieldsSub = ref?.fields.filter((x) => x.level > 1) ?? [];
  const dest = ref?.countries.filter((c) => c.launch_destination) ?? [];

  return (
    <>
      <h1>Set up your profile</h1>
      <p className="muted">Enter it once; everything on the platform uses it. You can change any of this later.</p>
      <div className="steps">{STEPS.map((s, i) => <span key={s} className={i === step ? "on" : i < step ? "done" : ""}>{i + 1}. {s}</span>)}</div>
      <div className="card">
        <ErrorBox error={error} />
        {step === 0 && (<>
          <label>Full name</label><input value={f.fullName} onChange={set("fullName")} />
          <div className="grid2">
            <div><label>Citizenship</label><select value={f.citizenshipCountryId} onChange={set("citizenshipCountryId")}><option value="">Choose…</option>{ref?.countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label>Country you live in</label><select value={f.residenceCountryId} onChange={set("residenceCountryId")}><option value="">Choose…</option>{ref?.countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </div>
          <div className="grid2"><div><label>City</label><input value={f.city} onChange={set("city")} /></div><div><label>WhatsApp number (optional)</label><input value={f.whatsappNumber} onChange={set("whatsappNumber")} /></div></div>
          <label>Where are you in your studies?</label>
          <select value={f.status} onChange={set("status")}><option value="">Choose…</option>{STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</select>
        </>)}
        {step === 1 && (<>
          <p className="muted">Add your most recent degree. You can add more in your profile. Skip if you don't have one yet.</p>
          <div className="grid2">
            <div><label>Institution</label><input value={f.institutionName} onChange={set("institutionName")} /></div>
            <div><label>Institution country</label><select value={f.institutionCountryIso2} onChange={set("institutionCountryIso2")}><option value="">Choose…</option>{ref?.countries.map((c) => <option key={c.iso2} value={c.iso2}>{c.name}</option>)}</select></div>
            <div><label>Degree level</label><select value={f.degreeLevel} onChange={set("degreeLevel")}>{["secondary", "bachelor", "master", "phd", "other"].map((l) => <option key={l} value={l}>{titleCase(l)}</option>)}</select></div>
            <div><label>Degree title (e.g. B.Eng.)</label><input value={f.degreeTitle} onChange={set("degreeTitle")} /></div>
            <div><label>Field of study</label><select value={f.fieldSlug} onChange={set("fieldSlug")}><option value="">Choose…</option>{[...fieldsTop, ...fieldsSub].map((x) => <option key={x.slug} value={x.slug}>{x.name}</option>)}</select></div>
            <div><label>Graduation year</label><input type="number" value={f.endYear} onChange={set("endYear")} /></div>
            <div><label>CGPA / GPA</label><input type="number" step="0.01" value={f.gpa} onChange={set("gpa")} /></div>
            <div><label>Out of</label><select value={f.scale} onChange={set("scale")}>{["4", "5", "10", "20", "100"].map((s) => <option key={s}>{s}</option>)}</select></div>
          </div>
          <p className="muted">We store your original grade exactly as you enter it. Use the GPA calculator later if you only have course grades.</p>
        </>)}
        {step === 2 && (<>
          <label>Degree you want</label>
          <select value={f.targetDegreeLevel} onChange={set("targetDegreeLevel")}><option value="bachelor">Bachelor's</option><option value="master">Master's</option><option value="phd">PhD</option></select>
          <label>Fields you're interested in</label>
          <div className="checks">{[...fieldsTop, ...fieldsSub].map((x) => <label key={x.slug}><input type="checkbox" checked={f.fields.includes(x.slug)} onChange={() => toggle("fields", x.slug)} />{x.name}</label>)}</div>
          <label>Where would you study?</label>
          <div className="checks">{dest.map((c) => <label key={c.iso2}><input type="checkbox" checked={f.countries.includes(c.iso2)} onChange={() => toggle("countries", c.iso2)} />{c.name}</label>)}</div>
          <label style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--ink)" }}><input style={{ width: "auto" }} type="checkbox" checked={f.anywhere} onChange={set("anywhere")} /> I'm open to anywhere</label>
        </>)}
        {step === 3 && (<>
          <p className="muted">Amounts are in euros. Leave blank if unsure — we'll say so rather than guess.</p>
          <div className="grid2">
            <div><label>Max total per year (tuition + living)</label><input type="number" value={f.maxAnnualTotalEur} onChange={set("maxAnnualTotalEur")} /></div>
            <div><label>Max tuition per year</label><input type="number" value={f.maxTuitionEur} onChange={set("maxTuitionEur")} /></div>
            <div><label>Funds you have available</label><input type="number" value={f.availableFundsEur} onChange={set("availableFundsEur")} /></div>
          </div>
          <label>Funding preference</label>
          <select value={f.fundingPref} onChange={set("fundingPref")}>{FUNDING.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </>)}
        {step === 4 && (<>
          <p className="muted">Skip anything you don't have.</p>
          <div className="grid2">
            <div><label>English test</label><select value={f.testType} onChange={set("testType")}>{["ielts", "toefl", "pte", "cambridge", "duolingo", "other"].map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}</select></div>
            <div><label>Overall score</label><input type="number" step="0.5" value={f.overall} onChange={set("overall")} /></div>
          </div>
          <label style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--ink)" }}><input style={{ width: "auto" }} type="checkbox" checked={f.englishMedium} onChange={set("englishMedium")} /> My degree was taught in English</label>
        </>)}
        <p className="row" style={{ marginTop: 16 }}>
          {step > 0 && <button onClick={() => setStep(step - 1)} disabled={busy}>Back</button>}
          <button className="primary" disabled={busy} onClick={steps[step]}>{step === STEPS.length - 1 ? "Finish" : "Save & continue"}</button>
        </p>
      </div>
    </>
  );
}
