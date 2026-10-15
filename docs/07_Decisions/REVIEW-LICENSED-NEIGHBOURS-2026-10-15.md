# Review pages link to other reviews licensed in the same country

**Status:** ACCEPTED — built on 16 October 2026 in branch `feat/review-licensed-neighbours`.
[CURRENT_STATE](../CURRENT_STATE.md) records it as "in review" until it is merged, deployed and
observed on Production.

**Decision authority:** explicit Founder decision, 15 October 2026 — the Founder's choice in the
affiliate traffic audit («выбор Фаундера в аудите партнёрского трафика»), item 2: a block "Other
casinos licensed in <country>" on every review, and a link to the wagering calculator next to the
offer terms. Desktop homepage unchanged.

Ordinary UI work: no RFC, no database change, no migration, no new column, no change to any offer,
partner route, ranking rule, the Programme or Help.

## Why

**DETECTED (crawl of 15 October 2026):** 12 of the 15 Swedish reviews had exactly one internal
link from another page, 25 of 28 reviews sat four clicks from the home page, and a review linked
to other pages only through its breadcrumb. The wagering calculator had one inbound link.

## What changes

- **Neighbouring reviews** (`components/casino-profile/LicensedNeighbours.tsx`,
  `lib/casino-profile/licensed-neighbours.ts`): up to six published reviews that are indexed in the
  page's language — so licensed in that language's market (en→GB, sv→SE, da→DK, de→DE) and not in
  `BLOCKED_TARGETS` — in the casinos page's own default order (`casinosForCollectionView(…,
  "top_rated")`), without the page's own casino. The block is an `<aside>` after the long review
  and before the FAQ, titled in the page language ("Fler casinon med licens i Sverige", "Andre
  casinoer med licens i Danmark", "Weitere Anbieter mit Lizenz in Deutschland", "Other casinos
  licensed in United Kingdom"). Germany has two licensed reviews, so each shows the other; an empty
  list, another language, a demonstration or a failed catalogue read renders nothing.
- It reads the same catalogue as the casinos page and streams in its own `Suspense` boundary, so
  it never delays or fails the review itself.
- **Wagering calculator link** beside the offer terms, in en/sv/da/de, when the offer states a
  wagering multiplier.

## Release gates

- Merged and deployed: UNKNOWN at writing.
- A visual check on a phone-width Production review after deploy.
