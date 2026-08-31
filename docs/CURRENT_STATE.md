# B4GAMBLE Current State

**Status:** CURRENT AUTHORITATIVE CHECKPOINT  
**Evidence date:** 24 August 2026
**Owner:** 7BE Inc. / B4GAMBLE Founder Office  
**Production:** `https://b4gamble.com`  
**Current Production application SHA (Founder/runtime evidence):** `9d7ba9169df43f914a1fb05f44cfc10af87118e2`
**Verified post-migration runtime baseline SHA:** `f6f520340d67e4f2aac44142437962b287794a66`  
**Verified post-migration runtime deployment:** `dpl_A4a22TFc2bERP74gu5y3PMwfvS43`

Documentation-only commits may advance `main` and trigger equivalent Vercel rebuilds after this runtime baseline. Use live GitHub/Vercel evidence for the exact current head/deployment when that distinction matters.

This checkpoint supersedes older candidate/draft/current-state language where it conflicts with newer verified evidence below.

## Governance and read order

For internal decision authority, read in this order:

1. the current explicit Founder instruction, when present;
2. this current Founder-approved checkpoint;
3. only the relevant `ACTIVE` RFCs in the [RFC Registry](06_RFC/README.md);
4. live implementation and repository evidence; and
5. historical documents only when their context is needed.

The [Decision & Documentation Governance](GOVERNANCE.md) defines the authority, evidence, override and RFC rules. A newer explicit Founder decision may supersede an older internal boundary for its approved scope. For factual claims, live authoritative system, Production, repository and provider evidence still outranks this document when newer evidence conflicts with it.

## Executive state

| Area | Current state | Meaning |
|---|---|---|
| Public site / product | **READY** | Accepted public design/UX baseline is in Production. |
| Public legal implementation | **READY** | Current GB public legal copy/consent/disclosure implementation is in Production for the approved scope. |
| Legal / administrative compliance | **READY WITH FOUNDER-ACCEPTED DEFERRALS** | Public legal work is closed for current scope; specified administrative items remain open. |
| Commercial CRM / Partner Operations | **READY IN PRODUCTION** | COMMERCIAL-OPS-01 code is deployed and Production migration `0020_commercial_ops_01` is applied and verified. |
| ChatGPT Work MCP / Better Auth 1.7 | **ENABLED IN PRODUCTION — REFRESH LIFECYCLE REGRESSION DETECTED** | The bounded four-tool bridge is live at SHA `9d7ba91`; access works, but the current grant loses connectivity at the 15-minute access-token boundary because usable offline refresh state is not established. A repository fix is under Founder review and is not deployed by this checkpoint. |
| Commercial partner activation | **READY FOR FIRST REAL PARTNER — NOT ACTIVE** | No real partner, offer or outbound commercial route is authorised by this checkpoint. |

### Unmerged internationalisation candidate

**PROPOSED UNTIL MERGE — PR #105 feature-branch evidence, 30 August 2026:** the current internationalisation candidate defines `HOME_READY`, `PUBLIC_CORE_READY` and `ARCHITECTURE_ONLY` presentation states; limits both Preview and Production selectors to the GB baseline plus Founder-accepted DE/ES/SE/DK/GR public-core locales; and adds rendered localization, interpolation, curated-control and responsive-overflow regression coverage. The detailed route/locale matrix is recorded in [Localization quality and route coverage](internationalisation/localization-quality-audit.md).

This entry does not change the Production SHA above. It does not activate indexing, localized operative legal documents, a partner, an offer, tracking or any non-GB commercial action.

**PROPOSED UNTIL MERGE — Programme internationalisation PR #106 evidence, 31 August 2026:** a newer explicit Founder instruction authorises an isolated candidate that presents the one language-neutral Programme at `/program` and ten exact localized Programme routes. The candidate keeps locale out of Programme state, identity, rewards and persistence; introduces no Prisma migration; and does not alter ordinary second-wave public publication, legal, indexing or commercial authority. Founder runtime acceptance detected that the previously documented render-only Preview evidence did not prove Mission 01 session creation and exposed a missing branch-scoped runtime flag. The remediation, isolated Preview/Production provider-resource evidence and remaining real hosted acceptance gates are recorded in [Programme internationalisation](internationalisation/programme-internationalisation.md). **PR #106 Preview remains on HOLD** until a real no-interception Mission 01 session and same-journey locale-continuity smoke pass; no merge or Production deployment is represented by this entry.

## Detected release evidence

### Public product and legal baseline

- PR #77 established the accepted B4GAMBLE v1 public product/design baseline.
- PR #78 delivered the GB public legal closeout for the current scope, including Programme consent/disclosure and final public affiliate/footer wording.
- The accepted public Product Freeze remains in force absent new scope, regression or materially new evidence.
- Programme/private/Help data remains separated from commercial ranking, routing and partner operations.

### Governance simplification

- PR #80 simplified RFC governance.
- Current explicit Founder instruction is the highest internal decision authority for its covered scope.
- RFCs are durable architecture/decision records, not routine PR/merge/deploy permission gates.
- Historical RFC wording cannot permanently veto a later explicit Founder decision.
- Decision authority does not fabricate external facts or override law/platform/technical reality.

### COMMERCIAL-OPS-01

PR #81 delivered the B4GAMBLE Commercial CRM and Partner Operations Agent.

**Commercial Admin routes:**

- `/admin/commercial`
- `/admin/commercial/partners`
- `/admin/commercial/partners/[opportunityId]`
- `/admin/commercial/analytics`

**Commercial CRM aggregate includes:**

- Opportunity
- Evidence
- Contact
- Activity
- Application
- Term
- Task
- AgentRun
- AgentOperation
- ActivationPacket

**Canonical pipeline:**

`PROSPECT → QUALIFIED → APPLICATION_READY → APPLIED → DUE_DILIGENCE → NEGOTIATING → APPROVED → ACTIVE`

with `REJECTED` and `ON_HOLD` terminal/side states where appropriate.

**Partner Operations:**

- canonical specialist key: `partner-operations`;
- compatibility alias: `partner-intelligence`;
- bounded CRM snapshot → strict model output → validation → transactional Agent-safe CRM operations;
- may prepare research/evidence, drafts, next actions, evidenced responses/terms and activation packets;
- cannot send external communications, submit applications, accept terms, set `APPROVED`, set `ACTIVE`, activate tracking, deploy, or mutate Production through the Agent surface.

CRM `APPROVED` is not public commercial authority. `ACTIVE` cannot be produced through ordinary CRM/Agent mutation. RFC-015 readiness, kill switch, AffiliateProgram/Offer/TrackingLink state and public routing remain independent server-authoritative controls.

## Production migration 0020

**DETECTED — Production migration `0020_commercial_ops_01` is applied and verified.**

Execution sequence on 20 August 2026:

1. Founder explicitly authorised the Production mutation with `GO 0020`.
2. A temporary fail-closed Production-only execution guard was introduced through PR #82.
3. The guard verified Production database readiness and same database identity for pooled runtime/direct migration bindings.
4. It refused mutation unless the only pending repository migration was exactly `0020_commercial_ops_01` and no unresolved migration record existed.
5. Vercel Production deployment `dpl_BQEqk75EcFxFR7gAYmcFFzRvmhxW` emitted `production_migration_0020: applying`, then `production_migration_0020: applied_and_verified`.
6. PR #83 immediately removed the temporary migration runner; no schema rollback was performed.
7. Final cleanup application/runtime baseline SHA is `f6f520340d67e4f2aac44142437962b287794a66` and verified post-cleanup deployment `dpl_A4a22TFc2bERP74gu5y3PMwfvS43` is READY.

The normal Vercel preflight is readiness-only again. This event does not establish a permanent automatic Production migration policy.

## Production Commercial MCP and refresh lifecycle

**DETECTED — PRODUCTION RUNTIME, 2026-08-21:** Production serves the bounded Commercial MCP from application SHA `9d7ba9169df43f914a1fb05f44cfc10af87118e2` with Better Auth/OAuth Provider `1.7.1`. Public read-only checks returned HTTP 200 for both OAuth discovery documents. Authorization-server metadata advertises `authorization_code`, `refresh_token`, PKCE `S256`, the exact Commercial resource and `offline_access`; protected-resource metadata advertises only `commercial:read` and `commercial:safe_write`.

**DETECTED — REPRODUCED FAILURE:** authorization and token exchange succeed, MCP calls initially return 200, and the resource starts returning 401 approximately 15 minutes after issuance. No refresh-token request reaches the token endpoint before the failed resource call. Reauthorization restores access for another equivalent interval.

**DETECTED — REPOSITORY/PROVIDER CAUSAL MECHANISM:** the wrapper forwards the authorization request scope set unchanged. Better Auth 1.7.1 always returns normal expiry metadata but issues and persists a delegated refresh token only when the authorized grant contains `offline_access`. Its refresh handler can inherit the stored resource when the refresh request omits `resource`, while the application wrapper currently requires that request parameter for both grant types.

**INFERRED — ROOT CAUSE:** ChatGPT's resource-driven authorization did not establish `offline_access` because the protected-resource discovery document omitted it, leaving only a 15-minute access credential. The wrapper's mandatory refresh `resource` is a secondary interoperability defect; it did not cause the observed cycle because Production saw no refresh request.

**PROPOSED — NOT DEPLOYED:** the bounded fix advertises `offline_access` in both discovery documents and permits `resource` to be omitted only for `refresh_token`. A supplied resource must still equal the exact Commercial resource, and an omitted value succeeds only after the stored refresh record, client metadata, live provider session and current staff permission all pass the existing exact-resource checks. Authorization-code exchange still requires the exact resource. No schema, migration, token-TTL, tool, Commercial authority or Production environment change is included.

## Production acceptance after Commercial Ops migration

**DETECTED:**

- `dpl_A4a22TFc2bERP74gu5y3PMwfvS43` is READY, targets Production/main and served the canonical B4GAMBLE aliases at the bounded post-migration acceptance check.
- `https://b4gamble.com/` returned HTTP 200 from that verified post-cleanup runtime deployment.
- Anonymous access to `/admin/commercial` remains protected and resolves to the B4GAMBLE CMS Login flow rather than exposing Commercial Admin content.
- No Vercel runtime errors were detected in the bounded post-migration verification window.

**LIMITATION:** an authenticated post-migration Production Admin read/write walkthrough was not executed because the available verification tooling did not have an authorised B4GAMBLE Admin application session. This does not negate the direct Production migration verification or the exact-head CI/browser coverage from COMMERCIAL-OPS-01; it only limits the claim about a live authenticated manual walkthrough.

## Commercial conclusion

**DETECTED — the internal Commercial OS is deployed and its Production schema is ready.**

This means B4GAMBLE can proceed to the first real partner acquisition/qualification workflow without another CRM/Agent construction workstream.

It does **not** mean that a partner relationship, affiliate acceptance, GB eligibility, deal terms, tracking destination, commercial offer or active outbound route exists.

The next commercial operating loop is:

`DISCOVER → QUALIFY → PREPARE APPLICATION → DRAFT OUTREACH → TRACK RESPONSE → FOLLOW-UP → EXTRACT DEAL TERMS → PREPARE ACTIVATION`

A real GB commercial route remains fail-closed and requires evidence/authority for the exact partner and action, including real acceptance/agreement, explicit GB permission, correct identity, current UKGC licence/exact-domain evidence where applicable, real offer, safe tracking destination, significant conditions, adjacent disclosure, Preview validation, Founder activation approval and a working kill switch/rollback.

Missing, stale, unknown or contradictory authority remains deny-by-default. A public affiliate page is not evidence that B4GAMBLE has been accepted.

## Public legal conclusion

**DETECTED — public legal implementation for the current GB launch scope remains ready in Production.**

Current public legal implementation includes Privacy, Terms, Affiliate Disclosure, Programme just-in-time sensitive-input disclosure/explicit consent, responsible-gambling/protected-Help boundaries and commercial disclosure wording.

**DETECTED — SIGNED LETTERS OF APPOINTMENT, 22 AUGUST 2026:** 7BE Inc. has appointed Prighter EU Rep GmbH as its representative pursuant to Article 27 of the EU GDPR and Prighter Ltd as its representative pursuant to Article 27 of the UK GDPR. The 24 August 2026 bounded Privacy Policy release publishes the signed-LOA identities and addresses, the official Prighter data-subject portal, and both official live representation certificates. This does not appoint Prighter as a DPO or establish gambling, licensing, general legal or full-GDPR-compliance authority.

Public legal copy does not create or imply operator licensing, affiliate approval, partnership, regulatory approval or jurisdiction eligibility that has not been separately evidenced.

## Open legal / administrative deferrals

The EU and UK Article 27 appointments and their approved public particulars are no longer part of the deferred list. The following remain **OPEN — DEFERRED BY FOUNDER** and must not be described as completed:

1. **ICO registration / data-protection fee** — execution/evidence is not completed.
2. **Account-specific provider evidence** — exact plan/entity, accepted DPA/CDPA/terms, processing locations and applicable transfer mechanism evidence remain to be captured where not already evidenced.
3. **OpenAI project-specific controls evidence** — do not claim ZDR, MAM or a specific region without actual B4GAMBLE account/project evidence.
4. **DPIA approval record / ongoing review evidence** — do not invent internal signatures/completion.

The Founder has chosen not to delay initial market entry solely for these bounded administrative items. That risk decision does not complete the obligations or convert unknown external facts into detected facts.

## Launch recommendation

**GO WITH CONDITIONS.**

- **Website / product:** GO — ready.
- **Public legal implementation:** GO — ready for current scope.
- **Commercial CRM / Partner Operations:** GO — deployed, Production schema applied and verified.
- **Administrative legal follow-up:** OPEN under the existing Founder-accepted deferral posture.
- **Commercial activation:** GO only after a real partner passes the activation gate and the Founder explicitly authorises the activation.

## Reopen conditions

Reopen completed product/legal/Commercial OS architecture only for new material scope or evidence, including:

- Production regression;
- material Programme/product behaviour change;
- new provider or materially changed data handling;
- new data category/purpose/commercial use;
- new jurisdiction;
- material change in gambling/privacy/consumer-law requirements;
- new advertising/analytics/tracking technology;
- material change to public claims, partner model or commercial routing;
- evidence that the Commercial CRM/Partner Operations architecture cannot support the first real partner workflow safely.

Otherwise proceed to real partner acquisition and commercial operations rather than reopening completed site/legal/CRM construction work.
