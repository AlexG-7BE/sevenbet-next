# RFC-057: Help-Only Site on a Second Domain from the Same Code

- **Status:** `PROPOSED` — not approved and not current authority. Nothing in
  this RFC is implemented. It becomes `ACTIVE` only after the Founder answers
  the questions in §22 and approves the architecture.
- **Decision authority:** Founder decisions of 16 October 2026, given through
  the question tool in the partner-traffic audit session:
  1. «Без казино для всех» — the Programme shows no casino link to anyone
     ([PROGRAMME-NO-CASINO-LINKS-2026-10-16](../07_Decisions/PROGRAMME-NO-CASINO-LINKS-2026-10-16.md),
     PR #530, open at the time of writing);
  2. «Тот же код, второй домен» — a separate help-only site on a second domain,
     served by the same code and the same Vercel project, where the request
     host decides what is shown; the domain is not chosen yet;
  3. the step-3 lesson (Mission 08 «Research responsibly») is replaced by a
     help lesson; Mission number, step order and rewards stay; the Founder sees
     the text and screens before any merge.

  This RFC records the architecture for decision 2. It does not implement
  decisions 1 or 3; it depends on both (§18).
- **Scope:** which routes the second domain serves, what `b4gamble.com` does
  with them, host routing, sign-in, consent and analytics, e-mail links,
  search files, the country block, CSP and media, Learn publication, social
  links, data, the owner-disclosure page, rollout, rollback and tests.
- **Depends on:** Product Vision & Principles §13–§17, RFC-002, RFC-017,
  RFC-018, RFC-019, RFC-020, RFC-021, RFC-025, RFC-028, RFC-030, RFC-036,
  RFC-037, RFC-039, RFC-046, RFC-052, RFC-053 and
  PROGRAMME-NO-CASINO-LINKS-2026-10-16.
- **Would amend, once approved:** RFC-030 §1 (one Production origin becomes
  two exact origins); RFC-019 §5 (`lib/site.ts` as the single absolute-URL
  authority becomes one origin per site); RFC-021 §5 (Production Better Auth
  trusts two exact hosts); RFC-046 §16 (Google Analytics on the help host, as
  the Founder answers Q3); RFC-052 §7 and RFC-053's public-URL contract (the
  public origin of a guide depends on its category).
- **Does not change:** the database schema (no table, column or migration);
  Mission order, prerequisites, rewards or XP; commercial authority
  (RFC-042, RFC-047, RFC-049, RFC-054); the `b4gamble.com` desktop home page,
  which stays visually unchanged; the country block policy.

Throughout, `<help-domain>` stands for the domain the Founder has not chosen
yet, and `HELP_ORIGIN` for `https://<help-domain>`. "The main site" is
`https://b4gamble.com`; "the help site" is `HELP_ORIGIN`.

Evidence labels follow [GOVERNANCE](../GOVERNANCE.md): **DETECTED** (seen in
the repository at the base below, or in a cited live record), **INFERRED**
(follows from detected facts, not observed), **PROPOSED** (this RFC's design),
**UNKNOWN** (not established) and **CONTRADICTION** (two current facts or
rules disagree).

## 0. Evidence base

- Repository: `AlexG-7BE/sevenbet-next`, `origin/main` at `800c2eb0`
  (16 October 2026). PR #530 read at head `ba60bb63`.
- Read for this RFC: `docs/GOVERNANCE.md`, the RFC registry, RFC-019, RFC-020,
  RFC-021, RFC-030, RFC-036, RFC-037, RFC-039, RFC-046, RFC-052, RFC-054,
  `middleware.ts`, `next.config.mjs`, `vercel.json`, `lib/site.ts`,
  `lib/auth/runtime-canonical-host.ts`, `lib/auth/runtime-config.ts`,
  `lib/auth/config.ts`, `lib/market/routing.ts`, `lib/seo/*`, `app/robots.ts`,
  `app/sitemap.ts`, `app/llms.txt`, the IndexNow key route,
  `lib/security/geo-block*.ts`, `lib/security/content-security-policy.ts`,
  `lib/analytics/google-analytics.ts`, `lib/analytics/excluded-paths.ts`,
  `lib/email/runtime-config.server.ts`, `lib/email/templates.server.ts`,
  `lib/learn-apply/*`, `lib/learn-content-orchestrator/*`,
  `lib/articles/*`, `lib/social/short-links.ts`, `app/(public)/privacy/page.tsx`,
  `docs/06_Operations/Geo-Block-Runbook.md`,
  `docs/06_Operations/Google-Authentication-and-Email-Readiness.md` and
  `docs/07_Decisions/PROGRAMME-FUNNEL-MCP-2026-10-14.md`.
- Outside the repository: the help-channel audit of 16 October 2026
  (`b4gamble-content/research/help-channels-audit-2026-10-16/REPORT.md`).

## 1. Decision summary (PROPOSED)

1. **One project, two sites.** The Vercel project `sevenbet-next` serves two
   exact Production hosts: `b4gamble.com` (the main site, unchanged in
   purpose) and `<help-domain>` (the help site). Middleware classifies the
   host once, from an exact match against source constants, and every later
   decision reads that class. No request value ever chooses an origin.
2. **The help site is an allowlist.** It serves the Programme, the 10 steps,
   the pause plans, help and responsible-gambling pages, help guides, `/beside`,
   `/innan`, the control answer pages, pause statistics, legal pages, contact
   and two new pages (owner disclosure, data statement for organisations).
   Every commercial or internal route, and every route not on the list,
   answers **404** there.
3. **One-way links.** The help site never links to a commercial page, and
   never links to `b4gamble.com` at all. The main site may link to the help
   site.
4. **The main site hands help routes over.** After the help site is live and
   verified, `b4gamble.com` answers a permanent **301** for every help route to
   the same path on `HELP_ORIGIN`. The help site's pages are self-canonical on
   `HELP_ORIGIN`.
5. **Same database, separate sessions.** Both sites use the one existing
   PostgreSQL database and the same user records. Sessions are host-only
   cookies, so a person signs in on each site separately. A separate database
   is a later option (§16.4).
6. **No schema change.** The host is not stored anywhere.

## 2. Why

**DETECTED (help-channel audit, 16 October 2026):**

- 3 Programme enrolments in 31 days (`programme_funnel`, 16 Sep – 16 Oct).
- Since 1 October, help organisations answered 2 refusals and 1 pending
  objection, all about the casino catalogue on the same domain:
  Beroendecentrum (Region Stockholm, 6 Oct), Help for Dependency (GB, 14 Oct:
  "concerned about any affiliated commissions") and Bremen (pending).
- Gamban blocks the "gambling affiliates" category, so people who block
  gambling sites on their own devices — the help audience — may not reach
  `b4gamble.com` at all. Whether BetBlocker blocks it is **UNKNOWN** (the
  audit asks for a check).
- UK charities and every OHID-funded organisation require no gambling-industry
  money; the Swedish and Danish public bodies require public or non-profit
  sources. The audit's conclusion: a separate domain opens blockers, Google
  Play and YouTube links, private clinics, researchers and press; it does not
  remove the objection "the owner earns from casinos" — only a non-profit
  entity could (§16.5).

**INFERRED:** while the Programme lives on the domain whose menu and
catalogue earn affiliate commission, every help channel sees the catalogue
first. A second domain with no commercial content is the smallest change that
lets the help channels judge the help content on its own.

## 3. Hosts

| Request host (Production) | Today (DETECTED) | Proposed |
| --- | --- | --- |
| `b4gamble.com` | serves the site | main site |
| `www.b4gamble.com` | Vercel domain redirect 308 to the apex | unchanged |
| `<help-domain>` | not attached | help site, when `HELP_SITE_SERVING` is on (§7.3) |
| `www.<help-domain>` | not attached | Vercel domain redirect 308 to the apex; middleware fallback 308 to `HELP_ORIGIN` |
| generated `*.vercel.app` Production hosts, project alias | middleware 308 to `b4gamble.com`, except three cron paths | unchanged (308 to `b4gamble.com`) |
| any other host | 308 to `b4gamble.com` | unchanged |

**DETECTED:** `lib/auth/runtime-canonical-host.ts` holds the constant
`PRODUCTION_CANONICAL_ORIGIN = "https://b4gamble.com"`, and in Production every
other host is redirected there (RFC-030). **PROPOSED:** add a second source
constant `HELP_CANONICAL_ORIGIN`, committed once the domain is chosen. Matching
is exact on protocol and host (lower-cased, no port, no trailing dot), as
RFC-030 requires. Until the constant exists and the switch is on, the help
host is "any other host" and is redirected to `b4gamble.com`, which is
today's behaviour.

## 4. Route classes

**PROPOSED:** one manifest, `lib/site/host-routes.ts`, gives every route root
exactly one class. It extends the existing public-prefix allowlist
(`PUBLIC_LOCALIZATION_ROUTE_MANIFEST` in `lib/market/routing.ts`, **DETECTED**)
rather than adding a parallel list. Classification runs on the path after the
language prefix and legacy market prefixes are removed, so `/sv/casinos`,
`/se/sv/casinos` and `/casinos` are one decision.

| Class | Help host | Main host |
| --- | --- | --- |
| `HELP` | serves | serves until phase 3, then 301 to `HELP_ORIGIN` |
| `SHARED` | serves, with the help shell and help-host content | serves as today |
| `COMMERCIAL` | 404 | serves as today |
| `INTERNAL` | 404 | serves as today |
| not in the manifest | 404 | as today |

### 4.1 Inventory (DETECTED routes, PROPOSED class)

**`HELP`**

| Routes | Note |
| --- | --- |
| `/program`, `/{language}/program`, `/program/*` | the Programme in every published language |
| `/10-steps`, `/start` | `/start` is the UK help-ad landing (noindex) |
| `/pause-plan`, `/innan`, `/beside`, `/pause-statistics` | pause plans SE/DK/GB and the pages around them |
| `/gambling-control`, `/control-without-quitting`, `/gambling-control-tools` | control answer pages (en/sv/da) |
| `/help`, `/help/*` | protected Help |
| `/responsible-gambling`, `/responsible-gambling/*`, `/responsible-gaming`, `/self-check`, `/tools/budget-calculator` | the last three are legacy redirects to `/responsible-gambling` |
| `/learn/responsible-gambling`, `/learn/responsible-gambling/*` | help guides: the protected category, which never carries an offer bridge (**DETECTED** `lib/articles/article-bridges.ts`) and whose related reading stays inside the category (**DETECTED** `lib/articles/related-reading.ts`) |
| `/who-runs-this`, `/for-organisations` | new pages, §17 and §16.3 (slugs PROPOSED; they follow the name chosen in Q2) |

**`SHARED`**

| Routes | Help-host behaviour |
| --- | --- |
| `/` | the help home (Q5); the main home is unchanged |
| `/learn` | lists only `responsible-gambling` guides; a tag hub (Spelpaus, ROFUS, GAMSTOP) works as today because it already selects inside that category (**DETECTED** `lib/articles/pause-hub-selection.ts`) |
| `/privacy`, `/terms`, `/contact` | the same controller and documents, with the sections that do not apply on the help host left out (§10, §17) |
| `/login`, `/reset-password`, `/unsubscribe` | customer sign-in; after phase 3 the main site's `/login` and `/reset-password` 301 to the help host, because customer accounts exist only for the Programme |
| `/api/auth/*`, `/api/program/*`, `/api/programme-access/*`, `/api/contact`, `/api/email/unsubscribe`, `/api/customer/email-preference`, `/api/public/pause-reminder`, `/api/presentation` | the APIs help pages call; never redirected |
| `/api/consent/analytics`, `/api/analytics/events` | only if the help host keeps optional analytics (Q3) |
| `/ig`, `/fb`, `/x`, `/threads`, `/lana`, `/ig/*`, `/fb/*`, `/x/*`, `/t/*` | short links land on help pages (§15) |
| `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/219017cffaba5177842beab195a2564c.txt` (IndexNow key), icons, `/_next/*`, first-party static images | per-host content (§12) |

**`COMMERCIAL`** — 404 on the help host:
`/best-offers`, `/casinos`, `/casino/*`, `/bonuses`, `/compare`, `/catalog`,
`/bonus-guide`, `/wagering-calculator`, `/outbound/*`, `/r/*`, `/go/*`,
`/partner-creatives/*`, `/partner-preview`, every other Learn category and its
guides, `/faq`, `/methodology`, `/about`, `/affiliate-disclosure`,
`/can-you-trust-b4gamble` (its substance moves to `/who-runs-this`, §5),
`/for-creators`, `/for-creators/*` (its future is an open Founder choice of
16 October; it stays commercial either way), `/llms-full.txt`,
`/api/public/[resource]`, `/api/public/comparison`, `/api/media/*`.

**`INTERNAL`** — 404 on the help host: `/admin/*`, `/api/admin/*`,
`/api/mcp/*`, `/api/internal/*` (crons run on the generated Production host),
`/api/email/webhooks/*`, `/editorial-preview/*`,
`/launch-polish-error-harness`.

**PROPOSED:** a test lists every `page.tsx` and `route.ts` under `app/` and
fails when one has no class, so a new route can never appear on the help host
by accident.

## 5. What `b4gamble.com` does with help routes

**PROPOSED, phase 3 (§18):**

- A `GET` or `HEAD` for a `HELP` route answers **301** to the same canonical
  path and query on `HELP_ORIGIN`, in one hop: language and legacy
  normalisation happen first, inside the same response, so no request crosses
  a 308 and then a 301. API routes are never redirected.
- `/can-you-trust-b4gamble` and its language versions answer 301 to
  `HELP_ORIGIN/who-runs-this` in the same language.
- The main site's own links to the Programme, the 10 steps, the pause plan
  and help pages become absolute `HELP_ORIGIN` links, so no internal link
  depends on the redirect. On the home page only the `href` values change; the
  desktop home stays visually unchanged.
- The main sitemap stops listing help routes; the main `llms.txt` names the
  help site for the Programme (§12).
- Before phase 3 the main site serves help routes exactly as today.

## 6. One-way link rule

**PROPOSED, an invariant of the help host:**

1. No anchor, form action, `fetch`, prefetch, image, script, stylesheet,
   redirect or structured-data URL on a help-host response points to a
   `COMMERCIAL` or `INTERNAL` route, or to any `b4gamble.com` host.
2. The only exception is plain text on `/who-runs-this` that names
   `b4gamble.com` as the company's other site, with no link (§17). Honesty
   about the owner needs the name; the rule against links keeps blockers and
   organisations from seeing a path into the catalogue.
3. The help shell has its own header, drawer and footer: 10 Steps · Pause
   plan · Guides · Help, and in the footer the owner page, the data statement,
   Privacy, Terms and Contact. It has no research door, no `/for-creators`,
   `/affiliate-disclosure`, `/methodology` or `/faq` link.
4. **CONTRADICTION (DETECTED):** the captured home handoff in
   `lib/final-handoff/generated-pages.json` contains `href="/best-offers"`,
   `href="/casinos"` and `href="/bonuses"`; whether they reach the rendered
   page after the transforms and the shell is **UNKNOWN**. The current footer
   (`components/public-shell/PublicFooter.tsx`) has an Explore column with the
   three research links. Both must pass the link guard (§20) before the help
   host goes live.

## 7. Host routing in middleware

### 7.1 Order (PROPOSED)

1. **Host decision** (`resolveRuntimeCanonicalHost`, extended): exact main
   host → `main`; exact help host with `HELP_SITE_SERVING` on → `help`;
   `www.<help-domain>` → 308 to `HELP_ORIGIN`; cron paths on generated hosts →
   continue; everything else → 308 to `b4gamble.com` (RFC-030, unchanged).
2. **Country block** (`geoBlockGate`), unchanged and host-independent
   (**DETECTED**: the gate does not read the host).
3. **Help gate** (help host only): classify the path (§4). `COMMERCIAL`,
   `INTERNAL` or unknown → rewrite to a help-safe not-found page with status
   404, `Cache-Control: private, no-store` and `X-Robots-Tag: noindex`. With
   `HELP_SITE_INDEXABLE` off, every help-host response also carries
   `X-Robots-Tag: noindex`.
4. **Main redirect** (main host only, `HELP_SITE_REDIRECTS` on): `HELP` page
   routes → 301 to `HELP_ORIGIN` (§5).
5. The existing language, Programme and public-market logic, unchanged.

### 7.2 The site class reaches the page through a trusted header

**DETECTED:** middleware strips client presentation headers and passes
language and market to the app in headers bound by an HMAC whose payload
includes the request origin (`presentationTokenPayload`). **PROPOSED:** a new
header `x-b4gamble-site: main | help`, stripped from every incoming request
like the presentation headers and set only by middleware; the existing token
already binds the origin, so a rewrite cannot carry one site's presentation to
the other. Server code reads the site with one helper
(`resolveServerSite()`); no component reads `Host`.

### 7.3 Switches read by literal name

**DETECTED:** on Vercel the edge bundle sees a custom variable only when code
reads it as a literal `process.env.NAME`; `geoBlockConfigFromProcessEnv` is the
pattern. **PROPOSED:** three switches, each read literally in one function, all
off by default:

| Variable | Effect when `true` |
| --- | --- |
| `HELP_SITE_SERVING` | Production treats the exact help host as the help site; otherwise it is redirected like any unknown host |
| `HELP_SITE_INDEXABLE` | help-host pages keep their normal robots policy; otherwise every help-host response is `noindex` |
| `HELP_SITE_REDIRECTS` | the main host answers 301 for `HELP` routes |

The origin itself is a source constant, not a variable (§3). For local runs
and CI, `HELP_SITE_DEV_HOST` (for example `help.localhost`) makes that host the
help site; it is ignored when `VERCEL_ENV` is `preview` or `production`.

**INFERRED:** Preview keeps one exact branch host (RFC-021), so it cannot
serve two hosts. A Preview-only switch that makes the branch host itself act as
the help site (`HELP_SITE_PREVIEW_AS_HELP`, read literally) is an optional
addition for showing the Founder screens on a real URL; the main oracle is a
local production build with two loopback hosts.

### 7.4 Caching

**DETECTED:** the root layout reads `headers()` (`app/layout.tsx`), and the
sitemap, `llms.txt` and short links are `force-dynamic`. **INFERRED:** pages are
rendered per request, so the Next.js full-route cache does not hold one site's
HTML for the other. **INFERRED:** `app/opengraph-image.tsx` is a file-convention
image that may be generated once at build; the help host therefore names its
own social image explicitly. **UNKNOWN:** whether Vercel's CDN cache key
includes the host for responses marked `public` with `s-maxage`. **PROPOSED
rule:** any response whose body differs by host is `private, no-store` or
lives at a host-specific path; the phase-2 checks prove it on Production.

## 8. Origins in code

**DETECTED:** `lib/site.ts` exports a module constant `siteUrl`;
`resolveSiteUrl` returns `https://b4gamble.com` for both Production and
Preview; `absoluteUrl`, canonical links, hreflang, structured data
(`ORGANIZATION_ID`, `WEBSITE_ID`), the sitemap, robots, `llms.txt`, IndexNow and
the Learn verifier all derive from it.

**CONTRADICTION:** one module constant cannot give two sites their own
canonical URLs.

**PROPOSED:**

- `siteUrl` keeps meaning the main origin; a `helpUrl` constant is added.
- Every absolute-URL producer that can run on the help host takes the site
  explicitly (`absoluteUrl(path, site)`); server components pass
  `resolveServerSite()`.
- Structured data on the help host: its own `WebSite` (`HELP_ORIGIN/#website`)
  and its own `Organization` node (`HELP_ORIGIN/#organization`, legal name
  7BE Inc., `url: HELP_ORIGIN`), because a `b4gamble.com` URL in JSON-LD would
  break rule §6.1. The display name follows Q2; `sameAs` lists the social
  profiles whose bios point to the help site (§15).
- Hardcoded `b4gamble.com` strings that help pages print (**DETECTED**): the
  "plan is here" texts in `lib/i18n/static-pages/beside.ts`, the calendar
  descriptions in `lib/i18n/static-pages/pause-plan.ts`, the calendar UID in
  `app/(public)/pause-plan/PausePlanTool.tsx` and the visible link text in
  `app/(public)/beside/page.tsx`. They take the help origin.

## 9. Sign-in and session cookies

### 9.1 Facts (DETECTED)

- Better Auth (`lib/auth/config.ts`) uses `BETTER_AUTH_URL` as a fixed base URL
  outside Preview and `BETTER_AUTH_TRUSTED_ORIGINS` as a comma-separated list.
  In Preview it already uses the dynamic form
  `baseURL: { allowedHosts: [host], protocol: "https" }`
  (`lib/auth/runtime-config.ts`).
- No cross-subdomain or cookie-domain option is configured: session cookies
  are host-only (`__Secure-better-auth.session_token`).
- Google sign-in uses one Production OAuth client, with
  `https://b4gamble.com/api/auth/callback/google` as its callback
  (`docs/06_Operations/Google-Authentication-and-Email-Readiness.md`).
- The Programme access proof and the anonymous journey live in the origin's
  `sessionStorage` and are signed with `BETTER_AUTH_SECRET`; RFC-021 forbids
  copying that state across origins. An authenticated user's adult, Terms and
  Privacy acceptance is a durable server record
  (`ProgrammeAccessAcceptance`, RFC-021 supersession of 31 August 2026).

### 9.2 Design (PROPOSED)

- **Production base URL:** the dynamic form with exactly two hosts,
  `allowedHosts: ["b4gamble.com", "<help-domain>"]`, and
  `BETTER_AUTH_TRUSTED_ORIGINS` set to both exact origins. Preview stays as it
  is. The code refuses any other host.
- **Cookies stay host-only.** Two registrable domains cannot share a cookie,
  and they should not: a session on the help host is a separate session row
  for the same user. Signing out on one site does not sign out the other.
- **Google:** the Founder adds `HELP_ORIGIN` to the Production client's
  authorised JavaScript origins and
  `HELP_ORIGIN/api/auth/callback/google` to its authorised redirect URIs, and
  adds `<help-domain>` to the consent screen's authorised domains. **UNKNOWN:**
  the consent screen's verification state; **INFERRED:** Google asks for
  ownership of an authorised domain (Search Console), and a verified screen may
  need review after a change. The OAuth state and PKCE cookies are host-only,
  so a sign-in starts and finishes on one host.
- **Staff stay on the main site.** `/admin` and `/api/admin` are 404 on the
  help host; a small hook refuses staff sign-in on the help host, so no staff
  session exists there.
- **People already signed in** on `b4gamble.com` arrive signed out on the
  help host after phase 3 and sign in once (Google or e-mail). Their durable
  acceptance means no checkbox appears again. Anonymous in-progress journeys
  (60-minute proof, about 24-hour continuation, tab drafts) do not move across
  hosts; **INFERRED:** few people are affected (3 enrolments in 31 days). No
  cross-host session-transfer token is proposed: it would be a new bearer
  credential for a small gain.
- **Verification and reset links** are built by Better Auth from the request's
  base URL, so an account created on the help host gets help-host links
  (**INFERRED** from the dynamic base URL; tested in §20).

## 10. Consent and analytics — Founder question Q3

### 10.1 Facts (DETECTED)

- RFC-046 §16 (Founder, 4 October 2026): the Google tag `G-11MX6NPS95` is in
  every Production page's `<head>` and counts every visitor from the first
  page; "Reject cookies" turns it off; it never sends from protected Help, the
  self-check or Admin (`lib/analytics/excluded-paths.ts`). Programme pages are
  counted.
- First-party analytics is consent-gated (RFC-046 §4).
- The help-channel audit (§3.4) records that Help for Dependency cited data
  protection, and that the database is in the United States.

### 10.2 Options for the help host (PROPOSED; the main site keeps the 4 October decision whatever is chosen)

| Option | What happens on `<help-domain>` | Banner | Cost |
| --- | --- | --- | --- |
| **G1** Same as the main site | GA4 from the first page, "Reject cookies" turns it off | yes | Help organisations see Programme pages counted by Google |
| **G2** Opt-in | GA4 and first-party analytics only after "Accept cookies" | yes | few numbers |
| **G3** None (recommended) | no Google tag, no optional cookies; counts come from what the server already records: `programme_funnel`, the `social_hit` log line, request logs and the proposed help-link count (audit item 6) | **none** | no GA4 report for the help site; Search Console still reports search |
| **G4** GA4 except Programme and Help | G1, with `/program*` added to the excluded paths | yes | Programme pages not counted |

Recommendation G3: it is the only option that lets the owner page say "this
site sets no tracking cookies", it needs no banner (one notice fewer, as the
Founder's consent-once rule asks), and the CSP can drop the Google hosts.
Until the Founder answers, the 4 October decision applies everywhere.

## 11. E-mail links

**DETECTED:**

- `resolveLifecycleEmailRuntimeConfig` accepts only `NEXT_PUBLIC_SITE_URL`
  with host `b4gamble.com`, and sender headers ending `@b4gamble.com`.
- `approvedStaticEmailUrl` in `lib/email/templates.server.ts` accepts static
  links only on `https://b4gamble.com`; PR #530 makes it refuse research links
  in every template except the marketing broadcast.
- Programme, pause and account letters carry `programme_url`, `plan_url`,
  `action_url` and `unsubscribe_url`. The pause letters' switch
  (`PAUSE_LETTERS_ENABLED`) is off.

**CONTRADICTION:** letters to Programme users would keep sending people to
`b4gamble.com`.

**PROPOSED:**

- After phase 3 every customer letter (verification, reset, welcome,
  Programme, pause) links to `HELP_ORIGIN`; the runtime config accepts the
  help origin for those purposes; unsubscribe works on either host because the
  token lives in the shared database.
- Every customer account is a Programme account, so the template guard
  refuses research and `b4gamble.com` links in every template, the marketing
  broadcast included (part of Q7).
- The sender stays `@b4gamble.com` until the Founder chooses otherwise (Q6); a
  help-domain sender needs Resend DNS records on `<help-domain>`.
- Contact (RFC-028) is unchanged: the form posts to the host's own
  `/api/contact`.

## 12. Search: sitemap, robots, `llms.txt`, IndexNow, hreflang, consoles

**PROPOSED, per host:**

| File | Help host | Main host |
| --- | --- | --- |
| `sitemap.xml` | `HELP` and help-relevant `SHARED` routes in every indexable language, help guides only | today's list minus `HELP` routes (from phase 3) |
| `robots.txt` | allow all, `Sitemap: HELP_ORIGIN/sitemap.xml`; no `/r/` rules needed (404) | unchanged |
| `llms.txt` | the help site: the one phrase, the Programme, pause plans, help guides, control answers, owner page, data statement; no casino text | the Programme section names the help site; the comparison text stays |
| `llms-full.txt` | 404 (offers) | unchanged |
| IndexNow | the same key file is served on both hosts; announcements are grouped by host, one POST per host, and a guide is announced under the host it lives on | unchanged for commercial URLs |
| hreflang | language alternates on `HELP_ORIGIN` only | commercial pages only |

**DETECTED:** `indexNowPayload` filters URLs to the single host of `siteUrl`,
and IndexNow requires the key file on the host being announced. **INFERRED:**
the same key may serve both hosts.

**Search Console and Bing (Founder, outside the repository):** a new Domain
property `sc-domain:<help-domain>` verified by a DNS TXT record under his
Google account, the help sitemap submitted there, and the site added in Bing
Webmaster (import from Search Console). **INFERRED:** Google's change-of-address
tool is for moving a whole site, so a partial move relies on the 301s and the
new sitemap; verify before use. **DETECTED (Search Console, 16 October):** 171
pages indexed, 1 click in 28 days, so moving help pages costs little ranking.

## 13. Country block, Vercel Firewall, CSP and media

**DETECTED (`Geo-Block-Runbook.md`, `lib/security/geo-block*.ts`):**

- Middleware answers 451 to Kazakhstan before any content; the gate does not
  read the host, so it will run on the help host too.
- The owner cookie `b4g_owner` gets `Domain=b4gamble.com` only on that host;
  on any other host it is host-only.
- The Vercel Firewall rule for static assets has conditions on environment,
  country, path and cookie, and none on host. **INFERRED:** it covers every
  domain of the project, the help host included.
- The Cloudflare WAF rule covers only `media.b4gamble.com`.
- `b4gamble.com` DNS is DNS-only in Cloudflare, so Vercel sets the trusted
  country header.

**PROPOSED:**

- The help host blocks the same countries with the same variables. The owner
  unlocks once on the help host (host-only cookie). The runbook gains a help-host
  row and checks.
- `<help-domain>` DNS is either at Vercel or DNS-only at Cloudflare; a proxied
  record would hide the visitor's country and break the block.
- **Media:** help pages must not load images from `media.b4gamble.com`. The
  owner cookie would not travel on that cross-site image request, blockers that
  block `b4gamble.com` may block its media host, and the request names the
  commercial domain. Help-guide images are served first-party on the help host
  from a small route over the same storage keys (`content/learn/<sha256>.<ext>`,
  RFC-052 §5), cacheable for a year because the keys are content-addressed.
  Raster paths fall under the Firewall rule. **UNKNOWN:** the storage provider
  behind `MEDIA_S3_PUBLIC_BASE_URL` (Cloudflare is named in the runbook). The
  alternative, `media.<help-domain>` on the storage itself, needs the zone on
  Cloudflare and a second WAF rule.
- **CSP:** the same builder; on the help host `img-src` narrows to
  `'self' data: blob:`, and with G3 `connect-src` drops the Google hosts.
  `frame-ancestors 'none'` stays.

## 14. Learn publication

**DETECTED:**

- `learn_apply` verifies a published guide at `siteUrl`; in Production
  `LEARN_APPLY_PUBLIC_ORIGIN` must equal `siteUrl`; the result URL is built from
  `PUBLIC_CANONICAL_ORIGIN` (`lib/learn-apply/*`).
- `learn_context` and `learn_source` accept only URLs that start with
  `https://b4gamble.com/`; the orchestrator's link check resolves links against
  the same origin (`lib/learn-content-orchestrator/*`).
- The help category is `responsible-gambling`.

**CONTRADICTION:** after phase 3 a help guide is live at `HELP_ORIGIN`, while
the verifier, the result URL and the context tools expect `b4gamble.com`.

**PROPOSED:**

- One function decides a guide's public origin by category: help origin for
  `responsible-gambling` once `HELP_SITE_REDIRECTS` is on, main origin for
  every other category. The verifier, the result URL, IndexNow, the sitemap,
  `learn_source` and `learn_context` use it.
- `learn_apply` refuses a `responsible-gambling` guide whose body links to a
  `COMMERCIAL` route or to `b4gamble.com`. **UNKNOWN:** whether published help
  guides contain such links today (the prose is in the database); an audit of
  every published help guide runs before phase 3.
- The MCP endpoint stays on the main host (`INTERNAL`).
- The scheduled publishing tasks and the localisation toolkit live outside
  the repository; their prompts name `b4gamble.com` URLs (**UNKNOWN** how many)
  and are updated in phase 3, on the Founder's word for scheduled tasks.

## 15. Social profiles and short links

**DETECTED (`lib/social/short-links.ts`):** `/ig`, `/fb`, `/x`, `/threads`
land on `/sv/pause-plan`, `/lana` on `/da/pause-plan`, post links on the home
page; each hit writes one `social_hit` log line and answers a relative 307.

**PROPOSED:**

- The help host serves the same short links (relative redirects land on help
  pages).
- From phase 3 the main host's short links redirect straight to
  `HELP_ORIGIN` (one hop, not 307 then 301), so old bios and old posts keep
  working; the log line gains `host=`.
- Profile bios switch to `<help-domain>/ig` and the others, on the Founder's
  word (social profiles are his).
- **INFERRED:** YouTube's rule against directing viewers to gambling sites
  without Google certification applies to `b4gamble.com`; a help domain with
  no gambling-promoting content gives YouTube and Google Play links a domain
  that does not lead to gambling. Video end cards that print
  `b4gamble.com/...` are re-rendered later (**UNKNOWN** count, content
  repository).

## 16. Data

### 16.1 One database (DETECTED)

- One PostgreSQL database (Prisma Postgres) behind `DATABASE_URL` and
  `DIRECT_URL` holds accounts, Programme progress, pause reminders, analytics,
  clicks, the catalogue and the CRM.
- Functions and the database run in the United States, `iad1`
  ([INSTANT-NAVIGATION-2026-10-04](../07_Decisions/INSTANT-NAVIGATION-2026-10-04.md));
  the provider console's exact Production region is **UNKNOWN** (RFC-024).
- The Privacy Notice names Vercel, Prisma's managed Postgres, Google (sign-in
  and GA4), Resend, Google Workspace and OpenAI (optional AI), and Prighter as
  the EU and UK Article 27 representative.

**PROPOSED:** the help site uses the same database in phases 1–3. No data
moves; no column records the host.

### 16.2 What organisations may ask, and what we can answer today

| Question | Answer today | Evidence |
| --- | --- | --- |
| Who runs the site, and is it linked to gambling companies? | 7BE Inc. (United States), which also runs `b4gamble.com`, a comparison site paid commissions by licensed operators | DETECTED (Privacy Notice, affiliate disclosure) |
| Does the help site or the Programme carry partner links or earn money? | No partner links once PR #530 and this RFC are live; the help site earns nothing itself | PROPOSED |
| Is Programme data shared with operators, sold or used for marketing? | Not sold or shared; never used to choose, rank or personalise anything commercial | DETECTED (Privacy Notice; RFC-017, RFC-025 firewall) |
| … but is it combined with casino clicks anywhere? | Yes, in one internal aggregate count: `programme_funnel` counts partner presses by signed-in people next to Programme stages | DETECTED (PROGRAMME-FUNNEL-MCP-2026-10-14) — Q7 |
| Is it the same database as the casino business? | Yes | DETECTED |
| Where is it stored and processed? | United States (Vercel `iad1`, Prisma Postgres) | DETECTED in a decision record; exact region UNKNOWN |
| Which safeguard covers transfers from the UK/EU? | The Privacy Notice says "contact us"; the mechanism per provider is not recorded | UNKNOWN (RFC-036 recorded vendor DPA and transfer evidence as deferred) |
| Is special-category data processed, on what basis? | Programme answers may reveal health information; optional personalisation uses explicit consent | DETECTED (Privacy Notice, RFC-036) |
| Has a DPIA been done? | RFC-036 found one required; no signed DPIA is in the repository | INFERRED / UNKNOWN |
| Is the AI on? | Optional and consent-based; the real provider has been switched off in Production since 12 October 2026 (`PROGRAM_AI_REAL_PROVIDER_ENABLED=false`, the Founder's choice that day) | INFERRED from the session record of 12 October, not yet in `CURRENT_STATE`; verify the Production variable before stating it |
| Who at the company can see a person's answers? | Staff with Admin access and MFA; whether any Admin screen shows Programme answers is not established | UNKNOWN |
| How long is data kept; how is it deleted? | Retention list in the Privacy Notice; deletion on request | DETECTED |
| Which trackers run on help pages? | Today GA4 from the first page on Programme pages | DETECTED — Q3 |
| Security? | HTTPS only, encrypted OAuth tokens, Admin MFA, backups, breach runbook | DETECTED (`lib/auth/config.ts`, RFC-017, Backup-and-Restore runbook) |
| Age? | 18+ self-attestation, no KYC | DETECTED (RFC-021) |
| Registration with the ICO? | Not recorded | UNKNOWN |
| Will you send us data about people we refer? | Only aggregate counts, never names | PROPOSED (audit item 6) |

### 16.3 The data statement the help site needs (PROPOSED)

A page `/for-organisations`, in plain words, in English, Swedish and Danish,
answering every row above, with the processor list, storage location and
transfer safeguard per processor, retention, rights, the Article 27
representative and a contact. The same text as a one-page PDF for letters.
**Gate:** every `UNKNOWN` row is either resolved or stated honestly as "not
yet" before outreach to help organisations resumes (phase 4). The help
host's Privacy Notice and this page must agree.

### 16.4 Separate database — later option

Not proposed now. It would mean a second database for help data (accounts,
Programme, pause reminders, help analytics) while the main database keeps the
catalogue, routes, clicks and CRM; splitting the Prisma schema or running two
clients; moving existing users; and two sets of backups and migrations. It
becomes necessary if a non-profit entity takes over the help site (a
different controller), and may be asked for by NHS, ORCHA or Swedish public
bodies, who may also want storage in the EU (audit, blockers table). It could
be combined with an EU region at that time.

### 16.5 Non-profit entity — later option

UK charities and OHID-funded organisations accept no industry money; the
audit found that only a separate non-profit entity is likely to pass that test.
It is outside this RFC; the architecture does not prevent it (the help site
would then move to its own project and database). Q4.

## 17. Owner-disclosure page (PROPOSED)

`/who-runs-this` on the help host, in every help language. The Founder
approves the exact text before merge. Content, in plain words:

1. **Who runs this site:** 7BE Inc., a United States company, with the
   address from the Privacy Notice and a contact address.
2. **How the company earns:** 7BE Inc. also runs `b4gamble.com` (named as
   plain text, not linked), a site that compares licensed online casinos and is
   paid a commission when a reader signs up with an operator through its links.
   This site carries no casino, bonus or partner link and earns nothing.
3. **The Programme has no partner links**, on any screen, card, letter or
   final plan.
4. **What you write never reaches the casino side:** Programme, pause and
   Help data is never used to choose, rank, time or personalise any casino
   offer or advertising, and is never given to an operator or affiliate
   partner. This sentence is true only once Q7 is answered and implemented.
5. **What is stored and where**, with a link to `/for-organisations` and the
   Privacy Notice.
6. Where the help site sets no tracking cookies (G3), it says so.

The page replaces the help-side use of `/can-you-trust-b4gamble`, whose
research next-step block cannot appear on the help host.

## 18. Rollout

| Phase | What | Gate before the next phase |
| --- | --- | --- |
| **0 — Decisions and accounts** (Founder) | answers to §22; the domain bought on his explicit yes; DNS at Vercel or DNS-only at Cloudflare; Search Console Domain property and Bing site; optional Resend domain | answers recorded in a decision record |
| **1 — Code, dark** | one or more PRs: host manifest, middleware gate, help shell, help home, per-site origins, Better Auth two-host config (code only), per-host search files, e-mail origins, Learn origin by category, first-party help images, owner page and data statement, link guard and two-host browser specs, the pause-letters cron fix (§21). All switches off: the main site behaves exactly as before, which tests prove | PR #530 merged; the replacement step-3 lesson (decision 3) merged, so the help site never launches with a casino-comparison lesson; the Founder has seen help-host screens as Production renders them (phone first, Google button shown); CI green |
| **2 — Help host live, not indexed, not linked** | attach `<help-domain>` and `www` to the project; set `BETTER_AUTH_TRUSTED_ORIGINS`; add the Google origin and callback; `HELP_SITE_SERVING=true`; redeploy | checks in §20.3 pass, including the Founder's own Google sign-in on his phone and the blocker check |
| **2b — Indexable** | `HELP_SITE_INDEXABLE=true`; submit the help sitemap; IndexNow for help URLs | help pages fetched 200 from GB, SE, DK |
| **3 — Move** | `HELP_SITE_REDIRECTS=true`: main-host 301s, absolute links from the main site, Learn origin switch, letters, short links; bios on the Founder's word; registry and `CURRENT_STATE` updated | one-hop 301s verified; help guides announced; no 404 among moved URLs |
| **4 — Outreach** | help organisations, blockers (category review for the new domain), directories, with the owner page and data statement | §16.3 gate |
| **Later** | separate database; non-profit entity | Founder decision |

**INFERRED:** Vercel applies environment changes only to deployments made
after the change (as the geo-block runbook says), so every switch flip is
followed by a redeploy.

## 19. Rollback

- **Phase 1:** revert the PR; with the switches off nothing user-visible
  changed.
- **Phase 2:** `HELP_SITE_SERVING=false` and redeploy: the help host is again
  "any other host" and 308s to `b4gamble.com`. Help-host session rows stay in
  the database unused. The domain may stay attached.
- **Phase 3:** `HELP_SITE_REDIRECTS=false` and redeploy: the main site serves
  help routes again. Browsers that cached a 301 keep going to the help host,
  so **the help host keeps serving for as long as any 301 was ever sent**. To
  abandon the help host after phase 3, reverse the direction (the help host
  301s help routes back to the main site) instead of switching it off.
- **Data:** nothing to roll back; no schema or data change.
- **Search:** a reversal costs a re-crawl; IndexNow announces the reverted URLs.

## 20. Test plan

All tests join `ci:quality` or `ci:browser`; a test outside those lists does
not run.

### 20.1 Unit

- Host decision: exact main and help hosts; `www.<help-domain>`; upper case,
  port, trailing dot and look-alike hosts (`<help-domain>.evil.test`,
  `evil<help-domain>`) never become the help site; with `HELP_SITE_SERVING`
  off the help host 308s to `b4gamble.com`; every RFC-030 case still holds;
  every `vercel.json` cron path continues on generated hosts.
- Route manifest: every `app/**/page.tsx` and `route.ts` has a class; every
  `COMMERCIAL` and `INTERNAL` route answers 404 on the help host with and
  without language prefixes, legacy prefixes, trailing slashes, encoded
  segments and queries (`/casinos`, `/sv/casinos`, `/se/sv/casinos/`,
  `/r/x`, `/go/x`, `/outbound/x`, `/casino/x`, `/learn/casino-bonuses/x`,
  `/api/public/bonuses`, `/api/admin/x`, `/admin`).
- Main-host 301s: path and query preserved, one hop, language kept; API
  routes never redirected; `/can-you-trust-b4gamble` → `/who-runs-this`.
- Country block on both hosts; owner cookie host-only on the help host.
- Origins: canonical, hreflang, JSON-LD, sitemap, robots, `llms.txt` and
  IndexNow payloads on the help host contain only `HELP_ORIGIN` URLs;
  IndexNow groups by host.
- Better Auth: Production config lists exactly two hosts; Preview unchanged;
  staff sign-in refused on the help host.
- E-mail: customer letters accept the help origin; every template refuses
  research and `b4gamble.com` links once phase 3 is on.
- Learn: the origin by category; `learn_apply` refuses a help guide with a
  commercial or `b4gamble.com` link; the verifier checks the help host.
- Analytics: per the Q3 answer (for G3: no Google tag, no banner and no
  Google hosts in the CSP on the help host).

### 20.2 Link guard and browser

- Render every help-host page in every help language (including the 404 page,
  the Programme home after steps 1, 2, 3, 4 and 10, and the completion screens)
  and fail on any `href`, `action`, `src`, `srcset`, `fetch` target or JSON-LD
  URL that is `COMMERCIAL`, `INTERNAL` or on a `b4gamble.com` host; the one
  allowed plain-text mention on `/who-runs-this` is checked to be text, not a
  link.
- Playwright on a local production build with two hosts (`localhost` and
  `help.localhost`): help home → pause plan → Programme step 1 → sign-up with
  e-mail and the Google button rendered (placeholder keys) → the new step-3
  lesson; header, drawer and footer contents; the typography floor; phone
  viewport first. The main site's existing specs pass unchanged with the
  switches off.

### 20.3 Production checks (phase 2 and 3)

- From GB, SE, DK, DE and US (Globalping or the GitHub-hosted smoke):
  help pages 200, commercial paths 404, `www` 308, help responses `private`
  where they differ by host, `noindex` until 2b.
- From a KZ exit: 451 on the help host; 403 on its raster assets.
- The Founder's real Google sign-in on the help host from his phone.
- A blocker check: BetBlocker (free) and, if available, Gamban in a separate
  Chrome profile open `HELP_ORIGIN` and `HELP_ORIGIN/sv/pause-plan`.
- Phase 3: every moved URL from the old sitemap answers one 301 to a 200.

## 21. Contradictions and findings

1. RFC-030's single Production origin versus a second public origin —
   resolved by the amendment in the header.
2. `lib/site.ts`'s single module origin versus per-host URLs (§8).
3. Lifecycle e-mail config and the template URL allowlist accept only
   `b4gamble.com`; help pages print hardcoded `b4gamble.com` strings (§8, §11).
4. Learn verification, result URLs and context schemas assume `b4gamble.com`
   (§14).
5. RFC-046 §16 counts Programme pages in GA4, while help organisations ask
   about data protection (§10, Q3).
6. `programme_funnel` counts partner presses next to Programme stages, while
   the owner page should say Programme data never reaches the casino side
   (§16.2, Q7).
7. The Mission 08 lesson still teaches comparing casinos and bonus terms
   (DETECTED in the PR #530 record), which a help-only site cannot carry —
   handled by decision 3 as a phase-1 gate.
8. The home handoff and the footer contain research links (§6.4).
9. Found in passing, outside this RFC's scope: **DETECTED** —
   `/api/internal/cron/pause-letters` is scheduled in `vercel.json` (hourly at
   minute 23) but is missing from the cron paths that
   `lib/auth/runtime-canonical-host.ts` lets through on generated Production
   hosts. **INFERRED:** if Vercel calls that cron on a generated host, as the
   resolver's comment says it does for crons, the request gets a 308 to
   `b4gamble.com` and the handler does not run. **UNKNOWN:** the real effect;
   the letters' switch is off, so nothing is lost yet. Phase 1 rewrites this
   resolver and adds the path with a test.

## 22. Open Founder questions

1. **Domain.** Which domain and ending; buying it needs your explicit yes;
   DNS at Vercel (simplest, keeps the visitor's country signal) or DNS-only at
   Cloudflare.
2. **Name.** Keep "B4GAMBLE" on the help site, or give it its own name. The
   name sets the wordmark, page titles, structured data, the owner page,
   letter sender name and bios.
3. **Google Analytics on the help site:** G1 same as `b4gamble.com` (your
   4 October choice), G2 only after "Accept cookies", **G3 none — no banner,
   counts from the server (recommended)**, or G4 GA4 except the Programme and
   Help. `b4gamble.com` stays as it is in every option.
4. **Non-profit entity, later.** Not needed for phases 1–3; if you want it
   later, which country and form. It would also bring the separate database.
5. **Help home page:** (a) the current home layout with the help menu, no new
   design, or (b) the pause plan as the home page.
6. **Sender and contact address on the help side:** keep `@b4gamble.com`, or a
   mailbox on `<help-domain>` (DNS records for Resend and an alias in Google
   Workspace).
7. **What still ties the Programme to the casino side:** (a) remove the
   partner-press stages from the weekly `programme_funnel` count and refuse
   casino links in every letter, the marketing broadcast included
   (recommended: it makes the owner page's sentence true), or (b) keep them and
   say so on the owner page.

## 23. Consequences

- **Revenue:** none directly; PR #530 already ended the Programme's path to
  casino pages. The main site loses the help pages' traffic to the help
  site; **INFERRED** small (1 Search Console click in 28 days).
- **Operations:** one more domain, Search Console property, Firewall check and
  runbook row; one code base and one deployment.
- **People:** signed-in users sign in once more after phase 3; anonymous
  in-progress journeys at the moment of the switch start again.
- **Trust:** the help site can be judged on its own content; the owner
  objection remains until a non-profit option is taken.
