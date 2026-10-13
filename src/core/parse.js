// Extracts medicines from prescription or pharmacy-bill text — pasted, or
// read from a photo (see app/ocr.js).
//
// Privacy by design: only lines that look like medicines are kept. Names,
// phone numbers, addresses, hospital, doctor and bill details are simply never
// copied out of the text.
//
// Photo reading makes mistakes, especially with digits (10 can become 16).
// The app marks photo-read medicines so the user checks every dose.

import { lookupAll, cleanName } from "./normalize.js";

// "Tab"/"Cap" etc. at the start of a line ("Tab Sertraline 50mg") …
const MED_PREFIX = /^\s*(\d+[.):]?\s*)?(tab|tablet|tabs|cap|capsule|caps|syp|syrup|inj|injection)\b\.?\s*/i;
// … or as its own word anywhere, as on pharmacy bills ("NEXITO 10MG TAB 15S")
const MED_WORD = /\b(tab|tablet|tabs|cap|capsule|caps)\b/i;
const DOSE = /(\d+(?:\.\d+)?)\s*(mg|mcg|µg|ml)\b/i;
const SKIP_WORDS = new Set(["tab", "tablet", "tabs", "cap", "capsule", "caps", "syp", "syrup", "inj", "injection", "mt", "sr", "er", "xr", "cr", "od", "md", "dt", "no"]);

// Common photo-reading confusions inside a dose: "©.5MG" → "0.5MG", "1OMG" → "10MG"
function fixOcrDigits(line) {
  return line.replace(/([0-9©Oo]+(?:[.,][0-9©Oo]+)?)\s*(mg|mcg|ml)\b/gi, (m, num, unit) =>
    num.replace(/[©Oo]/g, "0").replace(",", ".") + unit
  );
}

export function parsePrescriptionText(text) {
  const lines = String(text || "")
    .split(/\r?\n|;/)
    .map((l) => fixOcrDigits(l.trim()))
    .filter(Boolean);

  const medications = [];
  let ignored = 0;
  const seen = new Set();

  for (const line of lines) {
    const hits = lookupAll(line);
    const looksLikeMed = MED_PREFIX.test(line) || MED_WORD.test(line);
    if (!hits.length && !looksLikeMed) {
      ignored++;
      continue;
    }

    const doseMatch = line.match(DOSE);
    const dose = doseMatch ? `${doseMatch[1]} ${doseMatch[2].toLowerCase()}` : "";

    let name;
    if (hits.length) {
      // Keep the brand as written if there was one (e.g. "Nexito"), else the generic.
      const label = hits[0].brand || hits[0].generic;
      name = label.replace(/\b\w/g, (c) => c.toUpperCase());
    } else {
      // Unknown name: the first real words, skipping serial numbers and "Tab".
      const words = line
        .replace(MED_PREFIX, " ")
        .replace(DOSE, " ")
        .split(/\s+/)
        .filter((w) => /^[a-z][a-z-]*$/i.test(w) && !SKIP_WORDS.has(w.toLowerCase()));
      name = words.slice(0, 2).join(" ");
      // On bills, the name comes before "TAB"; ignore words after it.
      const beforeTab = line.split(MED_WORD)[0];
      const front = beforeTab
        .split(/\s+/)
        .filter((w) => /^[a-z][a-z-]*$/i.test(w) && !SKIP_WORDS.has(w.toLowerCase()));
      if (MED_WORD.test(line) && !MED_PREFIX.test(line) && front.length) name = front.slice(0, 2).join(" ");
      if (!name) {
        ignored++;
        continue;
      }
      name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }

    const key = cleanName(name);
    if (seen.has(key)) continue;
    seen.add(key);
    medications.push({ name, dose, classKey: "" });
  }

  return { medications, ignoredLines: ignored };
}
