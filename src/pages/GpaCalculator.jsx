import { useState } from "react";
import { useGet, useReference } from "../hooks.js";
import { post } from "../api.js";
import { ErrorBox } from "../components/ui.jsx";

const blank = () => ({ name: "", credits: "", grade: "", gradePoint: "", semester: "" });

/** Same credit-weighted formula as the backend, so the number never changes after saving. */
export function calc(rows) {
  const valid = rows.filter((r) => Number(r.credits) > 0 && r.gradePoint !== "" && !Number.isNaN(Number(r.gradePoint)));
  const credits = valid.reduce((s, r) => s + Number(r.credits), 0);
  if (!credits) return null;
  const gpa = valid.reduce((s, r) => s + Number(r.credits) * Number(r.gradePoint), 0) / credits;
  const bySem = {};
  valid.forEach((r) => { const k = r.semester || "—"; (bySem[k] ||= []).push(r); });
  const semesters = Object.entries(bySem).map(([k, rs]) => {
    const c = rs.reduce((s, r) => s + Number(r.credits), 0);
    return { semester: k, credits: c, gpa: rs.reduce((s, r) => s + Number(r.credits) * Number(r.gradePoint), 0) / c };
  });
  return { gpa: Math.round(gpa * 1000) / 1000, credits, semesters };
}

export default function GpaCalculator() {
  const ref = useReference();
  const edu = useGet("/profile/education");
  const [rows, setRows] = useState([blank(), blank(), blank()]);
  const [scale, setScale] = useState("5");
  const [eduId, setEduId] = useState("");
  const [saved, setSaved] = useState(null);
  const [target, setTarget] = useState("");
  const [conv, setConv] = useState(null);
  const [error, setError] = useState(null);
  const res = calc(rows);
  const setRow = (i, k, v) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  const save = async () => {
    setError(null);
    try {
      const body = { courses: rows.filter((r) => r.name && Number(r.credits) > 0 && r.gradePoint !== "").map((r) => ({ name: r.name, credits: Number(r.credits), grade: r.grade || String(r.gradePoint), gradePoint: Number(r.gradePoint), semester: r.semester || undefined })) };
      const out = await post(`/profile/education/${eduId}/courses`, body);
      setSaved(out);
    } catch (e) { setError(e); }
  };
  const convert = async () => {
    setError(null);
    try { setConv(await post(`/gpa/${saved.gpaRecordId}/convert`, { targetSystemId: Number(target) })); } catch (e) { setError(e); }
  };

  return (
    <>
      <h1>GPA / CGPA calculator</h1>
      <p className="muted">Enter your courses with credit units and the grade points your school assigned. Your original record is never overwritten.</p>
      <div className="card scroll">
        <table><thead><tr><th>Course</th><th>Credits</th><th>Grade</th><th>Grade points</th><th>Semester</th></tr></thead><tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td><input value={r.name} onChange={(e) => setRow(i, "name", e.target.value)} /></td>
              <td><input type="number" min="0" step="0.5" value={r.credits} onChange={(e) => setRow(i, "credits", e.target.value)} /></td>
              <td><input value={r.grade} onChange={(e) => setRow(i, "grade", e.target.value)} placeholder="A" /></td>
              <td><input type="number" step="0.01" value={r.gradePoint} onChange={(e) => setRow(i, "gradePoint", e.target.value)} /></td>
              <td><input value={r.semester} onChange={(e) => setRow(i, "semester", e.target.value)} placeholder="Year 1 S1" /></td>
            </tr>
          ))}
        </tbody></table>
        <p><button onClick={() => setRows([...rows, blank()])}>Add course</button></p>
      </div>

      <div className="card">
        {res ? (
          <>
            <h2>Cumulative GPA: {res.gpa.toFixed(2)} <span className="muted">on a scale of</span> <select style={{ width: "auto", display: "inline-block" }} value={scale} onChange={(e) => setScale(e.target.value)}>{["4", "5", "10", "20", "100"].map((s) => <option key={s}>{s}</option>)}</select></h2>
            <p className="muted">{res.credits} total credits</p>
            {res.semesters.length > 1 && <div className="scroll"><table><thead><tr><th>Semester</th><th>Credits</th><th>GPA</th></tr></thead><tbody>{res.semesters.map((s) => <tr key={s.semester}><td>{s.semester}</td><td>{s.credits}</td><td>{s.gpa.toFixed(2)}</td></tr>)}</tbody></table></div>}
          </>
        ) : <p className="muted">Add at least one course with credits and grade points.</p>}
      </div>

      {res && (
        <div className="card">
          <h3>Save to your profile</h3>
          <ErrorBox error={error || edu.error} />
          <label>Which degree is this for?</label>
          <select value={eduId} onChange={(e) => setEduId(e.target.value)}><option value="">Choose…</option>{edu.data?.education.map((e) => <option key={e.id} value={e.id}>{e.institution_name} — {e.degree_title || e.degree_level}</option>)}</select>
          {edu.data?.education.length === 0 && <p className="muted">Add an education record in your profile first.</p>}
          <p><button className="primary" disabled={!eduId} onClick={save}>Save courses & GPA</button> {saved && <span className="muted">Saved. GPA recorded: {Number(saved.gpa).toFixed(2)}</span>}</p>
          {saved && (
            <>
              <h3>Convert (indicative)</h3>
              <div className="row"><select style={{ width: "auto" }} value={target} onChange={(e) => setTarget(e.target.value)}><option value="">Target grading system…</option>{ref?.gradingSystems.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select><button disabled={!target} onClick={convert}>Convert</button></div>
              {conv && <p><strong>{Number(conv.value).toFixed(2)}</strong> <span className="badge neutral">{conv.method}</span> {conv.label && <span className="muted">{conv.label}</span>}</p>}
              <p className="muted">Conversions marked "indicative" are a mathematical estimate, NOT an official academic equivalency. If a university publishes its own method, that takes precedence. Never treat a conversion as a guarantee of eligibility.</p>
            </>
          )}
        </div>
      )}
    </>
  );
}
