import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import test from "node:test";

import type { AnalyticsEnvironment, AnalyticsEventType, AnalyticsTrafficKind } from "@prisma/client";

import { socialTrafficResultSchema } from "@/lib/analytics/social-traffic.server";
import { prisma } from "@/lib/db/prisma";
import { handleLearnMcpPost } from "@/lib/mcp/learn/post-handler";

const token = "social-traffic-postgres-token-with-more-than-32-bytes";
const actorId = "00000000-0000-4000-8000-000000000955";

function assertDisposableDatabase(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  if (!new Set(["127.0.0.1", "localhost", "[::1]"]).has(url.hostname) || !/(?:_ci|test|disposable)$/i.test(url.pathname.slice(1))) {
    throw new Error("Social traffic PostgreSQL test requires a disposable loopback database");
  }
}

type SessionSeed = {
  key: string;
  /** The browser the visit belongs to; a visit is its own visitor unless it names another visit's key. */
  visitor?: string;
  startedAt: string;
  environment?: AnalyticsEnvironment;
  trafficKind?: AnalyticsTrafficKind;
  countryCode?: string | null;
  referrerHost?: string | null;
  utm?: [string | null, string | null, string | null];
};

// A window no other suite writes to, so site-wide counts are exact.
const sessionSeeds: SessionSeed[] = [
  { key: "x-post-gb", startedAt: "2031-03-10T10:00:00.000Z", countryCode: "GB", referrerHost: "t.co", utm: ["x", "post", "spin-regret"] },
  { key: "x-post-se", startedAt: "2031-03-10T11:00:00.000Z", countryCode: "SE", utm: ["X", "post", "spin-regret"] },
  { key: "instagram-untagged", startedAt: "2031-03-11T09:00:00.000Z", countryCode: "GB", referrerHost: "l.instagram.com" },
  { key: "search", startedAt: "2031-03-11T10:00:00.000Z", countryCode: "GB", referrerHost: "www.google.com" },
  { key: "direct", startedAt: "2031-03-12T23:59:00.000Z", countryCode: "DK" },
  { key: "staff", startedAt: "2031-03-11T12:00:00.000Z", trafficKind: "INTERNAL", countryCode: "GB", utm: ["instagram", "bio", "link_in_bio"] },
  { key: "preview", startedAt: "2031-03-11T13:00:00.000Z", environment: "PREVIEW", countryCode: "GB", utm: ["instagram", "bio", "link_in_bio"] },
  { key: "facebook-before", startedAt: "2031-03-09T23:50:00.000Z", countryCode: "DK", utm: ["facebook", "post", "old-post"] },
  { key: "x-after", startedAt: "2031-03-13T00:00:00.000Z", countryCode: "GB", utm: ["x", "post", "spin-regret"] },
  // The X visitor from Great Britain returns from a search two days later: not a social visit.
  { key: "x-post-gb-return", visitor: "x-post-gb", startedAt: "2031-03-12T08:00:00.000Z", countryCode: "NO", referrerHost: "www.google.com" },
  // A social visit more than 30 days before its visitor starts the Programme.
  { key: "x-long-ago", startedAt: "2031-02-01T10:00:00.000Z", countryCode: "GB", utm: ["x", "post", "long-ago"] },
];

type ClickSeed = {
  session: string | null;
  attemptedAt: string;
  succeeded: boolean;
  trafficKind?: AnalyticsTrafficKind;
};

const clickSeeds: ClickSeed[] = [
  { session: "x-post-gb", attemptedAt: "2031-03-10T10:05:00.000Z", succeeded: true },
  { session: "x-post-se", attemptedAt: "2031-03-10T11:05:00.000Z", succeeded: false },
  { session: "instagram-untagged", attemptedAt: "2031-03-11T09:05:00.000Z", succeeded: true },
  { session: null, attemptedAt: "2031-03-11T09:30:00.000Z", succeeded: true },
  { session: "facebook-before", attemptedAt: "2031-03-10T00:05:00.000Z", succeeded: true },
  { session: "staff", attemptedAt: "2031-03-11T12:05:00.000Z", succeeded: true, trafficKind: "INTERNAL" },
  { session: "search", attemptedAt: "2031-03-11T10:05:00.000Z", succeeded: true },
  { session: "x-after", attemptedAt: "2031-03-13T00:05:00.000Z", succeeded: true },
];

type ProgrammeEventSeed = {
  /** The session key of the visitor's browser; null is an observation without an analytics ID. */
  visitor: string | null;
  type: Extract<AnalyticsEventType, "PROGRAMME_STARTED" | "PROGRAMME_STEP_COMPLETED">;
  occurredAt: string;
  /** How the observer keyed the row: the anonymous start or the account's enrolment. */
  observedAs: "anonymous" | "enrolment";
  programmeStep?: number;
  environment?: AnalyticsEnvironment;
  trafficKind?: AnalyticsTrafficKind;
};

const programmeEventSeeds: ProgrammeEventSeed[] = [
  // One visitor, observed while anonymous and again with the account: one start, credited to the X post.
  { visitor: "x-post-se", type: "PROGRAMME_STARTED", occurredAt: "2031-03-10T11:10:00.000Z", observedAs: "anonymous" },
  { visitor: "x-post-se", type: "PROGRAMME_STARTED", occurredAt: "2031-03-10T11:40:00.000Z", observedAs: "enrolment" },
  { visitor: "x-post-se", type: "PROGRAMME_STEP_COMPLETED", programmeStep: 1, occurredAt: "2031-03-10T11:45:00.000Z", observedAs: "enrolment" },
  // A later step is not the first step.
  { visitor: "x-post-se", type: "PROGRAMME_STEP_COMPLETED", programmeStep: 2, occurredAt: "2031-03-10T12:00:00.000Z", observedAs: "enrolment" },
  // The latest social visit decides, although a search visit came after it.
  { visitor: "x-post-gb", type: "PROGRAMME_STARTED", occurredAt: "2031-03-12T09:00:00.000Z", observedAs: "anonymous" },
  { visitor: "instagram-untagged", type: "PROGRAMME_STARTED", occurredAt: "2031-03-11T09:10:00.000Z", observedAs: "anonymous" },
  // The credited visit began the evening before the range.
  { visitor: "facebook-before", type: "PROGRAMME_STARTED", occurredAt: "2031-03-10T00:10:00.000Z", observedAs: "anonymous" },
  // No social visit, a social visit 38 days earlier, no analytics ID: site totals only.
  { visitor: "search", type: "PROGRAMME_STARTED", occurredAt: "2031-03-11T10:05:00.000Z", observedAs: "anonymous" },
  { visitor: "x-long-ago", type: "PROGRAMME_STARTED", occurredAt: "2031-03-11T15:00:00.000Z", observedAs: "anonymous" },
  { visitor: null, type: "PROGRAMME_STARTED", occurredAt: "2031-03-12T08:00:00.000Z", observedAs: "enrolment" },
  // Staff-marked and Preview observations are not Production human traffic.
  { visitor: "staff", type: "PROGRAMME_STARTED", occurredAt: "2031-03-11T12:05:00.000Z", observedAs: "anonymous", trafficKind: "INTERNAL" },
  { visitor: "preview", type: "PROGRAMME_STARTED", occurredAt: "2031-03-11T13:05:00.000Z", observedAs: "anonymous", environment: "PREVIEW" },
  // After the three-day range, inside the wider one.
  { visitor: "x-after", type: "PROGRAMME_STARTED", occurredAt: "2031-03-13T00:05:00.000Z", observedAs: "anonymous" },
];

const sessionIds = new Map(sessionSeeds.map((seed) => [seed.key, randomUUID()]));
const visitorIds = new Map(sessionSeeds.filter((seed) => !seed.visitor).map((seed) => [seed.key, randomUUID()]));
const clickIds = clickSeeds.map(() => randomUUID());
const programmeEventIds = programmeEventSeeds.map(() => randomUUID());

async function cleanup() {
  await prisma.analyticsEvent.deleteMany({ where: { id: { in: programmeEventIds } } });
  await prisma.outboundClick.deleteMany({ where: { id: { in: clickIds } } });
  await prisma.analyticsSession.deleteMany({ where: { id: { in: [...sessionIds.values()] } } });
}

async function seed() {
  await cleanup();
  for (const candidate of sessionSeeds) {
    const startedAt = new Date(candidate.startedAt);
    const [utmSource, utmCampaign, utmContent] = candidate.utm ?? [null, null, null];
    await prisma.analyticsSession.create({
      data: {
        id: sessionIds.get(candidate.key)!,
        anonymousId: visitorIds.get(candidate.visitor ?? candidate.key)!,
        environment: candidate.environment ?? "PRODUCTION",
        trafficKind: candidate.trafficKind ?? "HUMAN",
        startedAt,
        lastActivityAt: startedAt,
        expiresAt: new Date(startedAt.getTime() + 30 * 60_000),
        landingPath: "/",
        countryCode: candidate.countryCode ?? null,
        referrerHost: candidate.referrerHost ?? null,
        utmSource,
        utmMedium: candidate.utm ? "social" : null,
        utmCampaign,
        utmContent,
      },
    });
  }
  for (const [index, candidate] of clickSeeds.entries()) {
    const attemptedAt = new Date(candidate.attemptedAt);
    await prisma.outboundClick.create({
      data: {
        id: clickIds[index]!,
        state: candidate.succeeded ? "SUCCEEDED" : "BLOCKED",
        blockedReason: candidate.succeeded ? null : "MARKET_CLOSED",
        environment: "PRODUCTION",
        trafficKind: candidate.trafficKind ?? "HUMAN",
        attemptedAt,
        resolvedAt: attemptedAt,
        analyticsSessionId: candidate.session ? sessionIds.get(candidate.session)! : null,
        anonymousId: candidate.session ? randomUUID() : null,
        countryCode: "GB",
        requestedSlug: "social-traffic-fixture",
      },
    });
  }
  for (const [index, candidate] of programmeEventSeeds.entries()) {
    const step = candidate.type === "PROGRAMME_STARTED" ? "started" : `step:${candidate.programmeStep}:completed`;
    // The observer never sets the session on these rows, so only the analytics ID can link them to a visit.
    await prisma.analyticsEvent.create({
      data: {
        id: programmeEventIds[index]!,
        dedupeKey: candidate.observedAs === "anonymous" ? `programme:anonymous:${randomUUID()}:${step}` : `programme:${randomUUID()}:${step}`,
        type: candidate.type,
        environment: candidate.environment ?? "PRODUCTION",
        trafficKind: candidate.trafficKind ?? "HUMAN",
        occurredAt: new Date(candidate.occurredAt),
        anonymousId: candidate.visitor ? visitorIds.get(candidate.visitor)! : null,
        programmeStep: candidate.programmeStep ?? 1,
      },
    });
  }
}

async function databaseDigest() {
  const [sessions, clicks, events] = await Promise.all([
    prisma.analyticsSession.findMany({ orderBy: { id: "asc" } }),
    prisma.outboundClick.findMany({ orderBy: { id: "asc" } }),
    prisma.analyticsEvent.count(),
  ]);
  return createHash("sha256").update(JSON.stringify({ sessions, clicks, events })).digest("hex");
}

async function socialTraffic(argumentsValue: Record<string, unknown>) {
  const response = await handleLearnMcpPost(new Request("https://b4gamble.com/api/mcp/learn", {
    method: "POST",
    headers: { accept: "application/json, text/event-stream", authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "social_traffic", arguments: argumentsValue } }),
  }));
  assert.equal(response.status, 200);
  const payload = await response.json() as { result?: { isError?: boolean; structuredContent?: unknown } };
  assert.equal(payload.result?.isError, undefined, JSON.stringify(payload));
  const serialized = JSON.stringify(payload);
  for (const id of [...sessionIds.values(), ...visitorIds.values(), ...clickIds, ...programmeEventIds]) assert.equal(serialized.includes(id), false, "no row identifier may leave the tool");
  assert.doesNotMatch(serialized, /anonymousId|analyticsSessionId|userId|dedupeKey|programme:anonymous|l\.instagram\.com|www\.google\.com/);
  return socialTrafficResultSchema.parse(payload.result?.structuredContent);
}

test("social_traffic aggregates PostgreSQL sessions, partner clicks and Programme starts per UTM post and writes nothing", async (context) => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  const keys = ["LEARN_MCP_ENABLED", "LEARN_MCP_SERVICE_TOKEN", "LEARN_MCP_ACTOR_ID"] as const;
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  Object.assign(process.env, { LEARN_MCP_ENABLED: "true", LEARN_MCP_SERVICE_TOKEN: token, LEARN_MCP_ACTOR_ID: actorId });
  context.after(async () => {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await cleanup();
    await prisma.$disconnect();
  });

  await seed();
  const before = await databaseDigest();

  const result = await socialTraffic({ from: "2031-03-10", to: "2031-03-12" });
  assert.deepEqual(result.range, { from: "2031-03-10T00:00:00.000Z", to: "2031-03-13T00:00:00.000Z", days: 3 });
  // Production human only: staff-marked, Preview and out-of-range rows are absent.
  // Seven visitors started (the one observed twice counts once; the staff-marked and Preview starts do not count)
  // and one completed the first step; three of the starts have no social visit within 30 days to credit.
  assert.deepEqual(result.site, { sessions: 6, outboundClicks: 6, partnerClicks: 5, outboundClicksWithoutConsent: 1, programmeStarts: 7, stepOneCompletions: 1 });
  assert.deepEqual(result.rows.map((row) => [row.channel, row.utmSource ?? row.referrerNetwork, row.utmCampaign, row.utmContent, row.sessions, row.outboundClicks, row.partnerClicks, row.programmeStarts, row.stepOneCompletions]), [
    ["utm", "x", "post", "spin-regret", 2, 2, 1, 2, 1],
    ["social_referrer", "instagram", null, null, 1, 1, 1, 1, 0],
    // The click and the Programme start happened in range although their visit began the evening before.
    ["utm", "facebook", "post", "old-post", 0, 1, 1, 1, 0],
  ]);
  assert.deepEqual(result.rows[0]?.topCountries, [{ countryCode: "GB", sessions: 1 }, { countryCode: "SE", sessions: 1 }]);
  // The start carries the country of the credited X visit, not of the later search visit from Norway.
  assert.deepEqual(result.rows.map((row) => row.programmeStartCountries), [
    [{ countryCode: "GB", starts: 1 }, { countryCode: "SE", starts: 1 }],
    [{ countryCode: "GB", starts: 1 }],
    [{ countryCode: "DK", starts: 1 }],
  ]);
  assert.deepEqual(result.totals, { rows: 3, sessions: 3, outboundClicks: 4, partnerClicks: 3, programmeStarts: 4, stepOneCompletions: 1 });

  const xOnly = await socialTraffic({ from: "2031-03-10T00:00:00Z", to: "2031-03-14T00:00:00Z", utmSource: "x", groupBy: "source" });
  assert.deepEqual(xOnly.rows.map((row) => [row.channel, row.utmSource, row.sessions, row.outboundClicks, row.partnerClicks, row.programmeStarts, row.stepOneCompletions]), [
    ["utm", "x", 3, 3, 2, 3, 1],
  ]);
  assert.deepEqual([xOnly.site.programmeStarts, xOnly.site.stepOneCompletions], [8, 1]);

  assert.equal(await databaseDigest(), before, "social_traffic must not change any analytics session, click or event row");
});
