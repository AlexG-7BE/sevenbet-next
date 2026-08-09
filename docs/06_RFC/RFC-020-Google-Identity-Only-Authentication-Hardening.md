# RFC-020: Google Identity-Only Authentication Hardening

- **Status:** Approved
- **Decision authority:** Founder Office `AUTH-HARDEN-01` authorization
- **Approved:** 2026-08-09
- **Scope:** Durable Google credential minimisation, Better Auth HTTP capability containment and public sign-out
- **Depends on:** RFC-017, RFC-018 and RFC-019
- **Supersedes:** RFC-018 only where it permits durable Google OAuth token/scope storage or leaves explicit provider-linking and provider-token HTTP capabilities available

## 1. Decision

B4GAMBLE continues to use the installed Better Auth Google provider only for
identity authentication through the server-side authorization-code redirect
flow. The application does not consume Google APIs and therefore does not need
durable Google access tokens, refresh tokens, ID tokens, token expiry metadata
or granted-scope metadata.

Google OAuth credentials may exist transiently in server memory while Better
Auth validates the callback and resolves the provider identity. Before an
account write reaches Prisma, supported Better Auth account database hooks must
replace all durable OAuth credential fields with `null`. The retained Google
account relationship is limited to the normal Better Auth row identity,
including the local user ID, provider ID and immutable Google account ID.

Better Auth remains at `1.6.23`. No dependency upgrade, package-lock change,
schema change or migration is authorised.

## 2. Evidence and installed-version finding

### Detected

- Better Auth `1.6.23` encrypts `accessToken` and `refreshToken` when
  `account.encryptOAuthTokens` is enabled, but its OAuth account create/update
  flow passes `idToken` to persistence without that encryption helper.
- The supported `databaseHooks.account.create.before` and
  `databaseHooks.account.update.before` extension points run before adapter
  writes in the installed release.
- An account update hook receives the partial update payload rather than the
  stored account row. OAuth token-field updates are distinguishable from
  credential password updates; password updates contain no OAuth material.
- `disabledPaths` rejects exact normalized Better Auth paths before their
  endpoint capability executes.
- The installed Google provider supports `disableIdTokenSignIn`; it affects
  client-supplied ID-token authentication, not the authorization-code callback.
- The public Programme surface has no authenticated sign-out control.

### Inferred

- With Google as the only configured social provider, stripping every
  OAuth-material update payload is a narrower and safer boundary than trying to
  recover provider identity from undocumented hook context. Credential account
  password writes remain unchanged.
- Disabling account token refresh/update on returning sign-in avoids an
  unnecessary durable write. Account lookup and session creation continue from
  the retained provider relationship.

### Planned

- Real Google authorization-code E2E remains part of the separate
  `GOOGLE-OAUTH-ACTIVATE-01` Preview activation after this hardening is merged.

### Not detected

- No repository or environment evidence proves active Google credentials, a
  live Google sign-in, durable Google API use or a product requirement for
  explicit provider linking/token retrieval.

## 3. Persistent Google account policy

For Google account create and OAuth-material update writes, the application
sets these fields to `null` before the adapter call:

- `accessToken`;
- `refreshToken`;
- `idToken`;
- `accessTokenExpiresAt`;
- `refreshTokenExpiresAt`; and
- `scope`.

The hook preserves provider/account identity, local ownership, normal row
identifiers and timestamps. Credential accounts preserve `password` unchanged.
Both create and update hooks are required so a returning authentication or
another internal Better Auth write cannot repopulate credential material.

`account.updateAccountOnSignIn` is disabled because B4GAMBLE does not need a
provider-token refresh write. The database hooks remain the security boundary
for any applicable account write and do not rely on that optimization.

`account.encryptOAuthTokens` remains enabled as defence in depth for any
unexpected path, but encryption is not the approved Google persistence policy:
the approved values are absent/`null`.

## 4. Better Auth HTTP perimeter

The following installed Better Auth paths are disabled because the current
product has no approved provider-management or Google API use case:

| Path | State | Reason |
| --- | --- | --- |
| `/link-social` | Disabled | Prevent explicit provider linking, caller-selected scopes and client-submitted provider tokens. |
| `/get-access-token` | Disabled | Prevent provider credential retrieval. |
| `/refresh-token` | Disabled | Prevent provider token refresh and durable refresh writes. |
| `/account-info` | Disabled | Prevent provider account-info retrieval through stored OAuth credentials. |

The following required identity/session paths remain enabled:

- `/sign-in/email`;
- `/sign-up/email`;
- `/sign-in/social`;
- `/callback/google`;
- `/get-session`; and
- `/sign-out`.

This decision does not disable implicit same-email linking performed during a
legitimate Google sign-in. It disables only the explicit `/link-social`
account-management API. Existing linking controls remain: a verified local
email is required, different-email linking and unlinking the final method are
denied, provider profile data does not overwrite the local account, and no
provider is trusted merely to bypass verification.

## 5. Direct ID-token sign-in

Client-supplied Google ID-token sign-in is disabled in the provider
configuration. B4GAMBLE does not use Google One Tap, a native Google SDK, a
mobile token bridge or another client-token flow. The normal server-side
authorization-code redirect and `/api/auth/callback/google` remain enabled.

## 6. Sign-out and Programme privacy

The authenticated Programme header exposes the smallest existing-style sign-out
control through Better Auth's client `signOut` API. A successful sign-out starts
a fresh anonymous Programme journey before returning to `/program`. It does not
delete the user's account-scoped local Programme namespace and does not attempt
to sign the person out of their global Google session.

The existing subject-isolation, claim, age, Protected Help and commercial
firewall rules remain unchanged. Google identity is not age proof, Programme or
marketing consent, staff authority or commercial-personalisation input.

## 7. Verification and rollout

Automated evidence must cover account create and update sanitization, credential
password preservation, returning account/session continuity, direct ID-token
denial, disabled paths, required-path availability, incomplete configuration,
age enforcement, Programme subject isolation and commercial policy. Repository
quality, Prisma validation, production build, secret scan and browser regression
gates must pass.

This RFC authorises only the repository hardening pull request. It does not
authorise Google Cloud changes, credentials, Preview or Production activation,
email delivery, commercial activation or merge. Founder Office performs the
merge decision separately.
