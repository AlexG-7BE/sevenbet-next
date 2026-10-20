import "server-only";

import { createHmac, randomUUID } from "node:crypto";
import type { EmailTemplateKey, PauseRegister } from "@prisma/client";
import { after } from "next/server";

import { analyticsEnvironment, analyticsSigningSecret } from "@/lib/analytics/identity.server";
import prisma from "@/lib/db/prisma";
import {
  PAUSE_LETTERS_DAILY_CAP,
  dateOfIsoDay,
  isoDayOfDate,
  pauseLetterDateText,
  pauseLetterLanguage,
  pauseLetterPlanUrl,
  pauseLetterWindow,
  pauseLettersEnabled,
  shiftIsoDay,
} from "@/lib/email/pause-letters/schedule";
import type { LifecycleEmailProvider } from "@/lib/email/provider.server";
import { PAUSE_LETTER_PURPOSES, hashUnsubscribeToken, providerForRuntime } from "@/lib/email/service.server";
import { activeEmailTemplate, renderEmailTemplate } from "@/lib/email/templates.server";
import { parseCarriedPauseDate, type CarriedPauseRegister } from "@/lib/tools/pause-date-carry";

/**
 * The email field in the tool on /pause-plan, for a person without an account (Founder decision,
 * 13 October 2026; docs/07_Decisions/PAUSE-LETTERS-2026-10-14.md). The person reads one line that
 * says what will be sent and when, and leaves an address. Three letters follow: one at once, one
 * the evening before the pause ends, one the morning it is over. Each carries a one-click
 * unsubscribe link. The address, the register and the date are kept for those letters only; no
 * offer, ranking, route or advertisement reads them, and the row is deleted 30 days after the
 * pause ended or the take-over. An unsubscribe wipes the address at once and keeps only its keyed
 * hash, so the open form can refuse that address later.
 */

const TOKEN_DOMAIN = "b4gamble:pause-reminder-unsubscribe:v1";
const RATE_LIMIT_DOMAIN = "b4gamble:pause-reminder-rate-limit:v1";
const SENT_COUNTER_DOMAIN = "b4gamble:pause-reminder-sent:v1";
const UNSUBSCRIBED_DOMAIN = "b4gamble:pause-reminder-unsubscribed:v1";
/** An unsubscribed row keeps no address: only this keyed hash, at a domain that never receives mail. */
const UNSUBSCRIBED_ADDRESS_SUFFIX = "@unsubscribed.invalid";
/** The register and date an unsubscribed row is left with: fixed values, no longer the person's. */
const UNSUBSCRIBED_PAUSE_ENDS_ON = new Date("1970-01-01T00:00:00.000Z");
const HOUR_MS = 60 * 60_000;
const DAY_MS = 24 * HOUR_MS;
export const PAUSE_REMINDER_REQUESTS_PER_SOURCE_PER_HOUR = 5;
export const PAUSE_REMINDER_REQUESTS_PER_ADDRESS_PER_DAY = 3;
export const PAUSE_REMINDER_RETENTION_DAYS = 30;

type ReminderKind = "confirmation" | "dayBefore" | "over";
const KIND = {
  confirmation: { key: "PAUSE_TOOL_CONFIRMATION", column: "confirmationSentAt" },
  dayBefore: { key: "PAUSE_ENDS_TOMORROW", column: "dayBeforeSentAt" },
  over: { key: "PAUSE_OVER", column: "overSentAt" },
} as const satisfies Record<ReminderKind, { key: EmailTemplateKey; column: "confirmationSentAt" | "dayBeforeSentAt" | "overSentAt" }>;

type Overrides = {
  provider?: LifecycleEmailProvider;
  siteUrl?: string;
  now?: Date;
  /** Runs the work that follows the answer. Defaults to `after()`, once the response has left. */
  defer?: (task: () => Promise<void>) => void;
};

export function pauseReminderToken(reminderId: string, secret = analyticsSigningSecret()) {
  if (!reminderId) throw new Error("Pause reminder identifier is required");
  return createHmac("sha256", secret).update(`${TOKEN_DOMAIN}\n${reminderId}`).digest("base64url");
}

function registerValue(register: CarriedPauseRegister): PauseRegister {
  return register === "rofus" ? "ROFUS" : "SPELPAUS";
}

function normalizedAddress(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

/**
 * The keyed hash an unsubscribed address is kept as. It cannot be turned back into the address
 * without the signing secret, and it lets the open form refuse that address.
 */
export function unsubscribedPauseReminderAddress(email: string, secret = analyticsSigningSecret()) {
  const digest = createHmac("sha256", secret).update(`${UNSUBSCRIBED_DOMAIN}\n${email}`).digest("hex");
  return `${digest}${UNSUBSCRIBED_ADDRESS_SUFFIX}`;
}

function bucketKeyOf(domain: string, subject: string, windowMs: number, windowNumber: number) {
  const purposeKey = createHmac("sha256", analyticsSigningSecret()).update(domain).digest();
  return createHmac("sha256", purposeKey).update(`${subject}\n${windowMs}\n${windowNumber}`).digest("hex");
}

/** One-way counter in the shared bucket table: the key cannot be turned back into an IP or address. */
async function incrementBucket(domain: string, subject: string, windowMs: number, now: Date, keepMs = windowMs) {
  const windowNumber = Math.floor(now.getTime() / windowMs);
  const windowStartedAt = new Date(windowNumber * windowMs);
  const expiresAt = new Date(windowStartedAt.getTime() + keepMs);
  const bucketKey = bucketKeyOf(domain, subject, windowMs, windowNumber);
  const bucket = await prisma.analyticsRateLimitBucket.upsert({
    where: { bucketKey },
    create: { bucketKey, count: 1, windowStartedAt, expiresAt },
    update: { count: { increment: 1 }, expiresAt },
    select: { count: true },
  });
  return bucket.count;
}

async function withinLimit(subject: string, windowMs: number, maximum: number, now: Date) {
  return await incrementBucket(RATE_LIMIT_DOMAIN, subject, windowMs, now) <= maximum;
}

/**
 * Letters from the email field handed to the provider in this UTC day. The counter only goes up:
 * a new date, an unsubscribe or a purge cannot lower it, so the daily cap counts every one.
 */
function sentCounterSubject() {
  return `sent\n${analyticsEnvironment()}`;
}

async function countReminderLetterSent(now: Date) {
  // Kept a day past its window, so the count of the day is still there at its last hour.
  await incrementBucket(SENT_COUNTER_DOMAIN, sentCounterSubject(), DAY_MS, now, 2 * DAY_MS);
}

async function reminderLettersSentToday(now: Date) {
  const bucketKey = bucketKeyOf(SENT_COUNTER_DOMAIN, sentCounterSubject(), DAY_MS, Math.floor(now.getTime() / DAY_MS));
  const bucket = await prisma.analyticsRateLimitBucket.findUnique({ where: { bucketKey }, select: { count: true } });
  return bucket?.count ?? 0;
}

/**
 * Claims one letter of a reminder, sends it, and gives the claim back when the provider did not
 * take it, so the next run inside the same day tries again. A reminder that was unsubscribed or
 * taken over by an account is never claimed.
 */
async function sendReminderLetter(reminderId: string, kind: ReminderKind, overrides: Overrides = {}) {
  const now = overrides.now ?? new Date();
  const { key, column } = KIND[kind];
  const claimed = await prisma.pauseReminder.updateMany({
    where: { id: reminderId, [column]: null, unsubscribedAt: null, takenOverAt: null },
    data: { [column]: now },
  });
  if (claimed.count !== 1) return "not-claimed" as const;
  const release = () => prisma.pauseReminder.updateMany({ where: { id: reminderId, [column]: now }, data: { [column]: null } });
  try {
    const reminder = await prisma.pauseReminder.findUnique({ where: { id: reminderId } });
    const runtime = providerForRuntime();
    const provider = overrides.provider ?? runtime.provider;
    const siteUrl = overrides.siteUrl ?? runtime.siteUrl;
    const template = reminder ? await activeEmailTemplate(key, pauseLetterLanguage(reminder.locale)) : null;
    if (!reminder || !siteUrl || !template) {
      await release();
      return "unavailable" as const;
    }
    const lastPauseDay = isoDayOfDate(reminder.pauseEndsOn);
    const rendered = renderEmailTemplate(template, {
      name: "",
      action_url: "",
      programme_url: `${siteUrl}/program`,
      plan_url: pauseLetterPlanUrl(siteUrl, template.locale),
      unsubscribe_url: `${siteUrl}/unsubscribe?token=${encodeURIComponent(pauseReminderToken(reminder.id))}`,
      pause_date: pauseLetterDateText(lastPauseDay, template.locale),
    });
    const result = await provider.send({
      to: reminder.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      idempotencyKey: `pause-reminder:${reminder.id}:${kind}:${lastPauseDay}`,
    }).catch(() => ({ status: "unavailable" as const, code: "NETWORK" as const }));
    if (result.status !== "accepted") {
      await release();
      console.error("[email] pause reminder send failed", { email_failure_category: result.code, email_purpose: key });
      return "failed" as const;
    }
    await countReminderLetterSent(now).catch(() => {
      console.warn("[email] pause reminder send count failed", { email_failure_category: "sent_counter", email_purpose: key });
    });
    return "sent" as const;
  } catch {
    await release();
    return "failed" as const;
  }
}

export type PauseReminderRequest = { email?: unknown; register?: unknown; endsOn?: unknown; locale?: unknown };

/**
 * Takes the address from the tool. The answer never says whether the address was new, known,
 * unsubscribed or belongs to an account, and it does not take longer for one than another: after
 * the input check and the rate limits, everything (the account check, the row, the first letter)
 * runs once the response has left.
 */
export async function subscribePauseReminder(request: PauseReminderRequest, source: string, overrides: Overrides = {}) {
  if (!pauseLettersEnabled()) return { status: "disabled" } as const;
  const now = overrides.now ?? new Date();
  const email = normalizedAddress(request.email);
  const carried = parseCarriedPauseDate(`${String(request.register)}.${String(request.endsOn)}`, now);
  const locale = typeof request.locale === "string" && /^[a-z]{2}(?:-[A-Z]{2})?$/.test(request.locale) ? request.locale : "en";
  // A date in the past has no letter left to send.
  if (!email || !carried || carried.endsOn < now.toISOString().slice(0, 10)) return { status: "invalid" } as const;
  if (!await withinLimit(`source\n${source || "unknown"}`, HOUR_MS, PAUSE_REMINDER_REQUESTS_PER_SOURCE_PER_HOUR, now)
    || !await withinLimit(`address\n${email}`, DAY_MS, PAUSE_REMINDER_REQUESTS_PER_ADDRESS_PER_DAY, now)) {
    return { status: "rate-limited" } as const;
  }
  const defer = overrides.defer ?? after;
  defer(async () => {
    await storePauseReminder(email, carried, locale, overrides).catch(() => {
      console.error("[email] pause reminder store failed", { email_failure_category: "store", email_purpose: "PAUSE_TOOL_CONFIRMATION" });
    });
  });
  return { status: "accepted" } as const;
}

async function storePauseReminder(email: string, carried: { register: CarriedPauseRegister; endsOn: string }, locale: string, overrides: Overrides) {
  const now = overrides.now ?? new Date();
  // An address that already has an account is not stored: the account's own letters are its letters.
  const account = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (account) return;

  const environment = analyticsEnvironment();
  // An unsubscribed address stays unsubscribed: this form is open to anyone, so it cannot be the
  // way to write to a person who asked us to stop.
  const unsubscribed = await prisma.pauseReminder.findUnique({
    where: { environment_email: { environment, email: unsubscribedPauseReminderAddress(email) } },
    select: { id: true },
  });
  if (unsubscribed) return;

  const pauseEndsOn = dateOfIsoDay(carried.endsOn);
  const register = registerValue(carried.register);
  const existing = await prisma.pauseReminder.findUnique({ where: { environment_email: { environment, email } } });
  let reminderId: string;
  if (existing) {
    if (existing.unsubscribedAt) return;
    const sameDate = isoDayOfDate(existing.pauseEndsOn) === carried.endsOn && existing.register === register;
    // A new date starts the two dated letters over; the first letter is sent once per address and
    // never again, so changing the date cannot be used to send it repeatedly.
    await prisma.pauseReminder.update({
      where: { id: existing.id },
      data: {
        locale,
        register,
        pauseEndsOn,
        takenOverAt: null,
        ...(sameDate ? {} : { dayBeforeSentAt: null, overSentAt: null }),
      },
    });
    reminderId = existing.id;
  } else {
    reminderId = randomUUID();
    await prisma.pauseReminder.create({
      data: { id: reminderId, environment, email, locale, register, pauseEndsOn, tokenHash: hashUnsubscribeToken(pauseReminderToken(reminderId)) },
    });
  }
  // Above the day's cap the address is kept and the first letter is skipped; the two dated ones follow.
  if (await pauseLettersSentToday(now) < PAUSE_LETTERS_DAILY_CAP) {
    await sendReminderLetter(reminderId, "confirmation", overrides);
  }
}

/**
 * Every pause letter handed to the provider since the UTC day began: the day letters and dated
 * letters to accounts (their EmailMessage rows) and the letters from the email field (a counter
 * that only goes up). The daily cap is counted against this.
 */
export async function pauseLettersSentToday(now = new Date()) {
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const environment = analyticsEnvironment();
  const [accountLetters, reminderLetters] = await Promise.all([
    prisma.emailMessage.count({ where: { environment, purpose: { in: [...PAUSE_LETTER_PURPOSES] }, sentAt: { gte: dayStart } } }),
    reminderLettersSentToday(now),
  ]);
  return accountLetters + reminderLetters;
}

/** The evening-before and the morning-after letters that are due now, up to `limit`. */
export async function sendDuePauseReminders(limit: number, overrides: Overrides = {}) {
  const now = overrides.now ?? new Date();
  const window = pauseLetterWindow(now);
  if (!pauseLettersEnabled() || !window.morning || limit < 1) return { due: 0, sent: 0 };
  const environment = analyticsEnvironment();
  const active = { environment, unsubscribedAt: null, takenOverAt: null } as const;
  const [over, dayBefore] = await Promise.all([
    prisma.pauseReminder.findMany({
      where: { ...active, overSentAt: null, pauseEndsOn: dateOfIsoDay(shiftIsoDay(window.localDay, -1)) },
      select: { id: true },
      orderBy: { createdAt: "asc" },
      take: limit,
    }),
    window.evening
      ? prisma.pauseReminder.findMany({
          where: { ...active, dayBeforeSentAt: null, pauseEndsOn: dateOfIsoDay(window.localDay) },
          select: { id: true },
          orderBy: { createdAt: "asc" },
          take: limit,
        })
      : [],
  ]);
  const due = [
    ...over.map((reminder) => ({ id: reminder.id, kind: "over" as const })),
    ...dayBefore.map((reminder) => ({ id: reminder.id, kind: "dayBefore" as const })),
  ];
  let sent = 0;
  for (const letter of due.slice(0, limit)) {
    if (await sendReminderLetter(letter.id, letter.kind, overrides) === "sent") sent += 1;
  }
  return { due: due.length, sent };
}

/**
 * Leaves an unsubscribed row with nothing of the person: the address becomes its keyed hash and
 * the register, date and language fixed values. The row and its token hash stay, so the form
 * refuses the address and an old unsubscribe link still answers.
 */
function unsubscribedRowData(email: string, now: Date) {
  return {
    email: email.endsWith(UNSUBSCRIBED_ADDRESS_SUFFIX) ? email : unsubscribedPauseReminderAddress(email),
    locale: "",
    register: "SPELPAUS" as const,
    pauseEndsOn: UNSUBSCRIBED_PAUSE_ENDS_ON,
    unsubscribedAt: now,
  };
}

/** The one-click unsubscribe of a letter from the email field. */
export async function unsubscribePauseReminder(token: string, now = new Date()) {
  const reminder = await prisma.pauseReminder.findUnique({ where: { tokenHash: hashUnsubscribeToken(token) }, select: { id: true, email: true, unsubscribedAt: true } });
  if (!reminder) return { status: "invalid" } as const;
  if (reminder.unsubscribedAt) return { status: "already-unsubscribed" } as const;
  await prisma.pauseReminder.update({ where: { id: reminder.id }, data: unsubscribedRowData(reminder.email, now) });
  return { status: "unsubscribed" } as const;
}

/**
 * The address signed up: the stand-alone letters stop and the account carries the date instead,
 * unless it already has one (the cookie from the same visit wins).
 */
export async function takeOverPauseReminder(account: { id: string; email: string }, now = new Date()) {
  if (!pauseLettersEnabled()) return false;
  const email = normalizedAddress(account.email);
  if (!email) return false;
  const reminder = await prisma.pauseReminder.findUnique({ where: { environment_email: { environment: analyticsEnvironment(), email } } });
  if (!reminder || reminder.takenOverAt) return false;
  await prisma.pauseReminder.update({ where: { id: reminder.id }, data: { takenOverAt: now } });
  if (!reminder.unsubscribedAt && isoDayOfDate(reminder.pauseEndsOn) >= now.toISOString().slice(0, 10)) {
    await prisma.user.updateMany({
      where: { id: account.id, pauseEndsOn: null },
      data: { pauseEndsOn: reminder.pauseEndsOn, pauseRegister: reminder.register },
    });
  }
  return true;
}

/**
 * Rows whose letters are done: 30 days after the pause ended or a take-over. An unsubscribed row
 * is not deleted (its keyed hash is what refuses the address); one that still holds an address
 * is reduced to the hash. Runs whether or not the switch is on, so the promise holds after the
 * switch is turned off.
 */
export async function purgePauseReminders(now = new Date()) {
  const environment = analyticsEnvironment();
  const cutoff = new Date(now.getTime() - PAUSE_REMINDER_RETENTION_DAYS * DAY_MS);
  const purged = await prisma.pauseReminder.deleteMany({
    where: {
      environment,
      unsubscribedAt: null,
      OR: [{ pauseEndsOn: { lt: cutoff } }, { takenOverAt: { lt: cutoff } }],
    },
  });
  const unreduced = await prisma.pauseReminder.findMany({
    where: { environment, unsubscribedAt: { not: null }, NOT: { email: { endsWith: UNSUBSCRIBED_ADDRESS_SUFFIX } } },
    select: { id: true, email: true, unsubscribedAt: true },
    take: 500,
  });
  for (const row of unreduced) {
    await prisma.pauseReminder.update({ where: { id: row.id }, data: unsubscribedRowData(row.email, row.unsubscribedAt ?? now) });
  }
  return purged.count;
}
