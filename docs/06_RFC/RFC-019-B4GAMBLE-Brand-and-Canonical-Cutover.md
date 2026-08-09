# RFC-019: B4GAMBLE Brand and Canonical Cutover

- **Status:** Approved
- **Decision authority:** Founder Office `BRAND-CUTOVER-01` authorization
- **Approved:** 2026-08-09
- **Scope:** Consumer brand replacement and application-level Production canonical-domain readiness
- **Depends on:** Product Vision & Principles v2.0, RFC-007, RFC-013, RFC-017 and RFC-018
- **Supersedes:** Earlier documents only where they present SevenBet as the current consumer trading brand or `sevenbet-next.vercel.app` as the target Production authority

## 1. Decision

The current consumer brand is **B4GAMBLE**. The approved bounded positioning is:

> B4GAMBLE
>
> Know your limits before you play.

The canonical Production domain is `https://b4gamble.com`. Application output continues to derive absolute public URLs from the existing centralized `NEXT_PUBLIC_SITE_URL` contract. Production release therefore requires `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_URL` and `BETTER_AUTH_TRUSTED_ORIGINS` to use the canonical origin before an exact-main redeploy.

The legal entity remains **7BE Inc.** Public legal wording may identify it as `7BE Inc., trading as B4GAMBLE`. The approved address and the working `privacy@7be.io` and `info@7be.io` addresses remain unchanged. The brand change alone does not reset legal consent or version history.

## 2. Product and design boundary

This is a minimal rebrand, not a redesign, new identity system, content rewrite, backend migration or commercial activation. The approved Figma page families, Public Shell, RFC-007 Tilt-Locked direction, FE-DS-01 tokens, responsive contracts and route hierarchy remain the reference lock.

Only the textual wordmark and consumer-visible brand references change. A wordmark-specific size, tracking or maximum-width adjustment is permitted only if rendered desktop or mobile evidence proves it necessary. No Figma, token, shared-component, global-typography or page-composition change is authorised.

The Product Vision remains unchanged. B4GAMBLE continues to provide adult gambling education, private reflection, decision support, personal-boundary planning and transparent comparison. It is not an operator, treatment service, clinical assessment, guarantee of control, safety certification or source of gambling-readiness claims.

## 3. Reference classification and replacement rule

Every meaningful `SevenBet`, `Seven Bet`, `SEVENBET` or `sevenbet` occurrence must be classified before replacement:

| Class | Treatment in this workstream |
| --- | --- |
| `PUBLIC_CONSUMER_BRAND` | Replace with exact `B4GAMBLE`. |
| `PUBLIC_LEGAL_BRAND` | Replace the trading brand; preserve 7BE Inc., address and working contact addresses. |
| `PUBLIC_AUTH_OR_COMMUNICATION_COPY` | Replace visible consumer identity; preserve auth and delivery architecture. |
| `INTERNAL_IMPLEMENTATION_IDENTIFIER` | Preserve unless it leaks into public output or prevents correct brand behaviour. |
| `LEGACY_COMPATIBILITY_IDENTIFIER` | Preserve. |
| `HISTORICAL_DOC_RFC_HANDOFF` | Preserve as historically truthful unless the document controls a future operational action. |
| `TEST_EXPECTATION` | Update only when it asserts changed public behaviour; retain compatibility assertions. |

Repository, Vercel project, Prisma schema, routes, migrations, cookies, storage keys, Programme subject keys, `SEVENBET_*` environment variables, `x-sevenbet-*` headers, internal fixture IDs and internal code symbols remain unchanged solely for compatibility and bounded scope.

## 4. Public and legal identity contract

Public Shell, protected Help, Programme, authentication, discovery, comparison, editorial, legal, error and unavailable states use `B4GAMBLE`. The accessible home label is `B4GAMBLE home`. The textual wordmark uses the existing visual treatment.

Root metadata uses:

- default title: `B4GAMBLE | Know your limits before you play`;
- description: `Educational tools, private self-checks and transparent casino comparison to help adults understand risks and set personal limits before they play.`;
- OpenGraph site name and Organization name: `B4GAMBLE`.

Page-specific titles remain page-specific and replace only the old consumer-brand suffix. Public legal surfaces use the new trading brand where the trading name is presented. Approved safety, commercial and fixture disclosures remain substantively unchanged.

## 5. Canonical and environment contract

`lib/site.ts` remains the single public absolute-URL authority. Metadata, canonical links, OpenGraph URLs, structured data, sitemap and robots output must resolve beneath its configured origin. No page-by-page B4GAMBLE hardcoding is authorised.

Production-only target values are:

```text
NEXT_PUBLIC_SITE_URL=https://b4gamble.com
BETTER_AUTH_URL=https://b4gamble.com
BETTER_AUTH_TRUSTED_ORIGINS=https://b4gamble.com
```

Preview retains its stable branch host, isolated auth/DB authority and exact dynamic allowed-host contract. Google OAuth remains externally inactive. Current operational documentation must use `https://b4gamble.com/api/auth/callback/google` as the future Production callback while keeping Preview and local callbacks isolated.

The legacy Vercel production alias must at minimum emit canonical URLs for `b4gamble.com` after the Production environment cutover. A project/domain-level redirect may be configured separately only if it does not affect Preview or generated deployment hosts.

## 6. Auth and communication contract

Better Auth's consumer `appName` becomes `B4GAMBLE`. Existing Google identity scopes, account linking, Programme continuation, age enforcement, protected Help access and subject isolation remain unchanged. No OAuth client, credential, trusted-origin broadening or external activation is authorised.

The fixed account-security, user-requested Programme-reminder and Programme-engagement templates use `B4GAMBLE`. The provider-independent transport remains disabled and `COMMERCIAL_MARKETING` remains denied. Existing `SEVENBET_*` sender environment variable names and working mailboxes remain unchanged; no provider, mailbox, MX, SPF, DKIM or DMARC change is authorised.

## 7. Safety and architecture invariants

- No Prisma schema change, migration, seed or Production data mutation.
- No new or renamed API, route, cookie, protocol or storage key.
- No Mission order, prerequisite, reward, achievement, progress or completion change.
- No client calculation of Programme authority.
- No weakening of protected Help or commercial/safety-data separation.
- No change to GB eligibility, partner authority, ranking, Editor Score, fixture authority or redirect policy.
- `editorialAllowed = true`, `commercialAllowed = false`, `referralAllowed = false`, affiliate redirect engine off.
- No synthetic Production record or fixture-to-real conversion.

## 8. Verification and release

Automated evidence must cover the public shell at desktop and mobile widths, footer, legal identity, auth identity, communication templates, root metadata/schema, representative route canonical, sitemap, robots and intentionally retained compatibility identifiers. A Production-style build uses `NEXT_PUBLIC_SITE_URL=https://b4gamble.com`.

Manual desktop and mobile QA must confirm no wordmark overflow or layout regression across the authorised route sample. Exact-head CI, Preview deployment and Vercel checks must pass before Founder merge review. This RFC does not authorise merge, Production environment mutation, Google activation, email delivery or commercial activation.

Post-merge release is an ordered Founder-controlled operation: merge by merge commit, set/verify the three Production values, redeploy exact merged main, then verify apex, `www` redirect, canonical, Organization schema, OpenGraph, robots, sitemap, Better Auth session behaviour, safe account smoke, legacy-host behaviour and runtime errors.
