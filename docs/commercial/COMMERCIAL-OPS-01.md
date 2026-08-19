# COMMERCIAL-OPS-01

Status: candidate implementation on `codex/commercial-ops-01`; not Production. Public commercial and GB referral activation remain off.

## Evidence baseline

**Detected:** The repository has protected Admin authentication/permissions, Prisma/PostgreSQL, canonical Casino/Operator/Brand and affiliate aggregates, audit records, and a fail-closed GB readiness evaluator. It had no durable prospect-to-partner CRM or verified commercial performance event store before this change.

**Inferred:** Reusing `affiliate.manage`, the existing Admin shell and existing audit table is the smallest permission and operating boundary. An information-dense list is more appropriate than a drag-and-drop board because all stage changes require server validation.

**Planned:** A later separately authorised activation service may convert a Founder-reviewed packet into an activation attempt by invoking the existing RFC-015 evaluator. A later evidence-backed event source may populate aggregate analytics.

**Not detected:** No real prospect, application, approval, agreement, terms, tracking destination, active partner, GB outbound route, verified clicks, registrations, FTDs, revenue or commission was added by this work.

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
- The additive migration exactly matches the Prisma baseline-to-candidate SQL diff and contains no destructive statement, but it was not applied because no disposable localhost PostgreSQL service or Docker runtime was available. Production was not mutated.

## Verification evidence

The no-key Commercial Ops suite passes 20/20 and the complete agents package passes 43/43, including the committed 18-case Partner Operations safety corpus. One authorised non-personal live smoke completed as `partner-operations / COMPLETED / REVIEW` with explicit bulk `gpt-5.6-luna`, one request, 1,461 input tokens, 331 output tokens, 1,792 total tokens and a `$0.003447` conservative upper bound. It kept the empty relationship claim `UNKNOWN`, requested evidence, proposed no external action and had no CRM/database capability.
