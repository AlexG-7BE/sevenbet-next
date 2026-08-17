# Founder Home Mobile Polish Evidence

Source truth: the final design handoff, the existing canonical public Home runtime, and the five Founder mobile findings in this pass.

The captures exercise the real `/` route at 390px and 430px. `metrics.json` additionally records geometry at 360px, 393px and 412px. No static substitute or screenshot-only renderer is used.

## Evidence key

- `01-hero`: floating-photo separation, message readability and dominant CTA.
- `02-recognition-flow` and `03-product-entry`: the tightened second-to-third block rhythm.
- `04-photo-focus`: the first photo owns the viewport at 25% chapter progress; only a narrow preview of the next scene is visible.
- `05-evidence`: compact heading hierarchy and evidence-card density.
- `06-two-businesses`: two sequential panels with a horizontal separator and shared left-aligned reading rhythm.

## QA contract

- Mobile widths: 360, 390, 393, 412 and 430.
- Regression widths: 768, 1024, 1280 and 1440.
- Reduced-motion and no-JavaScript states remain fail-visible.
- Production is not exercised or changed by this evidence pass.
