# FOUNDER-CASINO-GLOBAL-CATALOG-2026-09-23: global casino catalog, editorial rewrite and ranking

**Status:** Founder decision, recorded 23 September 2026
**Decision reference:** `FOUNDER-CASINO-GLOBAL-CATALOG-2026-09-23`
**Supersedes, in part:** point 6 of [FOUNDER-EGO-2026-09-22](FOUNDER-EGO-SKILLONNET-2026-09-22.md), which fixed the thirteen EGO Editor Scores and their generated editorial lists.

## Problem

A casino profile read from a country with no exact market profile — Kazakhstan,
and every other country outside the published set — was effectively blank.
`https://b4gamble.com/en/casino/turbonino` showed "Not verified" for payout,
minimum withdrawal, fees, games, support languages, operator, market and
licence status, with no offer and no payment methods.

This was not a rendering fault. For 21 of 28 published casinos every payment,
provider, category, bonus and licence hung off a `CasinoCountry` market
profile, and the public projection correctly refuses to borrow one country's
facts for another. The layer RFC-039 calls "globally publishable editorial,
catalog and offer content" was simply never populated. The seven casinos that
did carry a global layer — the White Hat Gaming brands and GoldenPlay — render
a full page under exactly the same conditions.

Two further defects made it worse:

- A corporate or B2C licence is recorded once per market, so a brand's own
  Malta licence existed as up to fourteen duplicate rows each linked to one
  country. Read in isolation every row looked like a market fact and was
  stripped from the global record.
- Licences were filtered on the register's free-text `status` while being
  output from `canonicalStatus`, so every licence recorded as
  "Active (number not primary-verified)" was discarded outright.

Separately, the thirteen EGO casinos carried generated editorial. Every
"Best for" list opened `Players who want a licensed site:` followed by licence
numbers the page already prints in its regulation section, and all thirteen
shared the same three "Things to know" lines. The Founder's words: "это полная
хрень, оно ничем не полезно нашим клиентам."

## Decision

1. **Rebuild the global catalog layer** for every published casino from facts
   already held, under the rules in `lib/casino-global-catalog/derivation.ts`.
   A catalog row is promoted only when every market profile carrying evidence
   of its kind asserts it, so the global set is a subset of each contributing
   market and can never introduce a claim into an exact-market view. Fields
   that cannot be derived safely are reported unresolved, not guessed.
2. **Treat a licence's reach as the rule for where it belongs.** No market
   profiles, or several, means a global identity fact published with its own
   jurisdiction. Exactly one means a national licence that stays in its market.
   Duplicate rows of one corporate licence are collapsed into a single row that
   keeps every market link.
3. **Replace the generated editorial** for the thirteen EGO casinos with
   reader-facing copy in `data/casino-global-catalog-01/editorial.v1.json`. No
   line may open with a licence recital, quote a licence number, or be shared
   between two casinos; the tests enforce all three.
4. **Rank the casino directory on the editorial-authority parameters** already
   used by the offer ranking — Editor Score first, then offer-term
   completeness, payout evidence, breadth of the published record and review
   freshness — and show each card why it ranks where it does. Commercial
   compensation, partner status and route eligibility never participate.
5. **Recompute Editor Scores** over the completed record using the same
   six-component method, stated once in `lib/casino-global-catalog/editor-score.ts`.

Point 5 overrides the scores approved on 22 September. The Founder asked for it
explicitly on 23 September, and under `docs/GOVERNANCE.md` a current explicit
Founder decision outranks an older one.

## What the recompute implies

The six-component method scores the breadth of the verified record: regulators
with a current licence, game categories, payment methods, providers, support
languages. It does not measure the quality of the casino. A brand we have
researched more thoroughly therefore scores higher than an equally good brand
we know less about, and a deliberately narrow brand such as MegawaysCasino
scores as a narrow brand. This is recorded here so the property is understood
rather than discovered later; showing the components on the profile is the
mitigation.

Restating the method in exact integer arithmetic reproduces twelve of the
thirteen component sets published on 22 September. PlayOJO Bingo's
user-experience component is recorded there as 7.5 where the method yields 7.6
from the same counts; the cause is not established in the record and that
casino's published score of 7.2 is unaffected either way. The discrepancy is
pinned in `tests/casino-editor-score.test.ts` rather than absorbed silently.

## What this decision does not do

It grants no commercial, referral, advertising or route authority. It opens no
market and changes no jurisdiction table. Market availability, partner routes
and outbound actions remain governed by RFC-042 and RFC-047, and the
neutral-information matrix in
`docs/04_Compliance/Global-Casino-Market-Presentation-Policy.md` is unchanged:
a country with no configured policy still sees neutral global identity only,
with no market fact, offer or bonus inferred for it.

## Implementation

`scripts/casino-global-catalog-01.ts` (`npm run casino-global-catalog`), with
`plan`, `apply` and `editorial` commands. See
[the runbook](../06_Operations/Casino-Global-Catalog-01-Runbook.md).
