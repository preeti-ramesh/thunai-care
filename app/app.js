// Browser UI for Thunai Care. All analysis happens in src/core (shared with
// the CLI and tests). Data stays in this browser only.

import { analyze } from "../src/core/analyze.js";
import { classify, lookupAll } from "../src/core/normalize.js";
import { DRUG_CLASSES } from "../src/core/drugs.js";
import { parsePrescriptionText } from "../src/core/parse.js";
import { anonymize, weekLabel } from "../src/core/anonymize.js";
import { readPhoto } from "./ocr.js";
import { renderCharts, attachChartHover } from "./chart.js";

const STORE_KEY = "thunaicare:v4";
const WELCOME_KEY = "thunaicare:welcomed";
const $ = (sel) => document.querySelector(sel);

// Gentler names for the three levels (research: avoid alarming language).
export const LEVEL_LABEL = { review: "Worth a second look", ask: "Ask at next visit", info: "Note" };

// Five simple choices instead of a 1–10 number box. Stored on the 1–10 scale.
const FEELINGS = [
  { v: 2, label: "Very low" },
  { v: 4, label: "Low" },
  { v: 6, label: "Okay" },
  { v: 8, label: "Good" },
  { v: 10, label: "Very good" },
];

let state = load() || blank();
let view = "patient"; // "patient" | "doctor"
let doctorAnonymous = true;

// ---------- state helpers ----------

function blank() {
  return { patientLabel: "", visits: [newVisit()], familyObservations: [] };
}
function newVisit() {
  return { date: "", doctor: "", diagnosis: "", cost: "", wellbeing: "", sideEffects: "", notes: "", medications: [newMed()] };
}
function newMed() {
  return { name: "", dose: "", classKey: "" };
}
function store(key, value) {
  try { localStorage.setItem(key, value); } catch (_) { /* storage unavailable */ }
}
function read(key) {
  try { return localStorage.getItem(key); } catch (_) { return null; }
}
function save() {
  store(STORE_KEY, JSON.stringify(state));
}
function load() {
  try {
    const raw = read(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function dateLabel(d, shifted) {
  if (shifted) return weekLabel(d);
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit", timeZone: "UTC" });
}
function download(name, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- input rendering ----------

function classOptions(selected) {
  const opts = [`<option value="">Auto-detect class</option>`];
  for (const [k, c] of Object.entries(DRUG_CLASSES)) {
    opts.push(`<option value="${k}"${k === selected ? " selected" : ""}>${esc(c.label)}</option>`);
  }
  return opts.join("");
}

function autoHint(m) {
  if (!m.name) return "";
  if (m.checkDose) return "⚠ Read from photo — please check the name and dose against your bill";
  if (m.classKey) return "";
  const hits = lookupAll(m.name);
  if (hits.length > 1) return `✓ Combination: ${hits.map((h) => h.generic).join(" + ")}`;
  if (hits.length === 1) {
    const h = hits[0];
    return `✓ ${DRUG_CLASSES[h.classKey].label}${h.brand ? ` · ${h.generic}` : ""}`;
  }
  return "Not recognized — pick a class";
}

function hasDetails(v) {
  return Boolean(v.doctor || v.diagnosis || v.cost || v.notes);
}

function feelingButtons(v, vi) {
  const cur = Number(v.wellbeing);
  const nearest = Number.isFinite(cur) && v.wellbeing !== ""
    ? FEELINGS.reduce((a, b) => (Math.abs(b.v - cur) < Math.abs(a.v - cur) ? b : a)).v
    : null;
  return `<div class="feel" role="radiogroup" aria-label="How were they feeling at this visit?">
    ${FEELINGS.map(
      (f) => `<button type="button" role="radio" aria-checked="${f.v === nearest}" data-act="feel" data-v="${vi}" data-val="${f.v}">${f.label}</button>`
    ).join("")}
  </div>`;
}

function renderInputs() {
  $("#patient-label").value = state.patientLabel || "";
  $("#welcome").hidden = Boolean(read(WELCOME_KEY));

  $("#visits").innerHTML = state.visits
    .map((v, vi) => {
      const empty = !v.medications.some((m) => m.name.trim());
      const canCopy = vi > 0 && state.visits[vi - 1].medications.some((m) => m.name.trim());
      return `
    <div class="visit" data-v="${vi}">
      <div class="visit-head">
        <strong>Visit ${vi + 1}</strong>
        <button type="button" class="icon-btn danger" data-act="del-visit" data-v="${vi}" aria-label="Remove visit ${vi + 1}">Remove</button>
      </div>
      <label class="field"><span>Date of visit</span><input type="date" data-v="${vi}" data-k="date" value="${esc(v.date)}" /></label>
      <div class="field"><span>How were they feeling around this visit?</span>${feelingButtons(v, vi)}</div>

      <div class="meds-label">Medicines — choose the easiest way</div>
      <div class="entry-ways">
        <label class="way">📷 Photo of bill<input type="file" accept="image/*" capture="environment" data-photo="${vi}" hidden /></label>
        <button type="button" class="way" data-act="show-paste" data-v="${vi}">📋 Paste text</button>
        ${canCopy ? `<button type="button" class="way" data-act="copy-prev" data-v="${vi}">↺ Same as last visit</button>` : ""}
      </div>
      <div class="paste" data-paste-box="${vi}" hidden>
        <p class="hint">Paste text from a digital prescription or pharmacy bill. Only medicine lines are kept — names, phone numbers, addresses and hospital details are ignored.</p>
        <textarea rows="4" data-paste="${vi}" placeholder="e.g.&#10;Tab Escitalopram 10mg  1-0-0&#10;Tab Clonazepam 0.25mg  0-0-1"></textarea>
        <button type="button" class="primary" data-act="extract" data-v="${vi}">Find medicines</button>
      </div>
      <div class="paste-msg" data-paste-msg="${vi}" role="status" aria-live="polite"></div>
      ${empty && vi > 0 ? `<p class="hint">Or type them below.</p>` : ""}
      ${v.medications
        .map(
          (m, mi) => `
        <div class="med${m.checkDose ? " check" : ""}">
          <div>
            <input type="text" data-v="${vi}" data-m="${mi}" data-k="name" value="${esc(m.name)}" placeholder="Medicine name" aria-label="Medicine name" />
            <div class="auto" data-hint="${vi}-${mi}">${esc(autoHint(m))}</div>
          </div>
          <input type="text" data-v="${vi}" data-m="${mi}" data-k="dose" value="${esc(m.dose)}" placeholder="Dose" aria-label="Dose" />
          <select data-v="${vi}" data-m="${mi}" data-k="classKey" aria-label="Medicine class">${classOptions(m.classKey)}</select>
          <button type="button" class="icon-btn" data-act="del-med" data-v="${vi}" data-m="${mi}" aria-label="Remove medicine">✕</button>
        </div>`
        )
        .join("")}
      <button type="button" class="ghost" data-act="add-med" data-v="${vi}">+ Type a medicine</button>

      <label class="field" style="margin-top:10px"><span>Side effects noticed <span class="opt">optional</span></span><textarea data-v="${vi}" data-k="sideEffects" rows="1">${esc(v.sideEffects)}</textarea></label>

      <details class="more"${hasDetails(v) ? " open" : ""}>
        <summary>More details <span class="opt">optional</span></summary>
        <div class="grid2">
          <label class="field"><span>Doctor label — no names needed</span><input type="text" data-v="${vi}" data-k="doctor" value="${esc(v.doctor)}" placeholder="A, B, C…" /></label>
          <label class="field"><span>Cost (₹)</span><input type="number" min="0" data-v="${vi}" data-k="cost" value="${esc(v.cost)}" placeholder="Visit + medicines" /></label>
        </div>
        <label class="field"><span>Diagnosis given</span><input type="text" data-v="${vi}" data-k="diagnosis" value="${esc(v.diagnosis)}" placeholder="As written on prescription" /></label>
        <label class="field"><span>Private notes (never shared in anonymous mode)</span><textarea data-v="${vi}" data-k="notes" rows="1">${esc(v.notes)}</textarea></label>
      </details>
    </div>`;
    })
    .join("");

  $("#observations").innerHTML = state.familyObservations
    .map(
      (o, oi) => `
    <div class="obs">
      <input type="text" data-o="${oi}" data-k="by" value="${esc(o.by)}" placeholder="Who (e.g. sister)" aria-label="Who observed" />
      <input type="date" data-o="${oi}" data-k="date" value="${esc(o.date)}" aria-label="Date" />
      <textarea data-o="${oi}" data-k="text" rows="1" placeholder="What did you notice?" aria-label="Observation">${esc(o.text)}</textarea>
      <button type="button" class="icon-btn" data-act="del-obs" data-o="${oi}" aria-label="Remove observation">✕</button>
    </div>`
    )
    .join("");
}

// ---------- shared report pieces ----------

function timelineTable(r, compact) {
  const shifted = r.datesShifted;
  const head = r.visits.map((v) => `<th scope="col">${esc(dateLabel(v.date, shifted))}</th>`).join("");
  const rows = r.timeline.rows
    .map((row) => {
      const cells = row.doses
        .map((d, i) => {
          if (d === null) return `<td class="off">·</td>`;
          const prev = i > 0 ? row.doses[i - 1] : undefined;
          let mark = "";
          if (i > 0 && prev === null) mark = `<span class="chg" title="Added">new</span>`;
          else if (i > 0 && String(prev).replace(/\s/g, "") !== String(d).replace(/\s/g, "")) mark = `<span class="chg" title="Dose changed">↕</span>`;
          return `<td class="on">${esc(d)}${mark}</td>`;
        })
        .join("");
      const cls = compact ? "" : `<span class="cls">${esc(DRUG_CLASSES[row.classKey].label)}</span>`;
      return `<tr><th scope="row"><span class="dot" style="background:var(--g-${row.group})"></span>${esc(row.displayName)}${cls}</th>${cells}</tr>`;
    })
    .join("");
  const doctors = r.visits.some((v) => v.doctor)
    ? `<tr class="meta"><th scope="row">Doctor</th>${r.visits.map((v) => `<td>${esc(v.doctor || "–")}</td>`).join("")}</tr>`
    : "";
  const countRow = `<tr class="meta"><th scope="row">Number of medicines</th>${r.timeline.counts.map((c) => `<td>${c.total}</td>`).join("")}</tr>`;
  const wellRow = `<tr class="meta"><th scope="row">Feeling (1–10)</th>${r.visits.map((v) => `<td>${v.wellbeing ?? "–"}</td>`).join("")}</tr>`;
  const gapRow = `<tr class="meta"><th scope="row">Days since last visit</th><td>–</td>${r.timeline.changes.map((c) => `<td>${c.days}</td>`).join("")}</tr>`;
  return `<div class="tl-scroll"><table class="tl${compact ? " compact" : ""}"><thead><tr><th scope="col">Medicine</th>${head}</tr></thead>
    <tbody>${rows}${countRow}${wellRow}${gapRow}${doctors}</tbody></table></div>
    <div class="legend"><span><b>new</b> = added at this visit</span><span><b>↕</b> = dose changed</span><span>· = not prescribed</span></div>`;
}

function observationsList(r) {
  if (!r.familyObservations.length) return "";
  return `<div class="section-title">What family and friends noticed</div><ul class="obs-list">${r.familyObservations
    .map((o) => `<li>${o.date ? `<b>${esc(dateLabel(o.date, r.datesShifted))}</b> ` : ""}${o.by ? `(${esc(o.by)}) ` : ""}${esc(o.text)}</li>`)
    .join("")}</ul>`;
}

const lvl = (level) => `<span class="lvl ${level}">${LEVEL_LABEL[level]}</span>`;

// ---------- patient view ----------

function renderPatient(r) {
  const summaryCls = r.counts.review ? "review" : r.counts.ask ? "ask" : "ok";
  const flags = r.flags
    .map((f) => {
      const heur = f.sources.some((s) => s.id === "heuristic");
      const src = f.sources
        .map((s) => (s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>` : `<span class="heur">${esc(s.title)}</span>`))
        .join("<br/>");
      return `<article class="flag ${f.level}">
        <h4>${lvl(f.level)}<span>${esc(f.title)}</span></h4>
        <p>${esc(f.explanation)}</p>
        <p class="why">${esc(f.whyItMatters)}</p>
        ${src ? `<details><summary>Why this check exists${heur ? " (awaiting clinical review)" : ""}</summary>${src}</details>` : ""}
      </article>`;
    })
    .join("");
  const questions = r.questions.length
    ? `<ol class="questions">${r.questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ol>`
    : `<p class="hint">No specific questions yet.</p>`;

  return `
    <div class="summary ${summaryCls}">${esc(r.summary)}</div>
    <div class="stats">
      <div class="stat"><b>${r.counts.visits}</b><span>visits</span></div>
      <div class="stat"><b>${r.counts.review}</b><span>${LEVEL_LABEL.review.toLowerCase()}</span></div>
      <div class="stat"><b>${r.counts.ask}</b><span>${LEVEL_LABEL.ask.toLowerCase()}</span></div>
    </div>
    ${r.visits.length >= 2 ? `<div class="section-title">How things changed</div>${renderCharts(r, dateLabel)}` : ""}
    <div class="section-title">Medicine timeline</div>
    ${timelineTable(r, false)}
    <div class="section-title">Patterns worth a closer look</div>
    ${flags || `<p class="hint">Nothing flagged.</p>`}
    <div class="section-title">Questions to take to the doctor</div>
    ${questions}
    ${observationsList(r)}
    <div class="safety">${esc(r.safetyNote)}</div>`;
}

// ---------- doctor summary ----------

function renderDoctor(r) {
  const v = r.visits;
  const first = v[0];
  const last = v[v.length - 1];
  const weeks = Math.round((Date.parse(last.date) - Date.parse(first.date)) / 604800000);
  const c0 = r.timeline.counts[0].total;
  const c1 = r.timeline.counts[r.timeline.counts.length - 1].total;
  const scores = v.filter((x) => x.wellbeing != null);
  const feel = scores.length >= 2 ? `${scores[0].wellbeing} → ${scores[scores.length - 1].wellbeing} /10` : "not recorded";
  const doctors = new Set(v.map((x) => x.doctor).filter(Boolean)).size;
  const dx = [...new Set(v.map((x) => x.diagnosis).filter(Boolean))];

  const key = r.flags.filter((f) => f.level !== "info");
  const flagList = key.length
    ? `<ul class="dflags">${key.map((f) => `<li>${lvl(f.level)} <b>${esc(f.title)}.</b> ${esc(f.explanation)}</li>`).join("")}</ul>`
    : `<p class="hint">No patterns flagged.</p>`;

  const qs = r.questions.slice(0, 5);
  const sideFx = v.filter((x) => x.sideEffects).map((x) => `${dateLabel(x.date, r.datesShifted)}: ${x.sideEffects}`);

  return `
    <div class="doc-sheet">
      <div class="doc-head">
        <div>
          <div class="doc-title">Medication history summary</div>
          <div class="doc-sub">${esc(r.patientLabel)}${r.datesShifted ? " · dates shown as weeks from first visit" : ""}</div>
        </div>
        <div class="doc-brand">Thunai Care v${esc(r.version)}</div>
      </div>
      <div class="doc-facts">
        <div><span>Period</span><b>${v.length} visits · ${weeks} weeks</b></div>
        <div><span>Medicines</span><b>${c0} → ${c1}</b></div>
        <div><span>Patient-rated feeling</span><b>${esc(feel)}</b></div>
        ${doctors ? `<div><span>Prescribers</span><b>${doctors}</b></div>` : ""}
      </div>
      ${dx.length ? `<p class="doc-line"><span>Diagnoses recorded:</span> ${esc(dx.join("; "))}</p>` : ""}

      <div class="section-title">Timeline</div>
      ${timelineTable(r, true)}

      <div class="section-title">Patterns flagged (${key.length})</div>
      ${flagList}

      ${sideFx.length ? `<div class="section-title">Reported side effects</div><p class="doc-line">${esc(sideFx.join(" · "))}</p>` : ""}

      ${qs.length ? `<div class="section-title">Patient's questions</div><ol class="questions">${qs.map((q) => `<li>${esc(q)}</li>`).join("")}</ol>` : ""}

      ${observationsList(r)}

      <p class="doc-foot">Prepared by the patient or family using Thunai Care. Data is patient-entered and not verified. Flags are prompts for discussion based on published prescribing guidance and simple pattern checks — not clinical conclusions.</p>
    </div>`;
}

// ---------- report ----------

function renderReport() {
  const el = $("#report");
  const anon = view === "doctor" && doctorAnonymous;
  const r = analyze(anon ? anonymize(state) : state);

  $("#anon-wrap").hidden = view !== "doctor";
  document.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));

  if (r.counts.visits === 0) {
    el.innerHTML = `<div class="empty">Add a visit with a date to see the pattern here.<br/>Or press <b>See an example</b> to explore first.</div>`;
    return;
  }
  el.innerHTML = view === "doctor" ? renderDoctor(r) : renderPatient(r);
  attachChartHover(el);
}

function refresh() {
  save();
  renderReport();
}

// ---------- adding medicines ----------

function addMedicines(vi, medications, fromPhoto) {
  const visit = state.visits[vi];
  const existing = visit.medications.filter((m) => m.name.trim());
  const have = new Set(existing.map((m) => m.name.trim().toLowerCase()));
  const fresh = medications
    .filter((m) => !have.has(m.name.toLowerCase()))
    .map((m) => ({ ...m, ...(fromPhoto ? { checkDose: true } : {}) }));
  visit.medications = [...existing, ...fresh];
  if (!visit.medications.length) visit.medications = [newMed()];
  renderInputs();
  refresh();
  return fresh.length;
}

function setMsg(vi, text, kind = "") {
  const m = document.querySelector(`[data-paste-msg="${vi}"]`);
  if (m) {
    m.textContent = text;
    m.className = `paste-msg ${kind}`;
  }
}

function extract(vi, text, fromPhoto) {
  const { medications, ignoredLines } = parsePrescriptionText(text);
  if (!medications.length) {
    setMsg(
      vi,
      fromPhoto
        ? "No medicines could be read from this photo. Try a sharper, well-lit photo of a printed bill, or type them in."
        : "No medicines found. Try one medicine per line, starting with the medicine name or “Tab”.",
      "warn"
    );
    return;
  }
  const added = addMedicines(vi, medications, fromPhoto);
  setMsg(
    vi,
    fromPhoto
      ? `Found ${added} medicine(s). Photo reading can mix up numbers — please check each name and dose against your bill. ${ignoredLines} other line(s) were not saved.`
      : `Found ${added} medicine(s) — please check them below. ${ignoredLines} other line(s) were not saved.`,
    fromPhoto ? "warn" : "ok"
  );
}

async function handlePhoto(vi, file) {
  try {
    const text = await readPhoto(file, (label, p) => setMsg(vi, `${label} ${Math.round(p * 100)}%`));
    extract(vi, text, true);
  } catch (err) {
    setMsg(vi, err.message || "Something went wrong reading the photo. You can paste or type instead.", "warn");
  }
}

// ---------- events ----------

document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.id === "patient-label") {
    state.patientLabel = t.value;
    return refresh();
  }
  if (t.id === "anon") {
    doctorAnonymous = t.checked;
    return renderReport();
  }
  const k = t.dataset.k;
  if (!k) return;
  if (t.dataset.o !== undefined) {
    state.familyObservations[+t.dataset.o][k] = t.value;
  } else if (t.dataset.m !== undefined) {
    const med = state.visits[+t.dataset.v].medications[+t.dataset.m];
    med[k] = t.value;
    if (k === "name" || k === "dose") {
      delete med.checkDose;
      t.closest(".med")?.classList.remove("check");
    }
    const hint = document.querySelector(`[data-hint="${t.dataset.v}-${t.dataset.m}"]`);
    if (hint) hint.textContent = autoHint(med);
  } else if (t.dataset.v !== undefined) {
    state.visits[+t.dataset.v][k] = t.value;
  }
  refresh();
});

document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.photo !== undefined && t.files && t.files[0]) {
    handlePhoto(+t.dataset.photo, t.files[0]);
    t.value = "";
  }
});

document.addEventListener("click", (e) => {
  const viewBtn = e.target.closest("[data-view]");
  if (viewBtn) {
    view = viewBtn.dataset.view;
    return renderReport();
  }
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const v = +b.dataset.v;
  switch (b.dataset.act) {
    case "add-med": state.visits[v].medications.push(newMed()); break;
    case "del-med":
      state.visits[v].medications.splice(+b.dataset.m, 1);
      if (!state.visits[v].medications.length) state.visits[v].medications.push(newMed());
      break;
    case "del-visit":
      if (!confirm(`Remove visit ${v + 1}?`)) return;
      state.visits.splice(v, 1);
      if (!state.visits.length) state.visits.push(newVisit());
      break;
    case "del-obs": state.familyObservations.splice(+b.dataset.o, 1); break;
    case "feel": state.visits[v].wellbeing = +b.dataset.val; break;
    case "copy-prev": {
      const prev = state.visits[v - 1].medications.filter((m) => m.name.trim()).map(({ checkDose, ...m }) => ({ ...m }));
      addMedicines(v, prev, false);
      setMsg(v, "Copied from the last visit — change anything that's different.", "ok");
      return;
    }
    case "show-paste": {
      const box = document.querySelector(`[data-paste-box="${v}"]`);
      box.hidden = !box.hidden;
      if (!box.hidden) box.querySelector("textarea").focus();
      return;
    }
    case "extract": return extract(v, document.querySelector(`[data-paste="${v}"]`).value, false);
    case "welcome-ok":
      store(WELCOME_KEY, "1");
      $("#welcome").hidden = true;
      return;
    default: return;
  }
  renderInputs();
  refresh();
});

$("#add-visit").addEventListener("click", () => {
  const last = state.visits[state.visits.length - 1];
  const v = newVisit();
  if (last) v.doctor = last.doctor || ""; // usually the same doctor
  state.visits.push(v);
  renderInputs();
  refresh();
  document.querySelector(`.visit[data-v="${state.visits.length - 1}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
});

$("#add-obs").addEventListener("click", () => {
  state.familyObservations.push({ by: "", date: "", text: "" });
  renderInputs();
  refresh();
});

$("#load-example").addEventListener("click", async () => {
  if (hasData() && !confirm("Replace what you have entered with the fictional example?")) return;
  state = await getSample();
  renderInputs();
  refresh();
});

$("#clear").addEventListener("click", () => {
  if (!confirm("Delete everything you have entered from this browser? This cannot be undone.")) return;
  state = blank();
  renderInputs();
  refresh();
});

$("#export").addEventListener("click", () => download("thunaicare-record.json", state));

$("#export-anon").addEventListener("click", () => {
  if (!confirm("This downloads a copy with no names, no private notes, and dates turned into weeks — safe to share with a second-opinion doctor. Continue?")) return;
  download("thunaicare-anonymous.json", anonymize(state));
});

$("#import").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    state = { ...blank(), ...data };
    renderInputs();
    refresh();
  } catch (_) {
    alert("That file could not be read. It should be a JSON file saved from Thunai Care.");
  }
  e.target.value = "";
});

$("#print").addEventListener("click", () => window.print());

function hasData() {
  return state.visits.some((v) => v.date || v.medications.some((m) => m.name));
}

async function getSample() {
  if (window.__THUNAI_SAMPLE__) return structuredClone(window.__THUNAI_SAMPLE__);
  const res = await fetch("examples/sample-patient.json");
  return res.json();
}

renderInputs();
renderReport();
