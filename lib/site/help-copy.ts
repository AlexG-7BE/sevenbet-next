import type { SupportedLocale } from "@/lib/market/registry";
import { HELP_CANONICAL_ORIGIN, HELP_SITE_NAME } from "@/lib/site/host-gate";

/**
 * Every word the help site says that the main site does not (RFC-057 §6.5, §6.6, §8, §16.3,
 * §17, §17.1). It is one module so that the Founder, and the link guard, can read the help
 * host's whole voice in one place.
 *
 * Three languages, because the help site publishes Swedish, Danish and English (§4.1). A
 * visitor whose language is not one of the three reads the English text, as `/pause-plan` and
 * the control pages already do.
 *
 * **No B4GAMBLE wordmark and no B4GAMBLE logo anywhere** (Founder, Q2, 17 October 2026): the
 * site is called "Pause Plan". The only two places the name `b4gamble.com` may appear on this
 * host are the plain-text sentences of `/who-runs-this` and `/for-organisations` that say who
 * owns the site, and the support address on `/contact` until the help-domain mailbox of Q6
 * exists. Neither is ever a link (§6 rule 2), and `tests/help-site-shell.test.tsx` checks
 * exactly that.
 */
export type HelpLocale = "en-GB" | "sv-SE" | "da-DK";

export const HELP_LOCALES = ["en-GB", "sv-SE", "da-DK"] as const satisfies readonly HelpLocale[];

export function helpLocale(locale: SupportedLocale | string | null | undefined): HelpLocale {
  if (locale === "sv-SE" || locale === "da-DK") return locale;
  return "en-GB";
}

/** The owner, named the same way the Privacy Notice names it. */
export const HELP_OWNER = Object.freeze({
  legalName: "7BE Inc.",
  city: "New York",
  country: "United States",
  /** Plain text on the help host. Never a link, never a logo, never in JSON-LD (§6, §8). */
  otherSite: "b4gamble.com",
  privacyMailbox: "privacy@7be.io",
});

/** The help host, as copy prints it: no scheme, no trailing slash. */
export const HELP_HOST = new URL(HELP_CANONICAL_ORIGIN).host;

export const HELP_OWNER_PATH = "/who-runs-this";
export const HELP_ORGANISATIONS_PATH = "/for-organisations";
export const HELP_SHARE_IMAGE_PATH = "/help-share-image";

// ---------------------------------------------------------------------------
// §8 root metadata, and §6.5 the shell
// ---------------------------------------------------------------------------

export type HelpShellCopy = Readonly<{
  /** The document title and the social `siteName`. One name, never translated: it is the mark. */
  metadataTitle: string;
  metadataDescription: string;
  /** The one-sentence identity in JSON-LD, the help site's answer to BRAND_STATEMENT. */
  statement: string;
  homeLabel: string;
  navigation: Readonly<{ tenSteps: string; pausePlan: string; guides: string; help: string }>;
  footer: Readonly<{
    label: string;
    description: string;
    siteLinks: string;
    aboutThisSite: string;
    owner: string;
    organisations: string;
    legal: string;
    noTracking: string;
  }>;
  notFound: Readonly<{ title: string; body: string; home: string }>;
}>;

const shell: Readonly<Record<HelpLocale, HelpShellCopy>> = {
  "en-GB": {
    metadataTitle: `${HELP_SITE_NAME} | Free help to pause or take back control of your gambling`,
    metadataDescription: "A free ten-day pause plan, a ten-step programme and plain guides for anyone who wants to stop, pause or take back control of their gambling. No casinos, no adverts, no tracking.",
    statement: `${HELP_SITE_NAME} is a free pause plan and ten-step programme for adults who want to stop, pause or take back control of their gambling.`,
    homeLabel: `${HELP_SITE_NAME} home`,
    navigation: { tenSteps: "10 Steps", pausePlan: "Pause plan", guides: "Guides", help: "Help" },
    footer: {
      label: "Site footer",
      description: "Free help to pause or take back control of your gambling. Nothing here is for sale.",
      siteLinks: "On this site",
      aboutThisSite: "About this site",
      owner: "Who runs this site",
      organisations: "For organisations",
      legal: "Legal",
      noTracking: "This site sets no tracking cookies and carries no advertising.",
    },
    notFound: {
      title: "This page is not part of this site",
      body: "The address you followed is not one of ours. The pause plan is on the front page.",
      home: "Go to the pause plan",
    },
  },
  "sv-SE": {
    metadataTitle: `${HELP_SITE_NAME} | Gratis hjälp att pausa eller få kontroll över ditt spelande`,
    metadataDescription: "En gratis pausplan på tio dagar, ett program i tio steg och enkla guider för dig som vill sluta, pausa eller få tillbaka kontrollen över ditt spelande. Inga casinon, ingen reklam, ingen spårning.",
    statement: `${HELP_SITE_NAME} är en gratis pausplan och ett program i tio steg för vuxna som vill sluta, pausa eller få tillbaka kontrollen över sitt spelande.`,
    homeLabel: `${HELP_SITE_NAME} startsida`,
    navigation: { tenSteps: "10 steg", pausePlan: "Pausplan", guides: "Guider", help: "Hjälp" },
    footer: {
      label: "Sidfot",
      description: "Gratis hjälp att pausa eller få tillbaka kontrollen över ditt spelande. Ingenting här säljs.",
      siteLinks: "På den här sajten",
      aboutThisSite: "Om sajten",
      owner: "Vem driver sajten",
      organisations: "För organisationer",
      legal: "Juridik",
      noTracking: "Den här sajten sätter inga spårningskakor och har ingen reklam.",
    },
    notFound: {
      title: "Den här sidan finns inte på sajten",
      body: "Adressen du följde är inte vår. Pausplanen ligger på förstasidan.",
      home: "Gå till pausplanen",
    },
  },
  "da-DK": {
    metadataTitle: `${HELP_SITE_NAME} | Gratis hjælp til at holde pause eller få styr på dit spil`,
    metadataDescription: "En gratis pauseplan på ti dage, et program i ti trin og enkle guider til dig, der vil stoppe, holde pause eller få styr på dit spil igen. Ingen casinoer, ingen reklamer, ingen sporing.",
    statement: `${HELP_SITE_NAME} er en gratis pauseplan og et program i ti trin til voksne, der vil stoppe, holde pause eller få styr på deres spil igen.`,
    homeLabel: `${HELP_SITE_NAME} forside`,
    navigation: { tenSteps: "10 trin", pausePlan: "Pauseplan", guides: "Guider", help: "Hjælp" },
    footer: {
      label: "Sidefod",
      description: "Gratis hjælp til at holde pause eller få styr på dit spil igen. Intet her er til salg.",
      siteLinks: "På dette websted",
      aboutThisSite: "Om dette websted",
      owner: "Hvem står bag",
      organisations: "Til organisationer",
      legal: "Juridisk",
      noTracking: "Dette websted sætter ingen sporingscookies og har ingen reklamer.",
    },
    notFound: {
      title: "Denne side findes ikke på dette websted",
      body: "Adressen, du fulgte, er ikke vores. Pauseplanen ligger på forsiden.",
      home: "Gå til pauseplanen",
    },
  },
};

export function helpShellCopy(locale: SupportedLocale | string | null | undefined): HelpShellCopy {
  return shell[helpLocale(locale)];
}

// ---------------------------------------------------------------------------
// §17.1 the lines the main site prints that cannot be true here
// ---------------------------------------------------------------------------

/**
 * Every help page today ends with "B4GAMBLE earns commission from licensed casinos. This text
 * contains none." On this host the sentence is a contradiction with `/who-runs-this` point 2:
 * the site earns nothing. The replacement says the true thing — the company behind it also
 * runs a casino-comparison site — and points at the page that explains it, in plain words.
 */
const revenueLines: Readonly<Record<HelpLocale, string>> = {
  "en-GB": "This site is free and earns nothing: no casinos, no adverts, no affiliate links. The company behind it also runs a casino-comparison site.",
  "sv-SE": "Den här sajten är gratis och tjänar ingenting: inga casinon, ingen reklam, inga affiliatelänkar. Företaget bakom den driver också en jämförelsesajt för casinon.",
  "da-DK": "Dette websted er gratis og tjener ingenting: ingen casinoer, ingen reklamer, ingen affiliate-links. Firmaet bag driver også et sammenligningssite for casinoer.",
};

export function helpRevenueLine(locale: SupportedLocale | string | null | undefined) {
  return revenueLines[helpLocale(locale)];
}

/** The label on the link that follows the line above, to `/who-runs-this`. */
const revenueLinkLabels: Readonly<Record<HelpLocale, string>> = {
  "en-GB": "Who runs this site",
  "sv-SE": "Vem driver sajten",
  "da-DK": "Hvem står bag",
};

export function helpRevenueLinkLabel(locale: SupportedLocale | string | null | undefined) {
  return revenueLinkLabels[helpLocale(locale)];
}

/** The control pages' FAQ opens with "What is B4GAMBLE?" On this host the question is ours. */
const controlFaq: Readonly<Record<HelpLocale, readonly [string, string]>> = {
  "en-GB": [
    `What is ${HELP_SITE_NAME}?`,
    `${shell["en-GB"].statement} It is not a casino, it sells nothing and it links to no gambling site. It is run by ${HELP_OWNER.legalName}, which also runs a casino-comparison site; that is on a different address and nothing from here reaches it.`,
  ],
  "sv-SE": [
    `Vad är ${HELP_SITE_NAME}?`,
    `${shell["sv-SE"].statement} Det är inget casino, det säljer ingenting och det länkar inte till några spelsajter. Det drivs av ${HELP_OWNER.legalName}, som också driver en jämförelsesajt för casinon; den ligger på en annan adress, och ingenting härifrån går dit.`,
  ],
  "da-DK": [
    `Hvad er ${HELP_SITE_NAME}?`,
    `${shell["da-DK"].statement} Det er ikke et casino, det sælger ingenting, og det linker ikke til spilsider. Det drives af ${HELP_OWNER.legalName}, som også driver et sammenligningssite for casinoer; det ligger på en anden adresse, og intet herfra går derhen.`,
  ],
};

export function helpControlFaqEntry(locale: SupportedLocale | string | null | undefined) {
  return controlFaq[helpLocale(locale)];
}

/** The Learn hub's own description: no bonuses, no banking, no reviews (§4.1, §17.1). */
const learnHubDescriptions: Readonly<Record<HelpLocale, string>> = {
  "en-GB": "Plain-language guides about pausing, self-exclusion and keeping gambling under control.",
  "sv-SE": "Guider på vanlig svenska om att pausa, stänga av sig och hålla spelandet under kontroll.",
  "da-DK": "Guider i almindeligt sprog om at holde pause, udelukke sig selv og holde styr på spillet.",
};

export function helpLearnHubDescription(locale: SupportedLocale | string | null | undefined) {
  return learnHubDescriptions[helpLocale(locale)];
}

// ---------------------------------------------------------------------------
// §6.6 the main site's one quiet line to the help site
// ---------------------------------------------------------------------------

/**
 * Option B, the explicit one the RFC recommends: on a casino-comparison site a bare "Need
 * help?" reads as customer support for the site. One footer line, one link, `rel="nofollow"`,
 * and nothing else about the help site on any main-host page (§6.6). German is translated from
 * the chosen option, as §6.6 says; every other published language reads the English line.
 *
 * It is behind `HELP_SITE_REDIRECTS`, the phase-3 switch, so it is dark until the help routes
 * actually move. Shipping it before then would send people to a host that answers 404.
 */
const needHelpLines: Readonly<Record<string, string>> = {
  "en-GB": "Need help with your gambling? Free pause plan and 10-step programme →",
  "sv-SE": "Behöver du hjälp med ditt spelande? Gratis pausplan och 10-stegsprogram →",
  "da-DK": "Brug for hjælp med dit spil? Gratis pauseplan og 10-trinsprogram →",
  "de-DE": "Brauchst du Hilfe mit deinem Spielverhalten? Kostenloser Pausenplan und 10-Schritte-Programm →",
};

export function needHelpLine(locale: SupportedLocale | string | null | undefined) {
  return needHelpLines[String(locale)] ?? needHelpLines["en-GB"];
}

/** The help site's own language prefix for a main-host page's language, or its default. */
export function helpOriginPathForLocale(locale: SupportedLocale | string | null | undefined) {
  if (locale === "sv-SE") return "/sv";
  if (locale === "da-DK") return "/da";
  return "/";
}

// ---------------------------------------------------------------------------
// §17 the owner-disclosure page
// ---------------------------------------------------------------------------

export type HelpTextPage = Readonly<{
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  title: string;
  intro: string;
  sections: readonly Readonly<{ heading: string; paragraphs: readonly string[] }>[];
  /** The last line, with the contact route the page offers. */
  contactLead: string;
  contactLabel: string;
}>;

const ownerPage: Readonly<Record<HelpLocale, HelpTextPage>> = {
  "en-GB": {
    metadataTitle: `Who runs this site | ${HELP_SITE_NAME}`,
    metadataDescription: `Who owns ${HELP_SITE_NAME}, how the company earns its money, why there are no casino links here and what happens to what you write.`,
    eyebrow: "Straight answers",
    title: "Who runs this site",
    intro: "You are reading a site about gambling harm. You should know who wrote it and how they are paid before you trust a word of it. Here is all of it, in plain language.",
    sections: [
      {
        heading: "Who runs this site",
        paragraphs: [
          `${HELP_SITE_NAME} is run by ${HELP_OWNER.legalName}, a company registered in the ${HELP_OWNER.country}, at 447 Broadway, 2nd Floor, 1663, ${HELP_OWNER.city}, NY 10013.`,
          "It is not a gambling company, it holds no gambling licence, and it is not a charity or a public body.",
        ],
      },
      {
        heading: "How the company earns its money",
        paragraphs: [
          `${HELP_OWNER.legalName} also runs ${HELP_OWNER.otherSite}, a separate site that compares licensed online casinos. That site is paid a commission when a reader opens an account with an operator through one of its links. That is where the money comes from.`,
          "This site is not part of that. There is no casino, no bonus, no comparison and no partner link anywhere on it, and it earns nothing. We are not linking you to that other site from here; we are telling you it exists because you have a right to know who is behind this one.",
        ],
      },
      {
        heading: "The programme has no casino links",
        paragraphs: [
          "No step, screen, card, email or finished plan in the ten-step programme links to a casino, a bonus or a comparison page. It has been that way since 16 October 2026, and it is checked by an automatic test on every change, so it cannot come back by accident.",
        ],
      },
      {
        heading: "What you write never reaches the casino side",
        paragraphs: [
          "What you write in the programme, in a pause plan or in Help is never used to choose, rank, time or personalise any casino, any offer or any advertising, and it is never given to an operator or to an affiliate partner.",
          `Being honest about one thing that is not finished: until 17 October 2026, when a signed-in person pressed a partner link on ${HELP_OWNER.otherSite}, that press was stored against their account, and an internal weekly count put those presses next to programme steps. New presses no longer store the account and the count no longer includes them. The rows recorded before that change still carry the link until we clear them, and this page will say so until the day that job has run.`,
        ],
      },
      {
        heading: "What is stored, and where",
        paragraphs: [
          `Accounts, programme answers and pause reminders are stored in one database in the ${HELP_OWNER.country}, the same database the company's other site uses. There is a full answer for organisations, with every processor, every place data is held and every open question, on the page for organisations, and the legal detail is in the Privacy Notice.`,
        ],
      },
      {
        heading: "This site sets no tracking cookies",
        paragraphs: [
          "There is no Google tag, no advertising pixel and no analytics cookie on this site, so there is no cookie banner either. The only storage is what a page you asked for needs: signing in, your language and keeping your place in the programme.",
          "Because of that we cannot see who you are or what you read. We count how many people start the programme and nothing else.",
        ],
      },
      {
        heading: "What this site is not",
        paragraphs: [
          "It is not medical care, therapy, diagnosis or crisis support, and it blocks nothing. If gambling is already hurting your money, your sleep or the people around you, a national self-exclusion and a helpline are the right first step, and both are listed in Help.",
        ],
      },
    ],
    contactLead: "Something here wrong, missing or unclear? Tell us and we will fix it.",
    contactLabel: "Contact us",
  },
  "sv-SE": {
    metadataTitle: `Vem driver sajten | ${HELP_SITE_NAME}`,
    metadataDescription: `Vem som äger ${HELP_SITE_NAME}, hur företaget tjänar sina pengar, varför det inte finns några casinolänkar här och vad som händer med det du skriver.`,
    eyebrow: "Raka svar",
    title: "Vem driver sajten",
    intro: "Du läser en sajt om spelproblem. Då bör du få veta vem som har skrivit den och hur de får betalt innan du litar på ett enda ord. Här är allt, på vanlig svenska.",
    sections: [
      {
        heading: "Vem driver sajten",
        paragraphs: [
          `${HELP_SITE_NAME} drivs av ${HELP_OWNER.legalName}, ett företag registrerat i USA, på 447 Broadway, 2nd Floor, 1663, New York, NY 10013.`,
          "Det är inget spelbolag, det har ingen spellicens, och det är varken en ideell förening eller en myndighet.",
        ],
      },
      {
        heading: "Hur företaget tjänar sina pengar",
        paragraphs: [
          `${HELP_OWNER.legalName} driver också ${HELP_OWNER.otherSite}, en separat sajt som jämför licensierade casinon på nätet. Den sajten får provision när en läsare öppnar ett konto hos ett spelbolag via någon av dess länkar. Det är därifrån pengarna kommer.`,
          "Den här sajten är inte en del av det. Här finns inga casinon, inga bonusar, inga jämförelser och inga partnerlänkar, och den tjänar ingenting. Vi länkar dig inte dit härifrån; vi berättar att sajten finns, eftersom du har rätt att veta vem som står bakom den här.",
        ],
      },
      {
        heading: "Programmet har inga casinolänkar",
        paragraphs: [
          "Inget steg, ingen skärm, inget kort, inget mejl och ingen färdig plan i programmet med tio steg länkar till ett casino, en bonus eller en jämförelsesida. Så har det varit sedan den 16 oktober 2026, och det kontrolleras av ett automatiskt test vid varje ändring, så det kan inte komma tillbaka av misstag.",
        ],
      },
      {
        heading: "Det du skriver når aldrig casinosidan",
        paragraphs: [
          "Det du skriver i programmet, i en pausplan eller i Hjälp används aldrig för att välja, rangordna, tajma eller anpassa något casino, något erbjudande eller någon reklam, och det lämnas aldrig ut till ett spelbolag eller till en affiliatepartner.",
          `Ärligt om en sak som inte är klar: fram till den 17 oktober 2026 sparades det mot kontot när en inloggad person tryckte på en partnerlänk på ${HELP_OWNER.otherSite}, och en intern veckoräkning lade de trycken bredvid stegen i programmet. Nya tryck sparar inte längre kontot, och räkningen innehåller dem inte längre. Raderna som skrevs före ändringen har kvar kopplingen tills vi rensar dem, och den här sidan säger det tills det är gjort.`,
        ],
      },
      {
        heading: "Vad som sparas, och var",
        paragraphs: [
          "Konton, svar i programmet och påminnelser om pauser sparas i en databas i USA, samma databas som företagets andra sajt använder. Hela svaret för organisationer, med varje leverantör, varje plats där uppgifter ligger och varje öppen fråga, finns på sidan för organisationer, och det juridiska står i integritetspolicyn.",
        ],
      },
      {
        heading: "Sajten sätter inga spårningskakor",
        paragraphs: [
          "Det finns ingen Google-tagg, ingen annonspixel och ingen analyskaka på sajten, och därför inte heller någon kakruta. Det enda som lagras är det som sidan du bad om behöver: inloggning, ditt språk och din plats i programmet.",
          "Därför kan vi inte se vem du är eller vad du läser. Vi räknar hur många som börjar programmet, inget annat.",
        ],
      },
      {
        heading: "Vad sajten inte är",
        paragraphs: [
          "Den är inte vård, terapi, diagnos eller akut stöd, och den blockerar ingenting. Om spelandet redan går ut över pengarna, sömnen eller människorna omkring dig är Spelpaus och Stödlinjen rätt första steg, och båda finns under Hjälp.",
        ],
      },
    ],
    contactLead: "Är något fel, saknas eller är otydligt? Säg till, så rättar vi det.",
    contactLabel: "Kontakta oss",
  },
  "da-DK": {
    metadataTitle: `Hvem står bag | ${HELP_SITE_NAME}`,
    metadataDescription: `Hvem der ejer ${HELP_SITE_NAME}, hvordan firmaet tjener sine penge, hvorfor der ikke er casinolinks her, og hvad der sker med det, du skriver.`,
    eyebrow: "Klare svar",
    title: "Hvem står bag",
    intro: "Du læser et websted om spilproblemer. Så bør du vide, hvem der har skrevet det, og hvordan de får betalt, før du tror på et eneste ord. Her er det hele, i almindeligt sprog.",
    sections: [
      {
        heading: "Hvem står bag",
        paragraphs: [
          `${HELP_SITE_NAME} drives af ${HELP_OWNER.legalName}, et firma registreret i USA, på 447 Broadway, 2nd Floor, 1663, New York, NY 10013.`,
          "Det er ikke et spilselskab, det har ingen spillicens, og det er hverken en forening eller en offentlig myndighed.",
        ],
      },
      {
        heading: "Hvordan firmaet tjener sine penge",
        paragraphs: [
          `${HELP_OWNER.legalName} driver også ${HELP_OWNER.otherSite}, et separat site, der sammenligner licenserede onlinecasinoer. Det site får provision, når en læser opretter en konto hos en udbyder gennem et af dets links. Det er derfra, pengene kommer.`,
          "Dette websted er ikke en del af det. Her er ingen casinoer, ingen bonusser, ingen sammenligninger og ingen partnerlinks, og det tjener ingenting. Vi linker dig ikke derhen herfra; vi fortæller, at det findes, fordi du har ret til at vide, hvem der står bag dette.",
        ],
      },
      {
        heading: "Programmet har ingen casinolinks",
        paragraphs: [
          "Intet trin, ingen skærm, intet kort, ingen mail og ingen færdig plan i programmet med ti trin linker til et casino, en bonus eller en sammenligningsside. Sådan har det været siden den 16. oktober 2026, og det kontrolleres af en automatisk test ved hver ændring, så det kan ikke komme tilbage ved et uheld.",
        ],
      },
      {
        heading: "Det, du skriver, når aldrig casinosiden",
        paragraphs: [
          "Det, du skriver i programmet, i en pauseplan eller i Hjælp, bruges aldrig til at vælge, rangere, time eller tilpasse et casino, et tilbud eller en reklame, og det gives aldrig til en udbyder eller til en affiliatepartner.",
          `Ærligt om én ting, der ikke er færdig: indtil den 17. oktober 2026 blev det gemt på kontoen, når en logget ind person trykkede på et partnerlink på ${HELP_OWNER.otherSite}, og en intern ugentlig optælling satte de tryk ved siden af trinnene i programmet. Nye tryk gemmer ikke længere kontoen, og optællingen indeholder dem ikke længere. De rækker, der blev skrevet før ændringen, har stadig forbindelsen, indtil vi rydder dem, og denne side siger det, indtil det er gjort.`,
        ],
      },
      {
        heading: "Hvad der gemmes, og hvor",
        paragraphs: [
          "Konti, svar i programmet og påmindelser om pauser gemmes i én database i USA, den samme database som firmaets andet site bruger. Hele svaret til organisationer, med hver leverandør, hvert sted data ligger, og hvert åbent spørgsmål, står på siden til organisationer, og det juridiske står i privatlivspolitikken.",
        ],
      },
      {
        heading: "Dette websted sætter ingen sporingscookies",
        paragraphs: [
          "Der er intet Google-tag, ingen reklamepixel og ingen analysecookie på webstedet, og derfor heller ingen cookiebanner. Det eneste, der gemmes, er det, siden du bad om, har brug for: login, dit sprog og din plads i programmet.",
          "Derfor kan vi ikke se, hvem du er, eller hvad du læser. Vi tæller, hvor mange der starter programmet, og intet andet.",
        ],
      },
      {
        heading: "Hvad dette websted ikke er",
        paragraphs: [
          "Det er ikke behandling, terapi, diagnose eller akut hjælp, og det blokerer ingenting. Hvis spillet allerede går ud over din økonomi, din søvn eller menneskene omkring dig, er ROFUS og StopSpillet det rigtige første skridt, og begge står under Hjælp.",
        ],
      },
    ],
    contactLead: "Er noget forkert, mangler eller er uklart? Sig til, så retter vi det.",
    contactLabel: "Kontakt os",
  },
};

export function helpOwnerPage(locale: SupportedLocale | string | null | undefined): HelpTextPage {
  return ownerPage[helpLocale(locale)];
}

// ---------------------------------------------------------------------------
// §16.3 the data statement
// ---------------------------------------------------------------------------

/**
 * The page a help organisation, a blocker or a clinic reads before it decides whether to name
 * us. Every row of §16.2 is answered, and the gate of §16.3 is that an unresolved row is
 * written down as "not yet" rather than left out. The honest "we do not know yet" lines below
 * are those rows; they are removed one by one as the answers are established, and phase 4
 * (outreach) does not start while one of them is still a surprise.
 */
const organisationsPage: Readonly<Record<HelpLocale, HelpTextPage>> = {
  "en-GB": {
    metadataTitle: `For organisations | ${HELP_SITE_NAME}`,
    metadataDescription: `What a help service, clinic, blocker or regulator needs before naming ${HELP_SITE_NAME}: who owns it, what is stored, where, for how long, and what we cannot answer yet.`,
    eyebrow: "For organisations",
    title: "For organisations",
    intro: "This page is for a help service, clinic, blocker, charity or public body deciding whether to point people here. It answers what you would ask us, including the things we cannot answer yet. Nothing on it is marketing.",
    sections: [
      {
        heading: "Who you would be dealing with",
        paragraphs: [
          `${HELP_OWNER.legalName}, a company in the ${HELP_OWNER.country}, 447 Broadway, 2nd Floor, 1663, ${HELP_OWNER.city}, NY 10013. It is the data controller. It is a commercial company, not a charity: it also runs ${HELP_OWNER.otherSite}, a casino-comparison site that is paid commission by licensed operators. This site carries no casino, bonus or partner link and earns nothing.`,
          "We are saying this first because it is the thing most likely to stop you working with us, and you should not have to find it out later.",
        ],
      },
      {
        heading: "What this site collects",
        paragraphs: [
          "A person can read the pause plan, the guides and the helpline lists without an account, and we store nothing about them beyond ordinary server request logs.",
          "An account is needed only for the ten-step programme. It holds an email address or a Google sign-in, the answers the person writes in the steps, their progress, and an optional pause date and reminder email.",
          "Answers written in the programme may describe gambling, money worries and health. We treat them as sensitive. Optional personalisation by AI is off by default and is switched off entirely in production as of 12 October 2026.",
        ],
      },
      {
        heading: "Where it is stored, and by whom",
        paragraphs: [
          "One PostgreSQL database run by Prisma, hosted in the United States; application hosting by Vercel, United States; transactional email by Resend; staff email by Google Workspace; Google for optional sign-in. The same database holds the company's casino-comparison data. A separate database for help data is possible and is not in place today.",
          "Transfers out of the UK and the EU: Prighter Group is our Article 27 representative for the EU and the UK. We cannot yet show you a per-processor transfer mechanism and a signed data protection impact assessment. That is an honest gap, not a formality we are hiding, and we will say so in writing to anyone who asks.",
        ],
      },
      {
        heading: "What we never do",
        paragraphs: [
          "Programme, pause and Help information is never used to choose, rank, time or personalise any casino, offer or advertisement; never sold; and never given to a gambling operator or affiliate partner.",
          `One qualification, because it is still true as we write this: partner link presses made on ${HELP_OWNER.otherSite} before 17 October 2026 are stored against the account that made them. New presses are not, and the internal weekly count no longer reads them. Clearing the old rows is a separate job we have not yet run.`,
          "If you refer people to us, we will never send you anything that identifies them. The most we would ever share is a count.",
        ],
      },
      {
        heading: "Tracking",
        paragraphs: [
          "This site carries no Google tag, no advertising pixel and no analytics cookie, so it shows no cookie banner. The only storage is what a requested page needs: sign-in, language and programme continuity.",
        ],
      },
      {
        heading: "Keeping and deleting",
        paragraphs: [
          "Retention periods per category are set out in the Privacy Notice. A person can ask for a copy of their data, a correction, or deletion, and can withdraw consent at any time. Deletion requests are acted on; backups age out on their own schedule.",
          `Write to ${HELP_OWNER.privacyMailbox}.`,
        ],
      },
      {
        heading: "Security and age",
        paragraphs: [
          "HTTPS only, encrypted sign-in tokens, multi-factor authentication for staff access, backups and a written breach procedure. Access is limited to staff who need it; we have not yet published which internal screens can show a person's programme answers.",
          "The service is for adults. Age is self-declared at 18+; there is no identity check.",
        ],
      },
      {
        heading: "What we cannot answer yet",
        paragraphs: [
          "The exact hosting region of the database, per-processor transfer safeguards, a signed data protection impact assessment, registration with the UK Information Commissioner's Office, and which internal screens can display programme answers. We would rather list them than let you find them.",
        ],
      },
    ],
    contactLead: "Want this as a one-page document, or an answer to something that is not here?",
    contactLabel: "Contact us",
  },
  "sv-SE": {
    metadataTitle: `För organisationer | ${HELP_SITE_NAME}`,
    metadataDescription: `Vad en stödverksamhet, mottagning, blockerare eller myndighet behöver veta innan den nämner ${HELP_SITE_NAME}: vem som äger sajten, vad som sparas, var, hur länge och vad vi ännu inte kan svara på.`,
    eyebrow: "För organisationer",
    title: "För organisationer",
    intro: "Den här sidan är för en stödverksamhet, mottagning, blockerare, förening eller myndighet som överväger att hänvisa människor hit. Den svarar på det ni skulle fråga oss, också det vi ännu inte kan svara på. Ingenting här är marknadsföring.",
    sections: [
      {
        heading: "Vem ni skulle ha att göra med",
        paragraphs: [
          `${HELP_OWNER.legalName}, ett företag i USA, 447 Broadway, 2nd Floor, 1663, New York, NY 10013. Det är personuppgiftsansvarig. Det är ett kommersiellt företag, inte en ideell förening: det driver också ${HELP_OWNER.otherSite}, en jämförelsesajt för casinon som får provision av licensierade spelbolag. Den här sajten har inga casino-, bonus- eller partnerlänkar och tjänar ingenting.`,
          "Vi säger det först, eftersom det är det som mest sannolikt får er att avstå, och ni ska inte behöva upptäcka det i efterhand.",
        ],
      },
      {
        heading: "Vad sajten samlar in",
        paragraphs: [
          "Man kan läsa pausplanen, guiderna och listorna över stödlinjer utan konto, och då sparar vi ingenting om personen utöver vanliga serverloggar.",
          "Konto behövs bara för programmet med tio steg. Det innehåller en e-postadress eller en Google-inloggning, svaren personen skriver i stegen, hur långt hen har kommit och ett frivilligt pausdatum med påminnelse.",
          "Svaren i programmet kan handla om spelande, pengabekymmer och hälsa. Vi behandlar dem som känsliga. Frivillig anpassning med AI är av som standard och är helt avstängd i produktion sedan den 12 oktober 2026.",
        ],
      },
      {
        heading: "Var det sparas, och hos vem",
        paragraphs: [
          "En PostgreSQL-databas som drivs av Prisma, placerad i USA; drift av Vercel, USA; utskick av e-post via Resend; personalens e-post i Google Workspace; Google för frivillig inloggning. Samma databas innehåller företagets casinojämförelser. En egen databas för hjälpdata är möjlig men finns inte i dag.",
          "Överföringar ut ur Storbritannien och EU: Prighter Group är vår representant enligt artikel 27 för EU och Storbritannien. Vi kan ännu inte visa er en överföringsmekanism per leverantör eller en undertecknad konsekvensbedömning. Det är en verklig lucka, inte en formalitet vi döljer, och vi skriver det till den som frågar.",
        ],
      },
      {
        heading: "Vad vi aldrig gör",
        paragraphs: [
          "Uppgifter från programmet, pausplanen och Hjälp används aldrig för att välja, rangordna, tajma eller anpassa något casino, erbjudande eller reklam; säljs aldrig; och lämnas aldrig till ett spelbolag eller en affiliatepartner.",
          `En reservation, eftersom den fortfarande gäller när vi skriver det här: tryck på partnerlänkar som gjordes på ${HELP_OWNER.otherSite} före den 17 oktober 2026 är sparade mot kontot som gjorde dem. Nya tryck är det inte, och den interna veckoräkningen läser dem inte längre. Att rensa de gamla raderna är ett separat arbete som vi ännu inte har gjort.`,
          "Om ni hänvisar människor till oss skickar vi aldrig något till er som pekar ut dem. Det mesta vi någonsin skulle dela är ett antal.",
        ],
      },
      {
        heading: "Spårning",
        paragraphs: [
          "Sajten har ingen Google-tagg, ingen annonspixel och ingen analyskaka, och därför ingen kakruta. Det enda som lagras är det som en begärd sida behöver: inloggning, språk och din plats i programmet.",
        ],
      },
      {
        heading: "Hur länge, och radering",
        paragraphs: [
          "Lagringstider per kategori står i integritetspolicyn. Man kan begära ett utdrag, en rättelse eller radering, och återkalla samtycke när som helst. Raderingar utförs; säkerhetskopior går ut enligt sin egen plan.",
          `Skriv till ${HELP_OWNER.privacyMailbox}.`,
        ],
      },
      {
        heading: "Säkerhet och ålder",
        paragraphs: [
          "Bara HTTPS, krypterade inloggningstoken, tvåstegsverifiering för personalens åtkomst, säkerhetskopior och en skriftlig rutin vid incidenter. Åtkomsten är begränsad till personal som behöver den; vi har ännu inte publicerat vilka interna vyer som kan visa en persons svar i programmet.",
          "Tjänsten är för vuxna. Åldern uppges av personen själv, 18+; det finns ingen identitetskontroll.",
        ],
      },
      {
        heading: "Vad vi ännu inte kan svara på",
        paragraphs: [
          "Exakt var databasen ligger, överföringsgarantier per leverantör, en undertecknad konsekvensbedömning, registrering hos den brittiska tillsynsmyndigheten och vilka interna vyer som kan visa svaren i programmet. Vi listar dem hellre än låter er hitta dem.",
        ],
      },
    ],
    contactLead: "Vill ni ha det här som ett dokument på en sida, eller svar på något som inte står här?",
    contactLabel: "Kontakta oss",
  },
  "da-DK": {
    metadataTitle: `Til organisationer | ${HELP_SITE_NAME}`,
    metadataDescription: `Hvad et behandlingstilbud, en klinik, en blokering eller en myndighed har brug for, før den nævner ${HELP_SITE_NAME}: hvem der ejer det, hvad der gemmes, hvor, hvor længe, og hvad vi endnu ikke kan svare på.`,
    eyebrow: "Til organisationer",
    title: "Til organisationer",
    intro: "Denne side er til et behandlingstilbud, en klinik, en blokering, en forening eller en myndighed, der overvejer at henvise folk hertil. Den svarer på det, I ville spørge os om, også det, vi endnu ikke kan svare på. Intet her er markedsføring.",
    sections: [
      {
        heading: "Hvem I ville have med at gøre",
        paragraphs: [
          `${HELP_OWNER.legalName}, et firma i USA, 447 Broadway, 2nd Floor, 1663, New York, NY 10013. Det er dataansvarlig. Det er et kommercielt firma, ikke en forening: det driver også ${HELP_OWNER.otherSite}, et sammenligningssite for casinoer, der får provision af licenserede udbydere. Dette websted har ingen casino-, bonus- eller partnerlinks og tjener ingenting.`,
          "Vi siger det først, fordi det er det, der mest sandsynligt får jer til at sige nej, og I skal ikke opdage det bagefter.",
        ],
      },
      {
        heading: "Hvad webstedet indsamler",
        paragraphs: [
          "Man kan læse pauseplanen, guiderne og listerne over hjælpelinjer uden konto, og så gemmer vi intet om personen ud over almindelige serverlogfiler.",
          "Konto er kun nødvendig til programmet med ti trin. Det indeholder en mailadresse eller et Google-login, de svar personen skriver i trinnene, hvor langt vedkommende er nået, og en frivillig pausedato med påmindelse.",
          "Svarene i programmet kan handle om spil, pengeproblemer og helbred. Vi behandler dem som følsomme. Frivillig tilpasning med AI er slået fra som standard og er helt slået fra i produktion siden den 12. oktober 2026.",
        ],
      },
      {
        heading: "Hvor det gemmes, og hos hvem",
        paragraphs: [
          "Én PostgreSQL-database drevet af Prisma, placeret i USA; drift hos Vercel, USA; mails via Resend; medarbejdermail i Google Workspace; Google til frivilligt login. Den samme database indeholder firmaets casinosammenligninger. En separat database til hjælpedata er mulig, men findes ikke i dag.",
          "Overførsler ud af Storbritannien og EU: Prighter Group er vores repræsentant efter artikel 27 for EU og Storbritannien. Vi kan endnu ikke vise jer en overførselsmekanisme pr. leverandør eller en underskrevet konsekvensanalyse. Det er et reelt hul, ikke en formalitet, vi skjuler, og vi skriver det til enhver, der spørger.",
        ],
      },
      {
        heading: "Hvad vi aldrig gør",
        paragraphs: [
          "Oplysninger fra programmet, pauseplanen og Hjælp bruges aldrig til at vælge, rangere, time eller tilpasse et casino, et tilbud eller en reklame; sælges aldrig; og gives aldrig til en spiludbyder eller en affiliatepartner.",
          `Ét forbehold, fordi det stadig gælder, mens vi skriver dette: tryk på partnerlinks foretaget på ${HELP_OWNER.otherSite} før den 17. oktober 2026 er gemt på den konto, der foretog dem. Nye tryk er ikke, og den interne ugentlige optælling læser dem ikke længere. At rydde de gamle rækker er et separat stykke arbejde, vi endnu ikke har udført.`,
          "Hvis I henviser folk til os, sender vi aldrig noget til jer, der peger på dem. Det mest, vi nogensinde ville dele, er et antal.",
        ],
      },
      {
        heading: "Sporing",
        paragraphs: [
          "Webstedet har intet Google-tag, ingen reklamepixel og ingen analysecookie, og derfor ingen cookiebanner. Det eneste, der gemmes, er det, en ønsket side har brug for: login, sprog og din plads i programmet.",
        ],
      },
      {
        heading: "Opbevaring og sletning",
        paragraphs: [
          "Opbevaringsperioder pr. kategori står i privatlivspolitikken. Man kan bede om en kopi af sine data, en rettelse eller sletning og trække sit samtykke tilbage når som helst. Sletninger udføres; sikkerhedskopier udløber efter deres egen plan.",
          `Skriv til ${HELP_OWNER.privacyMailbox}.`,
        ],
      },
      {
        heading: "Sikkerhed og alder",
        paragraphs: [
          "Kun HTTPS, krypterede login-tokens, to-faktor-login for medarbejderadgang, sikkerhedskopier og en skriftlig procedure ved brud. Adgang er begrænset til medarbejdere, der har brug for den; vi har endnu ikke offentliggjort, hvilke interne skærme der kan vise en persons svar i programmet.",
          "Tjenesten er for voksne. Alderen oplyses af personen selv, 18+; der er ingen identitetskontrol.",
        ],
      },
      {
        heading: "Hvad vi endnu ikke kan svare på",
        paragraphs: [
          "Databasens præcise placering, overførselsgarantier pr. leverandør, en underskrevet konsekvensanalyse, registrering hos den britiske tilsynsmyndighed, og hvilke interne skærme der kan vise svar fra programmet. Vi lister dem hellere, end at I skal finde dem.",
        ],
      },
    ],
    contactLead: "Vil I have dette som et dokument på én side eller svar på noget, der ikke står her?",
    contactLabel: "Kontakt os",
  },
};

export function helpOrganisationsPage(locale: SupportedLocale | string | null | undefined): HelpTextPage {
  return organisationsPage[helpLocale(locale)];
}

// ---------------------------------------------------------------------------
// §8 the hardcoded `b4gamble.com` strings that help pages print
// ---------------------------------------------------------------------------

/**
 * Four help pages print the main site's address inside their own copy: the message `/beside`
 * offers to copy, the calendar entry `/pause-plan` writes and the visible link text on
 * `/beside`. On the help host those must name the help site, or a person who follows the
 * instruction we gave them lands on a casino-comparison site (§8, §6 rule 1).
 *
 * A replacement on the rendered string rather than a second set of translations: the sentence
 * around it is the same in both places, and two copies of it would drift.
 */
export function withHelpOrigin(text: string, site: "help" | "main") {
  return site === "help" ? text.replaceAll(HELP_OWNER.otherSite, HELP_HOST) : text;
}

// ---------------------------------------------------------------------------
// §6.5 the links help pages carry today, and what they become on the help host
// ---------------------------------------------------------------------------

/**
 * The commercial destinations that help pages link today, mapped to the help site's own page
 * or to nothing at all (RFC-057 §6.5). `/about`, `/can-you-trust-b4gamble` and
 * `/affiliate-disclosure` all answer the same question for a different reader, so on this
 * host they are one page: `/who-runs-this`. `/methodology` has no help equivalent — the help
 * site publishes one Learn category and the editorial policy belongs to the other site — so
 * its link is not rendered.
 *
 * A route not named here is simply not linked from a help page; the link guard of
 * `tests/help-site-shell.test.tsx` is what proves that, by reading the response rather than
 * trusting this table.
 */
const HELP_PATH_REWRITES: Readonly<Record<string, string | null>> = {
  "/about": HELP_OWNER_PATH,
  "/affiliate-disclosure": HELP_OWNER_PATH,
  "/can-you-trust-b4gamble": HELP_OWNER_PATH,
  "/faq": null,
  "/methodology": null,
};

/**
 * The path a help page should use for a link it would otherwise point at a commercial route.
 * `null` means the link is not rendered at all. On the main host every href is returned
 * unchanged, so no main-site surface moves.
 */
export function helpRoutePath(href: string, site: "help" | "main"): string | null {
  if (site !== "help") return href;
  const path = href.split(/[?#]/, 1)[0] || href;
  if (!(path in HELP_PATH_REWRITES)) return href;
  const replacement = HELP_PATH_REWRITES[path];
  return replacement === null ? null : href.replace(path, replacement);
}

/** The label of the owner link where a page used to say "Can you trust B4GAMBLE…". */
const trustCardCopy: Readonly<Record<HelpLocale, Readonly<{ title: string; body: string }>>> = {
  "en-GB": {
    title: "Who runs this site, and how is it paid for?",
    body: "The owner, where the money comes from, why there are no casino links here, and what happens to what you write.",
  },
  "sv-SE": {
    title: "Vem driver sajten, och vem betalar för den?",
    body: "Ägaren, varifrån pengarna kommer, varför det inte finns några casinolänkar här och vad som händer med det du skriver.",
  },
  "da-DK": {
    title: "Hvem står bag, og hvem betaler for det?",
    body: "Ejeren, hvor pengene kommer fra, hvorfor der ikke er casinolinks her, og hvad der sker med det, du skriver.",
  },
};

export function helpTrustCardCopy(locale: SupportedLocale | string | null | undefined) {
  return trustCardCopy[helpLocale(locale)];
}
