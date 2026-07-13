import type { CmsEntity, CmsRecord, CmsValidationResult } from "@/lib/cms/types";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isUrl(value?: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isIsoDate(value?: string) {
  if (!value) return true;
  return !Number.isNaN(Date.parse(value));
}

export function validateSlug(slug: string) {
  return slugPattern.test(slug);
}

export function validateCmsRecord(record: Partial<CmsRecord>, entity: CmsEntity): CmsValidationResult {
  const errors: Record<string, string> = {};

  if (!record.slug || !validateSlug(record.slug)) {
    errors.slug = "Slug must use lowercase letters, numbers and hyphens.";
  }

  if (!record.title || record.title.trim().length < 3) {
    errors.title = "Title is required.";
  }

  if (record.updatedAt && !isIsoDate(record.updatedAt)) {
    errors.updatedAt = "updatedAt must be a valid date.";
  }

  if (entity === "article" && "canonicalUrl" in record && !isUrl(record.canonicalUrl)) {
    errors.canonicalUrl = "Canonical URL must be a valid http(s) URL.";
  }

  if (entity === "program" && "estimatedTotalMinutes" in record) {
    if (typeof record.estimatedTotalMinutes !== "number" || record.estimatedTotalMinutes < 1) {
      errors.estimatedTotalMinutes = "Estimated program duration must be at least one minute.";
    }
    if (record.canonicalUrl && !record.canonicalUrl.startsWith("/") && !isUrl(record.canonicalUrl)) {
      errors.canonicalUrl = "Canonical URL must be a site path or valid http(s) URL.";
    }
  }

  if (entity === "program-step" && "order" in record) {
    if (typeof record.order !== "number" || record.order < 0) errors.order = "Step order must be non-negative.";
    if (typeof record.xp === "number" && record.xp < 0) errors.xp = "Step XP cannot be negative.";
  }

  if (entity === "lesson" && "blocks" in record) {
    if (typeof record.order !== "number" || record.order < 0) errors.order = "Lesson order must be non-negative.";
    if (!Array.isArray(record.blocks)) errors.blocks = "Lesson blocks must be structured content.";
  }

  if (entity === "xp-rule" && "xp" in record) {
    const xp = record.xp;
    if (typeof xp !== "number" || xp < 0) errors.xp = "XP rule value must be non-negative.";
    if (typeof xp === "number" && xp > 1000) errors.xp = "XP rule value exceeds the Phase 2 safety cap of 1000.";
  }

  if (entity === "achievement" && "xpReward" in record) {
    if (typeof record.xpReward !== "number" || record.xpReward < 0) errors.xpReward = "Achievement XP cannot be negative.";
  }

  if (entity === "casino" && "domain" in record && (!record.domain || record.domain.includes("://"))) {
    errors.domain = "Casino domain must be a normalized domain without protocol.";
  }

  if (entity === "bonus") {
    if ("amount" in record && typeof record.amount === "number" && record.amount < 0) {
      errors.amount = "Bonus amount cannot be negative.";
    }
    if ("minimumDeposit" in record && typeof record.minimumDeposit === "number" && record.minimumDeposit < 0) {
      errors.minimumDeposit = "Minimum deposit cannot be negative.";
    }
    if ("wageringMultiplier" in record && typeof record.wageringMultiplier === "number" && (record.wageringMultiplier < 0 || record.wageringMultiplier > 250)) {
      errors.wageringMultiplier = "Wagering multiplier is outside the accepted range.";
    }
    if ("termsUrl" in record && !isUrl(record.termsUrl)) {
      errors.termsUrl = "Terms URL must be a valid http(s) URL.";
    }
  }

  if (entity === "affiliate-link") {
    if ("destinationUrl" in record && !isUrl(record.destinationUrl)) {
      errors.destinationUrl = "Destination URL must be a valid http(s) URL.";
    }
    if ("priority" in record && typeof record.priority === "number" && record.priority < 0) {
      errors.priority = "Priority cannot be negative.";
    }
    if ("effectiveStart" in record && !isIsoDate(record.effectiveStart)) {
      errors.effectiveStart = "Effective start must be a valid date.";
    }
    if ("effectiveEnd" in record && !isIsoDate(record.effectiveEnd)) {
      errors.effectiveEnd = "Effective end must be a valid date.";
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function assertValidCmsRecord(record: Partial<CmsRecord>, entity: CmsEntity) {
  const result = validateCmsRecord(record, entity);
  if (!result.ok) {
    throw new Error(Object.values(result.errors).join(" "));
  }
}
