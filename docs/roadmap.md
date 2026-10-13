# Roadmap

All stages follow [docs/trust-and-safety.md](trust-and-safety.md).

The long-term idea has four stages. Each stage only makes sense once the one before it works.

## Stage 1 — See the pattern (v0.1 → v0.2, in progress)
Patients and families record prescriptions over time. The tool shows the timeline, flags patterns from published guidance, and turns them into questions for the doctor.

Done:
- [x] v0.1 — timeline, pattern checks, questions for the doctor
- [x] v0.2 — paste prescription text, doctor summary, anonymous export, Trust & Safety principles
- [x] v0.3 — photo of pharmacy bill (on-device), starter Indian brand list, graph, comfort-first design, user survey
- [x] v0.4 — download-and-double-click; terminal start with no installs; plain-text guide

Next steps:
- [ ] Clinical review of all red-flag rules and the drug list by 2–3 practising psychiatrists
- [ ] Pharmacist review and expansion of the Indian brand list
- [ ] Run the comfort survey with 10–20 people and write up results
- [ ] Option to host the photo reader inside the app (fully offline)
- [ ] Dose-range checks (after clinical review)
- [ ] Tamil, Hindi and other regional languages
- [ ] Handwritten prescriptions and PDFs (photo reading currently works best on printed bills)
- [ ] Test with 15–20 families; record what helped and what confused them

## Stage 2 — Independent review
A patient can share their timeline with a qualified, independent psychiatrist for a written second opinion.

Design principles:
- Reviewers are paid a **flat fee per review, regardless of outcome**, so there is no incentive to find fault.
- Reviewer quality is measured by **accuracy** (spot-checked by a second reviewer), not by how many problems they find.
- Most reviews are expected to say "this looks reasonable — here's what to ask." That outcome protects good doctors too.
- Explicit patient consent for every share. Compliance with India's telemedicine guidelines and data protection law.

## Stage 3 — Raise a concern (separate, opt-in track)
Where a review finds serious problems, help the patient understand their options: switching doctors, complaints under the Mental Healthcare Act 2017, or referral to legal aid and patient-rights organisations. Not a lawsuit pipeline.

## Stage 4 — Trusted care network
Redirect patients to well-reviewed, ethical practitioners. Possible compensation mechanisms to be designed with legal experts.

## Never
- Public "naming and shaming" of individual doctors.
- Selling or sharing patient data.
- Advice to stop or change medicines without a doctor.
