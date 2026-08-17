# Founder Home Mobile Polish Evidence

Source truth: the final design handoff, the existing canonical public Home runtime, and the five Founder mobile findings in this pass.

The captures exercise the real `/` route at 390px and 430px. `metrics.json` additionally records geometry at 360px, 393px and 412px. No static substitute or screenshot-only renderer is used.

## Evidence key

- `01-hero`: floating-photo separation, message readability and dominant CTA.
- `02-recognition-flow` and `03-product-entry`: the tightened second-to-third block rhythm.
- `04-photo-focus`: the first photo owns the viewport at 25% chapter progress; only a narrow preview of the next scene is visible.
- `05-evidence`: compact heading hierarchy and evidence-card density.
- `06-two-businesses`: two sequential panels with a horizontal separator and shared left-aligned reading rhythm.
- `home-final-composition-1440.webp` and `home-final-composition-390.webp`: the CTA and real footer enter as one closing scene.
- `home-final-bottom-1440.webp` and `home-final-bottom-390.webp`: absolute document-bottom evidence.
- The earlier `home-final-cta-390.webp`, `home-footer-reachable-390.webp` and `home-footer-bottom-390.webp` remain as historical regression evidence from the prior footer-reachability correction.

## Final CTA to footer correction

The approved capture made its final CTA and captured footer one `100svh` block. Production correctly strips that duplicate captured footer, but the orphaned CTA retained `min-height: 100svh` and `data-snap`, so fine-pointer scrolling stopped on it as a separate screen before reaching the real `PublicFooter`.

The Home transform removes only that prototype final snap attribute. Runtime interaction measures the single real footer and gives the CTA the remaining closing-stage height. On desktop, the same real footer adopts the approved compact four-column Home geometry. On coarse pointers, the final integrated stop reveals part of the footer with the CTA before the existing bottom marker allows the absolute document bottom. The photo-panel snap contract is unchanged.

## Closing interaction sequence

1. `Why trust` remains the last narrative/photo stop.
2. The next wheel or touch progression brings in the final CTA without a standalone CTA snap screen.
3. `PublicFooter` enters while the CTA remains visible and usable.
4. Absolute bottom is reachable; at 1440 the full 573px CTA and 327px footer occupy the 900px viewport together.
5. A reverse wheel/touch gesture reduces `scrollY`; upward scrolling is not trapped.

There is exactly one `[data-public-shell="footer"]`, owned by the shared public layout.

## QA contract

- Mobile widths: 360, 375, 390, 412 and 430 for the final footer-escape regression; the earlier composition metrics retain their 393px sample.
- Regression widths: 768, 1024, 1280 and 1440.
- Fine-pointer wheel progression is verified at 1440, 1280 and 1024.
- Chromium touch-source progression is verified at 360, 375, 390, 412 and 430, including the integrated CTA/footer entry state, real bottom and upward scrolling.
- Reduced-motion and no-JavaScript states remain fail-visible.
- Production is not exercised or changed by this evidence pass.
