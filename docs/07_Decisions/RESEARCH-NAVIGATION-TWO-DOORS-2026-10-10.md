# Casino research reaches the menu through two doors

**Status:** ACCEPTED. Parts 1, 2 and 3 are implemented.

**Decision authority:** explicit Founder instructions, 10 October 2026.

- On the problem: "я хочу сделать так, что бы Коммерческие ссылки, то есть даже сами разделы Best offers, casinos, bonuses, в хедере и футере открывались людям уже только после регистрации, то есть начала программы… эти разделы сразу отпугивают людей, а также размывают смысл проекта."
- On the shape, after the "two doors" proposal: "мне нравится твои предложения, про две двери, они разумные… Появление с фанфарами. После регистрации ссылки появляются, и даже лучше не после регистрации, а после прохождения определённого урока… я хочу этот урок поставить раньше, например 2 или 3… мы же говорим что поможем людям быть ответственными к игре, а не полностью изолировать вас от игры."
- On the plan: the Founder chose "Урок на шаг 3": three pull requests in order — the menu, the lesson moved to step 3, then the celebration and the public wording.

## Why

Three of the four header links were commercial. A visitor who arrives for help with gambling, most of them from social posts, met an affiliate menu before the Programme. From 27 September to 10 October 2026 the `social_traffic` read counted 72 consented Production visits, 58 of them from social networks, and no partner-button click inside those 58. The numbers are small and prove nothing by themselves; they do not contradict the Founder's reading.

The product does not ask anyone to stop gambling. It helps a person keep play inside limits they chose. Research into casinos and bonuses therefore belongs after the person has a goal and a way to check an offer, not on the first screen.

## Decision

### Part 1 — two doors (implemented with this record)

Best Offers, Casinos and Bonuses appear in the header, the mobile drawer and the footer for a reader who has come through one of two doors:

1. **The reader is already inside the research section.** They opened `/best-offers`, `/casinos`, `/casino/…`, `/bonuses`, `/compare`, `/bonus-guide`, `/wagering-calculator` or `/outbound/…` from a search result, a Learn guide or a direct link. The research menu is there as before.
2. **The reader has finished the Programme lesson "Research responsibly".** The research menu is then on every page.

Every other reader sees the guide links in their place: **10 Steps · Learn · Help**, with Start Programme beside them. The drawer lists 10 Steps and Learn, and Help keeps its own block there. The footer's Explore column keeps Learn.

What stays exactly as it was:

- **Every research page is public.** No page asks for an account, a lesson or a cookie. Search engines read them, the sitemap lists them, and the Learn offer bridges, the next-step block that ends About, FAQ and Methodology, and the research pages themselves still link to them. Product Vision §5 and §12 hold for the pages: no account unlocks the catalogue.
- **The market rule still applies inside the research menu.** Best Offers and Bonuses stay withheld where advertising is prohibited (RFC-039, RFC-054).
- **The commission disclosure, the 18+ line and the operator disclaimer** stay in the footer for every reader.

### How the menu knows

- The Programme answers that carry its home (`program-ai/home`, `missions/{n}/actions`, `missions/{n}/complete`, `claims/redeem`) set one cookie, `b4g_research_access=open`, while the lesson is complete. The home read model carries the same fact as `researchAccess: "open" | "locked"`, decided on the server from Mission progress.
- The cookie is a plain flag. It names nobody and holds no Programme answer. It lasts 400 days and is renewed whenever the Programme answers. Sign-out withdraws it, and a home answer for an account that has not finished the lesson withdraws a flag left in the browser by another account.
- The menu chooses its door in the browser, from the current path and the cookie, because a layout is not rendered again when the page changes. The server reads the same cookie for the first HTML, so nothing swaps in after load.
- The public shell still reads no session and no Programme state. `lib/research-access.ts` is the whole contract and imports nothing.
- The Privacy Notice (updated 10 October 2026) names the cookie, what it holds and what it does and does not do, and its boundary line no longer claims that Programme activity never changes commercial content: finishing one step opens the research links, and answers play no part.

### The boundary that does not move

Lesson completion changes which **menu links** a reader sees. It changes nothing else:

- no offer, casino, bonus, rank, order, partner button or `/r/` route reads the flag or any Programme state;
- no Programme answer, artefact, XP, Review, pause or Help activity reaches a commercial module, a URL or an analytics dimension used for offers;
- a research link awards no XP and no lesson requires a click on one.

`tests/public-shell.test.ts` pins the list of files that may import the flag contract: the two layouts, the menu's client component and the Programme HTTP helper.

### Part 2 — the lesson is the third step (implemented)

"Research responsibly" keeps its number, 08, and is now the third step a person takes, after "Set a 7-day goal", so that they have a goal for the week before research opens. The order is 1, 2, 8, 3, 4, 5, 6, 7, 9, 10 (`programmeJourney`).

- **Number is identity, step is order.** Progress rows, reward keys, artifact versions, API routes and analytics steps keep the Mission number. Nothing stored was renumbered or migrated; the 715 XP total and every reward are unchanged.
- **A person sees steps.** Programme Home, the Mission screens, the timeline in the last Mission, the Review distance line, the public 10 Steps page and the overview under the Programme entry all number and list the Missions in journey order.
- **People already past the third step** take "Research responsibly" next, then return to the Mission they were in with their saved actions. A Mission opens only when every earlier Mission of the journey is complete, so the lesson cannot be passed by.
- **Personal Reviews stay with their Missions.** The First Review still follows "Understand the urge", which is now step 04, so it arrives one step later than before; Mid follows step 07, Full step 10. Moving a Review would change what it is written from, and was not part of this decision.
- **Analytics keep the Mission number.** `programmeStep` in events and the internal Programme dashboard stay keyed by number, so "step 8" there is "Research responsibly" and now completes before "step 3".

Recorded as the amendment in RFC-025 §3, which had called the order immutable for the MVP.

### Part 3 — the moment research opens, and the public wording (implemented)

**On the Mission's completion screen.** When "Research responsibly" is complete, its completion screen says so inside the reward card: "New in your menu — Casinos, bonuses and offers are now open to you", with the three links (Compare casinos, Explore bonuses, Best offers). Below it, "Research with your checklist" shows the checklist the person just built and the Programme's stance in one line: it does not ask anyone to give play up; it helps keep play inside limits they choose. The Bonus guide link sits there.

- The block appears only on that Mission and only when the server reports `researchAccess: "open"`. It moves in once, on the completion itself, and not at all for a reader who asks for reduced motion.
- The links are the fixed public routes. No answer, artefact, wording or Review reaches a URL, and nothing the person entered picks or orders a link.
- **The menu on the same page changes with the screen.** The completion answer has already set the flag; the page announces it (`b4g:research-access`) and the header and footer swap to the research links at once.
- **A mark for a week.** The browser notes the moment in its own storage (`b4g_research_opened_at`), and for seven days Best Offers, Casinos and Bonuses carry a small mark in the header and the drawer. The note is never sent anywhere.
- **Programme Home shows its Research card only once research is open**, under the current Mission. Before the lesson there is no research card on the dashboard.

**Public wording**, in all thirteen published and prepared languages:

- FAQ, "Is the Programme really free?": free, no paywall, and one Mission, "Research responsibly", ends by opening the casino, bonus and offer pages in the menu; using them is the reader's choice. The earlier "no commercial upsell inside Missions" is withdrawn.
- Methodology, "Editorial vs commercial": Programme and Help activity is not used to target offers, personalise rankings or feed advertising; finishing that Mission opens those pages in the menu; answers never choose or rank an offer.
- Privacy Notice (with Part 2): the cookie, what it holds, what it does and does not do.

Left as it is, for the Founder to decide: the Terms still say Programme information "is not used to select, rank or personalise commercial content". Selection and ranking are untouched; whether opening menu links counts as personalising commercial content is a reading the Terms do not settle, and changing accepted Terms is a separate decision.

## What this supersedes

For the approved scope, this decision supersedes older internal language where it conflicts:

- **RFC-002** — "commercial eligibility, ranking and promotional exposure are not affected by Program state": eligibility and ranking still are not. Menu exposure of the research section now follows one lesson.
- **RFC-021 §7** — "Access and authentication state is not available to … commercial personalisation": still true. The menu reads the lesson flag, not access or authentication state.
- **RFC-025 §13** — the discovery links stay generic and payload-free. Programme Home now shows them only once research is open, Mission 08's completion presents them inside the reward card, and the public menu follows the lesson. RFC-025's design note rejecting a commercial link inside reward feedback no longer applies to this one Mission.
- **RFC-017 §4** — the import and data-contract firewall is unchanged and still enforced by its structural tests.
- **Final design handoff** — "Help" was not a header link. It returns only as a guide link for readers outside the research section before the lesson.

## Consequences accepted by the Founder

- Pages outside the research section no longer link to Best Offers, Casinos and Bonuses from their header and footer for readers without the lesson, search engines included. The research pages keep their links to one another, the sitemap, the Learn offer bridges and the trust pages' next-step block.
- A partner compliance review may question a product that opens casino research after a lesson about control. The wording answers it: what the lesson gives is a checklist and an open research section, and the screen says the Programme does not ask anyone to give play up, not that they should play.

## Rollback

Part 3 alone: revert its pull request; the menu, the flag and the order stay.

Make `researchNavigationShown` in `lib/research-access.ts` return `true`. The research menu is then shown to everyone on every page, as before 10 October 2026. No data changes either way.

## Evidence

- `tests/public-shell.test.ts` — the two doors, the exact cookie contract, the door chosen in the browser, the closed list of files that read the flag.
- `tests/programme-http-boundary.test.ts` — a home answer sets the flag only for a completed lesson, withdraws a stale one, and sign-out withdraws it.
- `tests/program-ai-missions.test.ts` — `researchAccess` turns `open` in the answer that completes Mission 08 and with no earlier Mission; the journey order, steps and prerequisites; identity keys that do not move; a person past the third step taking the lesson next and resuming with saved actions.
- `tests/programme-completion-consistency-postgres.test.ts` and `tests/program-ai-browser.spec.ts` — the full journey against PostgreSQL, 715 XP, Reviews after their Missions.
- `tests/ten-steps-parity.test.ts`, `tests/ten-steps-render.test.cjs`, `tests/internationalisation-market.test.ts` — the public 10 Steps page lists the Missions in journey order.
- `tests/public-ia-hardening-browser.spec.ts` — guide links on Home, research menu on Casinos, the swap without a reload, the flag opening the menu, and the first HTML for both readers.
- `tests/navigation-performance-stage2-browser.spec.ts` runs as a reader with the flag, so the streamed research menu keeps its Stage 2 coverage.
- `tests/program-ai-structural.test.ts` — the completion block: shown by that Mission only, fixed routes, no Programme content, thirteen translations per line, readable targets, reduced motion.
- `tests/program-ai-browser.spec.ts` — the real flow against PostgreSQL: guide menu before, completion screen, flag, the menu changing on the same page, the mark, the research menu on Home, the dashboard card.
- `tests/public-shell.test.ts` — the week-long mark and the closed list of files that read the contract.
