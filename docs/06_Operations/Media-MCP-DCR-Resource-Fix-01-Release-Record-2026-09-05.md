# MEDIA-MCP-DCR-RESOURCE-FIX-01 Release Record — 5 September 2026

**Status:** COMPLETE — exact-head CI, standards-shaped Preview acceptance,
protected merge, exact-merge Production deployment and Production acceptance
passed

**Founder authority:** `B4GAMBLE — MEDIA-MCP-DCR-RESOURCE-FIX-01`

**Starting `origin/main`:**
`59b4e2b7b4d7de2582ca94947f1ce96bc9cdb029`

**Implementation branch:** `codex/media-mcp-dcr-resource-fix-01`

**Implementation pull request:**
[#161](https://github.com/AlexG-7BE/sevenbet-next/pull/161)

**Implementation commit:**
`32476d6bc20106dd17b48350c90517704ac02a68`

**Implementation merge:**
`edf191f9c52912fb1637b1f5952bf4f0e7830dfb`

**Accepted Preview:** GitHub deployment `6281749850`; Vercel deployment
`dpl_9das65jH9zo9xFWceD4RSqFEoFf8`; Ready at
`https://sevenbet-next-fbqht9e61-alexg-7bes-projects.vercel.app`

**Accepted Production:** GitHub deployment `6281904824`; Vercel deployment
`dpl_F5s4pBxa4jkkRg2hv3CD6grcam9g`; Ready at
`https://sevenbet-next-8cdpghgn6-alexg-7bes-projects.vercel.app`

**Production origin:** `https://b4gamble.com`

This record contains no database URL, credential, OAuth token/code, signed
cookie, raw affiliate destination, visitor data or Programme data. Claims are
classified as **DETECTED**, **INFERRED**, **PROPOSED**, **UNKNOWN** or
**CONTRADICTION** under the repository technical-evidence rule.

## Executive result

**DETECTED:** standard public-client DCR initiated from Media discovery now
creates a Media-only client without a custom `resource`, `resources`, Media
scope or Media-bearing client name in the incoming registration. Its Media
authorization reaches the staff login boundary and its Commercial
authorization fails `invalid_target`. The inverse is true for Commercial.

**DETECTED:** the existing Commercial issuer, DCR endpoint, exact three scopes,
strict resource checks and four-tool surface remain. Media retains its exact
three scopes and five-tool surface. PKCE S256, public clients without secrets,
authorization-code plus refresh grants and `offline_access` remain advertised
and tested.

No schema, migration, CRM, Media Operations, R2, offer, GEO, CTA, public-product
or MCP tool change accompanied this corrective. The pre-existing Founder
Commercial connection was not mutated or rebound.

## Root cause

**DETECTED:** both protected resources previously advertised the same
authorization-server issuer and shared registration endpoint. The shared DCR
router selected Commercial when a standards-shaped ChatGPT request omitted the
non-standard resource fields and a domain scope. It therefore persisted the
client metadata as Commercial; the later Media authorize request was correctly
rejected by the unchanged exact-resource check.

**DETECTED:** installed `@better-auth/oauth-provider` 1.7.1 unions
`clientRegistrationDefaultResources` with an explicitly supplied registration
resource. The former Commercial default could therefore create provider
relations for both resources when the application selected Media. Application
metadata validation kept that latent provider state from authorizing across
resources, but the state violated the durable one-resource client invariant.

## Implementation

**DETECTED:** Media protected-resource metadata now advertises the distinct
RFC 8414 issuer `https://b4gamble.com/api/mcp/media`. Path-based authorization-
server metadata is published at
`/.well-known/oauth-authorization-server/api/mcp/media` and points to the
Media-bound registration endpoint `/api/mcp/oauth/register/media`.

**DETECTED:** Commercial remains on issuer `https://b4gamble.com` and DCR
endpoint `/api/mcp/oauth/register`. Each discovery-selected registration
wrapper supplies exactly one resource internally. The provider-level default
resource was removed, so it cannot be unioned with Media. Scope, client name,
User-Agent, Referer and descriptive metadata do not select a resource.

**DETECTED:** authorization validates the registered client/resource,
redirect, PKCE request and exact scopes before an anonymous request is sent to
login. Media authorization responses identify the Media issuer through the
RFC 9207 `iss` parameter; internal same-origin login/consent redirects remain
unchanged.

The implementation follows the
[OpenAI MCP authentication guidance](https://developers.openai.com/plugins/build/auth), the
[MCP authorization specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization),
[RFC 8414](https://datatracker.ietf.org/doc/html/rfc8414),
[RFC 9728](https://datatracker.ietf.org/doc/html/rfc9728) and
[RFC 9207](https://datatracker.ietf.org/doc/html/rfc9207).

## Resource isolation and DCR evidence

**DETECTED — deterministic HTTP regression:** the incoming body used ordinary
public-client metadata, the ChatGPT callback, neutral `client_name: ChatGPT`
and no `resource`, `resources` or `scope`. Media and Commercial registrations
returned HTTP 201 with `token_endpoint_auth_method: none`, no client secret,
authorization-code/refresh grants, and their respective exact three scopes.

**DETECTED — real PostgreSQL regression:** each client persisted exactly one
`oauthClientResource` relation, exact scopes and exact
`b4gambleMcpResource` metadata. Correct-resource validation passed in both
directions. Media-to-Commercial and Commercial-to-Media failed before login.
The existing no-cross-resource exchange, refresh and bearer-token regressions
also passed.

**DETECTED — provider/hint guard:** a Media scope sent only to the shared
Commercial registration endpoint fails `invalid_scope`; it cannot select
Media. Structural acceptance fails if provider default resources return.

## Local and CI verification

**DETECTED:** local acceptance passed:

- repository-wide `npm run ci:quality`;
- Node 24 `npm run build`;
- exact OAuth/browser regression, 7/7;
- real PostgreSQL MCP/resource/token regression, 14/14;
- one-connection Production-shaped reliability regression, 1/1;
- exact four Commercial and five Media tool discovery; and
- ten built-server method-only probes with HTTP 405, `Allow: POST`, `no-store`
  and no database/auth initialization output.

**DETECTED:** PR CI run
[`33970186348`](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33970186348)
passed Agent Core, Quality, Database / Migration Verification and Build /
Browser at implementation head `32476d6...`. The database/browser job included
the real PostgreSQL MCP suite, migrations, build, build-secret scan, full
browser matrix and typography browser acceptance.

**DETECTED:** post-merge CI run
[`33970975103`](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33970975103)
passed the same four jobs at exact merge SHA `edf191f9...`, including the real
PostgreSQL MCP suite and one-connection Production DB reliability acceptance.

## Preview

**DETECTED:** the ordinary Preview was Ready but correctly had both MCP flags
disabled. Two non-sensitive flags were added only for the implementation
branch, the same source SHA was rebuilt as accepted deployment
`dpl_9das65...`, and both flags were removed immediately after acceptance.
Production and every other Preview branch were unchanged.

**DETECTED:** accepted Preview published separate exact issuer, registration
endpoint and scope metadata. Two fresh neutral DCR clients proved both valid
login transitions and both `invalid_target` cross-resource failures. Error-
level and HTTP 500 log queries returned no records.

## Production

**DETECTED:** exact merge SHA `edf191f9...` deployed automatically as Ready
Production `dpl_F5s4p...`; `b4gamble.com` and the provider alias both resolve to
that deployment.

**DETECTED:** Production metadata advertises:

- Commercial issuer `https://b4gamble.com`, shared protocol endpoints and only
  `commercial:read`, `commercial:safe_write`, `offline_access`;
- Media issuer/resource `https://b4gamble.com/api/mcp/media`, Media DCR endpoint
  `/api/mcp/oauth/register/media` and only `media:read`, `media:safe_write`,
  `offline_access`; and
- S256, `token_endpoint_auth_methods_supported: [none]`, authorization code,
  refresh token and authorization-response issuer support on both.

**DETECTED:** two mandated fresh Production DCR clients used the same neutral,
discriminator-free public metadata. Each response carried one exact resource,
the exact three scopes and no secret. Both matching authorize requests returned
303 to staff login; both inverse requests returned HTTP 401 `invalid_target`.
No code, token, consent or refresh grant was created. These acceptance clients
did not modify or bind the existing Commercial client.

**DETECTED:** all ten method-only Commercial/Media probes returned HTTP 405,
`Allow: POST` and `Cache-Control: no-store`. The nine-route read-only Production
smoke returned HTTP 200 throughout. Exact-deployment searches returned no HTTP
500, error, fatal, `P2024`, Prisma initialization, unhandled rejection,
`client_secret`, `access_token` or `refresh_token` log record.

## Rollback

**PROPOSED only if a Production regression appears:** use the normal incident
path to move Production aliases back to immediately prior Ready deployment
`dpl_8c2PSfFWjT8dbk3gv16wTX17RCCW` (main SHA `59b4e2b...`), then confirm both
resources fail safely under their previous discovery behavior. Do not mutate,
union or rebind OAuth clients as part of rollback. Any removal of the two
unconsented acceptance client records requires separate exact Production data
authority.

## Final state

**COMPLETE.** Founder may delete/recreate the failed ChatGPT Media Operations
draft against `https://b4gamble.com/api/mcp/media`. This release does not create
or publish that ChatGPT app.
