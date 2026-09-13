# Commercial Core PR3 — Exact Routes Release Runbook

**Authority:** RFC-049 and RFC-013
**Risk:** High — commercial routing plus additive database constraints
**State:** Review-only procedure; no Production step has been executed

## Release invariant

Schema, business data and application deployment are three separately
authorised operations. A generic Vercel build may read schema and exact-route
state in a PostgreSQL-enforced read-only transaction. It must never create,
update, disable, repair or materialize a route.

Production state is `UNKNOWN` during PR preparation. Do not infer counts from
repository fixtures or historical documentation.

## 1. Pre-release review

1. Verify the reviewed PR head and all required GitHub/Vercel contexts.
2. Confirm a recoverable database backup/restore point under the Backup and
   Restore runbook.
3. Confirm the exact migration checksum and that migration 0040 is the next
   ordered migration after 0039.
4. Confirm no new evidence or route change invalidates the source-controlled
   six-casino IE/MT materialization manifest.
5. Obtain separate Founder authority for each Production-changing step below.

## 2. Structural schema migration

Apply only migration
`0040_commercial_core_exact_routes_geo_simplification` through the governed
DB-first migration procedure. The migration performs no MarketActivation
insert, update, delete or backfill. Verify:

- the migration is complete with the repository checksum;
- `MarketActivation_active_binding_check` no longer requires a market profile
  or fallback deny list;
- `MarketActivation_exact_canonical_scope_check` exists;
- `MarketActivation_reject_new_zz_trigger` exists; and
- the previous application remains schema-compatible.

Do not deploy the PR3 application yet.

## 3. Read-only materialization plan

Run against the explicitly selected Production database only after the schema
step:

```text
npm run commercial-core:exact-routes -- plan
```

The command runs in a repeatable-read, read-only transaction and emits no raw
destination URL or secret. Archive the bounded report. It must show migration
checksum readiness, before/projected-after route counts, proposed exact routes,
semantic projection, and every conflict/blocker.

Stop when any of these is present:

- `UNPROVEN_ROUTE_MATERIALIZATION`;
- `LEGACY_ZZ_ROUTE_NOT_HEALTHY`;
- `LEGACY_ZZ_ROUTE_BINDING_INCOMPLETE`;
- `BLOCKED_TARGET_IN_MANIFEST`;
- `EXACT_ROUTE_CONFLICT`;
- `NON_CANONICAL_ROUTE_SCOPE`;
- `DUPLICATE_CANONICAL_ROUTE`;
- `EXACT_ROUTE_BINDING_AMBIGUOUS`;
- an unlisted active `ZZ` casino; or
- a proposed market outside the approved IE/MT manifest.

An already exact Production state is a valid zero-operation plan.

## 4. Explicit business-data apply

This is not a migration or deployment command. Execute it only with specific
Founder authority for the reviewed plan:

```text
npm run commercial-core:exact-routes -- apply --confirm=COMMERCIAL-CORE-PR3-EXACT-ROUTES-V1
```

The serializable transaction creates only deterministic manifest exact routes,
preserves the source Offer/Tracking/Redirect/Bonus binding and health evidence,
records intents/events, then disables the corresponding legacy `ZZ` source.
Any conflict aborts the whole transaction. Re-running after success is a
zero-write idempotent result.

## 5. Read-only verification

Run:

```text
npm run commercial-core:exact-routes -- verify
```

Verification must show:

- migration checksum matched;
- no pending create or disable operation;
- zero active legacy `ZZ` routes;
- zero non-canonical active desired scopes;
- zero duplicate canonical routes; and
- zero ambiguous route bindings.

Only a clean report allows application deployment review to proceed.

## 6. Application deployment

Merge and deploy only under separate Founder authority. The Vercel build must
fail before rollout unless migration 0040 and exact-route readiness both pass.
Its verifier is read-only and cannot repair a failed gate. Confirm the Ready
deployment source SHA equals the reviewed merge SHA.

## 7. Post-deploy verification

Using read-only checks, verify representative country routes, US regional
normalization, AR/CA exact subdivision isolation, GB operator safeguards,
missing-route editorial continuity, unhealthy-route suppression and CTA to
`/r/...` parity. Confirm safe destinations, attribution and analytics continue
without OfferCountry, TrackingCountry or `productionEligible` authority.

Record exact route/action counts from live evidence only. Do not expose raw
tracking destinations.

## Rollback and recovery

Application rollback and data recovery are separate decisions:

- The retained compatibility schema permits a verified previous application
  deployment, but rollback must not automatically re-enable disabled `ZZ`
  authority.
- Migration 0040 is additive/constraint-oriented and should be forward-fixed,
  not removed by editing migration history or improvised reverse SQL.
- Materialized exact routes and disabled legacy rows are audited business-data
  mutations. Recover only from the archived before-plan and approved database
  restore/forward operation. Do not silently delete exact rows or revive `ZZ`.
- Unsafe routing, unexplained availability change, failed GB/legal behavior or
  any unapproved mutation is an immediate rollback/incident trigger.

This runbook grants no merge, migration, business-data, deployment or rollback
authority by itself.
