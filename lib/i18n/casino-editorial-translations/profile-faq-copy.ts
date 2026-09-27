import type { CasinoEditorialLanguage } from "./types";

/**
 * The casino profile's own FAQ questions and answer templates (the entries
 * B4GAMBLE adds after the editorial FAQ). English is the source wording in
 * lib/casino-profile/presentation.ts, reproduced here unchanged.
 */
export type ProfileFaqCopy = Readonly<{
  /** Locale for the licence evidence date and a wagering multiplier. */
  locale: string;
  licenceQuestion: (casinoName: string) => string;
  licenceChecked: (authority: string, checkedOn: string) => string;
  licenceUnchecked: (authority: string) => string;
  wageringQuestion: string;
  wageringListed: (multiplier: string) => string;
  eligibilityQuestion: string;
  withdrawalQuestion: string;
  withdrawalAnswer: (timings: string) => string;
  reviewWithoutActionQuestion: string;
  reviewWithoutActionAnswer: string;
}>;

export const PROFILE_FAQ_COPY: Readonly<Record<"en" | CasinoEditorialLanguage, ProfileFaqCopy>> = {
  en: {
    locale: "en-GB",
    licenceQuestion: (casinoName) => `What licence information is published for ${casinoName}?`,
    licenceChecked: (authority, checkedOn) => `${authority} is listed in the published profile, with evidence checked ${checkedOn}. Licensing is a threshold, not a guarantee of suitability or outcomes.`,
    licenceUnchecked: (authority) => `${authority} is listed in the published profile. No independent verification date is published. Licensing is a threshold, not a guarantee of suitability or outcomes.`,
    wageringQuestion: "What wagering information is published?",
    wageringListed: (multiplier) => `${multiplier}× wagering is listed.`,
    eligibilityQuestion: "Who does the published offer describe?",
    withdrawalQuestion: "What withdrawal timing is listed?",
    withdrawalAnswer: (timings) => `${timings}. Published timing is not a guarantee and account checks may apply.`,
    reviewWithoutActionQuestion: "Can the review remain available without a visit action?",
    reviewWithoutActionAnswer: "Yes. Editorial availability and commercial route availability are separate. A missing or ineligible route does not remove the published review.",
  },
  sv: {
    locale: "sv-SE",
    licenceQuestion: (casinoName) => `Vilken licensinformation finns publicerad för ${casinoName}?`,
    licenceChecked: (authority, checkedOn) => `${authority} anges i den publicerade profilen, och underlaget kontrollerades ${checkedOn}. En licens är en miniminivå, inte en garanti för att sajten passar dig eller för hur det går.`,
    licenceUnchecked: (authority) => `${authority} anges i den publicerade profilen. Inget datum för en oberoende kontroll är publicerat. En licens är en miniminivå, inte en garanti för att sajten passar dig eller för hur det går.`,
    wageringQuestion: "Vilken information om omsättningskrav finns publicerad?",
    wageringListed: (multiplier) => `Omsättningskravet anges till ${multiplier}×.`,
    eligibilityQuestion: "Vem gäller det publicerade erbjudandet för?",
    withdrawalQuestion: "Vilka uttagstider anges?",
    withdrawalAnswer: (timings) => `${timings}. Publicerade tider är ingen garanti, och kontroller av ditt konto kan tillkomma.`,
    reviewWithoutActionQuestion: "Finns recensionen kvar även utan en länk till sajten?",
    reviewWithoutActionAnswer: "Ja. Recensionen och länken till sajten är två separata saker. Om det saknas en länk, eller om den inte gäller där du är, ligger recensionen ändå kvar.",
  },
  da: {
    locale: "da-DK",
    licenceQuestion: (casinoName) => `Hvilke licensoplysninger er offentliggjort for ${casinoName}?`,
    licenceChecked: (authority, checkedOn) => `${authority} er angivet i den offentliggjorte profil, og dokumentationen blev kontrolleret ${checkedOn}. En licens er et minimumskrav, ikke en garanti for, at siden passer til dig, eller for hvordan det går.`,
    licenceUnchecked: (authority) => `${authority} er angivet i den offentliggjorte profil. Der er ikke offentliggjort nogen dato for en uafhængig kontrol. En licens er et minimumskrav, ikke en garanti for, at siden passer til dig, eller for hvordan det går.`,
    wageringQuestion: "Hvilke oplysninger om omsætningskrav er offentliggjort?",
    wageringListed: (multiplier) => `Omsætningskravet er angivet til ${multiplier}×.`,
    eligibilityQuestion: "Hvem gælder det offentliggjorte tilbud for?",
    withdrawalQuestion: "Hvilke udbetalingstider er angivet?",
    withdrawalAnswer: (timings) => `${timings}. Offentliggjorte tider er ingen garanti, og der kan komme kontrol af din konto oveni.`,
    reviewWithoutActionQuestion: "Bliver anmeldelsen liggende, selv uden et link til siden?",
    reviewWithoutActionAnswer: "Ja. Anmeldelsen og linket til siden er to separate ting. Hvis der mangler et link, eller hvis det ikke gælder der, hvor du er, bliver anmeldelsen alligevel liggende.",
  },
  de: {
    locale: "de-DE",
    licenceQuestion: (casinoName) => `Welche Lizenzangaben sind für ${casinoName} veröffentlicht?`,
    licenceChecked: (authority, checkedOn) => `${authority} ist im veröffentlichten Profil angegeben; die Nachweise wurden am ${checkedOn} geprüft. Eine Lizenz ist eine Mindestvoraussetzung, keine Garantie dafür, dass der Anbieter zu dir passt oder wie dein Spiel ausgeht.`,
    licenceUnchecked: (authority) => `${authority} ist im veröffentlichten Profil angegeben. Ein Datum für eine unabhängige Prüfung ist nicht veröffentlicht. Eine Lizenz ist eine Mindestvoraussetzung, keine Garantie dafür, dass der Anbieter zu dir passt oder wie dein Spiel ausgeht.`,
    wageringQuestion: "Welche Angaben zu den Umsatzbedingungen sind veröffentlicht?",
    wageringListed: (multiplier) => `Als Umsatzbedingung ist ${multiplier}× angegeben.`,
    eligibilityQuestion: "Für wen gilt das veröffentlichte Angebot?",
    withdrawalQuestion: "Welche Auszahlungszeiten sind angegeben?",
    withdrawalAnswer: (timings) => `${timings}. Veröffentlichte Zeiten sind keine Garantie, und Kontoprüfungen können dazukommen.`,
    reviewWithoutActionQuestion: "Bleibt die Bewertung auch ohne Link zum Anbieter online?",
    reviewWithoutActionAnswer: "Ja. Die Bewertung und der Link zum Anbieter sind voneinander getrennt. Fehlt ein Link oder gilt er dort, wo du bist, nicht, bleibt die Bewertung trotzdem online.",
  },
};
