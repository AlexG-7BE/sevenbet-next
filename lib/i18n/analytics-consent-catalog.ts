import type { SupportedLocale } from "@/lib/market/registry";

export type AnalyticsConsentMessages = Readonly<{
  trigger: string;
  dialogLabel: string;
  title: string;
  body: string;
  /** The exclusion statement GB-PECR-ANALYTICS-DECISION requires the choice itself to show. */
  detail: string;
  privacyNotice: string;
  allow: string;
  decline: string;
  notNow: string;
  error: string;
}>;

const baseMessages = {
  "en-GB": {
    trigger: "Cookie settings",
    dialogLabel: "Cookie settings",
    title: "Your cookie choice",
    body: "We use our own cookies to see how B4GAMBLE is used.",
    detail: "Never your email, Programme answers or partner tokens.",
    privacyNotice: "Privacy notice",
    allow: "Accept cookies",
    decline: "Reject cookies",
    notNow: "Not now",
    error: "Your choice could not be saved. Please try again.",
  },
  "de-DE": {
    trigger: "Cookie-Einstellungen",
    dialogLabel: "Cookie-Einstellungen",
    title: "Deine Cookie-Auswahl",
    body: "Wir nutzen eigene Cookies, um zu sehen, wie B4GAMBLE genutzt wird.",
    detail: "Nie deine E-Mail, Programm-Antworten oder Partner-Tokens.",
    privacyNotice: "Datenschutzhinweis",
    allow: "Cookies akzeptieren",
    decline: "Cookies ablehnen",
    notNow: "Nicht jetzt",
    error: "Deine Auswahl konnte nicht gespeichert werden. Bitte versuche es erneut.",
  },
  "it-IT": {
    trigger: "Impostazioni cookie",
    dialogLabel: "Impostazioni cookie",
    title: "La tua scelta sui cookie",
    body: "Usiamo cookie nostri per vedere come viene usato B4GAMBLE.",
    detail: "Mai la tua email, le risposte del Programma o i token dei partner.",
    privacyNotice: "Informativa sulla privacy",
    allow: "Accetta i cookie",
    decline: "Rifiuta i cookie",
    notNow: "Non ora",
    error: "Non è stato possibile salvare la tua scelta. Riprova.",
  },
  "es-ES": {
    trigger: "Configuración de cookies",
    dialogLabel: "Configuración de cookies",
    title: "Tu elección de cookies",
    body: "Usamos cookies propias para ver cómo se usa B4GAMBLE.",
    detail: "Nunca tu correo, tus respuestas del Programa ni tokens de socios.",
    privacyNotice: "Aviso de privacidad",
    allow: "Aceptar cookies",
    decline: "Rechazar cookies",
    notNow: "Ahora no",
    error: "No se pudo guardar tu elección. Inténtalo de nuevo.",
  },
  "pt-PT": {
    trigger: "Definições de cookies",
    dialogLabel: "Definições de cookies",
    title: "A tua escolha de cookies",
    body: "Usamos cookies próprios para ver como o B4GAMBLE é usado.",
    detail: "Nunca o teu email, as respostas do Programa ou tokens de parceiros.",
    privacyNotice: "Aviso de privacidade",
    allow: "Aceitar cookies",
    decline: "Rejeitar cookies",
    notNow: "Agora não",
    error: "Não foi possível guardar a tua escolha. Tenta novamente.",
  },
  "el-GR": {
    trigger: "Ρυθμίσεις cookies",
    dialogLabel: "Ρυθμίσεις cookies",
    title: "Η επιλογή σου για τα cookies",
    body: "Χρησιμοποιούμε δικά μας cookies για να βλέπουμε πώς χρησιμοποιείται το B4GAMBLE.",
    detail: "Ποτέ το email σου, απαντήσεις του Προγράμματος ή tokens συνεργατών.",
    privacyNotice: "Δήλωση απορρήτου",
    allow: "Αποδοχή cookies",
    decline: "Απόρριψη cookies",
    notNow: "Όχι τώρα",
    error: "Δεν ήταν δυνατή η αποθήκευση της επιλογής σου. Δοκίμασε ξανά.",
  },
  "nl-NL": {
    trigger: "Cookie-instellingen",
    dialogLabel: "Cookie-instellingen",
    title: "Jouw cookiekeuze",
    body: "We gebruiken eigen cookies om te zien hoe B4GAMBLE wordt gebruikt.",
    detail: "Nooit je e-mail, Programma-antwoorden of partnertokens.",
    privacyNotice: "Privacyverklaring",
    allow: "Cookies accepteren",
    decline: "Cookies weigeren",
    notNow: "Niet nu",
    error: "Je keuze kon niet worden opgeslagen. Probeer het opnieuw.",
  },
  "sv-SE": {
    trigger: "Cookie-inställningar",
    dialogLabel: "Cookie-inställningar",
    title: "Ditt cookieval",
    body: "Vi använder egna cookies för att se hur B4GAMBLE används.",
    detail: "Aldrig din e-post, dina svar i Programmet eller partnertoken.",
    privacyNotice: "Integritetsmeddelande",
    allow: "Acceptera cookies",
    decline: "Avvisa cookies",
    notNow: "Inte nu",
    error: "Ditt val kunde inte sparas. Försök igen.",
  },
  "da-DK": {
    trigger: "Cookieindstillinger",
    dialogLabel: "Cookieindstillinger",
    title: "Dit cookievalg",
    body: "Vi bruger vores egne cookies til at se, hvordan B4GAMBLE bruges.",
    detail: "Aldrig din e-mail, dine svar i Programmet eller partnertokens.",
    privacyNotice: "Privatlivspolitik",
    allow: "Accepter cookies",
    decline: "Afvis cookies",
    notNow: "Ikke nu",
    error: "Dit valg kunne ikke gemmes. Prøv igen.",
  },
  "fi-FI": {
    trigger: "Evästeasetukset",
    dialogLabel: "Evästeasetukset",
    title: "Evästevalintasi",
    body: "Käytämme omia evästeitä nähdäksemme, miten B4GAMBLEa käytetään.",
    detail: "Ei koskaan sähköpostiasi, Ohjelman vastauksiasi tai kumppanien tunnisteita.",
    privacyNotice: "Tietosuojaseloste",
    allow: "Hyväksy evästeet",
    decline: "Hylkää evästeet",
    notNow: "Ei nyt",
    error: "Valintaasi ei voitu tallentaa. Yritä uudelleen.",
  },
  "nb-NO": {
    trigger: "Cookie-innstillinger",
    dialogLabel: "Cookie-innstillinger",
    title: "Ditt cookie-valg",
    body: "Vi bruker egne cookies for å se hvordan B4GAMBLE brukes.",
    detail: "Aldri e-posten din, svarene dine i Programmet eller partnertokener.",
    privacyNotice: "Personvernerklæring",
    allow: "Godta cookies",
    decline: "Avvis cookies",
    notNow: "Ikke nå",
    error: "Valget ditt kunne ikke lagres. Prøv igjen.",
  },
  "fr-CA": {
    trigger: "Paramètres des témoins",
    dialogLabel: "Paramètres des témoins",
    title: "Votre choix de témoins",
    body: "Nous utilisons nos propres témoins pour voir comment B4GAMBLE est utilisé.",
    detail: "Jamais votre courriel, vos réponses au Programme ni les jetons des partenaires.",
    privacyNotice: "Avis de confidentialité",
    allow: "Accepter les témoins",
    decline: "Refuser les témoins",
    notNow: "Pas maintenant",
    error: "Votre choix n'a pas pu être enregistré. Veuillez réessayer.",
  },
} as const satisfies Record<Exclude<SupportedLocale, "es-PE" | "en-CA">, AnalyticsConsentMessages>;

const messages: Record<SupportedLocale, AnalyticsConsentMessages> = {
  ...baseMessages,
  "es-PE": baseMessages["es-ES"],
  "en-CA": baseMessages["en-GB"],
};

export function analyticsConsentMessages(locale: SupportedLocale): AnalyticsConsentMessages {
  return messages[locale];
}
