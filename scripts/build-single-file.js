// Bundles the web app into one self-contained HTML file, thunai-care.html, in
// the project's top folder. Anyone can double-click it to use the app — no
// Node.js, no internet (except the photo reader, which downloads once).
//
// This file IS committed to the repository so people who download the project
// from GitHub can use it straight away. Re-run this after changing the code:
//
//   node scripts/build-single-file.js

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

// Order matters: dependencies first.
const modules = [
  "src/core/drugs.js",
  "src/core/normalize.js",
  "src/core/timeline.js",
  "src/core/rules.js",
  "src/core/anonymize.js",
  "src/core/analyze.js",
  "src/core/parse.js",
  "app/ocr.js",
  "app/chart.js",
  "app/app.js",
];

const stripModule = (src) =>
  src
    .replace(/^import\s[^;]+;\s*$/gm, "")
    .replace(/^export\s+(const|function|async function|class|let)\s/gm, "$1 ");

export function buildHtml() {
  const js = modules.map((m) => `// ---- ${m} ----\n${stripModule(read(m))}`).join("\n");
  const sample = read("examples/sample-patient.json");
  const css = read("app/styles.css");

  const html = read("index.html")
  .replace(/<link rel="stylesheet" href="app\/styles.css" \/>/, `<style>\n${css}\n</style>`)
  .replace(
    /<script type="module" src="app\/app.js"><\/script>/,
    `<script>window.__THUNAI_SAMPLE__ = ${sample};</script>\n<script>\n(() => {\n${js}\n})();\n</script>`
  );
  return html;
}

// Only write the file when run directly (not when imported by the tests).
const same = (a, b) => (process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b);
if (process.argv[1] && same(resolve(fileURLToPath(import.meta.url)), resolve(process.argv[1]))) {
  const html = buildHtml();
  writeFileSync(join(root, "thunai-care.html"), html);
  console.log(`Built thunai-care.html (${(html.length / 1024).toFixed(1)} KB)`);
}
