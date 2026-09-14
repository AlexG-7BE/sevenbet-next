import assert from "node:assert/strict";
import test from "node:test";

import {
  MEDIA_INGESTION_BATCH_VERSION,
  MEDIA_INGESTION_PLAN_VERSION,
  mediaIngestionBatchSchema,
  mediaIngestionPlanSchema,
} from "../lib/media-operations/contracts";
import {
  decodePersistedMediaIngestionBatch,
  decodePersistedMediaIngestionPlan,
} from "../lib/media-operations/persisted-history";

const ids = {
  actor: "76000000-0000-4000-8000-000000000001",
  plan: "76000000-0000-4000-8000-000000000002",
  batch: "76000000-0000-4000-8000-000000000003",
  operation: "76000000-0000-4000-8000-000000000004",
};

const currentPlan = mediaIngestionPlanSchema.parse({
  version: MEDIA_INGESTION_PLAN_VERSION,
  id: ids.plan,
  snippetChecksum: "a".repeat(64),
  state: "PLANNED",
  dryRun: false,
  actorId: ids.actor,
  source: "AUTOMATION",
  providerReference: "persisted-history-fixture",
  requestedContext: { creativeLanguageState: "UNKNOWN" },
  resolvedContext: {
    state: "UNRESOLVED",
    source: "NONE",
    casinoId: null,
    casinoSlug: null,
    casinoTitle: null,
    bonusId: null,
    bonusTitle: null,
    affiliateOfferId: null,
    opportunityId: null,
    partnerIdentifier: null,
    trackingDestinationState: "NOT_PRESENT",
    notes: [],
  },
  creatives: [],
  unsupportedElements: [],
  assets: [],
  semanticResults: [],
  recommendations: [],
  warnings: [],
  operations: [{
    id: ids.operation,
    operation: "ANALYZE",
    recommendationId: null,
    subject: `media-ingestion-plan:${ids.plan}`,
    previous: null,
    result: { state: "PLANNED" },
    actorId: ids.actor,
    source: "AUTOMATION",
    timestamp: "2026-09-07T00:00:00.000Z",
  }],
  createdAt: "2026-09-07T00:00:00.000Z",
  updatedAt: "2026-09-07T00:00:00.000Z",
  analyzedAt: "2026-09-07T00:00:00.000Z",
});

const currentBatch = mediaIngestionBatchSchema.parse({
  version: MEDIA_INGESTION_BATCH_VERSION,
  id: ids.batch,
  batchChecksum: "b".repeat(64),
  state: "ANALYZED",
  dryRun: false,
  actorId: ids.actor,
  source: "AUTOMATION",
  planIds: [ids.plan],
  items: [{
    index: 0,
    state: "INGESTED",
    planId: ids.plan,
    creativeIds: [],
    assetIds: [],
    hostedCreativeIds: [],
    reasonCodes: [],
  }],
  counts: { total: 1, ingested: 1, reused: 0, reviewRequired: 0, rejected: 0 },
  createdAt: "2026-09-07T00:00:00.000Z",
  updatedAt: "2026-09-07T00:00:00.000Z",
});

function copy<T>(value: T): T {
  return structuredClone(value);
}

test("persisted Media history normalizes only the known legacy root and nested operation source", () => {
  const legacy = copy(currentPlan) as unknown as Record<string, unknown>;
  legacy.source = "CHATGPT_WORK";
  const operations = legacy.operations as Array<Record<string, unknown>>;
  operations[0].source = "CHATGPT_WORK";

  const decoded = decodePersistedMediaIngestionPlan(legacy);
  assert.equal(decoded.source, "AUTOMATION");
  assert.equal(decoded.operations[0].source, "AUTOMATION");
  assert.equal(legacy.source, "CHATGPT_WORK", "decoding must not mutate persisted input");
  assert.equal(operations[0].source, "CHATGPT_WORK", "nested persisted input must remain unchanged");
});

test("persisted Media batch history normalizes the known legacy root source", () => {
  const legacy = { ...copy(currentBatch), source: "CHATGPT_WORK" };
  assert.equal(decodePersistedMediaIngestionBatch(legacy).source, "AUTOMATION");
  assert.equal(legacy.source, "CHATGPT_WORK");
});

test("current Media write schemas refuse the legacy source at every former write position", () => {
  assert.equal(mediaIngestionPlanSchema.safeParse({ ...copy(currentPlan), source: "CHATGPT_WORK" }).success, false);
  const nested = copy(currentPlan) as unknown as Record<string, unknown>;
  (nested.operations as Array<Record<string, unknown>>)[0].source = "CHATGPT_WORK";
  assert.equal(mediaIngestionPlanSchema.safeParse(nested).success, false);
  assert.equal(mediaIngestionBatchSchema.safeParse({ ...copy(currentBatch), source: "CHATGPT_WORK" }).success, false);
});

test("persisted Media history fails closed for every unknown source value", () => {
  assert.throws(() => decodePersistedMediaIngestionPlan({ ...copy(currentPlan), source: "UNRECOGNIZED" }));
  const nested = copy(currentPlan) as unknown as Record<string, unknown>;
  (nested.operations as Array<Record<string, unknown>>)[0].source = "UNRECOGNIZED";
  assert.throws(() => decodePersistedMediaIngestionPlan(nested));
  assert.throws(() => decodePersistedMediaIngestionBatch({ ...copy(currentBatch), source: "UNRECOGNIZED" }));
});
