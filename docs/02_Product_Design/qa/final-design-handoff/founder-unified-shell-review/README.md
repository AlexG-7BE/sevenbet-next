# Founder unified-shell review

Classification: **Detected** from the original supplied `Home.dc.html` / `Learn.dc.html` and the real local production renderer on branch `codex/final-design-handoff-v1`.

## Canonical reference

| Viewport | Outer gutter | Standard left | Standard right |
| ---: | ---: | ---: | ---: |
| 1440 | 72 | 72 | 1368 |
| 1024 | 51.2 | 51.2 | 972.8 |
| 430 | 24 | 24 | 406 |
| 390 | 24 | 24 | 366 |

The original handoff fixed navigation is 81px high, uses the same outer gutter for the logo and Start Programme action, and the footer uses a centred `max-width: 1440px` inner grid. Production now resolves the same geometry through `--public-*` tokens.

## Evidence method

`tests/founder-unified-shell-browser.spec.ts` opens the real route renderer and measures bounding boxes for the visible shared logo, visible Programme CTA, primary body frame and shared footer inner frame. It does not infer parity from CSS custom-property values. The test covers 17 destinations at 1440, 1024, 430 and 390px and records the result in `visual-anchor-metrics.json`; protected `/help` is body-audited but retains its deliberate non-commercial shell.

The twelve route images contain the same left/right guide lines. `desktop-shell-overlay.webp` screen-blends the six required desktop captures so horizontal shell movement remains visible. Screenshots use the real public renderer; dynamic routes do not use `HandoffPage`.
