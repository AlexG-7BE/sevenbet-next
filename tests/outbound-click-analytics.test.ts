import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { OutboundClickIdentity, OutboundClickReportQuery, OutboundClickStore } from "../lib/repositories/outbound-click.repository";
import { OutboundClickService, recordOutboundClickBestEffort } from "../lib/services/outbound-click.service";

class MemoryClickStore implements OutboundClickStore {
  rows = new Map<string, OutboundClickIdentity & { clickCount: number }>();

  async increment(input: OutboundClickIdentity) {
    const key = [input.day.toISOString(), input.casinoId, input.countryCode, input.redirectSlugId, input.trackingLinkId].join("|");
    const current = this.rows.get(key);
    if (current) {
      current.clickCount += 1;
      current.clickedAt = input.clickedAt;
    } else {
      this.rows.set(key, { ...input, clickCount: 1 });
    }
  }

  async report(input: OutboundClickReportQuery) {
    return [...this.rows.values()]
      .filter((row) => row.day >= input.from && row.day < input.until)
      .filter((row) => !input.casinoId || row.casinoId === input.casinoId)
      .filter((row) => !input.countryCode || row.countryCode === input.countryCode)
      .filter((row) => !input.redirectSlugId || row.redirectSlugId === input.redirectSlugId)
      .map((row) => ({
        day: row.day,
        casinoId: row.casinoId,
        casinoName: "Verified Casino",
        countryCode: row.countryCode,
        redirectSlugId: row.redirectSlugId,
        redirectSlug: "verified-casino-pe",
        affiliateOfferId: row.affiliateOfferId,
        trackingLinkId: row.trackingLinkId,
        clickCount: row.clickCount,
      }));
  }
}

const identity = {
  casinoId: "11111111-1111-4111-8111-111111111111",
  countryCode: "PE",
  redirectSlugId: "22222222-2222-4222-8222-222222222222",
  affiliateOfferId: "33333333-3333-4333-8333-333333333333",
  trackingLinkId: "44444444-4444-4444-8444-444444444444",
};

test("successful governed clicks increment one aggregate UTC-day counter", async () => {
  const store = new MemoryClickStore();
  const service = new OutboundClickService(store);
  await service.record({ ...identity, clickedAt: new Date("2026-09-03T00:01:00.000Z") });
  await service.record({ ...identity, clickedAt: new Date("2026-09-03T23:59:59.000Z") });
  await service.record({ ...identity, clickedAt: new Date("2026-09-04T00:00:00.000Z") });
  assert.equal(store.rows.size, 2);
  const report = await service.report({ from: "2026-09-03", to: "2026-09-04", now: new Date("2026-09-04T12:00:00.000Z") });
  assert.equal(report.totals.clicks, 3);
  assert.equal(report.totals.routes, 1);
  assert.deepEqual(report.daily.map((row) => [row.day, row.clickCount]), [["2026-09-03", 2], ["2026-09-04", 1]]);
});

test("counter failure emits a bounded warning and never rejects the redirect accounting boundary", async () => {
  const warnings: Array<{ message: string; context: unknown }> = [];
  const recorded = await recordOutboundClickBestEffort(identity, {
    recorder: { record: async () => { throw new Error("database URL must never escape"); } },
    warn: (message, context) => warnings.push({ message, context }),
  });
  assert.equal(recorded, false);
  assert.deepEqual(warnings, [{
    message: "affiliate_outbound_click_metric_failed",
    context: { slugId: identity.redirectSlugId, casinoId: identity.casinoId, countryCode: "PE" },
  }]);
  assert.doesNotMatch(JSON.stringify(warnings), /database URL/i);
});

test("redirect integration counts only after governed success and safe 302 validation", () => {
  const source = readFileSync("app/r/[slug]/route.ts", "utf8");
  const success = source.indexOf("if (!result.ok)");
  const safeResponse = source.indexOf("safeAffiliateRedirectResponse(result.destination)");
  const statusGate = source.indexOf("response.status !== 302");
  const accounting = source.indexOf("await recordOutboundClickBestEffort");
  assert.ok(success >= 0 && safeResponse > success && statusGate > safeResponse && accounting > statusGate);
  assert.doesNotMatch(source, /userId|sessionId|x-forwarded-for|user-agent|Programme|Mission|request\.url/);
});

test("storage is aggregate-only and reporting is affiliate-authorized", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const model = schema.slice(schema.indexOf("model AffiliateOutboundClickDaily"), schema.indexOf("model CasinoSeo"));
  assert.match(model, /day\s+DateTime\s+@db\.Date/);
  assert.match(model, /clickCount\s+Int/);
  assert.match(model, /lastClickedAt\s+DateTime/);
  assert.doesNotMatch(model, /userId|accountId|sessionId|email|ipAddress|userAgent|referrer|query|programme|mission/i);
  const route = readFileSync("app/api/admin/affiliate/outbound-clicks/route.ts", "utf8");
  assert.match(route, /requireAdminPermission\(request, "affiliate\.manage"\)/);
  assert.doesNotMatch(route, /trackingUrl|destinationUrl/);
});

test("0026 is additive, constrained, and contains no visitor or Programme data", () => {
  const migration = readFileSync("prisma/migrations/0026_commercial_platform_completion/migration.sql", "utf8");
  assert.match(migration, /CREATE TABLE "AffiliateOutboundClickDaily"/);
  assert.match(migration, /countryCode_check/);
  assert.match(migration, /clickCount_check/);
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/i);
  assert.doesNotMatch(migration, /"(?:userId|accountId|sessionId|email|ipAddress|userAgent|referrer|query|programme|mission)"/i);
});
