# Programme Mission screen on a phone and research after Mission 08

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 25 September 2026 (mobile conversion audit, proposals P4 and P5)

## Decision

1. **A phone Mission screen puts the first choices on the first screen.**
   - On a phone the Mission screen drops the Programme context bar (mission label, XP and log out). XP remains in the action rail and on completion, and log out remains on the Programme dashboard.
   - "← Programme Home" and "Protected Help / pause" stay at the top of every Mission screen.
   - The intro and the action prompt use smaller type and tighter spacing.
   - The confirm action is sticky at the bottom of the action card while the choices are in view.
   - Every Programme screen opens at its top instead of the scroll depth of the screen before it.
2. **After Mission 08 the research links lead the dashboard.**
   - Once Mission 08 "Research responsibly" is complete, the dashboard's research card sits directly under the current mission, with 16px links and 44px tap targets.
   - Before that it stays in its usual place.
   - The links are the same generic public links (casinos, bonuses, best offers) for every member. No Programme answer, pause or Help data chooses or orders them.
   - If the server sends no research links, nothing is promoted.

## Unchanged

- Mission order, rewards, XP, completion and the next Mission still come from the server record.
- Protected Help, SUPPORT_FIRST suppression and the commercial firewall are unchanged.
- The desktop layout is unchanged.

## Evidence

- `tests/program-ai-browser.spec.ts` covers the following at 390×844 and 360×640:
  - the Mission opens at its top;
  - the context bar is hidden while Home and Help stay visible;
  - the first choice sits above a confirm action that stays reachable while scrolling;
  - the research card leads the dashboard after Mission 08, with 16px, 44px-tall links.
- `tests/program-ai-structural.test.ts` pins the Mission 08 condition and the generic-link guard.
