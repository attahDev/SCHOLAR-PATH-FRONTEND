// Acceptance test: hand-labelled cases run against the prototype's actual engine.
// Usage: node engine-fixtures.test.js [path-to-prototype.html]
const fs = require("fs"), vm = require("vm");
const file = process.argv[2] || "/mnt/user-data/outputs/pathfinder-prototype-v2.html";
let js = fs.readFileSync(file, "utf8").split("<script>")[1].split("</script>")[0];
js = js.replace(/document\.addEventListener[\s\S]*$/, "") + ";globalThis.__x={ev,P,MY};";
const ctx = { document: { getElementById: () => ({ addEventListener() {} }) }, scrollTo() {}, console };
vm.createContext(ctx); vm.runInContext(js, ctx);
const { ev, P } = ctx.__x;
const BASE_P = JSON.parse(JSON.stringify(P));
const today = n => { const t = new Date(); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); };
// Student baseline: Nigeria, 3.23/5.0 (64.6%), covers calculus/linear_algebra/programming/databases/statistics, budget 10k, IELTS none, English-taught degree
const opp = (o) => ({ id: 0, name: "T", uni: "U", c: "Germany", f: "Data Science", tu: 2000, lv: 6000, fund: "none", amt: 0, min: 2.8, ms: 5, ielts: null, pre: [], dl: today(40), vs: { min: "v", fund: "v", dl: "v", ielts: "v", pre: "v", nat: "v" }, age: 3, host: "x", ...o });
const V = (o, vs) => ({ ...o, vs: { ...o.vs, ...vs } });
const cases = [
  ["F01 GPA met, verified", opp({}), {}, { el: "Eligible" }],
  ["F02 GPA below, verified", opp({ min: 3.5 }), {}, { el: "Not Eligible" }],
  ["F03 GPA below, unverified (must not reject)", V(opp({ min: 3.5 }), { min: "n" }), {}, { el: "Unknown" }],
  ["F04 within 5% on indicative conversion", opp({ min: 6.5, ms: 10 }), {}, { el: "Unknown" }],
  ["F05 conflicting GPA data", V(opp({}), { min: "c" }), {}, { el: "Unknown" }],
  ["F06 prerequisite missing, verified", opp({ pre: ["machine_learning"] }), {}, { el: "Not Eligible" }],
  ["F07 prerequisite covered", opp({ pre: ["calculus", "programming"] }), {}, { el: "Eligible" }],
  ["F08 nationality excluded, verified", opp({ nat: false }), {}, { el: "Not Eligible" }],
  ["F09 GPA met but unverified", V(opp({}), { min: "n" }), {}, { el: "Potentially Eligible" }],
  ["F10 no minimum published", opp({ min: null }), {}, { el: "Unknown" }],
  ["F11 IELTS is soft, must not block", opp({ ielts: 7 }), { ielts: "6.0" }, { el: "Eligible" }],
  ["F12 English-taught, no test: language Medium+ not Low", opp({ ielts: 6.5 }), { ielts: "", eng: true }, { fit: { Language: "High" } }],
  ["F13 full-only preference vs no funding", opp({ fund: "none" }), { fpref: "full-only" }, { fit: { Funding: "Low" } }],
  ["F14 country not preferred", opp({ c: "Hungary" }), { countries: ["Germany"] }, { fit: { Geographic: "Low" } }],
  ["F15 anywhere = no geographic penalty", opp({ c: "Hungary" }), { anywhere: true }, { fit: { Geographic: "High" } }],
  ["F16 unverified funding not deducted", V(opp({ fund: "full", amt: 8000, tu: 9000, lv: 9000 }), { fund: "n" }), {}, { net: 18000 }],
  ["F17 verified funding deducted", opp({ fund: "partial", amt: 6000, tu: 9000, lv: 9000 }), {}, { net: 12000 }],
  ["F18 over budget", opp({ tu: 14000, lv: 9000 }), {}, { fit: { Financial: "Low" } }],
  ["F19 unrelated field", opp({ f: "Agriculture" }), {}, { fit: { Academic: "Low" } }],
  ["F20 exact selected field", opp({ f: "Data Science" }), {}, { fit: { Academic: "High" } }],
  ["F21 tighter GPA headroom lowers academic fit (same field)", opp({ min: 3.2 }), {}, { fitLess: ["Academic", opp({ min: 2.0 })] }],
];
let fail = 0;
for (const [name, o, pOver, exp] of cases) {
  Object.keys(P).forEach(k => delete P[k]); Object.assign(P, JSON.parse(JSON.stringify(BASE_P)), pOver);
  const r = ev(o), errs = [];
  if (exp.el && r.el !== exp.el) errs.push(`eligibility: got "${r.el}", expected "${exp.el}"`);
  if (exp.fit) for (const [k, b] of Object.entries(exp.fit)) if (r.fit[k].b !== b) errs.push(`${k} band: got ${r.fit[k].b} (${r.fit[k].n}), expected ${b}`);
  if (exp.net != null && r.net !== exp.net) errs.push(`net cost: got ${r.net}, expected ${exp.net}`);
  if (exp.fitLess) { const other = ev(exp.fitLess[1]); if (!(r.fit[exp.fitLess[0]].n < other.fit[exp.fitLess[0]].n)) errs.push(`${exp.fitLess[0]} should be lower than for the easier requirement (${r.fit[exp.fitLess[0]].n} vs ${other.fit[exp.fitLess[0]].n})`); }
  console.log((errs.length ? "FAIL " : "pass ") + name + (errs.length ? "\n      " + errs.join("\n      ") : ""));
  fail += errs.length ? 1 : 0;
}
// Ranking invariant: Not Eligible must never outrank Eligible
Object.keys(P).forEach(k => delete P[k]); Object.assign(P, JSON.parse(JSON.stringify(BASE_P)));
const a = ev(opp({ min: 3.5, f: "Data Science", fund: "full", amt: 20000 })), b = ev(opp({ f: "Agriculture", c: "Hungary" }));
const rk = a.rank < b.rank; console.log((rk ? "pass" : "FAIL") + " R01 Not Eligible never outranks Eligible (" + a.el + " " + Math.round(a.rank) + " vs " + b.el + " " + Math.round(b.rank) + ")"); if (!rk) fail++;
console.log(`\n${cases.length + 1 - fail}/${cases.length + 1} passed`); process.exit(fail ? 1 : 0);
