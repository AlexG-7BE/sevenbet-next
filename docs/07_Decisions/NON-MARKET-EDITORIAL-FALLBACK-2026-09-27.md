# Visitors from outside our markets read the URL language's market

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 27 September 2026. After the pre-launch audit the Founder chose package C, "Google and AI see the right market". This decision narrows one sentence of [RFC-037](../06_RFC/RFC-037-Internationalisation-and-Multi-Market-Foundation.md) ("Language never grants market or commercial authority"). Language now selects the *editorial* market for visitors whose country has no market of ours. It still grants no commercial authority.

## Decision

On the Bonuses, Best Offers, Casinos and casino review pages, the editorial view (which offers and review profile are shown, their currency, and "Filtered for …" / "Offers for …") comes from the URL language when the visitor's trusted country has none of its own:

| Language | Editorial market |
| --- | --- |
| `en` | United Kingdom (GB) |
| `sv` | Sweden (SE) |
| `da` | Denmark (DK) |

A country keeps its own view when it has a market profile (`lib/market/registry.ts`) or an entry in the licence register's `MARKET_RULES` (GB, SE, DK, DE, IE, PE, CA, CA-ON, …), or when it prohibits offers (`OFFER_PRESENTATION_PROHIBITED_MARKETS`). Visitors from GB, SE, DK, DE and IE therefore see exactly what they saw before.

Partner buttons and `/r/` are unchanged. The action resolver grants a route only when the trusted jurisdiction is the country it is asked about (`authorityMatches` in `lib/commercial/public-commercial-action-resolver.ts`). A US visitor reading the UK view therefore gets reviews and terms, and no button. Every visitor from such a country, person or crawler, gets the same page, so this is not cloaking.

German is not mapped. German offers exist only inside the 21:00–06:00 Berlin advertising window, so a German editorial view would empty `/de/bonuses` by day and make its indexing flap. `/de` keeps today's view until the Founder decides how that window applies to crawlers.

The rule lives in `editorialPresentation` in `lib/market/editorial-market.ts`. The four page loaders apply it to the presentation they pass to the offer, discovery and casino services.

## Why

Googlebot, Bingbot and the ChatGPT, Claude and Perplexity crawlers fetch from the United States. On Production 952d0e0b they read the rest-of-world mix:
- `/en/best-offers` led with Inkabet (PEN 500), Betsson (SEK) and StarCasino (Italy);
- `/en/bonuses` said "Filtered for United States";
- the PlayOJO review showed the Swedish offer.

Google's index already held "Casino bonus comparison for US" titles and an NZ$ snippet. None of the UK, Swedish or Danish offers the pages exist for reached search or AI answers.

## Evidence

- `tests/internationalisation-market.test.ts` ("visitors from outside our markets read the URL language's market…") pins the mapping, the kept countries (GB, SE, IE, PE, CA, DE), prohibited AU, the German exclusion, the resolver's `authorityMatches` guard and the four loaders.
- A local run with no trusted country returned the following with a Googlebot UA:
  - `/en/bonuses`: `index, follow`, "Filtered for United Kingdom", £ offers, 0 `/r/` links;
  - `/sv/bonuses` and `/da/bonuses`: "Filtrerat för Sverige" and "Filtreret for Danmark";
  - `/de/bonuses`: unchanged.
