import type { SupportedLocale } from "@/lib/market/registry";

/**
 * Copy for /forum-study, the read-out of 3,299 coded forum posts (Founder decision, 13 October
 * 2026, mechanism «Öppna data i stället för pressmeddelande»; the study itself ran 17 October
 * 2026 and its numbers live in the content repo at `research/study/`).
 *
 * Every figure on this page was recomputed from the coded files on 18 October 2026 and matches
 * `research/study/stats.json` exactly. Three rules govern the copy:
 *
 * 1. **A number never appears without its denominator.** Each row prints "k of n", because two
 *    thirds of the posts are replies and a share over 3,299 is a different claim from a share
 *    over the 925 posts where someone writes about their own gambling.
 * 2. **What the material cannot show is on the page, not in a footnote.** The payday story, a
 *    trend over years, any Danish figure and any rate in the population are all unsupported
 *    here, and the page says so in its own section.
 * 3. **No quotations, no usernames, no thread addresses** — on the page or in the CSV. The
 *    published file carries aggregates only.
 *
 * The title is the question the study asked. The material answers it with a silence: 49 posts of
 * 3,299 are about the time before the loss, which is the first thing the page says.
 */
export type ForumStudyRow = Readonly<{ label: string; value: string; of: string }>;

export type ForumStudyMessages = Readonly<{
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  titleLead: string;
  titleEmphasis: string;
  intro: string;
  /** The revenue model, stated in the header. A claim about these figures, never about the menu. */
  revenueLine: string;
  material: Readonly<{ heading: string; body: string; rows: readonly ForumStudyRow[]; note: string }>;
  whoWrites: Readonly<{ heading: string; body: string; rows: readonly ForumStudyRow[] }>;
  register: Readonly<{ heading: string; body: string; rows: readonly ForumStudyRow[]; note: string }>;
  money: Readonly<{ heading: string; body: string; rows: readonly ForumStudyRow[]; note: string }>;
  helped: Readonly<{ heading: string; body: string; rows: readonly ForumStudyRow[]; note: string }>;
  counters: Readonly<{ heading: string; body: string; rows: readonly ForumStudyRow[] }>;
  cannot: Readonly<{ heading: string; intro: string; items: readonly string[] }>;
  method: Readonly<{ heading: string; items: readonly string[] }>;
  data: Readonly<{ heading: string; body: string; csvLabel: string; csvHref: string; licence: string }>;
  next: Readonly<{ heading: string; body: string; planLabel: string; programmeLabel: string }>;
  sources: Readonly<{ heading: string; body: string; statisticsLabel: string }>;
  homeLabel: string;
  breadcrumbLabel: string;
}>;

/** The file every locale links to; one CSV, built from `research/study/aggregates-csv.mjs`. */
export const FORUM_STUDY_CSV = "/data/forum-study-aggregates.csv";

const en: ForumStudyMessages = {
  metadataTitle: "What it sounds like before it goes wrong – 3,299 forum posts, coded",
  metadataDescription:
    "We read 3,299 open forum posts about gambling, debt and self-exclusion and coded every post against a fixed scheme. The figures with their denominators, the method, what the material cannot show, and the aggregates as an open CSV.",
  eyebrow: "Open data · 3,299 posts",
  titleLead: "What it sounds like",
  titleEmphasis: "before it goes wrong.",
  intro:
    "That is the question we set out to answer, and the material answers it with a silence: 49 posts of 3,299 are about the time before the loss. Almost nobody writes on the evening it is still going well. What is written down is afterwards — the money, the register, the days counted one by one. Here is all of it, with every denominator, every rule and every number the material cannot carry.",
  revenueLine: "B4GAMBLE earns commission from licensed casinos. Nothing in these figures links to one; the site menu does.",
  material: {
    heading: "What was read",
    body:
      "Three open forums: a Swedish debt forum (threads tagged gambling addiction, gambling debt and casino), a Swedish parenting forum's sensitive-topics room, and five subreddits. A post counts only when it stands on its own words — a reply that consists of a quoted earlier post says nothing of its own, and 2,505 such posts were dropped before coding so the same sentences were not counted twice.",
    rows: [
      { label: "Swedish debt forum", value: "1,695 coded", of: "1,695 posts that stand on their own words, of 4,211 collected" },
      { label: "Swedish parenting forum", value: "604 coded", of: "604 posts that stand on their own words, of 605 collected" },
      { label: "Reddit", value: "1,000 coded", of: "a fixed selection from 3,178 posts that stand on their own words, of 3,295 collected" },
      { label: "Coded in total", value: "3,299 posts", of: "3,299 coded records, 1 per post, every field allowed to be left unknown" },
    ],
    note:
      "The two Swedish forums are coded in full, so their figures are counts, not estimates. The Reddit third is a fixed 1,000-post selection and not a representative sample: the draw follows the posts' running numbers, and two of the five subreddits fell outside it entirely. Of the Reddit posts coded, 918 are Swedish and 82 Danish.",
  },
  whoWrites: {
    heading: "Who writes",
    body:
      "Most posts in a thread are answers to somebody else. That is why the figures below are split: a share over all 3,299 posts and a share over the 925 posts where a person writes about their own gambling are two different claims, and both denominators are printed everywhere on this page.",
    rows: [
      { label: "Writes about their own gambling", value: "925", of: "3,299 posts (28.0 %)" },
      { label: "Writes about someone else's", value: "127", of: "3,299 posts (3.9 %)" },
      { label: "An answer or a comment with no gambling of their own", value: "2,210", of: "3,299 posts (67.0 %)" },
    ],
  },
  register: {
    heading: "The register",
    body:
      "A self-exclusion register — Sweden's Spelpaus, Denmark's ROFUS or a block set with one operator — is named in 174 posts. Those 174 posts are the denominator of every line that follows, and they are the clearest thing in the whole material: when the register comes up, a way round it or a way back to gambling comes up with it in more than a third of the posts.",
    rows: [
      { label: "Names a self-exclusion register", value: "174", of: "3,299 posts (5.3 %)" },
      { label: "Describes signing up", value: "130", of: "174 posts naming a register (74.7 %)" },
      { label: "A way round it or a way back, all three together", value: "65", of: "174 posts naming a register (37.4 %)" },
      { label: "— played somewhere else during the pause", value: "36", of: "174 posts naming a register (20.7 %)" },
      { label: "— played again once the period ended", value: "23", of: "174 posts naming a register (13.2 %)" },
      { label: "— tried to have the pause lifted early", value: "15", of: "174 posts naming a register (8.6 %)" },
      { label: "Describes sitting the period out", value: "2", of: "174 posts naming a register" },
      { label: "Describes extending it", value: "4", of: "174 posts naming a register" },
      { label: "Stands at the end of a pause, the day the accounts reopen", value: "8", of: "3,299 posts" },
    ],
    note:
      "The last three rows are the most easily misread in the study. Two posts about sitting the period out does not mean few people do it: a quiet month gives nobody a reason to write a forum post. The same holds for the reopening day — eight posts in 3,299 is not a measure of how much that day matters, it is a measure of how little is said about it anywhere.",
  },
  money: {
    heading: "The money",
    body:
      "These four rows have the 925 posts about a person's own gambling as their denominator. One of the three forums is a debt forum, where loans and collection are the subject of the room, so none of this can be read as how often a player borrows.",
    rows: [
      { label: "Quick credit: a short-term loan, a credit card or borrowing from family", value: "161", of: "925 posts about their own gambling (17.4 %)" },
      { label: "Names a sum", value: "322", of: "925 posts about their own gambling (34.8 %)" },
      { label: "— of those, more than 100,000 kronor", value: "209", of: "322 posts naming a sum (64.9 %)" },
      { label: "Enforcement or debt collection", value: "62", of: "925 posts about their own gambling (6.7 %)" },
    ],
    note:
      "Whether a sum is named at all was coded reliably (two coders agreed on 95 % of the re-coded posts); which band it falls into was not (71 %). So the figure published is the coarse one — named or not named — and above or below 100,000 kronor. People write the number down when it is big; this is not the typical loss.",
  },
  helped: {
    heading: "What is said to have helped",
    body:
      "Counted only where a post names something as having helped. Most posts name nothing, so every share here is small by construction, and the order matters more than the size.",
    rows: [
      { label: "Treatment or a helpline", value: "109", of: "925 posts about their own gambling (11.8 %)" },
      { label: "Time and routine", value: "81", of: "925 posts about their own gambling (8.8 %)" },
      { label: "A register or a block with an operator", value: "69", of: "925 posts about their own gambling (7.5 %)" },
      { label: "Telling someone", value: "55", of: "925 posts about their own gambling (5.9 %)" },
      { label: "Handing the money to someone else", value: "54", of: "925 posts about their own gambling (5.8 %)" },
      { label: "Blocking software or a block at the bank", value: "22", of: "925 posts about their own gambling (2.4 %)" },
      { label: "A debt plan", value: "22", of: "925 posts about their own gambling (2.4 %)" },
      { label: "Says plainly that nothing helped", value: "11", of: "925 posts about their own gambling (1.2 %)" },
    ],
    note: "This is what people mention. It is not evidence of what works, and it is not a ranking of treatments.",
  },
  counters: {
    heading: "The days people count",
    body:
      "102 posts carry the writer's own count of days without gambling. Weeks, months and years were converted to days. A counter is posted as a milestone, which is exactly why the first month is almost missing: it is lived, not published.",
    rows: [
      { label: "Posts with a count of their own", value: "102", of: "3,299 posts" },
      { label: "Middle value of the count", value: "365 days", of: "102 posts with a count" },
      { label: "A year or more", value: "52", of: "102 posts with a count" },
      { label: "Under 30 days", value: "7", of: "102 posts with a count" },
    ],
  },
  cannot: {
    heading: "What this material cannot show",
    intro: "Every item below is a claim we could have made from these numbers and do not make.",
    items: [
      "Not shares of people. A post is not a person, the same person can write many posts, and nobody here was asked a question — they all chose to write.",
      "Not how often anything happens. Silence is not absence: whoever sits out a pause quietly has nothing to post about, which is why two posts about waiting it out cannot be turned into a rate.",
      "No payday story. Payday or the small hours are named in 25 of the 925 posts about a person's own gambling (2.7 %). That will not carry a claim about the week the salary arrives, and we publish none.",
      "No change over the years. The share moves up and down between years with no direction, and the mix of forums changes from year to year, which is enough on its own to produce a false trend. No year-on-year figure is published here.",
      "Nothing Danish. 82 Danish posts were coded and ROFUS is named 7 times in the whole material. Danish figures need Danish material, collected on its own.",
      "The Reddit third is a fixed selection of 1,000 posts out of 3,178, not a representative sample, so no figure here describes Reddit, or Sweden, as a population. The two Swedish forums are coded in full.",
      "Two thirds of the posts are answers and comments. A share over 3,299 posts is therefore far smaller than the same share over the 925 posts about a person's own gambling, and both are printed.",
      "The question in the title is not answered here. 49 posts of 3,299 place anyone before the trouble; the one forum where people write while still playing does not serve this collection.",
    ],
  },
  method: {
    heading: "How it was done",
    items: [
      "One unit is one post. Each is judged on its own, without the thread around it, against a closed scheme of twelve fields in which every field may be left unknown.",
      "No quotations anywhere. Everything is paraphrased: no usernames, no thread addresses, no quoted sentences.",
      "A light language model coded all 3,299 posts in batches of at most 50. Larger batches were thrown away: at 80 and at 150 posts the coder began inventing triggers and reasons the posts did not contain. Coverage was checked post by post, by identifier.",
      "165 posts (5 %) were coded again, blind, by a stronger model. Agreement runs from 0.71 to 0.96 by field, and from 0.90 to 0.99 on the coarse questions this page actually asks. Nothing fell below 0.70, so no field was dropped; the one weak field is published only in its coarse form.",
      "No share is reported on fewer than 30 posts. Every share in the file carries a 95 % interval.",
      "The posts themselves are not published. Researchers can have the collection under their own ethical approval.",
    ],
  },
  data: {
    heading: "The numbers as a file",
    body:
      "Every figure on this page, and the counts behind them, in one CSV: section, name, scope, count, denominator, share, and the 95 % interval where there is one. Reuse it, check it, or disagree with it.",
    csvLabel: "Download as CSV",
    csvHref: FORUM_STUDY_CSV,
    licence:
      "Free to use with attribution (CC BY 4.0). The file holds aggregates only — rows, denominators and shares. No post text, no users, no thread addresses.",
  },
  next: {
    heading: "What the numbers are for",
    body:
      "The register appears in this material mostly at its two edges: the day a person signs up, and the day it ends. The second one is almost unwritten — eight posts in 3,299. That day is what the plan below is built around, and the ten steps are free and need no account.",
    planLabel: "The plan for the day after",
    programmeLabel: "Start the ten steps",
  },
  sources: {
    heading: "Sources",
    body:
      "The forums are open and public; they are described here in words and never linked to a thread, because no person in this material asked to be quoted. The regulators' own figures about Spelpaus and ROFUS, with their sources and files, are on their own page.",
    statisticsLabel: "Self-exclusion in numbers: the regulators' figures",
  },
  homeLabel: "Home",
  breadcrumbLabel: "Before it goes wrong",
};

const sv: ForumStudyMessages = {
  metadataTitle: "Så låter det innan det går snett – 3 299 foruminlägg, kodade",
  metadataDescription:
    "Vi läste 3 299 öppna foruminlägg om spel, skulder och avstängning och kodade varje inlägg mot ett fast schema. Siffrorna med sina nämnare, metoden, det materialet inte kan visa, och alla aggregat som öppen CSV.",
  eyebrow: "Öppna data · 3 299 inlägg",
  titleLead: "Så låter det",
  titleEmphasis: "innan det går snett.",
  intro:
    "Det var frågan vi ville svara på, och materialet svarar med en tystnad: 49 inlägg av 3 299 handlar om tiden före förlusten. Nästan ingen skriver den kvällen då det fortfarande går bra. Det som skrivs ner är efteråt — pengarna, registret, dagarna som räknas en i taget. Här är alltihop, med varje nämnare, varje regel och varje siffra materialet inte håller för.",
  revenueLine: "B4GAMBLE tjänar provision från licensierade casinon. Ingenting i de här siffrorna länkar till något av dem; det gör menyn.",
  material: {
    heading: "Det här läste vi",
    body:
      "Tre öppna forum: ett svenskt låneforum (trådar taggade spelmissbruk, spelberoende, casino och spelskulder), Känsliga rummet på ett svenskt familjeforum, och fem subreddits. Ett inlägg räknas bara om det står på egna ord — ett svar som bara består av ett citerat tidigare inlägg säger ingenting eget, och 2 505 sådana inlägg togs bort före kodningen så att samma meningar inte räknades två gånger.",
    rows: [
      { label: "Svenskt låneforum", value: "1 695 kodade", of: "1 695 inlägg som står på egna ord, av 4 211 hämtade" },
      { label: "Svenskt familjeforum", value: "604 kodade", of: "604 inlägg som står på egna ord, av 605 hämtade" },
      { label: "Reddit", value: "1 000 kodade", of: "ett fast urval ur 3 178 inlägg som står på egna ord, av 3 295 hämtade" },
      { label: "Kodade totalt", value: "3 299 inlägg", of: "3 299 kodade rader, 1 per inlägg; varje fält fick lämnas som vet inte" },
    ],
    note:
      "De två svenska forumen är kodade i sin helhet, så deras siffror är räkningar och inte skattningar. Reddit-delen är ett fast urval på 1 000 inlägg och inte ett representativt stickprov: urvalet följer inläggens ordningsnummer, och två av de fem subredditarna hamnade helt utanför. Av de kodade Reddit-inläggen är 918 svenska och 82 danska.",
  },
  whoWrites: {
    heading: "Vem skriver",
    body:
      "De flesta inlägg i en tråd är svar till någon annan. Därför är siffrorna nedan uppdelade: en andel av alla 3 299 inlägg och en andel av de 925 inlägg där någon skriver om sitt eget spelande är två olika påståenden, och båda nämnarna står tryckta överallt på den här sidan.",
    rows: [
      { label: "Skriver om sitt eget spelande", value: "925", of: "3 299 inlägg (28,0 %)" },
      { label: "Skriver om någon annans", value: "127", of: "3 299 inlägg (3,9 %)" },
      { label: "Ett svar eller en kommentar utan eget spelande", value: "2 210", of: "3 299 inlägg (67,0 %)" },
    ],
  },
  register: {
    heading: "Registret",
    body:
      "Ett avstängningsregister — Spelpaus, danska ROFUS eller en avstängning hos ett enskilt spelbolag — nämns i 174 inlägg. De 174 inläggen är nämnaren för varje rad nedan, och de är det tydligaste i hela materialet: när registret kommer upp kommer en väg runt det eller en väg tillbaka till spelet upp tillsammans med det i mer än en tredjedel av inläggen.",
    rows: [
      { label: "Nämner ett avstängningsregister", value: "174", of: "3 299 inlägg (5,3 %)" },
      { label: "Beskriver att de registrerade sig", value: "130", of: "174 inlägg som nämner ett register (74,7 %)" },
      { label: "En väg runt eller en väg tillbaka, alla tre tillsammans", value: "65", of: "174 inlägg som nämner ett register (37,4 %)" },
      { label: "— spelade någon annanstans under pausen", value: "36", of: "174 inlägg som nämner ett register (20,7 %)" },
      { label: "— spelade igen när perioden tog slut", value: "23", of: "174 inlägg som nämner ett register (13,2 %)" },
      { label: "— försökte få pausen hävd i förtid", value: "15", of: "174 inlägg som nämner ett register (8,6 %)" },
      { label: "Beskriver att de satt ut perioden", value: "2", of: "174 inlägg som nämner ett register" },
      { label: "Beskriver att de förlängde den", value: "4", of: "174 inlägg som nämner ett register" },
      { label: "Står vid slutet av en paus, dagen kontona öppnas igen", value: "8", of: "3 299 inlägg" },
    ],
    note:
      "De tre sista raderna är de som lättast läses fel. Två inlägg om att sitta ut perioden betyder inte att få gör det: en tyst månad ger ingen anledning att skriva ett foruminlägg. Samma sak gäller dagen då kontona öppnas igen — åtta inlägg av 3 299 mäter inte hur mycket den dagen betyder, utan hur lite som sägs om den någonstans.",
  },
  money: {
    heading: "Pengarna",
    body:
      "De fyra raderna har de 925 inläggen om eget spelande som nämnare. Ett av de tre forumen är ett låneforum, där lån och inkasso är rummets ämne, så ingenting av det här kan läsas som hur ofta en spelare lånar.",
    rows: [
      { label: "Snabblån, kreditkort eller lån av familjen", value: "161", of: "925 inlägg om eget spelande (17,4 %)" },
      { label: "Nämner en summa", value: "322", of: "925 inlägg om eget spelande (34,8 %)" },
      { label: "— av dem över 100 000 kronor", value: "209", of: "322 inlägg som nämner en summa (64,9 %)" },
      { label: "Kronofogden eller inkasso", value: "62", of: "925 inlägg om eget spelande (6,7 %)" },
    ],
    note:
      "Om en summa alls nämns kodades säkert (två kodare var överens i 95 procent av de omkodade inläggen); vilket spann den hamnar i gjordes det inte (71 procent). Därför publiceras den grova siffran — nämnd eller inte nämnd — och över eller under 100 000 kronor. Man skriver ner talet när det är stort; det här är inte den typiska förlusten.",
  },
  helped: {
    heading: "Det som sägs ha hjälpt",
    body:
      "Räknat bara där ett inlägg pekar ut något som hjälpte. De flesta inlägg pekar inte ut något, så varje andel här är liten av konstruktion, och ordningen betyder mer än storleken.",
    rows: [
      { label: "Behandling eller en stödlinje", value: "109", of: "925 inlägg om eget spelande (11,8 %)" },
      { label: "Tid och rutiner", value: "81", of: "925 inlägg om eget spelande (8,8 %)" },
      { label: "Ett register eller en avstängning hos spelbolaget", value: "69", of: "925 inlägg om eget spelande (7,5 %)" },
      { label: "Att berätta för någon", value: "55", of: "925 inlägg om eget spelande (5,9 %)" },
      { label: "Att lämna pengarna till någon annan", value: "54", of: "925 inlägg om eget spelande (5,8 %)" },
      { label: "Blockering i telefonen eller hos banken", value: "22", of: "925 inlägg om eget spelande (2,4 %)" },
      { label: "En skuldplan", value: "22", of: "925 inlägg om eget spelande (2,4 %)" },
      { label: "Säger rakt ut att ingenting hjälpte", value: "11", of: "925 inlägg om eget spelande (1,2 %)" },
    ],
    note: "Det här är vad människor nämner. Det är inte belägg för vad som fungerar, och det är ingen rangordning av behandlingar.",
  },
  counters: {
    heading: "Dagarna som räknas",
    body:
      "102 inlägg bär skribentens egen räkning av dagar utan spel. Veckor, månader och år är omräknade till dagar. En räknare skrivs som en milstolpe, och just därför saknas nästan hela första månaden: den levs, den publiceras inte.",
    rows: [
      { label: "Inlägg med en egen räkning", value: "102", of: "3 299 inlägg" },
      { label: "Mittvärdet av räkningen", value: "365 dagar", of: "102 inlägg med en räkning" },
      { label: "Ett år eller mer", value: "52", of: "102 inlägg med en räkning" },
      { label: "Under 30 dagar", value: "7", of: "102 inlägg med en räkning" },
    ],
  },
  cannot: {
    heading: "Det här kan materialet inte visa",
    intro: "Varje punkt nedan är ett påstående vi hade kunnat göra av de här siffrorna och inte gör.",
    items: [
      "Inte andelar av människor. Ett inlägg är inte en person, samma person kan skriva många inlägg, och ingen här fick en fråga — alla valde att skriva.",
      "Inte hur ofta något händer. Tystnad är inte frånvaro: den som sitter ut sin paus i tysthet har inget att skriva om, och därför kan två inlägg om att vänta ut den inte bli en andel.",
      "Ingen berättelse om löneveckan. Lönen eller natten nämns i 25 av de 925 inläggen om eget spelande (2,7 %). Det räcker inte för ett påstående om veckan då lönen kommer, och vi publicerar inget.",
      "Ingen förändring över åren. Andelen rör sig upp och ner mellan åren utan riktning, och blandningen av forum ändras år för år, vilket i sig räcker för att skapa en falsk trend. Ingen siffra per år publiceras här.",
      "Ingenting danskt. 82 danska inlägg är kodade och ROFUS nämns 7 gånger i hela materialet. Danska siffror kräver danskt material, insamlat för sig.",
      "Reddit-delen är ett fast urval på 1 000 inlägg av 3 178 och inget representativt stickprov, så ingen siffra här beskriver Reddit, eller Sverige, som en population. De två svenska forumen är kodade i sin helhet.",
      "Två tredjedelar av inläggen är svar och kommentarer. En andel av 3 299 inlägg är därför mycket mindre än samma andel av de 925 inläggen om eget spelande, och båda står tryckta.",
      "Frågan i rubriken besvaras inte här. 49 inlägg av 3 299 placerar någon före problemen; det forum där människor skriver medan de fortfarande spelar går inte att nå för den här insamlingen.",
    ],
  },
  method: {
    heading: "Så gjordes det",
    items: [
      "En enhet är ett inlägg. Varje inlägg bedöms för sig, utan tråden runt det, mot ett fast schema med tolv fält där varje fält får lämnas som vet inte.",
      "Inga citat någonstans. Allt är omskrivet: inga användarnamn, inga trådadresser, inga citerade meningar.",
      "En lätt språkmodell kodade alla 3 299 inlägg i omgångar om högst 50. Större omgångar kastades: vid 80 och vid 150 inlägg började kodaren hitta på utlösare och skäl som inläggen inte innehöll. Täckningen kontrollerades inlägg för inlägg, på identitet.",
      "165 inlägg (5 %) kodades om, blint, av en starkare modell. Överensstämmelsen ligger mellan 0,71 och 0,96 per fält, och mellan 0,90 och 0,99 på de grova frågor den här sidan faktiskt ställer. Inget fält föll under 0,70, så inget fält ströks; det enda svaga fältet publiceras bara i sin grova form.",
      "Ingen andel redovisas på färre än 30 inlägg. Varje andel i filen bär ett 95-procentigt intervall.",
      "Själva inläggen publiceras inte. Forskare kan få insamlingen under eget etiskt godkännande.",
    ],
  },
  data: {
    heading: "Siffrorna som fil",
    body:
      "Varje siffra på den här sidan, och räkningarna bakom dem, i en CSV: avsnitt, namn, omfång, antal, nämnare, andel och det 95-procentiga intervallet där det finns ett. Använd den, kontrollera den, eller invänd mot den.",
    csvLabel: "Ladda ner som CSV",
    csvHref: FORUM_STUDY_CSV,
    licence:
      "Får användas fritt med källhänvisning (CC BY 4.0). Filen innehåller bara aggregat — rader, nämnare och andelar. Ingen inläggstext, inga användare, inga trådadresser.",
  },
  next: {
    heading: "Vad siffrorna är till för",
    body:
      "Registret dyker upp i det här materialet mest vid sina två kanter: dagen någon registrerar sig, och dagen det tar slut. Den andra är nästan oskriven — åtta inlägg av 3 299. Den dagen är det planen nedan är byggd kring, och de tio stegen är gratis och kräver inget konto.",
    planLabel: "Planen för dag 11",
    programmeLabel: "Börja de tio stegen",
  },
  sources: {
    heading: "Källor",
    body:
      "Forumen är öppna och offentliga; de beskrivs här i ord och länkas aldrig till en tråd, eftersom ingen i det här materialet har bett om att bli citerad. Myndigheternas egna siffror om Spelpaus och ROFUS, med källor och filer, finns på en egen sida.",
    statisticsLabel: "Spelpaus i siffror: myndigheternas tal",
  },
  homeLabel: "Hem",
  breadcrumbLabel: "Innan det går snett",
};

const da: ForumStudyMessages = {
  metadataTitle: "Sådan lyder det, inden det går galt – 3.299 forumindlæg, kodet",
  metadataDescription:
    "Vi læste 3.299 åbne forumindlæg om spil, gæld og udelukkelse og kodede hvert indlæg efter et fast skema. Tallene med deres nævnere, metoden, det materialet ikke kan vise, og alle aggregater som åben CSV.",
  eyebrow: "Åbne data · 3.299 indlæg",
  titleLead: "Sådan lyder det,",
  titleEmphasis: "inden det går galt.",
  intro:
    "Det var spørgsmålet, vi ville svare på, og materialet svarer med en tavshed: 49 indlæg af 3.299 handler om tiden før tabet. Næsten ingen skriver den aften, hvor det stadig går godt. Det, der bliver skrevet ned, er bagefter — pengene, registret, dagene der tælles en ad gangen. Her er det hele, med hver nævner, hver regel og hvert tal, materialet ikke kan holde til.",
  revenueLine: "B4GAMBLE tjener provision fra licenserede casinoer. Intet i disse tal linker til nogen af dem; det gør menuen.",
  material: {
    heading: "Det her læste vi",
    body:
      "Tre åbne fora: et svensk gældsforum (tråde med tags for spilafhængighed, spillegæld og casino), det følsomme rum på et svensk familieforum, og fem subreddits. Et indlæg tæller kun, hvis det står på sine egne ord — et svar, der blot består af et citeret tidligere indlæg, siger intet selv, og 2.505 af den slags indlæg blev taget ud før kodningen, så de samme sætninger ikke blev talt to gange.",
    rows: [
      { label: "Svensk gældsforum", value: "1.695 kodet", of: "1.695 indlæg der står på egne ord, af 4.211 hentede" },
      { label: "Svensk familieforum", value: "604 kodet", of: "604 indlæg der står på egne ord, af 605 hentede" },
      { label: "Reddit", value: "1.000 kodet", of: "et fast udvalg af 3.178 indlæg der står på egne ord, af 3.295 hentede" },
      { label: "Kodet i alt", value: "3.299 indlæg", of: "3.299 kodede rækker, 1 pr. indlæg; hvert felt måtte stå som ved ikke" },
    ],
    note:
      "De to svenske fora er kodet i deres helhed, så deres tal er optællinger og ikke skøn. Reddit-delen er et fast udvalg på 1.000 indlæg og ikke en repræsentativ stikprøve: udvalget følger indlæggenes løbenumre, og to af de fem subreddits faldt helt udenfor. Af de kodede Reddit-indlæg er 918 svenske og 82 danske.",
  },
  whoWrites: {
    heading: "Hvem skriver",
    body:
      "De fleste indlæg i en tråd er svar til en anden. Derfor er tallene nedenfor delt op: en andel af alle 3.299 indlæg og en andel af de 925 indlæg, hvor nogen skriver om sit eget spil, er to forskellige udsagn, og begge nævnere står trykt overalt på denne side.",
    rows: [
      { label: "Skriver om sit eget spil", value: "925", of: "3.299 indlæg (28,0 %)" },
      { label: "Skriver om en andens", value: "127", of: "3.299 indlæg (3,9 %)" },
      { label: "Et svar eller en kommentar uden eget spil", value: "2.210", of: "3.299 indlæg (67,0 %)" },
    ],
  },
  register: {
    heading: "Registret",
    body:
      "Et udelukkelsesregister — danske ROFUS, svenske Spelpaus eller en udelukkelse hos et enkelt spilselskab — nævnes i 174 indlæg. De 174 indlæg er nævneren for hver række nedenfor, og de er det klareste i hele materialet: når registret kommer op, kommer en vej omkring det eller en vej tilbage til spillet op sammen med det i mere end en tredjedel af indlæggene.",
    rows: [
      { label: "Nævner et udelukkelsesregister", value: "174", of: "3.299 indlæg (5,3 %)" },
      { label: "Beskriver at have registreret sig", value: "130", of: "174 indlæg der nævner et register (74,7 %)" },
      { label: "En vej omkring eller en vej tilbage, alle tre tilsammen", value: "65", of: "174 indlæg der nævner et register (37,4 %)" },
      { label: "— spillede et andet sted under pausen", value: "36", of: "174 indlæg der nævner et register (20,7 %)" },
      { label: "— spillede igen, da perioden udløb", value: "23", of: "174 indlæg der nævner et register (13,2 %)" },
      { label: "— forsøgte at få pausen ophævet før tid", value: "15", of: "174 indlæg der nævner et register (8,6 %)" },
      { label: "Beskriver at have ventet perioden ud", value: "2", of: "174 indlæg der nævner et register" },
      { label: "Beskriver at have forlænget den", value: "4", of: "174 indlæg der nævner et register" },
      { label: "Står ved slutningen af en pause, dagen kontoen åbner igen", value: "8", of: "3.299 indlæg" },
    ],
    note:
      "De tre sidste rækker er de nemmeste at læse forkert. To indlæg om at vente perioden ud betyder ikke, at få gør det: en stille måned giver ingen grund til at skrive et forumindlæg. Det samme gælder dagen, hvor kontoen åbner igen — otte indlæg af 3.299 måler ikke, hvor meget den dag betyder, men hvor lidt der siges om den nogen steder.",
  },
  money: {
    heading: "Pengene",
    body:
      "De fire rækker har de 925 indlæg om eget spil som nævner. Et af de tre fora er et gældsforum, hvor lån og inkasso er rummets emne, så intet af dette kan læses som, hvor ofte en spiller låner.",
    rows: [
      { label: "Kviklån, kreditkort eller lån af familien", value: "161", of: "925 indlæg om eget spil (17,4 %)" },
      { label: "Nævner et beløb", value: "322", of: "925 indlæg om eget spil (34,8 %)" },
      { label: "— heraf over 100.000 kroner", value: "209", of: "322 indlæg der nævner et beløb (64,9 %)" },
      { label: "Fogeden eller inkasso", value: "62", of: "925 indlæg om eget spil (6,7 %)" },
    ],
    note:
      "Om et beløb overhovedet nævnes blev kodet sikkert (to kodere var enige i 95 procent af de omkodede indlæg); hvilket spænd det falder i blev det ikke (71 procent). Derfor offentliggøres det grove tal — nævnt eller ikke nævnt — og over eller under 100.000 kroner. Man skriver tallet ned, når det er stort; dette er ikke det typiske tab.",
  },
  helped: {
    heading: "Det, der siges at have hjulpet",
    body:
      "Kun talt, hvor et indlæg peger på noget, der hjalp. De fleste indlæg peger ikke på noget, så hver andel her er lille af konstruktion, og rækkefølgen betyder mere end størrelsen.",
    rows: [
      { label: "Behandling eller en hjælpelinje", value: "109", of: "925 indlæg om eget spil (11,8 %)" },
      { label: "Tid og rutiner", value: "81", of: "925 indlæg om eget spil (8,8 %)" },
      { label: "Et register eller en udelukkelse hos spilselskabet", value: "69", of: "925 indlæg om eget spil (7,5 %)" },
      { label: "At fortælle det til nogen", value: "55", of: "925 indlæg om eget spil (5,9 %)" },
      { label: "At lade en anden holde pengene", value: "54", of: "925 indlæg om eget spil (5,8 %)" },
      { label: "Blokering på telefonen eller i banken", value: "22", of: "925 indlæg om eget spil (2,4 %)" },
      { label: "En gældsplan", value: "22", of: "925 indlæg om eget spil (2,4 %)" },
      { label: "Siger direkte, at intet hjalp", value: "11", of: "925 indlæg om eget spil (1,2 %)" },
    ],
    note: "Dette er, hvad folk nævner. Det er ikke belæg for, hvad der virker, og det er ingen rangordning af behandlinger.",
  },
  counters: {
    heading: "Dagene, der tælles",
    body:
      "102 indlæg bærer skribentens egen optælling af dage uden spil. Uger, måneder og år er regnet om til dage. En optælling skrives som en milepæl, og netop derfor mangler næsten hele den første måned: den leves, den offentliggøres ikke.",
    rows: [
      { label: "Indlæg med en egen optælling", value: "102", of: "3.299 indlæg" },
      { label: "Midterværdien af optællingen", value: "365 dage", of: "102 indlæg med en optælling" },
      { label: "Et år eller mere", value: "52", of: "102 indlæg med en optælling" },
      { label: "Under 30 dage", value: "7", of: "102 indlæg med en optælling" },
    ],
  },
  cannot: {
    heading: "Det her kan materialet ikke vise",
    intro: "Hvert punkt nedenfor er et udsagn, vi kunne have lavet af disse tal, og som vi ikke laver.",
    items: [
      "Ikke andele af mennesker. Et indlæg er ikke en person, den samme person kan skrive mange indlæg, og ingen her fik et spørgsmål — alle valgte at skrive.",
      "Ikke hvor ofte noget sker. Tavshed er ikke fravær: den, der venter sin pause ud i stilhed, har intet at skrive om, og derfor kan to indlæg om at vente den ud ikke blive en andel.",
      "Ingen historie om lønugen. Lønnen eller natten nævnes i 25 af de 925 indlæg om eget spil (2,7 %). Det rækker ikke til et udsagn om ugen, hvor lønnen kommer, og vi offentliggør ingen.",
      "Ingen udvikling over årene. Andelen bevæger sig op og ned mellem årene uden retning, og blandingen af fora ændrer sig år for år, hvilket i sig selv er nok til at skabe en falsk tendens. Intet tal pr. år offentliggøres her.",
      "Intet dansk. 82 danske indlæg er kodet, og ROFUS nævnes 7 gange i hele materialet. Danske tal kræver dansk materiale, indsamlet for sig.",
      "Reddit-delen er et fast udvalg på 1.000 indlæg af 3.178 og ingen repræsentativ stikprøve, så intet tal her beskriver Reddit, eller Danmark, som en befolkning. De to svenske fora er kodet i deres helhed.",
      "To tredjedele af indlæggene er svar og kommentarer. En andel af 3.299 indlæg er derfor meget mindre end den samme andel af de 925 indlæg om eget spil, og begge står trykt.",
      "Spørgsmålet i overskriften besvares ikke her. 49 indlæg af 3.299 placerer nogen før problemerne; det forum, hvor folk skriver, mens de stadig spiller, kan ikke nås for denne indsamling.",
    ],
  },
  method: {
    heading: "Sådan blev det gjort",
    items: [
      "En enhed er et indlæg. Hvert indlæg bedømmes for sig, uden tråden omkring det, efter et lukket skema med tolv felter, hvor hvert felt må stå som ved ikke.",
      "Ingen citater nogen steder. Alt er omskrevet: ingen brugernavne, ingen trådadresser, ingen citerede sætninger.",
      "En let sprogmodel kodede alle 3.299 indlæg i hold på højst 50. Større hold blev smidt ud: ved 80 og ved 150 indlæg begyndte koderen at opfinde udløsere og grunde, som indlæggene ikke indeholdt. Dækningen blev kontrolleret indlæg for indlæg, på identitet.",
      "165 indlæg (5 %) blev kodet om, blindt, af en stærkere model. Enigheden ligger mellem 0,71 og 0,96 pr. felt, og mellem 0,90 og 0,99 på de grove spørgsmål, denne side faktisk stiller. Intet felt faldt under 0,70, så intet felt blev droppet; det ene svage felt offentliggøres kun i sin grove form.",
      "Ingen andel opgøres på færre end 30 indlæg. Hver andel i filen bærer et 95-procents interval.",
      "Indlæggene selv offentliggøres ikke. Forskere kan få indsamlingen under deres eget etiske godkendelse.",
    ],
  },
  data: {
    heading: "Tallene som fil",
    body:
      "Hvert tal på denne side, og optællingerne bag dem, i én CSV: afsnit, navn, omfang, antal, nævner, andel og 95-procents intervallet, hvor der er et. Brug den, kontrollér den, eller vær uenig med den.",
    csvLabel: "Download som CSV",
    csvHref: FORUM_STUDY_CSV,
    licence:
      "Må bruges frit med kildeangivelse (CC BY 4.0). Filen indeholder kun aggregater — rækker, nævnere og andele. Ingen indlægstekst, ingen brugere, ingen trådadresser.",
  },
  next: {
    heading: "Hvad tallene er til",
    body:
      "Registret dukker op i dette materiale mest ved sine to kanter: dagen nogen registrerer sig, og dagen det udløber. Den anden er næsten uskrevet — otte indlæg af 3.299. Det er den dag, planen nedenfor er bygget omkring, og de ti trin er gratis og kræver ingen konto.",
    planLabel: "Planen for dagen efter",
    programmeLabel: "Begynd de ti trin",
  },
  sources: {
    heading: "Kilder",
    body:
      "Foraene er åbne og offentlige; de beskrives her i ord og linkes aldrig til en tråd, fordi ingen i dette materiale har bedt om at blive citeret. Myndighedernes egne tal om ROFUS og Spelpaus, med kilder og filer, findes på deres egen side.",
    statisticsLabel: "ROFUS i tal: myndighedernes tal",
  },
  homeLabel: "Forside",
  breadcrumbLabel: "Inden det går galt",
};

const catalog: Readonly<Partial<Record<SupportedLocale, ForumStudyMessages>>> = { "en-GB": en, "sv-SE": sv, "da-DK": da };

export function forumStudyLocale(locale: SupportedLocale): SupportedLocale {
  return catalog[locale] ? locale : "en-GB";
}

export function forumStudyMessages(locale: SupportedLocale): ForumStudyMessages {
  return catalog[forumStudyLocale(locale)] ?? en;
}
