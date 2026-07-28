---
Title: RFC-001 Architecture Review — Jurisdiction and Market Resolution
Status: Review complete
Classification: Internal
Reviewer: Independent Principal Software Architect / Compliance-aware reviewer
Date: 2026-07-28
Reviewed RFC: RFC-001-Jurisdiction-and-Market-Resolution.md (Proposed)
Evidence basis: Product Vision, Product Master Plan, Product Architecture, Technical Baseline, and repository inspection
---

# RFC-001 Architecture Review — Jurisdiction and Market Resolution

## Executive Summary

RFC-001 selects the right architectural direction: a central, policy-driven resolver; server-side enforcement; scope-specific commercial eligibility; and redirect-time revalidation. It is strongly aligned with the Product Vision’s Regulated First, uncertainty, user-welfare, and non-circumvention principles.

It is not yet safe to approve as the basis for an ADR or implementation. Its current-state and migration assertions are materially false: the repository contains a substantial Next.js/Prisma application, public casino discovery, affiliate routing, partial caching, CMS/admin surfaces, and both `/r/[slug]` and legacy `/go/[slug]` redirects. The RFC consequently omits the actual legacy entry points and cannot demonstrate that partial migration will remove unsafe exposure. It also does not fully resolve the canonical model required by `ARCH-OD-02`, nor specify enough of the decision, precedence, cache, operational, and SEO contracts to make fail-closed behaviour objectively implementable.

The review therefore recommends approval only after the required changes below are incorporated and re-reviewed. This is an architecture/compliance review, not legal advice or an approval of any particular market.

## Review Score out of 10

**5/10** — sound target direction and strong product alignment; blocked by a false implementation baseline and incomplete enforceable contracts.

## Recommendation:

**Approve with required changes**

Approval is conditional on correcting all Critical and High findings and updating the acceptance criteria so the corrected design can be objectively verified against the actual application.

## Critical Findings

### C-01 — Current-state evidence is materially false

- **Severity:** Critical
- **Affected RFC section:** §2, especially §§2.1 and 2.3; §9 (Prisma); §8
- **Issue:** The RFC says the repository is documentation-only and has no runtime, database, CMS, affiliate platform, redirect behaviour, or architecture documents. The Technical Baseline instead detects a Next.js App Router application, PostgreSQL/Prisma (50 models, 10 migrations), public casino discovery, CMS/admin, affiliate platform/routing, `lib/public-casino/cache.ts`, and 50 API handlers. Product Architecture also contains substantive approved documents.
- **Risk:** The decision is founded on incorrect evidence, conceals current commercial and discovery exposure, and invalidates its migration and impact analysis. An ADR derived from it could authorise an unsafe or incomplete retrofit.
- **Required correction:** Replace the whole current-state section with evidence-consistent, dated statements classified as **Detected**, **Inferred**, **Planned**, and **Not detected**. Explicitly name the current public discovery, redirect, persistence, cache, admin, and deployment/observability constraints; distinguish observed code from approved target architecture.

### C-02 — The migration strategy ignores live legacy surfaces

- **Severity:** Critical
- **Affected RFC section:** §8, §12
- **Issue:** The RFC says migration starts from “zero runtime capability.” In fact, `app/casinos/page.tsx`, public casino services/repositories, `/r/[slug]`, and legacy `/go/[slug]` exist. `/r` obtains a country hint from trusted-looking request headers and evaluates affiliate geo rules, but no canonical policy decision. `/go` redirects an active CMS link directly after only status/date/HTTPS checks. Neither is covered by the proposed stages, shadow comparison, cutover gate, or retirement condition.
- **Risk:** A partial rollout can leave a bypass around the resolver—particularly direct legacy redirect links—or continue to render market-sensitive discovery and indexable profiles outside the new policy. This defeats fail-closed enforcement and redirect-time revalidation.
- **Required correction:** Add a repository-specific migration inventory and sequence. For every legacy public page, API, redirect, CMS publishing path, cache/index, and generated URL, define owner, existing behaviour, target enforcement point, shadow mode, deny-safe interim behaviour, cutover criterion, rollback criterion, and explicit retirement/disablement condition. Block commercial release until both redirect paths and all CTA producers are governed or safely disabled.

### C-03 — ARCH-OD-02 is not fully resolved by the proposed canonical model

- **Severity:** Critical
- **Affected RFC section:** §4, §6.1, §6.4, §11, §361
- **Issue:** `ARCH-OD-02` requires approved canonical identifiers and relationships for legal jurisdiction, market, country, and location evidence, including multi-jurisdiction countries/non-country scopes, confidence states, correction/re-evaluation, and treatment until approval. The RFC defines terms but not canonical IDs, cardinalities, country-to-market mapping rules, regulatory authority, legal-scope hierarchy, multi-jurisdiction/non-country handling, or a confidence model. It omits “regulatory authority” entirely and calls a user correction “authoritative user context,” which conflicts with its own statement that it is only evidence.
- **Risk:** Implementers can create incompatible country/market/jurisdiction mappings, treat a country as a jurisdiction, or allow a profile preference to select a commercially permissive scope. The claimed resolution of ARCH-OD-02 would be premature.
- **Required correction:** Define a normative canonical model (including identifiers, relationships, cardinality, and examples) for Country, geographic/location evidence, Market, Jurisdiction, Regulatory Authority, vertical, policy scope, and operator licence applicability. Specify the confidence/provenance vocabulary and correction lifecycle. Either resolve the multi-jurisdiction/non-country scope cases in this RFC or narrow its decision status so ARCH-OD-02 remains open.

### C-04 — Fail-closed redirect coverage is incomplete

- **Severity:** Critical
- **Affected RFC section:** §§6.3, 7, 8, 12
- **Issue:** Redirect-time revalidation is stated as a principle but does not define a single mandatory redirect contract, legacy-route containment, destination allowlisting, token/parameter binding, redirect-target ownership, or correlation of a render decision to a redirect decision. Product Architecture §3 requires an RFC to define these controls before a governed MVP referral is retained. The current `/go` route demonstrates why route coverage must be explicit.
- **Risk:** An older route, CMS-configured URL, stale CTA, altered query parameter, or alternate referral slug can bypass the resolver. Users may be handed to an operator despite a suspension or a denied market decision.
- **Required correction:** Add a normative redirect contract covering: one approved endpoint or enforced gateway; an inventory and decommission plan for existing endpoints; scope-bound opaque redirect tokens (if used); server-owned destination allowlist and parameter ownership; anti-tampering and open-redirect controls; no-fallback/no-substitution rule; request/decision correlation; denial response; retention and audit requirements. Make tests of direct requests to every redirect entry point a launch gate.

## High Findings

### H-01 — Input trust, precedence, conflicts, and stale signal semantics are underspecified

- **Severity:** High
- **Affected RFC section:** §6.4, §7, §11
- **Issue:** The RFC lists precedence categories but does not define trusted transport/header provenance, account/profile-data eligibility, spoofed-header handling, location-signal freshness, conflict matrix, “material conflict,” VPN/proxy/hosting-network treatment, or whether a persisted preference can differ from an observed country and still permit a commercial action. URL/locale hints are said to be non-authoritative but their use in canonical routes is not governed.
- **Risk:** Different consumers can reach different outcomes; a user selection, untrusted proxy header, stale cookie, or URL country token can effectively bypass a restriction.
- **Required correction:** Define a normative input register and decision table: source, trust boundary, permissible use, freshness, retention, conflict behaviour, and audit representation. State that only a server-verified, trusted-infrastructure location observation may contribute to commercial eligibility; correction/preference can request re-evaluation but cannot override a conflicting or absent required observation. Define unknown/stale/VPN/proxy outcomes as commercial deny unless a market policy explicitly defines an equally safe alternative.

### H-02 — The capability decision is not a durable enough governed record

- **Severity:** High
- **Affected RFC section:** §4, §6.4, §7, §9, §12
- **Issue:** The RFC requires policy version, state, provenance category, time, expiry/revalidation, and reason code, but does not require unique decision ID; market/jurisdiction/vertical IDs; regulatory authority and applicable policy/evidence IDs; per-capability outcome; evaluation input summary and freshness; actor/override identity; subject/entity IDs; decision-time versus effective-time; supersession/revocation links; or a defined machine-readable reason-code taxonomy. It also labels the decision request-scoped while Product Architecture §5 requires eligibility, licence, restriction, disclosure, publication, and referral decisions to be durable, queryable governed records.
- **Risk:** Audit, incident investigation, suspension propagation, replay, and redirect-page consistency cannot be proven. A UI-oriented result may become a non-auditable boolean in practice.
- **Required correction:** Specify a versioned decision-record schema/contract (not necessarily database tables) and separate: request-context assessment; policy/eligibility records; and a request-scoped capability projection. Require durable records for consequential approvals/denials and enough minimised evidence references to reproduce the outcome without storing raw location identifiers in browser-visible data.

### H-03 — Cache, outage, and suspension requirements lack an enforceable operational contract

- **Severity:** High
- **Affected RFC section:** §§7.2, 8, 9, 10, 12
- **Issue:** “Fail closed,” “promptly,” “short-lived,” and “approved operational target” are not values or defined policies. There is no maximum policy/decision/cache age; cache-key/scope requirements; CDN/client/cache bypass rules; resolver/database/policy-store failure matrix; propagation SLO; monitoring/alerting owner; emergency command path; or rollback/safe-mode procedure. Product Architecture §§3, 6, and 7 require these details before governed MVP implementation.
- **Risk:** A cached permissive page or index can outlive a suspension, and an outage can lead to inconsistent page/redirect results. Operations cannot demonstrate that a restriction reached every surface.
- **Required correction:** Define failure semantics and measurable operational targets for policy read, resolver, cache, CMS/publication data, geo signal, redirect service, and audit sink. Define the authoritative source, allowed cache locations/keys/TTLs, invalidation and bypass, suspension propagation/verification, alerting, incident ownership, emergency safe mode, rollback, and evidence retained for each event.

### H-04 — SEO scope and crawler behaviour are aspirational, not a safe contract

- **Severity:** High
- **Affected RFC section:** §9 (SEO), §12
- **Issue:** The RFC defers indexability, canonical, hreflang, structured data, cache, and crawler treatment to a future policy. The current `/casinos` route produces an indexable global canonical and an `ItemList`; `sitemap.ts` lists all public casino profiles without market-policy filtering; `robots.ts` permits crawling. No rule distinguishes a stable editorial country/market URL from request-personalised availability, and no crawler-neutral decision is defined.
- **Risk:** Search engines can index global or incorrect local-availability claims; canonical and hreflang can imply a market scope that SevenBet has not approved; cached variants can expose market-specific commercial content.
- **Required correction:** Define URL taxonomy and canonical owner: which URLs are editorial/global, market-scoped, or personalised; whether market URLs are indexable; crawler context/default outcome; noindex rules; canonical/hreflang prerequisites; structured-data eligibility; sitemap inclusion/removal; and cache variation. Require testable rendering of crawler, unknown, unsupported, and suspended contexts.

### H-05 — Governance and publication workflow omit enforceable authority and emergency controls

- **Severity:** High
- **Affected RFC section:** §§6.3, 9, 11, 12
- **Issue:** The RFC assigns high-level ownership but does not specify role grants, segregation-of-duties checks, two-person controls where required, policy publication states, effective-dating, approval/review evidence, emergency suspension authority, audit immutability, rollback, or how an emergency action becomes durable policy. It leaves user correction, policy source, provider selection, and several critical controls to open questions without marking them as blocking.
- **Risk:** CMS/admin configuration becomes a de facto policy authority, commercial users can activate a pathway indirectly, or an emergency restriction has no accountable, auditable operating procedure.
- **Required correction:** Add a RACI and state machine for market policy, evidence, operator licence applicability, content scope, placement, referral, suspension, and rollback. Specify who may propose/review/approve/publish/restrict/suspend/revoke; required evidence; dual-control and conflict-of-interest rules; audit event fields; propagation and post-incident review. Mark the unresolved governance prerequisites as pre-launch blockers.

### H-06 — Acceptance criteria are incomplete and several are not objectively testable

- **Severity:** High
- **Affected RFC section:** §12
- **Issue:** The criteria do not cover the legacy `/go` path, all current CTA/link generators, trusted-header spoofing, preference-vs-location conflict, multi-jurisdiction rules, VPN/proxy/unknown/stale input, policy-store/cache/resolver/database outage matrices, max-age and suspension SLOs, market URL/crawler/sitemap behaviour, administrative segregation, shadow comparison, cutover, rollback, or legacy retirement. “Appropriate,” “within the approved operational target,” and “privacy review confirms” lack a defined observable measure and owner.
- **Risk:** The RFC may appear implemented while core bypasses, stale exposure, or governance defects remain.
- **Required correction:** Add requirement IDs and a traceability matrix linking every criterion to a constitutional/product/architecture risk. Convert each to observable preconditions, test setup, expected server response/rendering/audit record, and measurable time bound. Add negative tests for every discovered legacy entry point and operational failure mode.

## Medium Findings

### M-01 — Terminology leaves key concepts overloaded or absent

- **Severity:** Medium
- **Affected RFC section:** §4
- **Issue:** “Country signal,” “market,” “jurisdiction,” “market policy,” and “capability decision” are useful starts, but “regulatory authority,” “user location,” “user-selected country,” “commercial eligibility,” “editorial visibility,” “Responsible Gambling availability,” “licence evidence/applicability,” “policy evidence,” “safety restriction,” and “override” are undefined. “Supported” is also used for a market context and potentially for a capability outcome.
- **Risk:** Data models and UI copy can conflate geographic information, legal scope, product support, and entity eligibility.
- **Required correction:** Add a controlled glossary and a separate state/capability matrix. Make Country geographic only; Market product scope; Jurisdiction legal scope; Regulatory Authority the regulator; location evidence a confidence-bearing input; and each visibility/commercial/support capability independently evaluated.

### M-02 — Age policy is not incorporated into the precedence and decision contract

- **Severity:** Medium
- **Affected RFC section:** §§3, 6.4, 7, 12
- **Issue:** The RFC mentions adult-facing restrictions and age-facing rules, but does not require an applicable age-policy outcome before commercial action. Product Architecture Principle 13 says 18+ is not universal permission and unknown/conflicting age requirements fail closed.
- **Risk:** A generic 18+ presentation could be treated as sufficient in a scope with different or unverified age requirements.
- **Required correction:** Add local age-policy applicability as a required, independently auditable commercial prerequisite; define minimal collection, unknown/conflict handling, and no-promotion semantics.

### M-03 — Research/editorial visibility needs a stricter claim boundary

- **Severity:** Medium
- **Affected RFC section:** §§4, 7, 9, 12
- **Issue:** The RFC correctly preserves research visibility, but does not specify which factual claims, schema, navigation links, tracking links, and page components remain permissible when market context is unknown or unsupported. The current discovery page describes “local availability” without a policy decision.
- **Risk:** A nominally non-commercial profile can imply availability or contain residual commercial/SEO elements.
- **Required correction:** Define an editorial-safe profile contract for each state, including prohibited availability language, commercial UI elements, outbound links, structured data, and discovery inclusion.

### M-04 — Policy freshness and evidence status do not distinguish facts sufficiently

- **Severity:** Medium
- **Affected RFC section:** §§6.4, 7, 9, 11
- **Issue:** The RFC refers generally to evidence and freshness but does not distinguish observed date, source date, verified date, review due date, expiry, dispute, supersession, and revocation; nor does it establish how each changes a policy or entity state.
- **Risk:** Stale licence, offer, or support evidence may appear current or be inconsistently interpreted by modules.
- **Required correction:** Define the evidence lifecycle and its deterministic effect on eligibility/capability. Ensure the record carries scope, source, review owner, dates, and dispute/supersession linkage, as required by Product Architecture §5.

## Low Findings

### L-01 — Some wording overstates the resolver’s authority

- **Severity:** Low
- **Affected RFC section:** §§1, 6.1, 7.1
- **Issue:** Phrases such as whether SevenBet can “truthfully state” an operator applies to a person risk suggesting legal or operator-account eligibility determination, while §6.1 properly disclaims that authority.
- **Risk:** Ambiguous product/legal messaging and responsibility boundaries.
- **Required correction:** Consistently describe the output as SevenBet’s product/commercial capability decision, based on policy and evidence, not a legal determination or operator eligibility decision.

### L-02 — The RFC should reference approved architecture documents directly

- **Severity:** Low
- **Affected RFC section:** Metadata, §§2–3, 12
- **Issue:** It lists only Vision and Master Plan as governing documents despite relying on and resolving a Product Architecture open decision.
- **Risk:** Readers may miss binding architecture constraints.
- **Required correction:** Add the relevant architecture documents, especially §§1–8 and `ARCH-OD-02`, to the governing/reference set and cite requirements precisely.

## Alignment Assessment

The target architecture aligns well with the Product Vision: policy precedes promotion, uncertainty denies commercial exposure, research/support remain available, commercial terms cannot override compliance, and user correction is not meant to become a bypass. It also aligns with the Master Plan’s independent research/market/referral states and compliance authority.

The material misalignment is factual rather than philosophical: RFC §2 contradicts the Technical Baseline and the Product Architecture’s detected implementation statement. Its zero-runtime assumption also conflicts with the project’s explicit incremental-reconciliation principle. The statement that no architecture documents exist conflicts directly with `docs/02_Product_Architecture/`.

## Conceptual Model Assessment

The model correctly separates Market from Jurisdiction at a high level and recognises country signals as non-proof. It is insufficiently canonical for `ARCH-OD-02`. Add Regulatory Authority; a distinct location-evidence object; selected/preference country; policy scope; vertical; licence applicability; and separate capability states for editorial visibility, market discovery, commercial CTA/referral, local disclosures, and Responsible Gambling/support availability. The result must represent multi-jurisdiction and non-country geographic scopes without forcing a country equivalence.

## Resolution and Precedence Assessment

The broad ordering is prudent, but source trust and conflict rules must be deterministic. The word “authoritative” must not attach to user correction. Request headers are only trustworthy when injected and authenticated by a known edge/proxy boundary; arbitrary client headers must not contribute to eligibility. Account or persisted preferences are user choices, not residence/legal proof. URL locale/country, language, and currency must remain presentation-only. Administrative overrides need typed scope, approval, expiry, actor, rationale, and cannot widen commercial capability absent policy authority.

## Fail-Closed Assessment

The stated default is good: unknown, conflicting, stale, unavailable, restricted, unsupported, suspended, and missing-evidence conditions withhold commercial action while retaining safe education/support. It must be completed with a system failure matrix and explicit handling for policy store, resolver, database, cache/CDN, CMS/publication, geo source, and redirect failure. “Where appropriate” must be translated into an explicit safe-content matrix so Responsible Gambling and educational routes remain available without local or commercial claims.

## Decision Record Assessment

The proposed result is too thin for governed consequential decisions. It needs a stable decision ID; policy/evidence/version references; scope IDs; request-context provenance/freshness summary; exact capability outcomes; entity subject; timestamps and expiry; reason-code taxonomy; authorised actor/override; and supersession/revocation relation. A privacy-minimised audit record should be durable server-side, while the browser receives only the reason/fields needed for user explanation.

## Request Lifecycle Assessment

The envisioned request-to-redirect path is sound, particularly the final server-side re-evaluation. It needs a documented enforcement map for SSR/RSC, route handlers, APIs, search, cached projections, sitemap/metadata, generated CTAs, and both detected redirect endpoints. Render and redirect may legitimately reach different outcomes, but that difference must be expected, audited, and safely explained. The legacy `/go/[slug]` path is a current bypass unless disabled or placed behind the same authoritative redirect gate.

## SEO Assessment

The RFC recognizes SEO risk but does not decide it. Separate stable, indexable editorial pages from market-contextual/commercial views. Search crawlers must receive a deterministic non-commercial/default treatment, not a location-derived commercial page. Market URLs need a deliberate scope, canonical/hreflang strategy, noindex conditions, structured-data policy, and sitemap inclusion rules. Current global `/casinos` and casino sitemap behaviour are baseline constraints to reconcile, not assumed future work.

## CMS and Operations Assessment

The RFC preserves the right separation in principle: Compliance approves/restricts policy, Editorial owns facts, and Affiliate owns only technical/commercial configuration. It needs an operational state machine and permissions model that prevents any CMS or affiliate configuration from activating a governed exposure. It must define approval, evidence, policy publishing, emergency suspension, propagation, rollback, audit, and review cadence. Existing admin/CMS and affiliate administration are detected constraints that must be incorporated into the transition design.

## Migration Assessment

The staged order—policy first, read-only enforcement, discovery, then redirects—is sensible only after the starting point is corrected. The actual codebase calls for strangler-style migration: inventory, shadow decision comparison, deny-safe gatewaying, progressive enforcement, observability, cutover/rollback, and retirement. Existing global country/offer matching is not an approved jurisdiction policy and must never be treated as a safe fallback. No commercial legacy path may remain outside the final authority during partial migration.

## Acceptance Criteria Assessment

The criteria express valuable outcomes but are not sufficient production gates. They should be rewritten as a traceability matrix with testable evidence for user, crawler, API, cache, redirect, admin, policy, and incident scenarios. Include every fail state and actual legacy route, plus measurable propagation and expiry targets. Implementation independence is appropriate for business outcomes, but the criteria must still name the authoritative enforcement contract and observable server-side evidence.

## Required Changes Before Approval

1. Correct RFC §2, §8, and §9 from repository evidence; remove every documentation-only/zero-runtime/no-Prisma/no-architecture assertion.
2. Add the canonical model required by `ARCH-OD-02`, or retain that open decision and narrow the RFC’s claimed resolution.
3. Define a normative trusted-input, precedence, conflict, freshness, correction, VPN/proxy, and administrative-override model.
4. Define durable governed decisions and a request-scoped capability projection with IDs, scopes, evidence/policy references, time, expiry, reason codes, and audit semantics.
5. Define a single mandatory affiliate redirect contract and legacy-route/CTA inventory, including `/r` and `/go`, destination allowlisting, parameter ownership, anti-tampering, no fallback, and cutover/removal gates.
6. Define cache/outage/suspension operational semantics, targets, invalidation/bypass, emergency controls, monitoring, and rollback.
7. Define market/SEO URL taxonomy and deterministic crawler, canonical, hreflang, structured-data, and sitemap behaviour.
8. Define governance roles, policy/evidence/publication/suspension state machines, segregation of duties, audit requirements, and blocking open decisions.
9. Rewrite acceptance criteria as objectively testable, traceable launch gates covering detected legacy surfaces, shadow migration, operational failures, and retirement.

## Optional Improvements

- Add a compact state/capability matrix for Supported, Restricted, Unsupported, Unknown, and Suspended across education, Responsible Gambling, research profile, discovery, CTA, redirect, metadata, sitemap, and local support.
- Add illustrative non-normative examples for conflicting IP/preference, a multi-jurisdiction country, a stale licence record, a policy suspension after page render, and crawler access.
- Add a decision-reason-code catalogue with separate internal and user-safe messages.
- Define a policy simulator/preview contract that cannot affect production eligibility and is clearly marked as internal preview.

## Final Recommendation

**Approve with required changes.** Do not create an ADR or begin implementation from the present RFC. Once the critical factual corrections and required enforceable contracts are incorporated, conduct a focused re-review of the revised RFC against the actual legacy route, discovery, CMS, cache, and affiliate surfaces before approval.
