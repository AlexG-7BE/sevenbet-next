# B4GAMBLE Commercial Ops — ChatGPT Work MCP setup

Production currently runs the bounded Commercial CRM custom MCP app on Better Auth 1.7.1. This runbook records the connection contract, the detected 15-minute refresh regression, and the controlled promotion/acceptance procedure for its repository fix. It does not authorise merge, deployment, database mutation, environment mutation or Commercial CRM writes.

## Exact connection values

| Field | Value |
| --- | --- |
| App name | `B4GAMBLE Commercial Ops` |
| MCP server URL | `https://b4gamble.com/api/mcp/commercial` |
| Transport | MCP Streamable HTTP (stateless) |
| Authentication | OAuth 2.1 authorization code with PKCE S256 |
| Scopes | `commercial:read commercial:safe_write offline_access` |
| Client registration | ChatGPT public-client Dynamic Client Registration (DCR) |
| OAuth provider | `better-auth` `1.7.1` + `@better-auth/core` `1.7.1` + `@better-auth/oauth-provider` `1.7.1` |

ChatGPT supports both Client ID Metadata Documents (CIMD) and DCR. OpenAI now prefers CIMD where the authorization server supports it, but continues to support DCR. This coordinated upgrade retains the existing bounded DCR route because it is already constrained and tested, while a CIMD change would introduce a second client-identification architecture beyond this dependency/schema upgrade. DCR remains explicitly enabled, callback-allowlisted and public, with no client secret or client-credentials grant. Any later CIMD adoption needs a separate review. Do not enter or paste an API key, shared secret, OAuth credential, legacy Preview token or manually invented OAuth endpoint into ChatGPT. Discovery supplies the authorization, registration, token and revocation endpoints from the MCP URL.

DCR creates only a zero-authority public-client record. Commercial access exists only after PKCE S256 authorization, an authenticated `User` linked to `AdminUser`, live `affiliate.manage`, explicit consent and a granted Commercial scope.

## Refresh lifecycle contract

**DETECTED:** the Production authorization-server document advertises `offline_access`, but the protected-resource document currently advertises only the two Commercial scopes. The authorization wrapper preserves the client's requested scopes. Better Auth 1.7.1 returns `expires_in` for the 15-minute access token and issues/persists a refresh token only when the authorized scope set contains `offline_access`.

**INFERRED ROOT CAUSE:** ChatGPT's resource-driven grant did not contain `offline_access`, so it received no usable refresh state. Production therefore returned 401 after access-token expiry without first receiving a refresh-token request.

The repair advertises the complete bounded authorization scope set—`commercial:read commercial:safe_write offline_access`—in both discovery documents. Authorization without `offline_access` still does not receive a refresh token; the server does not silently add the scope inside an authorization request.

Authorization-code token exchange continues to require `resource` and exact equality with `https://b4gamble.com/api/mcp/commercial`. Refresh exchange accepts an omitted `resource` only after the stored refresh row is proven to contain exactly that resource and the registered client metadata, live provider session, delegated staff link and current `affiliate.manage` permission all pass. If refresh supplies `resource`, it must match exactly. Production and Preview clients/tokens are never interchangeable.

Refresh tokens rotate with a zero reuse interval. Replay invalidates the token family as before. An expired provider session, removed/unprivileged staff identity or disabled client cannot refresh into Commercial access. No token, refresh token, authorization code, verifier, cookie or session identifier is logged.

## Controlled Production refresh-fix procedure

**PROPOSED — REQUIRES SEPARATE FOUNDER PROMOTION APPROVAL:** this procedure contains no migration or environment change. Do not execute it from this implementation task.

### Phase 0 — precheck

Record the exact reviewed PR head, current `main` SHA, current Production deployment SHA and rollback deployment. Capture both public discovery documents and confirm the only intended metadata delta is `offline_access` in protected-resource `scopes_supported`. Confirm the diff contains no Prisma schema/migration, dependency, token-TTL, environment, tool, CRM authority, consent-origin, redirect or PKCE change.

### Phase 1 — required evidence

Require green exact-head MCP unit/structural, disposable PostgreSQL lifecycle, TypeScript, ESLint, build and browser evidence. The PostgreSQL suite must prove an offline grant returns `refresh_token` plus `expires_in`, a non-offline grant does not, missing-resource refresh succeeds only from exact stored binding, wrong client/resource/environment fails, staff/session/client checks remain live, rotation succeeds and replay fails.

### Phase 2 — Preview when safely available

Use Preview only if its isolated database, Preview-specific OAuth resource/client and branch host are already verified. Never reuse the Production DCR client. Create a temporary ChatGPT app for the Preview MCP URL, authenticate normally, confirm a refresh-token POST and continued MCP 200s beyond expiry, then disconnect it. If safe Preview connectivity is unavailable, record `NOT PERFORMED` and use Phase 5 as the required live acceptance; do not fake interoperability evidence.

### Phase 3 — promote exact code

After explicit Founder approval, merge only through the protected PR path and let Vercel promote that exact merge SHA. Do not change Production environment variables or run a database command. Confirm the deployment is READY, serves the expected SHA, and ordinary consumer/Admin/Programme auth still works.

### Phase 4 — refresh client metadata

The existing `B4GAMBLE Commercial Ops` connection cannot be accepted as-is because its prior grant lacks offline refresh state and protected-resource metadata changed. Disconnect it. For deterministic acceptance, recreate the Custom App with the same name and MCP URL, rescan exactly four tools, then complete one normal Founder authorization. A simple reconnect is acceptable only if ChatGPT demonstrably refetches the updated metadata and requests `offline_access`; otherwise recreate.

### Phase 5 — live >15-minute acceptance

Confirm initial authorization/token exchange is 200 and ordinary Commercial MCP calls are 200. Without recording credential values, verify initial issuance reports `offlineAccessRequested=true`, `refreshTokenIssued=true`, the exact requested scope names and normal expiry metadata. Wait beyond 15 minutes. Observe `POST /api/mcp/oauth/token` with `grantType=refresh_token` and HTTP 200, then confirm subsequent `/api/mcp/commercial` requests remain 200 with no reconnect prompt. Continue observation for at least 30 minutes total and verify no unexpected auth/security errors.

### Phase 6 — rollback

If discovery, auth, refresh or resource calls regress, disconnect the test app and redeploy the recorded pre-change Production deployment/SHA through the normal Vercel rollback path. Do not reverse a database migration because this fix has none. Recheck ordinary auth and the four-tool fail-closed boundary after rollback. The previous user-visible state may again require manual reconnect every 15 minutes, so leave the incident open rather than declaring rollback a refresh fix.

## Create the ChatGPT custom app

Current official OpenAI flow (verified 2026-08-21):

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

The coordinated stable line is `better-auth` `1.7.1`, `@better-auth/core` `1.7.1` and `@better-auth/oauth-provider` `1.7.1`. Version 1.7 replaces `validAudiences` with provider-owned protected-resource, client-resource, authorization-code, token and consent bindings. `GHSA-p2fr-6hmx-4528` affects versions before `1.7.0-beta.4`; this stable line contains the fix. Under the newer `MEDIA-INGESTION-AUTOPLACEMENT-01` Founder authority, B4GAMBLE configures two separate protected resources: this Commercial resource and the [Media Operations resource](../05_Engineering/Media-Ingestion-Contract.md). Each DCR client, authorization code, access token, refresh token and consent remains bound to exactly one resource. Never reuse a client or grant across the two resources or across Production and Preview.

## Authority summary

The app may read Commercial CRM and persist bounded research bundles. It cannot approve, set `ACTIVE`, send email, submit applications, accept/confirm terms, activate tracking/programmes/offers, change jurisdiction, deploy, administer Production, or read Programme/private/help/vulnerability data. RFC-015 remains the independent activation authority.
