import type { SupportedLocale } from "@/lib/market/registry";

/**
 * Copy for /beside, the page for the person standing beside a player (Founder decision,
 * 13 October 2026, mechanism «Den som står bredvid är ingången»). It is an entrance from search
 * for partners and mothers, never an exit from a Mission: how to see the real number herself, one
 * message in her own words, what to say on day 11, the helplines first. No casino, no account.
 *
 * Helplines checked 12 October 2026: Stödlinjen 020-81 91 00 (anhörigstöd), StopSpillet
 * 70 22 28 25, Center for Ludomani 70 11 18 10. Neither line is open around the clock
 * (Stödlinjen: weekdays, Mon 9–19, Tue–Wed 9–17, Thu 11–19, Fri 9–15; StopSpillet by phone:
 * Mon–Thu 9–21, Fri 9–17; read on their own pages 15 October 2026), so the heading names no hours.
 */
export type BesideMessages = Readonly<{
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  titleLead: string;
  titleEmphasis: string;
  intro: string;
  revenueLine: string;
  realNumber: Readonly<{ heading: string; body: string; items: readonly string[] }>;
  message: Readonly<{ heading: string; intro: string; text: string; copy: string; copied: string; after: string }>;
  dayEleven: Readonly<{ heading: string; body: string }>;
  forYou: Readonly<{ heading: string; body: string }>;
  supportHeading: string;
  support: readonly Readonly<{ label: string; href: string }>[];
  planLink: string;
  homeLabel: string;
  breadcrumbLabel: string;
}>;

const sv: BesideMessages = {
  metadataTitle: "För dig som står bredvid någon som spelar",
  metadataDescription: "Hur du ser den riktiga siffran själv, ett meddelande med dina egna ord och vad du säger dag 11. Inga casinon, inget konto.",
  eyebrow: "För dig som står bredvid",
  titleLead: "Du behöver inte få honom att sluta.",
  titleEmphasis: "Du behöver se.",
  intro: "Nästan varannan som kontaktar Stödlinjen är en anhörig, oftast en partner eller en mamma. Rådet du får överallt slutar på ”sätt honom i Spelpaus”. Den här sidan börjar där rådet tar slut: vad du kan se själv, vad du kan säga i stället för ”sluta”, och vad du gör dag 11 när kontot öppnas igen.",
  revenueLine: "B4GAMBLE tjänar provision från licensierade casinon. Den här texten innehåller inga.",
  realNumber: {
    heading: "Se den riktiga siffran själv",
    body: "Inte hans uppskattning och inte din. Tre ställen där siffran finns:",
    items: [
      "Kontoutdrag och Swish-historik för tre månader. Insättningar till spelbolag syns med namn.",
      "Kronofogden och UC: har det kommit krav eller nya lån i hans namn?",
      "Bankspärr mot spel finns hos Swedbank, SEB, Nordea och fler. Han slår på den själv i appen; fråga om den är på, inte om han spelar.",
    ],
  },
  message: {
    heading: "Ett meddelande med dina ord",
    intro: "Skicka det som det är, eller skriv om det. Det ber inte om ett löfte. Det ber om tio dagar som du kan se.",
    text: "Jag ber dig inte sluta. Jag ber dig om tio dagar med regler jag kan se: summan innan appen, tiden innan appen, och att jag får veta den riktiga siffran. Planen finns här: b4gamble.com/sv/pause-plan",
    copy: "Kopiera meddelandet",
    copied: "Kopierat",
    after: "När han öppnar länken ser han planen: tio steg, utan casinon och utan erbjudanden i den.",
  },
  dayEleven: {
    heading: "Dag 11",
    body: "Kontot öppnas igen. Fråga inte ”spelade du?”. Fråga ”vilken summa bestämde du innan?”. Det är den frågan planen bygger på, och det är den enda som går att svara ärligt på.",
  },
  forYou: {
    heading: "Dina egna gränser",
    body: "Du får bestämma vad du betalar, vad du vill veta och när du behöver prata med någon som inte är han. Stödlinjens anhörigstöd är till för dig, inte för honom.",
  },
  supportHeading: "Här finns hjälp för dig",
  support: [
    { label: "Stödlinjen, anhörigstöd – 020-81 91 00", href: "https://www.stodlinjen.se/" },
    { label: "Spelpaus.se – så fungerar pausen", href: "https://www.spelpaus.se/" },
  ],
  planLink: "/pause-plan",
  homeLabel: "Hem",
  breadcrumbLabel: "För dig som står bredvid",
};

const da: BesideMessages = {
  metadataTitle: "Til dig, der står ved siden af en, der spiller",
  metadataDescription: "Sådan ser du det rigtige tal selv, en besked med dine egne ord og hvad du siger dagen efter. Ingen casinoer, ingen konto.",
  eyebrow: "Til dig, der står ved siden af",
  titleLead: "Du behøver ikke få ham til at stoppe.",
  titleEmphasis: "Du skal kunne se.",
  intro: "Mange af dem, der kontakter StopSpillet, er pårørende, oftest en partner eller en mor. Rådet, du får alle steder, ender på ”få ham i ROFUS”. Denne side begynder, hvor rådet slutter: hvad du selv kan se, hvad du kan sige i stedet for ”stop”, og hvad du gør dagen efter, når pausen udløber.",
  revenueLine: "B4GAMBLE tjener provision fra licenserede casinoer. Denne tekst indeholder ingen.",
  realNumber: {
    heading: "Se det rigtige tal selv",
    body: "Ikke hans skøn og ikke dit. Tre steder, hvor tallet findes:",
    items: [
      "Kontoudtog og MobilePay-historik for tre måneder. Indbetalinger til spiludbydere står med navn.",
      "RKI og Gældsstyrelsen: er der kommet krav eller nye lån i hans navn?",
      "Spilspærring findes hos Danske Bank, Nordea, Nykredit og flere. Han slår den til selv i appen; spørg om den er slået til, ikke om han spiller.",
    ],
  },
  message: {
    heading: "En besked med dine ord",
    intro: "Send den, som den er, eller skriv den om. Den beder ikke om et løfte. Den beder om ti dage, du kan se.",
    text: "Jeg beder dig ikke om at stoppe. Jeg beder om ti dage med regler, jeg kan se: beløbet før appen, tiden før appen, og at jeg får det rigtige tal at vide. Planen er her: b4gamble.com/da/pause-plan",
    copy: "Kopiér beskeden",
    copied: "Kopieret",
    after: "Når han åbner linket, ser han planen: ti trin, uden casinoer og uden tilbud i den.",
  },
  dayEleven: {
    heading: "Dagen efter",
    body: "Pausen udløber. Spørg ikke ”spillede du?”. Spørg ”hvilket beløb bestemte du før?”. Det er det spørgsmål, planen bygger på, og det eneste, der kan besvares ærligt.",
  },
  forYou: {
    heading: "Dine egne grænser",
    body: "Du må bestemme, hvad du betaler, hvad du vil vide, og hvornår du har brug for at tale med en, der ikke er ham. StopSpillet er også til pårørende.",
  },
  supportHeading: "Her kan du få hjælp",
  support: [
    { label: "StopSpillet – 70 22 28 25", href: "https://www.stopspillet.dk/" },
    { label: "Center for Ludomani – 70 11 18 10", href: "https://ludomani.dk/" },
  ],
  planLink: "/pause-plan",
  homeLabel: "Forside",
  breadcrumbLabel: "Til dig, der står ved siden af",
};

const en: BesideMessages = {
  metadataTitle: "For the person beside someone who gambles",
  metadataDescription: "How to see the real number yourself, one message in your own words, and what to say the day after. No casinos, no account.",
  eyebrow: "For the person beside",
  titleLead: "You don't have to make him quit.",
  titleEmphasis: "You have to be able to see.",
  intro: "Many of the people who contact a helpline are partners and mothers. The advice ends everywhere at “put him on self-exclusion”. This page starts where the advice ends: what you can see yourself, what to say instead of “quit”, and what to do the day the pause ends.",
  revenueLine: "B4GAMBLE earns commission from licensed casinos. This text contains none.",
  realNumber: {
    heading: "See the real number yourself",
    body: "Not his estimate and not yours. Three places where the number lives:",
    items: [
      "Three months of bank statements and instant-payment history. Deposits to operators carry their names.",
      "The debt register: have claims or new loans appeared in his name?",
      "Most banks offer a gambling block. He turns it on himself in the app; ask whether it is on, not whether he gambles.",
    ],
  },
  message: {
    heading: "A message in your words",
    intro: "Send it as it is, or rewrite it. It does not ask for a promise. It asks for ten days you can see.",
    text: "I'm not asking you to quit. I'm asking for ten days with rules I can see: the amount before the app, the time before the app, and that I get to know the real number. The plan is here: b4gamble.com/en/pause-plan",
    copy: "Copy the message",
    copied: "Copied",
    after: "When he opens the link he sees the plan: ten steps, with no casinos and no offers in it.",
  },
  dayEleven: {
    heading: "The day after",
    body: "The accounts work again. Don't ask “did you gamble?”. Ask “what amount did you decide before?”. That is the question the plan is built on, and the only one that can be answered honestly.",
  },
  forYou: {
    heading: "Your own limits",
    body: "You decide what you pay, what you want to know, and when you need to talk to someone who is not him. The helplines are for you too.",
  },
  supportHeading: "Where you can get help",
  support: [
    { label: "Stödlinjen (Sweden) – 020-81 91 00", href: "https://www.stodlinjen.se/" },
    { label: "StopSpillet (Denmark) – 70 22 28 25", href: "https://www.stopspillet.dk/" },
  ],
  planLink: "/pause-plan",
  homeLabel: "Home",
  breadcrumbLabel: "For the person beside",
};

const catalog: Readonly<Partial<Record<SupportedLocale, BesideMessages>>> = { "en-GB": en, "sv-SE": sv, "da-DK": da };

export function besideLocale(locale: SupportedLocale): SupportedLocale {
  return catalog[locale] ? locale : "en-GB";
}

export function besideMessages(locale: SupportedLocale): BesideMessages {
  return catalog[besideLocale(locale)] ?? en;
}
