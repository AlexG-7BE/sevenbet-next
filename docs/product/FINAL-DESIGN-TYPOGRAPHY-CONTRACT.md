# Final Design Typography Contract

Status: **Approved implementation contract for Draft PR #76; not merged; Production unchanged.**

Authority: the final B4GAMBLE handoff and Founder typography direction. This contract separates expressive composition from editorial reading and functional decision-making. It does not normalise page heroes, replace the Archivo / Instrument Serif pairing, or authorise a new visual direction.

## 1. EXPRESSIVE DISPLAY SYSTEM

Display type is compositional. Its scale responds to photography, negative space, section height and adjacent media. The handoff remains the route-specific authority; the ranges below are vocabulary, not a rule that every page must use the same H1.

| Role | Font family | Size / fluid range | Line height | Weight | Case | Tracking | Intended use | Forbidden use |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Display XXL | Archivo | `clamp(58px, 7.4vw, 116px)`; handoff may exceed 120px | 0.88–1.0 | 850–900 | Usually uppercase | -0.065em to -0.035em | Typography-led heroes and oversized graphic statements | Form labels, controls, terms, article prose |
| Display XL | Archivo | `clamp(52px, 6vw, 96px)` | 0.88–1.0 | 800–900 | Usually uppercase | -0.06em to -0.025em | Major page and cinematic section statements | Replacing a page-specific larger or smaller handoff composition merely for consistency |
| Display LG | Archivo | `clamp(40px, 4.8vw, 72px)` | 0.9–1.05 | 800–900 | Handoff-defined | -0.055em to -0.015em | Major section headings and numerical/display moments | Functional labels, long prose |
| Serif Display XL | Instrument Serif italic | `clamp(44px, 5.4vw, 88px)` | 0.9–1.0 | 400 | Sentence / lowercase contrast | Normal to -0.02em | Hero accent lines such as “by terms.” | Navigation, controls, terms, evidence states |
| Serif Display LG | Instrument Serif italic | `clamp(32px, 3vw, 52px)` | 0.92–1.05 | 400 | Sentence / lowercase contrast | Normal | Editorial emphasis and emotional contrast | Indiscriminate replacement of Archivo body or UI text |

Accepted major examples include `SEE / the pattern.` and `VALUE, MEASURED / by terms.`. Their differences in scale and family are intentional and must not be flattened.

## 2. EDITORIAL SYSTEM

| Role | Font family | Size / fluid range | Line height | Weight | Case | Tracking | Intended use | Forbidden use |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Heading LG | Archivo | `clamp(34px, 4vw, 60px)` | 0.96–1.12 | 750–900 | Handoff-defined | -0.045em to -0.01em | Editorial section headings | One universal H1 across unlike compositions |
| Heading MD | Archivo | `clamp(28px, 3vw, 44px)` | 1.0–1.16 | 700–850 | Handoff-defined | -0.035em to 0 | Card groups and article sections | Dense functional rows |
| Heading SM / Card Title | Archivo | `clamp(22px, 2vw, 30px)` | 1.08–1.25 | 650–850 | Handoff-defined | -0.025em to 0 | Card headlines and editorial subheads | Material terms or controls |
| Editorial Lead | Archivo | 18–20px | 27–30px | 400–600 | Sentence | Normal | Section introductions, review summaries | Legal microcopy or compact controls |
| Body | Archivo | 16px | 24–26px | 400–550 | Sentence | Normal | Article and review prose | Shrinking to fit fixed card geometry |
| Body Small | Archivo | 14px | 20–21px | 400–600 | Sentence | Normal | Supporting explanations and compact prose | Material terms below 14px |

Editorial hierarchy may vary where the handoff composition requires it. Text must wrap and containers must grow rather than reverting to unreadable type.

## 3. FUNCTIONAL SYSTEM

| Role | Font family | Size / fluid range | Line height | Weight | Case | Tracking | Intended use | Forbidden use |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Functional Meaning | Archivo | 14px minimum | 20–21px | 500–750 | Sentence or short uppercase | 0 to 0.05em | Terms, eligibility, comparison values, calculator explanations, availability and evidence states | Any sub-14px presentation of decision-relevant information |
| Input / Select | Archivo | 15px desktop; 16px mobile | 22–24px | 400–650 | Sentence | Normal | Inputs, selects and typed values | Mobile values below 16px; decorative family |
| Control / Button | Archivo | 14–15px | 20px | 550–800 | Handoff-defined | 0 to 0.05em | Buttons, tabs, segmented controls and actionable links | 9–13px controls; excessive tracking that impairs reading |
| Functional Label | Archivo | 13–14px; prefer 14px when decision-relevant | 18–20px | 650–800 | Short uppercase permitted | 0.03em to 0.08em | Field labels, comparison headers and compact term labels | Sub-12px labels; 0.12em+ tracking on meaningful labels |
| Meta | Archivo | 13px | 18–19px | 400–700 | Sentence or short uppercase | 0 to 0.08em | Dates, source state, counts and supporting metadata | Terms, eligibility, actions or calculator results |
| Legal / Non-critical Disclosure | Archivo | 12–13px | 18–20px | 400–650 | Sentence | Normal to 0.05em | Non-critical legal notes and disclosures | Offer conditions, controls, eligibility or safety actions |

## 4. MINIMUM READABILITY FLOORS

- Functional and decision-relevant text: **14px**.
- Inputs and selects: **15px desktop; 16px mobile**.
- Buttons, tabs and segmented controls: **14px**.
- Short functional labels: **13px**, with **14px preferred** for decision fields.
- Metadata: **13px**.
- Legal/non-critical disclosure: **12px** minimum.
- Editorial body: **16px**; body small: **14px**.
- Display typography is governed by composition and is not constrained by the functional floor.
- Important 14px text must retain usable contrast; muted hierarchy cannot become unreadable hierarchy.

The static audit parses both `px` and `rem` declarations plus `font` shorthands. It fails every final-public sub-12px declaration that is not on the exact decorative allowlist. Runtime Playwright checks computed sizes at 1440, 1024, 430 and 390px.

## 5. DECORATIVE EXCEPTION POLICY

Sub-12px type is permitted only when it is non-essential, repeated by a readable heading/body label, and explicitly allowlisted in `scripts/typography-audit.mjs`. It must not help the user choose, operate, compare, understand an offer, understand calculator output, determine eligibility, or understand an action.

The approved allowlist is limited to:

- two 8px pros/cons list glyph markers in `CasinoProfile.module.css`;
- Home’s 9px hero kicker, 11px carousel card eyebrow and 11px embedded product-theatre screen text;
- Bonus Directory’s four 10–11px decorative eyebrows/notations in non-decision compositions; and
- the 8px decorative comparison-row ordinal, whose list position is not required to understand the card.

Any selector/value change makes the allowlist stale and fails the audit. No functional, decision, body, control, status, term, eligibility or Help text is allowlisted.

## 6. ARCHIVO / INSTRUMENT SERIF ROLES

Archivo is the primary display and UI family: navigation, labels, controls, body, evidence, terms and functional values. Instrument Serif is expressive emphasis: italic hero phrases, editorial accents and emotional/graphic contrast. Instrument Serif must not be applied to dense functional UI; Archivo must not replace intentional serif accents for consistency.

## 7. RESPONSIVE DISPLAY TYPOGRAPHY GUIDANCE

- Preserve the handoff’s page-specific line breaks, hierarchy and negative-space strategy.
- A text-only hero may remain much larger than a photographic hero because the type carries the composition.
- Display tokens are fluid references, not a global replacement for route-specific `clamp()` values.
- Supporting display microcopy may remain visually restrained when decorative and readable; meaningful supporting copy follows editorial or functional floors.
- On narrow screens, reflow, wrapping, taller rows and growing cards are preferred to reducing functional text.
- Mobile inputs remain at least 16px. Controls remain at least 14px. Horizontal overflow is a test failure.
- `VALUE, MEASURED / by terms.` and other approved Archivo / Instrument Serif contrasts are regression targets, not candidates for normalisation.
