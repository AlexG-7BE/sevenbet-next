/**
 * When the pause letters leave, and the one switch that lets them (Founder decisions, 13 October
 * 2026; docs/07_Decisions/PAUSE-LETTERS-2026-10-14.md). Everything here is a plain value, so the
 * hours and the cap change in this file, without a migration.
 *
 * The letters are for people in Sweden and Denmark, which share one clock, so "local" is
 * Europe/Stockholm in summer and in winter time.
 */
export const PAUSE_LETTERS_FLAG = "PAUSE_LETTERS_ENABLED";

/**
 * One switch for everything new that reaches a person: the day letters, the dated pause letters,
 * the email field on /pause-plan and its letters, and the pause date carried into the account.
 * Off unless the variable is exactly "true".
 */
export function pauseLettersEnabled(environment: Readonly<Record<string, string | undefined>> = process.env) {
  return environment[PAUSE_LETTERS_FLAG] === "true";
}

export const PAUSE_LETTER_SCHEDULE = {
  timeZone: "Europe/Stockholm",
  /** Day 3, 7 and 10 letters and "your pause ends tomorrow": from this local hour. */
  eveningHour: 18,
  /** "Your pause is over": from this local hour on the day after the last pause day. */
  morningHour: 7,
  /** Nothing leaves from this local hour until `morningHour`. */
  quietFromHour: 21,
} as const;

/** Days after the Programme start on which a day letter is due, with its template key. */
export const PROGRAMME_DAY_LETTERS = [
  { day: 3, key: "PROGRAMME_DAY_3" },
  { day: 7, key: "PROGRAMME_DAY_7" },
  { day: 10, key: "PROGRAMME_DAY_10" },
] as const;

/**
 * The mail provider's free plan allows 100 letters a day. The pause letters stop at this many per
 * UTC day and leave the rest of the allowance to sign-in, welcome and reminder letters. A letter
 * that does not fit is not sent late: its day passes and it is skipped.
 */
export const PAUSE_LETTERS_DAILY_CAP = 60;

const DAY_MS = 86_400_000;

/** The calendar day and hour in Sweden and Denmark at an instant. */
export function pauseLetterLocalTime(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PAUSE_LETTER_SCHEDULE.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return { day: `${part("year")}-${part("month")}-${part("day")}`, hour: Number(part("hour")) };
}

export function shiftIsoDay(day: string, days: number) {
  return new Date(Date.parse(`${day}T00:00:00.000Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** A stored DATE column read back as a UTC-midnight instant. */
export function isoDayOfDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function dateOfIsoDay(day: string) {
  return new Date(`${day}T00:00:00.000Z`);
}

/** Which kinds of letters may leave at this instant. Outside 07:00–21:00 local, none. */
export function pauseLetterWindow(now: Date) {
  const local = pauseLetterLocalTime(now);
  const awake = local.hour >= PAUSE_LETTER_SCHEDULE.morningHour && local.hour < PAUSE_LETTER_SCHEDULE.quietFromHour;
  return {
    localDay: local.day,
    localHour: local.hour,
    /** "Your pause is over": due when the last pause day was yesterday. */
    morning: awake,
    /** Day letters and "ends tomorrow": due this evening. */
    evening: awake && local.hour >= PAUSE_LETTER_SCHEDULE.eveningHour,
  };
}

/** The local calendar day an instant falls on: the Programme start day of an enrolment. */
export function pauseLetterLocalDay(instant: Date) {
  return pauseLetterLocalTime(instant).day;
}

/** The two-letter language a letter is written in; anything but Swedish and Danish reads English. */
export function pauseLetterLanguage(locale: string | null | undefined): "sv" | "da" | "en" {
  const language = locale?.trim().slice(0, 2).toLowerCase();
  return language === "sv" || language === "da" ? language : "en";
}

/** The pause plan in the letter's language, tagged so the funnel count can see the letter. */
export function pauseLetterPlanUrl(siteUrl: string, locale: string | null | undefined) {
  const language = pauseLetterLanguage(locale);
  return `${siteUrl}/${language}/pause-plan?utm_source=email&utm_medium=email&utm_campaign=pause-${language}`;
}

/** "21 oktober": the day a letter names, in the letter's language. */
export function pauseLetterDateText(day: string, locale: string | null | undefined) {
  const language = pauseLetterLanguage(locale);
  return new Intl.DateTimeFormat(language === "sv" ? "sv-SE" : language === "da" ? "da-DK" : "en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(dateOfIsoDay(day));
}
