# Backend Programme Standards

Status: Repository engineering standard. Applies to Active Control Programme delivery, application, domain and persistence code.

## Request lifecycle

Programme routes perform this sequence:

1. authenticate the actor where required;
2. apply the configured rate-limit policy where applicable;
3. parse bounded JSON;
4. validate the request contract;
5. call one application use case;
6. return the existing success envelope;
7. map typed errors through the central Programme HTTP mapper.

Routes do not import Prisma, calculate rewards/progression, decide Mission eligibility, enforce ownership by themselves, assemble the Dashboard, or issue unrelated writes.

## Responsibility and dependency rules

- Authentication identifies an actor; ownership separately resolves that actor to the owned enrollment/artefact.
- Application services coordinate one use case and own its transaction boundary.
- Domain functions define framework-independent ordering, prerequisites, reward policy and state rules.
- Infrastructure repositories own Prisma persistence/query operations and ORM conversion.
- Repository methods do not accept client-authored reward amounts, completion state, user IDs for foreign artefacts, or commercial targeting decisions.
- Dashboard reads do not mutate state and run through a repeatable snapshot when not already inside a completion transaction.
- Private Programme content is never passed to casino, affiliate, offer or commercial analytics modules.

## Transactions and idempotency

- The transaction boundary is the complete user result, not an individual table write.
- Mission 01 claim/direct authenticated completion and Missions 02–04 completion use `Serializable` Prisma transactions with bounded retry for transaction conflicts.
- Dashboard projection returned by completion uses the same transaction context.
- No network call, external provider request or unbounded work runs inside a database transaction.
- Claim consumption is conditional. Mission, artefact, progress-event, XP, achievement and active-day identities are database-constrained.
- Sequential and concurrent duplicate completion are mandatory tests. Expected replay returns the existing truthful result or the documented conflict; it never becomes a `500`.
- Every multi-write completion has failure-injection/rollback coverage.

## Validation and errors

- Validation occurs before a mutation. Mission-specific validation stays in its vertical slice.
- Client-provided extra fields are rejected; the client never supplies reward/progress authority.
- Typed Programme errors distinguish missing resources, locked/invalid transitions, incomplete tasks, expired claims/sessions and forbidden staff operations while preserving the public response contract.
- Error responses never echo personal free text or expose Prisma/database details.
- Foreign private resources use the existing not-found semantics to avoid ownership disclosure.

## Rewards, active days and read models

- `mission-registry.ts` is the ordering/prerequisite/next-Mission source; `reward-policy.ts` exposes approved implemented recognition.
- XP and achievements are append-only server facts with deterministic award keys.
- One user-local date is one active day. Historical date/timezone facts are not recomputed after the event.
- An active-day correction is an attributed void and does not silently change XP.
- Repeated Dashboard/reward reads do not write or infer missing state.

## Rate limiting and operations

- The current in-memory limiter is a development/single-process baseline, not a production multi-instance guarantee.
- A replacement implements the Programme rate-limiter contract; adding Redis/Upstash or another provider requires an operations decision and deployment evidence.
- Automated anonymous expiry purge, distributed rate limiting, account-wide export/erasure and telemetry remain release/operations gates until implemented and verified.
- Programme routes use the default Vercel/Next.js Node runtime because opaque token hashing depends on `node:crypto`; an Edge move requires compatibility tests and an explicit decision.

## Required verification

At minimum, a Programme backend change runs the repository's actual commands for Programme tests, typecheck, Prisma validation and production build. Run the relevant/full Node test suite and lint only as actually configured. Report unavailable or broken gates; do not claim they passed.
