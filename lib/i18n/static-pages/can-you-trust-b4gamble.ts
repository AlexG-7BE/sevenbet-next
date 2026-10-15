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
 * - casino pages in the Programme: lib/research-access.ts (public research pages, the menu after
 *   the step "Research responsibly", the one-word cookie) and
 *   components/programme/ProgramAiMissionExperience.tsx (links on the last screens of steps 3
 *   and 10);
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
  const research = stepTitle("en-GB", 3);
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
        heading: "When casino pages appear in the Programme",
        paragraphs: [
          "The casino, bonus and offer pages are public. Anyone can open them from a search or a link, and while you are on one of them the site menu shows them.",
          `Everywhere else, the menu shows the casino, bonus and offer pages only after you finish step 3 of the Programme, “${research}”. That step teaches you to read the terms of an offer and ends with your own checklist; its last screen then links to those pages. The last screen of step 10 links to them again.`,
          "Finishing step 3 stores one cookie, b4g_research_access, which holds the word “open” and nothing about you. Your answers play no part in which casinos or offers you see, or in their order.",
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
      ["Will the Programme push me towards a casino?", `No step asks you to deposit, claim a bonus or play. After step 3, “${research}”, the menu shows the casino, bonus and offer pages, and the last screens of steps 3 and 10 link to them. Opening them is your choice and earns nothing in the Programme.`],
      ["Are my Programme answers shared with casinos?", "No. B4GAMBLE does not sell personal data, and your Programme answers are not used to choose, rank or personalise casinos, offers, affiliate links or ads."],
      ["Who runs B4GAMBLE?", "7BE Inc., a company in New York, trading as B4GAMBLE."],
    ],
    breadcrumbLabel: "Can you trust B4GAMBLE?",
  };
}

function sv(): TrustMessages {
  const research = stepTitle("sv-SE", 3);
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
        heading: "När casinosidor visas i programmet",
        paragraphs: [
          "Sidorna om casinon, bonusar och erbjudanden är öppna för alla. Vem som helst kan nå dem via en sökning eller en länk, och medan du är på en av dem visar menyn dem.",
          `På resten av sajten visar menyn sidorna om casinon, bonusar och erbjudanden först när du har gjort klart steg 3 i programmet, ”${research}”. Steget lär dig läsa villkoren i ett erbjudande och slutar med din egen checklista; stegets sista skärm länkar sedan till de sidorna. Den sista skärmen i steg 10 länkar till dem igen.`,
          "När steg 3 är klart sparas en cookie, b4g_research_access, som bara innehåller ordet ”open” och ingenting om dig. Dina svar påverkar inte vilka casinon eller erbjudanden du ser, eller i vilken ordning.",
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
      ["Knuffar programmet mig mot ett casino?", `Inget steg ber dig sätta in pengar, ta en bonus eller spela. Efter steg 3, ”${research}”, visar menyn sidorna om casinon, bonusar och erbjudanden, och de sista skärmarna i steg 3 och 10 länkar till dem. Om du öppnar dem är ditt val, och det ger ingenting i programmet.`],
      ["Delas mina svar i programmet med casinon?", "Nej. B4GAMBLE säljer inga personuppgifter, och dina svar i programmet används inte för att välja, rangordna eller anpassa casinon, erbjudanden, affiliatelänkar eller annonser."],
      ["Vem driver B4GAMBLE?", "7BE Inc., ett företag i New York, under namnet B4GAMBLE."],
    ],
    breadcrumbLabel: "Kan man lita på B4GAMBLE?",
  };
}

function da(): TrustMessages {
  const research = stepTitle("da-DK", 3);
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
        heading: "Hvornår casinosider vises i programmet",
        paragraphs: [
          "Siderne om casinoer, bonusser og tilbud er åbne for alle. Alle kan finde dem via en søgning eller et link, og mens du er på en af dem, viser menuen dem.",
          `På resten af siden viser menuen siderne om casinoer, bonusser og tilbud først, når du har gennemført trin 3 i programmet, ”${research}”. Trinnet lærer dig at læse vilkårene for et tilbud og slutter med din egen tjekliste; trinnets sidste skærm linker derefter til de sider. Den sidste skærm i trin 10 linker til dem igen.`,
          "Når trin 3 er gennemført, gemmes én cookie, b4g_research_access, som kun indeholder ordet ”open” og intet om dig. Dine svar har ingen betydning for, hvilke casinoer eller tilbud du ser, eller for rækkefølgen.",
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
      ["Skubber programmet mig hen mod et casino?", `Intet trin beder dig om at indbetale, tage en bonus eller spille. Efter trin 3, ”${research}”, viser menuen siderne om casinoer, bonusser og tilbud, og de sidste skærme i trin 3 og 10 linker til dem. Om du åbner dem, er dit valg, og det giver ingenting i programmet.`],
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
