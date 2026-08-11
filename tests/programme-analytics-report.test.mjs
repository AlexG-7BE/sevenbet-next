import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_VERCEL_PROJECT_ID,
  DEFAULT_VERCEL_TEAM_ID,
  buildProgrammeAnalyticsReport,
  fetchProgrammeAnalyticsMetrics,
  formatProgrammeAnalyticsReport,
  parseProgrammeAnalyticsArgs,
  percentage,
} from "../scripts/programme-analytics-report.mjs";

test("report arguments are bounded, use safe defaults, and reject unsafe authority", () => {
  const now = new Date("2026-08-11T12:00:00.000Z");
  assert.deepEqual(parseProgrammeAnalyticsArgs(["--since", "7d"], now), {
    projectId: DEFAULT_VERCEL_PROJECT_ID,
    teamId: DEFAULT_VERCEL_TEAM_ID,
    since: "2026-08-04",
    until: "2026-08-11",
  });
  assert.throws(() => parseProgrammeAnalyticsArgs(["--since", "91d"], now));
  assert.throws(() => parseProgrammeAnalyticsArgs(["--project-id", "../../secret"], now));
  assert.throws(() => parseProgrammeAnalyticsArgs(["--from", "2026-08-12", "--to", "2026-08-11"], now));
});

test("aggregate requests send the token only in Authorization and never request row-level data", async () => {
  const requests = [];
  const metrics = await fetchProgrammeAnalyticsMetrics({
    token: "sensitive-token",
    projectId: DEFAULT_VERCEL_PROJECT_ID,
    teamId: DEFAULT_VERCEL_TEAM_ID,
    since: "2026-08-01",
    until: "2026-08-11",
    fetchImpl: async (url, init) => {
      requests.push({ url: String(url), init });
      return Response.json({ data: [{ count: 2 }] });
    },
  });
  assert.ok(Object.keys(metrics).length > 90);
  assert.ok(requests.every(({ url }) => url.includes("/events/aggregate") && url.includes("by=eventName")));
  assert.ok(requests.some(({ url }) => url.includes("currentMission") && url.includes("engagementDayBucket")));
  assert.ok(requests.every(({ url }) => !url.includes("sensitive-token")));
  assert.ok(requests.every(({ init }) => init.headers.Authorization === "Bearer sensitive-token"));
  await assert.rejects(() => fetchProgrammeAnalyticsMetrics({
    token: "",
    projectId: DEFAULT_VERCEL_PROJECT_ID,
    teamId: DEFAULT_VERCEL_TEAM_ID,
    since: "2026-08-01",
    until: "2026-08-11",
  }));
});

test("reports label aggregate continuation honestly and avoid divide-by-zero claims", () => {
  assert.equal(percentage(1, 0), "N/A");
  assert.equal(percentage(1, 4), "25.0%");
  const report = buildProgrammeAnalyticsReport({
    startClicks: 4,
    accessGranted: 2,
    "engagement:3:day_2_3": 5,
  });
  const text = formatProgrammeAnalyticsReport(report, { since: "2026-08-01", until: "2026-08-11" });
  assert.match(text, /Access granted: 2 · from previous 50\.0%/);
  assert.match(text, /PROGRAMME RETURN DAYS BY CURRENT MISSION \(aggregate home views\)/);
  assert.match(text, /M3 day_2_3: 5/);
  assert.doesNotMatch(text, /programmeState/);
  assert.match(text, /aggregate clicks, not cohort conversion/i);
  assert.match(text, /aggregate event continuation ratios, not cohort-perfect retention/i);
  assert.doesNotMatch(text, /sensitive-token|userId|email|transcript/);
});
