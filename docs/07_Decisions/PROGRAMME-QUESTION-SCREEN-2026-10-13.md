# The question screen of a Programme step

**Status:** ACCEPTED; implemented, in review (not on Production yet).

**Decision authority:** explicit Founder instruction, 13 October 2026. The Founder said the
Programme's screens feel like a cheap survey form and asked for a more premium, comfortable feel,
not for fewer presses:

> «СДЕЛАТЬ ПРОДУКТ И ЕГО ОЩУЩЕНИЕ БОЛЕЕ ПРЕМИАЛЬНЫМ И УДОБНЫМ, А НЕ ТУПО СОКРАТИТЬ ВСЁ ЧТО МОЖНО
> РАДИ НЕСКОЛЬКИХ КЛИКОВ»

He approved a mockup of the question screen and said «делай экран вопроса». The mockup is the
specification of this change.

**Extends:** [PROGRAMME-MISSION-SCREEN-2026-09-25](PROGRAMME-MISSION-SCREEN-2026-09-25.md). The
screen of a Mission action ("question") is redrawn; the result screen, the completion screen and
the Programme home are later rounds, each with its own Founder approval.

Ordinary interface work: no RFC, no database change, no API change.

## Decision

1. **A step has its own top bar.** A round back button (the same destination and accessible name
   as the former "← Programme Home"), "Step N of 10" in the centre (the step a person sees, not
   the Mission's identity number), and the protected Help / pause link as a pill with its label,
   target and behaviour unchanged. On a phone the site header is not shown while a question is
   open: the step's bar stands in its place and the header returns with the Programme home, where
   the menu and Log out are. A wide screen keeps the site header and the Programme row above the
   step.
2. **Progress inside the step.** Thin segments, one per action, lit for the done and the current
   one, and the label "Question 1 of 3". Position and total are the server's projection of the
   Mission.
3. **The question is the headline.** The Mission title is a small eyebrow. The action's existing
   question is set in two voices: the first part in heavy capitals, the tail in the italic serif.
   No question or option is reworded. The split is a rule, not an edit of the catalogue: the tail
   is the last third of the words, at least two and at most four; a question of one or two words
   is not split (`lib/programme/program-ai/question-screen.ts`).
4. **Options are cards**, single and multiple choice alike: at least 66px tall, 16px corners, an
   acid border, a filled tick and a soft glow when chosen. A chosen card reacts at once. A
   "choose 2–3" rule keeps its place and wording.
5. **A line under each option and one "Why we ask" line under the helper.** Both are optional in
   the layout: without them a card shows its title only. They are written for the two steps a
   person meets first after sign-in, step 2 "Set a 7-day goal" (Mission 02) and step 3 "Research
   responsibly" (Mission 08), in every language of the catalogue. They are presentation: the map
   from option to line lives in `question-screen.ts`, and the server's Mission definitions do not
   know it. The checklist question of step 3 lists the same seven facts as its first question, so
   each keeps the line it already carried there.
   - **Later the same day:** the lines are written for every other step as well (Missions 03–07,
     09 and 10), so each of the 27 questions has a why-line and every option card has a line, in
     every language of the catalogue. Two questions show no option cards and carry the why-line
     only: the sequence to put in order (step 4, first question) and the drafted responses to
     choose from (step 9, second question). The second list of "Run a decision check" ("What
     would you check first?") is drawn without its action and takes no line. An option offered in
     more than one question keeps one line.
6. **One pinned button.** A full-width acid button, "Continue", without XP. While the server
   answers it keeps its word, is disabled and shows three small dots; it does not say "Saving…".
   The bar takes its own room at the end of the column, so at the end of the list the last card
   is never under it, at any height.
7. **XP stays truthful and quiet.** After the server confirms an action the progress label shows
   the server's number ("+15 XP") for about two seconds, then the question count again. The line
   of the previous action no longer stays under an unfinished question.
8. **A disabled button says what is missing** in one short line. When the button is ready the
   same place carries the privacy line the Programme home already shows: "Your data is private.
   We never use it for offers or rankings." No new privacy wording is introduced.
9. **Motion.** A question arrives with a 220ms slide and fade. What opens after a pick (drafts,
   an explanation, a follow-up choice) is scrolled into view above the bar. With reduced motion
   there are no transforms.
10. **The special widgets keep their content and logic** (drafts and own wording, explanation
    blocks, sequence builder, scenario panel, stack builder, offer decoder). They sit inside the
    new frame and take the cards' corners; their plain option rows are the new cards.

## The end of a step: result and completion screens (same day, second round)

Approved by the Founder on 13 October 2026 («сделай итог шага») from the second mockup, with one
correction: the mockup's button that led into the next step is not built. **The flow does not
change:** result screen → the person presses "Complete Mission" → completion screen → the button
returns to the Programme home.

1. **Result screen.** The step's frame (top bar, every segment lit, the Mission title as the
   eyebrow, the existing headline through the split rule). The server's completion reward is the
   quiet label by the progress ("+25 XP"); the XP of the last action shows there first for about
   two seconds. The sentence "The final step adds the {xp} XP completion reward." left the screen.
   "Complete Mission" is the pinned button, without XP, on screen at any height.
2. **The keepsake card.** The person's result on paper with ink text: the result's name and the
   brand mark, the result's own sentence in the italic serif when it has one, a dashed ticket cut,
   and its rows as small label + value in two columns (a long value takes both). It draws whatever
   rows a Mission's result has.
3. **Completion screen.** A tick and "Step N done", the result's existing name as the headline,
   one line ("You built it yourself. It is yours, not ours."), the same card, "Save as image",
   and the reward once: ten dots for the ten steps and "+25 XP · 2 of 10 steps", every number from
   the server. The yellow "+25" card and the lines "Your result is ready and the completion reward
   has been added." and "Mission complete. 25 XP earned." are gone. The button keeps its label and
   destination ("Continue from Programme Home").
4. **"Save as image"** draws the card on a canvas on the device and gives it to the share sheet
   (touch devices that offer it) or saves it as a PNG. Nothing is sent to the server. It needs
   nothing from the Content-Security-Policy that the policy did not already allow, and the policy
   is unchanged.
5. **"Change the plan" is not built.** The server does not let a recorded answer of a completed
   Mission be changed (`recordAction` answers a completed Mission, and an action already recorded,
   without writing). No Mission rule was changed for a button.
6. **What a completion screen can also carry keeps its content, logic and order**, restyled to sit
   under the card: the research block of step 3 ("New in your menu" with its three links, then
   "Put it to use" with the checklist and the guide link), the "Personal Review available" note,
   and the public guides after step 10. The research block's render stands behind one switch,
   `researchLinksShown` (on), as a seam for the clean route; this screen adds no door logic.
   *Superseded 16 October 2026 ([PROGRAMME-NO-CASINO-LINKS-2026-10-16](PROGRAMME-NO-CASINO-LINKS-2026-10-16.md)):
   the research block of step 3, the public guides after step 10 and the switch are removed; the
   completion screen carries the card, the Review note and the continue bar.*

Completion-screen variants: just completed; "Complete Mission" pressed on a Mission that was
already complete (it shows "This Mission was already complete. Your completed result is ready to
review." and the Mission's XP without a plus); a completed Mission opened again from the Programme
home ("Your completed result is ready to review."); each of these with or without the research
block (step 3, research open), the Review note (a Review became available) and the public guides
(step 10). The older "Already complete" screen of a Mission completed before Missions had actions
is unchanged.

Evidence: `tests/programme-result-screen-browser.spec.ts` (in `ci:browser`) and the end-of-step
test in `tests/programme-question-screen.test.ts` (in `programme:test`).

## Unchanged

- Every press. "Create personal drafts", "Build my plan" and the finish press "Complete Mission"
  are still presses; nothing opens, finishes or leads into the next step by itself. The result
  screen, the completion screen and the stop on the Programme home are as they were.
- Reward amounts, achievements, Mission order and prerequisites. XP, progress, completion and the
  next Mission still come from the server record; the screen only shows them.
- Protected Help, SUPPORT_FIRST suppression, the commercial firewall and the research door.
- The APIs and the database.

## Evidence

- `tests/programme-question-screen.test.ts` (in `programme:test`): the split rule over every
  catalogue text in every language; the lines for steps 2 and 3 in all thirteen cells of a row;
  the server's Mission definitions do not import them; no XP on the button; every press kept.
- `tests/programme-question-screen-browser.spec.ts` (in `ci:browser`): the top bar's accessible
  names and 44px targets, "Step N of 10" and "Question N of M", the chosen state, the saving
  state, the server's XP in the label and its return to the count, the hint under a disabled
  button, revealed content above the bar, the pick 2–3 rule, the last card above the bar at
  412×640, 412×800, 390×700, 412×915 and 320×640, no sideways scroll from 320 to 430, and the
  centred column with the site header on a wide screen.
- `tests/program-ai-browser.spec.ts`, `tests/programme-internationalisation-browser.spec.ts` and
  `tests/programme-request-retry-browser.spec.ts` follow the new labels.
