# Learn next steps

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 25 September 2026 (mobile conversion audit, proposals P8 and P9, option A)

**Amended by:** [Learn offer bridges](LEARN-OFFER-BRIDGES-2026-09-25.md) — early bridges in bonus guides, casino-choice and payment guides join the offer bridges, "Start here" is one guide per topic, and the Bonus Guide's "Read next" uses real guides.

## Decision

- **Learn hub:** the Programme card ("Knowledge is half of it. The plan is the other half.") also appears after the first six guides in the full list, not only at the end. It uses the hub's existing translated copy and the canonical `?entry=start` entry. It hides while a topic filter or search is active.
- **Ordinary guides:** each gets one calm Programme block before the first section heading at or after 40% of the guide. The closing Programme block stays.
- **Bonus guides (`casino-bonuses`) and the Bonus Guide:** after the reading, a "Ready to apply the checklist?" bridge links to Bonuses and Best Offers, with the existing commercial disclosure beside the links. It renders only where `offersMayBePresented` allows published offers for the reader's market. These are internal navigation links, not outbound partner actions.
- **Protected guides (`responsible-gambling`):** unchanged. They keep their neutral support route to Responsible Gambling and Help, with no Programme or commercial block added.

## Unchanged

- No Programme, pause or Help data selects or orders any link.
- Protected Help stays commercial-free.
- Guide content, rankings and outbound partner actions are unchanged.

## Evidence

- `tests/learning-center-parity.test.ts` covers:
  - the hub card's position after six guides;
  - no card when there are six guides or fewer;
  - the German copy;
  - hiding the card while filtering;
  - where the mid-guide block goes;
  - the offer bridge's category and offer-presentation gates and its disclosure.
- `tests/bonus-guide-parity.test.ts` covers the Bonus Guide bridge's position between the checklist and the sources, its gate and its disclosure, and that it has no outbound partner routes.
