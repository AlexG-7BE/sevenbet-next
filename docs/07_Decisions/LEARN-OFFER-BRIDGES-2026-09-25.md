# Learn offer bridges

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 25 September 2026 (remaining-pages mobile audit, package C)

**Amends:** [Learn next steps](LEARN-NEXT-STEPS-2026-09-25.md) for bonus, casino-choice and payment guides, the Learn hub's "Start here" and the Bonus Guide's "Read next".

## Decision

- **Bonus guides (`casino-bonuses`):** keep the closing "Ready to apply the checklist?" bridge. They also get a light, one-line bridge before the first section heading after the introduction (about the second phone screen): "Compare current bonuses by their terms", links to Bonuses and Best Offers, and the commercial disclosure at 12px.
- **Casino-choice (`casino-safety`) and payment (`payments`) guides:** get the same pair of bridges:
  - an early line, "Compare the casinos we review by their terms";
  - a closing "Ready to compare casinos?" bridge.

  Both link to Casinos and Best Offers and carry the commercial disclosure. As in bonus guides, the offer bridges replace the mid-guide Programme block. The closing Programme block stays.
- **Gate:** every offer bridge renders only where `offersMayBePresented` allows published offers for the reader's market. Otherwise the guide keeps its mid-guide Programme block and shows no offer links. The links go to our own pages, never to partner routes. The copy is localised for every locale; German uses "Anbieter", not "Casino".
- **Learn hub, "Start here":** shows the newest published guide of each topic, in this order:
  1. bonuses (`casino-bonuses`);
  2. casinos (`casino-safety`);
  3. banking (`payments`);
  4. responsible play (`responsible-gambling`).

  A topic with no guide takes the newest remaining guide in its place.
- **Learn hub, "All guides":** lists every other published guide once, so the server HTML contains each guide exactly once. The Programme card still appears after the sixth guide and at the end.
- **Learn hub, filtering:** when a topic filter or search is active, a copy of each matching "Start here" guide joins the filtered list, so results stay complete. The layout above the filters does not change. The guide count covers both sections.
- **Bonus Guide, "Read next":** shows up to three real published English guides, in this order of preference:
  1. bonus guides;
  2. payment guides;
  3. any other guide that is not protected.

  Each card shows the guide's real title, category and reading time, in dark ink on the cream card. With no eligible guides, the row is not rendered. The three captured cards named guides that do not exist and are gone.
- **Phones:** the fixed header hides while the reader scrolls down on the Learn hub, guide pages and the Bonus Guide, as on the offer and casino pages.
- **Guide first screen:**
  - The category label above the title, which repeated the breadcrumb, is removed. The admin draft-preview label stays.
  - The breadcrumb arrow sits on the text baseline.

## Unchanged

- Protected guides (`responsible-gambling`) get no offer bridge and no mid-guide Programme block. They keep their neutral support route to Responsible Gambling and Help. In "Start here", the responsible-play card links only to its guide.
- Protected Help stays commercial-free.
- No Programme, pause or Help data selects or orders any link. Selection uses only the category and publication date.
- The desktop homepage, guide content, rankings and outbound partner actions are unchanged.
- No text is smaller than 12px.

## Evidence

- `tests/learning-center-parity.test.ts` (in `ci:structural` and `public-ia:test`) covers:
  - which categories get offer bridges and that protected guides never do;
  - the early bridge sitting before the first heading, and the closing bridge;
  - the Bonuses or Casinos links, the Best Offers link and the disclosure in both bridges;
  - the offer-presentation gate, with the Programme block returning without it;
  - complete copy in every locale, and no "Casino" wording in German;
  - the Start here composition and its fallback;
  - no guide repeated across the two hub sections;
  - the filter covering the Start here guides;
  - the removed kicker, the breadcrumb alignment and the header opt-ins;
  - the Bonus Guide's real "Read next" data, and no captured fake titles.
- `tests/bonus-guide-parity.test.ts` (now in `public-ia:test`) covers the Bonus Guide's document order with real "Read next" cards, their dark ink, and removing the row when there are no guides.
