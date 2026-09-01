# Casino Market 0025 Production Build Probe

## Authority and purpose

**FOUNDER_DECISION_REQUIRED:** this runbook documents a future, attended, read-only Vercel Production build probe. It does not authorise invoking it. The implementation PR may be reviewed but must not be merged under the implementation authority that created it.

**DETECTED:** the probe candidate is stacked on exact one-time-operator commit `6db849263bc72e957dd5017bc59c4443dcc06940`. It accepts only migration `0025_casino_market_profile_architecture`, which must remain the final repository migration at SHA-256 `bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99`.

The reviewed PR head cannot be embedded in that same Git commit. At the later decision gate, record the PR's exact 40-character head as `FOUNDER_APPROVED_PROBE_COMMIT`; the actual Vercel-provided `VERCEL_GIT_COMMIT_SHA` and the ephemeral expected value must equal it exactly.

## Safety boundary

The probe is selected only when either probe-specific input is present. A complete probe attempt requires Vercel Production, exposed Vercel system metadata, the exact non-secret acknowledgement, equal actual and Founder-approved full commit SHAs, the frozen final migration, and the existing matched pooled/direct database-readiness contract. Partial or invalid attempts fail before a database client is created where practical. With no probe-specific input, the existing local, Preview, and Production build behavior remains in control.

The database inspection runs in one PostgreSQL transaction after `SET TRANSACTION READ ONLY` and verifies PostgreSQL reports `transaction_read_only=on`. Its executable dependency graph contains the read-only 0025 release inspection and database-readiness helpers, not the mutation-capable one-time operator. It reads only migration metadata, schema metadata, nine aggregate preservation counts, and the absence of pre-0025 eligibility authority.

The probe contains no migration, seed, import, affiliate/commercial mutation, asset publication, or application endpoint. It never emits connection values, hostnames, usernames, passwords, query parameters, or complete database fingerprints.

## Preconditions for a later Founder decision

Before any future invocation:

1. Record a new explicit Founder GO naming the exact reviewed probe PR head.
2. Confirm that head is still based on `6db849263bc72e957dd5017bc59c4443dcc06940`, is green, and contains no later migration.
3. Confirm migration 0025 remains byte-identical at the checksum above.
4. Confirm Vercel system environment variables are already exposed by the existing project configuration. Do not change project configuration for this probe.
5. Use the existing approved linked project/provider path. Do not pull, print, copy, or persist Sensitive database bindings.

## Future attended invocation — do not execute without a new GO

The current Vercel CLI supports ephemeral build values with `--build-env` and a staged Production build without domain assignment with `--prod --skip-domain`. Do not use `--prebuilt`, because the probe requires Vercel build-time system variables and existing Production bindings. See Vercel's official [`deploy` command](https://vercel.com/docs/cli/deploy) and [system environment variable](https://vercel.com/docs/environment-variables/system-environment-variables) documentation.

From a clean checkout of the exact later-approved PR head, the attended command is:

```sh
vercel deploy --prod --skip-domain --logs \
  --build-env CASINO_MARKET_0025_PROBE_AUTHORITY=B4GAMBLE_PRODUCTION_READ_ONLY_PROBE:0025:bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99 \
  --build-env CASINO_MARKET_0025_EXPECTED_PROBE_COMMIT=<FOUNDER_APPROVED_PROBE_COMMIT>
```

Both build values are non-secret and ephemeral. Do not add either to Vercel Project Environment Variables. Do not supply `DATABASE_URL`, `DIRECT_URL`, or any credential on the command line. Do not run `vercel promote` or assign an alias.

## Expected bounded evidence

A successful inspection is exactly:

1. `casino_market_0025_production_build_probe_preflight_verified`, showing Production, the exact deployment commit, frozen migration/checksum, plan `APPLY`, 0023 and 0024 completed with repository checksums matching, 0025 pending, nine aggregate counts, and `eligibilityState: not_present_before_0025`.
2. `casino_market_0025_production_build_probe_go`, showing `mutationPerformed: false`, `deploymentAuthorised: false`, `migrationExecutionAuthorised: false`, and `requiresFounderReview: true`.
3. The exact terminal marker `CASINO_MARKET_0025_PROBE_COMPLETE_STOP` and a failed build.

The two events followed by that marker distinguish a successful probe from an accidental build failure. Missing, reordered, extra, or unbounded output is HOLD. A build that reaches `next build`, becomes `READY`, produces a usable runtime, or receives a domain alias is a probe-design failure and HOLD.

## Post-run read-only verification

Using the deployment reference shown by the attended command or the Vercel dashboard, verify that its state is failed/error rather than `READY`, that it has no Production domain alias, and that the currently served Production deployment is unchanged. `vercel inspect <deployment-reference>` is read-only; the dashboard deployment detail is an equivalent evidence source. Never promote the failed deployment.

Retain only the bounded events, exact intentional-stop marker, exact commit, failure state, and no-alias evidence. Do not retain raw environment output or credentials. The evidence permits only a new Founder GO/HOLD decision; it does not authorise migration 0025, merge, or deployment.

## Stop conditions

Stop on any authority, commit, repository checksum/finality, Vercel metadata, database readiness/identity, migration-history/checksum, pending-suffix, partial-schema, legacy-index, read-only-transaction, bounded-output, intentional-stop, deployment-state, or alias discrepancy. Do not repair, retry with weaker controls, expose bindings, execute migration 0025, or promote any deployment.
