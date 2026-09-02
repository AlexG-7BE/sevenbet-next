# Localization quality and route coverage

**Evidence date:** 31 August 2026; amended 2 September 2026

**Scope:** historical PR #105 quality inventory plus GEO-LOCALIZATION-01 route amendment

**Assurance:** repository and rendered-runtime engineering evidence; not legal review, commercial authority or a new Founder publication decision

**Closure status:** durable route, authority and QA-method inventory; transient clean-pass, exact-head CI and hosted-Preview evidence belongs in PR #105 rather than this repository snapshot

> **2 September amendment — DETECTED/PROPOSED:** PR #105 is merged at
> `f457099`. The explicit GEO-LOCALIZATION-01 Founder instruction supersedes
> every market-first public-path example in this historical audit. Canonical
> public presentation paths are now lowercase `/{locale-market}` (for example
> `/en-gb`, `/sv-se`, `/es-pe`); unprefixed paths are neutral resolver inputs.
> PE / `es-PE` is a `PUBLIC_CORE_READY`, AI-QA-passed, noindex public
> presentation with bounded MINCETUR-backed Help/RG copy and no commercial
> action. The current implementation record and exact route rules are in
> [GEO-LOCALIZATION-01](GEO-LOCALIZATION-01.md). Programme paths remain governed
> separately and are not changed by this amendment.

## Evidence and authority

The states below are **DETECTED** from the current route tree,
`lib/market/routing.ts`, `lib/market/registry.ts`,
`lib/i18n/review-state.ts`, `middleware.ts`, the public renderers and
`scripts/localization-visual-review.mjs`. The publication decisions are taken
from the current explicit Founder instruction and RFC-037; passing engineering
QA does not change them.

For the route matrix, these exact locale sets are used:

- `EUROPE_AUTHORED`: `en-GB`, `de-DE`, `es-ES`, `sv-SE`, `da-DK`, `el-GR`,
  `it-IT`, `pt-PT`, `nl-NL`, `fi-FI`, `nb-NO`.
- `PUBLICATION_SET`: `en-GB`, `de-DE`, `es-ES`, `es-PE`, `sv-SE`, `da-DK`, `el-GR`.
- `FIRST_WAVE_SAFETY`: `en-GB`, `de-DE`, `es-ES`, `es-PE`, `sv-SE`, `da-DK`,
  `el-GR`.
- `GB_ONLY`: `en-GB` on the existing unprefixed contract.

`EUROPE_AUTHORED` routes are directly inspectable in Preview, subject to the
route-specific exceptions below. In Production, this branch's middleware would
admit only `PUBLICATION_SET`; that is a branch contract, not a statement that
PR #105 has been merged or deployed.

## All-locale publication, selector, indexing and commercial matrix

The Preview and Production selector columns describe the selector implemented
by this branch. Both deliberately expose only `PUBLIC_CORE_READY` locales. A
direct Preview route for a selector-hidden draft is an editorial inspection
surface, not publication acceptance. All non-GB indexing remains off and all
commercial decisions remain independently server-authoritative and
fail-closed.

| Market | Locale | Public experience | Authored/runtime scope | AI language QA | Founder publication | Preview selector | Production selector | Direct Preview route | Direct Production route under this branch | Indexing | Commercial status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GB | `en-GB` | `PUBLIC_CORE_READY` | Existing unprefixed baseline | Source baseline; not applicable | Source-baseline authority | yes | yes | yes | existing baseline | Existing GB route policy; demo, empty and unsafe states remain route-level `noindex` | `DENIED_FAIL_CLOSED`; current GB jurisdiction/partner/action gates do not permit referral |
| DE | `de-DE` | `PUBLIC_CORE_READY` | Full localizable public core plus first-wave safety | `AI_LANGUAGE_QA_PASSED` | accepted | yes | yes | yes | yes after ordinary merge/deploy; not deployed by this PR state | `NOT_ACTIVATED`; `noindex, follow`; sitemap-excluded | `DENIED_FAIL_CLOSED`; translation and market evidence grant no action |
| ES | `es-ES` | `PUBLIC_CORE_READY` | Full localizable public core plus first-wave safety | `AI_LANGUAGE_QA_PASSED` | accepted | yes | yes | yes | yes after ordinary merge/deploy; not deployed by this PR state | `NOT_ACTIVATED`; `noindex, follow`; sitemap-excluded | `DENIED_FAIL_CLOSED`; operator/advertising/copy and ordinary commercial evidence remain required |
| PE | `es-PE` | `PUBLIC_CORE_READY` | Full localizable public core plus bounded MINCETUR-backed safety | `AI_LANGUAGE_QA_PASSED` | accepted | yes | yes | yes | yes after the scoped release correction | `NOT_ACTIVATED`; `noindex, follow`; sitemap-excluded | `DENIED_FAIL_CLOSED`; exact operator/domain, partner, offer, tracking and ordinary commercial evidence remain required |
| SE | `sv-SE` | `PUBLIC_CORE_READY` | Full localizable public core plus first-wave safety | `AI_LANGUAGE_QA_PASSED` | accepted | yes | yes | yes | yes after ordinary merge/deploy; not deployed by this PR state | `NOT_ACTIVATED`; `noindex, follow`; sitemap-excluded | `DENIED_FAIL_CLOSED`; current licence/partner/offer/action evidence remains required |
| DK | `da-DK` | `PUBLIC_CORE_READY` | Full localizable public core plus first-wave safety | `AI_LANGUAGE_QA_PASSED` | accepted | yes | yes | yes | yes after ordinary merge/deploy; not deployed by this PR state | `NOT_ACTIVATED`; `noindex, follow`; sitemap-excluded | `DENIED_FAIL_CLOSED`; current licence/partner/offer/action evidence remains required |
| GR | `el-GR` | `PUBLIC_CORE_READY` | Full localizable public core plus first-wave safety | `AI_LANGUAGE_QA_PASSED` | accepted | yes | yes | yes | yes after ordinary merge/deploy; not deployed by this PR state | `NOT_ACTIVATED`; `noindex, follow`; sitemap-excluded | `DENIED_FAIL_CLOSED`; HGC Affiliate Suitability and every ordinary commercial gate remain unverified/required |
| IT | `it-IT` | `HOME_READY` | Home plus selector-hidden draft public-core routes; no localized safety route | `AI_LANGUAGE_QA_PASSED` | not accepted | no | no | yes, for eligible public routes | no; middleware rejects localized Production presentation | `NOT_ACTIVATED`; Preview route is `noindex, follow`; sitemap-excluded | `DENIED_FAIL_CLOSED`; no publication or commercial authority |
| PT | `pt-PT` | `HOME_READY` | Home plus selector-hidden draft public-core routes; no localized safety route | `AI_LANGUAGE_QA_PASSED` | not accepted | no | no | yes, for eligible public routes | no; middleware rejects localized Production presentation | `NOT_ACTIVATED`; Preview route is `noindex, follow`; sitemap-excluded | `DENIED_FAIL_CLOSED`; no publication or commercial authority |
| NL | `nl-NL` | `HOME_READY` | Home plus selector-hidden draft public-core routes; no localized safety route | `AI_LANGUAGE_QA_PASSED` | not accepted | no | no | yes, for eligible public routes | no; middleware rejects localized Production presentation | `NOT_ACTIVATED`; Preview route is `noindex, follow`; sitemap-excluded | `DENIED_FAIL_CLOSED`; no publication or commercial authority |
| FI | `fi-FI` | `HOME_READY` | Home plus selector-hidden draft public-core routes; no localized safety route | `AI_LANGUAGE_QA_PASSED` | not accepted | no | no | yes, for eligible public routes | no; middleware rejects localized Production presentation | `NOT_ACTIVATED`; Preview route is `noindex, follow`; sitemap-excluded | `DENIED_FAIL_CLOSED`; no publication or commercial authority |
| NO | `nb-NO` | `HOME_READY` | Home plus selector-hidden draft public-core routes; no localized safety route | `AI_LANGUAGE_QA_PASSED` | not accepted | no | no | yes, for eligible public routes | no; middleware rejects localized Production presentation | `NOT_ACTIVATED`; Preview route is `noindex, follow`; sitemap-excluded | `DENIED_FAIL_CLOSED`; no publication or commercial authority |
| CA | `en-CA` | `ARCHITECTURE_ONLY` | Typed market/locale architecture only; no localized renderer | required | not accepted | no | no | no; direct requests fail closed | no; direct requests fail closed | not approved; no localized sitemap entry | `DENIED_FAIL_CLOSED`; no public runtime or commercial authority |
| CA | `fr-CA` | `ARCHITECTURE_ONLY` | Typed secondary-locale architecture only; no localized renderer | required | not accepted | no | no | no; direct requests fail closed | no; direct requests fail closed | not approved; no localized sitemap entry | `DENIED_FAIL_CLOSED`; no public runtime or commercial authority |

`HOME_READY` records catalog readiness, not public-core parity. The direct draft
routes above remain selector-hidden and Preview-only. `ARCHITECTURE_ONLY` does
not authorise generated copy, routing, selector exposure or indexing.

## Exact public route matrix

The matrix reflects the renderer and behavior in the current repository. “No
error state” means there is no route-specific boundary; the shared public
boundary still applies. Optional local visual fixtures exist only for local QA
and do not describe public inventory.

| ROUTE | RENDERER | LOCALIZED? | SUPPORTED LOCALES | DATA DEPENDENCY | COMMERCIAL DEPENDENCY | MOBILE VARIANT | EMPTY STATE | ERROR STATE | SPECIAL VISUAL LAYOUT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | `HandoffPage("home")` plus `transformHomeHandoff` / locale CSS transform | yes | `EUROPE_AUTHORED` in Preview; `PUBLICATION_SET` in Production | Repository handoff HTML/CSS and typed Home catalog | none | Purpose-built responsive hero composition, short-viewport handling, mobile imagery/copy/CTA/meta flow | not applicable | shared public boundary | Art-directed photo theatre, display headline, CTA, mission/meta line and scroll transition |
| Shared shell on localizable routes | `PublicLayout`, `PublicHeader`, `PublicNavigation`, `MarketLanguageSelector`, `PublicFooter` | yes | Same locale as the containing localized route | Presentation registry/headers and server session for account navigation; no inventory dependency | none; selector changes presentation only | Separate desktop navigation and modal mobile menu; selector exists in both | not applicable | containing route boundary | Fixed/overlaid header themes, mobile dialog with focus restoration/body-scroll release, grouped editorial footer |
| `/best-offers` | Server `BestOffersPage` plus `BestOffersExperience` | yes | `EUROPE_AUTHORED` in Preview; `PUBLICATION_SET` in Production | `PublicOfferService`, presentation market, jurisdiction; repository demo fallback only where explicitly classified | `FAIL_CLOSED`; every outbound action requires independent authority | Ranked cards and material terms reflow/stack; contextual comparison remains usable | Designed `no-eligible` and `unavailable` panels with methodology/review recovery; no invented substitute | Localized `best-offers/error.tsx` with retry and review recovery | Editorial hero, ranked top-three/worth-a-look theatre, demo/source disclosure, optional contextual comparison |
| `/casinos` | Server `CasinosPage` plus `CasinoDiscovery`, curated shortlist and contextual comparison | yes | `EUROPE_AUTHORED` in Preview; `PUBLICATION_SET` in Production | `PublicCasinoDiscoveryService`, CMS/repository projection, query facets, presentation market and jurisdiction | `FAIL_CLOSED`; cards become review-only without cumulative action authority | Compact primary controls plus modal secondary filter drawer; cards and shortlist stack | Separate filtered-zero state with active chips/reset and unfiltered-zero state; nonfunctional filters are hidden only when no records and no active filters | Localized `casinos/error.tsx` with retry, methodology and Help recovery | Curated selector theatre, directory facets/sort/pagination, review-only disclosure and comparison dialog |
| `/casino/[slug]` | Server `CasinoPage` plus `CasinoProfile` | yes around source facts | `EUROPE_AUTHORED` in Preview; `PUBLICATION_SET` in Production | `PublicCasinoService`, `EditorialReviewService`, market-availability records and repository demo authority | `FAIL_CLOSED`; unavailable market/evidence removes action; demo never creates a referral | Profile rail/hero/evidence, term rows and editorial navigation stack or wrap | Existing record outside the presentation market remains readable with action unavailable; absent slug is a localized 404 | Localized profile `not-found.tsx` and `error.tsx` | Source-controlled operator/licence/payment facts remain exact; surrounding UI and demo editorial are localized and explicitly qualified |
| `/bonuses` | Server `BonusesPage` plus `BonusDirectory`, `CuratedBonusShortlist` and calculator | yes | `EUROPE_AUTHORED` in Preview; `PUBLICATION_SET` in Production | `PublicOfferService`, query/facets, presentation market and jurisdiction | `FAIL_CLOSED`; offer action is absent unless every authority passes | Mobile/desktop filter surfaces, stacked material terms/cards and wrapping curated selectors | Distinct service-unavailable, unfiltered-zero and filtered-zero states; active filters/reset remain when meaningful | Localized `bonuses/error.tsx` with retry and guide recovery | Curated selector theatre, comparison list, pagination, calculator, methodology and disclosure sections |
| `/compare` | `CompareRedirect` to localized `/casinos` plus `ContextualComparison` | yes by canonical destination | `EUROPE_AUTHORED` in Preview; `PUBLICATION_SET` in Production | Validated comparison query; destination then uses casino discovery data | `FAIL_CLOSED`; comparison is editorial and does not grant action | Dialog/selection presentation reflows within the Casinos renderer | No standalone empty document; zero/invalid selection is handled in the contextual comparison and Casinos result states | Localized `compare/error.tsx` for the route-segment failure fixture | One-hop permanent canonical redirect preserving validated selection query and market prefix |
| `/10-steps` | `HandoffPage("tenSteps")` plus `transformTenStepsHandoff` | yes | `EUROPE_AUTHORED` in Preview; `PUBLICATION_SET` in Production | Repository-authored static content/catalog | none; Programme link stays on the protected unprefixed contract | Responsive editorial timeline/cards/CTA | not applicable | shared public boundary | Public explanation of Programme only; CTA may enter `/program`, but this route does not localize Programme runtime |
| `/about` | Server `AboutPage` plus `AboutDocument` | yes | `EUROPE_AUTHORED` in Preview; `PUBLICATION_SET` in Production | Repository-authored static catalog | none | Editorial grid becomes a single-column reading flow | not applicable | shared public boundary | Trust/editorial document with localized structured data |
| `/contact` | Server `ContactPage` plus client `ContactForm` | yes | `EUROPE_AUTHORED` in Preview; `PUBLICATION_SET` in Production | Static catalog; optional `POST /api/contact` transport on submit; no application-database message persistence | none; form purpose is isolated from commercial and Programme use | Two-column context/form grid stacks; touch-sized form actions | No-JavaScript mail fallback and safe delivered/rejected/unavailable form states | Form reports bounded validation/provider-unavailable state; shared route boundary remains | Protected-Help-first context block, support mailbox fallback and localized validation copy |
| `/faq` | Server `FAQPage` | yes | `EUROPE_AUTHORED` in Preview; `PUBLICATION_SET` in Production | Repository-authored static catalog | none | Accordion groups and contact rail reflow for narrow screens | not applicable | shared public boundary | Multi-group disclosure/accordion document and trust rail |
| `/methodology` | `HandoffPage("methodology")` plus localized transform | yes | `EUROPE_AUTHORED` in Preview; `PUBLICATION_SET` in Production | Repository-authored static catalog/handoff source | none; explains ranking without activating it | Responsive editorial sections/cards | not applicable | shared public boundary | Long-form methodology with source/ranking explanation and structured data |
| `/learn` | `HandoffPage("learn")` plus localized Learning transform | yes | `EUROPE_AUTHORED` in Preview; `PUBLICATION_SET` in Production | Repository Learning categories/articles and localized catalogs | none; non-safety articles may link internally to comparison, never grant action | Search/topic controls and article cards reflow | Localized zero-search-result status with a clear/filter recovery path | shared public boundary | Searchable editorial hub with topic filters, cards and structured data |
| `/learn/[category]` | `LearningCategoryRedirect` | yes by canonical destination | `EUROPE_AUTHORED` in Preview; `PUBLICATION_SET` in Production | Repository category registry | none | inherited from `/learn` | Unknown category produces localized 404 | localized not-found through the known route family | Permanent redirect to localized `/learn?category=…`, preserving the market prefix |
| `/learn/[category]/[slug]` | Server `LearningArticlePage` plus `LearningArticleView` | yes | `EUROPE_AUTHORED` in Preview; `PUBLICATION_SET` in Production | Repository article/category/author records and localized article catalog; claim-level source status may be unavailable and is stated | none; responsible-gambling articles prohibit comparison transitions; other comparison links remain internal/editorial | Article hero/meta, contents, callouts, tables, FAQ and related cards recompose at narrow widths; tables may scroll intentionally | Unknown article is localized 404; unavailable claim-level source evidence is shown explicitly rather than fabricated | localized not-found; shared public error boundary | Long-title hero/meta grid, table/TOC/checklist/callout system and protected safety-article bridge |
| Exact `/help` | GB `HandoffPage("help")`; DE/ES/SE/DK/GR `FirstWaveSafetyPage` | yes, bounded | `FIRST_WAVE_SAFETY` only | GB protected Help registry/handoff; first-wave typed authority/resource evidence | `PROHIBITED`; no operator, bonus, affiliate or Programme action | Resource cards and evidence blocks stack | Missing resource category renders a neutral localized unavailable message | no route-specific boundary; isolated root global fallback remains | Evidence date/authority attribution, external-link labels, urgent-help disclaimer and local Help/RG navigation |
| Exact `/responsible-gambling` | GB `HandoffPage("responsibleGambling")`; DE/ES/SE/DK/GR `FirstWaveSafetyPage` | yes, bounded | `FIRST_WAVE_SAFETY` only | GB repository content; first-wave typed authority/resource evidence | `PROHIBITED`; safety data is not a commercial input | Resource cards and evidence blocks stack; long localized H1 is content-sized | Missing resource category renders a neutral localized unavailable message | shared public boundary | Non-commercial safety hub with evidence attribution and no substituted GB resource on non-GB pages |
| `/help/[slug]` | `ProtectedHelpArticleRedirect` | no localized subtree | `GB_ONLY` | Protected Help article registry | `PROHIBITED` | destination Help layout | Unknown slug redirects to `/help` | no route-specific boundary; root fallback remains | Permanent canonical redirect to an anchored protected Help section |
| `/responsible-gambling/[slug]` | `LegacyResponsibleGamblingGuide` | no localized subtree | `GB_ONLY` | Legacy responsible-gambling route registry | `PROHIBITED` | destination Help layout | Unknown slug is 404 | root/protected not-found | Permanent canonical redirect, usually to anchored `/help`, preserving bounded query data |
| `/responsible-gaming`, `/self-check`, `/tools/budget-calculator` | Permanent redirect renderers | no localized route | `GB_ONLY` | none | `PROHIBITED` | destination responsive layout | not applicable | root boundary | Compatibility/control-tool redirects to canonical `/responsible-gambling` |
| `/bonus-guide` | `HandoffPage("bonusGuide")` | no; deliberately unprefixed | `GB_ONLY` | Repository editorial content | none | Responsive long-form guide | not applicable | shared public boundary | Hypothetical educational examples, sticky guide navigation and non-commercial Help bridge |
| `/catalog` | `CatalogRedirect` | no localized route | `GB_ONLY` | Validated casino discovery query | `FAIL_CLOSED` at destination | inherited from `/casinos` | inherited from `/casinos` | root boundary | Permanent compatibility redirect to `/casinos`, preserving validated query state |
| `/login` | Server `LoginPage` plus `LoginExperience` | no; deliberately unprefixed | `GB_ONLY` | Better Auth session/configuration | none | Responsive authentication panel | Provider-unavailable/auth state is explicit | authentication component state/shared boundary | Account identity boundary; no locale or market choice grants age/Programme/commercial authority |
| `/terms`, `/privacy`, `/affiliate-disclosure` | Repository legal document renderers / `HandoffLegalPage` | no; `LEGAL_REVIEW_GATED` | `GB_ONLY` | Operative GB legal documents and, for Privacy, detected Article 27 representation record | none; Affiliate Disclosure describes the commercial model only | Responsive legal-document reading layout | not applicable | shared public boundary | Localized shells link back to the exact unprefixed operative bodies; no translated body is represented as local law |
| `/program/**` | `ProgramAiExperience` and protected Programme route tree | no; `PROTECTED` | `GB_ONLY` | Programme session/account/runtime APIs and server-owned progression | `SEPARATED`; Programme/Help/private data is prohibited from commercial routing | Dedicated Programme experience | Programme-owned unavailable/not-found states | Programme-specific not-found/error behavior | Deliberately outside localized routing; reward, Mission and privacy authority unchanged |
| `/outbound/unavailable` | `CommercialHandoffUnavailable` | no; internal recovery route | `GB_ONLY` | none | `FAIL_CLOSED` terminal state | Responsive status panel | This route is the unavailable state | standalone recovery surface | `noindex, nofollow`; no substitute destination or offer |
| `/outbound/[slug]` | Server `CommercialHandoffPage` plus `CommercialHandoffConfirmation` | no; internal action boundary | `GB_ONLY` | Current request-country and `AffiliateRedirectService` authority resolution | Every cumulative jurisdiction/partner/operator/offer/tracking/destination gate required | Responsive confirmation panel | Invalid slug, disabled engine, denied evidence or resolution failure redirects to `/outbound/unavailable` | Exceptions recover fail-closed | `noindex, nofollow`; confirmation cannot infer authority from the incoming URL |
| `/r/[slug]` | Server affiliate redirect route | no; internal/mutation boundary | none as a localized presentation | Current request-country, jurisdiction, partner/operator/offer/tracking and destination evidence | All cumulative gates required; current result remains deny-by-default | not applicable | Any disabled, missing, stale, conflicting or failed authority redirects to `/outbound/unavailable` | Resolution exceptions also recover fail-closed | Re-evaluates authority at request time; never trusts a prior render or localized route |
| `/go/[slug]` | Legacy server redirect route | no; internal boundary | none as a localized presentation | Current jurisdiction decision only | Always non-commercial legacy denial | not applicable | Always redirects to `/outbound/unavailable` | same fail-closed redirect | No independent external authority remains |
| `/robots.txt` | Next metadata route `app/robots.ts` | no localized variant | global machine endpoint | Repository site origin | none | not applicable | not applicable | framework metadata-route behavior | Points crawlers at the one sitemap; does not activate localized indexing |
| `/sitemap.xml` | Dynamic Next metadata route `app/sitemap.ts` | no separate localized document; entries are authority-gated | GB entries only while no non-GB indexing locale is approved | Core route list, repository Learning content and fail-closed Casino/Offer snapshot loaders | Read-only editorial projection with null commercial authority; no action URL | not applicable | Failed dynamic loads are omitted rather than replaced; static/core entries remain | loader calls are individually fail-closed | Localized entries require `localizedProductIndexingApproved`; currently none pass |
| `/llms.txt` | Static text route `app/llms.txt/route.ts` | no; deliberately unprefixed | `GB_ONLY` | Repository core route and Learning article records | none | not applicable | not applicable | static text response | Public machine-readable orientation only; route manifest classifies it as internal to localization |
| Known localizable family, missing record | Root `NotFound` handoff or localized profile unavailable renderer | yes | `EUROPE_AUTHORED` in Preview; `PUBLICATION_SET` in Production | Route registry or requested record | none; no fallback offer/action | Responsive full-shell 404/unavailable panel | This is the explicit state | truthful HTTP 404 | Keeps localized shell and safe navigation for `/casino/[slug]` and Learning misses |
| Unknown/nonlocalizable path | Root `NotFound` | no inferred locale context | `GB_ONLY` fallback | none | none | Responsive full-shell 404 | This is the explicit state | truthful HTTP 404 and `noindex` behavior | Invalid market/route combinations do not acquire localized runtime context |
| Public route errors | `(public)/error.tsx`; route-specific boundaries for Best Offers, Bonuses, Casinos, Casino profile and Compare | yes where the failed route has valid localized context | `EUROPE_AUTHORED` in Preview; `PUBLICATION_SET` in Production | none beyond the failed dependency | Commercial-specific boundaries stay fail-closed | Content-sized responsive panels and separated actions | not applicable | Localized retry plus safe Home/reviews/methodology/Help recovery; no provider, stack or digest leak | Real route-segment errors are exercised only by a local, fail-closed fixture |
| Root global failure | `app/global-error.tsx` | no; intentionally standalone English fallback | root fallback only | none; imports no app shell, auth, data, analytics, communications or provider | none | Minimal responsive panel | not applicable | reload, Home and Help actions | Isolation is the safety property; it must survive failure of the localization/application tree |
| `/launch-polish-error-harness` | Local-only test harness | no; deliberately unprefixed | none in ordinary Preview/Production | Exact local QA environment flags | none | not a public surface | 404 unless exact local harness conditions are true | intentional local throw only | Never exposed as a localized or Production route |

### Route families excluded from localized rewriting

| Family | Detected policy | Consequence |
| --- | --- | --- |
| `/terms`, `/privacy`, `/affiliate-disclosure` | `LEGAL_REVIEW_GATED` | Operative legal bodies remain unprefixed and GB-reviewed only. |
| `/program/**` and `/help/**` except exact `/help` | `PROTECTED` | Programme and Help subroutes cannot be acquired through a market prefix. |
| `/responsible-gambling/**` except exact `/responsible-gambling`, `/responsible-gaming`, `/bonus-guide`, `/catalog`, `/login`, `/self-check`, `/tools/**` | `UNPREFIXED_ONLY` | A localized prefix is rejected rather than silently rewriting a protected or legacy route. |
| `/admin/**`, `/api/**`, `/mcp/**`, `/.well-known/**`, `/editorial-preview/**`, `/go/**`, `/r/**`, `/outbound/**`, `/llms.txt` | `INTERNAL` | No localized presentation route, locale-derived authority or public selector entry is created. |
| Unknown route root or unsupported market/locale pair | no manifest authority | Fails closed without localized headers or renderer; never falls through to a guessed market. |

## Data absence versus UI omission

The classification is about rendered completeness, not whether B4GAMBLE has
commercial inventory. A zero result may be the correct product result.

| Case | Classification | Detected interface contract |
| --- | --- | --- |
| No eligible Best Offers records for the presentation market | `DATA_ABSENCE` | Render a complete editorial hero and designed state panel with methodology/review recovery; do not borrow another market's offer. |
| Best Offers data service cannot be read safely | `DATA_ABSENCE / SERVICE_UNAVAILABLE` | Render the localized unavailable boundary; do not use a cached or invented substitute. |
| Casinos or Bonuses has zero unfiltered records | `DATA_ABSENCE` | Keep the page hero, directory heading, disclosure/methodology or FAQ context and deliberate zero state. Hide facets that have no truthful function. |
| A Casino or Bonus filter combination returns zero | `DATA_ABSENCE` | Keep active filter chips, meaningful controls and a localized reset; do not make the directory look unfinished. |
| Requested Casino or Learning record does not exist | `DATA_ABSENCE` | Return a localized truthful 404/unavailable state inside a valid localized route family. |
| A casino exists but lacks availability/action authority for the presentation market | `DATA_ABSENCE` | Keep the editorial profile where permitted, label the action unavailable and expose no substitute referral. |
| A first-wave safety resource category has no verified local record | `DATA_ABSENCE` | State that no verified local resource is available; never substitute a GB provider or fabricate a local service. |
| Learning search has no match | `DATA_ABSENCE` | Show a localized live result status and a clear/topic recovery path. |
| Selector-hidden IT/PT/NL/FI/NO or runtime-hidden CA | `DATA_ABSENCE / AUTHORITY_ABSENCE` | Preserve the explicit draft or architecture-only state; do not present engineering readiness as publication. |
| Missing editorial shell, recovery copy, active-filter reset, source/demo disclosure, safety attribution or truthful unavailable state | `UI_OMISSION` | Not an allowed market difference. It is a defect and must be restored without inventing inventory. |

No row in the current intentional route contract is classified as an accepted
`UI_OMISSION`. Conditional removal of unfiltered, nonfunctional commercial
facets is a truthful `DATA_ABSENCE` response; removal of useful editorial
structure or of controls needed to understand/reset an active filter is not.

## Rendered quality gates

The implementation separates three layers:

1. Typed catalog QA checks source-key completeness, non-empty strings, Unicode,
   interpolation structure, obvious wrong-language leakage, protected names,
   product-boundary semantics and unique curated-control meanings.
2. Rendered browser QA checks response/canonical behavior, document language,
   unresolved tokens, fake controls, selector membership, non-GB `noindex`,
   absence of non-GB commercial actions, generic-English UI leakage, image and
   console failures, document/text overflow, clipped descendants, non-painted
   disclosure descendants, pathological data columns, display-heading
   word-boundary integrity and critical sibling/action/dialog intersections.
   Fitting authored heading words must remain whole; only genuinely overlong
   localized compounds may auto-hyphenate behind the 14-character guard, and
   unhyphenated mid-word fragmentation is rejected.
3. Screenshot review checks composition, crop, hierarchy, whitespace, wrapping,
   card density, empty/error states, interaction-open states and visual parity.

The current harness is configured for:

- Home at `320x700`, `360x800`, `375x812`, `390x844`, `393x852`, `412x915`,
  `430x932`, `480x900`, `768x1024`, `820x1180`, `1024x768`, `1280x800`,
  `1366x768`, `1440x900`, `1536x960`, `1920x1080` and the short-mobile
  `390x667` case for every authored European locale;
- public-core routes at `390x844`, `430x932`, `768x1024` and `1440x900` for
  `PUBLICATION_SET`;
- authored draft routes at `390x844` and `1440x900`;
- expanded mobile navigation at `320x700`, `360x800`, `390x844`, `430x932`
  and `768x1024`;
- populated/designed-empty, filtered-empty, pagination, open-filter,
  comparison, missing-record, route-error and first-wave safety states; and
- CA `en-CA` and `fr-CA` architecture checks that require direct Home/Casinos
  requests to remain outside localized rendering.

This durable document does not hard-code transient acceptance evidence. The
final screenshot total, consecutive clean-pass sequence, exact-head CI run,
exact Preview deployment and hosted visual acceptance are recorded against the
exact commit in PR #105.

Operator names, legal entities, licence identifiers, payment names and exact
offer/source facts remain source-controlled. Their surrounding interface is
localized; source facts are not rewritten to manufacture evidence.

## Founder defects converted to regressions

- German Home uses a locale-aware hero cap and wrapping kicker without reducing
  the global display scale.
- Spanish Home uses natural punctuation and art-directed lines without a
  stranded punctuation mark.
- Product messages are interpolated before display; unresolved `{market}`-type
  tokens are rendered failures.
- Curated Bonus/Casino controls keep stable semantic values and localized labels
  rather than fake numbered filters.
- Mobile navigation, selector, directory drawers and contextual comparison are
  exercised open, including containment and action separation.
- Filtered zero states require active state plus a reset; localized commercial
  errors require separated, useful recovery actions.
- Native German, Swedish and Danish Learning H1s stay within the viewport, out
  of the summary lane and whole-word at `390px`; representative German `320px`
  and `1440px` states are also gated.
- Finnish and Greek About hero titles use compact narrow-screen sizing at
  `320px`, `390px` and `430px`; their words remain whole and viewport-bound
  while the portrait focal point stays visible.
- The demo Casino profile localizes B4GAMBLE-authored UI while keeping exact
  source-controlled evidence qualified and action-free.
- Preview and Production selectors expose only `PUBLIC_CORE_READY` locales.

## Bounded conclusions

- **DETECTED:** no change represented here activates a partner, operator, offer,
  tracking link, referral, non-GB indexing or localized operative legal body.
- **DETECTED:** non-GB commercial actions remain subject to the existing
  independent cumulative fail-closed authority path; locale, URL, selector,
  fixture and Founder editorial publication acceptance cannot grant it.
- **DETECTED:** Programme, protected Help/private data and legal-body boundaries
  remain outside localized commercial routing.
- **PROPOSED UNTIL MERGE:** the localized runtime, responsive repairs and QA
  gates are PR #105 working-tree state, not Production state.
- **UNKNOWN UNTIL FINAL VERIFICATION:** final clean-pass evidence, exact-head
  GitHub CI, Vercel Preview readiness and hosted screenshot acceptance.
