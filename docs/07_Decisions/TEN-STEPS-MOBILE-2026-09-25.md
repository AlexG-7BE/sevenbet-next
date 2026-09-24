# 10 Steps on a phone

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 25 September 2026 (mobile conversion audit, proposal P6 "all together")

## Decision

- "Start Mission 01" actions on 10 Steps use sentence case at 16px on every viewport.
- On a phone (≤900px), a "Start Mission 01" bar appears at the bottom once the hero action has scrolled away. It leaves before the final action and the footer. It is the same canonical entry, `/program?entry=start`.
- On a phone (≤640px), the ten Missions read as a compact numbered list. Each item shows the number, stage, title and one-line purpose. The page drops from 9.5 to 8.2 iPhone screens, and the Mission list takes 1.8 screens.
- The closing line states the benefit ("Free to use. No account needed to begin.") in all eleven languages. It replaces the Mission 01 XP and registration mechanics ("…for 40 XP. Registration awards no XP…").

## Unchanged

- The Mission 01 reward amount, the XP rules and the registration order in the Programme itself are unchanged. Only the 10 Steps marketing line no longer describes them.
- The desktop layout is unchanged, apart from the button type.
- There are no commercial links on 10 Steps.

## Evidence

- `tests/ten-steps-parity.test.ts` covers the start-bar visibility rule, the hooks in the markup, the 16px sentence-case action, the benefit line and the link list.
- `tests/internationalisation-market.test.ts` pins the benefit line in every locale and asserts it carries no XP.
- `tests/founder-mobile-production-browser.spec.ts` checks, at 390×844 and 360×640, that the bar appears after the hero action, rests on screen, leaves at the final action, and never shows at 1280px.
