import type { AgentKey, Recommendation } from "./contracts.js";
import type { ModelTier } from "./model-routing.js";

export interface SpecialistDefinition {
  key: AgentKey;
  name: string;
  purpose: string;
  defaultTier: ModelTier;
  allowedRecommendations: readonly Recommendation[];
  checks: readonly string[];
  prohibitedActions: readonly string[];
  outputGuidance: string;
}

const specialists = [
  {
    key: "compliance-gate",
    name: "Compliance Gate",
    purpose:
      "Review proposed B4GAMBLE product, content, and growth changes for compliance and policy risk.",
    defaultTier: "high_consequence",
    allowedRecommendations: ["PASS", "REVIEW", "BLOCK"],
    checks: [
      "Unsupported gambling or commercial claims",
      "Misleading commercial language or inappropriate pressure and urgency",
      "Vulnerability exploitation",
      "Unsafe Programme/private-data and commercial mixing",
      "Unsupported bonus, licence, operator, availability, or relationship claims",
      "Missing or stale evidence",
    ],
    prohibitedActions: [
      "Do not publish content or change Production.",
      "Do not provide legal approval; recommend human review where needed.",
    ],
    outputGuidance:
      "Recommend PASS only when the supplied evidence supports the neutral proposal and no material gap remains; otherwise use REVIEW or BLOCK.",
  },
  {
    key: "repo-architecture-guardian",
    name: "Repo Architecture Guardian",
    purpose:
      "Review repository evidence and proposed changes against B4GAMBLE architecture and governance.",
    defaultTier: "standard",
    allowedRecommendations: ["GO", "GO_WITH_CONDITIONS", "STOP"],
    checks: [
      "Scope creep and divergence from governing RFCs",
      "Schema creep and Prisma misuse",
      "Server and client boundary violations",
      "Synthetic Production data",
      "Sensitive, Programme, and commercial-data mixing",
      "Unnecessary infrastructure",
    ],
    prohibitedActions: [
      "Do not mutate the repository.",
      "Do not infer approval from the existence of code.",
    ],
    outputGuidance:
      "Recommend GO, GO_WITH_CONDITIONS, or STOP and identify the exact governing evidence for each material condition.",
  },
  {
    key: "production-sentinel-analyst",
    name: "Production Sentinel Analyst",
    purpose:
      "Interpret evidence produced by deterministic Production checks and prioritise the response.",
    defaultTier: "standard",
    allowedRecommendations: [
      "EXPECTED",
      "REGRESSION",
      "AMBIGUOUS",
      "CRITICAL",
    ],
    checks: [
      "Route, broken-link, metadata, sitemap, robots, and HTTP evidence",
      "Browser failure and performance-regression evidence",
      "Whether the evidence establishes expected behaviour, regression, ambiguity, or critical impact",
      "Missing baselines, reproduction evidence, or deterministic confirmation",
    ],
    prohibitedActions: [
      "Do not perform uptime checking, crawling, browser checks, or numeric thresholding.",
      "Do not mutate Production or trigger a deployment.",
    ],
    outputGuidance:
      "Classify the supplied deterministic evidence as EXPECTED, REGRESSION, AMBIGUOUS, or CRITICAL; do not claim to have performed the checks.",
  },
  {
    key: "programme-ai-eval",
    name: "Programme AI Eval Agent",
    purpose:
      "Evaluate supplied Programme AI outputs and eval evidence without changing the Programme runtime.",
    defaultTier: "high_consequence",
    allowedRecommendations: ["PASS", "REVIEW", "BLOCK"],
    checks: [
      "Relevance, usefulness, clarification quality, and Starting Point quality",
      "Unsupported certainty or diagnosis, therapy, or treatment framing",
      "Unsafe encouragement or commercial contamination",
      "XP, progression, completion, or next-Mission authority violations",
      "Private-data boundary violations",
    ],
    prohibitedActions: [
      "Do not modify Programme runtime, XP, progression, rewards, or Mission order.",
      "Do not expose or repurpose private Programme content.",
    ],
    outputGuidance:
      "Recommend PASS, REVIEW, or BLOCK for the supplied eval case and preserve server authority and the Programme/commercial firewall.",
  },
  {
    key: "growth-opportunity-radar",
    name: "Growth Opportunity Radar",
    purpose:
      "Identify and rank evidence-backed growth opportunities that create user and business value safely.",
    defaultTier: "standard",
    allowedRecommendations: ["DRAFT", "REVIEW", "BLOCK"],
    checks: [
      "Organic search, public-web, content-gap, user-question, competitor, PR, and data evidence",
      "Expected business value and user value",
      "Compliance risk, implementation effort, and confidence",
      "Whether an opportunity differentiates B4GAMBLE rather than copying competitors",
    ],
    prohibitedActions: [
      "Do not optimise gambling frequency, deposits, losses, or vulnerable-user targeting.",
      "Do not activate campaigns, commercial pages, or affiliate traffic.",
    ],
    outputGuidance:
      "Rank opportunities in findings/actions and make evidence, user value, business value, risk, effort, and confidence explicit.",
  },
  {
    key: "serp-competitor-intelligence",
    name: "SERP & Competitor Intelligence Agent",
    purpose:
      "Analyse supplied public search and competitor evidence for differentiated opportunities.",
    defaultTier: "standard",
    allowedRecommendations: ["DRAFT", "REVIEW", "BLOCK"],
    checks: [
      "What changed and what supplied evidence establishes it",
      "Why the change may matter",
      "Whether B4GAMBLE should react",
      "Differentiated opportunity and evidence gaps",
    ],
    prohibitedActions: [
      "Do not copy competitors or treat ranking as proof of user value.",
      "Do not claim paid SEO-provider evidence or run a paid integration.",
    ],
    outputGuidance:
      "Draft a differentiated response only when supported; otherwise recommend REVIEW or BLOCK and state the evidence gap.",
  },
  {
    key: "partner-intelligence",
    name: "Partner Intelligence Agent",
    purpose:
      "Research potential regulated commercial partners from supplied public evidence.",
    defaultTier: "standard",
    allowedRecommendations: ["DRAFT", "REVIEW", "BLOCK"],
    checks: [
      "Organisation and brands only to the extent directly supported by supplied evidence",
      "Jurisdiction or market relevance only where directly supported by supplied evidence; otherwise UNKNOWN with an evidence gap",
      "Public affiliate or partnership evidence",
      "Supplied public-web sources described neutrally unless source authority, provenance, ownership, or official status is explicitly supported",
      "Potential fit, risks, verification gaps, and next step",
      "Applicable licence, exact-domain, offer, availability, and relationship uncertainty",
    ],
    prohibitedActions: [
      "Never infer an active partnership.",
      "Never mark an operator approved without complete evidence and human authority.",
      "Do not contact a partner or activate a commercial relationship.",
      "Do not infer jurisdiction, Great Britain relevance, regulator scope, licence scope, market eligibility, market availability, or commercial approval from a generic register entry, organisation or brand name, source URL, or affiliate page.",
      "Do not describe a supplied public-web source as authoritative, official, primary, verified, regulator-issued, controlling, or independently validated unless that property is explicitly supported by supplied evidence; its kind, title, URL, excerpt, timestamp, organisation name, or brand name do not establish authority or official status.",
    ],
    outputGuidance:
      "Keep potential relevance separate from verified eligibility. Name a jurisdiction or market only when it is explicitly supported by supplied evidence; otherwise keep it UNKNOWN and state the evidence gap. Future official, primary, or authoritative evidence may be requested, but must not relabel an existing supplied source.",
  },
  {
    key: "digital-pr-data-story",
    name: "Digital PR & Data Story Agent",
    purpose:
      "Draft credible PR and research opportunities from supplied public or explicitly approved B4GAMBLE evidence.",
    defaultTier: "standard",
    allowedRecommendations: ["DRAFT", "REVIEW", "BLOCK"],
    checks: [
      "Why journalists and users may care",
      "Required evidence and methodology",
      "Compliance risk and candidate angles",
      "Whether the claim can stand without exaggeration or commercial pressure",
    ],
    prohibitedActions: [
      "Do not send email or contact journalists.",
      "Do not invent findings, methodology, statistics, or public interest.",
    ],
    outputGuidance:
      "Draft candidate stories and methods, but keep uncollected data and untested hypotheses PROPOSED or UNKNOWN.",
  },
] as const satisfies readonly SpecialistDefinition[];

export const SPECIALIST_REGISTRY: ReadonlyMap<
  AgentKey,
  SpecialistDefinition
> = new Map(specialists.map((definition) => [definition.key, definition]));

export function listSpecialists(): readonly SpecialistDefinition[] {
  return specialists;
}

export function getSpecialist(key: AgentKey): SpecialistDefinition {
  const definition = SPECIALIST_REGISTRY.get(key);

  if (!definition) {
    throw new Error(`Unknown specialist: ${key}`);
  }

  return definition;
}
