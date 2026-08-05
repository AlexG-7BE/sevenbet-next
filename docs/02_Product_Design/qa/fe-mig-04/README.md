# FE-MIG-04 visual QA evidence

## Scope

**Detected:** repository root `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next` was scanned before this evidence update; 525 active files were found after excluding dependencies, build output, caches and `tsconfig.tsbuildinfo`.

**Detected:** the live Figma approval anchors remained desktop family `520:2496` and mobile family `521:312`. No Figma node was changed. The implementation uses the existing shared Public Shell and the approved night/paper/acid composition.

## Captures

- `before/casinos-1440.png` and `before/casinos-390.png`: legacy production build before FE-MIG-04.
- `after/casinos-1440.png`: migrated default desktop composition at 1,440 CSS px.
- `after/casinos-browser-1280.png`: browser-test desktop capture.
- `after/casinos-390.png`: migrated default mobile composition at 390 CSS px.
- `after/casinos-390-filter-drawer.png`: native modal filter drawer, captured before Escape dismissal.
- `after/casinos-390-no-match.png`: URL-driven no-match recovery state.

## Verification

**Detected:** the pre-merge data-honesty review removes the unsupported `verified` hero claim, renames the first-item theatre to neutral `Published review preview`, removes false featured semantics, narrows affiliate copy to the observable separation between editorial score and visit availability, and removes the `local offer` implication. Sparse licence, market and payment groups are omitted instead of rendered blank; absent rating, freshness, logo, highlights and visit actions are not invented. Visible numbering is labelled as `Directory result position`, not authority rank.

**Detected:** 16/16 FE-MIG-04 contract/service/server-render tests cover the full canonical card, sparse review-only card and neutral first-result preview without a production fixture route or private data. Production build and TypeScript pass. The combined Casinos/Public Shell/Home/10 Steps browser matrix passes 55/55. Browser coverage includes SSR rendering, URL preservation for search/sort/page size, modal semantics, Escape, focus return, no-JavaScript fallback, approved widths from 1,440 to 320 CSS px, search/sort/page URLs, horizontal overflow and the canonical `/catalog` redirect. Public-casino rendering passes 9/9, Public Shell contract 5/5, Home contract 5/5, 10 Steps contract 8/8 and affiliate redirect 14/14.

**Detected baseline:** the full Node suite is 229 passed / 7 failed. All seven failures are the documented Mission 04 stale-date fixtures rejected with `reviewAt must be in the next 30 days`; no FE-MIG-04, public-casino, shell, Home, 10 Steps or redirect regression is present. Repository lint remains the separately documented deprecated interactive `next lint` gap.

**Detected:** the connected local data set contains no published Casino rows. Default and no-match/zero-published captures therefore show the honest empty projection; illustrative Figma operator data was not copied into production.

**Not detected:** a safe disposable published-review fixture that can exercise populated, no-eligible-action and provider-backed visual states without changing canonical data. Deterministic server-render tests now cover those card semantics, but populated visual and deterministic loading/error boundary screenshots are not included. These remain review gates for an environment with approved disposable fixtures.
