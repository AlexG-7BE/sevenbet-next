# Founder Mobile Review

This evidence set was captured from the real local application runtime at `360×800`, `390×844` and `430×932`. Dynamic commercial screenshots use the local-only `visualFixture=true` data boundary with `B4GAMBLE_HANDOFF_VISUAL_FIXTURE=true`; that boundary changes DTO values only. The capture harness rejects dynamic `HandoffPage` output and requires the normal `best-offers`, `casinos`, `casino-review`, `bonuses` and `programme` runtime markers.

Programme voice and dashboard frames use controlled API responses to expose otherwise session-dependent states. The visible components remain `ProgramAiExperience`, `ProgramAiFinalPresentation` and `ProgramAiHomeScreen`; no legacy `ActiveControlProgramme` or static Programme board is used.

## Route-by-route review

| Route | LAYOUT | READABILITY | TOUCH | CLIPPING | FIXED/STICKY | MOTION | RESULT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/best-offers` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/casinos` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/casino/demo-northstar` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/bonuses` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/program` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/10-steps` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/learn` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/learn/casino-bonuses/welcome-bonus-terms` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/bonus-guide` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/responsible-gambling` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/help` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/methodology` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/about` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/faq` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/affiliate-disclosure` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/contact` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/privacy` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/terms` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `/login` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

`MOTION` includes visible-content preservation under reduced motion. Reversal, chameleon-header and fail-visible behaviour are enforced by the existing interaction/systemic browser suites; a still image is not presented as proof of motion.

## Evidence map

| File | Runtime state |
| --- | --- |
| `01-home-390.webp` | Home top at 390×844 |
| `02-best-offers-390.webp` | Best Offers top at 390×844 |
| `03-casinos-390.webp` | Casinos top at 390×844 |
| `04-casino-review-top-390.webp` | Real Casino Review decision hero at 390×844 |
| `05-casino-review-editorial-390.webp` | Real Casino Review editorial section at 390×844 |
| `06-bonuses-top-390.webp` | Bonuses expressive hero at 390×844 |
| `07-bonuses-filters-390.webp` | Open bounded bonus-filter sheet at 390×844 |
| `08-bonuses-calculator-390.webp` | Calculator with deterministic €70,000 effective turnover at 390×844 |
| `09-learn-390.webp` | Learn top at 390×844 |
| `10-programme-voice-390.webp` | Real canonical Programme recording state at 390×844 |
| `11-programme-dashboard-390.webp` | Real canonical Programme dashboard at 390×844 |
| `12-ten-steps-390.webp` | 10 Steps top at 390×844 |
| `best-offers-360.webp` through `programme-360.webp` | Required 360×800 narrow-width evidence |
| `best-offers-430.webp` through `bonuses-430.webp` | Required 430×932 wide-mobile evidence |

## Measured result

- 20 routes × 7 viewports = **140** successful geometry audits.
- Mobile sheet/dialog audit: **5** viewport widths, **3** interaction surfaces per width, all PASS.
- 390px functional journey: commercial discovery, comparison, Casino Review FAQ, deterministic Bonus Calculator, Learn and canonical Programme, PASS.
- Final geometry issues: **0** document overflow, **0** offscreen controls, **0** text-clipping findings, **0** undersized mobile UI targets and **0** selected fixed-control collisions.
- Committed screenshots: **21 WebP files** plus `capture-manifest.json`.

## Known limits

- The automated geometry and screenshots use Chromium. Physical-device Safari, Firefox and assistive-technology review remain release activities.
- External OAuth, affiliate destinations, email delivery and provider dashboards are intentionally not exercised.
- Controlled evidence data is not current public inventory and is never a Production configuration.
- This folder is review evidence, not a declaration of Founder acceptance, merge approval or Production release approval.
