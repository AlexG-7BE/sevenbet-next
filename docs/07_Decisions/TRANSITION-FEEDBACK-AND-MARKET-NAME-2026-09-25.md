# Quiet transitions and plain market names

**Status:** ACCEPTED

**Decision authority:** explicit Founder instructions, 25 September 2026.

## Decision

- **Transition feedback appears only on a slow transition.** The pending pill ("● Casinos") and the route loading frame's words and bars used to flash the page name on every tap. They now fade in only after 700ms:
  - The pill is still inserted at once, and screen readers still announce it at once. It becomes visible only when the transition is still pending at 700ms.
  - The frame's backgrounds hold the layout immediately.
  - With reduced motion there is no fade, but the delay stays.
- **Guide links raise no pill.** "Read next" links on guide pages no longer report their long guide title as a pending label.
- **Market names are plain words:**
  - A trusted country without a market profile is named in the page language: "Curated for Kazakhstan", where it used to read "Curated for KZ".
  - With no trusted country, the copy names "readers worldwide", where it used to read "the global catalog".
  - Two English meta descriptions no longer read "for the {market} editorial context".

## Supersedes

- The Navigation Stage 2 baseline records immediate feedback below 200ms (`docs/05_Engineering/Technical_Baseline/17_Navigation_Performance_Stage_2.md`). That still holds for insertion and announcement, but the pill now becomes visible after 700ms by Founder decision.

## Evidence

- `tests/public-shell.test.ts` checks the reveal delays and that guide links carry no pending label.
- `tests/commercial-ux-v1.test.ts` checks the market names:
  - Kazakhstan and Kasachstan for an unrouted country;
  - the United Kingdom unchanged;
  - "readers worldwide" when there is no country;
  - no locale still says "catalog".
- `tests/navigation-performance-stage2-browser.spec.ts` asserts the 0.7s reveal delay on the pill.
