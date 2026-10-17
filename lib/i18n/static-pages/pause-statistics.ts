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
  corpus: Readonly<{ heading: string; body: string; rows: readonly StatisticsRow[]; method: string }>;
  dayEleven: Readonly<{ heading: string; body: string; cta: string }>;
  sources: Readonly<{ heading: string; items: readonly Readonly<{ label: string; href: string }>[] }>;
  homeLabel: string;
  breadcrumbLabel: string;
}>;

const corpusRowsSv: readonly StatisticsRow[] = [
  { label: "Inlägg i urvalet", value: "4 211", source: "Lånforum, taggarna spelmissbruk, spelberoende, casino, spelskulder; 71 trådar; hämtat 12 oktober 2026" },
  { label: "Handlar om återbetalning, GDPR eller spelhistorik", value: "502", source: "nyckelord i texten; ett inlägg kan höra till flera rader" },
  { label: "Nämner Spelpaus eller avstängning", value: "307", source: "samma metod" },
  { label: "Räknar spelfria dagar", value: "253", source: "samma metod" },
  { label: "Ångest, skam eller lögner", value: "192", source: "samma metod" },
  { label: "Sambo, partner eller föräldrar", value: "187", source: "samma metod" },
  { label: "Kronofogden eller inkasso", value: "134", source: "samma metod" },
  { label: "Lönen", value: "110", source: "samma metod" },
  { label: "”Vinna tillbaka”", value: "16", source: "samma metod" },
  { label: "”Jag har kontroll”", value: "8", source: "samma metod" },
];

const sv: PauseStatisticsMessages = {
  metadataTitle: "Spelpaus i siffror – registret, perioderna och det ingen publicerar",
  metadataDescription: "Spelinspektionens egna siffror om Spelpaus som öppna data, de frågor ingen myndighet svarar på ännu, våra begäranden om allmänna handlingar och ett urval av 4 211 foruminlägg.",
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
    heading: "Så låter det efteråt: 4 211 foruminlägg",
    body: "Ett urval av öppna inlägg på Lånforum om spel och skulder, kodade efter tema. Inga citat återges; forumet handlar om tiden efter förlusten – pengarna tillbaka, Kronofogden, dagar utan spel – inte om kvällen innan.",
    rows: corpusRowsSv,
    method: "Metod: nyckelordssökning i inläggens text, ett inlägg kan höra till flera teman; datum saknas i större delen av urvalet och läggs till före nästa version. Flashback och Reddit, där språket före förlusten finns, ingår inte än.",
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
  { label: "Indlæg i udvalget", value: "4.211", source: "Lånforum (svensk gældsforum), tags for spilafhængighed og spillegæld; 71 tråde; hentet 12. oktober 2026" },
  { label: "Handler om tilbagebetaling, GDPR eller spilhistorik", value: "502", source: "nøgleord i teksten; et indlæg kan høre til flere rækker" },
  { label: "Nævner Spelpaus eller udelukkelse", value: "307", source: "samme metode" },
  { label: "Tæller spilfri dage", value: "253", source: "samme metode" },
  { label: "Angst, skam eller løgne", value: "192", source: "samme metode" },
  { label: "Partner eller forældre", value: "187", source: "samme metode" },
  { label: "Fogeden eller inkasso", value: "134", source: "samme metode" },
  { label: "Lønnen", value: "110", source: "samme metode" },
  { label: "”Vinde det tilbage”", value: "16", source: "samme metode" },
  { label: "”Jeg har styr på det”", value: "8", source: "samme metode" },
];

const da: PauseStatisticsMessages = {
  metadataTitle: "ROFUS i tal – registret, perioderne og det, ingen offentliggør",
  metadataDescription: "Spillemyndighedens egne tal om ROFUS som åbne data, de spørgsmål ingen myndighed svarer på endnu, vores anmodninger om aktindsigt og et udvalg af 4.211 forumindlæg.",
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
    heading: "Sådan lyder det bagefter: 4.211 forumindlæg",
    body: "Et udvalg af åbne indlæg på et svensk gældsforum om spil og gæld, kodet efter tema. Ingen citater gengives; forummet handler om tiden efter tabet – pengene tilbage, fogeden, dage uden spil – ikke om aftenen før.",
    rows: corpusRowsDa,
    method: "Metode: nøgleordssøgning i indlæggenes tekst; et indlæg kan høre til flere temaer; datoer mangler i det meste af udvalget og tilføjes før næste version. Danske fora og Reddit, hvor sproget før tabet findes, er ikke med endnu.",
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
  metadataDescription: "The regulators' own figures about Sweden's Spelpaus and Denmark's ROFUS as open data, what nobody publishes, our public-records requests, and a sample of 4,211 forum posts.",
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
    heading: "What it sounds like afterwards: 4,211 forum posts",
    body: "A sample of open posts on a Swedish debt forum about gambling and debt, coded by theme. No quotes are reproduced; the forum is about the time after the loss – refunds, the enforcement authority, days without gambling – not the evening before.",
    rows: [
      { label: "Posts in the sample", value: "4,211", source: "Lånforum, tags for gambling addiction and gambling debt; 71 threads; collected 12 October 2026" },
      { label: "About refunds, GDPR or gambling history", value: "502", source: "keywords in the text; one post can belong to several rows" },
      { label: "Mention Spelpaus or self-exclusion", value: "307", source: "same method" },
      { label: "Count gambling-free days", value: "253", source: "same method" },
      { label: "Anxiety, shame or lies", value: "192", source: "same method" },
      { label: "Partner or parents", value: "187", source: "same method" },
      { label: "Enforcement authority or debt collection", value: "134", source: "same method" },
      { label: "The salary", value: "110", source: "same method" },
      { label: "“Win it back”", value: "16", source: "same method" },
      { label: "“I'm in control”", value: "8", source: "same method" },
    ],
    method: "Method: keyword search in the text of the posts; one post can belong to several themes; dates are missing for most of the sample and will be added before the next version. Flashback and Reddit, where the language before the loss lives, are not included yet.",
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
