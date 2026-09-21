import { publicLearnArticlePath } from "@/lib/learn-apply/public-verification";
import { PUBLIC_CANONICAL_ORIGIN } from "@/lib/site";

import { LEARN_CONTENT_ROLE_NAMES, type LearnContentPublishResult, type LearnContentResult } from "./contracts";
import type { LearnContentSessionTrace } from "./openai-managed-session.server";
import type { LearnContentSafeContext } from "./safe-context.server";
import type { LearnContentActiveRun } from "./state-repository.server";

export type LearnContentValidation =
  | { ok: true }
  | { ok: false; code: string };

function fail(code: string): LearnContentValidation {
  return { ok: false, code };
}

function role(trace: LearnContentSessionTrace, name: string) {
  return trace.roles.filter((candidate) => candidate.name === name);
}

export function validateLearnContentRoleTrace(result: LearnContentResult, trace: LearnContentSessionTrace): LearnContentValidation {
  if (!trace.subagentConfigurationValid) return fail("SUBAGENT_CONFIGURATION_INVALID");
  const seo = role(trace, LEARN_CONTENT_ROLE_NAMES[0]);
  if (!seo.length) return fail("SEO_ROLE_MISSING");
  if (result.resultClass === "NO_OP") {
    return seo.length === 1 && trace.roles.length === 1 ? { ok: true } : fail("SEO_ROLE_TRACE_INVALID");
  }
  const research = role(trace, LEARN_CONTENT_ROLE_NAMES[1]);
  const editor = role(trace, LEARN_CONTENT_ROLE_NAMES[2]);
  if (!research.length) return fail("RESEARCH_ROLE_MISSING");
  if (!editor.length) return fail("EDITOR_ROLE_MISSING");
  if (seo.length !== 1 || research.length !== 1 || editor.length !== 1 || trace.roles.length !== LEARN_CONTENT_ROLE_NAMES.length) {
    return fail("ROLE_TRACE_INVALID");
  }
  if (!research.some((candidate) => candidate.webSearchCalls > 0)) return fail("RESEARCH_WEB_SEARCH_MISSING");
  if (!editor.some((candidate) => candidate.webSearchCalls > 0)) return fail("EDITOR_WEB_SEARCH_MISSING");
  return { ok: true };
}

const prohibitedCommercialPath = /^\/(?:casino|casinos|bonuses|best-offers|go|outbound|r|compare|catalog|partner-preview)(?:\/|$)/i;
const unsafeTrackingParameter = /^(?:aff|affiliate|click|ref|refer|subid|utm_|bonus)/i;
const prohibitedPromotion = [
  /\b(?:play|bet|deposit|sign[ -]?up)\s+now\b/i,
  /\bclaim\s+(?:your\s+)?(?:bonus|offer)\b/i,
  /\b(?:guaranteed\s+(?:win|profit)|risk[- ]free\s+(?:bet|gambling)|safe\s+(?:bet|stake))\b/i,
  /\bwin\s+(?:your\s+)?loss(?:es)?\s+back\b/i,
  /\bexclusive\s+(?:casino|betting|bonus)\s+offer\b/i,
  /\b(?:best|top|recommended)\s+(?:online\s+)?(?:casino|betting site|bookmaker)s?\b/i,
  /\b(?:casino|sportsbook|bookmaker)\s+rankings?\b/i,
];

function payloadText(result: LearnContentPublishResult) {
  const article = result.learnApply.article;
  const blocks = article.bodyBlocks.flatMap((block) => {
    if (block.type === "list") return block.items;
    if (block.type === "image") return [block.alt, block.caption ?? "", block.source.type === "generate" ? block.source.prompt : ""];
    if (block.type === "link") return [block.label, block.description ?? ""];
    return [block.text, "title" in block ? block.title ?? "" : "", "citation" in block ? block.citation ?? "" : ""];
  });
  return [article.title, article.excerpt, ...article.tags, article.seo.title ?? "", article.seo.description ?? "", ...blocks].join("\n");
}

function validArticleLink(value: string, evidenceUrls: ReadonlySet<string>) {
  try {
    const url = new URL(value, PUBLIC_CANONICAL_ORIGIN);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    for (const key of url.searchParams.keys()) if (unsafeTrackingParameter.test(key)) return false;
    if (url.origin === PUBLIC_CANONICAL_ORIGIN) return !prohibitedCommercialPath.test(url.pathname);
    return evidenceUrls.has(url.href);
  } catch {
    return false;
  }
}

function validCanonicalUrl(value: string, expectedPath: string) {
  try {
    const url = new URL(value, PUBLIC_CANONICAL_ORIGIN);
    return url.href === `${PUBLIC_CANONICAL_ORIGIN}${expectedPath}`;
  } catch {
    return false;
  }
}

const crisisSafetySignal = /(?:\b(?:self[- ]?harm|suicid|crisis|loss of control|gambling harm|debt crisis|addict(?:ion|ed)?|unable to stop|cannot stop|can't stop|relapse|severe financial harm|serious distress|problem gambling|compulsive gambling|gambling disorder)\b|selbstverletz|suizid|kontrollverlust|spielsucht|schuldenkrise|autolesion|suicid|perdita di controllo|dipendenza dal gioco|p[eé]rdida de control|ludopat|danos? (?:del|do) juego|automutila|perda de control|αυτοτραυματισ|αυτοκτον|απώλεια ελέγχου|zelfbeschadig|zelfmoord|controleverlies|gokschade|självskad|självmord|kontrollförlust|spelskada|selvskad|selvmord|tab af kontrol|spilskade|itsensä vahingoitt|itsemurh|hallinnan menetys|pelihait|tap av kontroll|spillskade)/iu;

function isProtectedHelpLink(value: string, protectedRoutes: LearnContentSafeContext["protectedRoutes"]) {
  try {
    const url = new URL(value, PUBLIC_CANONICAL_ORIGIN);
    if (url.origin !== PUBLIC_CANONICAL_ORIGIN || url.search || url.hash) return false;
    return protectedRoutes.some((route) => url.pathname === route
      || new RegExp(`^/[a-z]{2}(?:-[a-z]{2})?${route}$`, "i").test(url.pathname));
  } catch {
    return false;
  }
}

export function validateLearnContentPublication(input: {
  result: LearnContentPublishResult;
  run: LearnContentActiveRun;
  context: LearnContentSafeContext;
  allowedLocales: ReadonlySet<string>;
  now: Date;
}): LearnContentValidation {
  const { result, run, context } = input;
  const article = result.learnApply.article;
  if (result.runMetadata.runId !== run.runId || result.runMetadata.model !== run.model || result.runMetadata.locale !== run.locale) return fail("RUN_METADATA_MISMATCH");
  if (result.learnApply.requestId !== run.requestId) return fail("REQUEST_ID_MISMATCH");
  if (!input.allowedLocales.has(article.locale) || article.locale !== run.locale) return fail("LOCALE_NOT_ALLOWED");
  if (!context.categories.some((category) => category.slug === article.category)) return fail("CATEGORY_NOT_ALLOWED");
  if (result.seoHandoff.targetSlug !== article.slug) return fail("SEO_TARGET_MISMATCH");

  const generatedAt = new Date(result.runMetadata.generatedAt);
  if (generatedAt < new Date(run.startedAt) || generatedAt > new Date(input.now.valueOf() + 5 * 60 * 1_000)) return fail("RUN_TIMESTAMP_INVALID");

  if (result.seoHandoff.decision === "CREATE") {
    if (article.articleId !== null || article.expectedUpdatedAt !== null || result.seoHandoff.targetArticleId !== null) return fail("CREATE_TARGET_INVALID");
    if (context.articles.some((candidate) => candidate.slug === article.slug)) return fail("CREATE_SLUG_ALREADY_EXISTS");
  } else {
    const target = context.articles.find((candidate) => candidate.id === article.articleId);
    if (!target || result.seoHandoff.targetArticleId !== article.articleId) return fail("UPDATE_TARGET_NOT_FOUND");
    if (article.expectedUpdatedAt !== target.updatedAt) return fail("UPDATE_VERSION_STALE");
  }

  const evidenceById = new Map(result.evidence.map((item) => [item.id, item]));
  if (evidenceById.size !== result.evidence.length) return fail("DUPLICATE_EVIDENCE_ID");
  const claimById = new Map(result.contentPackage.claims.map((item) => [item.id, item]));
  if (claimById.size !== result.contentPackage.claims.length) return fail("DUPLICATE_CLAIM_ID");
  const verified = new Set(result.editorReview.verifiedClaimIds);
  const independentlyChecked = new Set(result.editorReview.independentlyCheckedSourceIds);
  if (verified.size !== result.editorReview.verifiedClaimIds.length || [...verified].some((claimId) => !claimById.has(claimId))) return fail("EDITOR_CLAIM_VERIFICATION_INVALID");
  if (independentlyChecked.size !== result.editorReview.independentlyCheckedSourceIds.length || [...independentlyChecked].some((sourceId) => !evidenceById.has(sourceId))) return fail("EDITOR_SOURCE_VERIFICATION_INVALID");
  const evidenceWindowEnd = new Date(input.now.valueOf() + 5 * 60 * 1_000);
  for (const source of result.evidence) {
    const accessedAt = new Date(source.accessedAt);
    if (accessedAt < new Date(run.startedAt) || accessedAt > evidenceWindowEnd) return fail("EVIDENCE_TIMESTAMP_INVALID");
    if (new Set(source.supportsClaimIds).size !== source.supportsClaimIds.length || source.supportsClaimIds.some((claimId) => !claimById.has(claimId))) {
      return fail("EVIDENCE_CLAIM_MAPPING_INVALID");
    }
  }
  for (const claim of result.contentPackage.claims) {
    if (new Set(claim.sourceIds).size !== claim.sourceIds.length) return fail("DUPLICATE_CLAIM_SOURCE_ID");
    if (claim.material && !verified.has(claim.id)) return fail("MATERIAL_CLAIM_NOT_VERIFIED");
    for (const sourceId of claim.sourceIds) {
      const source = evidenceById.get(sourceId);
      if (!source || !source.supportsClaimIds.includes(claim.id)) return fail("CLAIM_SOURCE_MAPPING_INVALID");
      if (claim.material && !independentlyChecked.has(sourceId)) return fail("MATERIAL_SOURCE_NOT_INDEPENDENTLY_CHECKED");
    }
  }
  if (new Set(result.contentPackage.sourceIds).size !== result.contentPackage.sourceIds.length) return fail("DUPLICATE_CONTENT_SOURCE_ID");
  if (result.contentPackage.sourceIds.some((sourceId) => !evidenceById.has(sourceId))) return fail("CONTENT_SOURCE_NOT_FOUND");

  const evidenceUrls = new Set(result.evidence.map((item) => new URL(item.url).href));
  for (const block of article.bodyBlocks) {
    if (block.type === "link" && !validArticleLink(block.url, evidenceUrls)) return fail("ARTICLE_LINK_NOT_ALLOWED");
    if (block.type === "image" && block.source.type === "url" && !validArticleLink(block.source.url, evidenceUrls)) return fail("ARTICLE_IMAGE_URL_NOT_ALLOWED");
  }
  if (article.heroImage?.source.type === "url" && !validArticleLink(article.heroImage.source.url, evidenceUrls)) return fail("HERO_IMAGE_URL_NOT_ALLOWED");
  const expectedArticlePath = publicLearnArticlePath(article.locale, article.category, article.slug);
  if (article.seo.canonicalUrl && !validCanonicalUrl(article.seo.canonicalUrl, expectedArticlePath)) return fail("CANONICAL_URL_NOT_ALLOWED");

  const text = payloadText(result);
  if (prohibitedPromotion.some((pattern) => pattern.test(text))) return fail("COMMERCIAL_SAFETY_FIREWALL");
  const crisisContext = crisisSafetySignal.test(text);
  if (crisisContext) {
    const protectedLink = article.bodyBlocks.some((block) => block.type === "link" && isProtectedHelpLink(block.url, context.protectedRoutes));
    if (!protectedLink) return fail("CRISIS_HELP_ROUTE_REQUIRED");
  }
  return { ok: true };
}
