// The full pipeline:  input record → normalize → timeline → rules → report
//
// This module has no browser or Node dependencies, so the same code runs in
// the web page (app/app.js), the command line (cli/analyze.js) and the tests.

import { normalize } from "./normalize.js";
import { buildTimeline } from "./timeline.js";
import { RULES, SOURCES, setDateFormatter } from "./rules.js";
import { weekLabel } from "./anonymize.js";

export const VERSION = "0.4.0";

const LEVEL_ORDER = { review: 0, ask: 1, info: 2 };

export const SAFETY_NOTE =
  "This report is not medical advice and does not say that any doctor did something wrong. " +
  "It highlights patterns that may be worth discussing. Do not stop, skip or change any medicine " +
  "on your own — some psychiatric medicines cause serious withdrawal effects if stopped suddenly. " +
  "Take these questions to your doctor, or to a second qualified psychiatrist. " +
  "If you are in crisis in India, call Tele-MANAS on 14416 (free, 24×7).";

export function analyze(record) {
  const norm = normalize(record);
  const timeline = buildTimeline(norm);
  const ctx = { ...norm, ...timeline };

  setDateFormatter(record.datesShifted ? weekLabel : null);

  const flags = [];
  for (const rule of RULES) {
    let out = [];
    try {
      out = rule.run(ctx) || [];
    } catch (err) {
      out = [];
      console.warn(`Rule ${rule.id} failed:`, err);
    }
    for (const f of out) {
      flags.push({
        ruleId: rule.id,
        level: rule.level,
        sources: rule.basis.map((b) => ({ id: b, ...SOURCES[b] })),
        ...f,
      });
    }
  }
  flags.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);

  const questions = flags.filter((f) => f.question).map((f) => f.question);
  const review = flags.filter((f) => f.level === "review").length;
  const ask = flags.filter((f) => f.level === "ask").length;

  let summary;
  if (norm.visits.length === 0) {
    summary = "No visits entered yet.";
  } else if (review > 0) {
    summary = `${review} pattern(s) found that deserve a closer look. These are worth discussing with your doctor, and an independent second opinion may help.`;
  } else if (ask > 0) {
    summary = `No major red flags found. ${ask} point(s) are worth raising at your next appointment.`;
  } else {
    summary = "No red-flag patterns found in the visits entered. Keep tracking — patterns show up over time.";
  }

  return {
    version: VERSION,
    generatedAt: new Date().toISOString(),
    patientLabel: norm.patientLabel,
    datesShifted: Boolean(record.datesShifted),
    summary,
    counts: { visits: norm.visits.length, review, ask, info: flags.length - review - ask },
    visits: norm.visits,
    familyObservations: norm.familyObservations,
    timeline,
    flags,
    questions,
    safetyNote: SAFETY_NOTE,
  };
}
