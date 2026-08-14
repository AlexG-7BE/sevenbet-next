# PUBLIC-IA-AND-HARDENING-01 Implementation Evidence

- **Status:** implementation and bounded verification complete in unmerged Draft PR #74; Production unchanged
- **Authority:** RFC-033, approved 2026-08-14
- **Branch:** `codex/public-ia-and-hardening-01`
- **Base main:** `1d160b94481c7f8915619ef2254c7c2e66ab3209`
- **Runtime-tested head:** `3042650ffe6785aa23d7600e1ec9348e7bf1208a`
- **Runtime-tested Preview:** `dpl_HSr19yfu1hmRmrYzMmdPaMqiUJRN`, Ready, immutable `https://sevenbet-next-l4ea1zvjf-alexg-7bes-projects.vercel.app`

This record follows the runtime-tested head and therefore receives a later documentation-only SHA. It records branch evidence, not current-main or Production implementation.

## Executive result

**Detected:** the RFC-033 public information architecture, article-authority, nonce CSP and direct-media remediations are implemented and verified on the exact Draft-PR Preview. No unresolved critical or major defect was found. The branch is **GO FOR FOUNDER MERGE DECISION**; Ready state, merge and Production deployment require separate Founder action.

**Detected:** no Production deployment, environment variable, secret, database, DNS, OAuth, OpenAI, commercial capability, reward, achievement, Mission or protected-data contract changed.

## Public route and discovery result

| User purpose | Canonical route | Shell/authority | Shortest public-shell path |
| --- | --- | --- | --- |
| Understand available control and support paths | `/responsible-gambling` | Public Shell hub | Home → footer **Responsible gambling**: one link |
| Read responsible-gambling education | `/learn/responsible-gambling` | Public Learn category | Hub → **Learn the patterns**: one link |
| Complete the private Self-Check | `/self-check` | Public Shell, browser-local state | Home → footer **Self-Check**: one link |
| Use the Personal Limit Tracker | `/tools/budget-calculator` | Public Shell, browser-local state | Home → footer **Personal Limit Tracker**: one link |
| Seek immediate support | `/help` and `/help/<slug>` | Protected Help Shell | Home → header or footer **Help**: one link |
| Start or continue the Programme | `/10-steps` and `/program` | Public entry and authenticated Programme | Hub → **Explore the 10 Steps**: one link |

- **Detected:** the header Help action now targets `/help`; the shared footer owns a `Control & Support` group with all four direct destinations.
- **Detected:** `/responsible-gambling` is the public hub and does not redirect. Known former guide paths return permanent `308` redirects to `/help/<slug>`; unknown former guide paths return `404`.
- **Detected:** Help remains visually exceptional and noncommercial. The education, Self-Check, Limit Tracker and Programme paths have equal visual weight and do not imply a universally correct choice.
- **Detected:** the Learn category is distinct from both the broader navigation hub and immediate Help, with reciprocal contextual links rather than duplicate page purpose.
- **Detected:** sitemap, `llms.txt`, route manifest and public navigation publish canonical destinations only.

## Safety, privacy and product boundaries

- **Detected:** the hub explains choices, personal boundaries and destinations without diagnosing, assessing affordability or making medical, financial or guaranteed-safety claims.
- **Detected:** Self-Check and Limit Tracker answers remain browser-local, clear on refresh, are absent from analytics payloads and cannot be imported by commercial components.
- **Detected:** Help has no offer, affiliate, casino, comparison, Programme-personalisation or commercial-action content.
- **Detected:** Programme calculation, progress, completion, next Mission, XP and rewards remain server-owned and unchanged.
- **Detected:** authenticated/private routes, admin guards, Google identity, Programme AI and provider contracts were not broadened.

## SEO and structured data

- **Detected:** the hub, Help, Help guide, Self-Check, Limit Tracker, responsible-gambling Learn category and Learn articles have route-owned titles, descriptions and canonicals.
- **Detected:** `/help` remains `index,follow` because its ordinary server HTML is public, non-personal support content; protected separation refers to shell/data/commercial isolation, not authentication or `noindex`.
- **Detected:** Breadcrumb and truthful WebPage/Article schemas align with visible content. Article schema includes the source manifest's publication and update dates.
- **Detected:** all JSON-LD uses the nonce-aware serializer, escapes `<`, U+2028 and U+2029, and introduces no Review, medical, financial, affordability or commercial schema.

## Public Learn authority

- **Detected:** `lib/learning-center.ts` is the single public article authority for status, article/category pages, public API, sitemap and machine-readable discovery.
- **Detected:** every public record has explicit `PUBLISHED` status and publication/update dates; only published records are projected.
- **Detected:** invalid taxonomy, invalid dates, duplicate IDs, duplicate global slugs and duplicate category/slug pairs fail validation. Draft/archived records remain absent from public projections.
- **Detected:** the Phase 1 CMS article seed remains an internal fixture and is not exposed by `GET /api/public/articles`.
- **Detected on exact Preview:** the public articles endpoint returned 13 records; all were published and dated, matching the Learn authority.
- **Not detected:** a database-backed public Learn publishing workflow. RFC-033 deliberately adds none.

## Enforced Content Security Policy

**Detected in source and on exact Preview:** each request receives a cryptographically random nonce in request/response headers; all application HTML routes are dynamic so Next framework scripts and explicit JSON-LD share the same nonce.

The Production policy is:

- `default-src 'self'`
- `script-src 'self' 'nonce-<per-request>' 'strict-dynamic'`
- `script-src-attr 'none'`
- `style-src 'self' 'nonce-<per-request>'`
- `style-src-attr 'unsafe-inline'`
- `img-src 'self' data: blob: https:`
- `font-src 'self' data:`
- `connect-src 'self'`
- `media-src 'self' blob:`
- `frame-src https://www.youtube-nocookie.com https://player.vimeo.com`
- `worker-src 'self' blob:`
- `manifest-src 'self'`
- `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'none'`; `upgrade-insecure-requests`

- **Detected:** Production `script-src` contains neither `'unsafe-inline'` nor `'unsafe-eval'`. Development alone adds `'unsafe-eval'` for the Next development runtime.
- **Detected:** the style-attribute exception is required by existing React style properties. Style elements and stylesheets remain nonce/self restricted.
- **Detected:** broad HTTPS images preserve the existing deployment-configured, validated published-CMS media contract; frames remain limited to the two source-enumerated editorial providers.
- **Detected on exact Preview:** representative hub, Help, Learn, auth, Programme, admin, contact and error routes returned the enforced policy with matching script nonces and no CSP console violation.

## External media and provenance

- **Detected:** all four direct `images.pexels.com` runtime references were replaced by already-versioned `/home/*.jpg` assets; no new third-party file was downloaded.
- **Detected on local and exact Preview:** no browser request or rendered source referenced `images.pexels.com`.
- **Detected:** the Pexels general licence was reviewed and the previous CDN IDs/local mappings are recorded in the Technical Baseline.
- **Not detected:** archived per-asset photographer, source-page, original-download licence or release evidence. This rights-record gap is not represented as closed by the general licence.

## Functional, responsive and accessibility evidence

- **Detected:** Chromium passed 35/35 and WebKit passed 35/35 on the final source. Coverage includes Help isolation/external-link meaning, Self-Check back/skip/keyboard/all-No/material-impact/restart/refresh/no-JS paths, and Limit Tracker below/at/over/decimal/validation/reset/refresh/no-JS paths.
- **Detected:** responsive checks passed at 320, 360, 390, 430, 768, 1,024, 1,440 and 1,920 pixels for the hub/Help; the Help-specific suite also covered 375, 900 and 1,280 pixels.
- **Detected:** one-H1/landmark, visible keyboard focus, 44-pixel control, reduced-motion, no horizontal overflow, server-HTML and no-JavaScript contracts passed.
- **Detected:** in-app visual review on local and exact Preview inspected the hub at desktop/mobile, Help at mobile and the responsible-gambling Learn category at desktop. Hierarchy, spacing, type, wrapping and exceptional Help treatment matched the RFC-033 design ledger; no console error or warning remained.

## Verification ledger

| Evidence | Result |
| --- | --- |
| `npm run ci:quality` | **Detected pass / exit 0:** lint, TypeScript, Prisma validation and every configured structural/domain regression lane. Focused public IA group: 31/31. |
| `NEXT_PUBLIC_SITE_URL=https://b4gamble.com npm run build` | **Detected pass / exit 0:** Next.js 15.5.21 production build. All application HTML routes are dynamic as required by the nonce model. |
| Final Chromium public/control/help suite | **Detected pass:** 35/35. |
| Final WebKit public/control/help suite | **Detected pass:** 35/35. |
| Hosted checks at implementation head | **Detected pass:** Agent Core 20s, Quality 58s, Database / Migration Verification 53s, Build / Browser 3m57s, Vercel and Vercel Preview Comments. Browser lanes passed 67 with one intentional missing-Google-credentials skip, then Programme AI 11/11. |
| Exact Preview | **Detected Ready:** `dpl_HSr19yfu1hmRmrYzMmdPaMqiUJRN`, immutable URL above, exact runtime-tested head `3042650`. |

The local runner initially denied Chromium's macOS Mach rendezvous before any assertion executed. The identical approved-permission rerun passed 35/35; the denied launch is infrastructure noise, not a product failure.

## Red-team result

| Attack/failure surface | Detected result |
| --- | --- |
| Legacy/open redirect | Only allowlisted former Help slugs redirect to fixed same-origin `/help/<slug>` destinations; unknown slugs fail `404`. |
| JSON-LD/script injection | One escaping nonce serializer owns every JSON-LD block; markup separators are escaped and script nonces match the response policy. |
| Inline/eval script bypass | Production denies script attributes and contains no script unsafe-inline/eval allowance. |
| External resource expansion | No new connect/script/font host; frame hosts are closed; no direct Pexels runtime URL remains. |
| Third-party support links | Allowlisted HTTPS resources disclose external-destination meaning and use safe new-tab relationship attributes. |
| Protected/commercial crossover | Help and control tools retain source-tested import and content firewalls; no offers or affiliate actions appear. |
| Authentication/admin regression | Login, Programme and admin routes return expected guarded shells under the nonce policy; no guard or provider configuration changed. |
| Analytics/control-data leakage | Control/support inputs remain browser-local and no analytics taxonomy or payload field changed. |
| Shared-cache exposure | Existing private/no-store route policies remain unchanged; CSP does not loosen cache handling. |

## Remaining items and release gates

- **Detected non-blocking rights-record gap:** historical per-asset attribution/release evidence for the four reused first-party images is absent.
- **Detected intentional compatibility:** `style-src-attr 'unsafe-inline'` and `img-src https:` remain bounded exceptions documented by RFC-033; they are not silent omissions.
- **Not detected:** Firefox, physical-device or assistive-technology lab evidence. Chromium, WebKit, keyboard and no-JavaScript coverage are green.
- **Detected:** Vercel's protected Preview adds platform `noindex`; page metadata/canonicals still target Production canonical URLs as intended.
- **Detected existing environment warning:** local/Preview logs warn that the configured Prisma runtime is not the approved pooled endpoint. RFC-033 changed no environment or database binding; this remains an operational configuration item outside this workstream.
- **Planned before merge:** require all configured hosted checks green on the final documentation head and confirm `origin/main` divergence has not introduced a conflict.
- **Planned after Founder approval only:** mark the Draft PR Ready, merge and create/verify a Production deployment. None is performed here.

## Rollback

Revert the RFC-033 implementation and follow-up QA/documentation commits through an ordinary reviewed source revert. This restores the former route/navigation/CSP/media behavior without a migration, data restore, secret change, environment rollback or platform mutation.
