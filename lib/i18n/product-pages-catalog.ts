import type { SupportedLocale } from "@/lib/market/registry";
import { FI_PRODUCT_PAGE_MESSAGES } from "@/lib/i18n/draft-product-pages/fi-FI";
import { IT_PRODUCT_PAGE_MESSAGES } from "@/lib/i18n/draft-product-pages/it-IT";
import { NB_PRODUCT_PAGE_MESSAGES } from "@/lib/i18n/draft-product-pages/nb-NO";
import { NL_PRODUCT_PAGE_MESSAGES } from "@/lib/i18n/draft-product-pages/nl-NL";
import { PT_PRODUCT_PAGE_MESSAGES } from "@/lib/i18n/draft-product-pages/pt-PT";

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
    updatingResults: string; sourceStatus: string; controlledMedia: string; mediaUnavailableTitle: string; mediaUnavailableCopy: string;
    materialTerms: string; materialOfferTerms: string; commercialUnavailable: string;
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
    unavailableTitleBody: string; unavailableCopy: string; worthALookTitle: string; whyTitle: string; whyCopy: string; finalKicker: string;
    demoKicker: string; demoCopy: string; fictionalRecords: string; liveOffers: string; claimActions: string;
    fictionalRecordsOnly: string; termsBeforeAction: string; availabilityFailsClosed: string;
    beforeClick: string; faqWageringQuestion: string; faqWageringAnswer: string;
    faqCommissionQuestion: string; faqCommissionAnswer: string; faqWhyThreeQuestion: string; faqWhyThreeAnswer: string;
  }>;
  casinos: Readonly<{
    title: string; description: string; demoTitle: string; demoDescription: string;
    heroKicker: string; heroLead: string; heroEmphasis: string; heroCopy: string;
    proofEvidence: string; proofLimit: string; proofPublished: string; directoryTitle: string; filterTitle: string;
    bestOverall: string; crypto: string; mobile: string; bestBonuses: string; newCasinos: string;
    noMatchesTitle: string; noMatchesCopy: string; noPublishedTitle: string; reviewOnlyNotice: string;
    faqTitle: string; faqDifferenceQuestion: string; faqDifferenceAnswer: string;
    faqReviewOnlyQuestion: string; faqReviewOnlyAnswer: string; faqCommissionQuestion: string; faqCommissionAnswer: string;
  }>;
  bonuses: Readonly<{
    title: string; description: string; demoTitle: string; demoDescription: string;
    heroKicker: string; heroLead: string; heroEmphasis: string; heroCopy: string;
    proofTerms: string; proofClaims: string; proofSources: string; directoryTitle: string; filterTitle: string; sortedByValue: string;
    noMatchesTitle: string; noMatchesCopy: string; unavailableTitleBody: string; unavailableCopy: string;
    featuredFilter: string; featuredTrue: string; featuredFalse: string;
    recommendedFilter: string; recommendedTrue: string; recommendedFalse: string;
    methodKicker: string; methodLead: string; methodEmphasis: string; methodCopy: string; guideAction: string;
    disclosureTitle: string; disclosureCopy: string; disclosureAction: string;
    selectorBestOverall: string; selectorLowWagering: string; selectorLowDeposit: string; selectorCrypto: string; selectorNewest: string;
  }>;
  profile: Readonly<{
    unavailableTitle: string; unavailableDescription: string; review: string; operatorReview: string;
    verdict: string; offerUnavailable: string; currentReview: string; publishedReview: string;
    demoReview: string; demoDisclosure: string; marketUnavailable: string; marketUnavailableCopy: string;
    overview: string; offerEvidence: string; questions: string; quickCheck: string; quickCheckCopy: string;
    bestFor: string; whyWeLikeIt: string; thingsToKnow: string; founded: string; games: string;
    offerTerms: string; evidencePaymentsTools: string; licenceRecord: string; paymentRecords: string;
    providers: string; controlTools: string; keepInView: string; scoreExplanation: string;
    demoAgeField: string; demoLicenceField: string; demoPaymentFields: string; demoWithdrawalField: string;
    demoOfferField: string; demoTerms: string; demoFinalFields: string;
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
    slots: string; tableGames: string; roulette: string; blackjack: string;
    requiredTurnover: string; effectiveTurnover: string; expectedCost: string; expectedValue: string;
    negative: string; positive: string; caveat: string;
  }>;
}>;

const en: ProductPageMessages = {
  common: {
    notListed: "Not listed", current: "Current", published: "Published", classified: "classified", record: "record", records: "records",
    result: "result", results: "results", reviewOnly: "Review only", actionAvailable: "Partner link available", noGovernedVisit: "No partner link available",
    readReview: "Read review", viewDemonstration: "View demonstration", browseReviews: "Browse casino reviews", reviewMethodology: "Review methodology",
    editorScore: "Editor Score", wagering: "Wagering", minimumDeposit: "Minimum deposit", maximumBonus: "Maximum bonus", maximumBet: "Maximum bet",
    payout: "Payout", eligibility: "Eligibility", expiry: "Expiry", paymentMethods: "Payments", licence: "Licence",
    activeFilters: "Active filters", clearAll: "Clear all", applyFilters: "Apply filters", filters: "Filters", previous: "Previous", next: "Next",
    pageOf: "Page {page} of {pages}", demoData: "DEMONSTRATION DATA", demoDisclosure: "Fictional product records are not current operators, partner offers or live promotions. No gambling or affiliate destination is available.",
    marketPresentationNotice: "The selected market changes editorial presentation only. It does not prove location, eligibility or commercial availability.",
    reviewAvailableNoAction: "The review remains available, but no partner link is.", affiliateDisclosure: "Affiliate disclosure", methodology: "Methodology", bonusGuide: "Bonus guide",
    protectedHelp: "Open protected Help", allFilters: "All filters", directoryControls: "Directory controls", closeFilters: "Close filters", updatingResults: "Updating results…",
    sourceStatus: "Source status", controlledMedia: "Controlled media", mediaUnavailableTitle: "Suitable artwork unavailable", mediaUnavailableCopy: "The review and terms remain available without unsuitable or unverified artwork.", materialTerms: "Material terms", materialOfferTerms: "material offer terms", commercialUnavailable: "No partner link available", originalSourceCopy: "Source-controlled facts remain in their published language.",
    countryPreference: "Country preference", bonusType: "Bonus type", cryptoSupport: "Crypto support", availability: "Availability", sortResults: "Sort results",
    cryptoSupported: "Crypto supported", cryptoUnsupported: "No crypto support",
    bonusAvailability: "Bonus availability", visitAvailability: "Visit availability", saferGamblingInformation: "Safer-gambling information", mobileSupport: "Mobile support",
    supported: "Supported", resultsPerPage: "Results per page", featured: "Featured", relevance: "Relevance", newest: "Newest", nameAscending: "Name A–Z", nameDescending: "Name Z–A",
    breadcrumb: "Breadcrumb",
  },
  bestOffers: {
    title: "Casino offer comparison for {market} | B4GAMBLE", description: "An editorial shortlist for {market}, with material terms and commercial availability shown before action.",
    unavailableTitle: "Casino offer comparison unavailable | B4GAMBLE", unavailableDescription: "The published offer comparison for {market} is temporarily unavailable. We won't show another list unless its current details can be checked.",
    heroLead: "Three picks.", heroEmphasis: "Not thirty.", heroKicker: "Current editorial shortlist for {market}", heroCopy: "Published records are filtered for {market}. Partner links appear only when they are available for this visit.",
    eligibleRecords: "eligible records", currentMarket: "editorial market", inferredActions: "partner links", rankingLink: "How ranking works →",
    sectionTitle: "The top three — material terms shown first", commissionNote: "Affiliate compensation does not determine Editor Score or natural editorial ranking.",
    emptyTitle: "No eligible records for {market}.", emptyCopy: "B4GAMBLE does not substitute a GB shortlist or relax the method to fill this market page.",
    unavailableTitleBody: "The comparison could not be loaded.", unavailableCopy: "We won't show another result unless its current details can be checked.",
    demoKicker: "Fictional product demonstration", demoCopy: "Fictional records demonstrate ranking and material-term presentation. No current promotion, partner relationship, real-money test or claim action is represented.",
    fictionalRecords: "fictional records", liveOffers: "live offers", claimActions: "offer links", fictionalRecordsOnly: "Fictional records only", termsBeforeAction: "Material terms shown before action", availabilityFailsClosed: "No partner links available",
    worthALookTitle: "Worth a look — just outside the top three", whyTitle: "Why these records are shown", whyCopy: "Market availability, complete material terms and source status are checked before ranking. Commercial availability is checked separately.", finalKicker: "Still here? The answer hasn't changed.",
    beforeClick: "Before you click", faqWageringQuestion: "What does wagering mean?", faqWageringAnswer: "It is the turnover required by the published terms before bonus winnings can be withdrawn.",
    faqCommissionQuestion: "Do you earn money if I sign up?", faqCommissionAnswer: "An eligible labelled affiliate link may earn commission. Compensation does not determine the editorial score or natural ranking.",
    faqWhyThreeQuestion: "Why only three offers?", faqWhyThreeAnswer: "A short list keeps the decision bounded; the Bonuses page provides the full eligible directory.",
  },
  casinos: {
    title: "Casino reviews for {market} | B4GAMBLE", description: "Search and compare published casino reviews filtered for the {market} editorial context.", demoTitle: "Casino review demonstration | B4GAMBLE", demoDescription: "Clearly labelled fictional records show the review format without a live promotion or affiliate action.",
    heroKicker: "Curated for {market}", heroLead: "Picked for", heroEmphasis: "how you play.", heroCopy: "Choose your use-case; the directory shows published records for the selected editorial market without implying commercial eligibility.",
    proofEvidence: "Evidence and limitations disclosed", proofLimit: "Maximum three per use-case", proofPublished: "Current published data only", directoryTitle: "Full directory", filterTitle: "Filter Casinos",
    bestOverall: "Best Overall", crypto: "Crypto", mobile: "Mobile", bestBonuses: "Best Bonuses", newCasinos: "New Casinos",
    noMatchesTitle: "No published reviews match this market and these controls.", noMatchesCopy: "Remove a filter or change presentation. B4GAMBLE will not fill the gap with ineligible operators.",
    noPublishedTitle: "No published reviews for {market} yet.", reviewOnlyNotice: "Reviews remain available. Partner links appear only when the market, offer and destination are available.",
    faqTitle: "Before you choose", faqDifferenceQuestion: "How is this different from Best Offers?", faqDifferenceAnswer: "Best Offers is a bounded shortlist. This directory keeps every eligible published review available for comparison.",
    faqReviewOnlyQuestion: "What does review only mean?", faqReviewOnlyAnswer: "The editorial review is available, but there is currently no partner link.",
    faqCommissionQuestion: "Does commission affect ranking?", faqCommissionAnswer: "No. Affiliate compensation does not determine Editor Score or natural editorial ranking.",
  },
  bonuses: {
    title: "Casino bonus comparison for {market} | B4GAMBLE", description: "Compare published bonus terms filtered for the {market} editorial context, without assuming commercial availability.", demoTitle: "Casino bonus demonstration | B4GAMBLE", demoDescription: "Clearly labelled fictional records show how terms are compared. They are not current promotions or partner offers.",
    heroKicker: "Bonuses · Terms first · 18+", heroLead: "Value, measured", heroEmphasis: "by terms.", heroCopy: "Headline size means little after wagering. Compare deposits, turnover, restrictions and expiry before any action.",
    proofTerms: "Material terms shown first", proofClaims: "No guaranteed-money claims", proofSources: "Source status stays visible", directoryTitle: "All bonuses", filterTitle: "Filter Bonuses", sortedByValue: "sorted by net value",
    noMatchesTitle: "No comparison records match {market} and these filters.", noMatchesCopy: "Remove a filter or change presentation. No ineligible offer is substituted.",
    unavailableTitleBody: "The published directory could not be loaded.", unavailableCopy: "We won't show another offer unless its current details can be checked.",
    featuredFilter: "Editorial feature status", featuredTrue: "Editorially featured", featuredFalse: "Not editorially featured",
    recommendedFilter: "Editorial recommendation status", recommendedTrue: "Editorially recommended", recommendedFalse: "Not editorially recommended",
    methodKicker: "How we evaluate bonus terms", methodLead: "The fine print is", methodEmphasis: "the product.", methodCopy: "Wagering, weighting, deposit floors and expiry decide what a bonus can actually require.", guideAction: "Read the Bonus Guide →",
    disclosureTitle: "18+ · Commercial disclosure", disclosureCopy: "B4GAMBLE may receive compensation from future eligible governed links. Compensation does not determine Editor Score or natural ranking. Verify current operator terms and local law before acting.", disclosureAction: "Read disclosure →",
    selectorBestOverall: "Best Overall", selectorLowWagering: "Low Wagering", selectorLowDeposit: "Low Deposit", selectorCrypto: "Crypto", selectorNewest: "Newest",
  },
  profile: {
    unavailableTitle: "Casino profile unavailable | B4GAMBLE", unavailableDescription: "This casino profile is not published or is unavailable.", review: "review", operatorReview: "Operator review", verdict: "Our verdict:", offerUnavailable: "Offer unavailable",
    currentReview: "Current review", publishedReview: "Published review", demoReview: "Fictional review demonstration", demoDisclosure: "Fictional review fields; no current operator, licence, partner offer or commercial visit.",
    marketUnavailable: "Review only for {market}", marketUnavailableCopy: "This profile does not publish availability for the selected presentation market. No eligibility is inferred and commercial action is unavailable.",
    overview: "Overview", offerEvidence: "Offer & evidence", questions: "FAQ", quickCheck: "The 30-second check", quickCheckCopy: "Key published fields before the details",
    bestFor: "Best for", whyWeLikeIt: "Why we like it", thingsToKnow: "Things to know", founded: "Founded", games: "Games", offerTerms: "Offer & terms",
    evidencePaymentsTools: "Evidence, payments & control tools", licenceRecord: "Licence record", paymentRecords: "Payment records", providers: "Providers", controlTools: "Control tools",
    demoAgeField: "FICTIONAL 18+ FIELD", demoLicenceField: "FICTIONAL LICENCE FIELD", demoPaymentFields: "FICTIONAL PAYMENT FIELDS", demoWithdrawalField: "FICTIONAL WITHDRAWAL FIELD",
    demoOfferField: "FICTIONAL OFFER FIELD", demoTerms: "FICTIONAL DEMONSTRATION TERMS", demoFinalFields: "FICTIONAL DEMONSTRATION FIELDS",
    keepInView: "Keep in view", scoreExplanation: "Editorial judgement, not a weighted formula", relatedTitle: "Keep comparing", relatedCopy: "Use the same evidence across every review.",
    compareBonusTerms: "Compare published bonus terms", exploreBonusInformation: "Explore bonus information", originalEditorialNotice: "The editorial review body is source-controlled and is shown in its published language.",
  },
  comparison: {
    trayLabel: "Casino comparison tray", selectedOfThree: "{count} of 3 selected", chooseOneMore: "Choose one more to compare", ready: "Your comparison is ready", add: "Compare", open: "Open comparison", clear: "Clear",
    title: "Side by side", subtitle: "The same evidence fields for every casino", close: "Close comparison", loading: "Building the comparison…", unavailable: "The selected public comparison is unavailable. We haven't shown an unchecked replacement.",
    fullReview: "Full review", remove: "Remove", topScore: "Top score", evidenceUnavailable: "Published comparison evidence is unavailable.", footer: "18+ · Availability is never assumed · Scores are editorial. Country is a comparison preference, not proof of eligibility.",
  },
  outbound: {
    affiliateNote: "Affiliate link · We may earn commission.", label: "02 / Leaving B4GAMBLE", title: "You are leaving B4GAMBLE.",
    description: "You are about to visit a third-party gambling operator. If you continue through an affiliate link, B4GAMBLE may earn commission. This does not affect the editorial score or ranking.",
    contractLabel: "Destination check", contractCopy: "B4GAMBLE checks the destination link before you leave the site.", riskCopy: "18+ · Eligibility and operator terms apply · Gambling involves financial risk",
    continueAction: "Continue to operator →", cancelAction: "Cancel and stay on B4GAMBLE", disclosureAction: "Review affiliate disclosure",
  },
  calculator: {
    kicker: "What a bonus really costs", titleLead: "Run the numbers", titleEmphasis: "before you claim.", copy: "Enter the advertised figures to see required turnover and an illustrative expected clearing cost.",
    amount: "Bonus amount", multiplier: "Wagering multiplier", appliesTo: "Wagering applies to", bonusOnly: "Bonus only", depositAndBonus: "Deposit + bonus", gameWeight: "Your game counts at", conversion: "The conversion",
    slots: "Slots", tableGames: "Table", roulette: "Roulette", blackjack: "Blackjack",
    requiredTurnover: "Required turnover", effectiveTurnover: "Effective turnover at this weighting", expectedCost: "Illustrative expected clearing cost", expectedValue: "Illustrative expected net value",
    negative: "On these inputs, the expected clearing cost is greater than the bonus value.", positive: "On these inputs, the headline bonus is greater than the illustrative expected clearing cost.", caveat: "Statistical illustration, not a prediction. Variance is large and actual terms control.",
  },
};

function translated(overrides: ProductPageMessages): ProductPageMessages { return overrides; }

const de = translated({
  common: { notListed:"Nicht angegeben",current:"Aktuell",published:"Veröffentlicht",classified:"klassifiziert",record:"Eintrag",records:"Einträge",result:"Ergebnis",results:"Ergebnisse",reviewOnly:"Nur Bewertung",actionAvailable:"Aktion verfügbar",noGovernedVisit:"Kein freigegebener Besuch",readReview:"Bewertung lesen",viewDemonstration:"Demonstration ansehen",browseReviews:"Anbieterbewertungen durchsuchen",reviewMethodology:"Methodik ansehen",editorScore:"Editor Score",wagering:"Umsatzbedingung",minimumDeposit:"Mindesteinzahlung",maximumBonus:"Maximaler Bonus",maximumBet:"Maximaler Einsatz",payout:"Auszahlung",eligibility:"Teilnahmebedingungen",expiry:"Ablauf",paymentMethods:"Zahlungen",licence:"Lizenz",activeFilters:"Aktive Filter",clearAll:"Alle löschen",applyFilters:"Filter anwenden",filters:"Filter",previous:"Zurück",next:"Weiter",pageOf:"Seite {page} von {pages}",demoData:"DEMONSTRATIONSDATEN",demoDisclosure:"Fiktive Produktdaten sind keine aktuellen Anbieter, Partnerangebote oder Live-Aktionen. Es gibt kein Glücksspiel- oder Affiliate-Ziel.",marketPresentationNotice:"Der gewählte Markt ändert nur den redaktionellen Kontext. Er beweist weder Standort noch Berechtigung oder kommerzielle Verfügbarkeit.",reviewAvailableNoAction:"Die Bewertung bleibt verfügbar, während die kommerzielle Aktion nicht verfügbar ist.",affiliateDisclosure:"Affiliate-Hinweis",methodology:"Methodik",bonusGuide:"Bonus-Leitfaden",protectedHelp:"Geschützte Hilfe öffnen",allFilters:"Alle Filter",directoryControls:"Verzeichnisfilter",closeFilters:"Filter schließen",updatingResults:"Ergebnisse werden aktualisiert…",sourceStatus:"Quellenstatus",controlledMedia:"Geprüftes Bildmaterial",mediaUnavailableTitle:"Passendes Bildmaterial nicht verfügbar",mediaUnavailableCopy:"Bewertung und Bedingungen bleiben verfügbar, ohne ungeeignetes oder ungeprüftes Bildmaterial zu zeigen.",materialTerms:"Wesentliche Bedingungen",materialOfferTerms:"wesentliche Angebotsbedingungen",commercialUnavailable:"Kommerzielle Aktion nicht verfügbar",originalSourceCopy:"Quellengesteuerte Fakten bleiben in ihrer veröffentlichten Sprache.",countryPreference:"Länderpräferenz",bonusType:"Bonusart",cryptoSupport:"Krypto-Unterstützung",availability:"Verfügbarkeit",sortResults:"Ergebnisse sortieren",cryptoSupported:"Krypto unterstützt",cryptoUnsupported:"Keine Krypto-Unterstützung",bonusAvailability:"Bonusverfügbarkeit",visitAvailability:"Besuchsverfügbarkeit",saferGamblingInformation:"Informationen zu sichererem Glücksspiel",mobileSupport:"Mobilgeräte-Unterstützung",supported:"Unterstützt",resultsPerPage:"Ergebnisse pro Seite",featured:"Empfohlen",relevance:"Relevanz",newest:"Neueste",nameAscending:"Name A–Z",nameDescending:"Name Z–A",breadcrumb:"Brotkrümelnavigation" },
  bestOffers:{title:"Angebotsvergleich für Glücksspielanbieter in {market} | B4GAMBLE",description:"Eine redaktionelle Auswahlliste für {market}, mit wesentlichen Bedingungen und Verfügbarkeit vor jeder Aktion.",unavailableTitle:"Angebotsvergleich für Glücksspielanbieter nicht verfügbar | B4GAMBLE",unavailableDescription:"Der veröffentlichte Angebotsvergleich für {market} ist vorübergehend nicht verfügbar. Es wird kein erfundener Ersatz angezeigt.",heroLead:"Drei Empfehlungen.",heroEmphasis:"Nicht dreißig.",heroKicker:"Aktuelle redaktionelle Auswahl für {market}",heroCopy:"Veröffentlichte Einträge werden für {market} gefiltert. Kommerzielle Aktionen benötigen weiterhin eine separate Anfrage-Autorität.",eligibleRecords:"geeignete Einträge",currentMarket:"redaktioneller Markt",inferredActions:"abgeleitete Aktionen",rankingLink:"So funktioniert das Ranking →",sectionTitle:"Die besten drei — wesentliche Bedingungen zuerst",commissionNote:"Wir können über einen berechtigten gekennzeichneten Link Provision erhalten. Die Vergütung bestimmt weder Editor Score noch natürliche Rangfolge.",emptyTitle:"Keine geeigneten Einträge für {market}.",emptyCopy:"B4GAMBLE ersetzt dies nicht durch eine GB-Liste und lockert die Methode nicht.",unavailableTitleBody:"Der Vergleich konnte nicht geladen werden.",unavailableCopy:"Es wird kein zwischengespeichertes, altes oder erfundenes kommerzielles Ergebnis eingesetzt.",demoKicker:"Fiktive Produktdemonstration",demoCopy:"Fiktive Einträge zeigen Ranking und wesentliche Bedingungen. Sie sind keine aktuelle Aktion, Partnerschaft, Echtgeldprüfung oder beanspruchbare Aktion.",fictionalRecords:"fiktive Einträge",liveOffers:"Live-Angebote",claimActions:"Beanspruchungsaktionen",fictionalRecordsOnly:"Nur fiktive Einträge",termsBeforeAction:"Wesentliche Bedingungen vor jeder Aktion",availabilityFailsClosed:"Verfügbarkeit bleibt geschlossen",worthALookTitle:"Einen Blick wert — knapp außerhalb der besten drei",whyTitle:"Warum diese Einträge erscheinen",whyCopy:"Marktverfügbarkeit, vollständige Bedingungen und Quellenstatus werden vor dem Ranking geprüft. Kommerzielle Verfügbarkeit wird getrennt geprüft.",finalKicker:"Noch hier? Die Antwort hat sich nicht geändert.",beforeClick:"Vor dem Klick",faqWageringQuestion:"Was bedeutet die Umsatzbedingung?",faqWageringAnswer:"Sie bezeichnet den laut veröffentlichten Bedingungen erforderlichen Umsatz vor einer Auszahlung.",faqCommissionQuestion:"Verdient ihr bei meiner Anmeldung?",faqCommissionAnswer:"Ein berechtigter gekennzeichneter Affiliate-Link kann Provision bringen. Sie beeinflusst die redaktionelle Bewertung nicht.",faqWhyThreeQuestion:"Warum nur drei Angebote?",faqWhyThreeAnswer:"Eine kurze Liste hält die Entscheidung überschaubar; die Bonusseite zeigt das vollständige geeignete Verzeichnis."},
  casinos:{title:"Anbieterbewertungen für {market} | B4GAMBLE",description:"Veröffentlichte Bewertungen von Glücksspielanbietern im redaktionellen Kontext von {market} suchen und vergleichen.",demoTitle:"Demonstration von Anbieterbewertungen | B4GAMBLE",demoDescription:"Klar gekennzeichnete fiktive Einträge zeigen das Format ohne Live-Aktion.",heroKicker:"Für {market} kuratiert",heroLead:"Kenne den Anbieter",heroEmphasis:"vor dem Angebot.",heroCopy:"Vergleiche Marktverfügbarkeit, Lizenzangaben, Zahlungen, Kontrollen und wesentliche Bedingungen.",proofEvidence:"Evidenz und Grenzen offengelegt",proofLimit:"Höchstens drei pro Anwendungsfall",proofPublished:"Nur aktuelle veröffentlichte Daten",directoryTitle:"Gesamtes Verzeichnis",filterTitle:"Anbieter filtern",bestOverall:"Insgesamt am besten",crypto:"Krypto",mobile:"Mobil",bestBonuses:"Beste Boni",newCasinos:"Neue Anbieter",noMatchesTitle:"Keine veröffentlichte Bewertung passt zu diesem Markt und den Filtern.",noMatchesCopy:"Entferne einen Filter oder ändere die Darstellung. B4GAMBLE ergänzt keine ungeeigneten Anbieter.",noPublishedTitle:"Noch keine veröffentlichten Bewertungen für {market}.",reviewOnlyNotice:"Bewertungen bleiben verfügbar. Kommerzielle Aktionen bleiben verborgen, bis Markt-, Angebot- und Weiterleitungsautorität bestehen.",faqTitle:"Vor deiner Auswahl",faqDifferenceQuestion:"Wie unterscheidet sich dies von Beste Angebote?",faqDifferenceAnswer:"Beste Angebote ist eine begrenzte Auswahl. Dieses Verzeichnis hält alle geeigneten veröffentlichten Bewertungen vergleichbar.",faqReviewOnlyQuestion:"Was bedeutet Nur Bewertung?",faqReviewOnlyAnswer:"Die redaktionelle Bewertung ist verfügbar, aber für diese Anfrage gibt es keinen freigegebenen Anmeldeweg.",faqCommissionQuestion:"Beeinflusst Provision das Ranking?",faqCommissionAnswer:"Nein. Affiliate-Vergütung bestimmt weder Editor Score noch natürliche redaktionelle Rangfolge."},
  bonuses:{title:"Bonusvergleich für Glücksspielanbieter in {market} | B4GAMBLE",description:"Veröffentlichte Bonusbedingungen für {market} vergleichen, ohne kommerzielle Verfügbarkeit anzunehmen.",demoTitle:"Bonusdemonstration für Glücksspielanbieter | B4GAMBLE",demoDescription:"Fiktive Einträge zeigen den Vergleich. Sie sind keine aktuellen Aktionen.",heroKicker:"Boni · Bedingungen zuerst · 18+",heroLead:"Wert, gemessen",heroEmphasis:"an Bedingungen.",heroCopy:"Große Zahlen sagen nach Umsatzbedingungen wenig. Vergleiche Einzahlung, Umsatz, Einschränkungen und Ablauf.",proofTerms:"Wesentliche Bedingungen zuerst",proofClaims:"Keine Garantieversprechen",proofSources:"Quellenstatus sichtbar",directoryTitle:"Alle Boni",filterTitle:"Boni filtern",sortedByValue:"nach Nettowert sortiert",noMatchesTitle:"Keine Vergleichseinträge passen zu {market} und diesen Filtern.",noMatchesCopy:"Entferne einen Filter oder ändere die Darstellung. Kein ungeeignetes Angebot wird eingesetzt.",unavailableTitleBody:"Das veröffentlichte Verzeichnis konnte nicht geladen werden.",unavailableCopy:"Es wird kein zwischengespeichertes oder erfundenes Angebot eingesetzt.",featuredFilter:"Status der redaktionellen Hervorhebung",featuredTrue:"Redaktionell hervorgehoben",featuredFalse:"Nicht redaktionell hervorgehoben",recommendedFilter:"Status der redaktionellen Empfehlung",recommendedTrue:"Redaktionell empfohlen",recommendedFalse:"Nicht redaktionell empfohlen",methodKicker:"So bewerten wir Bonusbedingungen",methodLead:"Das Kleingedruckte ist",methodEmphasis:"das Produkt.",methodCopy:"Umsatz, Gewichtung, Einzahlung und Ablauf bestimmen die tatsächlichen Anforderungen.",guideAction:"Bonus-Leitfaden lesen →",disclosureTitle:"18+ · Kommerzieller Hinweis",disclosureCopy:"B4GAMBLE kann über künftig berechtigte Links Vergütung erhalten. Sie bestimmt weder Editor Score noch Rangfolge. Prüfe aktuelle Bedingungen und lokales Recht.",disclosureAction:"Hinweis lesen →",selectorBestOverall:"Insgesamt am besten",selectorLowWagering:"Niedrige Umsatzbedingung",selectorLowDeposit:"Niedrige Einzahlung",selectorCrypto:"Krypto",selectorNewest:"Neueste"},
  profile:{unavailableTitle:"Anbieterprofil nicht verfügbar | B4GAMBLE",unavailableDescription:"Dieses Anbieterprofil ist nicht veröffentlicht oder nicht verfügbar.",review:"Bewertung",operatorReview:"Anbieterbewertung",verdict:"Unser Urteil:",offerUnavailable:"Angebot nicht verfügbar",currentReview:"Aktuelle Bewertung",publishedReview:"Veröffentlichte Bewertung",demoReview:"Fiktive Bewertungsdemonstration",demoDisclosure:"Fiktive Bewertungsfelder; kein aktueller Anbieter, keine Lizenzbehauptung, kein Partnerangebot und kein kommerzieller Besuch.",marketUnavailable:"Nur Bewertung für {market}",marketUnavailableCopy:"Dieses Profil veröffentlicht keine Verfügbarkeit für den gewählten Darstellungsmarkt. Es wird keine Berechtigung abgeleitet und keine kommerzielle Aktion angeboten.",overview:"Überblick",offerEvidence:"Angebot & Evidenz",questions:"FAQ",quickCheck:"Der 30-Sekunden-Check",quickCheckCopy:"Wichtige veröffentlichte Felder vor den Details",bestFor:"Geeignet für",whyWeLikeIt:"Warum es auffällt",thingsToKnow:"Wissenswert",founded:"Gegründet",games:"Spiele",offerTerms:"Angebot & Bedingungen",evidencePaymentsTools:"Evidenz, Zahlungen & Kontrollwerkzeuge",licenceRecord:"Lizenzeintrag",paymentRecords:"Zahlungsangaben",providers:"Anbieter",controlTools:"Kontrollwerkzeuge",keepInView:"Im Blick behalten",scoreExplanation:"Redaktionelles Urteil, keine gewichtete Formel",demoAgeField:"FIKTIVES 18+-FELD",demoLicenceField:"FIKTIVES LIZENZFELD",demoPaymentFields:"FIKTIVE ZAHLUNGSFELDER",demoWithdrawalField:"FIKTIVES AUSZAHLUNGSFELD",demoOfferField:"FIKTIVES ANGEBOTSFELD",demoTerms:"FIKTIVE DEMONSTRATIONSBEDINGUNGEN",demoFinalFields:"FIKTIVE DEMONSTRATIONSFELDER",relatedTitle:"Weiter vergleichen",relatedCopy:"Nutze in jeder Bewertung dieselben Evidenzfelder.",compareBonusTerms:"Veröffentlichte Bonusbedingungen vergleichen",exploreBonusInformation:"Bonusinformationen ansehen",originalEditorialNotice:"Der redaktionelle Bewertungstext ist quellengesteuert und erscheint in seiner veröffentlichten Sprache."},
  comparison:{trayLabel:"Anbietervergleich",selectedOfThree:"{count} von 3 ausgewählt",chooseOneMore:"Wähle noch eines zum Vergleichen",ready:"Dein Vergleich ist bereit",add:"Vergleichen",open:"Vergleich öffnen",clear:"Löschen",title:"Direkter Vergleich",subtitle:"Dieselben Evidenzfelder für jeden Anbieter",close:"Vergleich schließen",loading:"Vergleich wird erstellt…",unavailable:"Der ausgewählte öffentliche Vergleich ist nicht verfügbar. Es wurde kein Ersatz eingesetzt.",fullReview:"Vollständige Bewertung",remove:"Entfernen",topScore:"Höchste Bewertung",evidenceUnavailable:"Veröffentlichte Vergleichsevidenz ist nicht verfügbar.",footer:"18+ · Verfügbarkeit wird nie angenommen · Bewertungen sind redaktionell. Der Markt ist eine Vergleichspräferenz, kein Berechtigungsnachweis."},
  outbound:{affiliateNote:"Affiliate-Link · Wir können Provision erhalten.",label:"02 / Bestätigung der Weiterleitung",title:"Du verlässt B4GAMBLE.",description:"Du besuchst gleich einen externen Glücksspielanbieter. Eine berechtigte Aktion kann B4GAMBLE Provision bringen. Dies ändert die redaktionelle Rangfolge nicht.",contractLabel:"Übergabevertrag",contractCopy:"Keine rohe Ziel-URL · keine Autorität aus dem Browser.",riskCopy:"18+ · Berechtigung und Anbieterbedingungen gelten · Glücksspiel birgt finanzielle Risiken",continueAction:"Zum berechtigten Partner weiter →",cancelAction:"Abbrechen und bei B4GAMBLE bleiben",disclosureAction:"Affiliate-Hinweis ansehen"},
  calculator:{kicker:"Was ein Bonus wirklich kostet",titleLead:"Rechne nach",titleEmphasis:"bevor du handelst.",copy:"Gib die beworbenen Zahlen ein, um erforderlichen Umsatz und eine beispielhafte Erwartung zu sehen.",amount:"Bonusbetrag",multiplier:"Umsatzmultiplikator",appliesTo:"Umsatz gilt für",bonusOnly:"Nur Bonus",depositAndBonus:"Einzahlung + Bonus",gameWeight:"Dein Spiel zählt mit",conversion:"Die Umrechnung",slots:"Slots",tableGames:"Tischspiele",roulette:"Roulette",blackjack:"Blackjack",requiredTurnover:"Erforderlicher Umsatz",effectiveTurnover:"Effektiver Umsatz bei dieser Gewichtung",expectedCost:"Beispielhafte erwartete Kosten",expectedValue:"Beispielhafter erwarteter Nettowert",negative:"Bei diesen Eingaben liegen die erwarteten Kosten über dem Bonuswert.",positive:"Bei diesen Eingaben liegt der beworbene Bonus über den beispielhaften erwarteten Kosten.",caveat:"Statistische Veranschaulichung, keine Vorhersage. Die tatsächlichen Bedingungen gelten."}
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

const draftControlledMediaLabels: Record<keyof typeof compactTranslations, string> = {
  "it-IT": "Contenuti visivi verificati",
  "es-ES": "Contenido visual verificado",
  "pt-PT": "Conteúdo visual verificado",
  "el-GR": "Ελεγμένο οπτικό υλικό",
  "nl-NL": "Gecontroleerd beeldmateriaal",
  "sv-SE": "Granskat bildmaterial",
  "da-DK": "Kontrolleret billedmateriale",
  "fi-FI": "Tarkistettu kuvamateriaali",
  "nb-NO": "Kontrollert bildemateriale",
};

const draftMediaFallbackCopy: Record<keyof typeof compactTranslations, readonly [string, string]> = {
  "it-IT": ["Contenuto visivo adatto non disponibile", "La recensione e le condizioni restano disponibili senza mostrare contenuti visivi inadatti o non verificati."],
  "es-ES": ["No hay material visual adecuado", "La reseña y las condiciones siguen disponibles sin mostrar material visual inadecuado o sin verificar."],
  "pt-PT": ["Conteúdo visual adequado indisponível", "A análise e os termos continuam disponíveis sem apresentar conteúdo visual inadequado ou não verificado."],
  "el-GR": ["Δεν υπάρχει κατάλληλο οπτικό υλικό", "Η αξιολόγηση και οι όροι παραμένουν διαθέσιμοι χωρίς ακατάλληλο ή μη επαληθευμένο οπτικό υλικό."],
  "nl-NL": ["Geen geschikt beeldmateriaal beschikbaar", "De review en voorwaarden blijven beschikbaar zonder ongeschikt of niet-geverifieerd beeldmateriaal te tonen."],
  "sv-SE": ["Lämpligt bildmaterial saknas", "Recensionen och villkoren finns kvar utan olämpligt eller obekräftat bildmaterial."],
  "da-DK": ["Egnet billedmateriale mangler", "Anmeldelsen og vilkårene er fortsat tilgængelige uden uegnet eller ubekræftet billedmateriale."],
  "fi-FI": ["Sopivaa kuvamateriaalia ei ole saatavilla", "Arvio ja ehdot ovat edelleen saatavilla ilman sopimatonta tai vahvistamatonta kuvamateriaalia."],
  "nb-NO": ["Egnet bildemateriale er ikke tilgjengelig", "Anmeldelsen og vilkårene er fortsatt tilgjengelige uten uegnet eller ubekreftet bildemateriale."],
};

const draftCasinoSelectorLabels: Record<keyof typeof compactTranslations, readonly [string, string, string, string, string]> = {
  "it-IT": ["Migliore in assoluto", "Crypto", "Mobile", "Migliori bonus", "Nuovi casinò"],
  "es-ES": ["Mejor en general", "Cripto", "Móvil", "Mejores bonos", "Casinos nuevos"],
  "pt-PT": ["Melhor no geral", "Cripto", "Móvel", "Melhores bónus", "Novos casinos"],
  "el-GR": ["Καλύτερο συνολικά", "Κρυπτονομίσματα", "Κινητό", "Καλύτερα μπόνους", "Νέα καζίνο"],
  "nl-NL": ["Beste algemeen", "Crypto", "Mobiel", "Beste bonussen", "Nieuwe casino's"],
  "sv-SE": ["Bäst totalt", "Krypto", "Mobil", "Bästa bonusar", "Nya casinon"],
  "da-DK": ["Bedst samlet", "Krypto", "Mobil", "Bedste bonusser", "Nye kasinoer"],
  "fi-FI": ["Paras kokonaisuus", "Krypto", "Mobiili", "Parhaat bonukset", "Uudet kasinot"],
  "nb-NO": ["Best totalt", "Krypto", "Mobil", "Beste bonuser", "Nye kasinoer"],
};

const draftBonusSelectorLabels: Record<keyof typeof compactTranslations, readonly [string, string, string, string, string]> = {
  "it-IT": ["Migliore in assoluto", "Requisiti di puntata bassi", "Deposito basso", "Cripto", "Più recenti"],
  "es-ES": ["Mejor en general", "Requisito de apuesta bajo", "Depósito bajo", "Cripto", "Más recientes"],
  "pt-PT": ["Melhor no geral", "Requisitos de apostas baixos", "Depósito baixo", "Cripto", "Mais recentes"],
  "el-GR": ["Καλύτερο συνολικά", "Χαμηλή απαίτηση στοιχηματισμού", "Χαμηλή κατάθεση", "Κρυπτονομίσματα", "Νεότερα"],
  "nl-NL": ["Beste algemeen", "Lage inzetvereiste", "Lage storting", "Crypto", "Nieuwste"],
  "sv-SE": ["Bäst totalt", "Lågt omsättningskrav", "Låg insättning", "Krypto", "Senaste"],
  "da-DK": ["Bedst samlet", "Lavt omsætningskrav", "Lav indbetaling", "Krypto", "Nyeste"],
  "fi-FI": ["Paras kokonaisuus", "Matala kierrätysvaatimus", "Pieni talletus", "Krypto", "Uusimmat"],
  "nb-NO": ["Best totalt", "Lavt omsetningskrav", "Lavt innskudd", "Krypto", "Nyeste"],
};

const draftBonusEditorialFilterLabels: Record<keyof typeof compactTranslations, readonly [string, string, string, string, string, string]> = {
  "it-IT": ["Stato in evidenza editoriale", "In evidenza editoriale", "Non in evidenza editoriale", "Stato della raccomandazione editoriale", "Raccomandato dalla redazione", "Non raccomandato dalla redazione"],
  "es-ES": ["Estado destacado editorial", "Destacado editorialmente", "No destacado editorialmente", "Estado de recomendación editorial", "Recomendado editorialmente", "No recomendado editorialmente"],
  "pt-PT": ["Estado de destaque editorial", "Em destaque editorial", "Sem destaque editorial", "Estado de recomendação editorial", "Recomendado editorialmente", "Não recomendado editorialmente"],
  "el-GR": ["Κατάσταση συντακτικής προβολής", "Προβάλλεται συντακτικά", "Δεν προβάλλεται συντακτικά", "Κατάσταση συντακτικής σύστασης", "Συνιστάται συντακτικά", "Δεν συνιστάται συντακτικά"],
  "nl-NL": ["Redactionele uitlichtstatus", "Redactioneel uitgelicht", "Niet redactioneel uitgelicht", "Redactionele aanbevelingsstatus", "Redactioneel aanbevolen", "Niet redactioneel aanbevolen"],
  "sv-SE": ["Redaktionell framhävning", "Redaktionellt framhävd", "Inte redaktionellt framhävd", "Redaktionell rekommendation", "Redaktionellt rekommenderad", "Inte redaktionellt rekommenderad"],
  "da-DK": ["Redaktionel fremhævelse", "Redaktionelt fremhævet", "Ikke redaktionelt fremhævet", "Redaktionel anbefaling", "Redaktionelt anbefalet", "Ikke redaktionelt anbefalet"],
  "fi-FI": ["Toimituksellisen noston tila", "Toimituksellisesti nostettu", "Ei toimituksellisesti nostettu", "Toimituksellisen suosituksen tila", "Toimituksellisesti suositeltu", "Ei toimituksellisesti suositeltu"],
  "nb-NO": ["Status for redaksjonell fremheving", "Redaksjonelt fremhevet", "Ikke redaksjonelt fremhevet", "Status for redaksjonell anbefaling", "Redaksjonelt anbefalt", "Ikke redaksjonelt anbefalt"],
};

const draftGameLabels: Record<keyof typeof compactTranslations, readonly [string, string, string, string]> = {
  "it-IT": ["Slot", "Tavolo", "Roulette", "Blackjack"],
  "es-ES": ["Tragaperras", "Mesa", "Ruleta", "Blackjack"],
  "pt-PT": ["Slots", "Mesa", "Roleta", "Blackjack"],
  "el-GR": ["Κουλοχέρηδες", "Επιτραπέζια", "Ρουλέτα", "Μπλάκτζακ"],
  "nl-NL": ["Slots", "Tafelspellen", "Roulette", "Blackjack"],
  "sv-SE": ["Slots", "Bordsspel", "Roulette", "Blackjack"],
  "da-DK": ["Spilleautomater", "Bordspil", "Roulette", "Blackjack"],
  "fi-FI": ["Kolikkopelit", "Pöytäpelit", "Ruletti", "Blackjack"],
  "nb-NO": ["Spilleautomater", "Bordspill", "Rulett", "Blackjack"],
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
  const [bestOverall, crypto, mobile, bestBonuses, newCasinos] = draftCasinoSelectorLabels[locale];
  const [selectorBestOverall, selectorLowWagering, selectorLowDeposit, selectorCrypto, selectorNewest] = draftBonusSelectorLabels[locale];
  const [featuredFilter, featuredTrue, featuredFalse, recommendedFilter, recommendedTrue, recommendedFalse] = draftBonusEditorialFilterLabels[locale];
  const [slots, tableGames, roulette, blackjack] = draftGameLabels[locale];
  const [mediaUnavailableTitle, mediaUnavailableCopy] = draftMediaFallbackCopy[locale];
  const state = `${n.unavailable}. ${copy[1]}`;
  const method = `${n.methodology}: ${n.terms}. ${copy[1]}`;
  return {
    common: {
      notListed:n.unavailable,current:n.current,published:n.published,classified:n.published,record:n.record,records:n.records,result:n.result,results:n.results,
      reviewOnly:`${n.review} · ${n.unavailable}`,actionAvailable:n.action,noGovernedVisit:n.unavailable,readReview:n.review,viewDemonstration:n.demo,browseReviews:n.browse,reviewMethodology:n.methodology,
      editorScore:n.score,wagering:n.wagering,minimumDeposit:n.deposit,maximumBonus:n.value,maximumBet:n.terms,payout:n.payout,eligibility:n.eligibility,expiry:n.expiry,paymentMethods:n.payments,licence:n.licence,
      activeFilters:n.filters,clearAll:n.clear,applyFilters:n.filters,filters:n.filters,previous:n.previous,next:n.next,pageOf:`{page} / {pages}`,demoData:n.demo,demoDisclosure:state,
      marketPresentationNotice:copy[1],reviewAvailableNoAction:state,affiliateDisclosure:n.affiliate,methodology:n.methodology,bonusGuide:n.bonuses,protectedHelp:n.help,allFilters:n.filters,directoryControls:n.filters,closeFilters:n.close,
      updatingResults:`${n.results} · ${n.current}`,sourceStatus:n.source,controlledMedia:draftControlledMediaLabels[locale],mediaUnavailableTitle,mediaUnavailableCopy,materialTerms:n.terms,materialOfferTerms:n.terms,commercialUnavailable:n.unavailable,originalSourceCopy:n.source,
      countryPreference,bonusType,cryptoSupport,availability,sortResults,cryptoSupported,cryptoUnsupported,
      bonusAvailability,visitAvailability,saferGamblingInformation,mobileSupport,supported,resultsPerPage,featured,relevance,newest,nameAscending,nameDescending,
      breadcrumb:draftBreadcrumbLabels[locale],
    },
    bestOffers: {
      title:`${n.best} — {market} | B4GAMBLE`,description:copy[0],unavailableTitle:`${n.best} · ${n.unavailable} | B4GAMBLE`,unavailableDescription:state,
      heroLead:n.best,heroEmphasis:n.terms,heroKicker:`${n.best} · {market}`,heroCopy:copy[0],eligibleRecords:n.records,currentMarket:n.current,inferredActions:n.action,rankingLink:`${n.methodology} →`,
      sectionTitle:`${n.best} · ${n.terms}`,commissionNote:n.affiliate,emptyTitle:copy[2],emptyCopy:copy[1],unavailableTitleBody:n.unavailable,unavailableCopy:state,
      demoKicker:`${n.demo} · ${n.records}`,demoCopy:state,fictionalRecords:`${n.demo} · ${n.records}`,liveOffers:`${n.current} · ${n.bonuses}`,claimActions:n.action,fictionalRecordsOnly:n.demo,termsBeforeAction:n.terms,availabilityFailsClosed:n.unavailable,
      worthALookTitle:`${n.browse} · ${n.records}`,whyTitle:n.methodology,whyCopy:method,finalKicker:n.current,beforeClick:n.terms,
      faqWageringQuestion:`${n.questions}: ${n.wagering}`,faqWageringAnswer:method,faqCommissionQuestion:`${n.questions}: ${n.affiliate}`,faqCommissionAnswer:n.affiliate,faqWhyThreeQuestion:`${n.questions}: ${n.best}`,faqWhyThreeAnswer:copy[0],
    },
    casinos: {
      title:`${n.casinos} — {market} | B4GAMBLE`,description:copy[0],demoTitle:`${n.casinos} · ${n.demo} | B4GAMBLE`,demoDescription:state,heroKicker:`${n.casinos} · {market}`,heroLead:n.casinos,heroEmphasis:n.review,heroCopy:copy[0],
      proofEvidence:n.source,proofLimit:n.records,proofPublished:n.published,directoryTitle:n.casinos,filterTitle:`${n.filters} · ${n.casinos}`,bestOverall,crypto,mobile,bestBonuses,newCasinos,noMatchesTitle:copy[3],noMatchesCopy:copy[1],noPublishedTitle:copy[3],reviewOnlyNotice:state,faqTitle:n.questions,
      faqDifferenceQuestion:`${n.questions}: ${n.comparison}`,faqDifferenceAnswer:copy[0],faqReviewOnlyQuestion:`${n.questions}: ${n.review}`,faqReviewOnlyAnswer:state,faqCommissionQuestion:`${n.questions}: ${n.affiliate}`,faqCommissionAnswer:n.affiliate,
    },
    bonuses: {
      title:`${n.bonuses} — {market} | B4GAMBLE`,description:copy[0],demoTitle:`${n.bonuses} · ${n.demo} | B4GAMBLE`,demoDescription:state,heroKicker:`${n.bonuses} · ${n.terms} · 18+`,heroLead:n.value,heroEmphasis:n.terms,heroCopy:copy[0],
      proofTerms:n.terms,proofClaims:n.source,proofSources:n.source,directoryTitle:n.bonuses,filterTitle:`${n.filters} · ${n.bonuses}`,sortedByValue:n.value,noMatchesTitle:copy[4],noMatchesCopy:copy[1],unavailableTitleBody:n.unavailable,unavailableCopy:state,
      featuredFilter,featuredTrue,featuredFalse,recommendedFilter,recommendedTrue,recommendedFalse,
      methodKicker:n.methodology,methodLead:n.terms,methodEmphasis:n.value,methodCopy:method,guideAction:`${n.bonuses} →`,disclosureTitle:n.affiliate,disclosureCopy:copy[1],disclosureAction:`${n.affiliate} →`,
      selectorBestOverall,selectorLowWagering,selectorLowDeposit,selectorCrypto,selectorNewest,
    },
    profile: {
      unavailableTitle:`${n.review} · ${n.unavailable} | B4GAMBLE`,unavailableDescription:state,review:n.review,operatorReview:n.review,verdict:n.score,offerUnavailable:n.unavailable,currentReview:n.current,publishedReview:n.published,demoReview:n.demo,demoDisclosure:state,
      marketUnavailable:copy[5],marketUnavailableCopy:copy[1],overview:n.review,offerEvidence:n.source,questions:n.questions,quickCheck:n.review,quickCheckCopy:n.source,bestFor:n.best,whyWeLikeIt:n.score,thingsToKnow:n.terms,founded:n.current,games:n.records,
      offerTerms:n.terms,evidencePaymentsTools:n.source,licenceRecord:n.licence,paymentRecords:n.payments,providers:n.source,controlTools:n.help,keepInView:n.terms,scoreExplanation:n.score,
      demoAgeField:`${n.demo} · 18+`,demoLicenceField:`${n.demo} · ${n.licence}`,demoPaymentFields:`${n.demo} · ${n.payments}`,demoWithdrawalField:`${n.demo} · ${n.payout}`,demoOfferField:`${n.demo} · ${n.bonuses}`,demoTerms:`${n.demo} · ${n.terms}`,demoFinalFields:`${n.demo} · ${n.records}`,
      relatedTitle:n.comparison,relatedCopy:copy[0],compareBonusTerms:n.terms,exploreBonusInformation:n.bonuses,originalEditorialNotice:n.source,
    },
    comparison: {trayLabel:n.comparison,selectedOfThree:`{count} / 3`,chooseOneMore:n.next,ready:n.current,add:n.comparison,open:n.comparison,clear:n.clear,title:n.comparison,subtitle:n.source,close:n.close,loading:`${n.comparison} · ${n.current}`,unavailable:n.unavailable,fullReview:n.review,remove:n.remove,topScore:n.score,evidenceUnavailable:state,footer:copy[1]},
    outbound: {affiliateNote:n.affiliate,label:n.action,title:`B4GAMBLE · ${n.action}`,description:copy[1],contractLabel:n.terms,contractCopy:n.source,riskCopy:copy[1],continueAction:`${n.action} →`,cancelAction:n.close,disclosureAction:n.affiliate},
    calculator: {kicker:`${n.bonuses} · ${n.cost}`,titleLead:n.value,titleEmphasis:n.cost,copy:method,amount:n.bonuses,multiplier:n.wagering,appliesTo:n.terms,bonusOnly:n.bonuses,depositAndBonus:`${n.deposit} + ${n.bonuses}`,gameWeight:n.value,conversion:n.value,slots,tableGames,roulette,blackjack,requiredTurnover:n.wagering,effectiveTurnover:n.wagering,expectedCost:n.cost,expectedValue:n.value,negative:n.cost,positive:n.value,caveat:copy[1]},
  };
}

export type ProductPageOverrides = {
  [Section in keyof ProductPageMessages]: Partial<ProductPageMessages[Section]>;
};

function applyProductPageOverrides(base: ProductPageMessages, overrides: ProductPageOverrides): ProductPageMessages {
  return {
    common: { ...base.common, ...overrides.common },
    bestOffers: { ...base.bestOffers, ...overrides.bestOffers },
    casinos: { ...base.casinos, ...overrides.casinos },
    bonuses: { ...base.bonuses, ...overrides.bonuses },
    profile: { ...base.profile, ...overrides.profile },
    comparison: { ...base.comparison, ...overrides.comparison },
    outbound: { ...base.outbound, ...overrides.outbound },
    calculator: { ...base.calculator, ...overrides.calculator },
  };
}

function reviewedLocaleVariant(locale: keyof typeof compactTranslations, overrides: ProductPageOverrides): ProductPageMessages {
  return applyProductPageOverrides(localeVariant(locale), overrides);
}

const firstWaveEditorialOverrides = {
  "es-ES": {
    common: {
      notListed:"No indicado",reviewOnly:"Solo reseña",actionAvailable:"Acción disponible",noGovernedVisit:"Visita no disponible",readReview:"Leer reseña",viewDemonstration:"Ver demostración",browseReviews:"Explorar reseñas de casinos",reviewMethodology:"Ver metodología",maximumBonus:"Bono máximo",maximumBet:"Apuesta máxima",eligibility:"Requisitos",activeFilters:"Filtros activos",applyFilters:"Aplicar filtros",pageOf:"Página {page} de {pages}",demoDisclosure:"Los registros ficticios no son operadores actuales, ofertas de socios ni promociones activas. No hay ningún destino de juego o afiliación disponible.",reviewAvailableNoAction:"La reseña sigue disponible, pero la acción comercial no.",bonusGuide:"Guía de bonos",protectedHelp:"Abrir Ayuda protegida",allFilters:"Todos los filtros",directoryControls:"Controles del directorio",closeFilters:"Cerrar filtros",updatingResults:"Actualizando resultados…",materialOfferTerms:"condiciones esenciales de la oferta",commercialUnavailable:"Acción comercial no disponible",originalSourceCopy:"Los datos controlados por la fuente se muestran en el idioma en que fueron publicados.",supported:"Compatible",featured:"Destacado",newest:"Más recientes",
    },
    bestOffers: {
      title:"Comparador de ofertas de casino para {market} | B4GAMBLE",description:"Una selección editorial para {market}, con las condiciones esenciales y la disponibilidad comercial visibles antes de actuar.",unavailableTitle:"Comparador de ofertas de casino no disponible | B4GAMBLE",unavailableDescription:"La comparación publicada para {market} no está disponible temporalmente. No se sustituye por una lista antigua, almacenada o inventada.",heroLead:"Tres opciones.",heroEmphasis:"No treinta.",heroKicker:"Selección editorial actual para {market}",heroCopy:"Los registros publicados se filtran para {market}. Cualquier acción comercial requiere una autorización independiente en el momento de la solicitud.",eligibleRecords:"registros aptos",currentMarket:"mercado editorial",inferredActions:"acciones inferidas",rankingLink:"Cómo funciona la clasificación →",sectionTitle:"Las tres primeras — condiciones esenciales primero",commissionNote:"B4GAMBLE puede recibir una comisión por un enlace apto y claramente identificado. La remuneración no determina el Editor Score ni el orden editorial natural.",emptyTitle:"No hay registros aptos para {market}.",emptyCopy:"B4GAMBLE no sustituye esta selección por la británica ni rebaja el método para llenar la página.",unavailableTitleBody:"No se ha podido cargar la comparación.",unavailableCopy:"No se muestra ningún resultado comercial almacenado, antiguo o inventado.",demoKicker:"Demostración ficticia del producto",demoCopy:"Los registros ficticios muestran la clasificación y las condiciones esenciales. No representan promociones actuales, relaciones comerciales, pruebas con dinero real ni acciones disponibles.",fictionalRecords:"registros ficticios",liveOffers:"ofertas activas",claimActions:"acciones disponibles",fictionalRecordsOnly:"Solo registros ficticios",termsBeforeAction:"Condiciones esenciales antes de actuar",availabilityFailsClosed:"La disponibilidad falla de forma segura",worthALookTitle:"También conviene mirar — justo fuera de las tres primeras",whyTitle:"Por qué aparecen estos registros",whyCopy:"Antes de clasificar se comprueban la disponibilidad por mercado, las condiciones esenciales y el estado de la fuente. La disponibilidad comercial se verifica por separado.",finalKicker:"¿Sigues aquí? La respuesta no ha cambiado.",beforeClick:"Antes de hacer clic",faqWageringQuestion:"¿Qué es el requisito de apuesta?",faqWageringAnswer:"Es el volumen de juego exigido por las condiciones publicadas antes de poder retirar las ganancias del bono.",faqCommissionQuestion:"¿Ganáis dinero si me registro?",faqCommissionAnswer:"Un enlace de afiliación apto y claramente identificado puede generar una comisión. No influye en la valoración ni en el orden editorial.",faqWhyThreeQuestion:"¿Por qué solo tres ofertas?",faqWhyThreeAnswer:"Una lista breve mantiene la decisión acotada; la página de Bonos contiene todo el directorio apto.",
    },
    casinos: {
      title:"Reseñas de casinos para {market} | B4GAMBLE",description:"Busca y compara reseñas publicadas dentro del contexto editorial de {market}.",demoTitle:"Demostración de reseñas de casinos | B4GAMBLE",demoDescription:"Los registros ficticios, claramente identificados, muestran el formato sin promociones ni acciones de afiliación activas.",heroKicker:"Selección para {market}",heroLead:"Conoce al operador",heroEmphasis:"antes que la oferta.",heroCopy:"Compara la disponibilidad por mercado, las licencias declaradas, los pagos, las herramientas de control y las condiciones esenciales.",proofEvidence:"Evidencias y límites declarados",proofLimit:"Máximo de tres por caso de uso",proofPublished:"Solo datos publicados actuales",directoryTitle:"Directorio completo",filterTitle:"Filtrar casinos",noMatchesTitle:"Ninguna reseña publicada coincide con este mercado y estos filtros.",noMatchesCopy:"Quita un filtro o cambia la presentación. B4GAMBLE no rellena el hueco con operadores no aptos.",noPublishedTitle:"Aún no hay reseñas publicadas para {market}.",reviewOnlyNotice:"Las reseñas siguen disponibles. Las acciones comerciales permanecen ocultas hasta que se autoricen el mercado, la oferta y la redirección.",faqTitle:"Antes de elegir",faqDifferenceQuestion:"¿En qué se diferencia de Mejores ofertas?",faqDifferenceAnswer:"Mejores ofertas es una selección acotada. Este directorio permite comparar todas las reseñas publicadas aptas.",faqReviewOnlyQuestion:"¿Qué significa «solo reseña»?",faqReviewOnlyAnswer:"La reseña editorial está disponible, pero esta solicitud no tiene una ruta de registro autorizada.",faqCommissionQuestion:"¿La comisión influye en la clasificación?",faqCommissionAnswer:"No. La remuneración de afiliación no determina el Editor Score ni el orden editorial natural.",
    },
    bonuses: {
      title:"Comparador de bonos de casino para {market} | B4GAMBLE",description:"Compara condiciones de bonos publicadas para el contexto editorial de {market}, sin dar por hecha la disponibilidad comercial.",demoTitle:"Demostración de bonos de casino | B4GAMBLE",demoDescription:"Los registros ficticios, claramente identificados, muestran cómo se comparan las condiciones. No son promociones actuales ni ofertas de socios.",heroKicker:"Bonos · Condiciones primero · 18+",heroLead:"El valor se mide",heroEmphasis:"por las condiciones.",heroCopy:"La cifra principal dice poco después del requisito de apuesta. Compara depósito, volumen de juego, restricciones y caducidad antes de actuar.",proofTerms:"Condiciones esenciales primero",proofClaims:"Sin promesas de dinero garantizado",proofSources:"El estado de la fuente sigue visible",directoryTitle:"Todos los bonos",filterTitle:"Filtrar bonos",sortedByValue:"ordenados por valor neto",noMatchesTitle:"Ningún registro coincide con {market} y estos filtros.",noMatchesCopy:"Quita un filtro o cambia la presentación. No se sustituye por una oferta no apta.",unavailableTitleBody:"No se ha podido cargar el directorio publicado.",unavailableCopy:"No se sustituye por una oferta almacenada, antigua, ficticia o inventada.",methodKicker:"Cómo evaluamos las condiciones del bono",methodLead:"La letra pequeña es",methodEmphasis:"el producto.",methodCopy:"El requisito de apuesta, la ponderación, el depósito mínimo y la caducidad determinan lo que puede exigir realmente un bono.",guideAction:"Leer la Guía de bonos →",disclosureTitle:"18+ · Información comercial",disclosureCopy:"B4GAMBLE puede recibir una remuneración de futuros enlaces aptos y autorizados. No determina el Editor Score ni el orden natural. Comprueba las condiciones actuales y la ley aplicable.",disclosureAction:"Leer la información →",
    },
    profile: {
      unavailableTitle:"Perfil de casino no disponible | B4GAMBLE",unavailableDescription:"Este perfil no está publicado o no se encuentra disponible.",review:"reseña",operatorReview:"Reseña del operador",verdict:"Nuestro veredicto:",offerUnavailable:"Oferta no disponible",currentReview:"Reseña actual",publishedReview:"Reseña publicada",demoReview:"Demostración ficticia de reseña",demoDisclosure:"Campos ficticios: no representan un operador actual, una licencia, una oferta de socio ni una visita comercial.",marketUnavailable:"Solo reseña para {market}",marketUnavailableCopy:"Este perfil no publica disponibilidad para el mercado seleccionado. No se infiere la elegibilidad y no hay acción comercial.",overview:"Resumen",offerEvidence:"Oferta y evidencias",questions:"Preguntas",quickCheck:"Comprobación en 30 segundos",quickCheckCopy:"Datos publicados clave antes del detalle",bestFor:"Adecuado para",whyWeLikeIt:"Por qué destaca",thingsToKnow:"Qué debes saber",founded:"Fundación",games:"Juegos",offerTerms:"Oferta y condiciones",evidencePaymentsTools:"Evidencias, pagos y herramientas de control",licenceRecord:"Registro de licencia",paymentRecords:"Datos de pago",providers:"Proveedores",controlTools:"Herramientas de control",keepInView:"Ten en cuenta",scoreExplanation:"Criterio editorial, no una fórmula ponderada",relatedTitle:"Sigue comparando",relatedCopy:"Aplica los mismos campos de evidencia en cada reseña.",compareBonusTerms:"Comparar condiciones de bonos publicadas",exploreBonusInformation:"Consultar información sobre bonos",originalEditorialNotice:"El cuerpo editorial está controlado por la fuente y se muestra en el idioma en que fue publicado.",
    },
    comparison: { trayLabel:"Comparador de casinos",selectedOfThree:"{count} de 3 seleccionados",chooseOneMore:"Elige uno más para comparar",ready:"La comparación está lista",add:"Comparar",open:"Abrir comparación",clear:"Borrar",title:"En paralelo",subtitle:"Los mismos campos de evidencia para cada casino",close:"Cerrar comparación",loading:"Preparando la comparación…",unavailable:"La comparación pública seleccionada no está disponible. No se ha insertado ningún sustituto.",fullReview:"Reseña completa",remove:"Eliminar",topScore:"Mejor puntuación",evidenceUnavailable:"La evidencia publicada para la comparación no está disponible.",footer:"18+ · La disponibilidad nunca se presupone · Las puntuaciones son editoriales. El país es una preferencia de comparación, no una prueba de elegibilidad." },
    outbound: { affiliateNote:"Enlace de afiliación · Podemos recibir una comisión.",label:"02 / Confirmación de salida",title:"Vas a salir de B4GAMBLE.",description:"Estás a punto de visitar a un operador externo. Una acción apta puede generar una comisión para B4GAMBLE; esto no cambia el Editor Score ni el orden editorial natural.",contractLabel:"Condiciones de la salida",contractCopy:"Sin URL de destino expuesta · sin autoridad aportada por el navegador.",riskCopy:"18+ · Se aplican los requisitos y condiciones del operador · El juego implica riesgo financiero",continueAction:"Continuar al socio apto →",cancelAction:"Cancelar y seguir en B4GAMBLE",disclosureAction:"Ver la información de afiliación" },
    calculator: { kicker:"Lo que cuesta realmente un bono",titleLead:"Haz las cuentas",titleEmphasis:"antes de aceptarlo.",copy:"Introduce las cifras anunciadas para ver el volumen de juego requerido y un coste de cumplimiento ilustrativo.",amount:"Importe del bono",multiplier:"Multiplicador del requisito",appliesTo:"El requisito se aplica a",bonusOnly:"Solo el bono",depositAndBonus:"Depósito + bono",gameWeight:"Tu juego cuenta al",conversion:"La conversión",slots:"Tragaperras",tableGames:"Juegos de mesa",requiredTurnover:"Volumen de juego requerido",effectiveTurnover:"Volumen efectivo con esta ponderación",expectedCost:"Coste esperado ilustrativo",expectedValue:"Valor neto esperado ilustrativo",negative:"Con estos datos, el coste esperado es mayor que el valor del bono.",positive:"Con estos datos, el bono anunciado supera el coste esperado ilustrativo.",caveat:"Ilustración estadística, no predicción. La variación es alta y mandan las condiciones reales." },
  },
  "sv-SE": {
    common: { notListed:"Inte angivet",reviewOnly:"Endast recension",actionAvailable:"Åtgärd tillgänglig",noGovernedVisit:"Inget godkänt besök",readReview:"Läs recension",viewDemonstration:"Visa demonstration",browseReviews:"Utforska casinorecensioner",reviewMethodology:"Se metoden",maximumBonus:"Högsta bonus",maximumBet:"Högsta insats",eligibility:"Villkor för deltagande",activeFilters:"Aktiva filter",applyFilters:"Använd filter",pageOf:"Sida {page} av {pages}",demoDisclosure:"Fiktiva produktposter är inte aktuella operatörer, partnererbjudanden eller aktiva kampanjer. Ingen spel- eller affiliatelänk är tillgänglig.",reviewAvailableNoAction:"Recensionen finns kvar, men den kommersiella åtgärden är inte tillgänglig.",bonusGuide:"Bonusguide",protectedHelp:"Öppna skyddad Hjälp",allFilters:"Alla filter",directoryControls:"Katalogkontroller",closeFilters:"Stäng filter",updatingResults:"Uppdaterar resultat…",materialOfferTerms:"väsentliga erbjudandevillkor",commercialUnavailable:"Kommersiell åtgärd inte tillgänglig",originalSourceCopy:"Källstyrda fakta visas på det språk där de publicerades.",supported:"Stöds",featured:"Utvald" },
    bestOffers: { title:"Jämförelse av casinoerbjudanden för {market} | B4GAMBLE",description:"Ett redaktionellt urval för {market}, med väsentliga villkor och kommersiell tillgänglighet före varje åtgärd.",unavailableTitle:"Jämförelsen av casinoerbjudanden är inte tillgänglig | B4GAMBLE",unavailableDescription:"Den publicerade jämförelsen för {market} är tillfälligt otillgänglig. Ingen äldre, cachad eller påhittad lista ersätter den.",heroLead:"Tre val.",heroEmphasis:"Inte trettio.",heroKicker:"Aktuellt redaktionellt urval för {market}",heroCopy:"Publicerade poster filtreras för {market}. Kommersiella åtgärder kräver separat behörighet vid varje begäran.",eligibleRecords:"kvalificerade poster",currentMarket:"redaktionell marknad",inferredActions:"antagna åtgärder",rankingLink:"Så fungerar rankningen →",sectionTitle:"De tre främsta — väsentliga villkor först",commissionNote:"B4GAMBLE kan få provision från en kvalificerad och tydligt märkt länk. Ersättningen avgör inte Editor Score eller den naturliga redaktionella ordningen.",emptyTitle:"Inga kvalificerade poster för {market}.",emptyCopy:"B4GAMBLE ersätter inte med en brittisk lista och sänker inte kraven för att fylla sidan.",unavailableTitleBody:"Jämförelsen kunde inte läsas in.",unavailableCopy:"Inget cachat, äldre eller påhittat kommersiellt resultat visas.",demoKicker:"Fiktiv produktdemonstration",demoCopy:"Fiktiva poster visar rankning och väsentliga villkor. De är inte aktuella kampanjer, partnerskap, tester med riktiga pengar eller tillgängliga åtgärder.",fictionalRecords:"fiktiva poster",liveOffers:"aktiva erbjudanden",claimActions:"erbjudandeåtgärder",fictionalRecordsOnly:"Endast fiktiva poster",termsBeforeAction:"Väsentliga villkor före åtgärd",availabilityFailsClosed:"Tillgänglighet stängs säkert",worthALookTitle:"Värda att se — strax utanför topp tre",whyTitle:"Varför dessa poster visas",whyCopy:"Marknadstillgänglighet, fullständiga villkor och källstatus kontrolleras före rankning. Kommersiell tillgänglighet kontrolleras separat.",finalKicker:"Fortfarande kvar? Svaret har inte ändrats.",beforeClick:"Innan du klickar",faqWageringQuestion:"Vad betyder omsättningskrav?",faqWageringAnswer:"Det är den omsättning som de publicerade villkoren kräver innan bonusvinster kan tas ut.",faqCommissionQuestion:"Tjänar ni pengar om jag registrerar mig?",faqCommissionAnswer:"En kvalificerad och märkt affiliatelänk kan ge provision. Den påverkar varken bedömningen eller den redaktionella ordningen.",faqWhyThreeQuestion:"Varför bara tre erbjudanden?",faqWhyThreeAnswer:"En kort lista håller beslutet avgränsat; Bonussidan visar hela den kvalificerade katalogen." },
    casinos: { title:"Casinorecensioner för {market} | B4GAMBLE",description:"Sök och jämför publicerade casinorecensioner i det redaktionella sammanhanget för {market}.",demoTitle:"Demonstration av casinorecensioner | B4GAMBLE",demoDescription:"Tydligt märkta fiktiva poster visar formatet utan aktiv kampanj eller affiliateåtgärd.",heroKicker:"Utvalt för {market}",heroLead:"Lär känna operatören",heroEmphasis:"före erbjudandet.",heroCopy:"Jämför marknadstillgänglighet, licensuppgifter, betalningar, kontrollverktyg och väsentliga villkor.",proofEvidence:"Evidens och begränsningar redovisas",proofLimit:"Högst tre per användningsfall",proofPublished:"Endast aktuella publicerade uppgifter",directoryTitle:"Hela katalogen",filterTitle:"Filtrera casinon",noMatchesTitle:"Ingen publicerad recension matchar marknaden och filtren.",noMatchesCopy:"Ta bort ett filter eller byt presentation. B4GAMBLE fyller inte luckan med obehöriga operatörer.",noPublishedTitle:"Det finns ännu inga publicerade recensioner för {market}.",reviewOnlyNotice:"Recensionerna finns kvar. Kommersiella åtgärder förblir dolda tills marknad, erbjudande och omdirigering är godkända.",faqTitle:"Innan du väljer",faqDifferenceQuestion:"Hur skiljer detta sig från Bästa erbjudanden?",faqDifferenceAnswer:"Bästa erbjudanden är ett avgränsat urval. Katalogen låter dig jämföra alla kvalificerade publicerade recensioner.",faqReviewOnlyQuestion:"Vad betyder endast recension?",faqReviewOnlyAnswer:"Den redaktionella recensionen är tillgänglig, men det finns ingen godkänd registreringsväg för den här begäran.",faqCommissionQuestion:"Påverkar provision rankningen?",faqCommissionAnswer:"Nej. Affiliateersättning avgör inte Editor Score eller den naturliga redaktionella ordningen." },
    bonuses: { title:"Jämförelse av casinobonusar för {market} | B4GAMBLE",description:"Jämför publicerade bonusvillkor i det redaktionella sammanhanget för {market}, utan att anta kommersiell tillgänglighet.",demoTitle:"Demonstration av casinobonusar | B4GAMBLE",demoDescription:"Tydligt märkta fiktiva poster visar hur villkor jämförs. De är inte aktuella kampanjer eller partnererbjudanden.",heroKicker:"Bonusar · Villkor först · 18+",heroLead:"Värde mäts",heroEmphasis:"i villkoren.",heroCopy:"Rubrikens storlek betyder lite efter omsättningskravet. Jämför insättning, omsättning, begränsningar och giltighet före varje åtgärd.",proofTerms:"Väsentliga villkor först",proofClaims:"Inga löften om garanterade pengar",proofSources:"Källstatus förblir synlig",directoryTitle:"Alla bonusar",filterTitle:"Filtrera bonusar",sortedByValue:"sorterade efter nettovärde",noMatchesTitle:"Inga jämförelseposter matchar {market} och dessa filter.",noMatchesCopy:"Ta bort ett filter eller byt presentation. Inget obehörigt erbjudande sätts in.",unavailableTitleBody:"Den publicerade katalogen kunde inte läsas in.",unavailableCopy:"Inget cachat, äldre, fiktivt eller påhittat erbjudande ersätter den.",methodKicker:"Så bedömer vi bonusvillkor",methodLead:"Det finstilta är",methodEmphasis:"produkten.",methodCopy:"Omsättningskrav, viktning, minsta insättning och giltighet avgör vad bonusen faktiskt kan kräva.",guideAction:"Läs bonusguiden →",disclosureTitle:"18+ · Kommersiell information",disclosureCopy:"B4GAMBLE kan få ersättning från framtida kvalificerade och godkända länkar. Ersättningen avgör inte Editor Score eller den naturliga ordningen. Kontrollera aktuella villkor och gällande lag.",disclosureAction:"Läs informationen →" },
    profile: { unavailableTitle:"Casinoprofilen är inte tillgänglig | B4GAMBLE",unavailableDescription:"Casinoprofilen är inte publicerad eller är otillgänglig.",review:"recension",operatorReview:"Operatörsrecension",verdict:"Vårt omdöme:",offerUnavailable:"Erbjudandet är inte tillgängligt",currentReview:"Aktuell recension",publishedReview:"Publicerad recension",demoReview:"Fiktiv recensionsdemonstration",demoDisclosure:"Fiktiva recensionsfält; ingen aktuell operatör, licens, partneroffert eller kommersiell väg.",marketUnavailable:"Endast recension för {market}",marketUnavailableCopy:"Profilen publicerar ingen tillgänglighet för den valda marknaden. Behörighet antas inte och kommersiella åtgärder är inte tillgängliga.",overview:"Översikt",offerEvidence:"Erbjudande och evidens",questions:"Frågor",quickCheck:"Kontroll på 30 sekunder",quickCheckCopy:"Viktiga publicerade fält före detaljerna",bestFor:"Passar för",whyWeLikeIt:"Därför sticker det ut",thingsToKnow:"Bra att veta",founded:"Grundat",games:"Spel",offerTerms:"Erbjudande och villkor",evidencePaymentsTools:"Evidens, betalningar och kontrollverktyg",licenceRecord:"Licensuppgift",paymentRecords:"Betalningsuppgifter",providers:"Leverantörer",controlTools:"Kontrollverktyg",keepInView:"Tänk på",scoreExplanation:"Redaktionellt omdöme, inte en viktad formel",relatedTitle:"Fortsätt jämföra",relatedCopy:"Använd samma evidensfält i varje recension.",compareBonusTerms:"Jämför publicerade bonusvillkor",exploreBonusInformation:"Utforska bonusinformation",originalEditorialNotice:"Den redaktionella texten är källstyrd och visas på det språk där den publicerades." },
    comparison: { trayLabel:"Casinojämförelse",selectedOfThree:"{count} av 3 valda",chooseOneMore:"Välj ett till att jämföra",ready:"Jämförelsen är klar",add:"Jämför",open:"Öppna jämförelse",clear:"Rensa",title:"Sida vid sida",subtitle:"Samma evidensfält för varje casino",close:"Stäng jämförelse",loading:"Bygger jämförelsen…",unavailable:"Den valda offentliga jämförelsen är inte tillgänglig. Ingen ersättning har lagts in.",fullReview:"Fullständig recension",remove:"Ta bort",topScore:"Högsta betyg",evidenceUnavailable:"Publicerad jämförelseevidens är inte tillgänglig.",footer:"18+ · Tillgänglighet antas aldrig · Betygen är redaktionella. Landet är en jämförelsepreferens, inte ett bevis på behörighet." },
    outbound: { affiliateNote:"Affiliatelänk · Vi kan få provision.",label:"02 / Bekräfta extern väg",title:"Du lämnar B4GAMBLE.",description:"Du är på väg till en extern speloperatör. En kvalificerad åtgärd kan ge B4GAMBLE provision; det ändrar inte Editor Score eller den naturliga redaktionella ordningen.",contractLabel:"Villkor för övergången",contractCopy:"Ingen rå mål-URL · ingen behörighet från webbläsaren.",riskCopy:"18+ · Behörighet och operatörens villkor gäller · Spel innebär ekonomisk risk",continueAction:"Fortsätt till behörig partner →",cancelAction:"Avbryt och stanna på B4GAMBLE",disclosureAction:"Läs affiliateinformationen" },
    calculator: { kicker:"Vad en bonus faktiskt kostar",titleLead:"Räkna först",titleEmphasis:"innan du accepterar.",copy:"Ange de annonserade värdena för att se nödvändig omsättning och en illustrativ förväntad kostnad.",amount:"Bonusbelopp",multiplier:"Omsättningsmultiplikator",appliesTo:"Omsättningen gäller",bonusOnly:"Endast bonus",depositAndBonus:"Insättning + bonus",gameWeight:"Ditt spel räknas till",conversion:"Omräkningen",slots:"Slots",tableGames:"Bordsspel",requiredTurnover:"Nödvändig omsättning",effectiveTurnover:"Effektiv omsättning vid denna viktning",expectedCost:"Illustrativ förväntad kostnad",expectedValue:"Illustrativt förväntat nettovärde",negative:"Med dessa värden är den förväntade kostnaden större än bonusvärdet.",positive:"Med dessa värden är rubrikbonusen större än den illustrativa förväntade kostnaden.",caveat:"Statistisk illustration, inte en prognos. Variationen är stor och de faktiska villkoren gäller." },
  },
  "da-DK": {
    common: { notListed:"Ikke angivet",reviewOnly:"Kun anmeldelse",actionAvailable:"Handling tilgængelig",noGovernedVisit:"Intet godkendt besøg",readReview:"Læs anmeldelse",viewDemonstration:"Se demonstration",browseReviews:"Se kasinoanmeldelser",reviewMethodology:"Se metoden",maximumBonus:"Maksimal bonus",maximumBet:"Maksimal indsats",eligibility:"Deltagelseskrav",activeFilters:"Aktive filtre",applyFilters:"Anvend filtre",pageOf:"Side {page} af {pages}",demoDisclosure:"Fiktive produktposter er ikke aktuelle operatører, partnertilbud eller aktive kampagner. Der er ingen spil- eller affiliatedestination.",reviewAvailableNoAction:"Anmeldelsen er stadig tilgængelig, men den kommercielle handling er ikke.",bonusGuide:"Bonusguide",protectedHelp:"Åbn beskyttet Hjælp",allFilters:"Alle filtre",directoryControls:"Oversigtskontroller",closeFilters:"Luk filtre",updatingResults:"Opdaterer resultater…",materialOfferTerms:"væsentlige tilbudsvilkår",commercialUnavailable:"Kommerciel handling er ikke tilgængelig",originalSourceCopy:"Kildestyrede fakta vises på det sprog, de blev offentliggjort på.",supported:"Understøttet",featured:"Fremhævet" },
    bestOffers: { title:"Sammenligning af kasinotilbud for {market} | B4GAMBLE",description:"En redaktionel kortliste for {market}, hvor væsentlige vilkår og kommerciel tilgængelighed vises før enhver handling.",unavailableTitle:"Sammenligning af kasinotilbud er ikke tilgængelig | B4GAMBLE",unavailableDescription:"Den offentliggjorte sammenligning for {market} er midlertidigt utilgængelig. Ingen gemt, ældre eller opdigtet liste erstatter den.",heroLead:"Tre valg.",heroEmphasis:"Ikke tredive.",heroKicker:"Aktuel redaktionel kortliste for {market}",heroCopy:"Offentliggjorte poster filtreres for {market}. Kommercielle handlinger kræver særskilt godkendelse ved hver forespørgsel.",eligibleRecords:"egnede poster",currentMarket:"redaktionelt marked",inferredActions:"antagede handlinger",rankingLink:"Sådan fungerer rangeringen →",sectionTitle:"De tre bedste — væsentlige vilkår først",commissionNote:"B4GAMBLE kan modtage provision fra et egnet og tydeligt markeret link. Betalingen bestemmer ikke Editor Score eller den naturlige redaktionelle rækkefølge.",emptyTitle:"Ingen egnede poster for {market}.",emptyCopy:"B4GAMBLE erstatter ikke med en britisk kortliste og sænker ikke kravene for at fylde siden.",unavailableTitleBody:"Sammenligningen kunne ikke indlæses.",unavailableCopy:"Intet gemt, ældre eller opdigtet kommercielt resultat vises.",demoKicker:"Fiktiv produktdemonstration",demoCopy:"Fiktive poster viser rangering og væsentlige vilkår. De er ikke aktuelle kampagner, partnerskaber, test med rigtige penge eller tilgængelige handlinger.",fictionalRecords:"fiktive poster",liveOffers:"aktive tilbud",claimActions:"tilbudshandlinger",fictionalRecordsOnly:"Kun fiktive poster",termsBeforeAction:"Væsentlige vilkår før handling",availabilityFailsClosed:"Tilgængelighed lukker sikkert",worthALookTitle:"Værd at se — lige uden for top tre",whyTitle:"Hvorfor disse poster vises",whyCopy:"Markedstilgængelighed, fuldstændige vilkår og kildestatus kontrolleres før rangering. Kommerciel tilgængelighed kontrolleres særskilt.",finalKicker:"Stadig her? Svaret har ikke ændret sig.",beforeClick:"Før du klikker",faqWageringQuestion:"Hvad betyder omsætningskrav?",faqWageringAnswer:"Det er den omsætning, de offentliggjorte vilkår kræver, før bonusgevinster kan hæves.",faqCommissionQuestion:"Tjener I penge, hvis jeg opretter mig?",faqCommissionAnswer:"Et egnet og markeret affiliatelink kan give provision. Det påvirker hverken vurderingen eller den redaktionelle rækkefølge.",faqWhyThreeQuestion:"Hvorfor kun tre tilbud?",faqWhyThreeAnswer:"En kort liste holder beslutningen afgrænset; Bonussiden viser hele den egnede oversigt." },
    casinos: { title:"Kasinoanmeldelser for {market} | B4GAMBLE",description:"Søg og sammenlign offentliggjorte kasinoanmeldelser i den redaktionelle kontekst for {market}.",demoTitle:"Demonstration af kasinoanmeldelser | B4GAMBLE",demoDescription:"Tydeligt markerede fiktive poster viser formatet uden aktiv kampagne eller affiliatehandling.",heroKicker:"Udvalgt for {market}",heroLead:"Kend operatøren",heroEmphasis:"før tilbuddet.",heroCopy:"Sammenlign markedstilgængelighed, licensoplysninger, betalinger, kontrolværktøjer og væsentlige vilkår.",proofEvidence:"Dokumentation og begrænsninger oplyses",proofLimit:"Højst tre pr. behov",proofPublished:"Kun aktuelle offentliggjorte data",directoryTitle:"Hele oversigten",filterTitle:"Filtrer kasinoer",noMatchesTitle:"Ingen offentliggjort anmeldelse matcher markedet og filtrene.",noMatchesCopy:"Fjern et filter, eller skift visning. B4GAMBLE fylder ikke hullet med uegnede operatører.",noPublishedTitle:"Der er endnu ingen offentliggjorte anmeldelser for {market}.",reviewOnlyNotice:"Anmeldelserne er stadig tilgængelige. Kommercielle handlinger forbliver skjult, indtil marked, tilbud og viderestilling er godkendt.",faqTitle:"Før du vælger",faqDifferenceQuestion:"Hvordan adskiller dette sig fra Bedste tilbud?",faqDifferenceAnswer:"Bedste tilbud er en afgrænset kortliste. Oversigten lader dig sammenligne alle egnede offentliggjorte anmeldelser.",faqReviewOnlyQuestion:"Hvad betyder kun anmeldelse?",faqReviewOnlyAnswer:"Den redaktionelle anmeldelse er tilgængelig, men der er ingen godkendt tilmeldingsvej for denne forespørgsel.",faqCommissionQuestion:"Påvirker provision rangeringen?",faqCommissionAnswer:"Nej. Affiliatebetaling bestemmer ikke Editor Score eller den naturlige redaktionelle rækkefølge." },
    bonuses: { title:"Sammenligning af kasinobonusser for {market} | B4GAMBLE",description:"Sammenlign offentliggjorte bonusvilkår i den redaktionelle kontekst for {market}, uden at antage kommerciel tilgængelighed.",demoTitle:"Demonstration af kasinobonusser | B4GAMBLE",demoDescription:"Tydeligt markerede fiktive poster viser, hvordan vilkår sammenlignes. De er ikke aktuelle kampagner eller partnertilbud.",heroKicker:"Bonusser · Vilkår først · 18+",heroLead:"Værdi måles",heroEmphasis:"i vilkårene.",heroCopy:"Overskriftens størrelse betyder lidt efter omsætningskravet. Sammenlign indbetaling, omsætning, begrænsninger og udløb før enhver handling.",proofTerms:"Væsentlige vilkår først",proofClaims:"Ingen løfter om garanterede penge",proofSources:"Kildestatus forbliver synlig",directoryTitle:"Alle bonusser",filterTitle:"Filtrer bonusser",sortedByValue:"sorteret efter nettoværdi",noMatchesTitle:"Ingen sammenligningsposter matcher {market} og disse filtre.",noMatchesCopy:"Fjern et filter, eller skift visning. Intet uegnet tilbud indsættes.",unavailableTitleBody:"Den offentliggjorte oversigt kunne ikke indlæses.",unavailableCopy:"Intet gemt, ældre, fiktivt eller opdigtet tilbud erstatter den.",methodKicker:"Sådan vurderer vi bonusvilkår",methodLead:"Det med småt er",methodEmphasis:"produktet.",methodCopy:"Omsætningskrav, vægtning, minimumsindbetaling og udløb afgør, hvad bonussen faktisk kan kræve.",guideAction:"Læs bonusguiden →",disclosureTitle:"18+ · Kommerciel oplysning",disclosureCopy:"B4GAMBLE kan modtage betaling fra fremtidige egnede og godkendte links. Betalingen bestemmer ikke Editor Score eller den naturlige rækkefølge. Kontrollér aktuelle vilkår og gældende lov.",disclosureAction:"Læs oplysningen →" },
    profile: { unavailableTitle:"Kasinoprofilen er ikke tilgængelig | B4GAMBLE",unavailableDescription:"Kasinoprofilen er ikke offentliggjort eller er utilgængelig.",review:"anmeldelse",operatorReview:"Operatøranmeldelse",verdict:"Vores vurdering:",offerUnavailable:"Tilbuddet er ikke tilgængeligt",currentReview:"Aktuel anmeldelse",publishedReview:"Offentliggjort anmeldelse",demoReview:"Fiktiv anmeldelsesdemonstration",demoDisclosure:"Fiktive anmeldelsesfelter; ingen aktuel operatør, licens, partneraftale eller kommerciel vej.",marketUnavailable:"Kun anmeldelse for {market}",marketUnavailableCopy:"Profilen offentliggør ikke tilgængelighed for det valgte marked. Berettigelse antages ikke, og kommercielle handlinger er ikke tilgængelige.",overview:"Overblik",offerEvidence:"Tilbud og dokumentation",questions:"Spørgsmål",quickCheck:"Kontrol på 30 sekunder",quickCheckCopy:"Vigtige offentliggjorte felter før detaljerne",bestFor:"Egnet til",whyWeLikeIt:"Derfor skiller det sig ud",thingsToKnow:"Værd at vide",founded:"Grundlagt",games:"Spil",offerTerms:"Tilbud og vilkår",evidencePaymentsTools:"Dokumentation, betalinger og kontrolværktøjer",licenceRecord:"Licensoplysning",paymentRecords:"Betalingsoplysninger",providers:"Udbydere",controlTools:"Kontrolværktøjer",keepInView:"Husk",scoreExplanation:"Redaktionel vurdering, ikke en vægtet formel",relatedTitle:"Fortsæt sammenligningen",relatedCopy:"Brug de samme dokumentationsfelter i hver anmeldelse.",compareBonusTerms:"Sammenlign offentliggjorte bonusvilkår",exploreBonusInformation:"Se bonusinformation",originalEditorialNotice:"Den redaktionelle tekst er kildestyret og vises på det sprog, den blev offentliggjort på." },
    comparison: { trayLabel:"Kasinosammenligning",selectedOfThree:"{count} af 3 valgt",chooseOneMore:"Vælg én mere at sammenligne",ready:"Sammenligningen er klar",add:"Sammenlign",open:"Åbn sammenligning",clear:"Ryd",title:"Side om side",subtitle:"De samme dokumentationsfelter for hvert kasino",close:"Luk sammenligning",loading:"Bygger sammenligningen…",unavailable:"Den valgte offentlige sammenligning er ikke tilgængelig. Ingen erstatning er indsat.",fullReview:"Fuld anmeldelse",remove:"Fjern",topScore:"Højeste vurdering",evidenceUnavailable:"Offentliggjort dokumentation til sammenligningen er ikke tilgængelig.",footer:"18+ · Tilgængelighed antages aldrig · Vurderinger er redaktionelle. Landet er en sammenligningspræference, ikke dokumentation for berettigelse." },
    outbound: { affiliateNote:"Affiliatelink · Vi kan modtage provision.",label:"02 / Bekræft ekstern vej",title:"Du forlader B4GAMBLE.",description:"Du er på vej til en ekstern spiloperatør. En egnet handling kan give B4GAMBLE provision; det ændrer ikke Editor Score eller den naturlige redaktionelle rækkefølge.",contractLabel:"Vilkår for overgangen",contractCopy:"Ingen rå destinations-URL · ingen autoritet fra browseren.",riskCopy:"18+ · Berettigelse og operatørens vilkår gælder · Spil indebærer økonomisk risiko",continueAction:"Fortsæt til godkendt partner →",cancelAction:"Annuller og bliv på B4GAMBLE",disclosureAction:"Læs affiliateoplysningen" },
    calculator: { kicker:"Hvad en bonus faktisk koster",titleLead:"Regn efter",titleEmphasis:"før du accepterer.",copy:"Indtast de annoncerede tal for at se den krævede omsætning og en illustrativ forventet omkostning.",amount:"Bonusbeløb",multiplier:"Omsætningsmultiplikator",appliesTo:"Omsætningskravet gælder",bonusOnly:"Kun bonus",depositAndBonus:"Indbetaling + bonus",gameWeight:"Dit spil tæller med",conversion:"Omregningen",slots:"Spilleautomater",tableGames:"Bordspil",requiredTurnover:"Krævet omsætning",effectiveTurnover:"Effektiv omsætning ved denne vægtning",expectedCost:"Illustrativ forventet omkostning",expectedValue:"Illustrativ forventet nettoværdi",negative:"Med disse tal er den forventede omkostning større end bonusværdien.",positive:"Med disse tal er den annoncerede bonus større end den illustrative forventede omkostning.",caveat:"Statistisk illustration, ikke en forudsigelse. Udsvingene er store, og de faktiske vilkår gælder." },
  },
  "el-GR": {
    common: { notListed:"Δεν αναφέρεται",reviewOnly:"Μόνο αξιολόγηση",actionAvailable:"Διαθέσιμη ενέργεια",noGovernedVisit:"Δεν υπάρχει εγκεκριμένη μετάβαση",readReview:"Διάβασε την αξιολόγηση",viewDemonstration:"Δες την επίδειξη",browseReviews:"Περιήγηση στις αξιολογήσεις καζίνο",reviewMethodology:"Δες τη μεθοδολογία",maximumBonus:"Μέγιστο μπόνους",maximumBet:"Μέγιστο ποντάρισμα",eligibility:"Προϋποθέσεις",activeFilters:"Ενεργά φίλτρα",applyFilters:"Εφαρμογή φίλτρων",pageOf:"Σελίδα {page} από {pages}",demoDisclosure:"Οι φανταστικές εγγραφές δεν είναι τρέχοντες πάροχοι, προσφορές συνεργατών ή ενεργές προωθητικές ενέργειες. Δεν υπάρχει προορισμός τυχερών παιχνιδιών ή συνεργατών.",reviewAvailableNoAction:"Η αξιολόγηση παραμένει διαθέσιμη, αλλά η εμπορική ενέργεια όχι.",bonusGuide:"Οδηγός μπόνους",protectedHelp:"Άνοιγμα προστατευμένης Βοήθειας",allFilters:"Όλα τα φίλτρα",directoryControls:"Στοιχεία ελέγχου καταλόγου",closeFilters:"Κλείσιμο φίλτρων",updatingResults:"Ενημέρωση αποτελεσμάτων…",materialOfferTerms:"ουσιώδεις όροι προσφοράς",commercialUnavailable:"Η εμπορική ενέργεια δεν είναι διαθέσιμη",originalSourceCopy:"Τα στοιχεία που ελέγχονται από την πηγή εμφανίζονται στη γλώσσα δημοσίευσής τους.",supported:"Υποστηρίζεται",featured:"Προτεινόμενο" },
    bestOffers: { title:"Σύγκριση προσφορών καζίνο για {market} | B4GAMBLE",description:"Μια συντακτική σύντομη λίστα για {market}, με τους ουσιώδεις όρους και την εμπορική διαθεσιμότητα πριν από κάθε ενέργεια.",unavailableTitle:"Η σύγκριση προσφορών καζίνο δεν είναι διαθέσιμη | B4GAMBLE",unavailableDescription:"Η δημοσιευμένη σύγκριση για {market} δεν είναι προσωρινά διαθέσιμη. Δεν αντικαθίσταται από αποθηκευμένη, παλιά ή επινοημένη λίστα.",heroLead:"Τρεις επιλογές.",heroEmphasis:"Όχι τριάντα.",heroKicker:"Τρέχουσα συντακτική επιλογή για {market}",heroCopy:"Οι δημοσιευμένες εγγραφές φιλτράρονται για {market}. Κάθε εμπορική ενέργεια απαιτεί ξεχωριστή έγκριση τη στιγμή του αιτήματος.",eligibleRecords:"επιλέξιμες εγγραφές",currentMarket:"συντακτική αγορά",inferredActions:"εικαζόμενες ενέργειες",rankingLink:"Πώς λειτουργεί η κατάταξη →",sectionTitle:"Οι τρεις πρώτες — πρώτα οι ουσιώδεις όροι",commissionNote:"Η B4GAMBLE μπορεί να λάβει προμήθεια από επιλέξιμο και σαφώς επισημασμένο σύνδεσμο. Η αμοιβή δεν καθορίζει το Editor Score ούτε τη φυσική συντακτική σειρά.",emptyTitle:"Δεν υπάρχουν επιλέξιμες εγγραφές για {market}.",emptyCopy:"Η B4GAMBLE δεν χρησιμοποιεί βρετανική λίστα και δεν χαλαρώνει τη μέθοδο για να γεμίσει τη σελίδα.",unavailableTitleBody:"Δεν ήταν δυνατή η φόρτωση της σύγκρισης.",unavailableCopy:"Δεν εμφανίζεται αποθηκευμένο, παλιό ή επινοημένο εμπορικό αποτέλεσμα.",demoKicker:"Φανταστική επίδειξη προϊόντος",demoCopy:"Οι φανταστικές εγγραφές δείχνουν την κατάταξη και τους ουσιώδεις όρους. Δεν είναι τρέχουσες προωθητικές ενέργειες, συνεργασίες, δοκιμές με πραγματικά χρήματα ή διαθέσιμες ενέργειες.",fictionalRecords:"φανταστικές εγγραφές",liveOffers:"ενεργές προσφορές",claimActions:"ενέργειες προσφοράς",fictionalRecordsOnly:"Μόνο φανταστικές εγγραφές",termsBeforeAction:"Ουσιώδεις όροι πριν από ενέργεια",availabilityFailsClosed:"Η διαθεσιμότητα κλείνει με ασφάλεια",worthALookTitle:"Αξίζει να δεις — λίγο έξω από την πρώτη τριάδα",whyTitle:"Γιατί εμφανίζονται αυτές οι εγγραφές",whyCopy:"Η διαθεσιμότητα αγοράς, οι πλήρεις όροι και η κατάσταση πηγής ελέγχονται πριν από την κατάταξη. Η εμπορική διαθεσιμότητα ελέγχεται ξεχωριστά.",finalKicker:"Ακόμη εδώ; Η απάντηση δεν άλλαξε.",beforeClick:"Πριν κάνεις κλικ",faqWageringQuestion:"Τι σημαίνει απαίτηση στοιχηματισμού;",faqWageringAnswer:"Είναι ο τζίρος που απαιτούν οι δημοσιευμένοι όροι πριν από την ανάληψη κερδών του μπόνους.",faqCommissionQuestion:"Κερδίζετε χρήματα αν εγγραφώ;",faqCommissionAnswer:"Ένας επιλέξιμος και επισημασμένος σύνδεσμος συνεργάτη μπορεί να αποφέρει προμήθεια. Δεν επηρεάζει την αξιολόγηση ή τη συντακτική σειρά.",faqWhyThreeQuestion:"Γιατί μόνο τρεις προσφορές;",faqWhyThreeAnswer:"Η σύντομη λίστα κρατά την απόφαση οριοθετημένη· η σελίδα Μπόνους δείχνει ολόκληρο τον επιλέξιμο κατάλογο." },
    casinos: { title:"Αξιολογήσεις καζίνο για {market} | B4GAMBLE",description:"Αναζήτησε και σύγκρινε δημοσιευμένες αξιολογήσεις στο συντακτικό πλαίσιο της αγοράς {market}.",demoTitle:"Επίδειξη αξιολογήσεων καζίνο | B4GAMBLE",demoDescription:"Σαφώς επισημασμένες φανταστικές εγγραφές δείχνουν τη μορφή χωρίς ενεργή προώθηση ή σύνδεσμο συνεργάτη.",heroKicker:"Επιλεγμένα για {market}",heroLead:"Γνώρισε τον πάροχο",heroEmphasis:"πριν από την προσφορά.",heroCopy:"Σύγκρινε διαθεσιμότητα αγοράς, στοιχεία άδειας, πληρωμές, εργαλεία ελέγχου και ουσιώδεις όρους.",proofEvidence:"Τα τεκμήρια και οι περιορισμοί δηλώνονται",proofLimit:"Έως τρία ανά περίπτωση χρήσης",proofPublished:"Μόνο τρέχοντα δημοσιευμένα δεδομένα",directoryTitle:"Πλήρης κατάλογος",filterTitle:"Φιλτράρισμα καζίνο",noMatchesTitle:"Καμία δημοσιευμένη αξιολόγηση δεν ταιριάζει με την αγορά και τα φίλτρα.",noMatchesCopy:"Αφαίρεσε ένα φίλτρο ή άλλαξε παρουσίαση. Η B4GAMBLE δεν καλύπτει το κενό με μη επιλέξιμους παρόχους.",noPublishedTitle:"Δεν υπάρχουν ακόμη δημοσιευμένες αξιολογήσεις για {market}.",reviewOnlyNotice:"Οι αξιολογήσεις παραμένουν διαθέσιμες. Οι εμπορικές ενέργειες παραμένουν κρυφές μέχρι να εγκριθούν αγορά, προσφορά και ανακατεύθυνση.",faqTitle:"Πριν επιλέξεις",faqDifferenceQuestion:"Ποια είναι η διαφορά από τις Καλύτερες προσφορές;",faqDifferenceAnswer:"Οι Καλύτερες προσφορές είναι μια οριοθετημένη λίστα. Ο κατάλογος διατηρεί όλες τις επιλέξιμες δημοσιευμένες αξιολογήσεις διαθέσιμες για σύγκριση.",faqReviewOnlyQuestion:"Τι σημαίνει μόνο αξιολόγηση;",faqReviewOnlyAnswer:"Η συντακτική αξιολόγηση είναι διαθέσιμη, αλλά δεν υπάρχει εγκεκριμένη διαδρομή εγγραφής για αυτό το αίτημα.",faqCommissionQuestion:"Επηρεάζει η προμήθεια την κατάταξη;",faqCommissionAnswer:"Όχι. Η αμοιβή συνεργάτη δεν καθορίζει το Editor Score ή τη φυσική συντακτική σειρά." },
    bonuses: { title:"Σύγκριση μπόνους καζίνο για {market} | B4GAMBLE",description:"Σύγκρινε δημοσιευμένους όρους μπόνους στο συντακτικό πλαίσιο της αγοράς {market}, χωρίς να θεωρείται δεδομένη η εμπορική διαθεσιμότητα.",demoTitle:"Επίδειξη μπόνους καζίνο | B4GAMBLE",demoDescription:"Σαφώς επισημασμένες φανταστικές εγγραφές δείχνουν πώς συγκρίνονται οι όροι. Δεν είναι τρέχουσες προωθητικές ενέργειες ή προσφορές συνεργατών.",heroKicker:"Μπόνους · Πρώτα οι όροι · 18+",heroLead:"Η αξία μετριέται",heroEmphasis:"στους όρους.",heroCopy:"Το μεγάλο ποσό της επικεφαλίδας λέει λίγα μετά την απαίτηση στοιχηματισμού. Σύγκρινε κατάθεση, τζίρο, περιορισμούς και λήξη πριν από κάθε ενέργεια.",proofTerms:"Πρώτα οι ουσιώδεις όροι",proofClaims:"Χωρίς υποσχέσεις εγγυημένων χρημάτων",proofSources:"Η κατάσταση πηγής παραμένει ορατή",directoryTitle:"Όλα τα μπόνους",filterTitle:"Φιλτράρισμα μπόνους",sortedByValue:"ταξινόμηση κατά καθαρή αξία",noMatchesTitle:"Καμία εγγραφή δεν ταιριάζει με {market} και αυτά τα φίλτρα.",noMatchesCopy:"Αφαίρεσε ένα φίλτρο ή άλλαξε παρουσίαση. Δεν εισάγεται μη επιλέξιμη προσφορά.",unavailableTitleBody:"Δεν ήταν δυνατή η φόρτωση του δημοσιευμένου καταλόγου.",unavailableCopy:"Δεν αντικαθίσταται από αποθηκευμένη, παλιά, φανταστική ή επινοημένη προσφορά.",methodKicker:"Πώς αξιολογούμε τους όρους μπόνους",methodLead:"Τα ψιλά γράμματα είναι",methodEmphasis:"το προϊόν.",methodCopy:"Η απαίτηση στοιχηματισμού, η στάθμιση, η ελάχιστη κατάθεση και η λήξη καθορίζουν τι μπορεί πραγματικά να απαιτεί ένα μπόνους.",guideAction:"Διάβασε τον οδηγό μπόνους →",disclosureTitle:"18+ · Εμπορική γνωστοποίηση",disclosureCopy:"Η B4GAMBLE μπορεί να λάβει αμοιβή από μελλοντικούς επιλέξιμους και εγκεκριμένους συνδέσμους. Δεν καθορίζει το Editor Score ή τη φυσική σειρά. Έλεγξε τους τρέχοντες όρους και το εφαρμοστέο δίκαιο.",disclosureAction:"Διάβασε τη γνωστοποίηση →" },
    profile: { unavailableTitle:"Το προφίλ καζίνο δεν είναι διαθέσιμο | B4GAMBLE",unavailableDescription:"Το προφίλ δεν είναι δημοσιευμένο ή δεν είναι διαθέσιμο.",review:"αξιολόγηση",operatorReview:"Αξιολόγηση παρόχου",verdict:"Η κρίση μας:",offerUnavailable:"Η προσφορά δεν είναι διαθέσιμη",currentReview:"Τρέχουσα αξιολόγηση",publishedReview:"Δημοσιευμένη αξιολόγηση",demoReview:"Φανταστική επίδειξη αξιολόγησης",demoDisclosure:"Φανταστικά πεδία αξιολόγησης· δεν αντιπροσωπεύουν τρέχοντα πάροχο, άδεια, προσφορά συνεργάτη ή εμπορική μετάβαση.",marketUnavailable:"Μόνο αξιολόγηση για {market}",marketUnavailableCopy:"Το προφίλ δεν δημοσιεύει διαθεσιμότητα για την επιλεγμένη αγορά. Δεν συνάγεται επιλεξιμότητα και δεν υπάρχει εμπορική ενέργεια.",overview:"Επισκόπηση",offerEvidence:"Προσφορά και τεκμήρια",questions:"Ερωτήσεις",quickCheck:"Έλεγχος 30 δευτερολέπτων",quickCheckCopy:"Βασικά δημοσιευμένα στοιχεία πριν από τις λεπτομέρειες",bestFor:"Κατάλληλο για",whyWeLikeIt:"Γιατί ξεχωρίζει",thingsToKnow:"Τι πρέπει να γνωρίζεις",founded:"Ίδρυση",games:"Παιχνίδια",offerTerms:"Προσφορά και όροι",evidencePaymentsTools:"Τεκμήρια, πληρωμές και εργαλεία ελέγχου",licenceRecord:"Στοιχείο άδειας",paymentRecords:"Στοιχεία πληρωμών",providers:"Πάροχοι",controlTools:"Εργαλεία ελέγχου",keepInView:"Να θυμάσαι",scoreExplanation:"Συντακτική κρίση, όχι σταθμισμένος τύπος",relatedTitle:"Συνέχισε τη σύγκριση",relatedCopy:"Χρησιμοποίησε τα ίδια πεδία τεκμηρίων σε κάθε αξιολόγηση.",compareBonusTerms:"Σύγκρινε δημοσιευμένους όρους μπόνους",exploreBonusInformation:"Δες πληροφορίες για μπόνους",originalEditorialNotice:"Το συντακτικό κείμενο ελέγχεται από την πηγή και εμφανίζεται στη γλώσσα δημοσίευσής του." },
    comparison: { trayLabel:"Σύγκριση καζίνο",selectedOfThree:"{count} από 3 επιλεγμένα",chooseOneMore:"Επίλεξε ακόμη ένα για σύγκριση",ready:"Η σύγκριση είναι έτοιμη",add:"Σύγκριση",open:"Άνοιγμα σύγκρισης",clear:"Εκκαθάριση",title:"Δίπλα δίπλα",subtitle:"Τα ίδια πεδία τεκμηρίων για κάθε καζίνο",close:"Κλείσιμο σύγκρισης",loading:"Δημιουργία σύγκρισης…",unavailable:"Η επιλεγμένη δημόσια σύγκριση δεν είναι διαθέσιμη. Δεν έχει εισαχθεί υποκατάστατο.",fullReview:"Πλήρης αξιολόγηση",remove:"Αφαίρεση",topScore:"Υψηλότερη βαθμολογία",evidenceUnavailable:"Τα δημοσιευμένα τεκμήρια σύγκρισης δεν είναι διαθέσιμα.",footer:"18+ · Η διαθεσιμότητα δεν θεωρείται ποτέ δεδομένη · Οι βαθμολογίες είναι συντακτικές. Η χώρα είναι προτίμηση σύγκρισης, όχι απόδειξη επιλεξιμότητας." },
    outbound: { affiliateNote:"Σύνδεσμος συνεργάτη · Μπορεί να λάβουμε προμήθεια.",label:"02 / Επιβεβαίωση εξωτερικής μετάβασης",title:"Αποχωρείς από τη B4GAMBLE.",description:"Πρόκειται να επισκεφθείς εξωτερικό πάροχο τυχερών παιχνιδιών. Μια επιλέξιμη ενέργεια μπορεί να αποφέρει προμήθεια στη B4GAMBLE· αυτό δεν αλλάζει το Editor Score ή τη φυσική συντακτική σειρά.",contractLabel:"Όροι μετάβασης",contractCopy:"Χωρίς εμφανή URL προορισμού · χωρίς εξουσιοδότηση από το πρόγραμμα περιήγησης.",riskCopy:"18+ · Ισχύουν οι προϋποθέσεις και οι όροι του παρόχου · Τα τυχερά παιχνίδια ενέχουν οικονομικό κίνδυνο",continueAction:"Συνέχεια σε επιλέξιμο συνεργάτη →",cancelAction:"Ακύρωση και παραμονή στη B4GAMBLE",disclosureAction:"Δες τη γνωστοποίηση συνεργατών" },
    calculator: { kicker:"Τι κοστίζει πραγματικά ένα μπόνους",titleLead:"Κάνε τον υπολογισμό",titleEmphasis:"πριν το δεχτείς.",copy:"Καταχώρισε τα διαφημιζόμενα στοιχεία για να δεις τον απαιτούμενο τζίρο και ένα ενδεικτικό αναμενόμενο κόστος.",amount:"Ποσό μπόνους",multiplier:"Πολλαπλασιαστής στοιχηματισμού",appliesTo:"Η απαίτηση ισχύει για",bonusOnly:"Μόνο μπόνους",depositAndBonus:"Κατάθεση + μπόνους",gameWeight:"Το παιχνίδι υπολογίζεται κατά",conversion:"Η μετατροπή",slots:"Κουλοχέρηδες",tableGames:"Επιτραπέζια παιχνίδια",requiredTurnover:"Απαιτούμενος τζίρος",effectiveTurnover:"Πραγματικός τζίρος με αυτή τη στάθμιση",expectedCost:"Ενδεικτικό αναμενόμενο κόστος",expectedValue:"Ενδεικτική αναμενόμενη καθαρή αξία",negative:"Με αυτά τα στοιχεία, το αναμενόμενο κόστος υπερβαίνει την αξία του μπόνους.",positive:"Με αυτά τα στοιχεία, το διαφημιζόμενο μπόνους υπερβαίνει το ενδεικτικό αναμενόμενο κόστος.",caveat:"Στατιστική απεικόνιση, όχι πρόβλεψη. Η διακύμανση είναι μεγάλη και ισχύουν οι πραγματικοί όροι." },
  },
} satisfies Record<"es-ES" | "sv-SE" | "da-DK" | "el-GR", ProductPageOverrides>;

const languageQualityOverrides = {
  "en-GB": {
    common: {
      actionAvailable: "Partner link available",
      noGovernedVisit: "No partner link available",
      demoDisclosure: "Fictional product records are not current operators, partner offers or live promotions. No link to a gambling operator or affiliate partner is available.",
      marketPresentationNotice: "Changing the selected market only changes the editorial content shown. It does not confirm your location, eligibility or whether an offer is available.",
      reviewAvailableNoAction: "The review remains available, but there is no partner link.",
      commercialUnavailable: "No partner link available",
      originalSourceCopy: "Facts from original sources remain in the language in which they were published.",
    },
    bestOffers: {
      heroCopy: "Published records are filtered for {market}. Partner links appear only when they are available for this visit.",
      inferredActions: "partner links",
      demoCopy: "Fictional records show ranking and material-term presentation. They are not current promotions or partner offers, and none links to a gambling operator.",
      claimActions: "offer links",
      availabilityFailsClosed: "No partner links available",
      commissionNote: "B4GAMBLE may earn commission when a clearly labelled affiliate link is available and used. This does not affect the editorial score or ranking.",
      faqCommissionAnswer: "B4GAMBLE may earn commission when a clearly labelled affiliate link is available and used. This does not affect the editorial score or ranking.",
    },
    casinos: {
      heroCopy: "Choose what matters to you; the directory shows published reviews for the selected market. An available review does not mean there is a partner offer.",
      reviewOnlyNotice: "Reviews remain available. Partner links appear only when the market, offer and destination are available.",
      faqReviewOnlyAnswer: "The editorial review is available, but there is currently no partner link.",
      faqCommissionAnswer: "No. Affiliate compensation does not determine Editor Score or natural editorial ranking.",
    },
    bonuses: {
      disclosureCopy: "B4GAMBLE may receive compensation if a future, clearly labelled affiliate link is available and used. Compensation does not determine the editorial score or ranking. Check current operator terms and local law before acting.",
    },
    profile: {
      demoDisclosure: "Fictional review fields; they do not describe a current operator, licence or partner offer, and no partner link is available.",
      marketUnavailableCopy: "This profile does not show offer availability for the selected market. The review remains available, but there is no partner link.",
      originalEditorialNotice: "The editorial review comes from the published source and is shown in its original language.",
    },
    comparison: {},
    outbound: {
      label: "02 / Leaving B4GAMBLE",
      contractLabel: "Destination check",
      description: "You are about to visit a third-party gambling operator. If you continue through an affiliate link, B4GAMBLE may earn commission. This does not affect the editorial score or ranking.",
      contractCopy: "B4GAMBLE checks the destination link before you leave the site.",
      continueAction: "Continue to operator →",
    },
    calculator: { titleEmphasis: "before you accept." },
  },
  "de-DE": {
    common: {
      actionAvailable: "Partnerlink verfügbar",
      noGovernedVisit: "Kein Partnerlink verfügbar",
      demoDisclosure: "Fiktive Produktdaten sind keine aktuellen Anbieter, Partnerangebote oder laufenden Aktionen. Es ist kein Link zu einem Glücksspielanbieter oder Affiliate-Partner verfügbar.",
      marketPresentationNotice: "Die Marktauswahl ändert nur die angezeigten redaktionellen Inhalte. Sie bestätigt weder deinen Standort noch deine Berechtigung oder die Verfügbarkeit eines Angebots.",
      reviewAvailableNoAction: "Die Bewertung bleibt verfügbar, aber es gibt keinen Partnerlink.",
      cryptoSupported: "Kryptowährungen werden unterstützt.",
      visitAvailability: "Verfügbarkeit des Partnerlinks",
      breadcrumb: "Navigationspfad",
      commercialUnavailable: "Kein Partnerlink verfügbar",
      originalSourceCopy: "Angaben aus Originalquellen bleiben in der Sprache ihrer Veröffentlichung.",
    },
    bestOffers: {
      description: "Eine redaktionelle Auswahlliste für {market}, mit wesentlichen Bedingungen und Verfügbarkeit vor dem Klick.",
      heroCopy: "Veröffentlichte Einträge werden für {market} gefiltert. Partnerlinks erscheinen nur, wenn sie für diesen Besuch verfügbar sind.",
      inferredActions: "Partnerlinks",
      commissionNote: "B4GAMBLE kann Provision erhalten, wenn du einen verfügbaren und klar gekennzeichneten Affiliate-Link nutzt. Dies beeinflusst weder die redaktionelle Bewertung noch die Rangfolge.",
      demoCopy: "Fiktive Einträge zeigen das Ranking und wesentliche Bedingungen. Sie sind keine aktuellen Aktionen oder Partnerangebote und führen nicht zu einem Glücksspielanbieter.",
      claimActions: "Angebotslinks",
      availabilityFailsClosed: "Keine Partnerlinks verfügbar",
      faqCommissionAnswer: "B4GAMBLE kann Provision erhalten, wenn du einen verfügbaren und klar gekennzeichneten Affiliate-Link nutzt. Dies beeinflusst weder die redaktionelle Bewertung noch die Rangfolge.",
    },
    casinos: {
      heroLead: "Prüfe den Anbieter",
      proofEvidence: "Nachweise und Grenzen offengelegt",
      reviewOnlyNotice: "Bewertungen bleiben verfügbar. Partnerlinks erscheinen nur, wenn Markt, Angebot und Ziel aktuell verfügbar sind.",
      faqDifferenceQuestion: "Wie unterscheidet sich das von „Beste Angebote“?",
      faqDifferenceAnswer: "Beste Angebote ist eine klar begrenzte Auswahl. In diesem Verzeichnis kannst du alle geeigneten veröffentlichten Bewertungen vergleichen.",
      faqReviewOnlyAnswer: "Die redaktionelle Bewertung ist verfügbar, aber es gibt aktuell keinen Partnerlink.",
      faqCommissionAnswer: "Nein. Provisionen beeinflussen weder den Editor Score noch die redaktionelle Rangfolge.",
    },
    bonuses: {
      demoDescription: "Fiktive Einträge zeigen, wie Bedingungen verglichen werden. Sie sind keine aktuellen Aktionen oder Partnerangebote.",
      heroCopy: "Der hervorgehobene Betrag sagt wenig aus, sobald die Umsatzbedingung berücksichtigt wird. Vergleiche Einzahlung, erforderlichen Umsatz, Einschränkungen und Ablauf.",
      methodCopy: "Umsatzbedingung, Spielgewichtung, Mindesteinzahlung und Ablauf bestimmen, was ein Bonus tatsächlich voraussetzt.",
      disclosureCopy: "B4GAMBLE kann Provision erhalten, wenn künftig ein verfügbarer und klar gekennzeichneter Affiliate-Link genutzt wird. Dies beeinflusst weder die redaktionelle Bewertung noch die Rangfolge. Prüfe die aktuellen Bedingungen und das geltende Recht.",
    },
    profile: {
      demoDisclosure: "Fiktive Bewertungsfelder; sie beschreiben keinen aktuellen Anbieter, keine Lizenz und kein Partnerangebot. Ein Partnerlink ist nicht verfügbar.",
      marketUnavailableCopy: "Dieses Profil zeigt für den gewählten Markt keine Angebotsverfügbarkeit. Die Bewertung bleibt verfügbar, aber es gibt keinen Partnerlink.",
      offerEvidence: "Angebot & Nachweise",
      founded: "Gründungsjahr",
      evidencePaymentsTools: "Nachweise, Zahlungen & Kontrollwerkzeuge",
      relatedCopy: "Vergleiche in jeder Bewertung dieselben Angaben.",
      originalEditorialNotice: "Der redaktionelle Text stammt aus der veröffentlichten Quelle und wird in deren Sprache angezeigt.",
    },
    comparison: {
      chooseOneMore: "Wähle noch einen Anbieter zum Vergleichen.",
      subtitle: "Dieselben Angaben für jeden Anbieter",
      evidenceUnavailable: "Veröffentlichte Vergleichsdaten sind nicht verfügbar.",
    },
    outbound: {
      label: "02 / B4GAMBLE verlassen",
      contractLabel: "Zielprüfung",
      description: "Du besuchst gleich einen externen Glücksspielanbieter. Wenn du über einen Affiliate-Link weitergehst, kann B4GAMBLE Provision erhalten. Dies beeinflusst weder die redaktionelle Bewertung noch die Rangfolge.",
      contractCopy: "B4GAMBLE prüft den Ziel-Link, bevor du die Website verlässt.",
      continueAction: "Weiter zum Anbieter →",
    },
    calculator: {},
  },
  "es-ES": {
    common: {
      actionAvailable: "Enlace de socio disponible",
      noGovernedVisit: "No hay enlace de socio disponible",
      demoDisclosure: "Los registros ficticios no son operadores actuales, ofertas de socios ni promociones activas. No hay ningún enlace a un operador o socio afiliado.",
      marketPresentationNotice: "Cambiar el mercado seleccionado solo modifica el contenido editorial que ves. No confirma tu ubicación, si cumples los requisitos ni si hay una oferta disponible.",
      reviewAvailableNoAction: "La reseña sigue disponible, pero no hay enlace de socio.",
      editorScore: "Editor Score",
      cryptoSupported: "Admite criptomonedas",
      visitAvailability: "Disponibilidad del enlace",
      saferGamblingInformation: "Información sobre juego seguro",
      commercialUnavailable: "No hay enlace de socio disponible",
      originalSourceCopy: "Los datos de fuentes originales se muestran en el idioma en el que se publicaron.",
    },
    bestOffers: {
      heroCopy: "Los registros publicados se filtran para {market}. Los enlaces a ofertas solo aparecen cuando están disponibles para esa visita.",
      eligibleRecords: "resultados disponibles",
      inferredActions: "enlaces de socios",
      commissionNote: "B4GAMBLE puede recibir una comisión si utilizas un enlace de afiliación disponible y claramente identificado. Esto no influye en la puntuación ni en el orden editorial.",
      emptyTitle: "No hay resultados disponibles para {market}.",
      demoCopy: "Los registros ficticios muestran la clasificación y las condiciones esenciales. No son promociones ni ofertas de socios actuales y no enlazan a ningún operador.",
      claimActions: "enlaces de ofertas",
      availabilityFailsClosed: "No hay enlaces disponibles",
      faqCommissionAnswer: "B4GAMBLE puede recibir una comisión si utilizas un enlace de afiliación disponible y claramente identificado. Esto no influye en la puntuación ni en el orden editorial.",
      faqWhyThreeAnswer: "Una lista breve facilita la decisión; la página de Bonos reúne todas las opciones disponibles.",
    },
    casinos: {
      noMatchesCopy: "Quita un filtro o cambia la presentación. B4GAMBLE no rellena el hueco con operadores que no cumplen los criterios.",
      reviewOnlyNotice: "Las reseñas siguen disponibles. Los enlaces de socios solo aparecen cuando el mercado, la oferta y el destino están disponibles.",
      faqDifferenceAnswer: "Mejores ofertas es una selección breve. Este directorio permite comparar todas las reseñas publicadas disponibles.",
      faqReviewOnlyAnswer: "La reseña editorial está disponible, pero ahora mismo no hay enlace de socio.",
      faqCommissionAnswer: "No. Las comisiones no influyen en Editor Score ni en el orden editorial.",
    },
    bonuses: {
      heroCopy: "La cifra principal dice poco cuando se tiene en cuenta el requisito de apuesta. Compara el depósito, el volumen de apuesta, las restricciones y la caducidad.",
      disclosureCopy: "B4GAMBLE puede recibir una comisión si en el futuro utilizas un enlace de afiliación disponible y claramente identificado. Esto no influye en la puntuación ni en el orden editorial. Comprueba las condiciones actuales y la ley aplicable.",
    },
    profile: {
      demoDisclosure: "Campos ficticios: no describen un operador actual, una licencia ni una oferta de socio. No hay enlace de socio disponible.",
      marketUnavailableCopy: "Este perfil no muestra ofertas disponibles para el mercado seleccionado. La reseña sigue disponible, pero no hay enlace de socio.",
      offerEvidence: "Oferta y datos",
      founded: "Año de fundación",
      evidencePaymentsTools: "Datos, pagos y herramientas de control",
      relatedCopy: "Compara los mismos datos en cada reseña.",
      originalEditorialNotice: "El texto editorial procede de la fuente publicada y se muestra en su idioma original.",
    },
    comparison: {
      title: "Comparación lado a lado",
      subtitle: "Los mismos datos para cada casino",
      evidenceUnavailable: "Los datos publicados para la comparación no están disponibles.",
    },
    outbound: {
      label: "02 / Salida de B4GAMBLE",
      contractLabel: "Comprobación del destino",
      description: "Estás a punto de visitar a un operador externo. Si continúas mediante un enlace de afiliación, B4GAMBLE puede recibir una comisión. Esto no influye en la puntuación ni en el orden editorial.",
      contractCopy: "B4GAMBLE comprueba el enlace de destino antes de que salgas del sitio.",
      continueAction: "Continuar al operador →",
    },
    calculator: {
      copy: "Introduce las cifras anunciadas para ver el volumen de juego requerido y una estimación del coste de completar el requisito.",
      expectedCost: "Coste estimado para completar el requisito",
      caveat: "Ilustración estadística, no una predicción. La variación es amplia y prevalecen las condiciones reales.",
    },
  },
  "sv-SE": {
    common: {
      actionAvailable: "Partnerlänk tillgänglig",
      noGovernedVisit: "Ingen partnerlänk tillgänglig",
      expiry: "Giltighetstid",
      demoDisclosure: "Fiktiva produktposter är inte aktuella operatörer, partnererbjudanden eller kampanjer. Det finns ingen länk till en speloperatör eller affiliatepartner.",
      marketPresentationNotice: "Marknadsvalet ändrar bara vilket redaktionellt innehåll som visas. Det bekräftar inte var du befinner dig, om du uppfyller villkoren eller om ett erbjudande är tillgängligt.",
      reviewAvailableNoAction: "Recensionen finns kvar, men det finns ingen partnerlänk.",
      editorScore: "Editor Score",
      commercialUnavailable: "Ingen partnerlänk tillgänglig",
      originalSourceCopy: "Uppgifter från originalkällor visas på det språk där de publicerades.",
    },
    bestOffers: {
      description: "Ett redaktionellt urval för {market}, där väsentliga villkor och tillgänglighet visas innan du går vidare.",
      heroCopy: "Publicerade poster filtreras för {market}. Partnerlänkar visas bara när de är tillgängliga för det aktuella besöket.",
      eligibleRecords: "matchande poster",
      inferredActions: "partnerlänkar",
      commissionNote: "B4GAMBLE kan få provision om du använder en tillgänglig och tydligt märkt affiliatelänk. Det påverkar varken betyget eller den redaktionella ordningen.",
      emptyTitle: "Inga matchande poster för {market}.",
      emptyCopy: "B4GAMBLE ersätter inte detta med en brittisk lista och luckrar inte upp metoden.",
      demoCopy: "Fiktiva poster visar rankning och väsentliga villkor. De är inte aktuella kampanjer eller partnererbjudanden och länkar inte till någon speloperatör.",
      claimActions: "erbjudandelänkar",
      availabilityFailsClosed: "Inga partnerlänkar tillgängliga",
      faqCommissionAnswer: "B4GAMBLE kan få provision om du använder en tillgänglig och tydligt märkt affiliatelänk. Det påverkar varken betyget eller den redaktionella ordningen.",
      faqWhyThreeAnswer: "En kort lista gör valet överskådligt; Bonussidan visar alla tillgängliga alternativ.",
    },
    casinos: {
      demoDescription: "Tydligt märkta fiktiva poster visar formatet utan en aktuell kampanj eller affiliatelänk.",
      proofEvidence: "Underlag och begränsningar redovisas",
      noMatchesCopy: "Ta bort ett filter eller byt visning. B4GAMBLE fyller inte luckan med operatörer som inte uppfyller kraven.",
      reviewOnlyNotice: "Recensionerna finns kvar. Partnerlänkar visas bara när marknad, erbjudande och destination är tillgängliga.",
      faqReviewOnlyAnswer: "Den redaktionella recensionen är tillgänglig, men det finns ingen partnerlänk just nu.",
      faqCommissionAnswer: "Nej. Provision påverkar varken Editor Score eller den redaktionella ordningen.",
    },
    bonuses: {
      heroCopy: "Det framhävda beloppet säger lite när omsättningskravet räknas in. Jämför insättning, omsättning, begränsningar och giltighetstid innan du går vidare.",
      noMatchesCopy: "Ta bort ett filter eller byt visning. Inget erbjudande som inte uppfyller kriterierna används som ersättning.",
      disclosureCopy: "B4GAMBLE kan få provision om du i framtiden använder en tillgänglig och tydligt märkt affiliatelänk. Det påverkar varken betyget eller den redaktionella ordningen. Kontrollera aktuella villkor och gällande lag.",
    },
    profile: {
      demoDisclosure: "Fiktiva recensionsfält; de beskriver inte en aktuell operatör, licens eller ett partnererbjudande. Ingen partnerlänk är tillgänglig.",
      marketUnavailableCopy: "Profilen visar inga tillgängliga erbjudanden för den valda marknaden. Recensionen finns kvar, men det finns ingen partnerlänk.",
      offerEvidence: "Erbjudande och underlag",
      evidencePaymentsTools: "Underlag, betalningar och kontrollverktyg",
      relatedCopy: "Jämför samma uppgifter i varje recension.",
      originalEditorialNotice: "Den redaktionella texten kommer från den publicerade källan och visas på originalspråket.",
    },
    comparison: {
      subtitle: "Samma uppgifter för varje casino",
      evidenceUnavailable: "De publicerade jämförelseuppgifterna är inte tillgängliga.",
    },
    outbound: {
      label: "02 / Lämna B4GAMBLE",
      contractLabel: "Kontroll av destination",
      description: "Du är på väg till en extern speloperatör. Om du fortsätter via en affiliatelänk kan B4GAMBLE få provision. Det påverkar varken betyget eller den redaktionella ordningen.",
      contractCopy: "B4GAMBLE kontrollerar destinationslänken innan du lämnar webbplatsen.",
      continueAction: "Fortsätt till operatören →",
    },
    calculator: { positive: "Med dessa värden är det annonserade bonusbeloppet större än den beräknade förväntade kostnaden." },
  },
  "da-DK": {
    common: {
      actionAvailable: "Partnerlink tilgængeligt",
      noGovernedVisit: "Intet partnerlink tilgængeligt",
      demoDisclosure: "Fiktive produktposter er ikke aktuelle operatører, partnertilbud eller kampagner. Der er intet link til en spiloperatør eller affiliatepartner.",
      marketPresentationNotice: "Markedsvalget ændrer kun det redaktionelle indhold, du ser. Det bekræfter ikke din placering, om du opfylder kravene, eller om et tilbud er tilgængeligt.",
      reviewAvailableNoAction: "Anmeldelsen er stadig tilgængelig, men der er intet partnerlink.",
      editorScore: "Editor Score",
      commercialUnavailable: "Intet partnerlink tilgængeligt",
      originalSourceCopy: "Oplysninger fra originalkilder vises på det sprog, de blev offentliggjort på.",
    },
    bestOffers: {
      description: "En redaktionel kortliste for {market}, hvor væsentlige vilkår og tilgængelighed vises, før du går videre.",
      heroCopy: "Offentliggjorte poster filtreres for {market}. Partnerlinks vises kun, når de er tilgængelige for det aktuelle besøg.",
      eligibleRecords: "matchende poster",
      inferredActions: "partnerlinks",
      commissionNote: "B4GAMBLE kan modtage provision, hvis du bruger et tilgængeligt og tydeligt markeret affiliatelink. Det påvirker hverken vurderingen eller den redaktionelle rækkefølge.",
      emptyTitle: "Ingen matchende poster for {market}.",
      emptyCopy: "B4GAMBLE erstatter ikke dette med en britisk liste og lemper ikke metoden.",
      demoCopy: "Fiktive poster viser rangering og væsentlige vilkår. De er ikke aktuelle kampagner eller partnertilbud og linker ikke til en spiloperatør.",
      claimActions: "tilbudslinks",
      availabilityFailsClosed: "Ingen partnerlinks tilgængelige",
      faqCommissionAnswer: "B4GAMBLE kan modtage provision, hvis du bruger et tilgængeligt og tydeligt markeret affiliatelink. Det påvirker hverken vurderingen eller den redaktionelle rækkefølge.",
      faqWhyThreeAnswer: "En kort liste gør valget overskueligt; Bonussiden viser alle tilgængelige muligheder.",
    },
    casinos: {
      demoDescription: "Tydeligt markerede fiktive poster viser formatet uden en aktuel kampagne eller et affiliatelink.",
      noMatchesCopy: "Fjern et filter, eller skift visning. B4GAMBLE fylder ikke hullet med operatører, der ikke opfylder kravene.",
      reviewOnlyNotice: "Anmeldelserne er stadig tilgængelige. Partnerlinks vises kun, når marked, tilbud og destination er tilgængelige.",
      faqReviewOnlyAnswer: "Den redaktionelle anmeldelse er tilgængelig, men der er intet partnerlink lige nu.",
      faqCommissionAnswer: "Nej. Provision påvirker hverken Editor Score eller den redaktionelle rækkefølge.",
    },
    bonuses: {
      heroCopy: "Beløbet i overskriften betyder mindre, når omsætningskravet regnes med. Sammenlign indbetaling, omsætning, begrænsninger og udløb.",
      noMatchesCopy: "Fjern et filter, eller skift visning. Intet tilbud, der ikke opfylder kravene, bruges som erstatning.",
      disclosureCopy: "B4GAMBLE kan modtage provision, hvis du fremover bruger et tilgængeligt og tydeligt markeret affiliatelink. Det påvirker hverken vurderingen eller den redaktionelle rækkefølge. Kontrollér aktuelle vilkår og gældende lov.",
    },
    profile: {
      demoDisclosure: "Fiktive anmeldelsesfelter; de beskriver ikke en aktuel operatør, licens eller et partnertilbud. Intet partnerlink er tilgængeligt.",
      marketUnavailableCopy: "Profilen viser ingen tilgængelige tilbud for det valgte marked. Anmeldelsen er stadig tilgængelig, men der er intet partnerlink.",
      originalEditorialNotice: "Den redaktionelle tekst kommer fra den offentliggjorte kilde og vises på originalsproget.",
    },
    comparison: {},
    outbound: {
      label: "02 / Forlad B4GAMBLE",
      contractLabel: "Kontrol af destination",
      description: "Du er på vej til en ekstern spiloperatør. Hvis du fortsætter via et affiliatelink, kan B4GAMBLE modtage provision. Det påvirker hverken vurderingen eller den redaktionelle rækkefølge.",
      contractCopy: "B4GAMBLE kontrollerer destinationslinket, før du forlader websitet.",
      continueAction: "Fortsæt til operatøren →",
    },
    calculator: {},
  },
  "el-GR": {
    common: {
      actionAvailable: "Διαθέσιμος σύνδεσμος συνεργάτη",
      noGovernedVisit: "Δεν υπάρχει διαθέσιμος σύνδεσμος",
      browseReviews: "Δες αξιολογήσεις καζίνο",
      clearAll: "Καθάρισε όλα τα φίλτρα",
      applyFilters: "Εφάρμοσε τα φίλτρα",
      demoDisclosure: "Οι φανταστικές εγγραφές δεν είναι τρέχοντες πάροχοι, προσφορές συνεργατών ή ενεργές προωθητικές ενέργειες. Δεν υπάρχει σύνδεσμος προς πάροχο τυχερών παιχνιδιών ή συνεργάτη.",
      marketPresentationNotice: "Η επιλογή αγοράς αλλάζει μόνο το συντακτικό περιεχόμενο που βλέπεις. Δεν επιβεβαιώνει την τοποθεσία σου, αν πληροίς τις προϋποθέσεις ή αν υπάρχει διαθέσιμη προσφορά.",
      reviewAvailableNoAction: "Η αξιολόγηση παραμένει διαθέσιμη, όχι όμως και σύνδεσμος συνεργάτη.",
      editorScore: "Editor Score",
      protectedHelp: "Άνοιξε την προστατευμένη Βοήθεια",
      closeFilters: "Κλείσε τα φίλτρα",
      commercialUnavailable: "Δεν υπάρχει διαθέσιμος σύνδεσμος συνεργάτη",
      originalSourceCopy: "Τα στοιχεία από τις αρχικές πηγές εμφανίζονται στη γλώσσα στην οποία δημοσιεύτηκαν.",
    },
    bestOffers: {
      unavailableDescription: "Η δημοσιευμένη σύγκριση για {market} είναι προσωρινά μη διαθέσιμη. Δεν αντικαθίσταται από αποθηκευμένη, παλιά ή επινοημένη λίστα.",
      description: "Μια σύντομη συντακτική λίστα για {market}, με τους ουσιώδεις όρους και τη διαθεσιμότητα πριν επιλέξεις.",
      heroCopy: "Οι δημοσιευμένες εγγραφές φιλτράρονται για {market}. Οι σύνδεσμοι προσφορών εμφανίζονται μόνο όταν είναι διαθέσιμοι για τη συγκεκριμένη επίσκεψη.",
      eligibleRecords: "εγγραφές που πληρούν τα κριτήρια",
      inferredActions: "σύνδεσμοι συνεργατών",
      commissionNote: "Η B4GAMBLE μπορεί να λάβει προμήθεια αν χρησιμοποιήσεις έναν διαθέσιμο σύνδεσμο συνεργάτη με σαφή επισήμανση. Αυτό δεν επηρεάζει τη συντακτική βαθμολογία ή την κατάταξη.",
      emptyTitle: "Δεν υπάρχουν εγγραφές που πληρούν τα κριτήρια για {market}.",
      demoCopy: "Οι φανταστικές εγγραφές δείχνουν την κατάταξη και τους ουσιώδεις όρους. Δεν είναι τρέχουσες προωθητικές ενέργειες ή προσφορές συνεργατών και δεν οδηγούν σε πάροχο τυχερών παιχνιδιών.",
      claimActions: "σύνδεσμοι προσφορών",
      availabilityFailsClosed: "Δεν υπάρχουν διαθέσιμοι σύνδεσμοι",
      faqCommissionAnswer: "Η B4GAMBLE μπορεί να λάβει προμήθεια αν χρησιμοποιήσεις έναν διαθέσιμο σύνδεσμο συνεργάτη με σαφή επισήμανση. Αυτό δεν επηρεάζει τη συντακτική βαθμολογία ή την κατάταξη.",
      faqWhyThreeAnswer: "Μια σύντομη λίστα κάνει την επιλογή πιο ξεκάθαρη· η σελίδα Μπόνους δείχνει όλες τις διαθέσιμες επιλογές.",
    },
    casinos: {
      noMatchesCopy: "Αφαίρεσε ένα φίλτρο ή άλλαξε προβολή. Η B4GAMBLE δεν καλύπτει το κενό με παρόχους που δεν πληρούν τα κριτήρια.",
      reviewOnlyNotice: "Οι αξιολογήσεις παραμένουν διαθέσιμες. Οι σύνδεσμοι συνεργατών εμφανίζονται μόνο όταν υπάρχει κατάλληλη προσφορά και διαθέσιμος προορισμός για την επιλεγμένη αγορά.",
      faqReviewOnlyAnswer: "Η συντακτική αξιολόγηση είναι διαθέσιμη, αλλά αυτή τη στιγμή δεν υπάρχει σύνδεσμος συνεργάτη.",
      faqCommissionAnswer: "Όχι. Η προμήθεια δεν επηρεάζει το Editor Score ή τη συντακτική κατάταξη.",
    },
    bonuses: {
      heroLead: "Η αξία μετριέται",
      heroEmphasis: "με βάση τους όρους.",
      heroCopy: "Το ποσό που προβάλλεται λέει λίγα αν δεν συνυπολογίσεις την απαίτηση στοιχηματισμού. Σύγκρινε κατάθεση, τζίρο, περιορισμούς και λήξη πριν επιλέξεις.",
      disclosureCopy: "Η B4GAMBLE μπορεί να λάβει προμήθεια αν στο μέλλον χρησιμοποιήσεις έναν διαθέσιμο σύνδεσμο συνεργάτη με σαφή επισήμανση. Αυτό δεν επηρεάζει τη συντακτική βαθμολογία ή την κατάταξη. Έλεγξε τους τρέχοντες όρους και το εφαρμοστέο δίκαιο.",
    },
    profile: {
      demoDisclosure: "Φανταστικά πεδία αξιολόγησης· δεν περιγράφουν τρέχοντα πάροχο, άδεια ή προσφορά συνεργάτη. Δεν υπάρχει διαθέσιμος σύνδεσμος συνεργάτη.",
      marketUnavailableCopy: "Το προφίλ δεν εμφανίζει διαθέσιμες προσφορές για την επιλεγμένη αγορά. Η αξιολόγηση παραμένει διαθέσιμη, αλλά δεν υπάρχει σύνδεσμος συνεργάτη.",
      founded: "Έτος ίδρυσης",
      relatedCopy: "Σύγκρινε τα ίδια στοιχεία σε κάθε αξιολόγηση.",
      originalEditorialNotice: "Το συντακτικό κείμενο προέρχεται από τη δημοσιευμένη πηγή και εμφανίζεται στην αρχική του γλώσσα.",
    },
    comparison: {
      add: "Σύγκρινε",
      open: "Άνοιξε τη σύγκριση",
      clear: "Καθάρισε",
      close: "Κλείσε τη σύγκριση",
      remove: "Αφαίρεσε",
    },
    outbound: {
      label: "02 / Έξοδος από τη B4GAMBLE",
      contractLabel: "Έλεγχος προορισμού",
      title: "Φεύγεις από τη B4GAMBLE.",
      description: "Πρόκειται να επισκεφθείς εξωτερικό πάροχο τυχερών παιχνιδιών. Αν συνεχίσεις μέσω συνδέσμου συνεργάτη, η B4GAMBLE μπορεί να λάβει προμήθεια. Αυτό δεν επηρεάζει τη συντακτική βαθμολογία ή την κατάταξη.",
      contractCopy: "Η B4GAMBLE ελέγχει τον σύνδεσμο προορισμού πριν φύγεις από τον ιστότοπο.",
      continueAction: "Συνέχισε προς τον πάροχο →",
      cancelAction: "Ακύρωσε και μείνε στη B4GAMBLE",
    },
    calculator: {
      gameWeight: "Το παιχνίδι σου προσμετράται κατά",
      effectiveTurnover: "Σταθμισμένος τζίρος",
      expectedCost: "Ενδεικτικό κόστος",
      expectedValue: "Ενδεικτική καθαρή αξία",
    },
  },
} satisfies Record<"en-GB" | "de-DE" | "es-ES" | "sv-SE" | "da-DK" | "el-GR", ProductPageOverrides>;

const catalog: Record<SupportedLocale, ProductPageMessages> = {
  "en-GB": applyProductPageOverrides(en, languageQualityOverrides["en-GB"]),
  "de-DE": applyProductPageOverrides(de, languageQualityOverrides["de-DE"]),
  "it-IT": IT_PRODUCT_PAGE_MESSAGES,
  "es-ES": applyProductPageOverrides(reviewedLocaleVariant("es-ES", firstWaveEditorialOverrides["es-ES"]), languageQualityOverrides["es-ES"]),
  "es-PE": applyProductPageOverrides(reviewedLocaleVariant("es-ES", firstWaveEditorialOverrides["es-ES"]), languageQualityOverrides["es-ES"]),
  "pt-PT": PT_PRODUCT_PAGE_MESSAGES,
  "el-GR": applyProductPageOverrides(reviewedLocaleVariant("el-GR", firstWaveEditorialOverrides["el-GR"]), languageQualityOverrides["el-GR"]),
  "nl-NL": NL_PRODUCT_PAGE_MESSAGES,
  "sv-SE": applyProductPageOverrides(reviewedLocaleVariant("sv-SE", firstWaveEditorialOverrides["sv-SE"]), languageQualityOverrides["sv-SE"]),
  "da-DK": applyProductPageOverrides(reviewedLocaleVariant("da-DK", firstWaveEditorialOverrides["da-DK"]), languageQualityOverrides["da-DK"]),
  "fi-FI": FI_PRODUCT_PAGE_MESSAGES,
  "nb-NO": NB_PRODUCT_PAGE_MESSAGES,
  "en-CA": en,
  "fr-CA": en,
};

export function productPageMessages(locale: SupportedLocale) {
  return catalog[locale];
}

export function formatProductMessage(template: string, values: Record<string, string | number>) {
  return template.replace(/\{([a-z]+)\}/gi, (match, key: string) => key in values ? String(values[key]) : match);
}
