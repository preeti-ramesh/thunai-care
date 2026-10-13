# Thunai Care

*Thunai* (துணை) — Tamil for companion, support.

**See the pattern in psychiatric prescriptions. Bring better questions to the doctor.**

Version 0.4 · see [CHANGELOG.md](CHANGELOG.md) · built on the [Trust & Safety principles](docs/trust-and-safety.md)

## Quick start — no coding needed

1. On this GitHub page, click the green **Code** button → **Download ZIP**, then unzip it.
2. Double-click **`thunai-care.html`**. It opens in your browser.
3. Press **See an example** to look around.

That's all. No installing, no terminal. New here? Open **[START-HERE.txt](START-HERE.txt)** — a plain-text guide you can read in Notepad.

<details>
<summary><b>Prefer the terminal?</b> (Windows Command Prompt)</summary>

```bat
:: get the code (or use Download ZIP above)
git clone https://github.com/preeti-ramesh/thunai-care.git
cd thunai-care

:: open the app — nothing to install
start thunai-care.html

:: read the guide right in the terminal
more START-HERE.txt
```

With Node.js installed (`winget install OpenJS.NodeJS.LTS`, then reopen the terminal), you can also run:

```bat
npm start        :: opens the app at http://localhost:8080 (Ctrl + C to stop)
npm run demo     :: prints an example report in the terminal
npm test         :: runs the checks
npm run guide    :: shows the getting-started guide
```

No `npm install` needed — Thunai Care has no dependencies.

On Mac or Linux: `open thunai-care.html`, or `sh start-mac-linux.sh`. On Windows you can also double-click `start-windows.bat`.
</details>

---

> ⚠️ Prototype. Not medical advice. Thunai Care does not judge any doctor and must never be used to stop or change a medicine without a qualified doctor. Some psychiatric medicines cause serious withdrawal effects if stopped suddenly.

---

## The problem

When a broken bone is set, you know roughly how long it should take to heal. If the cast were set so the bone never quite healed, and you kept going back month after month, someone would eventually notice.

Psychiatric care is harder to see. The person in treatment is often the one least able to judge whether it is working — their own mind is what's struggling. Prescriptions can grow from two medicines to six, visits can become more frequent, and costs can climb, while the person feels no better. Often it is family who finally notice the pattern and push for a second opinion.

**Not everyone has that family.** Thunai Care tries to be that outside view.

In India this matters especially: there are very few psychiatrists per person, prescriptions are often hand-written and hard to compare over time, and patients rarely have a way to ask "is this normal?" without confronting their own doctor.

## What it does today (v0.4)

1. **Add visits with minimal typing** — three ways to add medicines: **photograph the pharmacy bill** (read on the device, never uploaded), **paste** prescription text, or **same as last visit**. Only medicine lines are kept; names, addresses and hospital details are ignored. Common Indian brand names are recognized (starter list). The patient taps how they felt (five choices) and notes any side effects. Doctor (as a label like A or B), diagnosis and cost are optional. Family members can add their own observations.
2. **See how things changed** — a small graph of how the person felt and how many medicines they were on, plus the full timeline — every medicine across every visit, with additions and dose changes marked, alongside how the person felt and how far apart visits were.
3. **Pattern checks** — red-flag rules based on published guidance (see [docs/red-flag-criteria.md](docs/red-flag-criteria.md)):
   - two or more antipsychotics at once
   - two or more medicines from the same class
   - four or more psychiatric medicines at once
   - a benzodiazepine or sleeping pill continued long-term, or combined
   - more medicines but no reported improvement
   - medicines changed at many visits in a row
   - visits becoming more frequent
   - cost per visit rising sharply
   - side effects reported
4. **Questions for the doctor** — every pattern becomes a plain, non-confrontational question the patient can take to their own doctor or to a second psychiatrist. Printable.
5. **Two views** — a friendly *For me* view, and a one-page *Doctor summary* for a busy doctor. The doctor summary can be **anonymous** (no names, no private notes, dates as weeks) for a second-opinion doctor, and an anonymous copy can be downloaded with **Share anonymously**.

Everything runs in the browser. **No data leaves the device.** The first time a photo is read, the browser downloads the open-source reader (Tesseract.js) from a public CDN; the photo itself is never sent anywhere.

## What it does NOT do

- It does not diagnose, recommend medicines, or say a prescription is wrong. Many flagged patterns are sometimes correct care (for example, a planned switch from one medicine to another).
- It does not check doses against maximums yet.
- It does not connect to doctors, lawyers or regulators yet. See the [roadmap](docs/roadmap.md).

## For developers

```bash
# needs Node.js 18+; there are no dependencies, so no npm install
npm test                # run the tests
npm run demo            # print a report for the fictional example
npm start               # serve the source version at http://localhost:8080
npm run build           # rebuild thunai-care.html after changing the code
```

`thunai-care.html` is a generated, self-contained copy of the app, kept in the repository so non-developers can double-click it. **Run `npm run build` before committing code changes** — a test checks that it's up to date.

Run the pipeline on your own JSON file:

```bash
node cli/analyze.js path/to/record.json          # readable report
node cli/analyze.js path/to/record.json --json   # full JSON
```

## How it works

```
input record ──► normalize ──► timeline ──► rules ──► report
 (visits,         (sort, match    (meds ×     (red-flag   (summary, timeline,
  family notes)    drug classes)   visits)     checks)     flags, questions)
```

| Folder | What's in it |
|---|---|
| `src/core/` | The pipeline. Plain JavaScript, no dependencies; shared by the web app, CLI and tests. |
| `src/core/drugs.js` | Drug-class dictionary (generic names). |
| `src/core/rules.js` | Every red-flag rule, with its source. |
| `app/` | Browser UI (source). |
| `thunai-care.html` | Ready-to-open single-file app, built from the source by `npm run build`. |
| `scripts/` | Build, local server (`npm start`) and terminal guide. |
| `cli/` | Command-line runner. |
| `examples/` | Fictional sample data. |
| `test/` | Unit tests (`node --test`). |
| `docs/` | Criteria, roadmap, privacy, trust & safety, UX research, user survey. |

## Data format

```json
{
  "patientLabel": "Nickname",
  "visits": [
    {
      "date": "2026-01-20",
      "doctor": "A",
      "diagnosis": "As written",
      "cost": 1400,
      "wellbeing": 5,
      "sideEffects": "Drowsy in the mornings",
      "notes": "",
      "medications": [
        { "name": "Escitalopram", "dose": "20 mg" },
        { "name": "BrandName", "dose": "", "classKey": "antipsychotic" }
      ]
    }
  ],
  "familyObservations": [
    { "date": "2026-03-20", "by": "Sister", "text": "Sleeping most of the day." }
  ]
}
```

`classKey` is optional — use it for brand names the tool doesn't recognize. Valid keys are listed in `src/core/drugs.js`.

## Share it as a link (optional)

Because Thunai Care is a plain web page, GitHub can host it for free so people only need a link — nothing to download. In the repository: **Settings → Pages → Branch: `main`, folder: `/ (root)` → Save.** After a minute it's live at `https://preeti-ramesh.github.io/thunai-care/`. Data still stays in each visitor's own browser.

Only do this once you're ready for the project to be public.

## Never commit real patient data

Use only fictional examples in this repository. `.gitignore` excludes `data/`, `*.private.json` and `real-*.json` as a safety net. See [docs/privacy.md](docs/privacy.md).

## Get involved

- **Psychiatrists and pharmacists** — help review the red-flag criteria and drug list. This is the most valuable contribution right now.
- **Families and patients** — tell us what would have helped you. What did you wish you had known sooner?
- **Developers and designers** — Indian brand-name mapping, regional languages, prescription photo reading.

## License

To be decided. Until a license is added, all rights are reserved by the author.
