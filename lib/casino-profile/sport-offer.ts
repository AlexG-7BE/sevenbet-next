import type { SupportedLanguage } from "@/lib/market/registry";

export type CasinoSportOfferFact = Readonly<{ label: string; value: string }>;

/**
 * The sports welcome offer of a brand that also runs a sportsbook, written natively for one
 * market. It is an alternative to the casino welcome offer, never an addition: the operator
 * gives a new customer one welcome offer, chosen at the first deposit.
 */
export type CasinoSportOffer = Readonly<{
  market: "SE" | "DK";
  kicker: string;
  heading: string;
  body: string;
  offer: string;
  facts: readonly CasinoSportOfferFact[];
  conditions: string;
  cta: string;
  /** The operator's own terms page for this offer. */
  termsUrl: string;
  /** Date the terms were read on the operator's own page, ISO `YYYY-MM-DD`. */
  checked: string;
  checkedLine: string;
}>;

/**
 * Sports offers on the Swedish and Danish reviews of Betsson and NordicBet (Founder, 15 October
 * 2026). They are the only partners in those markets with a sportsbook, and the partner
 * programme pays on sports and casino through the same route, so the block reuses the review's
 * own partner button. Terms were read on 15 October 2026 from the operators' campaign pages:
 * offers.betsson.com/sv/valkomstbonus-sport, offers.nordicbet.com/sv/betting-bonus,
 * tilbud.betsson.dk/freebet-velkomstbonus and tilbud.nordicbet.dk/betting-bonus.
 */
export const CASINO_SPORT_OFFERS = {
  sv: {
    betsson: {
      market: "SE",
      kicker: "Odds och sport",
      heading: "Spelar du hellre på sport?",
      body: "Betsson har också ett stort utbud av odds på fotboll, ishockey och de flesta andra sporter, både före match och live. Som ny kund får du bara ett välkomsterbjudande: casinobonusen ovan eller sportbonusen här. Du väljer vid första insättningen, och valet går inte att ändra efteråt.",
      offer: "250 kr gratisspel + 50 freespins",
      facts: [
        { label: "Minsta insättning", value: "250 kr" },
        { label: "Första spelet", value: "Minst 250 kr, ett val till odds 1,80 eller högre" },
        { label: "Vinst från gratisspelet", value: "Utan omsättningskrav" },
        { label: "Freespins", value: "Pirots 5, vinsterna omsätts 35 gånger" },
        { label: "Giltighet", value: "60 dagar" },
      ],
      conditions: "Gäller nya kunder som registrerat sig efter 30 september 2026. Gratisspelet gäller inte trav, och varken det första spelet eller gratisspelet får läggas på oddsboostar. Du får inte heller använda cashout på det första spelet. Bara nettovinsten från gratisspelet betalas ut.",
      cta: "TILL BETSSON",
      termsUrl: "https://offers.betsson.com/sv/valkomstbonus-sport",
      checked: "2026-10-15",
      checkedLine: "Villkoren kontrollerades hos Betsson den 15 oktober 2026",
    },
    nordicbet: {
      market: "SE",
      kicker: "Odds och sport",
      heading: "Spelar du hellre på sport?",
      body: "NordicBet är i första hand ett oddsbolag, med fotboll, ishockey och de flesta andra sporter före match och live. Du får bara ett välkomsterbjudande som ny kund, så det är antingen casinobonusen ovan eller sportbonusen här. Valet gör du vid första insättningen och det kan inte bytas i efterhand.",
      offer: "100 kr gratisspel + 50 freespins",
      facts: [
        { label: "Minsta insättning", value: "100 kr" },
        { label: "Första spelet", value: "Minst 100 kr, ett val till odds 1,80 eller högre" },
        { label: "Vinst från gratisspelet", value: "Utan omsättningskrav" },
        { label: "Freespins", value: "Pirots 4, vinsterna omsätts 35 gånger" },
        { label: "Giltighet", value: "60 dagar" },
      ],
      conditions: "Gäller nya kunder som registrerat sig efter 20 oktober 2025. Gratisspelet gäller inte trav, och varken det första spelet eller gratisspelet får läggas på oddsboostar. Cashout är inte heller tillåtet på det första spelet. Bara nettovinsten från gratisspelet betalas ut.",
      cta: "TILL NORDICBET",
      termsUrl: "https://offers.nordicbet.com/sv/betting-bonus",
      checked: "2026-10-15",
      checkedLine: "Villkoren kontrollerades hos NordicBet den 15 oktober 2026",
    },
  },
  da: {
    betsson: {
      market: "DK",
      kicker: "Odds og sport",
      heading: "Spiller du hellere på sport?",
      body: "Betsson har også et stort udvalg af odds på fodbold, håndbold og de fleste andre sportsgrene, både før kampen og live. Som ny kunde kan du kun få én velkomstbonus: enten casinobonussen ovenfor eller freebettet her.",
      offer: "250 kr. freebet",
      facts: [
        { label: "Første spil", value: "Mindst 250 kr. og ét valg til odds 1,80 eller højere" },
        { label: "Gevinst fra freebettet", value: "Uden omsætningskrav" },
        { label: "Freebettet gælder", value: "Al sport, før kampen og live" },
        { label: "Gyldighed", value: "60 dage" },
      ],
      conditions: "Kun for nye kunder over 21 år, registreret efter 13. april 2026. Du får freebettet, når dit første spil er afgjort, og det kan ikke bruges på systemkuponer. Kun gevinsten udbetales; indsatsen fra freebettet får du ikke tilbage.",
      cta: "TIL BETSSON",
      termsUrl: "https://tilbud.betsson.dk/freebet-velkomstbonus",
      checked: "2026-10-15",
      checkedLine: "Vilkårene blev tjekket hos Betsson 15. oktober 2026",
    },
    nordicbet: {
      market: "DK",
      kicker: "Odds og sport",
      heading: "Spiller du hellere på sport?",
      body: "NordicBet er først og fremmest en bookmaker, med odds på fodbold, håndbold og de fleste andre sportsgrene før kampen og live. Du får kun én velkomstbonus som ny kunde, så du vælger mellem casinobonussen ovenfor og freebettet her.",
      offer: "500 kr. freebet",
      facts: [
        { label: "Første spil", value: "Mindst 500 kr. og ét valg til odds 1,80 eller højere" },
        { label: "Gevinst fra freebettet", value: "Uden omsætningskrav" },
        { label: "Freebettet gælder", value: "Al sport, før kampen og live" },
        { label: "Gyldighed", value: "60 dage" },
      ],
      conditions: "Kun for nye kunder over 21 år. Du får freebettet, når dit første spil er afgjort, og det kan ikke bruges på systemkuponer. Kun gevinsten udbetales; indsatsen fra freebettet får du ikke tilbage.",
      cta: "TIL NORDICBET",
      termsUrl: "https://tilbud.nordicbet.dk/betting-bonus",
      checked: "2026-10-15",
      checkedLine: "Vilkårene blev tjekket hos NordicBet 15. oktober 2026",
    },
  },
} as const satisfies Partial<Record<SupportedLanguage, Readonly<Record<string, CasinoSportOffer>>>>;

/**
 * The sports offer for this review, or null. It needs the language's own market as well as the
 * language, so a visitor reading Swedish from outside Sweden never sees it; the caller also
 * requires the review's partner button, which only a visitor in an open market gets.
 */
export function casinoSportOffer(slug: string, language: SupportedLanguage, marketCountryCode: string | null): CasinoSportOffer | null {
  const offers = (CASINO_SPORT_OFFERS as Partial<Record<SupportedLanguage, Readonly<Record<string, CasinoSportOffer>>>>)[language];
  const offer = offers?.[slug];
  return offer && offer.market === marketCountryCode ? offer : null;
}
