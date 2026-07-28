---
Title: RFC-001 — Jurisdiction and Market Resolution
Status: Proposed — ready for implementation planning
Classification: Internal
Owner: Architecture / Compliance
Date: 2026-07-28
Decision: Resolve ARCH-OD-02 with a canonical jurisdiction and market model, a central policy decision contract, and fail-closed commercial enforcement.
Governing Documents:
  - ../Product-Vision-and-Principles.md
  - ../01_Product_Master_Plan/Product-Master-Plan.md
  - ../02_Product_Architecture/01_Architectural_Principles.md
  - ../02_Product_Architecture/03_Module_Boundaries.md
  - ../02_Product_Architecture/05_Data_Flow.md
  - ../02_Product_Architecture/06_Server_Client_Boundaries.md
  - ../02_Product_Architecture/07_Dependency_Rules.md
  - ../05_Engineering/Technical_Baseline/README.md
---

# RFC-001 — Jurisdiction and Market Resolution

## Decision summary

SevenBet SHALL introduce one server-side, policy-driven Market Resolution capability. It SHALL resolve a request context to a bounded capability decision and SHALL be the authority for market-sensitive presentation and every affiliate handoff. A previous page render, browser input, cached projection, country field, affiliate offer, or redirect slug must never broaden a denied decision.

The capability is an incremental retrofit of the existing Next.js/Prisma application, not a greenfield replacement. It will first shadow existing public casino discovery and affiliate routing, then fail closed for commercial actions, and only later govern all market-sensitive public presentation. Education, the Control Program, and Responsible Gambling access remain available in all non-permissive states unless a specific safety restriction requires otherwise.

This decision defines SevenBet’s product/commercial capability decision. It does not determine an operator’s KYC, account eligibility, self-exclusion status, or a person’s legal rights; those remain operator and regulator responsibilities.

## 1. Problem statement

Country labels, affiliate geo rules, casino country rows, licences, and user preferences are currently separate facts. None is sufficient by itself to say that an operator, offer, local disclosure, or referral is applicable to a requester. Without a canonical model and a central decision, a public listing, a detail page, a sitemap, and a redirect can make incompatible claims.

This conflicts with Regulated First: in a regulated market SevenBet must not direct a user to an operator without applicable local licensing evidence. It also conflicts with the requirement to explain uncertainty, preserve non-commercial outcomes, and never help a user bypass a location or other protection.

## 2. Current state and implementation baseline

This section records repository evidence as of 2026-07-28. **Detected** describes code present in this repository; it is not an assertion that the behaviour is approved for production or compliant with this RFC.

### 2.1 Detected application and persistence

- The repository is a substantial Next.js 15 App Router and React application with Prisma/PostgreSQL, Better Auth, public/admin routes, repositories, services, focused Node tests, and a Playwright public-casino test.
- `prisma/schema.prisma` contains 50 models and 10 ordered migrations. Casino records have `CasinoCountry` and `CasinoLicense` children; affiliate offers and tracking links have country allow/block/global fields; `AffiliateRedirectSlug` maps a public slug to a casino, optional bonus, and optional offer.
- `CasinoCountry.countryCode`, `CasinoCountry.availability`, `CasinoLicense.authority`, and `CasinoLicense.jurisdiction` are existing editorial/catalogue fields. They are **not** canonical Market, Jurisdiction, RegulatoryAuthority, evidence, or eligibility decisions. `AffiliateOfferCountry` and `AffiliateTrackingLinkCountry` are partner-routing facts, not licence evidence or market approval.
- Casino/admin workflows exist under `app/admin/(protected)/casinos/` and use `CasinoBuilder`, casino services, repositories, revisions, previews, and permission checks. Affiliate administration exists under `app/admin/(protected)/affiliate/` and administers networks, programs, offers, links, redirect slugs, imports, and mappings. Current administrative permission is not a Compliance policy approval.

### 2.2 Detected public and redirect entry points

| Entry point | Detected behaviour | RFC treatment |
| --- | --- | --- |
| `app/casinos/page.tsx` | Dynamic global discovery filters published records by country/license and shows visit actions from public discovery data. It renders indexable global metadata when unfiltered. | Wrap with a capability projection before market-sensitive filters, availability claims, visit actions, structured data, or indexability are enabled. |
| `app/casino/[slug]/page.tsx` | Dynamic published profile renders editorial, licence, bonus, and affiliate-derived view data plus structured data. | Preserve an editorial-safe profile path; gate local claims, commercial components, and market-sensitive metadata by capability. |
| `app/r/[slug]/route.ts` | Environment-gated redirect. It reads recognised edge-country headers, query currency/language hints, resolves active offers/links, validates HTTPS destinations, and returns `no-store`. It does not make a canonical policy/licence decision. | Become the single governed redirect gateway after the migration. It must re-resolve current policy and referral eligibility immediately before handoff. |
| `app/go/[slug]/route.ts` | Legacy CMS redirect. It resolves an active published CMS link and redirects to an HTTPS URL, otherwise redirects to `/casinos`. It has no country, market, policy, suspension, or referral-eligibility check. | No later than the commercial-enforcement phase, return a non-commercial unavailable response or delegate only to the governed `/r` gateway. It must not remain an independent handoff. |
| `app/sitemap.ts`, `app/robots.ts` | The sitemap includes public casino profiles and robots generally allow crawl. | Keep only approved editorial URLs until the SEO policy below is implemented; no market-scoped commercial URL is indexed by inference. |

### 2.3 Detected routing, cache, and fallback constraints

- `lib/affiliate-routing/candidate-resolver.ts` currently chooses active offer/tracking-link candidates using status, dates, partner geo mode/country rows, currency, language, and priority. It is a routing candidate selector, not a compliance resolver. `GLOBAL` may be a routing fallback today; it is prohibited as a future licence or market fallback.
- `lib/affiliate-routing/redirect-validation.ts` recognises `x-vercel-ip-country`, `cf-ipcountry`, and `cloudfront-viewer-country`; it does not establish that a request traversed a trusted proxy boundary. Production implementation must only accept a header injected by an authenticated/configured platform boundary.
- `lib/public-casino/cache.ts` has partial application caching and invalidates public casino paths such as `/casinos`, `/bonuses`, and `/sitemap.xml`. There is no repository evidence of an external cache, CDN policy, queue, scheduler, monitoring, or suspension-propagation service.
- Existing public casino services intentionally suppress unavailable public affiliate actions when a managed redirect is missing/disabled. That is useful baseline behaviour but is not a jurisdiction decision.
- **Not detected:** a comprehensive jurisdiction-policy engine, market policy registry, regulatory-authority model, authoritative licence-evidence lifecycle, central compliance approval workflow, production observability, deployment pipeline, or verified deployment state.

## 3. Requirements and non-negotiable outcomes

1. Market context must be resolved before SevenBet asserts local availability, enables a commercial CTA, places sponsored content, or redirects a referral.
2. In a regulated scope, referral eligibility requires scope-specific applicable licence evidence, approved policy, required disclosure, current entity/content/relationship status, and no restriction or suspension.
3. Unknown, conflicting, stale, unavailable-policy, unsupported, restricted, suspended, or missing-evidence contexts deny commercial visibility and referrals. They do not deny general education, Control Program, or Responsible Gambling access.
4. Research/editorial visibility, market discovery visibility, commercial visibility, and referral eligibility are independent outcomes. Publication or an affiliate configuration never implies another outcome.
5. All consequential policy, licence applicability, restriction, publication dependency, and referral decisions are durable, auditable governed records. A request receives a privacy-minimised projection of those facts.
6. The server enforces the decision. Client state, URL parameters, locale, currency, language, a prior render, a cache entry, and provider payload are non-authoritative.
7. Compliance owns market-policy approval and restriction; Editorial owns editorial facts and publication workflow; Affiliate owns technical partner configuration; none may override another domain’s authority.

## 4. Canonical model and terminology

The following concepts are canonical domain concepts. The initial implementation may store them in new Prisma models or another approved persistence design, but it must preserve their identifiers, relationships, lifecycle, and audit semantics.

| Concept | Canonical meaning and identifier | Relationship / derived use |
| --- | --- | --- |
| **Country** | ISO 3166-1 alpha-2 geographic reference, `countryCode`. It has no legal or commercial meaning by itself. | A location signal or user selection may reference a Country. A Market may cover zero, one, or several countries. |
| **Jurisdiction** | A legal/regulatory scope with stable `jurisdictionId`; it is not assumed equal to a Country. It may represent a country, sub-country region, multi-country regime, or other lawful scope. | A Market references one or more Jurisdictions for a vertical. Licence applicability is always evaluated in a Jurisdiction. |
| **Regulatory Authority** | The regulator or authority, `regulatoryAuthorityId`, with a name and authoritative evidence source(s). | A Jurisdiction may have one or more authorities; an authority may regulate multiple Jurisdictions. It is not interchangeable with a licence string. |
| **Market** | SevenBet’s approved product-support scope, `marketId`; it is a deliberate commercial/editorial/operational scope, not a locale. | Has a vertical, status, and one-or-more Jurisdiction mappings. A country can map to multiple candidate Markets only when policy resolves the ambiguity. |
| **Market policy version** | Immutable approved rule set, `marketPolicyVersionId`, scoped to one Market and vertical with effective/review/expiry dates. | Defines allowed capabilities, age policy reference, disclosure/support requirements, evidence requirements, and restrictions. Only an approved current version can permit commercial capability. |
| **Location signal** | Minimised evidence object with `sourceType`, `countryCode?`, observed time, freshness, confidence category, and provenance class. It is never proof of residence, age, or operator eligibility. | Derived from a trusted server observation or a declared user selection. Raw network identifiers must not appear in public decisions. |
| **User-selected country** | An explicit current-session or stored preference, with source `USER_SELECTION`. It is a correction request, not an authority. | May select presentation language or trigger re-evaluation. It cannot override a required trusted location observation, hard restriction, or missing policy/evidence. |
| **Licence applicability decision** | Durable record binding operator, product vertical, Jurisdiction, Regulatory Authority, evidence references, outcome, review/expiry, and authorised reviewer. | A prerequisite for market discovery/commercial/referral capability; existing `CasinoLicense` is a candidate source fact only. |
| **Editorial visibility** | Capability to show a scope-safe factual profile, `editorialVisibility`. | Derived from publication state plus policy-safe claim contract. It does not imply discovery, commercial visibility, or referral. |
| **Commercial visibility** | Capability to show a labelled commercial CTA/placement, `commercialVisibility`. | Derived from market status, licence applicability, content/disclosure/relationship/safety decisions. It does not imply redirect success. |
| **Referral eligibility** | Capability to issue an outbound handoff, `referralEligibility`. | Derived and re-evaluated server-side at handoff from all current prerequisites; it is the narrowest commercial capability. |

The following are **derived** only: resolved market, applicable jurisdictions, display country/locale, entity capability matrix, page components, SEO metadata, discovery inclusion, and redirect destination. Existing `CasinoCountry`, `CasinoLicense`, offer/link country rules, `CasinoAffiliateLink`, and `AffiliateRedirectSlug` remain source/catalogue or routing data until accepted into a governed decision.

### 4.1 States and capability matrix

`marketState` is one of `SUPPORTED`, `RESTRICTED`, `UNSUPPORTED`, `UNKNOWN`, or `SUSPENDED`. The effective outcome is the most restrictive applicable state. Capabilities are independent booleans with reasons; a boolean without scope and reason is invalid.

| State | Education / Responsible Gambling | Editorial profile | Local discovery / availability claim | Commercial CTA | Referral |
| --- | --- | --- | --- | --- | --- |
| Supported | Available | Policy-safe | Only when entity eligibility is allowed | Only when separately allowed | Only when separately allowed and freshly revalidated |
| Restricted | Available; emphasise limitation/support | Only explicitly safe scope | Denied unless a narrower policy expressly allows | Denied by default | Denied |
| Unsupported | Available | General/non-local only where policy-safe | Denied | Denied | Denied |
| Unknown | Available | General/non-local only; no availability implication | Denied | Denied | Denied |
| Suspended | Available with explanation/support | Only explicitly safe non-commercial content | Denied | Denied | Denied |

## 5. Resolution contract

### 5.1 Inputs, trust, and use

| Input | Trust level | Permitted use | Commercial rule |
| --- | --- | --- | --- |
| Compliance policy, restriction/suspension, evidence, publication and relationship records | Authoritative server-owned facts | Policy evaluation | Required; stale/missing/unavailable denies. |
| Server-observed country from a configured, authenticated edge/platform boundary | Trusted observation | Proposes geographic context | May contribute only if current and policy permits. A client-supplied header is untrusted. |
| Explicit user selection or persisted profile preference | Declared evidence | Correction, presentation, re-evaluation request | Cannot independently permit or override conflict/absence/hard restriction. |
| Authenticated account profile residence/verification | Unavailable in current baseline; future governed input only | Only after separate privacy/compliance decision | Not used until such decision is approved. |
| URL country/market segment, locale, language, currency, device, query string | Untrusted hint | Presentation only | Never permits local claim, CTA, or referral. |
| Affiliate/provider country rules and tracking metadata | External commercial fact | Candidate routing after referral is already eligible | Never establishes market, licence, or referral eligibility. |
| Administrative override | Authorised, scoped governance fact | Emergency restriction or approved correction workflow | Cannot widen capability without an approved policy/evidence decision; must have actor, reason, scope, expiry, and audit record. |

### 5.2 Precedence and conflict handling

1. Hard global age/safety/compliance restrictions deny commercial capability.
2. Active suspension/revocation denies the affected capability immediately.
3. A current approved policy and authoritative governed entity decisions establish the possible capability bounds.
4. A current trusted server observation may select one policy-compatible market candidate.
5. A user selection may be used only when it is compatible with the trusted observation and policy. It can make the result more restrictive or `UNKNOWN`; it cannot make it more permissive.
6. Hints may alter presentation only after the result is resolved.

If trusted observations conflict, the observation is stale/absent, a user selection conflicts with it, multiple candidate markets remain unresolved, a VPN/proxy/hosting-network result cannot be classified by approved policy, or policy/evidence is stale or unavailable, resolve to `UNKNOWN` or the stricter named state and deny commercial capability. VPN/proxy detection/provider choice and any confidence thresholds are intentionally not selected here; until separately approved, inability to establish a current trusted location is `UNKNOWN` for commercial purposes.

### 5.3 Machine-readable decision result

The resolver returns a versioned request-scoped projection. It contains no raw IP address, user agent, internal rule text, credentials, or safety-sensitive detail.

```ts
type MarketCapabilityDecision = {
  decisionId: string;
  contractVersion: "1";
  evaluatedAt: string;                 // ISO-8601 UTC
  validUntil: string | null;           // null means no permissive reuse
  revalidation: "ON_REQUEST" | "ON_REDIRECT" | "NO_CACHE";
  market: { id: string | null; state: "SUPPORTED" | "RESTRICTED" | "UNSUPPORTED" | "UNKNOWN" | "SUSPENDED" };
  jurisdictionIds: string[];
  policyVersionId: string | null;
  evidenceRefs: string[];              // opaque IDs, server-resolvable
  inputSummary: Array<{ source: "TRUSTED_EDGE" | "USER_SELECTION" | "HINT" | "GOVERNANCE"; freshness: "CURRENT" | "STALE" | "ABSENT" }>;
  capabilities: {
    editorialVisibility: { allowed: boolean; reasonCode: ReasonCode };
    marketDiscovery: { allowed: boolean; reasonCode: ReasonCode };
    commercialVisibility: { allowed: boolean; reasonCode: ReasonCode };
    referralEligibility: { allowed: boolean; reasonCode: ReasonCode };
    localSupport: { allowed: boolean; reasonCode: ReasonCode };
  };
  reasonCode: ReasonCode;
};
```

`ReasonCode` is a stable machine-readable catalogue. Initial values are: `POLICY_APPROVED`, `UNKNOWN_LOCATION`, `LOCATION_CONFLICT`, `LOCATION_STALE`, `UNSUPPORTED_MARKET`, `MARKET_RESTRICTED`, `MARKET_SUSPENDED`, `POLICY_STALE`, `POLICY_UNAVAILABLE`, `EVIDENCE_MISSING`, `EVIDENCE_STALE`, `LICENCE_NOT_APPLICABLE`, `AGE_POLICY_UNRESOLVED`, `CONTENT_NOT_APPROVED`, `DISCLOSURE_MISSING`, `RELATIONSHIP_NOT_APPROVED`, `SAFETY_RESTRICTION`, `REDIRECT_NOT_ALLOWED`, `ROUTING_CANDIDATE_UNAVAILABLE`, and `INTERNAL_FAILURE`. User messaging maps these to non-technical, non-promotional explanations.

Consequential underlying decisions are durable records with a subject/entity ID, scope IDs, policy/evidence references, effective/review/expiry times, reviewer or authorised actor, rationale code, and supersession/restriction/override linkage. `decisionId` correlates a rendered projection, redirect attempt, audit event, and incident investigation; it is not a bearer capability.

### 5.4 Freshness, caching, and failure semantics

- A permissive decision must have an explicit `validUntil`; a redirect always re-evaluates regardless of that value.
- Cache keys/projections that contain market-sensitive content must include policy version and resolved market scope, and must not be reused after expiry. A decision with `UNKNOWN`, `RESTRICTED`, `UNSUPPORTED`, or `SUSPENDED` must not be converted to a permissive cache hit.
- Policy-store, resolver, governed-data, cache-validation, or redirect-resolution failure returns a deny-safe decision (`POLICY_UNAVAILABLE` or `INTERNAL_FAILURE`) and no referral. Failure to record a non-essential aggregate event must not create a fallback referral; durable audit-failure handling needs an implementation decision before launch.
- A suspension/revocation must invalidate or bypass public-market cache, discovery projection, sitemap/index projection, and redirect eligibility. The numeric propagation SLO, delivery topology, monitoring platform, and incident process are not selected by this RFC; they are pre-launch operational decisions and cannot be replaced by a best-effort cache.

## 6. Redirect and public-surface enforcement

### 6.1 Mandatory redirect contract

`/r/[slug]` is the target single referral gateway. Before issuing a redirect it SHALL:

1. validate the opaque slug and request hints;
2. resolve current request context and policy;
3. resolve the scope-specific referral eligibility for the slug’s casino/bonus/offer/content/relationship;
4. load only an active, server-stored routing candidate after referral eligibility is allowed;
5. validate the destination against a server-owned approved destination/partner allowlist and server-owned parameter template; and
6. return `no-store`, non-indexable redirect headers and an auditable outcome.

The gateway must not accept a destination URL, tracking URL, country, market, policy version, or eligibility decision from the browser as authority. It must not substitute another partner on denial. It must return a neutral unavailable response or a safe non-commercial internal route. If opaque redirect tokens are introduced, they bind slug, intended entity, policy version/context, expiry, and are revalidated server-side; they cannot extend a suspension or approval.

`/go/[slug]` is legacy and must not be expanded. During shadow phases it is inventoried and measured; before commercial enforcement it must either issue a permanent internal handoff to a governed `/r` slug with no external redirect, or return a non-commercial unavailable response. It must be removed after no active links, CMS renderers, tests, generated pages, or inbound migration obligations depend on it. Until then it is a named migration exception, not a permitted alternative authority.

### 6.2 Public pages, SEO, and crawler contract

- Existing `/casinos` and `/casino/[slug]` remain editorial routes during migration. They must not assert request-specific local availability or expose commercial CTAs unless a server decision permits it.
- A stable editorial URL is global/research-only and may be indexed only when its content is policy-safe without a market context. It must not contain scope-specific commercial structured data or referral capability.
- A future market URL is indexable only when an approved policy explicitly defines the scope, canonical URL, language/hreflang relation, disclosure, structured-data eligibility, review date, and sitemap inclusion. A URL parameter, locale, or crawler header cannot create that scope.
- Crawlers receive the safe global/editorial treatment, never a geo-personalised commercial result. Unknown/restricted/unsupported/suspended commercial variants are noindex and excluded from sitemaps. Sitemap generation must consume an approved editorial/market indexability projection before market-specific pages are added.
- `robots.ts`, `sitemap.ts`, `generateMetadata`, JSON-LD, discovery cards, casino profile sections, and CTA producers are enforcement consumers, not exceptions.

## 7. Governance and operations

| Decision / action | Propose | Review / approve | Restrict / suspend | Must not decide |
| --- | --- | --- | --- | --- |
| Market policy, jurisdiction mapping, evidence standard, licence applicability | Compliance staff / authorised workflow | Compliance authority defined by policy | Compliance emergency authority | Affiliate and Editorial |
| Editorial fact and publication readiness | Editorial | Editorial workflow plus required compliance dependency | Compliance may restrict | Affiliate |
| Affiliate relationship, routing configuration, destination metadata | Affiliate | Affiliate for technical correctness; Compliance dependency for referral eligibility | Compliance may suspend | Affiliate may not approve market/referral eligibility |
| Emergency suspension | Authorised Compliance actor | Recorded immediately; post-action review required | Authorised Compliance actor | CMS publication or affiliate configuration alone |

Every policy, evidence, eligibility, suspension, and override transition requires actor, role, timestamp, effective scope, reason, linked evidence/decision, and revision/supersession record. A CMS publication state, an offer’s active flag, or a redirect slug’s active flag cannot activate a market/referral capability. Separation-of-duties details, retention periods, audit-store immutability mechanism, and exact emergency delegation are implementation-planning prerequisites; no commercial launch is permitted until they are approved.

## 8. Incremental migration and implementation roadmap

No big-bang rewrite is authorised. Existing public routes, Prisma data, services, and feature flags are migration inputs; no legacy permissive behaviour is a fallback once a route is governed.

### Phase 1 — Canonical policy seam and shadow evaluation

- **Objective:** establish the canonical contracts and evaluate them without changing public outcomes.
- **Affected modules:** new jurisdiction/compliance policy module; Prisma migration(s); `lib/services/public-casino*.ts`; `lib/services/affiliate-redirect.service.ts`; admin read-only policy preview; feature flags.
- **Expected data-model impact:** canonical Market, Jurisdiction, RegulatoryAuthority, MarketPolicyVersion, evidence, decision, restriction/suspension, and entity-scope records or equivalent governed models; existing casino/licence/offer fields remain source facts.
- **Tests:** pure model/precedence/conflict/freshness tests; adapter tests translating existing country/licence/offer fields without inferring approval; direct `/r`, `/go`, discovery, detail, sitemap, and metadata inventory tests.
- **Rollout condition:** one non-commercial approved policy dataset; shadow decisions include policy version/reason and are observable without raw location data; no request outcome is broadened.
- **Rollback condition:** disable the shadow feature flag and retain current behaviour; preserve created audit/source records without using them for public decisions.

### Phase 2 — Safe public presentation and CMS dependencies

- **Objective:** govern editorial-safe versus market-sensitive rendering and prevent new CMS/affiliate configuration from implying eligibility.
- **Affected modules:** `/casinos`, `/casino/[slug]`, public casino discovery/service/repository, `CasinoBuilder`/casino admin actions, public cache, metadata/JSON-LD, sitemap/robots.
- **Expected data-model impact:** content/entity market scopes, disclosure/review dependency references, and publication-to-policy projection; no destructive conversion of existing `CasinoCountry`/`CasinoLicense` records.
- **Tests:** state/capability matrix for direct navigation, discovery filters, detail pages, API/read models, JSON-LD, canonical/noindex/sitemap outputs, cached responses, stale evidence, and unknown/conflicting context.
- **Rollout condition:** unknown and non-permissive contexts show no local availability claim, commercial CTA, or market-specific structured data; Responsible Gambling/education remains reachable; cache invalidation/bypass is demonstrated.
- **Rollback condition:** switch to global editorial-safe rendering with commercial controls denied; do not revert to location-derived commercial behaviour.

### Phase 3 — Governed referral gateway and legacy containment

- **Objective:** make current-policy referral eligibility mandatory at every outbound handoff.
- **Affected modules:** `/r/[slug]`, `affiliateRedirectService`, candidate resolver, redirect validation/response, affiliate repositories/admin APIs, all CTA/link producers, and `/go/[slug]`.
- **Expected data-model impact:** scope-specific referral decision/evidence links, destination allowlist/parameter-template references, redirect audit correlation, and legacy-slug inventory/mapping. Existing redirect slugs remain identifiers, not approval records.
- **Tests:** direct URL access to `/r` and `/go`; policy change between page render and click; suspended/stale/unavailable policy; missing disclosure/evidence; unsafe target; altered query; no substitute partner; trusted-header spoofing; cache failure; legacy slug mapping.
- **Rollout condition:** `/r` revalidates all prerequisites and returns deny-safe responses; all public CTAs use it; `/go` cannot externally redirect independently; emergency suspension is verified across both routes.
- **Rollback condition:** deny all referrals via the commercial flag while maintaining editorial/support routes. Rollback must never restore independent `/go` external handoff.

### Phase 4 — First market activation and legacy removal

- **Objective:** activate one approved market only after full operational readiness and remove the legacy redirect path.
- **Affected modules:** approved market-specific read models, compliance/admin workflow, operational dashboards/alerts, sitemap/index projection, deployment/runbook work outside this RFC.
- **Expected data-model impact:** approved first-market policy/evidence, support/disclosure records, review cadence, and suspension records; no automatic second-market template.
- **Tests:** end-to-end supported/restricted/unsupported/unknown/suspended journeys; crawler and cache variants; propagation exercise; rollback drill; role/segregation checks; direct legacy URL regression test proving no external handoff.
- **Rollout condition:** Compliance approves the specific market readiness packet; the operational suspension target and incident process are approved and exercised; all acceptance criteria pass; `/go` has no remaining external behaviour or dependencies.
- **Rollback condition:** suspend the market and deny all commercial/referral capabilities, invalidate/bypass projections, retain education/support, and preserve audit evidence.

### 8.1 Observability and removal criteria

Shadow and production decisions must produce minimised operational events for decision state/reason, policy version, expiry, suppression, redirect revalidation failure, cache-bypass/invalidation, and suspension propagation verification. They must not use raw location or safety context for promotional targeting.

Legacy `/go` can be deleted only after: its slug inventory is empty or migrated; repository searches find no producer or test expecting external `/go`; direct requests are non-commercial; traffic/observability confirms no required migration dependency; and the migration owner records approval. Existing global offer-country fallback can be removed from commercial routing only after the governed resolver replaces it; it must not be reintroduced as rollback behaviour.

## 9. Acceptance criteria

The RFC is ready for implementation planning now, but no market or commercial launch is ready until all relevant criteria below are demonstrated.

1. Canonical IDs and relationships distinguish Country, Market, Jurisdiction, Regulatory Authority, location signal, user selection, policy version, evidence, and licence applicability; multi-jurisdiction/non-country cases have explicit policy treatment.
2. Every market-sensitive page, API/read model, CTA producer, `/r/[slug]`, `/go/[slug]`, metadata route, cache, and sitemap consumer has an inventory entry and an enforcement/retirement outcome.
3. The resolver returns the versioned decision contract with scope, policy version, reason code, timestamp, expiry/revalidation, and minimised provenance; consequential records are durable and queryable by subject and time.
4. Tests prove a user selection, URL value, locale, currency, spoofed client header, provider payload, prior render, or cache cannot permit a denied commercial/referral capability.
5. Tests prove that supported, restricted, unsupported, unknown, suspended, stale-policy, missing-evidence, resolver-failure, and cache-failure states have the matrix outcomes for direct navigation, API access, crawl, discovery, detail, and redirect.
6. A direct request to either redirect route cannot hand off externally unless the current central referral decision permits it. After Phase 3, `/go` has no independent external handoff.
7. Redirect revalidation denies if market, licence applicability, entity/content/disclosure/relationship, policy, evidence, or restriction has changed since render; no alternative partner is substituted.
8. CMS and affiliate administration preserve separation of duties: publication, active offer, country rule, provider payload, or redirect slug cannot independently activate commercial/referral eligibility.
9. SEO tests prove crawler-safe editorial treatment, correct canonical/noindex/structured-data/sitemap output, and absence of unapproved market-specific availability claims.
10. A suspension exercise proves cache/index/redirect invalidation or bypass and a verified commercial deny state within the separately approved operational target. The target, monitoring, incident ownership, and runbook are release prerequisites.
11. The first-market launch demonstrates a useful no-referral journey, visible material information before referral, accessible Responsible Gambling/support, clear limitation messaging, and no location/self-exclusion/limit-circumvention suggestion.

## 10. Explicitly unresolved topics and boundaries

This RFC deliberately does not select: the first supported market; legal interpretation; a geolocation/VPN provider; confidence thresholds; data-retention/legal-basis/consent for location or user correction; local age collection/gating under ARCH-OD-03; safety-signal collection under ARCH-OD-05; exact persistence/audit immutability implementation under ARCH-OD-04; destination allowlist ownership, tracking attribution retention, reconciliation, provider offboarding, and redirect-token format under ARCH-OD-08; or numeric suspension SLO, alerting platform, incident process, CI/CD, hosting, and deployment topology under ARCH-OD-06 and operational architecture.

These are blocking implementation-planning inputs for the affected phase, not permissions to infer a permissive behaviour. Until resolved, their outcome is commercial deny or non-commercial editorial-safe presentation.

## Decision status and follow-up

This RFC resolves ARCH-OD-02 at the architectural-contract level and is **Proposed — ready for implementation planning**. It authorises planning and phased design against the real codebase, not code/schema changes, a market launch, vendor selection, or commercial activation. Approval of the listed separate decisions and successful phase gates remains required before governed MVP implementation and any referral launch.
