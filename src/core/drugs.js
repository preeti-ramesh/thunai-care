// Drug class dictionary for common psychiatric medications.
//
// Generic names only. Indian prescriptions often use brand names; users can
// pick a class manually when a name is not recognized (see normalize.js).
//
// IMPORTANT: This list must be reviewed by a qualified psychiatrist or
// pharmacist before any public release. See docs/red-flag-criteria.md.

export const DRUG_CLASSES = {
  ssri: { label: "SSRI antidepressant", group: "antidepressant" },
  snri: { label: "SNRI antidepressant", group: "antidepressant" },
  tca: { label: "Tricyclic antidepressant", group: "antidepressant" },
  other_antidepressant: { label: "Other antidepressant", group: "antidepressant" },
  antipsychotic: { label: "Antipsychotic", group: "antipsychotic" },
  benzodiazepine: { label: "Benzodiazepine (sedative / anti-anxiety)", group: "sedative" },
  z_drug: { label: "Sleeping pill (Z-drug)", group: "sedative" },
  mood_stabilizer: { label: "Mood stabilizer", group: "mood_stabilizer" },
  stimulant: { label: "ADHD medication", group: "adhd" },
  anticholinergic: { label: "Side-effect medicine (anticholinergic)", group: "supportive" },
  beta_blocker: { label: "Beta blocker", group: "supportive" },
  gabapentinoid: { label: "Gabapentinoid", group: "other" },
  other: { label: "Other / not sure", group: "other" },
};

// generic name -> class key. Lowercase. Include common spelling variants.
export const DRUGS = {
  // SSRIs
  fluoxetine: "ssri",
  sertraline: "ssri",
  escitalopram: "ssri",
  citalopram: "ssri",
  paroxetine: "ssri",
  fluvoxamine: "ssri",
  // SNRIs
  venlafaxine: "snri",
  desvenlafaxine: "snri",
  duloxetine: "snri",
  // Tricyclics
  amitriptyline: "tca",
  nortriptyline: "tca",
  imipramine: "tca",
  clomipramine: "tca",
  dosulepin: "tca",
  dothiepin: "tca",
  // Other antidepressants
  mirtazapine: "other_antidepressant",
  bupropion: "other_antidepressant",
  trazodone: "other_antidepressant",
  vortioxetine: "other_antidepressant",
  agomelatine: "other_antidepressant",
  // Antipsychotics
  olanzapine: "antipsychotic",
  quetiapine: "antipsychotic",
  risperidone: "antipsychotic",
  aripiprazole: "antipsychotic",
  haloperidol: "antipsychotic",
  clozapine: "antipsychotic",
  amisulpride: "antipsychotic",
  paliperidone: "antipsychotic",
  ziprasidone: "antipsychotic",
  lurasidone: "antipsychotic",
  chlorpromazine: "antipsychotic",
  trifluoperazine: "antipsychotic",
  // Benzodiazepines and close relatives
  alprazolam: "benzodiazepine",
  clonazepam: "benzodiazepine",
  lorazepam: "benzodiazepine",
  diazepam: "benzodiazepine",
  chlordiazepoxide: "benzodiazepine",
  nitrazepam: "benzodiazepine",
  clobazam: "benzodiazepine",
  etizolam: "benzodiazepine", // thienodiazepine; acts like a benzodiazepine
  // Z-drugs
  zolpidem: "z_drug",
  zopiclone: "z_drug",
  eszopiclone: "z_drug",
  // Mood stabilizers
  lithium: "mood_stabilizer",
  valproate: "mood_stabilizer",
  "sodium valproate": "mood_stabilizer",
  divalproex: "mood_stabilizer",
  carbamazepine: "mood_stabilizer",
  oxcarbazepine: "mood_stabilizer",
  lamotrigine: "mood_stabilizer",
  // ADHD
  methylphenidate: "stimulant",
  atomoxetine: "stimulant",
  // Supportive
  trihexyphenidyl: "anticholinergic",
  benztropine: "anticholinergic",
  propranolol: "beta_blocker",
  // Gabapentinoids
  pregabalin: "gabapentinoid",
  gabapentin: "gabapentinoid",
};

// Groups counted as "psychiatric medications" for the total-count rule.
export const PSYCHIATRIC_GROUPS = new Set([
  "antidepressant",
  "antipsychotic",
  "sedative",
  "mood_stabilizer",
  "adhd",
]);

// Common Indian brand names -> generic name(s).
//
// STARTER LIST — NOT YET VERIFIED. Must be checked by a pharmacist before any
// public use. Brands change, and the same brand name can differ between
// manufacturers. The user can always correct a name or choose a class manually.
//
// A brand that maps to more than one generic is a fixed-dose combination;
// each ingredient is counted separately in the checks.
export const BRANDS = {
  // SSRIs
  nexito: ["escitalopram"],
  cipralex: ["escitalopram"],
  stalopam: ["escitalopram"],
  rexipra: ["escitalopram"],
  daxid: ["sertraline"],
  serta: ["sertraline"],
  zosert: ["sertraline"],
  serlift: ["sertraline"],
  fludac: ["fluoxetine"],
  prodep: ["fluoxetine"],
  flunil: ["fluoxetine"],
  pexep: ["paroxetine"],
  fluvoxin: ["fluvoxamine"],
  // SNRIs and others
  venlor: ["venlafaxine"],
  veniz: ["venlafaxine"],
  duzela: ["duloxetine"],
  dulane: ["duloxetine"],
  mirtaz: ["mirtazapine"],
  mirnite: ["mirtazapine"],
  tryptomer: ["amitriptyline"],
  // Benzodiazepines and sleeping pills
  rivotril: ["clonazepam"],
  clonotril: ["clonazepam"],
  lonazep: ["clonazepam"],
  alprax: ["alprazolam"],
  restyl: ["alprazolam"],
  trika: ["alprazolam"],
  ativan: ["lorazepam"],
  etilaam: ["etizolam"],
  etizola: ["etizolam"],
  zolfresh: ["zolpidem"],
  stilnoct: ["zolpidem"],
  // Antipsychotics
  qutipin: ["quetiapine"],
  seroquel: ["quetiapine"],
  oleanz: ["olanzapine"],
  oliza: ["olanzapine"],
  sizodon: ["risperidone"],
  risdone: ["risperidone"],
  arip: ["aripiprazole"],
  serenace: ["haloperidol"],
  sizopin: ["clozapine"],
  // Mood stabilizers
  licab: ["lithium"],
  lithosun: ["lithium"],
  valparin: ["valproate"],
  encorate: ["valproate"],
  dicorate: ["divalproex"],
  tegretol: ["carbamazepine"],
  mazetol: ["carbamazepine"],
  lamitor: ["lamotrigine"],
  oxetol: ["oxcarbazepine"],
  // Supportive
  pacitane: ["trihexyphenidyl"],
  inderal: ["propranolol"],
  ciplar: ["propranolol"],
  // Combinations (check longest names first)
  "nexito plus": ["escitalopram", "clonazepam"],
};
