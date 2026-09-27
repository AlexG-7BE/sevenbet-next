# Swedish, Danish and German offer terms

**Status:** ACCEPTED — implementation **PROPOSED — NOT YET LIVE** until merged and deployed.

**Decision authority:** explicit Founder decision, 27 September 2026 (launch eve for GB/SE/DK/DE). Asked in chat:

> «Переводить ли на шведский, датский и немецкий сами условия офферов (вейджер, требования, депозит)… машинный перевод условий может исказить важную деталь, цифры при этом сохраняются как есть. Если скажешь «да», сделаю отдельным PR.»

("Should the offer terms themselves — wagering, requirements, deposit — be translated into Swedish, Danish and German? A machine translation of terms may distort an important detail; the numbers stay exactly as they are. If you say yes, I will do it as a separate PR.")

The Founder answered: **«да, давай переведём»** ("yes, let's translate them").

The decision was taken with the risk stated in the question: a machine translation may distort a detail of the terms.

## Relation to RFC-037

RFC-037 says: "Operator-owned names, legal entities, licence identifiers and exact offer terms are not machine-translated as facts." This decision **narrows that rule for `sv`, `da` and `de` pages**. Offer terms published in English may be shown translated there. Everything else in the rule is unchanged:

- operator-owned names, legal entities and licence identifiers are not translated;
- every other language keeps offer terms as published;
- the operator's linked terms remain the authoritative source.

It extends [REVIEW-TRANSLATIONS-SV-DA-DE-2026-09-27](REVIEW-TRANSLATIONS-SV-DA-DE-2026-09-27.md), which translated casino editorial text only and kept offer terms as published.

## Decision

**Translated on sv/da/de pages.** Offer titles, summaries, wagering text, eligibility and conditions written in English. They are translated through the same exact-English-source catalog (`lib/i18n/casino-editorial-translations/offers.ts`), everywhere a reader meets them:

- the profile's bonuses, selected offer and restriction line;
- the offer headline fallback;
- the casino directory cards' featured offer;
- the Bonuses and Best Offers records;
- the profile FAQ answers that quote an offer term.

**Kept exactly as published:**
- Numbers, currencies and amounts. The tests require every translation to carry the same numbers as its source: "SEK 1,000" stays "SEK 1,000".
- Game titles, brand and operator names.
- Offer text already written in another language, such as Danish or German market terms and Spanish, Portuguese or Italian offers.
- Any English term the catalog does not know. A later edit to the English therefore shows in English rather than behind a stale translation.
- The operator's terms link.

**Best Offers ranking does not change with the page language.** The severe-restriction signal reads English wording. A translated offer record therefore carries `sourceSevereRestrictionCount`, read from its English terms. Every category ranks the same offers in the same order in every language. The catalog is server-only and never enters the browser bundle, where that ranking runs.

**German** follows `lib/i18n/german-terminology.ts`. German offer text never uses generic Casino wording and never names jackpots, live games, game shows or table games. "Casino welcome offer", for example, becomes "Willkommensangebot".

**Structured data.** A translated profile emits `FAQPage`, marked with `inLanguage`, only when every question and answer reads in the page language. It then carries exactly the visible text. An FAQ answer quoting an uncatalogued English term keeps `FAQPage` off.

**Source.** Production's `/api/public/casinos?limit=100` and `/api/public/bonuses?limit=100`, read with `Accept-Language: en` on 27 September 2026. These APIs now answer in the negotiated language. That read matched the earlier catalog source byte for byte: 92 English offer strings, 133 offer strings in all. The other 41 are already in a market language or are proper names such as "The Big Draw".

## Known gaps (INFERRED)

- Market-only offers that the global projection does not show are not catalogued and stay as published. The source was read from Kazakhstan. A market-exit read of the same API can add them.
- Danish, German, Spanish, Portuguese and Italian offer text is not cross-translated.

## Evidence

`tests/casino-editorial-translations.test.ts` runs in `npm run internationalisation:test`, part of `ci:quality`. It checks:

- catalog completeness and number preservation for every offer entry;
- the German terminology guard, plus a check that no German text names live games or game shows;
- exact-source lookup, and that native market text is never re-translated;
- that the services translate offer terms for sv/da/de, keep amounts and currencies, and leave English untouched;
- that every Best Offers category ranks identically in every language;
- that `FAQPage` is emitted only when every pair reads in the page language, identical to the visible FAQ;
- that a rendered sv/da/de profile shows no catalogued English offer term.
