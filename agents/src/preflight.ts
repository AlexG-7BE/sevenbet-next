import type {
  AgentKey,
  OperationalAgentInput,
  OperationalAgentResult,
} from "./contracts.js";
import type { SpecialistDefinition } from "./registry.js";

export type PreflightDisposition = "REVIEW" | "BLOCK" | "STOP";

export interface PreflightIssue {
  ruleId: string;
  disposition: PreflightDisposition;
  description: string;
}

export interface PreflightEvidenceGap {
  claim: string;
  requiredEvidence: string;
  impact: string;
}

export interface PreflightAssessment {
  issues: PreflightIssue[];
  evidenceGaps: PreflightEvidenceGap[];
  requiredDisposition: "BLOCK" | "STOP" | null;
}

const COMMERCIAL_CLAIM_CATEGORIES = new Set([
  "OPERATOR_LICENCE",
  "BONUS",
  "AVAILABILITY",
  "COMMERCIAL_RELATIONSHIP",
  "PARTNER",
]);

const UNDATED_PUBLIC_WEB_COMMERCIAL_EVIDENCE_RULE =
  "UNDATED_PUBLIC_WEB_COMMERCIAL_EVIDENCE";

const SYNTHETIC_PRODUCTION_PATTERN =
  /(?:seed|insert|load|create|add|use|publish|deploy).{0,100}(?:(?:synthetic|fictional|fake|dummy|fabricated).{0,40}\bproduction\b|\bproduction\b.{0,40}(?:synthetic|fictional|fake|dummy|fabricated))/is;
const VULNERABILITY_PATTERN = /vulnerab|at[ -]?risk|risk signal|problem gambler/is;
const COMMERCIAL_TARGETING_PATTERN =
  /(?:use|exploit|segment|identify|derive|base).{0,120}(?:commercial|affiliate|promotion|offer|casino|bonus).{0,80}(?:target|personal|segment|rank)|(?:use|exploit|segment|identify|derive|base).{0,120}(?:target|personal|segment|rank).{0,80}(?:commercial|affiliate|promotion|offer|casino|bonus)/is;
const PROGRAMME_PRIVATE_PATTERN =
  /programme|program data|private behavio|starting point|mission answer|support content/is;
const PROGRAMME_COMMERCIAL_PATTERN =
  /(?:use|feed|derive|repurpose|base).{0,100}(?:programme|program data|private behavio|starting point|mission answer|support content).{0,140}(?:affiliate|commercial|target|rank|personal)|(?:use|feed|derive|repurpose|base).{0,100}(?:affiliate|commercial|target|rank|personal).{0,140}(?:programme|program data|private behavio|starting point|mission answer|support content)/is;
const AGENT_ARCHITECTURE_SCOPE_PATTERN =
  /(?:agents?\/|agent package|operational agent).{0,100}(?:prisma|database schema|production write|consumer runtime)|(?:prisma|database schema|production write|consumer runtime).{0,100}(?:agents?\/|agent package|operational agent)/is;

function joinedInputText(input: OperationalAgentInput): string {
  return [
    input.request,
    input.context ?? "",
    ...input.claims.map((claim) => claim.statement),
  ].join("\n");
}

function hardDispositionForAgent(
  agent: AgentKey,
  requested: "BLOCK" | "STOP",
): "BLOCK" | "STOP" {
  if (agent === "repo-architecture-guardian") {
    return "STOP";
  }

  return requested;
}

export function assessPreflight(
  input: OperationalAgentInput,
  agent: AgentKey,
): PreflightAssessment {
  const issues: PreflightIssue[] = [];
  const evidenceGaps: PreflightEvidenceGap[] = [];
  const text = joinedInputText(input);
  const evidenceById = new Map(
    input.evidence.map((evidence) => [evidence.id, evidence]),
  );

  if (SYNTHETIC_PRODUCTION_PATTERN.test(text)) {
    issues.push({
      ruleId: "SYNTHETIC_PRODUCTION_DATA",
      disposition: hardDispositionForAgent(agent, "BLOCK"),
      description: "Synthetic or fictional Production data is prohibited.",
    });
  }

  if (
    VULNERABILITY_PATTERN.test(text) &&
    COMMERCIAL_TARGETING_PATTERN.test(text)
  ) {
    issues.push({
      ruleId: "VULNERABILITY_COMMERCIAL_TARGETING",
      disposition: hardDispositionForAgent(agent, "BLOCK"),
      description:
        "Vulnerability-derived commercial targeting or personalisation is prohibited.",
    });
  }

  if (
    PROGRAMME_PRIVATE_PATTERN.test(text) &&
    PROGRAMME_COMMERCIAL_PATTERN.test(text)
  ) {
    issues.push({
      ruleId: "PROGRAMME_COMMERCIAL_MIXING",
      disposition: hardDispositionForAgent(agent, "BLOCK"),
      description:
        "Programme or private behavioural data cannot feed affiliate targeting or commercial recommendation logic.",
    });
  }

  if (
    agent === "repo-architecture-guardian" &&
    AGENT_ARCHITECTURE_SCOPE_PATTERN.test(text)
  ) {
    issues.push({
      ruleId: "AGENT_ARCHITECTURE_SCOPE_CREEP",
      disposition: "STOP",
      description:
        "The Wave 1 agent package cannot import Prisma, mutate Production, change schema, or join the consumer runtime.",
    });
  }

  for (const claim of input.claims) {
    const referencedEvidence = claim.evidenceIds.flatMap((evidenceId) => {
      const evidence = evidenceById.get(evidenceId);
      return evidence ? [evidence] : [];
    });
    const hasUndatedPublicWebCommercialEvidence =
      COMMERCIAL_CLAIM_CATEGORIES.has(claim.category) &&
      referencedEvidence.some(
        (evidence) =>
          evidence.kind === "PUBLIC_WEB_EVIDENCE" && !evidence.observedAt,
      );
    const missingCommercialEvidence =
      COMMERCIAL_CLAIM_CATEGORIES.has(claim.category) &&
      claim.evidenceIds.length === 0;
    const explicitlyUnknown = claim.classification === "UNKNOWN";

    if (hasUndatedPublicWebCommercialEvidence) {
      issues.push({
        ruleId: UNDATED_PUBLIC_WEB_COMMERCIAL_EVIDENCE_RULE,
        disposition: "REVIEW",
        description:
          "Public-web evidence supporting a material commercial claim requires an observedAt timestamp.",
      });
      evidenceGaps.push({
        claim: claim.statement,
        requiredEvidence:
          "A truthful observedAt timestamp for each supplied PUBLIC_WEB_EVIDENCE item supporting this material commercial claim.",
        impact:
          "Undated public-web evidence does not establish that the claim is current and cannot support approval, availability, partnership, or commercial activation.",
      });
    }

    if (!missingCommercialEvidence && !explicitlyUnknown) {
      continue;
    }

    issues.push({
      ruleId: "COMMERCIAL_EVIDENCE_GAP",
      disposition: "REVIEW",
      description:
        "A material claim lacks evidence and must remain UNKNOWN rather than being presented as verified.",
    });
    evidenceGaps.push({
      claim: claim.statement,
      requiredEvidence:
        "Current, directly supporting evidence from an authoritative supplied source.",
      impact:
        "The claim must remain UNKNOWN and cannot support publication, approval, availability, or a commercial decision.",
    });
  }

  const requiredDisposition = issues.some(
    (issue) => issue.disposition === "STOP",
  )
    ? "STOP"
    : issues.some((issue) => issue.disposition === "BLOCK")
      ? "BLOCK"
      : null;

  return { issues, evidenceGaps, requiredDisposition };
}

export function buildDeterministicBlockedResult(
  definition: SpecialistDefinition,
  assessment: PreflightAssessment,
): OperationalAgentResult {
  const recommendation = definition.allowedRecommendations.includes("STOP")
    ? "STOP"
    : definition.allowedRecommendations.includes("BLOCK")
      ? "BLOCK"
      : definition.allowedRecommendations.includes("CRITICAL")
        ? "CRITICAL"
        : definition.allowedRecommendations[0];

  if (!recommendation) {
    throw new Error("The specialist has no allowed recommendation.");
  }

  return {
    agent: definition.key,
    status: "BLOCKED",
    recommendation,
    summary:
      "Deterministic preflight stopped the run because the request crosses an approved B4GAMBLE hard boundary.",
    findings: assessment.issues
      .filter((issue) => issue.disposition !== "REVIEW")
      .map((issue) => ({
        classification: "PROPOSED" as const,
        severity: "CRITICAL" as const,
        statement: `${issue.ruleId}: ${issue.description}`,
        evidenceIds: [],
      })),
    risks: assessment.issues
      .filter((issue) => issue.disposition !== "REVIEW")
      .map((issue) => ({
        severity: "CRITICAL" as const,
        description: issue.description,
        evidenceIds: [],
      })),
    actions: [
      {
        priority: "NOW",
        description:
          "Do not proceed with the prohibited proposal; return it to human governance for a compliant alternative.",
      },
    ],
    evidenceGaps: assessment.evidenceGaps,
    confidence: "HIGH",
  };
}

export function enforcePreflight(
  result: OperationalAgentResult,
  assessment: PreflightAssessment,
  definition: SpecialistDefinition,
): OperationalAgentResult {
  if (assessment.requiredDisposition) {
    throw new Error(
      "A provider result cannot be used for a deterministically blocked request.",
    );
  }

  const existingClaims = new Set(result.evidenceGaps.map((gap) => gap.claim));
  const missingGaps = assessment.evidenceGaps.filter(
    (gap) => !existingClaims.has(gap.claim),
  );

  if (missingGaps.length === 0) {
    return result;
  }

  const recommendation = definition.allowedRecommendations.includes("REVIEW")
    ? "REVIEW"
    : definition.allowedRecommendations.includes("GO_WITH_CONDITIONS")
      ? "GO_WITH_CONDITIONS"
      : result.recommendation;

  return {
    ...result,
    status: "NEEDS_REVIEW",
    recommendation,
    evidenceGaps: [...result.evidenceGaps, ...missingGaps],
  };
}
