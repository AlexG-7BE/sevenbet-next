import { EditorialStatus, Prisma } from "@prisma/client";

import {
  casinoRepository,
  type CasinoAggregate,
  type CasinoListFilters,
} from "@/lib/repositories";

import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "./service-error";

export interface CreateCasinoInput {
  slug: string;
  title: string;
  domain: string;
  internalName?: string;
  websiteUrl?: string;
  operator?: string;
  summary?: string;
  language?: string;
  createdBy: string;
}

export interface UpdateCasinoInput {
  slug?: string;
  internalName?: string | null;
  title?: string;
  domain?: string;
  websiteUrl?: string | null;
  operator?: string | null;
  tagline?: string | null;
  summary?: string | null;
  description?: string | null;
  foundedYear?: number | null;
  language?: string;
  languages?: string[];
  currencies?: string[];
  editorScore?: number | null;
  pros?: string[];
  cons?: string[];
  responsibleGamblingTools?: string[];
  reviewBlocks?: Prisma.InputJsonValue;
  lastReviewedAt?: Date | null;
  updatedBy: string;
  expectedUpdatedAt?: Date;
}

export interface CasinoValidationIssue {
  path: string;
  message: string;
}

export interface CasinoValidationResult {
  valid: boolean;
  issues: CasinoValidationIssue[];
}

const allowedTransitions: Record<EditorialStatus, EditorialStatus[]> = {
  DRAFT: [EditorialStatus.IN_REVIEW, EditorialStatus.ARCHIVED],
  IN_REVIEW: [EditorialStatus.DRAFT, EditorialStatus.APPROVED, EditorialStatus.ARCHIVED],
  APPROVED: [EditorialStatus.DRAFT, EditorialStatus.SCHEDULED, EditorialStatus.PUBLISHED, EditorialStatus.ARCHIVED],
  SCHEDULED: [EditorialStatus.DRAFT, EditorialStatus.PUBLISHED, EditorialStatus.ARCHIVED],
  PUBLISHED: [EditorialStatus.DRAFT, EditorialStatus.ARCHIVED],
  ARCHIVED: [EditorialStatus.DRAFT],
};

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeDomain(value: string) {
  const candidate = value.trim().toLowerCase();

  try {
    const parsed = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
    return parsed.hostname.replace(/^www\./, "").replace(/\.$/, "");
  } catch {
    return "";
  }
}

function isValidDomain(value: string) {
  if (value.length > 253 || !value.includes(".")) return false;

  return value.split(".").every(
    (label) =>
      label.length > 0 &&
      label.length <= 63 &&
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
  );
}

function normalizeUrl(value: string | undefined, domain: string) {
  const candidate = value?.trim() || `https://${domain}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function cleanList(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function repositoryError(error: unknown, id: string): never {
  if (error instanceof Error && error.message === "CASINO_NOT_FOUND") {
    throw new NotFoundError("Casino", { id });
  }
  if (error instanceof Error && error.message === "CASINO_EDIT_CONFLICT") {
    throw new ConflictError(
      "This casino was changed by another editor. Reload before saving again.",
      { id },
    );
  }
  if (error instanceof Error && error.message === "CASINO_NOT_APPROVED") {
    throw new ConflictError("Casino must be approved before publication", { id });
  }
  throw error;
}

export class CasinoService {
  async listCasinos(filters?: CasinoListFilters) {
    return casinoRepository.findAll(filters);
  }

  async getCasinoById(id: string) {
    const casino = await casinoRepository.findById(id);
    if (!casino) throw new NotFoundError("Casino", { id });
    return casino;
  }

  async getCasinoBySlug(slug: string) {
    const normalizedSlug = normalizeSlug(slug);
    const casino = await casinoRepository.findBySlug(normalizedSlug);
    if (!casino) throw new NotFoundError("Casino", { slug: normalizedSlug });
    return casino;
  }

  async getPublishedSnapshot(slug: string) {
    const version = await casinoRepository.findPublishedVersionBySlug(normalizeSlug(slug));
    if (!version) throw new NotFoundError("Published casino", { slug });
    return version;
  }

  async createDraft(input: CreateCasinoInput) {
    const slug = normalizeSlug(input.slug);
    const domain = normalizeDomain(input.domain);
    const title = input.title.trim();
    const websiteUrl = normalizeUrl(input.websiteUrl, domain);

    if (!slug) throw new ValidationError("Casino slug cannot be empty");
    if (!title) throw new ValidationError("Casino title cannot be empty");
    if (!isValidDomain(domain)) throw new ValidationError("Casino domain is invalid");
    if (!websiteUrl) throw new ValidationError("Casino website URL is invalid");
    if (await casinoRepository.existsBySlug(slug)) {
      throw new ConflictError("A casino with this slug already exists", { slug });
    }
    if (await casinoRepository.existsByDomain(domain)) {
      throw new ConflictError("A casino with this domain already exists", { domain });
    }

    return casinoRepository.create(
      {
        slug,
        internalName: input.internalName?.trim() || title,
        title,
        domain,
        websiteUrl,
        operator: input.operator?.trim() || null,
        summary: input.summary?.trim() || null,
        language: input.language?.trim() || "en",
        status: EditorialStatus.DRAFT,
        createdBy: input.createdBy,
        updatedBy: input.createdBy,
      },
      input.createdBy,
    );
  }

  async updateCasino(id: string, input: UpdateCasinoInput) {
    const current = await this.getCasinoById(id);
    if (current.status !== EditorialStatus.DRAFT) {
      throw new ConflictError("Return the casino to draft before editing", {
        id,
        currentStatus: current.status,
      });
    }

    let slug: string | undefined;
    let domain: string | undefined;
    let websiteUrl: string | null | undefined;

    if (input.slug !== undefined) {
      slug = normalizeSlug(input.slug);
      if (!slug) throw new ValidationError("Casino slug cannot be empty");
      if (await casinoRepository.existsBySlug(slug, id)) {
        throw new ConflictError("A casino with this slug already exists", { slug });
      }
    }

    if (input.domain !== undefined) {
      domain = normalizeDomain(input.domain);
      if (!isValidDomain(domain)) throw new ValidationError("Casino domain is invalid");
      if (await casinoRepository.existsByDomain(domain, id)) {
        throw new ConflictError("A casino with this domain already exists", { domain });
      }
    }

    if (input.websiteUrl !== undefined) {
      websiteUrl = input.websiteUrl === null
        ? null
        : normalizeUrl(input.websiteUrl, domain ?? current.domain);
      if (input.websiteUrl !== null && !websiteUrl) {
        throw new ValidationError("Casino website URL is invalid");
      }
    }

    if (input.title !== undefined && !input.title.trim()) {
      throw new ValidationError("Casino title cannot be empty");
    }
    if (
      input.editorScore !== undefined &&
      input.editorScore !== null &&
      (input.editorScore < 0 || input.editorScore > 10)
    ) {
      throw new ValidationError("Editor score must be between 0 and 10");
    }
    if (
      input.foundedYear !== undefined &&
      input.foundedYear !== null &&
      (input.foundedYear < 1800 || input.foundedYear > new Date().getFullYear())
    ) {
      throw new ValidationError("Founded year is outside the supported range");
    }

    try {
      return await casinoRepository.updateWithRevision(
        id,
        {
          ...(slug !== undefined ? { slug } : {}),
          ...(domain !== undefined ? { domain } : {}),
          ...(websiteUrl !== undefined ? { websiteUrl } : {}),
          ...(input.internalName !== undefined
            ? { internalName: input.internalName?.trim() || null }
            : {}),
          ...(input.title !== undefined ? { title: input.title.trim() } : {}),
          ...(input.operator !== undefined ? { operator: input.operator?.trim() || null } : {}),
          ...(input.tagline !== undefined ? { tagline: input.tagline?.trim() || null } : {}),
          ...(input.summary !== undefined ? { summary: input.summary?.trim() || null } : {}),
          ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
          ...(input.foundedYear !== undefined ? { foundedYear: input.foundedYear } : {}),
          ...(input.language !== undefined ? { language: input.language.trim() || "en" } : {}),
          ...(input.languages !== undefined ? { languages: cleanList(input.languages) } : {}),
          ...(input.currencies !== undefined ? { currencies: cleanList(input.currencies) } : {}),
          ...(input.editorScore !== undefined ? { editorScore: input.editorScore } : {}),
          ...(input.pros !== undefined ? { pros: cleanList(input.pros) } : {}),
          ...(input.cons !== undefined ? { cons: cleanList(input.cons) } : {}),
          ...(input.responsibleGamblingTools !== undefined
            ? { responsibleGamblingTools: cleanList(input.responsibleGamblingTools) }
            : {}),
          ...(input.reviewBlocks !== undefined ? { reviewBlocks: input.reviewBlocks } : {}),
          ...(input.lastReviewedAt !== undefined ? { lastReviewedAt: input.lastReviewedAt } : {}),
          updatedBy: input.updatedBy,
        },
        input.updatedBy,
        "Saved casino draft",
        input.expectedUpdatedAt,
      );
    } catch (error) {
      repositoryError(error, id);
    }
  }

  validateForPublication(casino: CasinoAggregate): CasinoValidationResult {
    const issues: CasinoValidationIssue[] = [];
    if (!casino.title.trim()) issues.push({ path: "title", message: "Title is required" });
    if (!isValidDomain(casino.domain)) issues.push({ path: "domain", message: "A valid domain is required" });
    if (!casino.summary?.trim()) issues.push({ path: "summary", message: "Editorial summary is required" });
    if (!casino.description?.trim()) issues.push({ path: "description", message: "Review description is required" });
    if (casino.editorScore === null) issues.push({ path: "editorScore", message: "Editor score is required" });
    if (!casino.licenses.some((license) => license.status.toUpperCase() === "ACTIVE") && !casino.license?.trim()) {
      issues.push({ path: "licenses", message: "At least one active or legacy license record is required" });
    }
    if (!casino.seo?.title?.trim()) issues.push({ path: "seo.title", message: "SEO title is required" });
    if (!casino.seo?.description?.trim()) issues.push({ path: "seo.description", message: "SEO description is required" });

    return { valid: issues.length === 0, issues };
  }

  async validateCasino(id: string) {
    return this.validateForPublication(await this.getCasinoById(id));
  }

  async transitionWorkflow(id: string, target: EditorialStatus, actorId: string) {
    const casino = await this.getCasinoById(id);
    if (target === EditorialStatus.PUBLISHED) return this.publishCasino(id, actorId);
    if (target === EditorialStatus.SCHEDULED) {
      throw new ValidationError("Use scheduleCasino to provide a publication time");
    }
    if (!allowedTransitions[casino.status].includes(target)) {
      throw new ConflictError("Casino workflow transition is not allowed", {
        id,
        currentStatus: casino.status,
        targetStatus: target,
      });
    }
    if (target === EditorialStatus.IN_REVIEW) {
      const validation = this.validateForPublication(casino);
      if (!validation.valid) {
        throw new ValidationError("Casino is not ready for review", validation.issues);
      }
    }

    try {
      return await casinoRepository.transitionWithRevision(
        id,
        target,
        actorId,
        `Workflow changed from ${casino.status} to ${target}`,
      );
    } catch (error) {
      repositoryError(error, id);
    }
  }

  async scheduleCasino(id: string, publishAt: Date, actorId: string) {
    const casino = await this.getCasinoById(id);
    if (casino.status !== EditorialStatus.APPROVED) {
      throw new ConflictError("Only approved casinos can be scheduled", {
        id,
        currentStatus: casino.status,
      });
    }
    if (Number.isNaN(publishAt.getTime()) || publishAt <= new Date()) {
      throw new ValidationError("Scheduled publication time must be in the future");
    }

    try {
      return await casinoRepository.updateWithRevision(
        id,
        {
          status: EditorialStatus.SCHEDULED,
          scheduledPublishAt: publishAt,
          updatedBy: actorId,
        },
        actorId,
        `Scheduled publication for ${publishAt.toISOString()}`,
      );
    } catch (error) {
      repositoryError(error, id);
    }
  }

  async publishCasino(id: string, actorId: string) {
    const casino = await this.getCasinoById(id);
    const validation = this.validateForPublication(casino);
    if (!validation.valid) {
      throw new ValidationError("Casino cannot be published", validation.issues);
    }
    if (
      casino.status !== EditorialStatus.APPROVED &&
      casino.status !== EditorialStatus.SCHEDULED
    ) {
      throw new ConflictError("Casino must be approved before publication", {
        id,
        currentStatus: casino.status,
      });
    }

    try {
      return await casinoRepository.publishWithVersion(id, actorId);
    } catch (error) {
      repositoryError(error, id);
    }
  }

  async listRevisions(id: string) {
    await this.getCasinoById(id);
    return casinoRepository.listRevisions(id);
  }

  async listVersions(id: string) {
    await this.getCasinoById(id);
    return casinoRepository.listVersions(id);
  }
}

export const casinoService = new CasinoService();
