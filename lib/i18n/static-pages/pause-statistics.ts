import type { SupportedLocale } from "@/lib/market/registry";

/**
 * Copy for /pause-statistics (Founder decision, 13 October 2026, mechanism «Öppna data i stället
 * för pressmeddelande»): the regulators' own figures about Spelpaus and ROFUS as documents and
 * open CSV, what nobody publishes, the records we have requested, and the first cut of the forum
 * corpus. Numbers here are only what a public source states; estimates are marked as such.
 */
export type StatisticsRow = Readonly<{ label: string; value: string; source: string }>;

export type PauseStatisticsMessages = Readonly<{
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  titleLead: string;
  titleEmphasis: string;
  intro: string;
  revenueLine: string;
  register: Readonly<{ heading: string; rows: readonly StatisticsRow[]; csvLabel: string; csvHref: string; licence: string }>;
  periods: Readonly<{ heading: string; body: string }>;
  unknown: Readonly<{ heading: string; intro: string; items: readonly string[] }>;
  requests: Readonly<{ heading: string; body: string; status: string }>;
  corpus: Readonly<{ heading: string; body: string; rows: readonly StatisticsRow[]; method: string; studyLabel: string }>;
  dayEleven: Readonly<{ heading: string; body: string; cta: string }>;
  sources: Readonly<{ heading: string; items: readonly Readonly<{ label: string; href: string }>[] }>;
  homeLabel: string;
  breadcrumbLabel: string;
}>;

/**
 * Replaced on 18 October 2026. The first version of this table counted keyword hits over all
 * 4,211 collected Lånforum posts, 2,505 of which are a quoted earlier post whose own reply never
 * reached the parser — so every theme was counted roughly 2.5 times. The rows below come from the
 * coded study instead (3,299 posts, one coded record each), and `/forum-study` carries the
 * denominators, the method and the claims the material cannot support.
 */
const corpusRowsSv: readonly StatisticsRow[] = [
  { label: "Kodade inlägg", value: "3 299", source: "tre öppna forum; de två svenska kodade i sin helhet, Reddit som ett fast urval" },
  { label: "Skriver om sitt eget spelande", value: "925", source: "av 3 299 inlägg (28,0 %); resten är svar och anhöriga" },
  { label: "Nämner ett avstängningsregister", value: "174", source: "av 3 299 inlägg (5,3 %)" },
  { label: "Av dem: en väg runt eller en väg tillbaka", value: "65", source: "av 174 inlägg som nämner ett register (37,4 %)" },
  { label: "Står vid slutet av en paus", value: "8", source: "av 3 299 inlägg — dagen nästan ingen skriver om" },
];

const sv: PauseStatisticsMessages = {
  metadataTitle: "Spelpaus i siffror – registret, perioderna och det ingen publicerar",
  metadataDescription: "Spelinspektionens egna siffror om Spelpaus som öppna data, de frågor ingen myndighet svarar på ännu, våra begäranden om allmänna handlingar och 3 299 kodade foruminlägg.",
  eyebrow: "Öppna data",
  titleLead: "Spelpaus",
  titleEmphasis: "i siffror.",
  intro: "Det här är inte ett pressmeddelande. Det är de siffror som finns, med källa och nedladdningsbar fil, och de siffror som inte finns än. Sidan uppdateras när Spelinspektionen svarar på våra begäranden om allmänna handlingar.",
  revenueLine: "B4GAMBLE tjänar provision från licensierade casinon. Ingenting i de här siffrorna länkar till något av dem; det gör menyn.",
  register: {
    heading: "Så många är avstängda",
    rows: [
      { label: "31 december 2023", value: "104 301", source: "Spelinspektionen, årsstatistik" },
      { label: "31 december 2024", value: "120 607", source: "Spelinspektionen, årsstatistik" },
      { label: "31 december 2025", value: "134 484", source: "Spelinspektionen, årsredovisning 2025: 101 803 män, 32 681 kvinnor" },
      { label: "31 mars 2026", value: "≈ 138 000", source: "Spelinspektionen, kvartalsstatistik, avrundat" },
    ],
    csvLabel: "Ladda ner som CSV",
    csvHref: "/data/spelpaus-registrations.csv",
    licence: "Tabellen får användas fritt med källhänvisning (CC BY 4.0). Siffrorna är myndighetens; vi har bara samlat dem.",
  },
  periods: {
    heading: "Perioderna",
    body: "10 dagar (sedan den 29 juni 2026, den första ändringen sedan 2019), 1 månad, 3 månader, 6 månader eller tills vidare, som innebär minst 12 månader. En avstängning kan inte ångras. När perioden är slut aktiveras spelkontona automatiskt om personen inte registrerar sig igen. Spelpaus gäller bara spelbolag med svensk licens.",
  },
  unknown: {
    heading: "Det ingen publicerar",
    intro: "Myndigheten publicerar hur många som är avstängda. Den publicerar inte:",
    items: [
      "hur många som väljer 10 dagar, och om de kommer tillbaka och registrerar sig igen",
      "hur många avstängningar som löper ut varje månad",
      "hur många pauser som tar slut samma vecka som lönen kommer: en 10-dagarspaus startad den 15–18:e öppnas den 25–28:e",
      "vad som händer dag 11",
    ],
  },
  requests: {
    heading: "Våra begäranden om allmänna handlingar",
    body: "Vi har begärt ut registreringar per månad sedan 10-dagarsperioden infördes, fördelade på period, kön och ålder, antalet personer som registrerat sig mer än en gång, och antalet avstängningar som löpt ut per månad. Svaret publiceras här som det kommer, med diarienummer, även om det är ett avslag.",
    status: "Status: begäran skickad i oktober 2026. Svar väntas inom dagar till två veckor.",
  },
  corpus: {
    heading: "Så låter det efteråt: 3 299 kodade inlägg",
    body: "Vi läste 3 299 öppna foruminlägg om spel och skulder och kodade varje inlägg för sig mot ett fast schema. Det tydligaste i materialet: när ett avstängningsregister nämns kommer en väg runt det eller en väg tillbaka upp i mer än en tredjedel av inläggen. Inga citat återges.",
    rows: corpusRowsSv,
    method: "Varje siffra står med sin nämnare, och det materialet inte kan visa – ingen lönevecka, ingen trend över åren, inga danska siffror – står tryckt på studiens egen sida, tillsammans med alla aggregat som CSV.",
    studyLabel: "Hela studien: Så låter det innan det går snett",
  },
  dayEleven: {
    heading: "Dag 11",
    body: "Frågan är inte hur många som pausar. Frågan är vad som händer dagen kontona öppnas igen. För den dagen finns en gratis plan utan konto, och själva planen innehåller inga casinon.",
    cta: "Planen för dag 11",
  },
  sources: {
    heading: "Källor",
    items: [
      { label: "Spelinspektionen: Spelpaus.se och licenshavarnas ansvar", href: "https://www.spelinspektionen.se/lagar-regler/spelansvar-och-konsumentskydd/spelpaus.se" },
      { label: "Spelinspektionen: statistik", href: "https://www.spelinspektionen.se/om-oss/statistik/" },
      { label: "Spelpaus.se", href: "https://www.spelpaus.se/" },
      { label: "Spelinspektionens årsredovisning 2025, refererad av Gambling Insider", href: "https://www.gamblinginsider.com/se/nyheter/101024/spelinspektionen-arsredovisning-2025-spelmarknad" },
      { label: "Kvartalsstatistik Q1 2026, refererad av Gambling Insider", href: "https://www.gamblinginsider.com/se/nyheter/102109/svenska-spelmarknaden-q1-2026-omsattning-spelpaus" },
      { label: "Spelinspektionen: 10 dagar på Spelpaus.se, 29 juni 2026", href: "https://www.spelinspektionen.se/nyhetsarkiv/nu-kan-du-stanga-av-dig-fran-spel-i-10-dagar-pa-spelpaus.se/" },
    ],
  },
  homeLabel: "Hem",
  breadcrumbLabel: "Spelpaus i siffror",
};

const corpusRowsDa: readonly StatisticsRow[] = [
  { label: "Kodede indlæg", value: "3.299", source: "tre åbne fora; de to svenske kodet i deres helhed, Reddit som et fast udvalg" },
  { label: "Skriver om sit eget spil", value: "925", source: "af 3.299 indlæg (28,0 %); resten er svar og pårørende" },
  { label: "Nævner et udelukkelsesregister", value: "174", source: "af 3.299 indlæg (5,3 %)" },
  { label: "Heraf: en vej omkring eller en vej tilbage", value: "65", source: "af 174 indlæg der nævner et register (37,4 %)" },
  { label: "Står ved slutningen af en pause", value: "8", source: "af 3.299 indlæg — dagen næsten ingen skriver om" },
];

const da: PauseStatisticsMessages = {
  metadataTitle: "ROFUS i tal – registret, perioderne og det, ingen offentliggør",
  metadataDescription: "Spillemyndighedens egne tal om ROFUS som åbne data, de spørgsmål ingen myndighed svarer på endnu, vores anmodninger om aktindsigt og 3.299 kodede forumindlæg.",
  eyebrow: "Åbne data",
  titleLead: "ROFUS",
  titleEmphasis: "i tal.",
  intro: "Det her er ikke en pressemeddelelse. Det er de tal, der findes, med kilde og fil til download, og de tal, der ikke findes endnu. Siden opdateres, når Spillemyndigheden svarer på vores anmodninger om aktindsigt.",
  revenueLine: "B4GAMBLE tjener provision fra licenserede casinoer. Intet i disse tal linker til nogen af dem; det gør menuen.",
  register: {
    heading: "Så mange er udelukket",
    rows: [
      { label: "31. december 2012", value: "≈ 1.500", source: "Spillemyndigheden, refereret af Gambling Insider" },
      { label: "31. maj 2025", value: "60.000", source: "Spillemyndigheden: 58 procent af de registrerede mænd er under 40" },
    ],
    csvLabel: "Download som CSV",
    csvHref: "/data/rofus-registrations.csv",
    licence: "Tabellen må bruges frit med kildeangivelse (CC BY 4.0). Tallene er myndighedens; vi har kun samlet dem.",
  },
  periods: {
    heading: "Perioderne",
    body: "24 timers pause, 1 måned, 3 måneder, 6 måneder eller endelig udelukkelse. En midlertidig udelukkelse kan ikke ophæves før tid; når den udløber, kan man logge ind igen hos udbydere med dansk licens. ROFUS gælder ikke sider uden dansk licens.",
  },
  unknown: {
    heading: "Det, ingen offentliggør",
    intro: "Myndigheden offentliggør, hvor mange der er udelukket. Den offentliggør ikke:",
    items: [
      "hvor mange der vælger 24 timer, og om de kommer tilbage og registrerer sig igen",
      "hvor mange midlertidige udelukkelser der udløber hver måned",
      "hvor mange pauser der udløber i den uge, lønnen kommer",
      "hvad der sker dagen efter",
    ],
  },
  requests: {
    heading: "Vores anmodninger om aktindsigt",
    body: "Vi har anmodet om registreringer pr. måned fra 1. januar 2025 fordelt på periode, køn og alder, antal personer registreret mere end én gang og antal udløbne udelukkelser pr. måned. Svaret offentliggøres her, som det kommer, med sagsnummer, også hvis det er et afslag.",
    status: "Status: anmodning sendt i oktober 2026. Svar forventes inden for syv arbejdsdage.",
  },
  corpus: {
    heading: "Sådan lyder det bagefter: 3.299 kodede indlæg",
    body: "Vi læste 3.299 åbne forumindlæg om spil og gæld og kodede hvert indlæg for sig efter et fast skema. Det klareste i materialet: når et udelukkelsesregister nævnes, kommer en vej omkring det eller en vej tilbage op i mere end en tredjedel af indlæggene. Ingen citater gengives.",
    rows: corpusRowsDa,
    method: "Hvert tal står med sin nævner, og det materialet ikke kan vise – ingen lønuge, ingen tendens over årene, ingen danske tal – står trykt på studiets egen side sammen med alle aggregater som CSV.",
    studyLabel: "Hele studiet: Sådan lyder det, inden det går galt",
  },
  dayEleven: {
    heading: "Dagen efter",
    body: "Spørgsmålet er ikke, hvor mange der holder pause. Spørgsmålet er, hvad der sker den dag, man kan logge ind igen. Til den dag findes en gratis plan uden konto, og selve planen indeholder ingen casinoer.",
    cta: "Planen for dagen efter",
  },
  sources: {
    heading: "Kilder",
    items: [
      { label: "Spillemyndigheden: statistik", href: "https://www.spillemyndigheden.dk/" },
      { label: "ROFUS", href: "https://www.rofus.nu/" },
      { label: "60.000 i ROFUS, Gambling Insider, maj 2025", href: "https://www.gamblinginsider.com/news/29977/rofus-reaches-60000-registrants-as-more-danes-opt-to-self-exclude-from-gambling" },
    ],
  },
  homeLabel: "Forside",
  breadcrumbLabel: "ROFUS i tal",
};

const en: PauseStatisticsMessages = {
  metadataTitle: "Self-exclusion in numbers – Spelpaus and ROFUS as open data",
  metadataDescription: "The regulators' own figures about Sweden's Spelpaus and Denmark's ROFUS as open data, what nobody publishes, our public-records requests, and 3,299 coded forum posts.",
  eyebrow: "Open data",
  titleLead: "Self-exclusion",
  titleEmphasis: "in numbers.",
  intro: "This is not a press release. It is the figures that exist, with sources and a downloadable file, and the figures that do not exist yet. The page is updated when the regulators answer our public-records requests.",
  revenueLine: "B4GAMBLE earns commission from licensed casinos. Nothing in these figures links to one; the site menu does.",
  register: {
    heading: "How many are self-excluded",
    rows: [
      { label: "Sweden, 31 December 2023", value: "104,301", source: "Spelinspektionen, annual statistics" },
      { label: "Sweden, 31 December 2024", value: "120,607", source: "Spelinspektionen, annual statistics" },
      { label: "Sweden, 31 December 2025", value: "134,484", source: "Spelinspektionen, annual report 2025: 101,803 men, 32,681 women" },
      { label: "Sweden, 31 March 2026", value: "≈ 138,000", source: "Spelinspektionen, quarterly statistics, rounded" },
      { label: "Denmark, 31 May 2025", value: "60,000", source: "Spillemyndigheden: 58 percent of registered men are under 40" },
    ],
    csvLabel: "Download as CSV (Sweden)",
    csvHref: "/data/spelpaus-registrations.csv",
    licence: "The tables may be used freely with attribution (CC BY 4.0). The figures are the regulators'; we only collected them. Denmark: /data/rofus-registrations.csv.",
  },
  periods: {
    heading: "The periods",
    body: "Spelpaus: 10 days (since 29 June 2026, the first change since 2019), 1, 3 or 6 months, or until further notice (12 months minimum); cannot be cancelled; accounts reactivate automatically. ROFUS: a 24-hour pause, 1, 3 or 6 months, or permanent exclusion; a temporary exclusion cannot be lifted early. Neither covers unlicensed sites.",
  },
  unknown: {
    heading: "What nobody publishes",
    intro: "The regulators publish how many people are excluded. They do not publish:",
    items: [
      "how many choose the shortest period, and whether they come back and register again",
      "how many exclusions expire each month",
      "how many pauses end in the week the salary arrives",
      "what happens the day after",
    ],
  },
  requests: {
    heading: "Our public-records requests",
    body: "We have requested monthly registrations by period, sex and age, the number of people registered more than once, and the number of exclusions that expired each month, from both regulators. The answers are published here as they come, with case numbers, even when they are refusals.",
    status: "Status: requests sent in October 2026.",
  },
  corpus: {
    heading: "What it sounds like afterwards: 3,299 coded posts",
    body: "We read 3,299 open forum posts about gambling and debt and coded every post on its own against a fixed scheme. The clearest thing in the material: where a self-exclusion register is named, a way round it or a way back comes up in more than a third of the posts. No quotes are reproduced.",
    rows: [
      { label: "Coded posts", value: "3,299", source: "three open forums; the two Swedish ones coded in full, Reddit as a fixed selection" },
      { label: "Write about their own gambling", value: "925", source: "of 3,299 posts (28.0 %); the rest are answers and relatives" },
      { label: "Name a self-exclusion register", value: "174", source: "of 3,299 posts (5.3 %)" },
      { label: "Of those: a way round it or a way back", value: "65", source: "of 174 posts naming a register (37.4 %)" },
      { label: "Stand at the end of a pause", value: "8", source: "of 3,299 posts — the day almost nobody writes about" },
    ],
    method: "Every figure carries its denominator, and what the material cannot show – no payday week, no trend over the years, no Danish figure – is printed on the study's own page together with all the aggregates as a CSV.",
    studyLabel: "The whole study: what it sounds like before it goes wrong",
  },
  dayEleven: {
    heading: "The day after",
    body: "The question is not how many pause. The question is what happens the day the accounts open again. For that day there is a free plan without an account, and the plan itself contains no casinos.",
    cta: "The plan for the day after",
  },
  sources: {
    heading: "Sources",
    items: [
      { label: "Spelinspektionen: statistics", href: "https://www.spelinspektionen.se/om-oss/statistik/" },
      { label: "Spelinspektionen: the 10-day period on Spelpaus.se, 29 June 2026", href: "https://www.spelinspektionen.se/nyhetsarkiv/nu-kan-du-stanga-av-dig-fran-spel-i-10-dagar-pa-spelpaus.se/" },
      { label: "Spelpaus.se", href: "https://www.spelpaus.se/" },
      { label: "Spillemyndigheden", href: "https://www.spillemyndigheden.dk/" },
      { label: "ROFUS", href: "https://www.rofus.nu/" },
    ],
  },
  homeLabel: "Home",
  breadcrumbLabel: "Self-exclusion in numbers",
};

const catalog: Readonly<Partial<Record<SupportedLocale, PauseStatisticsMessages>>> = { "en-GB": en, "sv-SE": sv, "da-DK": da };

export function pauseStatisticsLocale(locale: SupportedLocale): SupportedLocale {
  return catalog[locale] ? locale : "en-GB";
}

export function pauseStatisticsMessages(locale: SupportedLocale): PauseStatisticsMessages {
  return catalog[pauseStatisticsLocale(locale)] ?? en;
}
