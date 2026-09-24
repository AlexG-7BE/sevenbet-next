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
    body: "Essential storage keeps B4GAMBLE working. With your permission, first-party analytics show us how the site and Programme are used.",
    detail: "Analytics never include your email, Programme answers or partner tracking tokens.",
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
    body: "Notwendiger Speicher hält B4GAMBLE am Laufen. Mit deiner Erlaubnis zeigen uns eigene Analysen, wie Seite und Programm genutzt werden.",
    detail: "Analysen enthalten nie deine E-Mail, deine Programm-Antworten oder Partner-Tracking-Tokens.",
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
    body: "L'archiviazione essenziale fa funzionare B4GAMBLE. Con il tuo permesso, analisi proprietarie ci mostrano come vengono usati il sito e il Programma.",
    detail: "Le analisi non includono mai la tua email, le risposte del Programma o i token di tracciamento dei partner.",
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
    body: "El almacenamiento esencial mantiene B4GAMBLE en funcionamiento. Con tu permiso, la analítica propia nos muestra cómo se usan el sitio y el Programa.",
    detail: "La analítica nunca incluye tu correo, tus respuestas del Programa ni tokens de seguimiento de socios.",
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
    body: "O armazenamento essencial mantém o B4GAMBLE a funcionar. Com a tua permissão, a análise própria mostra-nos como o site e o Programa são usados.",
    detail: "A análise nunca inclui o teu email, as tuas respostas do Programa ou tokens de rastreio de parceiros.",
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
    body: "Η απαραίτητη αποθήκευση κρατά το B4GAMBLE σε λειτουργία. Με την άδειά σου, δικές μας αναλύσεις μάς δείχνουν πώς χρησιμοποιούνται ο ιστότοπος και το Πρόγραμμα.",
    detail: "Οι αναλύσεις δεν περιλαμβάνουν ποτέ το email σου, τις απαντήσεις σου στο Πρόγραμμα ή διακριτικά παρακολούθησης συνεργατών.",
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
    body: "Noodzakelijke opslag houdt B4GAMBLE werkend. Met je toestemming laat eigen analyse ons zien hoe de site en het Programma worden gebruikt.",
    detail: "Analyse bevat nooit je e-mail, je Programma-antwoorden of trackingtokens van partners.",
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
    body: "Nödvändig lagring håller B4GAMBLE igång. Med ditt tillstånd visar egen analys oss hur webbplatsen och Programmet används.",
    detail: "Analysen innehåller aldrig din e-post, dina svar i Programmet eller partners spårningstoken.",
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
    body: "Nødvendig lagring holder B4GAMBLE kørende. Med din tilladelse viser egen analyse os, hvordan siden og Programmet bruges.",
    detail: "Analysen indeholder aldrig din e-mail, dine svar i Programmet eller partneres sporingstokens.",
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
    body: "Välttämätön tallennus pitää B4GAMBLEn toiminnassa. Luvallasi oma analytiikka näyttää meille, miten sivustoa ja Ohjelmaa käytetään.",
    detail: "Analytiikka ei koskaan sisällä sähköpostiasi, Ohjelman vastauksiasi tai kumppanien seurantatunnisteita.",
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
    body: "Nødvendig lagring holder B4GAMBLE i gang. Med din tillatelse viser egen analyse oss hvordan nettstedet og Programmet brukes.",
    detail: "Analysen inneholder aldri e-posten din, svarene dine i Programmet eller partneres sporingstokener.",
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
    body: "Le stockage essentiel fait fonctionner B4GAMBLE. Avec votre permission, notre propre analyse nous montre comment le site et le Programme sont utilisés.",
    detail: "L'analyse n'inclut jamais votre courriel, vos réponses au Programme ni les jetons de suivi des partenaires.",
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
