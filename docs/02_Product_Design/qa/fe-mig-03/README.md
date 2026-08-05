# FE-MIG-03 — 10 Steps campaign landing QA

Date: 2026-08-05

Branch: `codex/fe-mig-03-ten-steps`

Baseline: `bef86bd6cb5636709d1c1aa5236d8a4141be6b93` (`main`, merged FE-MIG-02)

Pull request: [#17](https://github.com/AlexG-7BE/sevenbet-next/pull/17)

Status: **IMPLEMENTED — REVIEW/MERGE REQUIRED**

Implementation history:

- `2a4fef2` — `test(frontend): lock 10 Steps responsive contract`
- `3bc4204` — `feat(frontend): migrate approved 10 Steps campaign landing`
- `172b97b` — `docs(frontend): record 10 Steps migration`
- `5908494` — `fix(frontend): bind approved 10 Steps serif`
- `84bb4f6` — `docs(frontend): finalize 10 Steps handoff evidence`
- `12b5610` — `fix(frontend): guard 10 Steps returning truth`

## Authority and scope

**Detected:** implementation follows the unchanged approved live Figma contract: desktop family `502:2238`, full 1,440 `502:2240`, full 1,280 `502:2241`, mobile family `502:2412`, full signed-out 390 `502:2414`, returning 390 first fold `502:2415`, signed-out 375 first fold `502:2416` and evidence-card set `506:640`. Desktop contract `505:2520`, state contract `505:2521` and mobile state contract `506:312` were also inspected live before implementation.

**Detected:** the migrated route follows the approved order: Hero; What the Programme Builds; Editorial Contract; 10-Mission Map; Account Boundary; Evidence & Data Truth; final Programme action; shared Public Footer. Header, one main landmark, Footer and protected `Open Help` ownership remain with FE-MIG-01 Public Shell.

**Detected:** scope is limited to `/10-steps` presentation, its server-state resolver, one route theme adjustment in the shared shell, tests and documentation. No backend, API, Prisma, schema, migration, Programme reward/order/prerequisite, protected Help behaviour, commercial eligibility, other route body or Figma node was changed. FE-MIG-04 was not started.

**Reference lock:** Figma is the sole visual authority. Refero style research was used only as a coherence check for editorial contrast, restrained action hierarchy and compact navigation; it did not authorise a visual deviation.

## Bounded pre-implementation audit

### Fixed in this package

- **Detected before:** the legacy body carried stale `+20 XP`, `UK PREVIEW` and `UK-ready discovery` claims, a local commercial-discovery section and a composition that did not match the approved desktop/mobile family.
- **Detected before:** the page had no returning-state projection and represented all ten Missions as if they were equally available.
- **Detected now:** `+20 XP`, unsupported market copy and body links to casinos/bonuses/best offers are removed. The only body destination is the canonical `/program` entry.
- **Detected now:** signed-out Mission 01 shows `+60 XP` only as a pending preview with `SAVE TO EARN` and `Awarded when Mission 01 is saved to your account.` Awarded XP is rendered only when the server Dashboard projection confirms a returning Programme record.
- **Detected now:** Missions 01–04 are identified as the current path. Missions 05–10 are explicitly `PLANNED · NOT YET AVAILABLE`; the campaign does not convert the roadmap into live capability.
- **Detected now:** the returning-state resolver uses the existing Mission registry completion contract (`completion !== null`) as its availability authority. Current Missions 01–04 remain resumable; a Dashboard projection whose `currentMission` is 5 resolves to the separate `available-programme-complete` state, preserves server XP/completed count, offers only `Open My Programme`, and never presents Mission 05 as available or next.
- **Detected now:** Programme, pause and Help data separation is stated directly. The route contains no commercial body action and makes no market/jurisdiction claim.
- **Detected now:** critical content is server-rendered and visible by default. There is no page-level Client Component, client Dashboard fetch, client XP/progress calculation, `IntersectionObserver` reveal or browser storage.

### State and reward truth

| State | Detected source | Campaign presentation |
| --- | --- | --- |
| Anonymous | Better Auth server session is absent | Signed-out hero; Mission 01 canonical entry; `+60 XP` is pending only |
| Signed in, no readable Programme record | Server session exists; Dashboard projection is unavailable/not enrolled | Honest signed-in fallback; no XP, completion count or next-Mission claim |
| Returning Programme user, current Mission 01–04 | Server session plus `programmeDashboardService.getDashboard(userId)` and registry completion capability | Dashboard-owned `totalXp`, completed Mission count and available current Mission only |
| Available Programme path complete | Dashboard current Mission has no registry completion capability, currently Mission 05 | Dashboard-owned `totalXp` and completed count; current available path complete; `Open My Programme`; no Mission 05 link or next-step claim |

The resolver is dependency-injected for contract testing. Anonymous requests do not read the Dashboard. Projection failures fail closed to the signed-in fallback rather than inventing progress.

## Images and loading

The four remote Pexels assets were already detected in the approved Home/Programme implementation and are reused to match the approved Figma composition. Pexels' general licence permits free use and modification subject to its restrictions: <https://www.pexels.com/license/>. This does not replace per-asset author/release archival evidence.

| Pexels photo ID | 10 Steps use | Markup dimensions | Accessibility | Loading |
| --- | --- | --- | --- | --- |
| `5710657` | signed-out Hero | 1,800 × 1,200 | decorative `alt=""` | eager, high priority; LCP candidate |
| `37057075` | Editorial Contract | 1,800 × 1,200 | decorative `alt=""` | lazy |
| `34947154` | Account Boundary | 1,800 × 1,200 | decorative `alt=""` | eager with low priority so full-page evidence and below-fold composition remain deterministic |
| `4450147` | returning Hero | 1,800 × 1,200 | decorative `alt=""` | eager only when that mutually exclusive server state renders |

Explicit dimensions reserve space; CSS owns crop and position. Adjacent copy carries all meaning, so repeated photo descriptions would add accessibility noise.

## Accessibility and responsive evidence

- One H1 and one main landmark per rendered state; no local Header, Footer or standalone Help panel.
- Logical heading order, an ordered ten-Mission list and the seven-section narrative are present in server HTML.
- No-JS, reduced-motion and immediate render checks retain visible critical content.
- Visible route actions meet the 44 × 44px minimum in browser checks.
- Mobile Public Shell menu remains modal, Escape-closeable and restores focus.
- No document-level horizontal overflow at 1,440, 1,280, 1,024, 768, 430, 390, 375, 360 or 320 CSS pixels.
- The 320px check covers narrow reflow; 640px Public Shell coverage remains the effective layout-width check for 200% desktop zoom.

## Screenshots

Before implementation:

- `before/ten-steps-1440.png`
- `before/ten-steps-390.png`

After implementation:

- `after/ten-steps-1440.png`
- `after/ten-steps-1280.png`
- `after/ten-steps-390.png`
- `after/ten-steps-375-first-fold.png`
- `after/ten-steps-320.png`

**Detected visual QA:** the approved section order, night/paper rhythm, first folds, mission availability labels, photo loading, shared shell ownership, CTA hierarchy and final Footer transition were inspected against the production build.

## Verification

- `node --test --import tsx tests/ten-steps-parity.test.ts` — 8/8 passed, including current Mission 04 and post-Mission-04 current Mission 05 truth.
- `npx playwright test tests/ten-steps-browser.spec.ts` — 13/13 passed.
- Combined Home, Public Shell, public-casino and 10 Steps browser regressions — 52/52 passed against `next start`.
- `npm run typecheck` — passed.
- `npm run build` — passed; `/10-steps` is dynamic/server-rendered, route size is 810 B and First Load JS is 107 kB. No route Client Component was added.
- Full Node suite — 220/227 passed; the same seven date-dependent Mission 04 `reviewAt` fixtures fail because their fixed date is no longer within the validator's next-30-days window. This baseline debt predates and is outside FE-MIG-03.
- `npm run lint` — not a usable non-interactive gate: the repository still invokes deprecated `next lint` and prompts for initial ESLint configuration.
- `git diff --check` — passed.

## Review and release gates

- Product/design review should compare the approved Figma representatives with the stored after screenshots.
- **Not detected:** an approved disposable authenticated browser fixture. Returning state is covered by server-state contract tests, but an authenticated route screenshot remains an explicit release gap; no auth bypass or invented cookie was added.
- Per-image source/author/release archival evidence remains a release-process gap despite the reviewed general Pexels licence.
- Missions 05–10 remain planned, not released by this campaign migration.
- PR #17 is approved subject to the recorded bounded correctness fix and awaits squash merge. FE-MIG-04 must start separately after FE-MIG-03 merge.
