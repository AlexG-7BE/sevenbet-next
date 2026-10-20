import "server-only";

import { timingSafeEqual } from "node:crypto";

import { queuePauseDateLetters, queueProgrammeDayLetters, sendAccountPauseLetters } from "@/lib/email/pause-letters/account-letters.server";
import { pauseLettersSentToday, purgePauseReminders, sendDuePauseReminders } from "@/lib/email/pause-letters/reminders.server";
import { PAUSE_LETTERS_DAILY_CAP, pauseLetterWindow, pauseLettersEnabled } from "@/lib/email/pause-letters/schedule";

function exactBearer(request: Request, secret: string) {
  const supplied = Buffer.from(request.headers.get("authorization") ?? "", "utf8");
  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

/**
 * The hourly pause-letter run. The hosting plan runs hourly jobs, so the run is hourly and sends
 * only what is due at that local hour (`PAUSE_LETTER_SCHEDULE`): nothing between 21:00 and 07:00
 * in Sweden and Denmark, "your pause is over" from 07:00, the day letters and "ends tomorrow" from
 * 18:00. A missed hour is caught by the next one the same day; a missed day is skipped.
 *
 * With the switch off it sends and queues nothing; it only deletes the email-field rows whose
 * 30 days have passed, so turning the switch off after use does not keep them longer. The nightly
 * lifecycle run is untouched and never sends these letters.
 */
export function createPauseLettersCronHandler({
  environment = process.env as Readonly<Record<string, string | undefined>>,
  now = () => new Date(),
}: {
  environment?: Readonly<Record<string, string | undefined>>;
  now?: () => Date;
} = {}) {
  return async function pauseLettersCronHandler(request: Request) {
    const noStore = { "Cache-Control": "no-store" };
    const secret = environment.CRON_SECRET?.trim();
    if (!secret) return Response.json({ code: "CRON_UNAVAILABLE" }, { status: 503, headers: noStore });
    if (!exactBearer(request, secret)) return Response.json({ code: "UNAUTHORIZED" }, { status: 401, headers: noStore });
    const at = now();
    if (!pauseLettersEnabled(environment)) {
      try {
        const purgedReminders = await purgePauseReminders(at);
        return Response.json({ ok: true, enabled: false, purgedReminders }, { headers: noStore });
      } catch {
        console.error("[pause-letters] retention run failed", { cron_result: "failed" });
        return Response.json({ code: "PAUSE_LETTERS_CRON_FAILED" }, { status: 500, headers: noStore });
      }
    }
    const window = pauseLetterWindow(at);
    if (!window.morning) return Response.json({ ok: true, enabled: true, quietHours: true }, { headers: noStore });
    try {
      const dayLetters = await queueProgrammeDayLetters(at);
      const datedLetters = await queuePauseDateLetters(at);
      const sentBefore = await pauseLettersSentToday(at);
      const accounts = await sendAccountPauseLetters(Math.min(50, Math.max(0, PAUSE_LETTERS_DAILY_CAP - sentBefore)), { now: at });
      const reminders = await sendDuePauseReminders(Math.min(50, Math.max(0, PAUSE_LETTERS_DAILY_CAP - sentBefore - accounts.sent)), { now: at });
      const purgedReminders = await purgePauseReminders(at);
      const result = {
        localHour: window.localHour,
        dayLetters,
        datedLetters,
        accounts,
        reminders,
        purgedReminders,
        sentToday: sentBefore + accounts.sent + reminders.sent,
        dailyCap: PAUSE_LETTERS_DAILY_CAP,
      };
      console.info("[pause-letters] hourly run completed", { cron_result: "success", ...result });
      return Response.json({ ok: true, enabled: true, ...result }, { headers: noStore });
    } catch {
      console.error("[pause-letters] hourly run failed", { cron_result: "failed" });
      return Response.json({ code: "PAUSE_LETTERS_CRON_FAILED" }, { status: 500, headers: noStore });
    }
  };
}
