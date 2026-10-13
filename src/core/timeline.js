// Step 2 of the pipeline: turn visits into a medication timeline.
//
// Produces:
//   rows:    one row per medication, with the dose at each visit (or null)
//   changes: what was added, removed or re-dosed between consecutive visits
//   counts:  how many medications at each visit

import { PSYCHIATRIC_GROUPS } from "./drugs.js";

export function buildTimeline(norm) {
  const { visits } = norm;
  const rowMap = new Map();

  visits.forEach((v, i) => {
    v.medications.forEach((m) => {
      if (!rowMap.has(m.generic)) {
        rowMap.set(m.generic, {
          generic: m.generic,
          displayName: m.name,
          classKey: m.classKey,
          group: m.group,
          doses: Array(visits.length).fill(null),
        });
      }
      rowMap.get(m.generic).doses[i] = m.dose || "✓";
    });
  });

  const rows = [...rowMap.values()].sort(
    (a, b) => firstIndex(a) - firstIndex(b) || a.generic.localeCompare(b.generic)
  );

  const changes = [];
  for (let i = 1; i < visits.length; i++) {
    const prev = new Map(visits[i - 1].medications.map((m) => [m.generic, m]));
    const curr = new Map(visits[i].medications.map((m) => [m.generic, m]));
    const added = [...curr.keys()].filter((k) => !prev.has(k));
    const removed = [...prev.keys()].filter((k) => !curr.has(k));
    const doseChanged = [...curr.keys()].filter(
      (k) => prev.has(k) && norm_(prev.get(k).dose) !== norm_(curr.get(k).dose)
    );
    changes.push({
      from: visits[i - 1].date,
      to: visits[i].date,
      days: daysBetween(visits[i - 1].date, visits[i].date),
      added,
      removed,
      doseChanged,
      changed: added.length + removed.length + doseChanged.length > 0,
    });
  }

  const counts = visits.map((v) => ({
    date: v.date,
    total: v.medications.length,
    psychiatric: v.medications.filter((m) => PSYCHIATRIC_GROUPS.has(m.group)).length,
  }));

  return { rows, changes, counts };
}

function firstIndex(row) {
  return row.doses.findIndex((d) => d !== null);
}

function norm_(dose) {
  return String(dose || "").toLowerCase().replace(/\s+/g, "");
}

export function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}
