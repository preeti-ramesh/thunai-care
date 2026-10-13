# Changelog

## v0.4.0 — Easy to download and run (2026-10-12)

Feedback that shaped this version:
- *Someone who downloads this from GitHub may not know VS Code.* → It now works with **no tools at all**, or with a few terminal commands.

Added
- `thunai-care.html` in the top folder — the whole app in one file. Download, double-click, done. No Node.js needed.
- `START-HERE.txt` — a plain-text guide for non-developers (readable in Notepad or with `more START-HERE.txt`).
- `start-windows.bat` and `start-mac-linux.sh` — double-click starters. They use Node.js if installed, otherwise open the single file.
- `scripts/serve.js` — `npm start` now runs a tiny built-in server (nothing to download), opens the browser, only listens on this computer, and picks another port if 8080 is busy.
- `npm run guide` — shows the getting-started guide in the terminal.
- Packaging tests: the single file must exist and match the source code; the project must have no dependencies (29 tests).

Changed
- README starts with a "Quick start — no coding needed" section, with terminal steps under "Prefer the terminal?".
- `npm run build` writes `thunai-care.html` to the top folder (was `dist/`).

## v0.3.0 — Easier entry, a graph, comfort-first design (2026-10-10)

Feedback that shaped this version:
- *Handwritten prescriptions are hard — but the pharmacy bill is printed.* → **Photo of bill**: the photo is read on the device (Tesseract.js); only medicine lines are kept, and every photo-read medicine is marked "please check" because photo reading mixes up numbers (in testing, 10 mg was read as 16 mg).
- *Why are medicines copied into a new visit?* → New visits now start **empty**, with an optional **Same as last visit** button.
- *A graph would help.* → **How things changed**: feeling over time and number of medicines, as two small charts on one time axis, with hover details.
- *What layout and colours make people comfortable?* → Desk research ([docs/ux-research.md](docs/ux-research.md)) applied to the design, plus a survey to test it with real people ([docs/comfort-survey.md](docs/comfort-survey.md)).

Added
- `app/ocr.js` — in-browser photo reading; `app/chart.js` — the two charts.
- Starter list of common Indian brand names (e.g. Nexito → escitalopram), including combinations (Nexito Plus → escitalopram + clonazepam, each counted). **Unverified — needs pharmacist review.**
- One-time welcome card with three promises (private, no names, no blame); 1-2-3 step guide.
- Survey materials: palette comparison screenshots and a fictional pharmacy bill.
- Tests for bill reading, brand names and combinations (26 tests).

Changed
- Feeling is five buttons (Very low → Very good) instead of a 1–10 box.
- Flag levels renamed: REVIEW / ASK / INFO → **Worth a second look / Ask at next visit / Note**.
- Calmer palette: amber instead of red for "worth a second look", soft blue for "ask", calm teal background for reassurance.
- "Clear" → **Delete all my data**; "Load example" → **See an example**.

## v0.2.0 — Thunai Care (2026-10-10)

Renamed from "Second Look" to **Thunai Care** (*thunai* — Tamil for companion, support).

Feedback that shaped this version:
- *For doctors, so much detail is stressful.* → A one-page **Doctor summary** view.
- *For patients, typing everything is tedious.* → **Paste prescription text** and the medicines are pulled out automatically; extra details are tucked away.
- *Nobody wants to be exposed — patient or doctor.* → **Trust & Safety principles** ([docs/trust-and-safety.md](docs/trust-and-safety.md)), doctors recorded as labels (A, B…), and an **anonymous export** with relative dates.

Added
- `src/core/parse.js` — extracts medicines and doses from pasted prescription text; keeps nothing else.
- `src/core/anonymize.js` — strips names and free-text notes, relabels doctors, converts dates to weeks.
- Patient view / Doctor summary toggle, with an "anonymous" option for second-opinion doctors.
- Tests for the parser and anonymizer.

Changed
- Visit form: date, feeling, medicines and side effects up front; doctor label, diagnosis, cost and notes under "More details".

## v0.1.0 — Second Look (2026-10-10)

First prototype: visit entry, medicine timeline, 10 pattern checks with sources, questions for the doctor, CLI, tests.
