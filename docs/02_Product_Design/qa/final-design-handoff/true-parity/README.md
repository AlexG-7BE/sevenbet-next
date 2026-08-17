# Final Design Handoff True-Parity Evidence

## Scope

- **Detected:** 24 Founder-correction surfaces were captured at `1440`, `1024`, `430` and `390` CSS pixels: 96 reference/runtime/diff measurements in total.
- **Detected:** every implementation image is named `runtime-implementation.webp`; the rejected alternate-renderer evidence is not used.
- **Detected:** the capture ran against an optimized `next start` build with Program AI enabled. Dynamic pages are captured from their real route components, DOM and CSS.
- **Detected:** `capture-manifest.json` records the renderer boundary and `visual-diff-metrics.json` contains all 96 descriptive measurements.

## Runtime-integrity boundary

Reference images come from the supplied `.dc.html` boards. Implementation images come from the normal application routes. The harness fails a dynamic capture if `[data-handoff-page]` is present or if the expected `data-runtime-renderer` marker is absent.

The optional `visualFixture=true` request changes local DTO/service values only when the local process also has `B4GAMBLE_HANDOFF_VISUAL_FIXTURE=true`. [`visual-data-fixture.ts`](../../../../../lib/final-handoff/visual-data-fixture.ts) contains no markup, `HandoffPage`, CSS or component-selection branch; every Vercel environment is denied. Preview and local evidence therefore use the same real runtime presentation tree.

Programme evidence uses test DTO interception only to reach intake, Starting Point ready/registration and Dashboard states. `ProgramAiExperience` remains the orchestration boundary and `ProgramAiFinalPresentation` supplies the real visible Mission 01 composition. The harness captures the full responsive production canvas, not a centred 429px design-board frame.

## Aggregate metrics

These are descriptive pixel measurements, not acceptance thresholds.

| Scope | Frames | Mean absolute difference | Changed-pixel ratio |
| --- | ---: | ---: | ---: |
| All surfaces / all widths | 96 | 0.150942 | 0.199520 |
| 1440px | 24 | 0.109500 | 0.146536 |
| 1024px | 24 | 0.136364 | 0.176892 |
| 430px | 24 | 0.170988 | 0.226957 |
| 390px | 24 | 0.186917 | 0.247694 |
| Home / all widths | 4 | 0.056809 | 0.122341 |
| Programme states / all widths | 12 | 0.504139 | 0.608062 |

## Four-width surface averages

| Surface | Mean absolute difference | Changed-pixel ratio |
| --- | ---: | ---: |
| Home | 0.056809 | 0.122341 |
| 10 Steps | 0.035128 | 0.050104 |
| Best Offers | 0.270823 | 0.343028 |
| Casinos | 0.140043 | 0.193833 |
| Contextual comparison | 0.121026 | 0.248315 |
| Casino Review | 0.243087 | 0.297633 |
| Bonuses | 0.289691 | 0.363606 |
| Bonus Guide | 0.011153 | 0.016436 |
| Learn | 0.018335 | 0.028742 |
| Learn Article | 0.130515 | 0.172516 |
| Help | 0.104175 | 0.150870 |
| Programme intake | 0.523215 | 0.597246 |
| Programme registration | 0.638195 | 0.768343 |
| Programme Dashboard | 0.351007 | 0.458599 |

## Known visual limitations

- The Programme source boards are fixed design-board crops. The implementation intentionally measures higher because Founder authority requires the real full-width responsive canvas and prohibits grey desktop board chrome.
- Best Offers, Casino Review and Bonuses retain current governed DTO density, evidence, filtering and action contracts rather than illustrative record counts.
- The Bonuses calculator remains a simplified explanatory runtime composition relative to the fuller illustrative board; its current amount, wagering, basis and game-weighting interactions are regression-tested.
- Learn Article uses the current published Learning record and shared runtime article template rather than the handoff's unrelated static Bonus Guide body.
- Missing operator media renders the neutral real-runtime fallback; no image is fabricated for a metric.
- No artifact is a Founder acceptance declaration or Production approval.
