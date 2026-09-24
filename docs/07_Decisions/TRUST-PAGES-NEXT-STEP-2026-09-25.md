# Trust pages end with a next step

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 25 September 2026 (mobile conversion audit, proposal P10)

## Decision

- About, FAQ and Methodology end with one "next step" block: "Your next step / Put it into practice".
- Start Programme is the primary action, using the canonical `?entry=start` entry.
- Best Offers is secondary and appears only where `offersMayBePresented` allows published offers for the reader's market.
- The copy is localised for every market and makes no XP or privacy claims.
- Protected Help is unchanged.

## Evidence

`tests/public-shell.test.ts` checks:
- the block is mounted on the three pages and absent from Help;
- the action order, the canonical entry and the offer gate;
- there are no outbound partner routes;
- every locale is complete.
