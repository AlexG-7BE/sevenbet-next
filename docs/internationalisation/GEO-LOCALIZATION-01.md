# GEO-LOCALIZATION-01 implementation record

**Evidence date:** 2 September 2026
**Branch:** `codex/geo-localization-routing-01`
**Base:** detected `origin/main` `fe27d899638d2ca2b55461a75ae869d5db9163b1`
**State:** PR #121 merged; initial Production release detected; scoped Peru publication correction in progress

## Evidence classification

- **DETECTED:** the repository root is `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`; the active source tree was scanned excluding dependencies, `.next`, generated output and caches.
- **CONTRADICTION:** the Founder brief named `fe27d89997312c0b312b8231f8419815e29e7b05` as the expected base, while the fetched authoritative `origin/main` ref resolves to `fe27d899638d2ca2b55461a75ae869d5db9163b1`. The fresh branch uses the actual remote ref and does not rewrite history.
- **DETECTED:** Next.js 15 App Router, one `middleware.ts`, the typed market registry, typed translation catalogs, market-aware casino services and `CasinoCountry` factual projection already existed.
- **DETECTED:** the active Programme has separately governed market-first routes such as `/se/program`; GEO-LOCALIZATION-01 does not change Programme state, rewards, prerequisites, persistence or routing.
- **DETECTED:** operative legal pages remain unprefixed and are not presented as Peru-localized law.
- **DETECTED:** PR #121 merged at `c27b94d22f50fd4822e61d6ae6353b01072d4682`; Vercel Production deployment `dpl_2RioUxbR838XZr8wGytPqrajgQVX` reached Ready and the nine-route read-only smoke passed.
- **CONTRADICTION:** `/es-pe` and `/es-pe/casinos` returned 404 in that exact release because the older Preview-only publication state remained encoded after the current Founder instruction required Production verification.
- **PROPOSED UNTIL MERGE:** the scoped release correction records the newer Peru publication authority while retaining `noindex, follow` and every factual/commercial fail-closed boundary.

## Canonical route contract

Canonical presentation paths use `/{locale-market}` in lowercase. Initial required routes are `/en-gb`, `/sv-se` and `/es-pe`. All already enabled presentation locales use the same durable rule so an existing market is not removed while its old URL becomes a one-hop legacy redirect.

Resolution order:

1. explicit canonical route;
2. validated `b4gamble_presentation` first-party preference;
3. trusted Vercel `x-vercel-ip-country` in Preview/Production;
4. `Accept-Language` only within a market already selected by preference or trusted country;
5. deterministic GB / `en-GB` fallback.

Unprefixed localizable URLs are neutral resolver inputs and use `307`. Canonical case/query normalization, old market-first paths, redundant language paths and valid legacy `?country=` routes use `308`. Canonical routes remove the legacy `country` parameter. No route, cookie, query or browser-language value creates commercial authority.

## Route and publication matrix

| Canonical | Market / locale | Environment | Indexing | Data behavior |
| --- | --- | --- | --- | --- |
| `/en-gb` | GB / `en-GB` | Preview and Production | existing route-level policy | exact GB projection |
| `/sv-se` | SE / `sv-SE` | Preview and Production under existing Founder acceptance | `noindex, follow` | exact SE projection; SEK, Swish and Spelinspektionen facts remain market-scoped |
| `/es-pe` | PE / `es-PE` | Preview and Production under the current Founder instruction | `noindex, follow`; sitemap-excluded | exact PE projection; PEN, Yape and MINCETUR facts remain market-scoped |

The product routes supported by the existing localizable manifest include Home, Casinos, Best Offers, Bonuses, Casino detail, contextual Compare redirect, Learning, About, FAQ, Contact and Methodology. Exact Help and Responsible Gambling are additionally enabled for the governed PE evidence profile. Invalid, disabled, protected or internal combinations fail closed.

## Peru language and safety evidence

Generic Spanish product/editorial copy explicitly reuses the reviewed Spanish source pack rather than silently falling back to English. Peru identity, currency, factual casino data and safety evidence remain market-owned.

The bounded PE evidence profile records:

- [Law 31557](https://consultasenlinea.mincetur.gob.pe/casinos/archivos/2022LEY31557.pdf);
- [MINCETUR platform authorisation procedure](https://www.gob.pe/institucion/mincetur/pages/94255-autorizacion-y-o-renovacion-de-explotacion-de-plataformas-tecnologicas-de-juegos-a-distancia-y-apuestas-deportivas-a-distancia);
- [MINCETUR enforcement against unauthorised platforms](https://www.gob.pe/institucion/mincetur/noticias/1421604-mincetur-bloquea-36-plataformas-de-juegos-a-distancia-y-apuestas-deportivas-que-operaban-sin-autorizacion);
- [MINCETUR voluntary exclusion procedure](https://www.gob.pe/institucion/mincetur/pages/765-inscribirse-en-el-registro-de-personas-prohibidas-a-acceder-a-las-salas-de-juegos-de-casinos-y-maquinas-tragamonedas), with its casino-room and slot-premises scope stated; and
- [MINCETUR responsible-gambling guidance](https://www.gob.pe/institucion/mincetur/noticias/1297424-apuestas-deportivas-mincetur-promueve-el-juego-responsable-ante-encuentros-deportivos).

No official Peru support line or treatment directory was verified, so the UI states that the category is unavailable instead of inventing a resource. Help remains free of casino, bonus, affiliate and Programme actions.

## Commercial and data boundary

The existing Production Betsson PE/SE release is read-only input to this feature. GEO-LOCALIZATION-01 performs no import or factual-content mutation. PE commercial readiness requires, cumulatively, existing B4GAMBLE authority, a current exact operator/domain match, operator-market licence evidence, advertising authority, cleared promotional-copy review, partner approval, active offer and tracking readiness. Current public action remains unavailable.

## Adding the next market or locale

1. Add or extend one market entry and one explicit locale route in `lib/market/registry.ts`; do not add casino or commercial facts there.
2. Complete every typed static catalog key and the bounded language-QA target for the locale. Record source, automated QA, Founder publication, legal review, market evidence and indexing as separate states.
3. Add authoritative local safety evidence before enabling localized Help or Responsible Gambling. Keep unverified categories unavailable.
4. Verify the existing exact-country casino projection for the new market. Do not add a global factual fallback.
5. Add resolver, canonical, legacy, metadata, selector, responsive, real-data isolation and fail-closed commercial tests.
6. Keep the route Preview-only and `noindex` until Founder publication authority is recorded. Publication never implies indexing, legal or commercial authority.

Adding another language to an existing country creates another locale route under that market. Adding the same language to a different country creates a separate market entry and public slug. Neither case changes the resolver or factual data model.

## Verification contract

- deterministic resolver, legacy redirect, cookie, canonical, hreflang, robots and safety tests: `tests/geo-localization-routing.test.ts`;
- desktop/mobile selector, route, overflow and safety browser tests: `tests/geo-localization-browser.spec.ts`;
- cross-market casino projection isolation: existing `tests/casino-market-architecture.test.ts` and `tests/casino-market-architecture-postgres.test.ts`;
- complete catalog report: `docs/internationalisation/ai-language-qa-report.json`.

Hosted Preview verification must record the exact Preview URL and test Home, discovery, Betsson PE/SE detail, selector persistence, legacy redirects, canonical/hreflang/robots, responsive widths and absence of outbound commercial action. Production deployment and merge are outside this implementation record.

| Preview gate | Required result before Founder acceptance |
| --- | --- |
| `/en-gb`, `/sv-se`, `/es-pe` | `200`, matching `html lang`, self-canonical URL and explicit selector state |
| market-neutral and legacy inputs | deterministic single redirect; canonical destination has no `country` parameter |
| PE / SE discovery and Betsson detail | exact-country factual values only; no cross-market leakage |
| commercial action | no governed outbound CTA for the current PE/SE factual-only records |
| SEO | reciprocal existing alternates, neutral `x-default`, PE/SE `noindex, follow`, no query duplicate |
| responsive shell | no horizontal overflow at 360, 390, 430, 768, 1024 and 1440 pixels |
| Programme | existing market-first Programme path and access/persistence behavior remain intact |
