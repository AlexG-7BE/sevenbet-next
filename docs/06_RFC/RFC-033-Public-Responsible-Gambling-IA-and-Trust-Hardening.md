# RFC-033: Public Responsible Gambling IA and Trust Hardening

- **Status:** Approved for bounded implementation
- **Decision authority:** Founder Office `PUBLIC-IA-AND-HARDENING-01` consolidated completion brief
- **Approved:** 2026-08-14
- **Corrective clarification approved:** 2026-08-14, Founder Office continuation of the same consolidated workstream
- **Scope:** Separate public Responsible Gambling education from protected Help, close the related navigation/SEO/content-authority/CSP/media findings and verify one Draft-PR Preview
- **Base:** `1d160b94481c7f8915619ef2254c7c2e66ab3209`
- **Depends on:** Product Vision & Principles v2.0, RFC-012, RFC-014, RFC-025, RFC-028, RFC-029, RFC-030, RFC-032 and `FULL-SITE-QA-01`
- **Supersedes:** The historic use of `/responsible-gambling` as the Protected Help root in the public information architecture and audit vocabulary; no Programme Mission contract is superseded

## 1. Evidence at the approved base

- **Detected:** `/responsible-gambling` renders the standalone noncommercial Protected Help experience while the public Responsible Gambling learning/tools hub required by the product vision is absent.
- **Detected:** public navigation, Self-Check, Personal Limit Tracker and other immediate-support actions use `/responsible-gambling` as Help.
- **Detected:** the public article API reads a separate in-memory CMS seed while Learn pages, categories and sitemap discovery read the source-controlled Learn corpus.
- **Detected:** Production serves the existing security headers but no Content Security Policy.
- **Detected:** four Pexels CDN URLs are requested directly by browsers in the 10-step entry and Programme, although corresponding first-party image assets already exist under `public/home/`.
- **Not detected:** an archived per-asset photographer/source-page/release record for those four Pexels files.
- **Inferred:** direct third-party image requests unnecessarily disclose ordinary request metadata and leave rendering dependent on an external URL when the same visual is already served first-party elsewhere.

The repository root was confirmed as `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`. The active source scan covered all 1,003 non-ignored repository files at the base, excluding dependencies, generated output, build artefacts, caches and `tsconfig.tsbuildinfo`.

## 2. Public information-architecture decision

`/responsible-gambling` becomes an indexable public-shell hub whose equal-weight paths are:

1. Responsible Gambling education at `/learn/responsible-gambling`;
2. private browser-local Self-Check at `/self-check`;
3. private browser-local Personal Limit Tracker at `/tools/budget-calculator`;
4. the existing 10-step Programme entry at `/10-steps` and authenticated Programme continuation at `/program`; and
5. immediate noncommercial support at `/help`.

The hub may explain choices, risks, personal boundaries and where each path leads. It must not diagnose, assess affordability, promise safety, make medical or financial claims, or personalise commercial content from control/support data.

`/help` becomes the canonical, indexable standalone Protected Help root. Help owns only direct action, pause and access-control content. Educational articles remain under Learn and must not be duplicated into Help merely to preserve a former slug. The `/responsible-gambling` root itself never redirects. Immediate-support actions, including the compact primary-navigation Help action, point to `/help`.

The Founder-approved corrective route authority is explicit and exhaustive:

| Former route | Classification | Canonical destination | Decision |
| --- | --- | --- | --- |
| `/responsible-gambling/budgeting` | EDUCATION | `/learn/responsible-gambling/responsible-gambling-tools` | Planning education belongs to Learn. |
| `/responsible-gambling/time-management` | EDUCATION | `/learn/responsible-gambling/responsible-gambling-tools` | The published Learn guide owns session reminders and time-control education. |
| `/responsible-gambling/bonus-terms` | EDUCATION | `/learn/casino-bonuses/welcome-bonus-terms` | Bonus mechanics are educational, not Protected Help. |
| `/responsible-gambling/self-exclusion` | HELP | `/help/self-exclusion` | Direct access-control action. |
| `/responsible-gambling/deposit-limits` | HELP | `/help/deposit-limits` | Direct account/funds control. |
| `/responsible-gambling/cooling-off` | HELP | `/help/cooling-off` | Direct temporary-pause control with fail-closed local-term handling. |
| `/responsible-gambling/reality-checks` | HELP | `/help/reality-checks` | Direct in-session interruption control. |
| `/responsible-gambling/casino-licenses` | EDUCATION | `/learn/licensing/casino-licenses-explained` | Licence interpretation belongs to Learn. |
| `/responsible-gambling/payment-safety` | EDUCATION | `/learn/payments/casino-payment-methods` | Payment and withdrawal mechanics belong to Learn. |
| `/responsible-gambling/faq` | EDUCATION | `/learn/responsible-gambling` | The mixed FAQ is redundant with the canonical Learn category and guide. |

Each known former URL returns one same-origin permanent `308` directly to the listed destination and preserves encoded query parameters. Unknown slugs return `404`; no request input may select a destination host. No former route is classified RETIRED because every item has a truthful current canonical equivalent.

Learn remains a distinct content library. `/learn/responsible-gambling` owns educational article discovery and links back to the broader hub; it does not duplicate the hub's navigation purpose or Protected Help's urgent-support purpose.

## 3. Navigation, SEO and discovery decision

The primary header remains compact and changes only the Help destination. The shared desktop/mobile footer gains one `Control & Support` group containing Responsible gambling, Self-Check, Personal Limit Tracker and Help.

The hub, Help, Self-Check, Personal Limit Tracker and responsible-gambling Learn category each retain a distinct canonical, title and description. Relevant pages receive coherent Open Graph, Twitter, Breadcrumb and WebPage/Article structured data. The sitemap and `llms.txt` publish only canonical destinations; robots remain index/follow for public education and support. Legacy redirect URLs are not added to discovery manifests.

Structured data is emitted through a nonce-aware serializer that escapes markup-significant input. No page may acquire Review, medical, financial, affordability or commercial schema through this work.

## 4. Durable public Learn authority

The source-controlled Learn manifest becomes the one public authority for article publication state, article/category pages, public article API projection, sitemap and machine-readable discovery. Every public article has explicit status and publication/update dates; only `PUBLISHED` entries are projected. Invalid, duplicate or draft records fail closed or remain absent.

The CMS article seed remains an internal Phase 1 fixture and is not public Learn authority. This decision adds no database schema, migration, Production data mutation, admin publishing workflow or new content-management service.

## 5. Content Security Policy decision

The application will use the current Next.js nonce model: a fresh cryptographically random nonce is set in request and response headers, pages are dynamically rendered, Next.js framework scripts inherit the nonce and B4GAMBLE JSON-LD explicitly receives it.

The Production policy must not contain `script-src 'unsafe-inline'` or `script-src 'unsafe-eval'`. Development may add only `'unsafe-eval'`, as required by the Next.js development runtime. The policy must also deny object embedding and framing, limit base/form/worker/media sources and upgrade insecure requests.

Compatibility exceptions are deliberately narrow:

- `style-src-attr 'unsafe-inline'` remains because existing React views use style attributes; style elements and stylesheets remain nonce/self restricted;
- `img-src` permits self, `data:`, `blob:` and HTTPS because published CMS media can use a validated HTTPS public URL whose storage host is deployment-configured;
- `frame-src` permits only `youtube-nocookie.com` and `player.vimeo.com`, the two validated editorial-review providers already in source; and
- `connect-src` remains same-origin because browser analytics uses B4GAMBLE's `/_vercel/insights` endpoint and OAuth/OpenAI/Resend calls are navigation or server-side concerns.

The existing Referrer Policy, Permissions Policy, HSTS at the platform edge and Programme-only microphone permission are preserved. CSP is enforced, not report-only, on the Draft-PR Preview before any release decision.

### 5.1 Corrective rendering-mode decision

The nonce architecture was deliberately re-reviewed against exact-main and corrective-branch production builds plus the current official Next.js App Router CSP guidance on 2026-08-14.

- **Detected on exact main `1d160b9`:** the public Home, authenticated/public-shell surfaces, Self-Check, Personal Limit Tracker, Programme, auth and commercial routes were already request-time rendered. The former `/responsible-gambling` root and redirect articles, the 404, and Learn category/article pages retained Static or SSG output.
- **Detected on the corrective branch build:** application HTML routes, including Responsible Gambling, Help and Learn, are request-time rendered; non-HTML/static route output such as `icon.svg`, `llms.txt` and `robots.txt` remains static.
- **Detected in current official Next.js guidance:** a fresh nonce requires dynamic rendering so framework scripts receive the request nonce; static optimisation, ISR and PPR are incompatible with this nonce model. The documented static alternative, Subresource Integrity, remains experimental, App-Router/webpack-only and build-time-only.
- **Decision — KEEP:** retain the supported root nonce architecture and its explicit `connection()` boundary. Scoping the nonce to selected route families would create inconsistent script policy and still leave the auth-aware public shell dynamic. Splitting root layouts or adopting experimental SRI would materially expand architecture and release risk for a modest static subset. That change is not justified inside this bounded corrective pass.
- **Accepted trade-off:** the formerly static Responsible Gambling and Learn documents lose default CDN/static delivery, can have slower cold TTFB, consume request-time compute and cannot use ISR/PPR under the current model. This is accepted in return for one enforced production script policy with no `script-src 'unsafe-inline'` or `script-src 'unsafe-eval'`.
- **Revisit trigger:** measured sustained latency/cost regression, stable production-grade hash CSP support in the project’s active Next.js bundler, or a separately approved root-layout/cache architecture RFC.

## 6. External media and provenance decision

The four direct Pexels hotlinks are replaced with the already-versioned first-party equivalents. The repository records the detected CDN identifiers, local mapping, general Pexels licence, missing per-asset attribution/release evidence, previous privacy/availability effects and current first-party status. No claim is made that general licence terms prove an individual model release.

Published CMS media remains governed by existing HTTPS URL validation and publication review. Editorial video embeds remain governed by the existing closed provider enum and sandboxed iframes. Adding any other production-facing external media host requires provenance, privacy and CSP review.

## 7. Design decision ledger

The B4GAMBLE night/paper surfaces, Archivo type, acid action colour, teal safety semantics and deliberately noncommercial Help treatment remain authoritative.

| Reference | Adopt | Reject |
| --- | --- | --- |
| Open Collective Raise | text-first pathway hierarchy and calm card rhythm | its brand, palette and donation-product semantics |
| Hashnode | precise content grid and strong scanning order | developer-product styling and dense utility chrome |
| Udemy | clear separation between topic discovery and individual learning content | marketplace merchandising, urgency and popularity signals |

Help remains visually exceptional. The other hub paths use equal weight; no visual hierarchy implies that Programme participation, a tool result or reading an article is the universally correct choice.

## 8. Verification and release boundary

Required evidence includes route/navigation/redirect/SEO/content-authority/CSP/media regression tests, lint, type-check, Prisma validation, Programme and responsible-gambling regression suites, production build, JavaScript-on/off functional checks, keyboard/focus/landmark/contrast smoke, Chromium widths from 320 through 1,920 pixels and a WebKit core-path smoke where the runner permits it.

The Preview must prove real CSP enforcement without console violations on representative public, Help, auth, Programme, admin and error paths. Browser requests must show no Pexels CDN traffic. Support/control state must remain browser-local and excluded from analytics/commercial targeting.

This RFC authorises only source changes, tests, documentation, commits and one Draft PR with Preview verification. It does not authorise merge, Production deployment, environment/secret/database/DNS/OAuth/OpenAI changes, commercial activation or destructive migration. Any unresolved critical or major defect produces a HOLD recommendation.

Rollback restores the prior route and header implementation only through a reviewed source revert. It does not mutate Production data or platform configuration.
