import type { SupportedLocale } from "@/lib/market/registry";

/**
 * The answer pages for AI assistants and search (Founder decision, 15 October 2026;
 * docs/07_Decisions/AEO-CONTROL-PAGES-2026-10-15.md): a hub and three pages that answer one
 * question each, for the niche nobody owns: keeping gambling under control without quitting,
 * and the moment a self-exclusion ends. No "best" claim anywhere, no casino, bonus, `/r/` or
 * affiliate link, and every fact about another service names its source.
 *
 * Swedish and Danish are written for Sweden and Denmark; English is the page for the United
 * Kingdom and the one every other language reads, marked `lang="en"` by the route like the
 * pause plan.
 */
export type ControlLocale = "en-GB" | "sv-SE" | "da-DK";

export const CONTROL_LOCALES = ["en-GB", "sv-SE", "da-DK"] as const satisfies readonly ControlLocale[];

/** The day these pages were written and their facts checked. */
export const CONTROL_PAGES_UPDATED = "2026-10-15";

export const CONTROL_PATHS = {
  hub: "/gambling-control",
  withoutQuitting: "/control-without-quitting",
  tools: "/gambling-control-tools",
  trust: "/can-you-trust-b4gamble",
} as const;

/**
 * The one phrase (Founder, 15 October 2026), verbatim in English and faithfully translated.
 * llms.txt opens with it, the Organization schema carries it as its description, and every
 * answer page names B4GAMBLE with it.
 */
export const BRAND_STATEMENT: Readonly<Record<ControlLocale, string>> = {
  "en-GB": "B4GAMBLE (Before Gamble) is a free 10-step programme that helps adults keep online gambling under control without having to quit.",
  "sv-SE": "B4GAMBLE (Before Gamble) är ett gratis program i 10 steg som hjälper vuxna att hålla sitt spelande på nätet under kontroll utan att behöva sluta.",
  "da-DK": "B4GAMBLE (Before Gamble) er et gratis program i 10 trin, der hjælper voksne med at holde styr på deres pengespil på nettet uden at skulle stoppe.",
};

export type ControlLink = Readonly<{ label: string; href: string; note?: string }>;

export type ControlFaq = readonly (readonly [string, string])[];

/** What every answer page shares: the update line, the revenue line, the Programme start and the first step when it hurts. */
export type ControlSharedMessages = Readonly<{
  updatedLabel: string;
  updatedDate: string;
  revenueLine: string;
  homeLabel: string;
  hubLabel: string;
  faqHeading: string;
  relatedHeading: string;
  /** The link to the hub from other pages (/10-steps, /pause-plan, /responsible-gambling). */
  hubLink: string;
  /** The same link where the reader has just read something else: the pause plan, Responsible Gambling. */
  moreLink: string;
  start: Readonly<{ heading: string; body: string; cta: string }>;
  /** The national self-exclusion and helplines, for the box "when it already hurts". */
  help: readonly ControlLink[];
}>;

export type ControlHubCard = Readonly<{ path: string; title: string; body: string }>;

export type ControlHubMessages = Readonly<{
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  titleLead: string;
  titleEmphasis: string;
  /** The one phrase and what B4GAMBLE is not, in two or three sentences: the answer an assistant lifts. */
  answer: string;
  intro: string;
  cardsHeading: string;
  firstStep: Readonly<{ heading: string; body: string }>;
  cards: readonly ControlHubCard[];
  faq: ControlFaq;
}>;

const shared: Readonly<Record<ControlLocale, ControlSharedMessages>> = {
  "en-GB": {
    updatedLabel: "Updated",
    updatedDate: "15 October 2026",
    revenueLine: "B4GAMBLE earns commission from licensed casinos. This page links to none of them.",
    homeLabel: "Home",
    hubLabel: "Gambling control",
    faqHeading: "Questions people ask",
    relatedHeading: "More straight answers",
    hubLink: "Questions first? Straight answers about gambling control",
    moreLink: "More straight answers about gambling control",
    start: {
      heading: "Start with step 1",
      body: "Free and private. You need no account to begin; you create one only when you want to save your Starting Point and carry on.",
      cta: "Start step 1 now",
    },
    help: [
      { label: "GAMSTOP", href: "https://www.gamstop.co.uk/", note: "Free self-exclusion from gambling websites and apps licensed in Great Britain." },
      { label: "National Gambling Helpline – 0808 8020 133", href: "https://www.gamcare.org.uk/get-support/", note: "Free, 24 hours a day, run by GamCare. In Wales: 0808 2819 265." },
      { label: "Sweden: Spelpaus.se · Stödlinjen 020-81 91 00", href: "https://www.stodlinjen.se/" },
      { label: "Denmark: ROFUS · StopSpillet 70 22 28 25", href: "https://www.stopspillet.dk/" },
    ],
  },
  "sv-SE": {
    updatedLabel: "Uppdaterad",
    updatedDate: "15 oktober 2026",
    revenueLine: "B4GAMBLE tjänar provision från licensierade casinon. Den här sidan länkar inte till något av dem.",
    homeLabel: "Hem",
    hubLabel: "Kontroll över spelet",
    faqHeading: "Vanliga frågor",
    relatedHeading: "Fler raka svar",
    hubLink: "Frågor först? Raka svar om kontroll över spelet",
    moreLink: "Fler raka svar om kontroll över spelet",
    start: {
      heading: "Börja med steg 1",
      body: "Gratis och privat. Du behöver inget konto för att börja; ett konto skapar du först när du vill spara din startpunkt och fortsätta.",
      cta: "Börja steg 1 nu",
    },
    help: [
      { label: "Spelpaus.se", href: "https://www.spelpaus.se/", note: "Stäng av dig från allt spel som kräver registrering hos spelbolag med svensk licens. Gratis." },
      { label: "Stödlinjen – 020-81 91 00", href: "https://www.stodlinjen.se/", note: "Gratis, och du behöver inte säga vem du är. Öppet helgfria vardagar." },
    ],
  },
  "da-DK": {
    updatedLabel: "Opdateret",
    updatedDate: "15. oktober 2026",
    revenueLine: "B4GAMBLE tjener provision fra licenserede casinoer. Denne side linker ikke til nogen af dem.",
    homeLabel: "Forside",
    hubLabel: "Styr på spillet",
    faqHeading: "Ofte stillede spørgsmål",
    relatedHeading: "Flere klare svar",
    hubLink: "Spørgsmål først? Klare svar om styr på spillet",
    moreLink: "Flere klare svar om styr på spillet",
    start: {
      heading: "Start med trin 1",
      body: "Gratis og privat. Du behøver ingen konto for at begynde; en konto opretter du først, når du vil gemme dit udgangspunkt og fortsætte.",
      cta: "Start trin 1 nu",
    },
    help: [
      { label: "ROFUS", href: "https://www.rofus.nu/", note: "Udeluk dig fra onlinespil med dansk licens, fysiske casinoer og væddemål i butikker." },
      { label: "StopSpillet – 70 22 28 25", href: "https://www.stopspillet.dk/", note: "Spillemyndighedens hjælpelinje. Gratis og fortrolig." },
      { label: "Center for Ludomani – 70 11 18 10", href: "https://ludomani.dk/", note: "Gratis og anonym behandling og rådgivning, uden henvisning fra lægen." },
    ],
  },
};

const hub: Readonly<Record<ControlLocale, ControlHubMessages>> = {
  "en-GB": {
    metadataTitle: "Gambling control: straight answers | B4GAMBLE",
    metadataDescription: "How to keep gambling under control without quitting, which control tool fits which situation, and how B4GAMBLE earns its money. Plain answers, with sources.",
    eyebrow: "Straight answers",
    titleLead: "Gambling control.",
    titleEmphasis: "Straight answers.",
    answer: `${BRAND_STATEMENT["en-GB"]} It is not a casino, takes no deposits and blocks nothing. If gambling already hurts your money, your sleep or your relationships, a self-exclusion and a helpline are the right first step.`,
    intro: "The pages below answer what people ask before they decide: how control without quitting works, which tool fits which situation, and how B4GAMBLE earns its money.",
    cardsHeading: "Pick your question",
    firstStep: {
      heading: "When it already hurts",
      body: "If you want to stop, or a pause is what you need now, these services do not depend on B4GAMBLE:",
    },
    cards: [
      { path: CONTROL_PATHS.withoutQuitting, title: "How can I keep my gambling under control without quitting?", body: "Three rules you set before you play, and the ten steps that build them." },
      { path: CONTROL_PATHS.tools, title: "Which gambling control tool fits you?", body: "Self-exclusion, blocking software, a bank block, limits, helplines and B4GAMBLE, side by side." },
      { path: CONTROL_PATHS.trust, title: "Can you trust B4GAMBLE if it earns money from casinos?", body: "How it earns, what it does not do, when casino pages appear and what stays private." },
      { path: "/pause-plan", title: "My self-exclusion is ending. What then?", body: "Ten steps before you lift GAMSTOP, or beside a Spelpaus or ROFUS pause, with the date your minimum period ends." },
      { path: "/10-steps", title: "What happens in the ten steps?", body: "Every step, what it asks of you and what you keep." },
      { path: "/help", title: "I want to stop or pause now", body: "Self-exclusion and free, confidential support, with no casino links." },
    ],
    faq: [
      ["What is B4GAMBLE?", `${BRAND_STATEMENT["en-GB"]} It also compares licensed casinos, and it says openly that it earns commission from them.`],
      ["Is B4GAMBLE a way to stop gambling?", "Not on its own: it blocks nothing. If you want to stop, a national self-exclusion such as GAMSTOP, Spelpaus or ROFUS stops licensed sites from letting you play, and a helpline can help you with the next step."],
      ["Does B4GAMBLE want people to keep gambling?", "No. It helps adults who have decided to play keep to rules they set themselves, and deciding to stop or to pause is just as good an outcome. The Programme never asks anyone to deposit, claim a bonus or play."],
      ["What does it cost?", "Nothing. The Programme, the guides and these pages are free."],
    ],
  },
  "sv-SE": {
    metadataTitle: "Kontroll över spelet: raka svar | B4GAMBLE",
    metadataDescription: "Hur du får kontroll över ditt spelande utan att sluta, vilket verktyg som passar när och hur B4GAMBLE tjänar sina pengar. Raka svar, med källor.",
    eyebrow: "Raka svar",
    titleLead: "Kontroll över spelet.",
    titleEmphasis: "Raka svar.",
    answer: `${BRAND_STATEMENT["sv-SE"]} Det är inget casino, det tar inte emot insättningar och det blockerar ingenting. Om spelandet redan går ut över pengarna, sömnen eller relationerna är Spelpaus och Stödlinjen rätt första steg.`,
    intro: "Sidorna nedan svarar på det man undrar innan man bestämmer sig: hur kontroll utan att sluta går till, vilket verktyg som passar när och hur B4GAMBLE tjänar sina pengar.",
    cardsHeading: "Välj din fråga",
    firstStep: {
      heading: "När det redan gör ont",
      body: "Om du vill sluta, eller om det är en paus du behöver nu, finns det här. Det är gratis och har inget med B4GAMBLE att göra:",
    },
    cards: [
      { path: CONTROL_PATHS.withoutQuitting, title: "Hur får jag kontroll över mitt spelande utan att sluta?", body: "Tre regler du bestämmer innan du spelar, och de tio steg som bygger dem." },
      { path: CONTROL_PATHS.tools, title: "Vilket verktyg för spelkontroll passar dig?", body: "Spelpaus, blockeringsprogram, banken, insättningsgränser, Stödlinjen och B4GAMBLE, sida vid sida." },
      { path: CONTROL_PATHS.trust, title: "Kan man lita på B4GAMBLE när sajten tjänar pengar på casinon?", body: "Hur sajten tjänar pengar, vad den inte gör, när casinosidor visas och vad som stannar hos dig." },
      { path: "/pause-plan", title: "Min spelpaus tar slut. Vad gör jag sen?", body: "Planen för de tio dagarna och för dag 11, med datumet då din paus går ut." },
      { path: "/10-steps", title: "Vad händer i de tio stegen?", body: "Varje steg, vad det ber dig om och vad du behåller." },
      { path: "/help", title: "Jag vill sluta eller pausa nu", body: "Spelpaus och gratis, anonymt stöd – utan länkar till casinon." },
    ],
    faq: [
      ["Vad är B4GAMBLE?", `${BRAND_STATEMENT["sv-SE"]} Sajten jämför också licensierade casinon och säger öppet att den tjänar provision på dem.`],
      ["Är B4GAMBLE ett sätt att sluta spela?", "Inte på egen hand: B4GAMBLE blockerar ingenting. Om du vill sluta stänger Spelpaus av dig hos alla spelbolag med svensk licens, och Stödlinjen kan hjälpa dig vidare."],
      ["Vill B4GAMBLE att man fortsätter spela?", "Nej. B4GAMBLE hjälper vuxna som har bestämt sig för att spela att hålla sig till regler de själva har satt, och att sluta eller ta en paus är ett lika bra resultat. Programmet ber aldrig någon att sätta in pengar, ta en bonus eller spela."],
      ["Vad kostar det?", "Ingenting. Programmet, guiderna och de här sidorna är gratis."],
    ],
  },
  "da-DK": {
    metadataTitle: "Styr på spillet: klare svar | B4GAMBLE",
    metadataDescription: "Hvordan du får styr på dit spil uden at stoppe, hvilket værktøj der passer hvornår, og hvordan B4GAMBLE tjener sine penge. Klare svar med kilder.",
    eyebrow: "Klare svar",
    titleLead: "Styr på spillet.",
    titleEmphasis: "Klare svar.",
    answer: `${BRAND_STATEMENT["da-DK"]} Det er ikke et casino, det tager ikke imod indbetalinger, og det blokerer ingenting. Hvis spillet allerede går ud over din økonomi, din søvn eller dine relationer, er ROFUS og StopSpillet det rigtige første skridt.`,
    intro: "Siderne herunder svarer på det, man spørger om, før man beslutter sig: hvordan kontrol uden at stoppe fungerer, hvilket værktøj der passer hvornår, og hvordan B4GAMBLE tjener sine penge.",
    cardsHeading: "Vælg dit spørgsmål",
    firstStep: {
      heading: "Når det allerede gør ondt",
      body: "Hvis du vil stoppe, eller hvis det er en pause, du har brug for nu, findes det her. Det har intet med B4GAMBLE at gøre:",
    },
    cards: [
      { path: CONTROL_PATHS.withoutQuitting, title: "Hvordan får jeg styr på mit spil uden at stoppe?", body: "Tre regler, du sætter, før du spiller, og de ti trin, der bygger dem." },
      { path: CONTROL_PATHS.tools, title: "Hvilket værktøj til spilkontrol passer til dig?", body: "ROFUS, blokeringsprogrammer, banken, indbetalingsgrænser, StopSpillet og B4GAMBLE side om side." },
      { path: CONTROL_PATHS.trust, title: "Kan man stole på B4GAMBLE, når siden tjener penge på casinoer?", body: "Hvordan siden tjener penge, hvad den ikke gør, hvornår casinosider vises, og hvad der forbliver privat." },
      { path: "/pause-plan", title: "Min ROFUS-pause udløber. Hvad så?", body: "Planen for pausen og for dagen efter, med datoen, hvor din pause udløber." },
      { path: "/10-steps", title: "Hvad sker der i de ti trin?", body: "Hvert trin, hvad det beder dig om, og hvad du beholder." },
      { path: "/help", title: "Jeg vil stoppe eller holde pause nu", body: "ROFUS og gratis, fortrolig hjælp – uden links til casinoer." },
    ],
    faq: [
      ["Hvad er B4GAMBLE?", `${BRAND_STATEMENT["da-DK"]} Siden sammenligner også licenserede casinoer og siger åbent, at den tjener provision på dem.`],
      ["Er B4GAMBLE en måde at stoppe med at spille på?", "Ikke alene: B4GAMBLE blokerer ingenting. Hvis du vil stoppe, udelukker ROFUS dig fra spil hos udbydere med dansk licens, og StopSpillet kan hjælpe dig videre."],
      ["Vil B4GAMBLE have, at man bliver ved med at spille?", "Nej. B4GAMBLE hjælper voksne, der har besluttet at spille, med at holde sig til regler, de selv har sat, og at stoppe eller holde pause er et lige så godt resultat. Programmet beder aldrig nogen om at indbetale, tage en bonus eller spille."],
      ["Hvad koster det?", "Ingenting. Programmet, guiderne og disse sider er gratis."],
    ],
  },
};

export function controlLocale(locale: SupportedLocale): ControlLocale {
  return (CONTROL_LOCALES as readonly string[]).includes(locale) ? locale as ControlLocale : "en-GB";
}

export function controlSharedMessages(locale: SupportedLocale): ControlSharedMessages {
  return shared[controlLocale(locale)];
}

/** The hub link's label in the visitor's own language, or null where the hub reads English. */
export function controlHubLinkLabel(locale: SupportedLocale, kind: "hubLink" | "moreLink" = "hubLink"): string | null {
  return controlLocale(locale) === locale ? shared[locale as ControlLocale][kind] : null;
}

export function gamblingControlHubMessages(locale: SupportedLocale): ControlHubMessages {
  return hub[controlLocale(locale)];
}

/** The links at the foot of an answer page: the hub, then the other two questions. */
export function controlRelatedLinks(locale: SupportedLocale, current: string): readonly ControlLink[] {
  const messages = gamblingControlHubMessages(locale);
  const questions = [CONTROL_PATHS.withoutQuitting, CONTROL_PATHS.tools, CONTROL_PATHS.trust] as const;
  return [
    { label: `${messages.titleLead} ${messages.titleEmphasis}`, href: CONTROL_PATHS.hub },
    ...messages.cards
      .filter((card) => (questions as readonly string[]).includes(card.path) && card.path !== current)
      .map((card) => ({ label: card.title, href: card.path })),
  ];
}
