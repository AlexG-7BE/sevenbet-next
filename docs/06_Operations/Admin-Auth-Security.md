# P1 Admin/Auth Security

**Authority:** explicit Founder Office P1 Admin/Auth Security instruction

**Evidence date:** 15 September 2026
**Scope:** privileged Admin MFA and distributed public-auth abuse protection

## Existing authority preserved

**DETECTED:** Better Auth identity/session remains canonical. A session gains
staff meaning only through the existing one-to-one `AdminUser.userId` link, and
the existing server permission matrix continues to authorize every Admin page
and API. TOTP is an additional authentication condition, not a business role or
second Admin authority.

**DETECTED BY BOUNDED READ-ONLY PRODUCTION AGGREGATE:** one current
`SUPER_ADMIN` is linked to one Better Auth `User`; one provider-owned factor is
present and verified, the linked User has two-factor enabled, and no factor
failure or active lock is present. No Google OAuth access token, refresh token,
ID token, expiry or scope material is persisted. No email, user identifier,
factor secret, backup code, session token or credential was returned.

## Official Better Auth 1.7.1 TOTP

**DETECTED:** the exact installed Better Auth 1.7.1 `twoFactor` plugin owns TOTP,
secret encryption, encrypted backup codes, verification challenges, five
attempts per challenge, account-level consecutive-failure lockout and
single-use backup-code consumption. Application code does not implement a TOTP
algorithm or create a second session system.

The client always sends `trustDevice: false`; server configuration sets
`trustDeviceMaxAge: 0`, so a caller cannot establish persistent trusted-device
authority. Email OTP and self-service MFA disable are disabled. Enrollment
requires the current credential password, renders a local QR code from the exact
provider-issued `otpauth://` URI, retains the URI's Base32 setup key as a manual
fallback and shows provider-generated backup codes only in local component
state. No remote QR service receives the URI. A successful TOTP verification is
still required before all pre-enrollment sessions are revoked.

Admin session creation is fail-closed. For a linked `AdminUser`, the only
permitted creation paths are:

- `/sign-in/email` (the temporary pre-challenge session Better Auth consumes);
- `/two-factor/verify-totp`; and
- `/two-factor/verify-backup-code`.

Google/social callback, verification auto-sign-in and future passwordless paths
cannot create an Admin session. Google remains unchanged for public users.
Existing unverified Admin sessions can reach only the enrollment page; the
central guard denies all privileged Admin pages/APIs until
`twoFactorEnabled === true`.

## Production enrollment incident and interoperability repair

**DETECTED, 15 September 2026:** the canonical Production deployment recorded
one successful `/api/auth/two-factor/enable` at `14:09:23Z`, followed by three
unique `/api/auth/two-factor/verify-totp` responses at `14:11:51Z`,
`14:12:06Z` and `14:12:38Z`. All three were HTTP `401`; none was `429` or 5xx,
and the final request reached the serverless application. The same-origin
Better Auth 1.7.1 client includes credentials, the successful enable request
required the authenticated Admin session and no successful-code session
rotation occurred between enable and verification. In the exact installed
verification path, that authenticated enrollment state plus HTTP `401`
classifies the rejection as `INVALID_CODE`, not a session/cookie or custom-hook
failure.

**DETECTED BY DATABASE-ENFORCED READ-ONLY PRODUCTION QUERY:** the single linked
Admin factor remained present with `verified=false`, the User remained
`twoFactorEnabled=false`, the account-level consecutive-failure count remained
zero and `lockedUntil` remained null. This is expected for failed first
enrollment checks, which use the authenticated session rather than the
post-password five-attempt challenge. No credential, factor secret, backup
code, submitted code, email, identifier or session token was returned.

**DETECTED:** Production database time was within the bounded query latency of
the client clock and the canonical Vercel HTTP `Date` value was within one
second of the request midpoint. TOTP uses Unix time; no material server skew was
present. The displayed Production key was 52 Base32 characters, contained no
whitespace, matched its rendered DOM text and was fully present in layout.

**DETECTED BY INDEPENDENT REGRESSION:** a dependency-free Node `crypto`
implementation decodes the URI Base32 secret, applies RFC 6238 with HMAC-SHA1,
six digits and a 30-second period, and successfully completes enrollment through
the exact Better Auth 1.7.1 `/two-factor/verify-totp` endpoint. The adjacent
window is accepted; incorrect and replaced-pending-secret codes fail with
`INVALID_CODE`; the pending factor cannot authenticate; session rotation,
single-use encrypted backup codes and fail-closed Admin authorization remain
covered.

Better Auth 1.7.1 replaces the pending secret and backup codes whenever
`enableTwoFactor` is called again. The incident deployment recorded only one
enable call, so replacement did not cause these three Production failures. The
regression nevertheless locks the behavior: a code from an earlier pending URI
cannot activate the replacement. Enrollment error copy now distinguishes a
current-code mismatch, an expired/invalid session and temporary limiting
without exposing internal values or weakening verification.

## Provider-owned persistence only

**DETECTED / GENERATED FROM EXACT 1.7.1 PACKAGE:** migration `0042_admin_mfa`
adds only:

- nullable `User.twoFactorEnabled Boolean? @default(false)`;
- `TwoFactor.id`;
- encrypted `TwoFactor.secret`;
- encrypted `TwoFactor.backupCodes`;
- `TwoFactor.userId` and its cascade relation/index;
- nullable `TwoFactor.verified @default(true)`;
- nullable `TwoFactor.failedVerificationCount @default(0)`;
- nullable `TwoFactor.lockedUntil`; and
- the provider secret index.

No `AdminMfa`, `StaffMfa`, alternate User/Admin/session model, Redis service or
rate-limit table exists. No Programme persistence is read or reused.

## Distributed auth abuse boundary

**LIVE VERCEL CONTROL-PLANE EVIDENCE, 15 September 2026:** Vercel Firewall is
enabled with four active rules and no inactive or draft rule. The existing
contact rule remains at 5 POST requests per 600 seconds, and the independent
outbound `/r/*` rule remains at 60 GET/HEAD requests per 60 seconds. Two auth
rules bound public auth entry/recovery and second-factor verification to 10 POST
requests per 600 seconds per source IP:

- `auth-entry-rate-limit`: exact email sign-in, email signup, password-reset
  request, password reset and verification-email paths;
- `auth-second-factor-rate-limit`: exact TOTP and backup-code verification
  paths.

Better Auth's instance-local memory limiter is explicitly disabled so it is not
mistaken for distributed authority. Better Auth's provider challenge-attempt
and account-lockout controls remain authentication semantics, not another
public rate-limit architecture. Firewall rule conditions contain only path,
method and IP key; no email or account identifier is configured.

## Release and operator procedure

1. Apply the additive migration through normal `prisma migrate deploy` from the
   reviewed exact PR head before application cutover.
2. Merge only after exact-head migration, auth, browser, quality, build and
   required GitHub checks pass.
3. Verify canonical Production deployment SHA, anonymous Admin denial, public
   auth availability, active Firewall version and absence of auth-related 5xx.
4. Founder signs in at `/admin/login` with the existing credential password,
   is redirected to `/admin/security/enroll`, scans the current local QR code
   (or uses its exact manual key), stores the one-time backup codes, enters one
   current authenticator code and continues to Admin.
5. Do not transmit the setup key, provisioning URI, code or backup codes in
   chat, email, logs, tickets or analytics.

**VERIFIED CLOSED, 15 September 2026:** Founder/Admin MFA is enrolled and the
bounded Production aggregate proves one linked privileged Admin, one verified
factor and enabled two-factor state. The anonymous `/admin` boundary redirects
to login, the retired preview-token bypass remains denied, and the exact source
commit's auth regression suite and required CI contexts are green.
