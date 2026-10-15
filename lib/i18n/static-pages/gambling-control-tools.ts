import type { SupportedLocale } from "@/lib/market/registry";
import { BRAND_STATEMENT, controlLocale, type ControlFaq, type ControlLocale } from "./gambling-control";

/**
 * Copy for /gambling-control-tools (Founder decision, 15 October 2026): an honest comparison of
 * the control tools for the page language's market (Swedish = Sweden, Danish = Denmark, English =
 * the United Kingdom). Every factual cell was read on the source listed in `sources` on
 * 15 October 2026. What could not be confirmed on an official page is left out or said plainly
 * ("ask your bank"); see docs/07_Decisions/AEO-CONTROL-PAGES-2026-10-15.md for the list.
 */
export type ControlToolRow = Readonly<{
  id: string;
  tool: string;
  kind: string;
  does: string;
  cost: string;
  notCovered: string;
  fits: string;
  /** A link inside the "when it fits" cell; only B4GAMBLE's row has one, to the pause plan. */
  fitsLink?: Readonly<{ label: string; path: string }>;
}>;

export type ControlToolsMessages = Readonly<{
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  question: string;
  titleLead: string;
  titleEmphasis: string;
  answer: string;
  tableHeading: string;
  caption: string;
  columns: Readonly<{ tool: string; does: string; cost: string; notCovered: string; fits: string }>;
  rows: readonly ControlToolRow[];
  notes: readonly string[];
  /** The English page names the other two tables. */
  otherMarkets?: Readonly<{ text: string; links: readonly Readonly<{ label: string; href: string }>[] }>;
  sourcesHeading: string;
  sources: readonly Readonly<{ label: string; href: string }>[];
  faq: ControlFaq;
  breadcrumbLabel: string;
}>;

const GAMBAN_SOURCES = [
  { label: "Gamban: pricing", href: "https://gamban.com/pricing" },
  { label: "Gamban: why TalkBanStop is ending", href: "https://gamban.com/blog/why-is-talkbanstop-ending" },
  { label: "Gamban: what does Gamban block?", href: "https://kb.gamban.com/en-gb/11-frequently-asked-questions/19-what-does-gamban-block" },
  { label: "Gamban: uninstalling Gamban", href: "https://kb.gamban.com/en-gb/10-uninstallation/46-uninstalling-gamban" },
  { label: "BetBlocker", href: "https://betblocker.org/" },
] as const;

const en: ControlToolsMessages = {
  metadataTitle: "Which gambling control tool fits you? GAMSTOP, Gamban, limits and more | B4GAMBLE",
  metadataDescription: "GAMSTOP, Gamban, BetBlocker, bank blocks, deposit limits, the National Gambling Helpline and B4GAMBLE side by side: what each does, what it costs and what it does not cover. Checked 15 October 2026.",
  eyebrow: "Control tools compared",
  question: "Which gambling control tool fits you?",
  titleLead: "Which gambling control tool",
  titleEmphasis: "fits you?",
  answer: `If you want to stop for a while, start with GAMSTOP: it blocks gambling websites and apps licensed in Great Britain and cannot be cancelled during the period you choose. Blocking software and a bank block add a second barrier, and a deposit limit caps one account. ${BRAND_STATEMENT["en-GB"]} It blocks nothing, so it fits when you have decided to keep playing by your own rules, or when a pause is ending.`,
  tableHeading: "The tools side by side",
  caption: "United Kingdom. Facts checked on 15 October 2026 at the sources below.",
  columns: { tool: "Tool", does: "What it does", cost: "Cost", notCovered: "What it does not cover", fits: "When it fits" },
  rows: [
    {
      id: "gamstop",
      tool: "GAMSTOP",
      kind: "National self-exclusion",
      does: "Blocks you from gambling websites and apps licensed in Great Britain for 6 months, 1 year or 5 years. You cannot cancel it during that period, and it stays in place afterwards until you contact GAMSTOP to remove it.",
      cost: "Free.",
      notCovered: "Gambling in person: high street bookmakers have a separate scheme, Gamstop Betting Shops. Sites without a licence in Great Britain.",
      fits: "You want to stop online gambling for a set time, with a barrier you cannot undo on a bad evening.",
    },
    {
      id: "gamban",
      tool: "Gamban",
      kind: "Blocking software",
      does: "Blocks gambling sites and apps on up to 15 of your devices, including sites without a licence. An installation cannot be removed early.",
      cost: "£4.99 a month or £29.99 a year after a 7-day free trial. Free for residents of Wales; no longer free in England and Scotland since 31 March 2026.",
      notCovered: "Gambling adverts and sports information sites (Gamban's own list), gambling in person, and any device it is not installed on.",
      fits: "You also want to block sites that GAMSTOP cannot reach, such as unlicensed ones.",
    },
    {
      id: "betblocker",
      tool: "BetBlocker",
      kind: "Blocking software",
      does: "Blocks more than a million gambling sites on your devices for a period you choose, from 1 day to 5 years. The block cannot be lifted before the period ends.",
      cost: "Free. BetBlocker is a charity registered in Scotland.",
      notCovered: "Gambling in person, and any device it is not installed on.",
      fits: "You want a free block on your phone or computer, with no account needed.",
    },
    {
      id: "bank",
      tool: "Bank gambling block",
      kind: "Your bank",
      does: "Stops card payments to online gambling accounts and betting shops. Some banks, such as Nationwide, let you switch it on in their app; Nationwide makes you wait 72 hours to switch it off again.",
      cost: "Check with your bank.",
      notCovered: "At Nationwide: bank transfers and open banking payments, some scratch cards and lottery tickets in shops, and gambling companies that use the wrong merchant code.",
      fits: "You want a barrier on the money itself, alongside a self-exclusion.",
    },
    {
      id: "operator-limits",
      tool: "Deposit limits and time-outs",
      kind: "At each gambling company",
      does: "Licensed operators must prompt you to set a deposit limit when you open an account or make your first deposit. Lowering a limit applies at once; raising it waits at least 24 hours. Time-outs of 24 hours, one week or one month and reality checks are offered too.",
      cost: "Part of your account.",
      notCovered: "Other gambling companies: each limit sits on one account. Setting a limit is prompted, not forced.",
      fits: "You have decided to play and want a hard ceiling on one site.",
    },
    {
      id: "helpline",
      tool: "National Gambling Helpline",
      kind: "Helpline, run by GamCare",
      does: "Advice and support by phone, 24 hours a day, 7 days a week: 0808 8020 133 in England and Scotland, 0808 2819 265 in Wales. GamCare also offers live chat on its website.",
      cost: "Free.",
      notCovered: "It blocks nothing by itself.",
      fits: "Gambling already hurts, or you want to talk it through before you decide.",
    },
    {
      id: "b4gamble",
      tool: "B4GAMBLE",
      kind: "Free 10-step programme",
      does: "Helps adults keep online gambling under control without having to quit: the amount and the time decided before playing, one person who knows, and a plan you review.",
      cost: "Free.",
      notCovered: "It blocks nothing, and it is not treatment.",
      fits: "You want to keep playing with your own rules, or a pause is ending and you want a plan for the day after.",
      fitsLink: { label: "The plan for the day after a pause", path: "/pause-plan" },
    },
  ],
  notes: [
    "The tools can be combined. GAMSTOP covers sites licensed in Great Britain; blocking software also covers unlicensed sites, but only on the devices where it is installed.",
  ],
  otherMarkets: {
    text: "In Sweden or Denmark the tools are different:",
    links: [
      { label: "Swedish table: Spelpaus, Stödlinjen and more", href: "/sv/gambling-control-tools" },
      { label: "Danish table: ROFUS, StopSpillet, Center for Ludomani and more", href: "/da/gambling-control-tools" },
    ],
  },
  sourcesHeading: "Sources (checked 15 October 2026)",
  sources: [
    { label: "GAMSTOP: about", href: "https://www.gamstop.co.uk/about" },
    { label: "GAMSTOP: terms of use (updated 20 May 2026)", href: "https://www.gamstop.co.uk/terms-of-use" },
    { label: "GAMSTOP: tools and support", href: "https://www.gamstop.co.uk/support" },
    { label: "NHS: help for problems with gambling (National Gambling Helpline)", href: "https://www.nhs.uk/live-well/addiction-support/gambling-addiction/" },
    { label: "Gambling Commission: public and players (helpline numbers)", href: "https://www.gamblingcommission.gov.uk/public-and-players" },
    { label: "Gambling Commission: RTS 12, financial limits", href: "https://www.gamblingcommission.gov.uk/standards/remote-gambling-and-software-technical-standards/rts-12-financial-limits" },
    { label: "Gambling Commission: changes to customer-led tools, financial limits", href: "https://www.gamblingcommission.gov.uk/blog/post/changes-to-customer-led-tools-financial-limits" },
    { label: "Gambling Commission: licence condition 3.3.4, remote time-out facility", href: "https://www.gamblingcommission.gov.uk/licensees-and-businesses/lccp/condition/3-3-4-remote-time-out-facility" },
    { label: "Gambling Commission: RTS 13, time requirements and reality checks", href: "https://www.gamblingcommission.gov.uk/standards/remote-gambling-and-software-technical-standards/rts-13-time-requirements-and-reality-checks" },
    { label: "Nationwide: gambling support", href: "https://www.nationwide.co.uk/help/challenging-times/gambling-support" },
    ...GAMBAN_SOURCES,
  ],
  faq: [
    ["Which tool stops online gambling completely?", "None on its own. GAMSTOP blocks sites and apps licensed in Great Britain; blocking software such as Gamban or BetBlocker also blocks unlicensed sites, but only on the devices where it is installed. Together they cover more than either alone."],
    ["Can I cancel GAMSTOP early?", "No. You cannot cancel your registration during the exclusion period, and it stays in place after the period until you contact GAMSTOP to remove it."],
    ["Is Gamban free?", "Not in England and Scotland since 31 March 2026: it costs £4.99 a month or £29.99 a year after a 7-day free trial. It is still free for residents of Wales. BetBlocker is free."],
    ["Where does B4GAMBLE fit?", "Beside the tools, not instead of them. B4GAMBLE blocks nothing; it helps you decide the amount and the time before you play and keep a plan. If a Spelpaus or ROFUS pause is ending, the pause plan shows the day it ends and the ten steps for the day after."],
  ],
  breadcrumbLabel: "Control tools compared",
};

const sv: ControlToolsMessages = {
  metadataTitle: "Vilket verktyg för spelkontroll passar dig? Spelpaus, Gamban, gränser med mera | B4GAMBLE",
  metadataDescription: "Spelpaus, Gamban, BetBlocker, banken, insättningsgränser, Stödlinjen och B4GAMBLE sida vid sida: vad de gör, vad de kostar och vad de inte täcker. Kontrollerat 15 oktober 2026.",
  eyebrow: "Verktygen jämförda",
  question: "Vilket verktyg för spelkontroll passar dig?",
  titleLead: "Vilket verktyg för spelkontroll",
  titleEmphasis: "passar dig?",
  answer: `Om du vill sluta en tid är Spelpaus.se rätt början: det stänger av dig från allt spel som kräver registrering hos alla spelbolag med svensk licens, och avstängningen går inte att ångra. Blockeringsprogram ger ett extra hinder, och en insättningsgräns sätter ett tak på ett konto. ${BRAND_STATEMENT["sv-SE"]} Det blockerar ingenting, så det passar när du har bestämt dig för att fortsätta spela med egna regler, eller när en paus tar slut.`,
  tableHeading: "Verktygen sida vid sida",
  caption: "Sverige. Uppgifterna kontrollerades den 15 oktober 2026 i källorna nedan.",
  columns: { tool: "Verktyg", does: "Vad det gör", cost: "Kostnad", notCovered: "Vad det inte täcker", fits: "När det passar" },
  rows: [
    {
      id: "spelpaus",
      tool: "Spelpaus.se",
      kind: "Nationell avstängning",
      does: "Stänger av dig från allt spel som kräver registrering hos alla spelbolag med svensk licens, på nätet och i butik eller på bana. Välj 10 dagar (sedan 29 juni 2026), 1, 3 eller 6 månader eller tills vidare. Avstängningen går inte att ångra eller avsluta i förtid; de bestämda perioderna upphör automatiskt, och tills vidare kan du avsluta tidigast efter 12 månader.",
      cost: "Gratis.",
      notCovered: "Lotter och skraplotter som inte säljs på nätet, traditionell bingo i lokal, kasinospel på restaurang, varuspelsautomater, spel på fartyg i internationell trafik och sajter utan svensk licens.",
      fits: "Du vill stoppa allt licensierat spel en tid, med ett hinder som inte går att ångra en dålig kväll.",
    },
    {
      id: "gamban",
      tool: "Gamban",
      kind: "Blockeringsprogram",
      does: "Blockerar spelsajter och spelappar på upp till 15 av dina enheter, även sajter utan licens. En installation går inte att ta bort i förtid.",
      cost: "4,99 pund i månaden eller 29,99 pund om året (gamban.com), efter sju dagars gratis provperiod.",
      notCovered: "Spelreklam och sajter med sportinformation (enligt Gamban), spel i butik och enheter där programmet inte är installerat.",
      fits: "Du vill blockera även sajter utan svensk licens, som Spelpaus inte når.",
    },
    {
      id: "betblocker",
      tool: "BetBlocker",
      kind: "Blockeringsprogram",
      does: "Blockerar över en miljon spelsajter på dina enheter under en tid du väljer, från 1 dag till 5 år. Spärren går inte att häva innan tiden är ute.",
      cost: "Gratis. BetBlocker är en välgörenhetsorganisation registrerad i Skottland.",
      notCovered: "Spel i butik och enheter där programmet inte är installerat.",
      fits: "Du vill ha en gratis spärr på telefonen eller datorn, utan konto.",
    },
    {
      id: "bank",
      tool: "Banken och kortet",
      kind: "Din bank",
      does: "Enligt lag ska kortbetalningar till spelbolag utan svensk licens nekas. En egen spelspärr på kortet får du fråga din bank om: vi har inte kunnat bekräfta en sådan funktion på de stora bankernas egna sidor.",
      cost: "Fråga din bank.",
      notCovered: "Spel med svensk licens, och andra sätt att betala än med kort.",
      fits: "Du vill ha ett hinder på själva pengarna, utöver Spelpaus.",
    },
    {
      id: "operator-limits",
      tool: "Insättningsgräns",
      kind: "Hos varje spelbolag",
      does: "Vid spel på nätet måste du ange en gräns för dina insättningar per dag, vecka och månad. En sänkning gäller direkt; en höjning gäller tidigast efter 72 timmar. Du får också frågan om du vill begränsa din inloggningstid, men det är frivilligt.",
      cost: "Ingår i ditt spelkonto.",
      notCovered: "Andra spelbolag: gränsen sitter på ett konto hos ett spelbolag.",
      fits: "Du har bestämt dig för att spela och vill ha ett tak som håller hos det spelbolaget.",
    },
    {
      id: "helpline",
      tool: "Stödlinjen",
      kind: "Stödlinje om spel",
      does: "Råd och stöd på telefon och i chatt: 020-81 91 00. Du behöver inte säga vem du är. Öppet helgfria vardagar: måndag 9–19, tisdag och onsdag 9–17, torsdag 11–19 och fredag 9–15. Drivs av Stockholms läns sjukvårdsområde med stöd från Folkhälsomyndigheten.",
      cost: "Gratis.",
      notCovered: "Den blockerar ingenting, och den har stängt på helger.",
      fits: "Spelandet gör redan ont, eller du vill prata igenom det innan du bestämmer dig.",
    },
    {
      id: "b4gamble",
      tool: "B4GAMBLE",
      kind: "Gratis program i 10 steg",
      does: "Hjälper vuxna att hålla sitt spelande på nätet under kontroll utan att behöva sluta: summan och tiden bestämda före spelet, en person som vet och en plan som du går igenom igen.",
      cost: "Gratis.",
      notCovered: "Det blockerar ingenting, och det är ingen behandling.",
      fits: "Du vill fortsätta spela med egna regler, eller din spelpaus tar slut och du vill ha en plan för dag 11.",
      fitsLink: { label: "Planen för dag 11", path: "/pause-plan" },
    },
  ],
  notes: [
    "Knappt 138 000 personer var avstängda via Spelpaus.se vid utgången av juni 2026, enligt Spelinspektionen.",
    "Verktygen går att kombinera. Spelpaus gäller spelbolag med svensk licens; blockeringsprogram spärrar även sajter utan licens, men bara på de enheter där de är installerade.",
  ],
  sourcesHeading: "Källor (kontrollerade 15 oktober 2026)",
  sources: [
    { label: "Spelpaus.se: frågor och svar", href: "https://www.spelpaus.se/fragor-svar/" },
    { label: "Spelpaus.se: så här fungerar det", href: "https://www.spelpaus.se/sa-har-fungerar-det/" },
    { label: "Spelinspektionen: nu kan du stänga av dig från spel i 10 dagar på Spelpaus.se (29 juni 2026)", href: "https://www.spelinspektionen.se/nyhetsarkiv/nu-kan-du-stanga-av-dig-fran-spel-i-10-dagar-pa-spelpaus.se" },
    { label: "Spelinspektionen: spelmarknaden under andra kvartalet 2026 (26 augusti 2026)", href: "https://www.spelinspektionen.se/nyhetsarkiv/spelbolag-med-svensk-licens-omsatte-74-miljarder-kronor-under-andra-kvartalet" },
    { label: "Spellag (2018:1138), riksdagen.se", href: "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/spellag-20181138_sfs-2018-1138/" },
    { label: "Spelförordning (2018:1475), riksdagen.se", href: "https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/spelforordning-20181475_sfs-2018-1475/" },
    { label: "Spelinspektionen: frågor och svar för spelaktörer", href: "https://www.spelinspektionen.se/licensansokan/fragor-och-svar-for-spelaktorer/" },
    { label: "Stödlinjen", href: "https://stodlinjen.se/" },
    { label: "Stödlinjen: ett samtal med oss", href: "https://stodlinjen.se/om-oss/ett-samtal-med-oss" },
    { label: "Stödlinjen: chatt", href: "https://stodlinjen.se/chatt" },
    ...GAMBAN_SOURCES,
  ],
  faq: [
    ["Kan jag avsluta Spelpaus i förtid?", "Nej. En avstängning går inte att ångra eller avsluta i förtid. 10 dagar och 1, 3 och 6 månader upphör automatiskt; tills vidare kan du avsluta tidigast efter 12 månader."],
    ["Täcker Spelpaus casinon utan svensk licens?", "Nej. Spelpaus gäller spelbolag med svensk licens. Blockeringsprogram som Gamban och BetBlocker spärrar även sajter utan licens, på de enheter där de är installerade."],
    ["Hur många är avstängda via Spelpaus?", "Knappt 138 000 personer vid utgången av juni 2026, enligt Spelinspektionen."],
    ["Har Stödlinjen öppet dygnet runt?", "Nej. Stödlinjen har öppet helgfria vardagar: måndag 9–19, tisdag och onsdag 9–17, torsdag 11–19 och fredag 9–15. Om det är akut, ring 112."],
    ["Var passar B4GAMBLE in?", "Bredvid verktygen, inte i stället för dem. B4GAMBLE blockerar ingenting; programmet hjälper dig att bestämma summan och tiden innan du spelar och att hålla en plan. Om din spelpaus snart tar slut visar pausplanen vilken dag den går ut och de tio stegen för dag 11."],
  ],
  breadcrumbLabel: "Verktygen jämförda",
};

const da: ControlToolsMessages = {
  metadataTitle: "Hvilket værktøj til spilkontrol passer til dig? ROFUS, Gamban, grænser med mere | B4GAMBLE",
  metadataDescription: "ROFUS, Gamban, BetBlocker, banken, indbetalingsgrænser, StopSpillet, Center for Ludomani og B4GAMBLE side om side: hvad de gør, hvad de koster, og hvad de ikke dækker. Tjekket 15. oktober 2026.",
  eyebrow: "Værktøjerne sammenlignet",
  question: "Hvilket værktøj til spilkontrol passer til dig?",
  titleLead: "Hvilket værktøj til spilkontrol",
  titleEmphasis: "passer til dig?",
  answer: `Hvis du vil stoppe i en periode, er ROFUS det rigtige sted at begynde: det udelukker dig fra onlinespil hos udbydere med tilladelse fra Spillemyndigheden og fra fysiske casinoer og væddemål i butikker, og en registrering er bindende. Blokeringsprogrammer giver en ekstra spærre, og en indbetalingsgrænse sætter et loft på én konto. ${BRAND_STATEMENT["da-DK"]} Det blokerer ingenting, så det passer, når du har besluttet at blive ved med at spille efter dine egne regler, eller når en pause udløber.`,
  tableHeading: "Værktøjerne side om side",
  caption: "Danmark. Oplysningerne er tjekket den 15. oktober 2026 i kilderne herunder.",
  columns: { tool: "Værktøj", does: "Hvad det gør", cost: "Pris", notCovered: "Hvad det ikke dækker", fits: "Hvornår det passer" },
  rows: [
    {
      id: "rofus",
      tool: "ROFUS",
      kind: "Register over frivilligt udelukkede spillere",
      does: "Udelukker dig fra al onlinespil hos udbydere med tilladelse fra Spillemyndigheden og fra alle fysiske casinoer og væddemål i butikker i Danmark. Vælg 24 timer, 1, 3 eller 6 måneder eller endelig udelukkelse. En registrering er bindende og kan ikke annulleres; en midlertidig udelukkelse ophæves automatisk, når perioden er udløbet, og en endelig udelukkelse kan du tidligst bede om at få slettet et år efter registreringen. Du registrerer dig med MitID.",
      cost: "rofus.nu nævner ingen pris.",
      notCovered: "Sider uden dansk licens. ROFUS' egen liste nævner kun onlinespil, fysiske casinoer og væddemål i butikker.",
      fits: "Du vil stoppe al spil med dansk licens i en periode, med en spærre, du ikke kan fortryde en dårlig aften.",
    },
    {
      id: "gamban",
      tool: "Gamban",
      kind: "Blokeringsprogram",
      does: "Blokerer spilsider og spilapps på op til 15 af dine enheder, også sider uden licens. En installation kan ikke fjernes før tid.",
      cost: "4,99 pund om måneden eller 29,99 pund om året (gamban.com), efter syv dages gratis prøveperiode.",
      notCovered: "Spilreklamer og sider med sportsinformation (ifølge Gamban), spil i fysiske butikker og enheder, hvor programmet ikke er installeret.",
      fits: "Du vil også blokere sider uden dansk licens, som ROFUS ikke når.",
    },
    {
      id: "betblocker",
      tool: "BetBlocker",
      kind: "Blokeringsprogram",
      does: "Blokerer over en million spilsider på dine enheder i en periode, du vælger, fra 1 dag til 5 år. Spærren kan ikke ophæves, før perioden er slut.",
      cost: "Gratis. BetBlocker er en velgørende organisation registreret i Skotland.",
      notCovered: "Spil i fysiske butikker og enheder, hvor programmet ikke er installeret.",
      fits: "Du vil have en gratis spærre på telefonen eller computeren uden at oprette en konto.",
    },
    {
      id: "bank",
      tool: "Banken og kortet",
      kind: "Din bank",
      does: "Center for Ludomani råder spillere til at lukke deres Visa/Dankort, Visa Electron og andre hævekort. Om din bank kan spærre for spil på kortet, må du spørge banken om: vi har ikke kunnet bekræfte en sådan funktion på de store bankers egne sider.",
      cost: "Spørg din bank.",
      notCovered: "Det virker kun for de kort og konti, du lukker eller spærrer.",
      fits: "Du vil have en spærre på selve pengene ud over ROFUS.",
    },
    {
      id: "operator-limits",
      tool: "Indbetalingsgrænse",
      kind: "Hos hver spiludbyder",
      does: "Du skal sætte en indbetalingsgrænse – daglig, ugentlig eller månedlig – før du kan begynde at spille. En forhøjelse træder tidligst i kraft efter 24 timer.",
      cost: "Indgår i din spilkonto.",
      notCovered: "Andre spiludbydere: grænsen gælder kun hos den enkelte udbyder.",
      fits: "Du har besluttet at spille og vil have et loft, der holder hos den udbyder.",
    },
    {
      id: "helpline",
      tool: "StopSpillet",
      kind: "Spillemyndighedens hjælpelinje",
      does: "Gratis og fortrolig hjælpelinje om spilproblemer: 70 22 28 25. Telefonen har åbent mandag-torsdag 9-21 og fredag 9-17, chatten mandag-torsdag 17-21 og fredag 14-17.",
      cost: "Gratis.",
      notCovered: "Den blokerer ingenting, og den har lukket i weekenden.",
      fits: "Spillet gør allerede ondt, eller du vil tale det igennem, før du beslutter dig.",
    },
    {
      id: "treatment",
      tool: "Center for Ludomani",
      kind: "Behandling og rådgivning",
      does: "Gratis og anonym behandling og rådgivning uden henvisning fra lægen: 70 11 18 10. Telefontid mandag-onsdag 8.30-15, torsdag 9-17 og fredag 8.30-12.",
      cost: "Gratis.",
      notCovered: "Den blokerer ingenting.",
      fits: "Du vil have behandling eller rådgivning.",
    },
    {
      id: "b4gamble",
      tool: "B4GAMBLE",
      kind: "Gratis program i 10 trin",
      does: "Hjælper voksne med at holde styr på deres pengespil på nettet uden at skulle stoppe: beløbet og tiden besluttet før spillet, ét menneske, der ved det, og en plan, som du gennemgår igen.",
      cost: "Gratis.",
      notCovered: "Det blokerer ingenting, og det er ikke behandling.",
      fits: "Du vil blive ved med at spille efter dine egne regler, eller din ROFUS-pause udløber, og du vil have en plan for dagen efter.",
      fitsLink: { label: "Planen for dagen efter", path: "/pause-plan" },
    },
  ],
  notes: [
    "68.026 danskere var registreret i ROFUS ved udgangen af 2025, ifølge Spillemyndigheden.",
    "Værktøjerne kan kombineres. ROFUS gælder udbydere med dansk licens; blokeringsprogrammer spærrer også sider uden licens, men kun på de enheder, hvor de er installeret.",
  ],
  sourcesHeading: "Kilder (tjekket 15. oktober 2026)",
  sources: [
    { label: "ROFUS: om ROFUS", href: "https://rofus.nu/om-rofus" },
    { label: "ROFUS: ofte stillede spørgsmål", href: "https://rofus.nu/ofte-stillede-spoergsmaal" },
    { label: "Spillemyndigheden: Spilmarkedet i tal 2025 (juni 2026)", href: "https://spillemyndigheden.dk/media/yogdbicq/spilmarkedet-i-tal-2025.pdf" },
    { label: "Bekendtgørelse om onlinekasino (BEK nr. 682 af 11. juni 2025), § 21", href: "https://www.retsinformation.dk/eli/lta/2025/682" },
    { label: "Spillemyndigheden: gode råd til dig, der spiller", href: "https://spillemyndigheden.dk/borgere-og-spillere/gode-raad-til-dig-der-spiller" },
    { label: "StopSpillet", href: "https://www.stopspillet.dk/" },
    { label: "Spillemyndigheden: StopSpillet – national hjælpelinje om spilproblemer", href: "https://spillemyndigheden.dk/borgere-og-spillere/stopspillet-national-hjaelpelinje-om-spilproblemer" },
    { label: "Center for Ludomani", href: "https://ludomani.dk/" },
    { label: "Center for Ludomani: gode råd til spillere", href: "https://ludomani.dk/gode-rad-til-spillere/" },
    ...GAMBAN_SOURCES,
  ],
  faq: [
    ["Kan jeg fortryde ROFUS?", "Nej. En registrering i ROFUS er bindende og kan ikke annulleres. En midlertidig udelukkelse ophæves automatisk, når perioden er udløbet; en endelig udelukkelse kan du tidligst bede om at få slettet et år efter registreringen."],
    ["Dækker ROFUS udenlandske casinoer?", "Nej. ROFUS dækker onlinespil hos udbydere med tilladelse fra Spillemyndigheden og fysiske casinoer og væddemål i butikker i Danmark. Blokeringsprogrammer som Gamban og BetBlocker spærrer også sider uden licens, på de enheder, hvor de er installeret."],
    ["Hvor mange er registreret i ROFUS?", "68.026 danskere ved udgangen af 2025, ifølge Spillemyndigheden."],
    ["Har StopSpillet åbent hele døgnet?", "Nej. Telefonen har åbent mandag-torsdag 9-21 og fredag 9-17, chatten mandag-torsdag 17-21 og fredag 14-17. Hvis det haster akut, så ring 112."],
    ["Hvor passer B4GAMBLE ind?", "Ved siden af værktøjerne, ikke i stedet for dem. B4GAMBLE blokerer ingenting; programmet hjælper dig med at bestemme beløbet og tiden, før du spiller, og med at holde en plan. Hvis din ROFUS-pause snart udløber, viser pauseplanen, hvilken dag den slutter, og de ti trin til dagen efter."],
  ],
  breadcrumbLabel: "Værktøjerne sammenlignet",
};

const catalog: Readonly<Record<ControlLocale, ControlToolsMessages>> = { "en-GB": en, "sv-SE": sv, "da-DK": da };

export function controlToolsMessages(locale: SupportedLocale): ControlToolsMessages {
  return catalog[controlLocale(locale)];
}
