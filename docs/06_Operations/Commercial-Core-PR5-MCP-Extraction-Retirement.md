# Commercial Core PR5 — MCP Extraction and Retirement

**Status:** complete and live
**Authority:** RFC-051 and the current 14 September 2026 Founder instruction
**Production baseline:** merge/main
`313b18bfff5db98d7e66b16088ec3ed8537fc299`; deployment
`dpl_Ethqm2TdoiCDvKoEF5rVZUdiR8o7`
**Boundary:** PR5 performed no Production schema/data mutation and did not
authorise PR6 cleanup

## Outcome

PR5 removes the repository-hosted MCP and operational OAuth transport while
retaining neutral Commercial CRM research, canonical Partner tracking,
MarketActivation/public action, audit, and direct logo/editorial media
capabilities. It adds no replacement public transport.

`B4GAMBLE Commercial Operations2` and `B4GAMBLE Media GEO3` were external custom
connections not managed by repository code. Founder Office subsequently
removed both registrations. They must not be recreated or reconnected.

## PR summary

Before PR5, the external custom connection reached repository-hosted discovery,
OAuth/DCR and MCP tool routes. Those routes coupled transport concerns to the
Commercial CRM research service and could also reach tracking registration.
Media exposed a second set of retired MCP/DCR stubs.

After PR5, no MCP or operational OAuth surface remains in the application.
CRM research survives as a neutral internal service; tracking registration
survives as a separate process-local Founder-authority capability with no new
caller; MarketActivation, `/r`, public actions, GB gates and direct logo media
remain independent and unchanged.

| Surface | Classification | PR5 disposition |
| --- | --- | --- |
| MCP, discovery, operational OAuth and connector Admin routes | transport/security | deleted |
| connector consent/login presentation styles | transport/dead | deleted |
| MCP servers, providers, wrappers, rate limiter and root dependencies | transport/security/observability | deleted |
| old browser/protocol/auth harnesses and dated release writers | transport/dead | deleted |
| opportunity research contract, service and repository behavior | canonical CRM | moved and neutralized |
| neutral provenance/idempotency/authority regression coverage | security/audit | retained as core tests |
| Partner tracking registration and Founder write capability | canonical commercial core | retained, internal only |
| MarketActivation, public action resolver, `/r` and GB gates | canonical public runtime | retained unchanged |
| direct logo/editorial media runtime | canonical media | retained unchanged |
| legacy Media plan/batch source compatibility | data/history | exact persisted-read decoder; no migration |
| generic Better Auth and Google identity OAuth | generic authentication | retained unchanged |
| tracking audit, route health and general DB reliability | security/audit/observability | retained neutrally |
| OAuth/rate-limit rows, models, migrations and audit history | data/history | retained inertly for PR6 |
| isolated Agent SDK and Refero design-tool MCP guidance | developer tooling | retained outside app runtime |

## Evidence classification

| Claim | Classification | Evidence |
| --- | --- | --- |
| branch starts from `d0d3cccb62f5e3ba15f6fabc049260a03ac1c570` | `DETECTED` | live fetched `origin/main` |
| app MCP/OAuth routes and libraries are removed | `DETECTED` | scan and retirement test |
| CRM research core is transport-neutral | `DETECTED` | source and tests |
| tracking core is CRM/OAuth independent | `DETECTED` | source graph and authority tests |
| public runtime files differ from main | `DETECTED: NO` | projector comparison |
| schema migration exists in PR5 | `DETECTED: NO` | migration diff and test |
| named Commercial connection was external during PR5 review | `DETECTED — HISTORICAL` | Founder instruction/external inspection |
| `B4GAMBLE Media GEO3` was externally connected during PR5 review | `DETECTED — HISTORICAL` | Founder Office external inspection |
| Production Media MCP endpoint returns `410 MEDIA_OPERATIONS_RETIRED` | `DETECTED` | read-only external tool result |
| both external connector registrations removed | `COMPLETED` | current explicit Founder instruction |
| legacy Media history exists | `DETECTED` | aggregate-only Production projection |
| current named-connector request usage | `UNKNOWN` | no attributable request telemetry |

## Repository scan

The scan confirmed the active Git worktree belongs to
`AlexG-7BE/sevenbet-next`. The full active repository was scanned with
dependencies, generated output, build artifacts, caches, reports and
`tsconfig.tsbuildinfo` excluded; the Git index separately identified the base
and PR5 changes.

At the PR5 head, historical MCP references remained only where truth required
them: immutable migrations/fixtures, release records, RFC history, inert schema
model names, the PR5 projector/retirement assertions, migration baseline names,
transitive Agent SDK lock data, and unrelated Refero developer-tool guidance.
PR6 removes the inert models and obsolete PR5 projector from active tooling but
preserves the immutable history. Neither Agent/Refero remnant enters the
application runtime or exposes a B4GAMBLE connection.

## Read-only Production projection

The PR5 candidate used `npm run commercial-core:pr5:projection`. It refused an
unexpected database fingerprint, entered a repeatable-read transaction, set it
read-only and verified the database reported read-only state. It emitted only
counts, bounded timestamps and hashes. PR6 removes that historical projector
from active package tooling because its generated Prisma delegates no longer
exist; the evidence below remains the immutable PR5 review record.

Evidence refreshed on 14 September 2026 UTC; the exact capture timestamp and
head are retained in the PR review record:

| Measure | Result |
| --- | ---: |
| canonical non-`ZZ` MarketActivation rows | 81 |
| `ACTIVE + HEALTHY` canonical routes | 39 |
| historical `ZZ` rows | 6 |
| current PartnerCasinoRelationship rows | 0 |
| total PartnerCasinoRelationship rows | 0 |
| active logo MediaAssets | 17 |
| Commercial opportunities | 62 |
| canonical route-state SHA-256 | `4764a59536fef067eed786b82f214ab55f3126d00dd2359b75eba7603f73600c` |
| public-runtime files changed from main | 0 |
| migration files changed | 0 |
| Production writes | 0 |

The same transaction used a database aggregate over Media ingestion
`SiteSetting` keys only. No raw JSON, destination or identifier was returned.
It counted 175 plans and 56 batches.

| Media history measure | Result |
| --- | ---: |
| total plans | 175 |
| total batches | 56 |
| plan root `ADMIN` / `AUTOMATION` / `SYSTEM` / legacy / unexpected | 2 / 0 / 16 / 157 / 0 |
| batch root `ADMIN` / `AUTOMATION` / `SYSTEM` / legacy / unexpected | 0 / 0 / 4 / 52 / 0 |
| plans containing legacy source anywhere relevant | 157 |
| batches containing legacy source anywhere relevant | 52 |
| records containing `AUTOMATION` anywhere relevant | 0 |
| records containing unexpected/missing source anywhere relevant | 0 |

## Legacy Media persistence compatibility

Current plan, operation and batch write schemas accept only `ADMIN`,
`AUTOMATION` and `SYSTEM`; they reject the retired source. A single bounded
persisted-history decoder maps only exact `CHATGPT_WORK` to `AUTOMATION` at the
plan root, nested plan operations and batch root, then runs the current strict
schema. Unknown values fail closed. `getPlan`, `listRecent`, `getBatch`,
`listRecentBatches`, apply and rollback read through that seam. Regression
coverage confirms normalisation, strict new writes, unknown rejection and that
all existing apply/rollback ownership, draft, media-retirement and commercial-
route constraints remain in force.

There is no data migration or background rewrite. This PR and its Production
projection perform zero Production writes.

## CRM research idempotency audit

**DETECTED:** old MCP-created rows use `mcp:<clientHash>:<key>` while the
neutral service uses `research:<sourceHash>:<key>`. If an old bundle were
deliberately replayed through the neutral service, the changed namespace could
create duplicate child records for the resolved opportunity.

**DETECTED:** the active repository has no application caller for neutral
research-bundle upsert; only its service/repository definition and tests exist.
PR5 removes the old transport and adds no replay adapter. No current
Production/internal caller reuses the legacy keys. The hypothetical legacy
replay is therefore intentionally unsupported, and no compatibility behavior
is added without a real separately authorised caller path.

The zero Partner relationship count is detected Production data, not a PR5
deletion. PR5 neither writes nor projects relationship rows.

## Usage evidence

Production storage contains 11 historical connector clients, five resources,
11 client-resource rows, 230 refresh-token rows, 240 access-token rows, eight
consents, zero client assertions and eight rate-limit buckets. No raw token,
client identifier, personal data or tracking URL was read or emitted.

The latest old Commercial research audit is 11 September 2026 and the latest
rate-bucket window began 13 September 2026. This establishes recent
MCP-boundary activity, but not which external connection or person generated
it. Read-only calls may leave no business audit. The requested 30-day Vercel
telemetry could not be obtained from the current billing tier.

Therefore the connector-specific conclusion is:

`MCP_RECENT_USAGE_UNKNOWN`

Do not interpret UNKNOWN as no usage. Assume a current caller may exist.

## Completed release sequence

Founder Office completed PR5, removed both external registrations, merged the
approved head as `313b18bfff5db98d7e66b16088ec3ed8537fc299`, and released deployment
`dpl_Ethqm2TdoiCDvKoEF5rVZUdiR8o7`. The two connections remain retired and must
not be recreated. PR5 performed no schema or Production data write.

The historical release order disconnected the registrations before the
disappearing endpoints were adopted. Application rollback alone would not have
restored external configuration.

## Endpoint acceptance

Check `/api/mcp/**`, `/.well-known/oauth-authorization-server/**`,
`/.well-known/oauth-protected-resource/**`,
`/admin/integrations/chatgpt-work/**` and the old operational OAuth authorize,
consent, register, revoke and token URLs.

Expected machine-endpoint result after deployment: route absence/404. A 410
stub fails PR5 acceptance because the route still exists. The connector Admin
pages must be absent from the build route manifest and return 404 after ordinary
Admin authentication. An anonymous request may first receive the generic
`/admin/**` login redirect; that middleware behavior is not a retained MCP
page.

The final local build returned 404 for Commercial MCP, Media MCP, authorize,
token, authorization-server metadata and protected-resource metadata. No
retired path appeared in the build route manifest.

## Runtime acceptance

- expected baseline: 81 canonical routes, 39 active/healthy and six legacy
  `ZZ` rows, subject to explained live drift;
- controlled redirect: exact `/r/{slug}` only;
- GB: legal and factual evidence remains fail closed;
- CRM: research remains draft/evidence-only;
- tracking: an untrusted command mutates nothing;
- media: direct logos/editorial assets remain; promotional authority is retired;
- media history: legacy plans/batches decode for reads while unknown sources fail closed;
- auth: no operational OAuth provider; consumer/Admin/Google behavior remains;
- logs: no URL, token, code, client ID or credential.

## Schema and rollback

PR5 has no schema/data change. RFC-051 lists the exact eight inert models plus
compatibility triggers/functions for PR6. Immutable migrations 0021–0023 and
the staged fixture remain required for replay and historical truth.

PR6 has a separate read-only plan and proposed retention decision in the
[PR6 runbook](Commercial-Core-PR6-Legacy-Cleanup.md). It must not drop
`Account.issuer`, generic `Verification`, identity/session data, AuditLog or
migration history as incidental cleanup.

Application rollback restores old server code but not an externally removed
connection. No PR5 database rollback exists because PR5 performs no migration
or Production data mutation.
