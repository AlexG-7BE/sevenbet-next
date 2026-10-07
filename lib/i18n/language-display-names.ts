import type { SupportedLanguage } from "@/lib/market/registry";

/**
 * Language and region names for the language menus, fixed at build time.
 *
 * Both menus are client components. With `Intl.DisplayNames` they rendered the
 * server's ICU names and then recomputed them from the browser's CLDR data, which
 * differs: Node says "engelska", Safari "Engelska"; Node's Danish name for Norwegian
 * is "bokmål", Safari's "norsk bokmål". React then threw away every Swedish and
 * Danish page on iPhone and rendered it again (hydration error #418).
 *
 * Generated once from Node 24's ICU, first letter upper-cased for a menu, with
 * the Danish name for Norwegian spelled out. Keep this table the only source.
 */
type DisplayLanguage = SupportedLanguage;
type DisplayRegion = "GB" | "DE" | "IT" | "ES" | "PT" | "GR" | "NL" | "SE" | "DK" | "FI" | "NO" | "UA" | "RU";

export const LANGUAGE_DISPLAY_NAMES = {
  en: { en: "English", de: "German", es: "Spanish", el: "Greek", sv: "Swedish", da: "Danish", it: "Italian", pt: "Portuguese", nl: "Dutch", fi: "Finnish", nb: "Norwegian Bokmål", uk: "Ukrainian", ru: "Russian", fr: "French" },
  de: { en: "Englisch", de: "Deutsch", es: "Spanisch", el: "Griechisch", sv: "Schwedisch", da: "Dänisch", it: "Italienisch", pt: "Portugiesisch", nl: "Niederländisch", fi: "Finnisch", nb: "Norwegisch (Bokmål)", uk: "Ukrainisch", ru: "Russisch", fr: "Französisch" },
  it: { en: "Inglese", de: "Tedesco", es: "Spagnolo", el: "Greco", sv: "Svedese", da: "Danese", it: "Italiano", pt: "Portoghese", nl: "Olandese", fi: "Finlandese", nb: "Norvegese bokmål", uk: "Ucraino", ru: "Russo", fr: "Francese" },
  es: { en: "Inglés", de: "Alemán", es: "Español", el: "Griego", sv: "Sueco", da: "Danés", it: "Italiano", pt: "Portugués", nl: "Neerlandés", fi: "Finés", nb: "Noruego bokmal", uk: "Ucraniano", ru: "Ruso", fr: "Francés" },
  pt: { en: "Inglês", de: "Alemão", es: "Espanhol", el: "Grego", sv: "Sueco", da: "Dinamarquês", it: "Italiano", pt: "Português", nl: "Holandês", fi: "Finlandês", nb: "Bokmål norueguês", uk: "Ucraniano", ru: "Russo", fr: "Francês" },
  el: { en: "Αγγλικά", de: "Γερμανικά", es: "Ισπανικά", el: "Ελληνικά", sv: "Σουηδικά", da: "Δανικά", it: "Ιταλικά", pt: "Πορτογαλικά", nl: "Ολλανδικά", fi: "Φινλανδικά", nb: "Νορβηγικά Μποκμάλ", uk: "Ουκρανικά", ru: "Ρωσικά", fr: "Γαλλικά" },
  nl: { en: "Engels", de: "Duits", es: "Spaans", el: "Grieks", sv: "Zweeds", da: "Deens", it: "Italiaans", pt: "Portugees", nl: "Nederlands", fi: "Fins", nb: "Noors - Bokmål", uk: "Oekraïens", ru: "Russisch", fr: "Frans" },
  sv: { en: "Engelska", de: "Tyska", es: "Spanska", el: "Grekiska", sv: "Svenska", da: "Danska", it: "Italienska", pt: "Portugisiska", nl: "Nederländska", fi: "Finska", nb: "Norskt bokmål", uk: "Ukrainska", ru: "Ryska", fr: "Franska" },
  da: { en: "Engelsk", de: "Tysk", es: "Spansk", el: "Græsk", sv: "Svensk", da: "Dansk", it: "Italiensk", pt: "Portugisisk", nl: "Nederlandsk", fi: "Finsk", nb: "Norsk bokmål", uk: "Ukrainsk", ru: "Russisk", fr: "Fransk" },
  fi: { en: "Englanti", de: "Saksa", es: "Espanja", el: "Kreikka", sv: "Ruotsi", da: "Tanska", it: "Italia", pt: "Portugali", nl: "Hollanti", fi: "Suomi", nb: "Norjan bokmål", uk: "Ukraina", ru: "Venäjä", fr: "Ranska" },
  nb: { en: "Engelsk", de: "Tysk", es: "Spansk", el: "Gresk", sv: "Svensk", da: "Dansk", it: "Italiensk", pt: "Portugisisk", nl: "Nederlandsk", fi: "Finsk", nb: "Norsk bokmål", uk: "Ukrainsk", ru: "Russisk", fr: "Fransk" },
  uk: { en: "Англійська", de: "Німецька", es: "Іспанська", el: "Грецька", sv: "Шведська", da: "Данська", it: "Італійська", pt: "Португальська", nl: "Нідерландська", fi: "Фінська", nb: "Норвезька (букмол)", uk: "Українська", ru: "Російська", fr: "Французька" },
  ru: { en: "Английский", de: "Немецкий", es: "Испанский", el: "Греческий", sv: "Шведский", da: "Датский", it: "Итальянский", pt: "Португальский", nl: "Нидерландский", fi: "Финский", nb: "Норвежский букмол", uk: "Украинский", ru: "Русский", fr: "Французский" },
  fr: { en: "Anglais", de: "Allemand", es: "Espagnol", el: "Grec", sv: "Suédois", da: "Danois", it: "Italien", pt: "Portugais", nl: "Néerlandais", fi: "Finnois", nb: "Norvégien bokmål", uk: "Ukrainien", ru: "Russe", fr: "Français" },
} as const satisfies Record<DisplayLanguage, Record<SupportedLanguage, string>>;

export const REGION_DISPLAY_NAMES = {
  en: { GB: "United Kingdom", DE: "Germany", IT: "Italy", ES: "Spain", PT: "Portugal", GR: "Greece", NL: "Netherlands", SE: "Sweden", DK: "Denmark", FI: "Finland", NO: "Norway", UA: "Ukraine", RU: "Russia" },
  de: { GB: "Vereinigtes Königreich", DE: "Deutschland", IT: "Italien", ES: "Spanien", PT: "Portugal", GR: "Griechenland", NL: "Niederlande", SE: "Schweden", DK: "Dänemark", FI: "Finnland", NO: "Norwegen", UA: "Ukraine", RU: "Russland" },
  it: { GB: "Regno Unito", DE: "Germania", IT: "Italia", ES: "Spagna", PT: "Portogallo", GR: "Grecia", NL: "Paesi Bassi", SE: "Svezia", DK: "Danimarca", FI: "Finlandia", NO: "Norvegia", UA: "Ucraina", RU: "Russia" },
  es: { GB: "Reino Unido", DE: "Alemania", IT: "Italia", ES: "España", PT: "Portugal", GR: "Grecia", NL: "Países Bajos", SE: "Suecia", DK: "Dinamarca", FI: "Finlandia", NO: "Noruega", UA: "Ucrania", RU: "Rusia" },
  pt: { GB: "Reino Unido", DE: "Alemanha", IT: "Itália", ES: "Espanha", PT: "Portugal", GR: "Grécia", NL: "Países Baixos", SE: "Suécia", DK: "Dinamarca", FI: "Finlândia", NO: "Noruega", UA: "Ucrânia", RU: "Rússia" },
  el: { GB: "Ηνωμένο Βασίλειο", DE: "Γερμανία", IT: "Ιταλία", ES: "Ισπανία", PT: "Πορτογαλία", GR: "Ελλάδα", NL: "Κάτω Χώρες", SE: "Σουηδία", DK: "Δανία", FI: "Φινλανδία", NO: "Νορβηγία", UA: "Ουκρανία", RU: "Ρωσία" },
  nl: { GB: "Verenigd Koninkrijk", DE: "Duitsland", IT: "Italië", ES: "Spanje", PT: "Portugal", GR: "Griekenland", NL: "Nederland", SE: "Zweden", DK: "Denemarken", FI: "Finland", NO: "Noorwegen", UA: "Oekraïne", RU: "Rusland" },
  sv: { GB: "Storbritannien", DE: "Tyskland", IT: "Italien", ES: "Spanien", PT: "Portugal", GR: "Grekland", NL: "Nederländerna", SE: "Sverige", DK: "Danmark", FI: "Finland", NO: "Norge", UA: "Ukraina", RU: "Ryssland" },
  da: { GB: "Storbritannien", DE: "Tyskland", IT: "Italien", ES: "Spanien", PT: "Portugal", GR: "Grækenland", NL: "Nederlandene", SE: "Sverige", DK: "Danmark", FI: "Finland", NO: "Norge", UA: "Ukraine", RU: "Rusland" },
  fi: { GB: "Iso-Britannia", DE: "Saksa", IT: "Italia", ES: "Espanja", PT: "Portugali", GR: "Kreikka", NL: "Alankomaat", SE: "Ruotsi", DK: "Tanska", FI: "Suomi", NO: "Norja", UA: "Ukraina", RU: "Venäjä" },
  nb: { GB: "Storbritannia", DE: "Tyskland", IT: "Italia", ES: "Spania", PT: "Portugal", GR: "Hellas", NL: "Nederland", SE: "Sverige", DK: "Danmark", FI: "Finland", NO: "Norge", UA: "Ukraina", RU: "Russland" },
  uk: { GB: "Велика Британія", DE: "Німеччина", IT: "Італія", ES: "Іспанія", PT: "Португалія", GR: "Греція", NL: "Нідерланди", SE: "Швеція", DK: "Данія", FI: "Фінляндія", NO: "Норвегія", UA: "Україна", RU: "Росія" },
  ru: { GB: "Великобритания", DE: "Германия", IT: "Италия", ES: "Испания", PT: "Португалия", GR: "Греция", NL: "Нидерланды", SE: "Швеция", DK: "Дания", FI: "Финляндия", NO: "Норвегия", UA: "Украина", RU: "Россия" },
  fr: { GB: "Royaume-Uni", DE: "Allemagne", IT: "Italie", ES: "Espagne", PT: "Portugal", GR: "Grèce", NL: "Pays-Bas", SE: "Suède", DK: "Danemark", FI: "Finlande", NO: "Norvège", UA: "Ukraine", RU: "Russie" },
} as const satisfies Record<DisplayLanguage, Record<DisplayRegion, string>>;

function displayLanguage(locale: string): DisplayLanguage {
  const language = locale.split("-")[0] ?? "en";
  return language in LANGUAGE_DISPLAY_NAMES ? language as DisplayLanguage : "en";
}

/** The name of `locale`'s language, written in `displayLocale`'s language. */
export function languageDisplayName(locale: string, displayLocale: string): string {
  const language = locale.split("-")[0] ?? locale;
  const names: Record<string, string> = LANGUAGE_DISPLAY_NAMES[displayLanguage(displayLocale)];
  return names[language] ?? language;
}

/** The name of a region code, written in `displayLocale`'s language. */
export function regionDisplayName(region: string, displayLocale: string): string {
  const names: Record<string, string> = REGION_DISPLAY_NAMES[displayLanguage(displayLocale)];
  return names[region] ?? region;
}
