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

**Detected:** production build, TypeScript, 12 FE-MIG-04 contract/service tests and 5 Playwright browser tests pass. Browser coverage includes SSR rendering, URL preservation for search/sort/page size, modal semantics, Escape, focus return, no-JavaScript fallback, horizontal overflow and the canonical `/catalog` redirect.

**Detected:** the connected local data set contains no published Casino rows. Default and no-match/zero-published captures therefore show the honest empty projection; illustrative Figma operator data was not copied into production.

**Not detected:** a safe disposable published-review fixture that can exercise populated, no-eligible-action and provider-backed states without changing canonical data. Loading/error composition is contract-tested in source, but deterministic visual capture of those streaming/error boundaries is not included. These remain review gates for an environment with approved disposable fixtures.
