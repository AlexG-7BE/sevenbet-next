import { z } from "zod";

export const PartnerEvidenceClassificationSchema = z.enum([
  "DETECTED",
  "INFERRED",
  "PROPOSED",
  "UNKNOWN",
  "CONTRADICTION",
]);

export const PartnerEvidenceInputSchema = z.object({
  id: z.string().min(1).max(64),
  sourceType: z.enum(["PUBLIC_WEB", "OFFICIAL_OPERATOR_SOURCE", "REGULATOR_SOURCE", "EMAIL", "APPLICATION_PORTAL", "AGREEMENT", "INTERNAL_RECORD", "OTHER"]),
  sourceAuthority: z.enum(["REGULATOR_OFFICIAL", "ORGANISATION_OFFICIAL", "DIRECT_INTERNAL_RECORD", "OTHER"]).nullable(),
  title: z.string().min(1).max(200),
  claim: z.string().min(1).max(2_000),
  observedAt: z.iso.datetime({ offset: true }).nullable(),
  classification: PartnerEvidenceClassificationSchema,
  status: z.enum(["CURRENT", "STALE", "SUPERSEDED", "DISPUTED", "UNKNOWN"]),
}).strict();

export const PartnerOperationsInputSchema = z.object({
  request: z.string().min(1).max(6_000),
  opportunity: z.object({
    id: z.string().uuid().nullable(),
    displayName: z.string().min(1).max(200),
    legalName: z.string().max(200).nullable(),
    organizationType: z.enum(["DIRECT_OPERATOR", "AFFILIATE_NETWORK", "GROUP", "PLATFORM", "OTHER"]),
    stage: z.enum(["PROSPECT", "QUALIFIED", "APPLICATION_READY", "APPLIED", "DUE_DILIGENCE", "NEGOTIATING", "APPROVED", "ACTIVE", "REJECTED", "ON_HOLD"]),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    strategicFit: z.string().max(2_000).nullable(),
    marketRelevance: z.string().max(2_000).nullable(),
    productFit: z.string().max(2_000).nullable(),
    integrationBurden: z.string().max(2_000).nullable(),
    nextActionSummary: z.string().max(2_000).nullable(),
  }).strict(),
  evidence: z.array(PartnerEvidenceInputSchema).max(60),
  contacts: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(200),
    roleTitle: z.string().max(200).nullable(),
    organizationName: z.string().max(200).nullable(),
    evidenceId: z.string().uuid().nullable(),
  }).strict()).max(30),
  applications: z.array(z.object({
    id: z.string().uuid(),
    type: z.enum(["APPLICATION", "OUTREACH"]),
    state: z.enum(["DRAFT", "PREPARED", "SUBMITTED", "SENT", "RESPONSE_RECEIVED", "CLOSED"]),
    title: z.string().min(1).max(200),
    evidenceId: z.string().uuid().nullable(),
  }).strict()).max(30),
}).strict();

const OperationBaseSchema = z.object({
  operationId: z.string().min(1).max(80).regex(/^[a-zA-Z0-9._-]+$/),
  idempotencyKey: z.string().min(8).max(160),
});

const EvidenceReferenceSchema = z.array(z.string().min(1).max(64)).max(10);

export const PartnerSafeCrmOperationSchema = z.discriminatedUnion("type", [
  OperationBaseSchema.extend({ type: z.literal("CREATE_PROSPECT"), payload: z.object({ displayName: z.string().min(1).max(200), legalName: z.string().max(200).nullable(), organizationType: z.enum(["DIRECT_OPERATOR", "AFFILIATE_NETWORK", "GROUP", "PLATFORM", "OTHER"]), priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]), possibleDuplicateOfId: z.string().uuid().nullable() }).strict() }).strict(),
  OperationBaseSchema.extend({ type: z.literal("UPDATE_PROSPECT_PROFILE"), payload: z.object({ strategicFit: z.string().max(2_000).nullable(), marketRelevance: z.string().max(2_000).nullable(), productFit: z.string().max(2_000).nullable(), integrationBurden: z.string().max(2_000).nullable(), riskNotes: z.string().max(2_000).nullable() }).strict() }).strict(),
  OperationBaseSchema.extend({ type: z.literal("ADD_EVIDENCE"), payload: z.object({ sourceType: z.enum(["PUBLIC_WEB", "OFFICIAL_OPERATOR_SOURCE", "REGULATOR_SOURCE", "EMAIL", "APPLICATION_PORTAL", "AGREEMENT", "INTERNAL_RECORD", "OTHER"]), sourceAuthority: z.enum(["REGULATOR_OFFICIAL", "ORGANISATION_OFFICIAL", "DIRECT_INTERNAL_RECORD", "OTHER"]).nullable(), classification: PartnerEvidenceClassificationSchema, category: z.enum(["IDENTITY", "MARKET_RELEVANCE", "APPLICATION_PATH", "QUALIFICATION", "EXTERNAL_ACTION", "DUE_DILIGENCE", "NEGOTIATION", "APPROVAL", "REJECTION", "COMMERCIAL_TERMS", "CONTACT", "ACTIVATION", "FOUNDER_DECISION", "OTHER"]), sourceUrl: z.url().nullable(), sourceReference: z.string().max(500).nullable(), title: z.string().min(1).max(200), claim: z.string().min(1).max(2_000), notes: z.string().max(2_000).nullable(), observedAt: z.iso.datetime({ offset: true }).nullable(), recheckAt: z.iso.datetime({ offset: true }).nullable(), evidenceIds: EvidenceReferenceSchema.min(1) }).strict() }).strict(),
  OperationBaseSchema.extend({ type: z.literal("ADD_CONTACT"), payload: z.object({ name: z.string().min(1).max(200), roleTitle: z.string().max(200).nullable(), businessEmail: z.email().nullable(), businessPhone: z.string().max(80).nullable(), organizationName: z.string().max(200).nullable(), operationalNotes: z.string().max(2_000).nullable(), evidenceIds: EvidenceReferenceSchema }).strict() }).strict(),
  OperationBaseSchema.extend({ type: z.literal("ADD_RESEARCH_NOTE"), payload: z.object({ summary: z.string().min(1).max(1_000), details: z.string().max(4_000).nullable(), evidenceIds: EvidenceReferenceSchema }).strict() }).strict(),
  OperationBaseSchema.extend({ type: z.literal("CREATE_TASK"), payload: z.object({ taskType: z.enum(["RESEARCH", "EVIDENCE_GAP", "APPLICATION", "OUTREACH", "FOLLOW_UP", "DUE_DILIGENCE", "NEGOTIATION", "ACTIVATION", "OTHER"]), title: z.string().min(1).max(500), dueAt: z.iso.datetime({ offset: true }).nullable() }).strict() }).strict(),
  OperationBaseSchema.extend({ type: z.literal("UPDATE_NEXT_ACTION"), payload: z.object({ summary: z.string().min(1).max(1_000), dueAt: z.iso.datetime({ offset: true }).nullable(), waitingOn: z.enum(["NONE", "INTERNAL_ACTION", "EXTERNAL_PARTY", "EVIDENCE", "FOUNDER_DECISION"]) }).strict() }).strict(),
  OperationBaseSchema.extend({ type: z.literal("CREATE_DRAFT_OUTREACH"), payload: z.object({ title: z.string().min(1).max(200), draftText: z.string().min(1).max(8_000), channel: z.enum(["EMAIL", "APPLICATION_PORTAL", "WEB_FORM", "MEETING", "OTHER"]), followUpAt: z.iso.datetime({ offset: true }).nullable() }).strict() }).strict(),
  OperationBaseSchema.extend({ type: z.literal("CREATE_DRAFT_APPLICATION"), payload: z.object({ title: z.string().min(1).max(200), draftText: z.string().min(1).max(12_000), channel: z.enum(["EMAIL", "APPLICATION_PORTAL", "WEB_FORM", "MEETING", "OTHER"]) }).strict() }).strict(),
  OperationBaseSchema.extend({ type: z.literal("RECORD_RESPONSE"), payload: z.object({ summary: z.string().min(1).max(2_000), evidenceIds: EvidenceReferenceSchema }).strict() }).strict(),
  OperationBaseSchema.extend({ type: z.literal("RECORD_RECEIVED_TERM"), payload: z.object({ model: z.enum(["CPA", "REV_SHARE", "HYBRID", "OTHER"]), amount: z.number().nonnegative().nullable(), percentage: z.number().min(0).max(100).nullable(), currency: z.string().length(3).nullable(), qualifyingEvent: z.string().max(500).nullable(), paymentCadence: z.string().max(500).nullable(), negativeCarryover: z.boolean().nullable(), minimumPayment: z.number().nonnegative().nullable(), territory: z.string().max(500).nullable(), restrictions: z.array(z.string().max(500)).max(20), notes: z.string().max(2_000).nullable(), evidenceIds: EvidenceReferenceSchema.min(1) }).strict() }).strict(),
  OperationBaseSchema.extend({ type: z.literal("PROPOSE_QUALIFICATION"), payload: z.object({ rationale: z.string().min(1).max(2_000), evidenceIds: EvidenceReferenceSchema.min(1) }).strict() }).strict(),
  OperationBaseSchema.extend({ type: z.literal("PROPOSE_STAGE_TRANSITION"), payload: z.object({ targetStage: z.enum(["QUALIFIED", "APPLICATION_READY", "APPLIED", "DUE_DILIGENCE", "NEGOTIATING", "REJECTED", "ON_HOLD"]), reason: z.string().min(1).max(2_000), evidenceIds: EvidenceReferenceSchema }).strict() }).strict(),
  OperationBaseSchema.extend({ type: z.literal("PREPARE_ACTIVATION_PACKET"), payload: z.object({ status: z.enum(["NOT_APPLICABLE", "NOT_READY", "READY_FOR_FOUNDER_REVIEW"]), summary: z.string().min(1).max(2_000), checklist: z.record(z.string(), z.enum(["DETECTED", "UNKNOWN", "NOT_APPLICABLE"])), evidenceIds: EvidenceReferenceSchema }).strict() }).strict(),
]).superRefine((operation, context) => {
  if (operation.type === "ADD_EVIDENCE" && operation.payload.sourceType === "PUBLIC_WEB" && !operation.payload.observedAt) {
    context.addIssue({ code: "custom", message: "Public-web commercial evidence requires observedAt.", path: ["payload", "observedAt"] });
  }
});

const FindingSchema = z.object({ classification: PartnerEvidenceClassificationSchema, statement: z.string().min(1).max(2_000), evidenceIds: EvidenceReferenceSchema }).strict();

export const PartnerOperationsResultSchema = z.object({
  agent: z.literal("partner-operations"),
  status: z.enum(["COMPLETED", "NEEDS_REVIEW", "BLOCKED"]),
  recommendation: z.enum(["DRAFT", "REVIEW", "BLOCK"]),
  summary: z.string().min(1).max(4_000),
  findings: z.array(FindingSchema).max(40),
  evidenceGaps: z.array(z.object({ claim: z.string().min(1).max(1_000), requiredEvidence: z.string().min(1).max(1_000), impact: z.string().min(1).max(1_000) }).strict()).max(40),
  qualification: z.object({ strategicFit: z.enum(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]), gbRelevance: PartnerEvidenceClassificationSchema, applicationAccess: PartnerEvidenceClassificationSchema, evidenceQuality: z.enum(["HIGH", "MEDIUM", "LOW"]), rationale: z.string().min(1).max(2_000), evidenceIds: EvidenceReferenceSchema }).strict(),
  nextActions: z.array(z.object({ priority: z.enum(["NOW", "NEXT", "LATER"]), description: z.string().min(1).max(1_000) }).strict()).max(20),
  stageRecommendation: z.object({ stage: z.enum(["PROSPECT", "QUALIFIED", "APPLICATION_READY", "APPLIED", "DUE_DILIGENCE", "NEGOTIATING", "REJECTED", "ON_HOLD"]), reason: z.string().min(1).max(2_000), evidenceIds: EvidenceReferenceSchema }).strict().nullable(),
  draftApplication: z.object({ title: z.string().min(1).max(200), text: z.string().min(1).max(12_000), needsHumanInput: z.array(z.string().max(500)).max(30) }).strict().nullable(),
  draftOutreach: z.object({ subject: z.string().min(1).max(200), text: z.string().min(1).max(8_000) }).strict().nullable(),
  followUp: z.object({ text: z.string().min(1).max(4_000), timing: z.string().min(1).max(200) }).strict().nullable(),
  detectedResponses: z.array(FindingSchema).max(20),
  commercialTerms: z.array(z.object({ model: z.enum(["CPA", "REV_SHARE", "HYBRID", "OTHER"]), status: z.enum(["PROPOSED", "RECEIVED"]), summary: z.string().min(1).max(2_000), evidenceIds: EvidenceReferenceSchema.min(1) }).strict()).max(20),
  activationReadiness: z.object({ status: z.enum(["NOT_APPLICABLE", "NOT_READY", "READY_FOR_FOUNDER_REVIEW"]), summary: z.string().min(1).max(2_000), evidenceIds: EvidenceReferenceSchema }).strict(),
  proposedCrmOperations: z.array(PartnerSafeCrmOperationSchema).max(30),
}).strict().superRefine((result, context) => {
  const requiringEvidence = result.findings.filter((item) => item.classification === "DETECTED" || item.classification === "INFERRED" || item.classification === "CONTRADICTION");
  for (const [index, finding] of requiringEvidence.entries()) if (finding.evidenceIds.length === 0) context.addIssue({ code: "custom", message: "Detected, inferred, and contradictory findings require evidence.", path: ["findings", index, "evidenceIds"] });
});

const PARTNER_OPERATIONS_FIREWALL_PATTERN = /programme narrative|programme typed|mission answer|starting point|voice|audio|transcript|help usage|pause signal|self-check|vulnerab|self-exclusion|protected safer-gambling data/i;

export function assertPartnerOperationsCommercialFirewall(value: unknown): void {
  if (PARTNER_OPERATIONS_FIREWALL_PATTERN.test(JSON.stringify(value))) {
    throw new Error("Partner Operations input contains protected Programme, Help, vulnerability, or safer-gambling data.");
  }
}

export function validatePartnerOperationsEvidenceReferences(result: PartnerOperationsResult, suppliedEvidenceIds: ReadonlySet<string>): void {
  const references: string[] = [];
  for (const finding of [...result.findings, ...result.detectedResponses]) references.push(...finding.evidenceIds);
  references.push(...result.qualification.evidenceIds, ...(result.stageRecommendation?.evidenceIds ?? []), ...result.activationReadiness.evidenceIds);
  for (const term of result.commercialTerms) references.push(...term.evidenceIds);
  for (const operation of result.proposedCrmOperations) if ("evidenceIds" in operation.payload) references.push(...operation.payload.evidenceIds);
  const unknown = references.find((id) => !suppliedEvidenceIds.has(id));
  if (unknown) throw new Error(`Unknown Partner Operations evidence reference: ${unknown}`);
}

export type PartnerOperationsInput = z.infer<typeof PartnerOperationsInputSchema>;
export type PartnerOperationsResult = z.infer<typeof PartnerOperationsResultSchema>;
export type PartnerSafeCrmOperation = z.infer<typeof PartnerSafeCrmOperationSchema>;
