import type { SupportedLocale } from "@/lib/market/registry";

/** Copy for the bridge from bonus education to the public offer pages. */
export type LearnBridgeMessages = Readonly<{
  offerBridgeBody: string;
}>;

const baseMessages = {
  "en-GB": { offerBridgeBody: "Check what you just learned against current offers and their terms." },
  "de-DE": { offerBridgeBody: "Prüfe das Gelernte an aktuellen Angeboten und ihren Bedingungen." },
  "it-IT": { offerBridgeBody: "Metti alla prova ciò che hai imparato con le offerte attuali e i loro termini." },
  "es-ES": { offerBridgeBody: "Aplica lo que acabas de aprender a las ofertas actuales y sus condiciones." },
  "pt-PT": { offerBridgeBody: "Aplica o que acabaste de aprender às ofertas atuais e aos seus termos." },
  "el-GR": { offerBridgeBody: "Έλεγξε όσα έμαθες στις τρέχουσες προσφορές και τους όρους τους." },
  "nl-NL": { offerBridgeBody: "Toets wat je net hebt geleerd aan actuele aanbiedingen en hun voorwaarden." },
  "sv-SE": { offerBridgeBody: "Pröva det du just lärt dig mot aktuella erbjudanden och deras villkor." },
  "da-DK": { offerBridgeBody: "Afprøv det, du lige har lært, på aktuelle tilbud og deres vilkår." },
  "fi-FI": { offerBridgeBody: "Vertaa juuri oppimaasi nykyisiin tarjouksiin ja niiden ehtoihin." },
  "nb-NO": { offerBridgeBody: "Prøv det du nettopp har lært mot aktuelle tilbud og vilkårene deres." },
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
