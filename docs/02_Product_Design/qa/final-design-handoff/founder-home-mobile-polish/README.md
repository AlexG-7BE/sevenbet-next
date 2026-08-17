# Founder Home Mobile Polish Evidence

Source truth: the final design handoff, the existing canonical public Home runtime, and the five Founder mobile findings in this pass.

The captures exercise the real `/` route at 390px and 430px. `metrics.json` additionally records geometry at 360px, 393px and 412px. No static substitute or screenshot-only renderer is used.

## Evidence key

- `01-hero`: floating-photo separation, message readability and dominant CTA.
- `02-recognition-flow` and `03-product-entry`: the tightened second-to-third block rhythm.
- `04-photo-focus`: the first photo owns the viewport at 25% chapter progress; only a narrow preview of the next scene is visible.
- `05-evidence`: compact heading hierarchy and evidence-card density.
- `06-two-businesses`: two sequential panels with a horizontal separator and shared left-aligned reading rhythm.
- `home-final-cta-390.webp`: the final CTA remains a complete, readable snap moment.
- `home-footer-reachable-390.webp`: the next downward touch sequence resolves to the real `PublicFooter`.
- `home-footer-bottom-390.webp`: the absolute document bottom and final affiliate-disclosure link remain reachable.

## Final CTA to footer correction

The generated Home capture applies `scroll-snap-type: y mandatory` to the root document for coarse pointers. Its final CTA was the last descendant with `scroll-snap-align`, while `PublicFooter` is intentionally rendered outside the handoff subtree. The browser therefore resolved continued downward touch scrolling back to the final CTA.

The shared footer now exposes inert start/end markers, activated as snap targets only when a coarse-pointer mobile document contains the Home handoff. The existing photo panels retain `scroll-snap-align: start` and `scroll-snap-stop: always`; no Home section, interaction controller, footer content or desktop snap behaviour changed.

## QA contract

- Mobile widths: 360, 375, 390, 412 and 430 for the final footer-escape regression; the earlier composition metrics retain their 393px sample.
- Regression widths: 768, 1024, 1280 and 1440.
- A Chromium touch-source gesture traverses the snap sequence, reaches the CTA, footer and real bottom, then verifies upward scrolling.
- Reduced-motion and no-JavaScript states remain fail-visible.
- Production is not exercised or changed by this evidence pass.
