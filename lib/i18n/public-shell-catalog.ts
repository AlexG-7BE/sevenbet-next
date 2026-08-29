import type { SupportedLocale } from "@/lib/market/registry";

export type PublicShellMessages = Readonly<{
  skipToMain: string;
  homeLabel: string;
  primaryNavigation: string;
  openNavigation: string;
  closeNavigation: string;
  siteNavigation: string;
  mobilePrimaryNavigation: string;
  view: string;
  controlAndSupport: string;
  openHelp: string;
  openProgramme: string;
  adultServiceNotice: string;
  marketAndLanguage: string;
  changeMarketAndLanguage: string;
}>;

const messages = {
  "en-GB": {
    skipToMain: "Skip to main content",
    homeLabel: "B4GAMBLE home",
    primaryNavigation: "Primary navigation",
    openNavigation: "Open navigation",
    closeNavigation: "Close navigation",
    siteNavigation: "Site navigation",
    mobilePrimaryNavigation: "Mobile primary navigation",
    view: "VIEW",
    controlAndSupport: "CONTROL & SUPPORT",
    openHelp: "Open Help",
    openProgramme: "Open My Programme",
    adultServiceNotice: "18+ · Information and comparison service · Help stays separate from commercial discovery.",
    marketAndLanguage: "Market and language",
    changeMarketAndLanguage: "Change market and language",
  },
  "de-DE": {
    skipToMain: "Zum Hauptinhalt springen",
    homeLabel: "B4GAMBLE Startseite",
    primaryNavigation: "Hauptnavigation",
    openNavigation: "Navigation öffnen",
    closeNavigation: "Navigation schließen",
    siteNavigation: "Seitennavigation",
    mobilePrimaryNavigation: "Mobile Hauptnavigation",
    view: "ANSEHEN",
    controlAndSupport: "KONTROLLE & HILFE",
    openHelp: "Hilfe öffnen",
    openProgramme: "Mein Programm öffnen",
    adultServiceNotice: "18+ · Informations- und Vergleichsdienst · Hilfe bleibt von kommerziellen Empfehlungen getrennt.",
    marketAndLanguage: "Markt und Sprache",
    changeMarketAndLanguage: "Markt und Sprache ändern",
  },
  "sv-SE": {
    skipToMain: "Hoppa till huvudinnehållet",
    homeLabel: "B4GAMBLE startsida",
    primaryNavigation: "Huvudnavigering",
    openNavigation: "Öppna navigering",
    closeNavigation: "Stäng navigering",
    siteNavigation: "Webbplatsnavigering",
    mobilePrimaryNavigation: "Mobil huvudnavigering",
    view: "VISA",
    controlAndSupport: "KONTROLL & STÖD",
    openHelp: "Öppna Hjälp",
    openProgramme: "Öppna mitt program",
    adultServiceNotice: "18+ · Informations- och jämförelsetjänst · Hjälp hålls åtskild från kommersiell upptäckt.",
    marketAndLanguage: "Marknad och språk",
    changeMarketAndLanguage: "Byt marknad och språk",
  },
  "da-DK": {
    skipToMain: "Gå til hovedindhold",
    homeLabel: "B4GAMBLE forside",
    primaryNavigation: "Primær navigation",
    openNavigation: "Åbn navigation",
    closeNavigation: "Luk navigation",
    siteNavigation: "Webstedsnavigation",
    mobilePrimaryNavigation: "Mobil primær navigation",
    view: "SE",
    controlAndSupport: "KONTROL & STØTTE",
    openHelp: "Åbn Hjælp",
    openProgramme: "Åbn mit program",
    adultServiceNotice: "18+ · Informations- og sammenligningstjeneste · Hjælp holdes adskilt fra kommerciel discovery.",
    marketAndLanguage: "Marked og sprog",
    changeMarketAndLanguage: "Skift marked og sprog",
  },
  "fi-FI": {
    skipToMain: "Siirry pääsisältöön",
    homeLabel: "B4GAMBLE etusivu",
    primaryNavigation: "Päänavigointi",
    openNavigation: "Avaa navigointi",
    closeNavigation: "Sulje navigointi",
    siteNavigation: "Sivuston navigointi",
    mobilePrimaryNavigation: "Mobiilin päänavigointi",
    view: "NÄYTÄ",
    controlAndSupport: "HALLINTA & TUKI",
    openHelp: "Avaa Ohje",
    openProgramme: "Avaa oma ohjelma",
    adultServiceNotice: "18+ · Tieto- ja vertailupalvelu · Tuki pidetään erillään kaupallisesta sisällöstä.",
    marketAndLanguage: "Markkina ja kieli",
    changeMarketAndLanguage: "Vaihda markkinaa ja kieltä",
  },
  "nb-NO": {
    skipToMain: "Gå til hovedinnhold",
    homeLabel: "B4GAMBLE forside",
    primaryNavigation: "Hovednavigasjon",
    openNavigation: "Åpne navigasjon",
    closeNavigation: "Lukk navigasjon",
    siteNavigation: "Nettstedsnavigasjon",
    mobilePrimaryNavigation: "Mobil hovednavigasjon",
    view: "VIS",
    controlAndSupport: "KONTROLL & STØTTE",
    openHelp: "Åpne Hjelp",
    openProgramme: "Åpne programmet mitt",
    adultServiceNotice: "18+ · Informasjons- og sammenligningstjeneste · Hjelp holdes adskilt fra kommersiell oppdagelse.",
    marketAndLanguage: "Marked og språk",
    changeMarketAndLanguage: "Bytt marked og språk",
  },
  "en-CA": {
    skipToMain: "Skip to main content",
    homeLabel: "B4GAMBLE home",
    primaryNavigation: "Primary navigation",
    openNavigation: "Open navigation",
    closeNavigation: "Close navigation",
    siteNavigation: "Site navigation",
    mobilePrimaryNavigation: "Mobile primary navigation",
    view: "VIEW",
    controlAndSupport: "CONTROL & SUPPORT",
    openHelp: "Open Help",
    openProgramme: "Open My Programme",
    adultServiceNotice: "18+ · Information and comparison service · Help stays separate from commercial discovery.",
    marketAndLanguage: "Market and language",
    changeMarketAndLanguage: "Change market and language",
  },
  "fr-CA": {
    skipToMain: "Aller au contenu principal",
    homeLabel: "Accueil B4GAMBLE",
    primaryNavigation: "Navigation principale",
    openNavigation: "Ouvrir la navigation",
    closeNavigation: "Fermer la navigation",
    siteNavigation: "Navigation du site",
    mobilePrimaryNavigation: "Navigation principale mobile",
    view: "VOIR",
    controlAndSupport: "CONTRÔLE ET SOUTIEN",
    openHelp: "Ouvrir l’aide",
    openProgramme: "Ouvrir mon programme",
    adultServiceNotice: "18+ · Service d’information et de comparaison · L’aide reste séparée de la découverte commerciale.",
    marketAndLanguage: "Marché et langue",
    changeMarketAndLanguage: "Changer de marché et de langue",
  },
} as const satisfies Record<SupportedLocale, PublicShellMessages>;

export function publicShellMessages(locale: SupportedLocale): PublicShellMessages {
  return messages[locale];
}
