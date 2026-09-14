import {
  mediaIngestionBatchSchema,
  mediaIngestionPlanSchema,
  type MediaIngestionBatch,
  type MediaIngestionPlan,
} from "@/lib/media-operations/contracts";

const LEGACY_MEDIA_OPERATIONS_SOURCE = "CHATGPT_WORK";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizePersistedSource(value: unknown) {
  return value === LEGACY_MEDIA_OPERATIONS_SOURCE ? "AUTOMATION" : value;
}

function normalizePersistedPlan(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const operations = Array.isArray(value.operations)
    ? value.operations.map((operation) => isRecord(operation)
      ? { ...operation, source: normalizePersistedSource(operation.source) }
      : operation)
    : value.operations;
  return {
    ...value,
    source: normalizePersistedSource(value.source),
    operations,
  };
}

export function decodePersistedMediaIngestionPlan(value: unknown): MediaIngestionPlan {
  return mediaIngestionPlanSchema.parse(normalizePersistedPlan(value));
}

export function decodePersistedMediaIngestionBatch(value: unknown): MediaIngestionBatch {
  if (!isRecord(value)) return mediaIngestionBatchSchema.parse(value);
  return mediaIngestionBatchSchema.parse({
    ...value,
    source: normalizePersistedSource(value.source),
  });
}
