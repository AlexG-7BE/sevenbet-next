import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  outboundClickUtcDay,
  type OutboundClickIdentity,
  type OutboundClickReportQuery,
  type OutboundClickStore,
} from "../lib/repositories/outbound-click.repository";
import { OutboundClickService } from "../lib/services/outbound-click.service";

type ReportRow = OutboundClickIdentity & {
  casinoName: string;
  redirectSlug: string;
  clickCount: number;
};

class MemoryClickStore implements OutboundClickStore {
  constructor(private readonly rows: ReportRow[]) {}

  async report(input: OutboundClickReportQuery) {
    return this.rows
      .filter((row) => row.day >= input.from && row.day < input.until)
      .filter((row) => !input.casinoId || row.casinoId === input.casinoId)
      .filter((row) => !input.countryCode || row.countryCode === input.countryCode)
      .filter((row) => !input.redirectSlugId || row.redirectSlugId === input.redirectSlugId);
  }
}

const identity = {
  casinoId: "11111111-1111-4111-8111-111111111111",
  countryCode: "PE",
  redirectSlugId: "22222222-2222-4222-8222-222222222222",
  affiliateOfferId: "33333333-3333-4333-8333-333333333333",
  trackingLinkId: "44444444-4444-4444-8444-444444444444",
};

test("existing aggregate report preserves UTC ranges, filters, totals, daily rows, and privacy", async () => {
  const store = new MemoryClickStore([
    {
      ...identity,
      day: new Date("2026-09-03T00:00:00.000Z"),
      clickedAt: new Date("2026-09-03T23:59:59.000Z"),
      casinoName: "Verified Casino",
      redirectSlug: "verified-casino-pe",
      clickCount: 2,
    },
    {
      ...identity,
      day: new Date("2026-09-04T00:00:00.000Z"),
      clickedAt: new Date("2026-09-04T00:00:00.000Z"),
      casinoName: "Verified Casino",
      redirectSlug: "verified-casino-pe",
      clickCount: 1,
    },
    {
      ...identity,
      countryCode: "GB",
      day: new Date("2026-09-04T00:00:00.000Z"),
      clickedAt: new Date("2026-09-04T12:00:00.000Z"),
      casinoName: "Verified Casino",
      redirectSlug: "verified-casino-gb",
      clickCount: 4,
    },
  ]);
  const service = new OutboundClickService(store);
  const full = await service.report({ from: "2026-09-03", to: "2026-09-04", now: new Date("2026-09-04T12:00:00.000Z") });
  assert.deepEqual(full.range, { from: "2026-09-03", to: "2026-09-04", days: 2 });
  assert.deepEqual(full.totals, { clicks: 7, routes: 2 });
  assert.deepEqual(full.daily.map((row) => [row.day, row.clickCount]), [["2026-09-03", 2], ["2026-09-04", 1], ["2026-09-04", 4]]);
  assert.equal(full.privacy, "aggregate-only");

  const filtered = await service.report({
    from: "2026-09-03",
    to: "2026-09-04",
    countryCode: "pe",
    casinoId: identity.casinoId,
    redirectSlugId: identity.redirectSlugId,
  });
  assert.deepEqual(filtered.filters, {
    casinoId: identity.casinoId,
    countryCode: "PE",
    redirectSlugId: identity.redirectSlugId,
  });
  assert.deepEqual(filtered.totals, { clicks: 3, routes: 1 });
  await assert.rejects(service.report({ from: "2025-01-01", to: "2026-01-02" }), /cannot exceed 366 days/);
});

test("UTC projection day is derived from the authoritative attempted timestamp", () => {
  assert.equal(outboundClickUtcDay(new Date("2026-09-14T23:59:59.999Z")).toISOString(), "2026-09-14T00:00:00.000Z");
  assert.equal(outboundClickUtcDay(new Date("2026-09-15T00:00:00.000Z")).toISOString(), "2026-09-15T00:00:00.000Z");
});

test("redirect route schedules one canonical observer only after governed safe-response resolution", () => {
  const route = readFileSync("app/r/[slug]/route.ts", "utf8");
  const success = route.indexOf("if (!result.ok)");
  // The campaign sub-ID is added to the governed destination before the safe response re-validates it.
  const subId = route.indexOf("withCampaignSubId(result.destination");
  const safeResponse = route.indexOf("safeAffiliateRedirectResponse(destination)");
  const statusGate = route.indexOf("response.status !== 302");
  const successfulAccounting = route.indexOf("scheduleObservation(observation);");
  assert.ok(success >= 0 && subId > success && safeResponse > subId && statusGate > safeResponse && successfulAccounting > statusGate);
  assert.equal(route.match(/recordOutboundAttributionBestEffort\(input\)/g)?.length, 1);
  assert.equal(route.match(/scheduleObservation\(observation\);/g)?.length, 1);
  assert.doesNotMatch(route, /recordOutboundClickBestEffort|OutboundClickService|Promise\.all/);
  assert.doesNotMatch(route, /userId|sessionId|x-forwarded-for|user-agent|Programme|Mission|request\.url/);
});

test("canonical observer writes detail, events, then the success-only aggregate in one transaction", () => {
  const attribution = readFileSync("lib/analytics/outbound-attribution.server.ts", "utf8");
  const transaction = attribution.indexOf("prisma.$transaction(async (transaction)");
  const detailed = attribution.indexOf("transaction.outboundClick.create", transaction);
  const events = attribution.indexOf("transaction.analyticsEvent.createMany", detailed);
  const aggregate = attribution.indexOf("incrementOutboundClickDailyProjection(transaction, aggregateIdentity)", events);
  assert.ok(transaction >= 0 && detailed > transaction && events > detailed && aggregate > events);
  assert.match(attribution, /if \(input\.state !== "SUCCEEDED"\) return null/);
  assert.match(attribution, /day: outboundClickUtcDay\(input\.attemptedAt\)/);
  assert.match(attribution, /clickedAt: input\.attemptedAt/);
  assert.match(attribution, /if \(aggregateIdentity\) \{[\s\S]*incrementOutboundClickDailyProjection/);
  assert.doesNotMatch(attribution, /MarketActivation|PublicCommercialActionResolver|jurisdictionResolver|resolveRedirect|destinationUrl|trackingUrl/);

  const repository = readFileSync("lib/repositories/outbound-click.repository.ts", "utf8");
  assert.match(repository, /Pick<Prisma\.TransactionClient, "affiliateOutboundClickDaily">/);
  assert.match(repository, /database\.affiliateOutboundClickDaily\.upsert/);
  const service = readFileSync("lib/services/outbound-click.service.ts", "utf8");
  assert.doesNotMatch(service, /recordOutboundClickBestEffort|\.increment\(/);
});

test("storage stays aggregate-only and the existing report remains affiliate-authorized", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const model = schema.slice(schema.indexOf("model AffiliateOutboundClickDaily"), schema.indexOf("model CasinoSeo"));
  assert.match(model, /day\s+DateTime\s+@db\.Date/);
  assert.match(model, /clickCount\s+Int/);
  assert.match(model, /lastClickedAt\s+DateTime/);
  assert.doesNotMatch(model, /userId|accountId|sessionId|email|ipAddress|userAgent|referrer|query|programme|mission/i);
  const route = readFileSync("app/api/admin/affiliate/outbound-clicks/route.ts", "utf8");
  assert.match(route, /requireAdminPermission\(request, "affiliate\.manage"\)/);
  assert.match(route, /outboundClickService\.report/);
  assert.doesNotMatch(route, /OutboundClick|trackingUrl|destinationUrl/);
});

test("0026 history remains additive, constrained, and untouched", () => {
  const migration = readFileSync("prisma/migrations/0026_commercial_platform_completion/migration.sql", "utf8");
  assert.match(migration, /CREATE TABLE "AffiliateOutboundClickDaily"/);
  assert.match(migration, /countryCode_check/);
  assert.match(migration, /clickCount_check/);
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/i);
  assert.doesNotMatch(migration, /"(?:userId|accountId|sessionId|email|ipAddress|userAgent|referrer|query|programme|mission)"/i);
});
