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

## Decision

1. **No Programme surface links to a casino.** No Programme screen, card, dashboard, completion
   screen, Mission, Review, letter or AI guidance contains a link to `/best-offers`, `/casinos`,
   `/casino/…`, `/bonuses`, `/compare`, `/bonus-guide`, `/wagering-calculator`, `/outbound/…`,
   `/r/…` or `/go/…`, in any language.
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
5. **Letters.** No Programme, pause or account letter links into the research section. The seeded
   letters already linked only to the Programme, the pause plan and their unsubscribe address
   (DETECTED: `lib/email/pause-letters/seed-templates.ts`, migration 0037's seed); the Admin
   template editor now refuses a static link into the research section in every template except
   the marketing broadcast, which is not a Programme letter. The pause letters' send switch
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
| `lib/analytics/product-analytics-client.ts` | `discoveryClicked` stub, called with `sourceSurface` `mission_08`, `mission_10`, `programme_home` | Removed with its last callers |
| `lib/i18n/programme-catalog.ts`, `lib/i18n/programme-language-qa.ts` | 16 message rows in 13 languages used only by those blocks ("NEW IN YOUR MENU", "Compare casinos", "Best offers", "Bonuses", "Research", "PUT IT TO USE", …) and the QA pairing of two of them with the public shell | Removed |
| `components/programme/ActiveControlProgramme.tsx` | Unreachable legacy Programme header with five casino links | Links removed |
| `lib/email/templates.server.ts` | Static B4GAMBLE links were allowed in every template | Research-section links refused outside the marketing broadcast |
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
16 October 2026), the last commit where the door worked end to end. To bring it back:

1. If nothing else has touched these files since, revert the merge commit of this pull request
   (`git revert -m 1 <merge sha>`), and stop here.
2. Otherwise restore the code from the tag and merge it with what changed since:
   `git checkout archive/programme-research-door-2026-10-16 -- lib/research-access.ts lib/programme/http.ts lib/programme/program-ai/mission-registry.ts lib/programme/application/programme-ai-missions.service.ts components/programme/ProgramAiAuthenticated.types.ts components/programme/ProgramAiHome.tsx components/programme/ProgramAiMissionExperience.tsx components/programme/ProgramAiAuthenticated.module.css components/public-shell app/api/program/program-ai/home/route.ts app/api/program/program-ai/claims/redeem/route.ts "app/api/program/program-ai/missions/[missionNumber]/actions/route.ts" "app/api/program/program-ai/missions/[missionNumber]/complete/route.ts" app/api/program/session/route.ts "app/(public)/layout.tsx" app/program/layout.tsx lib/analytics/product-analytics-client.ts lib/i18n/programme-catalog.ts lib/i18n/programme-language-qa.ts`.
3. Restore the public wording from the same tag: `lib/i18n/static-pages/faq.ts`,
   `lib/i18n/static-pages/methodology.ts`, `lib/i18n/static-pages/can-you-trust-b4gamble.ts`,
   `lib/i18n/static-pages/control-without-quitting.ts`, `lib/seo/llms.ts`,
   `lib/final-handoff/transforms.ts` and the Privacy Notice's cookie paragraph and boundary line
   (`app/(public)/privacy/page.tsx`, with a new "updated" date).
4. Restore the tests and specs that pinned the door from the tag (`tests/public-shell.test.ts`,
   `tests/programme-http-boundary.test.ts`, `tests/program-ai-structural.test.ts`,
   `tests/program-ai-missions.test.ts`, `tests/programme-home-screen*.ts`,
   `tests/programme-result-screen-browser.spec.ts`, `tests/program-ai-browser.spec.ts`,
   `tests/public-ia-hardening-browser.spec.ts`, `tests/navigation-performance-stage2-browser.spec.ts`
   and the others listed in this pull request), delete `tests/programme-no-casino-links.test.tsx`
   and its `programme-no-casino:test` entry in `ci:quality`, and relax the template guard in
   `lib/email/templates.server.ts` only if letters should link to casinos again.
5. Record the reversal as an amendment here and in the two-doors record.

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
  10 render no research link in every Programme language, even when given the old fields; no
  seeded letter links into the research section and the Admin editor refuses one.
- `tests/public-shell.test.ts`: the contract is `isResearchSectionRoute` alone, the door reads the
  path alone, only the door imports the contract, and no Programme answer touches a menu cookie.
- `tests/programme-http-boundary.test.ts`, `tests/program-ai-missions.test.ts`: the home and every
  completion, step 3 included, carry no research state and no casino route.
- Browser: `tests/program-ai-browser.spec.ts` (the real journey: finishing step 3 sets no cookie
  and leaves the guide menu on that page, on Home and on the Programme home),
  `tests/programme-result-screen-browser.spec.ts`, `tests/programme-home-screen-browser.spec.ts`,
  `tests/public-ia-hardening-browser.spec.ts` (an old lesson cookie opens nothing, first HTML
  included) and `tests/navigation-performance-stage2-browser.spec.ts` (the streamed research menu
  is exercised from the wagering calculator, a research page).
