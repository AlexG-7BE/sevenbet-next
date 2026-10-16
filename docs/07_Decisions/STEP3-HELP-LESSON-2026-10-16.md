# Step 3 is a help lesson: "Know who to turn to"

**Status:** PROPOSED — NOT YET LIVE. Founder decision recorded; the text and screens wait for the
Founder's review before merge (his condition). Branch `feat/step3-help-lesson`, built on
`feat/programme-no-casino-links`.
**Date:** 16 October 2026
**Decision source:** Founder, question tool, 16 October 2026 (the same session as
[PROGRAMME-NO-CASINO-LINKS-2026-10-16](PROGRAMME-NO-CASINO-LINKS-2026-10-16.md)): the lesson of
step 3, Mission 08 "Research responsibly" (a casino comparison and a bonus-terms checklist), is
**replaced by a help lesson**: bring in one person or one help service, and know where to turn when
the urge comes. Mission number, step order and rewards stay. He sees the text and the screens
before any merge.

## What changes

| Part | Was | Now |
| --- | --- | --- |
| Title and purpose (13 languages, Programme and public 10 Steps page) | "Research responsibly" — "Use material terms and safer-gambling facts when comparing options." | "Know who to turn to" — "Choose one person or one help service, and plan the first 10 minutes of an urge." (sv "Bestäm vem du vänder dig till", da "Bestem, hvem du kan gå til") |
| Question 1 (`learn_comparison_signals`) | Which facts make a comparison clearer (licence, operator, bonus conditions …), 2–3 | Who is one person you could tell (who they are to you, never a name; "Nobody yet: a help service first" is an answer) and what you would say (one of five short lines). An optional own wording stays in the tab and is never sent. |
| Question 2 (`decode_offer_terms`) | Which offer term most needs clarification, with a generic bonus-terms card | Which kind of help you would try first (phone, chat, in person, money and debt, help for the people close to you), then the service that answers for it in the person's market: name, number, opening hours, website, and the crisis line under it |
| Question 3 (`build_research_checklist`) | A reusable research checklist, 3–5 | What you will do in the first 10 minutes of an urge, 2–3 moves in order |
| Keepsake | "MY RESEARCH CHECKLIST" | "MY SUPPORT CARD": the chosen line as the card's sentence; the person; the service with its number and hours; Sweden's evening/weekend line; the first 10 minutes; the crisis line |
| Final plan priority | "Research checklist" | "Support card" (person, help service, first 10 minutes) |
| Trust page (en/sv/da), control page FAQ (en/sv/da) | Step 3 teaches reading an offer's terms | Step 3 helps choose one person or one help service; it ends with a support card |
| Provider policy | — | Mission guidance and Reviews never write a phone number, opening hours, a website or a help service's name; output with a run of five or more digits is refused (policy `programme-ai-missions:2026-10-16:v3`) |

The help services are a checked list in `lib/programme/program-ai/help-services.ts`, one per
Programme language whose market we checked: Swedish → Sweden, Danish → Denmark, English → Great
Britain. Every name, number and opening time was copied from the service's own page on
16 October 2026 (two pages refused an automated visit; their lines come from the national health
service page that lists them: 1177.se for Självmordslinjen, nhs.uk for the National Gambling
Helpline). The ten other Programme languages show no number: they point to the Help page, and
their crisis row asks the reader to call the local emergency number. A person's answer stores only
the kind of help; the service is drawn from the list when the card is shown, so a corrected number
reaches every card at once.

Both readers are respected: the lesson says nothing about quitting, either way. Some services in the
list (Gamblers Anonymous, Spelberoendes Riksförbund, Föreningen Spelfriheten, GamFam) work towards
not gambling at all; they are offered as services, not as a verdict.

## What stays

- Mission number 08, step 3 (`programmeJourney` 1, 2, 8, 3, …), prerequisite (step 2), action ids
  (`learn_comparison_signals`, `decode_offer_terms`, `build_research_checklist` — identities from
  the first lesson), task states, reward keys, XP (15 + 20 + 15 + 25), artifact version
  `programme-ai-v1:mission-08`, the progress-event keys, the completion screen and its flow.
- No migration, no new column, no new route, no new write API.

## Answers stored under the research lesson

The Mission 08 record keeps its fields `researchCriteria`, `comparisonSignals` and
`offerTermSignal` until the next save. They are declared retired in
`programme-ai-missions.service.ts` (`retiredArtifactFields`): read as absent everywhere (screens,
step 10's timeline and plan, the Reviews, the provider), and dropped from the record on the next
save of that Mission. A step 3 completed under the research lesson, holding none of the new
answers, opens as **already complete** (the existing legacy screen) instead of an empty card; the
journey goes on. A step 3 begun under the research lesson keeps its saved actions and XP and asks
the remaining help questions. A final plan saved with the priority "Research checklist" shows its
other priorities. Evidence: `tests/programme-step3-help-lesson.test.tsx`.

The local copy of the production database (dev copy, last refreshed before 16 October 2026) holds
one completed Mission 08 and no Mission 08 in progress.

## Open for the Founder

- **Step 7 "Prepare support"** now overlaps with step 3 (a support route, a support card style, an
  exit action). It is unchanged here; making it build on the step-3 card is a separate decision.
- **People who finished the research lesson** see "already complete" and do not get the new card.
  Letting them fill it without new XP is possible later.
- **English readers outside Great Britain** see the British services (the English Programme is
  `en-GB`). Ireland (Gambling Care, 1800 936 725) is listed in the help-channel audit and not added
  here (whether Ireland is a help market is his decision).
- **Föreningen Spelfriheten** is the Swedish evening/weekend line (open around the clock). The
  help-channel audit notes that the association takes money from operators.
- **Step 2** still offers "Research only after a pause" / "Research after a pause", and the
  pause plan's day 3 still says "Learn to read terms, odds and RTP"; both are outside this change.

## Way back

Revert the pull request. No data migration is involved: a record saved under the help lesson then
holds fields the research lesson does not know; to keep such records readable after a revert, add
`trustedPerson`, `openingLine`, `helpService`, `firstTenMinutes` to that version's retired fields.
