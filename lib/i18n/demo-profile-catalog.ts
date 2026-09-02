import type { SupportedLocale } from "@/lib/market/registry";

type DemoProfileCopy = Readonly<{
  title: string;
  summary: string;
  reviewContent: string;
  pros: readonly [string, string, string];
  cons: readonly [string, string, string];
  responsibleGamblingTools: readonly [string, string, string];
  bankTransfer: string;
  instant: string;
  liveDealer: string;
  bonus: Readonly<{
    title: string;
    summary: string;
    wagering: string;
    eligibility: string;
    conditions: readonly [string, string];
  }>;
  media: Readonly<{ logo: string; hero: string }>;
  editorial: Readonly<{
    title: string;
    summary: string;
    author: string;
    evidence: readonly [string, string, string];
    categories: readonly [string, string, string, string];
    sections: readonly [
      readonly ["payments", string, string],
      readonly ["games", string, string],
      readonly ["bonuses", string, string],
      readonly ["trust", string, string],
      readonly ["payments", string, string],
    ];
    faq: readonly [
      readonly [string, string],
      readonly [string, string],
      readonly [string, string],
    ];
    seoTitle: string;
    seoDescription: string;
  }>;
}>;

/**
 * B4GAMBLE-authored copy for the deterministic local visual fixture only.
 * Operator names, licence identifiers and numeric offer fields stay outside
 * this catalog because localization must not rewrite them as factual evidence.
 */

const en: DemoProfileCopy = {
  title: "Solvane Casino review",
  summary: "Fictional review fields for interface testing; not evidence of operator performance or a current offer.",
  reviewContent: "This fictional review demonstrates the interface only. It is not based on a real operator, licence, offer or performance test.",
  pros: ["Players who cash out often", "Live-dealer regulars", "Anyone tired of payout excuses"],
  cons: ["Wagering excludes some live games", "Not available in all countries", "VIP perks start after real play"],
  responsibleGamblingTools: ["Deposit limits", "Time-outs", "Self-exclusion"],
  bankTransfer: "Bank transfer",
  instant: "Instant",
  liveDealer: "Live dealer",
  bonus: {
    title: "100% up to €500 + 200 free spins",
    summary: "A clearly presented welcome offer with the material conditions visible before action.",
    wagering: "35× wagering",
    eligibility: "18+ · New customers · Terms apply",
    conditions: ["Terms shown before action", "Maximum bet applies"],
  },
  media: { logo: "fictional preview logo", hero: "fictional {ratio} media-ratio preview" },
  editorial: {
    title: "Full review",
    summary: "Fictional editorial fields for interface testing; not evidence of operator performance.",
    author: "B4GAMBLE Editorial",
    evidence: ["Fictional payout evidence field", "Fictional RTP evidence field", "Fictional support evidence field"],
    categories: ["Payouts", "Bonus terms", "Games & live floor", "Support"],
    sections: [
      ["payments", "Payouts", "Illustrative withdrawal-method and timing fields for a fictional operator. No payout test was performed."],
      ["games", "Games", "Illustrative game-count, live-table and RTP fields for a fictional operator. No provider catalogue was checked."],
      ["bonuses", "Bonuses", "Illustrative wagering, maximum-win and game-weighting fields. This is not a current or claimable bonus."],
      ["trust", "Support", "Illustrative response-time and support-quality fields for a fictional operator. No support interaction was tested."],
      ["payments", "Banking", "Illustrative payment-method, fee and withdrawal fields for a fictional operator."],
    ],
    faq: [
      ["Is Solvane available in my country?", "No. Solvane is a fictional interface example and has no commercial availability."],
      ["How fresh is this review?", "This is fixed test content for the interface, not a current operator review."],
      ["Did Solvane pay for this score?", "No. Solvane is fictional, the score is illustrative and no commercial relationship exists."],
    ],
    seoTitle: "Solvane Casino review",
    seoDescription: "Fictional payout and bonus fields for interface testing; not evidence of operator performance or a current offer.",
  },
};

const de: DemoProfileCopy = {
  title: "Bewertung von Solvane Casino",
  summary: "Fiktive Bewertungsfelder für Oberflächentests; kein Beleg für die Leistung eines Anbieters oder ein aktuelles Angebot.",
  reviewContent: "Diese fiktive Bewertung dient ausschließlich zur Darstellung der Oberfläche. Sie beruht weder auf einem echten Anbieter noch auf einer Lizenz, einem Angebot oder einem Leistungstest.",
  pros: ["Personen, die häufig Auszahlungen vornehmen", "Fans von Live-Dealer-Spielen", "Alle, die genug von Auszahlungsverzögerungen haben"],
  cons: ["Einige Live-Spiele zählen nicht für die Umsatzbedingung", "Nicht in allen Ländern verfügbar", "VIP-Vorteile beginnen erst nach Echtgeldspiel"],
  responsibleGamblingTools: ["Einzahlungslimits", "Auszeiten", "Selbstausschluss"],
  bankTransfer: "Banküberweisung",
  instant: "Sofort",
  liveDealer: "Live-Dealer",
  bonus: {
    title: "100 % bis zu 500 € + 200 Freispiele",
    summary: "Ein übersichtlich dargestelltes Willkommensangebot, dessen wesentliche Bedingungen vor jeder Aktion sichtbar sind.",
    wagering: "35× Umsatzbedingung",
    eligibility: "18+ · Nur Neukunden · Es gelten Bedingungen",
    conditions: ["Bedingungen vor jeder Aktion sichtbar", "Maximaleinsatz gilt"],
  },
  media: { logo: "fiktives Vorschaulogo", hero: "fiktive Medienvorschau im Format {ratio}" },
  editorial: {
    title: "Vollständige Bewertung",
    summary: "Fiktive redaktionelle Felder für Oberflächentests; kein Beleg für die Leistung eines Anbieters.",
    author: "B4GAMBLE-Redaktion",
    evidence: ["Fiktives Evidenzfeld zur Auszahlung", "Fiktives Evidenzfeld zum RTP", "Fiktives Evidenzfeld zum Support"],
    categories: ["Auszahlungen", "Bonusbedingungen", "Spiele und Live-Bereich", "Kundendienst"],
    sections: [
      ["payments", "Auszahlungen", "Beispielhafte Felder zu Auszahlungsmethoden und Bearbeitungszeiten eines fiktiven Anbieters. Es wurde kein Auszahlungstest durchgeführt."],
      ["games", "Spiele", "Beispielhafte Felder zu Spieleanzahl, Live-Tischen und RTP eines fiktiven Anbieters. Es wurde kein Anbieterkatalog geprüft."],
      ["bonuses", "Boni", "Beispielhafte Felder zu Umsatzbedingung, Höchstgewinn und Spielgewichtung. Dies ist kein aktueller oder beanspruchbarer Bonus."],
      ["trust", "Kundendienst", "Beispielhafte Felder zu Antwortzeit und Qualität des Kundendienstes eines fiktiven Anbieters. Es wurde kein Kontakt mit dem Kundendienst getestet."],
      ["payments", "Zahlungsverkehr", "Beispielhafte Felder zu Zahlungsmethoden, Gebühren und Auszahlungen eines fiktiven Anbieters."],
    ],
    faq: [
      ["Ist Solvane in meinem Land verfügbar?", "Nein. Solvane ist ein fiktives Oberflächenbeispiel und nicht kommerziell verfügbar."],
      ["Wie aktuell ist diese Bewertung?", "Dies sind festgelegte Testinhalte für die Oberfläche, keine aktuelle Anbieterbewertung."],
      ["Hat Solvane für diese Bewertung bezahlt?", "Nein. Solvane ist fiktiv, die Bewertung dient nur der Veranschaulichung und es besteht keine Geschäftsbeziehung."],
    ],
    seoTitle: "Bewertung von Solvane Casino",
    seoDescription: "Fiktive Auszahlungs- und Bonusfelder für Oberflächentests; kein Beleg für die Leistung eines Anbieters oder ein aktuelles Angebot.",
  },
};

const it: DemoProfileCopy = {
  title: "Recensione di Solvane Casino",
  summary: "Campi di recensione fittizi per testare l’interfaccia; non costituiscono prova delle prestazioni di un operatore né un’offerta attuale.",
  reviewContent: "Questa recensione fittizia mostra soltanto l’interfaccia. Non si basa su un operatore, una licenza, un’offerta o un test delle prestazioni reali.",
  pros: ["Chi preleva spesso", "Gli appassionati di casinò con croupier dal vivo", "Chi è stanco dei ritardi nei pagamenti"],
  cons: ["Alcuni giochi dal vivo sono esclusi dal requisito di puntata", "Non disponibile in tutti i Paesi", "I vantaggi VIP iniziano solo dopo il gioco con denaro reale"],
  responsibleGamblingTools: ["Limiti di deposito", "Pause temporanee", "Autoesclusione"],
  bankTransfer: "Bonifico bancario",
  instant: "Immediato",
  liveDealer: "Croupier dal vivo",
  bonus: {
    title: "100% fino a 500 € + 200 giri gratis",
    summary: "Un’offerta di benvenuto illustrata chiaramente, con le condizioni essenziali visibili prima di qualsiasi azione.",
    wagering: "Requisito di puntata 35×",
    eligibility: "18+ · Nuovi clienti · Si applicano termini e condizioni",
    conditions: ["Condizioni mostrate prima dell’azione", "Si applica una puntata massima"],
  },
  media: { logo: "logo fittizio di anteprima", hero: "anteprima multimediale fittizia in formato {ratio}" },
  editorial: {
    title: "Recensione completa",
    summary: "Campi editoriali fittizi per testare l’interfaccia; non costituiscono prova delle prestazioni di un operatore.",
    author: "Redazione B4GAMBLE",
    evidence: ["Campo fittizio sui pagamenti", "Campo fittizio sull’RTP", "Campo fittizio sull’assistenza"],
    categories: ["Pagamenti", "Condizioni del bonus", "Giochi e casinò dal vivo", "Assistenza"],
    sections: [
      ["payments", "Pagamenti", "Campi illustrativi sui metodi e sui tempi di prelievo di un operatore fittizio. Non è stato eseguito alcun test sui prelievi."],
      ["games", "Giochi", "Campi illustrativi sul numero di giochi, sui tavoli dal vivo e sull’RTP di un operatore fittizio. Non è stato verificato alcun catalogo del fornitore."],
      ["bonuses", "Bonus", "Campi illustrativi su requisito di puntata, vincita massima e ponderazione dei giochi. Non è un bonus attuale né riscattabile."],
      ["trust", "Assistenza", "Campi illustrativi sui tempi di risposta e sulla qualità dell’assistenza di un operatore fittizio. Non è stata testata alcuna interazione con l’assistenza."],
      ["payments", "Operazioni bancarie", "Campi illustrativi su metodi di pagamento, commissioni e prelievi di un operatore fittizio."],
    ],
    faq: [
      ["Solvane è disponibile nel mio Paese?", "No. Solvane è un esempio fittizio dell’interfaccia e non ha disponibilità commerciale."],
      ["Quanto è recente questa recensione?", "Si tratta di contenuti di prova predefiniti per l’interfaccia, non di una recensione aggiornata di un operatore."],
      ["Solvane ha pagato per questo punteggio?", "No. Solvane è fittizio, il punteggio è illustrativo e non esiste alcun rapporto commerciale."],
    ],
    seoTitle: "Recensione di Solvane Casino",
    seoDescription: "Campi fittizi su pagamenti e bonus per testare l’interfaccia; non costituiscono prova delle prestazioni di un operatore né un’offerta attuale.",
  },
};

const es: DemoProfileCopy = {
  title: "Reseña de Solvane Casino",
  summary: "Campos de reseña ficticios para probar la interfaz; no demuestran el rendimiento de un operador ni representan una oferta actual.",
  reviewContent: "Esta reseña ficticia solo muestra la interfaz. No se basa en un operador, una licencia, una oferta ni una prueba de rendimiento reales.",
  pros: ["Quienes retiran fondos con frecuencia", "Usuarios habituales de crupier en vivo", "Quienes están cansados de los retrasos en los pagos"],
  cons: ["Algunos juegos en vivo no cuentan para el requisito de apuesta", "No está disponible en todos los países", "Las ventajas VIP empiezan tras jugar con dinero real"],
  responsibleGamblingTools: ["Límites de depósito", "Pausas temporales", "Autoexclusión"],
  bankTransfer: "Transferencia bancaria",
  instant: "Instantáneo",
  liveDealer: "Crupier en vivo",
  bonus: {
    title: "100 % hasta 500 € + 200 giros gratis",
    summary: "Una oferta de bienvenida presentada con claridad y con las condiciones esenciales visibles antes de cualquier acción.",
    wagering: "Requisito de apuesta 35×",
    eligibility: "18+ · Nuevos clientes · Se aplican términos y condiciones",
    conditions: ["Condiciones visibles antes de actuar", "Se aplica una apuesta máxima"],
  },
  media: { logo: "logotipo ficticio de vista previa", hero: "vista previa multimedia ficticia en formato {ratio}" },
  editorial: {
    title: "Reseña completa",
    summary: "Campos editoriales ficticios para probar la interfaz; no demuestran el rendimiento de un operador.",
    author: "Redacción de B4GAMBLE",
    evidence: ["Campo ficticio de pagos", "Campo ficticio de RTP", "Campo ficticio de atención al cliente"],
    categories: ["Pagos", "Condiciones del bono", "Juegos y casino en vivo", "Atención al cliente"],
    sections: [
      ["payments", "Pagos", "Campos ilustrativos sobre métodos y plazos de retirada de un operador ficticio. No se realizó ninguna prueba de pago."],
      ["games", "Juegos", "Campos ilustrativos sobre número de juegos, mesas en vivo y RTP de un operador ficticio. No se comprobó ningún catálogo de proveedores."],
      ["bonuses", "Bonos", "Campos ilustrativos sobre requisitos de apuesta, ganancia máxima y ponderación de juegos. No es un bono actual ni canjeable."],
      ["trust", "Atención al cliente", "Campos ilustrativos sobre tiempo de respuesta y calidad de la atención de un operador ficticio. No se probó ninguna interacción con el servicio."],
      ["payments", "Operaciones bancarias", "Campos ilustrativos sobre métodos de pago, comisiones y retiradas de un operador ficticio."],
    ],
    faq: [
      ["¿Está Solvane disponible en mi país?", "No. Solvane es un ejemplo ficticio de la interfaz y no tiene disponibilidad comercial."],
      ["¿Está actualizada esta reseña?", "Es contenido de prueba predefinido para la interfaz, no una reseña actualizada de un operador."],
      ["¿Pagó Solvane por esta puntuación?", "No. Solvane es ficticio, la puntuación es ilustrativa y no existe ninguna relación comercial."],
    ],
    seoTitle: "Reseña de Solvane Casino",
    seoDescription: "Campos ficticios de pagos y bonos para probar la interfaz; no demuestran el rendimiento de un operador ni representan una oferta actual.",
  },
};

const pt: DemoProfileCopy = {
  title: "Análise do Solvane Casino",
  summary: "Campos de análise fictícios para testar a interface; não comprovam o desempenho de um operador nem representam uma oferta atual.",
  reviewContent: "Esta análise fictícia serve apenas para demonstrar a interface. Não se baseia num operador, licença, oferta ou teste de desempenho reais.",
  pros: ["Quem faz levantamentos com frequência", "Utilizadores habituais de casino ao vivo", "Quem está cansado de atrasos nos pagamentos"],
  cons: ["Alguns jogos ao vivo não contam para o requisito de apostas", "Não está disponível em todos os países", "As vantagens VIP começam apenas depois de jogar a dinheiro real"],
  responsibleGamblingTools: ["Limites de depósito", "Pausas temporárias", "Autoexclusão"],
  bankTransfer: "Transferência bancária",
  instant: "Imediato",
  liveDealer: "Casino ao vivo",
  bonus: {
    title: "100% até 500 € + 200 jogadas grátis",
    summary: "Uma oferta de boas-vindas apresentada com clareza, com as condições essenciais visíveis antes de qualquer ação.",
    wagering: "Requisito de apostas 35×",
    eligibility: "18+ · Novos clientes · Aplicam-se termos e condições",
    conditions: ["Condições apresentadas antes da ação", "Aplica-se uma aposta máxima"],
  },
  media: { logo: "logótipo fictício de pré-visualização", hero: "pré-visualização multimédia fictícia no formato {ratio}" },
  editorial: {
    title: "Análise completa",
    summary: "Campos editoriais fictícios para testar a interface; não comprovam o desempenho de um operador.",
    author: "Redação da B4GAMBLE",
    evidence: ["Campo fictício sobre pagamentos", "Campo fictício sobre RTP", "Campo fictício sobre apoio ao cliente"],
    categories: ["Pagamentos", "Condições do bónus", "Jogos e casino ao vivo", "Apoio ao cliente"],
    sections: [
      ["payments", "Pagamentos", "Campos ilustrativos sobre métodos e prazos de levantamento de um operador fictício. Não foi realizado qualquer teste de pagamento."],
      ["games", "Jogos", "Campos ilustrativos sobre número de jogos, mesas ao vivo e RTP de um operador fictício. Não foi verificado qualquer catálogo de fornecedores."],
      ["bonuses", "Bónus", "Campos ilustrativos sobre requisito de apostas, ganho máximo e ponderação dos jogos. Não é um bónus atual nem resgatável."],
      ["trust", "Apoio ao cliente", "Campos ilustrativos sobre tempo de resposta e qualidade do apoio de um operador fictício. Não foi testada qualquer interação com o apoio."],
      ["payments", "Operações bancárias", "Campos ilustrativos sobre métodos de pagamento, taxas e levantamentos de um operador fictício."],
    ],
    faq: [
      ["O Solvane está disponível no meu país?", "Não. O Solvane é um exemplo fictício da interface e não tem disponibilidade comercial."],
      ["Quão recente é esta análise?", "Trata-se de conteúdo de teste predefinido para a interface, não de uma análise atualizada de um operador."],
      ["O Solvane pagou por esta pontuação?", "Não. O Solvane é fictício, a pontuação é ilustrativa e não existe qualquer relação comercial."],
    ],
    seoTitle: "Análise do Solvane Casino",
    seoDescription: "Campos fictícios sobre pagamentos e bónus para testar a interface; não comprovam o desempenho de um operador nem representam uma oferta atual.",
  },
};

const el: DemoProfileCopy = {
  title: "Αξιολόγηση Solvane Casino",
  summary: "Φανταστικά πεδία αξιολόγησης για δοκιμή της διεπαφής· δεν αποτελούν τεκμήριο απόδοσης παρόχου ούτε συνιστούν τρέχουσα προσφορά.",
  reviewContent: "Αυτή η φανταστική αξιολόγηση παρουσιάζει μόνο τη διεπαφή. Δεν βασίζεται σε πραγματικό πάροχο, άδεια, προσφορά ή δοκιμή απόδοσης.",
  pros: ["Όσους κάνουν συχνά αναλήψεις", "Τακτικούς παίκτες παιχνιδιών με ζωντανό ντίλερ", "Όσους έχουν κουραστεί από καθυστερήσεις πληρωμών"],
  cons: ["Ορισμένα ζωντανά παιχνίδια δεν μετρούν στην απαίτηση στοιχηματισμού", "Δεν είναι διαθέσιμο σε όλες τις χώρες", "Τα προνόμια VIP αρχίζουν μόνο μετά από παιχνίδι με πραγματικά χρήματα"],
  responsibleGamblingTools: ["Όρια κατάθεσης", "Προσωρινές παύσεις", "Αυτοαποκλεισμός"],
  bankTransfer: "Τραπεζική μεταφορά",
  instant: "Άμεσα",
  liveDealer: "Ζωντανός ντίλερ",
  bonus: {
    title: "100% έως 500 € + 200 δωρεάν περιστροφές",
    summary: "Μια ευκρινώς παρουσιασμένη προσφορά καλωσορίσματος, με τους ουσιώδεις όρους ορατούς πριν από κάθε ενέργεια.",
    wagering: "Απαίτηση στοιχηματισμού 35×",
    eligibility: "18+ · Νέοι πελάτες · Ισχύουν όροι και προϋποθέσεις",
    conditions: ["Οι όροι εμφανίζονται πριν από την ενέργεια", "Ισχύει μέγιστο ποντάρισμα"],
  },
  media: { logo: "φανταστικό λογότυπο προεπισκόπησης", hero: "φανταστική προεπισκόπηση πολυμέσων σε αναλογία {ratio}" },
  editorial: {
    title: "Πλήρης αξιολόγηση",
    summary: "Φανταστικά συντακτικά πεδία για δοκιμή της διεπαφής· δεν αποτελούν τεκμήριο απόδοσης παρόχου.",
    author: "Συντακτική ομάδα B4GAMBLE",
    evidence: ["Φανταστικό πεδίο τεκμηρίων πληρωμών", "Φανταστικό πεδίο τεκμηρίων RTP", "Φανταστικό πεδίο τεκμηρίων υποστήριξης"],
    categories: ["Πληρωμές", "Όροι μπόνους", "Παιχνίδια και ζωντανό καζίνο", "Υποστήριξη"],
    sections: [
      ["payments", "Πληρωμές", "Ενδεικτικά πεδία για μεθόδους και χρόνους ανάληψης ενός φανταστικού παρόχου. Δεν πραγματοποιήθηκε δοκιμή πληρωμής."],
      ["games", "Παιχνίδια", "Ενδεικτικά πεδία για αριθμό παιχνιδιών, ζωντανά τραπέζια και RTP ενός φανταστικού παρόχου. Δεν ελέγχθηκε κατάλογος προμηθευτή."],
      ["bonuses", "Μπόνους", "Ενδεικτικά πεδία για απαίτηση στοιχηματισμού, μέγιστο κέρδος και στάθμιση παιχνιδιών. Δεν πρόκειται για τρέχον ή διαθέσιμο μπόνους."],
      ["trust", "Υποστήριξη", "Ενδεικτικά πεδία για χρόνο απόκρισης και ποιότητα υποστήριξης ενός φανταστικού παρόχου. Δεν δοκιμάστηκε αλληλεπίδραση με την υποστήριξη."],
      ["payments", "Τραπεζικές συναλλαγές", "Ενδεικτικά πεδία για μεθόδους πληρωμής, χρεώσεις και αναλήψεις ενός φανταστικού παρόχου."],
    ],
    faq: [
      ["Είναι το Solvane διαθέσιμο στη χώρα μου;", "Όχι. Το Solvane είναι φανταστικό παράδειγμα διεπαφής και δεν έχει εμπορική διαθεσιμότητα."],
      ["Πόσο πρόσφατη είναι αυτή η αξιολόγηση;", "Πρόκειται για προκαθορισμένο δοκιμαστικό περιεχόμενο της διεπαφής, όχι για τρέχουσα αξιολόγηση παρόχου."],
      ["Πλήρωσε το Solvane για αυτή τη βαθμολογία;", "Όχι. Το Solvane είναι φανταστικό, η βαθμολογία είναι ενδεικτική και δεν υπάρχει εμπορική σχέση."],
    ],
    seoTitle: "Αξιολόγηση Solvane Casino",
    seoDescription: "Φανταστικά πεδία πληρωμών και μπόνους για δοκιμή της διεπαφής· δεν αποτελούν τεκμήριο απόδοσης παρόχου ούτε συνιστούν τρέχουσα προσφορά.",
  },
};

const nl: DemoProfileCopy = {
  title: "Beoordeling van Solvane Casino",
  summary: "Fictieve beoordelingsvelden om de interface te testen; geen bewijs van prestaties van een aanbieder en geen actueel aanbod.",
  reviewContent: "Deze fictieve beoordeling demonstreert alleen de interface. Zij is niet gebaseerd op een echte aanbieder, vergunning, aanbieding of prestatietest.",
  pros: ["Spelers die vaak geld opnemen", "Liefhebbers van livecasinospellen", "Iedereen die genoeg heeft van uitbetalingsvertragingen"],
  cons: ["Sommige live-spellen tellen niet mee voor de inzetvereiste", "Niet in alle landen beschikbaar", "VIP-voordelen beginnen pas na spelen met echt geld"],
  responsibleGamblingTools: ["Stortingslimieten", "Pauzes", "Zelfuitsluiting"],
  bankTransfer: "Bankoverschrijving",
  instant: "Direct",
  liveDealer: "Livecasino",
  bonus: {
    title: "100% tot € 500 + 200 gratis spins",
    summary: "Een duidelijk gepresenteerde welkomstaanbieding waarbij de essentiële voorwaarden vóór elke actie zichtbaar zijn.",
    wagering: "Inzetvereiste 35×",
    eligibility: "18+ · Nieuwe klanten · Voorwaarden zijn van toepassing",
    conditions: ["Voorwaarden zichtbaar vóór actie", "Er geldt een maximale inzet"],
  },
  media: { logo: "fictief voorbeeldlogo", hero: "fictief mediavoorbeeld met verhouding {ratio}" },
  editorial: {
    title: "Volledige beoordeling",
    summary: "Fictieve redactionele velden om de interface te testen; geen bewijs van prestaties van een aanbieder.",
    author: "Redactie van B4GAMBLE",
    evidence: ["Fictief bewijsveld voor uitbetalingen", "Fictief bewijsveld voor RTP", "Fictief bewijsveld voor ondersteuning"],
    categories: ["Uitbetalingen", "Bonusvoorwaarden", "Spellen en livecasino", "Ondersteuning"],
    sections: [
      ["payments", "Uitbetalingen", "Illustratieve velden voor opnamemethoden en verwerkingstijden van een fictieve aanbieder. Er is geen uitbetaling getest."],
      ["games", "Spellen", "Illustratieve velden voor spelaantallen, live tafels en RTP van een fictieve aanbieder. Er is geen leverancierscatalogus gecontroleerd."],
      ["bonuses", "Bonussen", "Illustratieve velden voor inzetvereisten, maximale winst en spelweging. Dit is geen actuele bonus die kan worden geclaimd."],
      ["trust", "Ondersteuning", "Illustratieve velden voor reactietijd en ondersteuningskwaliteit van een fictieve aanbieder. Er is geen contact met de ondersteuning getest."],
      ["payments", "Bankieren", "Illustratieve velden voor betaalmethoden, kosten en opnames van een fictieve aanbieder."],
    ],
    faq: [
      ["Is Solvane beschikbaar in mijn land?", "Nee. Solvane is een fictief interfacevoorbeeld en is niet commercieel beschikbaar."],
      ["Hoe actueel is deze beoordeling?", "Dit is vaste testinhoud voor de interface, geen actuele beoordeling van een aanbieder."],
      ["Heeft Solvane voor deze score betaald?", "Nee. Solvane is fictief, de score is illustratief en er bestaat geen commerciële relatie."],
    ],
    seoTitle: "Beoordeling van Solvane Casino",
    seoDescription: "Fictieve uitbetalings- en bonusvelden om de interface te testen; geen bewijs van prestaties van een aanbieder en geen actueel aanbod.",
  },
};

const sv: DemoProfileCopy = {
  title: "Recension av Solvane Casino",
  summary: "Fiktiva recensionsfält för gränssnittstestning; inte belägg för en operatörs resultat eller ett aktuellt erbjudande.",
  reviewContent: "Den här fiktiva recensionen visar endast gränssnittet. Den bygger inte på en verklig operatör, licens, ett erbjudande eller ett prestandatest.",
  pros: ["Spelare som ofta tar ut pengar", "Återkommande livekasinospelare", "Den som tröttnat på försenade utbetalningar"],
  cons: ["Vissa livespel räknas inte in i omsättningskravet", "Inte tillgängligt i alla länder", "VIP-förmåner börjar först efter spel med riktiga pengar"],
  responsibleGamblingTools: ["Insättningsgränser", "Spelpauser", "Självavstängning"],
  bankTransfer: "Banköverföring",
  instant: "Omedelbart",
  liveDealer: "Livecasino",
  bonus: {
    title: "100 % upp till 500 € + 200 gratissnurr",
    summary: "Ett tydligt presenterat välkomsterbjudande där de väsentliga villkoren visas före varje åtgärd.",
    wagering: "Omsättningskrav 35×",
    eligibility: "18+ · Nya kunder · Villkor gäller",
    conditions: ["Villkor visas före åtgärd", "Högsta insats gäller"],
  },
  media: { logo: "fiktiv förhandsvisningslogotyp", hero: "fiktiv medieförhandsvisning i formatet {ratio}" },
  editorial: {
    title: "Fullständig recension",
    summary: "Fiktiva redaktionella fält för gränssnittstestning; inte belägg för en operatörs resultat.",
    author: "B4GAMBLE-redaktionen",
    evidence: ["Fiktivt beläggsfält för utbetalning", "Fiktivt beläggsfält för RTP", "Fiktivt beläggsfält för support"],
    categories: ["Utbetalningar", "Bonusvillkor", "Spel och livecasino", "Kundtjänst"],
    sections: [
      ["payments", "Utbetalningar", "Illustrativa fält för uttagsmetoder och handläggningstider hos en fiktiv operatör. Inget utbetalningstest har genomförts."],
      ["games", "Spel", "Illustrativa fält för antal spel, livebord och RTP hos en fiktiv operatör. Ingen leverantörskatalog har kontrollerats."],
      ["bonuses", "Bonusar", "Illustrativa fält för omsättningskrav, högsta vinst och spelviktning. Detta är inte en aktuell eller tillgänglig bonus."],
      ["trust", "Kundtjänst", "Illustrativa fält för svarstid och kvalitet hos kundtjänsten hos en fiktiv operatör. Ingen kontakt med kundtjänsten har testats."],
      ["payments", "Banktjänster", "Illustrativa fält för betalningsmetoder, avgifter och uttag hos en fiktiv operatör."],
    ],
    faq: [
      ["Är Solvane tillgängligt i mitt land?", "Nej. Solvane är ett fiktivt gränssnittsexempel och har ingen kommersiell tillgänglighet."],
      ["Hur aktuell är den här recensionen?", "Det här är fast testinnehåll för gränssnittet, inte en aktuell operatörsrecension."],
      ["Betalade Solvane för det här betyget?", "Nej. Solvane är fiktivt, betyget är illustrativt och det finns ingen kommersiell relation."],
    ],
    seoTitle: "Recension av Solvane Casino",
    seoDescription: "Fiktiva utbetalnings- och bonusfält för gränssnittstestning; inte belägg för en operatörs resultat eller ett aktuellt erbjudande.",
  },
};

const da: DemoProfileCopy = {
  title: "Anmeldelse af Solvane Casino",
  summary: "Fiktive anmeldelsesfelter til test af brugerfladen; ikke dokumentation for en udbyders resultater eller et aktuelt tilbud.",
  reviewContent: "Denne fiktive anmeldelse viser kun brugerfladen. Den bygger ikke på en rigtig udbyder, licens, et tilbud eller en test af resultater.",
  pros: ["Spillere, der ofte hæver penge", "Faste livekasinospillere", "Alle, der er trætte af forsinkede udbetalinger"],
  cons: ["Nogle livespil tæller ikke med i omsætningskravet", "Ikke tilgængeligt i alle lande", "VIP-fordele begynder først efter spil med rigtige penge"],
  responsibleGamblingTools: ["Indbetalingsgrænser", "Spilpauser", "Selvudelukkelse"],
  bankTransfer: "Bankoverførsel",
  instant: "Straks",
  liveDealer: "Livecasino",
  bonus: {
    title: "100 % op til 500 € + 200 gratis spins",
    summary: "Et tydeligt præsenteret velkomsttilbud, hvor de væsentlige vilkår vises før enhver handling.",
    wagering: "Omsætningskrav 35×",
    eligibility: "18+ · Nye kunder · Vilkår gælder",
    conditions: ["Vilkår vises før handling", "Maksimal indsats gælder"],
  },
  media: { logo: "fiktivt forhåndsvisningslogo", hero: "fiktiv medievisning i formatet {ratio}" },
  editorial: {
    title: "Fuld anmeldelse",
    summary: "Fiktive redaktionelle felter til test af brugerfladen; ikke dokumentation for en udbyders resultater.",
    author: "B4GAMBLE-redaktionen",
    evidence: ["Fiktivt dokumentationsfelt for udbetaling", "Fiktivt dokumentationsfelt for RTP", "Fiktivt dokumentationsfelt for support"],
    categories: ["Udbetalinger", "Bonusvilkår", "Spil og livekasino", "Kundeservice"],
    sections: [
      ["payments", "Udbetalinger", "Illustrative felter for hævemetoder og behandlingstider hos en fiktiv udbyder. Der er ikke udført nogen udbetalingstest."],
      ["games", "Spil", "Illustrative felter for antal spil, liveborde og RTP hos en fiktiv udbyder. Intet udbyderkatalog er kontrolleret."],
      ["bonuses", "Bonusser", "Illustrative felter for omsætningskrav, maksimal gevinst og spilvægtning. Dette er ikke en aktuel eller tilgængelig bonus."],
      ["trust", "Kundeservice", "Illustrative felter for svartid og kvaliteten af kundeservicen hos en fiktiv udbyder. Ingen kontakt med kundeservicen er testet."],
      ["payments", "Bankforhold", "Illustrative felter for betalingsmetoder, gebyrer og hævninger hos en fiktiv udbyder."],
    ],
    faq: [
      ["Er Solvane tilgængeligt i mit land?", "Nej. Solvane er et fiktivt eksempel på brugerfladen og er ikke kommercielt tilgængeligt."],
      ["Hvor aktuel er denne anmeldelse?", "Dette er fast testindhold til brugerfladen, ikke en aktuel anmeldelse af en udbyder."],
      ["Betalte Solvane for denne bedømmelse?", "Nej. Solvane er fiktivt, bedømmelsen er illustrativ, og der findes ingen kommerciel relation."],
    ],
    seoTitle: "Anmeldelse af Solvane Casino",
    seoDescription: "Fiktive udbetalings- og bonusfelter til test af brugerfladen; ikke dokumentation for en udbyders resultater eller et aktuelt tilbud.",
  },
};

const fi: DemoProfileCopy = {
  title: "Solvane Casinon arvio",
  summary: "Kuvitteellisia arviointikenttiä käyttöliittymän testaamiseen; ne eivät ole näyttöä rahapelitoimijan suorituskyvystä eivätkä muodosta nykyistä tarjousta.",
  reviewContent: "Tämä kuvitteellinen arvio havainnollistaa vain käyttöliittymää. Se ei perustu todelliseen rahapelitoimijaan, lisenssiin, tarjoukseen tai suorituskykytestiin.",
  pros: ["Usein varoja nostaville", "Livekasinon vakituisille käyttäjille", "Niille, jotka ovat kyllästyneet viivästyneisiin maksuihin"],
  cons: ["Jotkin livepelit eivät kerrytä kierrätysvaatimusta", "Ei saatavilla kaikissa maissa", "VIP-edut alkavat vasta oikean rahan pelaamisen jälkeen"],
  responsibleGamblingTools: ["Talletusrajat", "Peliaikalisät", "Pelikielto"],
  bankTransfer: "Pankkisiirto",
  instant: "Välitön",
  liveDealer: "Livejakaja",
  bonus: {
    title: "100 % enintään 500 € + 200 ilmaiskierrosta",
    summary: "Selkeästi esitetty tervetulotarjous, jonka olennaiset ehdot näytetään ennen kuin jatkat.",
    wagering: "Kierrätysvaatimus 35×",
    eligibility: "18+ · Uudet asiakkaat · Ehdot ovat voimassa",
    conditions: ["Ehdot näytetään ennen kuin jatkat", "Enimmäispanosraja on voimassa."],
  },
  media: { logo: "kuvitteellinen esikatselulogo", hero: "kuvitteellinen mediakuva suhteessa {ratio}" },
  editorial: {
    title: "Koko arvio",
    summary: "Kuvitteellisia toimituksellisia kenttiä käyttöliittymän testaamiseen; ne eivät ole näyttöä rahapelitoimijan suorituskyvystä.",
    author: "B4GAMBLE-toimitus",
    evidence: ["Kuvitteellinen maksunäyttökenttä", "Kuvitteellinen RTP-näyttökenttä", "Kuvitteellinen asiakastuen näyttökenttä"],
    categories: ["Maksut", "Bonusehdot", "Pelit ja livekasino", "Asiakastuki"],
    sections: [
      ["payments", "Maksut", "Kuvitteellisen rahapelitoimijan nostomenetelmiä ja käsittelyaikoja havainnollistavat kentät. Maksutestiä ei tehty."],
      ["games", "Pelit", "Kuvitteellisen rahapelitoimijan pelimääriä, livepöytiä ja RTP:tä havainnollistavat kentät. Pelitoimittajan luetteloa ei tarkistettu."],
      ["bonuses", "Bonukset", "Kierrätysvaatimusta, enimmäisvoittoa ja pelien painotusta havainnollistavat kentät. Tämä ei ole nykyinen eikä lunastettava bonus."],
      ["trust", "Asiakastuki", "Kuvitteellisen rahapelitoimijan vastausaikaa ja asiakastuen laatua havainnollistavat kentät. Asiakastukiyhteydenottoa ei testattu."],
      ["payments", "Pankkipalvelut", "Kuvitteellisen rahapelitoimijan maksutapoja, maksuja ja nostoja havainnollistavat kentät."],
    ],
    faq: [
      ["Onko Solvane saatavilla maassani?", "Ei. Solvane on kuvitteellinen käyttöliittymäesimerkki eikä se ole kaupallisesti saatavilla."],
      ["Kuinka ajantasainen tämä arvio on?", "Kyse on käyttöliittymän kiinteästä testisisällöstä, ei rahapelitoimijan ajantasaisesta arviosta."],
      ["Maksoiko Solvane tästä pistemäärästä?", "Ei. Solvane on kuvitteellinen, pistemäärä on havainnollistava eikä kaupallista suhdetta ole."],
    ],
    seoTitle: "Solvane Casinon arvio",
    seoDescription: "Kuvitteellisia maksu- ja bonuskenttiä käyttöliittymän testaamiseen; ne eivät ole näyttöä rahapelitoimijan suorituskyvystä eivätkä muodosta nykyistä tarjousta.",
  },
};

const nb: DemoProfileCopy = {
  title: "Anmeldelse av Solvane Casino",
  summary: "Fiktive anmeldelsesfelt for testing av grensesnittet; ikke dokumentasjon på en operatørs resultater eller et aktuelt tilbud.",
  reviewContent: "Denne fiktive anmeldelsen viser bare grensesnittet. Den bygger ikke på en ekte operatør, lisens, et tilbud eller en ytelsestest.",
  pros: ["Spillere som ofte tar ut penger", "Faste livekasino-spillere", "Alle som er lei av forsinkede utbetalinger"],
  cons: ["Noen livespill teller ikke i omsetningskravet", "Ikke tilgjengelig i alle land", "VIP-fordeler starter først etter spill med ekte penger"],
  responsibleGamblingTools: ["Innskuddsgrenser", "Spillepauser", "Selvutestenging"],
  bankTransfer: "Bankoverføring",
  instant: "Umiddelbart",
  liveDealer: "Livekasino",
  bonus: {
    title: "100 % opptil 500 € + 200 gratisspinn",
    summary: "Et tydelig presentert velkomsttilbud der de vesentlige vilkårene vises før enhver handling.",
    wagering: "Omsetningskrav 35×",
    eligibility: "18+ · Nye kunder · Vilkår gjelder",
    conditions: ["Vilkår vises før handling", "Maksimal innsats gjelder"],
  },
  media: { logo: "fiktiv forhåndsvisningslogo", hero: "fiktiv medievisning i formatet {ratio}" },
  editorial: {
    title: "Full anmeldelse",
    summary: "Fiktive redaksjonelle felt for testing av grensesnittet; ikke dokumentasjon på en operatørs resultater.",
    author: "B4GAMBLE-redaksjonen",
    evidence: ["Fiktivt dokumentasjonsfelt for utbetaling", "Fiktivt dokumentasjonsfelt for RTP", "Fiktivt dokumentasjonsfelt for kundestøtte"],
    categories: ["Utbetalinger", "Bonusvilkår", "Spill og livekasino", "Kundestøtte"],
    sections: [
      ["payments", "Utbetalinger", "Illustrative felt for uttaksmetoder og behandlingstid hos en fiktiv operatør. Ingen utbetalingstest ble utført."],
      ["games", "Spill", "Illustrative felt for antall spill, livebord og RTP hos en fiktiv operatør. Ingen leverandørkatalog ble kontrollert."],
      ["bonuses", "Bonuser", "Illustrative felt for omsetningskrav, maksimal gevinst og spillvekting. Dette er ikke en aktuell eller tilgjengelig bonus."],
      ["trust", "Kundestøtte", "Illustrative felt for svartid og kvaliteten på kundestøtten hos en fiktiv operatør. Ingen kontakt med kundestøtten ble testet."],
      ["payments", "Banktjenester", "Illustrative felt for betalingsmetoder, gebyrer og uttak hos en fiktiv operatør."],
    ],
    faq: [
      ["Er Solvane tilgjengelig i landet mitt?", "Nei. Solvane er et fiktivt eksempel på grensesnittet og er ikke kommersielt tilgjengelig."],
      ["Hvor aktuell er denne anmeldelsen?", "Dette er fast testinnhold for grensesnittet, ikke en aktuell operatøranmeldelse."],
      ["Betalte Solvane for denne poengsummen?", "Nei. Solvane er fiktivt, poengsummen er illustrativ og det finnes ingen kommersiell relasjon."],
    ],
    seoTitle: "Anmeldelse av Solvane Casino",
    seoDescription: "Fiktive utbetalings- og bonusfelt for testing av grensesnittet; ikke dokumentasjon på en operatørs resultater eller et aktuelt tilbud.",
  },
};

const catalog: Record<SupportedLocale, DemoProfileCopy> = {
  "en-GB": en,
  "de-DE": de,
  "it-IT": it,
  "es-ES": es,
  "es-PE": es,
  "pt-PT": pt,
  "el-GR": el,
  "nl-NL": nl,
  "sv-SE": sv,
  "da-DK": da,
  "fi-FI": fi,
  "nb-NO": nb,
  "en-CA": en,
  "fr-CA": en,
};

export function demoProfileCopy(locale: SupportedLocale): DemoProfileCopy {
  return catalog[locale];
}
