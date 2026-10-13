import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { buildHtml } from "../scripts/build-single-file.js";
import { VERSION } from "../src/core/analyze.js";

const file = new URL("../thunai-care.html", import.meta.url);

test("thunai-care.html exists for people without Node.js", () => {
  assert.ok(existsSync(file), "Run: npm run build");
});

test("thunai-care.html is up to date with the source code", () => {
  const onDisk = readFileSync(file, "utf8");
  assert.equal(onDisk, buildHtml(), "thunai-care.html is out of date. Run: npm run build");
  assert.ok(onDisk.includes(`v0.${VERSION.split(".")[1]}`));
});

test("package has no dependencies to install", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.ok(!pkg.dependencies || Object.keys(pkg.dependencies).length === 0);
});
