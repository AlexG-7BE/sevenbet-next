import assert from "node:assert/strict";
import test from "node:test";

import {
  createProductAnalyticsClient,
  personalisedValueElapsedBucket,
  registrationElapsedBucket,
} from "../lib/analytics/product-analytics-client";
import {
  createClientProductAnalyticsEvent,
  parseProductAnalyticsEvent,
  productAnalyticsEventNames,
  programmeEngagementDayBucket,
  safeParseProductAnalyticsEvent,
  type ClientProductAnalyticsEvent,
} from "../lib/analytics/product-analytics-events";
import {
  createProductAnalyticsEmitter,
  isProductAnalyticsEnabled,
} from "../lib/analytics/product-analytics";

const base = {
  eventId: "36bf26f4-e26f-4fd1-871d-71bc2c9ab8b4",
  schemaVersion: 1 as const,
  occurredAt: "2026-09-11T10:00:00.000Z",
};

test("Product Core v1 locks the canonical closed event dictionary", () => {
  assert.deepEqual(productAnalyticsEventNames, [
    "session_started", "page_viewed", "signup_completed", "login_completed",
    "programme_started", "programme_step_viewed", "programme_step_completed",
    "programme_completed", "casino_viewed", "offer_viewed", "commercial_view_selected",
    "commercial_card_viewed", "casino_review_clicked", "commercial_cta_clicked",
    "outbound_redirect_attempted", "outbound_redirect_succeeded", "outbound_redirect_blocked",
    "email_sent", "email_delivered", "email_bounced", "email_clicked", "email_unsubscribed",
  ]);
});

test("browser ingestion accepts only closed, non-sensitive Product Core events", () => {
  const event = parseProductAnalyticsEvent({ ...base, name: "programme_step_viewed", programmeStep: 4, pagePath: "/program" });
  assert.equal(event.programmeStep, 4);
  assert.equal(safeParseProductAnalyticsEvent({ ...base, name: "signup_completed" }).success, false);
  assert.equal(safeParseProductAnalyticsEvent({ ...base, name: "programme_started" }).success, false);
  assert.equal(safeParseProductAnalyticsEvent({ ...base, name: "page_viewed", pagePath: "/casinos?affiliate=1" }).success, false);
  assert.equal(safeParseProductAnalyticsEvent({ ...base, name: "page_viewed", email: "person@example.com" }).success, false);
  assert.equal(safeParseProductAnalyticsEvent({ ...base, name: "programme_step_viewed" }).success, false);
  assert.equal(safeParseProductAnalyticsEvent({ ...base, name: "page_viewed", programmeStep: 2 }).success, false);
  assert.equal(safeParseProductAnalyticsEvent({ ...base, name: "page_viewed", utmCampaign: "person@example.com" }).success, false);
  assert.equal(safeParseProductAnalyticsEvent({ ...base, name: "page_viewed", placement: "CASINO_DETAIL_HERO" }).success, false);
  assert.equal(safeParseProductAnalyticsEvent({ ...base, name: "commercial_view_selected", placement: "BONUSES_LOW_WAGERING" }).success, true);
  assert.equal(safeParseProductAnalyticsEvent({ ...base, name: "commercial_view_selected" }).success, false);
  assert.equal(safeParseProductAnalyticsEvent({ ...base, name: "commercial_card_viewed", casinoId: "00000000-0000-4000-8000-000000000001", placement: "BONUS_CARD", position: 2 }).success, true);
  assert.equal(safeParseProductAnalyticsEvent({ ...base, name: "commercial_card_viewed", placement: "BONUS_CARD", position: 2 }).success, false);
  assert.equal(safeParseProductAnalyticsEvent({ ...base, name: "commercial_card_viewed", casinoId: "00000000-0000-4000-8000-000000000001", position: 2 }).success, false);
  assert.equal(safeParseProductAnalyticsEvent({ ...base, name: "commercial_card_viewed", casinoId: "00000000-0000-4000-8000-000000000001", placement: "BONUS_CARD" }).success, false);
  assert.equal(safeParseProductAnalyticsEvent({ ...base, name: "casino_review_clicked", casinoId: "00000000-0000-4000-8000-000000000001" }).success, false);
});

test("client event creation emits schema v1 IDs and bounded dimensions", () => {
  const event = createClientProductAnalyticsEvent("casino_viewed", { pagePath: "/casinos" }, {
    eventId: base.eventId,
    occurredAt: new Date(base.occurredAt),
  });
  assert.deepEqual(event, { ...base, name: "casino_viewed", pagePath: "/casinos" });
});

test("analytics requires exact runtime activation and supports an explicit kill switch", () => {
  assert.equal(isProductAnalyticsEnabled({}), false);
  assert.equal(isProductAnalyticsEnabled({ NEXT_PUBLIC_ANALYTICS_ENABLED: "false" }), false);
  assert.equal(isProductAnalyticsEnabled({ NEXT_PUBLIC_ANALYTICS_ENABLED: "true" }), true);
  assert.equal(isProductAnalyticsEnabled({ NEXT_PUBLIC_ANALYTICS_ENABLED: "TRUE" }), false);
});

test("disabled emitter and client produce no analytics or storage side effects", () => {
  const events: ClientProductAnalyticsEvent[] = [];
  let reads = 0;
  let writes = 0;
  const emitter = createProductAnalyticsEmitter({ enabled: false, sink: (event) => { events.push(event); } });
  emitter("page_viewed", { pagePath: "/" });
  const client = createProductAnalyticsClient({
    enabled: false,
    sink: (event) => { events.push(event); },
    storage: {
      getItem: () => { reads += 1; return null; },
      setItem: () => { writes += 1; },
    },
  });
  client.programmeStepViewed(2);
  assert.deepEqual({ events: events.length, reads, writes }, { events: 0, reads: 0, writes: 0 });
});

test("canonical client methods emit only approved event names and dedupe stable view keys", () => {
  const events: ClientProductAnalyticsEvent[] = [];
  const markers = new Map<string, string>();
  const client = createProductAnalyticsClient({
    enabled: true,
    sink: (event) => { events.push(event); },
    storage: {
      getItem: (key) => markers.get(key) ?? null,
      setItem: (key, value) => { markers.set(key, value); },
    },
  });
  client.pageViewed();
  client.programmeStepViewed(3);
  client.programmeStepViewed(3);
  client.offerViewed(undefined, "00000000-0000-4000-8000-000000000001", "bonus-a");
  client.offerViewed(undefined, "00000000-0000-4000-8000-000000000001", "bonus-a");
  client.offerViewed(undefined, "00000000-0000-4000-8000-000000000001", "bonus-b");
  client.commercialCtaClicked("CTA_CASINO_DIRECTORY_CARD");
  client.commercialViewSelected("CASINOS_FAST_PAYOUTS");
  client.commercialCardViewed("00000000-0000-4000-8000-000000000001", "CASINOS_FAST_PAYOUTS", 1, "casino-a");
  client.commercialCardViewed("00000000-0000-4000-8000-000000000001", "CASINOS_FAST_PAYOUTS", 1, "casino-a");
  client.casinoReviewClicked("00000000-0000-4000-8000-000000000001", "CASINO_COLLECTION_CARD", 1);
  assert.deepEqual(events.map(({ name }) => name), [
    "page_viewed",
    "programme_step_viewed",
    "offer_viewed",
    "offer_viewed",
    "commercial_cta_clicked",
    "commercial_view_selected",
    "commercial_card_viewed",
    "casino_review_clicked",
  ]);
  assert.doesNotMatch(JSON.stringify(events), /email|transcript|reviewText|password|token/i);
});

test("sink failures never interrupt product behavior", async () => {
  const failures: string[] = [];
  const emitter = createProductAnalyticsEmitter({
    enabled: true,
    sink: async () => { throw new Error("unavailable"); },
    onError: (name) => { failures.push(name); },
  });
  assert.doesNotThrow(() => emitter("page_viewed", { pagePath: "/" }));
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(failures, ["page_viewed"]);
});

test("Programme engagement and elapsed-time buckets have exact boundaries", () => {
  const startedAt = new Date("2026-08-01T12:00:00.000Z");
  const afterDays = (days: number) => new Date(startedAt.getTime() + days * 86_400_000);
  assert.equal(programmeEngagementDayBucket(null, startedAt), "unknown");
  assert.equal(programmeEngagementDayBucket(startedAt, afterDays(0)), "day_0");
  assert.equal(programmeEngagementDayBucket(startedAt, afterDays(1)), "day_1");
  assert.equal(programmeEngagementDayBucket(startedAt, afterDays(3)), "day_2_3");
  assert.equal(programmeEngagementDayBucket(startedAt, afterDays(7)), "day_4_7");
  assert.equal(programmeEngagementDayBucket(startedAt, afterDays(8)), "day_8_plus");
  assert.equal(personalisedValueElapsedBucket(30_000), "30_60s");
  assert.equal(registrationElapsedBucket(120_000), "gt_120s");
});
