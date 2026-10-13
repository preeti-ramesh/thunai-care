#!/usr/bin/env node
// Command-line runner for the pipeline.
//
//   node cli/analyze.js examples/sample-patient.json          # readable report
//   node cli/analyze.js examples/sample-patient.json --json   # full JSON output

import { readFileSync } from "node:fs";
import { analyze } from "../src/core/analyze.js";

const [, , file, flag] = process.argv;
if (!file) {
  console.error("Usage: node cli/analyze.js <patient.json> [--json]");
  process.exit(1);
}

const record = JSON.parse(readFileSync(file, "utf8"));
const report = analyze(record);

if (flag === "--json") {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const line = "─".repeat(72);
const label = { review: "REVIEW", ask: "ASK", info: "INFO" };

console.log(line);
console.log(`Thunai Care report v${report.version} — ${report.patientLabel}`);
console.log(line);
console.log(report.summary);
console.log();

console.log("MEDICATION TIMELINE");
const dates = report.visits.map((v) => v.date.slice(2));
const w = Math.max(...report.timeline.rows.map((r) => r.generic.length), 10) + 2;
console.log("".padEnd(w) + dates.map((d) => d.padEnd(10)).join(""));
for (const r of report.timeline.rows) {
  console.log(r.generic.padEnd(w) + r.doses.map((d) => String(d ?? "·").padEnd(10)).join(""));
}
console.log("wellbeing".padEnd(w) + report.visits.map((v) => String(v.wellbeing ?? "–").padEnd(10)).join(""));
console.log();

console.log("PATTERNS");
for (const f of report.flags) {
  console.log(`[${label[f.level]}] ${f.title}`);
  console.log(`   ${f.explanation}`);
  if (f.sources.length) console.log(`   Basis: ${f.sources.map((s) => s.title).join("; ")}`);
}
console.log();

console.log("QUESTIONS FOR YOUR DOCTOR");
report.questions.forEach((q, i) => console.log(`${i + 1}. ${q}`));
console.log();
console.log(report.safetyNote);
console.log(line);
