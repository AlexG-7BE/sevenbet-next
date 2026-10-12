/**
 * Pure date logic for the pause plan page (/pause-plan): when a Spelpaus or ROFUS break ends,
 * which day is "the day after", and the ten plan days. It reads no request, cookie or
 * Programme state, so the page, the menu door and the tests share one calendar.
 *
 * Dates are calendar days in the visitor's own time zone: the registers count a pause from the
 * moment of registration, and a day is the finest unit a person plans with.
 */
export type PauseRegister = "spelpaus" | "rofus";

export type PausePeriod = Readonly<{
  id: string;
  /** Fixed-length breaks. The 24-hour ROFUS pause is one day. */
  days?: number;
  /** Calendar months, clamped to the last day of a shorter month. */
  months?: number;
  /** "Tills vidare" and "endelig udelukkelse" have no end date; the door stays shut for a year. */
  openEnded?: boolean;
}>;

export const PAUSE_PERIODS: Readonly<Record<PauseRegister, readonly PausePeriod[]>> = {
  spelpaus: [
    { id: "10d", days: 10 },
    { id: "1m", months: 1 },
    { id: "3m", months: 3 },
    { id: "6m", months: 6 },
    { id: "open", months: 12, openEnded: true },
  ],
  rofus: [
    { id: "24h", days: 1 },
    { id: "1m", months: 1 },
    { id: "3m", months: 3 },
    { id: "6m", months: 6 },
    { id: "final", months: 12, openEnded: true },
  ],
};

export const PLAN_DAYS = 10;

export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function toIsoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

/** 31 January plus one month is the last day of February, not 3 March. */
export function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}

/** The last day the pause covers: ten days registered on the 12th run from the 12th to the 21st. */
export function pauseEndDate(start: Date, period: PausePeriod): Date {
  if (period.days) return addDays(start, period.days - 1);
  return addDays(addMonths(start, period.months ?? 0), -1);
}

/** The day the accounts work again; the day the plan is for. */
export function dayAfter(end: Date): Date {
  return addDays(end, 1);
}

/** Day 1 is the day the pause was registered. */
export function planDates(start: Date): readonly Date[] {
  return Array.from({ length: PLAN_DAYS }, (_, index) => addDays(start, index));
}

export function pausePeriod(register: PauseRegister, id: string): PausePeriod | null {
  return PAUSE_PERIODS[register].find((period) => period.id === id) ?? null;
}
