import { createHash } from "node:crypto";

import { evaluateFirstWaveCommercialReadiness } from "@/lib/affiliate-commercial/first-wave-commercial-readiness";

import type { CommercialActivationBundle, CommercialActivationRecord } from "./contract";

const TRACKING_EVIDENCE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const GB_AGREEMENT_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const firstWaveMarkets = new Set(["DE", "ES", "PE", "SE", "DK", "GR"]);

export type ActivationComponent = "network" | "program" | "offer" | "trackingLink" | "trackingCountry" | "redirect";
export type ActivationAction = "CREATE" | "UPDATE" | "UNCHANGED";
export type ActivationDisposition = "READY" | "CONFLICT" | "REJECT" | "MISSING_DEPENDENCY";

export interface CommercialActivationInspection {
  casino: null | {
    id: string;
    slug: string;
    title: string;
    marketProfile: null | {
      id: string;
      casinoId: string;
      countryCode: string;
      availability: string;
      primaryCurrency: string | null;
      supportedCurrencies: string[];
      primaryLanguage: string | null;
      supportedLanguages: string[];
    };
  };
  network: null | { id: string; current: unknown };
  program: null | { id: string; casinoId: string | null; operator: string; current: unknown; metadata: unknown };
  offer: null | { id: string; casinoId: string; casinoBonusId: string | null; current: unknown; metadata: unknown; currencies: string[] };
  trackingLink: null | { id: string; offerId: string; current: unknown; metadata: unknown };
  trackingCountry: null | { id: string; current: unknown };
  redirect: null | { id: string; casinoId: string; affiliateOfferId: string | null; casinoBonusId: string | null; current: unknown };
}

export interface CommercialActivationRecordPlan {
  key: string;
  casinoSlug: string;
  countryCode: string;
  redirectSlug: string;
  fingerprint: string;
  ready: boolean;
  disposition: ActivationDisposition;
  blockedReasons: string[];
  actions: Record<ActivationComponent, ActivationAction>;
}

export interface CommercialActivationPlan {
  schemaVersion: CommercialActivationBundle["schemaVersion"];
  bundleId: string;
  fingerprint: string;
  ready: boolean;
  summary: { records: number; creates: number; updates: number; unchanged: number; conflicts: number; rejected: number; missingDependencies: number };
  records: CommercialActivationRecordPlan[];
}

function normalized(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  if (value && typeof value === "object" && "toJSON" in value && typeof value.toJSON === "function") return normalized(value.toJSON());
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, normalized(entry)]));
  }
  return value;
}

export function commercialActivationFingerprint(value: unknown) {
  return createHash("sha256").update(JSON.stringify(normalized(value))).digest("hex");
}

function equal(left: unknown, right: unknown) {
  return commercialActivationFingerprint(left) === commercialActivationFingerprint(right);
}

function normalizeIdentity(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function evidenceReasons(record: CommercialActivationRecord, now: Date) {
  const reasons: string[] = [];
  const evidence = record.commercialEvidence;
  const verifiedAt = new Date(evidence.verifiedAt);
  const expiresAt = new Date(evidence.expiresAt);
  if (verifiedAt > now || now.getTime() - verifiedAt.getTime() >= TRACKING_EVIDENCE_MAX_AGE_MS) reasons.push("COMMERCIAL_EVIDENCE_STALE");
  if (expiresAt <= now) reasons.push("COMMERCIAL_EVIDENCE_EXPIRED");

  if (firstWaveMarkets.has(record.market.countryCode)) {
    const readiness = evaluateFirstWaveCommercialReadiness(
      record.market.countryCode as "DE" | "ES" | "PE" | "SE" | "DK" | "GR",
      evidence.requirements,
    );
    reasons.push(...readiness.unmet.map((requirement) => `COMMERCIAL_REQUIREMENT_${requirement}`));
  } else if (record.market.countryCode === "GB") {
    const required = {
      existingCommercialAuthority: evidence.requirements.existingCommercialAuthority,
      operatorMarketLicenceEvidence: evidence.requirements.operatorMarketLicenceEvidence,
      exactOperatorDomainEvidence: evidence.requirements.exactOperatorDomainEvidence,
      requestedAdvertisingWithinOperatorAuthority: evidence.requirements.requestedAdvertisingWithinOperatorAuthority,
      promotionalCopyReviewCleared: evidence.requirements.promotionalCopyReviewCleared,
      partnerApproved: evidence.requirements.partnerApproved,
      offerActive: evidence.requirements.offerActive,
      trackingReady: evidence.requirements.trackingReady,
    };
    for (const [key, ready] of Object.entries(required)) if (!ready) reasons.push(`COMMERCIAL_REQUIREMENT_${key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`);
    const authority = record.program.gbPartnerAuthority;
    if (!authority) reasons.push("GB_PARTNER_AUTHORITY_MISSING");
    if (authority) {
      const effectiveAt = new Date(authority.effectiveAt);
      const reviewedAt = new Date(authority.reviewedAt);
      const agreementExpiry = authority.expiresAt ? new Date(authority.expiresAt) : null;
      if (effectiveAt > now) reasons.push("GB_PARTNER_AUTHORITY_NOT_EFFECTIVE");
      if (agreementExpiry && agreementExpiry <= now) reasons.push("GB_PARTNER_AUTHORITY_EXPIRED");
      if (reviewedAt > now || now.getTime() - reviewedAt.getTime() >= GB_AGREEMENT_MAX_AGE_MS) reasons.push("GB_PARTNER_AUTHORITY_STALE");
      if (normalizeIdentity(authority.operatorOrProgrammeIdentity) !== normalizeIdentity(record.program.operator)) reasons.push("GB_PARTNER_IDENTITY_MISMATCH");
    }
  } else {
    reasons.push("COMMERCIAL_EVIDENCE_POLICY_UNSUPPORTED");
  }

  const suspiciousEvidence = [evidence.sourceReference, evidence.notes, record.program.gbPartnerAuthority?.sourceReference]
    .filter((value): value is string => Boolean(value))
    .some((value) => /(?:password|passwd|secret|bearer\s+|api[_-]?key\s*[=:]|access[_-]?token\s*[=:])/i.test(value));
  if (suspiciousEvidence) reasons.push("EVIDENCE_MUST_NOT_CONTAIN_SECRETS");
  return reasons;
}

function recordEvidence(record: CommercialActivationRecord, bundle: CommercialActivationBundle) {
  return {
    authorityVersion: "commercial-activation-evidence.v1",
    bundleId: bundle.bundleId,
    bundleGeneratedAt: bundle.generatedAt,
    recordFingerprint: commercialActivationFingerprint(record),
    sourceSystem: bundle.source.system,
    exportReference: bundle.source.exportReference,
    countryCode: record.market.countryCode,
    decision: record.commercialEvidence.decision,
    sourceType: record.commercialEvidence.sourceType,
    sourceReference: record.commercialEvidence.sourceReference,
    ...(record.commercialEvidence.sourceUrl ? { sourceUrl: record.commercialEvidence.sourceUrl } : {}),
    currentMarketStatus: record.commercialEvidence.currentMarketStatus,
    observedAt: record.commercialEvidence.observedAt,
    verifiedAt: record.commercialEvidence.verifiedAt,
    expiresAt: record.commercialEvidence.expiresAt,
    reviewedBy: record.commercialEvidence.reviewedBy,
    requirements: record.commercialEvidence.requirements,
    portalIdentifiers: {
      campaignName: record.trackingLink.campaign ?? null,
      campaignId: record.trackingLink.campaignId ?? null,
      linkingCode: record.trackingLink.linkingCode ?? null,
      trackerId: record.trackingLink.externalLinkId,
    },
    routeHealth: record.routeHealth,
  };
}

function recordContainer(metadata: unknown) {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata as Record<string, unknown> : {};
}

export function activationMetadata(metadata: unknown, record: CommercialActivationRecord, bundle: CommercialActivationBundle) {
  const current = recordContainer(metadata);
  const activation = recordContainer(current.commercialActivationV1);
  const records = recordContainer(activation.records);
  return {
    ...current,
    commercialActivationV1: {
      authorityVersion: "commercial-activation-bundle.v1",
      records: { ...records, [record.market.countryCode]: recordEvidence(record, bundle) },
    },
  } as Record<string, unknown>;
}

export function desiredActivationState(
  bundle: CommercialActivationBundle,
  record: CommercialActivationRecord,
  inspection: CommercialActivationInspection,
) {
  const existingProgram = inspection.program?.current as { supportedCountries?: string[]; supportedCurrencies?: string[] } | undefined;
  const currentProgramMetadata = inspection.program?.metadata;
  const currentOfferMetadata = inspection.offer?.metadata;
  const currentTrackingMetadata = inspection.trackingLink?.metadata;
  const supportedCountries = [...new Set([...(existingProgram?.supportedCountries ?? []), record.market.countryCode])].sort();
  const supportedCurrencies = [...new Set([...(existingProgram?.supportedCurrencies ?? []), record.market.currencyCode])].sort();
  const offerCurrencies = [...new Set([...(inspection.offer?.currencies ?? []), record.market.currencyCode])].sort();
  const programMetadata = activationMetadata(currentProgramMetadata, record, bundle);
  if (record.program.gbPartnerAuthority) programMetadata.gbCommercialAuthority = record.program.gbPartnerAuthority;
  return {
    network: {
      name: record.network.name,
      slug: record.network.slug,
      type: record.network.type,
      websiteUrl: record.network.websiteUrl ?? null,
      active: true,
      archivedAt: null,
    },
    program: {
      casinoId: inspection.casino?.id ?? "",
      externalProgramId: record.program.externalProgramId,
      name: record.program.name,
      operator: record.program.operator,
      status: "ACTIVE" as const,
      domainLifecycleStatus: "ACTIVE" as const,
      workflowStatus: "PUBLISHED" as const,
      accountReference: record.program.accountReference,
      defaultCurrency: record.program.defaultCurrency ?? record.market.currencyCode,
      supportedCountries,
      supportedCurrencies,
      trustedAutoActivation: false,
      archivedAt: null,
      metadata: programMetadata,
    },
    offer: {
      casinoId: inspection.casino?.id ?? "",
      externalOfferId: record.offer.externalOfferId,
      externalName: record.offer.externalName,
      internalName: record.offer.internalName,
      publicLabel: record.offer.publicLabel,
      offerType: record.offer.offerType,
      status: "ACTIVE" as const,
      domainLifecycleStatus: "ACTIVE" as const,
      payoutModel: record.offer.payoutModel,
      payoutAmount: record.offer.payoutAmount ?? null,
      payoutCurrency: record.offer.payoutCurrency ?? null,
      revenueSharePercentage: record.offer.revenueSharePercentage ?? null,
      hybridTerms: record.offer.hybridTerms ?? null,
      geoMode: "ALLOW" as const,
      languages: [...new Set(record.offer.languages)].sort(),
      devices: [...new Set(record.offer.devices)].sort(),
      landingPageUrl: record.offer.landingPageUrl,
      startAt: record.offer.validFrom ?? null,
      expiresAt: record.offer.expiresAt ?? null,
      evergreen: !record.offer.expiresAt,
      priority: record.offer.priority,
      archivedAt: null,
      metadata: activationMetadata(currentOfferMetadata, record, bundle),
      countryAuthority: { countryCode: record.market.countryCode, mode: "ALLOW" as const },
      currencies: offerCurrencies,
    },
    trackingLink: {
      externalLinkId: record.trackingLink.externalLinkId,
      label: record.trackingLink.label,
      destinationUrl: record.trackingLink.destinationUrl,
      trackingUrl: record.trackingLink.trackingUrl,
      landingPage: record.trackingLink.landingPage ?? null,
      geoMode: "ALLOW" as const,
      currencyCode: record.market.currencyCode,
      language: record.market.languageCode,
      campaign: record.trackingLink.campaign ?? null,
      subIdTemplate: record.trackingLink.subIdTemplate ?? null,
      verifiedAt: record.commercialEvidence.verifiedAt,
      lastCheckedAt: record.commercialEvidence.verifiedAt,
      validFrom: record.trackingLink.validFrom ?? null,
      expiresAt: record.trackingLink.expiresAt ?? null,
      active: true,
      priority: record.trackingLink.priority,
      source: "PARTNER_PORTAL_ACTIVATION_V1",
      archivedAt: null,
      metadata: activationMetadata(currentTrackingMetadata, record, bundle),
    },
    trackingCountry: {
      countryCode: record.market.countryCode,
      mode: "ALLOW" as const,
      productionEligible: true,
      productionEligibilityVerifiedAt: record.commercialEvidence.verifiedAt,
      productionEligibilityExpiresAt: record.commercialEvidence.expiresAt,
      productionEligibilityEvidence: `${record.commercialEvidence.sourceType}:${record.commercialEvidence.sourceReference}`,
      productionEligibilityNotes: `${COMMERCIAL_EVIDENCE_NOTE}; bundle=${bundle.bundleId}; reviewer=${record.commercialEvidence.reviewedBy}`,
    },
    redirect: {
      slug: record.redirect.slug,
      casinoId: inspection.casino?.id ?? "",
      casinoBonusId: null,
      affiliateOfferId: inspection.offer?.id ?? null,
      defaultCurrency: record.market.currencyCode,
      defaultLanguage: record.market.languageCode,
      active: true,
      archivedAt: null,
    },
  };
}

const COMMERCIAL_EVIDENCE_NOTE = "commercial-activation-bundle.v1 exact Casino × GEO authority";

function componentAction(current: unknown | null, desired: unknown): ActivationAction {
  if (current === null) return "CREATE";
  return equal(current, desired) ? "UNCHANGED" : "UPDATE";
}

const dependencyReasons = new Set(["CASINO_NOT_FOUND", "EXACT_MARKET_PROFILE_NOT_FOUND"]);
const conflictReasons = new Set([
  "CASINO_IDENTITY_MISMATCH",
  "PROGRAM_CASINO_CONFLICT",
  "PROGRAM_OPERATOR_CONFLICT",
  "OFFER_CASINO_CONFLICT",
  "TRACKING_OFFER_CONFLICT",
  "REDIRECT_SLUG_CONFLICT",
]);

function disposition(reasons: string[]): ActivationDisposition {
  if (reasons.some((reason) => dependencyReasons.has(reason))) return "MISSING_DEPENDENCY";
  if (reasons.some((reason) => conflictReasons.has(reason))) return "CONFLICT";
  return reasons.length ? "REJECT" : "READY";
}

export function planCommercialActivationRecord(
  bundle: CommercialActivationBundle,
  record: CommercialActivationRecord,
  inspection: CommercialActivationInspection,
  now = new Date(),
): CommercialActivationRecordPlan {
  const reasons = evidenceReasons(record, now);
  const market = inspection.casino?.marketProfile;
  if (!inspection.casino) reasons.push("CASINO_NOT_FOUND");
  if (inspection.casino && record.casino.expectedName && normalizeIdentity(inspection.casino.title) !== normalizeIdentity(record.casino.expectedName)) reasons.push("CASINO_IDENTITY_MISMATCH");
  if (!market || market.countryCode.toUpperCase() !== record.market.countryCode || market.casinoId !== inspection.casino?.id) reasons.push("EXACT_MARKET_PROFILE_NOT_FOUND");
  if (market && market.availability !== "AVAILABLE") reasons.push("MARKET_NOT_AVAILABLE");
  if (market) {
    const currencies = [market.primaryCurrency, ...market.supportedCurrencies].filter(Boolean).map((value) => value!.toUpperCase());
    const languages = [market.primaryLanguage, ...market.supportedLanguages].filter(Boolean).map((value) => value!.toLowerCase());
    if (!currencies.includes(record.market.currencyCode)) reasons.push("MARKET_CURRENCY_MISMATCH");
    if (!languages.includes(record.market.languageCode.toLowerCase())) reasons.push("MARKET_LANGUAGE_MISMATCH");
  }
  if (inspection.program?.casinoId && inspection.program.casinoId !== inspection.casino?.id) reasons.push("PROGRAM_CASINO_CONFLICT");
  if (inspection.program && normalizeIdentity(inspection.program.operator) !== normalizeIdentity(record.program.operator)) reasons.push("PROGRAM_OPERATOR_CONFLICT");
  if (inspection.offer?.casinoId && inspection.offer.casinoId !== inspection.casino?.id) reasons.push("OFFER_CASINO_CONFLICT");
  if (inspection.trackingLink && inspection.offer && inspection.trackingLink.offerId !== inspection.offer.id) reasons.push("TRACKING_OFFER_CONFLICT");
  if (inspection.redirect && (inspection.redirect.casinoId !== inspection.casino?.id
    || !inspection.offer || inspection.redirect.affiliateOfferId !== inspection.offer.id
    || inspection.redirect.casinoBonusId !== (inspection.offer?.casinoBonusId ?? null))) reasons.push("REDIRECT_SLUG_CONFLICT");
  if (new URL(record.trackingLink.destinationUrl).hostname.toLowerCase() !== record.routeHealth.expectedFinalHost) reasons.push("EXPECTED_FINAL_HOST_MISMATCH");
  if (record.offer.expiresAt && new Date(record.offer.expiresAt) <= now) reasons.push("OFFER_EXPIRED");
  if (record.trackingLink.expiresAt && new Date(record.trackingLink.expiresAt) <= now) reasons.push("TRACKING_LINK_EXPIRED");

  const blockedReasons = [...new Set(reasons)].sort();
  const desired = desiredActivationState(bundle, record, inspection);
  const actions: Record<ActivationComponent, ActivationAction> = {
    network: componentAction(inspection.network?.current ?? null, desired.network),
    program: componentAction(inspection.program?.current ?? null, desired.program),
    offer: componentAction(inspection.offer?.current ?? null, desired.offer),
    trackingLink: componentAction(inspection.trackingLink?.current ?? null, desired.trackingLink),
    trackingCountry: componentAction(inspection.trackingCountry?.current ?? null, desired.trackingCountry),
    redirect: componentAction(inspection.redirect?.current ?? null, desired.redirect),
  };
  return {
    key: `${record.casino.slug}:${record.market.countryCode}:${record.redirect.slug}`,
    casinoSlug: record.casino.slug,
    countryCode: record.market.countryCode,
    redirectSlug: record.redirect.slug,
    fingerprint: commercialActivationFingerprint(record),
    ready: blockedReasons.length === 0,
    disposition: disposition(blockedReasons),
    blockedReasons,
    actions,
  };
}

export function finalizeCommercialActivationPlan(bundle: CommercialActivationBundle, records: CommercialActivationRecordPlan[]): CommercialActivationPlan {
  const actions = records.flatMap((record) => Object.values(record.actions));
  return {
    schemaVersion: bundle.schemaVersion,
    bundleId: bundle.bundleId,
    fingerprint: commercialActivationFingerprint(bundle),
    ready: records.every((record) => record.ready),
    summary: {
      records: records.length,
      creates: actions.filter((action) => action === "CREATE").length,
      updates: actions.filter((action) => action === "UPDATE").length,
      unchanged: actions.filter((action) => action === "UNCHANGED").length,
      conflicts: records.filter((record) => record.disposition === "CONFLICT").length,
      rejected: records.filter((record) => record.disposition === "REJECT").length,
      missingDependencies: records.filter((record) => record.disposition === "MISSING_DEPENDENCY").length,
    },
    records,
  };
}
