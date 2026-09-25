import type { SupportedLocale } from "@/lib/market/registry";

/** Copy for the page a refused casino click lands on. `{casino}` is the casino's public name. */
export type OutboundRecoveryMessages = Readonly<{
  eyebrow: string;
  title: string;
  bodyCasino: string;
  bodyGeneric: string;
  backToReview: string;
  bestOffers: string;
}>;

const baseMessages = {
  "en-GB": { eyebrow: "Casino link", title: "This link isn't available right now.", bodyCasino: "We couldn't open {casino} from here. You're still on B4GAMBLE, and nothing was sent to the casino.", bodyGeneric: "We couldn't open this casino from here. You're still on B4GAMBLE, and nothing was sent to the casino.", backToReview: "Back to the {casino} review", bestOffers: "See offers available to you" },
  "de-DE": { eyebrow: "Casino-Link", title: "Dieser Link ist gerade nicht verfügbar.", bodyCasino: "Wir konnten {casino} von hier aus nicht öffnen. Du bist weiter auf B4GAMBLE, und an das Casino wurde nichts gesendet.", bodyGeneric: "Wir konnten dieses Casino von hier aus nicht öffnen. Du bist weiter auf B4GAMBLE, und an das Casino wurde nichts gesendet.", backToReview: "Zurück zur Bewertung von {casino}", bestOffers: "Für dich verfügbare Angebote ansehen" },
  "it-IT": { eyebrow: "Link del casinò", title: "Questo link non è disponibile al momento.", bodyCasino: "Non siamo riusciti ad aprire {casino} da qui. Sei ancora su B4GAMBLE e al casinò non è stato inviato nulla.", bodyGeneric: "Non siamo riusciti ad aprire questo casinò da qui. Sei ancora su B4GAMBLE e al casinò non è stato inviato nulla.", backToReview: "Torna alla recensione di {casino}", bestOffers: "Vedi le offerte disponibili per te" },
  "es-ES": { eyebrow: "Enlace del casino", title: "Este enlace no está disponible ahora mismo.", bodyCasino: "No hemos podido abrir {casino} desde aquí. Sigues en B4GAMBLE y no se ha enviado nada al casino.", bodyGeneric: "No hemos podido abrir este casino desde aquí. Sigues en B4GAMBLE y no se ha enviado nada al casino.", backToReview: "Volver a la reseña de {casino}", bestOffers: "Ver las ofertas disponibles para ti" },
  "pt-PT": { eyebrow: "Link do casino", title: "Este link não está disponível de momento.", bodyCasino: "Não conseguimos abrir {casino} a partir daqui. Continuas no B4GAMBLE e nada foi enviado ao casino.", bodyGeneric: "Não conseguimos abrir este casino a partir daqui. Continuas no B4GAMBLE e nada foi enviado ao casino.", backToReview: "Voltar à análise de {casino}", bestOffers: "Ver as ofertas disponíveis para ti" },
  "el-GR": { eyebrow: "Σύνδεσμος καζίνο", title: "Αυτός ο σύνδεσμος δεν είναι διαθέσιμος αυτή τη στιγμή.", bodyCasino: "Δεν μπορέσαμε να ανοίξουμε το {casino} από εδώ. Είσαι ακόμη στο B4GAMBLE και δεν στάλθηκε τίποτα στο καζίνο.", bodyGeneric: "Δεν μπορέσαμε να ανοίξουμε αυτό το καζίνο από εδώ. Είσαι ακόμη στο B4GAMBLE και δεν στάλθηκε τίποτα στο καζίνο.", backToReview: "Πίσω στην αξιολόγηση του {casino}", bestOffers: "Δες τις προσφορές που είναι διαθέσιμες για σένα" },
  "nl-NL": { eyebrow: "Casinolink", title: "Deze link is nu niet beschikbaar.", bodyCasino: "We konden {casino} hiervandaan niet openen. Je bent nog op B4GAMBLE en er is niets naar het casino gestuurd.", bodyGeneric: "We konden dit casino hiervandaan niet openen. Je bent nog op B4GAMBLE en er is niets naar het casino gestuurd.", backToReview: "Terug naar de review van {casino}", bestOffers: "Bekijk de aanbiedingen die voor jou beschikbaar zijn" },
  "sv-SE": { eyebrow: "Casinolänk", title: "Den här länken är inte tillgänglig just nu.", bodyCasino: "Vi kunde inte öppna {casino} härifrån. Du är kvar på B4GAMBLE och inget skickades till casinot.", bodyGeneric: "Vi kunde inte öppna det här casinot härifrån. Du är kvar på B4GAMBLE och inget skickades till casinot.", backToReview: "Tillbaka till recensionen av {casino}", bestOffers: "Se erbjudanden som är tillgängliga för dig" },
  "da-DK": { eyebrow: "Kasinolink", title: "Dette link er ikke tilgængeligt lige nu.", bodyCasino: "Vi kunne ikke åbne {casino} herfra. Du er stadig på B4GAMBLE, og der blev ikke sendt noget til kasinoet.", bodyGeneric: "Vi kunne ikke åbne dette kasino herfra. Du er stadig på B4GAMBLE, og der blev ikke sendt noget til kasinoet.", backToReview: "Tilbage til anmeldelsen af {casino}", bestOffers: "Se de tilbud, der er tilgængelige for dig" },
  "fi-FI": { eyebrow: "Kasinolinkki", title: "Tämä linkki ei ole juuri nyt käytettävissä.", bodyCasino: "Emme voineet avata kohdetta {casino} täältä. Olet yhä B4GAMBLEssa, eikä kasinolle lähetetty mitään.", bodyGeneric: "Emme voineet avata tätä kasinoa täältä. Olet yhä B4GAMBLEssa, eikä kasinolle lähetetty mitään.", backToReview: "Takaisin arvosteluun: {casino}", bestOffers: "Katso sinulle saatavilla olevat tarjoukset" },
  "nb-NO": { eyebrow: "Kasinolenke", title: "Denne lenken er ikke tilgjengelig akkurat nå.", bodyCasino: "Vi kunne ikke åpne {casino} herfra. Du er fortsatt på B4GAMBLE, og ingenting ble sendt til kasinoet.", bodyGeneric: "Vi kunne ikke åpne dette kasinoet herfra. Du er fortsatt på B4GAMBLE, og ingenting ble sendt til kasinoet.", backToReview: "Tilbake til anmeldelsen av {casino}", bestOffers: "Se tilbudene som er tilgjengelige for deg" },
  "fr-CA": { eyebrow: "Lien du casino", title: "Ce lien n'est pas disponible pour le moment.", bodyCasino: "Nous n'avons pas pu ouvrir {casino} d'ici. Vous êtes toujours sur B4GAMBLE et rien n'a été envoyé au casino.", bodyGeneric: "Nous n'avons pas pu ouvrir ce casino d'ici. Vous êtes toujours sur B4GAMBLE et rien n'a été envoyé au casino.", backToReview: "Retour à l'avis sur {casino}", bestOffers: "Voir les offres qui vous sont accessibles" },
} as const satisfies Record<Exclude<SupportedLocale, "es-PE" | "en-CA">, OutboundRecoveryMessages>;

const messages: Record<SupportedLocale, OutboundRecoveryMessages> = {
  ...baseMessages,
  "es-PE": baseMessages["es-ES"],
  "en-CA": baseMessages["en-GB"],
};

export function outboundRecoveryMessages(locale: SupportedLocale): OutboundRecoveryMessages {
  return messages[locale];
}

export function withCasinoName(template: string, casino: string) {
  return template.replace("{casino}", casino);
}
