import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { analyze } from "../src/core/analyze.js";
import { classify } from "../src/core/normalize.js";

const visit = (date, meds, extra = {}) => ({
  date,
  medications: meds.map((m) => (typeof m === "string" ? { name: m, dose: "" } : m)),
  ...extra,
});
const ids = (report) => report.flags.map((f) => f.ruleId);

test("classifies names with tablet prefixes and doses", () => {
  assert.equal(classify("Tab Escitalopram 10mg").classKey, "ssri");
  assert.equal(classify("quetiapine SR 50").classKey, "antipsychotic");
  assert.equal(classify("Sodium Valproate").classKey, "mood_stabilizer");
  assert.equal(classify("SomeBrandName"), null);
});

test("a simple, stable plan raises no review or ask flags", () => {
  const r = analyze({
    visits: [
      visit("2026-01-01", ["Sertraline"], { wellbeing: 4 }),
      visit("2026-03-01", ["Sertraline"], { wellbeing: 6 }),
      visit("2026-06-01", ["Sertraline"], { wellbeing: 7 }),
    ],
  });
  assert.equal(r.counts.review, 0);
  assert.equal(r.counts.ask, 0);
});

test("flags two antipsychotics at once", () => {
  const r = analyze({ visits: [visit("2026-01-01", ["Olanzapine", "Risperidone"])] });
  assert.ok(ids(r).includes("multiple-antipsychotics"));
});

test("flags two SSRIs, but not one SSRI and one antipsychotic", () => {
  const twoSsri = analyze({ visits: [visit("2026-01-01", ["Fluoxetine", "Sertraline"])] });
  assert.ok(ids(twoSsri).includes("same-class"));
  const mixed = analyze({ visits: [visit("2026-01-01", ["Fluoxetine", "Olanzapine"])] });
  assert.ok(!ids(mixed).includes("same-class"));
});

test("flags four or more psychiatric medicines", () => {
  const r = analyze({
    visits: [visit("2026-01-01", ["Sertraline", "Olanzapine", "Clonazepam", "Lithium"])],
  });
  assert.ok(ids(r).includes("four-or-more"));
});

test("flags long-term benzodiazepine only after ~8 weeks", () => {
  const short = analyze({ visits: [visit("2026-01-01", ["Alprazolam"]), visit("2026-01-20", ["Alprazolam"])] });
  assert.ok(!ids(short).includes("sedative-long-term"));
  const long = analyze({ visits: [visit("2026-01-01", ["Alprazolam"]), visit("2026-04-01", ["Alprazolam"])] });
  assert.ok(ids(long).includes("sedative-long-term"));
});

test("flags more medicines with no improvement", () => {
  const r = analyze({
    visits: [
      visit("2026-01-01", ["Sertraline"], { wellbeing: 5 }),
      visit("2026-02-01", ["Sertraline", "Quetiapine"], { wellbeing: 5 }),
      visit("2026-03-01", ["Sertraline", "Quetiapine", "Clonazepam"], { wellbeing: 4 }),
    ],
  });
  assert.ok(ids(r).includes("more-meds-no-improvement"));
});

test("does not flag more medicines when the person is improving", () => {
  const r = analyze({
    visits: [
      visit("2026-01-01", ["Sertraline"], { wellbeing: 3 }),
      visit("2026-02-01", ["Sertraline", "Mirtazapine"], { wellbeing: 5 }),
      visit("2026-03-01", ["Sertraline", "Mirtazapine"], { wellbeing: 7 }),
    ],
  });
  assert.ok(!ids(r).includes("more-meds-no-improvement"));
});

test("visits out of order are sorted by date", () => {
  const r = analyze({ visits: [visit("2026-03-01", ["A"]), visit("2026-01-01", ["B"])] });
  assert.equal(r.visits[0].date, "2026-01-01");
});

test("manual class choice is respected for unknown brand names", () => {
  const r = analyze({
    visits: [visit("2026-01-01", [{ name: "BrandX", classKey: "antipsychotic" }, "Olanzapine"])],
  });
  assert.ok(ids(r).includes("multiple-antipsychotics"));
});

test("sample file runs end to end and every flag has a source or is info", () => {
  const sample = JSON.parse(readFileSync(new URL("../examples/sample-patient.json", import.meta.url)));
  const r = analyze(sample);
  assert.ok(r.flags.length > 0);
  for (const f of r.flags) {
    if (f.level !== "info") assert.ok(f.sources.length > 0, `${f.ruleId} has no source`);
  }
  assert.ok(r.safetyNote.includes("Do not stop"));
});

test("empty input does not crash", () => {
  const r = analyze({});
  assert.equal(r.counts.visits, 0);
});
