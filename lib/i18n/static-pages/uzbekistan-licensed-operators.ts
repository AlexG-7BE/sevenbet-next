import type { SupportedLocale } from "@/lib/market/registry";

/**
 * Copy for /uzbekistan-licensed-operators (Founder pick «Страница о лицензиатах», 20 October 2026;
 * docs/07_Decisions/UZ-LICENSED-OPERATORS-2026-10-20.md): which companies hold an Uzbek licence
 * for online risk-based games and bookmaking, and how a player tells the licensed site and app
 * from mirrors and copies.
 *
 * A neutral reference page, never promotion. Uzbekistan's advertising law bans gambling
 * advertising, and RFC-054 allows commercial action only through governed `/r/` routes, so:
 *
 * 1. **No commercial action.** No bonus, no "play", no partner button, no `/r/` link, no ranking.
 *    Operator domains are plain text, never links.
 * 2. **Outbound links go to the regulator's register and lex.uz only**; the page's own links go to
 *    Help and Responsible Gambling.
 * 3. **Every fact carries its source**, read on official pages on 20 October 2026 (DETECTED).
 *
 * Uzbek is the target language (official Latin alphabet: oʻ and gʻ with U+02BB, the tutuq belgisi
 * with U+02BC, polite "siz"). English is the canonical fallback; the route exists in no other
 * language (MARKET_SCOPED_PUBLIC in lib/market/routing.ts).
 */
export const UZ_LICENSED_OPERATORS_PATH = "/uzbekistan-licensed-operators";

/** The day the register, the licence documents and every act below were read. */
export const UZ_REGISTER_READ_ON = "2026-10-20";

export const NAPP_REGISTER_URLS = {
  "uz-UZ": "https://napp.uz/oz/pages/rbglr",
  "en-GB": "https://napp.uz/en/pages/rbglr",
} as const;

export type UzLicenceKind = "ONLINE_GAMES" | "BOOKMAKING";

export type UzLicence = Readonly<{
  /** As the register prints it. */
  index: string;
  kind: UzLicenceKind;
  issuedOn: string;
  validTo: string;
  /** The Agency's order the licence was granted on (27 July 2026). */
  order: string;
}>;

export type UzLicensee = Readonly<{
  /** The company name inside its quotation marks; the legal form is per language (MChJ / LLC). */
  name: string;
  tin: string;
  /** As the register prints it. Plain text on the page, never a link. */
  domain: string;
  licences: readonly UzLicence[];
}>;

/**
 * The NAPP licence register (https://napp.uz/oz/pages/rbglr), read on 20 October 2026, and the
 * licence documents it links (ITO001, BF001, ITO002, BF002), which give the validity date.
 * Four entries, two companies; nothing else is in the register.
 */
export const UZ_LICENSEES: readonly UzLicensee[] = [
  {
    name: "Olimpbet",
    tin: "308547784",
    domain: "www.olimpbet.uz",
    licences: [
      { index: "ITO # 001", kind: "ONLINE_GAMES", issuedOn: "2026-07-31", validTo: "2031-07-30", order: "62" },
      { index: "BF # 001", kind: "BOOKMAKING", issuedOn: "2026-07-31", validTo: "2031-07-30", order: "63" },
    ],
  },
  {
    name: "Aurum Vale",
    tin: "312278399",
    domain: "www.oltinbet.uz",
    licences: [
      { index: "ITO # 002", kind: "ONLINE_GAMES", issuedOn: "2026-07-31", validTo: "2031-07-30", order: "64" },
      { index: "BF # 002", kind: "BOOKMAKING", issuedOn: "2026-07-31", validTo: "2031-07-30", order: "65" },
    ],
  },
];

export type UzSource = Readonly<{ label: string; href: string }>;
export type UzFaq = readonly (readonly [string, string])[];

export type UzLicensedOperatorsMessages = Readonly<{
  metadataTitle: string;
  metadataDescription: string;
  eyebrow: string;
  titleLead: string;
  titleEmphasis: string;
  /** The complete answer, first on the page, so a reader or an assistant can lift it whole. */
  answer: string;
  intro: string;
  asOfLabel: string;
  asOfDate: string;
  /** The revenue model. A claim about this page's text, never about the site menu. */
  revenueLine: string;
  companyForm: string;
  register: Readonly<{
    heading: string;
    intro: string;
    columns: Readonly<{ company: string; domain: string; licence: string; issued: string; validTo: string }>;
    kinds: Readonly<Record<UzLicenceKind, string>>;
    tinLabel: string;
    note: string;
    linkLabel: string;
  }>;
  notListed: Readonly<{ heading: string; body: string }>;
  law: Readonly<{ heading: string; items: readonly string[] }>;
  site: Readonly<{ heading: string; steps: readonly string[] }>;
  app: Readonly<{ heading: string; intro: string; steps: readonly string[] }>;
  protections: Readonly<{ heading: string; items: readonly string[] }>;
  help: Readonly<{ heading: string; body: string; helpLabel: string; responsibleLabel: string }>;
  faqHeading: string;
  faq: UzFaq;
  sources: Readonly<{ heading: string; intro: string; items: readonly UzSource[] }>;
  homeLabel: string;
  breadcrumbLabel: string;
}>;

const LEX = {
  decree68: "https://lex.uz/docs/-6899273",
  decree68Ru: "https://lex.uz/ru/docs/6899275",
  licensing3638: "https://lex.uz/docs/-7615198",
  register3639: "https://lex.uz/ru/docs/7615025",
  bookmaking3640: "https://lex.uz/docs/-7616094",
  onlineGames3641: "https://lex.uz/docs/-7615042",
  fines3643: "https://lex.uz/docs/-7615280",
  resolution814: "https://lex.uz/ru/docs/7257887",
} as const;

const uz: UzLicensedOperatorsMessages = {
  metadataTitle: "Olimpbet va Oltinbet litsenziyasi: haqiqiy sayt va ilovani tekshirish",
  metadataDescription: "2026-yil 20-oktabr holatiga koʻra NAPP reyestrida ikki kompaniya bor: “Olimpbet” MChJ (olimpbet.uz) va “Aurum Vale” MChJ (oltinbet.uz). Haqiqiy sayt va ilovani nusxalardan qanday ajratish mumkin.",
  eyebrow: "Oʻzbekiston · maʼlumotnoma",
  titleLead: "Oʻzbekistonda litsenziya kimda bor",
  titleEmphasis: "va haqiqiy saytni qanday tanish mumkin.",
  answer: "2026-yil 20-oktabr holatiga koʻra Istiqbolli loyihalar milliy agentligi (NAPP) litsenziyalar reyestrida ikki kompaniya bor: “Olimpbet” MChJ — www.olimpbet.uz va “Aurum Vale” MChJ — www.oltinbet.uz. Ularning har biri ikkita litsenziyaga ega: biri internetdagi tavakkalchilikka asoslangan oʻyinlar (onlayn kazino) uchun, ikkinchisi bukmekerlik faoliyati uchun. Reyestrda boshqa kompaniya, jumladan xorijiy brendlar ham yoʻq.",
  intro: "Bu sahifa — maʼlumotnoma: reyestrda nima yozilgani, qonun nimani talab qilishi va litsenziyali sayt hamda ilovani nusxalardan qanday ajratish mumkinligi. Biz hech qaysi operatorni tavsiya qilmaymiz.",
  asOfLabel: "Reyestr tekshirilgan sana:",
  asOfDate: "2026-yil 20-oktabr",
  revenueLine: "B4GAMBLE boshqa mamlakatlarda litsenziyalangan kazinolarni solishtiradi va oʻsha yerda komissiya oladi. Oʻzbekiston uchun bizda hamkorlik havolasi yoʻq; bu sahifa matni operatorlarni faqat reyestrdagi fakt sifatida tilga oladi va hech biriga havola bermaydi.",
  companyForm: "MChJ",
  register: {
    heading: "Reyestr: 2026-yil 20-oktabr holati",
    intro: "NAPP reyestridagi toʻrtta yozuv. Har bir litsenziyada bitta domen nomi koʻrsatilgan, litsenziya besh yil amal qiladi.",
    columns: { company: "Kompaniya", domain: "Domen", licence: "Litsenziya", issued: "Berilgan sana", validTo: "Amal qilish muddati" },
    kinds: {
      ONLINE_GAMES: "Internetdagi tavakkalchilikka asoslangan oʻyinlar (onlayn kazino)",
      BOOKMAKING: "Bukmekerlik faoliyati",
    },
    tinLabel: "STIR",
    note: "Manba: NAPP litsenziyalar reyestri va unga ilova qilingan litsenziya hujjatlari, 2026-yil 20-oktabrda oʻqildi. Litsenziyalar agentlikning 2026-yil 27-iyuldagi 62–65-son buyruqlari asosida berilgan. Reyestr oʻzgarishi mumkin: bu jadvalga tayanishdan oldin uni oʻzingiz tekshiring.",
    linkLabel: "NAPP litsenziyalar reyestrini ochish (napp.uz)",
  },
  notListed: {
    heading: "Reyestrda boʻlmagan brendlar",
    body: "Oʻzbekistonda koʻp uchraydigan xorijiy brendlar — masalan, 1xBet, Mostbet, Melbet, 1win va Pin-Up — 2026-yil 20-oktabrda reyestrda yoʻq. Ular boshqa mamlakat litsenziyasini koʻrsatsa ham, Oʻzbekiston litsenziyasiga ega emas. Agentlik Oʻzbekiston rezidentlariga litsenziyasiz xizmat koʻrsatayotgan xorijiy yuridik shaxslarga jarima qoʻllashi mumkin (2025-yil 7-iyuldagi 3643-son nizom).",
  },
  law: {
    heading: "Qonun nimani talab qiladi",
    items: [
      "2025-yil 1-yanvardan boshlab Oʻzbekistonda internetdagi tavakkalchilikka asoslangan oʻyinlar va bukmekerlik faoliyati faqat NAPP bergan litsenziya asosida ruxsat etiladi (Prezidentning 2024-yil 19-apreldagi PF-68-son Farmoni).",
      "Litsenziya faqat Oʻzbekiston rezidenti boʻlgan yuridik shaxsga besh yilga beriladi. Elektron platforma Oʻzbekiston hududidagi serverlarda joylashishi, faoliyat esa Internetning milliy segmentidagi (.uz) faqat bitta domen orqali yuritilishi shart (2025-yil 7-iyuldagi 3638-son nizom, 3- va 9-bandlar).",
      "Litsenziat oʻz xizmatini faqat litsenziyada koʻrsatilgan domen orqali koʻrsatishi mumkin; boshqa domen orqali xizmat koʻrsatish taqiqlanadi (onlayn kazino uchun 3641-son nizom, 2- va 7-bandlar; bukmekerlik uchun 3640-son nizom, 2- va 7-bandlar).",
      "Oʻyinda faqat 18 yoshga toʻlganlar qatnasha oladi (PF-68-son Farmon, 2-band).",
      "Depozit, stavka va yutuqlar faqat Stavkalar va oʻyinchilarning yagona davlat registri orqali oʻtadi: oʻyinchi pulni registr operatorining hisob-kitob-kliring palatasiga oʻtkazadi (3641-son nizom, 18-band; 3640-son nizom, 17-band).",
    ],
  },
  site: {
    heading: "Litsenziyali saytni qanday tanish mumkin",
    steps: [
      "Reyestrni oʻzingiz oching (napp.uz → «Litsenziyalar reyestri») va sayt manzilini aynan shu jadvaldan oling — reklama, kanal yoki xabardagi havoladan emas.",
      "Manzilni harfma-harf solishtiring. Litsenziyali sayt — reyestrdagi domenning aynan oʻzi: olimpbet.uz yoki oltinbet.uz. Qoʻshimcha soʻz, raqam yoki chiziqcha qoʻshilgan yoxud boshqa domen zonasidagi (.com, .net, .bet va hokazo) manzil — bu boshqa sayt.",
      "«Zerkalo» (koʻzgu) sayt litsenziyali xizmat emas. Litsenziat faqat litsenziyada koʻrsatilgan bitta domen orqali ishlashi mumkin, shuning uchun boshqa manzildagi nusxa tashqi koʻrinishi bir xil boʻlsa ham, bu litsenziya bilan ishlamaydi.",
      "Litsenziyali sayt kompaniya nomi, manzili, telefoni, elektron pochtasi va litsenziya nusxasini oʻzida joylashtirishi shart (3641-son nizom, 22-band; 3640-son nizom, 23-band). Saytdagi kompaniya nomi va litsenziya raqamini reyestr bilan solishtiring.",
      "Roʻyxatdan oʻtishda shaxsingiz masofadan raqamli identifikatsiya qilinadi, pul esa faqat yagona davlat registri orqali oʻtadi. Identifikatsiyasiz oʻynashni yoki pulni shaxsiy kartaga, kriptovalyutada yoxud naqd toʻlashni taklif qilayotgan sayt litsenziya qoidalariga mos kelmaydi.",
    ],
  },
  app: {
    heading: "Litsenziyali ilovani qanday tanish mumkin",
    intro: "Reyestrda ilova emas, domen koʻrsatilgan. Shuning uchun ilovani oʻsha .uz domen orqali tekshiring.",
    steps: [
      "Ilovani faqat reyestrdagi .uz saytning oʻzida berilgan havola orqali yoki shu sayt koʻrsatgan doʻkon sahifasidan oʻrnating.",
      "Google Play yoki App Store doʻkonida oʻrnatishdan oldin dasturchi (developer) haqidagi maʼlumotni oching: dasturchining nomi, sayti va aloqa manzili litsenziat kompaniyaga va uning .uz saytiga olib borishi kerak. Boshqa dasturchi chiqargan ilova — nomi va logotipi bir xil boʻlsa ham — litsenziatning ilovasi emas.",
      "Doʻkonda brend nomini qidirsangiz, natijalarda boshqa dasturchilarning ilovalari ham chiqishi mumkin. Ilovaning nomiga emas, dasturchisiga qarang.",
      "Telegram kanallari, chatlar yoki boshqa saytlar orqali yuborilgan APK fayllarni oʻrnatmang: ularni kim tayyorlaganini tekshirib boʻlmaydi.",
    ],
  },
  protections: {
    heading: "Qonun oʻyinchini qanday himoya qiladi",
    items: [
      "Faqat 18 yoshga toʻlganlar oʻynay oladi. Litsenziat voyaga yetmaganlar, qaram shaxslar roʻyxatidagi va cheklovlar roʻyxatidagi shaxslar bilan munosabat oʻrnata olmaydi; bitta oʻyinchiga faqat bitta akkaunt ochiladi (3641-son va 3640-son nizomlar, 10–11-bandlar).",
      "Oʻzini oʻzi chetlatish: shundan keyin registr depozit kiritishni cheklaydi, sizni Cheklovlar reyestriga kiritadi, akkauntingiz bor operatorlarga stavka qabul qilishni toʻxtatish haqida xabar yuboradi va soʻrovingizga koʻra pulingizni bankdagi hisobingizga oʻtkazadi. Undan keyin tuzilgan bitimlar bekor qilinadi (3639-son nizom, 53–54-bandlar).",
      "Tavakkalchilikka asoslangan oʻyinlarga qaram shaxslar roʻyxati: oʻz arizangiz bilan 6 oydan 5 yilgacha, yaqin qarindoshingiz arizasi bilan esa sud qarori asosida 5 yilga kiritilasiz (3639-son nizom, 1-band; Vazirlar Mahkamasining 2024-yil 6-dekabrdagi 814-son qarori).",
      "Oylik limit: agentlik depozitlar uchun oylik limit belgilashi mumkin. Oʻzbekiston fuqarosi arizasi bilan limitni oshirish mumkin, lekin u oʻrtacha oylik daromadning 10 foizidan oshmasligi kerak; daromadni registr «Elektron hukumat» tizimi orqali tekshiradi (3639-son nizom, 50–52-bandlar).",
      "Qarzga oʻyin yoʻq: litsenziat kredit, boʻlib toʻlash yoki qarz mablagʻ bilan oʻynashni taklif qila olmaydi, depozit va yutuqlarda naqd pul ishlatilmaydi (3641-son va 3640-son nizomlar, 7-band).",
      "Soliq: litsenziyali operatorlardan olingan yutuqlar jismoniy shaxslar daromad soligʻidan ozod. Operatorlar esa jami daromaddan toʻlangan yutuqlar va qaytarilgan stavkalarni chegirib, 4 foiz stavkada aylanmadan soliq toʻlaydi. Bu tartib 2026-yil 1-iyuldan uch yil muddatga eksperiment sifatida amal qiladi (PF-68-son Farmon, 3-band, 2026-yil 19-maydagi PF-95-son Farmon tahririda).",
    ],
  },
  help: {
    heading: "Oʻyinni toʻxtatmoqchi yoki cheklamoqchimisiz?",
    body: "Oʻzbekistondagi rasmiy yoʻllar — oʻzini oʻzi chetlatish, qaram shaxslar roʻyxati va qayerga murojaat qilish mumkinligi — Yordam sahifamizda jamlangan.",
    helpLabel: "Yordam sahifasini ochish",
    responsibleLabel: "Masʼuliyatli oʻyin",
  },
  faqHeading: "Koʻp beriladigan savollar",
  faq: [
    ["Oʻzbekistonda qaysi onlayn kazino va bukmekerlarning litsenziyasi bor?", "2026-yil 20-oktabr holatiga koʻra NAPP reyestrida ikki kompaniya bor: “Olimpbet” MChJ (www.olimpbet.uz) va “Aurum Vale” MChJ (www.oltinbet.uz). Har birida onlayn kazino (ITO) va bukmekerlik (BF) litsenziyasi bor; litsenziyalar 2031-yil 30-iyulgacha amal qiladi."],
    ["Olimpbetning litsenziyali sayti qaysi?", "Reyestrda “Olimpbet” MChJning ikkala litsenziyasi uchun bitta domen koʻrsatilgan: www.olimpbet.uz. Boshqa manzildagi sayt bu litsenziya bilan ishlamaydi."],
    ["1xBet, Mostbet yoki Melbet Oʻzbekistonda litsenziyaga egami?", "Yoʻq. 2026-yil 20-oktabrda ular NAPP reyestrida yoʻq."],
    ["Ilova haqiqiyligini qanday bilish mumkin?", "Doʻkon sahifasida dasturchi haqidagi maʼlumotni oching: dasturchining nomi va sayti litsenziat kompaniyaga va reyestrdagi .uz domenga olib borishi kerak. Telegram orqali yuborilgan APK fayllarni oʻrnatmang."],
  ],
  sources: {
    heading: "Manbalar",
    intro: "Barcha manbalar 2026-yil 20-oktabrda rasmiy saytlarda oʻqildi.",
    items: [
      { label: "NAPP litsenziyalar reyestri", href: NAPP_REGISTER_URLS["uz-UZ"] },
      { label: "Prezidentning PF-68-son Farmoni, 19.04.2024 (PF-95-son Farmon tahririda)", href: LEX.decree68 },
      { label: "3638-son nizom: litsenziyalash, 07.07.2025", href: LEX.licensing3638 },
      { label: "3639-son nizom: Stavkalar va oʻyinchilarning yagona davlat registri, 07.07.2025", href: LEX.register3639 },
      { label: "3640-son nizom: bukmekerlik faoliyati, 07.07.2025", href: LEX.bookmaking3640 },
      { label: "3641-son nizom: internetdagi tavakkalchilikka asoslangan oʻyinlar, 07.07.2025", href: LEX.onlineGames3641 },
      { label: "3643-son nizom: xorijiy yuridik shaxslarga jarima qoʻllash, 07.07.2025", href: LEX.fines3643 },
      { label: "Vazirlar Mahkamasining 814-son qarori, 06.12.2024", href: LEX.resolution814 },
    ],
  },
  homeLabel: "Bosh sahifa",
  breadcrumbLabel: "Litsenziyali operatorlar",
};

const en: UzLicensedOperatorsMessages = {
  metadataTitle: "Licensed online casinos and bookmakers in Uzbekistan: checking the real site and app",
  metadataDescription: "As of 20 October 2026, Uzbekistan's NAPP register lists two licensees: Olimpbet LLC (olimpbet.uz) and Aurum Vale LLC (oltinbet.uz). How to tell the licensed site and app from mirrors and copies.",
  eyebrow: "Uzbekistan · reference",
  titleLead: "Who holds a licence in Uzbekistan",
  titleEmphasis: "and how to tell the real site.",
  answer: "As of 20 October 2026, the licence register of Uzbekistan's National Agency of Prospective Projects (NAPP) lists two companies: “Olimpbet” LLC — www.olimpbet.uz, and “Aurum Vale” LLC — www.oltinbet.uz. Each holds two licences: one for online risk-based games (online casino) and one for bookmaking. No other company, and no foreign brand, is in the register.",
  intro: "This page is reference material: what the register says, what the law requires, and how to tell the licensed site and app from copies. It recommends no operator.",
  asOfLabel: "Register checked on",
  asOfDate: "20 October 2026",
  revenueLine: "B4GAMBLE compares casinos licensed in other countries and earns commission there. It has no partner link for Uzbekistan; the text of this page names operators only as facts from the register and links to none of them.",
  companyForm: "LLC",
  register: {
    heading: "The register on 20 October 2026",
    intro: "The four entries in the NAPP register. Each licence names one domain and runs for five years.",
    columns: { company: "Company", domain: "Domain", licence: "Licence", issued: "Issued", validTo: "Valid until" },
    kinds: {
      ONLINE_GAMES: "Online risk-based games (online casino)",
      BOOKMAKING: "Bookmaking (betting)",
    },
    tinLabel: "TIN",
    note: "Source: the NAPP licence register and the licence documents it links, read on 20 October 2026. The licences were granted by the Agency's orders No. 62–65 of 27 July 2026. The register can change: check it yourself before you rely on this table.",
    linkLabel: "Open the NAPP licence register (napp.uz)",
  },
  notListed: {
    heading: "Brands that are not in the register",
    body: "Foreign brands often seen in Uzbekistan — for example 1xBet, Mostbet, Melbet, 1win and Pin-Up — are not in the register on 20 October 2026. Whatever licence from another country they show, they hold no Uzbek licence. The Agency can fine foreign companies that serve residents of Uzbekistan without a licence (Regulation No. 3643 of 7 July 2025).",
  },
  law: {
    heading: "What the law requires",
    items: [
      "Since 1 January 2025, online risk-based games and bookmaking are allowed in Uzbekistan only under a licence from NAPP (Presidential Decree No. PF-68 of 19 April 2024).",
      "A licence is granted only to a legal entity resident in Uzbekistan, for five years. The platform must run on servers in Uzbekistan, and the business must use only one domain in the national (.uz) segment of the internet (Regulation No. 3638 of 7 July 2025, clauses 3 and 9).",
      "A licensee may serve players only through the domain written in its licence; serving them through any other domain is prohibited (Regulation No. 3641, clauses 2 and 7, for online casino; Regulation No. 3640, clauses 2 and 7, for bookmaking).",
      "Only people aged 18 or over may take part (Decree No. PF-68, clause 2).",
      "Deposits, stakes and winnings go only through the Unified State Register of Bets and Players: the player pays into the clearing house of the Register's operator (Regulation No. 3641, clause 18; Regulation No. 3640, clause 17).",
    ],
  },
  site: {
    heading: "How to recognise the licensed site",
    steps: [
      "Open the register yourself (napp.uz → “License Registry”) and take the site address from that table, not from an advert, a channel or a message.",
      "Compare the address letter by letter. The licensed site is exactly the domain in the register: olimpbet.uz or oltinbet.uz. An address with an extra word, digit or hyphen, or in another zone (.com, .net, .bet and so on), is a different site.",
      "A “mirror” is not the licensed service. A licensee may work only through the one domain in its licence, so a copy at another address is not covered by that licence, however alike it looks.",
      "The licensed site must publish the company's name, address, phone, e-mail and a copy of its licence (Regulation No. 3641, clause 22; Regulation No. 3640, clause 23). Compare the company name and the licence number on the site with the register.",
      "Registration includes a remote digital identity check, and money moves only through the Unified State Register. A site that lets you play without an identity check, or asks you to pay to a private card, in crypto or in cash, is not following the licence rules.",
    ],
  },
  app: {
    heading: "How to recognise the licensed app",
    intro: "The register lists a domain, not an app. So check an app against that .uz domain.",
    steps: [
      "Install an app only through a link on the licensed .uz site itself, or from the store page that site points to.",
      "In Google Play or the App Store, open the developer details before you install: the developer's name, website and contact address should lead back to the licensee and its .uz site. An app published by a different developer is not the licensee's app, even with the same name and logo.",
      "A store search for a brand's name can show apps by other developers. Look at the developer, not at the app's name.",
      "Do not install APK files sent through Telegram channels, chats or other sites: there is no way to check who made them.",
    ],
  },
  protections: {
    heading: "How the law protects players",
    items: [
      "Only people aged 18 or over may play. A licensee may not deal with minors or with anyone on the list of persons dependent on risk-based games or on the restrictions list, and a player may hold only one account (Regulations No. 3641 and No. 3640, clauses 10–11).",
      "Self-exclusion: the Register then blocks deposits, enters you in the Register of Restrictions, tells every operator where you have an account to stop taking your bets and, on your request, pays your money to your bank account. Transactions after that are cancelled (Regulation No. 3639, clauses 53–54).",
      "The list of persons dependent on risk-based games: on your own application for 6 months to 5 years; on a close relative's application, by court decision, for 5 years (Regulation No. 3639, clause 1; Cabinet of Ministers Resolution No. 814 of 6 December 2024).",
      "Monthly limit: the Agency may set a monthly limit on deposits. A citizen of Uzbekistan can apply to raise it, but never above 10 per cent of their average monthly income, which the Register checks through the e-government system (Regulation No. 3639, clauses 50–52).",
      "No play on credit: a licensee may not offer credit, instalments or borrowed money to play with, and cash is not used for deposits or winnings (Regulations No. 3641 and No. 3640, clause 7).",
      "Tax: winnings from licensed operators are exempt from personal income tax. Operators pay a 4 per cent turnover tax on their total income minus winnings paid and stakes returned. This applies as an experiment for three years from 1 July 2026 (Decree No. PF-68, clause 3, as amended by Decree No. PF-95 of 19 May 2026).",
    ],
  },
  help: {
    heading: "Want to stop or limit your play?",
    body: "The official ways to do it — self-exclusion, the list of persons dependent on risk-based games, and where to turn — are on our Help page.",
    helpLabel: "Open Help",
    responsibleLabel: "Responsible gambling",
  },
  faqHeading: "Questions people ask",
  faq: [
    ["Which online casinos and bookmakers are licensed in Uzbekistan?", "As of 20 October 2026, the NAPP register lists two companies: “Olimpbet” LLC (www.olimpbet.uz) and “Aurum Vale” LLC (www.oltinbet.uz). Each holds an online casino licence (ITO) and a bookmaking licence (BF), valid until 30 July 2031."],
    ["What is Olimpbet's licensed site?", "The register gives one domain for both of Olimpbet LLC's licences: www.olimpbet.uz. A site at any other address is not covered by that licence."],
    ["Are 1xBet, Mostbet or Melbet licensed in Uzbekistan?", "No. On 20 October 2026 they are not in the NAPP register."],
    ["How can I tell whether an app is genuine?", "Open the developer details on the store page: the developer's name and website should lead back to the licensee and the .uz domain in the register. Do not install APK files sent through Telegram."],
  ],
  sources: {
    heading: "Sources",
    intro: "Every source was read on official sites on 20 October 2026.",
    items: [
      { label: "NAPP licence register", href: NAPP_REGISTER_URLS["en-GB"] },
      { label: "Presidential Decree No. PF-68 (UP-68) of 19 April 2024, as amended by Decree No. PF-95", href: LEX.decree68Ru },
      { label: "Regulation No. 3638 on licensing, 7 July 2025", href: LEX.licensing3638 },
      { label: "Regulation No. 3639 on the Unified State Register of Bets and Players, 7 July 2025", href: LEX.register3639 },
      { label: "Regulation No. 3640 on bookmaking, 7 July 2025", href: LEX.bookmaking3640 },
      { label: "Regulation No. 3641 on online risk-based games, 7 July 2025", href: LEX.onlineGames3641 },
      { label: "Regulation No. 3643 on fines, including for foreign companies, 7 July 2025", href: LEX.fines3643 },
      { label: "Cabinet of Ministers Resolution No. 814 of 6 December 2024", href: LEX.resolution814 },
    ],
  },
  homeLabel: "Home",
  breadcrumbLabel: "Licensed operators in Uzbekistan",
};

const catalog: Partial<Record<SupportedLocale, UzLicensedOperatorsMessages>> = {
  "uz-UZ": uz,
  "en-GB": en,
};

/** The language the page is written in for this locale: Uzbek, or the English fallback. */
export function uzLicensedOperatorsLocale(locale: SupportedLocale): SupportedLocale {
  return catalog[locale] ? locale : "en-GB";
}

export function uzLicensedOperatorsMessages(locale: SupportedLocale): UzLicensedOperatorsMessages {
  return catalog[uzLicensedOperatorsLocale(locale)] ?? en;
}

/** A register date as the page prints it: 31.07.2026 in Uzbek, 31 July 2026 in English. */
export function formatRegisterDate(isoDate: string, locale: SupportedLocale) {
  const [year, month, day] = isoDate.split("-");
  if (uzLicensedOperatorsLocale(locale) === "uz-UZ") return `${day}.${month}.${year}`;
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${Number(day)} ${months[Number(month) - 1]} ${year}`;
}
