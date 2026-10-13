import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import {
  attributeProgrammeEvents,
  readSocialTraffic,
  resolveSocialTrafficRange,
  SOCIAL_TRAFFIC_MAX_DAYS,
  SOCIAL_TRAFFIC_NOTES,
  SOCIAL_TRAFFIC_PROGRAMME_ATTRIBUTION_DAYS,
  SocialTrafficError,
  socialReferrerNetwork,
  socialTrafficResultSchema,
  type SocialTrafficClick,
  type SocialTrafficProgrammeEvent,
  type SocialTrafficProgrammeObservation,
  type SocialTrafficRange,
  type SocialTrafficSessionGroup,
  type SocialTrafficStore,
  type SocialTrafficVisitorSession,
} from "@/lib/analytics/social-traffic.server";
import { learnMcpToolSurfaceIsExpected } from "@/lib/learn-content-orchestrator/mcp-publisher.server";
import { handleLearnMcpPost } from "@/lib/mcp/learn/post-handler";
import { clearLearnMcpRateLimitsForTests } from "@/lib/mcp/learn/rate-limit";
import { createLearnMcpServer, socialTrafficTool } from "@/lib/mcp/learn/server";
import { programmeJourney } from "@/lib/programme/program-ai/mission-registry";

const NOW = new Date("2026-10-03T12:00:00.000Z");

function session(
  utmSource: string | null,
  utmCampaign: string | null,
  utmContent: string | null,
  sessions: number,
  countryCode: string | null = "GB",
  referrerHost: string | null = null,
): SocialTrafficSessionGroup {
  return { utmSource, utmCampaign, utmContent, referrerHost, countryCode, sessions };
}

function click(
  succeeded: boolean,
  utmSource: string | null,
  utmCampaign: string | null = null,
  utmContent: string | null = null,
  referrerHost: string | null = null,
): SocialTrafficClick {
  return { succeeded, touch: { utmSource, utmCampaign, utmContent, referrerHost } };
}

const seededSessions = [
  session("x", "post", "spin-regret", 4, "GB"),
  session("X", "post", "spin-regret", 2, "SE"),
  session("x", "post", "chasing-losses", 1, "DK"),
  session("x", "bio", null, 3, "GB"),
  session("instagram", "bio", "link_in_bio", 5, "GB", "l.instagram.com"),
  session("instagram", "bio", "link_in_bio", 1, null, "l.instagram.com"),
  session(null, null, null, 2, "GB", "l.instagram.com"),
  session(null, null, null, 1, "SE", "t.co"),
  session(null, null, null, 9, "GB", "www.google.com"),
  session(null, null, null, 7, "GB", "b4gamble.com"),
];

const seededClicks = [
  click(true, "x", "post", "spin-regret"),
  click(false, "x", "post", "spin-regret"),
  click(true, "instagram", "bio", "link_in_bio", "l.instagram.com"),
  click(true, null, null, null, "l.instagram.com"),
  click(true, null, null, null, "www.google.com"),
  click(true, "facebook", "post", "old-post"),
];

function programmeEvent(
  kind: SocialTrafficProgrammeEvent["kind"],
  visit: [utmSource: string | null, utmCampaign: string | null, utmContent: string | null, countryCode: string | null, referrerHost?: string | null] | null,
): SocialTrafficProgrammeEvent {
  if (!visit) return { kind, visit: null };
  const [utmSource, utmCampaign, utmContent, countryCode, referrerHost = null] = visit;
  return { kind, visit: { utmSource, utmCampaign, utmContent, referrerHost, countryCode } };
}

// What the store hands over after it counted each visitor once and matched the visit.
const seededProgrammeEvents = [
  programmeEvent("started", ["x", "post", "spin-regret", "SE"]),
  programmeEvent("started", ["X", "post", "spin-regret", "SE"]),
  programmeEvent("started", ["x", "post", "spin-regret", "GB"]),
  programmeEvent("step_one_completed", ["x", "post", "spin-regret", "SE"]),
  programmeEvent("started", ["x", "bio", null, null]),
  programmeEvent("started", [null, null, null, "GB", "l.instagram.com"]),
  programmeEvent("step_one_completed", [null, null, null, "GB", "l.instagram.com"]),
  // The credited visit began before the range, so its row has no session in it.
  programmeEvent("started", ["facebook", "post", "old-post", "DK"]),
  // No social visit to credit: site totals only.
  programmeEvent("started", null),
  programmeEvent("started", null),
  programmeEvent("step_one_completed", null),
];

const siteTotals = { sessions: 61, outboundClicks: 11, partnerClicks: 8, outboundClicksWithoutConsent: 5 };
const siteWithProgramme = { ...siteTotals, programmeStarts: 8, stepOneCompletions: 3 };

function store(overrides: Partial<SocialTrafficStore> = {}) {
  const ranges: SocialTrafficRange[] = [];
  const value: SocialTrafficStore = {
    sessionGroups: async (range) => {
      ranges.push(range);
      return seededSessions;
    },
    attributedClicks: async (range) => {
      ranges.push(range);
      return seededClicks;
    },
    programmeEvents: async (range) => {
      ranges.push(range);
      return seededProgrammeEvents;
    },
    siteTotals: async (range) => {
      ranges.push(range);
      return siteTotals;
    },
    ...overrides,
  };
  return { value, ranges };
}

async function rejectsWith(promise: Promise<unknown>, code: string, retryable = false) {
  await assert.rejects(promise, (error: unknown) => error instanceof SocialTrafficError && error.code === code && error.retryable === retryable);
}

test("social referrers map to their network by exact host or subdomain only", () => {
  const cases: Array<[string | null, string | null]> = [
    ["l.instagram.com", "instagram"],
    ["www.instagram.com", "instagram"],
    ["INSTAGRAM.COM.", "instagram"],
    ["threads.net", "threads"],
    ["l.threads.com", "threads"],
    ["t.co", "x"],
    ["x.com", "x"],
    ["mobile.twitter.com", "x"],
    ["l.facebook.com", "facebook"],
    ["m.facebook.com", "facebook"],
    ["lm.facebook.com", "facebook"],
    ["www.youtube.com", "youtube"],
    ["youtu.be", "youtube"],
    ["pinterest.com", "pinterest"],
    ["uk.pinterest.com", "pinterest"],
    ["pinterest.co.uk", "pinterest"],
    ["pinterest.se", "pinterest"],
    ["pin.it", "pinterest"],
    ["vm.tiktok.com", "tiktok"],
    ["notinstagram.com", null],
    ["instagram.com.evil.example", null],
    ["fakefacebook.com", null],
    ["www.google.com", null],
    ["b4gamble.com", null],
    ["", null],
    [null, null],
  ];
  for (const [host, network] of cases) assert.equal(socialReferrerNetwork(host), network, String(host));
});

test("the range defaults to the last 7 days and treats date-only ends as whole UTC days", () => {
  assert.deepEqual(resolveSocialTrafficRange({}, NOW), {
    from: new Date("2026-09-26T12:00:00.000Z"),
    until: NOW,
  });
  assert.deepEqual(resolveSocialTrafficRange({ from: "2026-10-01", to: "2026-10-02" }, NOW), {
    from: new Date("2026-10-01T00:00:00.000Z"),
    until: new Date("2026-10-03T00:00:00.000Z"),
  });
  assert.deepEqual(resolveSocialTrafficRange({ from: "2026-10-01T06:00:00+05:00", to: "2026-10-01T12:30:00Z" }, NOW), {
    from: new Date("2026-10-01T01:00:00.000Z"),
    until: new Date("2026-10-01T12:30:00.000Z"),
  });
  assert.deepEqual(resolveSocialTrafficRange({ to: "2026-10-02" }, NOW), {
    from: new Date("2026-09-26T00:00:00.000Z"),
    until: new Date("2026-10-03T00:00:00.000Z"),
  });
  // Exactly 92 whole days is allowed; one more day is not.
  assert.equal(resolveSocialTrafficRange({ from: "2026-07-04", to: "2026-10-03" }, NOW).from.toISOString(), "2026-07-04T00:00:00.000Z");
  assert.throws(() => resolveSocialTrafficRange({ from: "2026-07-03", to: "2026-10-03" }, NOW), (error: unknown) => error instanceof SocialTrafficError && error.code === "RANGE_TOO_LONG");
  assert.equal(SOCIAL_TRAFFIC_MAX_DAYS, 92);
  for (const bad of [{ from: "2026-02-30" }, { from: "yesterday" }, { to: "2026-10-01T12:00:00" }, { from: "2026-10-02", to: "2026-10-01" }, { from: "2026-10-01T10:00:00Z", to: "2026-10-01T10:00:00Z" }]) {
    assert.throws(() => resolveSocialTrafficRange(bad, NOW), (error: unknown) => error instanceof SocialTrafficError && error.code === "INVALID_INPUT", JSON.stringify(bad));
  }
});

test("input outside the closed contract is rejected before any read", async () => {
  let reads = 0;
  const counting = store({
    sessionGroups: async () => { reads += 1; return []; },
    attributedClicks: async () => { reads += 1; return []; },
    programmeEvents: async () => { reads += 1; return []; },
    siteTotals: async () => { reads += 1; return siteTotals; },
  });
  for (const input of [
    { anonymousId: "x" },
    { groupBy: "country" },
    { limit: 0 },
    { limit: 201 },
    { limit: 2.5 },
    { utmSource: "" },
    { utmSource: "x; drop table" },
    { from: 20261001 },
    "x",
  ]) {
    await rejectsWith(readSocialTraffic(input, counting.value, NOW), "INVALID_INPUT");
  }
  await rejectsWith(readSocialTraffic({ from: "2026-01-01", to: "2026-10-01" }, counting.value, NOW), "RANGE_TOO_LONG");
  assert.equal(reads, 0);
});

test("default grain gives one row per source, campaign and post, with clicks and Programme starts credited to the visit's tags", async () => {
  const fake = store();
  const result = await readSocialTraffic(undefined, fake.value, NOW);
  assert.deepEqual(socialTrafficResultSchema.parse(result), result);
  assert.equal(result.groupBy, "source_campaign_content");
  assert.deepEqual(fake.ranges.map((range) => [range.from.toISOString(), range.until.toISOString()]), Array(4).fill(["2026-09-26T12:00:00.000Z", "2026-10-03T12:00:00.000Z"]));
  assert.deepEqual(result.range, { from: "2026-09-26T12:00:00.000Z", to: "2026-10-03T12:00:00.000Z", days: 7 });

  const summary = result.rows.map((row) => [row.channel, row.utmSource ?? row.referrerNetwork, row.utmCampaign, row.utmContent, row.sessions, row.outboundClicks, row.partnerClicks, row.programmeStarts, row.stepOneCompletions]);
  assert.deepEqual(summary, [
    ["utm", "x", "post", "spin-regret", 6, 2, 1, 3, 1],
    ["utm", "instagram", "bio", "link_in_bio", 6, 1, 1, 0, 0],
    ["utm", "x", "bio", null, 3, 0, 0, 1, 0],
    ["social_referrer", "instagram", null, null, 2, 1, 1, 1, 1],
    ["social_referrer", "x", null, null, 1, 0, 0, 0, 0],
    ["utm", "x", "post", "chasing-losses", 1, 0, 0, 0, 0],
    // A click or Programme start whose visit began before the range still counts in the range it happened.
    ["utm", "facebook", "post", "old-post", 0, 1, 1, 1, 0],
  ]);
  // "X" and "x" are one source; countries are ordered by sessions, unknown last on ties.
  assert.deepEqual(result.rows[0]?.topCountries, [{ countryCode: "GB", sessions: 4 }, { countryCode: "SE", sessions: 2 }]);
  assert.deepEqual(result.rows[1]?.topCountries, [{ countryCode: "GB", sessions: 5 }, { countryCode: null, sessions: 1 }]);
  // Programme starts carry the country of the credited visit: "X" and "x" merge, and a start is one visitor.
  assert.deepEqual(result.rows[0]?.programmeStartCountries, [{ countryCode: "SE", starts: 2 }, { countryCode: "GB", starts: 1 }]);
  assert.deepEqual(result.rows[1]?.programmeStartCountries, []);
  assert.deepEqual(result.rows[2]?.programmeStartCountries, [{ countryCode: null, starts: 1 }]);
  assert.deepEqual(result.rows[6]?.programmeStartCountries, [{ countryCode: "DK", starts: 1 }]);
  // Non-social referrers (search, the site itself) are not social traffic.
  assert.deepEqual(result.totals, { rows: 7, sessions: 19, outboundClicks: 5, partnerClicks: 4, programmeStarts: 6, stepOneCompletions: 2 });
  // Site-wide Programme counters also hold the starts no social visit can be credited with.
  assert.deepEqual(result.site, siteWithProgramme);
  assert.equal(result.omittedRows, 0);
  assert.equal(result.filter.utmSource, null);
  assert.deepEqual(result.notes, [...SOCIAL_TRAFFIC_NOTES]);
  assert.ok(result.notes.some((note) => /allowed analytics cookies/.test(note)));
  assert.ok(result.notes.some((note) => /Only visitors who allowed analytics cookies are counted, each visitor once per range/.test(note)));
  assert.ok(result.notes.some((note) => /attributed to the visitor's latest social visit .* within 30 days before the event/.test(note)));
  assert.ok(result.notes.some((note) => /appear only in site\.programmeStarts and site\.stepOneCompletions/.test(note)));
  assert.equal(SOCIAL_TRAFFIC_PROGRAMME_ATTRIBUTION_DAYS, 30);
});

test("coarser grains merge campaigns and posts, and the limit trims rows but not totals", async () => {
  const bySource = await readSocialTraffic({ groupBy: "source" }, store().value, NOW);
  assert.deepEqual(bySource.rows.map((row) => [row.channel, row.utmSource ?? row.referrerNetwork, row.utmCampaign, row.utmContent, row.sessions, row.outboundClicks, row.programmeStarts, row.stepOneCompletions]), [
    ["utm", "x", null, null, 10, 2, 4, 1],
    ["utm", "instagram", null, null, 6, 1, 0, 0],
    ["social_referrer", "instagram", null, null, 2, 1, 1, 1],
    ["social_referrer", "x", null, null, 1, 0, 0, 0],
    ["utm", "facebook", null, null, 0, 1, 1, 0],
  ]);
  assert.deepEqual(bySource.rows[0]?.topCountries, [{ countryCode: "GB", sessions: 7 }, { countryCode: "SE", sessions: 2 }, { countryCode: "DK", sessions: 1 }]);
  // At most three countries, by starts, unknown last on ties.
  assert.deepEqual(bySource.rows[0]?.programmeStartCountries, [{ countryCode: "SE", starts: 2 }, { countryCode: "GB", starts: 1 }, { countryCode: null, starts: 1 }]);

  const byCampaign = await readSocialTraffic({ groupBy: "source_campaign", limit: 2 }, store().value, NOW);
  assert.deepEqual(byCampaign.rows.map((row) => [row.utmSource, row.utmCampaign, row.utmContent, row.sessions]), [
    ["x", "post", null, 7],
    ["instagram", "bio", null, 6],
  ]);
  assert.equal(byCampaign.omittedRows, 4);
  assert.deepEqual(byCampaign.totals, { rows: 6, sessions: 19, outboundClicks: 5, partnerClicks: 4, programmeStarts: 6, stepOneCompletions: 2 });
  assert.deepEqual(byCampaign.site, siteWithProgramme);
});

test("a utmSource filter keeps that source's tagged rows and its network's untagged referrer visits", async () => {
  const instagram = await readSocialTraffic({ utmSource: "Instagram" }, store().value, NOW);
  assert.equal(instagram.filter.utmSource, "instagram");
  assert.deepEqual(instagram.rows.map((row) => [row.channel, row.utmSource, row.referrerNetwork, row.sessions, row.outboundClicks, row.programmeStarts, row.stepOneCompletions]), [
    ["utm", "instagram", null, 6, 1, 0, 0],
    ["social_referrer", null, "instagram", 2, 1, 1, 1],
  ]);
  assert.deepEqual(instagram.totals, { rows: 2, sessions: 8, outboundClicks: 2, partnerClicks: 2, programmeStarts: 1, stepOneCompletions: 1 });
  // Site totals stay site-wide so the agent can see its share.
  assert.deepEqual(instagram.site, siteWithProgramme);

  const lana = await readSocialTraffic({ utmSource: "lana" }, store().value, NOW);
  assert.deepEqual([lana.rows, lana.totals], [[], { rows: 0, sessions: 0, outboundClicks: 0, partnerClicks: 0, programmeStarts: 0, stepOneCompletions: 0 }]);
  assert.deepEqual(lana.site, siteWithProgramme);
});

test("the output carries counts only and no per-person value", async () => {
  const result = await readSocialTraffic({}, store().value, NOW);
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /anonymousId|userId|analyticsSessionId|"id"|email|\bip\b|referrerHost|l\.instagram\.com|t\.co/i);
  for (const row of result.rows) {
    assert.deepEqual(Object.keys(row).sort(), ["channel", "outboundClicks", "partnerClicks", "programmeStartCountries", "programmeStarts", "referrerNetwork", "sessions", "stepOneCompletions", "topCountries", "utmCampaign", "utmContent", "utmSource"]);
    for (const country of row.programmeStartCountries) assert.deepEqual(Object.keys(country).sort(), ["countryCode", "starts"]);
  }
  assert.deepEqual(Object.keys(result.totals).sort(), ["outboundClicks", "partnerClicks", "programmeStarts", "rows", "sessions", "stepOneCompletions"]);
  assert.deepEqual(Object.keys(result.site).sort(), ["outboundClicks", "outboundClicksWithoutConsent", "partnerClicks", "programmeStarts", "sessions", "stepOneCompletions"]);
  // The published output contract has no place for a per-person value either.
  assert.doesNotMatch(JSON.stringify(socialTrafficTool.outputSchema), /anonymousId|userId|visitor"|analyticsSessionId|sessionId|dedupeKey|occurredAt|startedAt|referrerHost|email/i);
});

// Programme starts and first-step completions: one count per visitor, credited to a visit.

const VISITOR_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const VISITOR_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const VISITOR_C = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const EVENT_AT = new Date("2026-10-02T12:00:00.000Z");
const HOUR_MS = 3_600_000;
const DAY = 24 * HOUR_MS;

function observed(kind: SocialTrafficProgrammeObservation["kind"], visitor: string | null, occurredAt: Date = EVENT_AT): SocialTrafficProgrammeObservation {
  return { kind, visitor, occurredAt };
}

function visit(
  visitor: string,
  beforeEventMs: number,
  touch: { utmSource?: string; utmCampaign?: string; utmContent?: string; referrerHost?: string },
  countryCode: string | null = "GB",
): SocialTrafficVisitorSession {
  return {
    visitor,
    startedAt: new Date(EVENT_AT.getTime() - beforeEventMs),
    countryCode,
    utmSource: touch.utmSource ?? null,
    utmCampaign: touch.utmCampaign ?? null,
    utmContent: touch.utmContent ?? null,
    referrerHost: touch.referrerHost ?? null,
  };
}

test("a Programme start is credited to the visitor's latest social visit before it, and to that visit's country", () => {
  const events = attributeProgrammeEvents([observed("started", VISITOR_A)], [
    visit(VISITOR_A, 10 * DAY, { utmSource: "facebook", utmCampaign: "post", utmContent: "older-post" }, "SE"),
    visit(VISITOR_A, 2 * DAY, { referrerHost: "l.instagram.com" }, "DK"),
    // Later visits that are not social (search, the site itself, direct) do not take the credit away.
    visit(VISITOR_A, DAY, { referrerHost: "www.google.com" }, "GB"),
    visit(VISITOR_A, HOUR_MS, { referrerHost: "b4gamble.com" }, "GB"),
    visit(VISITOR_A, HOUR_MS / 2, {}, "GB"),
    // A visit that began after the event cannot have led to it.
    visit(VISITOR_A, -HOUR_MS, { utmSource: "x", utmCampaign: "post", utmContent: "too-late" }, "NO"),
    // Another visitor's social visit is never borrowed.
    visit(VISITOR_B, HOUR_MS, { utmSource: "x", utmCampaign: "post", utmContent: "someone-else" }, "FI"),
  ]);
  assert.deepEqual(events, [{
    kind: "started",
    visit: { utmSource: null, utmCampaign: null, utmContent: null, referrerHost: "l.instagram.com", countryCode: "DK" },
  }]);

  // A visit that began at the very moment of the event counts; the analytics ID matches in any letter case.
  assert.deepEqual(attributeProgrammeEvents([observed("step_one_completed", VISITOR_A.toUpperCase())], [
    visit(VISITOR_A, 5 * DAY, { utmSource: "facebook" }, "SE"),
    visit(VISITOR_A, 0, { utmSource: "threads", utmCampaign: "bio" }, "DE"),
  ]), [{
    kind: "step_one_completed",
    visit: { utmSource: "threads", utmCampaign: "bio", utmContent: null, referrerHost: null, countryCode: "DE" },
  }]);
});

test("the credit window is 30 days; an event with no social visit in it is credited to none", () => {
  const facebook = { utmSource: "facebook", utmCampaign: "post", utmContent: "month-old" };
  const window = SOCIAL_TRAFFIC_PROGRAMME_ATTRIBUTION_DAYS * DAY;
  // Exactly 30 days before is still inside; one millisecond more is not.
  assert.deepEqual(attributeProgrammeEvents([observed("started", VISITOR_A)], [visit(VISITOR_A, window, facebook, "SE")])[0]?.visit?.countryCode, "SE");
  assert.deepEqual(attributeProgrammeEvents([observed("started", VISITOR_A)], [visit(VISITOR_A, window + 1, facebook, "SE")]), [{ kind: "started", visit: null }]);
  // The window is measured from each event, not from the range.
  assert.deepEqual(attributeProgrammeEvents([
    observed("started", VISITOR_A, new Date(EVENT_AT.getTime() - 2 * DAY)),
    observed("step_one_completed", VISITOR_A, new Date(EVENT_AT.getTime() + DAY)),
  ], [visit(VISITOR_A, window, facebook, "SE")]).map((event) => [event.kind, event.visit?.utmSource ?? null]), [
    ["started", "facebook"],
    ["step_one_completed", null],
  ]);
  // No visit at all, only non-social visits, or no analytics ID: counted, credited to none.
  assert.deepEqual(attributeProgrammeEvents([
    observed("started", VISITOR_A),
    observed("started", VISITOR_B),
    observed("started", null),
  ], [
    visit(VISITOR_B, HOUR_MS, { referrerHost: "www.google.com" }),
    visit(VISITOR_B, 2 * HOUR_MS, {}),
  ]), [{ kind: "started", visit: null }, { kind: "started", visit: null }, { kind: "started", visit: null }]);
});

test("a visitor's start is counted once although it is observed while anonymous and again with the account", () => {
  const events = attributeProgrammeEvents([
    // The enrolment observation arrives first in the list but happened later.
    observed("started", VISITOR_A, new Date(EVENT_AT.getTime() + 3 * HOUR_MS)),
    observed("started", VISITOR_A, EVENT_AT),
    observed("step_one_completed", VISITOR_A, new Date(EVENT_AT.getTime() + 3 * HOUR_MS)),
    observed("step_one_completed", VISITOR_A.toUpperCase(), new Date(EVENT_AT.getTime() + 4 * HOUR_MS)),
    observed("started", VISITOR_B, new Date(EVENT_AT.getTime() + HOUR_MS)),
    // Enrolment observations without an analytics ID are already one row per enrolment.
    observed("started", null, new Date(EVENT_AT.getTime() + 5 * HOUR_MS)),
    observed("started", null, new Date(EVENT_AT.getTime() + 6 * HOUR_MS)),
  ], [
    visit(VISITOR_A, HOUR_MS, { utmSource: "facebook", utmCampaign: "post", utmContent: "led-to-the-start" }, "SE"),
    // Between the anonymous and the account observation: the earliest observation decides the credit.
    visit(VISITOR_A, -2 * HOUR_MS, { utmSource: "instagram", utmCampaign: "bio" }, "GB"),
    visit(VISITOR_B, -HOUR_MS / 2, { utmSource: "x", utmCampaign: "post", utmContent: "another-post" }, "DK"),
  ]);
  assert.deepEqual(events.map((event) => [event.kind, event.visit?.utmSource ?? null, event.visit?.countryCode ?? null]), [
    ["started", "facebook", "SE"],
    ["started", "x", "DK"],
    // The first step was completed after the Instagram visit, so that visit is its latest social one.
    ["step_one_completed", "instagram", "GB"],
    ["started", null, null],
    ["started", null, null],
  ]);
  // Only a kind, a touch and a country come out: no analytics ID and no time.
  for (const event of events) {
    assert.deepEqual(Object.keys(event).sort(), ["kind", "visit"]);
    if (event.visit) assert.deepEqual(Object.keys(event.visit).sort(), ["countryCode", "referrerHost", "utmCampaign", "utmContent", "utmSource"]);
  }
  assert.doesNotMatch(JSON.stringify(events), /aaaaaaaa|bbbbbbbb|visitor|occurredAt|startedAt|2026-/i);
});

test("the report counts attributed Programme events per row and every counted event site-wide, with no identifier", async () => {
  const programmeEvents = attributeProgrammeEvents([
    observed("started", VISITOR_A),
    observed("started", VISITOR_A, new Date(EVENT_AT.getTime() + HOUR_MS)),
    observed("step_one_completed", VISITOR_A, new Date(EVENT_AT.getTime() + HOUR_MS)),
    observed("started", VISITOR_B),
    observed("started", VISITOR_C),
    observed("started", null),
  ], [
    visit(VISITOR_A, HOUR_MS, { utmSource: "Facebook", utmCampaign: "post", utmContent: "sweden-post" }, "SE"),
    visit(VISITOR_B, 3 * DAY, { referrerHost: "l.facebook.com" }, "SE"),
    visit(VISITOR_C, 40 * DAY, { utmSource: "facebook", utmCampaign: "post", utmContent: "sweden-post" }, "SE"),
  ]);
  const result = await readSocialTraffic({ groupBy: "source" }, store({
    sessionGroups: async () => [session("facebook", "post", "sweden-post", 20, "SE")],
    attributedClicks: async () => [],
    programmeEvents: async () => programmeEvents,
  }).value, NOW);
  assert.deepEqual(socialTrafficResultSchema.parse(result), result);
  assert.deepEqual(result.rows.map((row) => [row.channel, row.utmSource ?? row.referrerNetwork, row.sessions, row.programmeStarts, row.stepOneCompletions, row.programmeStartCountries]), [
    ["utm", "facebook", 20, 1, 1, [{ countryCode: "SE", starts: 1 }]],
    // An untagged Facebook visit before the range: a row with a start and no session in the range.
    ["social_referrer", "facebook", 0, 1, 0, [{ countryCode: "SE", starts: 1 }]],
  ]);
  assert.deepEqual(result.totals, { rows: 2, sessions: 20, outboundClicks: 0, partnerClicks: 0, programmeStarts: 2, stepOneCompletions: 1 });
  // Four visitors started: two more had no social visit within 30 days, so they appear only here.
  assert.deepEqual(result.site, { ...siteTotals, programmeStarts: 4, stepOneCompletions: 1 });
  assert.doesNotMatch(JSON.stringify(result), /aaaaaaaa|bbbbbbbb|cccccccc|visitor"|anonymousId|userId|l\.facebook\.com/i);

  // The source filter keeps the tagged row and that network's untagged row; site totals stay site-wide.
  const only = (utmSource: string) => readSocialTraffic({ utmSource }, store({
    sessionGroups: async () => [],
    attributedClicks: async () => [],
    programmeEvents: async () => programmeEvents,
  }).value, NOW);
  const facebook = await only("facebook");
  assert.deepEqual(facebook.rows.map((row) => [row.channel, row.programmeStarts, row.stepOneCompletions]), [["social_referrer", 1, 0], ["utm", 1, 1]]);
  assert.deepEqual([facebook.totals.programmeStarts, facebook.totals.stepOneCompletions, facebook.site.programmeStarts], [2, 1, 4]);
  const x = await only("x");
  assert.deepEqual([x.rows, x.totals.programmeStarts, x.site.programmeStarts], [[], 0, 4]);
});

test("read failures are retryable and never leak connection details; oversize results fail closed", async () => {
  const broken = store({ siteTotals: async () => { throw new Error("connect ECONNREFUSED postgres://secret@db"); } });
  await assert.rejects(readSocialTraffic({}, broken.value, NOW), (error: unknown) => error instanceof SocialTrafficError
    && error.code === "TRAFFIC_UNAVAILABLE" && error.retryable && !/secret|postgres/.test(error.message));
  const brokenProgramme = store({ programmeEvents: async () => { throw new Error("connect ECONNREFUSED postgres://secret@db"); } });
  await assert.rejects(readSocialTraffic({}, brokenProgramme.value, NOW), (error: unknown) => error instanceof SocialTrafficError
    && error.code === "TRAFFIC_UNAVAILABLE" && error.retryable && !/secret|postgres/.test(error.message));
  const oversize = store({ attributedClicks: async () => { throw new SocialTrafficError("RESULT_TOO_LARGE", "Too many partner clicks."); } });
  await rejectsWith(readSocialTraffic({}, oversize.value, NOW), "RESULT_TOO_LARGE");
  const oversizeProgramme = store({ programmeEvents: async () => { throw new SocialTrafficError("RESULT_TOO_LARGE", "Too many Programme starts."); } });
  await rejectsWith(readSocialTraffic({}, oversizeProgramme.value, NOW), "RESULT_TOO_LARGE");
});

test("the Prisma store reads only Production human rows over indexed columns and never writes", () => {
  const source = readFileSync("lib/analytics/social-traffic.server.ts", "utf8");
  assert.match(source, /const productionHuman = \{ environment: "PRODUCTION", trafficKind: "HUMAN" \} as const;/);
  assert.match(source, /startedAt: \{ gte: from, lt: until \}/);
  assert.match(source, /attemptedAt: \{ gte: from, lt: until \}/);
  assert.match(source, /prisma\.analyticsSession\.groupBy\(/);
  assert.match(source, /take: SOCIAL_TRAFFIC_MAX_SESSION_GROUPS \+ 1/);
  assert.match(source, /take: SOCIAL_TRAFFIC_MAX_ATTRIBUTED_CLICKS \+ 1/);
  assert.match(source, /socialTrafficResultSchema\.parse/);
  assert.doesNotMatch(source, /\.create\(|\.update\(|\.upsert\(|\.delete\(|deleteMany|updateMany|createMany|\$transaction|\$executeRaw|\$queryRaw/);
  assert.doesNotMatch(source, /userId|landingPath|deviceCategory|email: true/);
  // Every read, the Programme ones included, carries the Production human filter.
  const reads = source.match(/prisma\.\w+\.(?:findMany|findFirst|findUnique|groupBy|count|aggregate)\(/g) ?? [];
  assert.equal(reads.length, 7);
  assert.equal((source.match(/\.\.\.productionHuman/g) ?? []).length, reads.length);
  // Programme starts and first-step completions: bounded reads of the range, then of those visitors' visits.
  assert.match(source, /occurredAt: \{ gte: from, lt: until \}/);
  assert.match(source, /\{ type: "PROGRAMME_STARTED" \},\s+\{ type: "PROGRAMME_STEP_COMPLETED", programmeStep: FIRST_STEP_MISSION_NUMBER \}/);
  assert.match(source, /const FIRST_STEP_MISSION_NUMBER = programmeJourney\[0\];/);
  assert.equal(programmeJourney[0], 1);
  assert.match(source, /select: \{ type: true, occurredAt: true, anonymousId: true \}/);
  assert.match(source, /take: SOCIAL_TRAFFIC_MAX_PROGRAMME_EVENTS \+ 1/);
  assert.match(source, /take: SOCIAL_TRAFFIC_MAX_PROGRAMME_SESSIONS \+ 1/);
  assert.match(source, /startedAt: \{ gte: new Date\(from\.getTime\(\) - SOCIAL_TRAFFIC_PROGRAMME_ATTRIBUTION_DAYS \* DAY_MS\), lt: until \}/);
  // The analytics ID is read only to match a Programme event to a visit, inside that one store method.
  const programmeRead = /\n  async programmeEvents\(\{ from, until \}\) \{\n[\s\S]*?\n  \},\n/.exec(source)?.[0] ?? "";
  assert.match(programmeRead, /anonymousId: \{ in: visitors \}/);
  assert.match(programmeRead, /return attributeProgrammeEvents\(/);
  assert.doesNotMatch(source.replace(programmeRead, ""), /anonymousId/);
  // No offer, ranking or route reads these numbers. Two readers only: the Learn MCP tool, and the
  // creators' named page (Founder, 13 October 2026), which shows two counts of its own tag and
  // nothing else; tests/for-creators.test.ts pins that call and keeps the page free of anything commercial.
  const importers = ["app", "components", "lib"].flatMap((root) => (readdirSync(root, { recursive: true }) as string[])
    .filter((file) => /\.(?:ts|tsx|mjs)$/.test(file))
    .map((file) => `${root}/${file}`)
    .filter((file) => readFileSync(file, "utf8").includes("analytics/social-traffic.server")));
  assert.deepEqual(importers, ["app/(public)/for-creators/[creator]/page.tsx", "lib/mcp/learn/server.ts"]);
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
  assert.match(packageJson.scripts["learn-content-orchestrator:test"] ?? "", /tests\/social-traffic\.test\.ts/);
  assert.match(packageJson.scripts["learn-content-orchestrator:postgres-test"] ?? "", /tests\/social-traffic-postgres\.test\.ts/);
  assert.match(packageJson.scripts["ci:quality"] ?? "", /npm run learn-content-orchestrator:test/);
});

test("the server publisher still accepts the Learn MCP surface with social_traffic and programme_funnel and calls only learn_apply", () => {
  assert.equal(learnMcpToolSurfaceIsExpected(["learn_context", "learn_source", "social_traffic", "programme_funnel", "learn_apply"]), true);
  assert.equal(learnMcpToolSurfaceIsExpected(["social_traffic"]), false);
  assert.equal(learnMcpToolSurfaceIsExpected(["social_traffic", "learn_apply", "social_traffic_write"]), false);
  const publisher = readFileSync("lib/learn-content-orchestrator/mcp-publisher.server.ts", "utf8");
  assert.deepEqual(publisher.match(/name: "[a-z_]+"/g), ['name: "learn_apply"']);
});

// MCP surface.

async function connected(readTraffic: (input: unknown) => Promise<unknown>) {
  let applyCalls = 0;
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createLearnMcpServer(
    { apply: async () => { applyCalls += 1; throw new Error("social_traffic must never reach learn_apply"); } },
    async () => { throw new Error("learn_context is not used here"); },
    async () => { throw new Error("learn_source is not used here"); },
    readTraffic as never,
  );
  const client = new Client({ name: "social-traffic-test", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return {
    client,
    applyCalls: () => applyCalls,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}

test("MCP discovery lists social_traffic as a read-only tool beside the Learn tools", async () => {
  const session = await connected((input) => readSocialTraffic(input, store().value, NOW));
  try {
    const discovered = await session.client.listTools();
    assert.deepEqual(discovered.tools.map((tool) => tool.name), ["learn_context", "learn_source", "social_traffic", "programme_funnel", "learn_apply"]);
    const tool = discovered.tools.find((candidate) => candidate.name === "social_traffic");
    assert.deepEqual(tool?.annotations, { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });
    assert.deepEqual(discovered.tools.filter((candidate) => candidate.annotations?.readOnlyHint !== true).map((candidate) => candidate.name), ["learn_apply"]);
    assert.equal(socialTrafficTool.inputSchema.additionalProperties, false);
    assert.equal(socialTrafficTool.inputSchema.required, undefined);
    // The description tells a reader what the Programme numbers mean.
    assert.match(tool?.description ?? "", /programmeStarts/);
    assert.match(tool?.description ?? "", /stepOneCompletions/);
    assert.match(tool?.description ?? "", /only visitors who allowed analytics cookies are counted/);
    assert.match(tool?.description ?? "", /attributed to the visitor's latest social visit within 30 days before the event/);
  } finally {
    await session.close();
  }
});

test("MCP social_traffic returns schema-valid aggregates, maps errors and never calls learn_apply", async () => {
  const session = await connected((input) => readSocialTraffic(input, store().value, NOW));
  try {
    const ok = await session.client.callTool({ name: "social_traffic", arguments: { groupBy: "source", utmSource: "x" } });
    assert.equal(ok.isError, undefined);
    const structured = socialTrafficResultSchema.parse(ok.structuredContent);
    assert.deepEqual(structured.rows.map((row) => [row.channel, row.utmSource, row.referrerNetwork, row.sessions]), [
      ["utm", "x", null, 10],
      ["social_referrer", null, "x", 1],
    ]);
    const invalid = await session.client.callTool({ name: "social_traffic", arguments: { userId: "someone" } });
    assert.equal(invalid.isError, true);
    assert.deepEqual((invalid.structuredContent as { error: { code: string; retryable: boolean } }).error, {
      code: "INVALID_INPUT",
      message: "social_traffic accepts only { from?, to?, utmSource?, groupBy?, limit? } as described in its input schema.",
      retryable: false,
    });
    assert.equal(session.applyCalls(), 0);
  } finally {
    await session.close();
  }

  const failing = await connected(async () => { throw new Error("socket hang up at postgres://secret"); });
  try {
    const failed = await failing.client.callTool({ name: "social_traffic", arguments: {} });
    assert.equal(failed.isError, true);
    const error = (failed.structuredContent as { error: { code: string; message: string; retryable: boolean } }).error;
    assert.deepEqual([error.code, error.retryable], ["TRAFFIC_UNAVAILABLE", true]);
    assert.doesNotMatch(error.message, /secret|postgres/);
  } finally {
    await failing.close();
  }
});

test("HTTP social_traffic sits behind the Learn service bearer and answers private, no-store", async (context) => {
  const keys = ["LEARN_MCP_ENABLED", "LEARN_MCP_SERVICE_TOKEN", "LEARN_MCP_ACTOR_ID"] as const;
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  context.after(() => {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    clearLearnMcpRateLimitsForTests();
  });
  clearLearnMcpRateLimitsForTests();
  const token = "social-traffic-service-token-with-more-than-32-bytes";
  Object.assign(process.env, {
    LEARN_MCP_ENABLED: "true",
    LEARN_MCP_SERVICE_TOKEN: token,
    LEARN_MCP_ACTOR_ID: "33333333-3333-4333-8333-333333333333",
  });
  // An invalid argument is rejected before any database read, so no database is needed here.
  const call = (headers: Record<string, string>) => handleLearnMcpPost(new Request("https://b4gamble.com/api/mcp/learn", {
    method: "POST",
    headers: { accept: "application/json, text/event-stream", "content-type": "application/json", ...headers },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "social_traffic", arguments: { groupBy: "visitor" } } }),
  }));

  assert.equal((await call({})).status, 401);
  assert.equal((await call({ authorization: "Bearer wrong-token-with-more-than-thirty-two-bytes" })).status, 401);
  const authorized = await call({ authorization: `Bearer ${token}` });
  assert.equal(authorized.status, 200);
  assert.match(authorized.headers.get("cache-control") ?? "", /private, no-store/);
  const payload = await authorized.json() as { result?: { isError?: boolean; structuredContent?: { error?: { code?: string } } } };
  assert.equal(payload.result?.isError, true);
  assert.equal(payload.result?.structuredContent?.error?.code, "INVALID_INPUT");
});
