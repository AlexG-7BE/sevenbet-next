import type { SupportedLocale } from "@/lib/market/registry";

type FaqItem = readonly [question: string, answer: string];
type ArticleSection = Readonly<{ id: string; title: string; paragraphs: readonly string[] }>;

export type WageringCalculatorWidgetMessages = Readonly<{
  deposit: string;
  bonus: string;
  multiplier: string;
  base: string;
  bonusOnly: string;
  depositAndBonus: string;
  contribution: string;
  slots: string;
  tableGames: string;
  roulette: string;
  blackjack: string;
  rtp: string;
  result: string;
  requiredTurnover: string;
  actualTurnover: string;
  expectedLoss: string;
  netValue: string;
  negative: string;
  positive: string;
  caveat: string;
}>;

export type WageringCalculatorMessages = Readonly<{
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  titleLead: string;
  titleEmphasis: string;
  intro: string;
  widget: WageringCalculatorWidgetMessages;
  sections: readonly ArticleSection[];
  checklistTitle: string;
  checklist: readonly string[];
  faqTitle: string;
  faq: readonly FaqItem[];
  offersTitle: string;
  offersCopy: string;
  offersAction: string;
  homeLabel: string;
  breadcrumbLabel: string;
}>;

/** Display currency and starting amounts for the language's main market. */
export type WageringCalculatorDefaults = Readonly<{ currency: string; deposit: number; bonus: number; multiplier: number; base: "bonus" | "deposit-bonus" }>;

const en: WageringCalculatorMessages = {
  metadataTitle: "Wagering Requirement Calculator – Work Out Bonus Turnover | B4GAMBLE",
  metadataDescription: "Free wagering requirement calculator. Enter the deposit, bonus, multiplier and game contribution to see how much you must bet before a casino bonus can be withdrawn.",
  eyebrow: "Free tool",
  titleLead: "Wagering requirement",
  titleEmphasis: "calculator.",
  intro: "Enter the numbers from the bonus terms to see how much you have to bet before bonus money can be withdrawn, and what that betting typically costs.",
  widget: {
    deposit: "Your deposit",
    bonus: "Bonus amount",
    multiplier: "Wagering requirement (x)",
    base: "Wagering is counted on",
    bonusOnly: "Bonus only",
    depositAndBonus: "Deposit + bonus",
    contribution: "How your game counts",
    slots: "Slots · 100%",
    tableGames: "Table games · 50%",
    roulette: "Roulette · 20%",
    blackjack: "Blackjack · 10%",
    rtp: "Game RTP, %",
    result: "Your result",
    requiredTurnover: "Wagering requirement in money",
    actualTurnover: "What you need to bet with this game",
    expectedLoss: "Typical cost of that betting",
    netValue: "Bonus minus typical cost",
    negative: "With these numbers, the betting is likely to cost more than the bonus is worth.",
    positive: "With these numbers, the bonus is worth more than the typical cost of the betting.",
    caveat: "An average based on the RTP, not a prediction. Real results swing widely, and the casino's own terms always apply.",
  },
  sections: [
    { id: "how-it-works", title: "How the wagering calculation works", paragraphs: [
      "A wagering requirement tells you how many times a sum must be bet before bonus money, and anything won with it, can be withdrawn. The calculation has three parts: the amount the requirement is counted on, the multiplier, and how much your chosen game counts.",
      "Required turnover = wagering base × multiplier. Then divide by your game's contribution: at 100% nothing changes, at 10% you need to bet ten times as much.",
    ] },
    { id: "same-multiplier", title: "Why two 35x bonuses can need very different turnover", paragraphs: [
      "Take a £100 deposit, a £100 bonus and a 35x requirement. If the 35x is counted on the bonus only, you need to bet £3,500. If it is counted on deposit plus bonus, you need to bet £7,000: twice as much for the same headline.",
      "The base is usually stated in the full terms rather than next to the headline, so look for words such as “bonus amount” or “deposit + bonus” before you compare offers.",
    ] },
    { id: "game-contribution", title: "Game contribution: the hidden multiplier", paragraphs: [
      "Casinos count games differently. Slots usually count 100%, while table games and live casino often count 10–20% or nothing at all. If blackjack counts 10%, a 35x requirement on the bonus behaves like 350x.",
      "The casino's terms list which games count and by how much. Games that count 0% do not move your progress at all.",
    ] },
    { id: "turnover-is-not-loss", title: "Turnover is not the same as what you lose", paragraphs: [
      "Turnover is the total of your bets, not money you lose. Much of it comes back as wins along the way. What you lose on average is the turnover multiplied by the house edge: at 96% RTP, about 4% of the turnover.",
      "£7,000 of slot play at 96% RTP costs about £280 on average. With a £100 bonus, the betting is likely to cost more than the bonus is worth. A lower requirement changes that: £100 at 10x on the bonus means £1,000 of turnover and a typical cost of about £40.",
    ] },
    { id: "great-britain", title: "The 10x limit in Great Britain", paragraphs: [
      "Since 19 January 2026, casinos licensed by the UK Gambling Commission may not set wagering requirements above 10 times the bonus (LCCP social responsibility code 5.1.1). A GB offer that asks for more breaks that rule, so check the licence and the terms before you play.",
    ] },
  ],
  checklistTitle: "Before you accept a bonus, check",
  checklist: [
    "Whether wagering is counted on the bonus or on deposit + bonus",
    "How your games count towards wagering",
    "The maximum bet allowed while wagering",
    "How many days you have to complete it",
    "Any cap on what you can win or withdraw from the bonus",
  ],
  faqTitle: "Questions about wagering requirements",
  faq: [
    ["How do I calculate a wagering requirement?", "Multiply the amount the requirement is counted on by the multiplier. A £50 bonus at 10x on the bonus means £500 of bets. If the requirement covers deposit + bonus, add the deposit first. Then divide by your game's contribution."],
    ["What does 35x wagering mean?", "You must bet 35 times the wagering base before the bonus can be withdrawn. On a £100 bonus that is £3,500; on a £100 deposit plus a £100 bonus it is £7,000."],
    ["Do free spins have wagering requirements?", "Often the winnings from free spins do. Then the multiplier applies to what you win with the spins, not to the spins' value. Check the terms of the specific offer."],
    ["Is a bonus with no wagering better?", "With no wagering, winnings can usually be withdrawn straight away, so there is no extra betting cost. A smaller no-wagering bonus can be worth more than a larger bonus with a high requirement."],
    ["Does the calculator use the casino's real terms?", "No. It uses only the numbers you enter. Enter the figures from the current terms of the offer you are looking at; the casino's terms always decide."],
  ],
  offersTitle: "Compare bonuses by their terms",
  offersCopy: "Pick an offer, put its numbers into the calculator and see what the bonus really asks of you.",
  offersAction: "See current bonuses",
  homeLabel: "Home",
  breadcrumbLabel: "Wagering calculator",
};

const de: WageringCalculatorMessages = {
  metadataTitle: "Umsatzbedingungen-Rechner: Bonus-Umsatz berechnen | B4GAMBLE",
  metadataDescription: "Kostenloser Rechner für Umsatzbedingungen. Gib Einzahlung, Bonus, Multiplikator und Spielgewichtung ein und sieh, wie viel du setzen musst, bevor ein Casino-Bonus auszahlbar ist.",
  eyebrow: "Kostenloses Tool",
  titleLead: "Rechner für",
  titleEmphasis: "Umsatzbedingungen.",
  intro: "Gib die Zahlen aus den Bonusbedingungen ein und sieh, wie viel du setzen musst, bevor Bonusgeld auszahlbar ist, und was dieser Einsatz im Schnitt kostet.",
  widget: {
    deposit: "Deine Einzahlung",
    bonus: "Bonusbetrag",
    multiplier: "Umsatz\u00adbedingung (x)",
    base: "Der Umsatz zählt auf",
    bonusOnly: "Nur Bonus",
    depositAndBonus: "Einzahlung + Bonus",
    contribution: "So zählt dein Spiel",
    slots: "Slots · 100 %",
    tableGames: "Tischspiele · 50 %",
    roulette: "Roulette · 20 %",
    blackjack: "Blackjack · 10 %",
    rtp: "Auszahlungs\u00adquote (RTP), %",
    result: "Dein Ergebnis",
    requiredTurnover: "Umsatzbedingung in Geld",
    actualTurnover: "So viel musst du mit diesem Spiel setzen",
    expectedLoss: "Typische Kosten dieses Einsatzes",
    netValue: "Bonus minus typische Kosten",
    negative: "Mit diesen Zahlen kostet der Einsatz voraussichtlich mehr, als der Bonus wert ist.",
    positive: "Mit diesen Zahlen ist der Bonus mehr wert als die typischen Kosten des Einsatzes.",
    caveat: "Ein Durchschnitt auf Basis der RTP, keine Vorhersage. Echte Ergebnisse schwanken stark, und es gelten immer die Bedingungen des Casinos.",
  },
  sections: [
    { id: "how-it-works", title: "So funktioniert die Berechnung", paragraphs: [
      "Eine Umsatzbedingung legt fest, wie oft ein Betrag gesetzt werden muss, bevor Bonusgeld und was du damit gewinnst auszahlbar ist. Die Rechnung hat drei Teile: den Betrag, auf den sich die Bedingung bezieht, den Multiplikator und wie stark dein Spiel zählt.",
      "Erforderlicher Umsatz = Umsatzbasis × Multiplikator. Danach teilst du durch die Gewichtung deines Spiels: Bei 100 % ändert sich nichts, bei 10 % musst du zehnmal so viel setzen.",
    ] },
    { id: "same-multiplier", title: "Warum zwei 35x-Boni sehr unterschiedlichen Umsatz verlangen", paragraphs: [
      "Nimm 100 € Einzahlung, 100 € Bonus und 35x. Zählt die Bedingung nur auf den Bonus, musst du 3.500 € setzen. Zählt sie auf Einzahlung plus Bonus, sind es 7.000 €: doppelt so viel bei gleicher Überschrift.",
      "Die Basis steht meist in den vollständigen Bedingungen, nicht neben der Überschrift. Achte auf Formulierungen wie „Bonusbetrag“ oder „Einzahlung + Bonus“, bevor du Angebote vergleichst.",
    ] },
    { id: "game-contribution", title: "Spielgewichtung: der versteckte Multiplikator", paragraphs: [
      "Casinos werten Spiele unterschiedlich. Slots zählen meist zu 100 %, Tisch- und Live-Spiele oft nur zu 10–20 % oder gar nicht. Zählt Blackjack zu 10 %, wirkt eine 35x-Bedingung auf den Bonus wie 350x.",
      "Welche Spiele wie stark zählen, steht in den Bedingungen des Casinos. Spiele mit 0 % bringen dich keinen Schritt weiter.",
    ] },
    { id: "turnover-is-not-loss", title: "Umsatz ist nicht gleich Verlust", paragraphs: [
      "Umsatz ist die Summe deiner Einsätze, nicht das Geld, das du verlierst. Ein großer Teil kommt unterwegs als Gewinn zurück. Im Schnitt verlierst du den Umsatz mal den Hausvorteil: bei 96 % RTP etwa 4 % des Umsatzes.",
      "7.000 € Slot-Umsatz bei 96 % RTP kosten im Schnitt etwa 280 €. Bei 100 € Bonus kostet der Einsatz also voraussichtlich mehr, als der Bonus wert ist. Eine niedrigere Bedingung ändert das: 100 € mit 10x auf den Bonus bedeuten 1.000 € Umsatz und typische Kosten von etwa 40 €.",
    ] },
  ],
  checklistTitle: "Prüfe vor jedem Bonus",
  checklist: [
    "Ob der Umsatz auf den Bonus oder auf Einzahlung + Bonus zählt",
    "Wie deine Spiele zum Umsatz zählen",
    "Den maximalen Einsatz, solange die Bedingung läuft",
    "Wie viele Tage du dafür Zeit hast",
    "Ob es eine Obergrenze für Gewinne oder Auszahlungen aus dem Bonus gibt",
  ],
  faqTitle: "Fragen zu Umsatzbedingungen",
  faq: [
    ["Wie berechne ich Umsatzbedingungen?", "Multipliziere den Betrag, auf den sich die Bedingung bezieht, mit dem Multiplikator. 50 € Bonus mit 10x auf den Bonus bedeuten 500 € Einsätze. Gilt die Bedingung für Einzahlung + Bonus, addierst du zuerst die Einzahlung. Danach teilst du durch die Gewichtung deines Spiels."],
    ["Was bedeutet 35x Umsatz?", "Du musst das 35-Fache der Umsatzbasis setzen, bevor der Bonus auszahlbar ist. Bei 100 € Bonus sind das 3.500 €, bei 100 € Einzahlung plus 100 € Bonus 7.000 €."],
    ["Haben Freispiele Umsatzbedingungen?", "Oft gelten sie für die Gewinne aus Freispielen. Dann bezieht sich der Multiplikator auf das, was du mit den Freispielen gewinnst, nicht auf ihren Wert. Prüfe die Bedingungen des jeweiligen Angebots."],
    ["Ist ein Bonus ohne Umsatzbedingungen besser?", "Ohne Umsatzbedingungen kannst du Gewinne meist sofort auszahlen, es entstehen also keine zusätzlichen Einsatzkosten. Ein kleinerer Bonus ohne Umsatz kann mehr wert sein als ein größerer mit hoher Bedingung."],
    ["Nutzt der Rechner die echten Bedingungen eines Casinos?", "Nein. Er rechnet nur mit den Zahlen, die du eingibst. Trage die Werte aus den aktuellen Bedingungen des Angebots ein; es gelten immer die Bedingungen des Casinos."],
  ],
  offersTitle: "Boni nach ihren Bedingungen vergleichen",
  offersCopy: "Wähle ein Angebot, gib seine Zahlen in den Rechner ein und sieh, was der Bonus wirklich von dir verlangt.",
  offersAction: "Aktuelle Boni ansehen",
  homeLabel: "Startseite",
  breadcrumbLabel: "Umsatzrechner",
};

const sv: WageringCalculatorMessages = {
  metadataTitle: "Omsättningskrav-kalkylator: räkna ut bonusens omsättning | B4GAMBLE",
  metadataDescription: "Gratis kalkylator för omsättningskrav. Ange insättning, bonus, multiplikator och spelets bidrag och se hur mycket du måste spela för innan en casinobonus kan tas ut.",
  eyebrow: "Gratis verktyg",
  titleLead: "Kalkylator för",
  titleEmphasis: "omsättningskrav.",
  intro: "Ange siffrorna från bonusvillkoren och se hur mycket du måste spela för innan bonuspengarna kan tas ut, och vad det spelandet brukar kosta.",
  widget: {
    deposit: "Din insättning",
    bonus: "Bonusbelopp",
    multiplier: "Omsättningskrav (x)",
    base: "Omsättningen räknas på",
    bonusOnly: "Endast bonus",
    depositAndBonus: "Insättning + bonus",
    contribution: "Så räknas ditt spel",
    slots: "Slots · 100 %",
    tableGames: "Bordsspel · 50 %",
    roulette: "Roulette · 20 %",
    blackjack: "Blackjack · 10 %",
    rtp: "Återbetalning (RTP), %",
    result: "Ditt resultat",
    requiredTurnover: "Omsättningskravet i pengar",
    actualTurnover: "Så mycket måste du spela för med det här spelet",
    expectedLoss: "Vad spelandet brukar kosta",
    netValue: "Bonus minus typisk kostnad",
    negative: "Med de här siffrorna kostar spelandet sannolikt mer än bonusen är värd.",
    positive: "Med de här siffrorna är bonusen värd mer än vad spelandet brukar kosta.",
    caveat: "Ett genomsnitt baserat på RTP, inte en prognos. Verkliga resultat svänger kraftigt, och casinots egna villkor gäller alltid.",
  },
  sections: [
    { id: "how-it-works", title: "Så räknas omsättningskravet", paragraphs: [
      "Ett omsättningskrav anger hur många gånger ett belopp måste spelas om innan bonuspengar och det du vinner med dem kan tas ut. Beräkningen har tre delar: beloppet kravet räknas på, multiplikatorn och hur mycket ditt spel bidrar.",
      "Nödvändig omsättning = omsättningsbas × multiplikator. Dela sedan med spelets bidrag: vid 100 % ändras ingenting, vid 10 % måste du spela för tio gånger så mycket.",
    ] },
    { id: "same-multiplier", title: "Varför två bonusar med 35x kan kräva helt olika omsättning", paragraphs: [
      "Ta en insättning på 1 000 kr, en bonus på 1 000 kr och 35x. Räknas kravet bara på bonusen behöver du spela för 35 000 kr. Räknas det på insättning plus bonus blir det 70 000 kr: dubbelt så mycket med samma rubrik.",
      "Basen står oftast i de fullständiga villkoren, inte bredvid rubriken. Leta efter formuleringar som ”bonusbelopp” eller ”insättning + bonus” innan du jämför erbjudanden.",
    ] },
    { id: "game-contribution", title: "Spelets bidrag: den dolda multiplikatorn", paragraphs: [
      "Casinon räknar spel olika. Slots bidrar oftast till 100 %, medan bordsspel och livecasino ofta bara räknas till 10–20 % eller inte alls. Räknas blackjack till 10 % fungerar ett krav på 35x på bonusen som 350x.",
      "Vilka spel som räknas och hur mycket står i casinots villkor. Spel som räknas till 0 % flyttar dig inte framåt alls.",
    ] },
    { id: "turnover-is-not-loss", title: "Omsättning är inte detsamma som förlust", paragraphs: [
      "Omsättning är summan av dina insatser, inte pengar du förlorar. En stor del kommer tillbaka som vinster på vägen. I genomsnitt förlorar du omsättningen gånger husets fördel: vid 96 % RTP ungefär 4 % av omsättningen.",
      "70 000 kr i slotspel vid 96 % RTP kostar i genomsnitt ungefär 2 800 kr. Med en bonus på 1 000 kr kostar spelandet alltså sannolikt mer än bonusen är värd. Ett lägre krav ändrar det: 1 000 kr med 10x på bonusen ger 10 000 kr i omsättning och en typisk kostnad på ungefär 400 kr.",
    ] },
    { id: "sweden", title: "Bonusregeln i Sverige", paragraphs: [
      "Ett spelbolag med svensk licens får bara erbjuda dig en bonus första gången du spelar hos det (14 kap. 9 § spellagen). Det gör det extra viktigt att räkna på villkoren innan du tackar ja, eftersom du inte får en ny chans hos samma bolag.",
    ] },
  ],
  checklistTitle: "Kontrollera innan du tar emot en bonus",
  checklist: [
    "Om omsättningen räknas på bonusen eller på insättning + bonus",
    "Hur dina spel bidrar till omsättningen",
    "Högsta tillåtna insats medan kravet gäller",
    "Hur många dagar du har på dig",
    "Om det finns ett tak för vad du kan vinna eller ta ut från bonusen",
  ],
  faqTitle: "Frågor om omsättningskrav",
  faq: [
    ["Hur räknar jag ut ett omsättningskrav?", "Multiplicera beloppet som kravet räknas på med multiplikatorn. En bonus på 500 kr med 10x på bonusen betyder 5 000 kr i insatser. Gäller kravet insättning + bonus lägger du först till insättningen. Dela sedan med spelets bidrag."],
    ["Vad betyder 35x i omsättningskrav?", "Du måste spela för 35 gånger omsättningsbasen innan bonusen kan tas ut. På en bonus på 1 000 kr är det 35 000 kr, på 1 000 kr insättning plus 1 000 kr bonus är det 70 000 kr."],
    ["Har free spins omsättningskrav?", "Ofta gäller kravet vinsterna från free spins. Då räknas multiplikatorn på det du vinner med snurrarna, inte på deras värde. Kontrollera villkoren för just det erbjudandet."],
    ["Är en bonus utan omsättningskrav bättre?", "Utan omsättningskrav kan vinster oftast tas ut direkt, så det tillkommer ingen extra spelkostnad. En mindre bonus utan krav kan vara värd mer än en större bonus med högt krav."],
    ["Använder kalkylatorn casinots riktiga villkor?", "Nej. Den räknar bara med siffrorna du anger. Fyll i värdena från de aktuella villkoren för erbjudandet; casinots villkor gäller alltid."],
  ],
  offersTitle: "Jämför bonusar efter villkoren",
  offersCopy: "Välj ett erbjudande, för in dess siffror i kalkylatorn och se vad bonusen egentligen kräver av dig.",
  offersAction: "Se aktuella bonusar",
  homeLabel: "Startsida",
  breadcrumbLabel: "Omsättningskalkylator",
};

const da: WageringCalculatorMessages = {
  metadataTitle: "Omsætningskrav-beregner: udregn bonussens omsætning | B4GAMBLE",
  metadataDescription: "Gratis beregner til omsætningskrav. Indtast indbetaling, bonus, multiplikator og spillets vægtning, og se hvor meget du skal spille for, før en casinobonus kan udbetales.",
  eyebrow: "Gratis værktøj",
  titleLead: "Beregner til",
  titleEmphasis: "omsætningskrav.",
  intro: "Indtast tallene fra bonusvilkårene, og se hvor meget du skal spille for, før bonuspengene kan udbetales, og hvad det spil typisk koster.",
  widget: {
    deposit: "Din indbetaling",
    bonus: "Bonusbeløb",
    multiplier: "Omsætningskrav (x)",
    base: "Omsætningen beregnes af",
    bonusOnly: "Kun bonus",
    depositAndBonus: "Indbetaling + bonus",
    contribution: "Sådan tæller dit spil",
    slots: "Spilleautomater · 100 %",
    tableGames: "Bordspil · 50 %",
    roulette: "Roulette · 20 %",
    blackjack: "Blackjack · 10 %",
    rtp: "Tilbagebetaling (RTP), %",
    result: "Dit resultat",
    requiredTurnover: "Omsætningskravet i penge",
    actualTurnover: "Så meget skal du spille for med dette spil",
    expectedLoss: "Hvad spillet typisk koster",
    netValue: "Bonus minus typisk omkostning",
    negative: "Med disse tal koster spillet sandsynligvis mere, end bonussen er værd.",
    positive: "Med disse tal er bonussen mere værd end det, spillet typisk koster.",
    caveat: "Et gennemsnit baseret på RTP, ikke en forudsigelse. Faktiske resultater svinger meget, og casinoets egne vilkår gælder altid.",
  },
  sections: [
    { id: "how-it-works", title: "Sådan beregnes omsætningskravet", paragraphs: [
      "Et omsætningskrav angiver, hvor mange gange et beløb skal spilles igennem, før bonuspenge og det, du vinder med dem, kan udbetales. Beregningen har tre dele: beløbet, kravet beregnes af, multiplikatoren og hvor meget dit spil tæller.",
      "Krævet omsætning = omsætningsgrundlag × multiplikator. Del derefter med spillets vægtning: ved 100 % ændres intet, ved 10 % skal du spille for ti gange så meget.",
    ] },
    { id: "same-multiplier", title: "Hvorfor to bonusser med 35x kan kræve vidt forskellig omsætning", paragraphs: [
      "Tag en indbetaling på 1.000 kr., en bonus på 1.000 kr. og 35x. Beregnes kravet kun af bonussen, skal du spille for 35.000 kr. Beregnes det af indbetaling plus bonus, bliver det 70.000 kr.: dobbelt så meget med samme overskrift.",
      "Grundlaget står som regel i de fulde vilkår, ikke ved siden af overskriften. Kig efter formuleringer som ”bonusbeløb” eller ”indbetaling + bonus”, før du sammenligner tilbud.",
    ] },
    { id: "game-contribution", title: "Spillets vægtning: den skjulte multiplikator", paragraphs: [
      "Casinoer tæller spil forskelligt. Spilleautomater tæller oftest 100 %, mens bordspil og live casino ofte kun tæller 10–20 % eller slet ikke. Tæller blackjack 10 %, virker et krav på 35x af bonussen som 350x.",
      "Hvilke spil der tæller, og hvor meget, står i casinoets vilkår. Spil, der tæller 0 %, flytter dig slet ikke fremad.",
    ] },
    { id: "turnover-is-not-loss", title: "Omsætning er ikke det samme som tab", paragraphs: [
      "Omsætning er summen af dine indsatser, ikke penge, du taber. En stor del kommer tilbage som gevinster undervejs. I gennemsnit taber du omsætningen gange husets fordel: ved 96 % RTP omkring 4 % af omsætningen.",
      "70.000 kr. på spilleautomater ved 96 % RTP koster i gennemsnit omkring 2.800 kr. Med en bonus på 1.000 kr. koster spillet altså sandsynligvis mere, end bonussen er værd. Et lavere krav ændrer det: 1.000 kr. med 10x af bonussen giver 10.000 kr. i omsætning og en typisk omkostning på omkring 400 kr.",
    ] },
    { id: "denmark", title: "Reglerne i Danmark", paragraphs: [
      "Hos casinoer med dansk licens må en bonus højst være 1.000 kr. værd, og omsætningskravet må højst være 10 gange indbetalingen plus bonussen (bekendtgørelse om onlinekasino, kapitel 9). En indbetaling på 1.000 kr. med 1.000 kr. i bonus og 10x giver altså op til 20.000 kr. i omsætning.",
      "Spillemyndigheden kræver, at casinoet viser omsætningskravet med et regneeksempel sammen med tilbuddets væsentlige vilkår. Mangler eksemplet, kan du regne det ud her.",
    ] },
  ],
  checklistTitle: "Tjek før du tager imod en bonus",
  checklist: [
    "Om omsætningen beregnes af bonussen eller af indbetaling + bonus",
    "Hvordan dine spil tæller med i omsætningen",
    "Den højeste tilladte indsats, mens kravet gælder",
    "Hvor mange dage du har til det",
    "Om der er et loft over, hvad du kan vinde eller udbetale fra bonussen",
  ],
  faqTitle: "Spørgsmål om omsætningskrav",
  faq: [
    ["Hvordan beregner jeg et omsætningskrav?", "Gang beløbet, kravet beregnes af, med multiplikatoren. En bonus på 500 kr. med 10x af bonussen betyder 5.000 kr. i indsatser. Gælder kravet indbetaling + bonus, lægger du først indbetalingen til. Del derefter med spillets vægtning."],
    ["Hvad betyder 35x i omsætningskrav?", "Du skal spille for 35 gange omsætningsgrundlaget, før bonussen kan udbetales. På en bonus på 1.000 kr. er det 35.000 kr., på 1.000 kr. indbetaling plus 1.000 kr. bonus er det 70.000 kr."],
    ["Har free spins omsætningskrav?", "Ofte gælder kravet gevinsterne fra free spins. Så beregnes multiplikatoren af det, du vinder på spinnene, ikke af deres værdi. Tjek vilkårene for det konkrete tilbud."],
    ["Er en bonus uden omsætningskrav bedre?", "Uden omsætningskrav kan gevinster som regel udbetales med det samme, så der er ingen ekstra spilleomkostning. En mindre bonus uden krav kan være mere værd end en større bonus med et højt krav."],
    ["Bruger beregneren casinoets rigtige vilkår?", "Nej. Den regner kun med de tal, du indtaster. Indtast værdierne fra de aktuelle vilkår for tilbuddet; casinoets vilkår gælder altid."],
  ],
  offersTitle: "Sammenlign bonusser efter vilkårene",
  offersCopy: "Vælg et tilbud, sæt dets tal ind i beregneren, og se hvad bonussen reelt kræver af dig.",
  offersAction: "Se aktuelle bonusser",
  homeLabel: "Forside",
  breadcrumbLabel: "Omsætningsberegner",
};

const uk: WageringCalculatorMessages = {
  metadataTitle: "Калькулятор відіграшу бонусу: оборот ставок | B4GAMBLE",
  metadataDescription: "Безкоштовний калькулятор відіграшу (вейджера). Введи депозит, бонус, множник і внесок гри — дізнайся, скільки треба поставити до виведення бонусу.",
  eyebrow: "Безкоштовний інструмент",
  titleLead: "Калькулятор",
  titleEmphasis: "відіграшу.",
  intro: "Введи цифри з умов бонусу та подивись, скільки потрібно поставити, перш ніж бонусні гроші можна буде вивести, і скільки зазвичай коштують такі ставки.",
  widget: {
    deposit: "Твій депозит",
    bonus: "Сума бонусу",
    multiplier: "Відіграш (x)",
    base: "Від чого рахується відіграш",
    bonusOnly: "Лише бонус",
    depositAndBonus: "Депозит + бонус",
    contribution: "Як зараховується твоя гра",
    slots: "Слоти · 100%",
    tableGames: "Настільні ігри · 50%",
    roulette: "Рулетка · 20%",
    blackjack: "Блекджек · 10%",
    rtp: "RTP гри, %",
    result: "Твій результат",
    requiredTurnover: "Вимоги до відіграшу в грошах",
    actualTurnover: "Скільки треба поставити в цій грі",
    expectedLoss: "Типова вартість таких ставок",
    netValue: "Бонус мінус типова вартість",
    negative: "За таких цифр ставки, імовірно, коштуватимуть більше, ніж вартий бонус.",
    positive: "За таких цифр бонус вартий більше, ніж типова вартість ставок.",
    caveat: "Це середнє значення на основі RTP, а не прогноз. Реальні результати сильно коливаються, і завжди діють умови самого казино.",
  },
  sections: [
    { id: "how-it-works", title: "Як рахується відіграш", paragraphs: [
      "Вимоги до відіграшу (їх ще називають вейджером) показують, скільки разів потрібно поставити певну суму, перш ніж можна буде вивести бонусні гроші та все, що на них виграно. Розрахунок складається з трьох частин: суми, від якої рахується відіграш, множника та того, наскільки зараховується обрана гра.",
      "Потрібний оборот ставок = база відіграшу × множник. Потім поділи результат на внесок своєї гри: за 100% нічого не змінюється, а за 10% доведеться поставити вдесятеро більше.",
    ] },
    { id: "same-multiplier", title: "Чому два бонуси з відіграшем 35x можуть вимагати зовсім різного обороту ставок", paragraphs: [
      "Візьмімо депозит 1 000 ₴, бонус 1 000 ₴ і відіграш 35x. Якщо 35x рахується лише від бонусу, потрібно поставити 35 000 ₴. Якщо від депозиту разом із бонусом — уже 70 000 ₴: удвічі більше, хоча цифра в заголовку та сама.",
      "Базу зазвичай вказують у повних умовах, а не поруч із заголовком, тож перш ніж порівнювати пропозиції, пошукай формулювання на кшталт «сума бонусу» або «депозит + бонус».",
    ] },
    { id: "game-contribution", title: "Внесок гри: прихований множник", paragraphs: [
      "Казино зараховують ігри по-різному. Слоти зазвичай зараховуються на 100%, а настільні ігри та ігри з живими дилерами — часто лише на 10–20% або не зараховуються зовсім. Якщо блекджек зараховується на 10%, відіграш 35x від бонусу діє як 350x.",
      "Які ігри зараховуються і наскільки, написано в умовах казино. Ігри з внеском 0% узагалі не наближають тебе до виконання вимог.",
    ] },
    { id: "turnover-is-not-loss", title: "Оборот ставок — це не те саме, що програш", paragraphs: [
      "Оборот ставок — це сума всіх твоїх ставок, а не гроші, які ти втрачаєш. Значна частина повертається під час гри у вигляді виграшів. У середньому втрачається оборот ставок, помножений на перевагу казино: за RTP 96% це близько 4% обороту ставок.",
      "70 000 ₴ ставок у слотах за RTP 96% коштують у середньому близько 2 800 ₴. Якщо бонус становить 1 000 ₴, ставки, імовірно, коштуватимуть більше, ніж вартий бонус. Нижчі вимоги змінюють картину: 1 000 ₴ із відіграшем 10x від бонусу — це 10 000 ₴ обороту ставок і типова вартість близько 400 ₴.",
    ] },
    { id: "great-britain", title: "Для порівняння: ліміт 10x у Великій Британії", paragraphs: [
      "Із 19 січня 2026 року казино з ліцензією UK Gambling Commission не можуть встановлювати вимоги до відіграшу, вищі за 10-кратну суму бонусу (LCCP, положення кодексу соціальної відповідальності 5.1.1). Пропозиція для Великої Британії, яка вимагає більшого, порушує це правило, тож перед грою перевір ліцензію та умови.",
    ] },
  ],
  checklistTitle: "Перш ніж приймати бонус, перевір",
  checklist: [
    "Від чого рахується відіграш: від бонусу чи від депозиту + бонусу",
    "Як твої ігри зараховуються у відіграш",
    "Максимальну ставку, дозволену під час відіграшу",
    "Скільки днів є на виконання вимог",
    "Чи є обмеження на суму, яку можна виграти або вивести з бонусу",
  ],
  faqTitle: "Запитання про вимоги до відіграшу",
  faq: [
    ["Як порахувати вимоги до відіграшу?", "Помнож суму, від якої рахується відіграш, на множник. Бонус 500 ₴ із відіграшем 10x від бонусу означає 5 000 ₴ ставок. Якщо вимоги поширюються на депозит + бонус, спершу додай депозит. Потім поділи результат на внесок своєї гри."],
    ["Що означає відіграш 35x?", "Потрібно поставити суму, у 35 разів більшу за базу відіграшу, перш ніж бонус можна буде вивести. Для бонусу 1 000 ₴ це 35 000 ₴; для депозиту 1 000 ₴ плюс бонус 1 000 ₴ — 70 000 ₴."],
    ["Чи мають безкоштовні обертання вимоги до відіграшу?", "Часто вимоги стосуються виграшів від безкоштовних обертань. Тоді множник застосовується до того, що ти виграєш на обертаннях, а не до вартості самих обертань. Перевір умови конкретної пропозиції."],
    ["Чи кращий бонус без відіграшу?", "Без вимог до відіграшу виграші зазвичай можна вивести одразу, тож додаткових витрат на ставки немає. Менший бонус без відіграшу може бути вартий більше, ніж більший бонус із високими вимогами."],
    ["Чи використовує калькулятор реальні умови казино?", "Ні. Він рахує лише з тими цифрами, які ти вводиш. Введи значення з актуальних умов пропозиції, яку розглядаєш; вирішальними завжди є умови казино."],
  ],
  offersTitle: "Порівняй бонуси за їхніми умовами",
  offersCopy: "Обери пропозицію, введи її цифри в калькулятор і подивись, чого бонус насправді від тебе вимагає.",
  offersAction: "Переглянути актуальні бонуси",
  homeLabel: "Головна",
  breadcrumbLabel: "Калькулятор відіграшу",
};

/**
 * Written for the five indexable languages. Every other published language is
 * noindex (productMetadata), so it reads the English page rather than a machine draft.
 */
const catalog: Partial<Record<SupportedLocale, WageringCalculatorMessages>> = {
  "en-GB": en,
  "de-DE": de,
  "sv-SE": sv,
  "da-DK": da,
  "uk-UA": uk,
};

const defaults: Partial<Record<SupportedLocale, WageringCalculatorDefaults>> = {
  // GB caps wagering at 10x the bonus and Denmark at 10x deposit + bonus, so those pages
  // start from the legal maximum; elsewhere from a common 35x on the bonus.
  "en-GB": { currency: "GBP", deposit: 100, bonus: 100, multiplier: 10, base: "bonus" },
  "de-DE": { currency: "EUR", deposit: 100, bonus: 100, multiplier: 35, base: "bonus" },
  "sv-SE": { currency: "SEK", deposit: 1000, bonus: 1000, multiplier: 35, base: "bonus" },
  "da-DK": { currency: "DKK", deposit: 1000, bonus: 1000, multiplier: 10, base: "deposit-bonus" },
  "uk-UA": { currency: "UAH", deposit: 1000, bonus: 1000, multiplier: 35, base: "bonus" },
};

export function wageringCalculatorLocale(locale: SupportedLocale): SupportedLocale {
  return catalog[locale] ? locale : "en-GB";
}

export function wageringCalculatorMessages(locale: SupportedLocale): WageringCalculatorMessages {
  return catalog[wageringCalculatorLocale(locale)] ?? en;
}

export function wageringCalculatorDefaults(locale: SupportedLocale): WageringCalculatorDefaults {
  return defaults[wageringCalculatorLocale(locale)] ?? { currency: "GBP", deposit: 100, bonus: 100, multiplier: 10, base: "bonus" };
}
