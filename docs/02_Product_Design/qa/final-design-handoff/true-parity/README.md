# Final Design Handoff True-Parity Evidence

## Scope

- **Detected:** the Founder correction set contains 24 1440px surfaces. Every surface has `reference`, `runtime-implementation` and amplified `diff` WebP evidence.
- **Detected:** the 12 Founder-designated surfaces also have `side-by-side` evidence: Home, three equivalent Programme states, Best Offers, Casinos, contextual comparison, Casino Review, Bonuses, Bonus Guide, Learn and Help.
- **Detected:** obsolete `implementation.webp` captures from the rejected alternate-renderer method were removed. Only `runtime-implementation.webp` is implementation evidence in this directory.
- **Detected:** `capture-manifest.json` records `renderer: REAL_RUNTIME` for every dynamic surface and equivalent Programme state. `visual-diff-metrics.json` records the 24 honest 1440px measurements.

## Runtime-integrity boundary

Reference images come from the original supplied `.dc.html` boards. Implementation images come from the normal application routes and their actual React components. The harness fails a dynamic capture if `[data-handoff-page]` is present or if the expected `data-runtime-renderer` marker is absent.

The optional `visualFixture=true` request changes DTO/service values only when a local process also has `B4GAMBLE_HANDOFF_VISUAL_FIXTURE=true`. [`visual-data-fixture.ts`](../../../../../lib/final-handoff/visual-data-fixture.ts) contains no generated markup, `HandoffPage`, or presentation branch; it is denied in every Vercel environment. The same component, DOM and CSS tree therefore renders local QA data, ordinary Preview data and eventual Production data.

Programme evidence uses equivalent state-specific crops from `Programme.dc.html` for intake, Starting Point ready/registration and dashboard. Test DTO interception supplies state only; the real `ProgramAiExperience` presentation remains in use and Programme auth, persistence, claim, XP and Mission authority are unchanged.

## Recorded 1440px metrics

| Surface | Mean absolute difference | Changed-pixel ratio |
| --- | ---: | ---: |
| Home | 0.036517 | 0.084868 |
| Programme intake | 0.087821 | 0.133881 |
| Programme registration | 0.080752 | 0.137496 |
| Programme dashboard | 0.095699 | 0.191110 |
| Best Offers | 0.112632 | 0.151852 |
| Casinos | 0.215611 | 0.263941 |
| Contextual comparison | 0.158216 | 0.368670 |
| Casino Review | 0.206991 | 0.245548 |
| Bonuses | 0.205759 | 0.258461 |
| Bonus Guide | 0.009411 | 0.012959 |
| Learn | 0.013952 | 0.017511 |
| Help | 0.035189 | 0.051811 |

The remaining measurements are retained in `visual-diff-metrics.json`. These are descriptive pixel measurements, not acceptance thresholds.

## Known visual limitations

- Learn Article intentionally uses the current published Learning model and its real shared article template rather than the handoff's unrelated static Bonus Guide body; its metric is correspondingly high (`0.391085` MAD).
- Casino Review and Bonuses retain governed evidence, filtering and action contracts. Their dynamic record density differs from the illustrative boards.
- The current Bonuses calculator is a simplified explanatory calculator rather than the fuller interactive reference composition.
- Programme retains the approved adult/Terms access gate, just-in-time sensitive-input authority and protected Help affordance.
- Missing operator media uses the neutral real-runtime fallback; no image is fabricated for a metric.
- No artifact is a Founder acceptance declaration or Production approval.
