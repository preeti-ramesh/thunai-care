// Step 3 of the pipeline: red-flag rules.
//
// Each rule looks at the normalized visits + timeline and returns zero or more
// flags. A flag is NEVER a verdict that a doctor did something wrong. It is a
// pattern worth asking about. Many flagged patterns are sometimes correct
// care (for example, a planned switch between two medicines).
//
// Levels:
//   "review" – a pattern that published guidance says should not be routine;
//              a second opinion may be worth considering
//   "ask"    – worth raising at the next appointment
//   "info"   – housekeeping (missing data, unrecognized names)
//
// Every rule lists its basis. Rules marked basis: "heuristic" are this
// project's own pattern checks and MUST be reviewed by a clinician.

import { DRUG_CLASSES, PSYCHIATRIC_GROUPS } from "./drugs.js";
import { daysBetween } from "./timeline.js";

export const SOURCES = {
  apa_cw: {
    title: "American Psychiatric Association — Choosing Wisely recommendations",
    url: "https://www.psychiatry.org/psychiatrists/practice/quality-improvement/choosing-wisely",
  },
  apmrt: {
    title: "Alabama Psychiatric Medication Review Team — Medication Red Flag Criteria",
    url: "https://cla.auburn.edu/media/rjeffyvu/red-flag-criteria.pdf",
  },
  benzo_short_term: {
    title: "Patient.info — Benzodiazepines and Z drugs (UK guidance on short-term use)",
    url: "https://patient.info/health/benzodiazepines-and-z-drugs",
  },
  stomp: {
    title: "NHS England — STOMP (Stopping over-medication of people with a learning disability, autism or both)",
    url: "https://www.england.nhs.uk/learning-disabilities/improving-health/stomp/",
  },
  heuristic: {
    title: "Project heuristic — pattern check pending clinical review",
    url: null,
  },
};

const defaultFmt = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
let fmt = defaultFmt;

// analyze() switches this to week labels for anonymized records.
export function setDateFormatter(fn) {
  fmt = fn || defaultFmt;
}

const names = (meds) => meds.map((m) => m.name).join(", ");

// ---------------------------------------------------------------------------

const sameClass = {
  id: "same-class",
  level: "review",
  basis: ["apmrt"],
  run({ visits }) {
    const flags = [];
    const seen = new Set();
    for (const v of visits) {
      const byClass = groupBy(v.medications, (m) => m.classKey);
      for (const [classKey, meds] of byClass) {
        if (["other", "antipsychotic", "anticholinergic", "beta_blocker"].includes(classKey)) continue;
        const uniq = uniqBy(meds, (m) => m.generic);
        if (uniq.length < 2) continue;
        const key = classKey + ":" + uniq.map((m) => m.generic).sort().join("+");
        if (seen.has(key)) continue;
        seen.add(key);
        flags.push({
          title: `Two or more medicines from the same class (${DRUG_CLASSES[classKey].label})`,
          explanation: `On ${fmt(v.date)} the prescription included ${names(uniq)}, which belong to the same medicine class.`,
          whyItMatters:
            "Medicines from the same class usually work in a similar way. Taking two at once can add side effects without adding much benefit. Sometimes it is done briefly on purpose, for example while switching from one to another.",
          question: `Is it intended that I take ${names(uniq)} together? Is this a temporary switch, and if so, when will one be stopped?`,
          evidence: [fmt(v.date)],
        });
      }
    }
    return flags;
  },
};

const multipleAntipsychotics = {
  id: "multiple-antipsychotics",
  level: "review",
  basis: ["apa_cw", "apmrt"],
  run({ visits }) {
    const hits = visits
      .map((v) => ({ v, meds: uniqBy(v.medications.filter((m) => m.classKey === "antipsychotic"), (m) => m.generic) }))
      .filter((x) => x.meds.length >= 2);
    if (!hits.length) return [];
    return [
      {
        title: "Two or more antipsychotic medicines at the same time",
        explanation: `${hits.length} visit(s) included two or more antipsychotics: ${hits
          .map((x) => `${fmt(x.v.date)} (${names(x.meds)})`)
          .join("; ")}.`,
        whyItMatters:
          "The American Psychiatric Association advises against routinely prescribing two or more antipsychotics together, because evidence of extra benefit is limited and side-effect risks add up. There are specific situations where it is reasonable, such as a planned cross-over between two medicines or after several single-medicine trials have not worked.",
        question:
          "Why do I need more than one antipsychotic? Is this part of a planned switch, and is there a plan to go back to one?",
        evidence: hits.map((x) => fmt(x.v.date)),
      },
    ];
  },
};

const fourOrMore = {
  id: "four-or-more",
  level: "review",
  basis: ["apmrt", "stomp"],
  run({ visits }) {
    const hits = visits.filter(
      (v) => uniqBy(v.medications.filter((m) => PSYCHIATRIC_GROUPS.has(m.group)), (m) => m.generic).length >= 4
    );
    if (!hits.length) return [];
    const max = Math.max(
      ...hits.map((v) => uniqBy(v.medications.filter((m) => PSYCHIATRIC_GROUPS.has(m.group)), (m) => m.generic).length)
    );
    return [
      {
        title: "Four or more psychiatric medicines at once",
        explanation: `${hits.length} visit(s) had four or more psychiatric medicines (up to ${max} at one time), first on ${fmt(
          hits[0].date
        )}.`,
        whyItMatters:
          "The more medicines someone takes, the higher the chance of side effects and interactions, and the harder it becomes to tell which medicine is helping. Programmes such as NHS England's STOMP were created because prescriptions were often continued for years without proper review.",
        question:
          "Can we go through each medicine and what it is for? Are any of them no longer needed, and could we plan a review of the total?",
        evidence: hits.map((v) => fmt(v.date)),
      },
    ];
  },
};

const sedativeLongTerm = {
  id: "sedative-long-term",
  level: "ask",
  basis: ["benzo_short_term"],
  run({ visits }) {
    const flags = [];
    const sedNames = new Set(
      visits.flatMap((v) => v.medications.filter((m) => m.group === "sedative").map((m) => m.generic))
    );
    for (const g of sedNames) {
      const dates = visits.filter((v) => v.medications.some((m) => m.generic === g)).map((v) => v.date);
      if (dates.length < 2) continue;
      const span = daysBetween(dates[0], dates[dates.length - 1]);
      if (span < 56) continue;
      const display = visits.flatMap((v) => v.medications).find((m) => m.generic === g).name;
      flags.push({
        title: `Sedative continued for a long time (${display})`,
        explanation: `${display} appears on prescriptions from ${fmt(dates[0])} to ${fmt(
          dates[dates.length - 1]
        )}, about ${Math.round(span / 7)} weeks.`,
        whyItMatters:
          "Benzodiazepines and sleeping pills (z-drugs) are generally recommended for short-term use, because the body can become dependent on them. Long-term use is sometimes appropriate, but it should be a deliberate decision with regular review. Stopping suddenly can be dangerous, so any reduction must be planned with a doctor.",
        question: `How long do you plan for me to take ${display}? Is there a plan to slowly reduce it, and what should I watch for?`,
        evidence: dates.map(fmt),
      });
    }
    return flags;
  },
};

const sedativeCombo = {
  id: "sedative-combination",
  level: "review",
  basis: ["heuristic"],
  run({ visits }) {
    const hits = visits
      .map((v) => ({ v, meds: uniqBy(v.medications.filter((m) => m.group === "sedative"), (m) => m.generic) }))
      .filter((x) => new Set(x.meds.map((m) => m.classKey)).size >= 2);
    if (!hits.length) return [];
    return [
      {
        title: "A benzodiazepine and a sleeping pill together",
        explanation: `Visit(s) on ${hits.map((x) => fmt(x.v.date)).join(", ")} combined ${names(hits[0].meds)}.`,
        whyItMatters:
          "Combining two kinds of sedatives increases drowsiness, the risk of falls and the risk of dependence.",
        question: "Do I need both of these sedating medicines? Could one of them be enough?",
        evidence: hits.map((x) => fmt(x.v.date)),
      },
    ];
  },
};

const frequentChanges = {
  id: "frequent-changes",
  level: "ask",
  basis: ["heuristic"],
  run({ changes }) {
    let run = 0;
    let best = 0;
    let bestEnd = -1;
    changes.forEach((c, i) => {
      run = c.changed ? run + 1 : 0;
      if (run > best) {
        best = run;
        bestEnd = i;
      }
    });
    if (best < 3) return [];
    const span = changes.slice(bestEnd - best + 1, bestEnd + 1);
    return [
      {
        title: "Medicines changed at many visits in a row",
        explanation: `The prescription changed at ${best} visits in a row, between ${fmt(span[0].from)} and ${fmt(
          span[span.length - 1].to
        )}.`,
        whyItMatters:
          "Many psychiatric medicines take several weeks to show their full effect. Changing them very often can make it hard to know what is working, and can itself cause side effects. Frequent changes are sometimes needed, especially early in treatment or when side effects appear.",
        question:
          "Can you explain the reason for each recent change? How long should I stay on the current plan before we judge whether it works?",
        evidence: span.map((c) => `${fmt(c.from)} → ${fmt(c.to)}`),
      },
    ];
  },
};

const moreMedsNoImprovement = {
  id: "more-meds-no-improvement",
  level: "review",
  basis: ["heuristic"],
  run({ visits, counts }) {
    const withScore = visits.filter((v) => v.wellbeing != null);
    if (withScore.length < 3) return [];
    const first = withScore[0];
    const last = withScore[withScore.length - 1];
    const firstCount = counts[first.index].total;
    const lastCount = counts[last.index].total;
    if (!(lastCount > firstCount && last.wellbeing <= first.wellbeing)) return [];
    return [
      {
        title: "More medicines, but no reported improvement",
        explanation: `Between ${fmt(first.date)} and ${fmt(last.date)} the number of medicines went from ${firstCount} to ${lastCount}, while the wellbeing score went from ${first.wellbeing}/10 to ${last.wellbeing}/10.`,
        whyItMatters:
          "If adding medicines is not helping, it is reasonable to ask whether the diagnosis or approach should be looked at again. This is exactly the situation where an independent second opinion can be valuable.",
        question:
          "I am taking more medicines than before but do not feel better. Could we review the diagnosis and the overall plan? Would you support me getting a second opinion?",
        evidence: [`${fmt(first.date)}: ${first.wellbeing}/10, ${firstCount} medicines`, `${fmt(last.date)}: ${last.wellbeing}/10, ${lastCount} medicines`],
      },
    ];
  },
};

const visitsMoreFrequent = {
  id: "visits-more-frequent",
  level: "ask",
  basis: ["heuristic"],
  run({ changes }) {
    if (changes.length < 3) return [];
    const half = Math.floor(changes.length / 2);
    const early = avg(changes.slice(0, half).map((c) => c.days));
    const late = avg(changes.slice(-half).map((c) => c.days));
    if (!(early > 0 && late < early * 0.6)) return [];
    return [
      {
        title: "Visits are becoming more frequent",
        explanation: `Early on, visits were about ${Math.round(early)} days apart. Recently they are about ${Math.round(
          late
        )} days apart.`,
        whyItMatters:
          "More frequent visits can be the right call when someone is unwell or starting a new medicine. If the person is not getting better, it is fair to ask what each visit is meant to achieve and what the longer-term plan is.",
        question: "What is the goal of seeing you this often? When do you expect we can space visits out again?",
        evidence: changes.map((c) => `${fmt(c.from)} → ${fmt(c.to)}: ${c.days} days`),
      },
    ];
  },
};

const costRising = {
  id: "cost-rising",
  level: "ask",
  basis: ["heuristic"],
  run({ visits }) {
    const withCost = visits.filter((v) => v.cost != null && v.cost > 0);
    if (withCost.length < 3) return [];
    const first = withCost[0];
    const last = withCost[withCost.length - 1];
    if (!(last.cost >= first.cost * 1.5)) return [];
    return [
      {
        title: "Cost per visit has risen sharply",
        explanation: `Recorded cost went from ₹${first.cost} (${fmt(first.date)}) to ₹${last.cost} (${fmt(last.date)}).`,
        whyItMatters:
          "Rising costs are not wrong in themselves, but it helps to know what you are paying for. Generic versions of many medicines are much cheaper, for example through Jan Aushadhi stores, and the NPPA's Pharma Sahi Daam app lets you compare prices.",
        question: "Could you explain the costs? Are generic versions of these medicines suitable for me?",
        evidence: withCost.map((v) => `${fmt(v.date)}: ₹${v.cost}`),
      },
    ];
  },
};

const sideEffects = {
  id: "side-effects",
  level: "ask",
  basis: ["apmrt"],
  run({ visits }) {
    const hits = visits.filter((v) => v.sideEffects);
    if (!hits.length) return [];
    return [
      {
        title: "Side effects were reported",
        explanation: hits.map((v) => `${fmt(v.date)}: “${v.sideEffects}”`).join(" "),
        whyItMatters:
          "Side effects are important information for your doctor. Bothersome side effects are one of the common reasons to request a medication review.",
        question: "I have been experiencing these side effects. Could any of my medicines be causing them, and what can we do about it?",
        evidence: hits.map((v) => fmt(v.date)),
      },
    ];
  },
};

const housekeeping = {
  id: "housekeeping",
  level: "info",
  basis: [],
  run({ visits, unrecognized }) {
    const flags = [];
    if (visits.length < 3) {
      flags.push({
        title: "Add more visits to see patterns",
        explanation: `Only ${visits.length} visit(s) entered. Patterns over time need at least 3 visits, ideally 4–5.`,
        whyItMatters: "Most of the checks look at how things change between visits.",
        question: null,
        evidence: [],
      });
    }
    if (unrecognized.length) {
      flags.push({
        title: "Some medicine names were not recognized",
        explanation: `Not recognized: ${unrecognized.join(", ")}. These may be brand names. Choose a class for them to include them in the checks.`,
        whyItMatters: "Unrecognized medicines are left out of class-based checks.",
        question: `What is the generic name of ${unrecognized.join(", ")}, and what is it for?`,
        evidence: [],
      });
    }
    if (visits.every((v) => v.wellbeing == null)) {
      flags.push({
        title: "No wellbeing scores entered",
        explanation: "Adding a simple 1–10 score for how the person felt at each visit lets the tool compare medicines against progress.",
        whyItMatters: "Without it, the tool cannot tell whether things are improving.",
        question: null,
        evidence: [],
      });
    }
    return flags;
  },
};

export const RULES = [
  multipleAntipsychotics,
  sameClass,
  fourOrMore,
  sedativeCombo,
  moreMedsNoImprovement,
  sedativeLongTerm,
  frequentChanges,
  visitsMoreFrequent,
  costRising,
  sideEffects,
  housekeeping,
];

// ---------------------------------------------------------------------------

function groupBy(arr, fn) {
  const m = new Map();
  for (const x of arr) {
    const k = fn(x);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(x);
  }
  return m;
}

function uniqBy(arr, fn) {
  const seen = new Set();
  return arr.filter((x) => (seen.has(fn(x)) ? false : (seen.add(fn(x)), true)));
}

function avg(xs) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
