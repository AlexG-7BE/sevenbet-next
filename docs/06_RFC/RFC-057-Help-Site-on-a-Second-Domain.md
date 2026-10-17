# RFC-057: Help-Only Site on a Second Domain from the Same Code

- **Status:** `ACTIVE` — approved by the Founder on 17 October 2026 («ок,
  начинай первый этап»), with his answers to every question of §22 recorded in
  [HELP-SITE-RFC-057-APPROVED-2026-10-17](../07_Decisions/HELP-SITE-RFC-057-APPROVED-2026-10-17.md).
  It is current authority for the architecture below. **Nothing in it is
  implemented yet:** phase 0 is done, phase 1 (code, all switches off) is the
  work that starts now, and `docs/CURRENT_STATE.md` records a phase as live
  only once it is observed on Production (§18).
- **Decision authority:** Founder decisions of 16 and 17 October 2026.

  16 October, through the question tool in the partner-traffic audit session:
  1. «Без казино для всех» — the Programme shows no casino link to anyone
     ([PROGRAMME-NO-CASINO-LINKS-2026-10-16](../07_Decisions/PROGRAMME-NO-CASINO-LINKS-2026-10-16.md),
     PR #530, merged on 16 October 2026 as `774dd2f7`);
  2. «Тот же код, второй домен» — a separate help-only site on a second domain,
     served by the same code and the same Vercel project, where the request
     host decides what is shown. The domain was open in the decision; the
     Founder chose and bought `pauseplan.help` the same day (§3);
  3. the step-3 lesson (Mission 08 «Research responsibly») is replaced by a
     help lesson; Mission number, step order and rewards stay; the Founder sees
     the text and screens before any merge.

  17 October, in chat, approving the two-site plan put to him that morning:
  4. **`b4gamble.com` is the commercial site.** «Полное меню для всех. Казино,
     бонусы и лучшие офферы видны каждому посетителю, а не только на страницах
     каталога. Это обычный коммерческий сайт для тех, кто играет и выбирает,
     где играть.» Casinos, Bonuses and Best Offers show in the header, the
     drawer and the footer of every public page to every visitor. This reverses
     the remaining door of
     [RESEARCH-NAVIGATION-TWO-DOORS-2026-10-10](../07_Decisions/RESEARCH-NAVIGATION-TWO-DOORS-2026-10-10.md)
     (door two was already withdrawn by its amendment 4). The menu change is
     its own decision record,
     `docs/07_Decisions/COMMERCIAL-MENU-FOR-EVERYONE-2026-10-17.md`, and its
     own pull request, written in parallel with this revision; this RFC
     references it and does not depend on its wording.
  5. **The Programme moves to `pauseplan.help`.** «Программа переезжает на
     pauseplan.help. С b4gamble.com туда ведёт одна ссылка „нужна помощь“.»
     One quiet link, no other help content on the commercial site (§5, §6.6).
  6. **Growth is commercial:** review and bonus SEO, sports betting, new
     partners. Outside this RFC's scope; it is the reason the main site must
     not be slowed down by help-shaped navigation.

  This RFC records the architecture for decisions 2 and 5, and the host half of
  decision 4. It does not implement decisions 1, 3 or 4; it depends on all
  three (§18).

  17 October, in chat, after reading this RFC and the eight questions of §22,
  each put to him with one recommendation:
  7. **«ок, начинай первый этап»** — the architecture is approved, phase 1
     starts, and with the same word he accepted every recommendation of §22 as
     it was written to him. The answers are §22 below and the decision record
     [HELP-SITE-RFC-057-APPROVED-2026-10-17](../07_Decisions/HELP-SITE-RFC-057-APPROVED-2026-10-17.md),
     which is the phase 0 gate.
- **Scope:** which routes the second domain serves, what `b4gamble.com` does
  with them and what it keeps, the one "need help" link, host routing,
  sign-in, consent and analytics, e-mail links, search files, the country
  block, CSP and media, Learn publication, social links, data, the
  owner-disclosure page, rollout, rollback and tests.
- **Depends on:** Product Vision & Principles §13–§17, RFC-002, RFC-017,
  RFC-018, RFC-019, RFC-020, RFC-021, RFC-025, RFC-028, RFC-030, RFC-036,
  RFC-037, RFC-039, RFC-046, RFC-052, RFC-053,
  PROGRAMME-NO-CASINO-LINKS-2026-10-16 and the menu record of 17 October 2026
  (`COMMERCIAL-MENU-FOR-EVERYONE-2026-10-17`, parallel PR).
- **Amends (`ACTIVE` RFCs), from 17 October 2026:** RFC-021 §5 (Production
  Better Auth trusts two exact hosts); RFC-046 §16, for the help host only —
  it carries no Google tag and no cookie banner (Q3 answered G3, and
  `b4gamble.com` keeps the 4 October 2026 decision unchanged); RFC-046 §7 —
  new partner presses no longer store the account and the weekly
  `programme_funnel` count loses its partner-press stages (Q7 answered (a);
  clearing the older rows is a separate data job, not part of phase 1);
  RFC-052 §7 and RFC-053's public-URL contract (the public origin of a guide
  depends on its category). Each amendment takes effect when the phase that
  carries it ships, not on approval.
- **Host and origin authority:** RFC-030 (one Production origin) and RFC-019
  (`lib/site.ts` as the single absolute-URL authority) are `HISTORICAL` in the
  registry, so under GOVERNANCE they are not current constraints and this RFC
  does not amend them. As an `ACTIVE` RFC it is now the authority for
  Production hosts and origins (two exact origins, one per site); the
  single-origin statements in RFC-030 and RFC-019 stay as historical records.
  RFC-030's exact-match principle is kept (§3).
- **Does not change:** the database schema (no table, column or migration);
  Mission order, prerequisites, rewards or XP; commercial authority
  (RFC-042, RFC-047, RFC-049, RFC-054); the `b4gamble.com` desktop home page,
  which stays visually unchanged; the country block policy.
- **Does not touch PR #530.** The Programme shows no casino, offer, bonus,
  comparison or `/r/` link to anyone, on either host. `app/program/layout.tsx`
  keeps passing `researchNavigation={false}` (or its successor), so the
  Programme keeps its clean shell while it still lives on `b4gamble.com`,
  although every other page there now shows the full commercial menu
  (§4.3). No Programme-to-casino path, cookie, lesson door or letter link
  comes back.

Throughout, `<help-domain>` stands for the help domain. **DETECTED (Vercel,
read 17 October 2026):** the Founder chose and bought `pauseplan.help` on
16 October 2026 in the team `alexg-7bes-projects`, with Vercel nameservers and
auto-renew on; it is deliberately not attached to the project yet, because
attached today it would serve the casino catalogue. The code-level text keeps
the placeholder so the design does not depend on the name. `HELP_ORIGIN` is
`https://<help-domain>`, which is `https://pauseplan.help` when committed.
"The main site" is `https://b4gamble.com`; "the help site" is `HELP_ORIGIN`.

Evidence labels follow [GOVERNANCE](../GOVERNANCE.md): **DETECTED** (seen in
the repository at the base below, or in a cited live record), **INFERRED**
(follows from detected facts, not observed), **PROPOSED** (this RFC's design),
**UNKNOWN** (not established) and **CONTRADICTION** (two current facts or
rules disagree).

## 0. Evidence base

- Repository: `AlexG-7BE/sevenbet-next`, `origin/main` at `774dd2f7`
  (17 October 2026), which includes PR #530 (merged from head `a5953b33`).
  The first draft was written at `800c2eb0`; this revision's line references
  were checked at `774dd2f7`.
- **Line references move, the facts do not (added on approval, 17 October
  2026).** The menu change has since landed on `main` as PR #533
  (`077e0233`), the parallel record's part A, so every `:line` citation below
  is as of `774dd2f7` and several have shifted by a few lines. Re-checked at
  `077e0233` and **DETECTED** unchanged in substance: `app/program/layout.tsx`
  still passes `researchNavigation={false}` twice (`:31`, `:33`); the PR #530
  guard still asserts exactly that, now at
  `tests/programme-no-casino-links.test.tsx:273`; `GUIDE_NAVIGATION` is
  `lib/public-shell.ts:19` with the same two entries; and the footer's
  "Programme and support" column is `components/public-shell/PublicFooter.tsx:51`
  with the same eight links. As §4.3 predicted, PR #533 rewrote
  `tests/public-shell.test.ts`, and `lib/research-access.ts` is gone, replaced
  by `lib/commercial-section.ts`. Phase 1 re-reads the inventories of §4.1 and
  §5 against the head it is written on rather than trusting these numbers.
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
  `app/(public)/terms/page.tsx`, `app/(public)/contact/*`, `app/layout.tsx`,
  `app/not-found.tsx`, `app/opengraph-image.tsx`, the five shells (§6.5),
  `lib/final-handoff/*`, `lib/email/service.server.ts`,
  `lib/analytics/programme-funnel.server.ts`, the `OutboundClick` model in
  `prisma/schema.prisma`, `docs/06_Operations/Geo-Block-Runbook.md`,
  `docs/06_Operations/Admin-Auth-Security.md`,
  `docs/06_Operations/Google-Authentication-and-Email-Readiness.md`,
  `docs/07_Decisions/PROGRAMME-FUNNEL-MCP-2026-10-14.md`,
  `docs/07_Decisions/PROGRAMME-NO-CASINO-LINKS-2026-10-16.md` and
  `docs/07_Decisions/RESEARCH-NAVIGATION-TWO-DOORS-2026-10-10.md`.
  For the previous revision also `components/public-shell/PublicFooter.tsx`
  (the three footer columns and `FooterCompliance`) and
  `lib/i18n/public-shell-catalog.ts`.
- Read for **this** revision, after a line-by-line review of the previous one
  against `774dd2f7`: `tests/programme-no-casino-links.test.tsx`,
  `tests/public-shell.test.ts`, `lib/public-shell.ts`,
  `components/public-shell/PublicNavigation.tsx`, `app/not-found.tsx`,
  the error boundaries (`app/global-error.tsx`, `app/(public)/error.tsx`,
  `app/(public)/casinos/error.tsx`, `app/(public)/compare/error.tsx`,
  `app/(public)/casino/[slug]/error.tsx`), the Learn views
  (`LearningCenterPage.tsx`, `LearningCategoryView.tsx`,
  `LearningArticleView.tsx`), `lib/seo/structured-data.ts`,
  `lib/seo/control-page-schema.ts`, `app/layout.tsx`,
  `lib/security/geo-block.ts`, `app/llms.txt/route.ts`, the IndexNow key
  route, `components/footer-compliance/FooterCompliance.tsx`, `lib/site.ts`,
  the top level of `public/`, and `lib/final-handoff/transforms.ts` with
  `generated-pages.json` — the last two by **running** the common transform
  over every capture and reading the links in the result, which replaces
  several UNKNOWNs and corrects three citations (§5, §6 rule 5, §21.23).
- Outside the repository:
  - the help-channel audit of 16 October 2026
    (`b4gamble-content/research/help-channels-audit-2026-10-16/REPORT.md`);
  - Google Search Console for `b4gamble.com`, read in the Founder's Chrome on
    16 October 2026 (session record, not the audit): 171 pages indexed,
    1 click and 2.03k impressions in 28 days;
  - the Vercel domain and project-domain records, read 17 October 2026
    (`pauseplan.help` bought, not attached);
  - the Founder's chat decision of 17 October 2026 (the two-site plan quoted
    in the header), recorded in parallel as
    `COMMERCIAL-MENU-FOR-EVERYONE-2026-10-17`.

## 1. Decision summary (PROPOSED)

1. **One project, two sites with two purposes.** The Vercel project
   `sevenbet-next` serves two exact Production hosts.
   - `b4gamble.com` is the **commercial site**: an ordinary comparison site
     for adults who already gamble and are choosing where to play. Casinos,
     Bonuses and Best Offers are in the header, the drawer and the footer of
     every public page, for every visitor (Founder, 17 October; the menu
     itself is the parallel record's change, not this RFC's).
   - `<help-domain>` is the **help site**: the Programme, the 10 steps, the
     pause plans, the help guides, `/beside`, `/innan`, the control answers
     and the helplines.

   Middleware classifies the host once, from an exact match against source
   constants, and every later decision reads that class. No request value ever
   chooses an origin.
2. **The help site is an allowlist.** It serves the Programme, the 10 steps,
   the pause plans (sv, da, en), help and responsible-gambling pages, help
   guides, `/beside`, `/innan`, the control answer pages, the helpline lists
   those pages print (**DETECTED**: they live in the page texts,
   `lib/i18n/static-pages/*`, not in a separate route), pause statistics,
   legal pages, contact and two new pages (owner disclosure, data statement
   for organisations).
   Every commercial or internal route, and every route not on the list,
   answers **404** there; static files the middleware never sees are covered
   by a Firewall rule (§4.2).
3. **One-way links, and one link back.** The help site never links to a
   commercial page, and never links to `b4gamble.com` at all. The main site
   links to the help site in exactly one place: one quiet "need help" line in
   the footer of every public page, in the page's language (§6.6). It is the
   only help content the main site carries.
4. **The main site hands help routes over.** After the help site is live and
   verified, `b4gamble.com` answers a permanent **301** for every help route to
   the same path on `HELP_ORIGIN`, and stops serving the Programme, the pause
   plans, the 10 steps, protected Help, the control pages and the help guides
   (§5). The help site's pages are self-canonical on `HELP_ORIGIN`.
5. **Same database, separate sessions.** Both sites use the one existing
   PostgreSQL database and the same user records. Sessions are host-only
   cookies, so a person signs in on each site separately. From phase 3 the
   customer account lives only on the help site, because every customer
   account is a Programme account (§9.2). A separate database is a later
   option (§16.4).
6. **No schema change.** The host is not stored anywhere.
7. **PR #530 is untouched.** On both hosts the Programme shows no casino,
   offer, bonus, comparison or `/r/` link to anyone, and keeps its own clean
   shell: `app/program/layout.tsx` passes `researchNavigation={false}` twice,
   on `b4gamble.com` while the Programme still lives there (§4.3) and on the
   help host afterwards (§6.5). The guard is
   `tests/programme-no-casino-links.test.tsx:262-263`, and it keeps passing
   through the menu change, phase 1 and phase 3.

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
  sources. The audit's conclusion, by group:
  - **a separate domain is what opens:** blockers (they judge the domain's
    content) and Google Play and YouTube links (the address must not lead to
    gambling); the Danish CfL "possibly";
  - **disclosure alone already opens, on one domain** (the audit's option A):
    private clinics, researchers, press and directories;
  - **neither opens:** the objection "the owner earns from casinos", which
    keeps UK charities, OHID-funded organisations, NHS and the Swedish state
    closed; only a non-profit entity could change that (§16.5).

**INFERRED:** while the Programme lives on the domain whose menu and
catalogue earn affiliate commission, every help channel sees the catalogue
first. A second domain with no commercial content is the smallest change that
lets the help channels judge the help content on its own.

**The other half, decided on 17 October 2026.** The split is not only about
the help side. On 10 October the research links were taken out of the menu
for most readers because help visitors met an affiliate menu first
(RESEARCH-NAVIGATION-TWO-DOORS, door two withdrawn on 16 October). Once the
help audience has its own domain, that reason no longer applies to
`b4gamble.com`: its visitors are adults choosing where to play, and hiding
the catalogue from them costs commercial clicks for no remaining benefit. The
Founder therefore reversed the rule for the main site and put growth there
(review and bonus SEO, sports betting, new partners). The two decisions are
one shape: **each site stops pretending to be the other.** The help site can
be judged by help channels, and the main site can be an ordinary comparison
site.

**INFERRED:** the measured cost of the split on the main site is small. Search
Console reported 171 indexed pages, 1 click and 2.03k impressions in 28 days
(16 October), and the help pages are a minority of them (§23).

## 3. Hosts

| Request host (Production) | Today (DETECTED) | Proposed |
| --- | --- | --- |
| `b4gamble.com` | serves the site | main site (commercial) |
| `www.b4gamble.com` | Vercel domain redirect 308 to the apex | unchanged |
| `<help-domain>` | `pauseplan.help`, bought 16 October 2026, Vercel nameservers, not attached to the project | help site, when `HELP_SITE_SERVING` is on (§7.3) |
| `www.<help-domain>` | not attached | Vercel domain redirect 308 to the apex; middleware fallback 308 to `HELP_ORIGIN` |
| generated `*.vercel.app` Production hosts, project alias | middleware 308 to `b4gamble.com`, except three cron paths | unchanged (308 to `b4gamble.com`) |
| any other host | 308 to `b4gamble.com` | unchanged |

**DETECTED:** `lib/auth/runtime-canonical-host.ts` holds the constant
`PRODUCTION_CANONICAL_ORIGIN = "https://b4gamble.com"`, and in Production every
other host is redirected there (RFC-030). **PROPOSED:** add a second source
constant `HELP_CANONICAL_ORIGIN = "https://pauseplan.help"`, committed in
phase 1. Matching is exact on protocol and host (lower-cased, no port, no
trailing dot), RFC-030's principle. Until the constant exists and the switch is on, the help
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
| `HELP` | serves | serves until phase 3, then 301 to `HELP_ORIGIN` and never again |
| `SHARED` | serves, with the help shell and help-host content | serves as today, with the commercial shell |
| `COMMERCIAL` | 404 | serves as today, and is the main site's whole purpose |
| `INTERNAL` | 404 | serves as today |
| not in the manifest | 404 | as today |

A class is about the **host that serves a route**, not about who may read it.
Every commercial page stays public, indexable and free of any account or
lesson gate (Product Vision §5 and §12), and after 17 October its links are in
the menu for every visitor of the main site.

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
| `/learn/responsible-gambling`, `/learn/responsible-gambling/*` | help guides: the protected category, which never carries an offer bridge (**DETECTED** `lib/articles/article-bridges.ts`) and whose related reading stays inside the category (**DETECTED** `lib/articles/related-reading.ts`). Not clean yet (**DETECTED**): every guide, the protected category included, ends with "Editorial methodology →" `/methodology` (`LearningArticleView.tsx:107`), a `COMMERCIAL` route; and the page prints a stored canonical URL resolved against `siteUrl` (§14). On the help host the methodology link is left out and only the path of a stored canonical is used |
| `/who-runs-this`, `/for-organisations` | new pages, §17 and §16.3 (slugs PROPOSED; they are written under the help site's own name, "Pause Plan", answered Q2) |
| `/help-share-image` | the help host's default social image (path PROPOSED, §8): no review, bonus or casino words |
| `/api/help-media/[key]` | the first-party help-guide image route (path PROPOSED, §13): it reads the same content-addressed storage keys as `/api/media/*` and serves only keys referenced by a published `responsible-gambling` guide. `/api/media/*` itself stays `COMMERCIAL` and answers 404 here, so no help page ever loads an image from `media.b4gamble.com` |

**`SHARED`**

| Routes | Help-host behaviour |
| --- | --- |
| `/` | the help home: the pause plan (answered Q5 (b)); the main home is unchanged |
| `/learn` | lists only `responsible-gambling` guides; a tag hub (Spelpaus, ROFUS, GAMSTOP) works as today because it already selects inside that category (**DETECTED** `lib/articles/pause-hub-selection.ts`). Help-host copy: today's meta description "Plain-language guides to casino bonuses, banking, games, reviews and responsible play" (`lib/i18n/learning-center.ts:47`, and its translations) is replaced, and the topic chips Bonuses, Banking, Casinos, Games and Industry (`lib/final-handoff/transforms.ts:466-472`) are not rendered |
| `/privacy`, `/terms`, `/contact` | the same controller and documents, with the sections that do not apply on the help host left out (§10, §17) |
| `/login`, `/reset-password`, `/unsubscribe` | customer sign-in; after phase 3 the main site's `/login` and `/reset-password` 301 to the help host, because customer accounts exist only for the Programme |
| `/api/auth/*`, `/api/program/*`, `/api/programme-access/*`, `/api/contact`, `/api/email/unsubscribe`, `/api/customer/email-preference`, `/api/public/pause-reminder`, `/api/presentation` | the APIs help pages call; never redirected |
| `/api/consent/analytics`, `/api/analytics/events` | **not served** on the help host: Q3 is answered G3, no Google tag, no banner, no optional cookies (§10) |
| `/ig`, `/fb`, `/x`, `/threads`, `/lana`, `/ig/*`, `/fb/*`, `/x/*`, `/t/*` | short links land on help pages (§15) |
| `/robots.txt`, `/sitemap.xml`, `/llms.txt`, icons, `/_next/*`, first-party static images | per-host content (§12); the static files are limited by §4.2 |
| the IndexNow key file | each host serves only its own key (§12): `/219017cffaba5177842beab195a2564c.txt` on the main host, a second key on the help host |

**`COMMERCIAL`** — 404 on the help host:
`/best-offers`, `/casinos`, `/casino/*`, `/bonuses`, `/compare`, `/catalog`,
`/bonus-guide`, `/wagering-calculator`, `/outbound/*`, `/r/*`, `/go/*`,
`/partner-creatives/*`, `/partner-preview`, every other Learn category and its
guides, `/faq`, `/methodology`, `/about`, `/affiliate-disclosure`,
`/can-you-trust-b4gamble` (it stays on the main site as its trust page; the
help site has its own `/who-runs-this`, §5),
`/for-creators`, `/for-creators/*` (its future is an open Founder choice of
16 October; it stays commercial either way), `/llms-full.txt`,
`/opengraph-image` (its text reads "Reviews, bonus terms side by side…",
**DETECTED** `app/opengraph-image.tsx:41-48`), `/api/public/[resource]`,
`/api/public/comparison`, `/api/media/*`.

**`INTERNAL`** — 404 on the help host: `/admin/*`, `/api/admin/*`,
`/api/mcp/*`, `/api/internal/*` (crons run on the generated Production host),
`/api/email/webhooks/*`, `/editorial-preview/*`,
`/launch-polish-error-harness`.

**PROPOSED:** a test lists every `page.tsx` and `route.ts` under `app/`, every
metadata route (`robots.ts`, `sitemap.ts`, `opengraph-image.tsx`, icons) and
every top-level folder and file of `public/`, and fails when one has no class,
so a new route or folder can never appear on the help host by accident.

### 4.2 What middleware cannot gate

**DETECTED:** the middleware matcher (`middleware.ts:504-506`) skips
`/_next/static/`, `/_next/image` and every raster image and font by file
ending. Those requests never reach the help gate, so on the help host
`public/casino-brands/*`, `public/demo-casinos/*`, `public/partner-preview/*`,
`public/casino-directory/*`, `public/best-offers/*` and
`public/bonus-directory/*` would be served, directly or through
`/_next/image`. "Every route not on the list answers 404" cannot hold through
middleware alone.

**PROPOSED:**

- A Vercel Firewall rule limited to the help host (host equals
  `<help-domain>`) over the `public/` tree, and over `/_next/image` requests
  whose `url` points into it. It is added in phase 2, before
  `HELP_SITE_SERVING` is turned on, and listed in the geo-block runbook next to
  the static-asset rule.
- **It is written as an allowlist, with a verdict for every top-level entry
  of `public/`** (corrected in this revision: the earlier deny list named six
  of the eleven, so "every route not on the list answers 404 there" did not
  hold for the other five). **DETECTED**, the eleven entries and their
  PROPOSED verdict on the help host:

  | `public/` entry | Help host |
  | --- | --- |
  | `best-offers`, `bonus-directory`, `casino-brands`, `casino-directory`, `demo-casinos`, `partner-preview` | **denied** — commercial imagery |
  | `brand` (`b4gamble-logo-512.png`) | **denied** — it is the B4GAMBLE mark and an absolute `b4gamble.com` URL in JSON-LD today (§8); the help site carries no B4GAMBLE wordmark or logo at all (answered Q2), and its own "Pause Plan" logo is served from its own path |
  | `learn` (`magazine-shelf-…jpg`, `welcome-bonus-feature-cover.png`) | **denied** — both are covers of commercial guides; help-guide images are first-party through the help image route (§13) |
  | `about` (`fresh-interruption.png`) | **denied** — `/about` is `COMMERCIAL` |
  | `data` (`spelpaus-registrations.csv`, `rofus-registrations.csv`) | **allowed** — the pause statistics the help pages print |
  | `home` (hero and chapter images, tool SVGs) | **denied** — the pause plan is the help home (answered Q5 (b)), so the handoff home's images are never requested there |

  The rule is reviewed whenever a top-level entry is added; the manifest test
  of §4.1 already fails on an unclassified folder, and the Firewall rule is
  the runtime half of the same list.
- Stated exception: hashed build files under `/_next/static/` are served on
  both hosts. They are not linked from help pages, carry no address in the
  sitemap and are not indexed; the matcher stays as it is (Founder decision of
  25 September 2026).

### 4.3 Help routes on the main host between the menu change and phase 3

The menu change (parallel record) ships before this RFC's phases. Between the
two, `HELP` routes are still served on `b4gamble.com`, now inside a shell that
shows Casinos, Bonuses and Best Offers to everyone. **Accepted and
time-bounded** — the Founder decided both halves on the same day, and phase 3
ends it by moving those routes off the main host:

- `/pause-plan`, `/beside`, `/innan`, `/10-steps`, `/pause-statistics`, the
  control pages and `/responsible-gambling` show the commercial menu on
  `b4gamble.com` until phase 3. A visitor who arrives there from a social post
  sees the catalogue in the header. This is the state the help site exists to
  end, so phase 3 is the point of the work, not an optional tail.
- **The Programme is the exception and does not change.** `app/program/layout.tsx`
  passes `researchNavigation={false}` and `EDITORIAL_ONLY` (**DETECTED**,
  PR #530), and the root not-found boundary does the same inside a Programme
  document, so no Programme document carries a research address even in its
  inline page data. The menu change must not touch that prop, and the help
  gate must not reintroduce it: the Programme keeps the clean shell on both
  hosts, before and after the move.
  **The guard is one assertion** (**DETECTED**,
  `tests/programme-no-casino-links.test.tsx:262-263`): it reads
  `app/program/layout.tsx` as text and requires `researchNavigation={false}`
  to appear exactly twice, for the header and the footer. That assertion is
  what the menu change and phase 1 must both keep passing.
  **`tests/public-shell.test.ts` is not that guard.** Corrected in this
  revision: the file contains no `researchNavigation` assertion at all
  (**DETECTED**). What it holds is the two-doors contract itself, asserted
  against the source text — the exact `GUIDE_NAVIGATION` array (`:36-38`),
  the literal body of `PublicNavigationDoor` (`:57-59`), the door counts 2, 3
  and 1 (`:63-65`), and the literal `const researchLinks = new Set([…])` line
  of `PublicFooter.tsx` with its count of 2 (`:74-75`). The 17 October menu
  change deletes that door, so **the menu PR rewrites this file**; it cannot
  "pass unchanged". Its other assertions must survive the rewrite: that no
  shell source — the Programme layout included (`:54`, `:78-82`) — reads the
  research contract or passes a lesson flag (§18, §20.1).
- **Protected Help** (`/help`) keeps its own shell (`ProtectedHelpShell`,
  **DETECTED**), which never carried research links, so it is unaffected by
  the menu change on either host.

## 5. What `b4gamble.com` does with help routes

**PROPOSED, phase 3 (§18):**

- A `GET` or `HEAD` for a `HELP` route answers **301** to the same canonical
  path and query on `HELP_ORIGIN`, in one hop: language and legacy
  normalisation happen first, inside the same response, so no request crosses
  a 308 and then a 301. API routes are never redirected.
- **The 301 list**, every one of them in every published language and with
  their legacy prefixes:

  | From (`b4gamble.com`) | To (`HELP_ORIGIN`) |
  | --- | --- |
  | `/program`, `/program/*` | the same path |
  | `/10-steps`, `/start` | the same path |
  | `/pause-plan`, `/innan`, `/beside`, `/pause-statistics` | the same path |
  | `/gambling-control`, `/control-without-quitting`, `/gambling-control-tools` | the same path |
  | `/help`, `/help/*` | the same path |
  | `/responsible-gambling`, `/responsible-gambling/*` | the same path |
  | `/responsible-gaming`, `/self-check`, `/tools/budget-calculator` | their existing target on the help host, in one hop (today they redirect to `/responsible-gambling`) |
  | `/learn/responsible-gambling`, `/learn/responsible-gambling/*` | the same path (§14) |
  | `/login`, `/reset-password` | the same path (§9.2) |
  | `/ig`, `/fb`, `/x`, `/threads`, `/lana`, `/ig/*`, `/fb/*`, `/x/*`, `/t/*` | straight to the final help URL, one hop, not 307 then 301 (§15) |

- **`/can-you-trust-b4gamble` stays on the main site** and is `COMMERCIAL`.
  Changed in this revision: the earlier draft had it 301 to
  `HELP_ORIGIN/who-runs-this`. A commercial site that takes affiliate
  commission needs its own trust page, and `/who-runs-this` is a different
  page for a different reader — who runs the **help** site and how the company
  earns elsewhere. Keeping both is not duplicate content as long as the texts
  differ, which the Founder's copy review checks (§17.1). What changes on the
  main page: its help-shaped next-step block becomes the one "need help" link,
  and `CONTROL_PATHS.trust` on the help host points at `/who-runs-this`
  (§6.5).
- **The main site keeps no other help content.** After phase 3 no page,
  section, card or menu entry of `b4gamble.com` carries the Programme, a pause
  plan, the 10 steps, protected Help, a control page, a help guide or a
  helpline list. The footer's "Programme and support" column
  (**DETECTED**, `PublicFooter.tsx:49`: eight links — Programme, 10 Steps,
  Responsible Gambling, Help, Pause plan, Beside, Pause statistics, Gambling
  control) is replaced by the single "need help" line (§6.6). The only things
  that stay are the legal notices the footer already prints for every reader
  — `ageNotice` "Adults only.", `operatorDisclaimer` "Not a gambling
  operator.", `commissionDisclosure` (**DETECTED**,
  `lib/i18n/public-shell-catalog.ts`) — and whatever a market's advertising
  rules require. **UNKNOWN:** whether GB, SE, DK or DE advertising *law*
  obliges an affiliate page to name a national helpline; no such obligation
  is recorded in the repository.
  **DETECTED, and the nearest recorded obligation (added in this revision):**
  `components/footer-compliance/FooterCompliance.tsx:7-13` records **Google's
  UK gambling certification** (Founder decision, 4 October 2026) as the
  reason every footer should state that outbound links go only to operators
  licensed where the visitor is, list free support in Great Britain — the
  National Gambling Helpline (GamCare) `0808 8020 133`, GamCare,
  BeGambleAware, GAMSTOP — name the company and mark the site 18+. That block
  is hidden, not removed (`FOOTER_COMPLIANCE_VISIBLE = false`, `:22`,
  Founder, 11 October 2026), and it takes a local help href
  (`PublicFooter.tsx:95`), which is one of the links phase 3 moves.
  **Gate:** before the "Programme and support" column is removed, confirm per
  launch market (GB, SE, DK, DE) that no required notice disappears with it,
  and decide what the Google-certification lines do if they are ever shown
  again — their GB support links are external (helpline, GamCare,
  BeGambleAware, GAMSTOP), so they survive the move, but their local help
  href does not. Where a notice is required, it stays as text on the main
  site, with the helpline named, and the "need help" link beside it.
- The main site's own links to the Programme, the 10 steps, the pause plan
  and help pages are **removed, not re-pointed**, except where the home page
  rule below applies, so no internal link depends on the redirect.
- **The full inventory of those links (DETECTED), added in this revision.**
  The earlier revision named only the footer column, which made phase 3 look
  like a configuration flip; it is about a dozen code changes, and §20.1's
  "exactly one help link per main-host page" fails until every row is done.
  Each row says what happens to it at phase 3.

  | Where (DETECTED) | What it links | Phase 3 |
  | --- | --- | --- |
  | `components/public-shell/PublicFooter.tsx:49` | the "Programme and support" column: Programme, 10 Steps, Responsible Gambling, Help, Pause plan, Beside, Pause statistics, Gambling control | the whole column goes; the single "need help" line takes its place (§6.6) |
  | `lib/public-shell.ts:16-19` `GUIDE_NAVIGATION` ("10 Steps" `/10-steps`, "Help" `/help`), rendered in the desktop header and the drawer of every public page (`PublicNavigation.tsx:134,157,205`) | two `HELP` routes in the menu of every page | both entries go from the main host's menu; the help shell keeps its own (§6, rule 3) |
  | `lib/public-shell.ts:77-101` `accountNavigationFor` → "Start Programme" `/program` and "Log in" `/login`, rendered at `PublicNavigation.tsx:172-173,181,232,240-241` | the primary action and account entry of every public page | both go: the commercial site shows no customer Log in and no Programme action (§9.2) |
  | `lib/final-handoff/transforms.ts:290-294` (`transformCommonHandoff`, run by `components/final-handoff/HandoffPage.tsx:56` for **every** handoff page) | rewrites `Start Programme` and `href="/program"` into a live Programme link | the rewrite is dropped for every page except the home, whose rule is below. 19 of the 21 captures carry the `Start Programme` marker, and the seven live users of `HandoffPage` are the home, `/learn`, `/methodology`, `/responsible-gambling`, `/bonus-guide`, `app/help/page.tsx` and `app/not-found.tsx` (the outbound pages use `CommercialHandoffPage`, which does not run this transform) |
  | `app/not-found.tsx:27` → `transformNotFoundHandoff` (`transforms.ts:1070-1081`) | `/10-steps`, verified present in the rendered output | removed. This is the root 404 boundary, which Next writes into **every** document's inline page data (its own comment, `:15-18`), so leaving it would put a `HELP` link in every main-host response and fail §20.1's own test |
  | `app/global-error.tsx:19`, `app/(public)/error.tsx:18`, `app/(public)/casino/[slug]/error.tsx:17`, `app/(public)/casinos/error.tsx:11`, `app/(public)/compare/error.tsx:11` | "Protected Help" `/help` on the error screens | each becomes the one "need help" link or plain text; an error screen is a page like any other for the count rule |
  | `app/(public)/contact/page.tsx:42`, `app/(public)/terms/page.tsx:26`, `app/(public)/bonus-guide/BonusGuideDocument.tsx:12` | `/help` inside the page body | the same |
  | `app/(public)/learn/LearningCenterPage.tsx:13` | "Start Programme" `/program` in the Learn bridge | removed from the commercial hub |
  | `app/(public)/learn/[category]/LearningCategoryView.tsx:42` | `/responsible-gambling` | removed; the category moves with its guides (§14) |
  | `app/(public)/learn/[category]/[slug]/LearningArticleView.tsx:107,110` | the in-body Programme bridge, and in the non-protected branch a `programmePath` link; the protected branch also links `/responsible-gambling` and `/help` | the non-protected branch loses its Programme link; the protected branch moves to the help host with its category |

  **PROPOSED:** the phase-3 PR changes every row above, and the §20.1 test is
  what proves none was missed — it reads the raw HTML and the inline page
  data of every main-host route, not only the footer.
- **The home page is the one place where two Founder rules meet.**
  **DETECTED, corrected in this revision by running the transforms over the
  captured home and reading the result:** the home renders **one** Programme
  link and no `/10-steps` link.
  - The one link is the hero call to action. The capture's
    `href="/program"` (and any `Start Programme` button) is rewritten by
    `transformCommonHandoff` to the language's Programme path
    (`lib/final-handoff/transforms.ts:290-294`, called from
    `components/final-handoff/HandoffPage.tsx:56`;
    `programmePathForPresentationLocale` supplies the path,
    `app/(public)/page.tsx:21-26`), and `transformHomeHandoff` only marks it
    `data-home-hero-cta` (`transforms.ts:741`).
  - The previous revision cited "About the Programme →" and
    `transforms.ts:1047,1081` for the home. That was wrong:
    `:1023-1047` is `transformHelpHandoff` (used by `app/help/page.tsx`) and
    `:1070-1081` is `transformNotFoundHandoff` (used by `app/not-found.tsx`).
    The marker "About the Programme" is absent from the `home` capture and
    present only in the `help` and `notFound` captures.
  - The home capture's single `/10-steps` sits inside the captured footer
    "Programme & Support" column, which `stripHandoffGlobalChrome`
    (`transforms.ts:225-266`) removes before React mounts the real shell.
    Rendered, the home's only route links of this kind are the Programme
    path and `/affiliate-disclosure`.

  Removing the hero link would change the desktop home, which the Founder's
  standing rule keeps untouched; keeping it means the home carries one
  cross-site link after the move.
  **PROPOSED:** the hero call to action keeps its words, place and look, and
  points at `HELP_ORIGIN`. **This is a change to the home's transform, not to
  an `href` in `page.tsx`:** the Programme path handed to `HandoffPage`
  becomes the help origin on the home, or `transformCommonHandoff` learns a
  cross-site Programme target for it. Nothing in the capture is edited. The
  home is therefore listed in §6.6 as a page allowed more than the single
  footer link — **one** extra link, not two.
  **Answered (Q9, 17 October 2026):** the link stays exactly as it is, words
  and place unchanged, and after phase 3 it points at the help site. The
  desktop home page is not changed. Even so, the change lives in the home's
  transform, which is the code the do-not-touch rule protects, so it is
  written and reviewed as carefully as a visible change and the home is
  checked on a phone and on the desktop before and after.
- The main sitemap stops listing help routes; the main `llms.txt` names the
  help site once (§12).
- Before phase 3 the main site serves help routes exactly as today, inside
  the new commercial shell (§4.3).

## 6. One-way link rule

**PROPOSED, an invariant of the help host:**

1. No anchor, form action, `fetch`, prefetch, image, script, stylesheet,
   redirect, `mailto:` or structured-data URL on a help-host response points
   to a `COMMERCIAL` or `INTERNAL` route, or to any `b4gamble.com` host. This
   covers the whole response body, not only what the screen shows: the inline
   page data Next writes into every document (`self.__next_f`) and the data
   responses the browser fetches during client navigation (`?_rsc=`
   requests).
2. **Exceptions, each checked by the link guard to be exactly this:**
   - plain text on `/who-runs-this` that names `b4gamble.com` as the
     company's other site, with no link (§17). Honesty about the owner needs
     the name; the rule against links keeps blockers and organisations from
     seeing a path into the catalogue;
   - the support address. **DETECTED:** `/contact` links to
     `mailto:support@b4gamble.com` (`app/(public)/contact/page.tsx:40,52`,
     `ContactForm.tsx:188`, constant `SUPPORT_MAILBOX` in
     `lib/contact/contracts.ts`). **Answered (Q6, 17 October 2026):** the help
     side gets a mailbox on the help domain eventually, and phase 2 may still
     use `support@b4gamble.com`. So this exception holds — that one `mailto:`
     is the only allowed `b4gamble.com` address on the help host — and it is
     removed when the help-domain mailbox exists (DNS and mailbox work, not
     code). The Privacy and Terms addresses are on `7be.io` and are not
     affected.
3. The help shell has its own header, drawer and footer: 10 Steps · Pause
   plan · Guides · Help, and in the footer the owner page, the data statement,
   Privacy, Terms and Contact. It has no research door, no `/for-creators`,
   `/affiliate-disclosure`, `/methodology`, `/about` or `/faq` link, no
   commission line, and it never passes research links as children, not even
   hidden ones.
4. **The rule is one-directional.** `b4gamble.com` → help site is allowed, in
   exactly one place (§6.6). Help site → `b4gamble.com` is never allowed,
   except the two text exceptions above. The reason the directions differ:
   a commercial site that points people to help loses nothing, while a help
   site that points people to a casino catalogue loses the help channels,
   which is the whole purpose of the second domain.
5. **CONTRADICTION (DETECTED):** the help pages and their shells carry
   commercial links today, some of them invisible:
   - The raw captures in `lib/final-handoff/generated-pages.json` contain
     `/best-offers`, `/casinos` and `/bonuses` in **every** page a help or
     shared route uses (`home`, `tenSteps`, `learn`, `responsibleGambling`,
     `contact`, `privacy`, `terms`, `notFound`). The four trust links are
     narrower than the previous revision said (measured in this revision):
     `/about`, `/methodology`, `/faq` and `/affiliate-disclosure` are in
     `home`, `tenSteps` and `learn` only; `terms` carries
     `/affiliate-disclosure` alone; `responsibleGambling`, `contact`,
     `privacy` and `notFound` carry none of the four. The `programme`,
     `help` and `login` captures carry no commercial or trust marker at all
     (`login` carries `href="/program"` and `/help`, which are `HELP`
     routes).
   - **What survives the common transform is now measured, not UNKNOWN**
     (`transformCommonHandoff`, which runs `stripHandoffGlobalChrome`, over
     each capture at `774dd2f7`): `home` → the Programme path and
     `/affiliate-disclosure`; `terms` → `/affiliate-disclosure`; `learn` →
     the Programme path and one guide link; `responsibleGambling` → the
     Programme path; `notFound` → `/10-steps`; `casinos`, `privacy`,
     `contact` and `help` → none. The captured chrome is stripped, so the
     commercial menu does not survive; the trust link
     `/affiliate-disclosure` does, and so do the Programme links. Page-level
     transforms may add more, so the guard still decides for the rendered
     page — but the help host must drop `/affiliate-disclosure` from the
     `home` and `terms` captures and from the Privacy and Terms sections that
     link it in code either way (§6.5).
   - The footer (`components/public-shell/PublicFooter.tsx`) has an Explore
     column whose research links sit inside `PublicNavigationDoor`
     (`PublicNavigationClient.tsx:67-77`, used at `PublicFooter.tsx:88-90`).
     The door shows nothing outside the research section, but its children
     are still written into the inline page data. The Trust column
     (`PublicFooter.tsx:50`) links `/about`, `/methodology`, `/faq`,
     `/affiliate-disclosure` and `/for-creators`.
     **After the menu change of 17 October the door is gone** and those
     research links are rendered for everyone on the main site, so on the
     main host they are no longer hidden — which is the point of that change,
     and makes nothing worse here. On the help host the links must not exist
     at all: the help shell builds them nowhere, hidden or shown, and the
     guard checks the inline page data either way. **INFERRED:** removing the
     door makes the help gate simpler, because "hidden children that still
     travel" stops being a main-site pattern the help shell could inherit.
   - The root `app/not-found.tsx` renders `PublicHeader` and `PublicFooter`.
     Its own comment (lines 15-18) says Next writes this boundary into every
     document's inline data. PR #530 builds it without research links only in
     a Programme document; on every other page it carries them.
   All of these must pass the link guard (§20) before the help host goes live.

### 6.5 Shells and links on help pages (DETECTED) and their help-host mapping

Chrome is built in five places: `app/(public)/layout.tsx`,
`app/program/layout.tsx`, `app/help/layout.tsx` (`ProtectedHelpShell`),
`app/start/layout.tsx` (`StartShell`, which already links only `/privacy`,
`/terms` and help resources) and the root `app/not-found.tsx`.
**PROPOSED:** on the help host, `(public)`, `program` and the root not-found
render the help shell; `help` and `start` keep their own shells with the
mapping below; the root not-found reads `resolveServerSite()` and is built
from the help shell there.

**The Programme's shell, stated exactly** (resolved in this revision; §1.7
and §4.3 promise the Programme the same clean shell on both hosts, and this
section asks the help host for a help shell — the two must be one design):
the help shell is **not a different component for the Programme**. It is the
same `PublicHeader` and `PublicFooter`, given the help host's link set, and
`app/program/layout.tsx` keeps passing `researchNavigation={false}` and
`commercialProductState="EDITORIAL_ONLY"` to them on both hosts, twice each,
unchanged as text. A Programme page on the help host therefore shows the help
shell's own links (10 Steps · Pause plan · Guides · Help) minus the research
links it never had, and the guard of
`tests/programme-no-casino-links.test.tsx:262-263` still counts two
occurrences. If an implementation ever needs a separate component on the help
host, the guard moves to asserting the prop per branch **in the same
commit**, and the help-host branch is covered by the same test; it is never
allowed to lose the count quietly (§20.1).

| Where (DETECTED) | Link | On the help host (PROPOSED) |
| --- | --- | --- |
| `app/(public)/10-steps/page.tsx:28` → `TenStepsPage.tsx:54` (`aboutHref`) | `/about` | → `/who-runs-this` |
| `components/protected-help/ProtectedHelpShell.tsx:54,72` (Help footer) | `/about` | → `/who-runs-this` |
| `lib/i18n/static-pages/gambling-control.ts:25` (`CONTROL_PATHS.trust`, listed at :161, :189, :217 and :251) | `/can-you-trust-b4gamble` | → `/who-runs-this` |
| `app/(public)/privacy/page.tsx:137` (partner-link section) | `/affiliate-disclosure` | section rewritten for the help host: it has no partner links; the owner and how the company earns are on `/who-runs-this` |
| `app/(public)/terms/page.tsx:30` ("Commercial relationships") | `/affiliate-disclosure` | section rewritten the same way |
| `lib/final-handoff/transforms.ts:295-300` (`transformCommonHandoff`) | "Full affiliate disclosure →" `/affiliate-disclosure`, "Methodology" `/methodology` | the first → `/who-runs-this`, the second removed |
| `app/(public)/learn/[category]/[slug]/LearningArticleView.tsx:107` | "Editorial methodology →" `/methodology` | removed |
| `PublicFooter.tsx` Explore and Trust columns, `PublicHeader` research door | research and trust links | not rendered (help shell) |
| `app/not-found.tsx` | public header and footer | help shell |

### 6.6 The main host's one link to the help site

**PROPOSED.** `b4gamble.com` carries exactly one link to the help site.

- **Where:** one line in the footer, on every public page, in the page's own
  language. Not in the header, not in the drawer, not on the home hero, not
  repeated inside page bodies. The desktop home is not redesigned for it; the
  footer line is the only change there.
- **How:** an ordinary text link to `HELP_ORIGIN` (the page's language prefix
  when the help site publishes that language, otherwise the help site's own
  default), `rel="nofollow"`, no logo, no banner, no interstitial.
- **Count:** every main-host page carries that one footer link and no other
  link to the help site. Three pages may carry one more, and only those: the
  home (its existing hero call to action — one link, §5),
  `/can-you-trust-b4gamble` and `/about` (one mention each, if the Founder's
  copy review puts it there, §6.7). The test in §20.1 fails on any main-host
  response with no `HELP_ORIGIN` link, or with more than one outside those
  three pages.
- **The count is reached by code changes, not by configuration.** Every row
  of the §5 inventory — the menu's `10 Steps` and `Help` entries, the
  "Start Programme" action, the account entry, the handoff rewrite, the root
  404 boundary, the error screens and the Learn bridges — is a main-host
  surface that links a `HELP` route today. Until all of them are changed,
  the count rule fails on most pages of the site.
- **Wording for the Founder to approve** (two options per language; the third
  column is the plain meaning). Other published languages are translated from
  the chosen option:

  | Language | A — short | B — explicit (recommended) |
  | --- | --- | --- |
  | English | "Need help?" | "Need help with your gambling? Free pause plan and 10-step programme →" |
  | Swedish | "Behöver du hjälp?" | "Behöver du hjälp med ditt spelande? Gratis pausplan och 10-stegsprogram →" |
  | Danish | "Brug for hjælp?" | "Brug for hjælp med dit spil? Gratis pauseplan og 10-trinsprogram →" |

  **Recommendation: B.** On a casino-comparison site a bare "Need help?"
  reads as customer support for the site; B says what is on the other end and
  needs no second click to find out. It is still one quiet line of text.
- **INFERRED, the cost of the link:** it is a public, machine-readable
  association between the two domains. Blockers and site-classification
  services follow outbound links, so the help domain can be joined to a
  gambling-affiliate domain by anyone who looks — exactly what phase 4 asks
  them not to do. `rel="nofollow"` keeps search engines from treating it as an
  endorsement but hides nothing. The association exists anyway, because
  `/who-runs-this` names the owner in plain text; the honest version is
  better than a hidden one. The alternative, no link at all, was rejected: a
  person who needs help and is on the commercial site must have a way out of
  it.
- **UNKNOWN:** whether a blocker that classifies `b4gamble.com` as a gambling
  affiliate also classifies a domain it links to. The phase-2 blocker check
  (§20.3) is run again after the link ships, and the link is the first thing
  to remove if a blocker categorises the help domain because of it.

### 6.7 What each host says about the other

**PROPOSED.** Both sites tell the truth about the other; only one of them
links.

| Surface | What it says about the other site |
| --- | --- |
| `b4gamble.com` footer, every page | the one "need help" link (§6.6) |
| `b4gamble.com` home | its existing hero call to action — one link — points at `HELP_ORIGIN`; nothing else about the home changes (§5) |
| `b4gamble.com` `/can-you-trust-b4gamble` and `/about` | may name the help site in plain words and link it once more in the page body — the only pages allowed a second link (§6.6), and only if the Founder's copy review puts it there |
| `b4gamble.com` `/privacy`, `/terms` | name the operator (7BE Inc.) as today; no change for the help site |
| `b4gamble.com` `llms.txt` | one line naming the help site for help and the Programme (§12) |
| `b4gamble.com` sitemap, hreflang, JSON-LD | never contain a `HELP_ORIGIN` URL (the 301s do the moving) |
| help site `/who-runs-this` | names 7BE Inc. and `b4gamble.com` in plain text, **not linked** (§6, rule 2; §17) |
| help site `/for-organisations` | the same plain-text naming, with the data answers (§16.3) |
| help site everywhere else | nothing: no mention, no link, no logo, no shared share image |
| help site `llms.txt`, sitemap, JSON-LD | only `HELP_ORIGIN` URLs; the `Organization` node is the help site's own (§8) |

**INFERRED:** an organisation that checks the help site will find the owner
named on the first page it looks at, and will not be able to click through to
a casino catalogue. That is the asymmetry the audit's refusals asked for.

## 7. Host routing in middleware

### 7.1 Order (PROPOSED)

1. **Host decision** (`resolveRuntimeCanonicalHost`, extended): exact main
   host → `main`; exact help host with `HELP_SITE_SERVING` on → `help`;
   `www.<help-domain>` → 308 to `HELP_ORIGIN`; cron paths on generated hosts →
   continue; everything else → 308 to `b4gamble.com` (RFC-030, unchanged).
2. **Country block** (`geoBlockGate`), unchanged. Corrected in this revision:
   the gate is host-independent **for the 451 decision only**. It does read
   the hostname — for the owner cookie's domain
   (`ownerCookieDomain`, `lib/security/geo-block.ts:134-135`, used at `:153`
   and `:168`) and for the log line (`:201`) — which is exactly what gives
   the owner cookie `Domain=b4gamble.com` on the main host and a host-only
   cookie everywhere else (§13). **DETECTED.**
3. **Help gate** (help host only): classify the path (§4). `COMMERCIAL`,
   `INTERNAL` or unknown → rewrite to a help-safe not-found page with status
   404, `Cache-Control: private, no-store` and `X-Robots-Tag: noindex`. While
   `HELP_SITE_REDIRECTS` is off, every help-host response also carries
   `X-Robots-Tag: noindex`, so a help page is never indexable on both hosts
   at once (§18).
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
pattern. **PROPOSED:** two switches, each read literally in one function, both
off by default:

| Variable | Effect when `true` |
| --- | --- |
| `HELP_SITE_SERVING` | Production treats the exact help host as the help site; otherwise it is redirected like any unknown host |
| `HELP_SITE_REDIRECTS` | the main host answers 301 for `HELP` routes, and help-host pages keep their normal robots policy; while it is off, every help-host response is `noindex` |

There is no separate indexing switch. If the help host became indexable while
`b4gamble.com` still served the same pages, each self-canonical on its own
host, search engines would see the same pages twice; the two changes happen in
one deployment.

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
HTML for the other.

**DETECTED, and not per host today:**

- `app/robots.ts` uses no dynamic API and no `dynamic` export.
  **INFERRED:** Next renders it once at build, as it does for metadata routes
  without a dynamic API, so both hosts would get one body with
  `Sitemap: https://b4gamble.com/sitemap.xml`. **PROPOSED:** robots reads the
  site (`resolveServerSite()`) and is `force-dynamic`.
- `unstable_cache` in `app/sitemap.ts:167` (`sitemap-market-products-v1`,
  keyed by country) stores entries whose values are absolute URLs
  (`absoluteUrl(...)` inside `indexableMarketProductPaths`), under keys with
  no site. **PROPOSED rule:** every cache entry whose value holds an absolute
  URL has the site in its key, or stores paths only and builds absolute URLs
  after the read.
- `app/opengraph-image.tsx` is a file-convention image with commercial text;
  it is `COMMERCIAL` (§4.1), and the help host has its own image (§8).
- **Two routes send a shared `public` cache header** (added in this revision;
  `export const dynamic = "force-dynamic"` governs Next's render, not the CDN
  header, so the `force-dynamic` note above does not cover them):
  `app/llms.txt/route.ts:30` sends `cache-control: public, max-age=3600` and
  the IndexNow key route `app/219017cffaba5177842beab195a2564c.txt/route.ts:8`
  sends `public, max-age=86400`. Both bodies differ by host under §12 — a
  per-host `llms.txt`, and a main key file that must answer 404 on the help
  host. **PROPOSED:** both take the rule below; `llms.txt` is served with a
  host-varying cache policy (`private`, or `public` only once the host is
  proven to be part of the cache key), and the key files are two different
  paths, one per host, so neither can be served from the other's cache.

**UNKNOWN:** whether Vercel's CDN cache key includes the host for responses
marked `public` with `s-maxage`. **PROPOSED rule:** any response whose body
differs by host is `private, no-store` or lives at a host-specific path; the
phase-2 checks prove it on Production, `llms.txt` and the key files included.

## 8. Origins in code

**DETECTED:** `lib/site.ts` exports a module constant `siteUrl`;
`resolveSiteUrl` returns `https://b4gamble.com` for both Production and
Preview; `absoluteUrl`, canonical links, hreflang, structured data
(`ORGANIZATION_ID`, `WEBSITE_ID`), the sitemap, robots, `llms.txt`, IndexNow and
the Learn verifier all derive from it.

**DETECTED:** the root layout exports a static `metadata` object
(`app/layout.tsx:37-52`) with `metadataBase: new URL(siteUrl)`, the default
title "B4GAMBLE (Before Gamble) | Know your limits before you play", the
default description "Educational tools, private self-checks and transparent
casino comparison…" and `openGraph.siteName: "B4GAMBLE"`. Every page without
its own fields prints that description, and relative canonical and Open Graph
URLs resolve to `b4gamble.com`.

**DETECTED:** the default social image `app/opengraph-image.tsx` reads
"Reviews, bonus terms side by side and a 10-step control plan" with the pills
"Reviews", "Bonus terms" and "10-Step Programme" (lines 41-48). Pages that name
it explicitly do so through `OPEN_GRAPH_IMAGE_PATH` (`lib/seo/social-image.ts`)
and `DEFAULT_OPEN_GRAPH_IMAGES` (`lib/seo/programme-metadata.ts:35`), the
Programme's pages included.

**DETECTED, the JSON-LD the root layout prints on every page** (added in this
revision): `app/layout.tsx:74-75` renders `organizationSchema()` and
`websiteSchema()` in the body of every document, help pages included.
`lib/seo/structured-data.ts:35-54` hardcodes `name: "B4GAMBLE"`,
`alternateName` ("Before Gamble", "Before You Gamble", "B4 Gamble"),
`legalName: "7BE Inc."`, `url: siteUrl`, `sameAs` (the brand's profiles) and
a `logo.url` of `absoluteUrl(ORGANIZATION_LOGO_PATH)` — an absolute
`b4gamble.com` URL to `/brand/b4gamble-logo-512.png` (`:12`), which rule §6.1
forbids on a help-host response. Two more call sites print the same identity
on `HELP` pages: `lib/seo/control-page-schema.ts:20`
(`organizationReference()` as the publisher of every **control page**) and
`app/(public)/learn/[category]/[slug]/page.tsx:88-89` (`editorialAuthor()`
and `organizationReference()` on every guide, the **help guides** included);
both helpers return `url: siteUrl` (`structured-data.ts:70-77`).

**CONTRADICTION:** one module constant cannot give two sites their own
canonical URLs.

**PROPOSED:**

- `siteUrl` keeps meaning the main origin; a `helpUrl` constant is added.
- The root layout replaces the static `metadata` with a `generateMetadata`
  that reads `resolveServerSite()`: on the help host `metadataBase` is
  `HELP_ORIGIN`, the default title and description are help copy (§17.1), and
  `siteName` is the help site's own name, "Pause Plan" (answered Q2).
- A help social image at its own path (`/help-share-image`, path PROPOSED,
  class `HELP`) with no review, bonus or casino words. On the help host the
  root metadata, `programme-metadata.ts` and `social-image.ts` name it;
  `/opengraph-image` is `COMMERCIAL` and answers 404 there.
- The root not-found boundary reads the site and uses the help shell on the
  help host (§6.5).
- Every absolute-URL producer that can run on the help host takes the site
  explicitly (`absoluteUrl(path, site)`); server components pass
  `resolveServerSite()`.
- Structured data on the help host: its own `WebSite` (`HELP_ORIGIN/#website`)
  and its own `Organization` node (`HELP_ORIGIN/#organization`, legal name
  7BE Inc., `url: HELP_ORIGIN`), because a `b4gamble.com` URL in JSON-LD would
  break rule §6.1. The display name is "Pause Plan" (answered Q2); `sameAs` lists the social
  profiles whose bios point to the help site (§15).
  Every field above takes the site, not only the `url`:
  - `logo` — the help host cannot print `ORGANIZATION_LOGO_PATH` resolved
    against `siteUrl`, and it cannot serve `public/brand/b4gamble-logo-512.png`
    first-party either, because that re-exports the B4GAMBLE mark onto a site
    the help host does not use (and §4.2 denies the folder). The help host's
    `logo` is its own file at its own path, made with the "Pause Plan" name of
    Q2, or the field is left out
    until that name exists;
  - `name` and `alternateName` — "Pause Plan" (answered Q2); the "Before Gamble" aliases are
    the main site's brand and are not printed on the help host;
  - `organizationReference()` and `editorialAuthor()` take the site too, so
    the control pages (`lib/seo/control-page-schema.ts:20`) and the help
    guides (`app/(public)/learn/[category]/[slug]/page.tsx:88-89`) print the
    help identity;
  - the link guard of §20.2 reads JSON-LD, so a missed field fails a test
    rather than reaching a help organisation's crawler.
- Hardcoded `b4gamble.com` strings that help pages print (**DETECTED**): the
  "plan is here" texts in `lib/i18n/static-pages/beside.ts`, the calendar
  descriptions in `lib/i18n/static-pages/pause-plan.ts`, the calendar UID in
  `app/(public)/pause-plan/PausePlanTool.tsx` and the visible link text in
  `app/(public)/beside/page.tsx`. They take the help origin. The commission
  lines those pages print are a copy question, listed in §17.1.

## 9. Sign-in and session cookies

### 9.1 Facts (DETECTED)

- Better Auth (`lib/auth/config.ts`) uses `BETTER_AUTH_URL` as a fixed base URL
  outside Preview whenever it is set (`lib/auth/runtime-config.ts:43-52`) and
  `BETTER_AUTH_TRUSTED_ORIGINS` as a comma-separated list. In Preview it
  already uses the dynamic form
  `baseURL: { allowedHosts: [host], protocol: "https" }`
  (`lib/auth/runtime-config.ts`).
- The readiness runbook tells release governance to set
  `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_URL` and `BETTER_AUTH_TRUSTED_ORIGINS`
  to `https://b4gamble.com`
  (`Google-Authentication-and-Email-Readiness.md:59`), and the Google consent
  screen names the B4GAMBLE application with B4GAMBLE home, privacy and terms
  links (`:64`).
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
  is. The code refuses any other host. A set `BETTER_AUTH_URL` would fix the
  base URL to one host, so in Production, once `HELP_SITE_SERVING` is on, the
  code uses the dynamic form and treats a set `BETTER_AUTH_URL` as a
  configuration error unless it is one of the two origins (as Preview already
  refuses a conflicting value). Phase 1 updates line 59 of the readiness
  runbook to match.
- **Cookies stay host-only.** Two registrable domains cannot share a cookie,
  and they should not: a session on the help host is a separate session row
  for the same user. Signing out on one site does not sign out the other.
  Nothing is read across hosts, and no cookie is set on one host for the
  other. The whole inventory, per host:

  | Cookie | Main host | Help host |
  | --- | --- | --- |
  | `__Secure-better-auth.session_token` and the OAuth state/PKCE cookies | as today; no customer sign-in surface from phase 3, staff only | its own, host-only; a sign-in starts and finishes on one host |
  | consent choice (cookie banner) | as today (RFC-046 §16) | none with G3; its own, host-only, with G1/G2/G4 — the banner is then shown again after the 301 (§10) |
  | `b4g_owner` (geo unlock) | `Domain=b4gamble.com` as today | host-only; the owner unlocks once there (§13) |
  | `b4g_research_access`, `b4g_research_opened_at`, the `b4g:research-access` event | **gone** since PR #530; an old cookie in a browser is ignored and expires on its own | never existed and is never created |
  | Programme access proof and anonymous journey (`sessionStorage`, signed) | per origin, as today | per origin; never copied across origins (RFC-021) |

  **The menu change of 17 October adds no cookie.** The main site's menu now
  shows the same links to everyone, so it reads no cookie, no session and no
  Programme state at all — which is strictly less than the two-doors code it
  replaces.
- **Google:** the Founder adds `HELP_ORIGIN` to the Production client's
  authorised JavaScript origins and
  `HELP_ORIGIN/api/auth/callback/google` to its authorised redirect URIs, and
  adds `<help-domain>` to the consent screen's authorised domains. **UNKNOWN:**
  the consent screen's verification state; **INFERRED:** Google asks for
  ownership of an authorised domain (Search Console), and a verified screen may
  need review after a change. The OAuth state and PKCE cookies are host-only,
  so a sign-in starts and finishes on one host.
- **Google consent screen — answered (Q8, 17 October 2026): (a) for phase 2,
  (b) before phase 4.** With one Production client, a person signing in on the
  help host sees the B4GAMBLE application name and its `b4gamble.com` home,
  privacy and terms links on Google's screen. That is accepted while the help
  site is live but not yet announced, because sign-in has to work on the help
  host first. **INFERRED** (Google's setup): the consent screen belongs to the
  Google Cloud project, so a separate name and links need a second client in
  its own project; before phase 4 (outreach) the help host gets that second
  client, carrying the "Pause Plan" name of Q2 and the help host's own privacy
  and terms links. It needs Better Auth to choose the Google client by host
  (**INFERRED:** one Better Auth instance per site; feasibility checked in
  phase 1) and its own consent-screen verification.
- **Customers end up only on the help site.** Every customer account is a
  Programme account (**DETECTED**, PROGRAMME-NO-CASINO-LINKS §5: accounts are
  opened on the Programme's save step or through Log in, which leads into the
  Programme). Once the Programme is on the help site, the main site has
  nothing for a signed-in customer to do, so from phase 3 `/login` and
  `/reset-password` 301 there (§5) and **the commercial site shows no Log in
  or account entry in its menu at all** — one less help-shaped thing on a
  commercial page, and no second sign-in surface to keep safe. The help
  site's sign-in is unchanged by this. Admin is separate and untouched.
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
  (**INFERRED** from the dynamic base URL). **DETECTED:** the letter service
  refuses them today: `validAuthActionUrl` (`lib/email/service.server.ts:70-79`,
  used at `:681-683`) requires the action URL's origin to equal `siteUrl`
  (`b4gamble.com`), so `sendAuthEmail` returns `invalid-action-url` and no
  verification or reset letter is sent. **PROPOSED, phase 1:** auth letters
  accept an action URL whose origin is exactly one of the two source-constant
  origins (the request's own origin, since Better Auth builds the URL from
  it); any other origin is still refused. E-mail sign-up and password reset on the help host
  are phase-2 checks (§20.3).

## 10. Consent and analytics — answered (Q3): none on the help host

### 10.1 Facts (DETECTED)

- RFC-046 §16 (Founder, 4 October 2026): the Google tag `G-11MX6NPS95` is in
  every Production page's `<head>` and counts every visitor from the first
  page; "Reject cookies" turns it off; it never sends from protected Help, the
  self-check or Admin (`lib/analytics/excluded-paths.ts`). Programme pages are
  counted.
- First-party analytics is consent-gated (RFC-046 §4).
- The help-channel audit (§3.4) records that Help for Dependency cited data
  protection, and that the database is in the United States.

### 10.2 The answer: G3 (the main site keeps the 4 October decision unchanged)

**Founder decision, 17 October 2026 (Q3): G3.** No Google tag and no cookie
banner on the help host; the counts come from the server. `b4gamble.com` is
not touched by this. The options as they were put to him:

| Option | What happens on `<help-domain>` | Banner | Cost |
| --- | --- | --- | --- |
| **G1** Same as the main site | GA4 from the first page, "Reject cookies" turns it off | yes | Help organisations see Programme pages counted by Google; the same GA4 ID on both domains; the cookie banner shown again after the 301 |
| **G2** Opt-in | GA4 and first-party analytics only after "Accept cookies" | yes | few numbers; the same GA4 ID on both domains; the cookie banner shown again after the 301 |
| **G3** None (recommended) | no Google tag, no optional cookies; counts come from what the server already records: `programme_funnel`, the `social_hit` log line, request logs and the proposed help-link count (audit item 6) | **none** | no GA4 report for the help site; Search Console still reports search |
| **G4** GA4 except Programme and Help | G1, with `/program*` added to the excluded paths | yes | Programme pages not counted; the same GA4 ID on both domains; the cookie banner shown again after the 301 |

**INFERRED:** the same `G-11MX6NPS95` tag on both domains is a public marker
that blockers and site-classification services can use to join the help
domain to `b4gamble.com`; the consent choice is stored per host, so a person
who answered the banner on `b4gamble.com` is asked again on the help host.

G3 was recommended and chosen: it is the only option that lets the owner page
say "this site sets no tracking cookies", it needs no banner (one notice
fewer, as the Founder's consent-once rule asks), and the CSP can drop the
Google hosts on the help host. **What phase 1 builds:** the Google tag and the
consent banner are not rendered on the help host, `/api/consent/analytics` and
`/api/analytics/events` are not served there (§4.1), the help host's CSP drops
the Google hosts (§13), and the help site's numbers come from
`programme_funnel`, the `social_hit` log line, request logs, the help-link
count and Search Console. This amends RFC-046 §16 for the help host only.

## 11. E-mail links

**DETECTED:**

- `resolveLifecycleEmailRuntimeConfig` accepts only `NEXT_PUBLIC_SITE_URL`
  with host `b4gamble.com`, and sender headers ending `@b4gamble.com`.
- `validAuthActionUrl` (`lib/email/service.server.ts:70-79`, used at
  `:681-683`) accepts a verification or reset link only when its origin equals
  `siteUrl`; any other origin makes `sendAuthEmail` return
  `invalid-action-url` (§9.2).
- `approvedStaticEmailUrl` in `lib/email/templates.server.ts` accepts static
  links only on `https://b4gamble.com`. Since PR #530 (merged) it refuses links
  into the research section and partner routes in every template, the
  marketing broadcast included (`templates.server.ts:47-81`), when saved, when
  activated and when rendered. Other `b4gamble.com` links, such as `/about`,
  are still accepted.
- Programme, pause and account letters carry `programme_url`, `plan_url`,
  `action_url` and `unsubscribe_url`. The pause letters' switch
  (`PAUSE_LETTERS_ENABLED`) is off.

**CONTRADICTION:** letters to Programme users would keep sending people to
`b4gamble.com`, and help-host accounts would get no verification or reset
letter at all.

**PROPOSED:**

- **Phase 1:** auth letters accept the request's own origin from the
  two-origin allowlist (§9.2), so e-mail sign-up and reset work on the help
  host from phase 2.
- **Phase 3:** every customer letter (welcome, Programme, pause) links to
  `HELP_ORIGIN` — and only there. The runtime config accepts the help origin
  for those purposes; unsubscribe works on either host because the token
  lives in the shared database.
- Casino links are already refused in every letter (PR #530). From phase 3
  the template guard also refuses every `b4gamble.com` link in customer
  templates, the marketing broadcast included, because every customer account
  is a Programme account. **The 17 October decision does not loosen this.**
  The main site's menu opening to every visitor is about the site; it says
  nothing about letters, which go to people who came for the Programme. A
  commercial letter to Programme people would be exactly the use of Programme
  data for commercial targeting that AGENTS.md forbids. If the Founder ever
  wants a commercial mailing list, it needs its own consented list and its own
  decision, not these accounts.
- The sender stays `@b4gamble.com` through phase 2 and moves to a help-domain
  mailbox afterwards (answered Q6: (b) eventually, (a) acceptable for phase 2);
  a help-domain sender needs Resend DNS records on `<help-domain>` and an alias
  in Google Workspace. That is DNS and mailbox work, not code, so it does not
  gate any phase.
- Contact (RFC-028) is unchanged: the form posts to the host's own
  `/api/contact`. The `mailto:` support address stays `support@b4gamble.com`
  until that mailbox exists (§6, rule 2).

## 12. Search: sitemap, robots, `llms.txt`, IndexNow, hreflang, consoles

**PROPOSED, per host:**

| File | Help host | Main host |
| --- | --- | --- |
| `sitemap.xml` | `HELP` and help-relevant `SHARED` routes in every indexable language, help guides only; no `b4gamble.com` URL ever appears in it | from phase 3, today's list minus every `HELP` route and the moved help guides: casinos, reviews, offers, bonuses, the other Learn categories, the trust and legal pages. It never lists a `HELP_ORIGIN` URL — the 301s move readers, the help sitemap moves crawlers |
| `robots.txt` | rendered per request (§7.4): allow all, `Sitemap: HELP_ORIGIN/sitemap.xml`; no `/r/` rules needed (404) | unchanged, now rendered per request; its `Sitemap:` line stays the main one |
| `llms.txt` | the help site: the one phrase, the Programme, pause plans, help guides, control answers, owner page, data statement; no casino text | the commercial site, with the help site named in one line for readers who need help — the mirror of the footer link (§6.6). The 15 October ordering that put the Programme first (AEO work) is reversed on this host: comparison first, the help line last |
| `llms-full.txt` | 404 (offers) | unchanged |
| IndexNow | its own, second key and key file, at its own path; announcements are grouped by host, one POST per host with that host's key, and a guide is announced under the host it lives on | unchanged for commercial URLs; its key file is not served on the help host. At phase 3 the moved URLs are announced on both: the old ones from the main host (so the 301 is read) and the new ones from the help host |
| icons (`app/icon.svg`, `app/favicon.ico`) | the help site's own icon, under the name "Pause Plan" (answered Q2); the current `icon.svg` is the B4GAMBLE mark, so on the help host it is replaced, not shared | unchanged |
| hreflang | language alternates on `HELP_ORIGIN` only | commercial pages only, alternates on `b4gamble.com` only. No page ever lists an alternate on the other host: two hosts are two sites, not two languages of one |

**DETECTED, where the per-host sitemap split actually happens:** the sitemap
is built from `coreRoutes` in `lib/site.ts:28-50`, a single list that mixes
`HELP` paths (`/10-steps`, `/program`, `/responsible-gambling`, `/help`,
`/pause-plan`, `/beside`, `/pause-statistics`, `/gambling-control`,
`/control-without-quitting`, `/gambling-control-tools`) with `COMMERCIAL`
ones (`/casinos` and the rest through the market product paths, plus
`/methodology`, `/affiliate-disclosure`, `/about`, `/faq`, `/bonus-guide`,
`/wagering-calculator`, `/for-creators`, `/can-you-trust-b4gamble`). **PROPOSED:**
that list is split by the §4 class — it is the one place to change, and the
route-manifest test of §4.1 is what keeps the two in step.
Both hosts' `cache-control` for these files follows §7.4: `llms.txt` and the
key files may not share a `public` cache entry across hosts.

**DETECTED:** `indexNowPayload` filters URLs to the single host of `siteUrl`,
the key is a public constant (`INDEXNOW_KEY`, `lib/seo/indexnow.ts:18`), and
IndexNow requires the key file on the host being announced. **INFERRED:** the
same key would technically work on both hosts, but a key file shared by two
domains is a public marker that blockers and site-classification services can
use to join them, so the help host gets its own key.

**Search Console and Bing (Founder, outside the repository):** two properties
from phase 2, one per site.

- `sc-domain:b4gamble.com` stays as it is and becomes a purely commercial
  property: after phase 3 its help URLs fall out through the 301s, and what
  is left is the catalogue, reviews, offers, bonuses and the commercial Learn
  categories. That is also the property whose numbers measure the commercial
  growth of decision 6.
- `sc-domain:<help-domain>`, a new Domain property verified by a DNS TXT
  record under the Founder's Google account, with the help sitemap submitted
  there, and the site added in Bing Webmaster (import from Search Console).
- **INFERRED:** Google's change-of-address tool is for moving a whole site, so
  a partial move relies on the 301s and the new sitemap; verify before use.
- **DETECTED (Search Console, read in the Founder's Chrome on 16 October;
  session record, not the audit):** 171 pages indexed, 1 click and 2.03k
  impressions in 28 days, so moving help pages costs little ranking.
- **Keep both properties separate in reporting.** A single number across the
  two sites would hide exactly what the split is for: whether commercial
  search grows on one and help search grows on the other.

## 13. Country block, Vercel Firewall, CSP and media

**DETECTED (`Geo-Block-Runbook.md`, `lib/security/geo-block*.ts`):**

- Middleware answers 451 to Kazakhstan before any content. The 451 decision
  itself does not depend on the host, so it will run on the help host too;
  the gate does read the hostname for the owner cookie's domain and for its
  log line (`geo-block.ts:134-135,153,168,201`), which is the next bullet.
- The owner cookie `b4g_owner` gets `Domain=b4gamble.com` only on that host;
  on any other host it is host-only.
- The Vercel Firewall rule for static assets has conditions on environment,
  country, path and cookie, and none on host. **INFERRED:** it covers every
  domain of the project, the help host included.
- The Cloudflare WAF rule covers only `media.b4gamble.com`.
- `b4gamble.com` DNS is DNS-only in Cloudflare, so Vercel sets the trusted
  country header.
- `pauseplan.help` uses Vercel nameservers (Vercel record, 17 October 2026).
- The four rate-limit rules in Vercel Firewall (auth entry, second factor,
  contact, `/r/*`) have conditions on path, method and IP only
  (`docs/06_Operations/Admin-Auth-Security.md:117-134`). **INFERRED:** like
  the static-asset rule, they apply on every domain of the project, the help
  host included.

**PROPOSED:**

- The help host blocks the same countries with the same variables. The owner
  unlocks once on the help host (host-only cookie). The runbook gains a help-host
  row and checks.
- DNS stays at Vercel, so Vercel sets the country header on the help host
  too. If DNS ever moves to Cloudflare, the record must be DNS-only; a proxied
  record would hide the visitor's country and break the block.
- The help-host deny rule for commercial static folders (§4.2) is added in
  phase 2 and listed in the runbook.
- **Media:** help pages must not load images from `media.b4gamble.com`. The
  owner cookie would not travel on that cross-site image request, blockers that
  block `b4gamble.com` may block its media host, and the request names the
  commercial domain. Help-guide images are served first-party on the help host
  from a small route over the same storage keys (`content/learn/<sha256>.<ext>`,
  RFC-052 §5), cacheable for a year because the keys are content-addressed.
  **The route has a path and a class** (added in this revision, because the
  manifest test of §4.1 fails on a `route.ts` with no class):
  `/api/help-media/[key]`, class `HELP`, serving only keys referenced by a
  published `responsible-gambling` guide. `/api/media/*` stays `COMMERCIAL`
  and answers 404 on the help host.
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
- Every guide page, the protected category included, links "Editorial
  methodology →" to `/methodology` (`LearningArticleView.tsx:107`).
- A stored `article.canonicalUrl` is printed as the page's canonical and Open
  Graph URL, resolved against `siteUrl`
  (`app/(public)/learn/[category]/[slug]/page.tsx:57-59`). The publisher
  accepts it as the absolute `https://b4gamble.com<path>`
  (`lib/learn-content-orchestrator/publication-validation.ts:103-107`,
  `lib/learn-apply/public-verification.ts:139-140`).

**CONTRADICTION:** after phase 3 a help guide is live at `HELP_ORIGIN`, while
the verifier, the result URL and the context tools expect `b4gamble.com`. A
stored absolute canonical would point a help guide at `b4gamble.com`, which
breaks the self-canonical rule (§1.4) and points at a URL that answers 301.

**PROPOSED:**

- One function decides a guide's public origin by category: help origin for
  `responsible-gambling` once `HELP_SITE_REDIRECTS` is on, main origin for
  every other category. The verifier, the result URL, IndexNow, the sitemap,
  `learn_source` and `learn_context` use it.
- **The main site's Learn hub keeps everything else.** Bonuses, Banking,
  Casinos, Games and Industry stay there with their chips and their offer
  bridges; from phase 3 the hub stops listing `responsible-gambling` guides
  and the pause tag hubs (Spelpaus, ROFUS, GAMSTOP), which move with their
  category. A guide of a commercial category may link to the catalogue as
  today — the menu decision of 17 October makes that ordinary, not a door.
  **UNKNOWN:** how many published commercial guides link to a
  `responsible-gambling` guide; the phase-3 audit lists them and those links
  become either the one help link's target or plain text (they must not
  become a second main-host link to the help site, §6.6).
- On the help host the guide page uses only the path of a stored canonical,
  resolved against the guide's public origin, and the verifier expects the
  same; the "Editorial methodology" link is not rendered there (§6.5).
- `learn_apply` refuses a `responsible-gambling` guide whose body links to a
  `COMMERCIAL` route or to `b4gamble.com`. **UNKNOWN:** whether published help
  guides contain such links or an absolute stored canonical today (the prose
  and the canonical are in the database); an audit of every published help
  guide, its links and its stored canonical runs before phase 3.
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
| Does the help site or the Programme carry partner links or earn money? | No partner links: the Programme since PR #530 (merged 16 October), the help site once this RFC is live; the help site earns nothing itself | DETECTED (PR #530) / PROPOSED |
| Is Programme data shared with operators, sold or used for marketing? | Not sold or shared; never used to choose, rank or personalise anything commercial | DETECTED (Privacy Notice; RFC-017, RFC-025 firewall) |
| … but is it combined with casino clicks anywhere? | Today yes. Each partner press by a signed-in person is stored with the account (`OutboundClick.userId`, indexed `[userId, attemptedAt]`), and the internal `programme_funnel` count reads it next to Programme stages (`lib/analytics/programme-funnel.server.ts:165-176`). **Answered Q7 (a):** new presses stop storing the account and the count loses its partner-press stages; the older rows keep their link until a separate data job clears them, so the owner page says so while that is true | DETECTED (`prisma/schema.prisma`, PROGRAMME-FUNNEL-MCP-2026-10-14) — Q7 answered |
| Is it the same database as the casino business? | Yes | DETECTED |
| Where is it stored and processed? | United States (Vercel `iad1`, Prisma Postgres) | DETECTED in a decision record; exact region UNKNOWN |
| Which safeguard covers transfers from the UK/EU? | The Privacy Notice says "contact us"; the mechanism per provider is not recorded | UNKNOWN (RFC-036 recorded vendor DPA and transfer evidence as deferred) |
| Is special-category data processed, on what basis? | Programme answers may reveal health information; optional personalisation uses explicit consent | DETECTED (Privacy Notice, RFC-036) |
| Has a DPIA been done? | RFC-036 found one required; no signed DPIA is in the repository | INFERRED / UNKNOWN |
| Is the AI on? | Optional and consent-based; the real provider has been switched off in Production since 12 October 2026 (`PROGRAM_AI_REAL_PROVIDER_ENABLED=false`, the Founder's choice that day) | INFERRED from the session record of 12 October, not yet in `CURRENT_STATE`; verify the Production variable before stating it |
| Who at the company can see a person's answers? | Staff with Admin access and MFA; whether any Admin screen shows Programme answers is not established | UNKNOWN |
| How long is data kept; how is it deleted? | Retention list in the Privacy Notice; deletion on request | DETECTED |
| Which trackers run on help pages? | Today GA4 from the first page on Programme pages; on the help host, none (answered Q3: G3, §10) | DETECTED, and PROPOSED for the help host — Q3 answered |
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
would then move to its own project and database). **Answered (Q4,
17 October 2026): not now** — only if a named organisation makes it the
condition for working with us. Nothing in phases 1–4 depends on it.

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
   partner. **DETECTED:** today a partner press by a signed-in person is
   stored with the account (`OutboundClick.userId`), and `programme_funnel`
   counts those presses next to Programme stages. **Answered (Q7 (a)):** new
   presses stop storing the account and the count loses its partner-press
   stages, which is what makes the sentence true going forward. Clearing the
   older rows is a separate data job, not part of phase 1, so until it is run
   the page also says plainly that presses made before the change are still
   stored with the account.
5. **What is stored and where**, with a link to `/for-organisations` and the
   Privacy Notice.
6. **The help site sets no tracking cookies** and carries no Google tag
   (answered Q3: G3), so the page says so plainly.

The page replaces the help-side use of `/can-you-trust-b4gamble`, whose
research next-step block cannot appear on the help host.

### 17.1 Help-host copy the Founder sees before merge

**CONTRADICTION (DETECTED):** point 2 says this site earns nothing, while help
pages print a line saying it earns casino commission. Every item below gets
help-host text, shown to the Founder in every help language before merge:

| Where (DETECTED) | Today |
| --- | --- |
| `revenueLine` in `lib/i18n/static-pages/beside.ts:40/83/126`, `innan.ts:43/79/115`, `pause-plan.ts:170/248/367`, `gambling-control.ts:82/104/124` (printed by `/beside`, `/innan`, `/pause-plan`, `/pause-statistics` and the control pages) | "B4GAMBLE earns commission from licensed casinos. This text contains none." and its variants |
| `lib/i18n/static-pages/gambling-control.ts:167/195/223` (FAQ "What is B4GAMBLE?" in en/sv/da) | "…It also compares licensed casinos, and it says openly that it earns commission from them." |
| root metadata (`app/layout.tsx:37-52`) | "…transparent casino comparison…" (§8) |
| Learn hub (`lib/i18n/learning-center.ts:47`, `transforms.ts:466-472`) | casino bonuses, banking, games, reviews; topic chips (§4.1) |
| Privacy `:137` and Terms `:30` partner-link sections | affiliate links and commission (§6.5) |
| public footer `commissionDisclosure`, `operatorDisclaimer` (`lib/i18n/public-shell-catalog.ts`) | "We may earn commission from clearly labelled affiliate links." — not in the help shell |

**PROPOSED:** on the help host the commission lines say instead that the
company behind the site also runs a casino-comparison site, with a link to
`/who-runs-this`; the exact words are the Founder's.

## 18. Rollout

The menu change of 17 October is **not a phase of this RFC**. It ships in its
own pull request against the main site, before or beside phase 1, and needs
nothing from the help site (§4.3). Its contract with this RFC is exactly two
lines of test:

- `tests/programme-no-casino-links.test.tsx:262-263` keeps passing unchanged —
  `researchNavigation={false}` twice in `app/program/layout.tsx`;
- `tests/public-shell.test.ts` is the two-doors contract and is **rewritten**
  by that PR (it asserts the door's literal source, its counts and the
  footer's `researchLinks` set, and holds no `researchNavigation`
  assertion, **DETECTED**). The rewrite keeps the part that is not about the
  door: no shell source, the Programme layout included, reads the research
  contract or passes a lesson flag (`:54`, `:78-82`).

| Phase | What | Gate before the next phase |
| --- | --- | --- |
| **0 — Decisions and accounts** (Founder) | **DONE, 17 October 2026.** The §22 answers are given and recorded in [HELP-SITE-RFC-057-APPROVED-2026-10-17](../07_Decisions/HELP-SITE-RFC-057-APPROVED-2026-10-17.md); the domain is done (`pauseplan.help` bought 16 October, DNS at Vercel). Still outstanding, and none of them gates phase 1: the Search Console Domain property and the Bing site (needed in phase 3), the Resend domain and help mailbox (Q6, between phases 2 and 4), and the second Google client (Q8 (b), before phase 4) | **MET** — answers recorded in the decision record |
| **1 — Code, dark** | one or more PRs: host manifest (with metadata routes and `public/`), middleware gate, help shell and host-aware root not-found, help home, host-aware root metadata and the help share image, per-site origins and site-keyed caches, Better Auth two-host config (code only), auth letters accepting the request's own origin, per-host search files (robots per request, second IndexNow key), e-mail origins, Learn origin by category and the stored-canonical rule, first-party help images, help-host copy (§17.1), owner page and data statement, link guard over raw HTML, inline page data and `?_rsc=` responses, and two-host browser specs. All switches off: the main site behaves exactly as before, which tests prove | PR #530 merged (done, `774dd2f7`) and `researchNavigation={false}` still passed by the Programme layout after the menu change; the replacement step-3 lesson (decision 3) merged, so the help site never launches with a casino-comparison lesson; the Founder has seen help-host screens and copy as Production renders them (phone first, Google button shown); CI green |
| **2 — Help host live, not indexed, not linked** | the help-host Firewall deny rule (§4.2); attach `<help-domain>` and `www` to the project; set `BETTER_AUTH_TRUSTED_ORIGINS`; add the Google origin and callback; `HELP_SITE_SERVING=true`; redeploy | checks in §20.3 pass, including e-mail sign-up and reset, the Founder's own Google sign-in on his phone and the blocker check; help pages fetched 200 from GB, SE, DK |
| **3 — Move and index** | `HELP_SITE_REDIRECTS=true`, in one deployment: help-host pages become indexable and main-host 301s start together, so no page is indexable on both hosts; the main site drops its help links, its "Programme and support" footer column and its customer Log in, and gains the one "need help" line (§5, §6.6, §9.2); Learn origin switch, letters, short links; submit the help sitemap and IndexNow for help URLs; bios on the Founder's word; registry and `CURRENT_STATE` updated | one-hop 301s verified; help guides announced; no 404 among moved URLs; the required-notice check of §5 done for GB, SE, DK and DE; exactly one help link per main-host page |
| **4 — Outreach** | help organisations, blockers (category review for the new domain), directories, with the owner page and data statement | §16.3 gate |
| **Later** | separate database; non-profit entity | Founder decision |

**INFERRED:** Vercel applies environment changes only to deployments made
after the change (as the geo-block runbook says), so every switch flip is
followed by a redeploy.

**Added on 17 October 2026 from the review of PR #535; no decision changes.**
Three refinements the review of the foundation pull request produced, all
carried out in its review follow-up:

1. **Phase 2 order: the Firewall rule, then the switch and the redeploy, then
   the domain.** Because an environment change reaches only later deployments,
   attaching `<help-domain>` before the redeploy opens a window in which the
   help host answers a 308 to `b4gamble.com` — and a 308 is cacheable by
   default (RFC 7538), so a browser, a crawler or a blocker's classifier that
   samples the domain in that window keeps the association the second domain
   exists to avoid. Every redirect that names the help host is now sent
   `Cache-Control: no-store`, which bounds the damage; this order removes the
   window.
2. **A source constant gates the switch.** `HELP_SHELL_READY` in
   `lib/site/host-routes.ts` is `false` until the pull request that lands the
   help shell, the help home and the host-aware root metadata flips it in the
   same commit. While it is false the help host answers 404 for **every** path,
   not only the `COMMERCIAL` and `INTERNAL` ones: the route classes alone would
   hand `/`, `/learn`, `/privacy` and `/login` over with the commercial shell
   and the full casino menu, and the phase ordering of this table was the only
   thing preventing it. It is a source constant, not a variable, so no
   dashboard change can publish the catalogue on the help domain.
3. **The help host's `robots.txt` refuses every crawler and names no sitemap
   while `HELP_SITE_REDIRECTS` is off**, which is all of phase 2 ("live, not
   indexed, not linked"). The §12 row — allow all,
   `Sitemap: HELP_ORIGIN/sitemap.xml` — is the phase-3 state, and it arrives
   with the same deployment as the 301s.

**Not waiting for phase 1, and now DONE:** the pause-letters cron gap (§21.9)
was fixed in its own bug-fix PR before `PAUSE_LETTERS_ENABLED` is turned on —
PR #534, merged on 17 October 2026 as `abded8ee`, with the test in
`tests/production-canonical-host.test.ts:114` that walks every `vercel.json`
cron path and fails when one is missing from `PRODUCTION_CRON_PATHS`. Phase 1
keeps that test when it rewrites the resolver.

## 19. Rollback

- **Phase 1:** revert the PR; with the switches off nothing user-visible
  changed.
- **Phase 2:** `HELP_SITE_SERVING=false` and redeploy: the help host is again
  "any other host" and 308s to `b4gamble.com`. Help-host session rows stay in
  the database unused. The domain may stay attached.
- **Phase 3:** `HELP_SITE_REDIRECTS=false` and redeploy: the main site serves
  help routes again and the help host is `noindex` again, so no page is
  indexable on both hosts. Browsers that cached a 301 keep going to the help host,
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
- Route manifest: every `app/**/page.tsx` and `route.ts`, every metadata
  route and every top-level entry of `public/` has a class; every
  `COMMERCIAL` and `INTERNAL` route answers 404 on the help host with and
  without language prefixes, legacy prefixes, trailing slashes, encoded
  segments and queries (`/casinos`, `/sv/casinos`, `/se/sv/casinos/`,
  `/r/x`, `/go/x`, `/outbound/x`, `/casino/x`, `/learn/casino-bonuses/x`,
  `/api/public/bonuses`, `/api/admin/x`, `/admin`).
- Main-host 301s: every row of the §5 list, path and query preserved, one
  hop, language kept; API routes never redirected; `/can-you-trust-b4gamble`
  still answers 200 on the main host and is never redirected.
- The main host after phase 3: no response contains a link to a `HELP` route
  on its own host, and no `HELP_ORIGIN` link beyond the allowed ones — the
  footer "need help" line on every page (exactly once, `rel="nofollow"`,
  translated in every published language) plus the home's one existing hero
  call to action and one mention each on `/about` and
  `/can-you-trust-b4gamble` (§6.6). The test reads the raw HTML and the
  inline page data, as the help-host guard does, and it covers the error
  screens and the root 404 boundary, which carry `/help` and `/10-steps`
  today (§5).
- **PR #530 still holds, on both hosts:**
  `tests/programme-no-casino-links.test.tsx` passes unchanged, including the
  one assertion that is the guard (`:262-263`: `researchNavigation={false}`
  appears exactly twice in `app/program/layout.tsx`); no Programme document
  on either host carries a research or partner address, in the HTML or in the
  inline page data; no Programme answer sets a menu cookie.
  `tests/public-shell.test.ts` is **rewritten by the menu PR**, not kept
  unchanged (§4.3): it encodes the two-doors contract, not the Programme
  prop. Phase 1 checks that the rewritten file still forbids every shell
  source, the Programme layout included, from reading the research contract,
  and adds the help host to the same assertions.
- **The Programme shell on the help host** (§6.5): the help shell wraps the
  same `PublicHeader` and `PublicFooter` with the same
  `researchNavigation={false}` and `commercialProductState="EDITORIAL_ONLY"`,
  so the count of two in `app/program/layout.tsx` is unchanged by the host
  branch. A test renders the Programme on both hosts and asserts the prop
  per host; if an implementation ever needs a different component there, the
  guard moves to asserting the prop per branch in the same commit, and never
  silently loses its count.
- Country block on both hosts; owner cookie host-only on the help host.
- Origins: canonical, hreflang, JSON-LD, sitemap, robots, `llms.txt` and
  IndexNow payloads on the help host contain only `HELP_ORIGIN` URLs;
  IndexNow groups by host and uses each host's own key; the main key file
  answers 404 on the help host.
- Root metadata: on the help host `metadataBase` is `HELP_ORIGIN`, the default
  description has no casino words, `siteName` is "Pause Plan" (Q2) and the default image
  is the help share image; on the main host the metadata is unchanged.
- Caches: robots differs by host in the same process; every cache entry
  holding absolute URLs has the site in its key; no response whose body
  differs by host is sent with a shared `public` cache header — the test
  names `app/llms.txt/route.ts` and the IndexNow key routes explicitly
  (§7.4).
- Better Auth: Production config lists exactly two hosts; a set
  `BETTER_AUTH_URL` cannot fix the base URL to one host once
  `HELP_SITE_SERVING` is on; Preview unchanged; staff sign-in refused on the
  help host.
- E-mail: verification and reset letters accept an action URL on either
  allowed origin and refuse any other; customer letters accept the help
  origin; every template refuses research and partner links (already, PR #530)
  and `b4gamble.com` links once phase 3 is on.
- Learn: the origin by category; `learn_apply` refuses a help guide with a
  commercial or `b4gamble.com` link; a stored absolute canonical renders on
  the help host as `HELP_ORIGIN` plus its path; the verifier checks the help
  host.
- Analytics: Q3 is answered G3, so the help host serves no Google tag, no banner and no
  Google hosts in the CSP on the help host).

### 20.2 Link guard and browser

- Render every help-host page in every help language (including the 404 page,
  the Programme home after steps 1, 2, 3, 4 and 10, and the completion screens)
  and fail on any `href`, `action`, `src`, `srcset`, `fetch` target, `mailto:`
  or JSON-LD URL that is `COMMERCIAL`, `INTERNAL` or on a `b4gamble.com` host.
  The guard scans the raw response, not only rendered attributes: the HTML,
  the inline page data (`self.__next_f`) and the `?_rsc=` data responses
  fetched during client navigation between help pages. The allowed exceptions
  (§6, rule 2) are checked exactly: the plain-text mention on `/who-runs-this`
  is text, not a link, and the only `b4gamble.com` address is the support
  `mailto:` on `/contact`, until the help-domain mailbox of Q6 replaces it.
- Playwright on a local production build with two hosts (`localhost` and
  `help.localhost`): help home → pause plan → Programme step 1 → sign-up with
  e-mail and the Google button rendered (placeholder keys) → the new step-3
  lesson; header, drawer and footer contents; the typography floor; phone
  viewport first. The main site's existing specs pass unchanged with the
  switches off.

### 20.3 Production checks (phase 2 and 3)

- From GB, SE, DK, DE and US (Globalping or the GitHub-hosted smoke):
  help pages 200, commercial paths 404, `www` 308, help responses `private`
  where they differ by host, `noindex` until phase 3; every denied `public/`
  folder of §4.2 (`/best-offers/…`, `/bonus-directory/…`, `/casino-brands/…`,
  `/casino-directory/…`, `/demo-casinos/…`, `/partner-preview/…`,
  `/brand/b4gamble-logo-512.png`, `/learn/…`, `/about/…`, and `/home/…`
  included, since Q5 is answered (b)) and `/_next/image` requests for them refused on the help
  host, with `/data/*.csv` still served (§4.2).
- From a KZ exit: 451 on the help host; 403 on its raster assets.
- The four path-only Firewall rules (auth entry, second factor, contact,
  `/r/*`; `docs/06_Operations/Admin-Auth-Security.md:117-134`) also limit
  requests on the help host.
- E-mail sign-up with verification, and a password reset, on the help host:
  the letters arrive and their links open on the help host.
- The Founder's real Google sign-in on the help host from his phone.
- A blocker check: BetBlocker (free) and, if available, Gamban in a separate
  Chrome profile open `HELP_ORIGIN` and `HELP_ORIGIN/sv/pause-plan`.
- Phase 3: every moved URL from the old sitemap answers one 301 to a 200;
  every `HELP` route on the main host 301s and none of them answers 200; the
  main host's footer carries the one "need help" line in each published
  language and nothing else of the help site; `/can-you-trust-b4gamble`
  answers 200 on the main host; a Programme page on the help host carries no
  research address in its HTML or inline page data (the PR #530 check, run
  against Production on the new host).

## 21. Contradictions and findings

1. RFC-030's single Production origin versus a second public origin —
   RFC-030 is `HISTORICAL`; this RFC becomes the host authority (header).
2. `lib/site.ts`'s single module origin versus per-host URLs (§8).
3. Lifecycle e-mail config and the template URL allowlist accept only
   `b4gamble.com`; help pages print hardcoded `b4gamble.com` strings (§8, §11).
4. Learn verification, result URLs and context schemas assume `b4gamble.com`
   (§14).
5. RFC-046 §16 counts Programme pages in GA4, while help organisations ask
   about data protection (§10; answered Q3: G3, no Google tag and no banner on the help host).
6. Partner presses are stored with the account (`OutboundClick.userId`) and
   `programme_funnel` counts them next to Programme stages, while the owner
   page should say Programme data never reaches the casino side (§16.2,
   §17.4; answered Q7 (a)).
7. The Mission 08 lesson still teaches comparing casinos and bonus terms
   (DETECTED in the PR #530 record), which a help-only site cannot carry —
   handled by decision 3 as a phase-1 gate.
8. The captured handoffs, the footer (visible and hidden links) and the root
   not-found boundary carry research and trust links; several help pages link
   `/about`, `/can-you-trust-b4gamble`, `/affiliate-disclosure` or
   `/methodology` (§6, rule 5; §6.5). **Wider than the previous revision
   said:** the main site links `HELP` routes from the menu
   (`GUIDE_NAVIGATION`), the account area (`accountNavigationFor`), the
   handoff rewrite that runs on every handoff page, the root 404 boundary,
   five error screens, `/contact`, `/terms`, `/bonus-guide` and three Learn
   views — the full inventory and its phase-3 verdicts are in §5.
9. Found in passing, outside this RFC's scope: **DETECTED** —
   `/api/internal/cron/pause-letters` is scheduled in `vercel.json` (hourly at
   minute 23) but is missing from the three cron paths that
   `lib/auth/runtime-canonical-host.ts:44-48` lets through on generated
   Production hosts (commit `a21958d3` fixed the same gap for the
   learn-content cron). **INFERRED:** if Vercel calls that cron on a generated
   host, as the resolver's comment says it does for crons, the request gets a
   308 to `b4gamble.com` and the handler does not run. **UNKNOWN:** the real
   effect; the letters' switch is off, so nothing is lost yet. The fix ships
   in its own bug-fix PR before `PAUSE_LETTERS_ENABLED` is turned on, not with
   phase 1 (§18).
10. Help-host verification and reset letters would be refused by
    `validAuthActionUrl` (§9.2, §11).
11. The root metadata is static and commercial; the default social image
    names reviews and bonus terms (§8).
12. Hidden links travel in the inline page data, which a guard over rendered
    attributes does not see (§6, rule 1; §20.2).
13. Help guides link `/methodology` and may print an absolute `b4gamble.com`
    canonical (§14).
14. `app/robots.ts` is static, and a sitemap cache stores absolute URLs under
    keys with no site (§7.4).
15. Help pages say the site earns casino commission, while the owner page
    says it earns nothing (§17.1).
16. The middleware matcher skips raster files, fonts and `/_next/image`, so
    commercial static folders would be served on the help host (§4.2).
17. The domain was written as not chosen; it was chosen and bought on
    16 October (`pauseplan.help`). Resolved in the previous revision (§3).
18. **RESEARCH-NAVIGATION-TWO-DOORS-2026-10-10 versus the Founder's decision
    of 17 October.** Door one (the research section) was the last part of that
    record still standing after its amendment 4; the 17 October decision
    withdraws it, so the main site shows the research links everywhere. Under
    GOVERNANCE a newer explicit Founder decision outranks the older record;
    the reversal is written in `COMMERCIAL-MENU-FOR-EVERYONE-2026-10-17`
    (parallel PR), which amends the 10 October record. This RFC records the
    consequence for the hosts and does not itself change the menu.
19. **Help routes on a commercial-menu main site, until phase 3.** Between the
    menu change and phase 3, `/pause-plan`, `/beside`, `/innan`, `/10-steps`,
    the control pages and `/responsible-gambling` are served on
    `b4gamble.com` inside a shell that shows the catalogue to everyone, which
    is the state the audit's refusals were about. Accepted by the Founder as
    temporary; phase 3 ends it; the Programme is excluded throughout (§4.3).
20. **The one link is also an association.** `b4gamble.com` linking to the
    help domain is what tells a blocker or a classifier that the two are the
    same company, while phase 4 asks those same services to judge the help
    domain on its own. Accepted knowingly: the owner page names the owner
    anyway, and a person who needs help must have a way off the commercial
    site (§6.6). It is the first thing to remove if a blocker categorises the
    help domain because of it.
21. **The frozen desktop home versus the move.** The Founder's standing rule
    keeps the desktop home untouched, and that home carries one Programme
    link — the hero call to action — whose target leaves the host at phase 3
    (**DETECTED**, §5; the earlier claim of a second `/10-steps` link on the
    home was wrong and is corrected there). Any of the three ways out is a
    visible change or a cross-site link on the home, and the change is made
    in the home's transform rather than in a page file. **Answered Q9 (a),
    17 October 2026:** the link stays exactly as it is, in its place and with
    its words, and after phase 3 it points at the help site, so the home keeps
    the look he asked not to touch.
22. **A commercial site with no account, and letters that are all help
    letters.** From phase 3 `b4gamble.com` has no customer sign-in while every
    stored customer account is a Programme account on the other host
    (§9.2, §11). That is deliberate, not an oversight: a commercial mailing
    list, if it is ever wanted, needs its own consented list and its own
    decision.
23. **Corrections to the previous revision of this RFC**, found by reviewing
    it line by line against `774dd2f7` and recorded here so the change is
    visible rather than silent:
    - the PR #530 guard is
      `tests/programme-no-casino-links.test.tsx:262-263`;
      `tests/public-shell.test.ts` holds no `researchNavigation` assertion
      and is rewritten by the menu PR, not kept unchanged (§4.3, §18, §20.1);
    - the main site's links into `HELP` routes are a dozen surfaces, not one
      footer column (§5), so phase 3's "exactly one help link per page" is
      code work, not configuration;
    - the home carries **one** Programme link (the hero call to action) and
      no `/10-steps`; `transforms.ts:1047` and `:1081` belong to the help and
      not-found transforms, not the home (§5, §21.21, Q9);
    - `geoBlockGate` does read the hostname, for the owner cookie's domain
      and its log line (§7.1, §13);
    - the Firewall rule covered 6 of the 11 top-level `public/` folders
      (§4.2);
    - `llms.txt` and the IndexNow key file send a shared `public` cache
      header that `force-dynamic` does not govern (§7.4, §12);
    - the root layout's JSON-LD carries the B4GAMBLE name, aliases and an
      absolute logo URL on every page, and two more call sites print the
      same identity on control pages and guides (§8);
    - `/api/media/*` is `COMMERCIAL`, so the first-party help-image route
      needed a path and a class of its own (§4.1, §13);
    - the nearest recorded notice obligation is Google's UK gambling
      certification in `FooterCompliance.tsx:7-13`, not "nothing in the
      repository" (§5);
    - the per-host sitemap split happens in `coreRoutes`
      (`lib/site.ts:28-50`), and `app/icon.svg` needed a row in §12.

## 22. Founder answers (17 October 2026)

**All eight questions are answered.** The Founder read this RFC and the eight
questions below, each put to him with one recommendation, and replied «ок,
начинай первый этап» — approving the architecture and, with the same word,
every recommendation as it was written to him. He was not asked to repeat the
answers one by one. The decision record is
[HELP-SITE-RFC-057-APPROVED-2026-10-17](../07_Decisions/HELP-SITE-RFC-057-APPROVED-2026-10-17.md),
and it is the phase 0 gate of §18.

Two earlier questions were closed before this: the **domain** (answered
16 October — `pauseplan.help`, bought, DNS at Vercel, §3) and **which site is
which** (answered 17 October — `b4gamble.com` commercial with the full menu,
the Programme and the help content on the help site; §1). Their old numbers
are kept free so that Q2–Q9 still mean what they mean everywhere else in this
RFC.

2. **Name — its own name, "Pause Plan".** The help site carries no B4GAMBLE
   wordmark and no B4GAMBLE logo: the whole point of the split is that the two
   sites are not visibly one, and a B4GAMBLE mark re-joins them in one glance
   for the organisations the split is meant to open. `/who-runs-this` still
   names 7BE Inc. honestly, so the connection is disclosed in words.
   **Build:** wordmark, page titles, `siteName`, structured-data `name`,
   `alternateName` and `logo`, the share image, icons, the letter sender name
   and the bios all read "Pause Plan"; `public/brand/` and the current
   `app/icon.svg` are denied on the help host (§4.2, §8, §12, §17).
3. **Google Analytics on the help site — G3, none.** No Google tag and no
   cookie banner on the help host; the counts come from what the server
   already records. `b4gamble.com` keeps its 4 October 2026 GA4 decision
   unchanged.
   **Build:** no tag and no banner on the help host, `/api/consent/analytics`
   and `/api/analytics/events` not served there, the Google hosts out of the
   help host's CSP, and the owner page may say the site sets no tracking
   cookies. Amends RFC-046 §16 for the help host only (§4.1, §10, §13, §17).
4. **Non-profit entity — not now.** Only if a named organisation makes it the
   condition for working with us.
   **Build:** nothing. No entity, no separate database, no separate accounts
   in phases 1–4; the option stays in §16.5 for a later decision.
5. **Help home page — (b), the pause plan is the home page.** Not the current
   home layout with a help menu.
   **Build:** `/` on the help host serves the pause plan in sv, da and en,
   with the Programme entry as its main call to action; `public/home/` is
   denied on the help host (§4.1, §4.2, §20.3). The main site's home is not
   touched.
6. **Sender and contact address — (b) eventually, (a) acceptable for
   phase 2.** A mailbox on the help domain in the end; phase 2 may still use
   `support@b4gamble.com`.
   **Build:** nothing blocking. Until the move, the one allowed
   `b4gamble.com` address on the help site is the `mailto:support@b4gamble.com`
   link on `/contact` (§6, rule 2). Moving it is DNS and mailbox work — Resend
   records on the help domain and a Google Workspace alias — not code, and it
   gates no phase (§11).
7. **The Programme/casino tie in the data — (a), remove it.** Stop storing the
   account on new partner presses, and drop the partner-press stages from the
   weekly `programme_funnel` count. **Clearing the older rows is a separate
   data job and is not part of phase 1.**
   **Build:** new `OutboundClick` rows are written without `userId`;
   `programme_funnel` stops returning partner-press stages and stops reading
   `OutboundClick` beside Programme stages. No schema change, no migration, no
   column removed — the field stays and simply receives nothing new. Amends
   RFC-046 §7. While older rows still carry their account link,
   `/who-runs-this` says so plainly (§16.2, §17.4).
8. **Google sign-in screen — (a) for phase 2, (b) before phase 4.** The
   current client is fine while the help site is live but not yet announced: a
   person signing in there sees Google's screen naming B4GAMBLE and linking
   `b4gamble.com`. Before the outreach phase, a second Google client in its own
   project carries the "Pause Plan" name and the help site's own privacy and
   terms links.
   **Build:** phases 1–2 add the help origin and callback to the existing
   Production client; the second client and the host-aware Better Auth client
   choice are a phase-3/4 item with their own consent-screen verification
   (§9.2).
9. **The home hero link to the Programme — (a), leave it exactly as it is.**
   The one Programme link on the home page keeps its place and its words, and
   after the move it points at the help site. **The desktop homepage is not
   changed.**
   **Build:** the home's handoff transform keeps rewriting that one link and
   at phase 3 its target becomes the help origin. Nothing a visitor sees on
   the home changes. Because that transform is the code the do-not-touch rule
   protects, the change is written and reviewed as carefully as a visible one,
   and the home is checked on a phone and on the desktop before and after
   (§5, §21.21).

**Still outstanding from phase 0, and none of it gates phase 1:** the Search
Console Domain property and the Bing site for the help domain (needed in
phase 3), the Resend domain and help mailbox (Q6), and the second Google
client (Q8).

## 23. Consequences

- **Revenue:** this RFC adds none directly, and PR #530 already ended the
  Programme's path to casino pages. What is expected to move the number is
  the other half of the 17 October decision, which is outside this RFC: the
  full menu for every visitor of `b4gamble.com`, and the growth work behind
  it. What this RFC contributes is that the commercial site stops carrying a
  help section it has to look consistent with. The main site loses the help
  pages' traffic to the help site; **INFERRED** small (1 Search Console click
  in 28 days, read 16 October). **Measure it:** the two Search Console
  properties separately (§12), and partner presses before and after the menu
  change through `programme_funnel` — but only until Q7 (a) ships, which
  retires those stages. Read them before the change, because afterwards the
  count no longer carries them, and partner presses are then measured on the
  commercial side alone.
- **Operations:** one more domain, Search Console property, Firewall check and
  runbook row; one code base and one deployment.
- **People:** signed-in users sign in once more after phase 3; anonymous
  in-progress journeys at the moment of the switch start again. A visitor of
  the commercial site who needs help has one quiet line to follow, instead of
  a help section; a visitor of the help site has no way to reach a casino
  from it.
- **Trust:** the help site can be judged on its own content; the owner
  objection remains until a non-profit option is taken. The link from the
  commercial site makes the connection discoverable to anyone who looks
  (§21.20), which is why the owner page states it first.
- **Clarity:** each site can be described in one sentence, to a reader, a
  help organisation, a partner and a search engine. That is the point of the
  17 October decision, and the reason the two halves ship together.
