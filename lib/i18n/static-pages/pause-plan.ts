import type { SupportedLocale } from "@/lib/market/registry";
import type { PauseRegister } from "@/lib/tools/pause-plan";

/**
 * Copy for /pause-plan, the ten-day plan beside a Spelpaus or ROFUS break (Founder, 12 October
 * 2026: «10 dagar. 10 steg.» for Sweden and «Dagen efter ROFUS. 10 trin.» for Denmark, launched
 * together). Swedish and Danish are the campaign languages; English is the generic page every
 * other language reads, marked `lang="en"` by the route like the wagering calculator.
 *
 * Helpline numbers: Stödlinjen 020-81 91 00 (stodlinjen.se), StopSpillet 70 22 28 25
 * (stopspillet.dk), Center for Ludomani 70 11 18 10. Checked 12 October 2026.
 */
export type PausePlanDay = Readonly<{ title: string; move: string }>;

export type PausePlanRegisterMessages = Readonly<{
  name: string;
  url: string;
  /** Labels by period id from lib/tools/pause-plan.ts. */
  periods: Readonly<Record<string, string>>;
  whatHappens: string;
}>;

export type PausePlanToolMessages = Readonly<{
  heading: string;
  registerLabel: string;
  startLabel: string;
  startHint: string;
  periodLabel: string;
  endsLabel: string;
  dayAfterLabel: string;
  openEndedNote: string;
  dayLabel: string;
  planHeading: string;
  planIntro: string;
  stepLabel: string;
  /** The email field under the result; shown only while the pause letters are switched on. */
  reminder: PausePlanReminderMessages;
}>;

export type PausePlanReminderMessages = Readonly<{
  label: string;
  /** The one line that says what is sent and when. It is the consent; nothing else asks again. */
  consent: string;
  submit: string;
  done: string;
  error: string;
}>;

export type PausePlanMessages = Readonly<{
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  titleLead: string;
  titleEmphasis: string;
  intro: string;
  /** Which register the page speaks about; "both" offers a choice. */
  register: PauseRegister | "both";
  registers: Readonly<Partial<Record<PauseRegister, PausePlanRegisterMessages>>>;
  tool: PausePlanToolMessages;
  days: readonly PausePlanDay[];
  dayEleven: Readonly<{ heading: string; body: string; cta: string }>;
  /** The hub of guides for a person on a pause; shown only when the language has such guides. */
  questionsHeading: string;
  questionsIntro: string;
  faqHeading: string;
  faq: readonly (readonly [string, string])[];
  supportHeading: string;
  support: readonly Readonly<{ label: string; href: string }>[];
  homeLabel: string;
  breadcrumbLabel: string;
  /** The revenue model, stated in the header. */
  revenueLine: string;
  /** Day 11, not going back: five lines the person takes to the helpline. */
  notBack: Readonly<{ heading: string; intro: string; lines: readonly string[]; copy: string; copied: string; supportLabel: string; supportHref: string }>;
  ics: Readonly<{ download: string; title: string; description: string }>;
}>;

const spelpausSv: PausePlanRegisterMessages = {
  name: "Spelpaus",
  url: "https://www.spelpaus.se/",
  periods: { "10d": "10 dagar", "1m": "1 månad", "3m": "3 månader", "6m": "6 månader", open: "Tills vidare (minst 12 månader)" },
  whatHappens: "När perioden är slut aktiveras dina spelkonton automatiskt, om du inte väljer en ny avstängning.",
};

const rofusDa: PausePlanRegisterMessages = {
  name: "ROFUS",
  url: "https://www.rofus.nu/",
  periods: { "24h": "24 timers pause", "1m": "1 måned", "3m": "3 måneder", "6m": "6 måneder", final: "Endelig udelukkelse" },
  whatHappens: "Når en midlertidig udelukkelse udløber, kan du igen logge ind hos spiludbydere med dansk licens.",
};

const sv: PausePlanMessages = {
  metadataTitle: "10 dagar. 10 steg. Planen för din spelpaus",
  metadataDescription: "Spelpaus kan nu tas i 10 dagar. Här är planen för dagarna i pausen och för dag 11: alla tio steg på en kväll eller ett om dagen. Gratis och privat.",
  eyebrow: "Spelpaus · 10 dagar",
  titleLead: "10 dagar.",
  titleEmphasis: "10 steg.",
  intro: "Sedan sommaren 2026 kan du stänga av dig från allt licensierat spel i 10 dagar på spelpaus.se. Pausen går inte att ångra, och när den tar slut öppnas kontona av sig själva. Det som avgör dag 11 är vad du gjorde dag 1–10. Här är planen: tio steg, i din takt.",
  register: "spelpaus",
  registers: { spelpaus: spelpausSv },
  tool: {
    heading: "När går din spelpaus ut?",
    registerLabel: "Register",
    startLabel: "Pausen började",
    startHint: "Välj dagen du registrerade pausen.",
    periodLabel: "Period",
    endsLabel: "Pausen gäller till och med",
    dayAfterLabel: "Dag 11: kontona öppnas",
    openEndedNote: "En avstängning tills vidare har inget slutdatum. Vi räknar med minst 12 månader.",
    dayLabel: "Dag",
    planHeading: "Alla tio på en kväll, eller ett om dagen",
    planIntro: "Tio steg ur B4GAMBLE-programmet, i den ordning du gör dem. Varje steg tar 5–15 minuter och slutar med något du behåller. Du väljer takten: hela planen på en kväll, eller ett steg om dagen tills pausen är slut. Du fortsätter alltid där du slutade.",
    stepLabel: "Steg",
    reminder: {
      label: "Din e-postadress",
      consent: "Vi skriver nu, dagen innan din paus tar slut och dagen då den är slut. Du kan avsluta när som helst.",
      submit: "Påminn mig",
      done: "Klart. Vi hörs dagen innan din paus tar slut.",
      error: "Det gick inte just nu. Försök igen om en stund.",
    },
  },
  days: [
    { title: "Säg som det är", move: "Skriv ner den riktiga summan och den riktiga tiden. Bara för dig. Det är din startpunkt." },
    { title: "Sätt ett 7-dagarsmål", move: "Bestäm summan innan du öppnar appen. En siffra, inte en känsla." },
    { title: "Kunskap före beslut", move: "Lär dig läsa villkor, odds och RTP i lugn och ro – innan du behöver det." },
    { title: "Förstå suget", move: "Vad händer precis innan du öppnar appen? Skriv ner kedjan: läge, tanke, handling." },
    { title: "Bygg en gräns", move: "En gräns du klarar den här veckan: en tid, en summa eller en plats." },
    { title: "Kontrollera före beslutet", move: "Tre kontroller innan en insättning: räkningarna, summan, klockan." },
    { title: "Lägg till friktion", move: "Ta bort appen från startskärmen och sparade kort. Gör den snabba vägen långsam." },
    { title: "Förbered stöd", move: "Välj en person som får veta den riktiga siffran. En räcker." },
    { title: "Öva beslutet", move: "Säg högt vad du gör kvällen efter pausen. Öva svaret innan det är skarpt." },
    { title: "Gör planen granskningsbar", move: "Skriv planen på en sida: summan, tiden, personen. Bestäm när du läser den igen." },
  ],
  dayEleven: {
    heading: "Dag 11",
    body: "Kontona öppnas. Dina regler är klara: summan är bestämd innan appen, tiden är bestämd innan appen, en person vet. Du behöver inte sluta. Du behöver ha kontrollen.",
    cta: "Börja steg 1 nu",
  },
  questionsHeading: "Frågor under pausen",
  questionsIntro: "Raka svar på det man undrar medan pausen pågår.",
  faqHeading: "Vanliga frågor",
  faq: [
    ["Kan jag avsluta spelpausen i förtid?", "Nej. En avstängning på spelpaus.se går inte att ångra eller avbryta. 10 dagar är 10 dagar."],
    ["Vad händer när pausen tar slut?", "Dina spelkonton hos licensierade spelbolag aktiveras automatiskt, om du inte registrerar en ny avstängning. Därför är planen för dag 11 viktigare än själva pausen."],
    ["Finns det casinon i planen?", "Nej. Planen och dess tio steg innehåller inga casinon och inga erbjudanden. Licensierade spelbolag får inte heller rikta marknadsföring till dig under pausen."],
    ["Behöver jag ett konto?", "Inte för att läsa planen. För att göra stegen och spara dina svar skapar du ett konto i programmet. Det är gratis, och dina svar används aldrig för erbjudanden, rankningar eller annonser."],
    ["Gäller spelpaus casinon utan svensk licens?", "Nej. Spelpaus gäller bara spelbolag med svensk licens. Sajter som marknadsför ”casino utan spelpaus” saknar licens i Sverige, och där har du inget svenskt konsumentskydd."],
    ["Vart vänder jag mig om det är akut?", "Stödlinjen för spelare och anhöriga: 020-81 91 00, stodlinjen.se. Gratis och anonymt."],
  ],
  supportHeading: "Hjälp som finns dygnet runt",
  support: [
    { label: "Stödlinjen – 020-81 91 00", href: "https://www.stodlinjen.se/" },
    { label: "Spelpaus.se – registrera eller läs om pausen", href: "https://www.spelpaus.se/" },
  ],
  homeLabel: "Hem",
  breadcrumbLabel: "10 dagar, 10 steg",
  revenueLine: "B4GAMBLE tjänar provision från licensierade casinon. Planen innehåller inga.",
  notBack: {
    heading: "Dag 11: inte tillbaka?",
    intro: "Om du bestämmer dig för att inte gå tillbaka, ta med dig det du redan vet till Stödlinjen. Fem rader räcker, och de gör samtalet kortare:",
    lines: ["Jag tog en paus på: …", "Det jag bestämde om summa och tid: …", "Den gräns som höll: …", "Den som vet den riktiga siffran: …", "Det jag vill ha hjälp med nu: …"],
    copy: "Kopiera de fem raderna",
    copied: "Kopierat",
    supportLabel: "Stödlinjen – 020-81 91 00, chatt och telefon",
    supportHref: "https://www.stodlinjen.se/",
  },
  ics: { download: "Lägg dag 11 i kalendern", title: "Dag 11 – kontona öppnas, mina regler gäller", description: "Summan innan appen. Tiden innan appen. En person vet. Planen: https://b4gamble.com/sv/pause-plan" },
};

const da: PausePlanMessages = {
  metadataTitle: "Dagen efter ROFUS. 10 trin til din pause",
  metadataDescription: "ROFUS kan tages for 24 timer, 1, 3 eller 6 måneder. Her er planen for pausen og for dagen efter: alle ti trin på én aften eller ét om dagen. Gratis og privat.",
  eyebrow: "ROFUS · pausen",
  titleLead: "Dagen efter ROFUS.",
  titleEmphasis: "10 trin.",
  intro: "På rofus.nu kan du udelukke dig fra alt dansk licenseret spil i 24 timer, 1, 3 eller 6 måneder – eller endeligt. En midlertidig pause kan ikke ophæves før tid, og når den udløber, kan du spille igen. Det, der afgør dagen efter, er, hvad du gjorde i pausen. Her er planen: ti trin, i dit tempo.",
  register: "rofus",
  registers: { rofus: rofusDa },
  tool: {
    heading: "Hvornår udløber din ROFUS-pause?",
    registerLabel: "Register",
    startLabel: "Pausen startede",
    startHint: "Vælg den dag, du registrerede pausen.",
    periodLabel: "Periode",
    endsLabel: "Pausen gælder til og med",
    dayAfterLabel: "Dagen efter: du kan spille igen",
    openEndedNote: "En endelig udelukkelse har ingen slutdato. Vi regner med mindst 12 måneder.",
    dayLabel: "Dag",
    planHeading: "Alle ti på én aften, eller ét om dagen",
    planIntro: "Ti trin fra B4GAMBLE-programmet i den rækkefølge, du tager dem. Hvert trin tager 5–15 minutter og slutter med noget, du beholder. Du vælger tempoet: hele planen på én aften, eller ét trin om dagen, til pausen er slut. Du fortsætter altid, hvor du slap.",
    stepLabel: "Trin",
    reminder: {
      label: "Din e-mailadresse",
      consent: "Vi skriver nu, dagen før, din pause udløber, og dagen, hvor den er slut. Du kan stoppe når som helst.",
      submit: "Påmind mig",
      done: "Det er på plads. Vi skriver dagen før, din pause udløber.",
      error: "Det lykkedes ikke lige nu. Prøv igen om lidt.",
    },
  },
  days: [
    { title: "Sig det, som det er", move: "Skriv det rigtige beløb og den rigtige tid ned. Kun for dig. Det er dit startpunkt." },
    { title: "Sæt et 7-dages mål", move: "Bestem beløbet, før du åbner appen. Et tal, ikke en følelse." },
    { title: "Viden før beslutning", move: "Lær at læse vilkår, odds og RTP i ro og mag – før du får brug for det." },
    { title: "Forstå trangen", move: "Hvad sker der lige før, du åbner appen? Skriv kæden ned: situation, tanke, handling." },
    { title: "Byg én grænse", move: "En grænse, du kan holde i denne uge: et tidspunkt, et beløb eller et sted." },
    { title: "Tjek før beslutningen", move: "Tre tjek før en indbetaling: regningerne, beløbet, klokken." },
    { title: "Tilføj friktion", move: "Fjern appen fra startskærmen og gemte kort. Gør den hurtige vej langsom." },
    { title: "Forbered støtte", move: "Vælg én person, der kender det rigtige tal. Én er nok." },
    { title: "Øv beslutningen", move: "Sig højt, hvad du gør aftenen efter pausen. Øv svaret, før det gælder." },
    { title: "Gør planen til at tjekke", move: "Skriv planen på én side: beløbet, tidspunktet, personen. Beslut, hvornår du læser den igen." },
  ],
  dayEleven: {
    heading: "Dagen efter",
    body: "Du kan spille igen. Dine regler er klar: beløbet er bestemt før appen, tiden er bestemt før appen, én person ved det. Du behøver ikke stoppe. Du skal bevare kontrollen.",
    cta: "Start trin 1 nu",
  },
  questionsHeading: "Spørgsmål i pausen",
  questionsIntro: "Klare svar på det, man spørger om, mens pausen varer.",
  faqHeading: "Ofte stillede spørgsmål",
  faq: [
    ["Kan jeg ophæve min ROFUS-pause før tid?", "Nej. En midlertidig udelukkelse i ROFUS kan ikke ophæves, før perioden er udløbet. En endelig udelukkelse kan først ophæves efter mindst et år, og kun på din egen anmodning."],
    ["Hvad sker der, når pausen udløber?", "Du kan igen logge ind hos spiludbydere med dansk licens. Derfor er planen for dagen efter vigtigere end selve pausen."],
    ["Er der casinoer i planen?", "Nej. Planen og dens ti trin indeholder ingen casinoer og ingen tilbud. Udbydere med dansk licens må heller ikke sende dig markedsføring, mens du er i ROFUS."],
    ["Skal jeg have en konto?", "Ikke for at læse planen. For at tage trinnene og gemme dine svar opretter du en konto i programmet. Det er gratis, og dine svar bruges aldrig til tilbud, rangeringer eller reklamer."],
    ["Gælder ROFUS udenlandske casinoer?", "Nej. ROFUS gælder kun spiludbydere med dansk licens. Sider uden dansk licens er ikke omfattet, og der har du ingen dansk forbrugerbeskyttelse."],
    ["Hvor henvender jeg mig, hvis det haster?", "StopSpillet: 70 22 28 25, stopspillet.dk. Gratis og anonymt. Center for Ludomani: 70 11 18 10."],
  ],
  supportHeading: "Hjælp, der er åben hele døgnet",
  support: [
    { label: "StopSpillet – 70 22 28 25", href: "https://www.stopspillet.dk/" },
    { label: "ROFUS – registrer dig eller læs om pausen", href: "https://www.rofus.nu/" },
  ],
  homeLabel: "Forside",
  breadcrumbLabel: "Dagen efter ROFUS",
  revenueLine: "B4GAMBLE tjener provision fra licenserede casinoer. Planen indeholder ingen.",
  notBack: {
    heading: "Dagen efter: ikke tilbage?",
    intro: "Hvis du beslutter ikke at gå tilbage, så tag det, du allerede ved, med til StopSpillet. Fem linjer er nok, og de gør samtalen kortere:",
    lines: ["Jeg tog en pause på: …", "Det, jeg besluttede om beløb og tid: …", "Den grænse, der holdt: …", "Den, der kender det rigtige tal: …", "Det, jeg vil have hjælp til nu: …"],
    copy: "Kopiér de fem linjer",
    copied: "Kopieret",
    supportLabel: "StopSpillet – 70 22 28 25, chat og telefon",
    supportHref: "https://www.stopspillet.dk/",
  },
  ics: { download: "Læg dagen efter i kalenderen", title: "Dagen efter – kontiene åbner, mine regler gælder", description: "Beløbet før appen. Tiden før appen. Én person ved det. Planen: https://b4gamble.com/da/pause-plan" },
};

const en: PausePlanMessages = {
  metadataTitle: "The Day After Your Gambling Pause: 10 Steps",
  metadataDescription: "A free ten-day plan beside a Spelpaus or ROFUS break: all ten steps in one evening or one a day.",
  eyebrow: "Self-exclusion pause",
  titleLead: "The day after.",
  titleEmphasis: "10 steps.",
  intro: "Sweden's Spelpaus and Denmark's ROFUS block you from every licensed operator for a fixed time. The pause cannot be cancelled early, and when it ends your accounts work again. What decides the day after is what you did during the pause. Here is the plan: ten steps, at your pace.",
  register: "both",
  registers: {
    spelpaus: {
      name: "Spelpaus (Sweden)",
      url: "https://www.spelpaus.se/",
      periods: { "10d": "10 days", "1m": "1 month", "3m": "3 months", "6m": "6 months", open: "Until further notice (12 months minimum)" },
      whatHappens: "When the period ends, your accounts with Swedish-licensed operators are reactivated automatically unless you register a new exclusion.",
    },
    rofus: {
      name: "ROFUS (Denmark)",
      url: "https://www.rofus.nu/",
      periods: { "24h": "24-hour pause", "1m": "1 month", "3m": "3 months", "6m": "6 months", final: "Permanent exclusion" },
      whatHappens: "When a temporary exclusion expires, you can log in again with Danish-licensed operators.",
    },
  },
  tool: {
    heading: "When does your pause end?",
    registerLabel: "Register",
    startLabel: "The pause started",
    startHint: "Pick the day you registered the pause.",
    periodLabel: "Period",
    endsLabel: "The pause runs to the end of",
    dayAfterLabel: "The day after: accounts work again",
    openEndedNote: "An open-ended exclusion has no end date. We count at least 12 months.",
    dayLabel: "Day",
    planHeading: "All ten in one evening, or one a day",
    planIntro: "Ten steps from the B4GAMBLE Programme, in the order you take them. Each takes 5–15 minutes and ends with something you keep. You set the pace: the whole plan in one evening, or one step a day until the pause ends. You always continue where you left off.",
    stepLabel: "Step",
    reminder: {
      label: "Your email address",
      consent: "We write now, the day before your pause ends and the day it is over. You can stop at any time.",
      submit: "Remind me",
      done: "Done. We write the day before your pause ends.",
      error: "That did not work just now. Try again in a moment.",
    },
  },
  days: [
    { title: "Say what is happening", move: "Write down the real amount and the real time. For you only. That is your Starting Point." },
    { title: "Set a 7-day goal", move: "Decide the amount before you open the app. A number, not a feeling." },
    { title: "Knowledge before the decision", move: "Learn to read terms, odds and RTP while nothing is at stake." },
    { title: "Understand the urge", move: "What happens just before you open the app? Write the chain down: situation, thought, action." },
    { title: "Build one boundary", move: "One boundary you can keep this week: a time, an amount or a place." },
    { title: "Check before deciding", move: "Three checks before a deposit: the bills, the amount, the clock." },
    { title: "Add friction", move: "Take the app off the home screen and delete saved cards. Make the fast route slow." },
    { title: "Prepare support", move: "Choose one person who knows the real number. One is enough." },
    { title: "Rehearse the decision", move: "Say out loud what you will do the evening after the pause. Practise the answer before it counts." },
    { title: "Make the plan reviewable", move: "Write the plan on one page: the amount, the time, the person. Decide when you read it again." },
  ],
  dayEleven: {
    heading: "The day after",
    body: "Your accounts work again. Your rules are ready: the amount is set before the app, the time is set before the app, one person knows. You don't have to quit. You have to be in control.",
    cta: "Start step 1 now",
  },
  questionsHeading: "Questions during a pause",
  questionsIntro: "Plain answers to what people ask while a pause runs.",
  faqHeading: "Questions people ask",
  faq: [
    ["Can I end the pause early?", "No. Neither Spelpaus nor a temporary ROFUS exclusion can be cancelled before the period ends."],
    ["What happens when the pause ends?", "Your accounts with licensed operators work again, unless you register a new exclusion. That is why the plan for the day after matters more than the pause itself."],
    ["Are there casinos in the plan?", "No. The plan and its ten steps contain no casinos and no offers. Licensed operators may not market to you during the pause either."],
    ["Do I need an account?", "Not to read the plan. To take the steps and keep your answers you create a free Programme account. Your answers are never used for offers, rankings or ads."],
    ["Does the pause cover unlicensed casinos?", "No. Spelpaus covers Swedish-licensed operators and ROFUS covers Danish-licensed ones. Sites advertising casinos \"without\" the register hold no local licence and give you no local consumer protection."],
    ["Where do I turn if it is urgent?", "Sweden: Stödlinjen, 020-81 91 00. Denmark: StopSpillet, 70 22 28 25. Both are free and anonymous."],
  ],
  supportHeading: "Help that is open around the clock",
  support: [
    { label: "Stödlinjen (Sweden) – 020-81 91 00", href: "https://www.stodlinjen.se/" },
    { label: "StopSpillet (Denmark) – 70 22 28 25", href: "https://www.stopspillet.dk/" },
  ],
  homeLabel: "Home",
  breadcrumbLabel: "The day after your pause",
  revenueLine: "B4GAMBLE earns commission from licensed casinos. The plan contains none.",
  notBack: {
    heading: "The day after: not going back?",
    intro: "If you decide not to go back, take what you already know to the helpline. Five lines are enough, and they make the call shorter:",
    lines: ["I took a pause of: …", "What I decided about amount and time: …", "The boundary that held: …", "The person who knows the real number: …", "What I want help with now: …"],
    copy: "Copy the five lines",
    copied: "Copied",
    supportLabel: "Stödlinjen (Sweden) 020-81 91 00 · StopSpillet (Denmark) 70 22 28 25",
    supportHref: "https://www.stodlinjen.se/",
  },
  ics: { download: "Add the day after to my calendar", title: "The day after – accounts reopen, my rules apply", description: "The amount before the app. The time before the app. One person knows. The plan: https://b4gamble.com/en/pause-plan" },
};

const catalog: Readonly<Partial<Record<SupportedLocale, PausePlanMessages>>> = {
  "en-GB": en,
  "sv-SE": sv,
  "da-DK": da,
};

export function pausePlanLocale(locale: SupportedLocale): SupportedLocale {
  return catalog[locale] ? locale : "en-GB";
}

export function pausePlanMessages(locale: SupportedLocale): PausePlanMessages {
  return catalog[pausePlanLocale(locale)] ?? en;
}
