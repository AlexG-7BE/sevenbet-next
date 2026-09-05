# PRODUCTION-DB-MCP-RELIABILITY-01 Release Record — 5 September 2026

**Status:** COMPLETE — deterministic unreachable-database and one-connection
acceptance, exact-head CI, corrected Preview, protected merge and bounded
Production acceptance passed

**Founder authority:** `B4GAMBLE — PRODUCTION-DB-MCP-RELIABILITY-01`

**Starting `origin/main`:**
`580aa965799703b73cceebcad5252d1093b63954`

**Implementation branch:** `codex/production-db-mcp-reliability-01`

**Implementation pull request:**
[#159](https://github.com/AlexG-7BE/sevenbet-next/pull/159)

**Primary implementation commit:**
`bf431aa70bc72fa765cd79cd181f4554ba21e3ab`

**Preview-discovered contention correction:**
`2d47933371b229267b885476c7c58ebdf9b3a62e`

**Accepted implementation head:**
`2d47933371b229267b885476c7c58ebdf9b3a62e`

**Implementation merge:**
`491e1c51bc26c60ac10b2fe5bf8f15bba5cfe044`

**Accepted Preview:** GitHub deployment `6280977949`; Vercel deployment
`dpl_HDLHqgzcYX3EhkHZb6piLazXWUUc`; Ready at
`https://sevenbet-next-adx2aym53-alexg-7bes-projects.vercel.app`

**Accepted Production:** GitHub deployment `6281125091`; Vercel deployment
`dpl_7VZfo7P55yAwgShrYK2wx1vDtk11`; Ready at
`https://sevenbet-next-mff0b4c5e-alexg-7bes-projects.vercel.app`

**Production origin:** `https://b4gamble.com`

**Release-record branch:**
`codex/production-db-mcp-reliability-01-release-record`

**Release-record pull request:**
[#160](https://github.com/AlexG-7BE/sevenbet-next/pull/160)

This record contains no database URL, credential, OAuth token/code, signed
cookie, raw affiliate destination, visitor data or Programme data. Claims are
classified as **DETECTED**, **INFERRED**, **PROPOSED**, **UNKNOWN** or
**CONTRADICTION** under the repository technical-evidence rule.

## Executive result

**DETECTED:** unsupported Commercial and Media MCP methods now execute through
small route shells that do not import Prisma, Better Auth, OAuth or operational
services. A real POST dynamically loads its authenticated implementation.

**DETECTED:** genuinely transient database availability failures receive a
bounded, secret-safe response. They no longer become a misleading auth failure,
an unhandled rejection or an MCP function-process exit. Invalid credentials,
invalid scope, malformed input and programming faults retain their distinct
failure semantics.

**DETECTED:** avoidable same-request query fanout was removed from public
Casino discovery and scoped Media ingestion reads. Corrected Preview evidence
also required a one-connection-only FIFO coordinator around the complete
public discovery operation, preventing separate `/casinos` requests from
timing out while waiting behind the same one-slot application pool.

No schema, Production data, database provider/plan/configuration, R2 object,
media assignment, publication, MCP tool or commercial authority changed.

## Incident reconciliation

### Confirmed Production initialization incident

**DETECTED:** exact Production deployment
`dpl_7ohCbUd6cwjCiCxUug9yrAVWzBni` logged one attributable sequence at
approximately `2026-09-05T10:45:46Z`:

1. `GET /api/mcp/commercial` returned HTTP 405;
2. static module initialization nevertheless reached
   `prisma.oauthResource.findFirst()`;
3. the pooled database authority was temporarily unreachable;
4. Prisma emitted `PrismaClientInitializationError`;
5. the rejected initialization escaped as `Unhandled Rejection`; and
6. the Node process exited with status 128.

**DETECTED:** a Media MCP GET immediately before the Commercial request returned
405 without the same recorded error sequence. Subsequent normal public GETs
returned 200, demonstrating provider/application recovery without a durable
data incident.

### Frequency and attribution limits

**DETECTED:** the independent exact-deployment and bounded seven-day Production
search performed before implementation found the one supplied Commercial
initialization/crash sequence and did not find a separately attributable
`P2024` record in the available result window.

**UNKNOWN:** Vercel's bounded retained/searchable result set does not prove a
lifetime incident count. The supplied references to `/casinos` and
`/api/admin/media-operations/ingestions` were treated as reproduction leads,
not inflated into a claimed Production frequency.

**DETECTED:** the initial implementation Preview did reproduce a concrete
application-side capacity defect: six of eight concurrent `/casinos` requests
returned 500 with `P2024`. That Preview evidence is recorded below and drove
the second implementation commit before merge.

## Root cause

### MCP method-only initialization

**DETECTED:** both MCP route modules statically imported POST/auth/service
dependencies. The Commercial chain reached `lib/mcp/commercial/oauth`, then
`lib/auth/instance`; Better Auth construction configured the Prisma adapter and
OAuth Provider resource seeding. The Media route had the same class of static
POST dependency graph.

**DETECTED:** Better Auth 1.7.1 OAuth Provider construction exposes asynchronous
resource initialization through `$context`. The former eager exported instance
started that work at module/runtime initialization, including a database lookup
for OAuth resources. A method-only 405 therefore had an unintended DB failure
surface.

### Pool contention

**DETECTED:** `loadContext()` issued Casino aliases, affiliate offers and
redirect slugs with `Promise.all`. With `connection_limit=1`, the request queued
three Prisma operations against its own only connection. Sequential execution
is equivalent in returned data and removes same-request competition.

**DETECTED:** serializing only those three calls was insufficient under
cross-request concurrency. The first Preview showed independent discovery
requests queuing at the application pool before the 10-second acquisition
timeout. The final correction coordinates each full discovery operation when
the runtime URL declares a one-connection application pool.

### Provider outage versus application defect

**DETECTED:** the managed-database reachability event was external availability
loss; this release does not claim to prevent provider outages. Eager DB work on
unsupported methods, uncaught initialization rejection, avoidable query fanout
and unbounded cross-request entry into a one-slot client were application
defects.

## Lightweight MCP boundary

`app/api/mcp/commercial/route.ts` and `app/api/mcp/media/route.ts` now export
lightweight method handlers. `GET`, `DELETE`, `PATCH`, `PUT` and `OPTIONS`
return:

- HTTP 405;
- `Allow: POST`; and
- `Cache-Control: no-store`.

Only `POST` dynamically imports the corresponding `post-handler` module. The
shells contain no Prisma, auth, OAuth, rate-limit or service import.

**DETECTED — hard import acceptance:** a separate Node process set
`DATABASE_URL` and `DIRECT_URL` to an unavailable disposable loopback target,
registered unhandled-rejection capture, imported both route modules and invoked
all ten unsupported-method cases. Every response was 405 with exact headers;
stderr and the unhandled list were empty. Structural assertions fail if either
route regains a DB/auth/service import or loses the dynamic POST split.

## Better Auth initialization and exact OAuth authority

**DETECTED:** `getAuth()` lazily constructs ordinary Better Auth without the
operational OAuth Provider. `getOperationalMcpAuth()` lazily constructs the full
Commercial/Media provider only for paths that need it, awaits `$context`, caches
only successful construction and clears a rejected promise so the next healthy
request can recover without process restart.

**DETECTED:** a narrow AsyncLocalStorage capture preserves the original
transient Prisma cause when Better Auth wraps it in a generic API error. The
auth catch-all, session boundary and operational OAuth wrapper can therefore
map infrastructure unavailability accurately without changing normal auth
failures.

The existing anonymous-session-cookie optimization remains: a request with no
Better Auth session cookie does not initialize Better Auth. Bootstrap Admin
explicitly requests the ordinary non-operational instance.

The exact resource contract remains:

| Resource | Exact tools | Exact delegated scopes |
| --- | ---: | --- |
| Commercial MCP | 4 | `commercial:read`, `commercial:safe_write`, optional `offline_access` |
| Media MCP | 5 | `media:read`, `media:safe_write`, optional `offline_access` |

PKCE, exact resource binding, token rotation/revocation, staff permission,
rate limits and cross-resource denial remain enforced. `resourceSeedMode`
remains `merge`; both Production resource identifiers and TTL policy remain
unchanged.

## Transient database failure contract

The classifier follows a bounded error/cause chain and accepts only Prisma
availability failures:

- `P1001` — database unreachable;
- `P1002` — database connection timed out;
- `P1017` — server closed the connection;
- `P2024` — connection-pool acquisition timeout; and
- a `PrismaClientInitializationError` carrying the equivalent unreachable or
  connection-establishment text.

It deliberately rejects a generic object merely carrying `P2024`, credential
failure `P1000`, constraint error `P2002`, malformed input and programming
errors.

For a DB-dependent MCP request, a classified failure returns HTTP 503 with
`Cache-Control: no-store`, `Retry-After: 3` and:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32003,
    "message": "Operational data is temporarily unavailable"
  },
  "id": null
}
```

No Prisma code, host, URL, pool detail or stack is returned. Admin service and
Media Operations boundaries use the existing JSON API shape with the same 503,
no-store and short retry contract. No retry was added. A subsequent healthy
request is expected to execute normally and is exercised by the PostgreSQL
acceptance test.

## Production Prisma pool contract

**DETECTED by safe semantic value only:** the exact Production build preflight
passed its database-readiness assertion. That assertion can be true only when:

- application `DATABASE_URL` uses `pooled.db.prisma.io`;
- runtime TLS is `sslmode=require`;
- `connection_limit=1`;
- `pool_timeout` is not disabled;
- `DIRECT_URL` uses `db.prisma.io` with required TLS; and
- both URLs resolve to the same redacted database identity.

The incident/runtime evidence reports the current pool timeout as 10 seconds.
Vercel inventory showed `DATABASE_URL` and `DIRECT_URL` present and encrypted;
no value or credential was printed or persisted.

**DETECTED:** no database environment/configuration, provider or plan change
occurred. The one-connection value remains the intentional serverless starting
contract. This matches current Prisma guidance to use the pooled authority for
application traffic, the direct authority for migrations/admin work, reuse one
client outside the handler, start serverless pools at one and avoid or tune
parallel query bursts based on measured timeout evidence:

- [Prisma Postgres connection setup](https://www.prisma.io/docs/postgres/database/connecting-to-your-database)
- [Prisma Postgres connection pooling](https://www.prisma.io/docs/postgres/database/connection-pooling)
- [Prisma ORM v6 serverless connection management](https://www.prisma.io/docs/orm/v6/prisma-client/setup-and-configuration/databases-connections)

## `/casinos` contention correction

The three-query discovery context preserves its exact returned aliases, offers
and redirects. It now runs sequentially, so its maximum same-client concurrency
is one.

Top-level Prisma operation count is input-dependent and unchanged:

- referral denied: one published-snapshot read plus one alias read;
- commercial projection outside GB: those two plus offer and redirect reads;
- eligible GB projection: the same four plus the existing aggregate operator-
  eligibility read.

Prisma may internally realize relation includes as more than one SQL statement;
this workstream measures the application-level calls that formerly competed for
the single client connection and does not claim a universal raw-SQL count.

| Disposable one-connection evidence | Before final correction | Final |
| --- | ---: | ---: |
| Context queries | 3 | 3 |
| Maximum internal context-query concurrency | 3 | 1 |
| Cold context latency | 49.43 ms | 20.48 ms |
| Warm median | 3.17 ms | 3.48 ms |
| Warm maximum | 4.26 ms | 4.26 ms |
| Eight concurrent context reads | 22.74 ms | 19.50 ms |
| P2024 in ordinary local batch | 0 | 0 |

The final PostgreSQL acceptance additionally held `CasinoVersion` for about
1.5 seconds while launching eight distinct discovery requests. All eight
fulfilled, the complete discovery operations entered the database one at a
time, and elapsed time was 1512.27 ms versus a 1511.21 ms controlled lock. A
follow-up identical request incremented the underlying read count, proving that
completed results are not retained as stale cache.

The coordinator activates only when the runtime URL explicitly has
`connection_limit=1`. Same-key callers may share only a currently live Promise;
different requests use FIFO entry. There is no stale-data cache, commercial/GEO
bypass or retry.

## Admin Media Operations

**DETECTED:** anonymous Admin/API requests retain the no-cookie fast failure and
do not initialize Better Auth. An authenticated request now uses ordinary auth,
without paying the unrelated operational OAuth-resource initialization cost,
then performs its required Admin and Media Operations reads.

Scoped Media ingestion context, partner-network/program and existing-assignment
lookups were made sequential where the same request and same Prisma client had
demonstrated one-pool-slot contention value. Transient Prisma failures are no
longer swallowed as creative rejections.

The one-connection acceptance used a valid signed Admin session, saturated the
application pool, observed a secret-safe 503, released the pool and then
observed a healthy 200. `media.manage`, draft-only planning, R2, checksum dedupe,
`MediaAsset` behavior and publication authority are unchanged.

**LIMITATION:** no authorised interactive Production Admin session was available
to this execution context, so Production Admin acceptance used the anonymous
401 boundary plus deterministic signed-session PostgreSQL acceptance rather
than claiming a live authenticated manual read.

## Bounded `Promise.all` audit

**DETECTED:** the hot public discovery fanout and scoped Media ingestion bursts
were the material same-request cases changed here. Remaining occurrences were
reviewed and left unchanged where they are Admin/reference validation, bounded
transactional writes, usage inspection, Programme-owned code, release/CI
scripts or otherwise lacked demonstrated contention on the affected paths.
Representative retained locations include the affiliate offer/redirect, Casino,
Media and placement-assignment repositories, Program Builder, Programme
repositories and one-shot release scripts.

This is not a repository-wide serialization rule. A future occurrence should
be changed only with path-specific one-client evidence.

## Prisma client lifecycle

**DETECTED:** `lib/db/prisma.ts` keeps one module-level `PrismaClient` outside
request handlers and reuses it through `globalThis` only outside Production.
No duplicate-client defect inside one Production function bundle was proved.
The implementation remains unchanged, consistent with the current Prisma v6
serverless guidance to instantiate outside the handler and reuse warm-instance
state. The route import correction removes unnecessary construction rather than
introducing per-request clients or explicit disconnects.

## Tests and CI

**DETECTED — focused local acceptance:**

- transient/import reliability: 8/8;
- targeted auth/MCP/Admin/Media/product regressions: 117/117;
- public discovery/service regressions: 50/50;
- structural regressions: 302/302 plus 6/6;
- typecheck, focused ESLint and `git diff --check`: pass;
- exact Production build: pass; and
- disposable PostgreSQL one-connection acceptance: 1/1.

The unreachable-database process test proves both authenticated MCP POSTs
return bounded 503s with no unhandled rejection. The PostgreSQL test proves
Commercial read, Media read and signed Admin Media read each fail safely under
controlled saturation and succeed after release. Operational OAuth initialization
also fails as transient, resets and then seeds exactly the two governed resources
on the healthy attempt.

**DETECTED:** exact-head PR CI run
[`33966120578`](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33966120578)
passed Agent Core, Quality, Database/Migration, Build/Browser and Vercel. The
exact merge-SHA run
[`33966888922`](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33966888922)
passed Agent Core, Quality, Database/Migration and Build/Browser. The latter
completed in 15 minutes 29 seconds, including the full browser and typography
checks.

## Preview acceptance

### Superseded first Preview

**DETECTED:** implementation commit `bf431aa...` deployed as GitHub deployment
`6280832563` / Vercel `dpl_8dTqHr1EcLCC1SFrSpdenQ3Bk1Lt`. Seven public routes
initially returned 200 and all ten MCP method probes returned exact 405 headers.
Bounded concurrency then found six of eight `/casinos` requests returning 500;
exact deployment logs attributed them to `P2024` at the first published-snapshot
query. Merge was paused and the evidence was preserved on PR #159.

### Accepted corrected Preview

**DETECTED:** corrected head `2d47933...` deployed as GitHub deployment
`6280977949` / Vercel `dpl_HDLHqgzcYX3EhkHZb6piLazXWUUc`.

- cold Commercial and Media GETs: 405 with `Allow: POST`, no-store;
- anonymous Admin Media read: 401;
- eight concurrent `/casinos`: 8/8 HTTP 200, 2.72–2.98 seconds;
- four Commercial plus four Media method probes: 8/8 HTTP 405,
  0.63–1.28 seconds;
- `/`, `/casinos`, `/bonuses`, `/best-offers`, `/help`, `/program`, `/login`:
  all 200 after canonical handling, 0.73–1.29 seconds; and
- exact-deployment error/fatal/500/503 and named Prisma/process terms: none.

Preview MCP POST is intentionally disabled. No isolated authorised Preview MCP
credential existed, so no authenticated Preview read is claimed; exact-resource
valid-token paths are covered by deterministic PostgreSQL CI.

## Production acceptance

**DETECTED:** exact merge `491e1c51...` produced GitHub Production deployment
`6281125091` and Ready Vercel deployment
`dpl_7VZfo7P55yAwgShrYK2wx1vDtk11`, serving the canonical aliases.

- Commercial GET: 405, `Allow: POST`, no-store, 1.28 seconds;
- Media GET: 405, `Allow: POST`, no-store, 0.42 seconds;
- seven-route public smoke: all 200 after canonical handling,
  0.98–2.94 seconds;
- eight concurrent `/casinos`: 8/8 HTTP 200, 2.79–3.00 seconds;
- four Commercial plus four Media probes: 8/8 HTTP 405,
  0.44–0.57 seconds; and
- anonymous Admin Media API: 401 with private no-store behavior.

**DETECTED:** metadata exposes the exact Commercial and Media resources with
their respective read/safe-write scopes and optional `offline_access` only.

**DETECTED:** the bounded exact-deployment log window contained 43 records:
17 status 200, 13 status 307, one status 401 and 12 status 405. Searches for
`P2024`, `PrismaClientInitializationError`, `Unhandled Rejection`, process exit,
database-unreachable text, the pooled host, error/fatal, 500 and 503 returned
zero matches.

**LIMITATION:** no safe current Founder Commercial token/connection was
available to this CLI context. No client was registered and no token,
connection or authority was changed merely to manufacture a live read. The
valid-token healthy/unavailable/recovery paths are covered in exact-head CI.
Media Operations was not connected to ChatGPT and no Media OAuth client was
created.

## Public state integrity

**DETECTED:** Production retained eight real Casinos and six published Bonuses;
Casino discovery, Bonuses, Best Offers, Help, Programme and login remained
available. The release changed no Editor Score, ranking, offer term, CTA/GEO
rule, redirect, adaptive media layout, R2 object, ingestion/dedupe record,
placement assignment, publication snapshot or Programme/auth authority.

No Prisma migration, database write, Production environment mutation or media
publication was required or performed.

MEDIA-INGESTION-AUTOPLACEMENT-01 remains COMPLETE. This workstream did not
reopen it.

## Rollback

Application-only rollback is sufficient: revert PR #159 through the protected
branch/PR/deployment path and run the same MCP, public concurrency, Admin and
log checks. There is no schema, data, R2 or environment rollback.

Rollback triggers are a new auth/MCP connection regression, unexpected public
5xx, or commercial/media authority regression. Do not raise the connection
limit or disable the pool timeout as an emergency substitute without separate
Founder review.

## Remaining risk and unknowns

- **DETECTED:** managed database or network availability can recur; callers now
  receive bounded truthful failure, not fabricated success.
- **UNKNOWN:** bounded Vercel retention/search cannot establish a lifetime
  incident frequency or provider root-cause report.
- **UNKNOWN:** a live authenticated Founder Commercial connection was not
  available for this acceptance window.
- **DETECTED:** one-connection discovery coordination is per warm function
  instance. Provider pooling and platform scaling remain external layers.
- **PROPOSED ONLY:** a separately governed, integrity-preserving public snapshot
  architecture could be evaluated in the future. This corrective deliberately
  does not serve stale commercial/GEO state during a full outage.
- **DETECTED:** no infinite or long blocking retry was introduced.

## Final state

`PRODUCTION-DB-MCP-RELIABILITY-01: COMPLETE`

The explicitly separate next workstream is:

`B4GAMBLE-MEDIA-OPERATIONS-CHATGPT-CONNECTION-01`

`NOT STARTED`
