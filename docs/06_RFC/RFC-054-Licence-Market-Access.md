# RFC-054: Licence-Based Market Access

- **Status:** `ACTIVE`
- **Decision authority:** explicit Founder instruction, 24 September 2026
- **Scope:** whether a published casino may be promoted — its offers shown, its
  partner button rendered and its `/r/` route followed — in the visitor's market
- **Depends on:** Product Vision & Principles §16, RFC-038, RFC-039, RFC-042,
  RFC-047 and RFC-049
- **Amends:** RFC-047, where it says a factual market fact is not a second CTA
  veto; RFC-039, where globally published offers stay visible in every market
  without a prohibition
- **Does not change:** MarketActivation as the persisted route authority, the
  GB evidence chain (RFC-014/015), the country prohibition list
  (`OFFER_PRESENTATION_PROHIBITED_MARKETS`) or any database schema

## 1. Decision

Market decisions follow each operator's own licences, not the affiliate
network that carries the brand. One register records, per casino and per
market, the local licence that admits it or the evidence that the operator
refuses the market. One pure function reads it:

```ts
marketAccess(casinoSlug, market, now): { open: true } | { open: false; closure }
```

`closure` is one of:

| Closure | Meaning |
| --- | --- |
| `PROHIBITED_BY_LAW` | The country prohibits presenting gambling offers (the existing prohibition list). |
| `OPERATOR_BLOCKS` | The operator refuses players from the market (block page, HTTP 403 or its own terms). |
| `NO_LOCAL_LICENCE` | The market requires a local licence and the casino does not hold one. |
| `GREY_ZONE_CLOSED` | The market has no casino licensing yet and the Founder keeps it closed. |
| `OUTSIDE_ADVERTISING_WINDOW` | The market limits when online casino advertising may run (Germany, 21:00–06:00 Europe/Berlin). |

A market is keyed by its ISO 3166-1 code, or by an ISO 3166-2 subdivision where
licensing is provincial (CA-ON, AR-C); the exact subdivision rule wins over its
country's. A market without a rule stays open: RFC-039's "missing evidence is
not a prohibition" still holds there, and the partner route and jurisdiction
gates still decide.

## 2. Where it applies

The same function gates every promotional surface, so the button, the redirect
and the offer can never disagree:

1. **Button** — `PublicCommercialActionResolver` returns `action = null` with the
   closure as its reason, before any route is read.
2. **Redirect** — `/r/{slug}` refuses a closed market after the canonical route
   lookup; the closure is stored as the `OutboundClick.blockedReason`.
3. **Offers** — the public casino, discovery, offer and comparison services
   withhold the casino's offers where it is closed. The review itself stays:
   publication is not promotion.

The check runs per request, after the 60-second editorial cache, so the German
window opens and closes on time. It is a map lookup with no database access.

Two presentation rules follow from the same register (`presentInMarket`):

- **The offer must belong to the market.** Where a local licence is required,
  only the casino's offer published for that market (`EXACT`) is shown. An
  offer from another market (`OTHER_MARKET`) or the international one (`ROW`)
  carries another licence's terms, so it is withheld. Grey-zone and unruled
  markets keep RFC-039's cross-market presentation.
- **Forbidden game categories are hidden.** A market rule may list game
  categories that visitors from it must not see. Germany hides jackpots, table
  games, live casino, poker, roulette, blackjack and baccarat (only virtual slot
  games are licensed there; EGO's German rules forbid the rest).

## 3. Register

- `lib/market-access/register.ts` — market rules and the casino × market
  licence register, each entry naming its register evidence.
- `lib/market-access/access.ts` — the decision and the offer-withholding helper.
- Evidence — `research_staging/network-market-coverage-2026-09-24/`: the
  Spelinspektionen, Spillemyndigheden, iGaming Ontario, UKGC and GRAI registers
  and checks from real local exits (Globalping, SkillOnNet `SON_CONFIG`).

`tests/market-access.test.ts` verifies every Swedish entry against the
Spelinspektionen extract, every Danish SkillOnNet entry against the
Spillemyndigheden list, every British entry against the UKGC domain register
and every German entry against the GGL whitelist evidence, and pins the launch
counts: GB 19, SE 15, DK 10, DE 2.

Every catalogue casino must have an entry. A casino missing from the register
is closed wherever a local licence is required.

## 3a. Great Britain (proposed with PR, Founder decision pending)

Until now a GB button or redirect also needed the RFC-014/015 per-casino
evidence chain: an operator profile, a partner-agreement record in the
programme metadata, and a UKGC domain-evidence record refreshed every seven
days. The domain-evidence store has been empty by design since it was built,
so no GB referral has ever been possible — including the twelve EGO routes
recorded ACTIVE + HEALTHY on 22 September 2026.

Under this RFC the register is that evidence: each GB entry names the brand
domain, verified by test against the UKGC domain register. A casino the
register admits in GB is referral-ready once the jurisdiction admits referral
(the Founder's GB scope supersedes the stale internal GB policy) and the
redirect contract is safe; MarketActivation still owns route health, bindings,
date windows and the safe destination.

## 4. Grey zone

Ireland is open: GRAI has licensed betting only, and MGA operators serve Irish
players lawfully until its casino phase opens. When it does, Ireland becomes
`LICENCE_REQUIRED` and closes for every casino without a GRAI licence — a
one-line change. Canada outside Ontario stays closed under
FOUNDER-EGO-2026-09-22 pending legal advice.

## 5. Relationship to MarketActivation

MarketActivation remains the only persisted route authority (RFC-042, RFC-049).
The register does not create routes; it closes markets. Activations in closed
markets are dead weight and are disabled by a separate, Founder-confirmed data
release, which also enables licensed markets that have a verified route.

## 6. Recovery

Rollback is an application revert. No schema, data or configuration changes
with this RFC.
