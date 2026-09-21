import { z } from "zod";

export const LEARN_APPLY_MAX_BODY_BYTES = 4_000_000;
export const LEARN_APPLY_MAX_BASE64_BYTES = 2_500_000;
export const LEARN_APPLY_MAX_IMAGES = 12;
export const LEARN_APPLY_MAX_GENERATED_IMAGES = 8;

const nullableText = (maximum: number) => z.string().trim().min(1).max(maximum).nullable();
const blockId = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/);
const isoTimestamp = z.string().refine((value) => {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}, "Expected an exact ISO-8601 UTC timestamp.");

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
    articleId: z.string().uuid().nullable(),
    expectedUpdatedAt: isoTimestamp.nullable().optional().default(null),
    locale: z.string().min(2).max(20),
    category: z.string().min(1).max(120),
    slug: z.string().min(1).max(120),
    title: z.string().trim().min(1).max(240),
    excerpt: z.string().trim().min(1).max(1_000),
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
    readingTime: nullableText(80),
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
  if (new Set(value.article.tags).size !== value.article.tags.length) context.addIssue({ code: "custom", path: ["article", "tags"], message: "Tags must be unique." });
});

export type LearnApplyInput = z.infer<typeof learnApplyInputSchema>;
export type LearnImageSource = z.infer<typeof learnImageSourceSchema>;
export type LearnApplyImageBlock = Extract<LearnApplyInput["article"]["bodyBlocks"][number], { type: "image" }>;

export const learnApplyResultSchema = z.object({
  result: z.enum(["LIVE", "PERSISTED_NOT_VERIFIED"]),
  operation: z.enum(["CREATED", "UPDATED", "NO_CHANGE"]),
  persistence: z.literal("COMMITTED"),
  articleId: z.string().uuid(),
  status: z.literal("PUBLISHED"),
  url: z.string().url(),
  publishedAt: isoTimestamp,
  updatedAt: isoTimestamp,
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
    code: z.string().min(1).max(120),
    message: z.string().min(1).max(1_000),
    persistence: z.enum(["NOT_COMMITTED", "COMMITTED", "UNKNOWN"]),
    details: z.record(z.string(), z.unknown()).optional(),
  }).strict(),
}).strict();

export const learnApplyToolResultSchema = z.union([
  learnApplyResultSchema,
  learnApplyErrorResultSchema,
]);
