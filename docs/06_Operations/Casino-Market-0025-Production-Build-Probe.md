# Casino Market 0025 Production Build Probe

## Authority and purpose

**DETECTED:** this runbook covers two mutually exclusive, attended Vercel Production build modes: the read-only probe and the dormant migration executor. Neither is an automatic build path. The current Founder authority permits the one read-only retry after exact-head validation; it does not authorise migration execution or merge.

**DETECTED:** the probe candidate is stacked on corrected direct-administration operator commit `b1cb2cfe5668e8b930d410a9fd013cb08db35846`. It accepts only migration `0025_casino_market_profile_architecture`, which must remain the final repository migration at SHA-256 `bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99`.

The reviewed PR head cannot be embedded in that same Git commit. At the later decision gate, record the PR's exact 40-character head as `FOUNDER_APPROVED_PROBE_COMMIT`. The attended local launcher must verify that exact commit directly against `git rev-parse HEAD`, verify a completely clean checkout, and upload that source immediately with a matching non-secret build attestation.

**DETECTED:** the first authorised Vercel CLI attempt proved that `VERCEL_GIT_COMMIT_SHA` is absent on this source-upload path. It is not probe authority and the probe does not set, spoof, require, or inspect it.

**DETECTED:** a later authorised probe attempt ran from an unlinked worktree without an exact project target. Vercel created unrelated project `prj_tMG9xkmvmlqK1bq9Ajp723Qm8SJ2`; its build had no approved database bindings and stopped before a database connection. That project is not a release target and is not modified or deleted by this workstream.

The only authorised target is existing B4GAMBLE project `sevenbet-next`, team `team_WhkUGuXZeIMlU1uFHtowNUqa`, project `prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb`. Both launchers use the same repository constant, force `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` into the child process environment in memory, and pass exact `--project prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb`. They do not invoke `vercel link`, write `.vercel/project.json`, or permit project/team input.

## Safety boundary

The probe is selected when any probe-specific build input is present. The dormant executor is selected when any executor-specific build input is present. Inputs from both modes together fail closed. A complete attempt requires Vercel Production, exposed Vercel system metadata, exact `VERCEL_PROJECT_ID=prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb`, the mode's exact non-secret authority, equal launcher-attested source and Founder-approved full commit SHAs, the frozen final migration, and the existing matched pooled/direct database-readiness contract. Missing or different project identity emits bounded `VERCEL_PROJECT_ID_REFUSED` before either database binding is inspected or a Prisma client is created. Partial or invalid attempts otherwise fail before a database client is created where practical. With no mode-specific input, the existing local, Preview, and Production build behavior remains in control.

Before Vercel is called, the launcher accepts only `--expected-probe-commit <40-character lowercase SHA>`. It verifies that the local `HEAD` exactly equals that value, the working tree is empty under `git status --porcelain=v1 --untracked-files=all`, migration 0025 is final and byte-identical at the approved checksum, and all reviewed probe execution files are present. Any mismatch stops before deployment. Arbitrary Vercel arguments are not accepted.

After pooled/direct identity verification, every administrative inspection connects through `DIRECT_URL`; normal application Prisma continues to use pooled `DATABASE_URL`. The inspection runs in one PostgreSQL `REPEATABLE READ` transaction after `SET TRANSACTION READ ONLY`. It verifies `transaction_read_only=on` and applies transaction-local `statement_timeout=20s`, `lock_timeout=5s`, and `idle_in_transaction_session_timeout=60s`. Its executable dependency graph contains the read-only 0025 release inspection and database-readiness helpers, not the mutation-capable one-time operator or dormant executor. It reads migration metadata, schema metadata, nine aggregate preservation counts, and the absence of pre-0025 eligibility authority once in a coherent snapshot.

Safe stage events identify `transaction_safety`, `migration_history`, `effective_history`, `preservation_counts`, `partial_schema`, `legacy_indexes`, and `post_read_verification`. A read failure reports only the stage, bounded error class/code, elapsed time, whether a connection occurred, and `mutationPerformed: false`; it does not emit SQL, bindings, identity details, or row data.

The probe contains no migration, seed, import, affiliate/commercial mutation, asset publication, or application endpoint. It never emits connection values, hostnames, usernames, passwords, query parameters, or complete database fingerprints.

## Preconditions for a later Founder decision

Before any future invocation:

1. Record a new explicit Founder GO naming the exact reviewed probe PR head.
2. Confirm that head is still based on `b1cb2cfe5668e8b930d410a9fd013cb08db35846`, is green, and contains no later migration.
3. Confirm migration 0025 remains byte-identical at the checksum above.
4. Confirm Vercel system environment variables are already exposed by the existing project configuration. Do not change project configuration for this probe.
5. Use only the launcher's fixed existing project target. Do not run `vercel link`, depend on local project metadata, or pull, print, copy, or persist sensitive database bindings.

## Future attended invocation — do not execute without a new GO

The current Vercel CLI supports ephemeral build values with `--build-env` and a staged Production build without domain assignment with `--prod --skip-domain`. Do not use `--prebuilt`, because the probe requires Vercel build-time system variables and existing Production bindings. See Vercel's official [`deploy` command](https://vercel.com/docs/cli/deploy) and [system environment variable](https://vercel.com/docs/environment-variables/system-environment-variables) documentation.

From a clean checkout of the exact later-approved PR head, the only attended command is:

```sh
npm run casino-market-0025:production-probe -- \
  --expected-probe-commit <FOUNDER_APPROVED_PROBE_COMMIT>
```

The launcher invokes exactly `vercel deploy --project prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb --prod --skip-domain --logs` under in-memory `VERCEL_ORG_ID=team_WhkUGuXZeIMlU1uFHtowNUqa` and `VERCEL_PROJECT_ID=prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb`, with the fixed probe authority and these two non-secret, ephemeral attestations:

- `CASINO_MARKET_0025_PROBE_SOURCE_COMMIT=<locally verified HEAD>`
- `CASINO_MARKET_0025_EXPECTED_PROBE_COMMIT=<FOUNDER_APPROVED_PROBE_COMMIT>`

It supplies no arbitrary extra Vercel arguments. Do not invoke Vercel manually, run `vercel link`, add these values to Vercel Project Environment Variables, supply `DATABASE_URL`, `DIRECT_URL`, or any credential on the command line, use `--prebuilt` or `--yes`, promote, or assign an alias.

## Expected bounded evidence

A successful inspection emits:

1. the seven bounded stage events above;
2. `casino_market_0025_production_build_probe_preflight_verified`, showing Production, exact deployment commit, direct administrative mode, matched pooled/direct identity, frozen migration/checksum, plan `APPLY`, 0023 and 0024 effectively completed with repository checksums matching, 0025 pending with no attempt rows, bounded safely-superseded historical rollback entries, nine aggregate counts, `eligibilityState: not_present_before_0025`, and the verified transaction-safety settings;
3. `casino_market_0025_production_build_probe_go`, showing `mutationPerformed: false`, `deploymentAuthorised: false`, `migrationExecutionAuthorised: false`, and `requiresFounderReview: true`;
4. the exact terminal marker `CASINO_MARKET_0025_PROBE_COMPLETE_STOP` and a failed build.

These events followed by that marker distinguish a successful probe from an accidental build failure. Missing, reordered, extra, or unbounded output is HOLD. A build that reaches `next build`, becomes `READY`, produces a usable runtime, or receives a domain alias is a probe-design failure and HOLD.

## Dormant Production migration executor — implemented, not executed

**DETECTED / NOT EXECUTED:** the separate executor is available only through this attended local launcher:

```sh
npm run casino-market-0025:production-migrate -- \
  --expected-release-commit <EXACT_FOUNDER_APPROVED_RELEASE_COMMIT> \
  --execute-production-0025
```

Do not run it without a new explicit Founder GO naming the exact release commit. The launcher checks exact full `HEAD`, an entirely clean worktree including untracked files, expected execution files, migration 0025 finality, and its frozen checksum. It accepts no arbitrary Vercel arguments, forces the same in-memory team/project target as the probe, and supplies the exact authority, source attestation, expected commit, and execution flag only as ephemeral `--build-env` values to `vercel deploy --project prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb --prod --skip-domain --logs`.

Inside the temporary build, all four inputs are mandatory. Probe authority cannot select or satisfy execution authority. Preview, local, malformed, partial, mixed-mode, checksum-invalid, later-migration, database-identity, history, pending-state, or partial-schema mismatches stop before migration. No Vercel project variable, Git/PR/CI workflow, normal Production build, or Preview is configured to invoke this mode.

Only after the direct read-only preflight verifies exact pending 0025 may the executor close its client and invoke fixed `npx prisma migrate deploy --schema prisma/schema.prisma`, with both child connection variables set in memory to the already verified direct binding. There is no arbitrary migration, SQL, seed, import, db-push, asset, commercial, alias, or promotion input. Direct postflight must verify completed checksum-valid 0025, no pending or unresolved history, full schema invariants, unchanged preservation counts, empty new evidence/licence authority, unscoped legacy records, and zero eligible routes. Success emits `casino_market_0025_execution_succeeded`, then `CASINO_MARKET_0025_MIGRATION_COMPLETE_STOP` intentionally fails the build so no temporary runtime is promoted.

If Prisma migration fails, there is no retry, resolve, migration-history edit, manual SQL, or schema rollback. If postflight fails after migration, report bounded evidence and retain the old runtime; never auto-rollback the additive schema.

## Post-run read-only verification

Using the deployment reference shown by the attended command or the Vercel dashboard, verify first that its project is exactly `sevenbet-next` / `prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb`, then verify that its state is failed/error rather than `READY`, that it has no Production domain alias, and that the currently served Production deployment is unchanged. `vercel inspect <deployment-reference>` is read-only; the dashboard deployment detail is an equivalent evidence source. Never promote the failed deployment.

Retain only the bounded events, exact intentional-stop marker, exact commit, failure state, and no-alias evidence. Do not retain raw environment output or credentials. The evidence permits only a new Founder GO/HOLD decision; it does not authorise migration 0025, merge, or deployment.

## Stop conditions

Stop on any local source authority, checkout cleanliness, expected-file, build attestation, repository checksum/finality, Vercel metadata, database readiness/identity, unknown, unresolved, unsuperseded, ambiguous, or checksum-invalid effective migration history, any 0025 attempt row, pending-suffix, partial-schema, legacy-index, read-only-transaction, bounded-output, intentional-stop, deployment-state, or alias discrepancy. Historical rolled-back attempts are acceptable only when the shared release planner proves that a later same-name completed attempt is effective and checksum-valid. Do not mutate or resolve migration history, repair, retry with weaker controls, expose bindings, execute migration 0025, or promote any deployment.
