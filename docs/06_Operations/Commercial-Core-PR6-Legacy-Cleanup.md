# Commercial Core PR6 — Legacy Connector Storage Cleanup

**Status:** APPLIED — RETIRED — DO NOT RE-RUN
**Authority:** RFC-051 and the current Founder instruction of 14 September 2026
**Historical review base:** `313b18bfff5db98d7e66b16088ec3ed8537fc299`
**Current prohibition:** do not re-run, repair, recreate or expand the retired connector scope

## Current outcome

**DETECTED in current canonical main and a database-enforced read-only
Production transaction:** migration
`0041_commercial_core_legacy_connector_cleanup` is applied, all 41 ordered
migrations are complete, and none of the eight retired target tables remains.
The current Prisma schema has 109 models. Identity, session, generic
verification, AuditLog and immutable migration history remain.

The MCP/operational-OAuth application transport and both external connector
registrations were already retired by PR5. PR6 removed only the reviewed
connector storage and compatibility objects. It did not restore a caller,
rewrite historical audit evidence or change MarketActivation, `/r`, CRM,
Programme or analytics authority.

All planning, projection, APPLY-gate and rollback language below is historical
pre-apply evidence. It explains how the one-time deletion was bounded; it is
not a current operational instruction.

## Historical outcome boundary

PR6 removed the retired connector persistence model from the active Prisma
schema and prepared one explicit migration. At this review checkpoint it had
not yet applied that migration to Production. PR5 application transport was
already retired and the external
custom connections `B4GAMBLE Commercial Operations2` and `B4GAMBLE Media GEO3`
are already disconnected. PR6 must not recreate either connection or any
transport surface.

The migration is intentionally destructive. Application rollback cannot
restore the deleted connector rows.

## DETECTED

The exact fetched base and `origin/main` were both
`313b18bfff5db98d7e66b16088ec3ed8537fc299` before substantive work. The active
repository was scanned with dependencies, generated output, build artefacts,
caches and `tsconfig.tsbuildinfo` excluded. There is no application reader or
writer for any of the eight target models. References that remain in immutable
migrations, the staged migration fixture, RFC/release history, or the bounded
PR6 inspection tooling describe historical truth or verify the cutover; they
are not runtime consumers.

The pre-PR6 schema and immutable migrations establish this reviewed foreign-key
graph:

- `oauthClientResource` points to `oauthClient` and `oauthResource`;
- `oauthAccessToken` points to `oauthClient`, `oauthRefreshToken`, `User`, and
  optionally `Session`;
- `oauthRefreshToken` points to `oauthClient`, `User`, and optionally `Session`;
- `oauthConsent` points to `oauthClient` and `User`;
- `oauthClient` points to `User`.

The target tables have no authority over surviving `User` or `Session` rows.
Their foreign keys point outward; removing the target tables removes those
constraints with the tables and does not delete referenced identity rows.

Migrations `0021_partner_ops_work_bridge_01`,
`0022_better_auth_17_schema_upgrade`, and
`0023_mcp_dcr_runtime_compat_fix` remain byte-for-byte unchanged. They continue
to be replay and historical evidence even though `0041` later removes the
objects they created.

The last PR5 read-only Production projection found 513 connector-storage rows.
For the seven OAuth tables those values remain exact comparison baselines. The
rate-limit table was intentionally TTL/ephemeral: the retired request path
deleted expired buckets during ordinary request processing. Its old value is
therefore a historical reference, not a timeless expected current count:

| Target table | PR6 comparison meaning | PR5 count |
| --- | --- | ---: |
| `oauthClient` | exact current baseline | 11 |
| `oauthResource` | exact current baseline | 5 |
| `oauthClientResource` | exact current baseline | 11 |
| `oauthRefreshToken` | exact current baseline | 230 |
| `oauthAccessToken` | exact current baseline | 240 |
| `oauthConsent` | exact current baseline | 8 |
| `oauthClientAssertion` | exact current baseline | 0 |
| `CommercialMcpRateLimitBucket` | `historicalReferenceCount` only | 8 |

Those historical counts are not permission to assume current Production state.
The exact-head PR review record must contain a fresh projection and its
conflict result before any APPLY authority is considered.

A lower current rate-bucket count can become the exact reviewed baseline only
when two fresh independent projections on the same clean head return the same
count, the count is no greater than eight, and every transport-retirement,
dependency, read-only and canonical-route gate below passes. A changed second
count stops with `RATE_BUCKET_STATE_STILL_MUTATING`; it is never explained away.
No exact deletion timestamp or request attribution is claimed.

## Historical retention decision

Treat the following eight tables as operational connector artefacts scheduled
for deletion, not as durable business or audit records:

1. `OauthClient` / `oauthClient`
2. `OauthResource` / `oauthResource`
3. `OauthClientResource` / `oauthClientResource`
4. `OauthRefreshToken` / `oauthRefreshToken`
5. `OauthAccessToken` / `oauthAccessToken`
6. `OauthConsent` / `oauthConsent`
7. `OauthClientAssertion` / `oauthClientAssertion`
8. `CommercialMcpRateLimitBucket` / `CommercialMcpRateLimitBucket`

Also delete only these compatibility objects:

- triggers `oauthClient_prepare_compat`, `oauthClient_resource_compat`,
  `oauthRefreshToken_resource_compat`, `oauthAccessToken_resource_compat`, and
  `oauthConsent_resource_compat`;
- functions `prepare_better_auth_oauth_client_compat`,
  `sync_better_auth_oauth_client_resource_compat`, and
  `set_better_auth_oauth_resource_compat`.

At the review checkpoint the retention decision remained `PROPOSED` until a
separate Founder instruction authorised Production APPLY. MCP/OAuth application transport was gone, both
custom connections are disconnected, and no active repository runtime consumes
this storage. The rows contain inert access/refresh-token material,
client/client-secret state, consent state, and transport rate-limit state.
Retaining unused authentication material adds unnecessary security and privacy
exposure. Business and audit history remains separately in `AuditLog`, RFCs,
migration history, and release evidence. No raw token, secret, client
identifier, redirect URI, resource identifier, identity row, or metadata JSON
is exported as PR6 evidence.

### Migration

The next verified migration is
`prisma/migrations/0041_commercial_core_legacy_connector_cleanup/migration.sql`.
Its SQL SHA-256 is
`5b31339ea4ab3672e4f4af541344dc7c34d245037b000851d826fb9dcf718a6c`.

It names five trigger drops, three zero-argument function drops, and eight table
drops explicitly. It contains no `CASCADE`, `IF EXISTS`, dynamic SQL, broad
pattern, data rewrite, or unrelated `ALTER`. It removes dependants before
parents and fails if the reviewed shape has drifted.

The repository deliberately contains no Production APPLY command in PR6. A
future executor is a separate review decision and must require an explicit
confirmation phrase, the exact reviewed plan hash, fresh in-transaction
recomputation, a transaction-scoped advisory lock with a Prisma-supported
scalar result, and rollback on any drift. It must not use `CASCADE`.

## KEEP

PR6 protects and verifies:

- `User`, `Session`, `Account`, generic `Verification`, and `AuditLog`;
- `Account.issuer` and the unique `(issuer, accountId)` identity invariant;
- email/password and Google identity schema and compatibility behavior;
- trigger `Account_better_auth_issuer_compat` and function
  `set_better_auth_account_issuer`;
- Admin user resolution and Programme account/session behavior;
- historical `commercial_mcp_*` and tracking `AuditLog` rows;
- migration metadata and immutable migrations 0021–0023;
- `MarketActivation`, exact GEO routing, controlled `/r`, public Commercial
  actions, GB gates, Partner tracking, CRM, Casino/editorial data, direct
  logo/editorial Media, Programme, and Analytics/lifecycle core.

The bounded public Commercial runtime files used by PR5 must remain
byte-for-byte identical to the base. A changed file is a stop condition.

## Historical read-only Production projection

Run the projector twice from the final clean candidate head. The first command
creates one mode-`0600`, create-only, aggregate reference outside the
repository; the second opens a new transaction, independently re-queries
Production and compares the current count with that reference:

```sh
npm run commercial-core:pr6:projection -- \
  --capture-rate-bucket-reference=/private/tmp/commercial-core-pr6-rate-bucket-reference.json
npm run commercial-core:pr6:projection -- \
  --compare-rate-bucket-reference=/private/tmp/commercial-core-pr6-rate-bucket-reference.json
```

The command uses the approved database fingerprint, requires the exact branch
and unchanged `origin/main`, opens a `REPEATABLE READ` transaction, runs
`SET TRANSACTION READ ONLY`, and verifies `transaction_read_only=on`. It does
not test read-only behavior by writing and rolling back.

The first projection is evidence-complete but deliberately returns
`readyToApply=false` while the independent stability check is pending. It may
write the safe local reference only when every pre-stability gate passes. The
second projection returns `readyToApply=true` only when all nine bounded
rate-bucket conditions hold: no active target reader/writer; no MCP/operational-
OAuth transport; both external connectors retired according to the completed
PR5 state; current count no greater than the historical reference; no
unexpected table, trigger or function dependency; no new runtime surface;
PostgreSQL-enforced read-only state; unchanged canonical route baseline; and an
exact count match between the two projections.

It returns aggregate target counts; table/index, foreign-key, trigger,
function, dependant, and KEEP-set catalog facts; the canonical route baseline;
migration scope/checksum evidence; conflicts; `reviewedPlanSha256`;
`readyToApply`; and `productionMutationPerformed: false`. It never selects or
prints target row contents. Unexpected FK, view, materialized-view, function,
procedure, constraint, default, or trigger dependencies make
`readyToApply=false` and the command exit non-zero.

The expected historical route comparison is 81 canonical non-`ZZ` rows, 39
`ACTIVE + HEALTHY`, six legacy `ZZ`, and digest
`4764a59536fef067eed786b82f214ab55f3126d00dd2359b75eba7603f73600c`.
Any unexplained difference is a stop condition.

The reviewed 14 September workstream expectation, which must not be forced, is
`11 / 5 / 11 / 230 / 240 / 8 / 0 / 6` and total `511`. If both fresh
projections observe six rate buckets, record historical reference `8`, reviewed
current baseline `6`, delta `-2` and
`EXPECTED_EPHEMERAL_RETIREMENT_DRIFT`.

## Deterministic reviewed plan

The canonical plan binds the exact candidate HEAD, migration SQL checksum,
approved tables/triggers/functions, safe aggregate row counts, reviewed
dependency graph, KEEP-set verification, route baseline, and sorted conflict
list. It records rate-bucket `8` only as `historicalReferenceCount` and binds
the stable second-projection current count as the exact reviewed deletion
count. Canonical object keys and dependency arrays are stable; the capture
timestamp and other volatile transaction facts are excluded.

There is no tolerance or range in the eventual APPLY gate. A future separately
authorised executor must freshly recompute the entire plan and require the
exact authorised `reviewedPlanSha256`. Thus a bounded `8 → 6` before reviewed-
plan capture can be accepted, while any `6 → anything else` after capture
changes the plan hash and stops APPLY.

Because a commit cannot contain a hash that cryptographically binds that same
commit SHA, the exact `reviewedPlanSha256` is generated from the final clean
head and recorded in the PR body and projection evidence. Any new commit
requires a fresh projection and a new reviewed plan hash.

## Verification

Structural coverage proves exact model-set subtraction, preservation of the
identity/audit models, immutable migration checksums, exact no-`CASCADE`
migration scope/order, absence of active consumers and public-runtime changes,
projector privacy/read-only guards, historical-reference-only rate semantics,
bounded stable-decrease classification, rejection above the historical
reference, second-projection mutation refusal, deterministic current-count
hashing, exact future APPLY comparison with zero tolerance, and unchanged
fail-closed behavior for every other gate.

The established disposable PostgreSQL migration lane replays the full history,
stages the Better Auth fixture through `0040`, proves representative connector
rows and all target objects exist, applies `0041`, and proves the exact eight
tables, five triggers, and three functions are gone. It also proves `User`,
`Session`, `Account`, `Verification`, `AuditLog`, the issuer invariant, account
compatibility guard, credential identity, Google identity, Admin data, and
Commercial data survive. A targeted PostgreSQL test independently verifies the
post-migration catalogs and current credential/Google compatibility behavior.

Exact local and hosted results belong in the PR review record for the final
head; test descriptions here are not a substitute for green evidence.

## Historical rollback boundary

Before any separately authorised Production APPLY, confirm a fresh recoverable
Production database recovery point under the current managed recovery runbook.
If the migration has not committed, abort or roll back the transaction. If it
has committed, application rollback does not restore deleted connector schema
or data; authoritative database restore/recovery is required.

Do not manually recreate historical OAuth clients, tokens, consents, resources,
rate buckets, compatibility triggers, or compatibility functions. Do not make a
secret-bearing manual export for this cutover.

## Historical APPLY gate — satisfied once; do not re-run

At the review checkpoint no Production APPLY was authorised by the PR alone.
Founder Office required the following exact evidence before the one-time
execution:

1. exact PR head;
2. exact `reviewedPlanSha256` from a clean-head fresh projection;
3. exact migration SQL SHA-256;
4. fresh recoverable Production database recovery point;
5. fresh no-drift read-only projection with `readyToApply=true`;
6. green hosted GitHub CI and Vercel checks for that same head;
7. independent confirmation that the delete set is exact and the KEEP set is
   intact.

Before plan capture, any seven-table count drift remains material; only the
bounded, stable rate-bucket decrease above may be reconciled. After plan
capture, any count change — including the exact accepted rate-bucket count —
or any route, object graph, dependency, schema checksum, KEEP-set, base SHA or
head change requires STOP and a new review. Do not repair, recreate, bypass,
broaden the delete set, add tolerance or add `CASCADE`.
