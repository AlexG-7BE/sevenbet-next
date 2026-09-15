import { PUBLISHED_LANGUAGE_ROUTE_PROFILES } from "@/lib/market/registry";
import { safePublicUrl } from "@/lib/public-casino/public-casino-validation";
import { siteUrl } from "@/lib/site";

import type {
  ArticleBlock,
  ArticleDocumentInput,
  ArticleValidationIssue,
} from "./article-types";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const blockIdPattern = /^[a-zA-Z0-9_-]{1,80}$/;
const allowedLocales = new Set(PUBLISHED_LANGUAGE_ROUTE_PROFILES.map((profile) => profile.defaultLocale));
const allowedDifficulties = new Set(["Beginner", "Intermediate", "Advanced"]);

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function text(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function optionalText(value: unknown, maximum: number) {
  const parsed = text(value, maximum);
  return parsed || null;
}

function safeUrl(value: unknown, allowInternal = true) {
  const parsed = safePublicUrl(value, { allowInternal });
  if (!parsed || /[\\\u0000-\u001f]/.test(parsed)) return null;
  return parsed;
}

function safeCanonicalUrl(value: unknown) {
  const parsed = safeUrl(value);
  if (!parsed) return null;
  try {
    const absolute = new URL(parsed, siteUrl);
    return absolute.origin === new URL(siteUrl).origin ? parsed : null;
  } catch {
    return null;
  }
}

export function articleLocales() {
  return [...allowedLocales];
}

export function validateArticleBlocks(value: unknown) {
  const issues: ArticleValidationIssue[] = [];
  if (!Array.isArray(value)) {
    return { blocks: [] as ArticleBlock[], issues: [{ path: "bodyBlocks", message: "Body blocks must be an array." }] };
  }
  if (value.length > 100) issues.push({ path: "bodyBlocks", message: "An article can contain at most 100 blocks." });

  const ids = new Set<string>();
  const blocks = value.slice(0, 100).flatMap((candidate, index): ArticleBlock[] => {
    const input = record(candidate);
    const path = `bodyBlocks.${index}`;
    if (!input) {
      issues.push({ path, message: "Block must be an object." });
      return [];
    }
    const id = text(input.id, 80);
    if (!blockIdPattern.test(id) || ids.has(id)) {
      issues.push({ path: `${path}.id`, message: "Block id must be unique and contain only letters, numbers, underscores or hyphens." });
      return [];
    }
    ids.add(id);

    if (input.type === "paragraph") {
      const body = text(input.text, 12_000);
      if (!body) issues.push({ path: `${path}.text`, message: "Paragraph text is required." });
      return [{ id, type: "paragraph", text: body }];
    }
    if (input.type === "heading") {
      const body = text(input.text, 240);
      const level = input.level === 3 ? 3 : 2;
      if (!body) issues.push({ path: `${path}.text`, message: "Heading text is required." });
      return [{ id, type: "heading", level, text: body }];
    }
    if (input.type === "list") {
      const items = Array.isArray(input.items)
        ? input.items.map((item) => text(item, 1_000)).filter(Boolean).slice(0, 30)
        : [];
      if (!items.length) issues.push({ path: `${path}.items`, message: "List needs at least one item." });
      return [{ id, type: "list", style: input.style === "numbered" ? "numbered" : "bullet", items }];
    }
    if (input.type === "quote") {
      const body = text(input.text, 3_000);
      if (!body) issues.push({ path: `${path}.text`, message: "Quote text is required." });
      return [{ id, type: "quote", text: body, ...(optionalText(input.citation, 240) ? { citation: optionalText(input.citation, 240)! } : {}) }];
    }
    if (input.type === "callout") {
      const body = text(input.text, 4_000);
      if (!body) issues.push({ path: `${path}.text`, message: "Callout text is required." });
      return [{ id, type: "callout", text: body, ...(optionalText(input.title, 240) ? { title: optionalText(input.title, 240)! } : {}) }];
    }
    if (input.type === "image") {
      const url = safeUrl(input.url);
      const alt = text(input.alt, 500);
      if (!url) issues.push({ path: `${path}.url`, message: "Image URL must be an internal path or a safe HTTPS URL." });
      if (!alt) issues.push({ path: `${path}.alt`, message: "Image alt text is required." });
      return [{ id, type: "image", url: url ?? "", alt, ...(optionalText(input.caption, 500) ? { caption: optionalText(input.caption, 500)! } : {}) }];
    }
    if (input.type === "link") {
      const url = safeUrl(input.url);
      const label = text(input.label, 240);
      if (!url) issues.push({ path: `${path}.url`, message: "Link URL must be an internal path or a safe HTTPS URL." });
      if (!label) issues.push({ path: `${path}.label`, message: "Link label is required." });
      return [{ id, type: "link", label, url: url ?? "", ...(optionalText(input.description, 1_000) ? { description: optionalText(input.description, 1_000)! } : {}) }];
    }

    issues.push({ path: `${path}.type`, message: "Unsupported block type." });
    return [];
  });

  return { blocks, issues };
}

export function validateArticleDocument(value: unknown) {
  const input = record(value) ?? {};
  const issues: ArticleValidationIssue[] = [];
  const slug = text(input.slug, 120);
  const category = text(input.category, 120);
  const locale = text(input.locale, 20);
  if (!slugPattern.test(slug)) issues.push({ path: "slug", message: "Slug must use lowercase letters, numbers and single hyphens." });
  if (!slugPattern.test(category)) issues.push({ path: "category", message: "Category must be a URL-safe slug." });
  if (!allowedLocales.has(locale as never)) issues.push({ path: "locale", message: "Choose a published language-route locale." });

  const rawHeroUrl = optionalText(input.heroImageUrl, 2_000);
  const heroImageUrl = rawHeroUrl ? safeUrl(rawHeroUrl) : null;
  if (rawHeroUrl && !heroImageUrl) issues.push({ path: "heroImageUrl", message: "Hero image must be an internal path or a safe HTTPS URL." });
  const rawCanonical = optionalText(input.canonicalUrl, 2_000);
  const canonicalUrl = rawCanonical ? safeCanonicalUrl(rawCanonical) : null;
  if (rawCanonical && !canonicalUrl) issues.push({ path: "canonicalUrl", message: "Canonical URL must belong to B4GAMBLE or be an internal path." });

  const parsedBlocks = validateArticleBlocks(input.bodyBlocks);
  issues.push(...parsedBlocks.issues);
  const tags = Array.isArray(input.tags)
    ? [...new Set(input.tags.map((tag) => text(tag, 80)).filter(Boolean))].slice(0, 12)
    : [];
  const difficulty = optionalText(input.difficulty, 40);
  if (difficulty && !allowedDifficulties.has(difficulty)) issues.push({ path: "difficulty", message: "Difficulty must be Beginner, Intermediate or Advanced." });

  const document: ArticleDocumentInput = {
    slug,
    locale,
    title: text(input.title, 240),
    excerpt: text(input.excerpt, 1_000),
    category,
    tags,
    bodyBlocks: parsedBlocks.blocks,
    heroImageUrl,
    heroImageAlt: optionalText(input.heroImageAlt, 500),
    seoTitle: optionalText(input.seoTitle, 70),
    seoDescription: optionalText(input.seoDescription, 180),
    canonicalUrl,
    readingTime: optionalText(input.readingTime, 80),
    difficulty,
  };
  if (document.heroImageUrl && !document.heroImageAlt) issues.push({ path: "heroImageAlt", message: "Hero image alt text is required when an image is set." });
  return { document, issues };
}

export function publicationIssues(document: ArticleDocumentInput): ArticleValidationIssue[] {
  const issues: ArticleValidationIssue[] = [];
  if (document.title.length < 4) issues.push({ path: "title", message: "Published title must contain at least 4 characters." });
  if (document.excerpt.length < 20) issues.push({ path: "excerpt", message: "Published excerpt must contain at least 20 characters." });
  if (!document.bodyBlocks.length) issues.push({ path: "bodyBlocks", message: "Add at least one body block before review." });
  if (!document.bodyBlocks.some((block) => block.type === "paragraph" || block.type === "list" || block.type === "callout")) {
    issues.push({ path: "bodyBlocks", message: "Article body needs readable explanatory content." });
  }
  const readingTime = document.readingTime?.match(/^(\d{1,3})\s*(?:min|mins|minute|minutes)(?:\s+read)?$/i);
  if (!readingTime || Number(readingTime[1]) < 1 || Number(readingTime[1]) > 180) {
    issues.push({ path: "readingTime", message: "Reading time must be between 1 and 180 minutes." });
  }
  return issues;
}
