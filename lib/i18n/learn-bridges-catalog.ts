import type { SupportedLocale } from "@/lib/market/registry";

/** Copy for the bridges from Learn guides to the public comparison pages. */
export type LearnBridgeMessages = Readonly<{
  /** Closing bridge body in bonus guides (its title is `ui.applyChecklist`). */
  offerBridgeBody: string;
  /** Compact early line in bonus guides, beside the Bonuses and Best Offers links. */
  offerBridgeLead: string;
  /** Closing bridge title in casino-choice and payment guides. */
  casinoBridgeTitle: string;
  /** Closing bridge body in casino-choice and payment guides. */
  casinoBridgeBody: string;
  /** Compact early line in casino-choice and payment guides, beside the Casinos and Best Offers links. */
  casinoBridgeLead: string;
}>;

const baseMessages = {
  "en-GB": {
    offerBridgeBody: "Check what you just learned against current offers and their terms.",
    offerBridgeLead: "Compare current bonuses by their terms",
    casinoBridgeTitle: "Ready to compare casinos?",
    casinoBridgeBody: "Check what you just learned against the casinos we review and their terms.",
    casinoBridgeLead: "Compare the casinos we review by their terms",
  },
  "de-DE": {
    offerBridgeBody: "Prüfe das Gelernte an aktuellen Angeboten und ihren Bedingungen.",
    offerBridgeLead: "Aktuelle Boni nach ihren Bedingungen vergleichen",
    casinoBridgeTitle: "Bereit, Anbieter zu vergleichen?",
    casinoBridgeBody: "Prüfe das Gelernte an den Anbietern, die wir bewerten, und ihren Bedingungen.",
    casinoBridgeLead: "Die von uns bewerteten Anbieter nach ihren Bedingungen vergleichen",
  },
  "it-IT": {
    offerBridgeBody: "Metti alla prova ciò che hai imparato con le offerte attuali e i loro termini.",
    offerBridgeLead: "Confronta i bonus attuali in base ai loro termini",
    casinoBridgeTitle: "Pronto a confrontare i casinò?",
    casinoBridgeBody: "Metti alla prova ciò che hai imparato con i casinò che recensiamo e i loro termini.",
    casinoBridgeLead: "Confronta i casinò che recensiamo in base ai loro termini",
  },
  "es-ES": {
    offerBridgeBody: "Aplica lo que acabas de aprender a las ofertas actuales y sus condiciones.",
    offerBridgeLead: "Compara los bonos actuales por sus condiciones",
    casinoBridgeTitle: "¿Listo para comparar casinos?",
    casinoBridgeBody: "Aplica lo que acabas de aprender a los casinos que analizamos y a sus condiciones.",
    casinoBridgeLead: "Compara los casinos que analizamos por sus condiciones",
  },
  "pt-PT": {
    offerBridgeBody: "Aplica o que acabaste de aprender às ofertas atuais e aos seus termos.",
    offerBridgeLead: "Compara os bónus atuais pelos seus termos",
    casinoBridgeTitle: "Pronto para comparar casinos?",
    casinoBridgeBody: "Aplica o que acabaste de aprender aos casinos que analisamos e aos seus termos.",
    casinoBridgeLead: "Compara os casinos que analisamos pelos seus termos",
  },
  "el-GR": {
    offerBridgeBody: "Έλεγξε όσα έμαθες στις τρέχουσες προσφορές και τους όρους τους.",
    offerBridgeLead: "Σύγκρινε τα τρέχοντα μπόνους με βάση τους όρους τους",
    casinoBridgeTitle: "Έτοιμος να συγκρίνεις καζίνο;",
    casinoBridgeBody: "Έλεγξε όσα έμαθες στα καζίνο που αξιολογούμε και στους όρους τους.",
    casinoBridgeLead: "Σύγκρινε τα καζίνο που αξιολογούμε με βάση τους όρους τους",
  },
  "nl-NL": {
    offerBridgeBody: "Toets wat je net hebt geleerd aan actuele aanbiedingen en hun voorwaarden.",
    offerBridgeLead: "Vergelijk actuele bonussen op hun voorwaarden",
    casinoBridgeTitle: "Klaar om casino's te vergelijken?",
    casinoBridgeBody: "Toets wat je net hebt geleerd aan de casino's die we beoordelen en hun voorwaarden.",
    casinoBridgeLead: "Vergelijk de casino's die we beoordelen op hun voorwaarden",
  },
  "sv-SE": {
    offerBridgeBody: "Pröva det du just lärt dig mot aktuella erbjudanden och deras villkor.",
    offerBridgeLead: "Jämför aktuella bonusar utifrån deras villkor",
    casinoBridgeTitle: "Redo att jämföra casinon?",
    casinoBridgeBody: "Pröva det du just lärt dig mot de casinon vi granskar och deras villkor.",
    casinoBridgeLead: "Jämför de casinon vi granskar utifrån deras villkor",
  },
  "da-DK": {
    offerBridgeBody: "Afprøv det, du lige har lært, på aktuelle tilbud og deres vilkår.",
    offerBridgeLead: "Sammenlign aktuelle bonusser ud fra deres vilkår",
    casinoBridgeTitle: "Klar til at sammenligne kasinoer?",
    casinoBridgeBody: "Afprøv det, du lige har lært, på de kasinoer, vi anmelder, og deres vilkår.",
    casinoBridgeLead: "Sammenlign de kasinoer, vi anmelder, ud fra deres vilkår",
  },
  "fi-FI": {
    offerBridgeBody: "Vertaa juuri oppimaasi nykyisiin tarjouksiin ja niiden ehtoihin.",
    offerBridgeLead: "Vertaa nykyisiä bonuksia niiden ehtojen perusteella",
    casinoBridgeTitle: "Valmis vertailemaan kasinoita?",
    casinoBridgeBody: "Vertaa juuri oppimaasi arvioimiimme kasinoihin ja niiden ehtoihin.",
    casinoBridgeLead: "Vertaa arvioimiamme kasinoita niiden ehtojen perusteella",
  },
  "nb-NO": {
    offerBridgeBody: "Prøv det du nettopp har lært mot aktuelle tilbud og vilkårene deres.",
    offerBridgeLead: "Sammenlign aktuelle bonuser etter vilkårene deres",
    casinoBridgeTitle: "Klar til å sammenligne kasinoer?",
    casinoBridgeBody: "Prøv det du nettopp har lært mot kasinoene vi anmelder og vilkårene deres.",
    casinoBridgeLead: "Sammenlign kasinoene vi anmelder etter vilkårene deres",
  },
} as const satisfies Record<Exclude<SupportedLocale, "es-PE" | "en-CA" | "fr-CA">, LearnBridgeMessages>;

const messages: Record<SupportedLocale, LearnBridgeMessages> = {
  ...baseMessages,
  "es-PE": baseMessages["es-ES"],
  "en-CA": baseMessages["en-GB"],
  // The Learning Center presents English guides for fr-CA today; the bridge follows the guide's language.
  "fr-CA": baseMessages["en-GB"],
};

export function learnBridgeMessages(locale: SupportedLocale): LearnBridgeMessages {
  return messages[locale];
}
