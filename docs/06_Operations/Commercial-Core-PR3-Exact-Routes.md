# Commercial Core PR3 — Exact Routes Release Runbook

**Authority:** RFC-049 and RFC-013

**Risk:** High — commercial routing plus additive database constraints

**State:** Review-only procedure; no Production step has been executed

## Release invariant

Schema, business data and application deployment are three separately
authorised operations. Migration 0040 must remain compatible with the
currently deployed pre-PR3 binary. Materialization may proceed only when the
read-only plan proves that the old binary will still route every preserved
target during the interval before the PR3 deployment.

A generic Vercel build may read schema and exact-route state in a
PostgreSQL-enforced read-only transaction. It must never create, update,
disable, repair or materialize a route. Production state is `UNKNOWN` during
PR preparation; do not infer counts from fixtures or historical documentation.

## Authoritative bounded order

1. Backup / baseline.
2. Apply migration 0040.
3. Verify the old Production application is still healthy.
4. Run the exact-route `plan`.
5. Require `plan.cutoverSafe = true`.
6. Founder authorizes that exact reviewed plan.
7. Run `apply` if the plan requires materialization.
8. Immediately verify that the old Production application still serves every
   preserved CTA and controlled redirect.
9. Run the new exact-route `verify`.
10. Merge PR3.
11. Allow the canonical Production deployment.
12. Run the post-deploy smoke.

Do not combine or reorder the schema, business-data and application steps.

## 1. Backup / baseline

1. Verify the reviewed PR head and all required GitHub/Vercel contexts.
2. Confirm a recoverable database backup/restore point under the Backup and
   Restore runbook.
3. Record old-binary representative IE/MT CTA and `/r/...` behavior without
   exposing raw tracking destinations.
4. Confirm migration 0040 is next after 0039 and record its reviewed checksum.
5. Confirm no new evidence broadens or invalidates the source-controlled
   six-casino IE/MT manifest.

## 2. Apply structural migration 0040

Apply only
`0040_commercial_core_exact_routes_geo_simplification` through the governed
DB-first procedure. It performs no `MarketActivation` insert, update, delete,
materialization or business-data backfill. Verify:

- the migration completed with the reviewed repository checksum;
- `MarketActivation_active_binding_check` no longer requires a market profile
  or fallback deny list;
- the row-wide `MarketActivation_exact_canonical_scope_check` is absent;
- `MarketActivation_guard_new_scope_trigger` is enabled;
- a new `ZZ` row and a non-`ZZ` to `ZZ` scope change are rejected;
- new/change-to-active non-canonical scope is rejected; and
- the previous application can still perform its normal health/status update
  on an unchanged pre-existing legacy `ZZ` row.

Do not deploy PR3 yet.

## 3. Verify old Production application health

While the old binary is still canonical, repeat the representative baseline
checks. Confirm preserved CTA and controlled redirects still resolve and route
health processing remains operational after 0040. Stop on any regression.

## 4–5. Read-only materialization plan and cutover-safe gate

Run against the explicitly selected Production database:

```text
npm run commercial-core:exact-routes -- plan
```

The command runs in a repeatable-read, read-only transaction and emits no raw
destination URL or secret. Archive the bounded report. It must show migration
checksum readiness, before/projected-after route counts, proposed exact routes,
semantic projection, every blocker and `cutoverSafe`.

Require `cutoverSafe: true`. `PREVIOUS_RUNTIME_CUTOVER_UNSAFE` identifies the
casino, target market, source route ID and one of these missing/incompatible
old-runtime prerequisites:

- `MARKET_PROFILE_BINDING`;
- `OFFER_BINDING`;
- `OFFER_MARKET_ALLOW`;
- `TRACKING_BINDING`;
- `TRACKING_MARKET_ALLOW`;
- `REDIRECT_BINDING`;
- `BONUS_BINDING`; or
- `DESTINATION_SAFETY`.

The plan does not create or repair `CasinoCountry`, `AffiliateOfferCountry`,
`AffiliateTrackingLinkCountry`, `productionEligible` or lifecycle state.
Missing compatibility means `PLAN → BLOCK`.

Also stop for any existing materialization/readiness blocker, including
`UNPROVEN_ROUTE_MATERIALIZATION`, `LEGACY_ZZ_ROUTE_NOT_HEALTHY`,
`LEGACY_ZZ_ROUTE_BINDING_INCOMPLETE`, `BLOCKED_TARGET_IN_MANIFEST`,
`EXACT_ROUTE_CONFLICT`, `NON_CANONICAL_ROUTE_SCOPE`,
`DUPLICATE_CANONICAL_ROUTE`, `EXACT_ROUTE_BINDING_AMBIGUOUS`, an unlisted
active `ZZ` casino, or a target outside the approved IE/MT manifest. An already
exact Production state may produce a valid zero-operation plan.

## 6–7. Founder authorization and explicit apply

The Founder authorizes the archived exact plan, not an open-ended operation.
If it contains changes, execute:

```text
npm run commercial-core:exact-routes -- apply --confirm=COMMERCIAL-CORE-PR3-EXACT-ROUTES-V1
```

The serializable transaction creates only deterministic manifest exact routes,
preserves the source Offer/Tracking/Redirect/Bonus binding and health evidence,
records intents/events, then disables the corresponding legacy `ZZ` source.
It does not create or modify legacy GEO compatibility rows. Any conflict aborts
the transaction; replay after success is a zero-write idempotent result.

## 8. POST-MATERIALIZATION / PRE-DEPLOY OLD-BINARY COMPATIBILITY

Immediately, while the old Production binary is still canonical, verify every
preserved IE/MT CTA and controlled `/r/...` redirect from the approved plan.
Compare with the recorded baseline and confirm destination safety and route
health without recording raw tracking URLs.

If the old Production application loses any preserved CTA or controlled
redirect: **STOP. Do not merge or deploy while the system is in that state.**
Open the incident/rollback decision path under the archived before-plan.

## 9. New exact-route verification

Run:

```text
npm run commercial-core:exact-routes -- verify
```

Verification must show the migration checksum matched, `cutoverSafe: true`, no
pending create/disable operation, zero active legacy `ZZ`, zero non-canonical
active desired scopes, zero duplicate canonical routes and zero ambiguous
bindings. Only a clean report permits merge review.

## 10–11. Merge and canonical Production deployment

Merge only under explicit authority after the old-binary compatibility gate
and exact verification pass. The generic Vercel build must fail before rollout
unless migration 0040 and exact-route readiness pass. Its verifier is read-only
and cannot repair state. Confirm the Ready deployment source SHA equals the
reviewed merge SHA.

## 12. Post-deploy smoke

Using read-only checks, verify representative country routes, US regional
normalization, AR/CA exact-subdivision isolation, GB operator safeguards,
missing-route editorial continuity, unhealthy-route suppression and CTA to
`/r/...` parity. Confirm safe destinations, attribution and analytics continue
without OfferCountry, TrackingCountry or `productionEligible` authority.
Record live counts only; do not expose raw tracking destinations.

## Rollback and recovery

Application rollback and data recovery are separate decisions:

- Migration 0040 permits unchanged legacy-row maintenance by the previous
  binary, but forbids new fallback authority. A previous binary can route the
  materialized exact rows only when the archived plan proved its existing
  prerequisites and the step-8 live gate passed.
- Application rollback must not automatically re-enable disabled `ZZ`
  authority or manufacture compatibility rows.
- Migration 0040 is forward-fix only after it is applied in Production. Do not
  edit applied migration history or improvise reverse SQL.
- Materialized exact routes and disabled legacy rows are audited business-data
  mutations. Recover only through the archived before-plan and an authorised
  restore/forward operation.
- Unsafe routing, unexplained availability change, failed GB/legal behavior or
  any unapproved mutation is an immediate stop/incident trigger.

This runbook grants no merge, migration, business-data, deployment or rollback
authority by itself.
