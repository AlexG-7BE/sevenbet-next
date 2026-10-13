import type { SupportedLocale } from "@/lib/market/registry";

/**
 * Copy for /innan, the rule before the app (Founder decision, 13 October 2026, mechanism
 * «Bevisa det»): one screen with the person's own three rules, no casino, no button onwards.
 * The rule lives in this browser's storage only; the page sends nothing anywhere.
 */
export type InnanMessages = Readonly<{
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  title: string;
  intro: string;
  revenueLine: string;
  form: Readonly<{
    heading: string;
    amountLabel: string;
    amountHint: string;
    timeLabel: string;
    timeHint: string;
    personLabel: string;
    personHint: string;
    save: string;
    change: string;
  }>;
  screen: Readonly<{
    eyebrow: string;
    weekCount: string;
    back: string;
    nothingHere: string;
  }>;
  howTo: Readonly<{ heading: string; steps: readonly string[] }>;
  homeLabel: string;
  breadcrumbLabel: string;
}>;

const sv: InnanMessages = {
  metadataTitle: "Din regel innan appen",
  metadataDescription: "En skärm med dina tre regler, utan casinon och utan knapp vidare. Öppna den innan appen.",
  eyebrow: "Innan appen",
  title: "Din regel innan appen",
  intro: "Tre rader som du bestämmer själv: summan, tiden, personen som vet. Skärmen visar dem, räknar hur många gånger du öppnade den den här veckan och har ingen knapp vidare. Lägg den som bokmärke eller på hemskärmen och öppna den innan appen.",
  revenueLine: "B4GAMBLE tjänar provision från licensierade casinon. På den här vägen visas inga.",
  form: {
    heading: "Skriv dina tre rader",
    amountLabel: "Summan",
    amountHint: "Det du bestämmer innan du öppnar appen. En siffra.",
    timeLabel: "Tiden",
    timeHint: "När kvällen slutar, klockslag eller minuter.",
    personLabel: "Personen som vet",
    personHint: "Ett namn eller ett ord. Sparas bara i den här webbläsaren.",
    save: "Visa min regel",
    change: "Ändra raderna",
  },
  screen: {
    eyebrow: "Din regel",
    weekCount: "{n} gånger via din regel den här veckan",
    back: "Tillbaka",
    nothingHere: "Här finns inget mer. Appen väntar inte, men det gör inte regeln heller.",
  },
  howTo: {
    heading: "Så lägger du den innan appen",
    steps: [
      "Spara sidan som bokmärke med namnet ”Innan” och öppna den först.",
      "På telefonen: Dela → Lägg till på hemskärmen, bredvid casinoappen.",
      "I programmets steg 7 ”Lägg till friktion” väljer du den här skärmen som ett av dina lager.",
    ],
  },
  homeLabel: "Hem",
  breadcrumbLabel: "Innan appen",
};

const da: InnanMessages = {
  metadataTitle: "Din regel før appen",
  metadataDescription: "En skærm med dine tre regler, uden casinoer og uden knap videre. Åbn den før appen.",
  eyebrow: "Før appen",
  title: "Din regel før appen",
  intro: "Tre linjer, du selv bestemmer: beløbet, tiden, personen der ved det. Skærmen viser dem, tæller hvor mange gange du åbnede den i denne uge og har ingen knap videre. Gem den som bogmærke eller på startskærmen, og åbn den før appen.",
  revenueLine: "B4GAMBLE tjener provision fra licenserede casinoer. På denne vej vises ingen.",
  form: {
    heading: "Skriv dine tre linjer",
    amountLabel: "Beløbet",
    amountHint: "Det, du bestemmer, før du åbner appen. Et tal.",
    timeLabel: "Tiden",
    timeHint: "Hvornår aftenen slutter, klokkeslæt eller minutter.",
    personLabel: "Personen, der ved det",
    personHint: "Et navn eller et ord. Gemmes kun i denne browser.",
    save: "Vis min regel",
    change: "Ret linjerne",
  },
  screen: {
    eyebrow: "Din regel",
    weekCount: "{n} gange via din regel i denne uge",
    back: "Tilbage",
    nothingHere: "Her er ikke mere. Appen venter ikke, men det gør reglen heller ikke.",
  },
  howTo: {
    heading: "Sådan lægger du den før appen",
    steps: [
      "Gem siden som bogmærke med navnet ”Før” og åbn den først.",
      "På telefonen: Del → Føj til startskærm, ved siden af casinoappen.",
      "I programmets trin 7 ”Tilføj friktion” vælger du denne skærm som et af dine lag.",
    ],
  },
  homeLabel: "Forside",
  breadcrumbLabel: "Før appen",
};

const en: InnanMessages = {
  metadataTitle: "Your rule before the app",
  metadataDescription: "One screen with your three rules, no casinos and no button onwards. Open it before the app.",
  eyebrow: "Before the app",
  title: "Your rule before the app",
  intro: "Three lines you decide yourself: the amount, the time, the person who knows. The screen shows them, counts how often you opened it this week, and has no button onwards. Bookmark it or add it to your home screen, and open it before the app.",
  revenueLine: "B4GAMBLE earns commission from licensed casinos. None are shown on this route.",
  form: {
    heading: "Write your three lines",
    amountLabel: "The amount",
    amountHint: "What you decide before you open the app. A number.",
    timeLabel: "The time",
    timeHint: "When the evening ends, a time or a number of minutes.",
    personLabel: "The person who knows",
    personHint: "A name or a word. Kept in this browser only.",
    save: "Show my rule",
    change: "Change the lines",
  },
  screen: {
    eyebrow: "Your rule",
    weekCount: "{n} times via your rule this week",
    back: "Back",
    nothingHere: "Nothing else here. The app is not waiting, but neither is the rule.",
  },
  howTo: {
    heading: "How to put it before the app",
    steps: [
      "Bookmark this page as “Before” and open it first.",
      "On a phone: Share → Add to Home Screen, next to the casino app.",
      "In Programme step 7, “Add friction”, choose this screen as one of your layers.",
    ],
  },
  homeLabel: "Home",
  breadcrumbLabel: "Before the app",
};

const catalog: Readonly<Partial<Record<SupportedLocale, InnanMessages>>> = { "en-GB": en, "sv-SE": sv, "da-DK": da };

export function innanLocale(locale: SupportedLocale): SupportedLocale {
  return catalog[locale] ? locale : "en-GB";
}

export function innanMessages(locale: SupportedLocale): InnanMessages {
  return catalog[innanLocale(locale)] ?? en;
}
