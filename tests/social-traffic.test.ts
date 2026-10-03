import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import {
  readSocialTraffic,
  resolveSocialTrafficRange,
  SOCIAL_TRAFFIC_MAX_DAYS,
  SocialTrafficError,
  socialReferrerNetwork,
  socialTrafficResultSchema,
  type SocialTrafficClick,
  type SocialTrafficRange,
  type SocialTrafficSessionGroup,
  type SocialTrafficStore,
} from "@/lib/analytics/social-traffic.server";
import { learnMcpToolSurfaceIsExpected } from "@/lib/learn-content-orchestrator/mcp-publisher.server";
import { handleLearnMcpPost } from "@/lib/mcp/learn/post-handler";
import { clearLearnMcpRateLimitsForTests } from "@/lib/mcp/learn/rate-limit";
import { createLearnMcpServer, socialTrafficTool } from "@/lib/mcp/learn/server";

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

const siteTotals = { sessions: 61, outboundClicks: 11, partnerClicks: 8, outboundClicksWithoutConsent: 5 };

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

test("default grain gives one row per source, campaign and post, with clicks credited to the visit's tags", async () => {
  const fake = store();
  const result = await readSocialTraffic(undefined, fake.value, NOW);
  assert.deepEqual(socialTrafficResultSchema.parse(result), result);
  assert.equal(result.groupBy, "source_campaign_content");
  assert.deepEqual(fake.ranges.map((range) => [range.from.toISOString(), range.until.toISOString()]), Array(3).fill(["2026-09-26T12:00:00.000Z", "2026-10-03T12:00:00.000Z"]));
  assert.deepEqual(result.range, { from: "2026-09-26T12:00:00.000Z", to: "2026-10-03T12:00:00.000Z", days: 7 });

  const summary = result.rows.map((row) => [row.channel, row.utmSource ?? row.referrerNetwork, row.utmCampaign, row.utmContent, row.sessions, row.outboundClicks, row.partnerClicks]);
  assert.deepEqual(summary, [
    ["utm", "x", "post", "spin-regret", 6, 2, 1],
    ["utm", "instagram", "bio", "link_in_bio", 6, 1, 1],
    ["utm", "x", "bio", null, 3, 0, 0],
    ["social_referrer", "instagram", null, null, 2, 1, 1],
    ["social_referrer", "x", null, null, 1, 0, 0],
    ["utm", "x", "post", "chasing-losses", 1, 0, 0],
    // A click whose visit started before the range still counts in the range it happened.
    ["utm", "facebook", "post", "old-post", 0, 1, 1],
  ]);
  // "X" and "x" are one source; countries are ordered by sessions, unknown last on ties.
  assert.deepEqual(result.rows[0]?.topCountries, [{ countryCode: "GB", sessions: 4 }, { countryCode: "SE", sessions: 2 }]);
  assert.deepEqual(result.rows[1]?.topCountries, [{ countryCode: "GB", sessions: 5 }, { countryCode: null, sessions: 1 }]);
  // Non-social referrers (search, the site itself) are not social traffic.
  assert.deepEqual(result.totals, { rows: 7, sessions: 19, outboundClicks: 5, partnerClicks: 4 });
  assert.deepEqual(result.site, siteTotals);
  assert.equal(result.omittedRows, 0);
  assert.equal(result.filter.utmSource, null);
  assert.ok(result.notes.some((note) => /allowed analytics cookies/.test(note)));
});

test("coarser grains merge campaigns and posts, and the limit trims rows but not totals", async () => {
  const bySource = await readSocialTraffic({ groupBy: "source" }, store().value, NOW);
  assert.deepEqual(bySource.rows.map((row) => [row.channel, row.utmSource ?? row.referrerNetwork, row.utmCampaign, row.utmContent, row.sessions, row.outboundClicks]), [
    ["utm", "x", null, null, 10, 2],
    ["utm", "instagram", null, null, 6, 1],
    ["social_referrer", "instagram", null, null, 2, 1],
    ["social_referrer", "x", null, null, 1, 0],
    ["utm", "facebook", null, null, 0, 1],
  ]);
  assert.deepEqual(bySource.rows[0]?.topCountries, [{ countryCode: "GB", sessions: 7 }, { countryCode: "SE", sessions: 2 }, { countryCode: "DK", sessions: 1 }]);

  const byCampaign = await readSocialTraffic({ groupBy: "source_campaign", limit: 2 }, store().value, NOW);
  assert.deepEqual(byCampaign.rows.map((row) => [row.utmSource, row.utmCampaign, row.utmContent, row.sessions]), [
    ["x", "post", null, 7],
    ["instagram", "bio", null, 6],
  ]);
  assert.equal(byCampaign.omittedRows, 4);
  assert.deepEqual(byCampaign.totals, { rows: 6, sessions: 19, outboundClicks: 5, partnerClicks: 4 });
});

test("a utmSource filter keeps that source's tagged rows and its network's untagged referrer visits", async () => {
  const instagram = await readSocialTraffic({ utmSource: "Instagram" }, store().value, NOW);
  assert.equal(instagram.filter.utmSource, "instagram");
  assert.deepEqual(instagram.rows.map((row) => [row.channel, row.utmSource, row.referrerNetwork, row.sessions, row.outboundClicks]), [
    ["utm", "instagram", null, 6, 1],
    ["social_referrer", null, "instagram", 2, 1],
  ]);
  assert.deepEqual(instagram.totals, { rows: 2, sessions: 8, outboundClicks: 2, partnerClicks: 2 });
  // Site totals stay site-wide so the agent can see its share.
  assert.deepEqual(instagram.site, siteTotals);

  const lana = await readSocialTraffic({ utmSource: "lana" }, store().value, NOW);
  assert.deepEqual([lana.rows, lana.totals], [[], { rows: 0, sessions: 0, outboundClicks: 0, partnerClicks: 0 }]);
});

test("the output carries counts only and no per-person value", async () => {
  const result = await readSocialTraffic({}, store().value, NOW);
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /anonymousId|userId|analyticsSessionId|"id"|email|\bip\b|referrerHost|l\.instagram\.com|t\.co/i);
  for (const row of result.rows) {
    assert.deepEqual(Object.keys(row).sort(), ["channel", "outboundClicks", "partnerClicks", "referrerNetwork", "sessions", "topCountries", "utmCampaign", "utmContent", "utmSource"]);
  }
});

test("read failures are retryable and never leak connection details; oversize results fail closed", async () => {
  const broken = store({ siteTotals: async () => { throw new Error("connect ECONNREFUSED postgres://secret@db"); } });
  await assert.rejects(readSocialTraffic({}, broken.value, NOW), (error: unknown) => error instanceof SocialTrafficError
    && error.code === "TRAFFIC_UNAVAILABLE" && error.retryable && !/secret|postgres/.test(error.message));
  const oversize = store({ attributedClicks: async () => { throw new SocialTrafficError("RESULT_TOO_LARGE", "Too many partner clicks."); } });
  await rejectsWith(readSocialTraffic({}, oversize.value, NOW), "RESULT_TOO_LARGE");
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
  assert.doesNotMatch(source, /anonymousId|userId|landingPath|deviceCategory|email: true/);
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
  assert.match(packageJson.scripts["learn-content-orchestrator:test"] ?? "", /tests\/social-traffic\.test\.ts/);
  assert.match(packageJson.scripts["learn-content-orchestrator:postgres-test"] ?? "", /tests\/social-traffic-postgres\.test\.ts/);
  assert.match(packageJson.scripts["ci:quality"] ?? "", /npm run learn-content-orchestrator:test/);
});

test("the server publisher still accepts the Learn MCP surface with social_traffic and calls only learn_apply", () => {
  assert.equal(learnMcpToolSurfaceIsExpected(["learn_context", "learn_source", "social_traffic", "learn_apply"]), true);
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
    assert.deepEqual(discovered.tools.map((tool) => tool.name), ["learn_context", "learn_source", "social_traffic", "learn_apply"]);
    const tool = discovered.tools.find((candidate) => candidate.name === "social_traffic");
    assert.deepEqual(tool?.annotations, { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });
    assert.deepEqual(discovered.tools.filter((candidate) => candidate.annotations?.readOnlyHint !== true).map((candidate) => candidate.name), ["learn_apply"]);
    assert.equal(socialTrafficTool.inputSchema.additionalProperties, false);
    assert.equal(socialTrafficTool.inputSchema.required, undefined);
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
