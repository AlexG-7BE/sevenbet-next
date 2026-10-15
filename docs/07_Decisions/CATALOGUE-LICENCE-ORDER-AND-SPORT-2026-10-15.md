# Catalogue order by licence, and the sports offer for every reader

**Status:** ACCEPTED — built on 16 October 2026 in branch `feat/catalogue-licence-order-and-sport`.
[CURRENT_STATE](../CURRENT_STATE.md) records it as "in review" until it is merged, deployed and
observed on Production.

**Decision authority:** explicit Founder decision, 15 October 2026 — the Founder's choice in the
affiliate traffic audit («выбор Фаундера в аудите партнёрского трафика»), "каталог и спорт": items 3
and 8 of the audit. The Swedish and Danish pages of the six Superfly / White Hat brands stay as
they are (Founder, 15 October 2026).

Ordinary product work: no RFC, no database change, no migration, no new column, no change to any
offer, partner route, the Editor Score, the Programme or Help.

## What changes

1. **Catalogue order** — amends [CASINOS-VISITOR-FIT-ORDER](CASINOS-VISITOR-FIT-ORDER-2026-09-27.md):
   button for this visitor (a withheld offer does not count) → licensed in the page language's
   market → the rest; the editorial order inside each group. Same rule in the discovery `FEATURED`
   sort, so the ItemList follows it; the ItemList lists only indexed reviews.
2. **Offer order** — amends [BONUSES-VISITOR-FIT-ORDER](BONUSES-VISITOR-FIT-ORDER-2026-09-25.md):
   inside each tier, offers of casinos licensed in the page language's market lead.
3. **Sports offer (#519)** on the Swedish and Danish Betsson and NordicBet reviews: its text and
   terms are shown to every reader and to crawlers, like the casino offer; only the button needs
   the review's partner route. With a route, "Terms" opens our `/r/` route (placement
   `CTA_CASINO_OFFER_TERMS`, decision 27 Sep 2026); without one it links the operator's terms.
4. **Titles:** those four reviews read "… casino & odds recension …" (sv) and "… casino & odds
   anmeldelse …" (da).

## Not changed

- The sports button still opens the casino route: a sports route needs a migration (15 October:
  "no schema change").
