# FE-MIG-02 — Home responsive parity QA

Date: 2026-08-05

Branch: `codex/fe-mig-02-home-parity`

Baseline: `ceee4e79644c52d824542c94475061e6966ccf23` (`main`, merged FE-MIG-01)

Status: **IMPLEMENTED — REVIEW REQUIRED**

## Authority and scope

**Detected:** implementation follows the approved Figma Home family without changing Figma: desktop family `661:7551`, canonical 1,440 source `289:946`, returning-user first fold `661:7554`, desktop contract `661:7607`, mobile family `657:2545`, full 390 screen `657:2548`, 375 first fold `661:2686` and mobile contract `661:2711`. Live Figma inspection on 2026-08-05 confirmed that these node IDs are unchanged.

**Detected:** the migrated body preserves the approved order: Hero; Programme Theatre; Self Recognition; Recognise; Build; Apply; Programme Tools; Evidence; final Programme CTA; shared Public Footer. The first nine sections belong to Home; the tenth is supplied once by the FE-MIG-01 Public Shell.

**Detected:** scope is limited to Home presentation, a bounded carousel client island, tests and documentation. No backend, API, Prisma, schema, migration, Programme reward/progress logic, protected Help behavior, commercial eligibility or Figma node was changed. FE-MIG-03 was not started.

## Bounded pre-implementation audit

### Fixed in this package

- **Detected before:** `TiltHome` was an all-page Client Component, although only the carousel and decorative pointer/reveal effects required browser state.
- **Detected before:** critical SSR content started at `opacity: 0` and depended on `IntersectionObserver`; no-JS, delayed hydration and immediate screenshots could show a blank acquisition message and blank later sections.
- **Detected before:** mobile was a generic desktop reflow rather than the approved 390/375 composition.
- **Detected before:** carousel side-card order did not match Figma and static tool cards were exposed as invented interactive state.
- **Detected now:** Home is server-rendered by default; only `HomeProgrammeCarousel` is a Client Component. Critical content is visible before hydration. Mobile section heights, type, full-bleed chapters, cards and final CTA follow the approved family. The carousel exposes truthful three-card state with labelled 44px controls and keyboard operation.
- **Detected now:** account presentation remains server-owned by the shared Public Layout. Home makes no client auth, dashboard, XP, progress or next-Mission calculation and does not use Programme/safety data for commercial personalization.

### Explicitly deferred or unchanged

- **Planned:** an authenticated disposable browser fixture and signed-in screenshot are still not detected. The returning-user header path is covered by FE-MIG-01 server-state contract tests; no unauthoritative Home dashboard fetch was added.
- **Planned:** exact image author/release and archived source-page records are not stored in this repository. Existing Figma-approved Pexels assets were retained; this provenance gap must be closed before a release process that requires per-asset archival evidence.
- **Not detected:** live market/jurisdiction authority. Home makes no availability claim.
- **Unchanged:** FE-SAFETY-01 blockers and protected Help separation.

## Image and loading audit

All five files are existing remote Pexels assets detected in the Home implementation and retained to match the approved Figma composition. Pexels' general licence permits free use and modification without required attribution, subject to its restrictions: <https://www.pexels.com/license/>. This review does not replace per-asset release/provenance verification.

| Pexels photo ID | Home use | Intrinsic dimensions in markup | Accessibility | Loading |
| --- | --- | --- | --- | --- |
| `4450147` | hero upper-left | 900 × 1200 | decorative `alt=""` | eager, high fetch priority; only prioritised LCP candidate |
| `34947154` | hero upper-right; Recognise chapter | 900 × 1200 / 2000 × 1400 | decorative `alt=""` | hero lazy; chapter lazy |
| `5710657` | hero lower-left; Build chapter | 900 × 1200 / 2000 × 1400 | decorative `alt=""` | hero lazy; chapter lazy |
| `37057075` | hero lower-right | 900 × 1200 | decorative `alt=""` | lazy |
| `7870310` | Apply chapter | 2000 × 1400 | decorative `alt=""` | eager with low fetch priority so the below-fold full-page composition is deterministic without competing with the hero |

**Detected:** CSS controls crop, position and aspect ratio; explicit markup dimensions reserve layout space. Images are decorative because adjacent headings/copy carry the meaning and repeating photo descriptions would add noise. The photos do not load tracking, affiliate or Programme state.

## Accessibility and interaction evidence

- One H1 and one main landmark; Home does not duplicate the shared Header/Footer.
- Logical heading and section order is preserved in server HTML.
- No critical content is reveal-gated; no-JS, missing `IntersectionObserver`, delayed hydration and reduced motion all retain visible content.
- Carousel region is labelled, its counter is announced with `aria-live`, inactive cards are hidden from the accessibility tree, buttons have accessible names, and Enter/arrow-key behavior passes.
- Home and shell visible actions meet the 44 × 44px minimum in browser checks.
- Mobile menu remains modal, Escape-closeable and restores focus.
- No document-level horizontal overflow at 1440, 1280, 1024, 768, 640, 430, 390, 375, 360 or 320 CSS pixels; 640 covers the effective layout width of 200% desktop zoom.

## Screenshots

Before implementation:

- `before/home-1440.png`
- `before/home-390.png`

After implementation:

- `after/home-1440.png`
- `after/home-390.png`
- `after/home-1280-first-fold.png`
- `after/home-375-first-fold.png`

**Detected visual QA:** approved section order, desktop/mobile crops, first folds, photo loading, Public Shell ownership and final CTA/footer transition were inspected in the production build. The previous full-page blank/reveal failure is absent.

## Verification

- `npm run home:test` — 5/5 passed.
- `npm run typecheck` — passed.
- `npm run build` — passed; Home route is server-rendered and its route-specific client payload is 2.04 kB in this build.
- `npx playwright test tests/home-browser.spec.ts tests/public-shell-browser.spec.ts tests/public-casino-browser.spec.ts` — 39/39 passed against `next start`.
- Browser regressions include `/`, `/10-steps`, `/program`, `/casinos`, `/responsible-gambling`, public/protected 404 boundaries and the mobile Public Shell.
- Full Node suite — 212/219 passed; the same seven date-dependent Mission 04 `reviewAt` fixtures fail because their fixed dates are no longer within 30 days. These failures predate and are outside FE-MIG-02.
- `npm run lint` — not a usable non-interactive gate: the repository still invokes deprecated `next lint` and prompts for initial ESLint configuration.
- `git diff --check` — passed.

## Review and release gates

- Product/design review should compare the four approved Figma representatives with the stored after screenshots.
- Authenticated returning-user browser evidence remains a known gap until a disposable fixture exists.
- Per-image source/author/release archival evidence remains a release-process gap even though the existing assets are covered by the reviewed general Pexels licence.
- Merge is not performed by this package. The next migration package remains FE-MIG-03 and must start separately after review/merge direction.
