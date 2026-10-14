import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { PrismaClient } from "@prisma/client";

import { observeSuccessfulAuthentication } from "../lib/customers/auth-observer.server";
import { updateCustomerEmailPreference } from "../lib/customers/email-preference.server";
import { queuePauseDateLetters, queueProgrammeDayLetters, sendAccountPauseLetters } from "../lib/email/pause-letters/account-letters.server";
import { createPauseLettersCronHandler } from "../lib/email/pause-letters/cron.server";
import {
  PAUSE_REMINDER_REQUESTS_PER_ADDRESS_PER_DAY,
  pauseReminderToken,
  sendDuePauseReminders,
  subscribePauseReminder,
  takeOverPauseReminder,
} from "../lib/email/pause-letters/reminders.server";
import { dateOfIsoDay, pauseLetterLocalTime, shiftIsoDay } from "../lib/email/pause-letters/schedule";
import type { EmailProviderEnvelope, EmailProviderResult, LifecycleEmailProvider } from "../lib/email/provider.server";
import { processQueuedEmailBatch, queueProgrammeReminders, queueWelcomeEmail } from "../lib/email/service.server";
import { unsubscribeWithToken } from "../lib/email/unsubscribe.server";
import { PAUSE_DATE_COOKIE } from "../lib/tools/pause-date-carry";

/**
 * The pause letters against PostgreSQL, with test accounts and test addresses only. Nothing
 * leaves the process: every letter goes to a recording provider.
 */

const prisma = new PrismaClient();
const SITE_URL = "https://b4gamble.com";
const environmentNames = ["NODE_ENV", "VERCEL_ENV", "ANALYTICS_SIGNING_SECRET", "BETTER_AUTH_SECRET", "LIFECYCLE_EMAIL_DELIVERY_ENABLED", "PAUSE_LETTERS_ENABLED", "CRON_SECRET"] as const;
const previousEnvironment = Object.fromEntries(environmentNames.map((name) => [name, process.env[name]]));
const createdUserIds: string[] = [];
const createdAddresses: string[] = [];
let programId = "";
let programVersionId = "";

class RecordingProvider implements LifecycleEmailProvider {
  readonly envelopes: EmailProviderEnvelope[] = [];
  constructor(private readonly result?: EmailProviderResult) {}
  async send(envelope: EmailProviderEnvelope): Promise<EmailProviderResult> {
    this.envelopes.push(envelope);
    return this.result ?? { status: "accepted", provider: "memory", messageId: `memory-${randomUUID()}` };
  }
}

function assertDisposableDatabase(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  if (!["127.0.0.1", "localhost", "postgres"].includes(url.hostname) || !/(?:test|ci|disposable)/i.test(url.pathname)) {
    throw new Error("Pause letter tests require disposable local/CI PostgreSQL");
  }
}

/** The most recent instant, at half past, when the clock in Sweden and Denmark showed `hour`. */
function lastLocalHour(hour: number) {
  const instant = new Date();
  instant.setUTCMinutes(30, 0, 0);
  for (let step = 0; step < 30; step += 1) {
    if (instant.getTime() <= Date.now() && pauseLetterLocalTime(instant).hour === hour) return instant;
    instant.setTime(instant.getTime() - 3_600_000);
  }
  throw new Error("No such local hour in the last day");
}

/** Half past `hour` on a local calendar day near today, whatever the summer or winter offset. */
function localInstant(day: string, hour: number) {
  const anchor = lastLocalHour(18).getTime();
  for (let step = -60; step <= 60; step += 1) {
    const instant = new Date(anchor + step * 3_600_000);
    const local = pauseLetterLocalTime(instant);
    if (local.day === day && local.hour === hour) return instant;
  }
  throw new Error(`No ${hour}:30 on ${day} near today`);
}

async function createAccount({ locale = "sv", marketing = true, pauseEndsOn = null as string | null } = {}) {
  const suffix = randomUUID();
  const user = await prisma.user.create({
    data: {
      id: `pause-letters-${suffix}`,
      name: "Pause Letter Fixture",
      email: `pause-letters-${suffix}@example.invalid`,
      emailVerified: true,
      preferredLocale: locale,
      ...(pauseEndsOn ? { pauseEndsOn: dateOfIsoDay(pauseEndsOn), pauseRegister: "SPELPAUS" as const } : {}),
    },
  });
  createdUserIds.push(user.id);
  if (marketing) {
    await updateCustomerEmailPreference(user.id, { marketingAllowed: true, source: "ACCOUNT_PREFERENCES", policyVersion: "email-marketing-v1", locale });
  }
  return user;
}

async function enrol(userId: string, startedAt: Date, completedAt: Date | null = null) {
  return prisma.programEnrollment.create({ data: { userId, programId, programVersionId, startedAt, completedAt } });
}

function address() {
  const email = `pause-reminder-${randomUUID()}@example.invalid`;
  createdAddresses.push(email);
  return email;
}

const messagesOf = (userId: string) => prisma.emailMessage.findMany({ where: { userId }, include: { template: { select: { key: true, locale: true } } }, orderBy: { createdAt: "asc" } });

test.before(async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  Object.assign(process.env, {
    NODE_ENV: "production",
    VERCEL_ENV: "production",
    ANALYTICS_SIGNING_SECRET: "pause-letters-postgres-secret-32-bytes",
    BETTER_AUTH_SECRET: "pause-letters-better-auth-secret-32-bytes",
    LIFECYCLE_EMAIL_DELIVERY_ENABLED: "false",
    PAUSE_LETTERS_ENABLED: "true",
  });
  const suffix = randomUUID();
  const program = await prisma.program.create({
    data: {
      slug: `pause-letters-${suffix}`,
      internalName: "Pause Letters Fixture",
      title: "Pause Letters Fixture",
      summary: "Disposable integration fixture",
      introduction: "Disposable integration fixture",
      estimatedTotalMinutes: 10,
      completionRules: [],
      createdBy: "pause-letters-test",
      updatedBy: "pause-letters-test",
    },
  });
  programId = program.id;
  programVersionId = (await prisma.programVersion.create({ data: { programId, version: 1, status: "PUBLISHED", snapshot: {}, createdBy: "pause-letters-test" } })).id;
});

test.after(async () => {
  await prisma.analyticsEvent.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.consentEvent.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.programEnrollment.deleteMany({ where: { programId } });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  await prisma.pauseReminder.deleteMany({ where: { email: { in: createdAddresses } } });
  if (programVersionId) await prisma.programVersion.deleteMany({ where: { id: programVersionId } });
  if (programId) await prisma.program.deleteMany({ where: { id: programId } });
  for (const name of environmentNames) {
    const value = previousEnvironment[name];
    if (value === undefined) delete process.env[name];
    else (process.env as Record<string, string | undefined>)[name] = value;
  }
  await prisma.$disconnect();
});

test("with the switch off nothing new is queued, sent or stored, and the existing letters stay English", async () => {
  process.env.PAUSE_LETTERS_ENABLED = "false";
  try {
    const evening = lastLocalHour(18);
    const today = pauseLetterLocalTime(evening).day;
    const swede = await createAccount({ locale: "sv", pauseEndsOn: today });
    await enrol(swede.id, new Date(evening.getTime() - 3 * 86_400_000));
    const provider = new RecordingProvider();

    assert.deepEqual(await queueProgrammeDayLetters(evening), { eligible: 0, queued: 0 });
    assert.deepEqual(await queuePauseDateLetters(evening), { eligible: 0, queued: 0 });
    assert.deepEqual(await sendAccountPauseLetters(50, { provider, siteUrl: SITE_URL, now: evening }), { selected: 0, sent: 0, suppressed: 0, failed: 0, cancelledStale: 0 });
    assert.deepEqual(await sendDuePauseReminders(50, { provider, siteUrl: SITE_URL, now: evening }), { due: 0, sent: 0 });
    const email = address();
    assert.deepEqual(await subscribePauseReminder({ email, register: "spelpaus", endsOn: today, locale: "sv" }, "203.0.113.10", { provider, siteUrl: SITE_URL, now: evening }), { status: "disabled" });
    assert.equal(await prisma.pauseReminder.count({ where: { email } }), 0);
    assert.equal(await takeOverPauseReminder(swede, evening), false);
    assert.equal(provider.envelopes.length, 0);
    assert.equal((await messagesOf(swede.id)).length, 0);

    // The welcome letter of a Swedish account is the English one, as before.
    const welcome = await queueWelcomeEmail(swede.id);
    assert.equal(welcome?.locale, "en");
    assert.equal(welcome?.subject, "Welcome to B4GAMBLE");

    // So is the inactivity reminder.
    const quiet = await createAccount({ locale: "da" });
    await enrol(quiet.id, new Date(Date.now() - 31 * 86_400_000));
    await prisma.user.update({ where: { id: quiet.id }, data: { lastSeenAt: new Date(Date.now() - 30 * 86_400_000) } });
    await queueProgrammeReminders();
    const reminders = (await messagesOf(quiet.id)).filter((message) => message.purpose === "PROGRAMME_REMINDER");
    assert.deepEqual(reminders.map((message) => message.template.locale), ["en"]);

    // The sign-up observer ignores the carried pause date.
    const fresh = await createAccount({ locale: "sv", marketing: false });
    await observeSuccessfulAuthentication({
      request: new Request(`${SITE_URL}/api/auth/sign-up/email`, { method: "POST", headers: { cookie: `${PAUSE_DATE_COOKIE}=spelpaus.${today}` } }),
      responseBody: { user: { id: fresh.id, email: fresh.email } },
      kind: "login",
    });
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: fresh.id } })).pauseEndsOn, null);

    // The hourly run answers without reading anything.
    const handler = createPauseLettersCronHandler({ environment: { CRON_SECRET: "pause-letters-cron-secret", PAUSE_LETTERS_ENABLED: "false" } });
    const response = await handler(new Request(`${SITE_URL}/api/internal/cron/pause-letters`, { headers: { authorization: "Bearer pause-letters-cron-secret" } }));
    assert.deepEqual(await response.json(), { ok: true, enabled: false });
    assert.equal((await handler(new Request(`${SITE_URL}/api/internal/cron/pause-letters`))).status, 401);

    // The nightly worker never picks up a pause letter, whatever is queued.
    const nightly = await processQueuedEmailBatch(50, { provider, siteUrl: SITE_URL });
    assert.equal(provider.envelopes.filter((envelope) => /Dag \d|paus|pause/i.test(envelope.subject)).length, 0);
    assert.ok(nightly.selected >= 0);
  } finally {
    process.env.PAUSE_LETTERS_ENABLED = "true";
  }
});

test("day 3, 7 and 10 letters go once per enrolment, in the evening, in the account's language, while the Programme is unfinished", async () => {
  const evening = lastLocalHour(18);
  const afternoon = localInstant(pauseLetterLocalTime(evening).day, 17);
  const night = localInstant(pauseLetterLocalTime(evening).day, 22);
  const started = (days: number) => new Date(evening.getTime() - days * 86_400_000);
  const swede = await createAccount({ locale: "sv" });
  const dane = await createAccount({ locale: "da-DK" });
  const briton = await createAccount({ locale: "en-GB" });
  const finished = await createAccount({ locale: "sv" });
  const optedOut = await createAccount({ locale: "sv", marketing: false });
  const dayFive = await createAccount({ locale: "sv" });
  await enrol(swede.id, started(3));
  await enrol(dane.id, started(7));
  await enrol(briton.id, started(10));
  await enrol(finished.id, started(3), new Date());
  await enrol(optedOut.id, started(3));
  await enrol(dayFive.id, started(5));

  // Not before 18:00 and not at night.
  await queueProgrammeDayLetters(afternoon);
  await queueProgrammeDayLetters(night);
  for (const account of [swede, dane, briton]) assert.equal((await messagesOf(account.id)).length, 0);

  const first = await queueProgrammeDayLetters(evening);
  assert.ok(first.queued >= 3);
  const second = await queueProgrammeDayLetters(evening);
  assert.equal(second.queued, 0, "a second run queues nothing");

  const letter = async (userId: string) => (await messagesOf(userId)).map((message) => [message.purpose, message.template.locale, message.status, message.subject]);
  assert.deepEqual(await letter(swede.id), [["PROGRAMME_DAY_3", "sv", "QUEUED", "Dag 3: suget kommer i vågor"]]);
  assert.deepEqual(await letter(dane.id), [["PROGRAMME_DAY_7", "da", "QUEUED", "Dag 7: ét menneske, der kender det rigtige tal"]]);
  assert.deepEqual(await letter(briton.id), [["PROGRAMME_DAY_10", "en", "QUEUED", "Day 10: the amount and the time before the app"]]);
  for (const account of [finished, optedOut, dayFive]) assert.deepEqual(await letter(account.id), []);

  // Sent by the pause-letter run only, with the plan, the Programme and an unsubscribe link and nothing commercial.
  const provider = new RecordingProvider();
  const delivery = await sendAccountPauseLetters(50, { provider, siteUrl: SITE_URL, now: evening });
  assert.ok(delivery.sent >= 3);
  const swedish = provider.envelopes.find((envelope) => envelope.to === swede.email);
  assert.ok(swedish);
  assert.match(swedish.text, /Suget kommer ofta i vågor/);
  assert.match(swedish.text, /https:\/\/b4gamble\.com\/program\b/);
  assert.match(swedish.text, /https:\/\/b4gamble\.com\/sv\/pause-plan\?utm_source=email&utm_medium=email&utm_campaign=pause-sv/);
  assert.match(swedish.text, /https:\/\/b4gamble\.com\/unsubscribe\?token=[A-Za-z0-9_-]{43}/);
  assert.match(swedish.html, /href="https:\/\/b4gamble\.com\/sv\/pause-plan\?utm_source=email&amp;utm_medium=email&amp;utm_campaign=pause-sv"/);
  for (const envelope of provider.envelopes) {
    const links = [...`${envelope.html} ${envelope.text}`.matchAll(/https?:\/\/[^\s"<]+/g)].map((match) => match[0]);
    assert.ok(links.length >= 3);
    for (const link of links) assert.match(link, /^https:\/\/b4gamble\.com\/(?:program|(?:sv|da|en)\/pause-plan\?utm_source=email|unsubscribe\?token=)/, link);
    assert.doesNotMatch(`${envelope.html} ${envelope.text}`, /\/r\/|\/go\/|bonus|casino|kasino|offer|erbjudande|tilbud/i);
  }
  assert.equal((await messagesOf(swede.id))[0]?.status, "SENT");

  // The unsubscribe link of a day letter stops every Programme letter for that account.
  const token = /unsubscribe\?token=([A-Za-z0-9_-]{43})/.exec(swedish.text)?.[1] ?? "";
  assert.deepEqual(await unsubscribeWithToken(token), { status: "unsubscribed" });
  const later = await createAccount({ locale: "sv" });
  await enrol(later.id, started(7));
  await prisma.programEnrollment.updateMany({ where: { userId: swede.id }, data: { startedAt: started(7) } });
  await queueProgrammeDayLetters(evening);
  assert.equal((await messagesOf(swede.id)).filter((message) => message.purpose === "PROGRAMME_DAY_7").length, 0);
  assert.equal((await messagesOf(later.id)).filter((message) => message.purpose === "PROGRAMME_DAY_7").length, 1);
});

test("an account with a pause date gets one letter the evening before the pause ends and one the morning it is over; the day letter of that day is not sent", async () => {
  const evening = lastLocalHour(18);
  const today = pauseLetterLocalTime(evening).day;
  const tomorrow = shiftIsoDay(today, 1);
  const morning = localInstant(tomorrow, 7);

  // Last pause day is today: "ends tomorrow" this evening, and no day-3 letter beside it.
  const swede = await createAccount({ locale: "sv", pauseEndsOn: today });
  await enrol(swede.id, new Date(evening.getTime() - 3 * 86_400_000));
  await queueProgrammeDayLetters(evening);
  assert.deepEqual((await messagesOf(swede.id)).map((message) => message.purpose), []);
  await queuePauseDateLetters(localInstant(today, 12));
  assert.deepEqual((await messagesOf(swede.id)).map((message) => message.purpose), [], "not before the evening");
  await queuePauseDateLetters(evening);
  await queuePauseDateLetters(evening);
  assert.deepEqual((await messagesOf(swede.id)).map((message) => [message.purpose, message.template.locale, message.subject]), [["PAUSE_ENDS_TOMORROW", "sv", "I morgon tar din paus slut"]]);

  // Last pause day was yesterday: "over" from 07:00, in Danish, once.
  const dane = await createAccount({ locale: "da", pauseEndsOn: today });
  await queuePauseDateLetters(localInstant(tomorrow, 6));
  assert.deepEqual((await messagesOf(dane.id)).map((message) => message.purpose), [], "not before 07:00");
  await queuePauseDateLetters(morning);
  await queuePauseDateLetters(morning);
  assert.deepEqual((await messagesOf(dane.id)).map((message) => [message.purpose, message.template.locale, message.subject]), [["PAUSE_OVER", "da", "I dag udløber din pause. Dine regler gælder."]]);
  // Tomorrow morning the Swedish account gets its second letter too, and never a third.
  assert.deepEqual((await messagesOf(swede.id)).map((message) => message.purpose), ["PAUSE_ENDS_TOMORROW", "PAUSE_OVER"]);
  await queuePauseDateLetters(localInstant(tomorrow, 19));
  assert.equal((await messagesOf(swede.id)).length, 2);

  // An account without the opt-in gets no dated letter; an account without a date gets none either.
  const optedOut = await createAccount({ locale: "sv", marketing: false, pauseEndsOn: today });
  const undated = await createAccount({ locale: "sv" });
  await queuePauseDateLetters(evening);
  assert.equal((await messagesOf(optedOut.id)).length + (await messagesOf(undated.id)).length, 0);

  const provider = new RecordingProvider();
  await sendAccountPauseLetters(50, { provider, siteUrl: SITE_URL, now: evening });
  const endsTomorrow = provider.envelopes.find((envelope) => envelope.to === swede.email);
  assert.ok(endsTomorrow);
  assert.match(endsTomorrow.text, /I morgon tar din paus slut\. Summan och tiden bestämmer du i dag\./);
  assert.match(endsTomorrow.text, /Stödlinjen, 020-81 91 00/);

  // Nothing leaves at night, and a letter that waited past its day is cancelled, not sent late.
  const waiting = await createAccount({ locale: "sv", pauseEndsOn: today });
  await queuePauseDateLetters(evening);
  const night = await sendAccountPauseLetters(50, { provider: new RecordingProvider(), siteUrl: SITE_URL, now: localInstant(today, 23) });
  assert.equal(night.selected, 0);
  assert.equal((await messagesOf(waiting.id))[0]?.status, "QUEUED");
  const lateNow = localInstant(tomorrow, 19);
  await prisma.emailMessage.updateMany({ where: { userId: waiting.id }, data: { queuedAt: new Date(lateNow.getTime() - 21 * 3_600_000) } });
  const lateProvider = new RecordingProvider();
  const late = await sendAccountPauseLetters(50, { provider: lateProvider, siteUrl: SITE_URL, now: lateNow });
  assert.ok(late.cancelledStale >= 1);
  const cancelled = (await messagesOf(waiting.id))[0];
  assert.deepEqual([cancelled?.status, cancelled?.deliveryErrorCode], ["CANCELLED", "PAUSE_LETTER_STALE"]);
  assert.equal(lateProvider.envelopes.filter((envelope) => envelope.to === waiting.email).length, 0);
});

test("the pause date travels from the tool's cookie into the account at sign-up, and only a valid one", async () => {
  const today = new Date().toISOString().slice(0, 10);
  const endsOn = shiftIsoDay(today, 9);
  const observe = (account: { id: string; email: string }, cookie: string, kind: "signup" | "login") => observeSuccessfulAuthentication({
    request: new Request(`${SITE_URL}/api/auth/sign-up/email`, { method: "POST", headers: { cookie } }),
    responseBody: { user: { id: account.id, email: account.email } },
    kind,
  });
  const read = async (id: string) => {
    const account = await prisma.user.findUniqueOrThrow({ where: { id }, select: { pauseEndsOn: true, pauseRegister: true } });
    return [account.pauseEndsOn?.toISOString().slice(0, 10) ?? null, account.pauseRegister];
  };

  const signedUp = await createAccount({ locale: "da", marketing: false });
  await observe(signedUp, `other=1; ${PAUSE_DATE_COOKIE}=rofus.${endsOn}`, "signup");
  assert.deepEqual(await read(signedUp.id), [endsOn, "ROFUS"]);

  // A later sign-in with another cookie does not replace a date that has not passed.
  await observe(signedUp, `${PAUSE_DATE_COOKIE}=spelpaus.${shiftIsoDay(today, 20)}`, "login");
  assert.deepEqual(await read(signedUp.id), [endsOn, "ROFUS"]);

  // The first sign-in that brings a date to an account without one saves it.
  const returning = await createAccount({ locale: "sv", marketing: false });
  await observe(returning, `${PAUSE_DATE_COOKIE}=spelpaus.${endsOn}`, "login");
  assert.deepEqual(await read(returning.id), [endsOn, "SPELPAUS"]);

  for (const cookie of ["", `${PAUSE_DATE_COOKIE}=spelpaus.2019-01-01`, `${PAUSE_DATE_COOKIE}=spelpaus.${shiftIsoDay(today, 400)}`, `${PAUSE_DATE_COOKIE}=casino.${endsOn}`, `${PAUSE_DATE_COOKIE}=spelpaus.2026-02-31`, `${PAUSE_DATE_COOKIE}=%E0%A4%A`]) {
    const account = await createAccount({ locale: "sv", marketing: false });
    await observe(account, cookie, "signup");
    assert.deepEqual(await read(account.id), [null, null], cookie);
  }
});

test("the email field: one letter at once, one the evening before, one the morning after, each with its own unsubscribe link", async () => {
  const evening = lastLocalHour(18);
  const today = pauseLetterLocalTime(evening).day;
  const provider = new RecordingProvider();
  const options = { provider, siteUrl: SITE_URL, now: evening };
  const email = address();

  assert.deepEqual(await subscribePauseReminder({ email: `  ${email.toUpperCase()} `, register: "rofus", endsOn: today, locale: "da-DK" }, "203.0.113.20", options), { status: "accepted" });
  const stored = await prisma.pauseReminder.findFirstOrThrow({ where: { email } });
  assert.deepEqual([stored.locale, stored.register, stored.pauseEndsOn.toISOString().slice(0, 10)], ["da-DK", "ROFUS", today]);
  assert.equal(provider.envelopes.length, 1);
  const confirmation = provider.envelopes[0];
  assert.equal(confirmation.to, email);
  assert.equal(confirmation.subject, "Din pause: vi skriver dagen før, den udløber");
  assert.match(confirmation.text, new RegExp(`Vi skriver igen den ${Number(today.slice(8))}\\. [a-zæøå]+\\. Her er planen i mellemtiden\\.`));
  assert.match(confirmation.text, /https:\/\/b4gamble\.com\/da\/pause-plan\?utm_source=email/);
  const token = /unsubscribe\?token=([A-Za-z0-9_-]{43})/.exec(confirmation.text)?.[1] ?? "";
  assert.equal(token, pauseReminderToken(stored.id));
  assert.doesNotMatch(`${confirmation.html} ${confirmation.text}`, /\/r\/|\/go\/|bonus|casino|kasino|tilbud/i);

  // The same address and date again sends nothing new; the evening letter follows the same day.
  await subscribePauseReminder({ email, register: "rofus", endsOn: today, locale: "da-DK" }, "203.0.113.20", options);
  assert.equal(provider.envelopes.length, 1);
  await sendDuePauseReminders(50, { ...options, now: localInstant(today, 12) });
  assert.equal(provider.envelopes.filter((envelope) => envelope.to === email).length, 1, "not before the evening");
  await sendDuePauseReminders(50, options);
  await sendDuePauseReminders(50, options);
  const mine = () => provider.envelopes.filter((envelope) => envelope.to === email).map((envelope) => envelope.subject);
  assert.deepEqual(mine(), ["Din pause: vi skriver dagen før, den udløber", "I morgen udløber din pause"]);

  // The morning after the last pause day.
  const tomorrow = shiftIsoDay(today, 1);
  const morning = localInstant(tomorrow, 7);
  await sendDuePauseReminders(50, { ...options, now: localInstant(tomorrow, 6) });
  assert.equal(mine().length, 2, "not before 07:00");
  await sendDuePauseReminders(50, { ...options, now: morning });
  await sendDuePauseReminders(50, { ...options, now: morning });
  assert.deepEqual(mine().at(-1), "I dag udløber din pause. Dine regler gælder.");
  assert.equal(mine().length, 3);

  // A provider failure gives the claim back, so the next run sends it.
  const flaky = address();
  await subscribePauseReminder({ email: flaky, register: "spelpaus", endsOn: today, locale: "sv" }, "203.0.113.21", { ...options, provider: new RecordingProvider({ status: "unavailable", code: "PROVIDER_5XX" }) });
  assert.equal((await prisma.pauseReminder.findFirstOrThrow({ where: { email: flaky } })).confirmationSentAt, null);

  // One click stops the letters of that address and nothing else.
  const stopping = address();
  await subscribePauseReminder({ email: stopping, register: "spelpaus", endsOn: today, locale: "sv" }, "203.0.113.22", options);
  const stoppingRow = await prisma.pauseReminder.findFirstOrThrow({ where: { email: stopping } });
  assert.deepEqual(await unsubscribeWithToken(pauseReminderToken(stoppingRow.id)), { status: "unsubscribed" });
  assert.deepEqual(await unsubscribeWithToken(pauseReminderToken(stoppingRow.id)), { status: "already-unsubscribed" });
  assert.deepEqual(await unsubscribeWithToken(pauseReminderToken(randomUUID())), { status: "invalid" });
  await sendDuePauseReminders(50, options);
  assert.equal(provider.envelopes.filter((envelope) => envelope.to === stopping).length, 1, "only the first letter was ever sent");
  // The open form cannot be used to write to an address that asked us to stop.
  await subscribePauseReminder({ email: stopping, register: "spelpaus", endsOn: shiftIsoDay(today, 5), locale: "sv" }, "203.0.113.23", options);
  assert.equal(provider.envelopes.filter((envelope) => envelope.to === stopping).length, 1);
  assert.ok((await prisma.pauseReminder.findFirstOrThrow({ where: { email: stopping } })).unsubscribedAt);
});

test("the email field refuses bad input, is rate-limited per source and per address, and never stores an account's address", async () => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const provider = new RecordingProvider();
  const options = { provider, siteUrl: SITE_URL, now };
  for (const request of [
    { email: "not-an-address", register: "spelpaus", endsOn: today },
    { email: address(), register: "casino", endsOn: today },
    { email: address(), register: "spelpaus", endsOn: shiftIsoDay(today, -1) },
    { email: address(), register: "spelpaus", endsOn: shiftIsoDay(today, 400) },
    { email: address(), register: "spelpaus", endsOn: "soon" },
    { email: address(), register: "spelpaus" },
    {},
  ]) {
    assert.deepEqual(await subscribePauseReminder(request, `198.51.100.${Math.floor(Math.random() * 200)}`, options), { status: "invalid" });
  }
  assert.equal(provider.envelopes.length, 0);

  // Per address: a new date each time, so each request would send a letter.
  const email = address();
  const source = () => `192.0.2.${Math.floor(Math.random() * 250)}-${randomUUID()}`;
  for (let attempt = 0; attempt < PAUSE_REMINDER_REQUESTS_PER_ADDRESS_PER_DAY; attempt += 1) {
    assert.deepEqual(await subscribePauseReminder({ email, register: "spelpaus", endsOn: shiftIsoDay(today, attempt + 1), locale: "sv" }, source(), options), { status: "accepted" });
  }
  assert.deepEqual(await subscribePauseReminder({ email, register: "spelpaus", endsOn: shiftIsoDay(today, 9), locale: "sv" }, source(), options), { status: "rate-limited" });
  assert.equal(provider.envelopes.filter((envelope) => envelope.to === email).length, PAUSE_REMINDER_REQUESTS_PER_ADDRESS_PER_DAY);

  // Per source.
  const oneSource = `203.0.113.99-${randomUUID()}`;
  const answers: string[] = [];
  for (let attempt = 0; attempt < 7; attempt += 1) {
    answers.push((await subscribePauseReminder({ email: address(), register: "rofus", endsOn: today, locale: "da" }, oneSource, options)).status);
  }
  assert.deepEqual(answers, ["accepted", "accepted", "accepted", "accepted", "accepted", "rate-limited", "rate-limited"]);

  // An address that already has an account gets the same answer and no row: the account's letters are its letters.
  const account = await createAccount({ locale: "sv" });
  assert.deepEqual(await subscribePauseReminder({ email: account.email, register: "spelpaus", endsOn: today, locale: "sv" }, source(), options), { status: "accepted" });
  assert.equal(await prisma.pauseReminder.count({ where: { email: account.email } }), 0);
  assert.equal(provider.envelopes.filter((envelope) => envelope.to === account.email).length, 0);
});

test("an address that signs up is taken over by the account: the stand-alone letters stop and the account carries the date", async () => {
  const evening = lastLocalHour(18);
  // The sign-up below runs on the real clock, and a take-over keeps only a pause that has not ended yet.
  // Before 18:00 local time `evening` is yesterday, so the pause ends tomorrow by the real local date.
  const endsOn = shiftIsoDay(pauseLetterLocalTime(new Date()).day, 1);
  const provider = new RecordingProvider();
  const options = { provider, siteUrl: SITE_URL, now: evening };
  const email = address();
  await subscribePauseReminder({ email, register: "spelpaus", endsOn, locale: "sv" }, `takeover-${randomUUID()}`, options);

  const suffix = randomUUID();
  const account = await prisma.user.create({ data: { id: `pause-letters-${suffix}`, name: "Take-over Fixture", email, emailVerified: true, preferredLocale: "sv" } });
  createdUserIds.push(account.id);
  await observeSuccessfulAuthentication({
    request: new Request(`${SITE_URL}/api/auth/sign-up/email`, { method: "POST" }),
    responseBody: { user: { id: account.id, email } },
    kind: "signup",
  });
  const reminder = await prisma.pauseReminder.findFirstOrThrow({ where: { email } });
  assert.ok(reminder.takenOverAt);
  const stored = await prisma.user.findUniqueOrThrow({ where: { id: account.id } });
  assert.deepEqual([stored.pauseEndsOn?.toISOString().slice(0, 10), stored.pauseRegister], [endsOn, "SPELPAUS"]);

  await sendDuePauseReminders(50, options);
  assert.deepEqual(provider.envelopes.filter((envelope) => envelope.to === email).map((envelope) => envelope.subject), ["Din paus: vi hörs dagen innan den tar slut"]);
});
