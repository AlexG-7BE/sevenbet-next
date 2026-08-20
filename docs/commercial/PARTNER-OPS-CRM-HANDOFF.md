# Partner Operations ↔ Commercial CRM handoff

This is the implementation contract for `COMMERCIAL-OPS-01`, not a future design.

## Models and enums

The exact Prisma models are `CommercialOpportunity`, `CommercialEvidence`, `CommercialContact`, `CommercialActivity`, `CommercialApplication`, `CommercialTerm`, `CommercialTask`, `CommercialAgentRun`, `CommercialAgentOperation` and `CommercialActivationPacket`. They reuse `AdminUser`, `CasinoOperator`, `CasinoBrand`, `Casino`, `AffiliateNetwork` and `AffiliateProgram` relations.

The pipeline enum is `CommercialOpportunityStage`: `PROSPECT`, `QUALIFIED`, `APPLICATION_READY`, `APPLIED`, `DUE_DILIGENCE`, `NEGOTIATING`, `APPROVED`, `ACTIVE`, `REJECTED`, `ON_HOLD`. Supporting enums in `prisma/schema.prisma` define priority, organisation, waiting-on, evidence classification/source/authority/category/status, actor/activity, application, terms, task, Agent run/operation and activation-readiness values.

## Code authority

- `shared/commercial/partner-operations-contract.ts`: true strict input/result and closed CRM operation contract.
- `lib/commercial/stage-policy.ts`: deterministic human stage transition rules and Agent-proposable stages.
- `lib/commercial/commercial-service.ts`: input validation and human/Agent use cases.
- `lib/repositories/commercial.repository.ts`: only Prisma write boundary, transactions, idempotency and audits.
- `lib/commercial/partner-operations-provider.ts`: protected snapshot, commercial firewall, no-tools structured provider call and post-provider validation.
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

An activation packet maps preparation status to RFC-015 authorities. It does not call or duplicate the evaluator. No CRM stage changes affiliate state. The existing central evaluator and kill switch remain route-time authority, and no activation endpoint/button exists.

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

## Future evidence providers

A future Work, Gmail or web workflow may provide a bounded evidence item through a separately authorised adapter: source type/reference, observed time, claim, classification and opaque source reference. It must not pass credentials, entire mailboxes, private customer content or claim source authority it did not establish. Email ingestion records a response only when the supplied source evidence exists; it never sends. New external integrations require their own authority/security review.

## Safe execution

1. Authenticate to protected Admin with `affiliate.manage`.
2. Create or open a real evidence-led prospect; do not use synthetic Production records.
3. Add the current source evidence.
4. Run Partner Operations from the detail screen. With no server credential, the route fails safely and CRM remains usable.
5. Review the validated result, operations, drafts and gaps in the timeline/run record.
6. Perform any external or approval action outside the Agent and record its direct evidence through the human CRM path.
7. Never treat a packet or CRM stage as RFC-015 route authority.
