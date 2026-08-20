# COMMERCIAL-OPS-01

Status: **READY IN PRODUCTION** for the Commercial CRM delivered by PR #81; Production migration `0020_commercial_ops_01` is applied and verified. The additive ChatGPT Work MCP bridge is a separately feature-gated candidate under `PARTNER-OPS-WORK-BRIDGE-01`. Public commercial and GB referral activation remain off.

## Evidence baseline

**DETECTED:** The repository has protected Admin authentication/permissions, Prisma/PostgreSQL, canonical Casino/Operator/Brand and affiliate aggregates, audit records, a fail-closed GB readiness evaluator, and the deployed Commercial CRM. It still has no verified commercial performance event store.

**INFERRED:** Reusing `affiliate.manage`, the existing Admin shell and existing audit table is the smallest permission and operating boundary. An information-dense list is more appropriate than a drag-and-drop board because all stage changes require server validation.

**PROPOSED:** A later separately authorised activation service may convert a Founder-reviewed packet into an activation attempt by invoking the existing RFC-015 evaluator. A later evidence-backed event source may populate aggregate analytics.

**UNKNOWN:** Repository evidence does not establish a real prospect, application, approval, agreement, terms, tracking destination, active partner, GB outbound route, verified clicks, registrations, FTDs, revenue or commission. `PARTNER-OPS-WORK-BRIDGE-01` does not create synthetic records or mutate Production during implementation.

## Implemented architecture

`/admin/commercial` is the protected Pipeline. `/admin/commercial/partners` is the directory, `/admin/commercial/partners/[opportunityId]` is the full record, and `/admin/commercial/analytics` is the truthful performance view. All pages and `/api/admin/commercial/**` require existing staff authentication and `affiliate.manage`. The existing Admin shell, navigation, cards, typography and error conventions are reused.

The Prisma aggregate is `CommercialOpportunity`. It optionally links to canonical `CasinoOperator`, `CasinoBrand`, `Casino`, `AffiliateNetwork` and `AffiliateProgram`; no shadow copy is created. Child records are evidence, bounded B2B contacts, activity, application/outreach, evidenced terms, lightweight tasks, Agent runs/operations and activation packets.

The lifecycle is:

`PROSPECT → QUALIFIED → APPLICATION_READY → APPLIED → DUE_DILIGENCE → NEGOTIATING → APPROVED → ACTIVE`, with evidence-supported skips plus `REJECTED` and `ON_HOLD`.

Transitions are not client writes. `lib/commercial/stage-policy.ts` checks deliberate reasons and the required evidence/application facts. `APPROVED` requires a human API action plus direct `APPROVAL` evidence. `ACTIVE` always fails ordinary transition validation and is absent from the UI and Agent schema.

## Evidence, audit, and idempotency

`CommercialEvidence` stores source type, separately optional source authority, classification (`DETECTED`, `INFERRED`, `PROPOSED`, `UNKNOWN`, `CONTRADICTION`), category, observation/recheck timestamps, claim, fingerprint and idempotency key. Public-web evidence requires an observation time. Source type never proves authority.

Application state distinguishes draft/prepared from submitted/sent; external states require evidence and the server records the actual timestamp. Terms require an evidence foreign key. New contradictory evidence or terms are separate records and never overwrite an older fact silently. Material human and Agent writes create `AuditLog` and/or immutable commercial timeline entries. Per-opportunity uniqueness and operation/run keys make retries idempotent; uncertain identity uses `possibleDuplicateOfId` rather than an automatic merge.

## Partner Operations execution

The canonical key is `partner-operations`; `partner-intelligence` is a compatibility alias. A server-only adapter builds the strict bounded snapshot, applies the commercial firewall, invokes one no-tools structured response when a server credential exists, validates the result and evidence references, then sends the closed operation batch to `commercialRepository.applyPartnerOperations`. The batch executes transactionally.

The safe surface can update descriptive profile data; add evidence, contacts and research notes; create tasks and next actions; create draft outreach/applications; record evidenced responses and received terms; propose qualification/stage changes; and prepare an activation packet. Proposed stages are timeline proposals, not stage mutations.

There is no operation for approval, activation, term acceptance, email send, application submit, tracking/programme/offer changes, jurisdiction, deployment or Production. CRM/provider failure cannot bypass validation and does not affect normal CRM use.

## ChatGPT Work bridge

**DETECTED:** The feature-gated `/api/mcp/commercial` route uses the official MCP TypeScript SDK and stateless Streamable HTTP. Its OAuth foundation pins the latest stable 1.6 line: Better Auth `1.6.30` and `@better-auth/oauth-provider` `1.6.30`. The provider owns authorization-code issuance/consumption, PKCE S256, consent, protected opaque-token storage, refresh rotation/replay handling and revocation. The application owns ChatGPT callback/client policy, a single exact resource audience, staff/`affiliate.manage`, Commercial scopes and tool authorization. Public DCR is restricted to current ChatGPT callbacks and grants no Commercial authority by itself.

**DETECTED:** Provider storage is `oauthClient`, `oauthRefreshToken`, `oauthAccessToken` and `oauthConsent`. Reusable access tokens, refresh tokens and authorization codes are not persisted or queried in plaintext. Every MCP call requires an unexpired provider token/session, exact client/resource binding, the required scope and current staff permission. The stable-line resource-indicator advisory `GHSA-p2fr-6hmx-4528` is contained by the one configured audience plus wrapper, client-metadata and per-request exact-resource checks; multi-resource use is not authorised.

Only four purpose-built tools are exposed. Read tools use bounded projections. `commercial_upsert_research_bundle` is a non-destructive, idempotent write tool that calls the Commercial service then the existing repository. It transactionally creates or updates one prospect research bundle, uses a transaction-scoped PostgreSQL advisory lock for concurrent same-key replay, returns entity IDs, and leaves uncertain duplicate matches unwritten. External evidence authority is always `null`; public evidence needs an observation time; direct received terms need detected source evidence.

**DETECTED:** The schema has no fields or tool names for `APPROVED`, `ACTIVE`, send, submit, accept terms, tracking activation, AffiliateProgram/AffiliateOffer mutation, jurisdiction, deployment or Production administration. Stage proposals are limited to `QUALIFIED` and `APPLICATION_READY`. Activation preparation is capped at `READY_FOR_FOUNDER_REVIEW`.

**PROPOSED RELEASE CONTROL:** The MCP feature remains disabled until the additive `0021_partner_ops_work_bridge_01` migration is separately authorised/applied and `COMMERCIAL_MCP_ENABLED=true` is configured. Deployment without those steps leaves the endpoint at a fail-closed `503` and does not affect the existing CRM or auth flows.

## Commercial and analytics boundary

The commercial code does not import the private Programme domain or expose Programme/Help/vulnerability fields in its contract. It does not modify public DTOs. Analytics deliberately renders zero verified performance data because the repository contains no qualifying event source; it adds no tracker or user profile.

RFC-015 remains the controlling authority. CRM `APPROVED` is neither an active affiliate record nor route readiness. The kill switch, jurisdiction decision, agreement, exact identity/domain/licence, programme, offer, tracking and bonus checks remain independently cumulative and fail-closed.

## Failure and rollback

Provider credential absence returns a bounded unavailable result without a provider request or CRM write. Invalid output, unknown evidence, unknown operations and arbitrary payload fields are rejected. An operation batch is validated then applied in one database transaction. Ordinary CRM pages remain available if OpenAI is unavailable.

Rollback is a code rollback plus, only before Production adoption and under separately authorised database operations, reversal of the additive migration. No destructive rollback is included. The global affiliate kill switch and GB policy remain independent containment controls.

## Current limitations

- Admin supports live provider execution only when `OPENAI_API_KEY` already exists server-side; no key is requested or stored.
- The existing role model has no formal Founder role. CRM approval records the authenticated staff actor and never labels that action a Founder decision. A future Founder decision requires its own explicit evidence/event; Founder identity remains an organisational control.
- Canonical identity linking is represented in the data model but not exposed as a general picker in this first Admin screen.
- Analytics remains empty until real aggregate affiliate events exist.
- No activation executor exists in this workstream by design.
- ChatGPT supports CIMD and DCR. The bridge currently uses DCR because the selected ChatGPT connection flow supports it; DCR registers only an allowlisted public client with no secret or Commercial authority.
- The bridge does not ingest mailboxes or browse the web itself. ChatGPT Work supplies bounded evidence claims/provenance gathered through separately authorised Work connectors.
- OAuth client/token revocation is protocol-based; the first bridge does not add a separate Admin client-management screen.
- Migration `0021_partner_ops_work_bridge_01` is additive and must not be applied to Production without a separate Founder GO after merge.

## Verification evidence

The no-key Commercial Ops suite passes 20/20 and the complete agents package passes 43/43, including the committed 18-case Partner Operations safety corpus. One authorised non-personal live smoke completed as `partner-operations / COMPLETED / REVIEW` with explicit bulk `gpt-5.6-luna`, one request, 1,461 input tokens, 331 output tokens, 1,792 total tokens and a `$0.003447` conservative upper bound. It kept the empty relationship claim `UNKNOWN`, requested evidence, proposed no external action and had no CRM/database capability.

**DETECTED (PARTNER-OPS-WORK-BRIDGE-01 candidate, 2026-08-20):** the dedicated MCP contract/auth/protocol/structural suite passes 27/27. The disposable-PostgreSQL MCP suite passes all 4 top-level tests and 5 OAuth lifecycle subtests, covering protected access/refresh storage, provider-backed verification, expiry, resource binding, live staff permission, rotation, replay/concurrency and immediate revocation, plus the prior rate-limit and transactional CRM cases. Commercial Ops passes 24/24; auth passes 50/50; auth-comms passes 41/41; and the Commercial MCP/Admin browser/API suite passes 5/5. Prisma validation, a clean 21-migration PostgreSQL replay, lint, TypeScript, build-secret scanning and the Production build pass. These checks do not authorise deployment, Production migration or feature enablement.
