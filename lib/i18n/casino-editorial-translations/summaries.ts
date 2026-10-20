import type { CasinoEditorialEntry } from "./types";

/** Casino summaries (the verdict line and meta description) and editorial review summaries. */
export const SUMMARY_ENTRIES: readonly CasinoEditorialEntry[] = [
  // inkabet
  {
    en: "One of the cleanest profiles in this release: exact Peru regulation, broad local cashier evidence, detailed current welcome terms and responsible-gambling controls.",
    sv: "En av de renaste profilerna i den här omgången: exakt reglering i Peru, brett lokalt underlag om betalningar, detaljerade aktuella välkomstvillkor och verktyg för ansvarsfullt spel.",
    da: "En af de klareste profiler i denne udgivelse: præcis regulering i Peru, bred lokal betalingsdokumentation, detaljerede aktuelle velkomstvilkår og værktøjer til ansvarligt spil.",
    de: "Eines der saubersten Profile dieser Ausgabe: belegte Regulierung in Peru, viele lokale Zahlungswege, genaue Willkommensbedingungen und Spielerschutz-Werkzeuge.",
    uk: "Один із найчистіших профілів у цьому випуску: точні дані про регулювання в Перу, широкі підтвердження щодо місцевої каси, докладні актуальні умови вітальної пропозиції та інструменти відповідальної гри.",
    ru: "Один из самых чистых профилей в этом выпуске: точные данные о регулировании в Перу, обширные подтверждения по местной кассе, подробные актуальные условия приветственного предложения и инструменты ответственной игры.",
    uz: "Ushbu nashrdagi eng puxta profillardan biri: Peru boʻyicha aniq regulyatsiya maʼlumotlari, mahalliy kassa boʻyicha keng dalillar, batafsil joriy xush kelibsiz shartlari va masʼuliyatli oʻyin nazorat vositalari.",
  },
  // betsafe
  {
    en: "Strong Baltic regulatory evidence and broad product depth across the researched Estonia and Latvia profiles, with a remaining Estonia cashier-data gap.",
    sv: "Starkt underlag om regleringen i Baltikum och ett brett produktutbud i de undersökta profilerna för Estland och Lettland, med en kvarstående lucka i uppgifterna om den estniska kassan.",
    da: "Stærk dokumentation for regulering i Baltikum og bredt produktudvalg i de undersøgte profiler for Estland og Letland, dog med et hul i data om betalinger i Estland.",
    de: "Gut belegte Regulierung im Baltikum, breites Angebot in den recherchierten Profilen für Estland und Lettland, mit offener Lücke bei den estnischen Zahlungsdaten.",
    uk: "Вагомі підтвердження щодо регулювання в країнах Балтії та широкий продукт у досліджених профілях Естонії й Латвії; залишається прогалина в даних про естонську касу.",
    ru: "Надёжные подтверждения регулирования в странах Балтии и широкий продукт в изученных профилях для Эстонии и Латвии; остаётся пробел в данных об эстонской кассе.",
    uz: "Oʻrganilgan Estoniya va Latviya profillarida Boltiqboʻyi regulyatsiyasi boʻyicha kuchli dalillar va keng mahsulot tanlovi bor; Estoniya boʻyicha kassa maʼlumotlarida hali boʻshliq qolmoqda.",
  },
  // betsson
  {
    en: "A mature, broad casino product with unusually strong local evidence in Peru and Sweden, balanced against a serious Swedish anti-money-laundering enforcement record and incomplete current offer mechanics.",
    sv: "En mogen och bred casinoprodukt med ovanligt starkt lokalt underlag i Peru och Sverige, som vägs mot ett allvarligt svenskt tillsynsingripande om penningtvätt och ofullständiga villkor för det aktuella erbjudandet.",
    da: "Et modent og bredt casinoprodukt med usædvanligt stærk lokal dokumentation i Peru og Sverige, opvejet af en alvorlig svensk sanktion for svigt i indsatsen mod hvidvask og ufuldstændige oplysninger om vilkårene i det aktuelle tilbud.",
    de: "Ein ausgereiftes, breites Glücksspielangebot mit ungewöhnlich guten lokalen Belegen für Peru und Schweden, dem eine schwere schwedische Sanktion wegen Geldwäsche-Mängeln und unvollständige aktuelle Angebotsdetails gegenüberstehen.",
    uk: "Зрілий і широкий продукт казино з незвично вагомими місцевими підтвердженнями в Перу та Швеції; водночас є серйозне шведське наглядове рішення щодо протидії відмиванню коштів, а умови актуальної пропозиції неповні.",
    ru: "Зрелый и широкий продукт казино с необычно сильными местными подтверждениями в Перу и Швеции; им противостоят серьёзные меры шведского регулятора за нарушения в противодействии отмыванию денег и неполная механика текущего предложения.",
    uz: "Peru va Shvetsiyada gʻoyat kuchli mahalliy dalillarga ega yetuk va keng kazino mahsuloti; biroq bunga Shvetsiyada pul yuvishga qarshi talablar buzilgani uchun qoʻllanilgan jiddiy jazo choralari va joriy taklif mexanikasining toʻliq emasligi qarshi turadi.",
  },
  // starcasino
  {
    en: "A broad Italian casino catalogue with strong payment evidence and current concession 16026; publication remains informational because Italy has strict gambling-advertising restrictions.",
    sv: "Ett brett italienskt casinoutbud med starkt underlag om betalningar och aktuell koncession 16026; publiceringen är endast informativ eftersom Italien har strikta begränsningar för spelreklam.",
    da: "Et bredt italiensk casinoudvalg med stærk dokumentation for betalinger og den aktuelle koncession 16026; anmeldelsen er fortsat kun til information, fordi Italien har strenge begrænsninger på reklame for spil.",
    de: "Ein breites italienisches Spielangebot mit gut belegten Zahlungsmethoden und der aktuellen Konzession 16026; die Veröffentlichung dient nur zur Information, weil Italien Glücksspielwerbung streng beschränkt.",
    uk: "Широкий каталог італійського казино з вагомими підтвердженнями щодо платежів і чинною концесією 16026; публікація лишається суто інформаційною, бо в Італії діють суворі обмеження на рекламу азартних ігор.",
    ru: "Широкий каталог итальянского казино с надёжными подтверждениями по платежам и действующей концессией 16026; публикация остаётся информационной из-за строгих ограничений на рекламу азартных игр в Италии.",
    uz: "Toʻlovlar boʻyicha kuchli dalillar va amaldagi 16026-sonli konsessiyaga ega keng Italiya kazino katalogi; Italiyada qimor oʻyinlari reklamasiga qatʼiy cheklovlar borligi sababli nashr faqat maʼlumot uchun beriladi.",
  },
  // supercasino
  {
    en: "A well-documented NZ-facing casino with unusually clear current welcome mechanics; exact cashier method-level limits remain the main data gap.",
    sv: "Ett väldokumenterat casino inriktat på Nya Zeeland med ovanligt tydliga aktuella välkomstvillkor; exakta gränser per betalmetod i kassan är fortfarande den största luckan i uppgifterna.",
    da: "Et veldokumenteret casino rettet mod New Zealand med usædvanligt klare aktuelle velkomstvilkår; præcise grænser per betalingsmetode er stadig det største datahul.",
    de: "Ein gut dokumentierter Anbieter für Neuseeland mit ungewöhnlich klaren aktuellen Willkommensbedingungen; genaue Limits pro Zahlungsmethode bleiben die größte Lücke.",
    uk: "Добре задокументоване казино для Нової Зеландії з незвично чіткими умовами актуальної вітальної пропозиції; головна прогалина в даних — точні ліміти каси для кожного способу оплати.",
    ru: "Хорошо задокументированное казино для Новой Зеландии с необычно понятной механикой текущего приветственного предложения; главный пробел в данных — точные лимиты по отдельным способам оплаты в кассе.",
    uz: "Yangi Zelandiya oʻyinchilariga moʻljallangan, yaxshi hujjatlashtirilgan kazino; joriy xush kelibsiz bonusi mexanikasi gʻoyat aniq. Asosiy maʼlumot boʻshligʻi — kassadagi har bir toʻlov usuli boʻyicha aniq limitlar.",
  },
  // nordicbet
  {
    en: "A strong Sweden-local profile with detailed payment evidence and a current licence; incomplete welcome mechanics and conflicting generic MGA evidence are kept separate.",
    sv: "En stark lokal profil för Sverige med detaljerat underlag om betalningar och en aktuell licens; ofullständiga välkomstvillkor och motstridiga allmänna MGA-uppgifter hålls isär.",
    da: "En stærk lokal profil for Sverige med detaljeret dokumentation for betalinger og en aktuel licens; ufuldstændige velkomstvilkår og modstridende generelt MGA-materiale holdes adskilt.",
    de: "Ein starkes lokales Profil für Schweden mit detaillierten Zahlungsangaben und aktueller Lizenz; lückenhafte Willkommensbedingungen und widersprüchliche allgemeine MGA-Angaben bleiben getrennt.",
    uk: "Сильний місцевий профіль для Швеції з докладними підтвердженнями щодо платежів і чинною ліцензією; неповні умови вітальної пропозиції та суперечливі загальні дані про MGA подано окремо.",
    ru: "Сильный местный профиль для Швеции с подробными подтверждениями по платежам и действующей лицензией; неполная механика приветственного предложения и противоречащие общие данные MGA учитываются отдельно.",
    uz: "Toʻlovlar boʻyicha batafsil dalillar va amaldagi litsenziyaga ega kuchli mahalliy Shvetsiya profili; xush kelibsiz bonusi mexanikasining toʻliq emasligi va MGA boʻyicha bir-biriga zid umumiy dalillar alohida qayd etiladi.",
  },
  // rizk
  {
    en: "Strong product and payment evidence in the published Canada and Serbia profiles, while the unresolved New Zealand legal-footer contradiction is deliberately withheld from this release.",
    sv: "Starkt underlag om produkt och betalningar i de publicerade profilerna för Kanada och Serbien, medan den olösta motsägelsen i den juridiska sidfoten för Nya Zeeland medvetet hålls utanför den här omgången.",
    da: "Stærk dokumentation for produkt og betalinger i de offentliggjorte profiler for Canada og Serbien, mens den uafklarede modsigelse i sidefodens juridiske oplysninger for New Zealand bevidst er holdt ude af denne udgivelse.",
    de: "Gut belegte Angaben zu Angebot und Zahlungen in den veröffentlichten Profilen für Kanada und Serbien, während der ungeklärte Widerspruch im rechtlichen Seitenfuß für Neuseeland bewusst aus dieser Ausgabe herausgehalten wird.",
    uk: "Вагомі підтвердження щодо продукту й платежів в опублікованих профілях Канади та Сербії; нез'ясовану суперечність у юридичній інформації внизу новозеландського сайту свідомо не включено до цього випуску.",
    ru: "Надёжные подтверждения по продукту и платежам в опубликованных профилях для Канады и Сербии; неразрешённое противоречие в юридическом блоке внизу сайта для Новой Зеландии намеренно не включено в этот выпуск.",
    uz: "Eʼlon qilingan Kanada va Serbiya profillarida mahsulot va toʻlovlar boʻyicha kuchli dalillar bor; Yangi Zelandiya saytining pastki qismidagi huquqiy maʼlumotlardagi hal qilinmagan ziddiyat esa ataylab ushbu nashrga kiritilmagan.",
  },
  // skol-casino
  {
    en: "A well-presented White Hat Gaming casino with a broad platform-backed catalogue and a current partner offer, but only partial exact-market product evidence and no approved public commercial route.",
    sv: "Ett välpresenterat White Hat Gaming-casino med brett plattformsbaserat spelutbud och ett aktuellt partnererbjudande, men bara delvis exakt produktunderlag per marknad och ingen godkänd offentlig kommersiell länk.",
    da: "Et velpræsenteret White Hat Gaming-casino med et bredt spiludvalg fra platformen og et aktuelt partnertilbud, men kun delvise produktfakta per marked og intet godkendt offentligt link til casinoet.",
    de: "Ein gut präsentierter Anbieter von White Hat Gaming mit breitem Spielangebot der Plattform und aktuellem Partnerangebot, aber lückenhaften Produktangaben pro Markt und ohne freigegebenen öffentlichen Link zum Anbieter.",
    uk: "Добре оформлене казино White Hat Gaming із широким каталогом на базі платформи та актуальною партнерською пропозицією, але лише з частковими підтвердженнями щодо продукту для конкретних регіонів і без схваленого публічного комерційного посилання.",
    ru: "Хорошо оформленное казино White Hat Gaming с широким каталогом на базе платформы и текущим партнёрским предложением, но лишь с частичными подтверждениями по продукту для конкретных регионов и без одобренной публичной коммерческой ссылки.",
    uz: "Platforma taʼminlagan keng katalog va joriy hamkor taklifiga ega, yaxshi taqdim etilgan White Hat Gaming kazinosi; biroq aniq mamlakat boʻyicha mahsulot dalillari faqat qisman bor, tasdiqlangan ochiq tijoriy yoʻnalish esa yoʻq.",
  },
  // hello-casino
  {
    en: "A long-running White Hat Gaming brand with solid regulator evidence and a newer, well-specified partner offer; exact-country activation and current matching creative remain deliberately unresolved.",
    sv: "Ett väletablerat White Hat Gaming-varumärke med gediget underlag från tillsynsmyndigheter och ett nyare, väl specificerat partnererbjudande; aktivering för enskilda länder och matchande aktuellt reklammaterial är medvetet olösta.",
    da: "Et veletableret White Hat Gaming-brand med solid myndighedsdokumentation og et nyere, velbeskrevet partnertilbud; aktivering i de enkelte lande og matchende aktuelt reklamemateriale er bevidst uafklaret.",
    de: "Eine langjährige Marke von White Hat Gaming mit soliden Aufsichtsbelegen und neuerem, genau beschriebenem Partnerangebot; Freischaltung pro Land und passendes aktuelles Werbematerial bleiben bewusst offen.",
    uk: "Давній бренд White Hat Gaming із надійними підтвердженнями від регуляторів і новішою, чітко описаною партнерською пропозицією; активацію для окремих країн і відповідні актуальні рекламні матеріали свідомо залишено невирішеними.",
    ru: "Давно работающий бренд White Hat Gaming с надёжными подтверждениями от регуляторов и более новым, подробно описанным партнёрским предложением; активация для конкретных стран и подходящие актуальные рекламные материалы намеренно остаются нерешёнными.",
    uz: "Regulyator boʻyicha ishonchli dalillar va yangiroq, aniq belgilangan hamkor taklifiga ega uzoq yillik White Hat Gaming brendi; aniq mamlakatda faollashtirish va unga mos joriy reklama materiallari masalasi ataylab ochiq qoldirilgan.",
  },
  // playojo
  {
    en: "PlayOJO is SkillOnNet's flagship casino (launched March 2017): no wagering requirements on any promotion, OJOplus money-back on every bet, casino, live casino, bingo and jackpot games. Live in the UK, Sweden, Ontario, Spain, Mexico and Denmark under local licences.",
    sv: "PlayOJO är flaggskeppscasinot från SkillOnNet (lanserat i mars 2017): inga omsättningskrav på någon kampanj, pengar tillbaka med OJOplus på varje insats, casino, livecasino, bingo och jackpottspel. I drift i Storbritannien, Sverige, Ontario, Spanien, Mexiko och Danmark med lokala licenser.",
    da: "PlayOJO er SkillOnNets flagskibscasino (lanceret i marts 2017): ingen omsætningskrav på nogen kampagne, OJOplus med penge tilbage på hver indsats, casino, live casino, bingo og jackpotspil. Aktivt i Storbritannien, Sverige, Ontario, Spanien, Mexico og Danmark under lokale licenser.",
    de: "PlayOJO ist das Flaggschiff von SkillOnNet (gestartet im März 2017): keine Umsatzbedingungen bei allen Aktionen, OJOplus-Geld zurück bei jedem Einsatz, Slots, Bingo und weitere Spielarten. Mit lokalen Lizenzen aktiv in Großbritannien, Schweden, Ontario, Spanien, Mexiko und Dänemark.",
    uk: "PlayOJO — флагманське казино SkillOnNet (запущене в березні 2017 року): жодних вимог до відіграшу в будь-якій акції, повернення грошей OJOplus із кожної ставки, казино, лайв-казино, бінго та ігри з джекпотами. Працює у Великій Британії, Швеції, Онтаріо, Іспанії, Мексиці та Данії за місцевими ліцензіями.",
    ru: "PlayOJO — флагманское казино SkillOnNet (запущено в марте 2017 года): никаких требований по отыгрышу ни в одной акции, возврат денег OJOplus с каждой ставки, казино, лайв-казино, бинго и игры с джекпотами. Работает в Великобритании, Швеции, Онтарио, Испании, Мексике и Дании по местным лицензиям.",
    uz: "PlayOJO — SkillOnNet kompaniyasining flagman kazinosi (2017-yil martda ishga tushgan): hech qanday aksiyada aylantirish talabi yoʻq, har bir stavkadan OJOplus pul qaytarish, kazino, jonli kazino, bingo va jekpot oʻyinlari. Mahalliy litsenziyalar asosida Buyuk Britaniya, Shvetsiya, Ontario, Ispaniya, Meksika va Daniyada ishlaydi.",
  },
  // gday-casino
  {
    en: "A distinctive White Hat Gaming casino with active operator and domain evidence plus a current partner offer, held back by incomplete exact-market payment and withdrawal facts.",
    sv: "Ett särpräglat White Hat Gaming-casino med underlag om aktiv operatör och domän plus ett aktuellt partnererbjudande, som dras ned av ofullständiga exakta uppgifter om betalningar och uttag per marknad.",
    da: "Et karakteristisk White Hat Gaming-casino med aktiv dokumentation for operatør og domæne plus et aktuelt partnertilbud, holdt tilbage af ufuldstændige betalings- og udbetalingsfakta per marked.",
    de: "Ein eigenständiger Anbieter von White Hat Gaming mit belegtem Betreiber, aktiver Domain und aktuellem Partnerangebot, gebremst durch lückenhafte Ein- und Auszahlungsangaben pro Markt.",
    uk: "Самобутнє казино White Hat Gaming із підтвердженнями активного оператора й домену та актуальною партнерською пропозицією; оцінку стримують неповні точні дані про платежі та виведення коштів для конкретних регіонів.",
    ru: "Самобытное казино White Hat Gaming с подтверждениями действующего оператора и домена и текущим партнёрским предложением; оценку сдерживают неполные данные о платежах и выводе средств для конкретных регионов.",
    uz: "Faol operator va domen dalillari hamda joriy hamkor taklifiga ega oʻziga xos White Hat Gaming kazinosi; aniq mamlakat boʻyicha toʻlov va pul yechish maʼlumotlarining toʻliq emasligi uning bahosini pasaytiradi.",
  },
  // bacanaplay
  {
    en: "BacanaPlay (2019/20) is SkillOnNet's Portuguese-first casino — 2,200+ games, MB Way/Multibanco, VIB club — licensed by SRIJ in Portugal and live in Brazil (.bet.br); www.bacanaplay.com is UKGC-active and MGA/Danish variants exist.",
    sv: "BacanaPlay (2019/20) är SkillOnNets casino med fokus på Portugal – 2,200+ spel, MB Way/Multibanco, VIB-klubb – licensierat av SRIJ i Portugal och i drift i Brasilien (.bet.br); www.bacanaplay.com är aktiv hos UKGC och det finns varianter under MGA och dansk licens.",
    da: "BacanaPlay (2019/20) er SkillOnNets casino med Portugal i første række – 2,200+ spil, MB Way/Multibanco, VIB-klub – med licens fra SRIJ i Portugal og aktivt i Brasilien (.bet.br); www.bacanaplay.com er aktiv hos UKGC, og der findes MGA- og danske varianter.",
    de: "BacanaPlay (2019/20) ist das Angebot von SkillOnNet mit Fokus auf Portugal – 2,200+ Spiele, MB Way/Multibanco, VIB-Club –, von der SRIJ in Portugal lizenziert und in Brasilien aktiv (.bet.br); www.bacanaplay.com ist bei der UKGC aktiv, dazu gibt es Varianten mit MGA- und dänischer Lizenz.",
    uk: "BacanaPlay (2019/20) — казино SkillOnNet, орієнтоване насамперед на Португалію: 2,200+ ігор, MB Way/Multibanco, клуб VIB; має ліцензію SRIJ у Португалії та працює в Бразилії (.bet.br); www.bacanaplay.com активний у реєстрі UKGC, є також версії під ліцензією MGA та данською ліцензією.",
    ru: "BacanaPlay (2019/20) — казино SkillOnNet, ориентированное прежде всего на Португалию: 2,200+ игр, MB Way/Multibanco, клуб VIB; лицензировано SRIJ в Португалии и работает в Бразилии (.bet.br); www.bacanaplay.com активен в реестре UKGC, есть версии по лицензии MGA и датской лицензии.",
    uz: "BacanaPlay (2019/20) — SkillOnNet kompaniyasining asosan portugal tilidagi oʻyinchilarga moʻljallangan kazinosi: 2,200+ oʻyin, MB Way/Multibanco, VIB klubi. Portugaliyada SRIJ litsenziyasiga ega va Braziliyada (.bet.br) ishlaydi; www.bacanaplay.com UKGC litsenziyasi bilan faol, MGA va Daniya versiyalari ham mavjud.",
  },
  // drueckglueck
  {
    en: "DrückGlück (2015) is SkillOnNet's German-facing online Spielothek, TV-advertised, with a GGL virtual-slots permit since 29 Dec 2022 (drueckglueck.de). The .com/.co.uk domains are UKGC-active; Nordic-language variants exist under the MGA licence.",
    sv: "DrückGlück (2015) är SkillOnNets tyskinriktade Spielothek på nätet, med tv-reklam och ett GGL-tillstånd för virtuella slots sedan 29 december 2022 (drueckglueck.de). Domänerna .com/.co.uk är aktiva hos UKGC; varianter på nordiska språk finns under MGA-licensen.",
    da: "DrückGlück (2015) er SkillOnNets online-Spielothek for Tyskland, kendt fra tv-reklamer og med GGL-tilladelse til virtuelle slots (drueckglueck.de). Tilladelsen har været gældende siden den 29. december 2022; domænerne .com/.co.uk er aktive hos UKGC, og varianter på nordiske sprog findes under MGA-licensen.",
    de: "DrückGlück (2015) ist die Online-Spielothek von SkillOnNet für Deutschland, mit TV-Werbung und GGL-Erlaubnis für virtuelle Automatenspiele (drueckglueck.de). Diese Erlaubnis besteht seit dem 29. Dezember 2022; die .com- und .co.uk-Domains sind bei der UKGC aktiv, und Varianten in nordischen Sprachen laufen unter der MGA-Lizenz.",
    uk: "DrückGlück (2015) — онлайн-Spielothek від SkillOnNet для німецької аудиторії, з рекламою на телебаченні та дозволом GGL на віртуальні слоти від 29 грудня 2022 року (drueckglueck.de). Домени .com/.co.uk активні в реєстрі UKGC; версії мовами країн Північної Європи працюють під ліцензією MGA.",
    ru: "DrückGlück (2015) — онлайн-зал игровых автоматов (Spielothek) от SkillOnNet для немецкой аудитории, рекламируется на телевидении; с 29 декабря 2022 года имеет разрешение GGL на виртуальные слоты (drueckglueck.de). Домены .com/.co.uk активны в реестре UKGC; версии на языках стран Северной Европы работают по лицензии MGA.",
    uz: "DrückGlück (2015) — SkillOnNet kompaniyasining Germaniyaga moʻljallangan, televizorda reklama qilinadigan onlayn Spielothek (oʻyin zali); 2022-yil 29-dekabrdan beri GGL virtual slotlar ruxsatnomasiga ega (drueckglueck.de). .com/.co.uk domenlari UKGC litsenziyasi bilan faol; MGA litsenziyasi asosida Shimoliy Yevropa tillaridagi versiyalari ham mavjud.",
  },
  // turbonino
  {
    en: "TurboNino (2021) is SkillOnNet's Pay N Play casino: registration-free deposits via Trustly/Zimpler bank ID, marketed by EGO for Sweden, Germany and Finland. www.turbonino.com is also UKGC-active.",
    sv: "TurboNino (2021) är SkillOnNets Pay N Play-casino: insättningar utan registrering via Trustly/Zimpler med bank-id, marknadsfört av EGO för Sverige, Tyskland och Finland. www.turbonino.com är också aktiv hos UKGC.",
    da: "TurboNino (2021) er SkillOnNets Pay N Play-casino: registreringsfri indbetaling via Trustly/Zimpler med bank-id, markedsført af EGO i Sverige, Tyskland og Finland. www.turbonino.com er også aktiv hos UKGC.",
    de: "TurboNino (2021) ist der Pay N Play-Anbieter von SkillOnNet: Einzahlen ohne Registrierung per Bank-ID (Trustly/Zimpler), vermarktet von EGO für Schweden, Deutschland und Finnland. www.turbonino.com ist außerdem bei der UKGC aktiv.",
    uk: "TurboNino (2021) — казино Pay N Play від SkillOnNet: депозити без реєстрації через Trustly/Zimpler із банківською ідентифікацією; EGO просуває його для Швеції, Німеччини та Фінляндії. www.turbonino.com також активний у реєстрі UKGC.",
    ru: "TurboNino (2021) — казино SkillOnNet формата Pay N Play: депозиты без регистрации через Trustly/Zimpler с банковской идентификацией (bank ID); EGO продвигает его для Швеции, Германии и Финляндии. Сайт www.turbonino.com также активен в реестре UKGC.",
    uz: "TurboNino (2021) — SkillOnNet kompaniyasining Pay N Play kazinosi: Trustly/Zimpler orqali bank ID bilan roʻyxatdan oʻtmasdan depozit qilish mumkin; EGO uni Shvetsiya, Germaniya va Finlyandiya uchun targʻib qiladi. www.turbonino.com ham UKGC litsenziyasi bilan faol.",
  },
  // diamond7
  {
    en: "A recognizable White Hat Gaming casino with active domain evidence and an authenticated partner creative library, constrained by unresolved GEO scope and only partial exact-market product facts.",
    sv: "Ett välkänt White Hat Gaming-casino med underlag om aktiv domän och ett verifierat bibliotek med partnerns reklammaterial, begränsat av oklart geografiskt omfång och bara delvisa exakta produktuppgifter per marknad.",
    da: "Et genkendeligt White Hat Gaming-casino med aktiv domænedokumentation og et bekræftet bibliotek med partnerens reklamemateriale, begrænset af uafklaret geografisk dækning og kun delvise produktfakta per marked.",
    de: "Ein bekannter Anbieter von White Hat Gaming mit belegter aktiver Domain und bestätigtem Werbematerial des Partners, gebremst durch ungeklärte Länderabdeckung und lückenhafte Produktangaben pro Markt.",
    uk: "Впізнаване казино White Hat Gaming із підтвердженням активного домену та перевіреною бібліотекою партнерських рекламних матеріалів; обмеження — нез'ясоване географічне охоплення і лише часткові точні дані про продукт для конкретних регіонів.",
    ru: "Узнаваемое казино White Hat Gaming с подтверждением действующего домена и проверенной библиотекой партнёрских рекламных материалов; его ограничивают невыясненный географический охват и лишь частичные данные о продукте для конкретных регионов.",
    uz: "Faol domen dalillari va tasdiqlangan hamkor reklama materiallari kutubxonasiga ega taniqli White Hat Gaming kazinosi; hal qilinmagan GEO qamrovi va aniq mamlakat boʻyicha mahsulot maʼlumotlarining faqat qisman mavjudligi uni cheklaydi.",
  },
  // goldenplay
  {
    en: "GoldenPlay is a 2025 casino and sportsbook brand in the NetoPartners / Anakatech portfolio. Current partner material lists 950+ games, desktop and mobile play, seven product languages, EUR accounts, leading casino providers, crypto support and a casino welcome offer of 100% up to €555 plus 100 free spins on Book of Dead.",
    sv: "GoldenPlay är ett varumärke för casino och sportspel från 2025 i portföljen hos NetoPartners / Anakatech. Aktuellt partnermaterial listar 950+ spel, spel på dator och mobil, sju produktspråk, konton i EUR, ledande casinoleverantörer, stöd för krypto och ett välkomsterbjudande för casino på 100% upp till €555 plus 100 free spins på Book of Dead.",
    da: "GoldenPlay er et casino- og sportsbetting-brand fra 2025 i porteføljen hos NetoPartners / Anakatech. Aktuelt partnermateriale nævner 950+ spil, spil på computer og mobil, syv produktsprog, konti i EUR, førende casinoleverandører, understøttelse af krypto og et velkomsttilbud til casino på 100% op til €555 plus 100 free spins på Book of Dead.",
    de: "GoldenPlay ist eine 2025 gestartete Marke für Online-Spielothek und Sportwetten im Portfolio von NetoPartners / Anakatech. Aktuelles Material des Partners nennt 950+ Spiele, Spielen am Desktop und mobil, sieben Sprachen, Konten in EUR, führende Spielehersteller, Krypto-Unterstützung und ein Willkommensangebot von 100% bis zu €555 plus 100 Freispiele für Book of Dead.",
    uk: "GoldenPlay — бренд казино та ставок на спорт 2025 року в портфелі NetoPartners / Anakatech. В актуальних партнерських матеріалах зазначено 950+ ігор, гру на комп'ютері та мобільних пристроях, сім мов продукту, акаунти в EUR, провідних провайдерів казино, підтримку криптовалют і вітальну пропозицію для казино: 100% до €555 плюс 100 безкоштовних обертань у Book of Dead.",
    ru: "GoldenPlay — бренд казино и ставок на спорт, запущенный в 2025 году в портфеле NetoPartners / Anakatech. В актуальных партнёрских материалах указаны 950+ игр, игра на компьютере и мобильных устройствах, семь языков продукта, счета в EUR, ведущие провайдеры казино, поддержка криптовалюты и приветственное предложение казино: 100% до €555 плюс 100 бесплатных вращений в Book of Dead.",
    uz: "GoldenPlay — NetoPartners / Anakatech portfelidagi 2025-yilda ochilgan kazino va sport stavkalari brendi. Joriy hamkor materiallarida 950+ oʻyin, kompyuter va mobil qurilmalarda oʻynash, mahsulotning yetti tili, EUR hisoblari, yetakchi kazino provayderlari, kriptovalyuta qoʻllab-quvvatlanishi hamda 555 € gacha 100% va Book of Dead oʻyinida 100 ta bepul aylanishdan iborat kazino xush kelibsiz taklifi koʻrsatilgan.",
  },
  // regencycasino
  {
    en: "Regency Casino Online is the digital brand of Regency Entertainment S.A. (Mont Parnes, Thessaloniki — 30 years of land-based casinos), launched with SkillOnNet under a Greek HGC Type 2 licence: 3,000+ games and live casino with Greek-speaking dealers. www.regencycasino.com is a UKGC white-label; further roll-outs (DK, ES, SE, DE) announced.",
    sv: "Regency Casino Online är det digitala varumärket från Regency Entertainment S.A. (Mont Parnes, Thessaloniki – 30 år av landbaserade casinon), lanserat med SkillOnNet under en grekisk HGC-licens av typ 2: 3,000+ spel och livecasino med grekisktalande dealers. www.regencycasino.com är en white label under UKGC; fler lanseringar (DK, ES, SE, DE) har aviserats.",
    da: "Regency Casino Online er det digitale brand fra Regency Entertainment S.A., der står bag Mont Parnes og Thessaloniki med 30 år i landbaserede casinoer, og er lanceret med SkillOnNet under en græsk HGC Type 2-licens: 3,000+ spil og live casino med græsktalende dealere. www.regencycasino.com er en white label under UKGC; yderligere lanceringer (DK, ES, SE, DE) er annonceret.",
    de: "Regency Casino Online ist die digitale Marke der Regency Entertainment S.A., die seit 30 Jahren die Spielbanken Mont Parnes und Thessaloniki betreibt, gestartet mit SkillOnNet unter einer griechischen HGC-Lizenz (Type 2): 3,000+ Spiele sowie weitere Spielarten mit griechischsprachiger Betreuung. Die .com-Domain ist ein White-Label-Angebot mit UKGC-Lizenz; weitere Markteinführungen (DK, ES, SE, DE) sind angekündigt.",
    uk: "Regency Casino Online — цифровий бренд Regency Entertainment S.A. (Mont Parnes, Салоніки — 30 років наземних казино), запущений разом зі SkillOnNet за грецькою ліцензією HGC Type 2: 3,000+ ігор і лайв-казино з грекомовними дилерами. www.regencycasino.com — white-label у реєстрі UKGC; оголошено подальші запуски (DK, ES, SE, DE).",
    ru: "Regency Casino Online — цифровой бренд Regency Entertainment S.A. (Mont Parnes, Thessaloniki — 30 лет опыта в наземных казино), запущенный вместе с SkillOnNet по греческой лицензии HGC Type 2: 3,000+ игр и лайв-казино с грекоязычными дилерами. Сайт www.regencycasino.com — white label в реестре UKGC; объявлено о дальнейших запусках (DK, ES, SE, DE).",
    uz: "Regency Casino Online — Regency Entertainment S.A. kompaniyasining raqamli brendi (Mont Parnes, Saloniki — oflayn kazinolarda 30 yillik tajriba); SkillOnNet bilan birgalikda Gretsiyaning HGC Type 2 litsenziyasi asosida ishga tushirilgan: 3,000+ oʻyin va yunon tilida soʻzlashuvchi dilerlar bilan jonli kazino. www.regencycasino.com — UKGC white-label sayti; keyingi mamlakatlarda (DK, ES, SE, DE) ishga tushirish eʼlon qilingan.",
  },
  // ahti-games
  {
    en: "AHTI Games (2019) is SkillOnNet's Nordic-styled casino (dark sea theme) with 3,000+ games, tournaments and a VIP programme; strong in Finland and Sweden, Trustly withdrawals. www.ahtigames.com is UKGC-active; Nordic variants under the MGA/Swedish licences.",
    sv: "AHTI Games (2019) är SkillOnNets casino i nordisk stil (mörkt havstema) med 3,000+ spel, turneringar och ett VIP-program; starkt i Finland och Sverige, uttag via Trustly. www.ahtigames.com är aktiv hos UKGC; nordiska varianter drivs under MGA-licensen och den svenska licensen.",
    da: "AHTI Games (2019) er SkillOnNets casino i nordisk stil (mørkt havtema) med 3,000+ spil, turneringer og et VIP-program; stærkt i Finland og Sverige, udbetalinger via Trustly. www.ahtigames.com er aktiv hos UKGC; nordiske varianter kører under MGA-licensen og den svenske licens.",
    de: "AHTI Games (2019) ist der nordisch gestaltete Anbieter von SkillOnNet (dunkles Meeresthema) mit 3,000+ Spielen, Turnieren und VIP-Programm; stark in Finnland und Schweden, Auszahlungen per Trustly. www.ahtigames.com ist bei der UKGC aktiv; nordische Varianten laufen unter der MGA- und der schwedischen Lizenz.",
    uk: "AHTI Games (2019) — казино SkillOnNet у північному стилі (темна морська тема): 3,000+ ігор, турніри та VIP-програма; сильні позиції у Фінляндії та Швеції, виведення коштів через Trustly. www.ahtigames.com активний у реєстрі UKGC; версії для країн Північної Європи працюють під ліцензією MGA та шведською ліцензією.",
    ru: "AHTI Games (2019) — казино SkillOnNet в североевропейском стиле (тёмная морская тема): 3,000+ игр, турниры и VIP-программа; сильные позиции в Финляндии и Швеции, вывод средств через Trustly. Сайт www.ahtigames.com активен в реестре UKGC; версии для стран Северной Европы работают по лицензии MGA и шведской лицензии.",
    uz: "AHTI Games (2019) — SkillOnNet kompaniyasining Shimoliy Yevropa uslubidagi kazinosi (qorongʻi dengiz mavzusi): 3,000+ oʻyin, turnirlar va VIP dasturi; Finlyandiya va Shvetsiyada kuchli, pul yechish Trustly orqali. www.ahtigames.com UKGC litsenziyasi bilan faol; Shimoliy Yevropa versiyalari MGA va Shvetsiya litsenziyalari asosida ishlaydi.",
  },
  // eucasino
  {
    en: "EUcasino (2009) is one of SkillOnNet's oldest brands: 20+ language versions, multi-currency, VIP club, slots/live/table games. UKGC-active (.com/.co.uk), a dedicated Danish-licensed site eucasino.dk, and MGA-licensed international variants. Not available in every EU country despite the name.",
    sv: "EUcasino (2009) är ett av SkillOnNets äldsta varumärken: 20+ språkversioner, flera valutor, VIP-klubb, slots/live/bordsspel. Aktiv hos UKGC (.com/.co.uk), en egen sajt med dansk licens, eucasino.dk, och internationella varianter med MGA-licens. Finns trots namnet inte i alla EU-länder.",
    da: "EUcasino (2009) er et af SkillOnNets ældste brands: 20+ sprogversioner, flere valutaer, VIP-klub, spilleautomater/live/bordspil. Aktiv hos UKGC (.com/.co.uk), en særskilt side med dansk licens, eucasino.dk, og internationale varianter med MGA-licens. Ikke tilgængeligt i alle EU-lande trods navnet.",
    de: "EUcasino (2009) ist eine der ältesten Marken von SkillOnNet: 20+ Sprachversionen, mehrere Währungen, VIP-Club, Slots und weitere Spielarten. Bei der UKGC aktiv (.com/.co.uk), dazu eine eigene, in Dänemark lizenzierte .dk-Seite und international Varianten mit MGA-Lizenz. Trotz des Namens nicht in jedem EU-Land verfügbar.",
    uk: "EUcasino (2009) — один із найстаріших брендів SkillOnNet: 20+ мовних версій, кілька валют, VIP-клуб, слоти/live/настільні ігри. У реєстрі UKGC активні .com/.co.uk, є окремий сайт із данською ліцензією eucasino.dk і міжнародні версії під ліцензією MGA. Попри назву, доступний не в кожній країні ЄС.",
    ru: "EUcasino (2009) — один из старейших брендов SkillOnNet: 20+ языковых версий, несколько валют, VIP-клуб, слоты/лайв/настольные игры. Активен в реестре UKGC (.com/.co.uk), есть отдельный сайт с датской лицензией eucasino.dk и международные версии по лицензии MGA. Несмотря на название, доступен не во всех странах ЕС.",
    uz: "EUcasino (2009) — SkillOnNet kompaniyasining eng eski brendlaridan biri: 20+ til versiyasi, koʻp valyutali hisoblar, VIP klubi, slotlar, jonli va stol oʻyinlari. UKGC litsenziyasi bilan faol (.com/.co.uk), Daniya litsenziyasiga ega alohida eucasino.dk sayti va MGA litsenziyasidagi xalqaro versiyalar mavjud. Nomiga qaramay, Yevropa Ittifoqining har bir mamlakatida mavjud emas.",
  },
  // slotsmagic
  {
    en: "SlotsMagic (2014) is a large multi-language SkillOnNet casino — slots, Megaways, jackpots, live casino from Playtech, Pragmatic, Evolution, Games Global and 20+ studios; 24/7 support, iOS/Android apps. UKGC-active (.com/.co.uk), live in Ontario, plus 20 language variants under the MGA licence.",
    sv: "SlotsMagic (2014) är ett stort flerspråkigt casino från SkillOnNet – slots, Megaways, jackpottar, livecasino från Playtech, Pragmatic, Evolution, Games Global och 20+ studior; support 24/7, appar för iOS/Android. Aktiv hos UKGC (.com/.co.uk), i drift i Ontario, plus 20 språkversioner under MGA-licensen.",
    da: "SlotsMagic (2014) er et stort flersproget SkillOnNet-casino – spilleautomater, Megaways, jackpots, live casino fra Playtech, Pragmatic, Evolution, Games Global og 20+ studier; support 24/7, apps til iOS/Android. Aktiv hos UKGC (.com/.co.uk), aktiv i Ontario samt 20 sprogvarianter under MGA-licensen.",
    de: "SlotsMagic (2014) ist ein großer, mehrsprachiger Anbieter von SkillOnNet – Slots, Megaways und weitere Spielarten von Playtech, Pragmatic, Evolution, Games Global und 20+ Studios; 24/7-Support, Apps für iOS/Android. Bei der UKGC aktiv (.com/.co.uk), in Ontario verfügbar, dazu 20 Sprachvarianten unter der MGA-Lizenz.",
    uk: "SlotsMagic (2014) — велике багатомовне казино SkillOnNet: слоти, Megaways, джекпоти, лайв-казино від Playtech, Pragmatic, Evolution, Games Global і 20+ студій; підтримка 24/7, застосунки для iOS/Android. У реєстрі UKGC активні .com/.co.uk, працює в Онтаріо, а ще є 20 мовних версій під ліцензією MGA.",
    ru: "SlotsMagic (2014) — крупное многоязычное казино SkillOnNet: слоты, Megaways, джекпоты, лайв-казино от Playtech, Pragmatic, Evolution, Games Global и 20+ студий; поддержка 24/7, приложения для iOS/Android. Активен в реестре UKGC (.com/.co.uk), работает в Онтарио, плюс 20 языковых версий по лицензии MGA.",
    uz: "SlotsMagic (2014) — SkillOnNet kompaniyasining koʻp tilli yirik kazinosi: Playtech, Pragmatic, Evolution, Games Global va 20+ studiyaning slotlari, Megaways, jekpotlar va jonli kazino; 24/7 qoʻllab-quvvatlash, iOS/Android ilovalari. UKGC litsenziyasi bilan faol (.com/.co.uk), Ontarioda ishlaydi, shuningdek MGA litsenziyasi asosida 20 ta til versiyasi bor.",
  },
  // casino-redkings
  {
    en: "Casino RedKings (RedKings brand, 2011) is a SkillOnNet multi-market casino with a jackpot-slots and live-casino focus and 15 language versions. www.redkings.com is UKGC-active; other language variants run under the MGA licence.",
    sv: "Casino RedKings (varumärket RedKings, 2011) är ett casino från SkillOnNet på flera marknader med fokus på jackpottslots och livecasino och med 15 språkversioner. www.redkings.com är aktiv hos UKGC; övriga språkversioner drivs under MGA-licensen.",
    da: "Casino RedKings (brandet RedKings, 2011) er et SkillOnNet-casino på flere markeder med fokus på jackpot-slots og live casino og 15 sprogversioner. www.redkings.com er aktiv hos UKGC; øvrige sprogvarianter kører under MGA-licensen.",
    de: "Casino RedKings (Marke RedKings, 2011) ist ein Mehrmarkt-Anbieter von SkillOnNet mit Schwerpunkt auf Slots und weiteren Spielarten sowie 15 Sprachversionen. www.redkings.com ist bei der UKGC aktiv; andere Sprachvarianten laufen unter der MGA-Lizenz.",
    uk: "Casino RedKings (бренд RedKings, 2011) — казино SkillOnNet для кількох регіонів з акцентом на слоти з джекпотами та лайв-казино і з 15 мовними версіями. www.redkings.com активний у реєстрі UKGC; інші мовні версії працюють під ліцензією MGA.",
    ru: "Casino RedKings (бренд RedKings, 2011) — казино SkillOnNet для нескольких регионов с упором на слоты с джекпотами и лайв-казино, 15 языковых версий. Сайт www.redkings.com активен в реестре UKGC; остальные языковые версии работают по лицензии MGA.",
    uz: "Casino RedKings (RedKings brendi, 2011) — SkillOnNet kompaniyasining bir nechta mamlakatda ishlaydigan kazinosi; asosiy eʼtibor jekpot slotlari va jonli kazinoga qaratilgan, 15 ta til versiyasi bor. www.redkings.com UKGC litsenziyasi bilan faol; boshqa til versiyalari MGA litsenziyasi asosida ishlaydi.",
  },
  // dragonbet
  {
    en: "A real UK-focused casino with useful exact game-category and provider evidence, but sparse payment, withdrawal and current offer coverage compared with the rest of the release.",
    sv: "Ett riktigt casino inriktat på Storbritannien med användbara exakta uppgifter om spelkategorier och leverantörer, men med tunn täckning av betalningar, uttag och aktuella erbjudanden jämfört med resten av omgången.",
    da: "Et rigtigt casino med fokus på Storbritannien og nyttige præcise data om spilkategorier og leverandører, men sparsom dækning af betaling, udbetaling og aktuelle tilbud sammenlignet med resten af udgivelsen.",
    de: "Ein echter Anbieter für Großbritannien mit nützlichen genauen Angaben zu Spielkategorien und Herstellern, aber dünnen Angaben zu Zahlungen, Auszahlungen und aktuellen Angeboten im Vergleich zum Rest der Ausgabe.",
    uk: "Справжнє казино, орієнтоване на Велику Британію, з корисними точними підтвердженнями щодо категорій ігор і провайдерів, але зі скупими даними про платежі, виведення коштів та актуальні пропозиції порівняно з рештою випуску.",
    ru: "Настоящее казино, ориентированное на Великобританию, с полезными точными данными о категориях игр и провайдерах, но со скудными сведениями о платежах, выводе средств и текущих предложениях по сравнению с остальными в этом выпуске.",
    uz: "Buyuk Britaniyaga yoʻnaltirilgan haqiqiy kazino; oʻyin toifalari va provayderlar boʻyicha foydali aniq dalillar bor, biroq nashrdagi boshqa kazinolarga nisbatan toʻlovlar, pul yechish va joriy takliflar haqidagi maʼlumotlar kam.",
  },
  // jackpotstar
  {
    en: "JackpotStar (2020) is SkillOnNet's jackpot-focused casino with daily personalised picks; marketed by EGO for the UK, Sweden and MGA markets. jackpotstar.com is UKGC-active; 9 language variants exist.",
    sv: "JackpotStar (2020) är SkillOnNets jackpottfokuserade casino med dagliga personliga urval; marknadsförs av EGO för Storbritannien, Sverige och MGA-marknaderna. jackpotstar.com är aktiv hos UKGC; det finns 9 språkversioner.",
    da: "JackpotStar (2020) er SkillOnNets jackpotcasino med daglige personlige forslag; markedsført af EGO i Storbritannien, Sverige og på MGA-markederne. jackpotstar.com er aktiv hos UKGC; der findes 9 sprogvarianter.",
    de: "JackpotStar (2020) ist die Spezialmarke von SkillOnNet mit täglichen persönlichen Empfehlungen; vermarktet von EGO für Großbritannien, Schweden und MGA-Märkte. Die .com-Domain ist bei der UKGC aktiv; es gibt 9 Sprachvarianten.",
    uk: "JackpotStar (2020) — казино SkillOnNet з акцентом на джекпоти та щоденними персональними добірками; EGO просуває його для Великої Британії, Швеції та регіонів під ліцензією MGA. jackpotstar.com активний у реєстрі UKGC; є 9 мовних версій.",
    ru: "JackpotStar (2020) — казино SkillOnNet с упором на джекпоты и ежедневными персональными подборками; EGO продвигает его для Великобритании, Швеции и регионов под лицензией MGA. Сайт jackpotstar.com активен в реестре UKGC; есть 9 языковых версий.",
    uz: "JackpotStar (2020) — SkillOnNet kompaniyasining jekpotlarga yoʻnaltirilgan kazinosi, har kuni shaxsiy tavsiyalar beradi; EGO uni Buyuk Britaniya, Shvetsiya va MGA mamlakatlari uchun targʻib qiladi. jackpotstar.com UKGC litsenziyasi bilan faol; 9 ta til versiyasi mavjud.",
  },
  // playuzu
  {
    en: "PlayUZU is SkillOnNet's Spanish-language 'transparent casino' (Spain since 2020): no-wagering bonuses, UZUplus money-back on every bet, 2,500–4,300+ games incl. live casino. Locally licensed in Spain (DGOJ), Mexico, Peru, Buenos Aires City and Brazil (.bet.br).",
    sv: "PlayUZU är SkillOnNets spanskspråkiga ”transparenta casino” (i Spanien sedan 2020): bonusar utan omsättningskrav, pengar tillbaka med UZUplus på varje insats, 2,500–4,300+ spel inklusive livecasino. Lokalt licensierat i Spanien (DGOJ), Mexiko, Peru, staden Buenos Aires och Brasilien (.bet.br).",
    da: "PlayUZU er SkillOnNets spansksprogede 'gennemsigtige casino' (Spanien siden 2020): bonusser uden omsætningskrav, UZUplus med penge tilbage på hver indsats, 2,500–4,300+ spil inklusive live casino. Lokal licens i Spanien (DGOJ), Mexico, Peru, byen Buenos Aires og Brasilien (.bet.br).",
    de: "PlayUZU ist SkillOnNets spanischsprachige „transparente Spielothek“ (Spanien, seit 2020): umsatzfreie Boni, UZUplus-Cashback auf jeden Einsatz, 2,500–4,300+ Spiele. Lokal lizenziert in Spanien (DGOJ), Mexiko, Peru, der Stadt Buenos Aires und Brasilien (.bet.br).",
    uk: "PlayUZU — іспаномовне «прозоре казино» від SkillOnNet (в Іспанії з 2020 року): бонуси без вимог до відіграшу, повернення грошей UZUplus із кожної ставки, 2,500–4,300+ ігор, зокрема лайв-казино. Має місцеві ліцензії в Іспанії (DGOJ), Мексиці, Перу, місті Буенос-Айрес і Бразилії (.bet.br).",
    ru: "PlayUZU — испаноязычное «прозрачное казино» SkillOnNet (в Испании с 2020 года): бонусы без отыгрыша, возврат денег UZUplus с каждой ставки, 2,500–4,300+ игр, включая лайв-казино. Местные лицензии в Испании (DGOJ), Мексике, Перу, городе Буэнос-Айрес и Бразилии (.bet.br).",
    uz: "PlayUZU — SkillOnNet kompaniyasining ispan tilidagi “shaffof kazino” loyihasi (2020-yildan beri Ispaniyada): aylantirish talabisiz bonuslar, har bir stavkadan UZUplus pul qaytarish, jonli kazino bilan birga 2,500–4,300+ oʻyin. Ispaniya (DGOJ), Meksika, Peru, Buenos-Ayres shahri va Braziliyada (.bet.br) mahalliy litsenziyalarga ega.",
  },
  // 21-prive
  {
    en: "A licensed White Hat Gaming brand with a high-value partner headline, marked down for partial market facts and a historical withdrawal-complaint signal that requires prominent context.",
    sv: "Ett licensierat varumärke från White Hat Gaming med ett högt värderat partnererbjudande, med avdrag för ofullständiga marknadsuppgifter och en historik av klagomål på uttag som kräver tydlig kontext.",
    da: "Et licenseret White Hat Gaming-brand med en værdifuld partneroverskrift, trukket ned for ufuldstændige markedsoplysninger og et signal om tidligere klager over udbetalinger, som skal omtales tydeligt.",
    de: "Eine lizenzierte Marke von White Hat Gaming mit hochwertigem Partnerangebot, abgewertet wegen lückenhafter Marktangaben und früherer Auszahlungsbeschwerden, die deutlich eingeordnet werden müssen.",
    uk: "Ліцензований бренд White Hat Gaming із партнерською пропозицією на велику заявлену суму; оцінку знижено через часткові дані про регіони та давніші скарги на виведення коштів — сигнал, який потребує помітного контексту.",
    ru: "Лицензированный бренд White Hat Gaming с крупным заявленным партнёрским предложением; оценка снижена за неполные данные по регионам и за прошлые жалобы на вывод средств, которые требуют заметного пояснения.",
    uz: "Yuqori qiymatli hamkor taklifiga ega litsenziyalangan White Hat Gaming brendi; mamlakat boʻyicha maʼlumotlarning qisman ekani va pul yechish boʻyicha ilgari kelgan shikoyatlar sababli bahosi pasaytirilgan — bu haqda koʻzga koʻrinadigan izoh berilishi kerak.",
  },
  // megawayscasino
  {
    en: "MegawaysCasino is the official Megaways™-branded casino operated by SkillOnNet (UK launch, then international under the MGA licence from May 2026): Megaways slots first, plus live casino and jackpots. www.megawayscasino.com is UKGC-active.",
    sv: "MegawaysCasino är det officiella Megaways™-casinot, drivet av SkillOnNet (först i Storbritannien, sedan internationellt under MGA-licensen från maj 2026): Megaways-slots i första hand, plus livecasino och jackpottar. www.megawayscasino.com är aktiv hos UKGC.",
    da: "MegawaysCasino er det officielle casino under Megaways™-navnet, drevet af SkillOnNet (lanceret i Storbritannien, derefter internationalt under MGA-licensen fra maj 2026): Megaways-spilleautomater først, plus live casino og jackpots. www.megawayscasino.com er aktiv hos UKGC.",
    de: "MegawaysCasino ist der offizielle Anbieter unter der Marke Megaways™, betrieben von SkillOnNet (Start in Großbritannien, ab Mai 2026 international unter der MGA-Lizenz): Megaways-Slots stehen an erster Stelle, dazu weitere Spielarten. Die .com-Domain ist bei der UKGC aktiv.",
    uk: "MegawaysCasino — офіційне казино під брендом Megaways™, яким керує SkillOnNet (запуск у Великій Британії, далі міжнародний — під ліцензією MGA з травня 2026 року): насамперед слоти Megaways, а також лайв-казино і джекпоти. www.megawayscasino.com активний у реєстрі UKGC.",
    ru: "MegawaysCasino — официальное казино под брендом Megaways™, которым управляет SkillOnNet (запуск в Великобритании, затем международный — по лицензии MGA с мая 2026 года): в первую очередь слоты Megaways, плюс лайв-казино и джекпоты. Сайт www.megawayscasino.com активен в реестре UKGC.",
    uz: "MegawaysCasino — SkillOnNet boshqaradigan rasmiy Megaways™ brendidagi kazino (avval Buyuk Britaniyada ishga tushgan, 2026-yil maydan esa MGA litsenziyasi asosida xalqaro miqyosda ishlaydi): birinchi navbatda Megaways slotlari, shuningdek jonli kazino va jekpotlar. www.megawayscasino.com UKGC litsenziyasi bilan faol.",
  },
  // playojo-bingo
  {
    en: "PlayOJO Bingo is the bingo room of PlayOJO (Skill On Net Limited, UKGC Bingo Remote since Feb 2020): 90/75-ball rooms, Slingo and side games, with PlayOJO's no-wagering rules. UK-facing; EGO supplies a separate tracking link (site.playojobingo.com).",
    sv: "PlayOJO Bingo är bingorummet hos PlayOJO (Skill On Net Limited, UKGC Bingo Remote sedan februari 2020): rum för 90/75-bollars bingo, Slingo och sidospel, med PlayOJO:s regler utan omsättningskrav. Inriktat på Storbritannien; EGO tillhandahåller en separat spårningslänk (site.playojobingo.com).",
    da: "PlayOJO Bingo er PlayOJOs bingorum (Skill On Net Limited, UKGC Bingo Remote siden februar 2020): rum med 90/75 kugler, Slingo og sidespil med PlayOJOs regler uden omsætningskrav. Rettet mod Storbritannien; EGO leverer et separat sporingslink (site.playojobingo.com).",
    de: "PlayOJO Bingo ist der Bingo-Bereich von PlayOJO (Skill On Net Limited, UKGC-Lizenz Bingo Remote seit Februar 2020): 90/75-Ball-Räume, Slingo und Nebenspiele, mit den umsatzfreien Regeln von PlayOJO. Auf Großbritannien ausgerichtet; EGO stellt einen separaten Partner-Link bereit (site.playojobingo.com).",
    uk: "PlayOJO Bingo — бінго-кімната PlayOJO (Skill On Net Limited, UKGC Bingo Remote з лютого 2020 року): кімнати на 90/75 куль, Slingo та побічні ігри за правилами PlayOJO без вимог до відіграшу. Орієнтовано на Велику Британію; EGO надає окреме посилання для відстеження (site.playojobingo.com).",
    ru: "PlayOJO Bingo — бинго-зал PlayOJO (Skill On Net Limited, лицензия UKGC Bingo Remote с февраля 2020 года): комнаты на 90/75 шаров, Slingo и дополнительные игры по правилам PlayOJO без отыгрыша. Ориентирован на Великобританию; EGO предоставляет отдельную ссылку для отслеживания (site.playojobingo.com).",
    uz: "PlayOJO Bingo — PlayOJO kazinosining bingo zali (Skill On Net Limited, 2020-yil fevraldan beri UKGC Bingo Remote litsenziyasi): 90/75 sharli xonalar, Slingo va qoʻshimcha oʻyinlar, PlayOJO kazinosining aylantirish talabisiz qoidalari amal qiladi. Buyuk Britaniyaga moʻljallangan; EGO alohida kuzatuv havolasini taqdim etadi (site.playojobingo.com).",
  },
  // slotnite
  {
    en: "A current White Hat Gaming casino with a materially complete partner headline, ranked last because exact product facts are thin and recent payout-delay complaints add unresolved risk.",
    sv: "Ett aktuellt White Hat Gaming-casino med ett i allt väsentligt komplett partnererbjudande, rankat sist eftersom de exakta produktuppgifterna är tunna och nya klagomål om försenade utbetalningar ger en olöst risk.",
    da: "Et aktuelt White Hat Gaming-casino med en i det væsentlige komplet partneroverskrift, placeret sidst, fordi de præcise produktoplysninger er tynde, og nylige klager over forsinkede udbetalinger tilføjer en uafklaret risiko.",
    de: "Ein aktueller Anbieter von White Hat Gaming mit weitgehend vollständigem Partnerangebot, auf dem letzten Platz wegen dünner Produktangaben und jüngster Beschwerden über verzögerte Auszahlungen, die ein ungeklärtes Risiko bedeuten.",
    uk: "Активне казино White Hat Gaming із по суті повною партнерською пропозицією; останнє місце в рейтингу — бо точних даних про продукт мало, а нещодавні скарги на затримки виплат додають нез'ясованого ризику.",
    ru: "Действующее казино White Hat Gaming с практически полным описанием основного партнёрского предложения; занимает последнее место, потому что точных данных о продукте мало, а недавние жалобы на задержки выплат добавляют неснятый риск.",
    uz: "Hamkor taklifi asosiy jihatlari boʻyicha toʻliq boʻlgan joriy White Hat Gaming kazinosi; aniq mahsulot maʼlumotlari kamligi va yaqinda toʻlovlar kechikishi boʻyicha kelgan shikoyatlar hal qilinmagan xavf tugʻdirgani sababli oxirgi oʻrinda.",
  },
  // 21-prive
  {
    en: "A licensed White Hat Gaming brand with a broad observed catalog and a high-value partner headline, marked down for a historical withdrawal-complaint signal that requires prominent context.",
    sv: "Ett licensierat varumärke från White Hat Gaming med ett brett observerat spelutbud och ett högt värderat partnererbjudande, med avdrag för en historik av klagomål på uttag som kräver tydlig kontext.",
    da: "Et licenseret White Hat Gaming-brand med et bredt observeret spiludvalg og en værdifuld partneroverskrift, trukket ned for et signal om tidligere klager over udbetalinger, som skal omtales tydeligt.",
    de: "Eine lizenzierte Marke von White Hat Gaming mit breitem, von uns gesichtetem Spielangebot und hochwertigem Partnerangebot, abgewertet wegen früherer Auszahlungsbeschwerden, die deutlich eingeordnet werden müssen.",
    uk: "Ліцензований бренд White Hat Gaming із широким зафіксованим каталогом ігор і партнерською пропозицією на велику заявлену суму; оцінку знижено через давніші скарги на виведення коштів — сигнал, який потребує помітного контексту.",
    ru: "Лицензированный бренд White Hat Gaming с широким, по нашим наблюдениям, каталогом и крупным заявленным партнёрским предложением; оценка снижена за прошлые жалобы на вывод средств, которые требуют заметного пояснения.",
    uz: "Keng katalogi kuzatilgan va yuqori qiymatli hamkor taklifiga ega litsenziyalangan White Hat Gaming brendi; pul yechish boʻyicha ilgari kelgan shikoyatlar sababli bahosi pasaytirilgan — bu haqda koʻzga koʻrinadigan izoh berilishi kerak.",
  },
  // diamond7
  {
    en: "A recognizable White Hat Gaming casino with current regulator evidence, a populated global product profile and an authenticated €100 plus 25-spin partner offer.",
    sv: "Ett välkänt casino från White Hat Gaming med aktuellt underlag från tillsynsmyndigheten, en ifylld global produktprofil och ett verifierat partnererbjudande på €100 plus 25 free spins.",
    da: "Et genkendeligt White Hat Gaming-casino med aktuel myndighedsdokumentation, en udfyldt global produktprofil og et bekræftet partnertilbud på €100 plus 25 spins.",
    de: "Ein bekannter Anbieter von White Hat Gaming mit aktuellen Aufsichtsbelegen, ausgefülltem globalem Produktprofil und bestätigtem Partnerangebot über €100 plus 25 Freispiele.",
    uk: "Впізнаване казино White Hat Gaming з актуальними підтвердженнями від регулятора, заповненим глобальним профілем продукту та перевіреною партнерською пропозицією: €100 плюс 25 обертань.",
    ru: "Узнаваемое казино White Hat Gaming с актуальным подтверждением от регулятора, заполненным глобальным профилем продукта и подтверждённым партнёрским предложением: €100 плюс 25 вращений.",
    uz: "Regulyator boʻyicha joriy dalillar, toʻldirilgan global mahsulot profili va tasdiqlangan 100 € hamda 25 ta aylanishdan iborat hamkor taklifiga ega taniqli White Hat Gaming kazinosi.",
  },
  // gday-casino
  {
    en: "A distinctive White Hat Gaming casino with broad payment and provider evidence plus a current €100 and 25-spin partner offer.",
    sv: "Ett särpräglat casino från White Hat Gaming med brett underlag om betalningar och leverantörer plus ett aktuellt partnererbjudande på €100 och 25 free spins.",
    da: "Et karakteristisk White Hat Gaming-casino med bred dokumentation for betalinger og leverandører samt et aktuelt partnertilbud på €100 og 25 spins.",
    de: "Ein eigenständiger Anbieter von White Hat Gaming mit breiten Angaben zu Zahlungen und Herstellern plus aktuellem Partnerangebot über €100 und 25 Freispiele.",
    uk: "Самобутнє казино White Hat Gaming із широкими підтвердженнями щодо платежів і провайдерів та актуальною партнерською пропозицією: €100 і 25 обертань.",
    ru: "Самобытное казино White Hat Gaming с обширными подтверждениями по платежам и провайдерам и текущим партнёрским предложением: €100 и 25 вращений.",
    uz: "Toʻlovlar va provayderlar boʻyicha keng dalillar hamda 100 € va 25 ta aylanishdan iborat joriy hamkor taklifiga ega oʻziga xos White Hat Gaming kazinosi.",
  },
  // hello-casino
  {
    en: "A long-running White Hat Gaming brand with broad global product evidence and the current €300 plus 100-spin MGA offer, presented without stale promotional artwork.",
    sv: "Ett väletablerat varumärke från White Hat Gaming med brett globalt produktunderlag och det aktuella MGA-erbjudandet på €300 plus 100 free spins, presenterat utan inaktuellt reklammaterial.",
    da: "Et veletableret White Hat Gaming-brand med bred global produktdokumentation og det aktuelle MGA-tilbud på €300 plus 100 spins, vist uden forældet reklamegrafik.",
    de: "Eine langjährige Marke von White Hat Gaming mit breiten globalen Produktangaben und aktuellem MGA-Angebot über €300 plus 100 Freispiele, ohne veraltetes Werbematerial.",
    uk: "Давній бренд White Hat Gaming із широкими глобальними підтвердженнями щодо продукту та актуальною пропозицією під ліцензією MGA: €300 плюс 100 обертань; показано без застарілих рекламних зображень.",
    ru: "Давно работающий бренд White Hat Gaming с обширными глобальными подтверждениями по продукту и текущим предложением MGA: €300 плюс 100 вращений; показан без устаревших рекламных изображений.",
    uz: "Keng global mahsulot dalillari va 300 € hamda 100 ta aylanishdan iborat joriy MGA taklifiga ega uzoq yillik White Hat Gaming brendi; eskirgan reklama tasvirlarisiz taqdim etilgan.",
  },
  // skol-casino
  {
    en: "A well-presented White Hat Gaming casino with a broad, mobile-ready catalogue, populated payment evidence and a current €300 plus 100-spin offer.",
    sv: "Ett välpresenterat casino från White Hat Gaming med ett brett, mobilanpassat spelutbud, ifyllt underlag om betalningar och ett aktuellt erbjudande på €300 plus 100 free spins.",
    da: "Et velpræsenteret White Hat Gaming-casino med et bredt, mobilvenligt spiludvalg, udfyldt dokumentation for betalinger og et aktuelt tilbud på €300 plus 100 spins.",
    de: "Ein gut präsentierter Anbieter von White Hat Gaming: breites, mobiltaugliches Spielangebot, erfasste Zahlungsangaben, aktuelles Angebot über €300 plus 100 Freispiele.",
    uk: "Добре оформлене казино White Hat Gaming із широким каталогом, придатним для мобільних пристроїв, заповненими підтвердженнями щодо платежів та актуальною пропозицією: €300 плюс 100 обертань.",
    ru: "Хорошо оформленное казино White Hat Gaming с широким каталогом, удобным на мобильных устройствах, заполненными данными о платежах и текущим предложением: €300 плюс 100 вращений.",
    uz: "Mobil qurilmalarga moslashgan keng katalog, toʻldirilgan toʻlov dalillari va 300 € hamda 100 ta aylanishdan iborat joriy taklifga ega, yaxshi taqdim etilgan White Hat Gaming kazinosi.",
  },
  // slotnite
  {
    en: "A current White Hat Gaming casino with populated global product facts and a materially useful partner headline, ranked last because recent payout-delay complaints add unresolved risk.",
    sv: "Ett aktuellt White Hat Gaming-casino med ifyllda globala produktuppgifter och ett i allt väsentligt användbart partnererbjudande, rankat sist eftersom nya klagomål om försenade utbetalningar ger en olöst risk.",
    da: "Et aktuelt White Hat Gaming-casino med udfyldte globale produktoplysninger og en reelt brugbar partneroverskrift, placeret sidst, fordi nylige klager over forsinkede udbetalinger tilføjer en uafklaret risiko.",
    de: "Ein aktueller Anbieter von White Hat Gaming mit erfassten globalen Produktangaben und inhaltlich brauchbarem Partnerangebot, auf dem letzten Platz wegen jüngster Beschwerden über verzögerte Auszahlungen, die ein ungeklärtes Risiko bedeuten.",
    uk: "Активне казино White Hat Gaming із заповненими глобальними даними про продукт і по суті корисною партнерською пропозицією; останнє місце в рейтингу — бо нещодавні скарги на затримки виплат додають нез'ясованого ризику.",
    ru: "Действующее казино White Hat Gaming с заполненными глобальными данными о продукте и по существу полезным основным партнёрским предложением; занимает последнее место, потому что недавние жалобы на задержки выплат добавляют неснятый риск.",
    uz: "Toʻldirilgan global mahsulot maʼlumotlari va amalda foydali hamkor taklifiga ega joriy White Hat Gaming kazinosi; yaqinda toʻlovlar kechikishi boʻyicha kelgan shikoyatlar hal qilinmagan xavf tugʻdirgani sababli oxirgi oʻrinda.",
  },
];
