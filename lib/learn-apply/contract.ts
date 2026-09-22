import { z } from "zod";

export const LEARN_APPLY_MAX_BODY_BYTES = 4_000_000;
export const LEARN_APPLY_MAX_BASE64_BYTES = 2_500_000;
export const LEARN_APPLY_MAX_IMAGES = 12;
export const LEARN_APPLY_MAX_GENERATED_IMAGES = 8;

const nullableText = (maximum: number) => z.string().trim().min(1).max(maximum).nullable();
const blockId = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/);
const routePart = z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const RFC3339_UTC_TIMESTAMP_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?Z$/;
export const rfc3339UtcTimestampSchema = z.string().regex(
  RFC3339_UTC_TIMESTAMP_PATTERN,
  "Expected an RFC 3339 UTC timestamp.",
).refine((value) => {
  const match = RFC3339_UTC_TIMESTAMP_PATTERN.exec(value);
  if (!match) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf())
    && parsed.getUTCFullYear() === Number(match[1])
    && parsed.getUTCMonth() + 1 === Number(match[2])
    && parsed.getUTCDate() === Number(match[3])
    && parsed.getUTCHours() === Number(match[4])
    && parsed.getUTCMinutes() === Number(match[5])
    && parsed.getUTCSeconds() === Number(match[6]);
}, "Expected a valid RFC 3339 UTC timestamp.");

const readingTimeSchema = z.string().trim().regex(
  /^(\d{1,3})\s*(?:min|mins|minute|minutes)(?:\s+read)?$/i,
  "Reading time must be expressed in minutes.",
).refine((value) => {
  const minutes = Number(value.match(/^(\d{1,3})/)?.[1]);
  return minutes >= 1 && minutes <= 180;
}, "Reading time must be between 1 and 180 minutes.");

const urlImageSourceSchema = z.object({
  type: z.literal("url"),
  url: z.string().max(2_000).refine((value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" && !parsed.username && !parsed.password;
    } catch {
      return false;
    }
  }, "Image source URL must be credential-free HTTPS."),
}).strict();

const base64ImageSourceSchema = z.object({
  type: z.literal("base64"),
  data: z.string().min(4).max(Math.ceil(LEARN_APPLY_MAX_BASE64_BYTES / 3) * 4),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]),
  filename: z.string().min(1).max(180),
}).strict().superRefine((value, context) => {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value.data)) {
    context.addIssue({ code: "custom", path: ["data"], message: "Image data must be canonical base64 without a data-URL prefix." });
    return;
  }
  const decoded = Buffer.from(value.data, "base64");
  if (decoded.byteLength > LEARN_APPLY_MAX_BASE64_BYTES || decoded.toString("base64") !== value.data) {
    context.addIssue({ code: "custom", path: ["data"], message: "Decoded image exceeds 2.5 MiB or is not canonical base64." });
  }
});

const generatedImageSourceSchema = z.object({
  type: z.literal("generate"),
  prompt: z.string().trim().min(10).max(4_000),
  aspectRatio: z.enum(["1:1", "3:2", "2:3", "16:9", "9:16"]),
  quality: z.enum(["low", "medium", "high"]),
  background: z.enum(["auto", "opaque", "transparent"]),
}).strict();

export const learnImageSourceSchema = z.discriminatedUnion("type", [
  urlImageSourceSchema,
  base64ImageSourceSchema,
  generatedImageSourceSchema,
]);

const paragraphBlockSchema = z.object({
  id: blockId,
  type: z.literal("paragraph"),
  text: z.string().trim().min(1).max(12_000),
}).strict();

const headingBlockSchema = z.object({
  id: blockId,
  type: z.literal("heading"),
  level: z.union([z.literal(2), z.literal(3)]),
  text: z.string().trim().min(1).max(240),
}).strict();

const listBlockSchema = z.object({
  id: blockId,
  type: z.literal("list"),
  style: z.enum(["bullet", "numbered"]),
  items: z.array(z.string().trim().min(1).max(1_000)).min(1).max(30),
}).strict();

const quoteBlockSchema = z.object({
  id: blockId,
  type: z.literal("quote"),
  text: z.string().trim().min(1).max(3_000),
  citation: nullableText(240),
}).strict();

const calloutBlockSchema = z.object({
  id: blockId,
  type: z.literal("callout"),
  title: nullableText(240),
  text: z.string().trim().min(1).max(4_000),
}).strict();

const imageBlockSchema = z.object({
  id: blockId,
  type: z.literal("image"),
  source: learnImageSourceSchema,
  alt: z.string().trim().min(1).max(500),
  caption: nullableText(500),
}).strict();

const linkBlockSchema = z.object({
  id: blockId,
  type: z.literal("link"),
  label: z.string().trim().min(1).max(240),
  url: z.string().trim().min(1).max(2_000),
  description: nullableText(1_000),
}).strict();

export const learnApplyInputSchema = z.object({
  requestId: z.string().min(8).max(128).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/),
  article: z.object({
    articleId: z.null(),
    expectedUpdatedAt: z.null(),
    locale: z.string().trim().min(2).max(20),
    category: routePart,
    slug: routePart,
    title: z.string().trim().min(4).max(240),
    excerpt: z.string().trim().min(20).max(1_000),
    tags: z.array(z.string().trim().min(1).max(80)).max(12),
    bodyBlocks: z.array(z.discriminatedUnion("type", [
      paragraphBlockSchema,
      headingBlockSchema,
      listBlockSchema,
      quoteBlockSchema,
      calloutBlockSchema,
      imageBlockSchema,
      linkBlockSchema,
    ])).min(1).max(100),
    heroImage: z.object({
      source: learnImageSourceSchema,
      alt: z.string().trim().min(1).max(500),
    }).strict().nullable(),
    seo: z.object({
      title: nullableText(70),
      description: nullableText(180),
      canonicalUrl: nullableText(2_000),
    }).strict(),
    readingTime: readingTimeSchema,
    difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).nullable(),
  }).strict(),
}).strict().superRefine((value, context) => {
  const ids = new Set<string>();
  let images = value.article.heroImage ? 1 : 0;
  let generated = value.article.heroImage?.source.type === "generate" ? 1 : 0;
  for (const [index, block] of value.article.bodyBlocks.entries()) {
    if (ids.has(block.id)) context.addIssue({ code: "custom", path: ["article", "bodyBlocks", index, "id"], message: "Block ids must be unique." });
    ids.add(block.id);
    if (block.type === "image") {
      images += 1;
      if (block.source.type === "generate") generated += 1;
    }
  }
  if (images > LEARN_APPLY_MAX_IMAGES) context.addIssue({ code: "custom", path: ["article", "bodyBlocks"], message: `An apply can contain at most ${LEARN_APPLY_MAX_IMAGES} images.` });
  if (generated > LEARN_APPLY_MAX_GENERATED_IMAGES) context.addIssue({ code: "custom", path: ["article", "bodyBlocks"], message: `An apply can generate at most ${LEARN_APPLY_MAX_GENERATED_IMAGES} images.` });
  if (!value.article.bodyBlocks.some((block) => block.type === "paragraph" || block.type === "list" || block.type === "callout")) {
    context.addIssue({ code: "custom", path: ["article", "bodyBlocks"], message: "An Article needs readable explanatory content." });
  }
  if (new Set(value.article.tags).size !== value.article.tags.length) context.addIssue({ code: "custom", path: ["article", "tags"], message: "Tags must be unique." });
});

export type LearnApplyInput = z.infer<typeof learnApplyInputSchema>;
export type LearnImageSource = z.infer<typeof learnImageSourceSchema>;
export type LearnApplyImageBlock = Extract<LearnApplyInput["article"]["bodyBlocks"][number], { type: "image" }>;

export const learnApplyResultSchema = z.object({
  result: z.enum(["LIVE", "PERSISTED_NOT_VERIFIED"]),
  operation: z.enum(["CREATED", "NO_CHANGE"]),
  persistence: z.literal("COMMITTED"),
  articleId: z.string().uuid(),
  status: z.literal("PUBLISHED"),
  url: z.string().url(),
  publishedAt: rfc3339UtcTimestampSchema,
  updatedAt: rfc3339UtcTimestampSchema,
  verified: z.boolean(),
  images: z.array(z.object({
    slot: z.string(),
    url: z.string().url(),
    checksum: z.string().regex(/^[a-f0-9]{64}$/),
    mimeType: z.string(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    sizeBytes: z.number().int().positive(),
  }).strict()),
  verification: z.object({
    checks: z.array(z.string()),
    attempts: z.number().int().positive(),
    failureCode: z.string().nullable(),
  }).strict(),
}).strict();

export type LearnApplyResult = z.infer<typeof learnApplyResultSchema>;

export const learnApplyErrorResultSchema = z.object({
  result: z.literal("ERROR"),
  error: z.object({
    code: z.string().regex(/^[A-Z0-9_]{1,64}$/),
    message: z.string().min(1).max(1_000),
    persistence: z.enum(["NOT_COMMITTED", "COMMITTED", "UNKNOWN"]),
    retryable: z.boolean(),
    details: z.record(z.string(), z.unknown()).optional(),
  }).strict(),
}).strict();

export const learnApplyToolResultSchema = z.union([
  learnApplyResultSchema,
  learnApplyErrorResultSchema,
]);
