/**
 * The letters seeded by migration 0045 (Founder decisions, 13 October 2026): Swedish and Danish
 * versions of the welcome and reminder letters, and the day letters, the two dated pause letters
 * and the letter after the email field on /pause-plan in Swedish, Danish and English.
 *
 * The migration's INSERT is generated from this list (`pauseLetterSeedSql`), and a test keeps the
 * two identical. After the migration the database rows are the letters; this file is their source.
 * A letter links only to the Programme, the pause plan and its own unsubscribe address.
 */
export type PauseLetterSeed = Readonly<{
  id: string;
  key: "WELCOME" | "PROGRAMME_REMINDER" | "PROGRAMME_DAY_3" | "PROGRAMME_DAY_7" | "PROGRAMME_DAY_10"
    | "PAUSE_ENDS_TOMORROW" | "PAUSE_OVER" | "PAUSE_TOOL_CONFIRMATION";
  locale: "sv" | "da" | "en";
  subject: string;
  /** Paragraphs in order. A `[label](variable)` paragraph is a link to that URL variable. */
  paragraphs: readonly string[];
}>;

const UNSUBSCRIBE = { sv: "[Avsluta de här mejlen](unsubscribe_url)", da: "[Afmeld disse mails](unsubscribe_url)", en: "[Unsubscribe from these emails](unsubscribe_url)" } as const;
const CONTINUE = { sv: "[Fortsätt där du slutade](programme_url)", da: "[Fortsæt, hvor du slap](programme_url)", en: "[Continue where you left off](programme_url)" } as const;
const PLAN = { sv: "[Planen dag för dag: 10 dagar. 10 steg.](plan_url)", da: "[Planen dag for dag: Dagen efter ROFUS. 10 trin.](plan_url)", en: "[The plan day by day](plan_url)" } as const;
const OPEN_PLAN = { sv: "[Öppna planen](plan_url)", da: "[Åbn planen](plan_url)", en: "[Open the plan](plan_url)" } as const;
const START = { sv: "[Börja steg 1 i det gratis programmet](programme_url)", da: "[Start trin 1 i det gratis program](programme_url)", en: "[Start step 1 of the free Programme](programme_url)" } as const;
const PHRASE = { sv: "Ditt spel. Dina regler.", da: "Dit spil. Dine regler.", en: "You don't have to quit. You have to be in control." } as const;
const HELPLINE = {
  sv: "Vill du prata med någon: Stödlinjen, 020-81 91 00. Gratis och anonymt.",
  da: "Vil du tale med nogen: StopSpillet, 70 22 28 25. Gratis og fortroligt.",
  en: "If you want to talk to someone: Stödlinjen in Sweden, 020-81 91 00; StopSpillet in Denmark, 70 22 28 25.",
} as const;

function seed(index: number, key: PauseLetterSeed["key"], locale: PauseLetterSeed["locale"], subject: string, paragraphs: readonly string[]): PauseLetterSeed {
  return { id: `4a910045-89d2-4aad-a045-${String(index).padStart(12, "0")}`, key, locale, subject, paragraphs };
}

export const PAUSE_LETTER_SEEDS: readonly PauseLetterSeed[] = [
  seed(1, "WELCOME", "sv", "Välkommen till B4GAMBLE", [
    "Hej {{name}},",
    "Ditt konto är klart. Dina tio steg väntar, och du fortsätter där du slutade när du vill. Det är gratis och privat.",
    "[Fortsätt till dina tio steg](programme_url)",
    PHRASE.sv,
  ]),
  seed(2, "WELCOME", "da", "Velkommen til B4GAMBLE", [
    "Hej {{name}},",
    "Din konto er klar. Dine ti trin venter, og du fortsætter, hvor du slap, når du vil. Det er gratis og privat.",
    "[Fortsæt til dine ti trin](programme_url)",
    PHRASE.da,
  ]),
  seed(3, "PROGRAMME_REMINDER", "sv", "Dina tio steg väntar", [
    "Hej {{name}},",
    "Ditt sparade program finns kvar. Du fortsätter där du slutade, när du vill.",
    "[Fortsätt programmet](programme_url)",
    UNSUBSCRIBE.sv,
  ]),
  seed(4, "PROGRAMME_REMINDER", "da", "Dine ti trin venter", [
    "Hej {{name}},",
    "Dit gemte program ligger klar. Du fortsætter, hvor du slap, når du vil.",
    "[Fortsæt programmet](programme_url)",
    UNSUBSCRIBE.da,
  ]),

  seed(5, "PROGRAMME_DAY_3", "sv", "Dag 3: suget kommer i vågor", [
    "Hej {{name}},",
    "Suget kommer ofta i vågor, och en våg går över. Skriv ner kedjan nästa gång den kommer: situationen, tanken, det du gör. Tre rader räcker.",
    "Steget om suget tar fem till femton minuter.",
    CONTINUE.sv, PLAN.sv, PHRASE.sv, UNSUBSCRIBE.sv,
  ]),
  seed(6, "PROGRAMME_DAY_3", "da", "Dag 3: trangen kommer i bølger", [
    "Hej {{name}},",
    "Trangen kommer ofte i bølger, og en bølge går over igen. Skriv kæden ned, næste gang den kommer: situationen, tanken, det du gør. Tre linjer er nok.",
    "Trinnet om trangen tager fem til femten minutter.",
    CONTINUE.da, PLAN.da, PHRASE.da, UNSUBSCRIBE.da,
  ]),
  seed(7, "PROGRAMME_DAY_3", "en", "Day 3: the urge comes in waves", [
    "Hello {{name}},",
    "The urge often comes in waves, and a wave passes. Next time it comes, write the chain down: the situation, the thought, what you do. Three lines are enough.",
    "The step about the urge takes five to fifteen minutes.",
    CONTINUE.en, PLAN.en, PHRASE.en, UNSUBSCRIBE.en,
  ]),

  seed(8, "PROGRAMME_DAY_7", "sv", "Dag 7: en person som vet den riktiga siffran", [
    "Hej {{name}},",
    "Välj en människa som får veta den riktiga siffran: hur mycket och hur ofta. En räcker. Du behöver inte förklara allt, bara säga siffran.",
    "Steget om stöd hjälper dig att välja vem, och vad du säger.",
    CONTINUE.sv, PLAN.sv, PHRASE.sv, UNSUBSCRIBE.sv,
  ]),
  seed(9, "PROGRAMME_DAY_7", "da", "Dag 7: ét menneske, der kender det rigtige tal", [
    "Hej {{name}},",
    "Vælg ét menneske, der får det rigtige tal at vide: hvor meget og hvor tit. Én er nok. Du behøver ikke forklare det hele, bare sige tallet.",
    "Trinnet om støtte hjælper dig med at vælge hvem, og hvad du siger.",
    CONTINUE.da, PLAN.da, PHRASE.da, UNSUBSCRIBE.da,
  ]),
  seed(10, "PROGRAMME_DAY_7", "en", "Day 7: one person who knows the real number", [
    "Hello {{name}},",
    "Choose one person who gets to know the real number: how much and how often. One is enough. You don't have to explain everything, only say the number.",
    "The step about support helps you choose who, and what to say.",
    CONTINUE.en, PLAN.en, PHRASE.en, UNSUBSCRIBE.en,
  ]),

  seed(11, "PROGRAMME_DAY_10", "sv", "Dag 10: summan och tiden före appen", [
    "Hej {{name}},",
    "Bestäm två saker innan appen är öppen: summan och tiden. En siffra, inte en känsla. Skriv dem på en rad som du kan läsa igen.",
    "Du behöver inte sluta. Du behöver ha kontrollen.",
    CONTINUE.sv, PLAN.sv, PHRASE.sv, UNSUBSCRIBE.sv,
  ]),
  seed(12, "PROGRAMME_DAY_10", "da", "Dag 10: beløbet og tiden før appen", [
    "Hej {{name}},",
    "Bestem to ting, før appen er åben: beløbet og tiden. Et tal, ikke en følelse. Skriv dem på én linje, som du kan læse igen.",
    "Du behøver ikke stoppe. Du skal bevare kontrollen.",
    CONTINUE.da, PLAN.da, PHRASE.da, UNSUBSCRIBE.da,
  ]),
  seed(13, "PROGRAMME_DAY_10", "en", "Day 10: the amount and the time before the app", [
    "Hello {{name}},",
    "Decide two things before the app is open: the amount and the time. A number, not a feeling. Write them on one line you can read again.",
    PHRASE.en,
    CONTINUE.en, PLAN.en, UNSUBSCRIBE.en,
  ]),

  seed(14, "PAUSE_ENDS_TOMORROW", "sv", "I morgon tar din paus slut", [
    "Hej,",
    "I morgon tar din paus slut. Summan och tiden bestämmer du i dag.",
    "Skriv tre rader: summan före appen, tiden före appen och en person som vet.",
    OPEN_PLAN.sv, START.sv, HELPLINE.sv, PHRASE.sv, UNSUBSCRIBE.sv,
  ]),
  seed(15, "PAUSE_ENDS_TOMORROW", "da", "I morgen udløber din pause", [
    "Hej,",
    "I morgen udløber din pause. Beløbet og tiden bestemmer du i dag.",
    "Skriv tre linjer: beløbet før appen, tiden før appen og ét menneske, der ved det.",
    OPEN_PLAN.da, START.da, HELPLINE.da, PHRASE.da, UNSUBSCRIBE.da,
  ]),
  seed(16, "PAUSE_ENDS_TOMORROW", "en", "Your pause ends tomorrow", [
    "Hello,",
    "Your pause ends tomorrow. The amount and the time are yours to decide today.",
    "Write three lines: the amount before the app, the time before the app, and one person who knows.",
    OPEN_PLAN.en, START.en, HELPLINE.en, PHRASE.en, UNSUBSCRIBE.en,
  ]),

  seed(17, "PAUSE_OVER", "sv", "I dag tar din paus slut. Dina regler gäller.", [
    "Hej,",
    "I dag tar din paus slut. Dina regler gäller: summan före appen, tiden före appen och en person som vet.",
    "Har du inte skrivit dem än tar det några minuter.",
    OPEN_PLAN.sv, START.sv, HELPLINE.sv, PHRASE.sv, UNSUBSCRIBE.sv,
  ]),
  seed(18, "PAUSE_OVER", "da", "I dag udløber din pause. Dine regler gælder.", [
    "Hej,",
    "I dag udløber din pause. Dine regler gælder: beløbet før appen, tiden før appen og ét menneske, der ved det.",
    "Har du ikke skrevet dem endnu, tager det et par minutter.",
    OPEN_PLAN.da, START.da, HELPLINE.da, PHRASE.da, UNSUBSCRIBE.da,
  ]),
  seed(19, "PAUSE_OVER", "en", "Your pause ends today. Your rules apply.", [
    "Hello,",
    "Your pause ends today. Your rules apply: the amount before the app, the time before the app, and one person who knows.",
    "If you have not written them yet, it takes a few minutes.",
    OPEN_PLAN.en, START.en, HELPLINE.en, PHRASE.en, UNSUBSCRIBE.en,
  ]),

  seed(20, "PAUSE_TOOL_CONFIRMATION", "sv", "Din paus: vi hörs dagen innan den tar slut", [
    "Hej,",
    "Vi hörs den {{pause_date}}. Här är planen under tiden.",
    "[10 dagar. 10 steg.](plan_url)",
    "Vi skriver två gånger till: dagen innan din paus tar slut och dagen då den är slut. Sedan inget mer.",
    UNSUBSCRIBE.sv,
  ]),
  seed(21, "PAUSE_TOOL_CONFIRMATION", "da", "Din pause: vi skriver dagen før, den udløber", [
    "Hej,",
    "Vi skriver igen den {{pause_date}}. Her er planen i mellemtiden.",
    "[Dagen efter ROFUS. 10 trin.](plan_url)",
    "Vi skriver to gange mere: dagen før, din pause udløber, og dagen, hvor den er slut. Derefter ikke mere.",
    UNSUBSCRIBE.da,
  ]),
  seed(22, "PAUSE_TOOL_CONFIRMATION", "en", "Your pause: we write the day before it ends", [
    "Hello,",
    "We will write again on {{pause_date}}. Here is the plan in the meantime.",
    "[The plan for the day after your pause](plan_url)",
    "We write twice more: the day before your pause ends and the day it is over. Then nothing more.",
    UNSUBSCRIBE.en,
  ]),
];

const LINK = /^\[(.+)\]\((programme_url|plan_url|unsubscribe_url)\)$/;

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** The HTML and plain-text bodies of a seeded letter, with the template placeholders in place. */
export function pauseLetterSeedBodies(letter: PauseLetterSeed) {
  const html = letter.paragraphs.map((paragraph) => {
    const link = LINK.exec(paragraph);
    return link ? `<p><a href="{{${link[2]}}}">${escapeHtml(link[1])}</a></p>` : `<p>${escapeHtml(paragraph)}</p>`;
  }).join("");
  const text = letter.paragraphs.map((paragraph) => {
    const link = LINK.exec(paragraph);
    return link ? `${link[1]}: {{${link[2]}}}` : paragraph;
  }).join("\n\n");
  return { htmlBody: html, textBody: text };
}

function sqlText(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

/** The INSERT statement of migration 0045 for these letters. */
export function pauseLetterSeedSql() {
  const rows = PAUSE_LETTER_SEEDS.map((letter) => {
    const { htmlBody, textBody } = pauseLetterSeedBodies(letter);
    return `  (${sqlText(letter.id)}, ${sqlText(letter.key)}, 'LIFECYCLE', ${sqlText(letter.locale)},\n   ${sqlText(letter.subject)},\n   ${sqlText(htmlBody)},\n   E${sqlText(textBody.replaceAll("\\", "\\\\")).replaceAll("\n", "\\n")},\n   1, true, 'migration-0045', 'migration-0045', CURRENT_TIMESTAMP)`;
  });
  return `INSERT INTO "EmailTemplate" (\n  "id", "key", "type", "locale", "subject", "htmlBody", "textBody",\n  "version", "active", "createdBy", "updatedBy", "updatedAt"\n) VALUES\n${rows.join(",\n")}\nON CONFLICT ("key", "locale", "version") DO NOTHING;`;
}
