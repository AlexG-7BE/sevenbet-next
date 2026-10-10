# Casino research reaches the menu through two doors

**Status:** ACCEPTED. Part 1 is implemented; Parts 2 and 3 are decided and not yet built.

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

### The boundary that does not move

Lesson completion changes which **menu links** a reader sees. It changes nothing else:

- no offer, casino, bonus, rank, order, partner button or `/r/` route reads the flag or any Programme state;
- no Programme answer, artefact, XP, Review, pause or Help activity reaches a commercial module, a URL or an analytics dimension used for offers;
- a research link awards no XP and no lesson requires a click on one.

`tests/public-shell.test.ts` pins the list of files that may import the flag contract: the two layouts, the menu's client component and the Programme HTTP helper.

### Part 2 — the lesson moves to step 3 (decided, not yet built)

"Research responsibly" is Mission 08 today. It will become the third step, after "Set a 7-day goal", so that the person has a goal for the week before research opens. Lesson identity, rewards and saved progress will not be renumbered; the order will be separated from the identity. This changes RFC-025 §3, which called the order immutable for the MVP, and will be recorded as an amendment there.

### Part 3 — the celebration and the public wording (decided, not yet built)

Completing the lesson will be marked on its completion screen as the moment casino research opens, framed by the person's own checklist and weekly goal. The About and FAQ sentences about the Programme and commercial sides will be reworded in the same release to say plainly what happens: finishing the lesson opens the research section in the menu, and a person's answers never choose or rank an offer.

## What this supersedes

For the approved scope, this decision supersedes older internal language where it conflicts:

- **RFC-002** — "commercial eligibility, ranking and promotional exposure are not affected by Program state": eligibility and ranking still are not. Menu exposure of the research section now follows one lesson.
- **RFC-021 §7** — "Access and authentication state is not available to … commercial personalisation": still true. The menu reads the lesson flag, not access or authentication state.
- **RFC-025 §13** — generic discovery links from Programme Home and Missions 08 and 10 stay as described; the public menu now also follows the lesson.
- **RFC-017 §4** — the import and data-contract firewall is unchanged and still enforced by its structural tests.
- **Final design handoff** — "Help" was not a header link. It returns only as a guide link for readers outside the research section before the lesson.

## Consequences accepted by the Founder

- Pages outside the research section no longer link to Best Offers, Casinos and Bonuses from their header and footer for readers without the lesson, search engines included. The research pages keep their links to one another, the sitemap, the Learn offer bridges and the trust pages' next-step block.
- A partner compliance review may question a product that opens casino research after a lesson about control. The wording of Part 3 answers it: what the lesson gives is a checklist and an open research section, not an invitation to play.

## Rollback

Make `researchNavigationShown` in `lib/research-access.ts` return `true`. The research menu is then shown to everyone on every page, as before 10 October 2026. No data changes either way.

## Evidence

- `tests/public-shell.test.ts` — the two doors, the exact cookie contract, the door chosen in the browser, the closed list of files that read the flag.
- `tests/programme-http-boundary.test.ts` — a home answer sets the flag only for a completed lesson, withdraws a stale one, and sign-out withdraws it.
- `tests/program-ai-missions.test.ts` — `researchAccess` turns `open` in the answer that completes Mission 08 and with no earlier Mission.
- `tests/public-ia-hardening-browser.spec.ts` — guide links on Home, research menu on Casinos, the swap without a reload, the flag opening the menu, and the first HTML for both readers.
- `tests/navigation-performance-stage2-browser.spec.ts` runs as a reader with the flag, so the streamed research menu keeps its Stage 2 coverage.
