# Final Design Handoff True-Parity Evidence

## Scope

- **Detected:** 24 visual surfaces are captured at 1440, 1024, 430 and 390 CSS pixels.
- **Detected:** each surface/width has `reference`, `implementation` and amplified `diff` WebP evidence: 288 primary files.
- **Detected:** 48 additional bounded side-by-side WebPs cover the Founder-designated major surfaces; total committed visual evidence is 336 WebPs.
- **Detected:** `capture-manifest.json` records routes, source boards, states and widths. `visual-diff-metrics.json` records per-artifact mean absolute difference and changed-pixel ratio.

## Deterministic data boundary

The commercial reference boards use illustrative Solvane, Marlowe and Kestrel values. For comparable local screenshots, `visualFixture=true` activates those samples only when the local process also has `B4GAMBLE_HANDOFF_VISUAL_FIXTURE=true`. `lib/final-handoff/visual-fixture.ts` rejects every Vercel environment, and the fixture exposes no commercial action or persistent data mutation. Normal runtime and the Vercel Preview remain connected to current governed DTOs and jurisdiction controls.

Programme evidence uses intercepted local test DTOs for the three requested states. It does not change Programme persistence, rewards or server authority. The contextual comparison fixture records the handoff popup; ordinary browser tests separately verify the real selection controller, two-selection auto-open behaviour, three-item cap and `/api/public/comparison` projection.

## Reading the files

File names follow `<surface>-<width>-<kind>.webp`. The diff is an amplified pixel difference, not a pass/fail mask. A dark diff image indicates close alignment. Full-page metrics are sensitive to page height, fixed chrome, font rasterisation, runtime state and handoff mobile conditionals.

## Review disposition

- Static ported boards are exact or near-exact at desktop widths; remaining sub-pixel differences are primarily font/render timing and deliberate functional transforms.
- Commercial fixture pages closely match at desktop widths and preserve the handoff sample content; mobile differences include handoff-runtime conditionals that were evaluated during original-board capture but are represented by CSS reflow in the generated React port.
- Login, FAQ, Contact, legal and safety pages preserve live form/auth/link/contract behaviour, so their diffs include semantic and contractual additions.
- Programme screenshots compare board fragments with full production application states and therefore have intentionally high raw whole-canvas metrics. Functional flow is assessed by Programme browser tests, not by a false pixel threshold.
- No artifact in this directory is a Founder acceptance declaration or Production approval.
