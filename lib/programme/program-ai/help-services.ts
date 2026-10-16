import type { ProgrammeLocale } from "@/lib/programme/presentation";

/**
 * The help services of the third step, "Know who to turn to" (Founder, 16 October 2026: the
 * step-3 lesson brings in one person or one help service and says where to turn when the urge
 * comes). One list per Programme language whose market we checked: Swedish for Sweden, Danish
 * for Denmark, English for Great Britain. Names, numbers and opening hours are copied from each
 * service's own page on 16 October 2026; the source of every line is in `HELP_SERVICE_SOURCES`.
 * Where a service's own page refused an automated visit (mind.se, gamcare.org.uk), the line is
 * copied from the national health service page that lists it (1177.se, nhs.uk).
 *
 * A Programme language without a checked list (German, Spanish, Greek, Italian, Portuguese,
 * Dutch, Finnish, Norwegian, Ukrainian, Russian) shows no number: it points to the Help page,
 * and its crisis row asks the reader to call the local emergency number.
 *
 * Nothing here is stored. A person's answer keeps only the kind of help they chose (`phone`,
 * `chat`, ...); the service, its number and its hours are drawn from this list when the card is
 * shown, so a corrected number reaches every card at once.
 */

export const PROGRAMME_HELP_SERVICE_TYPES = ["phone", "chat", "in_person", "debt", "close_ones"] as const;
export type ProgrammeHelpServiceType = (typeof PROGRAMME_HELP_SERVICE_TYPES)[number];

export const HELP_SERVICES_CHECKED_ON = "2026-10-16";

export type ProgrammeHelpContact = Readonly<{
  name: string;
  /** One line on what the service is, in the words of its own page where they are short enough. */
  about: string;
  /** The number or address a person uses, as the service writes it. */
  contact: string;
  /** Digits for a `tel:` link; absent when the contact is a website. */
  tel?: string;
  href: string;
  hours?: string;
}>;

export type ProgrammeCrisisLine = Readonly<{
  name: string;
  contact: string;
  tel: string;
  href: string;
  hours?: string;
  /** The emergency number, in the words of the page that names it. */
  emergency: string;
}>;

export type ProgrammeHelpMarket = Readonly<{
  /** Shown after "YOUR HELP SERVICE", in the market's language. */
  country: string;
  services: Readonly<Record<ProgrammeHelpServiceType, ProgrammeHelpContact>>;
  /** A line that answers when the first one is closed (Sweden: Stödlinjen closes evenings and weekends). */
  afterHours: Partial<Readonly<Record<ProgrammeHelpServiceType, ProgrammeHelpContact>>>;
  crisis: ProgrammeCrisisLine;
}>;

const stodlinjenHours = "Helgfria vardagar: måndag 9–19, tisdag 9–17, onsdag 9–17, torsdag 11–19, fredag 9–15";
const centerForLudomani = {
  contact: "70 11 18 10",
  tel: "70111810",
  hours: "Telefontid: man–ons 8.30–15.00, torsdag 09.00–17.00, fredag 08.30–12.00",
} as const;

const sweden: ProgrammeHelpMarket = {
  country: "Sverige",
  services: {
    phone: {
      name: "Stödlinjen",
      about: "Råd och stöd om spel om pengar. Det kostar ingenting och du behöver inte berätta vem du är.",
      contact: "020-81 91 00",
      tel: "020819100",
      href: "https://stodlinjen.se/",
      hours: stodlinjenHours,
    },
    chat: {
      name: "Stödlinjen, chatt",
      about: "Chatta med någon av Stödlinjens rådgivare. Det kostar ingenting och du behöver inte berätta vem du är.",
      contact: "stodlinjen.se/chatt",
      href: "https://stodlinjen.se/chatt",
      hours: stodlinjenHours,
    },
    in_person: {
      name: "Spelberoendes Riksförbund",
      about: "Självhjälpsmöten för spelare och anhöriga runt om i landet, och online.",
      contact: "spelberoende.se",
      href: "https://spelberoende.se/alla-foreningar/",
      hours: "Online: helgfria torsdagar 19:00–20:30",
    },
    debt: {
      name: "Kommunens budget- och skuldrådgivning",
      about: "Alla kommuner måste ge ekonomisk rådgivning till personer med skulder. Rådgivningen är kostnadsfri och omfattas av sekretess.",
      contact: "Sök din kommun på konsumentverket.se",
      href: "https://www.konsumentverket.se/ekonomi/kommunal-budget-och-skuldradgivning/",
    },
    close_ones: {
      name: "Stödlinjen, för anhöriga",
      about: "Stödlinjen ger även råd och stöd till dig som är orolig för någon annan som spelar om pengar.",
      contact: "020-81 91 00",
      tel: "020819100",
      href: "https://stodlinjen.se/",
      hours: stodlinjenHours,
    },
  },
  afterHours: {
    phone: {
      name: "Föreningen Spelfriheten",
      about: "Du pratar med någon som själv levt med beroendet eller är anhörig – idag i tillfrisknande.",
      contact: "08-37 43 00",
      tel: "08374300",
      href: "https://foreningenspelfriheten.se/",
      hours: "Öppet dygnet runt, året om",
    },
  },
  crisis: {
    name: "Självmordslinjen (Mind)",
    contact: "90101",
    tel: "90101",
    href: "https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/sjalvmordstankar/till-dig-som-har-sjalvmordstankar/",
    hours: "ring eller chatta via mind.se",
    emergency: "Om det är bråttom: ring 112",
  },
};

const denmark: ProgrammeHelpMarket = {
  country: "Danmark",
  services: {
    phone: {
      name: "StopSpillet",
      about: "Spillemyndighedens hjælpelinje om spilafhængighed. Samtalen er fortrolig mellem dig og rådgiveren.",
      contact: "70 22 28 25",
      tel: "70222825",
      href: "https://www.stopspillet.dk/",
      hours: "Mandag–torsdag 9.00–21.00, fredag 9.00–17.00",
    },
    chat: {
      name: "StopSpillet, chat",
      about: "Chat med StopSpillets rådgivere. Samtalen er fortrolig mellem dig og rådgiveren.",
      contact: "stopspillet.dk",
      href: "https://www.stopspillet.dk/",
      hours: "Mandag–torsdag 17.00–21.00, fredag 14.00–17.00",
    },
    in_person: {
      name: "Center for Ludomani",
      about: "Gratis behandling uden henvisning: samtaler i Odense, København, Aarhus eller Esbjerg, eller online.",
      ...centerForLudomani,
      href: "https://ludomani.dk/",
    },
    debt: {
      name: "KFUM's Sociale Arbejde, økonomi- og gældsrådgivning",
      about: "Gratis rådgivning om økonomi og gæld, over 30 steder i landet.",
      contact: "63 40 11 49",
      tel: "63401149",
      href: "https://www.raad.dk/om-raadgivningen/oekonomisk-raadgivning",
      hours: "Telefonrådgivning: mandag 15–17, tirsdag 12–14, onsdag 15–17, torsdag 8–10",
    },
    close_ones: {
      name: "Center for Ludomani, for pårørende",
      about: "Gratis og anonym rådgivning til pårørende, og pårørendemøder i Aarhus, Odense og København.",
      ...centerForLudomani,
      href: "https://ludomani.dk/",
    },
  },
  afterHours: {},
  crisis: {
    name: "Livslinien",
    contact: "70 201 201",
    tel: "70201201",
    href: "https://www.livslinien.dk/",
    hours: "alle årets dage fra kl. 09-05",
    emergency: "Er du akut selvmordstruet: ring 112",
  },
};

const greatBritain: ProgrammeHelpMarket = {
  country: "Great Britain",
  services: {
    phone: {
      name: "National Gambling Helpline",
      about: "Run by GamCare: free information, support and counselling.",
      contact: "0808 8020 133",
      tel: "08088020133",
      href: "https://www.nhs.uk/live-well/addiction-support/gambling-addiction/",
      hours: "Free, 24 hours a day, 7 days a week",
    },
    chat: {
      name: "GambleAware",
      about: "Chat online to an adviser for confidential advice, information and support. Only for Great Britain residents.",
      contact: "begambleaware.org",
      href: "https://www.begambleaware.org/",
      hours: "Free, 24/7",
    },
    in_person: {
      name: "Gamblers Anonymous",
      about: "Meetings every day of the week throughout England, Wales and Ulster. No appointment is needed, just turn up.",
      contact: "gamblersanonymous.org.uk",
      href: "https://www.gamblersanonymous.org.uk/",
    },
    debt: {
      name: "StepChange",
      about: "Free and impartial debt advice from a debt charity. Freephone, including all mobiles.",
      contact: "0800 138 1111",
      tel: "08001381111",
      href: "https://www.stepchange.org/contact-us.aspx",
      hours: "Monday to Friday 8am to 8pm, Saturday 9am to 2pm",
    },
    close_ones: {
      name: "GamFam",
      about: "A charity set up by people who have lived through what gambling does to family and friends. Meetings run on Zoom.",
      contact: "gamfam.org.uk",
      href: "https://gamfam.org.uk/",
    },
  },
  afterHours: {},
  crisis: {
    name: "Samaritans",
    contact: "116 123",
    tel: "116123",
    href: "https://www.samaritans.org/how-we-can-help/contact-samaritan/",
    hours: "any time, day or night, free from any phone",
    emergency: "If a life is at risk: call 999",
  },
};

const marketsByLocale: Partial<Readonly<Record<ProgrammeLocale, ProgrammeHelpMarket>>> = {
  "sv-SE": sweden,
  "da-DK": denmark,
  "en-GB": greatBritain,
};

/** The checked list for a Programme language, or null when that language has none. */
export function programmeHelpMarket(locale: ProgrammeLocale): ProgrammeHelpMarket | null {
  return marketsByLocale[locale] ?? null;
}

export function isProgrammeHelpServiceType(value: unknown): value is ProgrammeHelpServiceType {
  return typeof value === "string" && (PROGRAMME_HELP_SERVICE_TYPES as readonly string[]).includes(value);
}

/** "Name · contact · hours", the form a service takes on the card and in the saved picture. */
export function helpContactLine(contact: Pick<ProgrammeHelpContact, "name" | "contact" | "hours">) {
  return [contact.name, contact.contact, contact.hours].filter(Boolean).join(" · ");
}

export function crisisLine(crisis: ProgrammeCrisisLine) {
  return [crisis.name, crisis.contact, crisis.hours].filter(Boolean).join(" · ");
}

/** Every page a line above was copied from on 16 October 2026, for the record and the tests. */
export const HELP_SERVICE_SOURCES = [
  { market: "SE", service: "Stödlinjen (telefon, öppettider)", url: "https://stodlinjen.se/om-oss/ett-samtal-med-oss" },
  { market: "SE", service: "Stödlinjen (chatt)", url: "https://stodlinjen.se/chatt" },
  { market: "SE", service: "Föreningen Spelfriheten", url: "https://foreningenspelfriheten.se/" },
  { market: "SE", service: "Spelberoendes Riksförbund", url: "https://spelberoende.se/online/" },
  { market: "SE", service: "Kommunal budget- och skuldrådgivning", url: "https://www.konsumentverket.se/ekonomi/kommunal-budget-och-skuldradgivning/" },
  { market: "SE", service: "Självmordslinjen (via 1177; mind.se refused the visit)", url: "https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/sjalvmordstankar/till-dig-som-har-sjalvmordstankar/" },
  { market: "DK", service: "StopSpillet", url: "https://www.stopspillet.dk/" },
  { market: "DK", service: "Center for Ludomani", url: "https://ludomani.dk/" },
  { market: "DK", service: "KFUM's Sociale Arbejde, økonomi- og gældsrådgivning", url: "https://www.raad.dk/om-raadgivningen/oekonomisk-raadgivning" },
  { market: "DK", service: "Livslinien", url: "https://www.livslinien.dk/" },
  { market: "GB", service: "National Gambling Helpline (via NHS; gamcare.org.uk refused the visit)", url: "https://www.nhs.uk/live-well/addiction-support/gambling-addiction/" },
  { market: "GB", service: "GambleAware", url: "https://www.begambleaware.org/" },
  { market: "GB", service: "Gamblers Anonymous", url: "https://www.gamblersanonymous.org.uk/" },
  { market: "GB", service: "StepChange", url: "https://www.stepchange.org/contact-us.aspx" },
  { market: "GB", service: "GamFam", url: "https://gamfam.org.uk/" },
  { market: "GB", service: "Samaritans", url: "https://www.samaritans.org/how-we-can-help/contact-samaritan/" },
  { market: "GB", service: "999 (NHS urgent mental health help)", url: "https://www.nhs.uk/nhs-services/mental-health-services/where-to-get-urgent-help-for-mental-health/" },
] as const;
