# A country filter above the offer lists

**Status:** ACCEPTED. Implemented in the pull request that adds this record (branch
`feat/offer-country-filter`). It is live only after that pull request is merged and deployed;
[CURRENT_STATE](../CURRENT_STATE.md) records it as live once observed.

**Decision authority:** Founder decision, 21 October 2026 (chat):

- the request: "я хочу что бы ты сделал фильтрацию по стране на b4gamble, то есть если у нас
  появится много новых офферов из разных стран, что бы пользователю было удобно выбрать именно
  свою";
- where: "Только над списками" — on Casinos, Bonuses and Best Offers, not in the header or menu;
  the casino review follows the choice;
- search: "Страницы стран не нужны" — no country addresses for Google;
- who may switch: "Всем без исключений" — every visitor, including visitors from markets that
  require a local licence and German visitors outside the advertising window.

## What the filter does

Above the list on `/casinos`, `/bonuses` and `/best-offers` a control reads, for example, "Offers
for: Sweden ▾". It opens the phone's own picker with every country whose own offers the lists can
show right now, named in the page language. Picking one shows that country's casinos and offers;
picking the country shown by default goes back and forgets the choice.

The choice is kept in a first-party `b4g_offer_country` cookie for up to six months, so the
casino review (`/casino/<slug>`) shows the offer for the same country. Nothing is stored on the
server and no column or table is added.

A country is in the list when at least one published offer names it — a market offer for that
country or a global offer whose allow-list includes it — and the licence register
([RFC-054](../06_RFC/RFC-054-Licence-Market-Access.md), `lib/market-access`) currently lets the lists show that casino
there. A country whose offers are all closed (no local licence, outside the German advertising
window, advertising prohibited) is left out; it returns by itself when its offers open again. New
countries appear as soon as their offers are published.

## Partner buttons do not move

The choice changes only which country the lists describe, exactly as the language fallback in
`lib/market/editorial-market.ts` does. The jurisdiction resolver never sees it. A partner button
still appears only where the action resolver's existing rule holds — the trusted request country
is the country it is asked about — so a list shown for another country has no buttons. The control
then says "Casino links work only from this country.", and the casino review says the same where
its button would be.

## Who gets the filter

Every visitor whose own country and whose default view both permit offers. A visitor from a
country in `OFFER_PRESENTATION_PROHIBITED_MARKETS` keeps the withheld pages and gets no filter,
because those pages show no offers at all; that list is unchanged. Without a known country, or
with only one country to show, there is nothing to choose and no control.

## Risk the Founder accepted

Asked on 21 October 2026, the Founder chose "Всем без исключений" over keeping the register's view
for visitors from licence markets. A visitor in the United Kingdom, Sweden, Denmark, Germany or
another licence market can therefore see the offers of casinos that hold no licence there, without
a button. A regulator or a licensed partner (Betsson, Entain, Kindred) may read that as presenting
unlicensed gambling to its residents; German visitors can also do so between 06:00 and 21:00.
The register itself, its closures and the German window for German offers are unchanged.

## What this supersedes

Per [GOVERNANCE](../GOVERNANCE.md), this newer Founder decision supersedes older internal language
where it conflicts:

- **[RFC-039](../06_RFC/RFC-039-Language-Only-Public-Routing-and-Global-Casino-Catalog.md)**
  (`ACTIVE`) said "there is no public country/market control" and that a cookie cannot select a
  market. For the offer lists and the casino review, a visitor-chosen country now selects the
  editorial view. It still grants no commercial, referral or route authority, and the public URL
  still expresses language only. RFC-039 carries a dated note.
- The 3 September release record's "must not re-enable a legacy country selector" is read the same
  way: the old selector granted market authority; this one does not.
- [NON-MARKET-EDITORIAL-FALLBACK-2026-09-27](NON-MARKET-EDITORIAL-FALLBACK-2026-09-27.md) stands:
  without a choice, the language fallback is unchanged, and crawlers, which carry no cookie, see
  exactly what they saw before.

## What does not change

- Partner buttons, `/r/` redirects, the jurisdiction resolver and the licence register.
- Indexing, canonical addresses, hreflang and the sitemap: there are no country pages.
- The Programme and the help pages: neither shows the filter or reads the cookie.
- Prohibited markets: no filter, no offers.

## Implementation

- `lib/public-offer/offer-country.ts` — the country list (`openOfferCountries`) and the view
  (`withOfferCountryChoice`).
- `lib/public-offer/offer-country.server.ts` — `resolveServerOfferPresentation()`, used by the four
  pages in place of `editorialPresentation(...)`.
- `lib/repositories/public-offer.repository.ts` — `listOfferMarkets()`, a 60-second cached
  projection of every published offer's named countries.
- `components/commercial/OfferCountrySelect.tsx` — the control; analytics placement
  `<SURFACE>_COUNTRY_<CC>` on the existing `commercial_view_selected` event.
- Copy in every public language in `lib/commercial/commercial-ux-messages.ts`; the cookie in the
  privacy notice.
- Tests: `tests/offer-country.test.ts` (in `casino-market:test`).
