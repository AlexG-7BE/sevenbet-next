# FE-MIG-07 Bonus Directory QA evidence

Date: 2026-08-06

Base: `12c2d278d7291a7253be42f75fe84ef3fcab37ef`

Branch: `codex/fe-mig-07-bonuses`

PR: [#25](https://github.com/AlexG-7BE/sevenbet-next/pull/25)

Preview: [Vercel deployment](https://sevenbet-next-git-codex-fe-mig-07-bonuses-alexg-7bes-projects.vercel.app/bonuses)

## Evidence boundary

**Detected:** the repository root is `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`. The 657 tracked files were inventoried before this handoff; dependencies, `.next`, caches, generated test output and `tsconfig.tsbuildinfo` are excluded from implementation claims.

**Detected:** the implementation changes `/bonuses`, Bonus Directory-specific components and CSS, its approved static Figma material-field asset, targeted tests, package test commands and delivery evidence.

**Not detected:** changes to `/best-offers`, shared `components/public-offers`, `PublicOfferService`, repositories, Prisma schema or migrations, APIs, CMS, the deterministic demo manifest, seed/cleanup scripts, affiliate routing, Public Shell, Active Control Programme, the protected stashes or the archive branch.

## Reference lock and Figma mapping

The approved Figma family is the visual source of truth. Refero research was used only to check disclosure hierarchy, dense comparison legibility and state clarity; it did not average or redesign the approved screen.

| Approved source | Code mapping |
| --- | --- |
| Family `541:3002` / canonical desktop `541:3952` | page composition and `BonusDirectory.module.css` |
| Desktop hero and material field | dark editorial copy plus exact Figma asset `public/bonus-directory/material-field.png` |
| Featured product-object cards | first three server-ranked results, with material terms before any action |
| Comparison directory | URL-owned filter ledger, real result count, full 24-result page and server pagination |
| State contract `542:3328` | active filters, neutral missing values, review-only action, empty/loading/error behavior |
| Mobile full `542:4329` / 375 fold `544:4422` | single-column layout, mobile dialog and unchanged Public Shell |
| Mobile filter-open `544:4415` | native labelled dialog, deterministic initial focus, Escape close and focus return |

## Published data mapping

| UI field | Existing server projection |
| --- | --- |
| Result identity and review | `id`, `casinoSlug`, `casinoName`, `offerTitle` |
| Bonus contract | `minimumDeposit`, `wageringRequirement`, `maximumBonus`, `expiry`, `eligibility` |
| Context | published licence and payment-method values |
| Publication/order | latest published offer snapshot, `publishedAt`, server-owned sort |
| Commercial state | existing `visitAction`; anchor only for a safe internal `/r/[slug]` |
| Missing values | neutral `Not listed` or non-link `No governed visit` |

**Detected:** every displayed offer is returned by `PublicOfferService.searchOffers(query)`. Featured cards reuse the first three results from the same response; there is no static offer array, sponsored override, client ranking or page-level `demo-*` branch.

## URL, SSR and indexing behavior

**Detected:** `country`, `type`, `payment`, `crypto`, `maxDeposit`, `maxWagering`, `availability`, `sort` and `page` are parsed and rendered on the server. GET forms and pagination work without JavaScript, preserve valid controls and reset stale page numbers.

**Detected:** the default page size is 24; result counts, facets, sorting and ItemList positions come from the server result. Filtered pages are `noindex, follow` with canonical `/bonuses`; the default page remains indexable. The route is dynamic SSR and fail-closed service errors use the scoped error boundary.

## Accessibility and responsive QA

**Detected:** semantic headings, field labels, definition lists, labelled result list, visible focus, native dialog semantics, Escape dismissal, focus restoration, non-link unavailable actions and no-JavaScript controls are present.

**Detected:** Playwright covers 1,440, 1,280, 390, 375 and 320 CSS pixels with no horizontal overflow, hydration error, page error or console error. Desktop and mobile full-page captures were visually inspected against the approved family:

- `screenshots/bonuses-1440.png`
- `screenshots/bonuses-390.png`

## Verification

- `npm run fe-mig-07:test` — 17/17 passed.
- `npm run fe-mig-06:test` — 16/16 passed.
- `npm run public-casino:test` — 9/9 passed.
- `npm run affiliate-redirect:test` — 14/14 passed.
- `npx playwright test tests/bonus-directory-browser.spec.ts tests/public-offer-browser.spec.ts` — 10/10 passed.
- `npm run typecheck` — passed.
- `npx prisma validate` — passed.
- `npm run build` — passed; `/bonuses` remains dynamic SSR.
- `git diff --check` — passed before delivery.

The browser suite covers default 24 offers, page 2, each supported filter, all sorts, combined filters, empty results, available/unavailable presentation, material terms, canonical/noindex, ItemList positions, raw SSR HTML, no-JavaScript controls and pagination, mobile dialog focus behavior, keyboard focus and the full width matrix.

## Guardrail audit

**Detected:** protected documentation stashes `stash@{0}` through `stash@{4}` remain present and untouched. Separate `stash@{5}` is outside the protected set and also remains untouched.

**Detected:** archive branch `codex/archive-fe-mig-05-pre-main-sync` remains at `9ec8a76182afd5bd48e425ba3abde499db458d57`; it was not used as base, merged, rebased, cherry-picked or modified.

## Remaining delivery gates

**Detected:** the branch is pushed and separate PR #25 targets `main`. Vercel Preview smoke and Founder Office review remain delivery gates; automatic merge is prohibited.

**Inferred:** the local production build warning about a direct Prisma endpoint reflects local environment configuration, not this frontend change; Prisma validation and database-backed runtime tests pass, and no connection configuration changed.
