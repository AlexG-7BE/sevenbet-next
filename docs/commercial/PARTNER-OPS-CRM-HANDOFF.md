# Partner Operations ↔ Commercial CRM handoff

This is the implementation contract for `COMMERCIAL-OPS-01`, not a future design.

**Removed 25 September 2026 (Founder decision):** the in-app Partner Operations
run — the Admin "Run bounded review" button,
`/api/admin/commercial/opportunities/[opportunityId]/partner-operations` and
`lib/commercial/partner-operations-provider.ts` (OpenAI `gpt-5.6-terra`) — and
the repository code that applied Agent operations to the CRM. It never invoked
the provider in Production: every stored `CommercialAgentRun` came from the
retired MCP transport. Historical runs and operations stay readable. The shared
contract remains for the isolated `agents/` package. Sections below that
describe applying an Agent run are historical.

## Models and enums

The exact Prisma models are `CommercialOpportunity`, `CommercialEvidence`, `CommercialContact`, `CommercialActivity`, `CommercialApplication`, `CommercialTerm`, `CommercialTask`, `CommercialAgentRun`, `CommercialAgentOperation` and `CommercialActivationPacket`. They reuse `AdminUser`, `CasinoOperator`, `CasinoBrand`, `Casino`, `AffiliateNetwork` and `AffiliateProgram` relations.

The pipeline enum is `CommercialOpportunityStage`: `PROSPECT`, `QUALIFIED`, `APPLICATION_READY`, `APPLIED`, `DUE_DILIGENCE`, `NEGOTIATING`, `APPROVED`, `ACTIVE`, `REJECTED`, `ON_HOLD`. Supporting enums in `prisma/schema.prisma` define priority, organisation, waiting-on, evidence classification/source/authority/category/status, actor/activity, application, terms, task, Agent run/operation and activation-readiness values.

## Code authority

- `shared/commercial/partner-operations-contract.ts`: true strict input/result and closed CRM operation contract.
- `lib/commercial/stage-policy.ts`: deterministic human stage transition rules and Agent-proposable stages.
- `lib/commercial/commercial-service.ts`: input validation and human use cases.
- `lib/repositories/commercial.repository.ts`: only Prisma write boundary, transactions, idempotency and audits.
- `/api/admin/commercial/opportunities/**`: permission-protected HTTP boundary.

## Agent-safe operation union

`CREATE_PROSPECT`, `UPDATE_PROSPECT_PROFILE`, `ADD_EVIDENCE`, `ADD_CONTACT`, `ADD_RESEARCH_NOTE`, `CREATE_TASK`, `UPDATE_NEXT_ACTION`, `CREATE_DRAFT_OUTREACH`, `CREATE_DRAFT_APPLICATION`, `RECORD_RESPONSE`, `RECORD_RECEIVED_TERM`, `PROPOSE_QUALIFICATION`, `PROPOSE_STAGE_TRANSITION`, `PREPARE_ACTIVATION_PACKET`.

An opportunity-scoped Admin run executes every operation except `CREATE_PROSPECT`; prospect creation uses the same validated CRM create use case before a detail-scoped run. Every operation has an operation ID, idempotency key and strict payload. Evidence-bearing actions cite IDs in the supplied opportunity snapshot.

`ADD_EVIDENCE` cannot turn model prose into a new external fact: it must cite at least one already supplied evidence ID, and the derived record preserves that provenance. New real email, application, agreement or web material is entered through the authenticated human/evidence-provider boundary first.

## Human-only and forbidden authority

Human-only: actual external application/outreach state recording, direct `APPROVED` transition, terms confirmation, canonical identity decisions and any future Founder activation decision. `APPROVED` requires direct approval evidence and the authenticated staff actor. Because IAM has no Founder role, the system records an explicit human event without claiming the actor is the Founder.

Forbidden to the Agent: setting `APPROVED` or `ACTIVE`; accepting terms; sending email; submitting an application; changing jurisdiction; creating/enabling tracking; activating AffiliateProgram/AffiliateOffer; publishing a commercial route; deployment; Production mutation. These are absent from the union rather than prompt-only prohibitions.

## Evidence and stage validation

Public-web evidence needs `observedAt`; source authority is separate and nullable. DETECTED/INFERRED/CONTRADICTION findings need known evidence IDs. Received terms need evidence. Contradictions create new evidence/term records and require review.

QUALIFIED needs rationale and `QUALIFICATION` evidence. APPLICATION_READY needs a draft/prepared application/outreach and next action. APPLIED needs submitted/sent state plus `EXTERNAL_ACTION` evidence. DUE_DILIGENCE, NEGOTIATING, APPROVED and REJECTED require their corresponding evidence categories. ON_HOLD requires a reason. ACTIVE always rejects in the ordinary service.

## Audit and idempotency

Human mutations record the staff `AdminUser` in `AuditLog`; timeline events retain actor kind, evidence, prior/new stage and reason. Agent runs store specialist, model route, provider flag, counts, token usage, result, evidence IDs and applied/rejected operations. Unique creation, child-record, run and operation keys make repeats bounded. A possible duplicate is flagged, never silently merged.

## Readiness integration

An activation packet is preparation evidence only. It does not call or
duplicate public Commercial authority, and no CRM stage changes route state.
Trusted GEO feeds the exact Casino × country `MarketActivation`, whose factual
Partner, agreement, AffiliateProgram/Casino identity, offer, tracking,
destination, legal and health checks fail closed alongside the independent
kill switch. No CRM activation endpoint/button exists.

## Valid operation example

```json
{
  "operationId": "draft-outreach-01",
  "idempotencyKey": "partner-42:draft-outreach:v1",
  "type": "CREATE_DRAFT_OUTREACH",
  "payload": {
    "title": "B4GAMBLE introduction",
    "draftText": "A concise, truthful draft for human review.",
    "channel": "EMAIL",
    "followUpAt": null
  }
}
```

This creates `CommercialApplication(state=DRAFT)` and `OUTREACH_DRAFTED`; it never sends or marks APPLIED.

## Rejected operation example

```json
{
  "operationId": "unsafe-01",
  "idempotencyKey": "unsafe-approval-01",
  "type": "SET_APPROVED",
  "payload": { "stage": "APPROVED" }
}
```

Parsing fails because `SET_APPROVED` is not a union member. Extra Prisma fields also fail strict payload parsing.

## Neutral Commercial research capability

**DETECTED IN CURRENT MAIN:** `CommercialResearchBundleSchema` and
`commercialOpportunityResearchService` expose the bounded research concepts
to internal application code without an HTTP transport, OAuth scope, external
client or connector identity. The repository remains the sole Prisma boundary.
It hashes the internal source reference, uses a `research:` idempotency
namespace and records `commercial_research_bundle_upserted`.

All evidence, duplicate, draft, term, stage, activation-packet, transaction,
idempotency and audit ceilings below remain. PR5 adds no caller. Partner
tracking is not part of this CRM service and remains in the separately
Founder-authority-gated canonical tracking service.

## Claude-operated CRM MCP (RFC-055)

**Founder instruction, 25 September 2026:** Claude operates the CRM. Its only
application caller is `lib/mcp/crm/server.ts`, served at the stateless
`POST /api/mcp/crm` endpoint with one bearer credential and no OAuth. It is
disabled (503) until `CRM_MCP_ENABLED=true`, `CRM_MCP_SERVICE_TOKEN` (at least
32 bytes) and `CRM_MCP_ACTOR_ID` (the Founder's own `AdminUser`; its role
must grant `affiliate.manage`) are set.

| Tool | Use |
| --- | --- |
| `crm_list_opportunities` | Find opportunities by name, stage or priority |
| `crm_get_opportunity` | Read one opportunity with evidence and timeline |
| `crm_find_possible_duplicates` | Check identity before creating a prospect |
| `crm_upsert_research_bundle` | Record mailbox/portal findings: evidence, contacts, notes, tasks, next action, drafts, evidenced terms, proposals |
| `crm_transition_stage` | Move to a real stage under the staff evidence rules; never into or out of `ACTIVE` |
| `crm_link_catalog` | Point the opportunity at an existing Casino, AffiliateNetwork, AffiliateProgram, CasinoOperator or CasinoBrand, or clear a link |
| `crm_delete_opportunity` | Permanently delete a prospect nobody ever contacted, after checking the partner mailbox for the company |

This supersedes the "human-only direct `APPROVED` transition" and "forbidden
to the Agent: setting `APPROVED`" lines above for this endpoint only:
`APPROVED` needs cited `APPROVAL` evidence. Each write is one transaction,
recorded as a `PARTNER_OPERATIONS_AGENT` timeline entry plus an `AuditLog`
row with the delegating actor and `channel: "crm-mcp"`; the same
`idempotencyKey` replays without a second entry. The CRM still has no route,
market, button, tracking or customer-data authority.

`crm_delete_opportunity` needs `confirmDisplayName` equal to the stored
display name and refuses, listing every blocker, when the stage is not
`PROSPECT`/`REJECTED`/`ON_HOLD` or the opportunity has EMAIL or AGREEMENT
evidence, a submitted/sent/answered/closed application, a sent-outreach,
response, meeting, negotiation, terms, Founder-decision or activation
timeline entry, any term, any partner market support or any catalog link.
Affiliate-portal and public-web research alone does not block. The
`commercial_opportunity_deleted` audit row (names, stage, reason, child
counts, retained agent-run IDs) is written before the delete in the same
transaction; the CRM children cascade and agent-run history stays. There is
no archive state.

Connect Claude with:

```text
claude mcp add --transport http b4gamble-crm https://b4gamble.com/api/mcp/crm \
  --header "Authorization: Bearer $CRM_MCP_SERVICE_TOKEN"
```

## Historical ChatGPT Work MCP evidence provider — superseded

> RFC-051 physically removes this transport and its operational OAuth
> provider. This section records historical implementation evidence only; it
> is not a setup or invocation instruction.

**DETECTED:** `PARTNER-OPS-WORK-BRIDGE-01` adds one separately authorised remote MCP adapter at `/api/mcp/commercial`; `PARTNER-OPS-WORK-BRIDGE-02` coordinates its auth foundation on `better-auth`, `@better-auth/core` and `@better-auth/oauth-provider` `1.7.1`. The provider owns OAuth authorization codes, PKCE S256, consent, opaque access-token issuance, protected token storage, rotating refresh-token families, replay response invalidation and revocation. The application owns ChatGPT callback/client policy, exact single-resource binding, `AdminUser`/`affiliate.manage`, the scopes `commercial:read` and `commercial:safe_write`, and the tool boundary. Tokens last 15 minutes; refresh tokens last up to 30 days when `offline_access` is granted. It is disabled unless `COMMERCIAL_MCP_ENABLED=true`; failure is isolated from Admin, consumer auth, Programme and ordinary CRM operation.

**DETECTED:** ChatGPT supports CIMD and DCR; DCR remains supported and is retained for this bounded upgrade, while a future CIMD change is separately reviewable. This bridge permits unauthenticated DCR only for allowlisted ChatGPT public callbacks. Registration has zero Commercial authority, produces no secret, uses application type `web`, and keeps client-credentials scopes empty. The provider models are `oauthClient`, `oauthResource`, `oauthClientResource`, `oauthRefreshToken`, `oauthAccessToken`, `oauthConsent` and `oauthClientAssertion`. Access/refresh tokens and authorization codes are stored only as provider hashes, never as reusable plaintext. The application revalidates the protected row, revocation, expiry, session, client/resource, scopes and current staff permission on every MCP request.

**DETECTED SECURITY UPGRADE:** `@better-auth/oauth-provider` `1.7.1` is beyond the fixed version for `GHSA-p2fr-6hmx-4528`. Provider-owned resource arrays now bind authorization codes, access tokens, refresh tokens and consents to the grant. The approved bridge remains deliberately single-resource: one exact protected resource, one client-resource link, the same exact resource in application-owned client metadata and wrappers, opaque tokens, and per-request resource validation. No multi-resource client or cross-environment client reuse is authorised.

The MCP application exposes exactly four tools:

- `commercial_list_opportunities`
- `commercial_get_opportunity`
- `commercial_find_possible_duplicates`
- `commercial_upsert_research_bundle`

The first three return bounded DTOs. The write tool accepts one strict, transactional research bundle. The opportunity identity and each child carry deterministic idempotency data. Supported children are safe profile fields, external evidence, evidenced B2B contacts, research notes, tasks, next action, draft/prepared application material, draft outreach, evidenced `PROPOSED`/`RECEIVED` terms, qualification and `QUALIFIED`/`APPLICATION_READY` proposals, and an activation packet no higher than `READY_FOR_FOUNDER_REVIEW`.

**DETECTED:** Work evidence accepts a source type, URL or bounded reference, supported claim, classification, category, title, optional notes and relevant timestamps. Public-web evidence requires `observedAt`. The schema contains no `sourceAuthority`; the repository always persists Work-supplied authority as `null`. It stores claim/provenance rather than raw page or mailbox bodies. Received term values require direct `DETECTED` email, application-portal, agreement or official-operator evidence. Prompt text inside a claim cannot change scopes, tools, schemas or commercial policy.

**DETECTED:** An exact display-and-legal-name match can update one deterministic record. A weaker identity match returns `POSSIBLE_DUPLICATE` without writing. An explicit `possibleDuplicateOfId` records uncertainty and never performs a merge.

The MCP adapter calls `commercialMcpService`, which validates strict Zod input and calls the existing `commercialRepository`. Only the repository imports Prisma. A bundle and its audit/run/operation records commit in one transaction. A transaction-scoped advisory lock serialises concurrent requests with the same client/run key; stable child keys prevent a later bundle from overwriting an already-applied profile or next action. Audit metadata records the staff delegator, ChatGPT Work client, MCP channel, run, idempotency key and resulting entity/evidence IDs, but never credentials or OAuth codes.

**CONTRADICTION RESOLVED:** The earlier future-provider paragraph and original RFC-027 ceiling said Work/OAuth was not yet authorised. The explicit Founder instruction `PARTNER-OPS-WORK-BRIDGE-01` is newer decision authority and authorises only this bounded adapter. It does not authorise a general external tool platform, Gmail integration, autonomous web research inside B4GAMBLE, or any external action.

## Current safe execution

1. Authenticate to protected Admin with `affiliate.manage`.
2. Create or open a real evidence-led prospect; do not use synthetic Production records.
3. Add the current source evidence.
4. Run Partner Operations from the detail screen. With no server credential, the route fails safely and CRM remains usable.
5. Review the validated result, operations, drafts and gaps in the timeline/run record.
6. Perform any external or approval action outside the Agent and record its direct evidence through the human CRM path.
7. Never treat a packet or CRM stage as public Commercial authority.

External connector retirement and release steps are maintained in
`docs/06_Operations/Commercial-Core-PR5-MCP-Extraction-Retirement.md`.
