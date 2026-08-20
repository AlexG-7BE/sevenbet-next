import { z } from "zod";

export const AGENT_KEYS = [
  "compliance-gate",
  "repo-architecture-guardian",
  "production-sentinel-analyst",
  "programme-ai-eval",
  "growth-opportunity-radar",
  "serp-competitor-intelligence",
  "partner-operations",
  "digital-pr-data-story",
] as const;

export const AgentKeySchema = z.union([z.enum(AGENT_KEYS), z.literal("partner-intelligence")]);

export const EvidenceClassificationSchema = z.enum([
  "DETECTED",
  "INFERRED",
  "PROPOSED",
  "UNKNOWN",
  "CONTRADICTION",
]);

export const EvidenceKindSchema = z.enum([
  "SUPPLIED_FILE",
  "REPOSITORY_EVIDENCE",
  "DETERMINISTIC_CHECK",
  "PUBLIC_WEB_EVIDENCE",
  "EXPLICIT_INTERNAL_EVIDENCE",
]);

export const ClaimCategorySchema = z.enum([
  "GENERAL",
  "OPERATOR_LICENCE",
  "BONUS",
  "AVAILABILITY",
  "COMMERCIAL_RELATIONSHIP",
  "ARCHITECTURE",
  "PROGRAMME",
  "SAFETY",
  "PERFORMANCE",
  "GROWTH",
  "PARTNER",
  "PR",
]);

const EvidenceIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9._-]*$/);

export const EvidenceItemSchema = z
  .object({
    id: EvidenceIdSchema,
    kind: EvidenceKindSchema,
    title: z.string().min(1).max(160),
    source: z.string().min(1).max(500),
    excerpt: z.string().min(1).max(4_000).optional(),
    observedAt: z.iso.datetime({ offset: true }).optional(),
  })
  .strict();

export const ClaimSchema = z
  .object({
    statement: z.string().min(1).max(1_000),
    category: ClaimCategorySchema,
    classification: EvidenceClassificationSchema,
    evidenceIds: z.array(EvidenceIdSchema).max(10),
  })
  .strict();

export const OperationalAgentInputSchema = z
  .object({
    request: z.string().min(1).max(12_000),
    context: z.string().min(1).max(8_000).optional(),
    evidence: z.array(EvidenceItemSchema).max(30).default([]),
    claims: z.array(ClaimSchema).max(30).default([]),
  })
  .strict()
  .superRefine((input, refinementContext) => {
    const evidenceIds = new Set(input.evidence.map((item) => item.id));

    for (const [claimIndex, claim] of input.claims.entries()) {
      if (
        (claim.classification === "DETECTED" ||
          claim.classification === "INFERRED") &&
        claim.evidenceIds.length === 0
      ) {
        refinementContext.addIssue({
          code: "custom",
          message: `${claim.classification} claims require supplied evidence.`,
          path: ["claims", claimIndex, "evidenceIds"],
        });
      }

      for (const [evidenceIndex, evidenceId] of claim.evidenceIds.entries()) {
        if (!evidenceIds.has(evidenceId)) {
          refinementContext.addIssue({
            code: "custom",
            message: `Unknown evidence reference: ${evidenceId}`,
            path: ["claims", claimIndex, "evidenceIds", evidenceIndex],
          });
        }
      }
    }
  });

export const RunStatusSchema = z.enum([
  "COMPLETED",
  "NEEDS_REVIEW",
  "BLOCKED",
]);

export const RecommendationSchema = z.enum([
  "PASS",
  "REVIEW",
  "BLOCK",
  "GO",
  "GO_WITH_CONDITIONS",
  "STOP",
  "EXPECTED",
  "REGRESSION",
  "AMBIGUOUS",
  "CRITICAL",
  "DRAFT",
]);

export const SeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const ConfidenceSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const ActionPrioritySchema = z.enum(["NOW", "NEXT", "LATER"]);

export const FindingSchema = z
  .object({
    classification: EvidenceClassificationSchema,
    severity: SeveritySchema,
    statement: z.string().min(1).max(2_000),
    evidenceIds: z.array(EvidenceIdSchema).max(10),
  })
  .strict();

export const RiskSchema = z
  .object({
    severity: SeveritySchema,
    description: z.string().min(1).max(2_000),
    evidenceIds: z.array(EvidenceIdSchema).max(10),
  })
  .strict();

export const ActionSchema = z
  .object({
    priority: ActionPrioritySchema,
    description: z.string().min(1).max(2_000),
  })
  .strict();

export const EvidenceGapSchema = z
  .object({
    claim: z.string().min(1).max(1_000),
    requiredEvidence: z.string().min(1).max(1_000),
    impact: z.string().min(1).max(1_000),
  })
  .strict();

export const OperationalAgentResultSchema = z
  .object({
    agent: AgentKeySchema,
    status: RunStatusSchema,
    recommendation: RecommendationSchema,
    summary: z.string().min(1).max(4_000),
    findings: z.array(FindingSchema).max(30),
    risks: z.array(RiskSchema).max(30),
    actions: z.array(ActionSchema).max(30),
    evidenceGaps: z.array(EvidenceGapSchema).max(30),
    confidence: ConfidenceSchema,
  })
  .strict();

export type AgentKey = z.infer<typeof AgentKeySchema>;
export type OperationalAgentInput = z.infer<typeof OperationalAgentInputSchema>;
export type OperationalAgentResult = z.infer<typeof OperationalAgentResultSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
