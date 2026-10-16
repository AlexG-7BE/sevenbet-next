import type { SupportedLocale } from "@/lib/market/registry";
import { BRAND_STATEMENT, controlLocale, type ControlFaq, type ControlLocale } from "./gambling-control";

/**
 * Copy for /control-without-quitting (Founder decision, 15 October 2026): the question as people
 * ask an assistant, answered completely in the first sentences, then the three rules (the
 * Founder's line «You don't have to quit. You have to be in control.» in the Swedish and Danish
 * words the pause plan and the social accounts already use), the Programme's steps from the
 * catalogue (lib/i18n/static-pages/ten-steps.ts) and the first step when gambling already hurts.
 */
export type WithoutQuittingMessages = Readonly<{
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  /** The question, split for the headline: the tail is set in the serif. */
  question: string;
  titleLead: string;
  titleEmphasis: string;
  answer: string;
  control: Readonly<{ heading: string; intro: string; rules: readonly Readonly<{ title: string; body: string }>[]; line: string }>;
  steps: Readonly<{ heading: string; intro: string; note: string }>;
  notForYou: Readonly<{ heading: string; body: string }>;
  faq: ControlFaq;
  breadcrumbLabel: string;
}>;

const en: WithoutQuittingMessages = {
  metadataTitle: "How can I keep my gambling under control without quitting? | B4GAMBLE",
  metadataDescription: "Decide the amount and the time before you play, and let one person know the real number. How B4GAMBLE's free 10-step programme helps adults stay in control without having to quit.",
  eyebrow: "Control without quitting",
  question: "How can I keep my gambling under control without quitting?",
  titleLead: "How can I keep my gambling under control",
  titleEmphasis: "without quitting?",
  answer: `Decide the amount and the time before you open a gambling app, and let one person know the real number. ${BRAND_STATEMENT["en-GB"]} Its ten short steps help you set those rules and keep them in a plan you can review; if gambling already hurts your money, your sleep or your relationships, a self-exclusion is the better first step.`,
  control: {
    heading: "What real control looks like",
    intro: "Control is not a feeling in the moment. It is three things you decide while you are calm:",
    rules: [
      { title: "The amount, before the app", body: "One number, decided before you open the app, not while you play. Money for bills is never part of it." },
      { title: "The time, before the app", body: "When you start and when you stop, decided in advance. When the time is up you stop, whatever the balance." },
      { title: "One person knows", body: "Someone you trust knows the real number: what you spend and how often. One person is enough." },
    ],
    line: "You don't have to quit. You have to be in control.",
  },
  steps: {
    heading: "The ten steps",
    intro: "The Programme's steps in the order you take them. Most take 5–8 minutes and end with something you keep.",
    note: "No step links to a casino, a bonus or an offer, and none asks you to deposit or play.",
  },
  notForYou: {
    heading: "When control is not the right goal",
    body: "If gambling already hurts your money, your sleep or your relationships, or you have tried to cut down and could not, a pause is the right first step, not a plan to keep playing. A self-exclusion stops licensed sites from letting you play, and a helpline is free.",
  },
  faq: [
    ["What does gambling with control mean?", "The amount and the time are decided before you play and kept, and someone else knows the real number. If you keep breaking your own limits, that is the sign to pause instead, with a self-exclusion and a helpline."],
    ["What does B4GAMBLE do, exactly?", "It is a free programme of ten short steps. You describe what happens, set a 7-day goal, choose one person or one help service to turn to, understand the urge, build one boundary, add checks and friction, prepare support, rehearse the decision and put it all in a plan you review. It blocks no sites and it is not treatment."],
    ["Do I have to stop gambling to use it?", "No. The Programme does not ask you to give play up; it helps you keep it inside limits you choose. Deciding to stop is a good result too."],
    ["Is it treatment?", "No. B4GAMBLE does not diagnose or treat anyone. If you want treatment or someone to talk to, the National Gambling Helpline (0808 8020 133) is free and open 24 hours a day."],
    ["Does it cost anything or need an account?", "It is free. You can begin without an account; you create one only to save your Starting Point and carry on."],
  ],
  breadcrumbLabel: "Control without quitting",
};

const sv: WithoutQuittingMessages = {
  metadataTitle: "Hur får jag kontroll över mitt spelande utan att sluta? | B4GAMBLE",
  metadataDescription: "Bestäm summan och tiden innan du spelar, och låt en person få veta den riktiga siffran. Så hjälper B4GAMBLE:s gratis program i 10 steg vuxna att ha kontroll utan att behöva sluta.",
  eyebrow: "Kontroll utan att sluta",
  question: "Hur får jag kontroll över mitt spelande utan att sluta?",
  titleLead: "Hur får jag kontroll över mitt spelande",
  titleEmphasis: "utan att sluta?",
  answer: `Bestäm summan och tiden innan du öppnar en spelapp, och låt en person få veta den riktiga siffran. ${BRAND_STATEMENT["sv-SE"]} De tio korta stegen hjälper dig att sätta de reglerna och samla dem i en plan som du kan gå igenom igen; om spelandet redan går ut över pengarna, sömnen eller relationerna är Spelpaus ett bättre första steg.`,
  control: {
    heading: "Så ser verklig kontroll ut",
    intro: "Kontroll är ingen känsla i stunden. Det är tre saker du bestämmer medan du är lugn:",
    rules: [
      { title: "Summan före appen", body: "En siffra, bestämd innan du öppnar appen, inte medan du spelar. Pengarna till räkningarna ingår aldrig." },
      { title: "Tiden före appen", body: "När du börjar och när du slutar, bestämt i förväg. När tiden är slut slutar du, oavsett saldo." },
      { title: "En person som vet", body: "Någon du litar på vet den riktiga siffran: hur mycket du lägger och hur ofta. En person räcker." },
    ],
    line: "Du behöver inte sluta. Du behöver ha kontrollen.",
  },
  steps: {
    heading: "De tio stegen",
    intro: "Programmets steg i den ordning du gör dem. De flesta tar 5–8 minuter och slutar med något du behåller.",
    note: "Inget steg länkar till ett casino, en bonus eller ett erbjudande, och inget ber dig sätta in pengar eller spela.",
  },
  notForYou: {
    heading: "När kontroll inte är rätt mål",
    body: "Om spelandet redan går ut över pengarna, sömnen eller relationerna, eller om du har försökt dra ner på spelandet utan att lyckas, är en paus rätt första steg – inte en plan för att fortsätta spela. Spelpaus stänger av dig från spel hos alla spelbolag med svensk licens, och Stödlinjen är gratis och anonym.",
  },
  faq: [
    ["Vad betyder det att spela med kontroll?", "Att summan och tiden är bestämda innan du spelar och att du håller dem, och att någon annan vet den riktiga siffran. Om du gång på gång bryter dina egna gränser är det tecknet på att du behöver en paus i stället, med Spelpaus och Stödlinjen."],
    ["Vad gör B4GAMBLE, rent konkret?", "Det är ett gratis program med tio korta steg. Du beskriver vad som händer, sätter ett mål för sju dagar, väljer en person eller ett stöd att vända dig till, förstår spelsuget, bygger en gräns, lägger in kontroller och friktion, förbereder stöd, övar på beslutet och samlar allt i en plan som du går igenom igen. Programmet blockerar inga sajter och är ingen behandling."],
    ["Måste jag sluta spela för att använda det?", "Nej. Programmet ber dig inte att sluta spela; det hjälper dig att hålla spelandet inom gränser som du själv väljer. Att bestämma sig för att sluta är också ett bra resultat."],
    ["Är det en behandling?", "Nej. B4GAMBLE ställer inga diagnoser och behandlar ingen. Om du vill ha behandling eller någon att prata med är Stödlinjen, 020-81 91 00, gratis och anonym."],
    ["Kostar det något, och behöver jag ett konto?", "Det är gratis. Du kan börja utan konto; ett konto skapar du först när du vill spara din startpunkt och fortsätta."],
  ],
  breadcrumbLabel: "Kontroll utan att sluta",
};

const da: WithoutQuittingMessages = {
  metadataTitle: "Hvordan får jeg styr på mit spil uden at stoppe? | B4GAMBLE",
  metadataDescription: "Bestem beløbet og tiden, før du spiller, og lad ét menneske kende det rigtige tal. Sådan hjælper B4GAMBLE's gratis program i 10 trin voksne med at bevare kontrollen uden at skulle stoppe.",
  eyebrow: "Kontrol uden at stoppe",
  question: "Hvordan får jeg styr på mit spil uden at stoppe?",
  titleLead: "Hvordan får jeg styr på mit spil",
  titleEmphasis: "uden at stoppe?",
  answer: `Bestem beløbet og tiden, før du åbner en spilapp, og lad ét menneske kende det rigtige tal. ${BRAND_STATEMENT["da-DK"]} De ti korte trin hjælper dig med at sætte de regler og samle dem i en plan, som du kan gennemgå igen; hvis spillet allerede går ud over din økonomi, din søvn eller dine relationer, er ROFUS et bedre første skridt.`,
  control: {
    heading: "Sådan ser rigtig kontrol ud",
    intro: "Kontrol er ikke en følelse i øjeblikket. Det er tre ting, du beslutter, mens du er rolig:",
    rules: [
      { title: "Beløbet før appen", body: "Ét tal, besluttet før du åbner appen, ikke mens du spiller. Penge til regningerne er aldrig en del af det." },
      { title: "Tiden før appen", body: "Hvornår du begynder, og hvornår du stopper, besluttet på forhånd. Når tiden er gået, stopper du, uanset saldoen." },
      { title: "Ét menneske, der ved det", body: "En, du stoler på, kender det rigtige tal: hvor meget du bruger, og hvor tit. Én er nok." },
    ],
    line: "Du behøver ikke stoppe. Du skal bevare kontrollen.",
  },
  steps: {
    heading: "De ti trin",
    intro: "Programmets trin i den rækkefølge, du tager dem. De fleste tager 5–8 minutter og slutter med noget, du beholder.",
    note: "Intet trin linker til et casino, en bonus eller et tilbud, og intet beder dig om at indbetale eller spille.",
  },
  notForYou: {
    heading: "Når kontrol ikke er det rigtige mål",
    body: "Hvis spillet allerede går ud over din økonomi, din søvn eller dine relationer, eller hvis du har prøvet at skære ned, uden at det er lykkedes, er en pause det rigtige første skridt – ikke en plan for at blive ved med at spille. ROFUS udelukker dig fra spil hos udbydere med dansk licens, og StopSpillet er gratis og fortrolig.",
  },
  faq: [
    ["Hvad betyder det at spille med kontrol?", "At beløbet og tiden er besluttet, før du spiller, og at du holder dem, og at en anden kender det rigtige tal. Hvis du igen og igen bryder dine egne grænser, er det tegnet på, at du har brug for en pause i stedet, med ROFUS og StopSpillet."],
    ["Hvad gør B4GAMBLE helt konkret?", "Det er et gratis program med ti korte trin. Du beskriver, hvad der sker, sætter et mål for syv dage, vælger én person eller ét hjælpetilbud at gå til, forstår trangen, bygger én grænse, indbygger tjek og friktion, forbereder støtte, gennemspiller beslutningen og samler det hele i en plan, som du gennemgår igen. Programmet blokerer ingen sider og er ikke behandling."],
    ["Skal jeg stoppe med at spille for at bruge det?", "Nej. Programmet beder dig ikke om at stoppe; det hjælper dig med at holde spillet inden for grænser, du selv vælger. At beslutte sig for at stoppe er også et godt resultat."],
    ["Er det behandling?", "Nej. B4GAMBLE stiller ingen diagnoser og behandler ingen. Hvis du vil have behandling eller nogen at tale med, er StopSpillet (70 22 28 25) og Center for Ludomani (70 11 18 10) gratis."],
    ["Koster det noget, og skal jeg have en konto?", "Det er gratis. Du kan begynde uden konto; en konto opretter du først, når du vil gemme dit udgangspunkt og fortsætte."],
  ],
  breadcrumbLabel: "Kontrol uden at stoppe",
};

const catalog: Readonly<Record<ControlLocale, WithoutQuittingMessages>> = { "en-GB": en, "sv-SE": sv, "da-DK": da };

export function withoutQuittingMessages(locale: SupportedLocale): WithoutQuittingMessages {
  return catalog[controlLocale(locale)];
}
