import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import {
  aggregateProgrammeFunnel,
  PROGRAMME_FUNNEL_MAX_DAYS,
  PROGRAMME_FUNNEL_MAX_ROWS,
  PROGRAMME_FUNNEL_MINIMUM_CELL,
  PROGRAMME_FUNNEL_NOTES,
  ProgrammeFunnelError,
  programmeFunnelResultSchema,
  readProgrammeFunnel,
  resolveProgrammeFunnelRange,
  withholdSmallCells,
  type ProgrammeFunnelGroup,
  type ProgrammeFunnelMetric,
  type ProgrammeFunnelRange,
  type ProgrammeFunnelStore,
} from "@/lib/analytics/programme-funnel.server";
import { learnMcpToolSurfaceIsExpected } from "@/lib/learn-content-orchestrator/mcp-publisher.server";
import { handleLearnMcpPost } from "@/lib/mcp/learn/post-handler";
import { clearLearnMcpRateLimitsForTests } from "@/lib/mcp/learn/rate-limit";
import { createLearnMcpServer, programmeFunnelTool } from "@/lib/mcp/learn/server";
import { missionStep, programmeJourney } from "@/lib/programme/program-ai/mission-registry";

const NOW = new Date("2026-10-19T06:00:00.000Z");

function group(
  metric: ProgrammeFunnelMetric,
  count: number,
  signupCountryCode: string | null,
  signupUtmSource: string | null,
  signupSource: string | null = null,
): ProgrammeFunnelGroup {
  return { metric, count, signupCountryCode, signupUtmSource, signupSource };
}

const seeded = {
  accountsCreated: [
    group("accountsCreated", 6, "SE", "facebook"),
    group("accountsCreated", 4, "SE", "Facebook"),
    group("accountsCreated", 5, "DK", "lana"),
    group("accountsCreated", 3, "DK", null, "organic_search"),
    group("accountsCreated", 2, "GB", null),
    group("accountsCreated", 1, null, "youtube"),
  ],
  programmeStarts: [
    ...Array.from({ length: 7 }, () => group("programmeStarts", 1, "SE", "facebook")),
    ...Array.from({ length: 4 }, () => group("programmeStarts", 1, "DK", "lana")),
    group("programmeStarts", 1, "GB", null),
  ],
  stepThreeCompletions: [
    ...Array.from({ length: 3 }, () => group("stepThreeCompletions", 1, "SE", "facebook")),
    group("stepThreeCompletions", 1, "DK", "lana"),
  ],
  partnerButtonPresses: [
    ...Array.from({ length: 4 }, () => group("outboundClicks", 1, "SE", "facebook")),
    ...Array.from({ length: 3 }, () => group("partnerClicks", 1, "SE", "facebook")),
  ],
};

function store(overrides: Partial<ProgrammeFunnelStore> = {}) {
  const ranges: ProgrammeFunnelRange[] = [];
  const read = (rows: ProgrammeFunnelGroup[]) => async (range: ProgrammeFunnelRange) => { ranges.push(range); return rows; };
  const value: ProgrammeFunnelStore = {
    accountsCreated: read(seeded.accountsCreated),
    programmeStarts: read(seeded.programmeStarts),
    stepThreeCompletions: read(seeded.stepThreeCompletions),
    partnerButtonPresses: read(seeded.partnerButtonPresses),
    ...overrides,
  };
  return { value, ranges };
}

async function rejectsWith(promise: Promise<unknown>, code: string) {
  await assert.rejects(promise, (error: unknown) => error instanceof ProgrammeFunnelError && error.code === code);
}

test("the range defaults to the last 7 days, takes UTC dates and date-times, and is capped", () => {
  const range = (input: { from?: string; to?: string }) => {
    const { from, until } = resolveProgrammeFunnelRange(input, NOW);
    return [from.toISOString(), until.toISOString()];
  };
  assert.deepEqual(range({}), ["2026-10-12T06:00:00.000Z", "2026-10-19T06:00:00.000Z"]);
  assert.deepEqual(range({ from: "2026-10-12", to: "2026-10-18" }), ["2026-10-12T00:00:00.000Z", "2026-10-19T00:00:00.000Z"], "a `to` date includes its whole day");
  assert.deepEqual(range({ from: "2026-10-12T00:00:00+02:00", to: "2026-10-13T00:00:00+02:00" }), ["2026-10-11T22:00:00.000Z", "2026-10-12T22:00:00.000Z"]);
  for (const input of [{ from: "2026-13-01" }, { to: "yesterday at 5" }, { from: "2026-10-19", to: "2026-10-12" }, { from: "2026-10-12T00:00:00" }]) {
    assert.throws(() => resolveProgrammeFunnelRange(input, NOW), (error: unknown) => error instanceof ProgrammeFunnelError && error.code === "INVALID_INPUT");
  }
  assert.throws(() => resolveProgrammeFunnelRange({ from: "2026-01-01", to: "2026-10-01" }, NOW), (error: unknown) => error instanceof ProgrammeFunnelError && error.code === "RANGE_TOO_LONG");
  assert.equal(PROGRAMME_FUNNEL_MAX_DAYS, 92);
});

test("invalid input is rejected before any read", async () => {
  let reads = 0;
  const counting = store({
    accountsCreated: async () => { reads += 1; return []; },
    programmeStarts: async () => { reads += 1; return []; },
    stepThreeCompletions: async () => { reads += 1; return []; },
    partnerButtonPresses: async () => { reads += 1; return []; },
  });
  for (const input of [{ userId: "someone" }, { email: "a@b.c" }, { groupBy: "user" }, { from: 20261012 }, { country: "SE" }, "x"]) {
    await rejectsWith(readProgrammeFunnel(input, counting.value, NOW), "INVALID_INPUT");
  }
  await rejectsWith(readProgrammeFunnel({ from: "2026-01-01", to: "2026-10-01" }, counting.value, NOW), "RANGE_TOO_LONG");
  assert.equal(reads, 0);
});

test("the four stages are counted by sign-up country and by sign-up source, with one- and two-person cells withheld", async () => {
  const fake = store();
  const result = await readProgrammeFunnel(undefined, fake.value, NOW);
  assert.deepEqual(programmeFunnelResultSchema.parse(result), result);
  assert.deepEqual(fake.ranges.map((range) => [range.from.toISOString(), range.until.toISOString()]), Array(4).fill(["2026-10-12T06:00:00.000Z", "2026-10-19T06:00:00.000Z"]));
  assert.deepEqual(result.range, { from: "2026-10-12T06:00:00.000Z", to: "2026-10-19T06:00:00.000Z", days: 7 });
  assert.equal(result.minimumCell, 3);

  // Totals cover every account; only a total of 1 or 2 would be withheld.
  assert.deepEqual(result.totals, { accountsCreated: 21, programmeStarts: 12, stepThreeCompletions: 4, outboundClicks: 4, partnerClicks: 3 });

  assert.deepEqual(result.byCountry, [
    // "facebook" and "Facebook" are one source and one country row.
    { signupCountry: "SE", accountsCreated: 10, programmeStarts: 7, stepThreeCompletions: null, outboundClicks: 4, partnerClicks: 3 },
    { signupCountry: "DK", accountsCreated: 8, programmeStarts: null, stepThreeCompletions: null, outboundClicks: 0, partnerClicks: 0 },
    { signupCountry: "GB", accountsCreated: null, programmeStarts: null, stepThreeCompletions: 0, outboundClicks: 0, partnerClicks: 0 },
    { signupCountry: null, accountsCreated: null, programmeStarts: 0, stepThreeCompletions: 0, outboundClicks: 0, partnerClicks: 0 },
  ]);
  // Why SE's 3 third-step completions and DK's 4 starts are withheld: each column had exactly one
  // small cell (DK 1, GB 1), and the total would have given it away, so the next smallest goes too.
  assert.deepEqual(result.bySource, [
    { signupSource: "facebook", accountsCreated: 10, programmeStarts: 7, stepThreeCompletions: null, outboundClicks: 4, partnerClicks: 3 },
    { signupSource: "lana", accountsCreated: 5, programmeStarts: null, stepThreeCompletions: null, outboundClicks: 0, partnerClicks: 0 },
    // No UTM tag: the acquisition source names the row.
    { signupSource: "organic_search", accountsCreated: 3, programmeStarts: 0, stepThreeCompletions: 0, outboundClicks: 0, partnerClicks: 0 },
    { signupSource: null, accountsCreated: null, programmeStarts: null, stepThreeCompletions: 0, outboundClicks: 0, partnerClicks: 0 },
    { signupSource: "youtube", accountsCreated: null, programmeStarts: 0, stepThreeCompletions: 0, outboundClicks: 0, partnerClicks: 0 },
  ]);
  assert.deepEqual(result.omitted, { countries: 0, sources: 0 });
  assert.deepEqual(result.notes, [...PROGRAMME_FUNNEL_NOTES]);
  assert.ok(result.notes.some((note) => /A cell of 1 or 2 is withheld \(null\)/.test(note)));
  assert.ok(result.notes.some((note) => /not a cohort/.test(note)));
  assert.ok(result.notes.some((note) => /Staff accounts are excluded/.test(note)));

  // Nothing a person could be found by: only counts, two-letter countries and source names.
  const text = JSON.stringify({ ...result, notes: [] });
  assert.doesNotMatch(text, /userId|email|anonymousId|sessionId|enrol|@/i);
});

test("no published cell is 1 or 2, and one withheld cell never stands alone in a column", () => {
  assert.equal(PROGRAMME_FUNNEL_MINIMUM_CELL, 3);
  assert.deepEqual(withholdSmallCells([10, 5, 0]), [10, 5, 0], "nothing small, nothing withheld; zero is shown");
  assert.deepEqual(withholdSmallCells([10, 5, 2]), [10, null, null], "one small cell takes the next smallest with it");
  assert.deepEqual(withholdSmallCells([10, 2, 1]), [10, null, null], "two small cells already cover each other");
  assert.deepEqual(withholdSmallCells([2, 0, 0]), [null, 0, 0], "alone in its column: the total is withheld as well, see below");
  assert.deepEqual(withholdSmallCells([]), []);

  const alone = aggregateProgrammeFunnel([group("accountsCreated", 2, "SE", "x")]);
  assert.equal(alone.totals.accountsCreated, null, "a total of 1 or 2 is withheld");
  assert.equal(alone.byCountry[0]?.accountsCreated, null);

  // Random tables: every published number is 0 or at least 3, and a column never has exactly one
  // withheld cell beside a published non-zero one.
  let seed = 7;
  const next = (bound: number) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % bound; };
  for (let round = 0; round < 200; round += 1) {
    const groups = Array.from({ length: 1 + next(12) }, () => group(
      (["accountsCreated", "programmeStarts", "stepThreeCompletions", "outboundClicks", "partnerClicks"] as const)[next(5)],
      1 + next(6),
      ["SE", "DK", "GB", "NO", null][next(5)],
      ["facebook", "lana", "x", null][next(4)],
    ));
    const result = aggregateProgrammeFunnel(groups);
    for (const rows of [result.byCountry, result.bySource] as Record<string, unknown>[][]) {
      for (const metric of ["accountsCreated", "programmeStarts", "stepThreeCompletions", "outboundClicks", "partnerClicks"]) {
        const column = rows.map((row) => row[metric] as number | null);
        for (const cell of column) assert.ok(cell === null || cell === 0 || cell >= 3, `published ${cell}`);
        const withheld = column.filter((cell) => cell === null).length;
        const published = column.filter((cell) => cell !== null && cell > 0).length;
        assert.ok(withheld !== 1 || published === 0, "one withheld cell is never derivable from the total");
      }
    }
  }
});

test("more groups than the row cap are cut and counted, and broken stores fail closed", async () => {
  const many = Array.from({ length: PROGRAMME_FUNNEL_MAX_ROWS + 5 }, (_, index) => group("accountsCreated", 3, "SE", `source-${String(index).padStart(3, "0")}`));
  const result = await readProgrammeFunnel({}, store({ accountsCreated: async () => many }).value, NOW);
  assert.equal(result.bySource.length, PROGRAMME_FUNNEL_MAX_ROWS);
  // 65 seeded sources plus the three the other stages bring (facebook, lana and no source): 68 rows, 60 shown.
  assert.equal(result.omitted.sources, 8);
  assert.equal(result.totals.accountsCreated, (PROGRAMME_FUNNEL_MAX_ROWS + 5) * 3, "totals cover the cut rows too");

  const broken = store({ programmeStarts: async () => { throw new Error("socket hang up at postgres://secret"); } });
  await assert.rejects(readProgrammeFunnel({}, broken.value, NOW), (error: unknown) => error instanceof ProgrammeFunnelError
    && error.code === "FUNNEL_UNAVAILABLE" && error.retryable && !/secret|postgres/.test(error.message));
  const oversize = store({ partnerButtonPresses: async () => { throw new ProgrammeFunnelError("RESULT_TOO_LARGE", "Too many."); } });
  await rejectsWith(readProgrammeFunnel({}, oversize.value, NOW), "RESULT_TOO_LARGE");
});

test("the Prisma store only reads, reads two sign-up fields and dates, and nothing commercial reads the funnel", () => {
  const source = readFileSync("lib/analytics/programme-funnel.server.ts", "utf8");
  assert.doesNotMatch(source, /\.create\(|\.update\(|\.upsert\(|\.delete\(|deleteMany|updateMany|createMany|\$transaction|\$executeRaw|\$queryRaw/);
  const reads = source.match(/prisma\.\w+\.(?:findMany|findFirst|findUnique|groupBy|count|aggregate)\(/g) ?? [];
  assert.deepEqual(reads, ["prisma.user.groupBy(", "prisma.programEnrollment.findMany(", "prisma.programmeMissionProgress.findMany(", "prisma.outboundClick.findMany("]);
  // Every read is bounded and excludes staff accounts.
  assert.equal((source.match(/take: PROGRAMME_FUNNEL_MAX_RECORDS \+ 1/g) ?? []).length, reads.length);
  assert.equal((source.match(/notStaff/g) ?? []).length, reads.length + 1);
  assert.match(source, /const notStaff = \{ adminUser: null \} as const;/);
  // The only account fields selected: the sign-up country and the two source fields.
  assert.match(source, /const origin = \{ signupCountryCode: true, signupUtmSource: true, signupSource: true \} as const;/);
  assert.deepEqual([...new Set(source.match(/select: \{[^\n]*\}/g))].sort(), [
    "select: { enrollment: { select: { user: { select: origin } } } }",
    "select: { state: true, user: { select: origin } }",
    "select: { user: { select: origin } }",
  ]);
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/^export const PROGRAMME_FUNNEL_NOTES = \[[\s\S]*?\] as const;$/m, "");
  assert.doesNotMatch(code, /email|userId|anonymousId|\bname: true|draft|taskStates|pause|preferredLocale|signupReferrerHost|signupUtmCampaign|signupUtmContent/);
  // The third step is the lesson "Research responsibly", Mission 08.
  assert.match(source, /const STEP_THREE_MISSION_NUMBER = programmeJourney\[2\];/);
  assert.equal(programmeJourney[2], 8);
  assert.equal(missionStep(8), 3);
  assert.match(source, /missionNumber: STEP_THREE_MISSION_NUMBER,\s+status: "COMPLETED",\s+completedAt: \{ gte: from, lt: until \}/);
  assert.match(source, /\.\.\.productionHuman, attemptedAt: \{ gte: from, lt: until \}/);
  assert.match(source, /programmeFunnelResultSchema\.parse/);

  // One reader: the Learn MCP tool. No page, component, offer, ranking, route or letter imports it.
  const importers = ["app", "components", "lib"].flatMap((root) => (readdirSync(root, { recursive: true }) as string[])
    .filter((file) => /\.(?:ts|tsx|mjs)$/.test(file))
    .map((file) => `${root}/${file}`)
    .filter((file) => readFileSync(file, "utf8").includes("analytics/programme-funnel.server")));
  assert.deepEqual(importers, ["lib/mcp/learn/server.ts"]);
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
  assert.match(packageJson.scripts["learn-content-orchestrator:test"] ?? "", /tests\/programme-funnel\.test\.ts/);
  assert.match(packageJson.scripts["ci:quality"] ?? "", /npm run learn-content-orchestrator:test/);
});

// MCP surface.

async function connected(readFunnel: (input: unknown) => Promise<unknown>) {
  let otherCalls = 0;
  const other = async () => { otherCalls += 1; throw new Error("programme_funnel must reach no other tool"); };
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createLearnMcpServer({ apply: other }, other, other, other as never, readFunnel as never);
  const client = new Client({ name: "programme-funnel-test", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return {
    client,
    otherCalls: () => otherCalls,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}

test("MCP discovery lists programme_funnel as a read-only tool next to social_traffic", async () => {
  const session = await connected((input) => readProgrammeFunnel(input, store().value, NOW));
  try {
    const discovered = await session.client.listTools();
    assert.deepEqual(discovered.tools.map((tool) => tool.name), ["learn_context", "learn_source", "social_traffic", "programme_funnel", "learn_apply"]);
    const tool = discovered.tools.find((candidate) => candidate.name === "programme_funnel");
    assert.deepEqual(tool?.annotations, { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });
    assert.deepEqual(discovered.tools.filter((candidate) => candidate.annotations?.readOnlyHint !== true).map((candidate) => candidate.name), ["learn_apply"]);
    assert.equal(programmeFunnelTool.inputSchema.additionalProperties, false);
    assert.equal(programmeFunnelTool.inputSchema.required, undefined);
    assert.deepEqual(Object.keys(programmeFunnelTool.inputSchema.properties as object), ["from", "to"]);
    assert.match(tool?.description ?? "", /withheld \(null\)/);
    assert.match(tool?.description ?? "", /Research responsibly/);
    assert.match(tool?.description ?? "", /no account, user, session, email, IP, answer or pause data/);
    assert.equal(learnMcpToolSurfaceIsExpected(discovered.tools.map((candidate) => candidate.name)), true);
    assert.equal(learnMcpToolSurfaceIsExpected(["programme_funnel"]), false);
  } finally {
    await session.close();
  }
});

test("MCP programme_funnel returns schema-valid aggregates, maps errors and calls no other tool", async () => {
  const session = await connected((input) => readProgrammeFunnel(input, store().value, NOW));
  try {
    const ok = await session.client.callTool({ name: "programme_funnel", arguments: { from: "2026-10-12", to: "2026-10-18" } });
    assert.equal(ok.isError, undefined);
    const structured = programmeFunnelResultSchema.parse(ok.structuredContent);
    assert.deepEqual(structured.range, { from: "2026-10-12T00:00:00.000Z", to: "2026-10-19T00:00:00.000Z", days: 7 });
    assert.equal(structured.totals.programmeStarts, 12);
    const invalid = await session.client.callTool({ name: "programme_funnel", arguments: { userId: "someone" } });
    assert.equal(invalid.isError, true);
    assert.deepEqual((invalid.structuredContent as { error: unknown }).error, {
      code: "INVALID_INPUT",
      message: "programme_funnel accepts only { from?, to? } as described in its input schema.",
      retryable: false,
    });
    assert.equal(session.otherCalls(), 0);
  } finally {
    await session.close();
  }

  const failing = await connected(async () => { throw new Error("socket hang up at postgres://secret"); });
  try {
    const failed = await failing.client.callTool({ name: "programme_funnel", arguments: {} });
    assert.equal(failed.isError, true);
    const error = (failed.structuredContent as { error: { code: string; message: string; retryable: boolean } }).error;
    assert.deepEqual([error.code, error.retryable], ["FUNNEL_UNAVAILABLE", true]);
    assert.doesNotMatch(error.message, /secret|postgres/);
  } finally {
    await failing.close();
  }
});

test("HTTP programme_funnel sits behind the Learn service bearer and answers private, no-store", async (context) => {
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
  const token = "programme-funnel-service-token-with-more-than-32-bytes";
  Object.assign(process.env, {
    LEARN_MCP_ENABLED: "true",
    LEARN_MCP_SERVICE_TOKEN: token,
    LEARN_MCP_ACTOR_ID: "33333333-3333-4333-8333-333333333333",
  });
  // An invalid argument is rejected before any database read, so no database is needed here.
  const call = (headers: Record<string, string>) => handleLearnMcpPost(new Request("https://b4gamble.com/api/mcp/learn", {
    method: "POST",
    headers: { accept: "application/json, text/event-stream", "content-type": "application/json", ...headers },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "programme_funnel", arguments: { userId: "someone" } } }),
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
