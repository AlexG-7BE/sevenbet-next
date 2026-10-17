# The commercial menu reaches every visitor, and the help site moves to its own domain

**Status:** ACCEPTED. Part A is implemented in the pull request that adds this record (branch
`feat/commercial-menu-for-everyone`). It is live only after that pull request is merged and
deployed; [CURRENT_STATE](../CURRENT_STATE.md) records it as live once observed. Part B is
recorded here as the decision it belongs to and is **not built in this pull request**.

**Decision authority:** Founder decision, 17 October 2026 (chat), on the proposal "Что могу
сделать для b4gamble.com":

- "Полное меню для всех. Казино, бонусы и лучшие офферы видны каждому посетителю, а не только на
  страницах каталога. Это обычный коммерческий сайт для тех, кто играет и выбирает, где играть."
- "Программа переезжает на pauseplan.help. С b4gamble.com туда ведёт одна ссылка «нужна помощь».
  Тогда на основном сайте ничто не тормозит коммерцию, и ему не нужно выглядеть сайтом помощи."
- "Рост коммерческого трафика. SEO обзоров и бонусов, ставки на спорт, новые партнёры (ComeOn,
  Kindred, Betsafe), всё, что приносит партнёрские клики."

## The two sites

**b4gamble.com is the commercial site.** It is for adults who already gamble and are choosing
where to play. Casinos, Bonuses and Best Offers belong in its menu on every public page, to every
visitor. It no longer has to look like a help site.

**pauseplan.help is the help site.** Bought by the Founder on 16 October 2026 (team
`alexg-7bes-projects`, Vercel DNS, auto-renew, expires October 2027) and deliberately not attached
to the b4gamble project yet. It will carry the Programme, the pause plans (sv/da/en), the help
guides, `/beside`, `/innan` and the helplines, served by the same Next.js project by host. From
b4gamble.com one quiet "need help" link will point there once that site exists. That is RFC-057
phase work: **nothing in this pull request builds it**, and until it exists the Programme stays on
b4gamble.com with the clean shell described below.

## What this supersedes

Per [GOVERNANCE](../GOVERNANCE.md) (conflict handling), this newer Founder decision supersedes the
older internal language where it conflicts. Each affected `ACTIVE` RFC carries a dated note.

- **[RESEARCH-NAVIGATION-TWO-DOORS-2026-10-10](RESEARCH-NAVIGATION-TWO-DOORS-2026-10-10.md)** is
  now superseded **in full**. Door two (the lesson flag) went on 16 October with
  [PROGRAMME-NO-CASINO-LINKS-2026-10-16](PROGRAMME-NO-CASINO-LINKS-2026-10-16.md); door one (the
  research section as the place where the links appear) goes here. There is no door.
- **RFC-002** (`ACTIVE`): its 2026-10-16 note says the public menu shows Best Offers, Casinos and
  Bonuses only on the research pages. That half of the note is withdrawn; the Programme half
  stands.
- **RFC-021** (`ACTIVE`): its 2026-10-16 note says the menu reads the current path
  (`isResearchSectionRoute`). The menu now reads no path at all. §7 still holds: the menu reads no
  access, authentication or Programme state, and no ranking, operator selection, affiliate routing
  or commercial personalisation reads anything of the kind either.
- **RFC-025** (`ACTIVE`), §13's 2026-10-16 note: same sentence, same withdrawal. Everything the
  note says about the Programme stands.
- **RFC-003** is `HISTORICAL` and records the original Programme-led commercial positioning; this
  decision moves back towards it but does not revive it as authority.

## What does not change

- **[PROGRAMME-NO-CASINO-LINKS-2026-10-16](PROGRAMME-NO-CASINO-LINKS-2026-10-16.md) stands in
  full.** The Programme shows no casino, offer, bonus, comparison or `/r/` link to anyone.
  `app/program/layout.tsx` still passes `researchNavigation={false}` to the header and the footer,
  and `app/not-found.tsx` still passes `researchNavigation={!programmeDocument}`, so no Programme
  document carries those addresses even in its inline data. No letter links to them. No Programme
  answer sets a cookie that changes a menu. Nothing here reintroduces a Programme-to-casino path,
  cookie, lesson door or e-mail link.
- **The market rule, as the code actually draws it.** Best Offers and Bonuses follow the market
  rule; the casino directory is editorial and is linked everywhere. `commercialMarketOnlyRoutes`
  in `lib/public-shell.ts` holds `/best-offers` and `/bonuses` only, so
  `publicNavigationForCommercialState` and `publicCommercialDestinationVisible` always keep
  `/casinos`, and `app/(public)/casinos/page.tsx` never consults `offersMayBePresented`.
  `commercialDestinationsNavigable(commercialProductsAvailable(state), countryCode)`, the
  1.5-second bounded wait in `app/(public)/layout.tsx`, the one timed-out retry, the settled
  marker and the rejected state are untouched: only the path condition is gone. A prohibited
  market (NO, IT, NL, TR, GR …) still sees no Best Offers and no Bonuses. What this decision does
  change for those markets is recorded under Consequences.
- **Offer, ranking, partner-route and commercial-analytics behaviour**, the research pages
  themselves, the sitemap, the catalogue and the reviews.
- **No migration, no new column, no data change.**

## Decision (part A, implemented here)

1. **One menu for everyone.** The header, the mobile drawer and the footer show 10 Steps, Best
   Offers, Casinos, Bonuses, Learn and Help on every public page. The guide links keep the places
   they have had since 10 October, so the only change a visitor sees is that the commercial
   destinations are now there too. The drawer's route list is 10 Steps, Best Offers, Casinos,
   Bonuses, Learn; Help keeps its own block below it, as before. The footer's Explore column lists
   Best Offers, Casinos, Bonuses and Learn to everyone.
2. **Nothing gates the menu.** No path, lesson, step, account or cookie decides which links a
   visitor sees. `PublicNavigationDoor` is deleted, and with it the last reader of the path
   contract.
3. **`lib/research-access.ts` is gone.** Its only export, `isResearchSectionRoute`, had no caller
   left. Its list of roots is still the one place that names the casino, bonus and offer pages for
   the two guards that keep them out of the Programme and out of letters, so the list moved to
   `lib/commercial-section.ts` as `COMMERCIAL_SECTION_ROOTS`, with nothing else in the file and no
   imports. No runtime module reads it; only the guards' tests do.
4. **The Programme's shell is untouched.** `researchNavigation` stays exactly where PR #530 put
   it, and a test now renders the Programme shell under `/casinos`, `/program` and `/` and proves
   the prop, not the path, is what keeps the links out.

## Decision (part B, not built here)

The help site on `pauseplan.help`, the single "need help" link from b4gamble.com to it, and the
move of the Programme and the help pages out of the commercial site. This needs the host-routing
RFC (RFC-057) and its own pull request. Until then the Programme lives on b4gamble.com and keeps
the clean shell of PR #530.

## Consequences

- **Revenue.** Every visitor, including the ones who arrive from a social post or a help guide,
  can reach the casino and offer pages from the first screen. This reverses the reasoning of
  10 October, which the Founder has now set aside: the site's job is commercial, and the help work
  moves to its own domain rather than restraining the menu here.
- **A visitor who came for help** meets the commercial menu on b4gamble.com again. Inside the
  Programme they still meet none of it, and the help site will be the place where they meet none
  of it anywhere.
- **Prohibited markets see the casino directory more often than before.** The market rule is
  unchanged, but it never covered `/casinos`. In `OFFER_PRESENTATION_PROHIBITED_MARKETS` (NO, IT,
  NL, TR, GR, FI, PL, CZ, HU, RO and the rest) the Casinos link used to appear only once the
  visitor was already on a casino page; it now appears in the header, the drawer and the footer of
  every public page there. Best Offers and Bonuses are still withheld in those markets, no offer
  is presented and no partner button or `/r/` route resolves. The casino directory is editorial,
  which is why it was never on the market list — but the exposure change is real and the Founder
  takes it knowingly. If it should follow the market rule instead, add `/casinos` to
  `commercialMarketOnlyRoutes` in `lib/public-shell.ts`: one line, no other change.
- **Help-channel relationships** (Beroendecentrum Stockholm, Help for Dependency, Bremen) were
  refused over the casino catalogue sharing this domain. This decision does not change that; the
  help site on its own domain is the answer, and it is part B.
- **Specs and tests** that described the two doors now describe one menu; they are listed under
  Evidence.
- **Layout.** The desktop header carries six links instead of three (or four on a commercial
  page). Verified for horizontal overflow at 901, 1024, 1200 and 1440 px.

## Way back

Annotated tag **`archive/research-section-menu-gate-2026-10-17`** marks `774dd2f7` (origin/main on
17 October 2026, the merge of PR #530), the last commit where the research-section gate worked end
to end. `<merge sha>` below is the merge commit of this pull request into `main`; find it with
`git log origin/main --merges --grep="Merge pull request #<n> " -1 --format=%H`. To bring the gate
back:

1. **Revert the merge** if nothing else has touched these files since: `git revert -m 1 <merge sha>`,
   resolve any conflicts, run the tests under Evidence, and go to step 4.
2. **Otherwise reverse-apply this pull request three-way**, so later work in the same files is
   kept: `git diff <merge sha> <merge sha>^1 -- <paths> | git apply -3`, then resolve the conflicts
   by hand. Do not use `git checkout archive/research-section-menu-gate-2026-10-17 -- <path>` for a
   file changed since the tag: it overwrites the file and throws away every later change in it (it
   is safe only for a file untouched since the tag). The code paths:
   `lib/commercial-section.ts` (which becomes `lib/research-access.ts` again, with
   `isResearchSectionRoute` over the same roots), `lib/public-shell.ts` (the `GUIDE_NAVIGATION`
   comment), `components/public-shell/PublicNavigationClient.tsx` (restores `PublicNavigationDoor`),
   `components/public-shell/PublicNavigation.tsx` and `components/public-shell/PublicFooter.tsx`
   (restore the `door="research"` and `door="guide"` wrappers).
3. **The public wording**, the same way: the three `casino-pages` paragraphs (en/sv/da) in
   `lib/i18n/static-pages/can-you-trust-b4gamble.ts` and that file's module comment, plus the
   reference in `lib/email/templates.server.ts`.
4. **Tests and specs**, the same way: `tests/public-shell.test.ts`,
   `tests/programme-no-casino-links.test.tsx`, `tests/pause-plan.test.ts`,
   `tests/gambling-control.test.ts`, `tests/programme-question-screen.test.ts`,
   `tests/program-ai-structural.test.ts`, `tests/programme-home-screen.test.ts`,
   `tests/public-ia-hardening-browser.spec.ts`,
   `tests/navigation-performance-stage2-browser.spec.ts` and `tests/program-ai-browser.spec.ts`.
5. **Documents.** Record the reversal as an amendment here, in
   [RESEARCH-NAVIGATION-TWO-DOORS-2026-10-10](RESEARCH-NAVIGATION-TWO-DOORS-2026-10-10.md) and in
   the 2026-10-17 notes in RFC-002, RFC-021 and RFC-025 and their rows in
   [the RFC registry](../06_RFC/README.md); update the entry in [README](README.md) and
   [CURRENT_STATE](../CURRENT_STATE.md).

## Evidence

- `tests/public-shell.test.ts` (in `ci:quality` through `public-ia:test` and
  `scripts/ci-structural-tests.mjs`): the whole menu reaches every visitor; `lib/commercial-section.ts`
  exports the roots alone and imports nothing; no shell file names a door, a lesson flag or the
  contract; the desktop order is 10 Steps · Best Offers · Casinos · Bonuses · Learn · Help and the
  drawer keeps Help in its own block; the public layout passes no `researchNavigation` and the
  Programme layout passes `false` twice.
- `tests/programme-no-casino-links.test.tsx` (`programme-no-casino:test`): unchanged guard that the
  Programme and the letters name no commercial route, extended so the Programme shell is rendered
  under `/casinos`, `/program` and `/` — the prop, not the path, keeps the links out, and the
  public shell builds them on all three.
- `tests/pause-plan.test.ts`, `tests/gambling-control.test.ts`: the contract module's new name, and
  that no layout and no middleware reads it.
- Browser: `tests/public-ia-hardening-browser.spec.ts` (the full menu on Home, on a commercial page,
  after a soft navigation back, with and without the old lesson cookie, in the first HTML, and the
  Programme's clean shell beside it on `/program`, `/sv/program` and `/da/program`),
  `tests/navigation-performance-stage2-browser.spec.ts` (the canonical DOM order, with the streamed
  market gate, the bounded wait, the retry and the rejected state unchanged) and
  `tests/program-ai-browser.spec.ts` (finishing step 3 changes neither menu).

## Pages that described the old menu, corrected here

A page that tells a reader it links to no casino has to mean its own body now, because the shell
around it links to three. These were found in review before merge:

- `lib/i18n/static-pages/gambling-control.ts` — the revenue line under the title of
  `/gambling-control`, `/gambling-control-tools`, `/control-without-quitting` and
  `/can-you-trust-b4gamble` said "This page links to none of them" (en/sv/da). It now says nothing
  on the page recommends or links to one, and that the site menu does. These are the AEO answer
  pages, so an assistant lifts the sentence whole; on the trust page it also contradicted the
  paragraph this change added.
- `lib/i18n/static-pages/pause-statistics.ts` — "None are shown on this route" (en/sv/da) and the
  "day after" paragraph's claim about the `/pause-plan` route, both scoped to the figures and to
  the plan itself. `tests/clean-route.test.ts` (in `ci:quality` through `pause-plan:test`) now
  fails on any route-level claim in the statistics, control and trust copy.
- Still true and left alone: `pause-plan.ts` "The plan contains none", `innan.ts` "This tool
  contains none", `beside.ts` "This text contains none", and the Protected Help paragraph in
  `about.ts` — `/help` keeps its own shell through `app/help/layout.tsx`.
- `CONTROL_PAGES_UPDATED` moves to `2026-10-17` because that copy changed; `CONTROL_PAGES_PUBLISHED`
  is new and keeps `datePublished` in the structured data at `2026-10-15`.
- `scripts/research/production-screenshots.mjs` — the production evidence run recorded
  `expect: "none"` for the pause plan, Home, `/innan`, `/beside`, a guide, the sign-in screen and
  the old-cookie journeys. Every one of those now legitimately shows the menu, so the run would
  have reported violations against this very change; they are `"some"`, and the Programme start is
  now checked for `"none"`, which is the row that matters.
- `app/(public)/can-you-trust-b4gamble/page.tsx` and `lib/email/templates.server.ts`: module
  comments corrected to what the code does.
