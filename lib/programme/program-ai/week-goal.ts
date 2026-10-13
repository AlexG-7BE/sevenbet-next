import { dateOnlyUtc, localDateAt } from "@/lib/programme/security";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The length of the "Set a 7-day goal" Mission's experiment, in days. */
export const WEEK_GOAL_DAYS = 7;

/**
 * The weekly goal on the Programme home (Founder, 13 October 2026). The server works out the day
 * and the check-in date; the home shows them as they come.
 *
 * The goal itself is the Mission's saved approach, a fixed value. A person's own wording of the
 * goal stays in their tab and is never stored, so it cannot be sent from here.
 */
export type ProgrammeWeekGoal = {
  goalStyle: string;
  totalDays: typeof WEEK_GOAL_DAYS;
  /** 1 to 7 on the person's own calendar while the seven days run; null from the check-in date on. */
  day: number | null;
  /** The check-in date on the person's calendar, as YYYY-MM-DD: seven days after the goal was set. */
  checkInDate: string;
};

/**
 * Day 1 is the calendar day the Mission was completed, in the enrolment's time zone. The check-in
 * falls seven days later. From that date on no day is running: the home shows the date alone.
 */
export function programmeWeekGoal(input: {
  goalStyle: unknown;
  completedAt: Date | null | undefined;
  timezone: string;
  now: Date;
}): ProgrammeWeekGoal | null {
  if (typeof input.goalStyle !== "string" || !input.goalStyle || !input.completedAt) return null;
  const startedOn = dateOnlyUtc(localDateAt(input.completedAt, input.timezone)).getTime();
  const today = dateOnlyUtc(localDateAt(input.now, input.timezone)).getTime();
  const day = Math.round((today - startedOn) / DAY_MS) + 1;
  return {
    goalStyle: input.goalStyle,
    totalDays: WEEK_GOAL_DAYS,
    day: day >= 1 && day <= WEEK_GOAL_DAYS ? day : null,
    checkInDate: new Date(startedOn + WEEK_GOAL_DAYS * DAY_MS).toISOString().slice(0, 10),
  };
}
