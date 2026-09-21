import { createHash } from "node:crypto";

import type { ArticleDocumentInput } from "@/lib/articles/article-types";
import type { LearnApplyInput, LearnImageSource } from "@/lib/learn-apply/contract";

export function sha256(value: string | Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonical(item)]));
  }
  return value;
}

export function stableJson(value: unknown) {
  return JSON.stringify(canonical(value));
}

export function imageSourceFingerprint(source: LearnImageSource) {
  if (source.type === "base64") {
    return sha256(stableJson({
      type: source.type,
      mimeType: source.mimeType,
      filename: source.filename,
      contentSha256: sha256(Buffer.from(source.data, "base64")),
    }));
  }
  if (source.type === "url") {
    return sha256(stableJson({ type: source.type, url: new URL(source.url).href }));
  }
  return sha256(stableJson(source));
}

export function learnApplyIntentFingerprint(input: LearnApplyInput) {
  return sha256(stableJson({
    ...input.article,
    heroImage: input.article.heroImage ? {
      ...input.article.heroImage,
      source: { fingerprint: imageSourceFingerprint(input.article.heroImage.source) },
    } : null,
    bodyBlocks: input.article.bodyBlocks.map((block) => block.type === "image" ? {
      ...block,
      source: { fingerprint: imageSourceFingerprint(block.source) },
    } : block),
  }));
}

export function articleDocumentFingerprint(document: ArticleDocumentInput) {
  return sha256(stableJson(document));
}
