import { FIRST_WAVE_EVIDENCE_MARKET_CODES, type FirstWaveEvidenceMarketCode, type MarketCode, type SupportedLocale } from "./registry";

export const FIRST_WAVE_MARKETS = FIRST_WAVE_EVIDENCE_MARKET_CODES;
export type FirstWaveMarketCode = FirstWaveEvidenceMarketCode;

export type EvidenceClassification = "DETECTED" | "INFERRED" | "PROPOSED" | "UNKNOWN" | "CONTRADICTION";

export type MarketEvidenceRecord = Readonly<{
  id: string;
  authority: string;
  title: string;
  url: string;
  reviewedAt: "2026-09-03";
  nextReviewAt: string;
  classification: EvidenceClassification;
  materialFact: string;
  applicability: string;
}>;

export type SafetyResource = Readonly<{
  kind: "SELF_EXCLUSION" | "SUPPORT" | "INFORMATION" | "TREATMENT_DIRECTORY" | "BLOCKING_TOOL";
  name: string;
  provider: string;
  url: string;
  phone?: string;
  attribution: string;
}>;

export type FirstWaveSafetyCopy = Readonly<{
  eyebrow: string;
  helpTitle: string;
  helpLead: string;
  responsibleTitle: string;
  responsibleLead: string;
  resourcesTitle: string;
  selfExclusionTitle: string;
  supportTitle: string;
  informationTitle: string;
  reviewedLabel: string;
  sourceLabel: string;
  externalLabel: string;
  unavailable: string;
  nonCommercial: string;
  disclaimer: string;
  urgent: string;
}>;

export type FirstWaveMarketEvidenceProfile = Readonly<{
  market: FirstWaveMarketCode;
  locale: Extract<SupportedLocale, "de-DE" | "es-ES" | "sv-SE" | "da-DK" | "el-GR" | "es-PE">;
  authorityName: string;
  evidenceState: "EVIDENCE_FOUNDATION_REVIEWED_NOT_LEGAL_APPROVAL";
  commercialState: "NOT_VERIFIED_FAIL_CLOSED";
  promotionalCopyReview: "REQUIRED";
  terminology: readonly string[];
  resources: readonly SafetyResource[];
  evidence: readonly MarketEvidenceRecord[];
  copy: FirstWaveSafetyCopy;
}>;

const reviewedAt = "2026-09-03" as const;

function evidence(input: Omit<MarketEvidenceRecord, "reviewedAt" | "classification">): MarketEvidenceRecord {
  return { ...input, reviewedAt, classification: "DETECTED" };
}

function peruEvidence(input: Omit<MarketEvidenceRecord, "reviewedAt" | "classification">): MarketEvidenceRecord {
  return { ...input, reviewedAt, classification: "DETECTED" };
}

export const FIRST_WAVE_MARKET_EVIDENCE = {
  DE: {
    market: "DE",
    locale: "de-DE",
    authorityName: "Gemeinsame Glücksspielbehörde der Länder (GGL)",
    evidenceState: "EVIDENCE_FOUNDATION_REVIEWED_NOT_LEGAL_APPROVAL",
    commercialState: "NOT_VERIFIED_FAIL_CLOSED",
    promotionalCopyReview: "REQUIRED",
    terminology: [
      "Use Glücksspielanbieter where the product record does not establish a precise legal game category.",
      "Do not use Online-Casino as a generic synonym for operators offering virtual slot games.",
      "Preserve operator, source and legal instrument names exactly.",
    ],
    resources: [
      { kind: "SELF_EXCLUSION", name: "OASIS", provider: "Regierungspräsidium Darmstadt", url: "https://rp-darmstadt.hessen.de/sicherheit-und-kommunales/gluecksspiel/spielersperrsystem-oasis/spielerinnen-und-spieler", attribution: "Bundesweites Spielersperrsystem nach dem GlüStV 2021." },
      { kind: "SUPPORT", name: "BIÖG Beratungstelefon zur Glücksspielsucht", provider: "Bundesinstitut für Öffentliche Gesundheit (BIÖG)", url: "https://www.bioeg.de/service/infotelefone/gluecksspielsucht/", phone: "0800 1 37 27 00", attribution: "Kostenfreie telefonische Beratung des BIÖG; aktuelle Zeiten beim Anbieter prüfen." },
      { kind: "INFORMATION", name: "Check dein Spiel", provider: "Bundesinstitut für Öffentliche Gesundheit (BIÖG)", url: "https://www.check-dein-spiel.de/", attribution: "Informationen und Selbsttest des BIÖG." },
    ],
    evidence: [
      evidence({ id: "de-gluestv", authority: "GGL", title: "Glücksspielstaatsvertrag: Gesetzliche Regelungen", url: "https://www.gluecksspiel-behoerde.de/de/fuer-gluecksspielanbieter/gesetzliche-regelungen", nextReviewAt: "2027-02-28", materialFact: "The GlüStV 2021 is the basis of the GGL's work and establishes the German permission framework.", applicability: "Market evidence context only; not operator approval." }),
      evidence({ id: "de-whitelist", authority: "GGL", title: "Übersicht der erlaubten Glücksspielanbieter (Whitelist)", url: "https://www.gluecksspiel-behoerde.de/de/fuer-spielende/uebersicht-erlaubter-anbieter-whitelist", nextReviewAt: "2026-09-30", materialFact: "The official list records permitted organisers/intermediaries and their internet domains and is updated at least monthly.", applicability: "A future German commercial record requires a current exact operator-and-domain match; no match is populated here." }),
      evidence({ id: "de-terminology", authority: "GGL", title: "Was sind legale Online-Casinos in Deutschland?", url: "https://www.gluecksspiel-behoerde.de/de/fuer-spielende/informationen-fuer-spielende-faqs/faq-was-sind-legale-online-casinos-in-deutschland", nextReviewAt: "2027-02-28", materialFact: "GGL distinguishes virtual slot games from online casino games and warns that the common expression can be imprecise.", applicability: "German public terminology; route slugs and proper names are not renamed by this record." }),
      evidence({ id: "de-oasis", authority: "Regierungspräsidium Darmstadt", title: "Spielerinnen und Spieler — OASIS", url: "https://rp-darmstadt.hessen.de/sicherheit-und-kommunales/gluecksspiel/spielersperrsystem-oasis/spielerinnen-und-spieler", nextReviewAt: "2027-02-28", materialFact: "OASIS provides the GlüStV 2021 player-exclusion process and forms.", applicability: "German Help and Responsible Gambling presentation." }),
      evidence({ id: "de-bioeg", authority: "BIÖG", title: "Infotelefon zur Glücksspielsucht", url: "https://www.bioeg.de/service/infotelefone/gluecksspielsucht/", nextReviewAt: "2026-11-30", materialFact: "BIÖG publishes the free counselling number 0800 1 37 27 00.", applicability: "Phone number only; opening times are intentionally not copied." }),
      evidence({ id: "de-check-dein-spiel", authority: "BIÖG", title: "Check dein Spiel", url: "https://www.check-dein-spiel.de/", nextReviewAt: "2027-02-28", materialFact: "BIÖG provides gambling information and a self-test through Check dein Spiel.", applicability: "External information resource; B4GAMBLE makes no diagnosis." }),
    ],
    copy: {
      eyebrow: "Kontrolle & Unterstützung", helpTitle: "Hilfe, die von kommerziellen Inhalten getrennt bleibt.", helpLead: "Verifizierte deutsche Anlaufstellen für Spielpause, Selbstausschluss und unabhängige Beratung.", responsibleTitle: "Verantwortungsvolles Glücksspiel", responsibleLead: "Sachliche Informationen zu Kontrolle, Spielersperre und Unterstützung — ohne Diagnose oder Werbeangebote.", resourcesTitle: "Verifizierte externe Anlaufstellen", selfExclusionTitle: "Selbstausschluss", supportTitle: "Beratung und Unterstützung", informationTitle: "Informationen und Werkzeuge", reviewedLabel: "Evidenz geprüft", sourceLabel: "Quelle", externalLabel: "Extern öffnen", unavailable: "Keine verifizierte lokale Ressource verfügbar.", nonCommercial: "Keine Glücksspielanbieter, Boni oder Affiliate-Aktionen erscheinen auf dieser Seite.", disclaimer: "B4GAMBLE ist weder Regulierungsbehörde noch Beratungs- oder Behandlungsanbieter. Prüfe Leistungen und Datenschutz bei der jeweiligen Stelle.", urgent: "Bei unmittelbarer Gefahr wende dich an den örtlichen Notruf. B4GAMBLE ist kein Notfall- oder klinischer Dienst.",
    },
  },
  ES: {
    market: "ES", locale: "es-ES", authorityName: "Dirección General de Ordenación del Juego (DGOJ)", evidenceState: "EVIDENCE_FOUNDATION_REVIEWED_NOT_LEGAL_APPROVAL", commercialState: "NOT_VERIFIED_FAIL_CLOSED", promotionalCopyReview: "REQUIRED",
    terminology: ["Treat affiliate advertising as a gambling commercial communication.", "Do not infer operator, offer or advertising authorisation from directory presence alone.", "Promotional copy requires renewed review during the active 2026 reform process."],
    resources: [
      { kind: "SELF_EXCLUSION", name: "RGIAJ", provider: "DGOJ", url: "https://www.ordenacionjuego.es/participantes-juego/juego-seguro/rgiaj", attribution: "Registro estatal de autoprohibición; el alcance autonómico puede variar." },
      { kind: "INFORMATION", name: "Juego seguro", provider: "DGOJ", url: "https://www.ordenacionjuego.es/participantes-juego/juego-seguro", attribution: "Información oficial de la DGOJ sobre juego seguro." },
      { kind: "TREATMENT_DIRECTORY", name: "Directorio de instituciones", provider: "DGOJ", url: "https://www.ordenacionjuego.es/participantes-juego/juego-autorizado/enlaces-interes/instituciones", attribution: "Buscador oficial de instituciones públicas y privadas; no se presenta como una única línea nacional." },
    ],
    evidence: [
      evidence({ id: "es-affiliate", authority: "DGOJ", title: "Preguntas frecuentes — afiliación", url: "https://www.ordenacionjuego.es/preguntas-frecuentes?faq=194", nextReviewAt: "2026-11-30", materialFact: "Pure promotion/acquisition without player registration or account custody does not itself require a gambling title; the affiliate must verify operator and requested-advertising authorisation.", applicability: "Boundary only. B4GAMBLE partner, offer, tracking and commercial authority remain separate and absent." }),
      evidence({ id: "es-operators", authority: "DGOJ", title: "Buscador de operadores", url: "https://www.ordenacionjuego.es/operadores-juego/operadores-licencia/operadores", nextReviewAt: "2026-09-30", materialFact: "DGOJ publishes a current operator/domain directory.", applicability: "Evidence lookup only; listing does not establish B4GAMBLE authority or offer eligibility." }),
      evidence({ id: "es-supreme-court", authority: "Consejo General del Poder Judicial", title: "El Tribunal Supremo anula varios artículos del Real Decreto 958/2020", url: "https://www.poderjudicial.es/cgpj/es/Poder-Judicial/Noticias-Judiciales/El-Tribunal-Supremo-anula-varios-articulos-del-Real-Decreto-958-2020-de-comunicaciones-comerciales-de-las-actividades-de-juego", nextReviewAt: "2026-11-30", materialFact: "The Supreme Court annulled RD 958/2020 articles 13.1, 13.3, 15, 23.1, 25.3, 26.2 and 26.3.", applicability: "Stale promotional assumptions based on those provisions must not be encoded." }),
      evidence({ id: "es-reform-2026", authority: "DGOJ", title: "Reforma de la Ley del Juego — ronda de reuniones", url: "https://www.ordenacionjuego.es/novedades/dgoj-inicia-ronda-reuniones-entidades-han-presentado-aportaciones-reforma-ley-juego", nextReviewAt: "2026-09-30", materialFact: "As of July 2026, consultation contributions were still being discussed before drafting a bill, including digital advertising topics.", applicability: "All Spanish promotional copy remains review-required; no broad permanent rule is encoded." }),
      evidence({ id: "es-rgiaj", authority: "DGOJ", title: "Autoprohibición al juego — RGIAJ", url: "https://www.ordenacionjuego.es/participantes-juego/juego-seguro/rgiaj", nextReviewAt: "2027-02-28", materialFact: "RGIAJ registration affects online gambling and has state/autonomous-community scope nuances described by DGOJ.", applicability: "Spanish Help and Responsible Gambling presentation." }),
      evidence({ id: "es-support-directory", authority: "DGOJ", title: "Juego seguro en España — instituciones", url: "https://www.ordenacionjuego.es/participantes-juego/juego-autorizado/enlaces-interes/instituciones", nextReviewAt: "2026-11-30", materialFact: "DGOJ provides a searchable directory of public and private support institutions.", applicability: "Directory link only; no unsupported national hotline is asserted." }),
    ],
    copy: {
      eyebrow: "Control y apoyo", helpTitle: "Ayuda separada de lo comercial.", helpLead: "Recursos españoles verificados para autoprohibición, información y búsqueda de apoyo.", responsibleTitle: "Juego responsable", responsibleLead: "Información práctica de control y apoyo, sin diagnóstico ni promociones.", resourcesTitle: "Recursos externos verificados", selfExclusionTitle: "Autoprohibición", supportTitle: "Apoyo y tratamiento", informationTitle: "Información oficial", reviewedLabel: "Evidencia revisada", sourceLabel: "Fuente", externalLabel: "Abrir sitio externo", unavailable: "No hay un recurso local verificado disponible.", nonCommercial: "Esta página no contiene operadores, bonos ni acciones de afiliación.", disclaimer: "B4GAMBLE no es el regulador ni un proveedor de tratamiento. Comprueba el servicio y la privacidad con cada entidad.", urgent: "Si existe un peligro inmediato, contacta con los servicios de emergencia locales. B4GAMBLE no es un servicio clínico ni de emergencias.",
    },
  },
  SE: {
    market: "SE", locale: "sv-SE", authorityName: "Spelinspektionen", evidenceState: "EVIDENCE_FOUNDATION_REVIEWED_NOT_LEGAL_APPROVAL", commercialState: "NOT_VERIFIED_FAIL_CLOSED", promotionalCopyReview: "REQUIRED",
    terminology: ["Commercial online gambling and betting require the applicable Swedish licence.", "Do not promote unlicensed gambling, including through affiliate links.", "Keep age and support-information duties in any future commercial review."],
    resources: [
      { kind: "SELF_EXCLUSION", name: "Spelpaus.se", provider: "Spelinspektionen", url: "https://www.spelpaus.se/", attribution: "Självavstängning från allt registreringspliktigt spel hos alla bolag med svensk licens." },
      { kind: "SUPPORT", name: "Stödlinjen", provider: "Stockholms läns sjukvårdsområde med stöd från Folkhälsomyndigheten", url: "https://stodlinjen.se/", phone: "020-81 91 00", attribution: "Kostnadsfritt stöd i hela Sverige; drivs inte av Spelinspektionen." },
    ],
    evidence: [
      evidence({ id: "se-act", authority: "Spelinspektionen", title: "Swedish Gambling Act — unofficial English translation", url: "https://www.spelinspektionen.se/globalassets/dokument/engelsk/oversatt-spellagen/english-spellagen-sfs-2018_1138-uppdat-sfs-2024_255.pdf", nextReviewAt: "2027-02-28", materialFact: "Chapter 15 requires moderation, bars direct marketing to self-excluded players, and requires age and support information in covered commercial communications.", applicability: "Future Swedish commercial-copy review; Swedish original remains authoritative." }),
      evidence({ id: "se-unlicensed", authority: "Spelinspektionen", title: "Vad är olaglig spelverksamhet", url: "https://www.spelinspektionen.se/lagar-regler/olagligt-spel/vad-ar-olaglig-spelverksamhet/", nextReviewAt: "2026-11-30", materialFact: "Promoting an operator without the necessary Swedish licence is prohibited, including via affiliate links.", applicability: "Exact current operator-licence evidence is mandatory before any future commercial eligibility." }),
      evidence({ id: "se-spelpaus", authority: "Spelinspektionen", title: "Spelpaus.se", url: "https://www.spelpaus.se/", nextReviewAt: "2026-11-30", materialFact: "Spelpaus excludes a person from registered gambling with all Swedish licensees for the selected period.", applicability: "Swedish self-exclusion resource." }),
      evidence({ id: "se-stodlinjen", authority: "Stödlinjen", title: "Om Stödlinjen", url: "https://stodlinjen.se/om-oss", nextReviewAt: "2026-11-30", materialFact: "Stödlinjen is the national support line, publishes 020-81 91 00, and is operated by Stockholm County healthcare with support from the Public Health Agency.", applicability: "Swedish Help support with accurate operator attribution." }),
      evidence({ id: "se-112", authority: "SOS Alarm", title: "112 — Sveriges nödnummer vid akut hjälp", url: "https://www.sosalarm.se/112-och-andra-viktiga-nummer/viktiga-nummer/112/", nextReviewAt: "2027-02-28", materialFact: "SOS Alarm instructs people in Sweden to call 112 for an acute emergency involving danger to life, property or the environment.", applicability: "Exact emergency number in Swedish urgent-help copy only." }),
    ],
    copy: {
      eyebrow: "Kontroll och stöd", helpTitle: "Hjälp som hålls skild från kommersiellt innehåll.", helpLead: "Verifierade svenska vägar till självavstängning och oberoende stöd.", responsibleTitle: "Ansvarsfullt spelande", responsibleLead: "Saklig information om kontroll och stöd — utan diagnos eller erbjudanden.", resourcesTitle: "Verifierade externa resurser", selfExclusionTitle: "Självavstängning", supportTitle: "Stöd", informationTitle: "Information", reviewedLabel: "Evidens granskad", sourceLabel: "Källa", externalLabel: "Öppna extern webbplats", unavailable: "Ingen verifierad lokal resurs är tillgänglig.", nonCommercial: "Inga spelbolag, bonusar eller affiliateåtgärder visas på den här sidan.", disclaimer: "B4GAMBLE är varken tillsynsmyndighet eller vård- eller stödleverantör. Kontrollera respektive aktörs tjänster och integritetspolicy.", urgent: "Vid omedelbar fara ska du ringa 112. B4GAMBLE erbjuder varken akut eller klinisk hjälp.",
    },
  },
  DK: {
    market: "DK", locale: "da-DK", authorityName: "Spillemyndigheden", evidenceState: "EVIDENCE_FOUNDATION_REVIEWED_NOT_LEGAL_APPROVAL", commercialState: "NOT_VERIFIED_FAIL_CLOSED", promotionalCopyReview: "REQUIRED",
    terminology: ["Gambling offered or advertised in Denmark requires the relevant operator licence.", "Affiliate marketing is a recognised channel and remains subject to gambling and marketing rules.", "Do not imply that B4GAMBLE holds a gambling licence solely for affiliate-only marketing."],
    resources: [
      { kind: "SELF_EXCLUSION", name: "ROFUS", provider: "Spillemyndigheden", url: "https://www.rofus.nu/", attribution: "Spillemyndighedens register for frivillig udelukkelse fra spil i Danmark." },
      { kind: "SUPPORT", name: "StopSpillet", provider: "Spillemyndigheden", url: "https://www.stopspillet.dk/", phone: "70 22 28 25", attribution: "Fortrolig hjælpelinje om spilafhængighed; aktuelle åbningstider findes hos tjenesten." },
      { kind: "TREATMENT_DIRECTORY", name: "Søg behandling", provider: "Spillemyndigheden", url: "https://spillemyndigheden.dk/borgere-og-spillere/soeg-behandling", attribution: "Oversigt over statsstøttede, selvstændige behandlingstilbud, som ikke hører under Spillemyndigheden." },
    ],
    evidence: [
      evidence({ id: "dk-illegal", authority: "Spillemyndigheden", title: "Illegal gambling and advertising", url: "https://spillemyndigheden.dk/en-us/public-and-players/illegal-gambling-and-advertising", nextReviewAt: "2026-11-30", materialFact: "Operators may offer and advertise gambling services in Denmark only with the relevant Danish licence; advertising unlicensed operators is prohibited.", applicability: "Exact operator licence evidence is mandatory for future commercial eligibility." }),
      evidence({ id: "dk-affiliates", authority: "Spillemyndigheden", title: "Guidelines for operators of betting and online casino, version 9.0", url: "https://www.spillemyndigheden.dk/uploads/2025-06/Guidelines%20for%20operators%20of%20betting%20and%20online%20casino%20version%209.0%202025.pdf", nextReviewAt: "2027-02-28", materialFact: "Affiliate-only marketers do not need a gambling licence within the described boundary, but marketing and Gambling Act rules also apply to affiliates.", applicability: "No B4GAMBLE gambling-licence claim; commercial activation remains operator, offer and authority specific." }),
      evidence({ id: "dk-rofus", authority: "Spillemyndigheden", title: "ROFUS", url: "https://www.rofus.nu/", nextReviewAt: "2026-11-30", materialFact: "ROFUS is the authority's voluntary self-exclusion register for online gambling, land casinos and retail betting in Denmark.", applicability: "Danish self-exclusion resource." }),
      evidence({ id: "dk-stopspillet", authority: "Spillemyndigheden", title: "StopSpillet", url: "https://www.stopspillet.dk/", nextReviewAt: "2026-11-30", materialFact: "StopSpillet is the authority's confidential helpline and publishes 70 22 28 25.", applicability: "Phone number only; opening hours remain on the provider site." }),
      evidence({ id: "dk-treatment", authority: "Spillemyndigheden", title: "Søg behandling", url: "https://spillemyndigheden.dk/borgere-og-spillere/soeg-behandling", nextReviewAt: "2026-11-30", materialFact: "The authority lists state-supported treatment services and explicitly says the institutions are independent of the authority.", applicability: "External directory with no sponsorship or endorsement claim." }),
      evidence({ id: "dk-112", authority: "Rigspolitiet", title: "Alarm 112", url: "https://politi.dk/kontakt-politiet/alarm-112", nextReviewAt: "2027-02-28", materialFact: "Danish police instruct people to call 112 when they need acute help, including situations involving danger to life, property or the environment.", applicability: "Exact emergency number in Danish urgent-help copy only." }),
    ],
    copy: {
      eyebrow: "Kontrol og støtte", helpTitle: "Hjælp, der holdes adskilt fra kommercielt indhold.", helpLead: "Verificerede danske veje til udelukkelse, fortrolig rådgivning og behandlingstilbud.", responsibleTitle: "Ansvarligt spil", responsibleLead: "Nøgtern information om kontrol og støtte — uden diagnose eller tilbud.", resourcesTitle: "Verificerede eksterne ressourcer", selfExclusionTitle: "Udelukkelse", supportTitle: "Rådgivning og behandling", informationTitle: "Information", reviewedLabel: "Evidens gennemgået", sourceLabel: "Kilde", externalLabel: "Åbn ekstern side", unavailable: "Ingen verificeret lokal ressource er tilgængelig.", nonCommercial: "Denne side viser ingen spiludbydere, bonusser eller affiliatehandlinger.", disclaimer: "B4GAMBLE er hverken myndighed eller behandlingsudbyder. Kontrollér den enkelte aktørs tjenester og privatlivspolitik.", urgent: "Ved akut fare skal du ringe 112. B4GAMBLE yder hverken akut eller klinisk hjælp.",
    },
  },
  GR: {
    market: "GR", locale: "el-GR", authorityName: "Επιτροπή Εποπτείας και Ελέγχου Παιγνίων (ΕΕΕΠ / HGC)", evidenceState: "EVIDENCE_FOUNDATION_REVIEWED_NOT_LEGAL_APPROVAL", commercialState: "NOT_VERIFIED_FAIL_CLOSED", promotionalCopyReview: "REQUIRED",
    terminology: ["HGC_AFFILIATE_SUITABILITY_REQUIRED", "An operator or network offer cannot substitute for B4GAMBLE affiliate-suitability evidence.", "BetBlocker is an independent non-profit tool, not a Greek government service."],
    resources: [
      { kind: "SELF_EXCLUSION", name: "Οδηγός αποκλεισμού και αυτοαποκλεισμού", provider: "ΕΕΕΠ", url: "https://hgc.gov.gr/%CE%BA%CE%BF%CE%B9%CE%BD%CF%8C-%CE%BA%CE%B1%CE%B9-%CF%80%CE%B1%CE%AF%CE%BA%CF%84%CE%B5%CF%82/%CF%85%CF%80%CE%B5%CF%8D%CE%B8%CF%85%CE%BD%CE%BF-%CF%80%CE%B1%CE%B9%CF%87%CE%BD%CE%AF%CE%B4%CE%B9/%CE%B1%CF%80%CE%BF%CE%BA%CE%BB%CE%B5%CE%B9%CF%83%CE%BC%CF%8C%CF%82/", attribution: "Επίσημες πληροφορίες της ΕΕΕΠ για αποκλεισμό, προσωρινή αποχή και αιτήσεις." },
      { kind: "INFORMATION", name: "Υπεύθυνο παιχνίδι", provider: "ΕΕΕΠ", url: "https://www.gamingcommission.gov.gr/index.php", attribution: "Επίσημη ενημέρωση υπεύθυνου παιχνιδιού από την ΕΕΕΠ." },
      { kind: "BLOCKING_TOOL", name: "BetBlocker στα ελληνικά", provider: "BetBlocker — ανεξάρτητος διεθνής μη κερδοσκοπικός οργανισμός", url: "https://www.betblocker.org/gr/", attribution: "Η ΕΕΕΠ αναφέρει τη διαθεσιμότητα της ανεξάρτητης εφαρμογής στα ελληνικά· δεν είναι κρατική υπηρεσία." },
    ],
    evidence: [
      evidence({ id: "gr-affiliate-regulation", authority: "ΕΕΕΠ / HGC", title: "Άδεια Καταλληλότητας Συνεργατών και Μητρώο Συνεργατών — 509/1/11.09.2020", url: "https://licensing.gamingcommission.gov.gr/shared%20documents/FEK-2020-B-04140.pdf", nextReviewAt: "2026-11-30", materialFact: "The regulation establishes an Affiliate Suitability Licence and registration in the Affiliate Registry.", applicability: "HGC_AFFILIATE_SUITABILITY_REQUIRED. Current B4GAMBLE evidence is NOT VERIFIED / REQUIRED." }),
      evidence({ id: "gr-affiliate-registry", authority: "ΕΕΕΠ / HGC", title: "Μητρώο Συνεργατών", url: "https://certifications.gamingcommission.gov.gr/publicRecordsOnline/SitePages/AffiliatesOnline.aspx", nextReviewAt: "2026-09-30", materialFact: "HGC publishes a searchable Affiliate Registry.", applicability: "No B4GAMBLE entry or suitability is asserted or created." }),
      evidence({ id: "gr-self-exclusion", authority: "ΕΕΕΠ / HGC", title: "Αποκλεισμός", url: "https://hgc.gov.gr/%CE%BA%CE%BF%CE%B9%CE%BD%CF%8C-%CE%BA%CE%B1%CE%B9-%CF%80%CE%B1%CE%AF%CE%BA%CF%84%CE%B5%CF%82/%CF%85%CF%80%CE%B5%CF%8D%CE%B8%CF%85%CE%BD%CE%BF-%CF%80%CE%B1%CE%B9%CF%87%CE%BD%CE%AF%CE%B4%CE%B9/%CE%B1%CF%80%CE%BF%CE%BA%CE%BB%CE%B5%CE%B9%CF%83%CE%BC%CF%8C%CF%82/", nextReviewAt: "2027-02-28", materialFact: "HGC describes indefinite and temporary exclusion and a 24-hour pause, with scope depending on gambling channel.", applicability: "Greek Help and Responsible Gambling presentation; not described as one universal register." }),
      evidence({ id: "gr-betblocker", authority: "ΕΕΕΠ / HGC", title: "Διαθέσιμη πλέον στην ελληνική γλώσσα η εφαρμογή BetBlocker", url: "https://www.gamingcommission.gov.gr/index.php", nextReviewAt: "2026-11-30", materialFact: "HGC states that the independent international non-profit BetBlocker provides free anonymous blocking software and is available in Greek.", applicability: "External tool with independent-provider attribution; no government-service claim." }),
    ],
    copy: {
      eyebrow: "Έλεγχος και υποστήριξη", helpTitle: "Βοήθεια χωριστή από το εμπορικό περιεχόμενο.", helpLead: "Επαληθευμένες ελληνικές πληροφορίες για αυτοαποκλεισμό και εξωτερικά εργαλεία υποστήριξης.", responsibleTitle: "Υπεύθυνο παιχνίδι", responsibleLead: "Ουδέτερες πληροφορίες ελέγχου και υποστήριξης — χωρίς διάγνωση ή προσφορές.", resourcesTitle: "Επαληθευμένοι εξωτερικοί πόροι", selfExclusionTitle: "Αυτοαποκλεισμός", supportTitle: "Υποστήριξη", informationTitle: "Πληροφορίες και εργαλεία", reviewedLabel: "Τα τεκμήρια ελέγχθηκαν", sourceLabel: "Πηγή", externalLabel: "Άνοιγμα εξωτερικού ιστοτόπου", unavailable: "Δεν υπάρχει επαληθευμένος τοπικός πόρος.", nonCommercial: "Η σελίδα δεν περιέχει παρόχους, μπόνους ή ενέργειες συνεργατών.", disclaimer: "Η B4GAMBLE δεν είναι ρυθμιστική αρχή ή πάροχος θεραπείας. Έλεγξε τις υπηρεσίες και την πολιτική απορρήτου κάθε φορέα.", urgent: "Σε άμεσο κίνδυνο επικοινώνησε με τις τοπικές υπηρεσίες έκτακτης ανάγκης. Η B4GAMBLE δεν είναι κλινική ή επείγουσα υπηρεσία.",
    },
  },
  PE: {
    market: "PE",
    locale: "es-PE",
    authorityName: "Ministerio de Comercio Exterior y Turismo (MINCETUR)",
    evidenceState: "EVIDENCE_FOUNDATION_REVIEWED_NOT_LEGAL_APPROVAL",
    commercialState: "NOT_VERIFIED_FAIL_CLOSED",
    promotionalCopyReview: "REQUIRED",
    terminology: [
      "Use plataforma autorizada only when a current exact MINCETUR authorization record supports the operator and domain.",
      "Do not describe the physical-premises exclusion register as universal online self-exclusion.",
      "Keep operator authorization, B4GAMBLE commercial authority and offer eligibility as separate evidence gates.",
    ],
    resources: [
      {
        kind: "SELF_EXCLUSION",
        name: "Registro de personas prohibidas",
        provider: "MINCETUR",
        url: "https://www.gob.pe/institucion/mincetur/pages/765-inscribirse-en-el-registro-de-personas-prohibidas-a-acceder-a-las-salas-de-juegos-de-casinos-y-maquinas-tragamonedas",
        attribution: "Trámite oficial para solicitar la exclusión de salas de casino y máquinas tragamonedas; no se presenta como una exclusión universal de plataformas en línea.",
      },
      {
        kind: "INFORMATION",
        name: "Orientación sobre juego responsable",
        provider: "MINCETUR",
        url: "https://www.gob.pe/institucion/mincetur/noticias/1297424-apuestas-deportivas-mincetur-promueve-el-juego-responsable-ante-encuentros-deportivos",
        attribution: "Información oficial sobre límites, autocontrol, mayoría de edad y uso de plataformas autorizadas.",
      },
    ],
    evidence: [
      peruEvidence({ id: "pe-law-31557", authority: "Congreso de la República / MINCETUR", title: "Ley N.º 31557", url: "https://consultasenlinea.mincetur.gob.pe/casinos/archivos/2022LEY31557.pdf", nextReviewAt: "2027-03-02", materialFact: "Law 31557 establishes the Peruvian authorization and taxation framework for remote games and remote sports betting under MINCETUR competence.", applicability: "Regulatory context only; it is not proof of an exact operator, domain, offer or B4GAMBLE commercial authorization." }),
      peruEvidence({ id: "pe-platform-authorization", authority: "MINCETUR", title: "Autorización de explotación de plataformas tecnológicas", url: "https://www.gob.pe/institucion/mincetur/pages/94255-autorizacion-y-o-renovacion-de-explotacion-de-plataformas-tecnologicas-de-juegos-a-distancia-y-apuestas-deportivas-a-distancia", nextReviewAt: "2026-12-02", materialFact: "MINCETUR publishes the official procedure for authorization or renewal of remote-gaming and remote-sports-betting technology platforms.", applicability: "A current exact authorization remains required for each future operator record; no commercial link is activated here." }),
      peruEvidence({ id: "pe-illegal-platforms", authority: "MINCETUR", title: "MINCETUR bloquea plataformas que operaban sin autorización", url: "https://www.gob.pe/institucion/mincetur/noticias/1421604-mincetur-bloquea-36-plataformas-de-juegos-a-distancia-y-apuestas-deportivas-que-operaban-sin-autorizacion", nextReviewAt: "2026-12-02", materialFact: "MINCETUR reports blocking unauthorized remote-gambling platforms and directs adults to verify authorization before use.", applicability: "Supports fail-closed operator eligibility and no inference from language, currency or reachability." }),
      peruEvidence({ id: "pe-self-exclusion", authority: "MINCETUR", title: "Inscribirse en el Registro de personas prohibidas", url: "https://www.gob.pe/institucion/mincetur/pages/765-inscribirse-en-el-registro-de-personas-prohibidas-a-acceder-a-las-salas-de-juegos-de-casinos-y-maquinas-tragamonedas", nextReviewAt: "2027-03-02", materialFact: "MINCETUR provides a voluntary registration process that prevents access to casino gaming rooms and slot-machine premises.", applicability: "Peru Help resource with its physical-premises scope stated; no universal online exclusion claim." }),
      peruEvidence({ id: "pe-responsible-information", authority: "MINCETUR", title: "MINCETUR promueve el juego responsable", url: "https://www.gob.pe/institucion/mincetur/noticias/1297424-apuestas-deportivas-mincetur-promueve-el-juego-responsable-ante-encuentros-deportivos", nextReviewAt: "2027-03-02", materialFact: "MINCETUR publishes responsible-gambling guidance including adult-only participation, limits, self-control and use of authorized platforms.", applicability: "Neutral Peru Responsible Gambling information; no treatment or hotline claim." }),
    ],
    copy: {
      eyebrow: "Control y apoyo",
      helpTitle: "Ayuda separada de lo comercial.",
      helpLead: "Recursos oficiales verificados para información y exclusión voluntaria en Perú, con su alcance indicado.",
      responsibleTitle: "Juego responsable",
      responsibleLead: "Información práctica sobre límites, autocontrol y plataformas autorizadas, sin diagnóstico ni promociones.",
      resourcesTitle: "Recursos externos verificados",
      selfExclusionTitle: "Exclusión voluntaria",
      supportTitle: "Apoyo y tratamiento",
      informationTitle: "Información oficial",
      reviewedLabel: "Evidencia revisada",
      sourceLabel: "Fuente",
      externalLabel: "Abrir sitio externo",
      unavailable: "No se encontró una línea nacional o un recurso local de tratamiento que pudiera verificarse con una fuente oficial; no se inventa uno.",
      nonCommercial: "Esta página no contiene operadores, bonos ni acciones de afiliación.",
      disclaimer: "B4GAMBLE no es MINCETUR ni un proveedor de tratamiento. Revisa el alcance, el servicio y la privacidad directamente con cada entidad.",
      urgent: "Si existe un peligro inmediato, contacta con los servicios de emergencia locales. B4GAMBLE no es un servicio clínico ni de emergencias.",
    },
  },
} as const satisfies Record<FirstWaveMarketCode, FirstWaveMarketEvidenceProfile>;

export function isFirstWaveMarket(market: MarketCode): market is FirstWaveMarketCode {
  return (FIRST_WAVE_MARKETS as readonly MarketCode[]).includes(market);
}

export function firstWaveMarketEvidence(market: MarketCode) {
  return isFirstWaveMarket(market) ? FIRST_WAVE_MARKET_EVIDENCE[market] : null;
}
