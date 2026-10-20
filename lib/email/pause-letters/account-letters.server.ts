import "server-only";

import type { EmailTemplateKey, Prisma } from "@prisma/client";

import { analyticsEnvironment } from "@/lib/analytics/identity.server";
import prisma from "@/lib/db/prisma";
import {
  PROGRAMME_DAY_LETTERS,
  dateOfIsoDay,
  isoDayOfDate,
  pauseLetterLocalDay,
  pauseLetterLocalDayStart,
  pauseLetterWindow,
  pauseLettersEnabled,
  shiftIsoDay,
} from "@/lib/email/pause-letters/schedule";
import type { LifecycleEmailProvider } from "@/lib/email/provider.server";
import {
  PAUSE_LETTER_PURPOSES,
  emailTemplateForLocale,
  pauseLetterIdempotencyKey,
  processQueuedEmailBatch,
  queueEmailMessage,
} from "@/lib/email/service.server";

/**
 * Letters to people with an account, at the moment they are for (Founder decisions, 13 October
 * 2026; docs/07_Decisions/PAUSE-LETTERS-2026-10-14.md):
 *
 * - day 3, 7 and 10 after the Programme start, in the evening, while the Programme is unfinished;
 * - the evening before the pause ends and the morning it is over, for an account that carries a
 *   pause date from the tool on /pause-plan.
 *
 * Each is queued once, to an account that may receive Programme letters (active, a verified
 * address, the opt-in, no unsubscribe), in the account's language. On a day with a dated letter
 * the day letter is not sent. The pause date is read here to choose the day and for nothing else.
 */

const DAY_MS = 86_400_000;
const CANDIDATE_LIMIT = 500;
/** The one pause letter that leaves in the morning; every other one is an evening letter. */
const MORNING_PAUSE_LETTER_PURPOSES = ["PAUSE_OVER"] as const satisfies readonly (typeof PAUSE_LETTER_PURPOSES)[number][];

const mayReceiveProgrammeLetters = {
  accountState: "ACTIVE",
  emailVerified: true,
  emailPreference: { is: { marketingAllowed: true, unsubscribedAt: null, suppressionScope: "NONE" } },
} as const satisfies Prisma.UserWhereInput;

async function queueOnce(userId: string, key: EmailTemplateKey, subjectId: string, preferredLocale: string | null) {
  // The run repeats through the evening: a letter that is already there is the common case.
  const idempotencyKey = pauseLetterIdempotencyKey(key, subjectId);
  const existing = await prisma.emailMessage.count({ where: { environment: analyticsEnvironment(), idempotencyKey } });
  if (existing > 0) return false;
  const template = await emailTemplateForLocale(key, preferredLocale);
  if (!template) return false;
  const message = await queueEmailMessage({
    userId,
    templateKey: key,
    templateId: template.id,
    idempotencyKey,
  }).catch(() => {
    console.warn("[email] pause letter queue candidate failed", { email_failure_category: "queue_candidate" });
    return null;
  });
  return Boolean(message?.status === "QUEUED" && message.createdNow);
}

/** A dated pause letter is due on the last pause day (evening) and on the day after (morning). */
function datedLetterDueOn(pauseEndsOn: Date | null, localDay: string) {
  if (!pauseEndsOn) return false;
  const lastDay = isoDayOfDate(pauseEndsOn);
  return lastDay === localDay || shiftIsoDay(lastDay, 1) === localDay;
}

export async function queueProgrammeDayLetters(now = new Date()) {
  const window = pauseLetterWindow(now);
  if (!pauseLettersEnabled() || !window.evening) return { eligible: 0, queued: 0 };
  let eligible = 0;
  let queued = 0;
  for (const { day, key } of PROGRAMME_DAY_LETTERS) {
    const startDay = shiftIsoDay(window.localDay, -day);
    const dayStart = dateOfIsoDay(startDay).getTime();
    // A local day is within a day of the same UTC day; the exact local day is checked below.
    const enrollments = await prisma.programEnrollment.findMany({
      where: {
        completedAt: null,
        startedAt: { gte: new Date(dayStart - DAY_MS), lt: new Date(dayStart + 2 * DAY_MS) },
        user: mayReceiveProgrammeLetters,
      },
      select: { id: true, userId: true, startedAt: true, user: { select: { preferredLocale: true, pauseEndsOn: true } } },
      orderBy: { startedAt: "asc" },
      take: CANDIDATE_LIMIT,
    });
    for (const enrollment of enrollments) {
      if (pauseLetterLocalDay(enrollment.startedAt) !== startDay) continue;
      if (datedLetterDueOn(enrollment.user.pauseEndsOn, window.localDay)) continue;
      eligible += 1;
      if (await queueOnce(enrollment.userId, key, enrollment.id, enrollment.user.preferredLocale)) queued += 1;
    }
  }
  return { eligible, queued };
}

export async function queuePauseDateLetters(now = new Date()) {
  const window = pauseLetterWindow(now);
  if (!pauseLettersEnabled() || !window.morning) return { eligible: 0, queued: 0 };
  const due: { key: EmailTemplateKey; lastPauseDay: string }[] = [
    // Yesterday was the last pause day: the pause is over this morning.
    { key: "PAUSE_OVER", lastPauseDay: shiftIsoDay(window.localDay, -1) },
    // Today is the last pause day: it ends tomorrow, and the letter leaves this evening.
    ...(window.evening ? [{ key: "PAUSE_ENDS_TOMORROW" as const, lastPauseDay: window.localDay }] : []),
  ];
  let eligible = 0;
  let queued = 0;
  for (const { key, lastPauseDay } of due) {
    const accounts = await prisma.user.findMany({
      where: { ...mayReceiveProgrammeLetters, pauseEndsOn: dateOfIsoDay(lastPauseDay) },
      select: { id: true, preferredLocale: true },
      orderBy: { id: "asc" },
      take: CANDIDATE_LIMIT,
    });
    for (const account of accounts) {
      eligible += 1;
      if (await queueOnce(account.id, key, `${account.id}\n${lastPauseDay}`, account.preferredLocale)) queued += 1;
    }
  }
  return { eligible, queued };
}

/**
 * Sends what is queued, inside the local hours and up to `limit`. The evening letters (day 3, 7,
 * 10 and "ends tomorrow") leave only in the evening window. A letter queued before today's local
 * midnight (the cap was reached, or the provider was down all evening) is cancelled, never sent
 * the next morning beside "your pause is over".
 */
export async function sendAccountPauseLetters(
  limit: number,
  overrides: { provider?: LifecycleEmailProvider; siteUrl?: string; now?: Date } = {},
) {
  const now = overrides.now ?? new Date();
  const none = { selected: 0, sent: 0, suppressed: 0, failed: 0, cancelledStale: 0 };
  const window = pauseLetterWindow(now);
  if (!pauseLettersEnabled() || !window.morning) return none;
  const stale = await prisma.emailMessage.updateMany({
    where: {
      environment: analyticsEnvironment(),
      purpose: { in: [...PAUSE_LETTER_PURPOSES] },
      status: { in: ["QUEUED", "FAILED"] },
      queuedAt: { lt: pauseLetterLocalDayStart(now) },
    },
    data: { status: "CANCELLED", nextAttemptAt: null, deliveryErrorCode: "PAUSE_LETTER_STALE" },
  });
  if (limit < 1) return { ...none, cancelledStale: stale.count };
  const purposes = window.evening ? PAUSE_LETTER_PURPOSES : MORNING_PAUSE_LETTER_PURPOSES;
  const delivery = await processQueuedEmailBatch(limit, { ...overrides, purposes });
  return { selected: delivery.selected, sent: delivery.sent, suppressed: delivery.suppressed, failed: delivery.failed, cancelledStale: stale.count };
}
