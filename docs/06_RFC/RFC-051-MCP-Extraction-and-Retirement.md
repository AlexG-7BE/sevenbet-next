# RFC-051: MCP Extraction and Retirement

- **Status:** `ACTIVE`
- **Decision authority:** Founder Office instruction, 14 September 2026
- **Approved scope:** Commercial Core PR5 review candidate
- **Depends on:** RFC-013, RFC-014, RFC-015, RFC-017, RFC-027, RFC-036,
  RFC-038, RFC-039, RFC-042, RFC-044, RFC-045, RFC-047, RFC-048, RFC-049
  and RFC-050
- **Supersedes:** RFC-027 sections 17–21 only where they authorise an
  application MCP/OAuth transport; RFC-044's temporary retired Media HTTP
  stubs
- **Does not authorise:** merge, deployment, Production mutation, external
  connector removal or destructive schema cleanup

## 1. Decision

The repository no longer hosts an MCP server or operational OAuth provider.
Commercial CRM research remains an internal, transport-neutral application
capability. Partner tracking registration remains a separate canonical
authority-gated application capability and is not exposed by a replacement
public transport. Media remains logo/editorial-only and independent of both
Commercial CRM and the retired transport.

PR5 physically removes the routes, discovery metadata, OAuth wrappers,
provider configuration, MCP servers, tool declarations, rate-limit runtime,
connector-specific Admin pages, test harnesses and direct root package
dependencies. It does not replace the transport with another public API.

The external custom connection named `B4GAMBLE Commercial Operations2` is
outside this repository and remains a release action:

`EXTERNAL_CONNECTOR_RETIREMENT_REQUIRED`

No external connector is removed by this review-only PR.

## 2. Before and after

### Before PR5

```text
external custom connection
  -> discovery + OAuth/DCR routes
  -> MCP server/tool declarations
  -> Commercial MCP service
       -> CRM repository research operations
       -> tracking-registration application service (no Founder authority)

Media MCP/DCR routes -> cache-proof 410 stubs
```

### After PR5

```text
internal CRM caller (none added by PR5)
  -> CommercialOpportunityResearchService
  -> Commercial repository
  -> CRM evidence/draft/audit models

trusted internal command boundary (none added by PR5)
  -> PartnerTrackingRegistrationService
  -> process-local Founder authority
  -> canonical Partner relationship + MarketActivation controller

public CTA and /r
  -> exact MarketActivation only

Media presentation
  -> direct active logos / B4GAMBLE editorial assets
```

There is no post-PR5 path from an external client, OAuth token, CRM stage or
media record to public commercial authority.

## 3. Repository inventory and classification

| Surface | PR5 classification | Disposition |
| --- | --- | --- |
| `app/api/mcp/commercial/**` | `TRANSPORT` | removed |
| `app/api/mcp/media/**` | `TRANSPORT` / retired stub | removed |
| `app/api/mcp/oauth/**` | `TRANSPORT` / `SECURITY` | removed |
| `app/.well-known/oauth-*` | `TRANSPORT` | removed |
| ChatGPT Work login/consent pages | `TRANSPORT` / `SECURITY` | removed |
| MCP consent/login presentation styles | `TRANSPORT` / `DEAD` | removed |
| `lib/mcp/commercial/**` | `TRANSPORT`, `SECURITY`, `OBSERVABILITY` | removed |
| `lib/mcp/media/**` | `TRANSPORT` / retired adapter | removed |
| `lib/mcp/reliability.ts` | `TRANSPORT` reliability | removed |
| official MCP SDK root dependency | `TRANSPORT` | removed |
| Better Auth OAuth Provider root dependency | `TRANSPORT` / `SECURITY` | removed |
| MCP browser/protocol/auth/rate-limit tests | `TRANSPORT` | removed |
| dated GoldenPlay MCP repair route | `DEAD` one-shot caller | removed |
| MCP Production smoke writer | `DEAD` / obsolete release tool | removed |
| strict opportunity/research schemas | `CANONICAL CRM` | renamed and retained |
| research list/get/duplicate/bundle service | `CANONICAL CRM` | renamed and retained |
| transactional CRM repository logic | `CANONICAL CRM` | neutralized and retained |
| evidence, duplicate and draft ceilings | `SECURITY / AUDIT` | retained |
| partner tracking contract/service/repository | `CANONICAL BUSINESS` | retained, internal only |
| process-local Founder write capability | `SECURITY / AUTHORITY` | retained |
| MarketActivation, public action resolver and `/r` | `CANONICAL BUSINESS` | unchanged |
| AuditLog and CRM run/operation records | `AUDIT` | retained |
| direct logo/editorial MediaAsset runtime | `CANONICAL MEDIA` | unchanged |
| OAuth provider tables and rate buckets | `DATA / HISTORY` | retained inertly for PR6 |
| migrations 0021–0023 and replay fixture | `HISTORY` | immutable and retained |
| isolated `agents/` package | `CANONICAL INTERNAL AGENT` | unchanged and tool-free |
| `.agents/skills/refero-design` MCP-tool guidance | `DEVELOPER DESIGN TOOLING` | retained; outside application runtime |

The isolated `agents/` lockfile contains a transitive
`@modelcontextprotocol/client` dependency through the official
`@openai/agents` SDK. The package has no MCP import, configuration, tool or
application connection, is excluded from the Next.js runtime, and is not the
retired bridge. Removing the official Agent SDK is outside PR5.

## 4. CRM extraction

The surviving neutral surface is:

- `CommercialOpportunityListSchema`;
- `CommercialOpportunityGetSchema`;
- `CommercialOpportunityDuplicateSchema`;
- `CommercialResearchBundleSchema`;
- `commercialOpportunityResearchService`; and
- neutral repository methods `listOpportunities`, `getOpportunity`,
  `findPossibleDuplicates` and `upsertResearchBundle`.

The core accepts `actorId` and an internal `sourceReference`; it accepts no
OAuth client, access scope, tool name, connector identity or HTTP concern.
Source references are hashed before audit persistence.

The extraction preserves strict closed input, evidence classification,
public-web observation dates, nullable external evidence authority, duplicate
protection, one transaction plus advisory locking, child idempotency,
draft/prepared-only application and outreach, direct DETECTED evidence for
received terms, stage proposals no higher than `APPLICATION_READY`, activation
packets no higher than Founder review, and no send, submit, approve, accept,
activate, publish or tracking operation.

New neutral research idempotency keys use a `research:` namespace. Historical
`mcp:` keys and `commercial_mcp_research_bundle_upserted` audit rows remain
truthful history and are not rewritten.

## 5. Tracking and media independence

Partner tracking remains in `PartnerTrackingRegistrationService`. It has no
CRM, OAuth, connector or transport dependency. Before target resolution or
staging it requires a non-serializable trusted `FOUNDER_DIRECT` or
`FOUNDER_DELEGATED` capability. PR5 creates no caller and mints no authority.
The service remains internal until a separately reviewed boundary is needed.

The canonical public path remains trusted-GEO normalization, one exact
`MarketActivation` lookup, legal and narrow GB factual evidence, safe/effective
route and current health, and one nullable governed action through controlled
`/r`.

Media MCP and DCR stubs are removed. Direct active operator logos and
B4GAMBLE-owned editorial assets remain. Promotional media assignments and
hosted creatives remain inert under RFC-044. Media cannot create, block or
select a commercial route.

MCP request rate buckets, protocol reliability wrappers and connector-facing
browser telemetry measured only the retired transport and are removed from
runtime. Neutral AuditLog evidence, Partner registration audit, canonical
Affiliate Route Health and general database reliability remain; none depends
on or reports a connector identity.

## 6. Authentication boundary

Better Auth remains for email/password sessions, Admin staff resolution,
Programme continuation and optional Google identity-only authentication.
PR5 removes only the operational OAuth Provider plugin and its authorization,
consent, DCR, token, revocation and protected-resource surfaces. Generic Google
OAuth identity behavior is unchanged.

## 7. Historical schema retained for PR6

PR5 deliberately includes no schema migration and no Production data write.
The following exact Prisma models remain inert cleanup candidates:

- `OauthClient` (`oauthClient`);
- `OauthResource` (`oauthResource`);
- `OauthClientResource` (`oauthClientResource`);
- `OauthRefreshToken` (`oauthRefreshToken`);
- `OauthAccessToken` (`oauthAccessToken`);
- `OauthConsent` (`oauthConsent`);
- `OauthClientAssertion` (`oauthClientAssertion`); and
- `CommercialMcpRateLimitBucket`.

PR6 must also inventory connector-specific foreign keys, indexes, the
`oauthClient_prepare_compat` and `oauthClient_resource_compat` triggers,
token-resource compatibility triggers, and the
`prepare_better_auth_oauth_client_compat`,
`sync_better_auth_oauth_client_resource_compat` and
`set_better_auth_oauth_resource_compat` functions. `Account.issuer`, the
generic `Verification` table, User/Session identity relations and immutable
migration history must not be dropped merely because they appeared in the
same historical upgrade.

PR6 requires its own read-only data plan, retention/legal decision, backup and
rollback evidence, migration review and explicit Founder authority. PR5 does
not delete historical tokens, consents, clients, rate counters or audit rows.

## 8. Production projection and usage

The PR5 projector fingerprints the approved Production database, starts a
repeatable-read transaction, enforces `SET TRANSACTION READ ONLY`, verifies
`transaction_read_only=on`, emits no URLs/credentials/tokens/client IDs, and
checks that public-runtime and migration files do not differ from main.

Read-only evidence captured 13 September 2026 UTC found 81 canonical
non-`ZZ` routes, 39 `ACTIVE + HEALTHY` routes, six legacy `ZZ` rows, 17 active
logo assets and 62 Commercial opportunities. The canonical route-state digest
is `4764a59536fef067eed786b82f214ab55f3126d00dd2359b75eba7603f73600c`.
No Production mutation was performed.

Historical connector storage remains populated. The latest old research audit
was 11 September 2026; a connector rate bucket began 13 September 2026. This
proves recent MCP-boundary activity, but database state cannot attribute
read-only calls to the named connection or establish current users.
Authoritative Vercel request telemetry was unavailable:

`MCP_RECENT_USAGE_UNKNOWN`

## 9. External cutover

The safest release order is:

1. independently approve PR5 and announce a maintenance window;
2. capture read-only before-state and confirm rollback deployment;
3. remove `B4GAMBLE Commercial Operations2` from the external custom-connection
   UI immediately before deployment;
4. merge PR5 under separate Founder authority;
5. deploy;
6. verify former MCP/OAuth/discovery URLs are absent/404 with no tools;
7. verify auth, CRM, tracking tests, the expected 39 active healthy routes,
   public CTA, `/r`, GB gates and logo media; and
8. record external removal and Production acceptance.

Disconnecting immediately before deploy prevents a registered client from
calling endpoints that disappear during rollout. It intentionally creates a
short maintenance interval. Application rollback does not recreate the
external connection; reconnecting it is a separate manual rollback step.

Any Media custom connection still present externally must also be removed.
Repository and database evidence cannot establish whether one exists; its
external state is `UNKNOWN`.

## 10. Acceptance

PR5 is acceptable only when no MCP/OAuth route, discovery document, server,
tool, scope or active connector import remains; direct transport dependencies
are absent from the root manifest/lockfile; neutral CRM and tracking invariants
pass; public CTA, `/r`, GB and media regressions pass; schema/migration history
is unchanged; Production evidence is read-only and secret-safe; and release
evidence states that external connector removal remains required.
