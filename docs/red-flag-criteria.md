# Red-flag criteria

Every check in `src/core/rules.js` is listed here with its basis. **Status: none of these have yet been reviewed by a practising psychiatrist for use in this tool.** Clinical review is required before any public launch.

Levels: **REVIEW** — a pattern guidance says should not be routine; a second opinion may help. **ASK** — worth raising at the next visit. **INFO** — missing or unclear data.

| Rule ID | Level | What it checks | Basis | Known legitimate exceptions |
|---|---|---|---|---|
| `multiple-antipsychotics` | REVIEW | 2+ antipsychotics at one visit | [APA Choosing Wisely](https://www.psychiatry.org/psychiatrists/practice/quality-improvement/choosing-wisely) ("don't routinely prescribe two or more antipsychotics concurrently"); [APMRT red-flag criteria](https://cla.auburn.edu/media/rjeffyvu/red-flag-criteria.pdf) | Planned cross-taper; after several failed single-medicine trials including clozapine |
| `same-class` | REVIEW | 2+ medicines of the same class at one visit (e.g. two SSRIs, two benzodiazepines) | [APMRT red-flag criteria](https://cla.auburn.edu/media/rjeffyvu/red-flag-criteria.pdf) | Short overlap while switching |
| `four-or-more` | REVIEW | 4+ psychiatric medicines at one visit | [APMRT red-flag criteria](https://cla.auburn.edu/media/rjeffyvu/red-flag-criteria.pdf); [NHS England STOMP](https://www.england.nhs.uk/learning-disabilities/improving-health/stomp/) | Complex conditions under specialist care |
| `sedative-combination` | REVIEW | A benzodiazepine and a z-drug together | Project heuristic | Short-term crisis management |
| `more-meds-no-improvement` | REVIEW | Medicine count rose while wellbeing score did not improve (needs 3+ scores) | Project heuristic | Early treatment; condition worsening for unrelated reasons |
| `sedative-long-term` | ASK | Same benzodiazepine or z-drug on prescriptions spanning 8+ weeks | [Patient.info — Benzodiazepines and Z drugs](https://patient.info/health/benzodiazepines-and-z-drugs) (UK guidance favours short-term use) | Some long-term uses are deliberate and reviewed |
| `frequent-changes` | ASK | Prescription changed at 3+ consecutive visits | Project heuristic | Early titration; managing side effects |
| `visits-more-frequent` | ASK | Recent visit gaps under 60% of early gaps (needs 4+ visits) | Project heuristic | Crisis periods; new medicine monitoring |
| `cost-rising` | ASK | Cost per visit up 50%+ (needs 3+ costs) | Project heuristic; generic options via Jan Aushadhi and NPPA's Pharma Sahi Daam app | More medicines legitimately needed |
| `side-effects` | ASK | Any side effects recorded | [APMRT red-flag criteria](https://cla.auburn.edu/media/rjeffyvu/red-flag-criteria.pdf) ("bothersome side effects") | — |
| `housekeeping` | INFO | Too few visits, unrecognized names, no wellbeing scores | — | — |

## Not yet implemented (needs clinical input)

- **High doses** — APMRT lists "high dosages" as a red flag. Needs a reviewed table of usual maximum doses, including for older adults.
- **Children and older adults** — stricter thresholds (APMRT flags any psychiatric medicine under age 5; APA advises against antipsychotics as first-line for dementia-related behaviour).
- **Antidepressant overprescribing indicators** — a 2024 expert-panel study defined indicators such as very long treatment durations ([PMC11089726](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11089726/)).
- **Indian brand names** — a starter list is in `src/core/drugs.js` (`BRANDS`), including one combination (Nexito Plus). It is unverified and needs pharmacist review and expansion.

## Wording principles

Every flag must:
1. Describe the pattern, not judge the doctor.
2. Say when the pattern can be legitimate.
3. Turn into a question the patient can ask without confrontation.
4. Never suggest stopping or changing a medicine without a doctor.
