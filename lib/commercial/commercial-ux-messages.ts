import type { SupportedLocale } from "@/lib/market/registry";

export type CommercialUxMessages = Readonly<{
  viewOffer: string;
  bestOverall: string;
  fastPayouts: string;
  bestBonusTerms: string;
  lowDeposit: string;
  topRated: string;
  all: string;
  welcome: string;
  lowWagering: string;
  freeSpins: string;
  cashback: string;
  noDeposit: string;
  notVerified: string;
  clearTerms: string;
  searchCasinos: string;
  searchPlaceholder: string;
  noSearchResults: string;
  currentOffer: string;
  whyWeRate: string;
  paymentsAndPayouts: string;
  support: string;
  operatorMarketRegulation: string;
  termsAndReview: string;
  terms: string;
  casinoReview: string;
  upTo: string;
  spins: string;
  selected: string;
  offersShown: string;
  casinosShown: string;
  licenceStatus: string;
  market: string;
  operator: string;
  supportLanguages: string;
  minimumWithdrawal: string;
  fees: string;
  detailsRecorded: string;
  playResponsibly: string;
  getHelp: string;
  importantRestrictions: string;
  methodologyAndSources: string;
  verdictStrong: string;
  verdictSolid: string;
  verdictReviewed: string;
  payoutInstant: string;
  payoutUnderTwoHours: string;
  payoutSameDay: string;
  payoutOneDay: string;
  payoutOneToTwoDays: string;
  payoutThreePlusDays: string;
  verifiedPayoutTiming: string;
  verifiedOfferTerms: string;
  currentLicenceRecord: string;
  compactDisclosure: string;
}>;

const en: CommercialUxMessages = {
  viewOffer: "VIEW OFFER",
  bestOverall: "Best Overall",
  fastPayouts: "Fast Payouts",
  bestBonusTerms: "Best Bonus Terms",
  lowDeposit: "Low Deposit",
  topRated: "Top Rated",
  all: "All",
  welcome: "Welcome",
  lowWagering: "Low Wagering",
  freeSpins: "Free Spins",
  cashback: "Cashback",
  noDeposit: "No Deposit",
  notVerified: "Not verified",
  clearTerms: "Clear terms",
  searchCasinos: "Search casinos",
  searchPlaceholder: "Casino name",
  noSearchResults: "No casino name matches this search.",
  currentOffer: "Current offer",
  whyWeRate: "Why we rate it",
  paymentsAndPayouts: "Payments & payouts",
  support: "Support",
  operatorMarketRegulation: "Operator, market & regulation",
  termsAndReview: "Terms & casino review",
  terms: "Terms",
  casinoReview: "Casino review",
  upTo: "up to",
  spins: "spins",
  selected: "selected",
  offersShown: "offers shown",
  casinosShown: "casinos shown",
  licenceStatus: "Licence status",
  market: "Market",
  operator: "Operator",
  supportLanguages: "Support languages",
  minimumWithdrawal: "Minimum withdrawal",
  fees: "Fees",
  detailsRecorded: "Details recorded",
  playResponsibly: "Play responsibly",
  getHelp: "Get help",
  importantRestrictions: "Important restrictions apply. Check the current terms.",
  methodologyAndSources: "Methodology & sources",
  verdictStrong: "Strong all-round record with clear decision facts.",
  verdictSolid: "A solid reviewed option with useful terms visible.",
  verdictReviewed: "A reviewed option with key gaps shown clearly.",
  payoutInstant: "Instant",
  payoutUnderTwoHours: "Under 2h",
  payoutSameDay: "Under 24h",
  payoutOneDay: "24h",
  payoutOneToTwoDays: "1–2d",
  payoutThreePlusDays: "3+d",
  verifiedPayoutTiming: "Payout timing verified",
  verifiedOfferTerms: "Clear bonus terms",
  currentLicenceRecord: "Current licence record",
  compactDisclosure: "18+ · Terms apply · Affiliate link",
};

const de: CommercialUxMessages = {
  ...en,
  viewOffer: "ANGEBOT ANSEHEN", bestOverall: "Insgesamt am besten", fastPayouts: "Schnelle Auszahlungen", bestBonusTerms: "Beste Bonusbedingungen", lowDeposit: "Niedrige Einzahlung", topRated: "Bestbewertet",
  all: "Alle", welcome: "Willkommen", lowWagering: "Niedrige Umsatzbedingung", freeSpins: "Freispiele", noDeposit: "Ohne Einzahlung", notVerified: "Nicht verifiziert", clearTerms: "Klare Bedingungen",
  searchCasinos: "Casinos suchen", searchPlaceholder: "Casinoname", noSearchResults: "Kein Casinoname passt zu dieser Suche.", currentOffer: "Aktuelles Angebot", whyWeRate: "Warum wir es bewerten", paymentsAndPayouts: "Zahlungen & Auszahlungen", support: "Support", operatorMarketRegulation: "Betreiber, Markt & Regulierung",
  termsAndReview: "Bedingungen & Casinobewertung", terms: "Bedingungen", casinoReview: "Casinobewertung", upTo: "bis zu", spins: "Freispiele", selected: "ausgewählt", offersShown: "Angebote angezeigt", casinosShown: "Casinos angezeigt", licenceStatus: "Lizenzstatus", market: "Markt", operator: "Betreiber", supportLanguages: "Supportsprachen", detailsRecorded: "Angaben erfasst", playResponsibly: "Verantwortungsvoll spielen", getHelp: "Hilfe", importantRestrictions: "Wichtige Einschränkungen gelten. Aktuelle Bedingungen prüfen.", methodologyAndSources: "Methodik & Quellen", verdictStrong: "Starke Gesamtbilanz mit klaren Entscheidungsfakten.", verdictSolid: "Eine solide geprüfte Option mit sichtbaren Bedingungen.", verdictReviewed: "Eine geprüfte Option mit klar ausgewiesenen Lücken.", payoutInstant: "Sofort", payoutUnderTwoHours: "Unter 2 Std.", payoutSameDay: "Unter 24 Std.", payoutOneDay: "24 Std.", payoutOneToTwoDays: "1–2 T.", payoutThreePlusDays: "3+ T.", verifiedPayoutTiming: "Auszahlungszeit geprüft", verifiedOfferTerms: "Klare Bonusbedingungen", currentLicenceRecord: "Aktueller Lizenznachweis", compactDisclosure: "18+ · Bedingungen gelten · Affiliate-Link",
};

const es: CommercialUxMessages = {
  ...en,
  viewOffer: "VER OFERTA", bestOverall: "Mejor en general", fastPayouts: "Pagos rápidos", bestBonusTerms: "Mejores condiciones", lowDeposit: "Depósito bajo", topRated: "Mejor valorados",
  all: "Todos", welcome: "Bienvenida", lowWagering: "Apuesta baja", freeSpins: "Giros gratis", noDeposit: "Sin depósito", notVerified: "No verificado", clearTerms: "Condiciones claras",
  searchCasinos: "Buscar casinos", searchPlaceholder: "Nombre del casino", noSearchResults: "Ningún casino coincide con esta búsqueda.", currentOffer: "Oferta actual", whyWeRate: "Por qué lo valoramos", paymentsAndPayouts: "Pagos y retiradas", support: "Soporte", operatorMarketRegulation: "Operador, mercado y regulación", termsAndReview: "Condiciones y reseña", terms: "Condiciones", casinoReview: "Reseña del casino", upTo: "hasta", spins: "giros", selected: "seleccionado", offersShown: "ofertas mostradas", casinosShown: "casinos mostrados", licenceStatus: "Estado de la licencia", market: "Mercado", operator: "Operador", supportLanguages: "Idiomas de soporte", detailsRecorded: "Datos registrados", playResponsibly: "Juega con responsabilidad", getHelp: "Obtener ayuda", importantRestrictions: "Se aplican restricciones importantes. Revisa las condiciones actuales.", methodologyAndSources: "Metodología y fuentes", verdictStrong: "Sólido en general, con datos claros para decidir.", verdictSolid: "Una opción revisada y sólida con condiciones visibles.", verdictReviewed: "Una opción revisada con las lagunas claramente indicadas.", payoutInstant: "Instantáneo", payoutUnderTwoHours: "Menos de 2 h", payoutSameDay: "Menos de 24 h", payoutOneDay: "24 h", payoutOneToTwoDays: "1–2 d", payoutThreePlusDays: "3+ d", verifiedPayoutTiming: "Tiempo de pago verificado", verifiedOfferTerms: "Condiciones claras", currentLicenceRecord: "Registro de licencia actual", compactDisclosure: "18+ · Se aplican condiciones · Enlace afiliado",
};

const translations: Partial<Record<SupportedLocale, CommercialUxMessages>> = {
  "en-GB": en,
  "en-CA": en,
  "de-DE": de,
  "es-ES": es,
  "es-PE": es,
  "it-IT": { ...en, viewOffer:"VEDI OFFERTA",bestOverall:"Migliore in assoluto",fastPayouts:"Prelievi rapidi",bestBonusTerms:"Migliori condizioni bonus",lowDeposit:"Deposito basso",topRated:"Più votati",all:"Tutti",welcome:"Benvenuto",lowWagering:"Requisito basso",freeSpins:"Giri gratis",noDeposit:"Senza deposito",notVerified:"Non verificato",clearTerms:"Condizioni chiare",searchCasinos:"Cerca casinò",searchPlaceholder:"Nome del casinò",noSearchResults:"Nessun casinò corrisponde alla ricerca.",currentOffer:"Offerta attuale",whyWeRate:"Perché lo valutiamo",paymentsAndPayouts:"Pagamenti e prelievi",support:"Assistenza",operatorMarketRegulation:"Operatore, mercato e regolamentazione",termsAndReview:"Condizioni e recensione",terms:"Condizioni",casinoReview:"Recensione casinò",upTo:"fino a",spins:"giri",selected:"selezionato",offersShown:"offerte mostrate",casinosShown:"casinò mostrati",licenceStatus:"Stato licenza",market:"Mercato",operator:"Operatore",supportLanguages:"Lingue assistenza",detailsRecorded:"Dati registrati",playResponsibly:"Gioca responsabilmente",getHelp:"Chiedi aiuto",importantRestrictions:"Si applicano restrizioni importanti. Verifica le condizioni attuali.",methodologyAndSources:"Metodo e fonti",verdictStrong:"Profilo complessivo forte con dati chiari per decidere.",verdictSolid:"Un'opzione solida e verificata con condizioni visibili.",verdictReviewed:"Un'opzione verificata con lacune indicate chiaramente.",payoutInstant:"Istantaneo",payoutUnderTwoHours:"Meno di 2 h",payoutSameDay:"Meno di 24 h",payoutOneDay:"24 h",payoutOneToTwoDays:"1–2 g",payoutThreePlusDays:"3+ g",verifiedPayoutTiming:"Tempi di prelievo verificati",verifiedOfferTerms:"Condizioni bonus chiare",currentLicenceRecord:"Licenza aggiornata",compactDisclosure:"18+ · Si applicano condizioni · Link affiliato" },
  "pt-PT": { ...en, viewOffer:"VER OFERTA",bestOverall:"Melhor no geral",fastPayouts:"Pagamentos rápidos",bestBonusTerms:"Melhores termos de bónus",lowDeposit:"Depósito baixo",topRated:"Melhor avaliados",all:"Todos",welcome:"Boas-vindas",lowWagering:"Apostas baixas",freeSpins:"Rodadas grátis",noDeposit:"Sem depósito",notVerified:"Não verificado",clearTerms:"Termos claros",searchCasinos:"Pesquisar casinos",searchPlaceholder:"Nome do casino",noSearchResults:"Nenhum casino corresponde à pesquisa.",currentOffer:"Oferta atual",whyWeRate:"Porque o avaliamos",paymentsAndPayouts:"Pagamentos e levantamentos",support:"Apoio",operatorMarketRegulation:"Operador, mercado e regulação",termsAndReview:"Termos e análise",terms:"Termos",casinoReview:"Análise do casino",upTo:"até",spins:"rodadas",selected:"selecionado",offersShown:"ofertas apresentadas",casinosShown:"casinos apresentados",licenceStatus:"Estado da licença",market:"Mercado",operator:"Operador",supportLanguages:"Idiomas de apoio",detailsRecorded:"Dados registados",playResponsibly:"Jogue com responsabilidade",getHelp:"Obter ajuda",importantRestrictions:"Aplicam-se restrições importantes. Consulte os termos atuais.",methodologyAndSources:"Metodologia e fontes",verdictStrong:"Registo geral forte com factos claros para decidir.",verdictSolid:"Uma opção sólida e analisada com termos visíveis.",verdictReviewed:"Uma opção analisada com lacunas claramente indicadas.",payoutInstant:"Instantâneo",payoutUnderTwoHours:"Menos de 2 h",payoutSameDay:"Menos de 24 h",payoutOneDay:"24 h",payoutOneToTwoDays:"1–2 d",payoutThreePlusDays:"3+ d",verifiedPayoutTiming:"Tempo de pagamento verificado",verifiedOfferTerms:"Termos de bónus claros",currentLicenceRecord:"Registo de licença atual",compactDisclosure:"18+ · Aplicam-se termos · Link afiliado" },
  "nl-NL": { ...en, viewOffer:"BEKIJK AANBOD",bestOverall:"Beste algemeen",fastPayouts:"Snelle uitbetalingen",bestBonusTerms:"Beste bonusvoorwaarden",lowDeposit:"Lage storting",topRated:"Hoogst beoordeeld",all:"Alles",welcome:"Welkom",lowWagering:"Lage inzetvereiste",freeSpins:"Gratis spins",noDeposit:"Zonder storting",notVerified:"Niet geverifieerd",clearTerms:"Duidelijke voorwaarden",searchCasinos:"Casino's zoeken",searchPlaceholder:"Casinonaam",noSearchResults:"Geen casinonaam komt overeen.",currentOffer:"Actueel aanbod",whyWeRate:"Waarom we dit waarderen",paymentsAndPayouts:"Betalingen en uitbetalingen",support:"Ondersteuning",operatorMarketRegulation:"Exploitant, markt en toezicht",termsAndReview:"Voorwaarden en casinoreview",terms:"Voorwaarden",casinoReview:"Casinoreview",upTo:"tot",spins:"spins",selected:"geselecteerd",offersShown:"aanbiedingen getoond",casinosShown:"casino's getoond",licenceStatus:"Vergunningsstatus",market:"Markt",operator:"Exploitant",supportLanguages:"Ondersteuningstalen",detailsRecorded:"Gegevens vastgelegd",playResponsibly:"Speel verantwoord",getHelp:"Hulp",importantRestrictions:"Belangrijke beperkingen gelden. Controleer de actuele voorwaarden.",methodologyAndSources:"Methodologie en bronnen",verdictStrong:"Sterk totaalbeeld met heldere feiten om te beslissen.",verdictSolid:"Een degelijk beoordeelde optie met zichtbare voorwaarden.",verdictReviewed:"Een beoordeelde optie met duidelijk getoonde hiaten.",payoutInstant:"Direct",payoutUnderTwoHours:"Onder 2 u",payoutSameDay:"Onder 24 u",payoutOneDay:"24 u",payoutOneToTwoDays:"1–2 d",payoutThreePlusDays:"3+ d",verifiedPayoutTiming:"Uitbetalingstijd geverifieerd",verifiedOfferTerms:"Duidelijke bonusvoorwaarden",currentLicenceRecord:"Actueel vergunningsrecord",compactDisclosure:"18+ · Voorwaarden gelden · Affiliatelink" },
  "sv-SE": { ...en, viewOffer:"VISA ERBJUDANDE",bestOverall:"Bäst totalt",fastPayouts:"Snabba utbetalningar",bestBonusTerms:"Bästa bonusvillkor",lowDeposit:"Låg insättning",topRated:"Högst betyg",all:"Alla",welcome:"Välkomstbonus",lowWagering:"Lågt omsättningskrav",freeSpins:"Free spins",noDeposit:"Utan insättning",notVerified:"Inte verifierat",clearTerms:"Tydliga villkor",searchCasinos:"Sök casinon",searchPlaceholder:"Casinonamn",noSearchResults:"Inget casinonamn matchar sökningen.",currentOffer:"Aktuellt erbjudande",whyWeRate:"Därför betygsätter vi",paymentsAndPayouts:"Betalningar och utbetalningar",support:"Support",operatorMarketRegulation:"Operatör, marknad och reglering",termsAndReview:"Villkor och casinorecension",terms:"Villkor",casinoReview:"Casinorecension",upTo:"upp till",spins:"spins",selected:"valt",offersShown:"erbjudanden visas",casinosShown:"casinon visas",licenceStatus:"Licensstatus",market:"Marknad",operator:"Operatör",supportLanguages:"Supportspråk",detailsRecorded:"Uppgifter registrerade",playResponsibly:"Spela ansvarsfullt",getHelp:"Få hjälp",importantRestrictions:"Viktiga begränsningar gäller. Kontrollera aktuella villkor.",methodologyAndSources:"Metod och källor",verdictStrong:"Starkt helhetsresultat med tydliga beslutsfakta.",verdictSolid:"Ett stabilt granskat alternativ med synliga villkor.",verdictReviewed:"Ett granskat alternativ med tydligt angivna luckor.",payoutInstant:"Direkt",payoutUnderTwoHours:"Under 2 h",payoutSameDay:"Under 24 h",payoutOneDay:"24 h",payoutOneToTwoDays:"1–2 d",payoutThreePlusDays:"3+ d",verifiedPayoutTiming:"Utbetalningstid verifierad",verifiedOfferTerms:"Tydliga bonusvillkor",currentLicenceRecord:"Aktuell licensuppgift",compactDisclosure:"18+ · Villkor gäller · Affiliatelänk" },
  "da-DK": { ...en, viewOffer:"SE TILBUD",bestOverall:"Bedst samlet",fastPayouts:"Hurtige udbetalinger",bestBonusTerms:"Bedste bonusvilkår",lowDeposit:"Lav indbetaling",topRated:"Højest vurderet",all:"Alle",welcome:"Velkomst",lowWagering:"Lavt omsætningskrav",freeSpins:"Free spins",noDeposit:"Uden indbetaling",notVerified:"Ikke verificeret",clearTerms:"Klare vilkår",searchCasinos:"Søg kasinoer",searchPlaceholder:"Kasinonavn",noSearchResults:"Intet kasinonavn matcher søgningen.",currentOffer:"Aktuelt tilbud",whyWeRate:"Derfor vurderer vi det",paymentsAndPayouts:"Betalinger og udbetalinger",support:"Support",operatorMarketRegulation:"Operatør, marked og regulering",termsAndReview:"Vilkår og kasinoanmeldelse",terms:"Vilkår",casinoReview:"Kasinoanmeldelse",upTo:"op til",spins:"spins",selected:"valgt",offersShown:"tilbud vises",casinosShown:"kasinoer vises",licenceStatus:"Licensstatus",market:"Marked",operator:"Operatør",supportLanguages:"Supportsprog",detailsRecorded:"Oplysninger registreret",playResponsibly:"Spil ansvarligt",getHelp:"Få hjælp",importantRestrictions:"Vigtige begrænsninger gælder. Tjek de aktuelle vilkår.",methodologyAndSources:"Metode og kilder",verdictStrong:"Stærk samlet profil med klare beslutningsfakta.",verdictSolid:"En solid vurderet mulighed med synlige vilkår.",verdictReviewed:"En vurderet mulighed med tydeligt viste mangler.",payoutInstant:"Straks",payoutUnderTwoHours:"Under 2 t",payoutSameDay:"Under 24 t",payoutOneDay:"24 t",payoutOneToTwoDays:"1–2 d",payoutThreePlusDays:"3+ d",verifiedPayoutTiming:"Udbetalingstid verificeret",verifiedOfferTerms:"Klare bonusvilkår",currentLicenceRecord:"Aktuel licensregistrering",compactDisclosure:"18+ · Vilkår gælder · Affiliatelink" },
  "fi-FI": { ...en, viewOffer:"KATSO TARJOUS",bestOverall:"Paras kokonaisuus",fastPayouts:"Nopeat kotiutukset",bestBonusTerms:"Parhaat bonusehdot",lowDeposit:"Pieni talletus",topRated:"Parhaat arviot",all:"Kaikki",welcome:"Tervetuloa",lowWagering:"Pieni kierrätys",freeSpins:"Ilmaiskierrokset",noDeposit:"Ei talletusta",notVerified:"Ei vahvistettu",clearTerms:"Selkeät ehdot",searchCasinos:"Hae kasinoita",searchPlaceholder:"Kasinon nimi",noSearchResults:"Yksikään kasinon nimi ei vastaa hakua.",currentOffer:"Nykyinen tarjous",whyWeRate:"Miksi arvioimme tämän",paymentsAndPayouts:"Maksut ja kotiutukset",support:"Tuki",operatorMarketRegulation:"Operaattori, markkina ja sääntely",termsAndReview:"Ehdot ja kasinoarvio",terms:"Ehdot",casinoReview:"Kasinoarvio",upTo:"enintään",spins:"kierrosta",selected:"valittu",offersShown:"tarjousta näytetään",casinosShown:"kasinoa näytetään",licenceStatus:"Lisenssin tila",market:"Markkina",operator:"Operaattori",supportLanguages:"Tukikielet",detailsRecorded:"Tiedot kirjattu",playResponsibly:"Pelaa vastuullisesti",getHelp:"Hae apua",importantRestrictions:"Tärkeitä rajoituksia sovelletaan. Tarkista nykyiset ehdot.",methodologyAndSources:"Menetelmä ja lähteet",verdictStrong:"Vahva kokonaisuus ja selkeät päätöstiedot.",verdictSolid:"Hyvä arvioitu vaihtoehto, jonka ehdot näkyvät.",verdictReviewed:"Arvioitu vaihtoehto, jonka puutteet näkyvät selkeästi.",payoutInstant:"Heti",payoutUnderTwoHours:"Alle 2 h",payoutSameDay:"Alle 24 h",payoutOneDay:"24 h",payoutOneToTwoDays:"1–2 pv",payoutThreePlusDays:"3+ pv",verifiedPayoutTiming:"Kotiutusaika vahvistettu",verifiedOfferTerms:"Selkeät bonusehdot",currentLicenceRecord:"Ajantasainen lisenssitieto",compactDisclosure:"18+ · Ehtoja sovelletaan · Kumppanilinkki" },
  "nb-NO": { ...en, viewOffer:"SE TILBUD",bestOverall:"Best totalt",fastPayouts:"Raske utbetalinger",bestBonusTerms:"Beste bonusvilkår",lowDeposit:"Lavt innskudd",topRated:"Høyest vurdert",all:"Alle",welcome:"Velkomst",lowWagering:"Lavt omsetningskrav",freeSpins:"Gratisspinn",noDeposit:"Uten innskudd",notVerified:"Ikke verifisert",clearTerms:"Klare vilkår",searchCasinos:"Søk kasinoer",searchPlaceholder:"Kasinonavn",noSearchResults:"Ingen kasinonavn samsvarer med søket.",currentOffer:"Gjeldende tilbud",whyWeRate:"Derfor vurderer vi det",paymentsAndPayouts:"Betalinger og utbetalinger",support:"Kundestøtte",operatorMarketRegulation:"Operatør, marked og regulering",termsAndReview:"Vilkår og kasinoanmeldelse",terms:"Vilkår",casinoReview:"Kasinoanmeldelse",upTo:"opptil",spins:"spinn",selected:"valgt",offersShown:"tilbud vises",casinosShown:"kasinoer vises",licenceStatus:"Lisensstatus",market:"Marked",operator:"Operatør",supportLanguages:"Støttespråk",detailsRecorded:"Opplysninger registrert",playResponsibly:"Spill ansvarlig",getHelp:"Få hjelp",importantRestrictions:"Viktige begrensninger gjelder. Sjekk gjeldende vilkår.",methodologyAndSources:"Metode og kilder",verdictStrong:"Sterk helhet med tydelige beslutningsfakta.",verdictSolid:"Et solid vurdert alternativ med synlige vilkår.",verdictReviewed:"Et vurdert alternativ med tydelig viste mangler.",payoutInstant:"Straks",payoutUnderTwoHours:"Under 2 t",payoutSameDay:"Under 24 t",payoutOneDay:"24 t",payoutOneToTwoDays:"1–2 d",payoutThreePlusDays:"3+ d",verifiedPayoutTiming:"Utbetalingstid verifisert",verifiedOfferTerms:"Klare bonusvilkår",currentLicenceRecord:"Gjeldende lisensoppføring",compactDisclosure:"18+ · Vilkår gjelder · Affiliatelenke" },
  "el-GR": { ...en, viewOffer:"ΔΕΙΤΕ ΤΗΝ ΠΡΟΣΦΟΡΑ",bestOverall:"Καλύτερο συνολικά",fastPayouts:"Γρήγορες πληρωμές",bestBonusTerms:"Καλύτεροι όροι μπόνους",lowDeposit:"Χαμηλή κατάθεση",topRated:"Υψηλότερη βαθμολογία",all:"Όλα",welcome:"Καλωσορίσματος",lowWagering:"Χαμηλή απαίτηση",freeSpins:"Δωρεάν περιστροφές",noDeposit:"Χωρίς κατάθεση",notVerified:"Δεν επαληθεύτηκε",clearTerms:"Σαφείς όροι",searchCasinos:"Αναζήτηση καζίνο",searchPlaceholder:"Όνομα καζίνο",noSearchResults:"Κανένα όνομα καζίνο δεν ταιριάζει.",currentOffer:"Τρέχουσα προσφορά",whyWeRate:"Γιατί το αξιολογούμε",paymentsAndPayouts:"Πληρωμές και αναλήψεις",support:"Υποστήριξη",operatorMarketRegulation:"Πάροχος, αγορά και ρύθμιση",termsAndReview:"Όροι και αξιολόγηση",terms:"Όροι",casinoReview:"Αξιολόγηση καζίνο",upTo:"έως",spins:"περιστροφές",selected:"επιλεγμένο",offersShown:"προσφορές εμφανίζονται",casinosShown:"καζίνο εμφανίζονται",licenceStatus:"Κατάσταση άδειας",market:"Αγορά",operator:"Πάροχος",supportLanguages:"Γλώσσες υποστήριξης",detailsRecorded:"Στοιχεία καταγεγραμμένα",playResponsibly:"Παίξτε υπεύθυνα",getHelp:"Λάβετε βοήθεια",importantRestrictions:"Ισχύουν σημαντικοί περιορισμοί. Ελέγξτε τους τρέχοντες όρους.",methodologyAndSources:"Μεθοδολογία και πηγές",verdictStrong:"Ισχυρή συνολική εικόνα με σαφή στοιχεία απόφασης.",verdictSolid:"Μια σταθερή αξιολογημένη επιλογή με ορατούς όρους.",verdictReviewed:"Μια αξιολογημένη επιλογή με σαφώς εμφανή κενά.",payoutInstant:"Άμεσα",payoutUnderTwoHours:"Κάτω από 2 ώρες",payoutSameDay:"Κάτω από 24 ώρες",payoutOneDay:"24 ώρες",payoutOneToTwoDays:"1–2 ημέρες",payoutThreePlusDays:"3+ ημέρες",verifiedPayoutTiming:"Χρόνος πληρωμής επαληθευμένος",verifiedOfferTerms:"Σαφείς όροι μπόνους",currentLicenceRecord:"Τρέχον αρχείο άδειας",compactDisclosure:"18+ · Ισχύουν όροι · Σύνδεσμος συνεργάτη" },
  "fr-CA": { ...en, viewOffer:"VOIR L’OFFRE",bestOverall:"Meilleur choix global",fastPayouts:"Paiements rapides",bestBonusTerms:"Meilleures conditions",lowDeposit:"Dépôt faible",topRated:"Mieux notés",all:"Tous",welcome:"Bienvenue",lowWagering:"Mise faible",freeSpins:"Tours gratuits",noDeposit:"Sans dépôt",notVerified:"Non vérifié",clearTerms:"Conditions claires",searchCasinos:"Rechercher des casinos",searchPlaceholder:"Nom du casino",noSearchResults:"Aucun casino ne correspond à cette recherche.",currentOffer:"Offre actuelle",whyWeRate:"Pourquoi nous le notons",paymentsAndPayouts:"Paiements et retraits",support:"Assistance",operatorMarketRegulation:"Opérateur, marché et réglementation",termsAndReview:"Conditions et avis",terms:"Conditions",casinoReview:"Avis du casino",upTo:"jusqu’à",spins:"tours",selected:"sélectionné",offersShown:"offres affichées",casinosShown:"casinos affichés",licenceStatus:"État de la licence",market:"Marché",operator:"Opérateur",supportLanguages:"Langues d’assistance",detailsRecorded:"Détails consignés",playResponsibly:"Jouez de façon responsable",getHelp:"Obtenir de l’aide",importantRestrictions:"Des restrictions importantes s’appliquent. Vérifiez les conditions actuelles.",methodologyAndSources:"Méthodologie et sources",verdictStrong:"Solide bilan global avec des faits clairs pour décider.",verdictSolid:"Une option solide et examinée avec des conditions visibles.",verdictReviewed:"Une option examinée dont les lacunes sont clairement indiquées.",payoutInstant:"Instantané",payoutUnderTwoHours:"Moins de 2 h",payoutSameDay:"Moins de 24 h",payoutOneDay:"24 h",payoutOneToTwoDays:"1–2 j",payoutThreePlusDays:"3+ j",verifiedPayoutTiming:"Délai de paiement vérifié",verifiedOfferTerms:"Conditions de bonus claires",currentLicenceRecord:"Dossier de licence actuel",compactDisclosure:"18+ · Conditions applicables · Lien affilié" },
};

export function commercialUxMessages(locale: SupportedLocale): CommercialUxMessages {
  const factLabels: Partial<Record<SupportedLocale, Pick<CommercialUxMessages, "minimumWithdrawal" | "fees">>> = {
    "de-DE": { minimumWithdrawal: "Mindestabhebung", fees: "Gebühren" },
    "it-IT": { minimumWithdrawal: "Prelievo minimo", fees: "Commissioni" },
    "es-ES": { minimumWithdrawal: "Retirada mínima", fees: "Comisiones" },
    "es-PE": { minimumWithdrawal: "Retiro mínimo", fees: "Comisiones" },
    "pt-PT": { minimumWithdrawal: "Levantamento mínimo", fees: "Taxas" },
    "el-GR": { minimumWithdrawal: "Ελάχιστη ανάληψη", fees: "Χρεώσεις" },
    "nl-NL": { minimumWithdrawal: "Minimale opname", fees: "Kosten" },
    "sv-SE": { minimumWithdrawal: "Minsta uttag", fees: "Avgifter" },
    "da-DK": { minimumWithdrawal: "Minimumsudbetaling", fees: "Gebyrer" },
    "fi-FI": { minimumWithdrawal: "Vähimmäiskotiutus", fees: "Kulut" },
    "nb-NO": { minimumWithdrawal: "Minste uttak", fees: "Gebyrer" },
    "fr-CA": { minimumWithdrawal: "Retrait minimum", fees: "Frais" },
  };
  return { ...(translations[locale] ?? en), ...(factLabels[locale] ?? {}) };
}
