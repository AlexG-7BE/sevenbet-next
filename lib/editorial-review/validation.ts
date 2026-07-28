import type { CasinoEditorialDocument, EditorialBlock, EditorialValidationIssue } from "./types";

const safeId = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;
const safeVideoId = /^[a-zA-Z0-9_-]{4,128}$/;
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

function validateBlock(block: EditorialBlock, path: string): EditorialValidationIssue[] {
  const issues: EditorialValidationIssue[] = [];
  if (!safeId.test(block.id)) issues.push({ path: `${path}.id`, code: "INVALID_BLOCK_ID", message: "Block identifiers must be stable URL-safe values." });
  if (block.type === "divider") return issues;
  if (block.type === "image" && (!safeId.test(block.mediaId) || !text(block.alt))) issues.push({ path, code: "INVALID_IMAGE", message: "Images require a canonical media reference and alt text." });
  if (block.type === "video" && (!safeVideoId.test(block.videoId) || !text(block.title))) issues.push({ path, code: "INVALID_VIDEO", message: "Videos require a supported provider, provider ID and title." });
  if ("items" in block && (!block.items.length || block.items.some((item) => !text(item)))) issues.push({ path, code: "EMPTY_LIST", message: "List blocks require at least one non-empty item." });
  if (block.type === "faq" && (!text(block.question) || !text(block.answer))) issues.push({ path, code: "INVALID_FAQ", message: "FAQ blocks require a question and answer." });
  if ("text" in block && !text(block.text)) issues.push({ path, code: "EMPTY_CONTENT", message: "Text blocks cannot be empty." });
  return issues;
}

export function validateEditorialDocument(document: CasinoEditorialDocument): EditorialValidationIssue[] {
  const issues: EditorialValidationIssue[] = [];
  if (document.version !== 1) issues.push({ path: "version", code: "UNSUPPORTED_VERSION", message: "Unsupported editorial document version." });
  if (!text(document.title)) issues.push({ path: "title", code: "REQUIRED", message: "A review title is required." });
  if (!text(document.summary)) issues.push({ path: "summary", code: "REQUIRED", message: "A review summary is required." });
  if (!text(document.author)) issues.push({ path: "author", code: "REQUIRED", message: "A review author is required." });
  if (!text(document.seo?.title) || !text(document.seo?.description)) issues.push({ path: "seo", code: "SEO_REQUIRED", message: "SEO title and description are required." });
  const sectionIds = new Set<string>(); const blockIds = new Set<string>();
  for (const [sectionIndex, section] of document.sections.entries()) {
    const path = `sections[${sectionIndex}]`;
    if (!safeId.test(section.id) || sectionIds.has(section.id)) issues.push({ path: `${path}.id`, code: "DUPLICATE_SECTION", message: "Sections need unique stable identifiers." });
    sectionIds.add(section.id);
    if (!text(section.title)) issues.push({ path: `${path}.title`, code: "REQUIRED", message: "Sections require a title." });
    if (!Number.isInteger(section.order) || section.order < 0) issues.push({ path: `${path}.order`, code: "INVALID_ORDER", message: "Section order must be a non-negative integer." });
    for (const [blockIndex, block] of section.blocks.entries()) {
      if (blockIds.has(block.id)) issues.push({ path: `${path}.blocks[${blockIndex}].id`, code: "DUPLICATE_BLOCK", message: "Block identifiers must be unique in a revision." });
      blockIds.add(block.id); issues.push(...validateBlock(block, `${path}.blocks[${blockIndex}]`));
    }
  }
  if (!document.sections.length) issues.push({ path: "sections", code: "REQUIRED", message: "At least one structured section is required." });
  if (document.trustScore && (document.trustScore.overall < 0 || document.trustScore.overall > 10)) issues.push({ path: "trustScore.overall", code: "INVALID_SCORE", message: "Trust score must be between 0 and 10." });
  return issues;
}
