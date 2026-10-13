import type { SupportedLocale } from "@/lib/market/registry";

/**
 * Copy for /for-creators and /for-creators/[creator] (Founder decision, 13 October 2026,
 * mechanism «Öppet avtal»): the public terms for creators, lecturers and podcasts, a calculator
 * over those terms, and a named page with a live counter that exists before any request.
 * The public ledger is the labelling of a paid cooperation under Swedish and Danish marketing law.
 */
export type ForCreatorsMessages = Readonly<{
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  titleLead: string;
  titleEmphasis: string;
  intro: string;
  terms: Readonly<{ heading: string; items: readonly string[] }>;
  never: Readonly<{ heading: string; items: readonly string[] }>;
  gets: Readonly<{ heading: string; items: readonly string[] }>;
  calculator: Readonly<{
    heading: string;
    intro: string;
    viewers: string;
    startRate: string;
    completeRate: string;
    convertRate: string;
    commission: string;
    commissionHint: string;
    share: string;
    starts: string;
    completions: string;
    conversions: string;
    payout: string;
    note: string;
  }>;
  faq: readonly (readonly [string, string])[];
  contact: string;
  named: Readonly<{
    eyebrow: string;
    title: string;
    intro: string;
    linkLabel: string;
    visits: string;
    clicks: string;
    period: string;
    unavailable: string;
    keep: string;
    cards: string;
  }>;
  homeLabel: string;
  breadcrumbLabel: string;
}>;

const sv: ForCreatorsMessages = {
  metadataTitle: "Öppet avtal för kreatörer – betalt bara när tittaren håller kontrollen",
  metadataDescription: "Villkoren är offentliga: 40–50 procent av vår provision, bara när en tittare gått tio steg och senare spelat hos ett licensierat bolag. Noll för visningar, klick och starter.",
  eyebrow: "Öppet avtal",
  titleLead: "Betalt bara när",
  titleEmphasis: "tittaren håller kontrollen.",
  intro: "Det här är vårt avtal med kreatörer, föreläsare och poddar, publicerat i sin helhet. Ingen behöver fråga vad vi tjänar på det: det står här. B4GAMBLE tjänar provision från spelbolag med svensk licens när en person registrerar sig där via oss – och bara via den vanliga vägen, efter programmet, aldrig under en paus.",
  terms: {
    heading: "Villkoren",
    items: [
      "Du får 40–50 procent av vår provision för en tittare som gått alla tio steg i programmet och senare, via sajtens vanliga väg, registrerat sig hos ett spelbolag med licens.",
      "Noll kronor för visningar, klick, starter eller för en tittare som aldrig spelar. Ingen fast ersättning, inga produktplaceringar.",
      "Din sida med räknare är din: behåll, redigera eller radera den när du vill.",
      "Utbetalningar redovisas offentligt varje månad per kreatör, med belopp. Den redovisningen är också märkningen av samarbetet enligt marknadsföringslagen.",
      "Inget av det här gäller en tittare som har angett en paus på sajten: på den vägen visas inga casinon och ingenting räknas.",
    ],
  },
  never: {
    heading: "Det vi aldrig gör",
    items: [
      "Vi skickar inga «collab?»-meddelanden och ber inte om omnämnanden.",
      "Vi betalar inte för räckvidd och lämnar inga manus om spel, bonusar eller vinster.",
      "Vi samarbetar inte med någon som har ett pågående avtal med ett spelbolag utan svensk eller dansk licens.",
    ],
  },
  gets: {
    heading: "Det du får, oavsett om du vill ha avtalet",
    items: [
      "Tio dagskort «Dag 1–10» i ditt format, fria att använda.",
      "Fem omskrivna rader från svenska forum varje vecka, utan namn, att läsa upp eller strunta i.",
      "En sida med ditt namn och en räknare som börjar på noll: besök och registreringar efter programmet, uppdaterad varje dag.",
    ],
  },
  calculator: {
    heading: "Räkna själv",
    intro: "Allt är antaganden utom villkoren. Ändra siffrorna till dina egna.",
    viewers: "Tittare på en video eller ett avsnitt",
    startRate: "Andel som startar programmet",
    completeRate: "Andel av dem som går alla tio steg",
    convertRate: "Andel av dem som senare registrerar sig hos ett licensierat bolag",
    commission: "Vår provision per sådan registrering",
    commissionHint: "Beror på bolaget och avtalet. Fyll i den siffra vi ger dig, eller ett antagande.",
    share: "Din andel",
    starts: "Startar programmet",
    completions: "Går tio steg",
    conversions: "Registrerar sig senare",
    payout: "Din ersättning",
    note: "Räknaren sparar ingenting och skickar ingenting.",
  },
  faq: [
    ["Varför bara efter programmet?", "För att det är det enda vi kan stå för: en person som bestämt summan, tiden och en person som vet, innan hon registrerar sig någonstans. Allt annat är reklam för spel, och det gör vi inte."],
    ["Hur vet jag att siffrorna stämmer?", "Räknaren på din sida bygger på samma mätning som vår egen uppföljning: besök med din tagg och registreringar som skett via sajtens vanliga väg. Den offentliga redovisningen visar beloppen per månad."],
    ["Måste jag säga att det är ett samarbete?", "Ja, om du tar emot ersättning. Den offentliga redovisningen räknas som märkning, men säg det gärna i klartext också."],
    ["Jag har slutat spela och vill inte säga «du behöver inte sluta».", "Då finns en annan sida för dina tittare: den som bestämt sig för att inte gå tillbaka får fem rader att ta med till Stödlinjen, och inga casinon. Din räknare räknar starter i stället för registreringar."],
  ],
  contact: "Allt sker via support@b4gamble.com. Villkoren ändras bara här, aldrig i ett privat meddelande.",
  named: {
    eyebrow: "Din sida",
    title: "Sidan är din",
    intro: "Den här sidan finns innan någon har bett om något, så att villkoren ovan är konkreta. Behåll, redigera eller radera: ett mejl till support@b4gamble.com räcker, och den försvinner samma dag.",
    linkLabel: "Din länk, så att räknaren räknar",
    visits: "Besök via din länk",
    clicks: "Registreringar efter programmet",
    period: "senaste 90 dagarna",
    unavailable: "Räknaren kunde inte läsas just nu; den uppdateras varje dag.",
    keep: "Behåll, redigera eller radera: support@b4gamble.com",
    cards: "Tio dagskort i ditt format skickas när du vill ha dem.",
  },
  homeLabel: "Hem",
  breadcrumbLabel: "Öppet avtal",
};

const da: ForCreatorsMessages = {
  metadataTitle: "Åben aftale for kreatører – betalt kun, når seeren holder kontrollen",
  metadataDescription: "Vilkårene er offentlige: 40–50 procent af vores provision, kun når en seer har taget ti trin og senere spillet hos en licenseret udbyder. Nul for visninger, klik og starter.",
  eyebrow: "Åben aftale",
  titleLead: "Betalt kun, når",
  titleEmphasis: "seeren holder kontrollen.",
  intro: "Det her er vores aftale med kreatører, foredragsholdere og podcasts, offentliggjort i sin helhed. Ingen behøver spørge, hvad vi tjener på det: det står her. B4GAMBLE tjener provision fra spiludbydere med dansk licens, når en person registrerer sig der via os – og kun ad sitets almindelige vej, efter programmet, aldrig under en pause.",
  terms: {
    heading: "Vilkårene",
    items: [
      "Du får 40–50 procent af vores provision for en seer, der har taget alle ti trin i programmet og senere, ad sitets almindelige vej, har registreret sig hos en udbyder med licens.",
      "Nul kroner for visninger, klik, starter eller for en seer, der aldrig spiller. Ingen fast betaling, ingen produktplaceringer.",
      "Din side med tæller er din: behold, ret eller slet den, når du vil.",
      "Udbetalinger offentliggøres hver måned pr. kreatør med beløb. Den opgørelse er også mærkningen af samarbejdet efter markedsføringsloven.",
      "Intet af dette gælder en seer, der har angivet en pause på sitet: på den vej vises ingen casinoer, og intet tælles.",
    ],
  },
  never: {
    heading: "Det, vi aldrig gør",
    items: [
      "Vi sender ingen «collab?»-beskeder og beder ikke om omtale.",
      "Vi betaler ikke for rækkevidde og leverer ingen manuskripter om spil, bonusser eller gevinster.",
      "Vi samarbejder ikke med nogen, der har en løbende aftale med en udbyder uden dansk eller svensk licens.",
    ],
  },
  gets: {
    heading: "Det, du får, uanset om du vil have aftalen",
    items: [
      "Ti dagskort «Dag 1–10» i dit format, frie at bruge.",
      "Fem omskrevne linjer fra nordiske fora hver uge, uden navne, til at læse op eller lade ligge.",
      "En side med dit navn og en tæller, der starter på nul: besøg og registreringer efter programmet, opdateret hver dag.",
    ],
  },
  calculator: {
    heading: "Regn selv",
    intro: "Alt er antagelser undtagen vilkårene. Ret tallene til dine egne.",
    viewers: "Seere på en video eller et afsnit",
    startRate: "Andel, der starter programmet",
    completeRate: "Andel af dem, der tager alle ti trin",
    convertRate: "Andel af dem, der senere registrerer sig hos en licenseret udbyder",
    commission: "Vores provision pr. sådan registrering",
    commissionHint: "Afhænger af udbyderen og aftalen. Skriv det tal, vi giver dig, eller en antagelse.",
    share: "Din andel",
    starts: "Starter programmet",
    completions: "Tager ti trin",
    conversions: "Registrerer sig senere",
    payout: "Din betaling",
    note: "Beregneren gemmer intet og sender intet.",
  },
  faq: [
    ["Hvorfor kun efter programmet?", "Fordi det er det eneste, vi kan stå inde for: en person, der har bestemt beløbet, tiden og én person, der ved det, før hun registrerer sig nogen steder. Alt andet er reklame for spil, og det gør vi ikke."],
    ["Hvordan ved jeg, at tallene passer?", "Tælleren på din side bygger på den samme måling som vores egen opfølgning: besøg med dit tag og registreringer ad sitets almindelige vej. Den offentlige opgørelse viser beløbene pr. måned."],
    ["Skal jeg sige, at det er et samarbejde?", "Ja, hvis du modtager betaling. Den offentlige opgørelse tæller som mærkning, men sig det gerne også direkte."],
    ["Jeg er holdt op med at spille og vil ikke sige «du behøver ikke stoppe».", "Så findes der en anden side til dine seere: den, der har besluttet ikke at gå tilbage, får fem linjer at tage med til StopSpillet, og ingen casinoer. Din tæller tæller starter i stedet for registreringer."],
  ],
  contact: "Alt foregår via support@b4gamble.com. Vilkårene ændres kun her, aldrig i en privat besked.",
  named: {
    eyebrow: "Din side",
    title: "Siden er din",
    intro: "Denne side findes, før nogen har bedt om noget, så vilkårene ovenfor er konkrete. Behold, ret eller slet: en mail til support@b4gamble.com er nok, og den forsvinder samme dag.",
    linkLabel: "Dit link, så tælleren tæller",
    visits: "Besøg via dit link",
    clicks: "Registreringer efter programmet",
    period: "seneste 90 dage",
    unavailable: "Tælleren kunne ikke læses lige nu; den opdateres hver dag.",
    keep: "Behold, ret eller slet: support@b4gamble.com",
    cards: "Ti dagskort i dit format sendes, når du vil have dem.",
  },
  homeLabel: "Forside",
  breadcrumbLabel: "Åben aftale",
};

const en: ForCreatorsMessages = {
  metadataTitle: "Open agreement for creators – paid only when the viewer keeps control",
  metadataDescription: "The terms are public: 40–50 percent of our commission, only when a viewer completed ten steps and later played with a licensed operator. Zero for views, clicks and starts.",
  eyebrow: "Open agreement",
  titleLead: "Paid only when",
  titleEmphasis: "the viewer keeps control.",
  intro: "This is our agreement with creators, lecturers and podcasts, published in full. Nobody has to ask what we earn from it: it is written here. B4GAMBLE earns commission from licensed operators when a person signs up there through us – and only through the site's ordinary route, after the Programme, never during a pause.",
  terms: {
    heading: "The terms",
    items: [
      "You receive 40–50 percent of our commission for a viewer who completed all ten Programme steps and later, through the site's ordinary route, signed up with a licensed operator.",
      "Zero for views, clicks, starts, or for a viewer who never plays. No flat fee, no product placement.",
      "Your page with its counter is yours: keep, edit or delete it whenever you like.",
      "Payouts are published monthly per creator, with amounts. That ledger is also the labelling of the cooperation under Swedish and Danish marketing law.",
      "None of this applies to a viewer who declared a pause on the site: on that route no casinos are shown and nothing is counted.",
    ],
  },
  never: {
    heading: "What we never do",
    items: [
      "We send no “collab?” messages and ask for no mentions.",
      "We pay nothing for reach and hand out no scripts about gambling, bonuses or wins.",
      "We work with nobody who has a running deal with an operator without a Swedish or Danish licence.",
    ],
  },
  gets: {
    heading: "What you get, whether or not you want the agreement",
    items: [
      "Ten day cards “Day 1–10” in your format, free to use.",
      "Five rephrased lines from Nordic forums every week, no names, to read out or ignore.",
      "A page with your name and a counter that starts at zero: visits and sign-ups after the Programme, updated daily.",
    ],
  },
  calculator: {
    heading: "Work it out yourself",
    intro: "Everything is an assumption except the terms. Change the numbers to your own.",
    viewers: "Viewers of one video or episode",
    startRate: "Share who start the Programme",
    completeRate: "Share of those who complete all ten steps",
    convertRate: "Share of those who later sign up with a licensed operator",
    commission: "Our commission per such sign-up",
    commissionHint: "Depends on the operator and the deal. Enter the figure we give you, or an assumption.",
    share: "Your share",
    starts: "Start the Programme",
    completions: "Complete ten steps",
    conversions: "Sign up later",
    payout: "Your payout",
    note: "The calculator stores nothing and sends nothing.",
  },
  faq: [
    ["Why only after the Programme?", "Because it is the only thing we can stand behind: a person who decided the amount, the time and the one person who knows before signing up anywhere. Anything else is advertising for gambling, and we do not do that."],
    ["How do I know the numbers are right?", "The counter on your page uses the same measurement as our own follow-up: visits with your tag and sign-ups through the site's ordinary route. The public ledger shows the amounts per month."],
    ["Do I have to say it is a cooperation?", "Yes, if you receive payment. The public ledger counts as labelling, but say it plainly too."],
    ["I quit gambling and will not say “you don't have to quit”.", "Then there is another page for your viewers: whoever decided not to go back gets five lines to take to the helpline, and no casinos. Your counter counts starts instead of sign-ups."],
  ],
  contact: "Everything goes through support@b4gamble.com. The terms change only here, never in a private message.",
  named: {
    eyebrow: "Your page",
    title: "This page is yours",
    intro: "This page exists before anyone asked for anything, so that the terms above are concrete. Keep, edit or delete it: one email to support@b4gamble.com is enough, and it disappears the same day.",
    linkLabel: "Your link, so the counter counts",
    visits: "Visits through your link",
    clicks: "Sign-ups after the Programme",
    period: "last 90 days",
    unavailable: "The counter could not be read right now; it updates daily.",
    keep: "Keep, edit or delete: support@b4gamble.com",
    cards: "Ten day cards in your format are sent whenever you want them.",
  },
  homeLabel: "Home",
  breadcrumbLabel: "Open agreement",
};

const catalog: Readonly<Partial<Record<SupportedLocale, ForCreatorsMessages>>> = { "en-GB": en, "sv-SE": sv, "da-DK": da };

export function forCreatorsLocale(locale: SupportedLocale): SupportedLocale {
  return catalog[locale] ? locale : "en-GB";
}

export function forCreatorsMessages(locale: SupportedLocale): ForCreatorsMessages {
  return catalog[forCreatorsLocale(locale)] ?? en;
}
