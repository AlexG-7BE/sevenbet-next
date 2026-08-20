import { z } from "zod";

const IdempotencyKey = z.string().min(8).max(160);
const NullableText = (max: number) => z.string().max(max).nullable().optional();
const EvidenceKeyReference = z.string().min(8).max(160);

export const CommercialMcpListSchema = z.object({
  search: z.string().min(1).max(200).optional(),
  stages: z.array(z.enum(["PROSPECT", "QUALIFIED", "APPLICATION_READY", "APPLIED", "DUE_DILIGENCE", "NEGOTIATING", "APPROVED", "ACTIVE", "REJECTED", "ON_HOLD"])).max(10).optional(),
  priorities: z.array(z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"])).max(4).optional(),
  limit: z.number().int().min(1).max(50).default(25),
  offset: z.number().int().min(0).max(500).default(0),
}).strict();

export const CommercialMcpGetSchema = z.object({
  opportunityId: z.string().uuid(),
}).strict();

export const CommercialMcpDuplicateSchema = z.object({
  displayName: z.string().min(1).max(200),
  legalName: z.string().max(200).nullable().optional(),
  limit: z.number().int().min(1).max(20).default(10),
}).strict();

const ExternalEvidenceSchema = z.object({
  idempotencyKey: IdempotencyKey,
  sourceType: z.enum(["PUBLIC_WEB", "OFFICIAL_OPERATOR_SOURCE", "REGULATOR_SOURCE", "EMAIL", "APPLICATION_PORTAL", "AGREEMENT", "INTERNAL_RECORD", "OTHER"]),
  sourceUrl: z.string().url().max(2_000).nullable().optional(),
  sourceReference: z.string().max(500).nullable().optional(),
  title: z.string().min(1).max(200),
  claim: z.string().min(1).max(2_000),
  classification: z.enum(["DETECTED", "INFERRED", "PROPOSED", "UNKNOWN", "CONTRADICTION"]),
  category: z.enum(["IDENTITY", "MARKET_RELEVANCE", "APPLICATION_PATH", "QUALIFICATION", "EXTERNAL_ACTION", "DUE_DILIGENCE", "NEGOTIATION", "APPROVAL", "REJECTION", "COMMERCIAL_TERMS", "CONTACT", "ACTIVATION", "FOUNDER_DECISION", "OTHER"]),
  observedAt: z.string().datetime({ offset: true }).nullable().optional(),
  notes: z.string().max(2_000).nullable().optional(),
  recheckAt: z.string().datetime({ offset: true }).nullable().optional(),
}).strict().superRefine((value, context) => {
  if (!value.sourceUrl && !value.sourceReference) {
    context.addIssue({ code: "custom", path: ["sourceReference"], message: "A source URL or source reference is required" });
  }
  if (value.sourceType === "PUBLIC_WEB" && !value.observedAt) {
    context.addIssue({ code: "custom", path: ["observedAt"], message: "Public-web evidence requires observedAt" });
  }
});

const ProfileSchema = z.object({
  idempotencyKey: IdempotencyKey,
  strategicFit: NullableText(2_000),
  marketRelevance: NullableText(2_000),
  productFit: NullableText(2_000),
  integrationBurden: NullableText(2_000),
  riskNotes: NullableText(2_000),
}).strict();

const ContactSchema = z.object({
  idempotencyKey: IdempotencyKey,
  evidenceIdempotencyKey: EvidenceKeyReference,
  name: z.string().min(1).max(200),
  roleTitle: NullableText(200),
  businessEmail: z.string().email().nullable().optional(),
  businessPhone: NullableText(80),
  organizationName: NullableText(200),
  operationalNotes: NullableText(2_000),
}).strict();

const ResearchNoteSchema = z.object({
  idempotencyKey: IdempotencyKey,
  summary: z.string().min(1).max(500),
  details: NullableText(2_000),
  evidenceIdempotencyKeys: z.array(EvidenceKeyReference).max(10).default([]),
}).strict();

const TaskSchema = z.object({
  idempotencyKey: IdempotencyKey,
  type: z.enum(["RESEARCH", "EVIDENCE_GAP", "APPLICATION", "OUTREACH", "FOLLOW_UP", "DUE_DILIGENCE", "NEGOTIATION", "ACTIVATION", "OTHER"]),
  title: z.string().min(1).max(500),
  dueAt: z.string().datetime({ offset: true }).nullable().optional(),
}).strict();

const NextActionSchema = z.object({
  idempotencyKey: IdempotencyKey,
  summary: z.string().min(1).max(1_000),
  dueAt: z.string().datetime({ offset: true }).nullable().optional(),
  waitingOn: z.enum(["NONE", "INTERNAL_ACTION", "EXTERNAL_PARTY", "EVIDENCE", "FOUNDER_DECISION"]),
}).strict();

const DraftSchema = z.object({
  idempotencyKey: IdempotencyKey,
  type: z.enum(["APPLICATION", "OUTREACH"]),
  state: z.enum(["DRAFT", "PREPARED"]),
  channel: z.enum(["EMAIL", "APPLICATION_PORTAL", "WEB_FORM", "MEETING", "OTHER"]),
  title: z.string().min(1).max(200),
  draftText: z.string().max(12_000).nullable().optional(),
  evidenceIdempotencyKey: EvidenceKeyReference.nullable().optional(),
  followUpAt: z.string().datetime({ offset: true }).nullable().optional(),
}).strict().superRefine((value, context) => {
  if (value.type === "OUTREACH" && value.state !== "DRAFT") {
    context.addIssue({ code: "custom", path: ["state"], message: "Outreach can only be stored as DRAFT" });
  }
});

const TermSchema = z.object({
  idempotencyKey: IdempotencyKey,
  evidenceIdempotencyKey: EvidenceKeyReference,
  model: z.enum(["CPA", "REV_SHARE", "HYBRID", "OTHER"]),
  status: z.enum(["PROPOSED", "RECEIVED"]),
  amount: z.number().nonnegative().nullable().optional(),
  percentage: z.number().min(0).max(100).nullable().optional(),
  currency: z.string().length(3).nullable().optional(),
  qualifyingEvent: NullableText(500),
  paymentCadence: NullableText(200),
  negativeCarryover: z.boolean().nullable().optional(),
  minimumPayment: z.number().nonnegative().nullable().optional(),
  territory: NullableText(500),
  trafficRestrictions: z.array(z.string().max(500)).max(20).default([]),
  terminationConditions: NullableText(2_000),
  trackingRequirements: NullableText(2_000),
  entityRequirements: NullableText(2_000),
  specialConditions: NullableText(2_000),
  notes: NullableText(2_000),
}).strict();

const ProposalBase = z.object({
  idempotencyKey: IdempotencyKey,
  reason: z.string().min(1).max(2_000),
  evidenceIdempotencyKeys: z.array(EvidenceKeyReference).min(1).max(10),
}).strict();

const ActivationPacketSchema = z.object({
  idempotencyKey: IdempotencyKey,
  status: z.enum(["NOT_APPLICABLE", "NOT_READY", "READY_FOR_FOUNDER_REVIEW"]),
  summary: z.string().min(1).max(2_000),
  checklist: z.record(z.string(), z.union([z.string(), z.boolean(), z.number(), z.null()])).refine((value) => Object.keys(value).length <= 30, "Checklist is limited to 30 fields"),
  evidenceIdempotencyKeys: z.array(EvidenceKeyReference).max(20).default([]),
}).strict();

export const CommercialMcpResearchBundleSchema = z.object({
  idempotencyKey: IdempotencyKey,
  opportunity: z.object({
    opportunityId: z.string().uuid().optional(),
    displayName: z.string().min(1).max(200),
    legalName: z.string().max(200).nullable().optional(),
    organizationType: z.enum(["DIRECT_OPERATOR", "AFFILIATE_NETWORK", "GROUP", "PLATFORM", "OTHER"]).default("OTHER"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
    possibleDuplicateOfId: z.string().uuid().nullable().optional(),
  }).strict(),
  profile: ProfileSchema.optional(),
  evidence: z.array(ExternalEvidenceSchema).max(25).default([]),
  contacts: z.array(ContactSchema).max(20).default([]),
  researchNotes: z.array(ResearchNoteSchema).max(20).default([]),
  tasks: z.array(TaskSchema).max(20).default([]),
  nextAction: NextActionSchema.optional(),
  drafts: z.array(DraftSchema).max(10).default([]),
  terms: z.array(TermSchema).max(10).default([]),
  qualificationProposal: ProposalBase.extend({ rationale: z.string().min(1).max(2_000) }).strict().optional(),
  stageProposal: ProposalBase.extend({ targetStage: z.enum(["QUALIFIED", "APPLICATION_READY"]) }).strict().optional(),
  activationPacket: ActivationPacketSchema.optional(),
}).strict().superRefine((value, context) => {
  const keys = value.evidence.map((item) => item.idempotencyKey);
  if (new Set(keys).size !== keys.length) {
    context.addIssue({ code: "custom", path: ["evidence"], message: "Evidence idempotency keys must be unique in a bundle" });
  }
  const knownEvidence = new Set(keys);
  const evidenceByKey = new Map(value.evidence.map((item) => [item.idempotencyKey, item]));
  const references = [
    ...value.contacts.map((item) => item.evidenceIdempotencyKey),
    ...value.researchNotes.flatMap((item) => item.evidenceIdempotencyKeys),
    ...value.drafts.flatMap((item) => item.evidenceIdempotencyKey ? [item.evidenceIdempotencyKey] : []),
    ...value.terms.map((item) => item.evidenceIdempotencyKey),
    ...(value.qualificationProposal?.evidenceIdempotencyKeys ?? []),
    ...(value.stageProposal?.evidenceIdempotencyKeys ?? []),
    ...(value.activationPacket?.evidenceIdempotencyKeys ?? []),
  ];
  for (const reference of references) {
    if (!knownEvidence.has(reference)) {
      context.addIssue({ code: "custom", path: ["evidence"], message: `Evidence reference ${reference} must be included in this bundle` });
    }
  }
  for (const term of value.terms) {
    const evidence = evidenceByKey.get(term.evidenceIdempotencyKey);
    if (evidence && evidence.classification !== "DETECTED") {
      context.addIssue({ code: "custom", path: ["terms"], message: "Commercial term values require DETECTED evidence; inferred values are not accepted" });
    }
    if (term.status === "RECEIVED" && evidence && !["EMAIL", "APPLICATION_PORTAL", "AGREEMENT", "OFFICIAL_OPERATOR_SOURCE"].includes(evidence.sourceType)) {
      context.addIssue({ code: "custom", path: ["terms"], message: "RECEIVED terms require direct operator, portal, email, or agreement evidence" });
    }
  }
});

export type CommercialMcpListInput = z.infer<typeof CommercialMcpListSchema>;
export type CommercialMcpDuplicateInput = z.infer<typeof CommercialMcpDuplicateSchema>;
export type CommercialMcpResearchBundle = z.infer<typeof CommercialMcpResearchBundleSchema>;
