# FE-MIG-06 Casino Directory QA evidence

Date: 2026-08-06

Base: `2b358222e77f9ed56b1ff5f3ab8333da3863326d`

Branch: `codex/fe-mig-06-casino-directory`

Application commit: `97eae8f42d8758a81b0d9cc4ff3343c46ccea147`

PR: [#23](https://github.com/AlexG-7BE/sevenbet-next/pull/23)

Preview: [protected Vercel deployment](https://sevenbet-next-git-codex-fe-mig-06-ca-1bc9ea-alexg-7bes-projects.vercel.app/casinos)

## Evidence boundary

**Detected:** the repository root is `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`. All 655 tracked files were scanned before this technical handoff; dependencies, `.next`, caches, generated build output and `tsconfig.tsbuildinfo` were excluded from implementation claims.

**Detected:** the implementation changes only `/casinos`, its scoped discovery presentation, the existing public discovery DTO/query/service projection, targeted tests, package test command and project delivery documentation.

**Not detected:** Prisma schema or migration changes, APIs, CMS changes, new backend services, seed/cleanup execution, `demo-*` page-logic branches, raw affiliate destinations, broad Public Shell changes, or edits to `/bonuses`, `/best-offers` and Casino Profile.

## Reference lock and Figma mapping

The approved Figma family is the sole visual source of truth. Refero research was used only to validate institutional clarity, flat high-contrast controls and disclosure hierarchy; it did not average or redesign the approved screen.

| Approved source | Code mapping |
| --- | --- |
| Desktop family `520:2496` | `app/(public)/casinos/page.tsx` section order and `CasinoDiscovery.module.css` responsive composition |
| Desktop hero `877:5722` | dark introduction, search, published-media theatre and first-result review card |
| Desktop catalogue `877:5735` | directory introduction, disclosure, dropdown command panel, result count, cards and pagination |
| Mobile family `521:312` | single-column responsive contract and existing Public Shell |
| Mobile hero `877:13941` | compact headline plus first published review card; desktop theatre media/copy are intentionally suppressed |
| Mobile catalogue `877:13947` | search, filter drawer, sort, active states, edge-to-edge cards and responsive sections |

## Published data mapping

| UI field | Existing server projection |
| --- | --- |
| Identity and review links | `id`, `slug`, `name` |
| Brand and theatre media | published `logo`; fixed approved Figma `editorial-media` asset for the decorative theatre background |
| Editorial evidence | `shortDescription`, `rating`, `publishedAt`, `editorialUpdatedAt` |
| Comparison signals | published licences, payment methods, providers and categories |
| Responsible-gambling state | non-empty published `responsibleGamblingTools`; missing data is hidden |
| Bonus state | published `featuredBonus`; missing data receives a neutral unavailable block |
| Commercial action | existing `visitAction`; link renders only for an available safe internal `/r/[slug]` |

**Detected:** all 25 synthetic production-demo casinos remain latest-published-snapshot records loaded through `publicCasinoDiscoveryService.discover(query)`. No static replacement dataset or page-level `demo-*` check was added.

## URL, SSR and state behavior

**Detected:** search, country, licence, payment, provider, category, bonus type, bonus availability, visit availability, responsible-gambling information, cryptocurrency, mobile support, sort, page and page size are parsed and rendered on the server. Forms use GET, preserve applicable controls and reset stale page numbers.

**Detected:** unfiltered pages remain indexable; filtered/search pages are `noindex, follow`; canonical pages preserve only valid pagination; BreadcrumbList and ItemList JSON-LD remain server-rendered. The no-JavaScript filter fallback remains in SSR HTML.

**Detected:** empty, loading, catalogue error, review-only and unavailable-action states expose no provider/database internals. The loading composition is a bounded progressive-enhancement layer for JavaScript navigation; hard requests block for complete SSR so no-JavaScript browsers do not remain on a streamed fallback. Draft, archived and unpublished records continue to fail closed in the repository/service boundary.

## Accessibility and responsive QA

**Detected:** semantic headings, labels, status/live output, visible focus rings, modal labelling, Escape dismissal, focus return, no-JavaScript controls and non-link unavailable actions are present.

**Detected:** Playwright passes at 1,440, 1,280, 900, 768, 390, 375 and 320 CSS pixels with no horizontal overflow, hydration error, page error or console error. Desktop/mobile full-page captures and the filter-open capture were visually inspected against the approved family.

## Verification

- `npm run fe-mig-06:test` — 16/16 passed.
- `npm run discovery:test` — 9/9 passed.
- `npm run public-casino:test` — 9/9 passed.
- `npm run affiliate-redirect:test` — 14/14 passed.
- `npx playwright test tests/public-casino-browser.spec.ts` — 9/9 passed.
- `npm run typecheck` — passed.
- `npx prisma validate` — passed.
- `npm run build` — passed; `/casinos` remains dynamic SSR.
- `git diff --check` — passed before delivery.
- Protected Vercel Preview smoke — desktop, mobile, JavaScript-disabled mobile GET-filter and metadata checks passed; zero console errors and no horizontal overflow.

The browser suite covers default directory, page 2, country/licence/payment filters, bonus and responsible-gambling booleans, combined filters, empty results, available and unavailable actions, invalid parameters, SSR, a real JavaScript-disabled mobile GET-filter flow, canonical/noindex, ItemList, sorting, page size, keyboard/focus behavior and the full width matrix.

## Post-merge theatre-media correction

**Detected, 2026-08-06:** Figma node `520:2498` maps the Featured Review Theatre `324:8` background to fixed decorative image node `324:9` (`editorial-media`). The initial FE-MIG-06 implementation incorrectly projected and rendered the first result's published `media.hero` in that slot.

**Detected:** the hotfix stores the exact Figma source image at `public/casino-directory/editorial-media.jpg`, renders it with the existing 1,280 × 720 `object-cover` theatre treatment, and removes the unused directory `hero` DTO projection. The first-result review card remains database-driven. Playwright verifies that the approved 2,400 × 3,600 source asset loads, and desktop screenshot QA confirms the intended crop and contrast veil.

## Guardrail audit

The five protected documentation stashes were not applied, removed, renamed or included:

1. `stash@{0}` — `pre-fe-mig-05-concurrent-documentation-work-final`
2. `stash@{1}` — `pre-fe-mig-05-concurrent-documentation-work-2`
3. `stash@{2}` — `pre-fe-mig-05-concurrent-documentation-work`
4. `stash@{3}` — `pre-fe-mig-05-approved-design-documentation-work`
5. `stash@{4}` — `pre-fe-mig-05-documentation-work`

**Detected:** archive branch `codex/archive-fe-mig-05-pre-main-sync` exists and was not used as base, merged, rebased, cherry-picked or modified. Separate `stash@{5}` (`deferred RFC-011 demo environment proposal`) also remains untouched and is outside the protected five-stash set.

## Known limitations and remaining delivery gates

**Detected:** the branch is pushed, separate PR #23 targets `main`, the protected Vercel Preview is Ready, and project-scoped bypass smoke passes on desktop, mobile and JavaScript-disabled mobile. Automatic merge remains prohibited; Founder Office review is the remaining delivery gate.

**Inferred:** the local production build warning about a direct Prisma endpoint reflects the local environment configuration, not this frontend package; Prisma validation and runtime discovery tests pass, and no connection configuration changed.
