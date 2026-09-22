import { z } from "zod";

import { learnApplyInputSchema } from "@/lib/learn-apply/contract";

export const LEARN_CONTENT_ROLE_NAMES = [
  "B4GAMBLE SEO Growth Lead",
  "B4GAMBLE Research + Content",
  "B4GAMBLE Editor + Publisher",
] as const;

const isoTimestampSchema = z.string().refine((value) => {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}, "Expected an exact ISO-8601 UTC timestamp.");

const identifierSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/);
const safeHttpsUrlSchema = z.string().url().max(2_000).refine((value) => {
  const parsed = new URL(value);
  return parsed.protocol === "https:" && !parsed.username && !parsed.password;
}, "Evidence URLs must be credential-free HTTPS URLs.");

export const learnContentEvidenceSchema = z.object({
  id: identifierSchema,
  url: safeHttpsUrlSchema,
  title: z.string().trim().min(1).max(300),
  publisher: z.string().trim().min(1).max(200),
  accessedAt: isoTimestampSchema,
  supportsClaimIds: z.array(identifierSchema).min(1).max(40),
}).strict();

export const learnContentClaimSchema = z.object({
  id: identifierSchema,
  text: z.string().trim().min(1).max(2_000),
  sourceIds: z.array(identifierSchema).min(1).max(10),
  material: z.boolean(),
}).strict();

const seoBaseSchema = z.object({
  searchIntent: z.string().trim().min(1).max(500),
  primaryKeyword: z.string().trim().min(1).max(160),
  secondaryKeywords: z.array(z.string().trim().min(1).max(160)).max(12),
  audienceNeed: z.string().trim().min(1).max(1_000),
  rationale: z.string().trim().min(1).max(2_000),
}).strict();

export const learnContentPublishSeoHandoffSchema = seoBaseSchema.extend({
  decision: z.enum(["CREATE", "UPDATE"]),
  targetArticleId: z.string().uuid().nullable(),
  targetSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
}).strict().superRefine((value, context) => {
  if (value.decision === "CREATE" && value.targetArticleId !== null) {
    context.addIssue({ code: "custom", path: ["targetArticleId"], message: "CREATE must not target an existing Article." });
  }
  if (value.decision === "UPDATE" && value.targetArticleId === null) {
    context.addIssue({ code: "custom", path: ["targetArticleId"], message: "UPDATE must target an existing Article." });
  }
});

export const learnContentNoOpSeoHandoffSchema = seoBaseSchema.extend({
  decision: z.enum(["MERGE", "HOLD", "DROP"]),
  targetArticleId: z.string().uuid().nullable(),
  targetSlug: z.string().max(120).nullable(),
}).strict();

export const learnContentSeoHandoffSchema = z.union([
  learnContentPublishSeoHandoffSchema,
  learnContentNoOpSeoHandoffSchema,
]);

export const learnContentPackageSchema = z.object({
  claims: z.array(learnContentClaimSchema).min(1).max(80),
  sourceIds: z.array(identifierSchema).min(1).max(80),
  editorialSummary: z.string().trim().min(1).max(2_000),
  publicBenefit: z.string().trim().min(1).max(1_000),
  wordCount: z.number().int().min(100).max(20_000),
  rewriteRounds: z.number().int().min(0).max(2),
  crisisSafetyReviewed: z.literal(true),
  commercialSeparationReviewed: z.literal(true),
}).strict();

export const learnContentEditorReviewSchema = z.object({
  decision: z.enum(["QA_PASS", "REWRITE_REQUIRED"]),
  verifiedClaimIds: z.array(identifierSchema).max(80),
  independentlyCheckedSourceIds: z.array(identifierSchema).max(80),
  issues: z.array(z.string().trim().min(1).max(1_000)).max(30),
  rewriteRounds: z.number().int().min(0).max(2),
  safetyPassed: z.boolean(),
  publicationIntegrityPassed: z.boolean(),
}).strict();

export const learnContentRunMetadataSchema = z.object({
  runId: z.string().uuid(),
  generatedAt: isoTimestampSchema,
  model: z.string().trim().min(1).max(120),
  locale: z.string().trim().min(2).max(20),
  rewriteRounds: z.number().int().min(0).max(2),
  agentNames: z.tuple([
    z.literal(LEARN_CONTENT_ROLE_NAMES[0]),
    z.literal(LEARN_CONTENT_ROLE_NAMES[1]),
    z.literal(LEARN_CONTENT_ROLE_NAMES[2]),
  ]),
}).strict();

export const learnContentNoOpResultSchema = z.object({
  resultClass: z.literal("NO_OP"),
  seoHandoff: learnContentNoOpSeoHandoffSchema,
  evidence: z.array(learnContentEvidenceSchema).max(80),
  runMetadata: learnContentRunMetadataSchema,
}).strict();

export const learnContentPublishResultSchema = z.object({
  resultClass: z.literal("PUBLISH"),
  seoHandoff: learnContentPublishSeoHandoffSchema,
  contentPackage: learnContentPackageSchema,
  editorReview: learnContentEditorReviewSchema,
  learnApply: learnApplyInputSchema,
  evidence: z.array(learnContentEvidenceSchema).min(1).max(80),
  runMetadata: learnContentRunMetadataSchema,
}).strict().superRefine((value, context) => {
  if (value.editorReview.decision !== "QA_PASS") {
    context.addIssue({ code: "custom", path: ["editorReview", "decision"], message: "Only QA_PASS may enter publication validation." });
  }
  if (!value.editorReview.safetyPassed || !value.editorReview.publicationIntegrityPassed) {
    context.addIssue({ code: "custom", path: ["editorReview"], message: "Both deterministic publication gates must pass." });
  }
  if (value.contentPackage.rewriteRounds !== value.editorReview.rewriteRounds || value.runMetadata.rewriteRounds !== value.editorReview.rewriteRounds) {
    context.addIssue({ code: "custom", path: ["runMetadata", "rewriteRounds"], message: "Rewrite round counts must agree." });
  }
});

export const learnContentBlockedResultSchema = z.object({
  resultClass: z.literal("BLOCKED"),
  blocker: z.object({
    code: z.enum([
      "INSUFFICIENT_EVIDENCE",
      "EDITOR_REWRITE_LIMIT",
      "SAFETY_CONFLICT",
      "DUPLICATE_OR_LOW_VALUE",
      "SOURCE_CONFLICT",
      "OUTPUT_CONTRACT_FAILURE",
    ]),
    retryable: z.boolean(),
  }).strict(),
  evidence: z.array(learnContentEvidenceSchema).max(80),
  runMetadata: learnContentRunMetadataSchema,
}).strict();

export const learnContentResultSchema = z.discriminatedUnion("resultClass", [
  learnContentNoOpResultSchema,
  learnContentPublishResultSchema,
  learnContentBlockedResultSchema,
]);

/**
 * The Managed Agents structured-output contract is deliberately a single
 * object with required nullable branch fields. The application converts that
 * envelope into the stricter discriminated union above before any side effect.
 */
export const learnContentModelEnvelopeSchema = z.object({
  resultClass: z.enum(["NO_OP", "PUBLISH", "BLOCKED"]),
  seoHandoff: learnContentSeoHandoffSchema.nullable(),
  contentPackage: learnContentPackageSchema.nullable(),
  editorReview: learnContentEditorReviewSchema.nullable(),
  learnApply: learnApplyInputSchema.nullable(),
  blocker: learnContentBlockedResultSchema.shape.blocker.nullable(),
  evidence: z.array(learnContentEvidenceSchema).max(80),
  runMetadata: learnContentRunMetadataSchema,
}).strict().superRefine((value, context) => {
  const issue = (path: string, message: string) => context.addIssue({ code: "custom", path: [path], message });
  if (value.resultClass === "NO_OP") {
    if (!value.seoHandoff || !["MERGE", "HOLD", "DROP"].includes(value.seoHandoff.decision)) issue("seoHandoff", "NO_OP requires a MERGE, HOLD, or DROP SEO_HANDOFF.");
    if (value.contentPackage !== null) issue("contentPackage", "NO_OP must not include CONTENT_PACKAGE.");
    if (value.editorReview !== null) issue("editorReview", "NO_OP must not include EDITOR_REVIEW.");
    if (value.learnApply !== null) issue("learnApply", "NO_OP must not include a learn_apply payload.");
    if (value.blocker !== null) issue("blocker", "NO_OP must not include a blocker.");
  } else if (value.resultClass === "BLOCKED") {
    if (value.seoHandoff !== null || value.contentPackage !== null || value.editorReview !== null || value.learnApply !== null) issue("resultClass", "BLOCKED must not include publication branch data.");
    if (value.blocker === null) issue("blocker", "BLOCKED requires an exact blocker.");
  } else {
    if (!value.seoHandoff || !["CREATE", "UPDATE"].includes(value.seoHandoff.decision)) issue("seoHandoff", "PUBLISH requires a CREATE or UPDATE SEO_HANDOFF.");
    if (value.contentPackage === null) issue("contentPackage", "PUBLISH requires CONTENT_PACKAGE.");
    if (value.editorReview === null) issue("editorReview", "PUBLISH requires EDITOR_REVIEW.");
    if (value.learnApply === null) issue("learnApply", "PUBLISH requires a learn_apply payload.");
    if (value.blocker !== null) issue("blocker", "PUBLISH must not include a blocker.");
  }
});

export type LearnContentResult = z.infer<typeof learnContentResultSchema>;
export type LearnContentPublishResult = z.infer<typeof learnContentPublishResultSchema>;
export type LearnContentModelEnvelope = z.infer<typeof learnContentModelEnvelopeSchema>;

export function parseLearnContentModelOutput(value: unknown): LearnContentResult {
  const envelope = learnContentModelEnvelopeSchema.parse(value);
  if (envelope.resultClass === "NO_OP") {
    return learnContentNoOpResultSchema.parse({
      resultClass: envelope.resultClass,
      seoHandoff: envelope.seoHandoff,
      evidence: envelope.evidence,
      runMetadata: envelope.runMetadata,
    });
  }
  if (envelope.resultClass === "BLOCKED") {
    return learnContentBlockedResultSchema.parse({
      resultClass: envelope.resultClass,
      blocker: envelope.blocker,
      evidence: envelope.evidence,
      runMetadata: envelope.runMetadata,
    });
  }
  return learnContentPublishResultSchema.parse({
    resultClass: envelope.resultClass,
    seoHandoff: envelope.seoHandoff,
    contentPackage: envelope.contentPackage,
    editorReview: envelope.editorReview,
    learnApply: envelope.learnApply,
    evidence: envelope.evidence,
    runMetadata: envelope.runMetadata,
  });
}
