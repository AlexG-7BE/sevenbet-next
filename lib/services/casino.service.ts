import { CasinoCountryAvailability, EditorialStatus, Prisma } from "@prisma/client";

import type {
  CasinoBuilderCasino,
  CasinoBuilderData,
  CasinoCoreDraft,
  CasinoRevisionHistoryItem,
} from "@/lib/casino-builder/types";
import {
  isValidDomain,
  normalizeCasinoCoreDraft,
  normalizeDomain,
  normalizeHttpUrl,
  normalizeSlug,
  parseStructuredData,
  publicationWarnings,
  validateCasinoCoreDraft,
} from "@/lib/casino-builder/core-validation";
import {
  emptyGeneralMetadata,
  readCasinoEditorMetadata,
  writeCasinoEditorMetadata,
  type CasinoEditorMetadata,
} from "@/lib/casino-builder/editor-metadata";
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
  severity: "error" | "warning";
  code: string;
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

function normalizeUrl(value: string | undefined, domain: string) {
  return normalizeHttpUrl(value, `https://${domain}`);
}

function cleanList(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function serializeCasino(casino: CasinoAggregate): CasinoBuilderCasino {
  const serialized = JSON.parse(JSON.stringify(casino)) as Omit<CasinoBuilderCasino, "generalMetadata"> & {
    reviewBlocks?: Prisma.JsonValue;
  };
  const metadata = readCasinoEditorMetadata(casino.reviewBlocks);
  delete serialized.reviewBlocks;

  serialized.licenses = serialized.licenses.map((record) => ({
    ...record,
    issuedAt: record.issuedAt ?? null,
    expiresAt: record.expiresAt ?? null,
    notes: record.notes ?? null,
    verified: Boolean(record.lastVerifiedAt),
    archived: metadata.licenses[record.id]?.archived ?? record.status === "ARCHIVED",
  }));
  serialized.countries = serialized.countries
    .map((record) => ({
      ...record,
      currency: metadata.countries[record.id]?.currency ?? null,
      language: metadata.countries[record.id]?.language ?? null,
      priority: metadata.countries[record.id]?.priority ?? 0,
      archived: metadata.countries[record.id]?.archived ?? false,
    }))
    .sort((a, b) => a.priority - b.priority || a.countryCode.localeCompare(b.countryCode));
  serialized.paymentMethods = serialized.paymentMethods.map((record) => ({
    ...record,
    maximumDeposit: metadata.payments[record.id]?.maximumDeposit ?? null,
    depositFee: metadata.payments[record.id]?.depositFee ?? null,
    withdrawalFee: metadata.payments[record.id]?.withdrawalFee ?? null,
    type: metadata.payments[record.id]?.type ?? (record.crypto ? "CRYPTO" : "OTHER"),
    countries: metadata.payments[record.id]?.countries ?? [],
    verified: metadata.payments[record.id]?.verified ?? false,
    notes: metadata.payments[record.id]?.notes ?? null,
    archived: metadata.payments[record.id]?.archived ?? false,
  }));
  serialized.gameProviders = serialized.gameProviders.map((record) => ({
    ...record,
    featured: metadata.providers[record.id]?.featured ?? false,
    verified: Boolean(record.verifiedAt),
    archived: metadata.providers[record.id]?.archived ?? false,
  }));
  serialized.gameCategories = serialized.gameCategories.map((record) => ({
    ...record,
    icon: metadata.categories[record.id]?.icon ?? null,
    archived: metadata.categories[record.id]?.archived ?? false,
  }));
  serialized.seo = serialized.seo
    ? {
        ...serialized.seo,
        structuredData: casino.seo?.structuredData
          ? JSON.stringify(casino.seo.structuredData, null, 2)
          : "",
        robotsIndex: !serialized.seo.robots.includes("noindex"),
        robotsFollow: !serialized.seo.robots.includes("nofollow"),
      }
    : null;

  return {
    ...serialized,
    generalMetadata: { ...emptyGeneralMetadata, ...metadata.general },
  };
}

function snapshotRecord(value: Prisma.JsonValue) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Prisma.JsonObject
    : {};
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

function coreDraftFromCasino(casino: CasinoBuilderCasino): CasinoCoreDraft {
  return {
    slug: casino.slug,
    internalName: casino.internalName,
    title: casino.title,
    domain: casino.domain,
    websiteUrl: casino.websiteUrl,
    operator: casino.operator,
    tagline: casino.tagline,
    summary: casino.summary,
    description: casino.description,
    foundedYear: casino.foundedYear,
    language: casino.language,
    languages: casino.languages,
    currencies: casino.currencies,
    editorScore: casino.editorScore,
    generalMetadata: casino.generalMetadata,
    licenses: casino.licenses,
    countries: casino.countries,
    paymentMethods: casino.paymentMethods,
    gameProviders: casino.gameProviders,
    gameCategories: casino.gameCategories,
    seo: casino.seo,
  };
}

function requireCoreDraftShape(value: CasinoCoreDraft) {
  const isRecord = (record: unknown): record is Record<string, unknown> => Boolean(record) && typeof record === "object" && !Array.isArray(record);
  const hasStrings = (record: unknown, keys: string[]) => isRecord(record) && keys.every((key) => typeof record[key] === "string");
  if (
    !value ||
    typeof value !== "object" ||
    !hasStrings(value, ["slug", "title", "domain", "language"]) ||
    !isRecord(value.generalMetadata) ||
    !Array.isArray(value.languages) ||
    !value.languages.every((entry) => typeof entry === "string") ||
    !Array.isArray(value.currencies) ||
    !value.currencies.every((entry) => typeof entry === "string") ||
    !Array.isArray(value.licenses) ||
    !value.licenses.every((entry) => hasStrings(entry, ["id", "authority", "status"])) ||
    !Array.isArray(value.countries) ||
    !value.countries.every((entry) => hasStrings(entry, ["id", "countryCode", "availability"])) ||
    !Array.isArray(value.paymentMethods) ||
    !value.paymentMethods.every((entry) => hasStrings(entry, ["id", "methodKey", "name", "type"])) ||
    !Array.isArray(value.gameProviders) ||
    !value.gameProviders.every((entry) => hasStrings(entry, ["id", "providerKey", "name"])) ||
    !Array.isArray(value.gameCategories)
    || !value.gameCategories.every((entry) => hasStrings(entry, ["id", "categoryKey", "name"]))
  ) {
    throw new ValidationError("Casino core draft has an invalid shape");
  }
}

function metadataFromDraft(draft: CasinoCoreDraft): CasinoEditorMetadata {
  return {
    version: 1,
    general: draft.generalMetadata,
    licenses: Object.fromEntries(draft.licenses.map((record) => [record.id, { archived: record.archived }])),
    countries: Object.fromEntries(draft.countries.map((record) => [record.id, {
      currency: record.currency,
      language: record.language,
      priority: record.priority,
      archived: record.archived,
    }])),
    payments: Object.fromEntries(draft.paymentMethods.map((record) => [record.id, {
      maximumDeposit: record.maximumDeposit,
      depositFee: record.depositFee,
      withdrawalFee: record.withdrawalFee,
      type: record.type,
      countries: record.countries,
      verified: record.verified,
      notes: record.notes,
      archived: record.archived,
    }])),
    providers: Object.fromEntries(draft.gameProviders.map((record) => [record.id, {
      featured: record.featured,
      archived: record.archived,
    }])),
    categories: Object.fromEntries(draft.gameCategories.map((record) => [record.id, {
      icon: record.icon,
      archived: record.archived,
    }])),
  };
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

  toBuilderCasino(casino: CasinoAggregate) {
    return serializeCasino(casino);
  }

  async getBuilderData(id: string): Promise<CasinoBuilderData> {
    const casino = await this.getCasinoById(id);
    const [revisions, versions] = await Promise.all([
      casinoRepository.listRevisions(id),
      casinoRepository.listVersions(id),
    ]);

    return {
      casino: serializeCasino(casino),
      validation: this.validateForPublication(casino),
      revisionCount: revisions.length,
      versionCount: versions.length,
    };
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

  async saveCoreDraft(
    id: string,
    input: CasinoCoreDraft,
    actorId: string,
    expectedUpdatedAt?: Date,
  ) {
    requireCoreDraftShape(input);
    const current = await this.getCasinoById(id);
    if (current.status !== EditorialStatus.DRAFT) {
      throw new ConflictError("Return the casino to draft before editing", {
        id,
        currentStatus: current.status,
      });
    }

    const draft = normalizeCasinoCoreDraft(input);
    const issues = validateCasinoCoreDraft(draft);
    if (issues.length) {
      throw new ValidationError("Casino draft contains invalid fields", issues);
    }
    if (await casinoRepository.existsBySlug(draft.slug, id)) {
      throw new ConflictError("A casino with this slug already exists", { slug: draft.slug });
    }
    if (await casinoRepository.existsByDomain(draft.domain, id)) {
      throw new ConflictError("A casino with this domain already exists", { domain: draft.domain });
    }

    const currentLicenses = new Map(current.licenses.map((record) => [record.id, record]));
    const currentProviders = new Map(current.gameProviders.map((record) => [record.id, record]));
    const metadata = metadataFromDraft(draft);
    const structuredData = draft.seo ? parseStructuredData(draft.seo.structuredData) : null;

    try {
      return await casinoRepository.updateWithRevision(
        id,
        {
          slug: draft.slug,
          internalName: draft.internalName,
          title: draft.title,
          domain: draft.domain,
          websiteUrl: draft.websiteUrl,
          operator: draft.operator,
          tagline: draft.tagline,
          summary: draft.summary,
          description: draft.description,
          foundedYear: draft.foundedYear,
          language: draft.language,
          languages: draft.languages,
          currencies: draft.currencies,
          editorScore: draft.editorScore,
          reviewBlocks: writeCasinoEditorMetadata(current.reviewBlocks, metadata),
          updatedBy: actorId,
          licenses: {
            deleteMany: {},
            create: draft.licenses.map((record) => ({
              id: record.id,
              authority: record.authority,
              licenseNumber: record.licenseNumber,
              jurisdiction: record.jurisdiction,
              status: record.archived ? "ARCHIVED" : record.status,
              verificationUrl: record.verificationUrl,
              issuedAt: record.issuedAt ? new Date(record.issuedAt) : null,
              expiresAt: record.expiresAt ? new Date(record.expiresAt) : null,
              lastVerifiedAt: record.verified
                ? currentLicenses.get(record.id)?.lastVerifiedAt ?? new Date()
                : null,
              notes: record.notes,
            })),
          },
          countries: {
            deleteMany: {},
            create: draft.countries.map((record) => ({
              id: record.id,
              countryCode: record.countryCode,
              availability: record.availability as CasinoCountryAvailability,
              minimumAge: record.minimumAge,
              notes: record.notes,
            })),
          },
          paymentMethods: {
            deleteMany: {},
            create: draft.paymentMethods.map((record) => ({
              id: record.id,
              methodKey: record.methodKey,
              name: record.name,
              supportsDeposits: record.supportsDeposits,
              supportsWithdrawals: record.supportsWithdrawals,
              currencies: record.currencies,
              minimumDeposit: record.minimumDeposit,
              minimumWithdrawal: record.minimumWithdrawal,
              maximumWithdrawal: record.maximumWithdrawal,
              depositProcessingTime: record.depositProcessingTime,
              withdrawalTime: record.withdrawalTime,
              fees: record.fees,
              crypto: record.type === "CRYPTO" || record.crypto,
              sortOrder: record.sortOrder,
            })),
          },
          gameProviders: {
            deleteMany: {},
            create: draft.gameProviders.map((record) => ({
              id: record.id,
              providerKey: record.providerKey,
              name: record.name,
              websiteUrl: record.websiteUrl,
              gameCount: record.gameCount,
              liveCasino: record.liveCasino,
              verifiedAt: record.verified
                ? currentProviders.get(record.id)?.verifiedAt ?? new Date()
                : null,
              sortOrder: record.sortOrder,
            })),
          },
          gameCategories: {
            deleteMany: {},
            create: draft.gameCategories.map((record) => ({
              id: record.id,
              categoryKey: record.categoryKey,
              name: record.name,
              gameCount: record.gameCount,
              featured: record.featured,
              sortOrder: record.sortOrder,
            })),
          },
          seo: draft.seo
            ? {
                upsert: {
                  create: {
                    title: draft.seo.title,
                    description: draft.seo.description,
                    canonicalUrl: draft.seo.canonicalUrl,
                    robots: draft.seo.robots,
                    socialTitle: draft.seo.socialTitle,
                    socialDescription: draft.seo.socialDescription,
                    socialImage: draft.seo.socialImage,
                    structuredData: structuredData ?? Prisma.DbNull,
                  },
                  update: {
                    title: draft.seo.title,
                    description: draft.seo.description,
                    canonicalUrl: draft.seo.canonicalUrl,
                    robots: draft.seo.robots,
                    socialTitle: draft.seo.socialTitle,
                    socialDescription: draft.seo.socialDescription,
                    socialImage: draft.seo.socialImage,
                    structuredData: structuredData ?? Prisma.DbNull,
                  },
                },
              }
            : current.seo
              ? { delete: true }
              : undefined,
        },
        actorId,
        "Saved core casino editors",
        expectedUpdatedAt,
      );
    } catch (error) {
      repositoryError(error, id);
    }
  }

  validateForPublication(casino: CasinoAggregate): CasinoValidationResult {
    const builderCasino = serializeCasino(casino);
    const draft = coreDraftFromCasino(builderCasino);
    const issues: CasinoValidationIssue[] = publicationWarnings(draft);
    const blocker = (path: string, message: string, code: string) => issues.push({ path, message, code, severity: "error" });
    if (!casino.title.trim()) blocker("general.title", "Title is required", "TITLE_REQUIRED");
    if (!isValidDomain(casino.domain)) blocker("general.domain", "A valid domain is required", "INVALID_DOMAIN");
    if (!casino.summary?.trim()) blocker("general.summary", "Editorial summary is required", "SUMMARY_REQUIRED");
    if (!casino.description?.trim()) blocker("general.description", "Review description is required", "DESCRIPTION_REQUIRED");
    if (casino.editorScore === null) blocker("general.editorScore", "Editor score is required", "EDITOR_SCORE_REQUIRED");
    if (!draft.licenses.some((license) => !license.archived && license.status === "ACTIVE") && !casino.license?.trim()) {
      blocker("licenses", "At least one active or legacy license record is required", "ACTIVE_LICENSE_REQUIRED");
    }
    if (!draft.countries.some((country) => !country.archived && country.availability === CasinoCountryAvailability.AVAILABLE)) {
      blocker("countries", "At least one active country is required", "ACTIVE_COUNTRY_REQUIRED");
    }
    if (!casino.seo?.title?.trim()) blocker("seo.title", "SEO title is required", "SEO_TITLE_REQUIRED");
    if (!casino.seo?.description?.trim()) blocker("seo.description", "SEO description is required", "SEO_DESCRIPTION_REQUIRED");

    return { valid: !issues.some((entry) => entry.severity === "error"), issues };
  }

  async validateCasino(id: string) {
    return this.validateForPublication(await this.getCasinoById(id));
  }

  async transitionWorkflow(
    id: string,
    target: EditorialStatus,
    actorId: string,
    expectedUpdatedAt?: Date,
  ) {
    const casino = await this.getCasinoById(id);
    if (target === EditorialStatus.PUBLISHED) {
      throw new ValidationError("Use publishCasino for publication");
    }
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
        expectedUpdatedAt,
      );
    } catch (error) {
      repositoryError(error, id);
    }
  }

  async scheduleCasino(
    id: string,
    publishAt: Date,
    actorId: string,
    expectedUpdatedAt?: Date,
  ) {
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
        expectedUpdatedAt,
      );
    } catch (error) {
      repositoryError(error, id);
    }
  }

  async publishCasino(id: string, actorId: string, expectedUpdatedAt?: Date) {
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
      return await casinoRepository.publishWithVersion(id, actorId, expectedUpdatedAt);
    } catch (error) {
      repositoryError(error, id);
    }
  }

  async listRevisions(id: string) {
    await this.getCasinoById(id);
    return casinoRepository.listRevisions(id);
  }

  async getRevisionHistory(id: string): Promise<CasinoRevisionHistoryItem[]> {
    await this.getCasinoById(id);
    const records = await casinoRepository.listRevisionsWithAuthors(id);

    return records.map(({ revision, author }) => {
      const snapshot = snapshotRecord(revision.snapshot);
      return {
        id: revision.id,
        revisionNumber: revision.revisionNumber,
        summary: revision.summary,
        author: author?.name ?? revision.createdBy,
        authorEmail: author?.email ?? null,
        createdAt: revision.createdAt.toISOString(),
        workflowStatus:
          typeof snapshot.status === "string" ? snapshot.status : "UNKNOWN",
        publishedVersion:
          typeof snapshot.publishedVersion === "number"
            ? snapshot.publishedVersion
            : 0,
      };
    });
  }

  async listVersions(id: string) {
    await this.getCasinoById(id);
    return casinoRepository.listVersions(id);
  }
}

export const casinoService = new CasinoService();
