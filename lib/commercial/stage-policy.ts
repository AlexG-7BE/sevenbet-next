import type { CommercialOpportunityStage } from "@prisma/client";

export interface CommercialStageFacts {
  qualificationRationale: string | null;
  nextActionSummary: string | null;
  evidenceCategories: readonly string[];
  applicationStates: readonly string[];
}

export class CommercialStagePolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommercialStagePolicyError";
  }
}

export function assertHumanCommercialStageTransition(input: {
  current: CommercialOpportunityStage;
  target: CommercialOpportunityStage;
  reason: string;
  facts: CommercialStageFacts;
}): void {
  const reason = input.reason.trim();
  if (!reason) throw new CommercialStagePolicyError("A deliberate transition reason is required.");
  if (input.target === input.current) return;
  if (input.target === "ACTIVE") {
    throw new CommercialStagePolicyError("ACTIVE is controlled by the separate commercial activation authority and is not an ordinary CRM transition.");
  }

  const evidence = new Set(input.facts.evidenceCategories);
  const applications = new Set(input.facts.applicationStates);

  if (input.target === "QUALIFIED" && (!input.facts.qualificationRationale?.trim() || !evidence.has("QUALIFICATION"))) {
    throw new CommercialStagePolicyError("QUALIFIED requires a deliberate rationale and qualification evidence.");
  }
  if (input.target === "APPLICATION_READY" && (!input.facts.nextActionSummary?.trim() || !["DRAFT", "PREPARED"].some((state) => applications.has(state)))) {
    throw new CommercialStagePolicyError("APPLICATION_READY requires prepared application or outreach material and a next action.");
  }
  if (input.target === "APPLIED" && (!evidence.has("EXTERNAL_ACTION") || !["SUBMITTED", "SENT"].some((state) => applications.has(state)))) {
    throw new CommercialStagePolicyError("APPLIED requires evidence of a real external action and a submitted or sent record.");
  }
  if (input.target === "DUE_DILIGENCE" && !evidence.has("DUE_DILIGENCE")) {
    throw new CommercialStagePolicyError("DUE_DILIGENCE requires evidence that diligence is underway.");
  }
  if (input.target === "NEGOTIATING" && !evidence.has("NEGOTIATION")) {
    throw new CommercialStagePolicyError("NEGOTIATING requires substantive negotiation evidence.");
  }
  if (input.target === "APPROVED" && !evidence.has("APPROVAL")) {
    throw new CommercialStagePolicyError("APPROVED requires direct acceptance or approval evidence through a human-controlled action.");
  }
  if (input.target === "REJECTED" && !evidence.has("REJECTION")) {
    throw new CommercialStagePolicyError("REJECTED requires direct rejection or closure evidence.");
  }
}

export const AGENT_PROPOSABLE_STAGES = [
  "QUALIFIED",
  "APPLICATION_READY",
  "APPLIED",
  "DUE_DILIGENCE",
  "NEGOTIATING",
  "REJECTED",
  "ON_HOLD",
] as const satisfies readonly CommercialOpportunityStage[];

export function assertAgentStageProposal(target: string): void {
  if (!(AGENT_PROPOSABLE_STAGES as readonly string[]).includes(target)) {
    throw new CommercialStagePolicyError(`The Partner Operations agent cannot propose ${target}.`);
  }
}
