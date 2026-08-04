# Programme Definition of Done

Status: Required checklist for every new or materially changed Active Control Programme Mission.

## Product contract

- [ ] The user outcome and user-owned artefact are approved.
- [ ] Draft, completed, paused and skipped/not-now states are defined where applicable.
- [ ] Prerequisite and next Mission are approved.
- [ ] XP and achievement consequences are approved; commercial actions are ineligible.
- [ ] Leave, pause and protected Help routes are defined.
- [ ] Privacy classification, permitted purpose and retention/erasure requirements are defined.
- [ ] Evidence/content and compliance review gates are recorded.

## Backend

- [ ] Typed request/response contract and API documentation exist.
- [ ] Strict request validation rejects extra/client-authority fields.
- [ ] Authentication is applied where required.
- [ ] Ownership is enforced in application/repository queries for every private read/write/delete.
- [ ] Idempotency keys and database guarantees are defined.
- [ ] The complete user result has one explicit transaction boundary.
- [ ] Registry/prerequisite/next-Mission and reward policy entries are added.
- [ ] Dashboard projects the truthful new state without client calculation.
- [ ] Duplicate sequential completion test passes.
- [ ] Concurrent completion test passes.
- [ ] Rollback/failure-injection test passes.
- [ ] Foreign-user read/update/delete tests pass.
- [ ] Migration and preflight exist when required, or impact is explicitly `none`.
- [ ] API documentation is updated without presenting planned work as implemented.

## Operations and privacy

- [ ] Rate-limit decision is recorded.
- [ ] Telemetry contract and forbidden sensitive fields are defined, or telemetry is explicitly deferred.
- [ ] Expiry/cleanup requirement and operational owner are defined.
- [ ] Error monitoring requirement is defined.
- [ ] Account export/erasure impact is reviewed.
- [ ] Release, forward/rollback and migration notes are present.
- [ ] Remaining distributed/runtime/observability gaps are listed.

## Delivery

- [ ] Work is on a focused branch and reviewed through one focused Pull Request; no direct commit/merge to `main`.
- [ ] Programme regression tests pass.
- [ ] Relevant/full tests pass.
- [ ] Typecheck passes.
- [ ] `prisma validate` passes.
- [ ] Production build passes.
- [ ] Lint result reflects the actual repository configuration.
- [ ] No circular dependency or Prisma import in Programme routes is introduced.
- [ ] Technical baseline, API and engineering standards are updated where facts changed.
- [ ] Product behaviour, API, reward, migration and frontend impacts are declared.
- [ ] Remaining risks and release gates are declared.

Frontend design/implementation requirements remain governed by the active Programme RFCs and design authority. This backend checklist does not authorise a visual or product change.
