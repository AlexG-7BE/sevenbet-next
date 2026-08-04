import { createHash, randomBytes } from "node:crypto";

export const anonymousSessionLifetimeMs = 24 * 60 * 60 * 1000;
export const pendingClaimLifetimeMs = 30 * 60 * 1000;

export function createOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function expiresAfter(now: Date, durationMs: number) {
  return new Date(now.getTime() + durationMs);
}

export function localDateAt(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const read = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value;
  return `${read("year")}-${read("month")}-${read("day")}`;
}

export function dateOnlyUtc(localDate: string) {
  return new Date(`${localDate}T00:00:00.000Z`);
}

export function activeDayStreak(localDates: string[]) {
  const unique = Array.from(new Set(localDates)).sort();
  if (!unique.length) return 0;
  let streak = 1;
  for (let index = unique.length - 1; index > 0; index -= 1) {
    const current = Date.parse(`${unique[index]}T00:00:00.000Z`);
    const previous = Date.parse(`${unique[index - 1]}T00:00:00.000Z`);
    if (current - previous !== 24 * 60 * 60 * 1000) break;
    streak += 1;
  }
  return streak;
}
