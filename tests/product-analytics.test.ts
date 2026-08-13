import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { redactProductAnalyticsPageview } from "../components/analytics/ProductAnalytics";
import {
  createProductAnalyticsClient,
  personalisedValueElapsedBucket,
  registrationElapsedBucket,
} from "../lib/analytics/product-analytics-client";
import {
  parseProductAnalyticsEvent,
  productAnalyticsEventNames,
  programmeEngagementDayBucket,
} from "../lib/analytics/product-analytics-events";
import { isProductAnalyticsEnabled } from "../lib/analytics/product-analytics";
import { createProductAnalyticsServer } from "../lib/analytics/vercel-product-analytics";
import { programAiMissionRegistry } from "../lib/programme/program-ai/mission-registry";
import { programAiMissionOneRewardPolicy } from "../lib/programme/program-ai/reward-policy";

const validEvents = {
  programme_start_clicked: { sourceSurface: "ten_steps" },
  programme_access_granted: { entryMode: "start" },
  programme_m1_situation_submitted: { inputMode: "text" },
  programme_m1_personalised_value_presented: { resultType: "starting_point", elapsedBucket: "lt_30s" },
  programme_registration_cta_presented: { elapsedBucket: "lt_60s" },
  programme_claim_redeemed: { authMethod: "unknown" },
  programme_home_viewed: { currentMission: 1, engagementDayBucket: "unknown" },
  programme_mission_opened: { mission: 2, mode: "start" },
  programme_mission_action_completed: { mission: 2, actionPosition: 1 },
  programme_mission_completed: { mission: 2 },
  programme_review_opened: { milestone: "first" },
  programme_completed: { pathVersion: "program_ai_v1" },
  programme_discovery_clicked: { sourceSurface: "programme_home", destinationRoute: "casinos" },
  programme_ai_outcome: { operation: "programme_ai", result: "provider" },
  programme_voice_outcome: { result: "recording_started" },
} as const;

test("the closed event taxonomy accepts every approved event and rejects unknown fields", () => {
  for (const [name, properties] of Object.entries(validEvents)) {
    assert.equal(parseProductAnalyticsEvent(name as never, properties).name, name);
    for (const forbidden of ["userId", "email", "situation", "transcript", "reviewText", "xp", "metadata"]) {
      assert.throws(() => parseProductAnalyticsEvent(name as never, { ...properties, [forbidden]: "forbidden" }));
    }
  }
  assert.throws(() => parseProductAnalyticsEvent("programme_home_viewed", { ...validEvents.programme_home_viewed, currentMission: 11 }));
  assert.throws(() => parseProductAnalyticsEvent("programme_home_viewed", { ...validEvents.programme_home_viewed, programmeState: "in_progress" }));
  assert.throws(() => parseProductAnalyticsEvent("programme_discovery_clicked", { sourceSurface: "mission_08", destinationRoute: "/casinos?affiliate=1" }));
  assert.throws(() => parseProductAnalyticsEvent("programme_ai_outcome", { operation: "free_text", result: "provider" }));
  assert.throws(() => parseProductAnalyticsEvent("unknown" as never, {}));
});

test("every approved custom event uses at most two Vercel Pro properties", () => {
  assert.deepEqual(Object.keys(validEvents), [...productAnalyticsEventNames]);
  for (const [name, properties] of Object.entries(validEvents)) {
    assert.ok(Object.keys(properties).length <= 2, `${name} exceeds the two-property Vercel Pro ceiling`);
  }
});

test("analytics is default-off and requires the exact public flag value", () => {
  assert.equal(isProductAnalyticsEnabled({}), false);
  assert.equal(isProductAnalyticsEnabled({ NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED: "TRUE" }), false);
  assert.equal(isProductAnalyticsEnabled({ NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED: "1" }), false);
  assert.equal(isProductAnalyticsEnabled({ NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED: "true" }), true);
  assert.match(readFileSync("lib/analytics/product-analytics.ts", "utf8"), /process\.env\.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED/);
});

test("disabled client analytics emits nothing and never touches marker storage", () => {
  let reads = 0;
  let writes = 0;
  const events: unknown[] = [];
  const client = createProductAnalyticsClient({
    enabled: false,
    storage: {
      getItem: () => { reads += 1; return null; },
      setItem: () => { writes += 1; },
    },
    sink: (event) => { events.push(event); },
  });
  client.startClicked("home");
  client.accessGranted("start");
  client.personalisedValue("starting_point");
  client.registrationCtaPresented();
  client.homeViewed({ currentMission: 1, engagementDayBucket: "unknown" });
  client.missionOpened(2, "start");
  client.reviewOpened("first");
  client.discoveryClicked({ sourceSurface: "programme_home", destinationRoute: "casinos" });
  client.voiceOutcome("cancelled");
  assert.deepEqual({ reads, writes, events: events.length }, { reads: 0, writes: 0, events: 0 });
});

test("pageview redaction excludes admin/API and strips Programme query and fragment data", () => {
  const event = (url: string) => ({ type: "pageview", url } as Parameters<typeof redactProductAnalyticsPageview>[0]);
  assert.equal(redactProductAnalyticsPageview(event("https://b4gamble.com/admin/users?x=1")), null);
  assert.equal(redactProductAnalyticsPageview(event("https://b4gamble.com/api/program?x=1")), null);
  assert.equal(redactProductAnalyticsPageview(event("http://[")), null);
  assert.equal(
    redactProductAnalyticsPageview(event("https://b4gamble.com/program?entry=start#private"))?.url,
    "https://b4gamble.com/program",
  );
  const publicEvent = event("https://b4gamble.com/casinos?utm_source=founder#list");
  assert.equal(redactProductAnalyticsPageview(publicEvent), publicEvent);
});

test("elapsed-time buckets have exact boundaries and missing timestamps stay unknown", () => {
  assert.equal(personalisedValueElapsedBucket(null), "unknown");
  assert.equal(personalisedValueElapsedBucket(29_999), "lt_30s");
  assert.equal(personalisedValueElapsedBucket(30_000), "30_60s");
  assert.equal(personalisedValueElapsedBucket(120_000), "gt_120s");
  assert.equal(registrationElapsedBucket(null), "unknown");
  assert.equal(registrationElapsedBucket(59_999), "lt_60s");
  assert.equal(registrationElapsedBucket(60_000), "60_90s");
  assert.equal(registrationElapsedBucket(120_000), "gt_120s");
});

test("server-derived engagement buckets distinguish bounded later-day returns", () => {
  const startedAt = new Date("2026-08-01T12:00:00.000Z");
  const afterDays = (days: number) => new Date(startedAt.getTime() + days * 24 * 60 * 60 * 1000);
  assert.equal(programmeEngagementDayBucket(null, startedAt), "unknown");
  assert.equal(programmeEngagementDayBucket(startedAt, new Date(startedAt.getTime() - 1)), "unknown");
  assert.equal(programmeEngagementDayBucket(startedAt, new Date(startedAt.getTime() + 86_399_999)), "day_0");
  assert.equal(programmeEngagementDayBucket(startedAt, afterDays(1)), "day_1");
  assert.equal(programmeEngagementDayBucket(startedAt, afterDays(2)), "day_2_3");
  assert.equal(programmeEngagementDayBucket(startedAt, afterDays(4)), "day_4_7");
  assert.equal(programmeEngagementDayBucket(startedAt, afterDays(8)), "day_8_plus");
});

test("client exposure events deduplicate inside one tab without storing product data", () => {
  const values = new Map<string, string>();
  const events: Array<{ name: string; properties: unknown }> = [];
  const client = createProductAnalyticsClient({
    enabled: true,
    now: () => 100_000,
    storage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value); },
    },
    sink: (event) => { events.push(event); },
  });
  client.startClicked("home");
  client.startClicked("ten_steps");
  client.accessGranted("start");
  client.accessGranted("start");
  client.personalisedValue("starting_point");
  client.personalisedValue("starting_point");
  assert.deepEqual(events.map((event) => event.name), [
    "programme_start_clicked",
    "programme_access_granted",
    "programme_m1_personalised_value_presented",
  ]);
  assert.equal([...values.values()].some((value) => /@|situation|transcript/i.test(value)), false);
});

test("analytics sink failures never interrupt the product path", async () => {
  const failures: string[] = [];
  const server = createProductAnalyticsServer({
    enabled: true,
    schedule: (work) => { void work(); },
    sink: async () => { throw new Error("provider unavailable"); },
  });
  assert.doesNotThrow(() => server.missionCompleted(2));
  const client = createProductAnalyticsClient({
    enabled: true,
    storage: undefined,
    sink: () => { failures.push("called"); throw new Error("provider unavailable"); },
  });
  assert.doesNotThrow(() => client.voiceOutcome("cancelled"));
  assert.deepEqual(failures, ["called"]);
  await new Promise((resolve) => setImmediate(resolve));
});

test("the synthetic M1 funnel emits the approved event order without personal content", () => {
  const events: Array<{ name: string; properties: unknown }> = [];
  const values = new Map<string, string>();
  let now = 1_000;
  const sink = (event: { name: string; properties: unknown }) => { events.push(event); };
  const client = createProductAnalyticsClient({
    enabled: true,
    now: () => now,
    storage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value); },
    },
    sink,
  });
  const server = createProductAnalyticsServer({
    enabled: true,
    schedule: (work) => { void work(); },
    sink,
  });

  client.startClicked("ten_steps");
  client.accessGranted("start");
  server.m1SituationSubmitted("text");
  now += 35_000;
  client.personalisedValue("starting_point");
  now += 60_000;
  client.registrationCtaPresented();
  server.claimRedeemed("email");

  assert.deepEqual(events.map((event) => event.name), [
    "programme_start_clicked",
    "programme_access_granted",
    "programme_m1_situation_submitted",
    "programme_m1_personalised_value_presented",
    "programme_registration_cta_presented",
    "programme_claim_redeemed",
  ]);
  assert.deepEqual(events[3].properties, { resultType: "starting_point", elapsedBucket: "30_60s" });
  assert.deepEqual(events[4].properties, { elapsedBucket: "90_120s" });
  assert.doesNotMatch(JSON.stringify(events.map((event) => event.properties)), /difficult work|betting apps|startingPoint|situation|transcript|reviewText|userId|emailAddress|"xp"/i);
});

test("the synthetic M2-M10 stream reaches the 715 XP authority path without emitting XP or answers", () => {
  const events: Array<{ name: string; properties: unknown }> = [];
  const sink = (event: { name: string; properties: unknown }) => { events.push(event); };
  const client = createProductAnalyticsClient({ enabled: true, storage: undefined, sink });
  const server = createProductAnalyticsServer({ enabled: true, schedule: (work) => { void work(); }, sink });
  let authoritativeXp = programAiMissionOneRewardPolicy.situationSubmitted.xp
    + programAiMissionOneRewardPolicy.startingPointComplete.xp;

  for (const mission of programAiMissionRegistry) {
    client.missionOpened(mission.missionNumber, "start");
    mission.actions.forEach((action, index) => {
      authoritativeXp += action.xp;
      server.missionActionCompleted(mission.missionNumber, (index + 1) as 1 | 2 | 3);
    });
    authoritativeXp += 25;
    server.missionCompleted(mission.missionNumber);
    if (mission.missionNumber === 3) client.reviewOpened("first");
    if (mission.missionNumber === 6) client.reviewOpened("mid");
    if (mission.missionNumber === 10) {
      client.reviewOpened("full");
      server.programmeCompleted();
    }
  }

  assert.equal(authoritativeXp, 715);
  assert.equal(events.filter((event) => event.name === "programme_mission_opened").length, 9);
  assert.equal(events.filter((event) => event.name === "programme_mission_action_completed").length, 27);
  assert.equal(events.filter((event) => event.name === "programme_mission_completed").length, 9);
  assert.deepEqual(
    events.filter((event) => event.name === "programme_review_opened").map((event) => event.properties),
    [{ milestone: "first" }, { milestone: "mid" }, { milestone: "full" }],
  );
  assert.equal(events.at(-1)?.name, "programme_completed");
  assert.doesNotMatch(JSON.stringify(events), /"xp"|artifact|answer|startingPoint|reviewText|userId/i);
});

test("fixed Programme discovery events contain only source and destination enums", () => {
  const events: Array<{ name: string; properties: unknown }> = [];
  const client = createProductAnalyticsClient({
    enabled: true,
    storage: undefined,
    sink: (event) => { events.push(event); },
  });
  client.discoveryClicked({ sourceSurface: "programme_home", destinationRoute: "compare" });
  client.discoveryClicked({ sourceSurface: "mission_08", destinationRoute: "bonuses" });
  client.discoveryClicked({ sourceSurface: "mission_10", destinationRoute: "best_offers" });
  assert.deepEqual(events.map((event) => event.properties), [
    { sourceSurface: "programme_home", destinationRoute: "compare" },
    { sourceSurface: "mission_08", destinationRoute: "bonuses" },
    { sourceSurface: "mission_10", destinationRoute: "best_offers" },
  ]);
  assert.doesNotMatch(JSON.stringify(events), /\?|affiliate|programmeState|currentMission|xp|answer|artifact/i);
});
