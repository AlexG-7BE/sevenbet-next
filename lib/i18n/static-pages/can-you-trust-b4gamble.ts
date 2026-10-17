import type { SupportedLocale } from "@/lib/market/registry";
import { BRAND_STATEMENT, controlLocale, type ControlFaq, type ControlLocale } from "./gambling-control";
import { currentProgrammeJourney } from "./ten-steps";

/**
 * Copy for /can-you-trust-b4gamble (Founder decision, 15 October 2026). Every sentence about
 * B4GAMBLE's own behaviour states what the code does on that date:
 *
 * - commission: app/(public)/affiliate-disclosure (qualifying action, no charge to the reader,
 *   no effect on the Editor Score) and lib/i18n/product-pages-catalog.ts (casinos and offers we
 *   can link to from the reader's country are listed first, then by Editor Score);
 * - casino pages and the Programme: docs/07_Decisions/COMMERCIAL-MENU-FOR-EVERYONE-2026-10-17.md
 *   (the menu links to the casino, bonus and offer pages from every public page) and
 *   docs/07_Decisions/PROGRAMME-NO-CASINO-LINKS-2026-10-16.md (no Programme screen, card or letter
 *   links to a casino, bonus or offer page; no step changes the menu);
 * - privacy: app/(public)/privacy/page.tsx and lib/analytics (Google Analytics on every page
 *   except Help, the self-check and Admin, signals and ad personalisation off, no custom events).
 *
 * The step names come from the Programme catalogue, so a renamed step renames itself here.
 */
export type TrustSection = Readonly<{ id: string; heading: string; paragraphs?: readonly string[]; items?: readonly string[] }>;

export type TrustMessages = Readonly<{
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  titleLead: string;
  titleEmphasis: string;
  answer: string;
  sections: readonly TrustSection[];
  linksHeading: string;
  links: readonly Readonly<{ path: string; label: string }>[];
  faq: ControlFaq;
  breadcrumbLabel: string;
}>;

function stepTitle(locale: ControlLocale, step: number) {
  return currentProgrammeJourney(locale)[step - 1].title;
}

function en(): TrustMessages {
  const stepThree = stepTitle("en-GB", 3);
  return {
    metadataTitle: "Can you trust B4GAMBLE if it earns money from casinos? | B4GAMBLE",
    metadataDescription: "How B4GAMBLE earns commission from licensed casinos, what is free, what it does not do, when casino pages appear in its Programme and what stays private.",
    eyebrow: "How B4GAMBLE earns",
    titleLead: "Can you trust B4GAMBLE",
    titleEmphasis: "if it earns money from casinos?",
    answer: `Judge it by what you can check. ${BRAND_STATEMENT["en-GB"]} It earns its money from commission that licensed casinos pay when someone signs up or deposits through one of its links. Below is how that works, what B4GAMBLE does not do, when casino pages appear and what stays private, as the site actually behaves today.`,
    sections: [
      {
        id: "earnings",
        heading: "How B4GAMBLE earns money",
        paragraphs: [
          "Some links on the casino and bonus pages are affiliate links, and they are labelled as such. When a person follows one and then signs up or deposits, the casino or its affiliate network may pay a commission to 7BE Inc., the company behind B4GAMBLE. It costs you nothing extra.",
          "Commission never changes an editor score. It does change the order in one way: casinos and offers that B4GAMBLE can link to from your country are listed first, and within each group the editor score sets the order.",
          "If you never sign up with a casino through B4GAMBLE, it earns nothing from you. So B4GAMBLE has a commercial interest in casino sign-ups, and that is why the rules on this page are fixed and can be checked.",
        ],
      },
      {
        id: "free",
        heading: "What is free",
        items: [
          "The 10-step Programme: free, with no paywall and nothing to buy inside it.",
          "You can begin without an account. To save your Starting Point and carry on, you create a free account with Google or email.",
          "The guides, the pause plan, the casino reviews and these answer pages are free to read.",
        ],
      },
      {
        id: "does-not",
        heading: "What B4GAMBLE does not do",
        items: [
          "It is not a casino. It takes no deposits and accepts no bets.",
          "It does not block gambling sites or apps. For that, use a self-exclusion or blocking software.",
          "It is not treatment, and it does not diagnose anyone.",
          "No step of the Programme asks you to deposit, claim a bonus or play, and no step rewards it.",
          "It does not sell personal data.",
        ],
      },
      {
        id: "casino-pages",
        heading: "The Programme shows no casino pages",
        paragraphs: [
          "The casino, bonus and offer pages are public. The site menu links to them from every page, for everyone: this is a site for adults who already gamble and are choosing where to play.",
          `Inside the Programme there is none of that. The Programme links to no casino, bonus or offer page, and finishing a step changes nothing in the menu. Step 3, “${stepThree}”, helps you choose one person or one help service and plan the first 10 minutes of an urge.`,
          "Nothing you write or choose in the Programme changes which casinos or offers the site shows, or their order.",
          "Offers appear only where the law allows them, and only from casinos licensed for your country.",
        ],
      },
      {
        id: "private",
        heading: "What stays private",
        paragraphs: [
          "The Programme keeps what you choose to save – your Starting Point, your plan and your progress – on your account, so you can come back to it. None of it is used to choose, rank or personalise casinos, bonuses, affiliate links or ads.",
          "Google Analytics counts visits to the site's pages, the Programme's included, unless you choose “Reject cookies”. It receives none of your answers, it never runs on the Help pages, and its advertising features are switched off.",
          "You can ask for a copy of your data, or for it to be deleted, at privacy@7be.io.",
        ],
      },
    ],
    linksHeading: "Read the full rules",
    links: [
      { path: "/affiliate-disclosure", label: "Affiliate disclosure" },
      { path: "/methodology", label: "How casinos are reviewed" },
      { path: "/privacy", label: "Privacy notice" },
    ],
    faq: [
      ["How does B4GAMBLE make money?", "From commission. When someone follows a labelled affiliate link and signs up or deposits with a licensed casino, the casino or its affiliate network may pay B4GAMBLE. The Programme itself is free and sells nothing."],
      ["Does commission change the scores?", "No. Commission never changes an editor score. Casinos and offers that B4GAMBLE can link to from your country are listed first; within each group the editor score sets the order."],
      ["Will the Programme push me towards a casino?", `No. No step asks you to deposit, claim a bonus or play, and no screen of the Programme links to a casino, bonus or offer page. Step 3, “${stepThree}”, ends with your own support card: one person, one help service and how to reach it. It opens nothing in the menu.`],
      ["Are my Programme answers shared with casinos?", "No. B4GAMBLE does not sell personal data, and your Programme answers are not used to choose, rank or personalise casinos, offers, affiliate links or ads."],
      ["Who runs B4GAMBLE?", "7BE Inc., a company in New York, trading as B4GAMBLE."],
    ],
    breadcrumbLabel: "Can you trust B4GAMBLE?",
  };
}

function sv(): TrustMessages {
  const stepThree = stepTitle("sv-SE", 3);
  return {
    metadataTitle: "Kan man lita på B4GAMBLE när sajten tjänar pengar på casinon? | B4GAMBLE",
    metadataDescription: "Hur B4GAMBLE tjänar provision från licensierade casinon, vad som är gratis, vad sajten inte gör, när casinosidor visas i programmet och vad som stannar hos dig.",
    eyebrow: "Så tjänar B4GAMBLE pengar",
    titleLead: "Kan man lita på B4GAMBLE",
    titleEmphasis: "när sajten tjänar pengar på casinon?",
    answer: `Bedöm sajten efter det du själv kan kontrollera. ${BRAND_STATEMENT["sv-SE"]} Pengarna kommer från provision som licensierade casinon betalar när någon registrerar sig eller sätter in pengar via en av sajtens länkar. Här står hur det går till, vad B4GAMBLE inte gör, när casinosidor visas och vad som stannar hos dig – så som sajten faktiskt fungerar i dag.`,
    sections: [
      {
        id: "earnings",
        heading: "Så tjänar B4GAMBLE pengar",
        paragraphs: [
          "En del länkar på casino- och bonussidorna är affiliatelänkar, och de är märkta som det. När någon följer en sådan länk och sedan registrerar sig eller sätter in pengar kan casinot eller dess affiliatenätverk betala provision till 7BE Inc., företaget bakom B4GAMBLE. Det kostar dig ingenting extra.",
          "Provision ändrar aldrig redaktionens betyg. Den påverkar ordningen på ett sätt: casinon och erbjudanden som B4GAMBLE kan länka till från ditt land visas först, och inom varje grupp avgör redaktionens betyg ordningen.",
          "Om du aldrig registrerar dig hos ett casino via B4GAMBLE tjänar sajten ingenting på dig. B4GAMBLE har alltså ett kommersiellt intresse av att folk registrerar sig hos casinon, och därför är reglerna på den här sidan fasta och går att kontrollera.",
        ],
      },
      {
        id: "free",
        heading: "Det här är gratis",
        items: [
          "Programmet i 10 steg: gratis, utan betalvägg och utan något att köpa.",
          "Du kan börja utan konto. För att spara din startpunkt och fortsätta skapar du ett gratis konto med Google eller e-post.",
          "Guiderna, pausplanen, casinorecensionerna och de här svarssidorna är gratis att läsa.",
        ],
      },
      {
        id: "does-not",
        heading: "Det här gör B4GAMBLE inte",
        items: [
          "B4GAMBLE är inget casino. Sajten tar inte emot insättningar eller insatser.",
          "Sajten blockerar inga spelsajter eller appar. Till det finns Spelpaus och blockeringsprogram.",
          "Det är ingen behandling, och sajten ställer inga diagnoser.",
          "Inget steg i programmet ber dig sätta in pengar, ta en bonus eller spela, och inget steg belönar det.",
          "B4GAMBLE säljer inga personuppgifter.",
        ],
      },
      {
        id: "casino-pages",
        heading: "Programmet visar inga casinosidor",
        paragraphs: [
          "Sidorna om casinon, bonusar och erbjudanden är öppna för alla. Menyn länkar till dem från varje sida, för alla: det här är en sajt för vuxna som redan spelar och ska välja var de spelar.",
          `Inne i programmet finns inget av det. Programmet länkar inte till några sidor om casinon, bonusar eller erbjudanden, och när du gör klart ett steg ändras ingenting i menyn. Steg 3, ”${stepThree}”, hjälper dig att välja en person eller ett stöd och planera de första 10 minuterna när suget kommer.`,
          "Det du skriver eller väljer i programmet påverkar inte vilka casinon eller erbjudanden sajten visar, eller i vilken ordning.",
          "Erbjudanden visas bara där lagen tillåter det, och bara från casinon med licens för ditt land.",
        ],
      },
      {
        id: "private",
        heading: "Det här stannar hos dig",
        paragraphs: [
          "Programmet sparar det du själv väljer att spara – din startpunkt, din plan och hur långt du har kommit – på ditt konto, så att du kan komma tillbaka till det. Inget av det används för att välja, rangordna eller anpassa casinon, bonusar, affiliatelänkar eller annonser.",
          "Google Analytics räknar besök på sajtens sidor, även programmets, om du inte väljer ”Avvisa cookies”. Verktyget får inga av dina svar, körs aldrig på hjälpsidorna, och dess annonsfunktioner är avstängda.",
          "Du kan be om en kopia av dina uppgifter, eller om att de raderas, via privacy@7be.io.",
        ],
      },
    ],
    linksHeading: "Läs hela reglerna",
    links: [
      { path: "/affiliate-disclosure", label: "Om affiliatelänkar (på engelska)" },
      { path: "/methodology", label: "Så granskas casinon" },
      { path: "/privacy", label: "Integritetspolicy (på engelska)" },
    ],
    faq: [
      ["Hur tjänar B4GAMBLE pengar?", "På provision. När någon följer en märkt affiliatelänk och registrerar sig eller sätter in pengar hos ett licensierat casino kan casinot eller dess affiliatenätverk betala B4GAMBLE. Själva programmet är gratis och säljer ingenting."],
      ["Ändrar provisionen betygen?", "Nej. Provision ändrar aldrig redaktionens betyg. Casinon och erbjudanden som B4GAMBLE kan länka till från ditt land visas först; inom varje grupp avgör betyget ordningen."],
      ["Knuffar programmet mig mot ett casino?", `Nej. Inget steg ber dig sätta in pengar, ta en bonus eller spela, och ingen skärm i programmet länkar till sidor om casinon, bonusar eller erbjudanden. Steg 3, ”${stepThree}”, slutar med ditt eget stödkort: en person, ett stöd och hur du når det. Det öppnar ingenting i menyn.`],
      ["Delas mina svar i programmet med casinon?", "Nej. B4GAMBLE säljer inga personuppgifter, och dina svar i programmet används inte för att välja, rangordna eller anpassa casinon, erbjudanden, affiliatelänkar eller annonser."],
      ["Vem driver B4GAMBLE?", "7BE Inc., ett företag i New York, under namnet B4GAMBLE."],
    ],
    breadcrumbLabel: "Kan man lita på B4GAMBLE?",
  };
}

function da(): TrustMessages {
  const stepThree = stepTitle("da-DK", 3);
  return {
    metadataTitle: "Kan man stole på B4GAMBLE, når siden tjener penge på casinoer? | B4GAMBLE",
    metadataDescription: "Hvordan B4GAMBLE tjener provision fra licenserede casinoer, hvad der er gratis, hvad siden ikke gør, hvornår casinosider vises i programmet, og hvad der forbliver privat.",
    eyebrow: "Sådan tjener B4GAMBLE penge",
    titleLead: "Kan man stole på B4GAMBLE,",
    titleEmphasis: "når siden tjener penge på casinoer?",
    answer: `Bedøm siden ud fra det, du selv kan tjekke. ${BRAND_STATEMENT["da-DK"]} Pengene kommer fra provision, som licenserede casinoer betaler, når nogen opretter en konto eller indbetaler via et af sidens links. Her står, hvordan det foregår, hvad B4GAMBLE ikke gør, hvornår casinosider vises, og hvad der forbliver privat – sådan som siden faktisk fungerer i dag.`,
    sections: [
      {
        id: "earnings",
        heading: "Sådan tjener B4GAMBLE penge",
        paragraphs: [
          "Nogle links på casino- og bonussiderne er affiliatelinks, og de er markeret som sådan. Når nogen følger et af dem og derefter opretter en konto eller indbetaler, kan casinoet eller dets affiliatenetværk betale provision til 7BE Inc., virksomheden bag B4GAMBLE. Det koster dig ikke noget ekstra.",
          "Provision ændrer aldrig redaktionens karakter. Den påvirker rækkefølgen på én måde: casinoer og tilbud, som B4GAMBLE kan linke til fra dit land, vises først, og inden for hver gruppe afgør redaktionens karakter rækkefølgen.",
          "Hvis du aldrig opretter en konto hos et casino via B4GAMBLE, tjener siden ingenting på dig. B4GAMBLE har altså en kommerciel interesse i, at folk opretter sig hos casinoer, og derfor er reglerne på denne side faste og til at kontrollere.",
        ],
      },
      {
        id: "free",
        heading: "Det her er gratis",
        items: [
          "Programmet i 10 trin: gratis, uden betalingsmur og uden noget at købe.",
          "Du kan begynde uden konto. For at gemme dit udgangspunkt og fortsætte opretter du en gratis konto med Google eller e-mail.",
          "Guiderne, pauseplanen, casinoanmeldelserne og disse svarsider er gratis at læse.",
        ],
      },
      {
        id: "does-not",
        heading: "Det her gør B4GAMBLE ikke",
        items: [
          "B4GAMBLE er ikke et casino. Siden tager ikke imod indbetalinger eller indsatser.",
          "Siden blokerer ingen spilsider eller apps. Til det findes ROFUS og blokeringsprogrammer.",
          "Det er ikke behandling, og siden stiller ingen diagnoser.",
          "Intet trin i programmet beder dig om at indbetale, tage en bonus eller spille, og intet trin belønner det.",
          "B4GAMBLE sælger ikke personoplysninger.",
        ],
      },
      {
        id: "casino-pages",
        heading: "Programmet viser ingen casinosider",
        paragraphs: [
          "Siderne om casinoer, bonusser og tilbud er åbne for alle. Menuen linker til dem fra hver side, for alle: det her er en side for voksne, der allerede spiller og skal vælge, hvor de spiller.",
          `Inde i programmet er der intet af det. Programmet linker ikke til sider om casinoer, bonusser eller tilbud, og når du gennemfører et trin, ændres intet i menuen. Trin 3, ”${stepThree}”, hjælper dig med at vælge én person eller ét hjælpetilbud og planlægge de første 10 minutter, når trangen kommer.`,
          "Det, du skriver eller vælger i programmet, har ingen betydning for, hvilke casinoer eller tilbud siden viser, eller for rækkefølgen.",
          "Tilbud vises kun, hvor loven tillader det, og kun fra casinoer med licens til dit land.",
        ],
      },
      {
        id: "private",
        heading: "Det her forbliver privat",
        paragraphs: [
          "Programmet gemmer det, du selv vælger at gemme – dit udgangspunkt, din plan og hvor langt du er nået – på din konto, så du kan vende tilbage til det. Intet af det bruges til at vælge, rangere eller tilpasse casinoer, bonusser, affiliatelinks eller reklamer.",
          "Google Analytics tæller besøg på sidens sider, også programmets, medmindre du vælger ”Afvis cookies”. Værktøjet får ingen af dine svar, kører aldrig på hjælpesiderne, og dets reklamefunktioner er slået fra.",
          "Du kan bede om en kopi af dine oplysninger, eller om at de bliver slettet, via privacy@7be.io.",
        ],
      },
    ],
    linksHeading: "Læs alle reglerne",
    links: [
      { path: "/affiliate-disclosure", label: "Om affiliatelinks (på engelsk)" },
      { path: "/methodology", label: "Sådan bliver casinoer vurderet" },
      { path: "/privacy", label: "Privatlivspolitik (på engelsk)" },
    ],
    faq: [
      ["Hvordan tjener B4GAMBLE penge?", "På provision. Når nogen følger et markeret affiliatelink og opretter en konto eller indbetaler hos et licenseret casino, kan casinoet eller dets affiliatenetværk betale B4GAMBLE. Selve programmet er gratis og sælger ingenting."],
      ["Ændrer provisionen karaktererne?", "Nej. Provision ændrer aldrig redaktionens karakter. Casinoer og tilbud, som B4GAMBLE kan linke til fra dit land, vises først; inden for hver gruppe afgør karakteren rækkefølgen."],
      ["Skubber programmet mig hen mod et casino?", `Nej. Intet trin beder dig om at indbetale, tage en bonus eller spille, og ingen skærm i programmet linker til sider om casinoer, bonusser eller tilbud. Trin 3, ”${stepThree}”, slutter med dit eget støttekort: én person, ét hjælpetilbud og hvordan du får fat i det. Det åbner intet i menuen.`],
      ["Deles mine svar i programmet med casinoer?", "Nej. B4GAMBLE sælger ikke personoplysninger, og dine svar i programmet bruges ikke til at vælge, rangere eller tilpasse casinoer, tilbud, affiliatelinks eller reklamer."],
      ["Hvem driver B4GAMBLE?", "7BE Inc., en virksomhed i New York, under navnet B4GAMBLE."],
    ],
    breadcrumbLabel: "Kan man stole på B4GAMBLE?",
  };
}

const catalog: Readonly<Record<ControlLocale, () => TrustMessages>> = { "en-GB": en, "sv-SE": sv, "da-DK": da };

export function trustMessages(locale: SupportedLocale): TrustMessages {
  return catalog[controlLocale(locale)]();
}
