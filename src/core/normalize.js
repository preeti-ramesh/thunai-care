// Step 1 of the pipeline: clean up user input.
//
// - Sorts visits by date
// - Matches each medication name to a drug class
// - Respects a class the user picked manually
// - Records names we could not recognize so the report can ask about them

import { DRUGS, DRUG_CLASSES, BRANDS } from "./drugs.js";

const STRIP = /\b(tab|tablet|tabs|cap|capsule|caps|sr|er|xr|cr|od|md|mg|ml)\b\.?/g;

export function cleanName(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[0-9.]+\s*(mg|mcg|ml)?/g, " ")
    .replace(STRIP, " ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Brand names, longest first so "nexito plus" wins over "nexito".
const BRAND_KEYS = Object.keys(BRANDS).sort((a, b) => b.length - a.length);
const GENERIC_KEYS = Object.keys(DRUGS);

// Returns every ingredient found in a name: [] if unknown, several for a
// combination brand. Each item: { generic, classKey, brand }.
export function lookupAll(name) {
  const cleaned = cleanName(name);
  if (!cleaned) return [];
  for (const brand of BRAND_KEYS) {
    if (new RegExp(`\\b${brand}\\b`).test(cleaned)) {
      return BRANDS[brand].map((g) => ({ generic: g, classKey: DRUGS[g] || "other", brand }));
    }
  }
  if (DRUGS[cleaned]) return [{ generic: cleaned, classKey: DRUGS[cleaned], brand: null }];
  for (const generic of GENERIC_KEYS) {
    if (new RegExp(`\\b${generic}\\b`).test(cleaned)) return [{ generic, classKey: DRUGS[generic], brand: null }];
  }
  return [];
}

export function classify(name) {
  return lookupAll(name)[0] || null;
}

const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

export function normalize(record) {
  const visits = [...(record.visits || [])]
    .filter((v) => v && v.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const unrecognized = new Set();

  const normVisits = visits.map((v, i) => {
    const meds = (v.medications || [])
      .filter((m) => m && m.name && String(m.name).trim())
      .flatMap((m) => {
        const raw = String(m.name).trim();
        const manual = m.classKey && DRUG_CLASSES[m.classKey] ? m.classKey : null;
        const hits = lookupAll(raw);
        // Combination brand: count each ingredient separately.
        if (hits.length > 1 && !manual) {
          return hits.map((h) => ({
            name: `${titleCase(h.generic)} (in ${raw})`,
            generic: h.generic,
            dose: m.dose || "",
            classKey: h.classKey,
            group: DRUG_CLASSES[h.classKey].group,
            recognized: true,
          }));
        }
        const hit = hits[0] || null;
        const classKey = manual || (hit ? hit.classKey : "other");
        if (!hit && !manual) unrecognized.add(raw);
        return [{
          name: raw,
          generic: hit ? hit.generic : cleanName(raw) || raw,
          dose: m.dose || "",
          classKey,
          group: DRUG_CLASSES[classKey].group,
          recognized: Boolean(hit || manual),
        }];
      });

    const wellbeing = Number.isFinite(Number(v.wellbeing)) && v.wellbeing !== "" && v.wellbeing != null
      ? Math.max(1, Math.min(10, Number(v.wellbeing)))
      : null;

    return {
      index: i,
      date: v.date,
      doctor: v.doctor || "",
      diagnosis: v.diagnosis || "",
      cost: Number.isFinite(Number(v.cost)) && v.cost !== "" && v.cost != null ? Number(v.cost) : null,
      wellbeing,
      sideEffects: (v.sideEffects || "").trim(),
      notes: (v.notes || "").trim(),
      medications: meds,
    };
  });

  return {
    patientLabel: record.patientLabel || "Patient",
    familyObservations: (record.familyObservations || []).filter((o) => o && o.text),
    visits: normVisits,
    unrecognized: [...unrecognized],
  };
}
