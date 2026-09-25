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
- **Amended by:** [RFC-055](RFC-055-Claude-Operated-Partner-CRM.md) (Founder,
  25 September 2026) — the neutral CRM research capability below is now
  exposed through the service-bearer `/api/mcp/crm` endpoint, whose server is
  its only caller. The retired Commercial/Media transports, operational OAuth
  and external connectors stay retired.

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

The external custom connections named `B4GAMBLE Commercial Operations2` and
`B4GAMBLE Media GEO3` are outside this repository and remain release actions:

`EXTERNAL_CONNECTOR_RETIREMENT_REQUIRED`

Founder Office external inspection detected both connections still present.
The detected Production Media endpoint already returns cache-proof `410
MEDIA_OPERATIONS_RETIRED`; that retired endpoint response does not remove the
external registration. No external connector is removed by this review-only
PR.

## 2. Before and after

### Before PR5

```text
external Commercial and Media custom connections
  -> discovery + OAuth/DCR routes
  -> MCP server/tool declarations
  -> Commercial MCP service
       -> CRM repository research operations
       -> tracking-registration application service (no Founder authority)

Media MCP/DCR routes -> cache-proof 410 MEDIA_OPERATIONS_RETIRED stubs
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
| historical Media plan/batch persisted-source decoder | `DATA / HISTORY` | retained read-only compatibility seam |
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

The idempotency namespace audit found a bounded residual case: deliberately
replaying a legacy MCP-created bundle through the neutral service would use a
different namespace and can create duplicate child rows on the resolved
opportunity. That replay is intentionally unsupported. PR5 adds no neutral
caller or replay adapter, and the active repository has no Production or
internal caller that reuses legacy keys. Historical Production rows and audit
records do not themselves invoke the neutral service. Compatibility is not
added without a real, separately authorised caller/replay path.

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

Historical `SiteSetting` plans and batches remain readable through one bounded
persisted-data decoder. It maps only exact legacy `CHATGPT_WORK` sources to
`AUTOMATION` at the plan root, nested plan-operation source and batch root,
then applies the current strict schema. Unknown sources fail closed. Current
write schemas accept only `ADMIN`, `AUTOMATION` and `SYSTEM`; no new write can
emit the legacy value. PR5 performs no history migration, record rewrite or
Production mutation.

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

The exact retained physical inventory for PR6 is:

| Table/model | Columns | Keys, indexes and foreign keys |
| --- | --- | --- |
| `oauthClient` / `OauthClient` | `id`, `clientId`, `clientSecret`, `clientDiscoveryId`, `disabled`, `skipConsent`, `enableEndSession`, `subjectType`, `scopes`, `clientCredentialsScopes`, `userId`, `createdAt`, `updatedAt`, `name`, `uri`, `icon`, `contacts`, `tos`, `policy`, `softwareId`, `softwareVersion`, `softwareStatement`, `redirectUris`, `postLogoutRedirectUris`, `backchannelLogoutUri`, `backchannelLogoutSessionRequired`, `tokenEndpointAuthMethod`, `applicationType`, `jwks`, `jwksUri`, `grantTypes`, `responseTypes`, `public`, `type`, `requirePKCE`, `dpopBoundAccessTokens`, `referenceId`, `metadata` | primary key `id`; unique `clientId`; index `userId`; `userId -> User.id` with cascade update/delete |
| `oauthResource` / `OauthResource` | `id`, `identifier`, `name`, `accessTokenTtl`, `refreshTokenTtl`, `signingAlgorithm`, `signingKeyId`, `allowedScopes`, `customClaims`, `dpopBoundAccessTokensRequired`, `disabled`, `createdAt`, `updatedAt`, `policyVersion`, `metadata` | primary key `id`; unique `identifier` |
| `oauthClientResource` / `OauthClientResource` | `id`, `clientId`, `resourceId`, `metadata`, `createdAt` | primary key `id`; unique `(clientId, resourceId)` named `oauthClientResource_clientId_resourceId_uidx`; indexes `clientId`, `resourceId`; `clientId -> oauthClient.clientId` and `resourceId -> oauthResource.identifier`, both with cascade update/delete |
| `oauthRefreshToken` / `OauthRefreshToken` | `id`, `token`, `clientId`, `sessionId`, `userId`, `referenceId`, `authorizationCodeId`, `resources`, `requestedUserInfoClaims`, `expiresAt`, `createdAt`, `revoked`, `rotatedAt`, `rotationReplayResponse`, `rotationReplayExpiresAt`, `authTime`, `confirmation`, `scopes` | primary key `id`; unique `token`; indexes `clientId`, `sessionId`, `userId`, `authorizationCodeId`; `clientId -> oauthClient.clientId` and `userId -> User.id` with cascade update/delete; `sessionId -> Session.id` with cascade update and set-null delete |
| `oauthAccessToken` / `OauthAccessToken` | `id`, `token`, `clientId`, `sessionId`, `userId`, `referenceId`, `authorizationCodeId`, `resources`, `requestedUserInfoClaims`, `refreshId`, `expiresAt`, `createdAt`, `revoked`, `confirmation`, `scopes` | primary key `id`; unique `token`; indexes `clientId`, `sessionId`, `userId`, `authorizationCodeId`, `refreshId`; `clientId -> oauthClient.clientId`, `userId -> User.id` and `refreshId -> oauthRefreshToken.id` with cascade update/delete; `sessionId -> Session.id` with cascade update and set-null delete |
| `oauthConsent` / `OauthConsent` | `id`, `clientId`, `userId`, `referenceId`, `resources`, `requestedUserInfoClaims`, `scopes`, `createdAt`, `updatedAt` | primary key `id`; indexes `clientId`, `userId`; `clientId -> oauthClient.clientId` and `userId -> User.id` with cascade update/delete |
| `oauthClientAssertion` / `OauthClientAssertion` | `id`, `expiresAt` | primary key `id` |
| `CommercialMcpRateLimitBucket` | `bucketKey`, `scope`, `count`, `windowStartedAt`, `expiresAt` | primary key `bucketKey`; index `expiresAt` |

PR6 cleanup scope also includes the exact connector compatibility triggers
`oauthClient_prepare_compat`, `oauthClient_resource_compat`,
`oauthRefreshToken_resource_compat`, `oauthAccessToken_resource_compat` and
`oauthConsent_resource_compat`, plus functions
`prepare_better_auth_oauth_client_compat`,
`sync_better_auth_oauth_client_resource_compat` and
`set_better_auth_oauth_resource_compat`. The column names above identify
secret-bearing storage but disclose no values; PR5 neither reads nor rewrites
those values.

`Account.issuer`, the generic `Verification` table, User/Session identity
relations, the `Account_better_auth_issuer_compat` trigger and immutable
migration history must not be dropped merely because they appeared in the same
historical upgrade.

PR6 requires its own read-only data plan, retention/legal decision, backup and
rollback evidence, migration review and explicit Founder authority. PR5 does
not delete historical tokens, consents, clients, rate counters or audit rows.

## 8. Production projection and usage

The PR5 projector fingerprints the approved Production database, starts a
repeatable-read transaction, enforces `SET TRANSACTION READ ONLY`, verifies
`transaction_read_only=on`, emits no URLs/credentials/tokens/client IDs, and
checks that public-runtime and migration files do not differ from main.

Read-only evidence refreshed 14 September 2026 UTC found 81 canonical
non-`ZZ` routes, 39 `ACTIVE + HEALTHY` routes, six legacy `ZZ` rows, 17 active
logo assets and 62 Commercial opportunities. The canonical route-state digest
is `4764a59536fef067eed786b82f214ab55f3126d00dd2359b75eba7603f73600c`.
No Production mutation was performed.

The same aggregate-only query inspected only Media ingestion `SiteSetting`
keys and returned no JSON, destination or identifier: 175 plans and 56 batches.
Plan root sources were 2 `ADMIN`, 0 `AUTOMATION`, 16 `SYSTEM`, 157 legacy and
0 unexpected/missing; batch root sources were 0 `ADMIN`, 0 `AUTOMATION`, 4
`SYSTEM`, 52 legacy and 0 unexpected/missing. Across root and nested-operation
positions, 157 plans and 52 batches contain the legacy source, zero records
contain `AUTOMATION`, and zero contain an unexpected/missing source.

Historical connector storage remains populated. The latest old research audit
was 11 September 2026; a connector rate bucket began 13 September 2026. This
proves recent MCP-boundary activity, but database state cannot attribute
read-only calls to the named connection or establish current users.
Authoritative Vercel request telemetry was unavailable:

`MCP_RECENT_USAGE_UNKNOWN`

## 9. External cutover

The required release order is:

1. capture a fresh read-only projection and confirm rollback deployment;
2. independently approve the exact PR5 head with all required hosted CI green;
3. disconnect `B4GAMBLE Commercial Operations2` in the external custom-
   connections UI;
4. disconnect `B4GAMBLE Media GEO3` in the same external UI;
5. verify both external connections are gone;
6. merge that exact approved head under separate Founder authority;
7. deploy the merged SHA;
8. verify every former MCP/OAuth/discovery path is absent/404, never a retained
   410 route, and exposes no tool or metadata; and
9. smoke email/password and Google identity auth, public pages and CTA,
   controlled `/r`, exact MarketActivation, GB gates, direct logo media and
   retired Media behavior, then record Production acceptance.

Disconnecting immediately before deploy prevents a registered client from
calling endpoints that disappear during rollout. It intentionally creates a
short maintenance interval. Application rollback does not recreate the
external connection; reconnecting it is a separate manual rollback step.

Both external connections are `DETECTED` and their removal is `NOT COMPLETED`.
This review does not disconnect either one.

## 10. Acceptance

PR5 is acceptable only when no MCP/OAuth route, discovery document, server,
tool, scope or active connector import remains; direct transport dependencies
are absent from the root manifest/lockfile; neutral CRM and tracking invariants
pass; public CTA, `/r`, GB and media regressions pass; schema/migration history
is unchanged; Production evidence is read-only and secret-safe; and release
evidence states that external connector removal remains required.
