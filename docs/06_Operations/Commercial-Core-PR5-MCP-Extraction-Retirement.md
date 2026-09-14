# Commercial Core PR5 — MCP Extraction and Retirement

**Status:** review-only release plan
**Authority:** RFC-051 and the 14 September 2026 Founder instruction
**Not authorised here:** merge, deploy, Production mutation, schema cleanup or
external connector removal

## Outcome

PR5 removes the repository-hosted MCP and operational OAuth transport while
retaining neutral Commercial CRM research, canonical Partner tracking,
MarketActivation/public action, audit, and direct logo/editorial media
capabilities. It adds no replacement public transport.

`B4GAMBLE Commercial Operations2` is an external custom connection and is not
managed by repository code. Its removal is still required:

`EXTERNAL_CONNECTOR_RETIREMENT_REQUIRED`

External connector removal is **not complete** in this review candidate.

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
| named Commercial connection remains external | `DETECTED` | Founder instruction |
| a Media connector still exists externally | `UNKNOWN` | no external UI evidence |
| current named-connector request usage | `UNKNOWN` | no attributable request telemetry |

## Repository scan

The scan confirmed the active Git worktree belongs to
`AlexG-7BE/sevenbet-next`. The final scan covered 2,325 active files after
excluding dependencies, generated output, build artifacts, caches, reports and
`tsconfig.tsbuildinfo`; the Git index separately identified the base, removals
and eight new PR5 artifacts.

Historical MCP references remain only where truth requires them: immutable
migrations/fixtures, release records, RFC history, inert schema model names,
the PR5 projection/retirement and negative-independence assertions, migration
baseline names, transitive Agent SDK lock data, and an unrelated Refero design
skill's developer-tool instructions. Neither Agent/Refero remnant enters the
application runtime or exposes a B4GAMBLE connection.

## Read-only Production projection

Run `npm run commercial-core:pr5:projection`. The command refuses an unexpected
database fingerprint, enters a repeatable-read transaction, sets it read-only
and verifies the database reports read-only state. It emits only counts,
bounded timestamps and hashes.

Evidence captured at `2026-09-13T23:31:46.631Z`:

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

## Release sequence

1. Obtain independent PR approval and explicit merge/deploy authority.
2. Announce a maintenance window because no replacement transport exists.
3. Re-run the projection; stop on unexplained route-count/digest drift.
4. Confirm the previous Ready deployment and document the manual external
   reconnect procedure.
5. Remove `B4GAMBLE Commercial Operations2` in the external custom-connections
   UI.
6. Inspect that UI for a Media connector. Remove it if present. If inspection
   is unavailable, stop and retain state `UNKNOWN`.
7. Merge PR5.
8. Deploy the merged SHA.
9. Confirm all former machine-facing MCP/OAuth/discovery URLs are absent/404,
   never 200, 401, 405 or 410, and expose no tools or metadata. Confirm the
   build route manifest contains no connector Admin page.
10. Verify email/password Admin auth and Google identity-only auth.
11. Verify CRM research, tracking authority denial, the expected active routes,
    public CTA, `/r`, GB gates and direct logo media.
12. Record connector removal, deployment and acceptance evidence.

The external disconnect occurs immediately before merge/deploy so clients do
not remain registered against disappearing endpoints. If deployment fails,
restore the previous application and reconnect the external connection only
after reviewing old OAuth material. Application rollback alone does not
restore external configuration.

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
- auth: no operational OAuth provider; consumer/Admin/Google behavior remains;
- logs: no URL, token, code, client ID or credential.

## Schema and rollback

PR5 has no schema/data change. RFC-051 lists the exact eight inert models plus
compatibility triggers/functions for PR6. Immutable migrations 0021–0023 and
the staged fixture remain required for replay and historical truth.

PR6 needs a separate read-only plan and retention decision. Do not drop
`Account.issuer`, generic `Verification`, identity/session data, AuditLog or
migration history as incidental cleanup.

Application rollback restores old server code but not an externally removed
connection. No PR5 database rollback exists because PR5 performs no migration
or Production data mutation.
