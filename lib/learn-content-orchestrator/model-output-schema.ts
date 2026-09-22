import { z } from "zod";

import { learnContentModelEnvelopeSchema } from "./contracts";

function structuredOutputSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(structuredOutputSchema);
  if (!value || typeof value !== "object") return value;
  const input = value as Record<string, unknown>;
  const output = Object.fromEntries(
    Object.entries(input)
      .filter(([key]) => key !== "$schema" && key !== "default")
      .map(([key, child]) => [key === "oneOf" ? "anyOf" : key, structuredOutputSchema(child)]),
  ) as Record<string, unknown>;
  if (output.type === "object" && output.properties && typeof output.properties === "object" && !Array.isArray(output.properties)) {
    output.additionalProperties = false;
    output.required = Object.keys(output.properties as Record<string, unknown>);
  }
  return output;
}

export const LEARN_CONTENT_MODEL_OUTPUT_JSON_SCHEMA = structuredOutputSchema(
  z.toJSONSchema(learnContentModelEnvelopeSchema),
) as Record<string, unknown>;
