# Comfort, trust and colour — research notes (v0.3)

**Question:** What makes a person — possibly unwell, possibly alone — comfortable entering sensitive health information and sharing it with a doctor?

**Honest scope:** This is a desk review of published studies and design guidance, not a study of our own users. Most colour research was done on rooms and lighting, not apps, and almost none of it in India. The findings set sensible defaults; **only testing with real users in our context can confirm them.** The survey in [comfort-survey.md](comfort-survey.md) is designed for that.

---

## What the evidence says

### 1. First impressions are visual — and decide whether people stay
In a study of how people judged health websites, design accounted for about 94% of the reasons people *rejected* a site at first glance (cluttered layout, poor colours, ads, corporate look), while *trust* in the sites they kept came mostly from content (clear, unbiased, relevant information). Small study (15 people), but a clear pattern: **design gets you past the first 10 seconds; honest content earns trust after that.**
Source: Sillence et al., CHI 2004 — [Trust and mistrust of online health sites](https://hci.rwth-aachen.de/materials/conferences/CHI2004/1p663.pdf)

### 2. Show the form on one page rather than a chat or wizard
A usability study of health-care referral forms compared one page, seven screens, and a chatbot-style form. The single page scored best for usability (SUS 76 vs 67 and 57) and had the fewest errors (about 21 vs 35 and 83). People liked seeing everything at once; the chatbot made it hard to go back and fix answers.
Source: JMIR Human Factors 2021 — [Comparing Single-Page, Multipage, and Conversational Digital Forms in Health Care](https://humanfactors.jmir.org/2021/2/e25787)

### 3. Low-arousal, muted colour; validating words; clearly optional extras
Design guidance for mental-health apps recommends muted, low-saturation colours (no neon or flashing), supportive opening language ("it's okay to feel this way"), asking only for what's needed now, labelling optional steps clearly, offering easy "delete all data", and simple choices with few options.
Source: Smashing Magazine 2026 — [An Empathy-Centred UX Framework for Mental Health Apps](https://smashingmagazine.com/2026/02/building-empathy-centred-ux-framework-mental-health-apps/)

### 4. Blue is liked; grey is how low mood feels
In the Manchester Color Wheel study, people with anxiety or depression most often chose **blue as their favourite colour**, while most chose a **shade of grey to describe their mood**; healthy people tended to pick yellow for mood.
Source: University of Manchester, 2010 — [ScienceDaily summary](https://sciencedaily.com/releases/2010/02/100208211926.htm)
→ Implication for us: soft blues and greens, warm off-white background — **avoid a grey, washed-out interface**, which may mirror low mood.

### 5. Red means danger in apps — but celebration in India
Health-app colour guidance links red with urgency and danger, and warns that red/green pairs fail for colour-blind users (around 8% of men). In Indian culture red is auspicious (weddings, festivals) and **white can mean mourning**. Colour meanings vary by region and community.
Sources: UXmatters 2024 — [Psychology of color in health and wellness apps](https://www.uxmatters.com/mt/archives/2024/07/leveraging-the-psychology-of-color-in-ux-design-for-health-and-wellness-apps.php); Studio Matrx — [Colour, culture and association](https://www.studiomatrx.org/students/colour-theory-and-application/colour-culture-and-association)
→ Implication: don't use alarm-red for our flags; don't use stark white; never rely on colour alone.

### 6. Privacy reassurance at the wrong moment can backfire
In an online experiment with 611 people, privacy notices shown *right before* health-history questions were associated with **less** truthful answers — possibly because they reminded people of the risk. The authors suggest giving privacy information well *before* sensitive questions.
Source: Dryad dataset — [Do privacy assurances work? A study of truthfulness in healthcare history data collection](https://datadryad.org/dataset/doi:10.5061/dryad.qrfj6q5k8)
→ Implication: explain privacy **once, up front** (a welcome card), not as warnings beside every field.

---

## What we changed in v0.3 because of this

| Finding | Change in the app |
|---|---|
| One page beats wizards and chatbots | Kept everything on one page; added a simple 1-2-3 step guide at the top. |
| Ask only what's needed; optional is clearly optional | Each visit asks for: date, how they felt, medicines. Everything else is marked *optional* or tucked under "More details". |
| Fewer, simpler choices | "How were they feeling?" is now five buttons (Very low → Very good) instead of a 1–10 number box. |
| Multiple input methods reduce effort | Three ways to add medicines: photo of the bill, paste text, or "same as last visit". |
| Validating language | Welcome: *"It's okay to have questions about care."* Flag levels renamed from REVIEW/ASK/INFO to **Worth a second look / Ask at next visit / Note**. |
| Privacy explained once, before data entry | A one-time welcome card with three promises (private, no names, no blame) instead of repeated warnings. |
| Muted colours; avoid grey; avoid alarm red | Warm off-white background, calm teal and soft blue; "worth a second look" uses amber, not red; every flag also has a text label. |
| Easy delete | "Clear" renamed **Delete all my data**. |

## What we still don't know (to test)

- Do people in Chennai and elsewhere in India read our teal/blue/amber palette as calm and trustworthy?
- Is five-step feeling enough, or do people want to say more?
- Does the photo reader save effort, or does checking its mistakes make it more work?
- Do people trust "nothing is uploaded"? What would make them believe it?
- Does the Doctor summary actually get used in appointments — and how do doctors react?
