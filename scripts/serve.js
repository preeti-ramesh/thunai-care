#!/usr/bin/env node
// Starts Thunai Care on this computer and opens it in the browser.
//
//   npm start            (or: node scripts/serve.js)
//
// Uses only what comes with Node.js — nothing to download or install.
// The app is only reachable from this computer (127.0.0.1), not from the
// network. Press Ctrl + C in the terminal to stop it.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "127.0.0.1";
const START_PORT = Number(process.env.PORT) || 8080;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
};

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = normalize(join(root, urlPath));
    // Never serve anything outside the project folder.
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, "index.html");
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": TYPES[extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
  }
});

function openBrowser(url) {
  if (process.env.NO_OPEN) return;
  const cmd =
    process.platform === "win32" ? `start "" "${url}"` :
    process.platform === "darwin" ? `open "${url}"` :
    `xdg-open "${url}"`;
  exec(cmd, () => {}); // if it fails, the URL is printed below anyway
}

function listen(port, triesLeft = 10) {
  server.once("error", (err) => {
    if (err.code === "EADDRINUSE" && triesLeft > 0) return listen(port + 1, triesLeft - 1);
    console.error(`Could not start: ${err.message}`);
    process.exit(1);
  });
  server.listen(port, HOST, () => {
    const url = `http://localhost:${port}/`;
    console.log("");
    console.log("  Thunai Care is running.");
    console.log("");
    console.log(`  Open this in your browser:  ${url}`);
    console.log("");
    console.log("  Your data stays on this computer. Press Ctrl + C here to stop.");
    console.log("");
    openBrowser(url);
  });
}

listen(START_PORT);
