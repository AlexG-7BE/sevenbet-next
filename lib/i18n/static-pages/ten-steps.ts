import type { SupportedLocale } from "@/lib/market/registry";

export const TEN_STEPS_SOURCE_COPY = [
  "The Programme, step by step", "Ten steps.", "One", "plan.",
  "Each mission takes 5–15 minutes and ends with something you keep. Here's exactly what happens — no surprises, no fine print.",
  "Start Mission 01", "Why B4GAMBLE →", "01–03 Understand", "04–07 Build", "08–10 Apply", "Scroll ↓",
  "What you will build", "Three things you'll have at the end.", "A clear picture", "Your triggers, patterns and the moments decisions actually happen.",
  "Working boundaries", "Limits you design, test in real weeks, and adjust until they hold.", "A reviewable plan", "One document that says how you play — yours to revisit any time.", "The path",
  "Get started", "Say what's happening; get your Starting Point.", "Set your limits", "First pass at time and money lines.",
  "Understand your triggers", "Map the moments that start sessions.", "Build one boundary", "One limit you can keep this week.",
  "Reality check", "An honest week-two look at the numbers.", "Decision framework", "A simple rule for yes, no and not-tonight.",
  "Play plan", "Write the plan you'll actually follow.", "Safer play", "Reduce friction, judge operators, protect your plan.",
  "Review &amp; adjust", "See what held. Fix what didn't.", "Long-term control", "Turn ten missions into a habit that lasts.",
  "Start private", "What you say here,", "stays here.", "Your situation and plan are never used for offers, rankings or ads.",
  "Request export or deletion through account support; legal and backup retention may apply.", "No mission ever asks you to deposit, claim or play.",
  "Mission 01 takes about", "one minute.", "No registration until your starting point is ready.",
  "Ten lanterns along a dark path, first ones lit — sequence and destination",
] as const;

export type TenStepsTranslation = Readonly<{
  metadataTitle: string;
  metadataDescription: string;
  text: readonly string[];
}>;

const en: TenStepsTranslation = {
  metadataTitle: "The B4GAMBLE 10-Step Programme",
  metadataDescription: "See how ten self-directed missions build a personal Starting Point and control plan.",
  text: TEN_STEPS_SOURCE_COPY,
};

const catalog: Record<SupportedLocale, TenStepsTranslation> = {
  "en-GB": en,
  "de-DE": { metadataTitle: "Das 10-Schritte-Programm von B4GAMBLE", metadataDescription: "Sieh, wie zehn selbstbestimmte Missionen einen persönlichen Ausgangspunkt und Kontrollplan aufbauen.", text: [
    "Das Programm, Schritt für Schritt", "Zehn Schritte.", "Ein", "Plan.", "Jede Mission dauert 5–15 Minuten und endet mit etwas, das du behältst. Hier siehst du genau, was geschieht — ohne Überraschungen und Kleingedrucktes.", "Mission 01 starten", "Warum B4GAMBLE →", "01–03 Verstehen", "04–07 Aufbauen", "08–10 Anwenden", "Scrollen ↓",
    "Was du aufbaust", "Drei Dinge, die du am Ende hast.", "Ein klares Bild", "Deine Auslöser, Muster und die Momente, in denen Entscheidungen wirklich fallen.", "Tragfähige Grenzen", "Grenzen, die du entwirfst, in echten Wochen testest und anpasst, bis sie halten.", "Ein überprüfbarer Plan", "Ein Dokument darüber, wie du spielst — jederzeit von dir überprüfbar.", "Der Weg",
    "Loslegen", "Sag, was geschieht, und erhalte deinen Ausgangspunkt.", "Setze deine Grenzen", "Ein erster Entwurf für Zeit- und Geldgrenzen.", "Verstehe deine Auslöser", "Ordne die Momente zu, die Spielsitzungen auslösen.", "Baue eine Grenze", "Eine Grenze, die du diese Woche einhalten kannst.", "Realitätscheck", "Ein ehrlicher Blick auf die Zahlen in Woche zwei.", "Entscheidungsrahmen", "Eine einfache Regel für Ja, Nein und Nicht-heute.", "Spielplan", "Schreibe den Plan, dem du tatsächlich folgen wirst.", "Kontrollierteres Spiel", "Verringere Reibung, beurteile Anbieter und schütze deinen Plan.", "Prüfen und anpassen", "Sieh, was gehalten hat. Repariere, was nicht hielt.", "Langfristige Kontrolle", "Mach aus zehn Missionen eine dauerhafte Gewohnheit.",
    "Privat beginnen", "Was du hier sagst,", "bleibt hier.", "Deine Situation und dein Plan werden nie für Angebote, Rankings oder Werbung verwendet.", "Fordere Export oder Löschung über den Kontosupport an; gesetzliche Aufbewahrung und Sicherungskopien können gelten.", "Keine Mission fordert dich je zu Einzahlung, Bonusannahme oder Spiel auf.", "Mission 01 dauert etwa", "eine Minute.", "Keine Registrierung, bis dein Ausgangspunkt bereit ist.", "Zehn Laternen entlang eines dunklen Weges, die ersten leuchten — Abfolge und Ziel",
  ] },
  "it-IT": { metadataTitle: "Il Programma B4GAMBLE in 10 passi", metadataDescription: "Scopri come dieci missioni autonome costruiscono un Punto di partenza personale e un piano di controllo.", text: [
    "Il Programma, passo dopo passo", "Dieci passi.", "Un", "piano.", "Ogni missione dura 5–15 minuti e termina con qualcosa che conservi. Ecco cosa accade, senza sorprese né clausole nascoste.", "Inizia la Missione 01", "Perché B4GAMBLE →", "01–03 Comprendi", "04–07 Costruisci", "08–10 Applica", "Scorri ↓",
    "Cosa costruirai", "Tre cose che avrai alla fine.", "Un quadro chiaro", "I tuoi fattori scatenanti, gli schemi e i momenti in cui avvengono davvero le decisioni.", "Limiti pratici", "Limiti che progetti, provi in settimane reali e regoli finché funzionano.", "Un piano verificabile", "Un documento che descrive come giochi — da rivedere quando vuoi.", "Il percorso",
    "Inizia", "Descrivi cosa succede e ottieni il tuo Punto di partenza.", "Definisci i tuoi limiti", "Una prima definizione dei limiti di tempo e denaro.", "Comprendi i tuoi fattori scatenanti", "Individua i momenti che avviano le sessioni.", "Costruisci un limite", "Un limite che puoi rispettare questa settimana.", "Verifica della realtà", "Uno sguardo onesto ai numeri della seconda settimana.", "Schema decisionale", "Una regola semplice per sì, no e non stasera.", "Piano di gioco", "Scrivi il piano che seguirai davvero.", "Gioco più controllato", "Riduci gli ostacoli, valuta gli operatori e proteggi il tuo piano.", "Rivedi e adatta", "Vedi cosa ha funzionato. Correggi ciò che non ha funzionato.", "Controllo a lungo termine", "Trasforma dieci missioni in un'abitudine duratura.",
    "Inizia in privato", "Quello che dici qui", "resta qui.", "La tua situazione e il tuo piano non vengono mai usati per offerte, classifiche o pubblicità.", "Richiedi esportazione o cancellazione all'assistenza account; possono valere conservazione legale e copie di sicurezza.", "Nessuna missione ti chiede di depositare, accettare bonus o giocare.", "La Missione 01 richiede circa", "un minuto.", "Nessuna registrazione finché il Punto di partenza non è pronto.", "Dieci lanterne lungo un sentiero buio, le prime accese — sequenza e destinazione",
  ] },
  "es-ES": { metadataTitle: "El Programa de 10 pasos de B4GAMBLE", metadataDescription: "Descubre cómo diez misiones autodirigidas construyen un Punto de partida personal y un plan de control.", text: [
    "El Programa, paso a paso", "Diez pasos.", "Un", "plan.", "Cada misión dura entre 5 y 15 minutos y termina con algo que conservas. Esto es exactamente lo que ocurre, sin sorpresas ni letra pequeña.", "Iniciar la Misión 01", "Por qué B4GAMBLE →", "01–03 Comprender", "04–07 Construir", "08–10 Aplicar", "Desplázate ↓",
    "Lo que construirás", "Tres cosas que tendrás al final.", "Una imagen clara", "Tus desencadenantes, patrones y los momentos en que realmente se toman decisiones.", "Límites prácticos", "Límites que diseñas, pruebas en semanas reales y ajustas hasta que funcionan.", "Un plan revisable", "Un documento que explica cómo juegas, para revisarlo cuando quieras.", "El recorrido",
    "Empezar", "Cuenta qué está pasando y obtén tu Punto de partida.", "Establece tus límites", "Un primer borrador de límites de tiempo y dinero.", "Comprende tus desencadenantes", "Identifica los momentos que inician las sesiones.", "Crea un límite", "Un límite que puedas mantener esta semana.", "Comprobación de la realidad", "Una mirada honesta a las cifras de la segunda semana.", "Marco de decisión", "Una regla sencilla para sí, no y hoy no.", "Plan de juego", "Escribe el plan que realmente seguirás.", "Juego con más control", "Reduce la fricción, evalúa operadores y protege tu plan.", "Revisar y ajustar", "Observa qué funcionó. Corrige lo que no.", "Control a largo plazo", "Convierte diez misiones en un hábito duradero.",
    "Empieza en privado", "Lo que dices aquí", "se queda aquí.", "Tu situación y tu plan nunca se usan para ofertas, clasificaciones ni anuncios.", "Solicita la exportación o eliminación al soporte de cuenta; pueden aplicarse conservación legal y copias de seguridad.", "Ninguna misión te pide depositar, aceptar una promoción ni jugar.", "La Misión 01 tarda aproximadamente", "un minuto.", "No hay registro hasta que tu Punto de partida esté listo.", "Diez faroles a lo largo de un camino oscuro, los primeros encendidos — secuencia y destino",
  ] },
  "pt-PT": { metadataTitle: "O Programa de 10 passos da B4GAMBLE", metadataDescription: "Vê como dez missões autónomas criam um Ponto de partida pessoal e um plano de controlo.", text: [
    "O Programa, passo a passo", "Dez passos.", "Um", "plano.", "Cada missão demora 5–15 minutos e termina com algo que guardas. Aqui está exatamente o que acontece — sem surpresas nem letras pequenas.", "Iniciar a Missão 01", "Porquê B4GAMBLE →", "01–03 Compreender", "04–07 Construir", "08–10 Aplicar", "Deslizar ↓",
    "O que vais construir", "Três coisas que terás no final.", "Uma imagem clara", "Os teus gatilhos, padrões e os momentos em que as decisões realmente acontecem.", "Limites práticos", "Limites que defines, testas em semanas reais e ajustas até funcionarem.", "Um plano revisto", "Um documento que descreve como jogas — para reveres quando quiseres.", "O percurso",
    "Começar", "Diz o que está a acontecer e recebe o teu Ponto de partida.", "Define os teus limites", "Uma primeira versão dos limites de tempo e dinheiro.", "Compreende os teus gatilhos", "Mapeia os momentos que iniciam sessões.", "Cria um limite", "Um limite que consegues manter esta semana.", "Teste à realidade", "Uma análise honesta aos números da segunda semana.", "Estrutura de decisão", "Uma regra simples para sim, não e hoje não.", "Plano de jogo", "Escreve o plano que vais realmente seguir.", "Jogo com mais controlo", "Reduz a fricção, avalia operadores e protege o teu plano.", "Rever e ajustar", "Vê o que resultou. Corrige o que não resultou.", "Controlo a longo prazo", "Transforma dez missões num hábito duradouro.",
    "Começa em privado", "O que dizes aqui", "fica aqui.", "A tua situação e o teu plano nunca são usados para ofertas, classificações ou anúncios.", "Pede exportação ou eliminação ao apoio da conta; podem aplicar-se conservação legal e cópias de segurança.", "Nenhuma missão te pede para depositar, aceitar promoções ou jogar.", "A Missão 01 demora cerca de", "um minuto.", "Sem registo até o teu Ponto de partida estar pronto.", "Dez lanternas ao longo de um caminho escuro, as primeiras acesas — sequência e destino",
  ] },
  "el-GR": { metadataTitle: "Το Πρόγραμμα 10 βημάτων του B4GAMBLE", metadataDescription: "Δες πώς δέκα αυτοκαθοδηγούμενες Αποστολές δημιουργούν ένα προσωπικό Σημείο Εκκίνησης και σχέδιο ελέγχου.", text: [
    "Το Πρόγραμμα, βήμα προς βήμα", "Δέκα βήματα.", "Ένα", "σχέδιο.", "Κάθε Αποστολή διαρκεί 5–15 λεπτά και τελειώνει με κάτι που κρατάς. Δες ακριβώς τι συμβαίνει — χωρίς εκπλήξεις ή ψιλά γράμματα.", "Έναρξη Αποστολής 01", "Γιατί B4GAMBLE →", "01–03 Κατανόηση", "04–07 Δημιουργία", "08–10 Εφαρμογή", "Κύλιση ↓",
    "Τι θα δημιουργήσεις", "Τρία πράγματα που θα έχεις στο τέλος.", "Μια καθαρή εικόνα", "Τα ερεθίσματα, τα μοτίβα και οι στιγμές όπου παίρνονται πραγματικά οι αποφάσεις.", "Λειτουργικά όρια", "Όρια που σχεδιάζεις, δοκιμάζεις σε πραγματικές εβδομάδες και προσαρμόζεις ώσπου να λειτουργούν.", "Ένα αναθεωρήσιμο σχέδιο", "Ένα έγγραφο που περιγράφει πώς παίζεις — για να το εξετάζεις όποτε θέλεις.", "Η διαδρομή",
    "Ξεκίνα", "Πες τι συμβαίνει και λάβε το Σημείο Εκκίνησής σου.", "Θέσε τα όριά σου", "Μια πρώτη εκδοχή ορίων χρόνου και χρημάτων.", "Κατανόησε τα ερεθίσματά σου", "Χαρτογράφησε τις στιγμές που ξεκινούν συνεδρίες.", "Δημιούργησε ένα όριο", "Ένα όριο που μπορείς να τηρήσεις αυτή την εβδομάδα.", "Έλεγχος πραγματικότητας", "Μια ειλικρινής ματιά στους αριθμούς της δεύτερης εβδομάδας.", "Πλαίσιο απόφασης", "Ένας απλός κανόνας για ναι, όχι και όχι-απόψε.", "Σχέδιο παιχνιδιού", "Γράψε το σχέδιο που θα ακολουθήσεις πραγματικά.", "Παιχνίδι με περισσότερο έλεγχο", "Μείωσε την τριβή, αξιολόγησε παρόχους και προστάτεψε το σχέδιό σου.", "Αναθεώρηση και προσαρμογή", "Δες τι άντεξε. Διόρθωσε ό,τι δεν άντεξε.", "Μακροπρόθεσμος έλεγχος", "Μετέτρεψε δέκα Αποστολές σε συνήθεια που διαρκεί.",
    "Ξεκίνα ιδιωτικά", "Όσα λες εδώ", "μένουν εδώ.", "Η κατάστασή σου και το σχέδιό σου δεν χρησιμοποιούνται ποτέ για προσφορές, κατατάξεις ή διαφημίσεις.", "Ζήτησε εξαγωγή ή διαγραφή από την υποστήριξη λογαριασμού· μπορεί να ισχύει νομική διατήρηση και αντίγραφα ασφαλείας.", "Καμία Αποστολή δεν σου ζητά να καταθέσεις, να αποδεχτείς προσφορά ή να παίξεις.", "Η Αποστολή 01 διαρκεί περίπου", "ένα λεπτό.", "Καμία εγγραφή μέχρι να είναι έτοιμο το Σημείο Εκκίνησής σου.", "Δέκα φανάρια σε ένα σκοτεινό μονοπάτι, τα πρώτα αναμμένα — σειρά και προορισμός",
  ] },
  "nl-NL": { metadataTitle: "Het 10-stappenprogramma van B4GAMBLE", metadataDescription: "Bekijk hoe tien zelfgestuurde Missies een persoonlijk Startpunt en controleplan opbouwen.", text: [
    "Het Programma, stap voor stap", "Tien stappen.", "Eén", "plan.", "Elke Missie duurt 5–15 minuten en eindigt met iets dat je bewaart. Dit is precies wat er gebeurt — zonder verrassingen of kleine lettertjes.", "Start Missie 01", "Waarom B4GAMBLE →", "01–03 Begrijpen", "04–07 Opbouwen", "08–10 Toepassen", "Scroll ↓",
    "Wat je opbouwt", "Drie dingen die je aan het einde hebt.", "Een helder beeld", "Je triggers, patronen en de momenten waarop beslissingen echt plaatsvinden.", "Werkbare grenzen", "Grenzen die je ontwerpt, in echte weken test en aanpast tot ze standhouden.", "Een herzienbaar plan", "Eén document dat beschrijft hoe je speelt — dat je kunt herzien wanneer je wilt.", "Het pad",
    "Beginnen", "Vertel wat er gebeurt en ontvang je Startpunt.", "Stel je grenzen in", "Een eerste versie van tijd- en geldgrenzen.", "Begrijp je triggers", "Breng de momenten in kaart die sessies starten.", "Bouw één grens", "Eén grens die je deze week kunt volhouden.", "Realiteitscheck", "Een eerlijke blik op de cijfers van week twee.", "Besliskader", "Een eenvoudige regel voor ja, nee en vanavond-niet.", "Speelplan", "Schrijf het plan dat je werkelijk gaat volgen.", "Spelen met meer controle", "Verminder frictie, beoordeel aanbieders en bescherm je plan.", "Beoordelen en aanpassen", "Bekijk wat standhield. Herstel wat niet werkte.", "Controle op lange termijn", "Maak van tien Missies een blijvende gewoonte.",
    "Begin privé", "Wat je hier zegt,", "blijft hier.", "Je situatie en plan worden nooit gebruikt voor aanbiedingen, ranglijsten of advertenties.", "Vraag export of verwijdering aan via accountondersteuning; wettelijke bewaring en back-ups kunnen van toepassing zijn.", "Geen Missie vraagt je om te storten, een aanbieding te claimen of te spelen.", "Missie 01 duurt ongeveer", "één minuut.", "Geen registratie voordat je Startpunt klaar is.", "Tien lantaarns langs een donker pad, de eerste branden — volgorde en bestemming",
  ] },
  "sv-SE": { metadataTitle: "B4GAMBLEs 10-stegsprogram", metadataDescription: "Se hur tio självstyrda Uppdrag bygger en personlig Startpunkt och kontrollplan.", text: [
    "Programmet, steg för steg", "Tio steg.", "En", "plan.", "Varje Uppdrag tar 5–15 minuter och slutar med något du behåller. Här är exakt vad som händer — utan överraskningar eller finstilt.", "Starta Uppdrag 01", "Varför B4GAMBLE →", "01–03 Förstå", "04–07 Bygg", "08–10 Tillämpa", "Rulla ↓",
    "Det du kommer att bygga", "Tre saker du har när du är klar.", "En tydlig bild", "Dina utlösare, mönster och de stunder då beslut faktiskt fattas.", "Fungerande gränser", "Gränser som du utformar, testar under verkliga veckor och justerar tills de håller.", "En plan som kan granskas", "Ett dokument som beskriver hur du spelar — att återvända till när du vill.", "Vägen",
    "Kom igång", "Berätta vad som händer och få din Startpunkt.", "Sätt dina gränser", "Ett första utkast till tids- och pengagränser.", "Förstå dina utlösare", "Kartlägg de stunder som startar spelsessioner.", "Bygg en gräns", "En gräns du kan hålla den här veckan.", "Verklighetskontroll", "En ärlig titt på siffrorna under vecka två.", "Beslutsram", "En enkel regel för ja, nej och inte-ikväll.", "Spelplan", "Skriv planen du faktiskt kommer att följa.", "Spel med mer kontroll", "Minska friktion, bedöm operatörer och skydda din plan.", "Granska och justera", "Se vad som höll. Rätta det som inte gjorde det.", "Långsiktig kontroll", "Gör tio Uppdrag till en vana som består.",
    "Börja privat", "Det du säger här", "stannar här.", "Din situation och plan används aldrig för erbjudanden, rankningar eller annonser.", "Begär export eller radering via kontosupport; rättslig lagring och säkerhetskopior kan gälla.", "Inget Uppdrag ber dig att sätta in, hämta ett erbjudande eller spela.", "Uppdrag 01 tar ungefär", "en minut.", "Ingen registrering förrän din Startpunkt är klar.", "Tio lyktor längs en mörk stig, de första tända — följd och mål",
  ] },
  "da-DK": { metadataTitle: "B4GAMBLEs 10-trinsprogram", metadataDescription: "Se hvordan ti selvstyrede Missioner bygger et personligt Udgangspunkt og en kontrolplan.", text: [
    "Programmet, trin for trin", "Ti trin.", "Én", "plan.", "Hver Mission tager 5–15 minutter og slutter med noget, du beholder. Her er præcis, hvad der sker — uden overraskelser eller småt skrift.", "Begynd Mission 01", "Hvorfor B4GAMBLE →", "01–03 Forstå", "04–07 Byg", "08–10 Anvend", "Rul ↓",
    "Det du bygger", "Tre ting du har til sidst.", "Et klart billede", "Dine udløsere, mønstre og de øjeblikke, hvor beslutninger faktisk træffes.", "Holdbare grænser", "Grænser du udformer, tester i virkelige uger og justerer, indtil de holder.", "En plan der kan gennemgås", "Ét dokument om, hvordan du spiller — dit at vende tilbage til når som helst.", "Vejen",
    "Kom i gang", "Fortæl hvad der sker, og få dit Udgangspunkt.", "Sæt dine grænser", "Et første udkast til tids- og pengegrænser.", "Forstå dine udløsere", "Kortlæg de øjeblikke der starter spilsessioner.", "Byg én grænse", "Én grænse du kan holde i denne uge.", "Virkelighedstjek", "Et ærligt blik på tallene i uge to.", "Beslutningsramme", "En enkel regel for ja, nej og ikke-i-aften.", "Spilleplan", "Skriv den plan du faktisk vil følge.", "Spil med mere kontrol", "Reducer friktion, vurder operatører og beskyt din plan.", "Gennemgå og juster", "Se hvad der holdt. Ret det der ikke gjorde.", "Langsigtet kontrol", "Gør ti Missioner til en vane der holder.",
    "Start privat", "Det du siger her", "bliver her.", "Din situation og plan bruges aldrig til tilbud, rangeringer eller annoncer.", "Anmod om eksport eller sletning via kontosupport; juridisk opbevaring og sikkerhedskopier kan gælde.", "Ingen Mission beder dig om at indbetale, hente et tilbud eller spille.", "Mission 01 tager cirka", "ét minut.", "Ingen registrering før dit Udgangspunkt er klar.", "Ti lanterner langs en mørk sti, de første tændt — rækkefølge og mål",
  ] },
  "fi-FI": { metadataTitle: "B4GAMBLEn 10 vaiheen Ohjelma", metadataDescription: "Katso, miten kymmenen omaehtoista Tehtävää rakentaa henkilökohtaisen Lähtökohdan ja hallintasuunnitelman.", text: [
    "Ohjelma vaihe vaiheelta", "Kymmenen vaihetta.", "Yksi", "suunnitelma.", "Jokainen Tehtävä kestää 5–15 minuuttia ja päättyy johonkin, jonka säilytät. Näet tarkalleen mitä tapahtuu — ilman yllätyksiä tai pienellä painettua tekstiä.", "Aloita Tehtävä 01", "Miksi B4GAMBLE →", "01–03 Ymmärrä", "04–07 Rakenna", "08–10 Sovella", "Vieritä ↓",
    "Mitä rakennat", "Kolme asiaa, jotka sinulla on lopuksi.", "Selkeä kuva", "Laukaisijasi, mallisi ja hetket, jolloin päätökset todella tapahtuvat.", "Toimivat rajat", "Rajat, jotka suunnittelet, testaat oikeissa viikoissa ja säädät toimiviksi.", "Tarkistettava suunnitelma", "Yksi asiakirja siitä, miten pelaat — voit palata siihen milloin tahansa.", "Polku",
    "Aloita", "Kerro mitä tapahtuu ja saat Lähtökohtasi.", "Aseta rajasi", "Ensimmäinen versio aika- ja raharajoista.", "Ymmärrä laukaisijasi", "Kartoita hetket, jotka aloittavat pelikerrat.", "Rakenna yksi raja", "Yksi raja, jonka voit pitää tällä viikolla.", "Todellisuustarkistus", "Rehellinen katsaus toisen viikon lukuihin.", "Päätösmalli", "Yksinkertainen sääntö kyllä-, ei- ja ei-tänä-iltana -päätöksille.", "Pelisuunnitelma", "Kirjoita suunnitelma, jota todella noudatat.", "Pelaa hallitummin", "Vähennä kitkaa, arvioi toimijoita ja suojaa suunnitelmasi.", "Tarkista ja säädä", "Katso mikä piti. Korjaa se mikä ei pitänyt.", "Pitkäaikainen hallinta", "Muuta kymmenen Tehtävää pysyväksi tavaksi.",
    "Aloita yksityisesti", "Se mitä sanot täällä", "pysyy täällä.", "Tilannettasi ja suunnitelmaasi ei koskaan käytetä tarjouksiin, sijoituksiin tai mainoksiin.", "Pyydä vientiä tai poistamista tilituen kautta; lakisääteinen säilytys ja varmuuskopiot voivat koskea tietoja.", "Mikään Tehtävä ei pyydä tallettamaan, lunastamaan tarjousta tai pelaamaan.", "Tehtävä 01 kestää noin", "minuutin.", "Ei rekisteröitymistä ennen kuin Lähtökohtasi on valmis.", "Kymmenen lyhtyä pimeän polun varrella, ensimmäiset sytytettyinä — järjestys ja päämäärä",
  ] },
  "nb-NO": { metadataTitle: "B4GAMBLEs 10-trinnsprogram", metadataDescription: "Se hvordan ti selvstyrte Oppdrag bygger et personlig Utgangspunkt og en kontrollplan.", text: [
    "Programmet, trinn for trinn", "Ti trinn.", "Én", "plan.", "Hvert Oppdrag tar 5–15 minutter og avsluttes med noe du beholder. Her er nøyaktig hva som skjer — uten overraskelser eller liten skrift.", "Start Oppdrag 01", "Hvorfor B4GAMBLE →", "01–03 Forstå", "04–07 Bygg", "08–10 Bruk", "Rull ↓",
    "Det du skal bygge", "Tre ting du har til slutt.", "Et klart bilde", "Utløserne, mønstrene og øyeblikkene der beslutninger faktisk tas.", "Holdbare grenser", "Grenser du utformer, tester i virkelige uker og justerer til de holder.", "En plan som kan vurderes", "Ett dokument om hvordan du spiller — ditt å gå tilbake til når som helst.", "Veien",
    "Kom i gang", "Fortell hva som skjer, og få Utgangspunktet ditt.", "Sett grensene dine", "Et første utkast til tids- og pengegrenser.", "Forstå utløserne dine", "Kartlegg øyeblikkene som starter spilløkter.", "Bygg én grense", "Én grense du kan holde denne uken.", "Virkelighetssjekk", "Et ærlig blikk på tallene i uke to.", "Beslutningsramme", "En enkel regel for ja, nei og ikke-i-kveld.", "Spilleplan", "Skriv planen du faktisk vil følge.", "Spill med mer kontroll", "Reduser friksjon, vurder operatører og beskytt planen din.", "Gjennomgå og juster", "Se hva som holdt. Rett det som ikke gjorde det.", "Langsiktig kontroll", "Gjør ti Oppdrag til en vane som varer.",
    "Start privat", "Det du sier her", "blir her.", "Situasjonen og planen din brukes aldri til tilbud, rangeringer eller annonser.", "Be om eksport eller sletting via kontostøtte; juridisk lagring og sikkerhetskopier kan gjelde.", "Ingen Oppdrag ber deg om å sette inn, hente et tilbud eller spille.", "Oppdrag 01 tar omtrent", "ett minutt.", "Ingen registrering før Utgangspunktet ditt er klart.", "Ti lykter langs en mørk sti, de første tent — rekkefølge og mål",
  ] },
  "en-CA": en,
  "fr-CA": en,
};

type CurrentMissionCopy = Readonly<{ title: string; description: string }>;

type CurrentProgrammeCopy = Readonly<{
  overview: string;
  missions: readonly CurrentMissionCopy[];
  closingLead: string;
  closingEmphasis: string;
  closingBody: string;
}>;

const enCurrent: CurrentProgrammeCopy = {
  overview: "Most Missions take 5–8 minutes and end with something you keep. Mission 01 begins with a short Starting Point. Here's exactly what happens — no surprises, no fine print.",
  missions: [
    { title: "Map the moment", description: "Map one recent decision moment and build your Starting Point." },
    { title: "Set a 7-day goal", description: "Turn your Starting Point into one small seven-day experiment." },
    { title: "Understand the urge", description: "Notice the sequence early enough to create a choice point." },
    { title: "Build one boundary", description: "Make one boundary specific enough to use under pressure." },
    { title: "Check before deciding", description: "Put three practical checks between an impulse and a decision." },
    { title: "Add friction", description: "Make the fast route less automatic with one or two practical layers." },
    { title: "Prepare support", description: "Prepare a support route without needing to disclose a person's identity." },
    { title: "Research responsibly", description: "Use material terms and safer-gambling facts when comparing options." },
    { title: "Rehearse the decision", description: "Practise one response before the decision is live." },
    { title: "Make the plan reviewable", description: "Bring the useful parts together and decide when to review them." },
  ],
  closingLead: "Mission 01 starts with",
  closingEmphasis: "your Starting Point.",
  closingBody: "Complete the Starting Point's two actions for 40 XP. Registration awards no XP and only follows when it is ready.",
};

const currentProgrammeCatalog: Record<SupportedLocale, CurrentProgrammeCopy> = {
  "en-GB": enCurrent,
  "de-DE": {
    overview: "Die meisten Missionen dauern etwa 5–8 Minuten und enden mit etwas, das du behältst. Mission 01 beginnt mit einem kurzen Ausgangspunkt. Hier siehst du genau, was geschieht — ohne Überraschungen und Kleingedrucktes.",
    missions: [
      { title: "Erfasse den Moment", description: "Beschreibe, was geschieht, und erhalte deinen persönlichen Ausgangspunkt." },
      { title: "Setze ein 7-Tage-Ziel", description: "Mach aus deinem Ausgangspunkt ein kleines Experiment für die nächsten sieben Tage." },
      { title: "Verstehe den Spielimpuls", description: "Erkenne die Abfolge früh genug, um Raum für eine bewusste Entscheidung zu schaffen." },
      { title: "Setze eine Grenze", description: "Formuliere eine Grenze so konkret, dass du sie auch unter Druck anwenden kannst." },
      { title: "Prüfe, bevor du entscheidest", description: "Baue drei praktische Prüfungen zwischen Impuls und Entscheidung ein." },
      { title: "Baue Hürden ein", description: "Mach den schnellen Weg mit ein oder zwei praktischen Hürden weniger automatisch." },
      { title: "Bereite Unterstützung vor", description: "Bereite einen Weg zu Unterstützung vor, ohne die Identität einer Person nennen zu müssen." },
      { title: "Informiere dich verantwortungsvoll", description: "Nutze beim Vergleichen wesentliche Bedingungen und Fakten zum sichereren Spielen." },
      { title: "Spiele die Entscheidung durch", description: "Übe eine Reaktion, bevor die Entscheidung ansteht." },
      { title: "Mach den Plan überprüfbar", description: "Führe die nützlichen Teile zusammen und entscheide, wann du sie erneut überprüfst." },
    ],
    closingLead: "Mission 01 beginnt mit",
    closingEmphasis: "deinem Ausgangspunkt.",
    closingBody: "Schließe die beiden Aktionen zum Ausgangspunkt ab und erhalte 40 XP. Die Registrierung bringt keine XP und folgt erst, wenn der Ausgangspunkt bereit ist.",
  },
  "it-IT": {
    overview: "La maggior parte delle Missioni dura circa 5–8 minuti e termina con qualcosa che conservi. La Missione 01 inizia con un breve Punto di partenza. Ecco cosa accade, senza sorprese né clausole nascoste.",
    missions: [
      { title: "Mappa il momento", description: "Descrivi cosa succede e ottieni il tuo Punto di partenza personale." },
      { title: "Definisci un obiettivo di 7 giorni", description: "Trasforma il tuo Punto di partenza in un piccolo esperimento di sette giorni." },
      { title: "Comprendi l’impulso", description: "Riconosci la sequenza abbastanza presto da creare uno spazio di scelta." },
      { title: "Costruisci un limite", description: "Rendi un limite abbastanza concreto da poterlo applicare sotto pressione." },
      { title: "Verifica prima di decidere", description: "Inserisci tre verifiche pratiche tra un impulso e una decisione." },
      { title: "Aggiungi attrito", description: "Rendi il percorso più rapido meno automatico con uno o due ostacoli pratici." },
      { title: "Prepara il supporto", description: "Prepara un percorso di supporto senza dover rivelare l’identità di una persona." },
      { title: "Informati in modo responsabile", description: "Quando confronti le opzioni, usa le condizioni essenziali e le informazioni sul gioco più sicuro." },
      { title: "Simula la decisione", description: "Esercitati con una risposta prima che arrivi il momento di decidere." },
      { title: "Rendi il piano verificabile", description: "Riunisci le parti utili e decidi quando rivederle." },
    ],
    closingLead: "La Missione 01 inizia con",
    closingEmphasis: "il tuo Punto di partenza.",
    closingBody: "Completa le due azioni del Punto di partenza per ottenere 40 XP. La registrazione non assegna XP e avviene solo quando il Punto di partenza è pronto.",
  },
  "es-ES": {
    overview: "La mayoría de las Misiones dura entre 5 y 8 minutos y termina con algo que conservas. La Misión 01 comienza con un breve Punto de partida. Esto es exactamente lo que ocurre, sin sorpresas ni letra pequeña.",
    missions: [
      { title: "Mapea el momento", description: "Describe qué ocurre y crea tu Punto de partida personal." },
      { title: "Fija un objetivo de 7 días", description: "Convierte tu Punto de partida en un pequeño experimento de siete días." },
      { title: "Comprende el impulso", description: "Detecta la secuencia con suficiente antelación para crear un punto de elección." },
      { title: "Crea un límite", description: "Haz que un límite sea lo bastante concreto para usarlo bajo presión." },
      { title: "Comprueba antes de decidir", description: "Coloca tres comprobaciones prácticas entre un impulso y una decisión." },
      { title: "Añade fricción", description: "Haz que la vía rápida sea menos automática con una o dos barreras prácticas." },
      { title: "Prepara apoyo", description: "Prepara una vía de apoyo sin tener que revelar la identidad de nadie." },
      { title: "Investiga de forma responsable", description: "Usa las condiciones esenciales y datos sobre juego más seguro al comparar opciones." },
      { title: "Ensaya la decisión", description: "Practica una respuesta antes de que la decisión sea real." },
      { title: "Haz que el plan sea revisable", description: "Reúne las partes útiles y decide cuándo revisarlas." },
    ],
    closingLead: "La Misión 01 comienza con",
    closingEmphasis: "tu Punto de partida.",
    closingBody: "Completa las dos acciones del Punto de partida para obtener 40 XP. El registro no otorga XP y solo aparece cuando el Punto de partida está listo.",
  },
  "pt-PT": {
    overview: "A maioria das Missões demora entre 5 e 8 minutos e termina com algo que guardas. A Missão 01 começa com um breve Ponto de partida. Eis exatamente o que acontece — sem surpresas nem letras pequenas.",
    missions: [
      { title: "Mapeia o momento", description: "Descreve o que acontece e cria o teu Ponto de partida pessoal." },
      { title: "Define um objetivo de 7 dias", description: "Transforma o teu Ponto de partida numa pequena experiência de sete dias." },
      { title: "Compreende o impulso", description: "Repara na sequência com antecedência suficiente para criar um momento de escolha." },
      { title: "Cria um limite", description: "Torna um limite suficientemente concreto para o usares sob pressão." },
      { title: "Verifica antes de decidir", description: "Coloca três verificações práticas entre um impulso e uma decisão." },
      { title: "Adiciona fricção", description: "Torna o caminho rápido menos automático com uma ou duas barreiras práticas." },
      { title: "Prepara apoio", description: "Prepara uma via de apoio sem teres de revelar a identidade de ninguém." },
      { title: "Pesquisa de forma responsável", description: "Usa condições essenciais e factos sobre jogo mais seguro ao comparar opções." },
      { title: "Ensaia a decisão", description: "Pratica uma resposta antes de a decisão ser real." },
      { title: "Torna o plano revisável", description: "Reúne as partes úteis e decide quando as rever." },
    ],
    closingLead: "A Missão 01 começa com",
    closingEmphasis: "o teu Ponto de partida.",
    closingBody: "Conclui as duas ações do Ponto de partida para receberes 40 XP. O registo não atribui XP e só acontece quando o Ponto de partida estiver pronto.",
  },
  "el-GR": {
    overview: "Οι περισσότερες Αποστολές διαρκούν περίπου 5–8 λεπτά και τελειώνουν με κάτι που κρατάς. Η Αποστολή 01 ξεκινά με ένα σύντομο Σημείο Εκκίνησης. Δες ακριβώς τι συμβαίνει — χωρίς εκπλήξεις ή ψιλά γράμματα.",
    missions: [
      { title: "Χαρτογράφησε τη στιγμή", description: "Περιέγραψε τι συμβαίνει και δημιούργησε το προσωπικό σου Σημείο Εκκίνησης." },
      { title: "Θέσε έναν στόχο 7 ημερών", description: "Μετέτρεψε το Σημείο Εκκίνησής σου σε ένα μικρό πείραμα επτά ημερών." },
      { title: "Κατανόησε την παρόρμηση", description: "Παρατήρησε τη σειρά αρκετά νωρίς ώστε να δημιουργήσεις ένα σημείο επιλογής." },
      { title: "Δημιούργησε ένα όριο", description: "Κάνε ένα όριο αρκετά συγκεκριμένο ώστε να το χρησιμοποιείς υπό πίεση." },
      { title: "Έλεγξε πριν αποφασίσεις", description: "Βάλε τρεις πρακτικούς ελέγχους ανάμεσα σε μια παρόρμηση και μια απόφαση." },
      { title: "Πρόσθεσε τριβή", description: "Κάνε τη γρήγορη διαδρομή λιγότερο αυτόματη με ένα ή δύο πρακτικά εμπόδια." },
      { title: "Προετοίμασε υποστήριξη", description: "Προετοίμασε μια διαδρομή υποστήριξης χωρίς να χρειάζεται να αποκαλύψεις την ταυτότητα κάποιου." },
      { title: "Κάνε υπεύθυνη έρευνα", description: "Χρησιμοποίησε ουσιώδεις όρους και στοιχεία για ασφαλέστερο παιχνίδι όταν συγκρίνεις επιλογές." },
      { title: "Κάνε πρόβα την απόφαση", description: "Εξάσκησε μία αντίδραση πριν η απόφαση γίνει πραγματική." },
      { title: "Κάνε το σχέδιο αναθεωρήσιμο", description: "Συνδύασε τα χρήσιμα μέρη και αποφάσισε πότε θα τα επανεξετάσεις." },
    ],
    closingLead: "Η Αποστολή 01 ξεκινά με",
    closingEmphasis: "το Σημείο Εκκίνησής σου.",
    closingBody: "Ολοκλήρωσε τις δύο ενέργειες του Σημείου Εκκίνησης για 40 XP. Η εγγραφή δεν δίνει XP και ακολουθεί μόνο όταν το Σημείο Εκκίνησης είναι έτοιμο.",
  },
  "nl-NL": {
    overview: "De meeste Missies duren ongeveer 5–8 minuten en eindigen met iets dat je bewaart. Missie 01 begint met een kort Startpunt.",
    missions: [
      { title: "Breng het moment in kaart", description: "Beschrijf wat er gebeurt en maak je persoonlijke Startpunt." },
      { title: "Stel een doel voor 7 dagen", description: "Maak van je Startpunt één klein experiment voor zeven dagen." },
      { title: "Begrijp de drang", description: "Merk het verloop vroeg genoeg op om een keuzemoment te creëren." },
      { title: "Bouw één grens", description: "Maak één grens concreet genoeg om die onder druk te gebruiken." },
      { title: "Controleer voordat je beslist", description: "Zet drie praktische checks tussen een impuls en je beslissing." },
      { title: "Bouw frictie in", description: "Maak de snelle route minder automatisch met één of twee praktische drempels." },
      { title: "Bereid steun voor", description: "Bepaal hoe je steun kunt krijgen zonder iemands identiteit te hoeven delen." },
      { title: "Doe verantwoord onderzoek", description: "Gebruik belangrijke voorwaarden en feiten over veiliger spelen wanneer je opties vergelijkt." },
      { title: "Oefen het beslismoment", description: "Oefen één reactie voordat je echt voor de beslissing staat." },
      { title: "Maak het plan herzienbaar", description: "Breng de bruikbare onderdelen samen en bepaal wanneer je het plan opnieuw bekijkt." },
    ],
    closingLead: "Missie 01 begint met",
    closingEmphasis: "je Startpunt.",
    closingBody: "Voltooi de twee acties van je Startpunt om 40 XP te verdienen. Je registreert je pas als je Startpunt klaar is; registratie levert geen XP op.",
  },
  "sv-SE": {
    overview: "De flesta Uppdrag tar ungefär 5–8 minuter och slutar med något du behåller. Uppdrag 01 börjar med en kort Startpunkt.",
    missions: [
      { title: "Kartlägg stunden", description: "Beskriv vad som händer och skapa din personliga Startpunkt." },
      { title: "Sätt ett 7-dagarsmål", description: "Utgå från din Startpunkt och skapa ett litet experiment för sju dagar." },
      { title: "Förstå spelsuget", description: "Lägg märke till förloppet tidigt nog för att skapa utrymme för ett val." },
      { title: "Bygg en gräns", description: "Gör en gräns tillräckligt konkret för att använda den under press." },
      { title: "Kontrollera innan du bestämmer dig", description: "Lägg tre praktiska kontroller mellan en impuls och ett beslut." },
      { title: "Bygg in friktion", description: "Gör den snabba vägen mindre automatisk med ett eller två praktiska hinder." },
      { title: "Förbered stöd", description: "Förbered en väg till stöd utan att behöva uppge någons identitet." },
      { title: "Undersök ansvarsfullt", description: "Använd viktiga villkor och fakta om säkrare spelande när du jämför alternativ." },
      { title: "Öva på beslutet", description: "Öva på ett svar innan du står inför beslutet på riktigt." },
      { title: "Gör planen möjlig att granska", description: "Samla de användbara delarna och bestäm när du ska granska planen igen." },
    ],
    closingLead: "Uppdrag 01 börjar med",
    closingEmphasis: "din Startpunkt.",
    closingBody: "Slutför Startpunktens två moment för att få 40 XP. Du registrerar dig först när Startpunkten är klar; registreringen ger inga XP.",
  },
  "da-DK": {
    overview: "De fleste Missioner tager cirka 5–8 minutter og slutter med noget, du beholder. Mission 01 begynder med et kort Udgangspunkt.",
    missions: [
      { title: "Kortlæg øjeblikket", description: "Beskriv hvad der sker, og skab dit personlige Udgangspunkt." },
      { title: "Sæt et mål for 7 dage", description: "Gør dit Udgangspunkt til ét lille forsøg over syv dage." },
      { title: "Forstå trangen", description: "Læg mærke til forløbet tidligt nok til at skabe plads til et valg." },
      { title: "Byg én grænse", description: "Gør én grænse konkret nok til, at den kan bruges under pres." },
      { title: "Tjek før du beslutter dig", description: "Sæt tre praktiske tjek mellem en impuls og en beslutning." },
      { title: "Indbyg friktion", description: "Gør den hurtige vej mindre automatisk med én eller to praktiske barrierer." },
      { title: "Forbered støtte", description: "Forbered en vej til støtte uden at skulle oplyse nogens identitet." },
      { title: "Undersøg ansvarligt", description: "Brug vigtige vilkår og fakta om sikrere spil, når du sammenligner muligheder." },
      { title: "Gennemspil beslutningen", description: "Øv ét svar, før du står i den virkelige beslutningssituation." },
      { title: "Gør planen klar til gennemgang", description: "Saml de brugbare dele, og beslut, hvornår du vil gennemgå planen igen." },
    ],
    closingLead: "Mission 01 begynder med",
    closingEmphasis: "dit Udgangspunkt.",
    closingBody: "Gennemfør Udgangspunktets to handlinger for at få 40 XP. Du registrerer dig først, når Udgangspunktet er klart; registreringen giver ingen XP.",
  },
  "fi-FI": {
    overview: "Useimmat Tehtävät kestävät noin 5–8 minuuttia ja päättyvät johonkin, jonka säilytät. Tehtävä 01 alkaa lyhyen Lähtökohdan laatimisella.",
    missions: [
      { title: "Kartoita hetki", description: "Kuvaa, mitä tapahtuu, ja luo henkilökohtainen Lähtökohtasi." },
      { title: "Aseta 7 päivän tavoite", description: "Tee Lähtökohdastasi yksi pieni seitsemän päivän kokeilu." },
      { title: "Ymmärrä pelihalu", description: "Tunnista tapahtumaketju ajoissa, jotta syntyy tilaa valinnalle." },
      { title: "Rakenna yksi raja", description: "Määritä yksi raja niin konkreettisesti, että voit käyttää sitä paineen alla." },
      { title: "Tarkista ennen päätöstä", description: "Aseta kolme käytännön tarkistusta impulssin ja päätöksen väliin." },
      { title: "Lisää kitkaa", description: "Vähennä nopean reitin automaattisuutta yhdellä tai kahdella käytännön esteellä." },
      { title: "Valmistele tuki", description: "Valmistele tapa saada tukea ilman, että kenenkään henkilöllisyyttä tarvitsee kertoa." },
      { title: "Tutki vastuullisesti", description: "Käytä vaihtoehtojen vertailussa olennaisia ehtoja ja turvallisemman pelaamisen tietoja." },
      { title: "Harjoittele päätöstä", description: "Harjoittele yhtä vastausta ennen todellista päätöstilannetta." },
      { title: "Tee suunnitelmasta tarkistettava", description: "Kokoa hyödylliset osat yhteen ja päätä, milloin tarkistat suunnitelman uudelleen." },
    ],
    closingLead: "Tehtävä 01 alkaa",
    closingEmphasis: "Lähtökohdastasi.",
    closingBody: "Suorita Lähtökohdan kaksi toimintoa ansaitaksesi 40 XP:tä. Rekisteröityminen seuraa vasta, kun Lähtökohta on valmis; rekisteröitymisestä ei saa XP:tä.",
  },
  "nb-NO": {
    overview: "De fleste Oppdrag tar omtrent 5–8 minutter og avsluttes med noe du beholder. Oppdrag 01 begynner med et kort Utgangspunkt.",
    missions: [
      { title: "Kartlegg øyeblikket", description: "Beskriv hva som skjer, og lag ditt personlige Utgangspunkt." },
      { title: "Sett et mål for 7 dager", description: "Gjør Utgangspunktet ditt til ett lite forsøk over sju dager." },
      { title: "Forstå trangen", description: "Legg merke til forløpet tidlig nok til å skape rom for et valg." },
      { title: "Bygg én grense", description: "Gjør én grense konkret nok til å bruke under press." },
      { title: "Sjekk før du bestemmer deg", description: "Legg tre praktiske sjekker mellom en impuls og en beslutning." },
      { title: "Bygg inn friksjon", description: "Gjør den raske veien mindre automatisk med ett eller to praktiske hindre." },
      { title: "Forbered støtte", description: "Forbered en vei til støtte uten å måtte oppgi noens identitet." },
      { title: "Undersøk ansvarlig", description: "Bruk viktige vilkår og fakta om tryggere spill når du sammenligner alternativer." },
      { title: "Øv på beslutningen", description: "Øv på én respons før du må ta beslutningen på ordentlig." },
      { title: "Gjør planen klar for gjennomgang", description: "Samle de nyttige delene, og bestem når du skal gjennomgå planen igjen." },
    ],
    closingLead: "Oppdrag 01 begynner med",
    closingEmphasis: "Utgangspunktet ditt.",
    closingBody: "Fullfør Utgangspunktets to handlinger for å få 40 XP. Du registrerer deg først når Utgangspunktet er klart; registreringen gir ingen XP.",
  },
  "en-CA": enCurrent,
  "fr-CA": enCurrent,
};

export function currentProgrammeCopy(locale: SupportedLocale): CurrentProgrammeCopy {
  return currentProgrammeCatalog[locale];
}

function withCurrentProgrammeCopy(translation: TenStepsTranslation, current: CurrentProgrammeCopy): TenStepsTranslation {
  if (current.missions.length !== 10) throw new Error("10 Steps current Programme copy must contain exactly ten Missions");
  const text = [...translation.text];
  text[4] = current.overview;
  text.splice(20, 20, ...current.missions.flatMap((mission) => [mission.title, mission.description]));
  text[46] = current.closingLead;
  text[47] = current.closingEmphasis;
  text[48] = current.closingBody;
  return { ...translation, text };
}

export function tenStepsTranslation(locale: SupportedLocale) {
  const translation = withCurrentProgrammeCopy(catalog[locale], currentProgrammeCatalog[locale]);
  if (translation.text.length !== TEN_STEPS_SOURCE_COPY.length) {
    throw new Error(`Incomplete ${locale} 10 Steps translation`);
  }
  return translation;
}
