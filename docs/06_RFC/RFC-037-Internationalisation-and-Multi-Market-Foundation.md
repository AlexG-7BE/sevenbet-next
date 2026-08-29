# RFC-037 — Internationalisation and Multi-Market Foundation

## Status

Approved by Founder instruction on 2026-08-29 for implementation planning and controlled execution on a feature branch. The canonical URL architecture was superseded by the explicit Founder market-first URL decision on 2026-08-30.

## Decision

B4GAMBLE will become a market-aware, multi-language product **before** additional affiliate networks or operators approve B4GAMBLE for those markets.

The commercial sequencing is deliberately infrastructure-first:

```text
MARKET + LOCALE INFRASTRUCTURE
→ LIVE LOCALIZED B4GAMBLE VERSIONS
→ PARTNER REASSESSMENT / APPLICATION
→ APPROVED MARKET + BRAND + OFFER EVIDENCE
→ COMMERCIAL ACTIVATION
```

A localized market version is evidence that B4GAMBLE can serve that audience. It is **not** evidence that B4GAMBLE has an approved affiliate relationship, an operator offer, a licence right, or referral authority in that market.

The runtime product model becomes:

```text
REQUEST
→ TRUSTED COUNTRY SIGNAL
→ MARKET RESOLUTION
→ LOCALE RESOLUTION
→ LOCALIZED PUBLIC PRODUCT
→ MARKET-ELIGIBLE EDITORIAL INVENTORY
→ COMMERCIAL AUTHORITY, WHEN PRESENT
→ OFFER/TRACKING RESOLUTION
```

Market and locale are separate concepts. Language never grants market or commercial authority.

## Founder business objective

Partner networks have asked B4GAMBLE to return for review when localized market versions are live. B4GAMBLE therefore must not wait for offers before building the localization and market-delivery layer. The site itself must demonstrate that it can:

- identify the visitor's likely market from a trusted request signal;
- serve the appropriate local language and market context;
- expose stable localized URLs that a partner can review directly;
- present market-specific editorial/service content even when no affiliate offer is active;
- show only market-appropriate casino/offer actions once exact commercial authority exists;
- remain usable when market or commercial evidence is unknown.

## Detected implementation baseline

At repository `main` SHA `685132e671a2e760395caa07cecfe36460958e40`:

- `lib/jurisdiction/request-country.ts` already reads Vercel `x-vercel-ip-country` only in trusted Preview/Production runtime.
- `lib/jurisdiction/server.ts` already resolves request-local jurisdiction server-side.
- `JurisdictionResolver` already separates editorial, commercial and referral capabilities and fails commercial/referral closed.
- the repository-controlled jurisdiction policy store currently contains only Great Britain.
- `CasinoCountry` already models per-casino country availability.
- casino records already contain language and currency fields.
- affiliate offers/programmes/tracking links already contain country, language and currency scoping primitives.
- `PublicOfferService` can filter offers by country, but defaults to `GB`.
- the public sitemap currently requests best offers with hard-coded `GB`.
- the root document is globally `<html lang="en">` and global metadata is English.
- no detected locale routing layer or translation catalog is present in the current public App Router structure.

Therefore the work is an expansion of an existing market/commercial foundation, not a greenfield rewrite.

## Core invariants

### 1. Market is not locale

Examples:

- market `GB` may default to locale `en-GB`;
- market `DE` may default to locale `de-DE`;
- market `ES` may default to locale `es-ES`;
- Spanish can later be used by other market profiles without making those markets equivalent to Spain;
- market `CA` can support more than one locale over time;
- a user may choose another supported language without acquiring commercial eligibility for another country.

### 2. Localization may exist without affiliate inventory

A market can be `EDITORIAL_READY` while having zero approved commercial offers. In that state the localized site remains live and useful, but outbound affiliate action remains unavailable.

### 3. Geo is a default, not an irreversible lock

Trusted Vercel country detection chooses the initial market context when available. Users must be able to switch market/language manually. A user preference may choose presentation context but may not grant commercial/referral permission contrary to request-time jurisdiction authority.

### 4. No hard dependency on partner approval

The localization system, market routes, translated content, market metadata, selector UI, locale-aware sitemap and market-aware editorial projections must be independently deployable before a partner is approved.

### 5. Commercial remains cumulative and fail-closed

Existing RFC-014/RFC-015 boundaries remain in force for outbound actions. A translated page, market route, manually selected country or localized casino review cannot create partner, licence, offer, tracking or referral authority.

### 6. Programme and protected data stay outside commercial routing

Programme, Help, self-check, limits, vulnerability or other protected/safety data remain prohibited commercial-targeting inputs. Locale and market presentation may use request country and explicit user presentation preference only.

## URL architecture

Market is the primary public URL dimension. The default locale of a market is omitted from its canonical URL. Market and locale remain separate typed runtime concepts; omitting a default language segment does not merge them.

The existing unprefixed root remains the canonical default-market/default-locale baseline, avoiding an unnecessary Production SEO move:

```text
/                       = GB / en-GB
/casinos                = GB / en-GB
/casino/example         = GB / en-GB
```

Other markets using their default locale use one market segment:

```text
/de/
/it/
/es/
/pt/
/gr/
/nl/
/se/
/dk/
/fi/
/no/
```

Only a secondary locale adds its BCP-47 language subtag. This rule is generic rather than Canada-specific. For example, Canada default `en-CA` is `/ca/` and secondary `fr-CA` is `/ca/fr/`; a future Switzerland profile with default `de-CH` and secondary `fr-CH`/`it-CH` would use `/ch/`, `/ch/fr/` and `/ch/it/`.

This shape provides shorter, clearer partner-facing links and removes redundant paths such as `/de/de/`, while retaining multi-language flexibility and an explicit market for every non-default market. It does not change the commercial-authority model: a market segment, secondary-language segment, selected language or translated page remains presentation context only.

The Preview-only two-segment default-language routes are compatibility inputs, never canonical copies. They permanently redirect in one hop while preserving the equivalent path and query: `/de/de/...` to `/de/...`, `/gr/el/...` to `/gr/...`, and `/gb/en/...` to the unprefixed GB equivalent. A default-market alias such as `/gb/...` likewise redirects to the unprefixed canonical. Secondary locale routes such as `/ca/fr/...` remain canonical. Unsupported combinations such as `/de/en/...`, unknown markets and market-prefixed protected/internal routes fail closed without a public rewrite.

The central typed public-route policy is the only allowlist for market prefixes. Admin, API, MCP, authentication/integration callbacks, editorial Preview, affiliate redirects, outbound actions and other internal or mutation families are never localized by this routing layer. Geo-based presentation must never mutate an explicit URL, produce a redirect loop or create commercial authority.

## Market registry

Introduce one server-owned registry defining presentation support, independent of commercial permission. Each market profile contains at minimum:

- `countryCode`;
- `marketSlug`;
- `defaultLocale`;
- `supportedLocales`;
- `currencyHints`;
- `editorialState`;
- `legalContentState`;
- `commercialPresentationState`;
- `helpResourceProfile`;
- SEO display name;
- optional partner-readiness notes.

Presentation states must not duplicate or override jurisdiction/commercial authority. They answer whether the B4GAMBLE product experience is ready to be shown for the market, not whether an operator can receive referral traffic.

## Minimum partner-ready European localization tranche

The first infrastructure release should be capable of serving these explicit market/locale profiles:

| Market | Initial locale | Purpose |
| --- | --- | --- |
| Great Britain | `en-GB` | Existing baseline and compatibility reference. |
| Germany | `de-DE` | EGO/ComeOn and broader regulated-Europe relevance. |
| Italy | `it-IT` | NetoPartners and broader European partner-readiness relevance. |
| Spain | `es-ES` | EGO relevance and Spanish-language foundation; Spain remains a distinct market authority. |
| Portugal | `pt-PT` | SkillOnNet/EGO portfolio evidence and NetoPartners language coverage. |
| Greece | `el-GR` | Current SkillOnNet/EGO market relevance; commercial activation requires separate Greek authority checks. |
| Netherlands | `nl-NL` | NetoPartners and ComeOn portfolio relevance; commercial advertising remains subject to Ksa restrictions and exact operator authority. |
| Sweden | `sv-SE` | ComeOn/EGO portfolio relevance and localized partner review. |
| Denmark | `da-DK` | ComeOn/EGO portfolio relevance and localized partner review. |
| Finland | `fi-FI` | ComeOn/NetoPartners relevance and localized partner review. |
| Norway | `nb-NO` | ComeOn/NetoPartners relevance; commercial legality remains a separate authority question. |

Canada/Ontario remains architecturally supported because it is relevant to ComeOn and SkillOnNet, but it does not block the first European localization tranche.

This tranche is intentionally a **commercially motivated minimum**, not a promise to support every European language. It covers the languages and markets with current evidence across B4GAMBLE's priority multi-brand prospects while avoiding translation work that has no present partner-readiness value.

### Explicit exclusions from the initial casino-commercial tranche

As of the authoritative review on 2026-08-29:

- France is not treated as a B4GAMBLE online-casino commercial target because the French ANJ states that online casinos are not authorised. French can remain available where another supported market requires it, such as `fr-CA` in Canada.
- Poland is not treated as a B4GAMBLE private online-casino commercial target because current Polish Ministry of Finance guidance states that online casino activity, apart from statutory exceptions, is under the state monopoly. ComeOn's public brand material also conflicts with its general approved-jurisdiction terms for Poland.

These exclusions do not prohibit future editorial localization. They prevent the localization registry from being misread as a commercial-eligibility statement. A later authoritative legal/partner review may add a market if the relevant facts change.

Spanish-language expansion outside Spain is expected to reuse the localization capability but must add distinct market profiles (for example, a future Mexico profile) with their own market, legal, help, editorial and commercial authority. `es-ES` is not a proxy for all Spanish-speaking countries.

## Localization scope

The localization framework must cover the public product, not only navigation chrome.

Required translatable surfaces include:

- global header/footer/navigation;
- Home;
- About / FAQ / methodology and trust copy;
- casino discovery and comparison UI;
- casino profile presentation fields that are B4GAMBLE-authored;
- bonus/offer explanatory UI;
- Learning Center shell and B4GAMBLE-authored article content as localized content becomes available;
- Programme shell, instructions and authored educational copy;
- authentication/account UX exposed to public users;
- age/responsible-gambling notices;
- market selector and language selector;
- SEO title/description/OpenGraph and structured-data text where applicable;
- error/empty/unavailable states.

Operator-owned names, legal entities, licence identifiers and exact offer terms are not machine-translated as facts. They remain source facts and receive localized surrounding explanation only.

Legal/privacy/affiliate disclosure pages require market-aware content handling. A translation of GB legal copy must not be presented as a market-specific legal conclusion without review.

## Translation architecture

Use repository-controlled typed translation catalogs for product/UI copy and a locale-aware content layer for larger editorial content.

Requirements:

- English source strings remain canonical where appropriate.
- missing translation keys fail visibly in development/test and fall back safely in Production.
- locale fallback must never switch market authority.
- interpolation values are typed/validated.
- no raw HTML translation strings for security-sensitive UI.
- translation completeness is measurable by locale and route.
- machine-assisted translation is permitted as drafting infrastructure, but published market copy must have a review state and must not fabricate local legal or operator facts.

No third-party runtime translation SaaS is required for v1 unless a later decision proves clear value.

### Translation and publication review state

The implementation uses one typed review-state record per supported locale. Review state is publication authority, not a descriptive badge that a route can ignore.

| Locale set | Content state | Linguistic review | Legal review | Market-evidence review | Indexing |
| --- | --- | --- | --- | --- | --- |
| `en-GB` | approved source baseline | completed for the existing baseline | GB source reviewed | GB baseline | existing English routes remain indexable |
| `de-DE`, `it-IT`, `es-ES`, `pt-PT`, `el-GR`, `nl-NL`, `sv-SE`, `da-DK`, `fi-FI`, `nb-NO` | machine-assisted Preview draft | required | required for legal or jurisdiction-sensitive copy | required for local claims/resources | `noindex, follow`; excluded from the indexable sitemap |
| `en-CA`, `fr-CA` | architecture-only draft | required | required | required | not approved for publication/indexing |

Ordinary non-legal Preview routes may remain inspectable while noindex. Operative Terms, Privacy and Affiliate Disclosure bodies remain unprefixed and are not exposed as localized law until their legal gate is explicitly approved. Protected Programme and Help routes, market-specific Responsible Gambling resources and authored Learning content likewise remain unprefixed until the applicable body copy and evidence are complete; a translated shell is not enough to make a route localized.

The first safe static/trust publication tranche covers complete authored bodies for Home, product/discovery UI, 10 Steps, About and FAQ. Route policy remains fail-closed for Methodology, Contact, Learning, Responsible Gambling, Help, Programme and legal documents until their full critical copy meets the applicable review requirements.

## Request resolution

For a public request:

1. parse and validate an explicit market-first route when present;
2. resolve a supported unprefixed public route explicitly as `GB` / `en-GB`;
3. use an explicit user presentation preference to navigate to its canonical market route;
4. use the trusted request-country observation only as a bounded presentation default where no canonical route has already fixed context;
5. resolve the presentation market and locale through the market registry;
6. resolve jurisdiction/commercial authority independently;
7. render localized editorial/service content;
8. project casino and offer actions only if the independent commercial/referral authority passes.

Priority rules must prevent a manually selected presentation market from becoming a force-allow mechanism.

## Public casino and offer behavior

Public services must stop assuming `GB` as the default market where a request market is available.

Country/market becomes an explicit input through:

- casino discovery;
- casino detail projection;
- bonus directory;
- best offers;
- comparison;
- curated/featured modules;
- affiliate candidate resolution;
- sitemap generation;
- metadata and canonical/hreflang generation.

A localized market with no approved offer must render a useful editorial state rather than an empty/broken product. Commercial buttons remain unavailable or absent according to the existing neutral fail-closed UX.

## SEO and discoverability

Every live localized route must provide:

- localized `<html lang>`;
- localized metadata;
- stable canonical URL;
- reciprocal `hreflang` alternatives for published locale variants;
- locale/market-aware sitemap entries;
- no geo-dependent canonical mutation for the same explicit localized URL;
- no indexing of incomplete/demo/unsafe commercial states contrary to existing integrity rules.

The root/unprefixed compatibility strategy must avoid duplicate-indexation across localized equivalents.

## User controls

The public shell must expose a combined market/language control that:

- shows the current market and language;
- allows explicit switching;
- persists a presentation preference using a low-risk first-party mechanism;
- explains when casino offers are unavailable in the selected/observed market without exposing internal reason codes;
- never offers a control to bypass location or commercial restrictions.

## Market readiness states

A partner-facing localized market can be considered `LIVE_LOCALIZED` only when:

- the explicit localized Home URL is public and stable;
- core navigation/routes render in the target language;
- `<html lang>`, metadata, canonical and hreflang are correct;
- geo resolution can select the market in Preview/Production;
- manual market/language switching works;
- core editorial casino/discovery surfaces accept the market context;
- no GB-only copy leaks into critical target-language UX except explicitly marked untranslated source facts;
- market-specific legal/help content has an explicit review/status state;
- commercial CTAs remain fail-closed when approval/offer/tracking evidence is absent;
- automated tests cover routing, fallback, country authority separation and SEO invariants.

This is the state that can be shown to a network for reassessment before offers exist.

## Rollout sequence

### Phase A — Foundation

- market registry;
- locale registry and typed translation loader;
- localized route shell;
- market/language resolver;
- selector UI;
- localized metadata/canonical/hreflang/sitemap foundation;
- removal of GB defaults from request-aware public-service call sites;
- regression tests proving commercial authority remains independent.

### Phase B — Minimum partner-ready European locales

Publish complete public localized versions for:

- `de-DE`;
- `it-IT`;
- `es-ES`;
- `pt-PT`;
- `el-GR`;
- `nl-NL`;
- `sv-SE`;
- `da-DK`;
- `fi-FI`;
- `nb-NO`;

with `en-GB` as the baseline reference.

### Phase C — Market-specific content hardening

- local responsible-gambling/help resources;
- local legal/privacy/affiliate-disclosure review state;
- localized Learning Center and Programme content completeness;
- market-specific casino editorial inventory as evidence becomes available.

### Phase D — Partner reassessment

Provide live localized URLs to relevant networks and request reassessment. Record only actual external responses in Commercial CRM.

### Phase E — Commercial activation

When exact approval, market, brand, operator, licence, offer and tracking evidence exists, activate the existing cumulative commercial authority path. No localization code change should be required merely to add an approved offer to an already-live market.

## Production and migration policy

RFC-013 release governance remains in force.

Implementation occurs on a feature branch and through a pull request with CI and Vercel Preview. No direct Production mutation or affiliate activation is part of this RFC.

A Prisma migration is not presumed. The first implementation should prefer repository-controlled market/locale configuration unless code inspection proves persistent CMS ownership is necessary for the acceptance criteria. Any new persistent data model must be justified separately in the implementation diff and use expand/contract migration discipline.

## Success criteria

The foundation is successful when B4GAMBLE can truthfully demonstrate to a partner that multiple live market-localized versions exist and that the platform automatically presents an appropriate localized experience from trusted geography, while still truthfully showing no commercial action where B4GAMBLE lacks the exact approval/offer authority.

The architecture must make this statement true:

> B4GAMBLE is technically ready for the market before the partner is activated; partner activation supplies inventory and authority, not the localization platform itself.
