# RFC-055: Claude-Operated Partner CRM

- **Status:** `ACTIVE`
- **Decision owner:** B4GAMBLE Founder
- **Decision date:** 25 September 2026
- **Implementation authority:** explicit Founder instruction in chat, 25
  September 2026: "Claude ведёт CRM" (Claude operates the partner CRM); the
  same day's follow-up adds permanent delete of never-contacted prospects,
  names the Founder's own `AdminUser` as the delegating actor and rejects any
  archive column or migration
- **Scope:** one service-authenticated, stateless MCP endpoint through which
  Claude reads and maintains the Commercial CRM
- **Depends on:** Product Vision & Principles, RFC-013, RFC-027, RFC-046,
  RFC-047, RFC-048, RFC-051 and RFC-052
- **Amends:** RFC-051 §1 and §4, where the neutral CRM research capability is
  "not exposed by a replacement public transport" and has no caller; RFC-027
  §16.7 and §17.6–17.7, where agent stage recommendations stay proposals and
  exclude `APPROVED`
- **Does not change:** RFC-048 (CRM has no Partner, relationship, tracking,
  market, route or public-action authority), RFC-047, RFC-042/049/050/054
  route authority, RFC-046 customer data, or any database schema (no
  migration)

## 1. Decision

Claude operates the partner Commercial CRM. A weekly scheduled Claude routine
reads the partner mailbox and affiliate portals and records what it finds in
the CRM; Claude also performs a one-off cleanup of real stages, duplicates and
links to canonical catalog identities, and may permanently delete prospects
that nobody ever contacted.

The CRM stays an operational record. Everything Claude writes is CRM data:
nothing it does creates, changes or vetoes an offer, a partner button, a
`/r/` route, a MarketActivation, a PartnerCasinoRelationship or a tracking
link.

## 2. Transport and authentication

`POST /api/mcp/crm` is an official MCP stateless Streamable HTTP endpoint,
built the same way as the RFC-052 Learn endpoint:

- one server-held bearer credential, compared by SHA-256 digest with
  `timingSafeEqual`; no browser session, cookie or query-string credential;
- no OAuth, discovery document, DCR, client registration or consent page;
- `GET`, `DELETE`, `PATCH` and `PUT` return 405;
- a 1 MiB request-body cap and process-local per-address rate limits;
- disabled (503) unless `CRM_MCP_ENABLED` is exactly `true` and the token and
  actor configuration are valid.

| Variable | Meaning |
| --- | --- |
| `CRM_MCP_ENABLED` | Exact `true` enables the endpoint; anything else returns 503 |
| `CRM_MCP_SERVICE_TOKEN` | Secret bearer credential, at least 32 bytes |
| `CRM_MCP_ACTOR_ID` | `AdminUser.id` recorded as the delegating staff actor for every write; the Founder's own `AdminUser` |

Before every write the actor must exist and its role must grant
`affiliate.manage`; otherwise the tool fails closed with a non-retryable
`SERVICE_ACTOR_INVALID` or `SERVICE_ACTOR_NOT_CONFIGURED` error.

Claude connects with:

```text
claude mcp add --transport http b4gamble-crm https://b4gamble.com/api/mcp/crm \
  --header "Authorization: Bearer $CRM_MCP_SERVICE_TOKEN"
```

## 3. Tools

Every tool validates a strict, closed Zod input (published as JSON Schema)
and returns `structuredContent`. Failures return a structured `ERROR` with a
code, message, persistence and retryability, and never a stack.

| Tool | Behaviour |
| --- | --- |
| `crm_list_opportunities` | List opportunities by name, stage and priority |
| `crm_get_opportunity` | One opportunity with evidence, contacts, timeline, applications, terms, tasks and packets |
| `crm_find_possible_duplicates` | Name-based identity candidates; nothing is merged |
| `crm_upsert_research_bundle` | The existing RFC-051 research bundle: evidence, contacts, notes, tasks, next action, drafts, evidenced terms, proposals, activation packet |
| `crm_transition_stage` | Evidence-gated stage change (§4) |
| `crm_link_catalog` | Set or clear the opportunity's `casinoId`, `affiliateNetworkId`, `affiliateProgramId`, `operatorId` and `brandId` (§5) |
| `crm_delete_opportunity` | Permanently delete a never-contacted prospect (§6) |

The research bundle keeps every RFC-051 ceiling: drafts are never sent, terms
need DETECTED evidence, uncertain identity returns `POSSIBLE_DUPLICATE`
without writing, and activation packets stop at Founder review. The bundle
source reference is the constant `crm-mcp`, so child idempotency keys stay
stable across bundles for the same opportunity.

## 4. Stage transitions

`crm_transition_stage` applies exactly the staff rules in
`lib/commercial/stage-policy.ts` to the stored opportunity and the evidence it
cites:

- `QUALIFIED` needs a qualification rationale and `QUALIFICATION` evidence;
- `APPLICATION_READY` needs a draft or prepared application and a next action;
- `APPLIED` needs `EXTERNAL_ACTION` evidence and a submitted or sent record;
- `DUE_DILIGENCE`, `NEGOTIATING`, `APPROVED` and `REJECTED` need evidence of
  that category;
- `ON_HOLD` and every other transition need a reason; and
- cited evidence must belong to the same opportunity.

`ACTIVE` is derived from governed live routes. The input schema does not
offer it, and a delegated transition cannot move an opportunity out of
`ACTIVE` either (Founder-confirmed); a stale `ACTIVE` record is reported to
the Founder.

This amends RFC-027: under the Founder decision the agent may now change the
stage itself, including `APPROVED` when it cites `APPROVAL` evidence. A CRM
stage, `APPROVED` included, still grants no commercial authority (RFC-048).

## 5. Catalog links

`crm_link_catalog` is the RFC-048 dependency direction, CRM to canonical
identity. Each referenced Casino, AffiliateNetwork, AffiliateProgram,
CasinoOperator or CasinoBrand must already exist; it is read for existence
only. Only the named foreign keys on `CommercialOpportunity` change. The tool
never creates or changes a catalog record, PartnerCasinoRelationship,
MarketActivation, tracking link, redirect, offer or public page.

## 6. Deleting a never-contacted prospect

Most CRM rows are agent-researched prospects that nobody contacted.
`crm_delete_opportunity` removes one of them permanently; there is no archive
state, column or migration. Its input is `opportunityId`, `confirmDisplayName`
(must equal the stored display name exactly), `reason` and `idempotencyKey`.
The tool description tells the caller to search the partner mailbox for the
company first and to record any correspondence as EMAIL evidence instead.

The delete is refused, with the full blocker list, when any of these is true:

- the stage is not `PROSPECT`, `REJECTED` or `ON_HOLD`;
- there is EMAIL or AGREEMENT evidence;
- an application is `SUBMITTED`, `SENT`, `RESPONSE_RECEIVED` or `CLOSED`;
- the timeline has `APPLICATION_SUBMITTED`, `OUTREACH_SENT`,
  `RESPONSE_RECEIVED`, `MEETING`, `NEGOTIATION`, `TERMS_RECEIVED`,
  `FOUNDER_DECISION` or `ACTIVATION_EVENT`;
- any commercial term exists;
- any `PartnerCasinoMarketSupport` row references it; or
- any catalog link is set.

Public-web or affiliate-portal research evidence, drafts, tasks and notes do
not block. In one transaction the tool writes the `AuditLog` row
`commercial_opportunity_deleted` first (display and legal name, stage, reason,
child counts per relation, retained agent-run IDs, cleared duplicate
references, `channel: "crm-mcp"`) and then deletes the opportunity. Evidence,
contacts, activities, applications, terms, tasks and activation packets
cascade. Agent runs and operations keep their history with a null
opportunity; other opportunities' `possibleDuplicateOfId` pointing at it is
cleared. Terms would block deletion anyway, so the term→evidence `RESTRICT`
never fires. A replay with the same `idempotencyKey` returns the recorded
outcome from the audit row; another key after deletion is a `CONFLICT`.

Replaying an old research bundle key after a delete returns its recorded
`IDEMPOTENT_REPLAY` and does not recreate the prospect; a new bundle key
creates a new one.

## 7. Audit and idempotency

Every write runs in one transaction under a per-opportunity advisory lock:

- the CRM timeline records a `CommercialActivity` with actor kind
  `PARTNER_OPERATIONS_AGENT` and the delegating actor (`STAGE_CHANGE` with
  previous/new stage, reason and first evidence ID; `NOTE` for catalog links);
- `AuditLog` records `commercial_delegated_stage_changed` or
  `commercial_delegated_catalog_linked` with the delegating actor and metadata
  `{ channel: "crm-mcp", actorKind, idempotencyKey, activityId, ... }`;
- a replay of the same `idempotencyKey` returns `IDEMPOTENT_REPLAY` without a
  second activity or audit row; reusing the key with a different request is a
  `CONFLICT`; and
- a request that changes nothing returns `UNCHANGED` and writes nothing.

Research bundles keep their RFC-051 run, operation and
`commercial_research_bundle_upserted` audit records. Deletion records only its
`commercial_opportunity_deleted` audit row (§6), because the timeline is
deleted with the opportunity.

## 8. Data boundary

The endpoint reads and writes only Commercial CRM rows, `AuditLog`, the
delegating `AdminUser` (id and role), catalog ids for existence and the count
of `PartnerCasinoMarketSupport` rows that reference an opportunity. It never
reads or writes customer, `User`, analytics, lifecycle email, Programme or
Help data (RFC-046, RFC-017), tracking, MarketActivation,
PartnerCasinoRelationship, redirects or public commercial action code. Public
runtime and `PartnerTrackingRegistrationService` do not depend on it. Tests
in `tests/crm-mcp.test.ts` and `tests/commercial-core-pr5-mcp-retirement.test.ts`
pin these boundaries.

## 9. Rollback

Set `CRM_MCP_ENABLED` to anything other than `true` (503), or rotate
`CRM_MCP_SERVICE_TOKEN`. Written CRM rows stay as ordinary, audited CRM
history and can be corrected through the Admin CRM. A delete is not
reversible in the application; recovery of a wrongly deleted prospect uses
its audit row (names, counts, reason) to re-create it, or a database restore
under RFC-024.
