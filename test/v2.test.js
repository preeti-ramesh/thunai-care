import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePrescriptionText } from "../src/core/parse.js";
import { anonymize } from "../src/core/anonymize.js";
import { analyze } from "../src/core/analyze.js";

const RX = `
Dr. Ramesh Kumar, MD (Psychiatry)  Reg No. TN 12345
Sunrise Mind Clinic, 14 Anna Salai, Chennai 600002   Ph: 98400 12345
Patient: Lakshmi S, 34 F      Date: 12/01/2026
Dx: Generalised anxiety disorder
1. Tab Escitalopram 10mg   1-0-0 x 30 days
2. Tab. Clonazepam 0.25 mg  0-0-1
3. Tab Calmora 50mg  0-0-1
Review after 4 weeks
`;

test("parser keeps only medicine lines", () => {
  const { medications, ignoredLines } = parsePrescriptionText(RX);
  assert.deepEqual(
    medications.map((m) => [m.name, m.dose]),
    [
      ["Escitalopram", "10 mg"],
      ["Clonazepam", "0.25 mg"],
      ["Calmora", "50 mg"],
    ]
  );
  assert.ok(ignoredLines >= 5);
  const all = JSON.stringify(medications);
  for (const secret of ["Ramesh", "Lakshmi", "Anna Salai", "98400", "Sunrise", "12345"]) {
    assert.ok(!all.includes(secret), `leaked ${secret}`);
  }
});

test("parser handles plain generic names without a prefix", () => {
  const { medications } = parsePrescriptionText("sertraline 50 mg\nolanzapine 5mg at night");
  assert.equal(medications.length, 2);
  assert.equal(medications[1].dose, "5 mg");
});

test("parser returns nothing for non-medicine text", () => {
  const { medications } = parsePrescriptionText("Patient doing better. Follow up next month.");
  assert.equal(medications.length, 0);
});

const record = {
  patientLabel: "Amma",
  visits: [
    { date: "2026-02-15", doctor: "Dr. Ramesh", notes: "Clinic near home in Mylapore", wellbeing: 5, medications: [{ name: "Sertraline", dose: "50 mg" }] },
    { date: "2026-01-01", doctor: "Dr. Ramesh", wellbeing: 4, medications: [{ name: "Sertraline", dose: "25 mg" }] },
    { date: "2026-03-29", doctor: "Dr. Priya", wellbeing: 6, medications: [{ name: "Sertraline", dose: "50 mg" }] },
  ],
  familyObservations: [{ by: "Kavya (daughter)", date: "2026-02-01", text: "Sleeping better." }],
};

test("anonymizer removes names, notes and calendar dates", () => {
  const a = anonymize(record);
  const s = JSON.stringify(a);
  for (const secret of ["Amma", "Ramesh", "Priya", "Mylapore", "Kavya", "2026"]) {
    assert.ok(!s.includes(secret), `leaked ${secret}`);
  }
  assert.deepEqual(a.visits.map((v) => v.doctor), ["Doctor A", "Doctor A", "Doctor B"]);
  assert.equal(a.visits[0].medications[0].dose, "25 mg");
});

test("anonymizer keeps the gaps between visits", () => {
  const a = analyze(anonymize(record));
  const b = analyze(record);
  assert.deepEqual(
    a.timeline.changes.map((c) => c.days),
    b.timeline.changes.map((c) => c.days)
  );
  assert.equal(a.datesShifted, true);
});

test("anonymized report uses week labels, not dates", () => {
  const r = analyze(
    anonymize({
      visits: [
        { date: "2026-01-01", medications: [{ name: "Alprazolam" }] },
        { date: "2026-04-01", medications: [{ name: "Alprazolam" }] },
      ],
    })
  );
  const flag = r.flags.find((f) => f.ruleId === "sedative-long-term");
  assert.match(flag.explanation, /Wk 0/);
  assert.ok(!/2026|2000/.test(flag.explanation));
});

test("normal reports still use calendar dates after an anonymized run", () => {
  analyze(anonymize(record));
  const r = analyze({
    visits: [
      { date: "2026-01-01", medications: [{ name: "Alprazolam" }] },
      { date: "2026-04-01", medications: [{ name: "Alprazolam" }] },
    ],
  });
  assert.match(r.flags.find((f) => f.ruleId === "sedative-long-term").explanation, /2026/);
});

test("parser does not mistake an address like 'T. Nagar' for a medicine", () => {
  const { medications } = parsePrescriptionText("T. Nagar, Chennai 600017\nTab Sertraline 50mg");
  assert.deepEqual(medications.map((m) => m.name), ["Sertraline"]);
});
