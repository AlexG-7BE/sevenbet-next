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
`SUPER_ADMIN` is linked to one Better Auth `User`; the account has both
credential and Google provider relationships and is not Google-only. No email,
user identifier, provider token, session token or credential was returned.
External Google/Workspace MFA enforcement could not be proved.

## Official Better Auth 1.7.1 TOTP

**DETECTED:** the exact installed Better Auth 1.7.1 `twoFactor` plugin owns TOTP,
secret encryption, encrypted backup codes, verification challenges, five
attempts per challenge, account-level consecutive-failure lockout and
single-use backup-code consumption. Application code does not implement a TOTP
algorithm or create a second session system.

The client always sends `trustDevice: false`; server configuration sets
`trustDeviceMaxAge: 0`, so a caller cannot establish persistent trusted-device
authority. Email OTP and self-service MFA disable are disabled. Enrollment
requires the current credential password, shows the authenticator setup key and
provider-generated backup codes only in local component state, requires a
successful TOTP verification, then revokes all pre-enrollment sessions.

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

**LIVE VERCEL CONTROL-PLANE EVIDENCE:** Vercel Firewall active configuration
version 3 is enabled with three valid IP-keyed fixed-window rules. The existing
contact rule is unchanged at 5 POST requests per 600 seconds. Two added rules
bound public auth entry/recovery and second-factor verification to 10 POST
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
   is redirected to `/admin/security/enroll`, stores the one-time backup codes,
   enters the current authenticator code and continues to Admin.
5. Do not transmit the setup key, provisioning URI, code or backup codes in
   chat, email, logs, tickets or analytics.

Until the Founder completes step 4, the safe release status is
`P1 ADMIN/AUTH SECURITY READY FOR FOUNDER MFA ENROLLMENT`, not closed.
