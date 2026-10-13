import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePrescriptionText } from "../src/core/parse.js";
import { lookupAll } from "../src/core/normalize.js";
import { analyze } from "../src/core/analyze.js";

// Real output from the photo reader on a fictional pharmacy bill photo,
// including its mistakes (16 for 10, 56 for 50, © for 0).
const OCR_BILL = `SRI SAI MEDICALS
12 Usman Road, T. Nagar, Chennai 600017 Ph: 044-2434 0000
GSTIN 33ABCDE1234F1Z5 DL No: TN-01-20B-12345
Bill No: 4521 Date: 15/92/2026
Patient: Lakshmi S Dr: R. Kumar
S.No Product Batch Exp Qty Amount
1 NEXITO 10MG TAB 155 NX2231 08/27 30 412.50
2 CLONOTRIL ©.5MG TAB  CT1189 05/27 30 128.40
3 QUTIPIN 56MG TAB QT7781 11/27 3% 289.99
4 OLEANZ 5MG TAB oLasl® 62/28 30 176.20
5: RESTORA 16MG TAB RSE@9l 69/27 10 95.00
Total: Rs 1101.10
Thank you. Get well soon!`;

test("reads medicines from a pharmacy bill and nothing else", () => {
  const { medications } = parsePrescriptionText(OCR_BILL);
  assert.deepEqual(
    medications.map((m) => m.name),
    ["Nexito", "Clonotril", "Qutipin", "Oleanz", "Restora"]
  );
  const all = JSON.stringify(medications);
  for (const secret of ["Lakshmi", "Kumar", "Usman", "SAI", "4521", "GSTIN"]) {
    assert.ok(!all.includes(secret), `leaked ${secret}`);
  }
});

test("fixes the © misread inside a dose", () => {
  const { medications } = parsePrescriptionText(OCR_BILL);
  assert.equal(medications.find((m) => m.name === "Clonotril").dose, "0.5 mg");
});

test("Indian brand names map to their generic and class", () => {
  assert.equal(lookupAll("NEXITO 10MG TAB")[0].generic, "escitalopram");
  assert.equal(lookupAll("Qutipin 50")[0].classKey, "antipsychotic");
  assert.equal(lookupAll("Arip MT 10")[0].generic, "aripiprazole");
  assert.equal(lookupAll("Restora").length, 0);
});

test("a combination brand counts as two medicines", () => {
  const hits = lookupAll("Nexito Plus");
  assert.deepEqual(hits.map((h) => h.generic), ["escitalopram", "clonazepam"]);
  const r = analyze({ visits: [{ date: "2026-01-01", medications: [{ name: "Nexito Plus" }] }] });
  assert.equal(r.timeline.rows.length, 2);
});

test("brand and generic of the same medicine merge in the timeline", () => {
  const r = analyze({
    visits: [
      { date: "2026-01-01", medications: [{ name: "Nexito", dose: "10 mg" }] },
      { date: "2026-02-01", medications: [{ name: "Escitalopram", dose: "10 mg" }] },
    ],
  });
  assert.equal(r.timeline.rows.length, 1);
});

test("a hidden benzodiazepine inside a combination is caught", () => {
  const r = analyze({
    visits: [{ date: "2026-01-01", medications: [{ name: "Nexito Plus" }, { name: "Alprazolam" }] }],
  });
  assert.ok(r.flags.some((f) => f.ruleId === "same-class"));
});
