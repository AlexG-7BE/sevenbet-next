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
    trigger: "Privacy choices",
    dialogLabel: "Analytics privacy choices",
    title: "Your privacy choices",
    body: "With your permission, first-party analytics show us how B4GAMBLE is used.",
    detail: "Never your email, Programme answers or partner tokens.",
    privacyNotice: "Privacy notice",
    allow: "Allow analytics",
    decline: "Decline analytics",
    notNow: "Not now",
    error: "Your choice could not be saved. Please try again.",
  },
  "de-DE": {
    trigger: "Datenschutz-Einstellungen",
    dialogLabel: "Datenschutz-Einstellungen für Analysen",
    title: "Deine Datenschutz-Einstellungen",
    body: "Mit deiner Erlaubnis zeigen uns eigene Analysen, wie B4GAMBLE genutzt wird.",
    detail: "Nie deine E-Mail, Programm-Antworten oder Partner-Tokens.",
    privacyNotice: "Datenschutzhinweis",
    allow: "Analysen erlauben",
    decline: "Analysen ablehnen",
    notNow: "Nicht jetzt",
    error: "Deine Auswahl konnte nicht gespeichert werden. Bitte versuche es erneut.",
  },
  "it-IT": {
    trigger: "Scelte sulla privacy",
    dialogLabel: "Scelte sulla privacy per le analisi",
    title: "Le tue scelte sulla privacy",
    body: "Con il tuo permesso, analisi proprietarie ci mostrano come viene usato B4GAMBLE.",
    detail: "Mai la tua email, le risposte del Programma o i token dei partner.",
    privacyNotice: "Informativa sulla privacy",
    allow: "Consenti analisi",
    decline: "Rifiuta analisi",
    notNow: "Non ora",
    error: "Non è stato possibile salvare la tua scelta. Riprova.",
  },
  "es-ES": {
    trigger: "Opciones de privacidad",
    dialogLabel: "Opciones de privacidad de analítica",
    title: "Tus opciones de privacidad",
    body: "Con tu permiso, la analítica propia nos muestra cómo se usa B4GAMBLE.",
    detail: "Nunca tu correo, tus respuestas del Programa ni tokens de socios.",
    privacyNotice: "Aviso de privacidad",
    allow: "Permitir analítica",
    decline: "Rechazar analítica",
    notNow: "Ahora no",
    error: "No se pudo guardar tu elección. Inténtalo de nuevo.",
  },
  "pt-PT": {
    trigger: "Escolhas de privacidade",
    dialogLabel: "Escolhas de privacidade de análise",
    title: "As tuas escolhas de privacidade",
    body: "Com a tua permissão, a análise própria mostra-nos como o B4GAMBLE é usado.",
    detail: "Nunca o teu email, as respostas do Programa ou tokens de parceiros.",
    privacyNotice: "Aviso de privacidade",
    allow: "Permitir análise",
    decline: "Recusar análise",
    notNow: "Agora não",
    error: "Não foi possível guardar a tua escolha. Tenta novamente.",
  },
  "el-GR": {
    trigger: "Επιλογές απορρήτου",
    dialogLabel: "Επιλογές απορρήτου για αναλύσεις",
    title: "Οι επιλογές απορρήτου σου",
    body: "Με την άδειά σου, δικές μας αναλύσεις μάς δείχνουν πώς χρησιμοποιείται το B4GAMBLE.",
    detail: "Ποτέ το email σου, απαντήσεις του Προγράμματος ή tokens συνεργατών.",
    privacyNotice: "Δήλωση απορρήτου",
    allow: "Αποδοχή αναλύσεων",
    decline: "Απόρριψη αναλύσεων",
    notNow: "Όχι τώρα",
    error: "Δεν ήταν δυνατή η αποθήκευση της επιλογής σου. Δοκίμασε ξανά.",
  },
  "nl-NL": {
    trigger: "Privacykeuzes",
    dialogLabel: "Privacykeuzes voor analyse",
    title: "Je privacykeuzes",
    body: "Met je toestemming laat eigen analyse ons zien hoe B4GAMBLE wordt gebruikt.",
    detail: "Nooit je e-mail, Programma-antwoorden of partnertokens.",
    privacyNotice: "Privacyverklaring",
    allow: "Analyse toestaan",
    decline: "Analyse weigeren",
    notNow: "Niet nu",
    error: "Je keuze kon niet worden opgeslagen. Probeer het opnieuw.",
  },
  "sv-SE": {
    trigger: "Integritetsval",
    dialogLabel: "Integritetsval för analys",
    title: "Dina integritetsval",
    body: "Med ditt tillstånd visar egen analys oss hur B4GAMBLE används.",
    detail: "Aldrig din e-post, dina svar i Programmet eller partnertoken.",
    privacyNotice: "Integritetsmeddelande",
    allow: "Tillåt analys",
    decline: "Avböj analys",
    notNow: "Inte nu",
    error: "Ditt val kunde inte sparas. Försök igen.",
  },
  "da-DK": {
    trigger: "Privatlivsvalg",
    dialogLabel: "Privatlivsvalg for analyse",
    title: "Dine privatlivsvalg",
    body: "Med din tilladelse viser egen analyse os, hvordan B4GAMBLE bruges.",
    detail: "Aldrig din e-mail, dine svar i Programmet eller partnertokens.",
    privacyNotice: "Privatlivspolitik",
    allow: "Tillad analyse",
    decline: "Afvis analyse",
    notNow: "Ikke nu",
    error: "Dit valg kunne ikke gemmes. Prøv igen.",
  },
  "fi-FI": {
    trigger: "Tietosuojavalinnat",
    dialogLabel: "Analytiikan tietosuojavalinnat",
    title: "Tietosuojavalintasi",
    body: "Luvallasi oma analytiikka näyttää meille, miten B4GAMBLEa käytetään.",
    detail: "Ei koskaan sähköpostiasi, Ohjelman vastauksiasi tai kumppanien tunnisteita.",
    privacyNotice: "Tietosuojaseloste",
    allow: "Salli analytiikka",
    decline: "Kiellä analytiikka",
    notNow: "Ei nyt",
    error: "Valintaasi ei voitu tallentaa. Yritä uudelleen.",
  },
  "nb-NO": {
    trigger: "Personvernvalg",
    dialogLabel: "Personvernvalg for analyse",
    title: "Dine personvernvalg",
    body: "Med din tillatelse viser egen analyse oss hvordan B4GAMBLE brukes.",
    detail: "Aldri e-posten din, svarene dine i Programmet eller partnertokener.",
    privacyNotice: "Personvernerklæring",
    allow: "Tillat analyse",
    decline: "Avslå analyse",
    notNow: "Ikke nå",
    error: "Valget ditt kunne ikke lagres. Prøv igjen.",
  },
  "fr-CA": {
    trigger: "Choix de confidentialité",
    dialogLabel: "Choix de confidentialité pour l'analyse",
    title: "Vos choix de confidentialité",
    body: "Avec votre permission, notre propre analyse nous montre comment B4GAMBLE est utilisé.",
    detail: "Jamais votre courriel, vos réponses au Programme ni les jetons des partenaires.",
    privacyNotice: "Avis de confidentialité",
    allow: "Autoriser l'analyse",
    decline: "Refuser l'analyse",
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
