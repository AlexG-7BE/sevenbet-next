import type { SupportedLocale } from "@/lib/market/registry";

export type ProductPageMessages = Readonly<{
  common: Readonly<{
    notListed: string; current: string; published: string; classified: string; record: string; records: string;
    result: string; results: string; reviewOnly: string; actionAvailable: string; noGovernedVisit: string;
    readReview: string; viewDemonstration: string; browseReviews: string; reviewMethodology: string;
    editorScore: string; wagering: string; minimumDeposit: string; maximumBonus: string; maximumBet: string;
    payout: string; eligibility: string; expiry: string; paymentMethods: string; licence: string;
    activeFilters: string; clearAll: string; applyFilters: string; filters: string; previous: string; next: string;
    pageOf: string; demoData: string; demoDisclosure: string; marketPresentationNotice: string;
    reviewAvailableNoAction: string; affiliateDisclosure: string; methodology: string; bonusGuide: string;
    protectedHelp: string; allFilters: string; directoryControls: string; closeFilters: string;
    updatingResults: string; sourceStatus: string; materialTerms: string; commercialUnavailable: string;
    originalSourceCopy: string; countryPreference: string; bonusType: string; cryptoSupport: string;
    availability: string; sortResults: string; cryptoSupported: string; cryptoUnsupported: string;
    bonusAvailability: string; visitAvailability: string; saferGamblingInformation: string; mobileSupport: string;
    supported: string; resultsPerPage: string; featured: string; relevance: string; newest: string;
    nameAscending: string; nameDescending: string;
    breadcrumb: string;
  }>;
  bestOffers: Readonly<{
    title: string; description: string; unavailableTitle: string; unavailableDescription: string;
    heroLead: string; heroEmphasis: string; heroKicker: string; heroCopy: string;
    eligibleRecords: string; currentMarket: string; inferredActions: string; rankingLink: string;
    sectionTitle: string; commissionNote: string; emptyTitle: string; emptyCopy: string;
    unavailableTitleBody: string; unavailableCopy: string; whyTitle: string; whyCopy: string;
    beforeClick: string; faqWageringQuestion: string; faqWageringAnswer: string;
    faqCommissionQuestion: string; faqCommissionAnswer: string; faqWhyThreeQuestion: string; faqWhyThreeAnswer: string;
  }>;
  casinos: Readonly<{
    title: string; description: string; demoTitle: string; demoDescription: string;
    heroKicker: string; heroLead: string; heroEmphasis: string; heroCopy: string;
    proofEvidence: string; proofLimit: string; proofPublished: string; directoryTitle: string;
    noMatchesTitle: string; noMatchesCopy: string; noPublishedTitle: string; reviewOnlyNotice: string;
    faqTitle: string; faqDifferenceQuestion: string; faqDifferenceAnswer: string;
    faqReviewOnlyQuestion: string; faqReviewOnlyAnswer: string; faqCommissionQuestion: string; faqCommissionAnswer: string;
  }>;
  bonuses: Readonly<{
    title: string; description: string; demoTitle: string; demoDescription: string;
    heroKicker: string; heroLead: string; heroEmphasis: string; heroCopy: string;
    proofTerms: string; proofClaims: string; proofSources: string; directoryTitle: string; sortedByValue: string;
    noMatchesTitle: string; noMatchesCopy: string; unavailableTitleBody: string; unavailableCopy: string;
    methodKicker: string; methodLead: string; methodEmphasis: string; methodCopy: string; guideAction: string;
    disclosureTitle: string; disclosureCopy: string; disclosureAction: string;
  }>;
  profile: Readonly<{
    unavailableTitle: string; unavailableDescription: string; review: string; operatorReview: string;
    verdict: string; offerUnavailable: string; currentReview: string; publishedReview: string;
    demoReview: string; demoDisclosure: string; marketUnavailable: string; marketUnavailableCopy: string;
    overview: string; offerEvidence: string; questions: string; quickCheck: string; quickCheckCopy: string;
    bestFor: string; whyWeLikeIt: string; thingsToKnow: string; founded: string; games: string;
    offerTerms: string; evidencePaymentsTools: string; licenceRecord: string; paymentRecords: string;
    providers: string; controlTools: string; keepInView: string; scoreExplanation: string;
    relatedTitle: string; relatedCopy: string; compareBonusTerms: string; exploreBonusInformation: string;
    originalEditorialNotice: string;
  }>;
  comparison: Readonly<{
    trayLabel: string; selectedOfThree: string; chooseOneMore: string; ready: string; add: string; open: string; clear: string;
    title: string; subtitle: string; close: string; loading: string; unavailable: string; fullReview: string;
    remove: string; topScore: string; evidenceUnavailable: string; footer: string;
  }>;
  outbound: Readonly<{
    affiliateNote: string; label: string; title: string; description: string; contractLabel: string;
    contractCopy: string; riskCopy: string; continueAction: string; cancelAction: string; disclosureAction: string;
  }>;
  calculator: Readonly<{
    kicker: string; titleLead: string; titleEmphasis: string; copy: string; amount: string; multiplier: string;
    appliesTo: string; bonusOnly: string; depositAndBonus: string; gameWeight: string; conversion: string;
    requiredTurnover: string; effectiveTurnover: string; expectedCost: string; expectedValue: string;
    negative: string; positive: string; caveat: string;
  }>;
}>;

const en: ProductPageMessages = {
  common: {
    notListed: "Not listed", current: "Current", published: "Published", classified: "classified", record: "record", records: "records",
    result: "result", results: "results", reviewOnly: "Review only", actionAvailable: "Action available", noGovernedVisit: "No governed visit",
    readReview: "Read review", viewDemonstration: "View demonstration", browseReviews: "Browse casino reviews", reviewMethodology: "Review methodology",
    editorScore: "Editor Score", wagering: "Wagering", minimumDeposit: "Minimum deposit", maximumBonus: "Maximum bonus", maximumBet: "Maximum bet",
    payout: "Payout", eligibility: "Eligibility", expiry: "Expiry", paymentMethods: "Payments", licence: "Licence",
    activeFilters: "Active filters", clearAll: "Clear all", applyFilters: "Apply filters", filters: "Filters", previous: "Previous", next: "Next",
    pageOf: "Page {page} of {pages}", demoData: "DEMONSTRATION DATA", demoDisclosure: "Fictional product records are not current operators, partner offers or live promotions. No gambling or affiliate destination is available.",
    marketPresentationNotice: "The selected market changes editorial presentation only. It does not prove location, eligibility or commercial availability.",
    reviewAvailableNoAction: "The review remains available while commercial action is unavailable.", affiliateDisclosure: "Affiliate disclosure", methodology: "Methodology", bonusGuide: "Bonus guide",
    protectedHelp: "Open protected Help", allFilters: "All filters", directoryControls: "Directory controls", closeFilters: "Close filters", updatingResults: "Updating results…",
    sourceStatus: "Source status", materialTerms: "Material terms", commercialUnavailable: "Commercial action unavailable", originalSourceCopy: "Source-controlled facts remain in their published language.",
    countryPreference: "Country preference", bonusType: "Bonus type", cryptoSupport: "Crypto support", availability: "Availability", sortResults: "Sort results",
    cryptoSupported: "Crypto supported", cryptoUnsupported: "No crypto support",
    bonusAvailability: "Bonus availability", visitAvailability: "Visit availability", saferGamblingInformation: "Safer-gambling information", mobileSupport: "Mobile support",
    supported: "Supported", resultsPerPage: "Results per page", featured: "Featured", relevance: "Relevance", newest: "Newest", nameAscending: "Name A–Z", nameDescending: "Name Z–A",
    breadcrumb: "Breadcrumb",
  },
  bestOffers: {
    title: "Casino offer comparison for {market} | B4GAMBLE", description: "An editorial shortlist for {market}, with material terms and commercial availability shown before action.",
    unavailableTitle: "Casino offer comparison unavailable | B4GAMBLE", unavailableDescription: "The published offer comparison for {market} is temporarily unavailable. No cached, legacy or invented listing is substituted.",
    heroLead: "Three picks.", heroEmphasis: "Not thirty.", heroKicker: "Current editorial shortlist for {market}", heroCopy: "Published records are filtered for {market}. Commercial action remains subject to separate request-time authority.",
    eligibleRecords: "eligible records", currentMarket: "editorial market", inferredActions: "inferred actions", rankingLink: "How ranking works →",
    sectionTitle: "The top three — material terms shown first", commissionNote: "We may earn a commission from an eligible labelled link. Compensation does not determine Editor Score or natural editorial ranking.",
    emptyTitle: "No eligible records for {market}.", emptyCopy: "B4GAMBLE does not substitute a GB shortlist or relax the method to fill this market page.",
    unavailableTitleBody: "The comparison could not be loaded.", unavailableCopy: "No cached, legacy or invented commercial result is substituted.",
    whyTitle: "Why these records are shown", whyCopy: "Market availability, complete material terms and source status are checked before ranking. Commercial availability is checked separately.",
    beforeClick: "Before you click", faqWageringQuestion: "What does wagering mean?", faqWageringAnswer: "It is the turnover required by the published terms before bonus winnings can be withdrawn.",
    faqCommissionQuestion: "Do you earn money if I sign up?", faqCommissionAnswer: "An eligible labelled affiliate link may earn commission. Compensation does not determine the editorial score or natural ranking.",
    faqWhyThreeQuestion: "Why only three offers?", faqWhyThreeAnswer: "A short list keeps the decision bounded; the Bonuses page provides the full eligible directory.",
  },
  casinos: {
    title: "Casino reviews for {market} | B4GAMBLE", description: "Search and compare published casino reviews filtered for the {market} editorial context.", demoTitle: "Casino review demonstration | B4GAMBLE", demoDescription: "Clearly labelled fictional records show the review format without a live promotion or affiliate action.",
    heroKicker: "Curated for {market}", heroLead: "Picked for", heroEmphasis: "how you play.", heroCopy: "Choose your use-case; the directory shows published records for the selected editorial market without implying commercial eligibility.",
    proofEvidence: "Evidence and limitations disclosed", proofLimit: "Maximum three per use-case", proofPublished: "Current published data only", directoryTitle: "Full directory",
    noMatchesTitle: "No published reviews match this market and these controls.", noMatchesCopy: "Remove a filter or change presentation. B4GAMBLE will not fill the gap with ineligible operators.",
    noPublishedTitle: "No published reviews for {market} yet.", reviewOnlyNotice: "Reviews remain available. Commercial actions stay hidden until market, offer and redirect authority all pass.",
    faqTitle: "Before you choose", faqDifferenceQuestion: "How is this different from Best Offers?", faqDifferenceAnswer: "Best Offers is a bounded shortlist. This directory keeps every eligible published review available for comparison.",
    faqReviewOnlyQuestion: "What does review only mean?", faqReviewOnlyAnswer: "The editorial review is available, but there is no governed signup route for this request.",
    faqCommissionQuestion: "Does commission affect ranking?", faqCommissionAnswer: "No. Affiliate compensation does not determine Editor Score or natural editorial ranking.",
  },
  bonuses: {
    title: "Casino bonus comparison for {market} | B4GAMBLE", description: "Compare published bonus terms filtered for the {market} editorial context, without assuming commercial availability.", demoTitle: "Casino bonus demonstration | B4GAMBLE", demoDescription: "Clearly labelled fictional records show how terms are compared. They are not current promotions or partner offers.",
    heroKicker: "Bonuses · Terms first · 18+", heroLead: "Value, measured", heroEmphasis: "by terms.", heroCopy: "Headline size means little after wagering. Compare deposits, turnover, restrictions and expiry before any action.",
    proofTerms: "Material terms shown first", proofClaims: "No guaranteed-money claims", proofSources: "Source status stays visible", directoryTitle: "All bonuses", sortedByValue: "sorted by net value",
    noMatchesTitle: "No comparison records match {market} and these filters.", noMatchesCopy: "Remove a filter or change presentation. No ineligible offer is substituted.",
    unavailableTitleBody: "The published directory could not be loaded.", unavailableCopy: "No cached, legacy, demonstration or invented offer is substituted.",
    methodKicker: "How we evaluate bonus terms", methodLead: "The fine print is", methodEmphasis: "the product.", methodCopy: "Wagering, weighting, deposit floors and expiry decide what a bonus can actually require.", guideAction: "Read the Bonus Guide →",
    disclosureTitle: "18+ · Commercial disclosure", disclosureCopy: "B4GAMBLE may receive compensation from future eligible governed links. Compensation does not determine Editor Score or natural ranking. Verify current operator terms and local law before acting.", disclosureAction: "Read disclosure →",
  },
  profile: {
    unavailableTitle: "Casino profile unavailable | B4GAMBLE", unavailableDescription: "This casino profile is not published or is unavailable.", review: "review", operatorReview: "Operator review", verdict: "Our verdict:", offerUnavailable: "Offer unavailable",
    currentReview: "Current review", publishedReview: "Published review", demoReview: "Fictional review demonstration", demoDisclosure: "Fictional review fields; no current operator, licence, partner offer or commercial visit.",
    marketUnavailable: "Review only for {market}", marketUnavailableCopy: "This profile does not publish availability for the selected presentation market. No eligibility is inferred and commercial action is unavailable.",
    overview: "Overview", offerEvidence: "Offer & evidence", questions: "FAQ", quickCheck: "The 30-second check", quickCheckCopy: "Key published fields before the details",
    bestFor: "Best for", whyWeLikeIt: "Why we like it", thingsToKnow: "Things to know", founded: "Founded", games: "Games", offerTerms: "Offer & terms",
    evidencePaymentsTools: "Evidence, payments & control tools", licenceRecord: "Licence record", paymentRecords: "Payment records", providers: "Providers", controlTools: "Control tools",
    keepInView: "Keep in view", scoreExplanation: "Editorial judgement, not a weighted formula", relatedTitle: "Keep comparing", relatedCopy: "Use the same evidence across every review.",
    compareBonusTerms: "Compare published bonus terms", exploreBonusInformation: "Explore bonus information", originalEditorialNotice: "The editorial review body is source-controlled and is shown in its published language.",
  },
  comparison: {
    trayLabel: "Casino comparison tray", selectedOfThree: "{count} of 3 selected", chooseOneMore: "Choose one more to compare", ready: "Your comparison is ready", add: "Compare", open: "Open comparison", clear: "Clear",
    title: "Side by side", subtitle: "The same evidence fields for every casino", close: "Close comparison", loading: "Building the comparison…", unavailable: "The selected public comparison is unavailable. No substitute has been inserted.",
    fullReview: "Full review", remove: "Remove", topScore: "Top score", evidenceUnavailable: "Published comparison evidence is unavailable.", footer: "18+ · Availability is never assumed · Scores are editorial. Country is a comparison preference, not proof of eligibility.",
  },
  outbound: {
    affiliateNote: "Affiliate link · We may earn commission.", label: "02 / Outbound confirmation", title: "You are leaving B4GAMBLE.",
    description: "You are about to visit a third-party gambling operator. An eligible action may earn B4GAMBLE commission. This does not change Editor Score or natural editorial ranking.",
    contractLabel: "Handoff contract", contractCopy: "No raw destination URL · no browser-supplied authority.", riskCopy: "18+ · Eligibility and operator terms apply · Gambling involves financial risk",
    continueAction: "Continue to eligible partner →", cancelAction: "Cancel and stay on B4GAMBLE", disclosureAction: "Review affiliate disclosure",
  },
  calculator: {
    kicker: "What a bonus really costs", titleLead: "Run the numbers", titleEmphasis: "before you claim.", copy: "Enter the advertised figures to see required turnover and an illustrative expected clearing cost.",
    amount: "Bonus amount", multiplier: "Wagering multiplier", appliesTo: "Wagering applies to", bonusOnly: "Bonus only", depositAndBonus: "Deposit + bonus", gameWeight: "Your game counts at", conversion: "The conversion",
    requiredTurnover: "Required turnover", effectiveTurnover: "Effective turnover at this weighting", expectedCost: "Illustrative expected clearing cost", expectedValue: "Illustrative expected net value",
    negative: "On these inputs, the expected clearing cost is greater than the bonus value.", positive: "On these inputs, the headline bonus is greater than the illustrative expected clearing cost.", caveat: "Statistical illustration, not a prediction. Variance is large and actual terms control.",
  },
};

function translated(overrides: ProductPageMessages): ProductPageMessages { return overrides; }

const de = translated({
  common: { notListed:"Nicht angegeben",current:"Aktuell",published:"Veröffentlicht",classified:"klassifiziert",record:"Eintrag",records:"Einträge",result:"Ergebnis",results:"Ergebnisse",reviewOnly:"Nur Bewertung",actionAvailable:"Aktion verfügbar",noGovernedVisit:"Kein freigegebener Besuch",readReview:"Bewertung lesen",viewDemonstration:"Demonstration ansehen",browseReviews:"Casino-Bewertungen durchsuchen",reviewMethodology:"Methodik ansehen",editorScore:"Editor Score",wagering:"Umsatzbedingung",minimumDeposit:"Mindesteinzahlung",maximumBonus:"Maximaler Bonus",maximumBet:"Maximaler Einsatz",payout:"Auszahlung",eligibility:"Teilnahmebedingungen",expiry:"Ablauf",paymentMethods:"Zahlungen",licence:"Lizenz",activeFilters:"Aktive Filter",clearAll:"Alle löschen",applyFilters:"Filter anwenden",filters:"Filter",previous:"Zurück",next:"Weiter",pageOf:"Seite {page} von {pages}",demoData:"DEMONSTRATIONSDATEN",demoDisclosure:"Fiktive Produktdaten sind keine aktuellen Anbieter, Partnerangebote oder Live-Aktionen. Es gibt kein Glücksspiel- oder Affiliate-Ziel.",marketPresentationNotice:"Der gewählte Markt ändert nur den redaktionellen Kontext. Er beweist weder Standort noch Berechtigung oder kommerzielle Verfügbarkeit.",reviewAvailableNoAction:"Die Bewertung bleibt verfügbar, während die kommerzielle Aktion nicht verfügbar ist.",affiliateDisclosure:"Affiliate-Hinweis",methodology:"Methodik",bonusGuide:"Bonus-Leitfaden",protectedHelp:"Geschützte Hilfe öffnen",allFilters:"Alle Filter",directoryControls:"Verzeichnisfilter",closeFilters:"Filter schließen",updatingResults:"Ergebnisse werden aktualisiert…",sourceStatus:"Quellenstatus",materialTerms:"Wesentliche Bedingungen",commercialUnavailable:"Kommerzielle Aktion nicht verfügbar",originalSourceCopy:"Quellengesteuerte Fakten bleiben in ihrer veröffentlichten Sprache.",countryPreference:"Länderpräferenz",bonusType:"Bonusart",cryptoSupport:"Krypto-Unterstützung",availability:"Verfügbarkeit",sortResults:"Ergebnisse sortieren",cryptoSupported:"Krypto unterstützt",cryptoUnsupported:"Keine Krypto-Unterstützung",bonusAvailability:"Bonusverfügbarkeit",visitAvailability:"Besuchsverfügbarkeit",saferGamblingInformation:"Informationen zu sichererem Glücksspiel",mobileSupport:"Mobilgeräte-Unterstützung",supported:"Unterstützt",resultsPerPage:"Ergebnisse pro Seite",featured:"Empfohlen",relevance:"Relevanz",newest:"Neueste",nameAscending:"Name A–Z",nameDescending:"Name Z–A",breadcrumb:"Brotkrümelnavigation" },
  bestOffers:{title:"Casino-Angebotsvergleich für {market} | B4GAMBLE",description:"Eine redaktionelle Auswahlliste für {market}, mit wesentlichen Bedingungen und Verfügbarkeit vor jeder Aktion.",unavailableTitle:"Casino-Angebotsvergleich nicht verfügbar | B4GAMBLE",unavailableDescription:"Der veröffentlichte Angebotsvergleich für {market} ist vorübergehend nicht verfügbar. Es wird kein erfundener Ersatz angezeigt.",heroLead:"Drei Empfehlungen.",heroEmphasis:"Nicht dreißig.",heroKicker:"Aktuelle redaktionelle Auswahl für {market}",heroCopy:"Veröffentlichte Einträge werden für {market} gefiltert. Kommerzielle Aktionen benötigen weiterhin eine separate Anfrage-Autorität.",eligibleRecords:"geeignete Einträge",currentMarket:"redaktioneller Markt",inferredActions:"abgeleitete Aktionen",rankingLink:"So funktioniert das Ranking →",sectionTitle:"Die besten drei — wesentliche Bedingungen zuerst",commissionNote:"Wir können über einen berechtigten gekennzeichneten Link Provision erhalten. Die Vergütung bestimmt weder Editor Score noch natürliche Rangfolge.",emptyTitle:"Keine geeigneten Einträge für {market}.",emptyCopy:"B4GAMBLE ersetzt dies nicht durch eine GB-Liste und lockert die Methode nicht.",unavailableTitleBody:"Der Vergleich konnte nicht geladen werden.",unavailableCopy:"Es wird kein zwischengespeichertes, altes oder erfundenes kommerzielles Ergebnis eingesetzt.",whyTitle:"Warum diese Einträge erscheinen",whyCopy:"Marktverfügbarkeit, vollständige Bedingungen und Quellenstatus werden vor dem Ranking geprüft. Kommerzielle Verfügbarkeit wird getrennt geprüft.",beforeClick:"Vor dem Klick",faqWageringQuestion:"Was bedeutet die Umsatzbedingung?",faqWageringAnswer:"Sie bezeichnet den laut veröffentlichten Bedingungen erforderlichen Umsatz vor einer Auszahlung.",faqCommissionQuestion:"Verdient ihr bei meiner Anmeldung?",faqCommissionAnswer:"Ein berechtigter gekennzeichneter Affiliate-Link kann Provision bringen. Sie beeinflusst die redaktionelle Bewertung nicht.",faqWhyThreeQuestion:"Warum nur drei Angebote?",faqWhyThreeAnswer:"Eine kurze Liste hält die Entscheidung überschaubar; die Bonusseite zeigt das vollständige geeignete Verzeichnis."},
  casinos:{title:"Casino-Bewertungen für {market} | B4GAMBLE",description:"Veröffentlichte Casino-Bewertungen im redaktionellen Kontext von {market} suchen und vergleichen.",demoTitle:"Demonstration von Casino-Bewertungen | B4GAMBLE",demoDescription:"Klar gekennzeichnete fiktive Einträge zeigen das Format ohne Live-Aktion.",heroKicker:"Für {market} kuratiert",heroLead:"Kenne den Anbieter",heroEmphasis:"vor dem Angebot.",heroCopy:"Vergleiche Marktverfügbarkeit, Lizenzangaben, Zahlungen, Kontrollen und wesentliche Bedingungen.",proofEvidence:"Evidenz und Grenzen offengelegt",proofLimit:"Höchstens drei pro Anwendungsfall",proofPublished:"Nur aktuelle veröffentlichte Daten",directoryTitle:"Gesamtes Verzeichnis",noMatchesTitle:"Keine veröffentlichte Bewertung passt zu diesem Markt und den Filtern.",noMatchesCopy:"Entferne einen Filter oder ändere die Darstellung. B4GAMBLE ergänzt keine ungeeigneten Anbieter.",noPublishedTitle:"Noch keine veröffentlichten Bewertungen für {market}.",reviewOnlyNotice:"Bewertungen bleiben verfügbar. Kommerzielle Aktionen bleiben verborgen, bis Markt-, Angebot- und Weiterleitungsautorität bestehen.",faqTitle:"Vor deiner Auswahl",faqDifferenceQuestion:"Wie unterscheidet sich dies von Beste Angebote?",faqDifferenceAnswer:"Beste Angebote ist eine begrenzte Auswahl. Dieses Verzeichnis hält alle geeigneten veröffentlichten Bewertungen vergleichbar.",faqReviewOnlyQuestion:"Was bedeutet Nur Bewertung?",faqReviewOnlyAnswer:"Die redaktionelle Bewertung ist verfügbar, aber für diese Anfrage gibt es keinen freigegebenen Anmeldeweg.",faqCommissionQuestion:"Beeinflusst Provision das Ranking?",faqCommissionAnswer:"Nein. Affiliate-Vergütung bestimmt weder Editor Score noch natürliche redaktionelle Rangfolge."},
  bonuses:{title:"Casino-Bonusvergleich für {market} | B4GAMBLE",description:"Veröffentlichte Bonusbedingungen für {market} vergleichen, ohne kommerzielle Verfügbarkeit anzunehmen.",demoTitle:"Casino-Bonusdemonstration | B4GAMBLE",demoDescription:"Fiktive Einträge zeigen den Vergleich. Sie sind keine aktuellen Aktionen.",heroKicker:"Boni · Bedingungen zuerst · 18+",heroLead:"Wert, gemessen",heroEmphasis:"an Bedingungen.",heroCopy:"Große Zahlen sagen nach Umsatzbedingungen wenig. Vergleiche Einzahlung, Umsatz, Einschränkungen und Ablauf.",proofTerms:"Wesentliche Bedingungen zuerst",proofClaims:"Keine Garantieversprechen",proofSources:"Quellenstatus sichtbar",directoryTitle:"Alle Boni",sortedByValue:"nach Nettowert sortiert",noMatchesTitle:"Keine Vergleichseinträge passen zu {market} und diesen Filtern.",noMatchesCopy:"Entferne einen Filter oder ändere die Darstellung. Kein ungeeignetes Angebot wird eingesetzt.",unavailableTitleBody:"Das veröffentlichte Verzeichnis konnte nicht geladen werden.",unavailableCopy:"Es wird kein zwischengespeichertes oder erfundenes Angebot eingesetzt.",methodKicker:"So bewerten wir Bonusbedingungen",methodLead:"Das Kleingedruckte ist",methodEmphasis:"das Produkt.",methodCopy:"Umsatz, Gewichtung, Einzahlung und Ablauf bestimmen die tatsächlichen Anforderungen.",guideAction:"Bonus-Leitfaden lesen →",disclosureTitle:"18+ · Kommerzieller Hinweis",disclosureCopy:"B4GAMBLE kann über künftig berechtigte Links Vergütung erhalten. Sie bestimmt weder Editor Score noch Rangfolge. Prüfe aktuelle Bedingungen und lokales Recht.",disclosureAction:"Hinweis lesen →"},
  profile:{unavailableTitle:"Casino-Profil nicht verfügbar | B4GAMBLE",unavailableDescription:"Dieses Casino-Profil ist nicht veröffentlicht oder nicht verfügbar.",review:"Bewertung",operatorReview:"Anbieterbewertung",verdict:"Unser Urteil:",offerUnavailable:"Angebot nicht verfügbar",currentReview:"Aktuelle Bewertung",publishedReview:"Veröffentlichte Bewertung",demoReview:"Fiktive Bewertungsdemonstration",demoDisclosure:"Fiktive Bewertungsfelder; kein aktueller Anbieter, keine Lizenzbehauptung, kein Partnerangebot und kein kommerzieller Besuch.",marketUnavailable:"Nur Bewertung für {market}",marketUnavailableCopy:"Dieses Profil veröffentlicht keine Verfügbarkeit für den gewählten Darstellungsmarkt. Es wird keine Berechtigung abgeleitet und keine kommerzielle Aktion angeboten.",overview:"Überblick",offerEvidence:"Angebot & Evidenz",questions:"FAQ",quickCheck:"Der 30-Sekunden-Check",quickCheckCopy:"Wichtige veröffentlichte Felder vor den Details",bestFor:"Geeignet für",whyWeLikeIt:"Warum es auffällt",thingsToKnow:"Wissenswert",founded:"Gegründet",games:"Spiele",offerTerms:"Angebot & Bedingungen",evidencePaymentsTools:"Evidenz, Zahlungen & Kontrollwerkzeuge",licenceRecord:"Lizenzeintrag",paymentRecords:"Zahlungsangaben",providers:"Anbieter",controlTools:"Kontrollwerkzeuge",keepInView:"Im Blick behalten",scoreExplanation:"Redaktionelles Urteil, keine gewichtete Formel",relatedTitle:"Weiter vergleichen",relatedCopy:"Nutze in jeder Bewertung dieselben Evidenzfelder.",compareBonusTerms:"Veröffentlichte Bonusbedingungen vergleichen",exploreBonusInformation:"Bonusinformationen ansehen",originalEditorialNotice:"Der redaktionelle Bewertungstext ist quellengesteuert und erscheint in seiner veröffentlichten Sprache."},
  comparison:{trayLabel:"Casino-Vergleich",selectedOfThree:"{count} von 3 ausgewählt",chooseOneMore:"Wähle noch eines zum Vergleichen",ready:"Dein Vergleich ist bereit",add:"Vergleichen",open:"Vergleich öffnen",clear:"Löschen",title:"Direkter Vergleich",subtitle:"Dieselben Evidenzfelder für jedes Casino",close:"Vergleich schließen",loading:"Vergleich wird erstellt…",unavailable:"Der ausgewählte öffentliche Vergleich ist nicht verfügbar. Es wurde kein Ersatz eingesetzt.",fullReview:"Vollständige Bewertung",remove:"Entfernen",topScore:"Höchste Bewertung",evidenceUnavailable:"Veröffentlichte Vergleichsevidenz ist nicht verfügbar.",footer:"18+ · Verfügbarkeit wird nie angenommen · Bewertungen sind redaktionell. Der Markt ist eine Vergleichspräferenz, kein Berechtigungsnachweis."},
  outbound:{affiliateNote:"Affiliate-Link · Wir können Provision erhalten.",label:"02 / Bestätigung der Weiterleitung",title:"Du verlässt B4GAMBLE.",description:"Du besuchst gleich einen externen Glücksspielanbieter. Eine berechtigte Aktion kann B4GAMBLE Provision bringen. Dies ändert die redaktionelle Rangfolge nicht.",contractLabel:"Übergabevertrag",contractCopy:"Keine rohe Ziel-URL · keine Autorität aus dem Browser.",riskCopy:"18+ · Berechtigung und Anbieterbedingungen gelten · Glücksspiel birgt finanzielle Risiken",continueAction:"Zum berechtigten Partner weiter →",cancelAction:"Abbrechen und bei B4GAMBLE bleiben",disclosureAction:"Affiliate-Hinweis ansehen"},
  calculator:{kicker:"Was ein Bonus wirklich kostet",titleLead:"Rechne nach",titleEmphasis:"bevor du handelst.",copy:"Gib die beworbenen Zahlen ein, um erforderlichen Umsatz und eine beispielhafte Erwartung zu sehen.",amount:"Bonusbetrag",multiplier:"Umsatzmultiplikator",appliesTo:"Umsatz gilt für",bonusOnly:"Nur Bonus",depositAndBonus:"Einzahlung + Bonus",gameWeight:"Dein Spiel zählt mit",conversion:"Die Umrechnung",requiredTurnover:"Erforderlicher Umsatz",effectiveTurnover:"Effektiver Umsatz bei dieser Gewichtung",expectedCost:"Beispielhafte erwartete Kosten",expectedValue:"Beispielhafter erwarteter Nettowert",negative:"Bei diesen Eingaben liegen die erwarteten Kosten über dem Bonuswert.",positive:"Bei diesen Eingaben liegt der beworbene Bonus über den beispielhaften erwarteten Kosten.",caveat:"Statistische Veranschaulichung, keine Vorhersage. Die tatsächlichen Bedingungen gelten."}
});

const compactTranslations = {
  "it-IT": ["Recensioni e confronti trasparenti per {market}.","Il mercato selezionato cambia solo il contesto editoriale; non prova idoneità o disponibilità commerciale.","Nessun record idoneo per {market}.","Nessuna recensione pubblicata per {market}.","Nessun bonus idoneo per {market}.","Solo recensione per {market}"],
  "es-ES": ["Reseñas y comparaciones transparentes para {market}.","El mercado seleccionado solo cambia el contexto editorial; no demuestra elegibilidad ni disponibilidad comercial.","No hay registros aptos para {market}.","Aún no hay reseñas publicadas para {market}.","No hay bonos aptos para {market}.","Solo reseña para {market}"],
  "pt-PT": ["Análises e comparações transparentes para {market}.","O mercado selecionado altera apenas o contexto editorial; não comprova elegibilidade nem disponibilidade comercial.","Não existem registos elegíveis para {market}.","Ainda não existem análises publicadas para {market}.","Não existem bónus elegíveis para {market}.","Apenas análise para {market}"],
  "el-GR": ["Διαφανείς αξιολογήσεις και συγκρίσεις για {market}.","Η επιλεγμένη αγορά αλλάζει μόνο το συντακτικό πλαίσιο· δεν αποδεικνύει επιλεξιμότητα ή εμπορική διαθεσιμότητα.","Δεν υπάρχουν επιλέξιμες εγγραφές για {market}.","Δεν υπάρχουν ακόμη δημοσιευμένες αξιολογήσεις για {market}.","Δεν υπάρχουν επιλέξιμα μπόνους για {market}.","Μόνο αξιολόγηση για {market}"],
  "nl-NL": ["Transparante reviews en vergelijkingen voor {market}.","De gekozen markt wijzigt alleen de redactionele context; dit bewijst geen geschiktheid of commerciële beschikbaarheid.","Geen geschikte records voor {market}.","Nog geen gepubliceerde reviews voor {market}.","Geen geschikte bonussen voor {market}.","Alleen review voor {market}"],
  "sv-SE": ["Tydliga recensioner och jämförelser för {market}.","Den valda marknaden ändrar bara det redaktionella sammanhanget; den bevisar inte behörighet eller kommersiell tillgänglighet.","Inga kvalificerade poster för {market}.","Inga publicerade recensioner för {market} ännu.","Inga kvalificerade bonusar för {market}.","Endast recension för {market}"],
  "da-DK": ["Gennemsigtige anmeldelser og sammenligninger for {market}.","Det valgte marked ændrer kun den redaktionelle kontekst; det beviser ikke berettigelse eller kommerciel tilgængelighed.","Ingen kvalificerede poster for {market}.","Ingen offentliggjorte anmeldelser for {market} endnu.","Ingen kvalificerede bonusser for {market}.","Kun anmeldelse for {market}"],
  "fi-FI": ["Läpinäkyvät arviot ja vertailut markkinalle {market}.","Valittu markkina muuttaa vain toimituksellista kontekstia; se ei osoita kelpoisuutta tai kaupallista saatavuutta.","Ei kelvollisia tietueita markkinalle {market}.","Markkinalle {market} ei ole vielä julkaistuja arvioita.","Ei kelvollisia bonuksia markkinalle {market}.","Vain arvio markkinalle {market}"],
  "nb-NO": ["Åpne anmeldelser og sammenligninger for {market}.","Det valgte markedet endrer bare den redaksjonelle konteksten; det beviser ikke kvalifisering eller kommersiell tilgjengelighet.","Ingen kvalifiserte oppføringer for {market}.","Ingen publiserte anmeldelser for {market} ennå.","Ingen kvalifiserte bonuser for {market}.","Kun anmeldelse for {market}"],
} as const;

const draftFilterLabels: Record<keyof typeof compactTranslations, readonly [string, string, string, string, string, string, string]> = {
  "it-IT": ["Preferenza paese", "Tipo di bonus", "Supporto crypto", "Disponibilità", "Ordina risultati", "Crypto supportate", "Nessun supporto crypto"],
  "es-ES": ["Preferencia de país", "Tipo de bono", "Compatibilidad con cripto", "Disponibilidad", "Ordenar resultados", "Cripto admitida", "Sin compatibilidad cripto"],
  "pt-PT": ["Preferência de país", "Tipo de bónus", "Suporte de cripto", "Disponibilidade", "Ordenar resultados", "Cripto suportada", "Sem suporte de cripto"],
  "el-GR": ["Προτίμηση χώρας", "Τύπος μπόνους", "Υποστήριξη κρυπτονομισμάτων", "Διαθεσιμότητα", "Ταξινόμηση αποτελεσμάτων", "Υποστηρίζονται κρυπτονομίσματα", "Χωρίς υποστήριξη κρυπτονομισμάτων"],
  "nl-NL": ["Landvoorkeur", "Bonustype", "Crypto-ondersteuning", "Beschikbaarheid", "Resultaten sorteren", "Crypto ondersteund", "Geen crypto-ondersteuning"],
  "sv-SE": ["Landsval", "Bonustyp", "Kryptostöd", "Tillgänglighet", "Sortera resultat", "Krypto stöds", "Inget kryptostöd"],
  "da-DK": ["Landepræference", "Bonustype", "Kryptounderstøttelse", "Tilgængelighed", "Sortér resultater", "Krypto understøttes", "Ingen kryptounderstøttelse"],
  "fi-FI": ["Maavalinta", "Bonustyyppi", "Kryptotuki", "Saatavuus", "Lajittele tulokset", "Kryptoa tuetaan", "Ei kryptotukea"],
  "nb-NO": ["Landpreferanse", "Bonustype", "Kryptostøtte", "Tilgjengelighet", "Sorter resultater", "Krypto støttes", "Ingen kryptostøtte"],
};

const draftCasinoControlLabels: Record<keyof typeof compactTranslations, readonly [string, string, string, string, string, string, string, string, string, string, string]> = {
  "it-IT": ["Disponibilità bonus", "Disponibilità visita", "Informazioni sul gioco più sicuro", "Supporto mobile", "Supportato", "Risultati per pagina", "In evidenza", "Pertinenza", "Più recenti", "Nome A–Z", "Nome Z–A"],
  "es-ES": ["Disponibilidad del bono", "Disponibilidad de visita", "Información de juego más seguro", "Compatibilidad móvil", "Compatible", "Resultados por página", "Destacados", "Relevancia", "Más recientes", "Nombre A–Z", "Nombre Z–A"],
  "pt-PT": ["Disponibilidade do bónus", "Disponibilidade de visita", "Informação de jogo mais seguro", "Suporte móvel", "Suportado", "Resultados por página", "Destaques", "Relevância", "Mais recentes", "Nome A–Z", "Nome Z–A"],
  "el-GR": ["Διαθεσιμότητα μπόνους", "Διαθεσιμότητα επίσκεψης", "Πληροφορίες ασφαλέστερου παιχνιδιού", "Υποστήριξη κινητών", "Υποστηρίζεται", "Αποτελέσματα ανά σελίδα", "Προτεινόμενα", "Συνάφεια", "Νεότερα", "Όνομα Α–Ω", "Όνομα Ω–Α"],
  "nl-NL": ["Bonusbeschikbaarheid", "Bezoekbeschikbaarheid", "Informatie over veiliger gokken", "Mobiele ondersteuning", "Ondersteund", "Resultaten per pagina", "Uitgelicht", "Relevantie", "Nieuwste", "Naam A–Z", "Naam Z–A"],
  "sv-SE": ["Bonustillgänglighet", "Besökstillgänglighet", "Information om säkrare spel", "Mobilstöd", "Stöds", "Resultat per sida", "Utvalda", "Relevans", "Senaste", "Namn A–Ö", "Namn Ö–A"],
  "da-DK": ["Bonustilgængelighed", "Besøgstilgængelighed", "Information om sikrere spil", "Mobilunderstøttelse", "Understøttet", "Resultater pr. side", "Fremhævede", "Relevans", "Nyeste", "Navn A–Å", "Navn Å–A"],
  "fi-FI": ["Bonuksen saatavuus", "Vierailun saatavuus", "Turvallisemman pelaamisen tiedot", "Mobiilituki", "Tuettu", "Tuloksia sivulla", "Nostot", "Osuvuus", "Uusimmat", "Nimi A–Ö", "Nimi Ö–A"],
  "nb-NO": ["Bonustilgjengelighet", "Besøkstilgjengelighet", "Informasjon om tryggere pengespill", "Mobilstøtte", "Støttet", "Resultater per side", "Fremhevet", "Relevans", "Nyeste", "Navn A–Å", "Navn Å–A"],
};

const draftBreadcrumbLabels: Record<keyof typeof compactTranslations, string> = {
  "it-IT": "Percorso di navigazione", "es-ES": "Ruta de navegación", "pt-PT": "Percurso de navegação",
  "el-GR": "Διαδρομή πλοήγησης", "nl-NL": "Broodkruimelnavigatie", "sv-SE": "Sökväg",
  "da-DK": "Brødkrummenavigation", "fi-FI": "Murupolku", "nb-NO": "Brødsmulenavigasjon",
};

type DraftLexicon = Readonly<{
  best: string; casinos: string; bonuses: string; review: string; unavailable: string; browse: string;
  terms: string; filters: string; current: string; published: string; record: string; records: string;
  result: string; results: string; action: string; methodology: string; help: string; source: string;
  payments: string; licence: string; wagering: string; deposit: string; payout: string; eligibility: string;
  expiry: string; score: string; previous: string; next: string; clear: string; close: string; remove: string;
  comparison: string; value: string; cost: string; questions: string; demo: string; affiliate: string;
}>;

const draftLexicons: Record<keyof typeof compactTranslations, DraftLexicon> = {
  "it-IT": {best:"Migliori offerte",casinos:"Casinò",bonuses:"Bonus",review:"Recensione",unavailable:"Non disponibile",browse:"Sfoglia le recensioni",terms:"Condizioni essenziali",filters:"Filtri",current:"Attuale",published:"Pubblicato",record:"voce",records:"voci",result:"risultato",results:"risultati",action:"Azione",methodology:"Metodologia",help:"Aiuto protetto",source:"Stato della fonte",payments:"Pagamenti",licence:"Licenza",wagering:"Requisito di puntata",deposit:"Deposito minimo",payout:"Prelievo",eligibility:"Idoneità",expiry:"Scadenza",score:"Valutazione editoriale",previous:"Precedente",next:"Successivo",clear:"Cancella tutto",close:"Chiudi",remove:"Rimuovi",comparison:"Confronto",value:"Valore",cost:"Costo",questions:"Domande",demo:"DATI DIMOSTRATIVI",affiliate:"Informativa affiliati"},
  "es-ES": {best:"Mejores ofertas",casinos:"Casinos",bonuses:"Bonos",review:"Reseña",unavailable:"No disponible",browse:"Ver reseñas",terms:"Condiciones esenciales",filters:"Filtros",current:"Actual",published:"Publicado",record:"registro",records:"registros",result:"resultado",results:"resultados",action:"Acción",methodology:"Metodología",help:"Ayuda protegida",source:"Estado de la fuente",payments:"Pagos",licence:"Licencia",wagering:"Requisito de apuesta",deposit:"Depósito mínimo",payout:"Retirada",eligibility:"Elegibilidad",expiry:"Caducidad",score:"Puntuación editorial",previous:"Anterior",next:"Siguiente",clear:"Borrar todo",close:"Cerrar",remove:"Eliminar",comparison:"Comparación",value:"Valor",cost:"Coste",questions:"Preguntas",demo:"DATOS DE DEMOSTRACIÓN",affiliate:"Información de afiliación"},
  "pt-PT": {best:"Melhores ofertas",casinos:"Casinos",bonuses:"Bónus",review:"Análise",unavailable:"Indisponível",browse:"Ver análises",terms:"Termos essenciais",filters:"Filtros",current:"Atual",published:"Publicado",record:"registo",records:"registos",result:"resultado",results:"resultados",action:"Ação",methodology:"Metodologia",help:"Ajuda protegida",source:"Estado da fonte",payments:"Pagamentos",licence:"Licença",wagering:"Requisito de apostas",deposit:"Depósito mínimo",payout:"Levantamento",eligibility:"Elegibilidade",expiry:"Validade",score:"Pontuação editorial",previous:"Anterior",next:"Seguinte",clear:"Limpar tudo",close:"Fechar",remove:"Remover",comparison:"Comparação",value:"Valor",cost:"Custo",questions:"Perguntas",demo:"DADOS DE DEMONSTRAÇÃO",affiliate:"Informação de afiliados"},
  "el-GR": {best:"Καλύτερες προσφορές",casinos:"Καζίνο",bonuses:"Μπόνους",review:"Αξιολόγηση",unavailable:"Μη διαθέσιμο",browse:"Περιήγηση στις αξιολογήσεις",terms:"Ουσιώδεις όροι",filters:"Φίλτρα",current:"Τρέχον",published:"Δημοσιευμένο",record:"εγγραφή",records:"εγγραφές",result:"αποτέλεσμα",results:"αποτελέσματα",action:"Ενέργεια",methodology:"Μεθοδολογία",help:"Προστατευμένη βοήθεια",source:"Κατάσταση πηγής",payments:"Πληρωμές",licence:"Άδεια",wagering:"Απαίτηση στοιχηματισμού",deposit:"Ελάχιστη κατάθεση",payout:"Ανάληψη",eligibility:"Επιλεξιμότητα",expiry:"Λήξη",score:"Συντακτική βαθμολογία",previous:"Προηγούμενο",next:"Επόμενο",clear:"Εκκαθάριση όλων",close:"Κλείσιμο",remove:"Αφαίρεση",comparison:"Σύγκριση",value:"Αξία",cost:"Κόστος",questions:"Ερωτήσεις",demo:"ΔΕΔΟΜΕΝΑ ΕΠΙΔΕΙΞΗΣ",affiliate:"Γνωστοποίηση συνεργατών"},
  "nl-NL": {best:"Beste aanbiedingen",casinos:"Casino's",bonuses:"Bonussen",review:"Review",unavailable:"Niet beschikbaar",browse:"Bekijk casinoreviews",terms:"Belangrijke voorwaarden",filters:"Filters",current:"Actueel",published:"Gepubliceerd",record:"vermelding",records:"vermeldingen",result:"resultaat",results:"resultaten",action:"Actie",methodology:"Methodologie",help:"Beschermde hulp",source:"Bronstatus",payments:"Betalingen",licence:"Vergunning",wagering:"Inzetvereiste",deposit:"Minimale storting",payout:"Uitbetaling",eligibility:"Geschiktheid",expiry:"Vervaldatum",score:"Redactionele score",previous:"Vorige",next:"Volgende",clear:"Alles wissen",close:"Sluiten",remove:"Verwijderen",comparison:"Vergelijking",value:"Waarde",cost:"Kosten",questions:"Vragen",demo:"DEMONSTRATIEGEGEVENS",affiliate:"Affiliateverklaring"},
  "sv-SE": {best:"Bästa erbjudanden",casinos:"Casinon",bonuses:"Bonusar",review:"Recension",unavailable:"Inte tillgänglig",browse:"Bläddra bland recensioner",terms:"Väsentliga villkor",filters:"Filter",current:"Aktuell",published:"Publicerad",record:"post",records:"poster",result:"resultat",results:"resultat",action:"Åtgärd",methodology:"Metod",help:"Skyddad hjälp",source:"Källstatus",payments:"Betalningar",licence:"Licens",wagering:"Omsättningskrav",deposit:"Minsta insättning",payout:"Utbetalning",eligibility:"Behörighet",expiry:"Utgång",score:"Redaktionellt betyg",previous:"Föregående",next:"Nästa",clear:"Rensa alla",close:"Stäng",remove:"Ta bort",comparison:"Jämförelse",value:"Värde",cost:"Kostnad",questions:"Frågor",demo:"DEMONSTRATIONSDATA",affiliate:"Affiliateinformation"},
  "da-DK": {best:"Bedste tilbud",casinos:"Kasinoer",bonuses:"Bonusser",review:"Anmeldelse",unavailable:"Ikke tilgængelig",browse:"Se kasinoanmeldelser",terms:"Væsentlige vilkår",filters:"Filtre",current:"Aktuel",published:"Offentliggjort",record:"post",records:"poster",result:"resultat",results:"resultater",action:"Handling",methodology:"Metode",help:"Beskyttet hjælp",source:"Kildestatus",payments:"Betalinger",licence:"Licens",wagering:"Omsætningskrav",deposit:"Minimumsindbetaling",payout:"Udbetaling",eligibility:"Berettigelse",expiry:"Udløb",score:"Redaktionel score",previous:"Forrige",next:"Næste",clear:"Ryd alle",close:"Luk",remove:"Fjern",comparison:"Sammenligning",value:"Værdi",cost:"Omkostning",questions:"Spørgsmål",demo:"DEMONSTRATIONSDATA",affiliate:"Affiliateoplysning"},
  "fi-FI": {best:"Parhaat tarjoukset",casinos:"Kasinot",bonuses:"Bonukset",review:"Arvio",unavailable:"Ei saatavilla",browse:"Selaa kasinoarvioita",terms:"Olennaiset ehdot",filters:"Suodattimet",current:"Ajantasainen",published:"Julkaistu",record:"tietue",records:"tietueet",result:"tulos",results:"tulokset",action:"Toiminto",methodology:"Menetelmä",help:"Suojattu apu",source:"Lähteen tila",payments:"Maksut",licence:"Lisenssi",wagering:"Kierrätysvaatimus",deposit:"Vähimmäistalletus",payout:"Kotiutus",eligibility:"Kelpoisuus",expiry:"Voimassaolo",score:"Toimituksellinen arvio",previous:"Edellinen",next:"Seuraava",clear:"Tyhjennä kaikki",close:"Sulje",remove:"Poista",comparison:"Vertailu",value:"Arvo",cost:"Kustannus",questions:"Kysymykset",demo:"ESITTELYTIEDOT",affiliate:"Kumppanuusilmoitus"},
  "nb-NO": {best:"Beste tilbud",casinos:"Kasinoer",bonuses:"Bonuser",review:"Anmeldelse",unavailable:"Ikke tilgjengelig",browse:"Se kasinoanmeldelser",terms:"Vesentlige vilkår",filters:"Filtre",current:"Aktuell",published:"Publisert",record:"oppføring",records:"oppføringer",result:"resultat",results:"resultater",action:"Handling",methodology:"Metode",help:"Beskyttet hjelp",source:"Kildestatus",payments:"Betalinger",licence:"Lisens",wagering:"Omsetningskrav",deposit:"Minsteinnskudd",payout:"Utbetaling",eligibility:"Kvalifisering",expiry:"Utløp",score:"Redaksjonell vurdering",previous:"Forrige",next:"Neste",clear:"Tøm alle",close:"Lukk",remove:"Fjern",comparison:"Sammenligning",value:"Verdi",cost:"Kostnad",questions:"Spørsmål",demo:"DEMONSTRASJONSDATA",affiliate:"Affiliateinformasjon"},
};

function localeVariant(locale: keyof typeof compactTranslations): ProductPageMessages {
  const copy = compactTranslations[locale];
  const n = draftLexicons[locale];
  const [countryPreference, bonusType, cryptoSupport, availability, sortResults, cryptoSupported, cryptoUnsupported] = draftFilterLabels[locale];
  const [bonusAvailability, visitAvailability, saferGamblingInformation, mobileSupport, supported, resultsPerPage, featured, relevance, newest, nameAscending, nameDescending] = draftCasinoControlLabels[locale];
  const state = `${n.unavailable}. ${copy[1]}`;
  const method = `${n.methodology}: ${n.terms}. ${copy[1]}`;
  return {
    common: {
      notListed:n.unavailable,current:n.current,published:n.published,classified:n.published,record:n.record,records:n.records,result:n.result,results:n.results,
      reviewOnly:`${n.review} · ${n.unavailable}`,actionAvailable:n.action,noGovernedVisit:n.unavailable,readReview:n.review,viewDemonstration:n.demo,browseReviews:n.browse,reviewMethodology:n.methodology,
      editorScore:n.score,wagering:n.wagering,minimumDeposit:n.deposit,maximumBonus:n.value,maximumBet:n.terms,payout:n.payout,eligibility:n.eligibility,expiry:n.expiry,paymentMethods:n.payments,licence:n.licence,
      activeFilters:n.filters,clearAll:n.clear,applyFilters:n.filters,filters:n.filters,previous:n.previous,next:n.next,pageOf:`{page} / {pages}`,demoData:n.demo,demoDisclosure:state,
      marketPresentationNotice:copy[1],reviewAvailableNoAction:state,affiliateDisclosure:n.affiliate,methodology:n.methodology,bonusGuide:n.bonuses,protectedHelp:n.help,allFilters:n.filters,directoryControls:n.filters,closeFilters:n.close,
      updatingResults:`${n.results} · ${n.current}`,sourceStatus:n.source,materialTerms:n.terms,commercialUnavailable:n.unavailable,originalSourceCopy:n.source,
      countryPreference,bonusType,cryptoSupport,availability,sortResults,cryptoSupported,cryptoUnsupported,
      bonusAvailability,visitAvailability,saferGamblingInformation,mobileSupport,supported,resultsPerPage,featured,relevance,newest,nameAscending,nameDescending,
      breadcrumb:draftBreadcrumbLabels[locale],
    },
    bestOffers: {
      title:`${n.best} — {market} | B4GAMBLE`,description:copy[0],unavailableTitle:`${n.best} · ${n.unavailable} | B4GAMBLE`,unavailableDescription:state,
      heroLead:n.best,heroEmphasis:n.terms,heroKicker:`${n.best} · {market}`,heroCopy:copy[0],eligibleRecords:n.records,currentMarket:n.current,inferredActions:n.action,rankingLink:`${n.methodology} →`,
      sectionTitle:`${n.best} · ${n.terms}`,commissionNote:n.affiliate,emptyTitle:copy[2],emptyCopy:copy[1],unavailableTitleBody:n.unavailable,unavailableCopy:state,whyTitle:n.methodology,whyCopy:method,beforeClick:n.terms,
      faqWageringQuestion:`${n.questions}: ${n.wagering}`,faqWageringAnswer:method,faqCommissionQuestion:`${n.questions}: ${n.affiliate}`,faqCommissionAnswer:n.affiliate,faqWhyThreeQuestion:`${n.questions}: ${n.best}`,faqWhyThreeAnswer:copy[0],
    },
    casinos: {
      title:`${n.casinos} — {market} | B4GAMBLE`,description:copy[0],demoTitle:`${n.casinos} · ${n.demo} | B4GAMBLE`,demoDescription:state,heroKicker:`${n.casinos} · {market}`,heroLead:n.casinos,heroEmphasis:n.review,heroCopy:copy[0],
      proofEvidence:n.source,proofLimit:n.records,proofPublished:n.published,directoryTitle:n.casinos,noMatchesTitle:copy[3],noMatchesCopy:copy[1],noPublishedTitle:copy[3],reviewOnlyNotice:state,faqTitle:n.questions,
      faqDifferenceQuestion:`${n.questions}: ${n.comparison}`,faqDifferenceAnswer:copy[0],faqReviewOnlyQuestion:`${n.questions}: ${n.review}`,faqReviewOnlyAnswer:state,faqCommissionQuestion:`${n.questions}: ${n.affiliate}`,faqCommissionAnswer:n.affiliate,
    },
    bonuses: {
      title:`${n.bonuses} — {market} | B4GAMBLE`,description:copy[0],demoTitle:`${n.bonuses} · ${n.demo} | B4GAMBLE`,demoDescription:state,heroKicker:`${n.bonuses} · ${n.terms} · 18+`,heroLead:n.value,heroEmphasis:n.terms,heroCopy:copy[0],
      proofTerms:n.terms,proofClaims:n.source,proofSources:n.source,directoryTitle:n.bonuses,sortedByValue:n.value,noMatchesTitle:copy[4],noMatchesCopy:copy[1],unavailableTitleBody:n.unavailable,unavailableCopy:state,
      methodKicker:n.methodology,methodLead:n.terms,methodEmphasis:n.value,methodCopy:method,guideAction:`${n.bonuses} →`,disclosureTitle:n.affiliate,disclosureCopy:copy[1],disclosureAction:`${n.affiliate} →`,
    },
    profile: {
      unavailableTitle:`${n.review} · ${n.unavailable} | B4GAMBLE`,unavailableDescription:state,review:n.review,operatorReview:n.review,verdict:n.score,offerUnavailable:n.unavailable,currentReview:n.current,publishedReview:n.published,demoReview:n.demo,demoDisclosure:state,
      marketUnavailable:copy[5],marketUnavailableCopy:copy[1],overview:n.review,offerEvidence:n.source,questions:n.questions,quickCheck:n.review,quickCheckCopy:n.source,bestFor:n.best,whyWeLikeIt:n.score,thingsToKnow:n.terms,founded:n.current,games:n.records,
      offerTerms:n.terms,evidencePaymentsTools:n.source,licenceRecord:n.licence,paymentRecords:n.payments,providers:n.source,controlTools:n.help,keepInView:n.terms,scoreExplanation:n.score,relatedTitle:n.comparison,relatedCopy:copy[0],compareBonusTerms:n.terms,exploreBonusInformation:n.bonuses,originalEditorialNotice:n.source,
    },
    comparison: {trayLabel:n.comparison,selectedOfThree:`{count} / 3`,chooseOneMore:n.next,ready:n.current,add:n.comparison,open:n.comparison,clear:n.clear,title:n.comparison,subtitle:n.source,close:n.close,loading:`${n.comparison} · ${n.current}`,unavailable:n.unavailable,fullReview:n.review,remove:n.remove,topScore:n.score,evidenceUnavailable:state,footer:copy[1]},
    outbound: {affiliateNote:n.affiliate,label:n.action,title:`B4GAMBLE · ${n.action}`,description:copy[1],contractLabel:n.terms,contractCopy:n.source,riskCopy:copy[1],continueAction:`${n.action} →`,cancelAction:n.close,disclosureAction:n.affiliate},
    calculator: {kicker:`${n.bonuses} · ${n.cost}`,titleLead:n.value,titleEmphasis:n.cost,copy:method,amount:n.bonuses,multiplier:n.wagering,appliesTo:n.terms,bonusOnly:n.bonuses,depositAndBonus:`${n.deposit} + ${n.bonuses}`,gameWeight:n.value,conversion:n.value,requiredTurnover:n.wagering,effectiveTurnover:n.wagering,expectedCost:n.cost,expectedValue:n.value,negative:n.cost,positive:n.value,caveat:copy[1]},
  };
}

const catalog: Record<SupportedLocale, ProductPageMessages> = {
  "en-GB": en,
  "de-DE": de,
  "it-IT": localeVariant("it-IT"),
  "es-ES": localeVariant("es-ES"),
  "pt-PT": localeVariant("pt-PT"),
  "el-GR": localeVariant("el-GR"),
  "nl-NL": localeVariant("nl-NL"),
  "sv-SE": localeVariant("sv-SE"),
  "da-DK": localeVariant("da-DK"),
  "fi-FI": localeVariant("fi-FI"),
  "nb-NO": localeVariant("nb-NO"),
  "en-CA": en,
  "fr-CA": en,
};

export function productPageMessages(locale: SupportedLocale) {
  return catalog[locale];
}

export function formatProductMessage(template: string, values: Record<string, string | number>) {
  return template.replace(/\{([a-z]+)\}/gi, (match, key: string) => key in values ? String(values[key]) : match);
}
