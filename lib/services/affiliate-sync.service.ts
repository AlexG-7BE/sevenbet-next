import {
  AffiliateExternalEntityType,
  AffiliateImportAction,
  AffiliateImportStatus,
  AffiliateMatchMethod,
  AffiliateMatchStatus,
  AffiliateSourcePolicy,
  AffiliateSyncMode,
  Prisma,
} from "@prisma/client";

import { affiliateCredentialStore, type AffiliateCredentialStore } from "@/lib/affiliate-integrations/credentials";
import { mergeProviderFields } from "@/lib/affiliate-integrations/conflicts";
import { matchCasino, normalizeCasinoDomain, normalizeCasinoName } from "@/lib/affiliate-integrations/matching";
import { normalizeExternalTrackingLink } from "@/lib/affiliate-integrations/normalize";
import { findDuplicateExternalIds, summarizeAffiliateImportItems } from "@/lib/affiliate-integrations/planning";
import { assertAffiliateOperationRateLimit } from "@/lib/affiliate-integrations/rate-limit";
import { affiliateAdapterRegistry, type AffiliateAdapterRegistry } from "@/lib/affiliate-integrations/registry";
import { payloadFingerprint, redactAffiliateError, sanitizeAffiliatePayload } from "@/lib/affiliate-integrations/sanitize";
import { providerOfferProjection } from "@/lib/affiliate-integrations/provider-projection";
import type {
  AffiliateImportSummary,
  AffiliatePlannedItem,
  AffiliateSourceRules,
  AffiliateSyncRequest,
  NormalizedAffiliateOffer,
} from "@/lib/affiliate-integrations/types";
import {
  affiliateIntegrationRepository,
  type AffiliateIntegrationRepository,
} from "@/lib/repositories/affiliate-integration.repository";

import { ConflictError, NotFoundError, ValidationError } from "./service-error";

const maxPages = 100;
const maxRecords = 5_000;
const maxProviderPageBytes = 2 * 1024 * 1024;
const nonApplicableActions = new Set<AffiliateImportAction>([
  AffiliateImportAction.CONFLICT,
  AffiliateImportAction.ERROR,
  AffiliateImportAction.SKIP,
]);

function jsonRecord(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function sourceRules(value: Prisma.JsonValue): AffiliateSourceRules {
  const record = jsonRecord(value);
  const output: AffiliateSourceRules = {};
  for (const [field, policy] of Object.entries(record)) {
    if (typeof policy === "string" && Object.values(AffiliateSourcePolicy).includes(policy as AffiliateSourcePolicy)) {
      output[field] = policy as AffiliateSourcePolicy;
    }
  }
  return output;
}

function dateString(value: Date | null) {
  return value?.toISOString() ?? null;
}

export { providerOfferProjection } from "@/lib/affiliate-integrations/provider-projection";

function currentOfferProjection(offer: Awaited<ReturnType<AffiliateIntegrationRepository["findOfferByExternalId"]>>) {
  if (!offer) return null;
  const metadata = jsonRecord(offer.metadata);
  const integration = jsonRecord(metadata._integration as Prisma.JsonValue);
  return {
    current: {
      externalName: offer.externalName,
      status: offer.status,
      payoutModel: offer.payoutModel,
      payoutAmount: offer.payoutAmount?.toString() ?? null,
      payoutCurrency: offer.payoutCurrency,
      revenueSharePercentage: offer.revenueSharePercentage?.toString() ?? null,
      hybridTerms: offer.hybridTerms,
      countries: offer.geoMode === "ALLOW" ? offer.countries.map((entry) => entry.countryCode).sort() : [],
      excludedCountries: offer.geoMode === "BLOCK" ? offer.countries.map((entry) => entry.countryCode).sort() : [],
      currencies: offer.currencies.map((entry) => entry.currencyCode).sort(),
      languages: [...offer.languages].sort(),
      devices: [...offer.devices].sort(),
      landingPageUrl: offer.landingPageUrl,
      validFrom: dateString(offer.startAt),
      validUntil: dateString(offer.expiresAt),
      priority: offer.priority,
      trackingLinks: offer.trackingLinks.map((link) => ({
        externalId: link.externalLinkId,
        label: link.label,
        destinationUrl: link.destinationUrl,
        trackingUrl: link.trackingUrl,
        countries: link.countries.map((entry) => entry.countryCode).sort(),
        languages: link.language ? [link.language] : [],
        devices: [link.deviceTarget],
        currencyCode: link.currencyCode,
        campaign: link.campaign,
        subIdTemplate: link.subIdTemplate,
        priority: link.priority,
        active: link.active,
        validFrom: dateString(link.validFrom),
        validUntil: dateString(link.expiresAt),
        metadata: jsonRecord(link.metadata),
      })),
    },
    previousProvider: jsonRecord(integration.providerSnapshot as Prisma.JsonValue),
    record: offer,
  };
}

function same(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function applyResolvedProjection(offer: NormalizedAffiliateOffer, value: Record<string, unknown>) {
  const output = { ...offer };
  const stringFields = ["externalName", "status", "payoutModel", "payoutAmount", "payoutCurrency", "revenueSharePercentage", "hybridTerms", "landingPageUrl"] as const;
  for (const field of stringFields) if (field in value) (output as unknown as Record<string, unknown>)[field] = value[field];
  const arrayFields = ["countries", "excludedCountries", "currencies", "languages", "devices"] as const;
  for (const field of arrayFields) if (Array.isArray(value[field])) output[field] = value[field] as string[];
  if (typeof value.priority === "number") output.priority = value.priority;
  if ("validFrom" in value) output.validFrom = value.validFrom ? new Date(String(value.validFrom)) : null;
  if ("validUntil" in value) output.validUntil = value.validUntil ? new Date(String(value.validUntil)) : null;
  if (Array.isArray(value.trackingLinks)) {
    output.trackingLinks = value.trackingLinks.map((entry) => {
      const link = entry && typeof entry === "object" && !Array.isArray(entry) ? entry as Record<string, unknown> : {};
      return normalizeExternalTrackingLink({
        externalId: String(link.externalId ?? ""),
        label: typeof link.label === "string" ? link.label : null,
        destinationUrl: String(link.destinationUrl ?? ""),
        trackingUrl: String(link.trackingUrl ?? ""),
        countries: Array.isArray(link.countries) ? link.countries.map(String) : [],
        languages: Array.isArray(link.languages) ? link.languages.map(String) : [],
        devices: Array.isArray(link.devices) ? link.devices.map(String) : [],
        currencyCode: typeof link.currencyCode === "string" ? link.currencyCode : null,
        campaign: typeof link.campaign === "string" ? link.campaign : null,
        subIdTemplate: typeof link.subIdTemplate === "string" ? link.subIdTemplate : null,
        priority: typeof link.priority === "number" ? link.priority : 0,
        active: Boolean(link.active),
        validFrom: typeof link.validFrom === "string" ? link.validFrom : null,
        validUntil: typeof link.validUntil === "string" ? link.validUntil : null,
        metadata: jsonRecord(link.metadata as Prisma.JsonValue),
      });
    });
  }
  return output;
}

export class AffiliateSyncService {
  constructor(
    private readonly repository = affiliateIntegrationRepository,
    private readonly registry: AffiliateAdapterRegistry = affiliateAdapterRegistry,
    private readonly credentialStore: AffiliateCredentialStore = affiliateCredentialStore,
  ) {}

  listPrograms(input?: Parameters<AffiliateIntegrationRepository["listPrograms"]>[0]) {
    return this.repository.listPrograms(input);
  }

  listJobs(input?: Parameters<AffiliateIntegrationRepository["listJobs"]>[0]) {
    return this.repository.listJobs(input);
  }

  async getJob(id: string) {
    const job = await this.repository.getJob(id);
    if (!job) throw new NotFoundError("Affiliate import job", { id });
    return job;
  }

  listMappings(input?: Parameters<AffiliateIntegrationRepository["listMappings"]>[0]) {
    return this.repository.listMappings(input);
  }

  listConflicts(input?: Parameters<AffiliateIntegrationRepository["listConflictItems"]>[0]) {
    return this.repository.listConflictItems(input);
  }

  async manualMatch(mappingId: string, casinoId: string, actorId: string) {
    try {
      return await this.repository.manualMatch({ mappingId, casinoId, actorId });
    } catch (error) {
      if (error instanceof Error && error.message === "CASINO_NOT_FOUND") throw new NotFoundError("Casino", { casinoId });
      if (error instanceof Error && error.message === "CASINO_MAPPING_NOT_FOUND") throw new NotFoundError("Casino mapping", { mappingId });
      throw error;
    }
  }

  async testConnection(programId: string, actorId: string) {
    assertAffiliateOperationRateLimit(`connection:${actorId}:${programId}`, { limit: 3, windowMs: 60_000 });
    const program = await this.repository.findProgram(programId);
    if (!program) throw new NotFoundError("Affiliate program", { id: programId });
    const adapter = this.registry.get(program.providerType);
    const credentials = await this.credentialStore.getCredentials(program.id, program.credentialReference);
    const result = await Promise.race([
      adapter.testConnection({
        programId: program.id,
        providerType: program.providerType,
        providerAccountId: program.providerAccountId,
        credentials,
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Connection test timed out")), 10_000)),
    ]).catch((error) => ({
      ok: false,
      status: "ERROR" as const,
      message: redactAffiliateError(error),
      checkedAt: new Date(),
    }));
    await this.repository.updateConnection({
      programId,
      status: result.status,
      message: result.message,
      actorId,
    });
    return {
      ...result,
      credentialsConfigured: this.credentialStore.isConfigured(program.credentialReference),
    };
  }

  private async fetchOffers(input: AffiliateSyncRequest, providerType: string) {
    const program = await this.repository.findProgram(input.programId);
    if (!program) throw new NotFoundError("Affiliate program", { id: input.programId });
    const adapter = this.registry.get(providerType);
    const credentials = await this.credentialStore.getCredentials(program.id, program.credentialReference);
    const records = [];
    const cursors = new Set<string>();
    let cursor: { value: string } | undefined;
    let partialError: string | null = null;

    for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
      try {
        const page = await adapter.fetchOffers({
          programId: program.id,
          providerType,
          providerAccountId: program.providerAccountId,
          credentials,
          payload: input.payload,
        }, cursor);
        if (!Array.isArray(page.records)) throw new ValidationError("Provider page records must be an array");
        if (Buffer.byteLength(JSON.stringify(page.records), "utf8") > maxProviderPageBytes) {
          throw new ValidationError("Provider page exceeds the 2 MB response limit");
        }
        records.push(...page.records);
        if (records.length > maxRecords) throw new ValidationError("Provider returned more than 5,000 records");
        if (!page.nextCursor) break;
        if (!page.nextCursor.value || cursors.has(page.nextCursor.value)) throw new ValidationError("Provider pagination loop detected");
        cursors.add(page.nextCursor.value);
        cursor = page.nextCursor;
      } catch (error) {
        partialError = redactAffiliateError(error);
        if (!records.length) throw error;
        break;
      }
    }
    if (cursor && cursors.size >= maxPages) partialError = "Provider exceeded the 100 page sync limit";
    return { adapter, program, records, partialError };
  }

  async preview(input: AffiliateSyncRequest) {
    assertAffiliateOperationRateLimit(`preview:${input.initiatedBy}:${input.programId}`, { limit: 10, windowMs: 60_000 });
    const requestedProvider = (input.providerType ?? "").trim().toUpperCase();
    const initialProgram = await this.repository.findProgram(input.programId);
    if (!initialProgram) throw new NotFoundError("Affiliate program", { id: input.programId });
    const providerType = requestedProvider || initialProgram.providerType;
    if (providerType !== initialProgram.providerType && providerType !== "MANUAL") {
      throw new ValidationError("Import provider must match the program provider or use MANUAL");
    }

    const { adapter, program, records, partialError } = await this.fetchOffers(input, providerType);
    const casinos = await this.repository.listMatchingCasinos();
    const rules = sourceRules(program.sourceOfTruth);
    const duplicateExternalIds = findDuplicateExternalIds(records);
    const planned: AffiliatePlannedItem[] = [];
    const seenExternalIds = new Set<string>();

    for (const external of records) {
      const sourcePayload = sanitizeAffiliatePayload(external);
      const fallback = {
        entityType: "OFFER" as const,
        externalId: typeof external.externalId === "string" ? external.externalId : "invalid",
        externalName: typeof external.externalName === "string" ? external.externalName : "Invalid external offer",
        externalDomain: normalizeCasinoDomain(external.casino?.domain),
        internalEntityId: null,
        matchStatus: AffiliateMatchStatus.REVIEW_REQUIRED,
        matchMethod: null,
        matchConfidence: null,
        before: null,
        after: null,
        sourcePayload,
        errors: [] as string[],
        conflictFields: [] as string[],
      };
      if (!external.externalId || duplicateExternalIds.has(external.externalId) || seenExternalIds.has(external.externalId)) {
        planned.push({ ...fallback, action: AffiliateImportAction.CONFLICT, matchStatus: AffiliateMatchStatus.CONFLICT, errors: ["Duplicate external offer ID"] });
        continue;
      }
      seenExternalIds.add(external.externalId);

      try {
        const offer = adapter.normalizeOffer(external);
        const casinoExternalId = offer.casino.externalId || `derived:${offer.casino.domain || normalizeCasinoName(offer.casino.name)}`;
        const existingCasinoMapping = await this.repository.findMapping({
          providerType,
          programId: program.id,
          entityType: AffiliateExternalEntityType.CASINO,
          externalId: casinoExternalId,
        });
        let match = matchCasino({ external: offer.casino, existingMapping: existingCasinoMapping, casinos });
        if (!match.casinoId && program.casinoId) {
          match = {
            casinoId: program.casinoId,
            status: AffiliateMatchStatus.MATCHED,
            method: AffiliateMatchMethod.MANUAL,
            confidence: 1,
          };
        }
        await this.repository.upsertMapping({
          providerType,
          programId: program.id,
          entityType: AffiliateExternalEntityType.CASINO,
          externalId: casinoExternalId,
          internalEntityId: match.casinoId,
          externalName: offer.casino.name,
          externalDomain: normalizeCasinoDomain(offer.casino.domain),
          fingerprint: payloadFingerprint(offer.casino),
          sourcePayload: sanitizeAffiliatePayload(offer.casino),
          matchStatus: match.status,
          matchMethod: match.method,
          matchConfidence: match.confidence,
          matchedBy: match.method === AffiliateMatchMethod.MANUAL ? input.initiatedBy : null,
        });
        if (!match.casinoId) {
          planned.push({
            ...fallback,
            externalId: offer.externalId,
            externalName: offer.externalName,
            externalDomain: normalizeCasinoDomain(offer.casino.domain),
            action: AffiliateImportAction.SKIP,
            matchStatus: match.status,
            matchMethod: match.method,
            matchConfidence: match.confidence,
            after: { casinoId: null, provider: providerOfferProjection(offer, program.trustedAutoActivation, program.supportedCountries.includes("GB")) },
            errors: ["Casino match requires review"],
          });
          continue;
        }

        const existing = await this.repository.findOfferByExternalId(program.id, offer.externalId);
        const projection = providerOfferProjection(offer, program.trustedAutoActivation, program.supportedCountries.includes("GB"));
        const current = currentOfferProjection(existing);
        const merged = current
          ? mergeProviderFields({
              current: current.current,
              previousProvider: current.previousProvider,
              nextProvider: projection,
              rules,
            })
          : { value: projection, conflicts: [] };
        const action = merged.conflicts.length
          ? AffiliateImportAction.CONFLICT
          : !existing
            ? AffiliateImportAction.CREATE
            : offer.status === "ARCHIVED" && existing.status !== "ARCHIVED"
              ? AffiliateImportAction.ARCHIVE
              : same(current?.current, merged.value)
                ? AffiliateImportAction.NO_CHANGE
                : AffiliateImportAction.UPDATE;
        planned.push({
          ...fallback,
          externalId: offer.externalId,
          externalName: offer.externalName,
          externalDomain: normalizeCasinoDomain(offer.casino.domain),
          action,
          matchStatus: merged.conflicts.length ? AffiliateMatchStatus.CONFLICT : AffiliateMatchStatus.MATCHED,
          matchMethod: match.method,
          matchConfidence: match.confidence,
          internalEntityId: existing?.id ?? null,
          before: current?.current ?? null,
          after: { casinoId: match.casinoId, provider: merged.value },
          conflictFields: merged.conflicts,
          errors: merged.conflicts.length ? ["Source-of-truth review is required"] : [],
        });
      } catch (error) {
        planned.push({
          ...fallback,
          action: AffiliateImportAction.ERROR,
          errors: [redactAffiliateError(error)],
        });
      }
    }

    if ((input.mode ?? program.syncMode) === AffiliateSyncMode.FULL && program.deactivateMissing) {
      const existingProviderOffers = await this.repository.listProviderOffers(program.id, providerType);
      for (const existing of existingProviderOffers) {
        if (existing.externalOfferId && !seenExternalIds.has(existing.externalOfferId)) {
          planned.push({
            entityType: "OFFER",
            externalId: existing.externalOfferId,
            externalName: existing.externalName || existing.externalOfferId,
            externalDomain: null,
            action: AffiliateImportAction.ARCHIVE,
            matchStatus: AffiliateMatchStatus.MATCHED,
            matchMethod: AffiliateMatchMethod.EXTERNAL_MAPPING,
            matchConfidence: 1,
            internalEntityId: existing.id,
            before: { status: existing.status },
            after: { status: "ARCHIVED", missingFromProvider: true },
            sourcePayload: {},
            errors: [],
            conflictFields: [],
          });
        }
      }
    }

    const importSummary = summarizeAffiliateImportItems(planned);
    return this.repository.createPreviewJob({
      programId: program.id,
      providerType,
      mode: input.mode ?? program.syncMode,
      initiatedBy: input.initiatedBy,
      items: planned,
      summary: importSummary,
      errorSummary: partialError ? [partialError] : undefined,
    });
  }

  async apply(jobId: string, actorId: string) {
    assertAffiliateOperationRateLimit(`apply:${actorId}:${jobId}`, { limit: 5, windowMs: 60_000 });
    const original = await this.getJob(jobId);
    if (!original.dryRun && original.status !== AffiliateImportStatus.RUNNING) {
      throw new ConflictError("This import job has already been applied", { jobId });
    }
    if (original.status === AffiliateImportStatus.RUNNING && Date.now() - original.updatedAt.getTime() < 5 * 60_000) {
      throw new ConflictError("This import job is already being applied", { jobId });
    }
    let job;
    try {
      job = original.status === AffiliateImportStatus.RUNNING ? original : await this.repository.beginApply(jobId);
    } catch (error) {
      if (error instanceof Error && error.message === "IMPORT_JOB_ALREADY_APPLIED") {
        throw new ConflictError("This import job has already been applied", { jobId });
      }
      throw error;
    }
    const program = await this.repository.findProgram(job.affiliateProgramId);
    if (!program) throw new NotFoundError("Affiliate program", { id: job.affiliateProgramId });
    const errors: string[] = job.items
      .filter((item) => item.status === "FAILED")
      .map((item) => `${item.externalId}: previous item failure`);

    for (const item of job.items) {
      if (item.status === "APPLIED" || item.status === "SKIPPED" || item.status === "FAILED") continue;
      try {
        if (item.action === AffiliateImportAction.ARCHIVE && jsonRecord(item.after).missingFromProvider) {
          await this.repository.archiveMissingOfferItem({ itemId: item.id, programId: job.affiliateProgramId, actorId });
          continue;
        }
        if (nonApplicableActions.has(item.action)) continue;
        const adapter = this.registry.get(job.providerType);
        const normalized = adapter.normalizeOffer(item.sourcePayload as unknown as Parameters<typeof adapter.normalizeOffer>[0]);
        const after = jsonRecord(item.after);
        const casinoId = typeof after.casinoId === "string" ? after.casinoId : null;
        if (!casinoId) throw new ValidationError("Approved import item has no matched casino");
        const resolved = jsonRecord(after.provider as Prisma.JsonValue);
        await this.repository.applyOfferItem({
          itemId: item.id,
          providerType: job.providerType,
          programId: job.affiliateProgramId,
          casinoId,
          offer: applyResolvedProjection(normalized, resolved),
          actorId,
          trustedAutoActivation: program.trustedAutoActivation,
          supportsGb: program.supportedCountries.includes("GB"),
          deactivateMissing: program.deactivateMissing,
        });
      } catch (error) {
        const message = redactAffiliateError(error);
        errors.push(`${item.externalId}: ${message}`);
        await this.repository.markItemFailed(item.id, message);
      }
    }

    const appliedSummary = jsonRecord(job.summary as Prisma.JsonValue) as unknown as AffiliateImportSummary;
    const finalStatus = errors.length || appliedSummary.errors || appliedSummary.conflicts || appliedSummary.unmatched
      ? AffiliateImportStatus.COMPLETED_WITH_ERRORS
      : AffiliateImportStatus.COMPLETED;
    await this.repository.finishApply({
      jobId,
      status: finalStatus,
      summary: appliedSummary,
      errors,
      programId: job.affiliateProgramId,
      actorId,
    });
    return this.getJob(jobId);
  }
}

export const affiliateSyncService = new AffiliateSyncService();
