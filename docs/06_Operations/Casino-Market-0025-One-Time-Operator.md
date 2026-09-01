# Casino Market 0025 One-Time Operator

Status: **PROPOSED / NOT AUTHORISED / NOT EXECUTED**. This runbook prepares one reviewable mechanism. It does not authorise Production access, schema mutation, application deployment, PR merge, factual import, asset publication, or commercial activation.

## Chosen mechanism

**PROPOSED:** a repository-native local/operator CLI is the smallest available controlled path. An authorised Founder Office configuration owner supplies the existing Production-scoped `DATABASE_URL` and `DIRECT_URL` to one repository maintainer process in memory. The command verifies the existing pooled/direct readiness contract and same redacted database identity before opening Prisma.

The alternatives were rejected for this release:

- Generic GitHub Actions has no approved Production database credentials, and adding them would enlarge the trust boundary.
- The historical temporary Vercel build runner is technically proven but couples schema mutation to an application deployment. It is not needed for an explicitly attended database-only command.
- Manual SQL, `prisma db execute`, `db push`, a seed, an import, and an arbitrary migration selector are outside this mechanism.

The Production CLI cannot select a URL, migration name, SQL file, seed, import, affiliate action, asset action, or application deployment. Its only optional mutation switch is `--execute-production-0025`; without it, the command is read-only.

## Exact authority

### Who executes

Two people participate after a separate Founder GO:

1. The **Founder Office configuration owner** verifies the current Production Prisma Postgres resource in the provider control plane and exposes its existing matched pooled/runtime and direct/migration bindings only to the attended process. They do not copy either value into GitHub, a document, chat, a shell command, or a committed file.
2. The **repository maintainer acting as migration operator** checks out the exact operator PR commit named verbatim in that later Founder GO and runs the commands below. The operator must be able to stop immediately and retain only the bounded JSON events.

One person may hold both roles only if they possess both existing authorities. No CI service account or ordinary application user is an operator.

### What commit

The checkout must be the full 40-character operator PR head named in the separate Founder GO. That commit is necessarily created after this document, so it cannot self-embed its own hash. The command requires the literal approved hash as `--expected-release-commit`, compares it with `git rev-parse HEAD`, requires a clean checkout, and proves ancestry from exact PR #113 head `830d3398fe68a34d0f8f92138d01c3e4b8774d95`.

Do not use `HEAD`, a branch name, command substitution, or a shortened SHA in the command. Do not run from PR #113 itself: it does not contain this operator.

The only migration permitted is `0025_casino_market_profile_architecture`, which must be the final repository migration and remain byte-identical at SHA-256 `bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99`.

## Before any Production connection

All of these are mandatory:

- A later Founder decision says `GO` for the exact operator PR commit and exact mechanism. Approval of PR #113 alone is insufficient.
- The operator checkout is clean and no migration later than 0025 exists.
- The configuration owner confirms the bindings are current Production bindings for the current B4GAMBLE Production resource. Preview, an unknown target, a restored target, or a fingerprint mismatch is a STOP.
- A current provider-native restorable Production backup or recovery point is confirmed without restoring it.
- No casino import, commercial action, asset publication, #111 runtime promotion, or application deployment is combined with this window.
- The pre-#111 application remains the rollback runtime.

Do not print, inspect, persist, or redirect environment values. Keep shell tracing off. Do not use `--debug`.

## Dry run

With the two database bindings already present only in the attended process, replace `<FOUNDER_APPROVED_OPERATOR_COMMIT>` with the literal approved 40-character SHA:

```sh
VERCEL_ENV=production \
CASINO_MARKET_0025_RELEASE_AUTHORITY='B4GAMBLE_PRODUCTION:0025_casino_market_profile_architecture:bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99' \
npm run casino-market-0025:operator -- --expected-release-commit <FOUNDER_APPROVED_OPERATOR_COMMIT>
```

This command must not contain `--execute-production-0025`. It performs no mutation.

### Dry-run GO output

The only GO state is one `casino_market_0025_preflight_verified` event followed by one `casino_market_0025_dry_run_go` event, both naming the exact approved release commit. The preflight event must show:

- environment `production`, plan `APPLY`, exact migration and SHA-256;
- 0023 and 0024 `completed` with `checksumMatchesRepository: true`;
- 0025 `pending`;
- each accepted historical rolled-back attempt named only by migration, with `supersededByCompletedAttempt: true` and `effectiveChecksumMatchesRepository: true`;
- the nine bounded preservation counts; and
- `eligibilityState: not_present_before_0025`.

The dry-run event must show `mutationPerformed: false` and `futureExecutionRequiresSeparateFounderApproval: true`. Any other output is HOLD. A clean dry run is evidence for review; it does not authorise the execution command.

## Future execution — prohibited until a later separate Founder GO

After the Founder reviews the dry-run evidence and explicitly approves execution for the same full commit, run exactly:

```sh
VERCEL_ENV=production \
CASINO_MARKET_0025_RELEASE_AUTHORITY='B4GAMBLE_PRODUCTION:0025_casino_market_profile_architecture:bcf32c072c9451fca3e5eccd315db6106a5dca68bd97bb3607c1bc84c35d2d99' \
npm run casino-market-0025:operator -- --expected-release-commit <FOUNDER_APPROVED_OPERATOR_COMMIT> --execute-production-0025
```

The command re-runs all preflight checks. It then invokes only:

```sh
prisma migrate deploy --schema prisma/schema.prisma
```

The mechanism captures and suppresses Prisma stdout/stderr. It never emits credentials.

### Success output

Success requires a final `casino_market_0025_execution_succeeded` event showing:

- the exact commit, migration, and approved SHA-256;
- `mutationPerformed: true`;
- 0023, 0024, and 0025 completed with repository checksums matching;
- identical before/after values for Casino, CasinoCountry, CasinoLicense, CasinoPaymentMethod, CasinoGameProvider, CasinoGameCategory, CasinoBonus, MediaAsset, and AffiliateTrackingLinkCountry;
- zero CasinoCountryEvidence and CasinoCountryLicense rows;
- zero non-null `casinoCountryId` values across existing payment, provider, category, bonus, and media records; and
- every pre-existing AffiliateTrackingLinkCountry row false, with zero eligible routes.

The postflight also verifies the exact 0025 columns, enum labels, constraints, indexes, MediaAsset ownership check, `productionEligible` default false, no unresolved migration, no pending repository migration, and no replay. Retain only these bounded JSON events, timestamp, exact commit, deployment-independent operator identity, and the provider backup/recovery-point reference.

## Immediate STOP conditions

Stop without repair or retry if any condition occurs:

- Founder approval is missing, ambiguous, or names another commit;
- checkout is dirty, commit/ancestry differs, checksum differs, or any 0026/later migration is present;
- environment is Preview/non-Production, either binding is missing/invalid, or pooled/direct identities differ;
- the effective 0023 or 0024 attempt is missing, rolled back, unresolved, ambiguous, or checksum-invalid;
- any migration has an unresolved attempt, an unsuperseded rolled-back attempt, ambiguous effective history, a checksum-invalid superseding completion, or a name absent from the repository;
- any attempted 0025 row exists while 0025 is expected pending;
- 0025 is not the only pending migration;
- partial 0025 schema objects exist or the legacy uniqueness baseline is missing;
- dry-run output is incomplete or reports anything other than the GO state above;
- a preservation count changes, a required object is absent, new evidence/licence/scoped facts appear, or any route becomes eligible; or
- any request is made to combine this with application deployment, imports, seeds, affiliate activation, asset publication, or manual schema editing.

A historical rolled-back attempt is read-only evidence, not a repair target. It is accepted only when a later completed attempt for the same repository migration is the unambiguous effective state and has the repository checksum. The operator never resolves, deletes, or edits migration-history rows.

An `casino_market_0025_operator_refused` event is always STOP. `mutationStatus: not_confirmed` means the operator must determine state through a separately reviewed read-only investigation; it does not assert rollback by itself.

## Failure and rollback

If execution fails before Prisma records 0025 complete:

1. Stop. Do not retry, run `migrate resolve`, drop objects, edit `_prisma_migrations`, or apply SQL manually.
2. Keep the current pre-#111 application serving and perform no #111/#112/#114 promotion.
3. Preserve the bounded refusal event and provider logs without copying credentials or row content.
4. Verify backup availability and obtain a separate recovery decision. Disposable PostgreSQL proves a deliberate SQL failure rolls back the 0025 DDL atomically and leaves an unresolved Prisma row; Production state must still be confirmed read-only before any resolution plan.

There is no reverse migration in this mechanism.

If 0025 succeeds but a later application deployment fails, roll the application back to the previous known-good pre-#111 deployment and leave the additive 0025 schema in place. Do not restore the database merely to remove 0025. Diagnose and forward-fix under a separate decision.

After verified success, repeating the command is verification-only and emits `casino_market_0025_already_applied_verified` with `mutationPerformed: false`. It does not replay the migration.

## Disposal

This is intentionally one-time release machinery, not a permanent migration service. It must not be merged or executed automatically. After independent Production evidence and Founder acceptance, remove the operator CLI, disposable harnesses, and execution-specific tests in a separately reviewed cleanup while retaining the durable migration evidence and steady-state read-only guard. No cleanup is authorised by this document.
