# B4GAMBLE Commercial Ops — ChatGPT Work MCP setup

This runbook connects the Production Commercial CRM custom MCP app after the bridge PR is merged, migration `0021_partner_ops_work_bridge_01` is explicitly authorised/applied, and the feature flag is enabled.

## Exact connection values

| Field | Value |
| --- | --- |
| App name | `B4GAMBLE Commercial Ops` |
| MCP server URL | `https://b4gamble.com/api/mcp/commercial` |
| Transport | MCP Streamable HTTP (stateless) |
| Authentication | OAuth 2.1 authorization code with PKCE S256 |
| Scopes | `commercial:read commercial:safe_write offline_access` |
| Client registration | ChatGPT public-client Dynamic Client Registration (DCR) |
| OAuth provider | Better Auth `1.6.30` + `@better-auth/oauth-provider` `1.6.30` |

ChatGPT supports both Client ID Metadata Documents (CIMD) and DCR. This implementation currently uses DCR, with callback allowlisting and a public client that has no client secret. Do not enter or paste an API key, shared secret, OAuth credential, legacy Preview token or manually invented OAuth endpoint into ChatGPT. Discovery supplies the authorization, registration, token and revocation endpoints from the MCP URL.

DCR creates only a zero-authority public-client record. Commercial access exists only after PKCE S256 authorization, an authenticated `User` linked to `AdminUser`, live `affiliate.manage`, explicit consent and a granted Commercial scope.

## Release prerequisites

1. Review and merge the implementation PR.
2. Obtain a separate Founder GO for the additive Production migration.
3. Apply `0021_partner_ops_work_bridge_01` through the normal migration process. Do not use `prisma migrate reset`.
4. Configure `COMMERCIAL_MCP_ENABLED=true` in Production through the normal controlled environment process, then deploy. `COMMERCIAL_MCP_PUBLIC_ORIGIN` is optional in Production because the canonical origin is fixed to `https://b4gamble.com`; if set, it must be exactly that HTTPS origin.
5. Confirm `GET https://b4gamble.com/.well-known/oauth-authorization-server` and `GET https://b4gamble.com/.well-known/oauth-protected-resource/api/mcp/commercial` return metadata. A disabled/unconfigured bridge returns `503` by design.

## Create the ChatGPT custom app

Current official OpenAI flow (verified 2026-08-20):

1. As a ChatGPT Workspace owner/admin, open **Workspace Settings → Apps & Connectors → Advanced settings** and enable **Developer mode** if the workspace does not already allow custom MCP apps.
2. Return to **Apps & Connectors** and choose **Create** (or **Create custom app**).
3. Enter app name `B4GAMBLE Commercial Ops`.
4. Enter MCP server URL `https://b4gamble.com/api/mcp/commercial`.
5. Select OAuth authentication if ChatGPT asks for the authentication type. Do not supply client credentials; DCR and discovery provide the client configuration.
6. Save, then choose **Scan tools** or **Refresh tools**.
7. Confirm exactly these four tools are shown:
   - `commercial_list_opportunities`
   - `commercial_get_opportunity`
   - `commercial_find_possible_duplicates`
   - `commercial_upsert_research_bundle`
8. Enable the app for the intended workspace/users under the workspace’s normal app policy.

OpenAI references: [Build an MCP server](https://developers.openai.com/plugins/build/mcp-server), [Authentication](https://developers.openai.com/plugins/build/auth), and [Connect from ChatGPT](https://developers.openai.com/plugins/deploy/connect-chatgpt).

## Expected sign-in and consent

1. ChatGPT redirects to B4GAMBLE’s dedicated staff sign-in page.
2. Sign in with a Better Auth user linked to an `AdminUser` whose role includes `affiliate.manage` (for example `AFFILIATE_MANAGER`, `ADMIN` or `SUPER_ADMIN`).
3. An ordinary consumer account is denied. A staff account without `affiliate.manage` is denied.
4. Review the consent card. It lists read, bounded safe-write and optional offline access separately, plus the authority that is not granted.
5. Choose **Authorize access**. ChatGPT receives a short-lived token and, when `offline_access` is requested, a rotating refresh token.
6. Back in ChatGPT, confirm the app shows **Connected** and its tool scan still lists exactly four tools.

## Connection smoke

In a new Work conversation where the app is enabled:

1. Ask it to list at most five Commercial opportunities. Confirm the result contains bounded CRM fields and no unrelated user/Programme data.
2. Ask it to find possible duplicates for a known organisation name.
3. Before any write smoke, use a deliberately named non-Production/Preview fixture only. Production must never receive synthetic prospects. For a real Production write, research a legitimate prospect, cite bounded evidence and use a stable run/child idempotency key.
4. Re-run the same real bundle once. Confirm the response reports an idempotent replay and no duplicate children.
5. Confirm `/admin/commercial` shows the staff-delegated Agent run/audit truth and that the CRM stage did not become `APPROVED` or `ACTIVE`.

## Revoke access

1. In ChatGPT **Settings / Workspace Settings → Apps & Connectors**, open `B4GAMBLE Commercial Ops` and choose **Disconnect** for the connection/user.
2. The authorization-server metadata advertises `https://b4gamble.com/api/mcp/oauth/revoke`; a conforming client can revoke either access or refresh token. Access-token revocation deletes its protected provider row; refresh-token revocation marks the provider row revoked and removes linked access tokens. No token detail is returned.
3. If an integration client must be disabled administratively, a controlled database operator may set the relevant `oauthClient.disabled` flag or remove its provider records under a separately authorised operational change. The first bridge intentionally adds no general OAuth-client Admin UI.
4. Revoking/disabling MCP access does not change the staff password or ordinary B4GAMBLE sessions.

## Troubleshooting

| Symptom | Meaning / action |
| --- | --- |
| MCP URL returns `503` | Feature flag or canonical MCP configuration is absent. Keep it closed; complete release prerequisites. |
| ChatGPT cannot register | Confirm the callback is a current `chatgpt.com` connector callback and DCR is reaching `/api/mcp/oauth/register`; registration is rate-limited. |
| Login succeeds but access is denied | The user is not linked to `AdminUser`, or the staff role lacks `affiliate.manage`. Do not convert a consumer account implicitly. |
| `invalid_target` / wrong resource | Use exactly `https://b4gamble.com/api/mcp/commercial`; do not reuse a client registered to another host/Preview. |
| `insufficient_scope` | Reconnect and grant the requested `commercial:read` or `commercial:safe_write` scope. Read-only tokens cannot write. |
| Token expires during work | ChatGPT should use the rotating refresh token. If refresh is unavailable/revoked, reconnect and consent again. |
| Write returns `POSSIBLE_DUPLICATE` | Review the candidates. Supply the exact existing opportunity ID to update, or an explicit `possibleDuplicateOfId` to preserve uncertainty; never force a silent merge. |
| Evidence is rejected | Public web needs `observedAt`; every evidence item needs URL/reference and claim; source authority cannot be supplied; received terms need direct DETECTED evidence. |
| Tool scan shows more/fewer than four tools | Do not enable the app. Refresh once, then verify the deployed SHA and MCP endpoint configuration. |

## Token storage and stable-line security note

The provider issues opaque tokens. It stores access tokens and refresh tokens only through its supported SHA-256/base64url protected-storage hook; the reusable values returned to ChatGPT are never stored in database fields or audit/log metadata. Authorization codes use the same protected provider storage. Every MCP request resolves the protected token record, expiry, live session, exact client/resource metadata, granted scope and current staff permission. Refresh rotation/replay handling and revocation are provider-owned.

The current authorised dependency line is the latest stable Better Auth 1.6 release, `1.6.30`; 1.7 beta, RC and stable packages are out of scope. GitHub advisory `GHSA-p2fr-6hmx-4528` remains reported against `@better-auth/oauth-provider` 1.6.30 because that line does not fully bind multi-resource authorization requests. This bridge contains that upstream limitation with exactly one configured `validAudiences` value, an exact public `resource` check at authorization/token/revocation, client metadata bound to that same resource, opaque rather than self-contained access tokens, and a resource check on every use. Do not add another audience or reuse a DCR client across Production and Preview. Reassess the advisory before any later Better Auth upgrade or multi-resource design.

## Authority summary

The app may read Commercial CRM and persist bounded research bundles. It cannot approve, set `ACTIVE`, send email, submit applications, accept/confirm terms, activate tracking/programmes/offers, change jurisdiction, deploy, administer Production, or read Programme/private/help/vulnerability data. RFC-015 remains the independent activation authority.
