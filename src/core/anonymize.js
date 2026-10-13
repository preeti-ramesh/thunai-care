// Produces a copy of a record that is safe to share with an independent
// reviewing doctor. See docs/trust-and-safety.md.
//
// - Patient nickname           → "Anonymous patient"
// - Doctor names / labels      → "Doctor A", "Doctor B" … (order of first appearance)
// - Calendar dates             → shifted so the first visit is Week 0
// - Free-text visit notes      → removed (may contain names or places)
// - Family observer names      → "Family / friend"
// - Medicines, doses, feeling scores, side effects, diagnosis → kept
//
// Cost is kept because it is part of the pattern; it is not identifying alone.

const EPOCH = Date.UTC(2000, 0, 3); // a fixed Monday, so shifted dates are obviously synthetic

export function anonymize(record) {
  const visits = [...(record.visits || [])]
    .filter((v) => v && v.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const base = visits.length ? new Date(visits[0].date).getTime() : 0;
  const shift = (d) => new Date(EPOCH + (new Date(d).getTime() - base)).toISOString().slice(0, 10);

  const doctorMap = new Map();
  const doctorLabel = (raw) => {
    const k = String(raw || "").trim().toLowerCase();
    if (!k) return "";
    if (!doctorMap.has(k)) doctorMap.set(k, `Doctor ${String.fromCharCode(65 + doctorMap.size)}`);
    return doctorMap.get(k);
  };

  return {
    patientLabel: "Anonymous patient",
    datesShifted: true,
    visits: visits.map((v) => ({
      date: shift(v.date),
      doctor: doctorLabel(v.doctor),
      diagnosis: v.diagnosis || "",
      cost: v.cost ?? "",
      wellbeing: v.wellbeing ?? "",
      sideEffects: v.sideEffects || "",
      notes: "",
      medications: (v.medications || []).map((m) => ({ name: m.name, dose: m.dose || "", classKey: m.classKey || "" })),
    })),
    familyObservations: (record.familyObservations || [])
      .filter((o) => o && o.text)
      .map((o) => ({ by: "Family / friend", date: o.date && visits.length ? shift(o.date) : "", text: o.text })),
  };
}

// Label for a shifted date: "Wk 0", "Wk 6" …
export function weekLabel(isoDate) {
  const days = Math.round((Date.parse(isoDate) - EPOCH) / 86400000);
  return `Wk ${Math.round(days / 7)}`;
}
