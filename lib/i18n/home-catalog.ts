import type { SupportedLocale } from "@/lib/market/registry";

export const HOME_SOURCE_COPY = {
  hero: [
    "A self-directed 10-step programme",
    "Control",
    "starts here.",
    "Keep gambling your decision, not a habit: ten short missions help you see your patterns and set limits that actually hold. Free to use. Privacy explained.",
    "Start Programme",
    "10 missions · 5–15 minutes each",
    "Free — no paywall inside, ever",
    "Your words never price anything",
    "Scroll ↓",
  ],
  recognition: [
    "Is gambling becoming",
    "harder to control?",
    "No need to answer us — just notice what feels familiar.",
    "You spend or risk more than you planned.",
    "You return to win back what you lost.",
    "You feel guilt or stress about money or relationships.",
  ],
  programme: [
    "See the product",
    "A plan you can actually see.",
    "missions",
    "weeks, your pace",
    "Free",
    "now and always",
    "01–03 · Understand",
    "See",
    "the pattern.",
    "Notice the trigger, the moment and the cost before the next decision.",
    "04–07 · Build",
    "Write",
    "the rule.",
    "Choose a pause, an alternative action and a limit while the moment is calm.",
    "08–10 · Apply",
    "Use it.",
    "Make it yours.",
    "Try the plan in real life, review what happened and strengthen the next action.",
  ],
  evidence: [
    "Why this exists",
    "Built from evidence.",
    "Honest about its limits.",
    "B4GAMBLE uses public NHS and NICE guidance to shape recognition language and Programme risk boundaries. The complete Programme has not yet been clinically evaluated.",
    "Recognition and support guidance",
    "Used to shape the self-recognition language.",
    "Assessment and treatment guidance",
    "A source for bounded Programme language and risk controls.",
    "Clear limit",
    "No clinical claim",
    "The complete Programme has not yet been clinically evaluated.",
  ],
  trust: [
    "Why trust B4GAMBLE",
    "Two businesses.",
    "One wall between them.",
    "The Programme",
    "Free — no paywall, no upsell inside missions, ever.",
    "Your words never feed offers, rankings or ads.",
    "Request export or deletion through account support; legal and backup retention may apply.",
    "The reviews",
    "Review evidence and limitations are disclosed.",
    "We may earn commission; affiliate compensation does not determine Editor Score or natural editorial ranking.",
    "Every commercial link disclosed.",
    "How we're funded",
  ],
  final: [
    "Start with one",
    "honest minute.",
    "One question at a time. Your starting point builds itself as you answer.",
    "No registration until your starting point is ready.",
  ],
  imageAlts: [
    "Creator at work",
    "Confidence",
    "Writing the plan",
    "Outcome",
    "Noticing the moment",
    "Writing the rule",
    "Applying the plan",
  ],
} as const;

type HomeCopySections = {
  [Section in keyof typeof HOME_SOURCE_COPY]: readonly string[];
};

type EuropeanHomeLocale = Exclude<SupportedLocale, "en-GB" | "en-CA" | "fr-CA">;

const translations = {
  "de-DE": {
    hero: ["Ein selbstbestimmtes Programm in 10 Schritten", "Kontrolle", "beginnt hier.", "Glücksspiel soll deine Entscheidung bleiben, keine Gewohnheit: Zehn kurze Missionen helfen dir, Muster zu erkennen und Grenzen zu setzen, die wirklich halten. Kostenlos nutzbar. Datenschutz erklärt.", "Programm starten", "10 Missionen · jeweils 5–15 Minuten", "Kostenlos — innerhalb des Programms niemals eine Bezahlschranke", "Deine Worte beeinflussen niemals Preise oder Angebote", "Weiter ↓"],
    recognition: ["Wird Glücksspiel", "schwerer zu kontrollieren?", "Du musst uns nicht antworten — achte nur darauf, was dir bekannt vorkommt.", "Du gibst mehr aus oder riskierst mehr als geplant.", "Du kehrst zurück, um Verluste zurückzugewinnen.", "Du empfindest Schuld oder Stress wegen Geld oder Beziehungen."],
    programme: ["Produkt ansehen", "Ein Plan, den du wirklich sehen kannst.", "Missionen", "Wochen, in deinem Tempo", "Kostenlos", "jetzt und immer", "01–03 · Verstehen", "Erkenne", "das Muster.", "Erkenne Auslöser, Moment und Kosten vor der nächsten Entscheidung.", "04–07 · Aufbauen", "Formuliere", "die Regel.", "Wähle eine Pause, eine alternative Handlung und eine Grenze, solange der Moment ruhig ist.", "08–10 · Anwenden", "Nutze ihn.", "Mach ihn zu deinem.", "Erprobe den Plan im Alltag, prüfe, was passiert ist, und stärke den nächsten Schritt."],
    evidence: ["Warum es das gibt", "Auf Evidenz aufgebaut.", "Ehrlich über die Grenzen.", "B4GAMBLE nutzt öffentliche Leitlinien von NHS und NICE, um die Sprache zur Selbsterkennung und die Risikogrenzen des Programms zu gestalten. Das vollständige Programm wurde noch nicht klinisch evaluiert.", "Leitlinien zu Erkennung und Unterstützung", "Dient zur Gestaltung der Sprache zur Selbsterkennung.", "Leitlinien zu Beurteilung und Behandlung", "Eine Quelle für begrenzte Programmsprache und Risikokontrollen.", "Klare Grenze", "Keine klinische Aussage", "Das vollständige Programm wurde noch nicht klinisch evaluiert."],
    trust: ["Warum B4GAMBLE vertrauen", "Zwei Bereiche.", "Eine klare Trennung dazwischen.", "Das Programm", "Kostenlos — keine Bezahlschranke und kein Upselling in den Missionen.", "Deine Worte fließen niemals in Angebote, Rankings oder Werbung ein.", "Fordere Export oder Löschung über den Kontosupport an; gesetzliche und Backup-Aufbewahrung kann gelten.", "Die Bewertungen", "Evidenz und Einschränkungen der Bewertung werden offengelegt.", "Wir können Provision erhalten; die Vergütung durch Partner bestimmt weder den Editor Score noch die natürliche redaktionelle Rangfolge.", "Jeder kommerzielle Link wird offengelegt.", "Wie wir finanziert werden"],
    final: ["Beginne mit einer", "ehrlichen Minute.", "Eine Frage nach der anderen. Dein Ausgangspunkt entsteht während deiner Antworten.", "Keine Registrierung, bevor dein Ausgangspunkt bereit ist."],
    imageAlts: ["Person bei konzentrierter Arbeit", "Zuversicht", "Den Plan aufschreiben", "Ergebnis", "Den Moment wahrnehmen", "Die Regel aufschreiben", "Den Plan anwenden"],
  },
  "it-IT": {
    hero: ["Un programma autonomo in 10 passi", "Il controllo", "inizia qui.", "Fai in modo che il gioco resti una tua decisione, non un'abitudine: dieci brevi missioni ti aiutano a riconoscere i tuoi schemi e a fissare limiti che reggono davvero. Uso gratuito. Privacy spiegata.", "Inizia il programma", "10 missioni · 5–15 minuti ciascuna", "Gratuito — nessun accesso a pagamento, mai", "Le tue parole non determinano mai prezzi o offerte", "Scorri ↓"],
    recognition: ["Il gioco sta diventando", "più difficile da controllare?", "Non devi risponderci: nota soltanto ciò che ti sembra familiare.", "Spendi o rischi più di quanto avevi previsto.", "Torni a giocare per recuperare ciò che hai perso.", "Provi senso di colpa o stress per il denaro o le relazioni."],
    programme: ["Guarda il prodotto", "Un piano che puoi vedere davvero.", "missioni", "settimane, al tuo ritmo", "Gratuito", "ora e sempre", "01–03 · Comprendi", "Osserva", "lo schema.", "Riconosci l'innesco, il momento e il costo prima della prossima decisione.", "04–07 · Costruisci", "Scrivi", "la regola.", "Scegli una pausa, un'azione alternativa e un limite quando il momento è tranquillo.", "08–10 · Applica", "Usalo.", "Fallo tuo.", "Prova il piano nella vita reale, valuta cosa è successo e rafforza l'azione successiva."],
    evidence: ["Perché esiste", "Basato su evidenze.", "Onesto sui propri limiti.", "B4GAMBLE utilizza linee guida pubbliche di NHS e NICE per definire il linguaggio di riconoscimento e i limiti di rischio del programma. Il programma completo non è ancora stato valutato clinicamente.", "Linee guida per riconoscimento e supporto", "Utilizzate per definire il linguaggio di autoriconoscimento.", "Linee guida per valutazione e trattamento", "Una fonte per un linguaggio del programma delimitato e controlli del rischio.", "Limite chiaro", "Nessuna dichiarazione clinica", "Il programma completo non è ancora stato valutato clinicamente."],
    trust: ["Perché fidarsi di B4GAMBLE", "Due attività.", "Una separazione netta tra loro.", "Il programma", "Gratuito: nessun accesso a pagamento e nessuna vendita aggiuntiva nelle missioni.", "Le tue parole non alimentano mai offerte, classifiche o pubblicità.", "Richiedi esportazione o cancellazione tramite l'assistenza account; possono applicarsi obblighi legali e conservazione dei backup.", "Le recensioni", "Le evidenze e i limiti della recensione sono dichiarati.", "Potremmo ricevere commissioni; il compenso di affiliazione non determina l'Editor Score né l'ordine editoriale naturale.", "Ogni link commerciale è dichiarato.", "Come ci finanziamo"],
    final: ["Inizia con un", "minuto sincero.", "Una domanda alla volta. Il tuo punto di partenza prende forma mentre rispondi.", "Nessuna registrazione finché il tuo punto di partenza non è pronto."],
    imageAlts: ["Persona al lavoro", "Fiducia", "Scrivere il piano", "Risultato", "Notare il momento", "Scrivere la regola", "Applicare il piano"],
  },
  "es-ES": {
    hero: ["Un programa autónomo de 10 pasos", "El control", "empieza aquí.", "Haz que el juego siga siendo una decisión, no un hábito: diez misiones breves te ayudan a reconocer tus patrones y a fijar límites que se mantengan. Uso gratuito. Privacidad explicada.", "Iniciar programa", "10 misiones · 5–15 minutos cada una", "Gratis — sin barreras de pago, nunca", "Tus palabras nunca determinan precios ni ofertas", "Desplázate ↓"],
    recognition: ["El juego resulta", "cada vez más difícil de controlar.", "No tienes que respondernos; solo observa qué te resulta familiar.", "Gastas o arriesgas más de lo que habías previsto.", "Vuelves para recuperar lo que perdiste.", "Sientes culpa o estrés por el dinero o las relaciones."],
    programme: ["Ver el producto", "Un plan que realmente puedes ver.", "misiones", "semanas, a tu ritmo", "Gratis", "ahora y siempre", "01–03 · Comprende", "Observa", "el patrón.", "Reconoce el desencadenante, el momento y el coste antes de la siguiente decisión.", "04–07 · Construye", "Escribe", "la regla.", "Elige una pausa, una acción alternativa y un límite mientras el momento está en calma.", "08–10 · Aplica", "Úsalo.", "Hazlo tuyo.", "Prueba el plan en la vida real, revisa qué ocurrió y refuerza la siguiente acción."],
    evidence: ["Por qué existe", "Creado a partir de evidencias.", "Honesto sobre sus límites.", "B4GAMBLE utiliza orientaciones públicas de NHS y NICE para definir el lenguaje de reconocimiento y los límites de riesgo del programa. El programa completo aún no se ha evaluado clínicamente.", "Orientación sobre reconocimiento y apoyo", "Se utiliza para definir el lenguaje de autorreconocimiento.", "Orientación sobre evaluación y tratamiento", "Una fuente para limitar el lenguaje del programa y sus controles de riesgo.", "Límite claro", "Sin afirmaciones clínicas", "El programa completo aún no se ha evaluado clínicamente."],
    trust: ["Por qué confiar en B4GAMBLE", "Dos actividades.", "Una separación firme entre ellas.", "El programa", "Gratis: sin barreras de pago ni ventas adicionales dentro de las misiones.", "Tus palabras nunca alimentan ofertas, clasificaciones ni anuncios.", "Solicita la exportación o eliminación mediante el soporte de la cuenta; pueden aplicarse retenciones legales y de copias de seguridad.", "Las reseñas", "Se indican las evidencias y las limitaciones de la reseña.", "Podemos recibir comisiones; la remuneración de afiliación no determina el Editor Score ni el orden editorial natural.", "Todos los enlaces comerciales se identifican.", "Cómo nos financiamos"],
    final: ["Empieza con un", "minuto sincero.", "Una pregunta cada vez. Tu punto de partida toma forma mientras respondes.", "No hace falta registrarse hasta que tu punto de partida esté listo."],
    imageAlts: ["Persona trabajando", "Confianza", "Escribir el plan", "Resultado", "Observar el momento", "Escribir la regla", "Aplicar el plan"],
  },
  "pt-PT": {
    hero: ["Um programa autónomo de 10 passos", "O controlo", "começa aqui.", "Mantenha o jogo como uma decisão sua, não um hábito: dez missões curtas ajudam a reconhecer padrões e a definir limites que se mantêm. Utilização gratuita. Privacidade explicada.", "Iniciar programa", "10 missões · 5–15 minutos cada", "Gratuito — sem acesso pago, nunca", "As suas palavras nunca definem preços nem ofertas", "Desloque ↓"],
    recognition: ["O jogo está a tornar-se", "mais difícil de controlar?", "Não precisa de nos responder — repare apenas no que lhe parece familiar.", "Gasta ou arrisca mais do que planeou.", "Volta para recuperar o que perdeu.", "Sente culpa ou stress devido ao dinheiro ou às relações."],
    programme: ["Ver o produto", "Um plano que consegue realmente ver.", "missões", "semanas, ao seu ritmo", "Gratuito", "agora e sempre", "01–03 · Compreender", "Veja", "o padrão.", "Identifique o gatilho, o momento e o custo antes da próxima decisão.", "04–07 · Construir", "Escreva", "a regra.", "Escolha uma pausa, uma ação alternativa e um limite enquanto o momento está calmo.", "08–10 · Aplicar", "Use-o.", "Torne-o seu.", "Experimente o plano na vida real, reveja o que aconteceu e reforce a ação seguinte."],
    evidence: ["Porque existe", "Construído com base em evidência.", "Honesto quanto aos seus limites.", "A B4GAMBLE utiliza orientações públicas do NHS e do NICE para definir a linguagem de reconhecimento e os limites de risco do programa. O programa completo ainda não foi avaliado clinicamente.", "Orientações de reconhecimento e apoio", "Utilizadas para definir a linguagem de autorreconhecimento.", "Orientações de avaliação e tratamento", "Uma fonte para linguagem delimitada do programa e controlos de risco.", "Limite claro", "Sem alegação clínica", "O programa completo ainda não foi avaliado clinicamente."],
    trust: ["Porque confiar na B4GAMBLE", "Duas atividades.", "Uma separação firme entre elas.", "O programa", "Gratuito — sem acesso pago nem vendas adicionais dentro das missões.", "As suas palavras nunca alimentam ofertas, classificações ou anúncios.", "Peça exportação ou eliminação através do apoio à conta; podem aplicar-se retenções legais e de cópias de segurança.", "As análises", "A evidência e as limitações da análise são divulgadas.", "Podemos receber comissão; a remuneração de afiliado não determina o Editor Score nem a ordenação editorial natural.", "Todos os links comerciais são identificados.", "Como somos financiados"],
    final: ["Comece com um", "minuto honesto.", "Uma pergunta de cada vez. O seu ponto de partida constrói-se à medida que responde.", "Não é necessário registo até o seu ponto de partida estar pronto."],
    imageAlts: ["Pessoa a trabalhar", "Confiança", "Escrever o plano", "Resultado", "Reconhecer o momento", "Escrever a regra", "Aplicar o plano"],
  },
  "el-GR": {
    hero: ["Ένα αυτοκαθοδηγούμενο πρόγραμμα 10 βημάτων", "Ο έλεγχος", "ξεκινά εδώ.", "Κράτησε τα τυχερά παιχνίδια ως δική σου απόφαση, όχι ως συνήθεια: δέκα σύντομες αποστολές σε βοηθούν να αναγνωρίσεις τα μοτίβα σου και να θέσεις όρια που αντέχουν. Δωρεάν χρήση. Η ιδιωτικότητα εξηγείται.", "Έναρξη προγράμματος", "10 αποστολές · 5–15 λεπτά η καθεμία", "Δωρεάν — χωρίς συνδρομή μέσα στο πρόγραμμα", "Τα λόγια σου δεν καθορίζουν ποτέ τιμές ή προσφορές", "Κύλησε ↓"],
    recognition: ["Γίνονται τα τυχερά παιχνίδια", "πιο δύσκολα στον έλεγχο;", "Δεν χρειάζεται να μας απαντήσεις — απλώς παρατήρησε τι σου φαίνεται οικείο.", "Ξοδεύεις ή διακινδυνεύεις περισσότερα από όσα σχεδίαζες.", "Επιστρέφεις για να κερδίσεις πίσω όσα έχασες.", "Νιώθεις ενοχή ή άγχος για χρήματα ή σχέσεις."],
    programme: ["Δες το προϊόν", "Ένα σχέδιο που μπορείς πραγματικά να δεις.", "αποστολές", "εβδομάδες, με τον ρυθμό σου", "Δωρεάν", "τώρα και πάντα", "01–03 · Κατανόησε", "Δες", "το μοτίβο.", "Παρατήρησε το έναυσμα, τη στιγμή και το κόστος πριν από την επόμενη απόφαση.", "04–07 · Χτίσε", "Γράψε", "τον κανόνα.", "Επίλεξε μια παύση, μια εναλλακτική ενέργεια και ένα όριο όσο η στιγμή είναι ήρεμη.", "08–10 · Εφάρμοσε", "Χρησιμοποίησέ το.", "Κάν’ το δικό σου.", "Δοκίμασε το σχέδιο στην πραγματική ζωή, εξέτασε τι συνέβη και ενίσχυσε την επόμενη ενέργεια."],
    evidence: ["Γιατί υπάρχει", "Βασισμένο σε τεκμήρια.", "Ειλικρινές για τα όριά του.", "Η B4GAMBLE χρησιμοποιεί δημόσιες οδηγίες των NHS και NICE για τη γλώσσα αναγνώρισης και τα όρια κινδύνου του προγράμματος. Το πλήρες πρόγραμμα δεν έχει ακόμη αξιολογηθεί κλινικά.", "Οδηγίες αναγνώρισης και υποστήριξης", "Χρησιμοποιούνται για τη διαμόρφωση της γλώσσας αυτοαναγνώρισης.", "Οδηγίες αξιολόγησης και θεραπείας", "Πηγή για οριοθετημένη γλώσσα προγράμματος και ελέγχους κινδύνου.", "Σαφές όριο", "Χωρίς κλινικό ισχυρισμό", "Το πλήρες πρόγραμμα δεν έχει ακόμη αξιολογηθεί κλινικά."],
    trust: ["Γιατί να εμπιστευτείς την B4GAMBLE", "Δύο δραστηριότητες.", "Ένας σαφής διαχωρισμός ανάμεσά τους.", "Το πρόγραμμα", "Δωρεάν — χωρίς συνδρομή ή πρόσθετες πωλήσεις μέσα στις αποστολές.", "Τα λόγια σου δεν τροφοδοτούν ποτέ προσφορές, κατατάξεις ή διαφημίσεις.", "Ζήτησε εξαγωγή ή διαγραφή μέσω της υποστήριξης λογαριασμού· ενδέχεται να ισχύει νομική διατήρηση και διατήρηση αντιγράφων ασφαλείας.", "Οι αξιολογήσεις", "Τα τεκμήρια και οι περιορισμοί της αξιολόγησης γνωστοποιούνται.", "Ενδέχεται να λαμβάνουμε προμήθεια· η αμοιβή συνεργατών δεν καθορίζει το Editor Score ούτε τη φυσική συντακτική κατάταξη.", "Κάθε εμπορικός σύνδεσμος γνωστοποιείται.", "Πώς χρηματοδοτούμαστε"],
    final: ["Ξεκίνα με ένα", "ειλικρινές λεπτό.", "Μία ερώτηση κάθε φορά. Το σημείο εκκίνησής σου διαμορφώνεται καθώς απαντάς.", "Δεν απαιτείται εγγραφή μέχρι να είναι έτοιμο το σημείο εκκίνησής σου."],
    imageAlts: ["Άτομο που εργάζεται", "Αυτοπεποίθηση", "Καταγραφή του σχεδίου", "Αποτέλεσμα", "Παρατήρηση της στιγμής", "Καταγραφή του κανόνα", "Εφαρμογή του σχεδίου"],
  },
  "nl-NL": {
    hero: ["Een zelfgestuurd programma in 10 stappen", "Controle", "begint hier.", "Laat gokken jouw beslissing blijven, geen gewoonte: tien korte missies helpen je patronen herkennen en grenzen stellen die echt standhouden. Gratis te gebruiken. Privacy uitgelegd.", "Programma starten", "10 missies · elk 5–15 minuten", "Gratis — nooit een betaalmuur binnen het programma", "Jouw woorden bepalen nooit prijzen of aanbiedingen", "Scroll ↓"],
    recognition: ["Wordt gokken", "moeilijker te beheersen?", "Je hoeft ons geen antwoord te geven — merk alleen op wat vertrouwd voelt.", "Je geeft meer uit of riskeert meer dan je van plan was.", "Je keert terug om terug te winnen wat je verloor.", "Je voelt schuld of stress over geld of relaties."],
    programme: ["Bekijk het product", "Een plan dat je echt kunt zien.", "missies", "weken, in jouw tempo", "Gratis", "nu en altijd", "01–03 · Begrijp", "Zie", "het patroon.", "Herken de aanleiding, het moment en de kosten vóór de volgende beslissing.", "04–07 · Bouw", "Schrijf", "de regel.", "Kies een pauze, een andere actie en een grens terwijl het moment rustig is.", "08–10 · Pas toe", "Gebruik het.", "Maak het van jou.", "Probeer het plan in het echte leven, bekijk wat er gebeurde en versterk de volgende actie."],
    evidence: ["Waarom dit bestaat", "Gebouwd op bewijs.", "Eerlijk over de beperkingen.", "B4GAMBLE gebruikt openbare richtlijnen van NHS en NICE om herkenningstaal en risicogrenzen voor het programma vorm te geven. Het volledige programma is nog niet klinisch geëvalueerd.", "Richtlijnen voor herkenning en ondersteuning", "Gebruikt om taal voor zelfherkenning vorm te geven.", "Richtlijnen voor beoordeling en behandeling", "Een bron voor begrensde programmataal en risicobeheersing.", "Duidelijke grens", "Geen klinische claim", "Het volledige programma is nog niet klinisch geëvalueerd."],
    trust: ["Waarom B4GAMBLE vertrouwen", "Twee activiteiten.", "Een strikte scheiding ertussen.", "Het programma", "Gratis — nooit een betaalmuur of upsell binnen de missies.", "Jouw woorden voeden nooit aanbiedingen, ranglijsten of advertenties.", "Vraag export of verwijdering aan via accountondersteuning; wettelijke en back-upbewaring kan van toepassing zijn.", "De beoordelingen", "Bewijs en beperkingen van de beoordeling worden vermeld.", "We kunnen commissie ontvangen; affiliatevergoeding bepaalt niet de Editor Score of de natuurlijke redactionele rangschikking.", "Elke commerciële link wordt bekendgemaakt.", "Hoe we worden gefinancierd"],
    final: ["Begin met één", "eerlijke minuut.", "Eén vraag tegelijk. Je startpunt vormt zich terwijl je antwoordt.", "Geen registratie totdat je startpunt gereed is."],
    imageAlts: ["Persoon aan het werk", "Vertrouwen", "Het plan opschrijven", "Resultaat", "Het moment opmerken", "De regel opschrijven", "Het plan toepassen"],
  },
  "sv-SE": {
    hero: ["Ett självstyrt program i 10 steg", "Kontroll", "börjar här.", "Låt spelande förbli ditt beslut, inte en vana: tio korta uppdrag hjälper dig att se dina mönster och sätta gränser som håller. Gratis att använda. Integriteten förklaras.", "Starta programmet", "10 uppdrag · 5–15 minuter vardera", "Gratis — aldrig någon betalvägg i programmet", "Dina ord styr aldrig priser eller erbjudanden", "Rulla ↓"],
    recognition: ["Blir spelandet", "svårare att kontrollera?", "Du behöver inte svara oss — lägg bara märke till vad som känns bekant.", "Du spenderar eller riskerar mer än du planerade.", "Du återvänder för att vinna tillbaka det du förlorade.", "Du känner skuld eller stress över pengar eller relationer."],
    programme: ["Se produkten", "En plan du faktiskt kan se.", "uppdrag", "veckor, i din takt", "Gratis", "nu och alltid", "01–03 · Förstå", "Se", "mönstret.", "Lägg märke till utlösaren, stunden och kostnaden före nästa beslut.", "04–07 · Bygg", "Skriv", "regeln.", "Välj en paus, en alternativ handling och en gräns medan stunden är lugn.", "08–10 · Tillämpa", "Använd den.", "Gör den till din.", "Prova planen i vardagen, granska vad som hände och stärk nästa handling."],
    evidence: ["Varför detta finns", "Byggt på evidens.", "Ärligt om sina begränsningar.", "B4GAMBLE använder offentliga riktlinjer från NHS och NICE för att forma igenkänningsspråk och programmets riskgränser. Det fullständiga programmet har ännu inte utvärderats kliniskt.", "Riktlinjer för igenkänning och stöd", "Används för att forma språk för självigenkänning.", "Riktlinjer för bedömning och behandling", "En källa för avgränsat programspråk och riskkontroller.", "Tydlig gräns", "Inget kliniskt påstående", "Det fullständiga programmet har ännu inte utvärderats kliniskt."],
    trust: ["Varför lita på B4GAMBLE", "Två verksamheter.", "En tydlig gräns mellan dem.", "Programmet", "Gratis — ingen betalvägg eller merförsäljning i uppdragen.", "Dina ord används aldrig för erbjudanden, rankningar eller annonser.", "Begär export eller radering via kontosupporten; rättslig lagring och säkerhetskopior kan gälla.", "Recensionerna", "Recensionens evidens och begränsningar redovisas.", "Vi kan få provision; affiliateersättning styr inte Editor Score eller den naturliga redaktionella rankningen.", "Varje kommersiell länk redovisas.", "Så finansieras vi"],
    final: ["Börja med en", "ärlig minut.", "En fråga i taget. Din utgångspunkt tar form medan du svarar.", "Ingen registrering innan din utgångspunkt är klar."],
    imageAlts: ["Person som arbetar", "Självförtroende", "Skriva planen", "Resultat", "Lägga märke till stunden", "Skriva regeln", "Tillämpa planen"],
  },
  "da-DK": {
    hero: ["Et selvstyret program i 10 trin", "Kontrol", "begynder her.", "Lad spil forblive din beslutning, ikke en vane: ti korte missioner hjælper dig med at se dine mønstre og sætte grænser, der holder. Gratis at bruge. Privatliv forklaret.", "Start programmet", "10 missioner · 5–15 minutter hver", "Gratis — aldrig en betalingsmur i programmet", "Dine ord bestemmer aldrig priser eller tilbud", "Rul ↓"],
    recognition: ["Bliver spil", "sværere at kontrollere?", "Du behøver ikke svare os — læg blot mærke til, hvad der virker bekendt.", "Du bruger eller risikerer mere, end du planlagde.", "Du vender tilbage for at vinde det tabte tilbage.", "Du føler skyld eller stress over penge eller relationer."],
    programme: ["Se produktet", "En plan, du faktisk kan se.", "missioner", "uger, i dit tempo", "Gratis", "nu og altid", "01–03 · Forstå", "Se", "mønstret.", "Læg mærke til udløseren, øjeblikket og omkostningen før den næste beslutning.", "04–07 · Byg", "Skriv", "reglen.", "Vælg en pause, en alternativ handling og en grænse, mens øjeblikket er roligt.", "08–10 · Anvend", "Brug den.", "Gør den til din.", "Prøv planen i virkeligheden, gennemgå hvad der skete, og styrk den næste handling."],
    evidence: ["Hvorfor dette findes", "Bygget på evidens.", "Ærlig om sine begrænsninger.", "B4GAMBLE bruger offentlige retningslinjer fra NHS og NICE til at forme genkendelsessprog og programmets risikogrænser. Det fulde program er endnu ikke blevet klinisk evalueret.", "Vejledning om genkendelse og støtte", "Bruges til at forme sproget for selvgenkendelse.", "Vejledning om vurdering og behandling", "En kilde til afgrænset programsprog og risikokontrol.", "Tydelig grænse", "Ingen klinisk påstand", "Det fulde program er endnu ikke blevet klinisk evalueret."],
    trust: ["Hvorfor stole på B4GAMBLE", "To aktiviteter.", "En klar adskillelse mellem dem.", "Programmet", "Gratis — ingen betalingsmur eller mersalg i missionerne.", "Dine ord bruges aldrig til tilbud, rangeringer eller annoncer.", "Anmod om eksport eller sletning via kontosupport; juridisk opbevaring og sikkerhedskopier kan gælde.", "Anmeldelserne", "Anmeldelsens evidens og begrænsninger oplyses.", "Vi kan modtage provision; affiliatebetaling bestemmer ikke Editor Score eller den naturlige redaktionelle rangering.", "Alle kommercielle links oplyses.", "Sådan finansieres vi"],
    final: ["Begynd med ét", "ærligt minut.", "Ét spørgsmål ad gangen. Dit udgangspunkt tager form, mens du svarer.", "Ingen registrering, før dit udgangspunkt er klar."],
    imageAlts: ["Person i arbejde", "Selvtillid", "Skrive planen", "Resultat", "Bemærke øjeblikket", "Skrive reglen", "Anvende planen"],
  },
  "fi-FI": {
    hero: ["Itsenäisesti etenevä 10 vaiheen ohjelma", "Hallinta", "alkaa tästä.", "Pidä rahapelaaminen omana päätöksenäsi, ei tapana: kymmenen lyhyttä tehtävää auttaa tunnistamaan toimintamalleja ja asettamaan pitäviä rajoja. Maksuton käyttää. Yksityisyys selitetään.", "Aloita ohjelma", "10 tehtävää · 5–15 minuuttia kukin", "Maksuton — ei koskaan maksumuuria ohjelman sisällä", "Sanasi eivät koskaan määritä hintoja tai tarjouksia", "Vieritä ↓"],
    recognition: ["Onko rahapelaamista", "yhä vaikeampi hallita?", "Sinun ei tarvitse vastata meille — huomaa vain, mikä tuntuu tutulta.", "Käytät tai riskeeraat enemmän kuin suunnittelit.", "Palaat voittaaksesi takaisin menettämäsi.", "Tunnet syyllisyyttä tai stressiä rahasta tai ihmissuhteista."],
    programme: ["Katso tuote", "Suunnitelma, jonka voit oikeasti nähdä.", "tehtävää", "viikkoa, omaan tahtiin", "Maksuton", "nyt ja aina", "01–03 · Ymmärrä", "Näe", "toimintamalli.", "Huomaa laukaiseva tekijä, hetki ja kustannus ennen seuraavaa päätöstä.", "04–07 · Rakenna", "Kirjoita", "sääntö.", "Valitse tauko, vaihtoehtoinen toiminta ja raja silloin, kun hetki on rauhallinen.", "08–10 · Sovella", "Käytä sitä.", "Tee siitä omasi.", "Kokeile suunnitelmaa arjessa, arvioi mitä tapahtui ja vahvista seuraavaa toimintaa."],
    evidence: ["Miksi tämä on olemassa", "Perustuu näyttöön.", "Rehellinen rajoituksistaan.", "B4GAMBLE käyttää NHS:n ja NICE:n julkisia ohjeita tunnistamiskielen ja ohjelman riskirajojen muotoiluun. Koko ohjelmaa ei ole vielä arvioitu kliinisesti.", "Tunnistamisen ja tuen ohjeistus", "Käytetään itsensä tunnistamisen kielen muotoiluun.", "Arvioinnin ja hoidon ohjeistus", "Lähde rajatulle ohjelmakielelle ja riskienhallinnalle.", "Selkeä raja", "Ei kliinistä väitettä", "Koko ohjelmaa ei ole vielä arvioitu kliinisesti."],
    trust: ["Miksi luottaa B4GAMBLEen", "Kaksi toimintoa.", "Selkeä raja niiden välillä.", "Ohjelma", "Maksuton — ei maksumuuria eikä lisämyyntiä tehtävissä.", "Sanojasi ei koskaan käytetä tarjouksiin, sijoituksiin tai mainoksiin.", "Pyydä vientiä tai poistamista tilituen kautta; lakisääteinen ja varmuuskopioiden säilytys voi tulla sovellettavaksi.", "Arviot", "Arvion näyttö ja rajoitukset ilmoitetaan.", "Voimme saada palkkion; kumppanikorvaus ei määritä Editor Scorea eikä luonnollista toimituksellista järjestystä.", "Kaikki kaupalliset linkit ilmoitetaan.", "Miten toimintamme rahoitetaan"],
    final: ["Aloita yhdestä", "rehellisestä minuutista.", "Yksi kysymys kerrallaan. Lähtökohtasi rakentuu vastaustesi myötä.", "Rekisteröitymistä ei tarvita ennen kuin lähtökohtasi on valmis."],
    imageAlts: ["Työskentelevä henkilö", "Luottamus", "Suunnitelman kirjoittaminen", "Tulos", "Hetken huomaaminen", "Säännön kirjoittaminen", "Suunnitelman soveltaminen"],
  },
  "nb-NO": {
    hero: ["Et selvstyrt program i 10 trinn", "Kontroll", "starter her.", "La pengespill forbli din beslutning, ikke en vane: ti korte oppdrag hjelper deg å se mønstrene dine og sette grenser som holder. Gratis å bruke. Personvern forklart.", "Start programmet", "10 oppdrag · 5–15 minutter hver", "Gratis — aldri en betalingsmur i programmet", "Ordene dine bestemmer aldri priser eller tilbud", "Rull ↓"],
    recognition: ["Blir pengespill", "vanskeligere å kontrollere?", "Du trenger ikke svare oss — legg bare merke til det som virker kjent.", "Du bruker eller risikerer mer enn du planla.", "Du vender tilbake for å vinne tilbake det du tapte.", "Du føler skyld eller stress på grunn av penger eller relasjoner."],
    programme: ["Se produktet", "En plan du faktisk kan se.", "oppdrag", "uker, i ditt tempo", "Gratis", "nå og alltid", "01–03 · Forstå", "Se", "mønsteret.", "Legg merke til utløseren, øyeblikket og kostnaden før neste beslutning.", "04–07 · Bygg", "Skriv", "regelen.", "Velg en pause, en alternativ handling og en grense mens øyeblikket er rolig.", "08–10 · Bruk", "Bruk den.", "Gjør den til din.", "Prøv planen i hverdagen, vurder hva som skjedde, og styrk neste handling."],
    evidence: ["Hvorfor dette finnes", "Bygget på evidens.", "Ærlig om begrensningene.", "B4GAMBLE bruker offentlige retningslinjer fra NHS og NICE til å forme gjenkjenningsspråk og programmets risikogrenser. Hele programmet er ennå ikke klinisk evaluert.", "Veiledning om gjenkjenning og støtte", "Brukes til å forme språket for selvgjenkjenning.", "Veiledning om vurdering og behandling", "En kilde for avgrenset programspråk og risikokontroll.", "Tydelig grense", "Ingen klinisk påstand", "Hele programmet er ennå ikke klinisk evaluert."],
    trust: ["Hvorfor stole på B4GAMBLE", "To aktiviteter.", "Et tydelig skille mellom dem.", "Programmet", "Gratis — ingen betalingsmur eller mersalg i oppdragene.", "Ordene dine brukes aldri til tilbud, rangeringer eller annonser.", "Be om eksport eller sletting via kontostøtte; juridisk lagring og sikkerhetskopier kan gjelde.", "Anmeldelsene", "Anmeldelsens evidens og begrensninger oppgis.", "Vi kan motta provisjon; affiliatebetaling bestemmer ikke Editor Score eller den naturlige redaksjonelle rangeringen.", "Alle kommersielle lenker oppgis.", "Slik finansieres vi"],
    final: ["Begynn med ett", "ærlig minutt.", "Ett spørsmål om gangen. Utgangspunktet ditt tar form mens du svarer.", "Ingen registrering før utgangspunktet ditt er klart."],
    imageAlts: ["Person i arbeid", "Selvtillit", "Skrive planen", "Resultat", "Legge merke til øyeblikket", "Skrive regelen", "Bruke planen"],
  },
} as const satisfies Record<EuropeanHomeLocale, HomeCopySections>;

const metadata = {
  "en-GB": { title: "B4GAMBLE | Know your limits before you play", description: "Educational tools, private self-checks and transparent casino comparison to help adults understand risks and set personal limits before they play." },
  "de-DE": { title: "B4GAMBLE | Kenne deine Grenzen, bevor du spielst", description: "Lernangebote, private Selbstchecks und transparente Casino-Vergleiche helfen Erwachsenen, Risiken zu verstehen und persönliche Grenzen zu setzen, bevor sie spielen." },
  "it-IT": { title: "B4GAMBLE | Conosci i tuoi limiti prima di giocare", description: "Strumenti educativi, autovalutazioni private e confronti trasparenti aiutano gli adulti a comprendere i rischi e a fissare limiti personali prima di giocare." },
  "es-ES": { title: "B4GAMBLE | Conoce tus límites antes de jugar", description: "Herramientas educativas, autoevaluaciones privadas y comparaciones transparentes ayudan a las personas adultas a comprender los riesgos y fijar límites antes de jugar." },
  "pt-PT": { title: "B4GAMBLE | Conheça os seus limites antes de jogar", description: "Ferramentas educativas, autoavaliações privadas e comparações transparentes ajudam adultos a compreender os riscos e a definir limites pessoais antes de jogar." },
  "el-GR": { title: "B4GAMBLE | Γνώρισε τα όριά σου πριν παίξεις", description: "Εκπαιδευτικά εργαλεία, ιδιωτικοί αυτοέλεγχοι και διαφανείς συγκρίσεις βοηθούν τους ενήλικες να κατανοούν τους κινδύνους και να θέτουν προσωπικά όρια πριν παίξουν." },
  "nl-NL": { title: "B4GAMBLE | Ken je grenzen voordat je speelt", description: "Educatieve hulpmiddelen, private zelfchecks en transparante casinovergelijkingen helpen volwassenen risico's te begrijpen en persoonlijke grenzen te stellen voordat zij spelen." },
  "sv-SE": { title: "B4GAMBLE | Känn dina gränser innan du spelar", description: "Utbildningsverktyg, privata självkontroller och transparenta casinojämförelser hjälper vuxna att förstå risker och sätta personliga gränser innan de spelar." },
  "da-DK": { title: "B4GAMBLE | Kend dine grænser, før du spiller", description: "Læringsværktøjer, private selvtests og gennemsigtige casinosammenligninger hjælper voksne med at forstå risici og sætte personlige grænser, før de spiller." },
  "fi-FI": { title: "B4GAMBLE | Tunnista rajasi ennen pelaamista", description: "Oppimistyökalut, yksityiset itsearvioinnit ja läpinäkyvät kasinovertailut auttavat aikuisia ymmärtämään riskejä ja asettamaan henkilökohtaisia rajoja ennen pelaamista." },
  "nb-NO": { title: "B4GAMBLE | Kjenn grensene dine før du spiller", description: "Læringsverktøy, private selvsjekker og åpne kasinosammenligninger hjelper voksne med å forstå risiko og sette personlige grenser før de spiller." },
  "en-CA": { title: "B4GAMBLE | Know your limits before you play", description: "Educational tools and transparent information to help adults understand gambling risks and set personal limits before they play." },
  "fr-CA": { title: "B4GAMBLE | Connaissez vos limites avant de jouer", description: "Des outils éducatifs et de l’information transparente pour aider les adultes à comprendre les risques et à fixer leurs limites avant de jouer." },
} as const satisfies Record<SupportedLocale, { title: string; description: string }>;

export function homeMetadata(locale: SupportedLocale) {
  return metadata[locale];
}

export function homeTranslation(locale: SupportedLocale): HomeCopySections | null {
  if (locale === "en-GB" || locale === "en-CA" || locale === "fr-CA") return null;
  return translations[locale];
}
