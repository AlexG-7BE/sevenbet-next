# The Programme shows no casino links, to anyone

**Status:** ACCEPTED. Implemented in the pull request that adds this record (branch
`feat/programme-no-casino-links`). It is live only after that pull request is merged and
deployed; [CURRENT_STATE](../CURRENT_STATE.md) records it as live only once observed.

**Decision authority:** Founder decision, 16 October 2026, given through the question tool in the
partner-traffic audit session, option «Без казино для всех» ("no casino for anyone"): the Active
Control Programme (10 Steps) shows no casino, offer, bonus, comparison or partner link to anyone,
so that the Programme ends in help. The Founder's question that opened it: «так, а что Программа
как помощь?» ("and what about the Programme as help?").

## What it replaces

The two doors of [RESEARCH-NAVIGATION-TWO-DOORS-2026-10-10](RESEARCH-NAVIGATION-TWO-DOORS-2026-10-10.md)
become one. Since 10 October, finishing step 3 "Research responsibly" (Mission 08) opened Best
Offers, Casinos and Bonuses in the header, drawer and footer on every page, with a block on the
completion screen ("New in your menu" and "Put it to use"), a Research card on Programme Home and
a week-long mark on the new menu links. On 13 October the Founder had kept that door explicitly as
the revenue chain (start → step 3 → a casino through us). This decision withdraws it.

## What this supersedes

For the approved scope, this Founder decision supersedes older internal language where it
conflicts (GOVERNANCE.md, conflict handling). Each RFC carries a dated note:

- **RFC-002** (`ACTIVE`): the 2026-10-10 exception (the menu after "Research responsibly"), §5's
  "combines personal progress with clearly separated commercial discovery", §5.1 item 6
  (persistent Casinos, Bonuses and Best offers navigation on the Dashboard) and the commercial
  column of §5.2. Programme Home carries no commercial discovery in any state. Its separation of
  eligibility, ranking and rewards from Programme state still holds.
- **RFC-021** (`ACTIVE`): the 2026-10-10 note that the menu reads one lesson flag. The flag and its
  cookie are deleted; the menu reads only the path (`isResearchSectionRoute`). §7 still holds.
- **RFC-025** (`ACTIVE`): §5.7 (the research section after Mission 08's completion), §12 (the
  `Explore B4GAMBLE` rail on Programme Home) and §13 (generic discovery links on Programme Home,
  Mission 08 and Mission 10, and the 2026-10-10 supersession). §13's separation rules still hold
  for every commercial surface outside the Programme.
- **RFC-026** (`HISTORICAL`): the `programme_discovery_clicked` row of the event table has no
  source left.
- **RESEARCH-NAVIGATION-TWO-DOORS-2026-10-10**: door two and Part 3 (amendment 4 there), and
  amendment 3's line that the research menu opens from inside the Programme at step 3.
- **The Founder's funnel model of 13 October 2026** (start → step 3 opens the menu → a casino
  through us).

## Decision

1. **No Programme surface links to a casino.** No Programme screen, card, dashboard, completion
   screen, Mission, Review, letter or AI guidance contains a link to `/best-offers`, `/casinos`,
   `/casino/…`, `/catalog` (it redirects to `/casinos`), `/bonuses`, `/compare`, `/bonus-guide`,
   `/wagering-calculator`, `/outbound/…`, `/r/…` or `/go/…`, in any language. The Programme's
   header and footer are built without Best Offers, Casinos and Bonuses (`researchNavigation={false}`
   in `app/program/layout.tsx`), and so is the root not-found boundary that Next writes into every
   document's inline data (`app/not-found.tsx`, in a Programme document). No Programme document
   carries their addresses, not even in that inline data, and a Programme document no longer reads
   partner availability to draw a menu.
2. **Finishing a step opens nothing.** The lesson flag is gone: the cookie `b4g_research_access`,
   the page event `b4g:research-access`, the browser note `b4g_research_opened_at` and the
   week-long menu mark no longer exist in code. The Programme home read model no longer carries
   `researchAccess` or `discoveryLinks`. No Programme answer sets or withdraws a cookie for the
   menu.
3. **One door remains: the research section itself.** Best Offers, Casinos and Bonuses show in the
   header, drawer and footer only while the reader is on a research page (`/best-offers`,
   `/casinos`, `/casino/…`, `/bonuses`, `/compare`, `/bonus-guide`, `/wagering-calculator`,
   `/outbound/…`). Everyone else, on every other page, the Programme's own pages included, sees
   10 Steps · Learn · Help. `lib/research-access.ts` is now `isResearchSectionRoute` alone, and
   only the menu's client door reads it.
4. **The research pages are unchanged.** They stay public and indexable, keep their own menu, the
   sitemap, the catalogue, reviews, `/r/` routes, Learn offer bridges and the trust pages'
   next-step block. Nothing here touches offers, rankings, partner routes or market rules.
5. **Letters.** No letter links into the research section or to a partner route: Programme,
   pause, account and the marketing broadcast alike. The broadcast is included because it goes to
   Programme people: accounts are Programme accounts (opened on the Programme's save step, or on
   Log in, which leads into the Programme), the "Email me B4GAMBLE updates" box starts ticked on
   both, and Admin can aim a campaign at people by their Programme progress (started, completed,
   not completed). A carve-out would let Programme data aim casino links, which AGENTS.md forbids.
   The rule holds at three points: the Admin editor refuses such a link; activating an older
   version in Admin runs the editor's checks on it again; and rendering refuses a stored row that
   carries one, whenever and however it was saved. So the queue refuses it, the worker and
   campaigns cancel the letter as `TEMPLATE_RENDER_INVALID`, a pause reminder fails, and nothing is
   sent. The seeded letters link only to the Programme, the pause plan and their unsubscribe
   address (DETECTED: `lib/email/pause-letters/seed-templates.ts`, migration 0037's seed).
   Production `EmailTemplate` rows: UNKNOWN. A read-only query of the local copy of Production
   (`b4gamble-dev`, an older copy) found 5 templates, all active, none with such a link; a
   read-only check of Production's own rows is an open release gate (a row that fails is not sent,
   so the gate is about knowing, not about safety). The pause letters' send switch
   (`PAUSE_LETTERS_ENABLED`) stays off. DETECTED: no monthly "your number" letter with a
   comparison link exists in the repository; there was nothing to remove.

## What was removed (inventory)

| Path | What it was | What happened |
| --- | --- | --- |
| `components/programme/ProgramAiMissionExperience.tsx` | Step 3 completion: `ResearchOpened` ("New in your menu", Compare casinos / Explore bonuses / Best offers), `ResearchChecklist` ("Put it to use", Bonus guide link), the `researchLinksShown` seam; step 10 completion: `CommercialNext` ("Explore when you are ready", three casino links) | Removed, with the browser note and page event they wrote |
| `components/programme/ProgramAiHome.tsx` | Research card under the next step once `researchAccess` was open; `discoveryLabel`, `discoveryDestination`, the `researchLinksShown` seam | Removed |
| `components/programme/ProgramAiAuthenticated.module.css` | `.researchReveal`, `.researchChecklist`, `.commercialAside`, `.exploreLinks`, `.compactResearch`, `.researchFeatured` | Removed |
| `components/programme/ProgramAiAuthenticated.types.ts`, `lib/programme/application/programme-ai-missions.service.ts`, `lib/programme/program-ai/mission-registry.ts` | `researchAccess` and `discoveryLinks` in the home read model; `researchAccessMission`, `commercialDiscoveryLinks` | Removed (API contract change, see `docs/programme-backend-api.md`) |
| `lib/programme/http.ts` and the routes `program-ai/home`, `claims/redeem`, `missions/[n]/actions`, `missions/[n]/complete`, `session` (DELETE) | `withResearchAccess` / `withoutResearchAccess`: set, renewed and withdrew `b4g_research_access` | Removed; the answers set no menu cookie |
| `lib/research-access.ts` | The lesson flag contract (cookie, options, reader, event, note, week mark, `researchNavigationShown`) | Reduced to `isResearchSectionRoute` |
| `components/public-shell/PublicNavigationClient.tsx`, `PublicNavigation.tsx`, `PublicHeader.tsx`, `PublicFooter.tsx`, `PublicShell.module.css`, `app/(public)/layout.tsx`, `app/program/layout.tsx` | The door read the cookie (server and browser), listened for the event, drew the week mark | The door follows the path alone; the `researchAccess` props and the mark are gone |
| `app/program/layout.tsx`, `app/not-found.tsx`, `PublicHeader.tsx`, `PublicNavigation.tsx`, `PublicFooter.tsx` | The Programme's shell, and the root not-found boundary Next writes into every document, built the research links behind the door (their addresses travelled in the page's inline data) and read partner availability (`resolveServerCommercialProductState`) on every Programme page | A `researchNavigation` prop (default on); the Programme layout passes `false` and `EDITORIAL_ONLY`, and the root not-found does the same in a Programme document (presentation context `programme-v1`), so the links are not built and nothing commercial is read |
| `lib/analytics/product-analytics-client.ts` | `discoveryClicked` stub, called with `sourceSurface` `mission_08`, `mission_10`, `programme_home` | Removed with its last callers |
| `lib/i18n/programme-catalog.ts`, `lib/i18n/programme-language-qa.ts` | 16 message rows in 13 languages used only by those blocks ("NEW IN YOUR MENU", "Compare casinos", "Best offers", "Bonuses", "Research", "PUT IT TO USE", …) and the QA pairing of two of them with the public shell | Removed |
| `components/programme/ActiveControlProgramme.tsx` | Unreachable legacy Programme header with five casino links | Links removed |
| `lib/email/templates.server.ts`, `lib/email/template-admin.server.ts` | Static B4GAMBLE links were allowed in every template; a stored row was rendered without a link check; activation did not re-check a version | Links into the research section (with `/catalog`) and partner routes are refused in every template, the marketing broadcast included: when saved, when activated and when rendered for sending |
| Public wording: FAQ and Methodology (13 languages), Privacy Notice, `/can-you-trust-b4gamble` (en/sv/da), `/control-without-quitting` (en/sv/da), `llms.txt`, the Methodology handoff transform | Said that finishing step 3 opens the casino, bonus and offer pages in the menu, named the cookie | Rewritten to say what the code does now; FAQ and Methodology return to their wording before 10 October ("no paywall or commercial upsell inside Missions"); the Privacy Notice (updated 16 October 2026) says the old cookie is no longer set or read |
| Review scripts (`scripts/founder-*.mjs`, `true-parity-visual.mjs`, `generate-founder-acceptance.mjs`) and `scripts/research/production-screenshots.mjs` | Mocked homes with discovery links; the screenshot run expected research links at home with the lesson cookie | Mocks cleaned; the screenshot run now expects the old cookie to open nothing |

Searched and found clean (DETECTED): Programme AI prompts and output guards (they already forbid
recommending a casino, operator or bonus), Mission guidance texts, Reviews, the final plan, the
Programme layout's other links (Help, Terms, Privacy), Learn bridges (rendered only on Learn
articles and the bonus guide, never inside `/program`), the public home (no authenticated cards),
the pause letters and the lifecycle letters.

## What does not change

- Mission order, rewards, prerequisites, XP (715 in all) and the text of the Mission 08 lesson.
- The commercial firewall: no Programme answer, artefact, XP, Review, pause or Help activity
  reaches an offer, ranking, partner route or commercial analytics dimension.
- The internal `programme_funnel` count keeps counting third-step completions and partner presses
  by signed-in people; it is measurement only. Partner presses can now come only from the public
  research pages.

## Consequences

- **Revenue.** The chain of 13 October (start → step 3 opens the menu → a casino through us) no
  longer exists. A Programme user reaches casino pages only by going to them: search, Learn, a
  direct link or the research pages' own menu. Expect `mission_08` research clicks to be zero and
  partner presses by signed-in people to fall; compare with `programme_funnel` before and after.
- **Readers who finished step 3 before the release** lose the research links outside the research
  section on their next page load. Their old cookie stays in the browser until it expires (up to
  400 days) and is ignored.
- **Privacy.** One cookie fewer; the Privacy Notice says so. Nothing new is stored.
- **No migration, no new column, no data change.**

## Way back

Annotated tag `archive/programme-research-door-2026-10-16` marks `800c2eb0` (origin/main on
16 October 2026), the last commit where the door worked end to end. `<merge sha>` below is the
merge commit of pull request #530 into `main`; find it with
`git log origin/main --merges --grep="Merge pull request #530 " -1 --format=%H`. To bring the door
back:

1. **Revert the merge** if nothing else has touched these files since: `git revert -m 1 <merge sha>`,
   resolve any conflicts, run the tests below, and go to step 5.
2. **Otherwise reverse-apply this pull request's changes three-way**, so later work in the same
   files is kept: `git diff <merge sha> <merge sha>^1 -- <paths> | git apply -3`, then resolve the
   conflicts by hand. Do not use `git checkout archive/programme-research-door-2026-10-16 -- <path>`
   for a file changed since the tag: it overwrites the file and throws away every later change in
   it (it is safe only for a file untouched since the tag). The code paths:
   `lib/research-access.ts`, `lib/programme/http.ts`, `lib/programme/program-ai/mission-registry.ts`,
   `lib/programme/application/programme-ai-missions.service.ts`,
   `components/programme/ProgramAiAuthenticated.types.ts`, `components/programme/ProgramAiHome.tsx`,
   `components/programme/ProgramAiMissionExperience.tsx`,
   `components/programme/ProgramAiAuthenticated.module.css`,
   `components/programme/ActiveControlProgramme.tsx` (only if its links are wanted back),
   `components/public-shell/` (`PublicNavigationClient.tsx`, `PublicNavigation.tsx`,
   `PublicHeader.tsx`, `PublicFooter.tsx`, `PublicShell.module.css`),
   `app/api/program/program-ai/home/route.ts`, `app/api/program/program-ai/claims/redeem/route.ts`,
   `app/api/program/program-ai/missions/[missionNumber]/actions/route.ts`,
   `app/api/program/program-ai/missions/[missionNumber]/complete/route.ts`,
   `app/api/program/session/route.ts`, `app/(public)/layout.tsx`, `app/program/layout.tsx`
   (restores `resolveServerCommercialProductState` and drops `researchNavigation={false}`),
   `app/not-found.tsx` (drops `programmeDocument`),
   `lib/analytics/product-analytics-client.ts`, `lib/i18n/programme-catalog.ts` and
   `lib/i18n/programme-language-qa.ts` (13 languages; reverse-apply, never overwrite), and the
   letter guard in `lib/email/templates.server.ts` and `lib/email/template-admin.server.ts` only if
   letters should link to casinos again.
3. **The public wording**, the same way: `lib/i18n/static-pages/faq.ts`,
   `lib/i18n/static-pages/methodology.ts`, `lib/i18n/static-pages/can-you-trust-b4gamble.ts`,
   `lib/i18n/static-pages/control-without-quitting.ts`, `lib/seo/llms.ts`,
   `lib/final-handoff/transforms.ts` and the Privacy Notice's cookie paragraph and boundary line
   (`app/(public)/privacy/page.tsx`, with a new "updated" date).
4. **Tests, specs and scripts**, the same way: `tests/public-shell.test.ts`,
   `tests/programme-http-boundary.test.ts`, `tests/program-ai-structural.test.ts`,
   `tests/program-ai-missions.test.ts`, `tests/programme-home-screen.test.ts`,
   `tests/programme-home-screen-browser.spec.ts`, `tests/programme-result-screen-browser.spec.ts`,
   `tests/program-ai-browser.spec.ts` (including the test that no Programme document carries a
   research address), `tests/public-ia-hardening-browser.spec.ts`,
   `tests/navigation-performance-stage2-browser.spec.ts`, `tests/auth-comms-browser.spec.ts`,
   `tests/founder-typography-browser.spec.ts`, `tests/programme-internationalisation*.ts`,
   `tests/programme-question-screen*.ts`, `tests/programme-request-retry-browser.spec.ts`,
   `tests/legal-programme-privacy.test.ts`, `tests/gambling-control.test.ts`,
   `tests/pause-plan.test.ts`, `tests/fe-gap-01-structural.test.ts` and
   `tests/email-reliability-postgres.test.ts` (its casino-link letter test only if the letter guard
   goes); delete `tests/programme-no-casino-links.test.tsx` and its `programme-no-casino:test`
   entry in `ci:quality`. Scripts: `scripts/research/production-screenshots.mjs` (the
   lesson-cookie browser goes back to `expect: "some"`, or the run reports the restored door as a
   failure), `scripts/founder-final-review.mjs`, `scripts/founder-mobile-review.mjs`,
   `scripts/founder-programme-width-review.mjs`, `scripts/generate-founder-acceptance.mjs` and
   `scripts/true-parity-visual.mjs` (their mocked homes with discovery links).
5. **Documents.** Record the reversal as an amendment here and in the two-doors record; revert the
   home read-model paragraph of `docs/programme-backend-api.md`; withdraw the 2026-10-16 notes in
   RFC-002, RFC-021, RFC-025 (§5.7, §12, §13) and RFC-026 and the registry rows of RFC-002,
   RFC-021 and RFC-025 in `docs/06_RFC/README.md`; update the entry in `docs/07_Decisions/README.md`, the
   letters paragraph of `docs/06_Operations/Customer-Data-Analytics-Lifecycle-Core.md` (if the
   letter guard goes) and `docs/CURRENT_STATE.md`.

## Open questions for the Founder (not changed here)

The lesson itself is out of scope and unchanged. These parts of it still speak about comparing
casinos and offers:

- the step's title "Research responsibly" and purpose "Use material terms and safer-gambling facts
  when comparing options" (also on the public 10 Steps page);
- question 1 "Which facts make a comparison materially clearer?", with options such as "Who
  operates the casino", "Bonus conditions", "Withdrawal conditions" and "Payments";
- question 2 "Which offer term most needs clarification?" and its "generic offer-term card"
  ("Bonus headline", wagering requirement, expiry, eligible games; "What you must pay in to get
  the bonus", "The most you can take out from the bonus");
- question 3 "Build a reusable research checklist … things you want to check every time", the
  keepsake "MY RESEARCH CHECKLIST", and the why-lines ("a fixed list lets you check the same
  things every time");
- next to it: step 2's options "Research only after a pause" / "Research after a pause" ("Look and
  compare only once you have paused"), Mission 06's practice moment "An unexpected offer" /
  "Unclear terms", and the final plan's priority "Research checklist".

Also open: whether the lesson should stay at step 3 now that it opens nothing (it was moved there
on 10 October to open the menu), and whether published Learn guides mention the old step-3 menu
opening (UNKNOWN: Learn prose lives in the database and was not audited here).

## Evidence

- `tests/programme-no-casino-links.test.tsx` (in `ci:quality` as `programme-no-casino:test`): no
  Programme source names a research or partner route; no Programme path is in the research
  section; Programme Home after 1, 2, 3, 4 and 10 steps and the completion screens of steps 3 and
  10 render no research link in every Programme language, even when given the old fields; the
  Programme's header and footer, rendered on a research path in every Programme language, carry no
  research address; no seeded letter links into the research section, the Admin editor refuses
  one in every template (the marketing broadcast included) for every root of
  `lib/research-access.ts` plus `/catalog`, and a stored row with one cannot be rendered.
- `tests/email-reliability-postgres.test.ts` (Database / Migration Verification): a queued letter
  whose stored template gains a `/sv/casinos` link is cancelled as `TEMPLATE_RENDER_INVALID` with
  no provider call, cannot be queued again, and the version cannot be activated again in Admin.
- `tests/public-shell.test.ts`: the contract is `isResearchSectionRoute` alone, the door reads the
  path alone, only the door imports the contract, and no Programme answer touches a menu cookie.
- `tests/programme-http-boundary.test.ts`, `tests/program-ai-missions.test.ts`: the home and every
  completion, step 3 included, carry no research state and no casino route.
- Browser: `tests/program-ai-browser.spec.ts` (the real journey: finishing step 3 sets no cookie
  and leaves the guide menu on that page, on Home and on the Programme home; and the raw HTML of
  `/program`, `/sv/program`, `/da/program` and `/program/missing`, with and without the old lesson
  cookie, contains no research or partner address),
  `tests/programme-result-screen-browser.spec.ts`, `tests/programme-home-screen-browser.spec.ts`,
  `tests/public-ia-hardening-browser.spec.ts` (an old lesson cookie opens nothing, first HTML
  included) and `tests/navigation-performance-stage2-browser.spec.ts` (the streamed research menu
  is exercised from the wagering calculator, a research page).
