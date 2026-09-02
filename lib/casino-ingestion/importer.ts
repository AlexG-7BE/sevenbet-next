import { createHash } from "node:crypto";

import {
  CasinoLifecycleStatus,
  EditorialStatus,
  OfferStatus,
  Prisma,
  type PrismaClient,
} from "@prisma/client";

import type { CasinoIngestionBundle } from "./contract";

type Transaction = Prisma.TransactionClient;
type ChangeStatus = "created" | "updated" | "unchanged";

export interface ReconciliationCounts {
  created: number;
  updated: number;
  unchanged: number;
  byModel: Record<string, { created: number; updated: number; unchanged: number }>;
}

export interface CasinoIngestionResult {
  mode: "DRY_RUN" | "WRITE";
  casinoKey: string;
  markets: string[];
  planned: {
    casinos: number;
    marketProfiles: number;
    licenses: number;
    licenseEvidence: number;
    payments: number;
    bonuses: number;
    providers: number;
    categories: number;
    marketEvidence: number;
    commercialWrites: 0;
  };
  reconciliation: ReconciliationCounts | null;
}

function blankCounts(): ReconciliationCounts {
  return { created: 0, updated: 0, unchanged: 0, byModel: {} };
}

function mark(counts: ReconciliationCounts, model: string, status: ChangeStatus) {
  counts[status] += 1;
  counts.byModel[model] ??= { created: 0, updated: 0, unchanged: 0 };
  counts.byModel[model][status] += 1;
}

function normalized(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalized);
  if (value && typeof value === "object") {
    const candidate = value as { toJSON?: () => unknown; toString?: () => string };
    if (typeof candidate.toString === "function" && typeof candidate.toJSON === "function" && /^-?\d+(?:\.\d+)?$/.test(candidate.toString())) {
      return Number(candidate.toString());
    }
    if (typeof candidate.toJSON === "function") return normalized(candidate.toJSON());
  }
  return value;
}

function equivalent(current: object, desired: object) {
  const row = current as Record<string, unknown>;
  return Object.entries(desired).every(([key, value]) => JSON.stringify(normalized(row[key])) === JSON.stringify(normalized(value)));
}

function date(value: string | null) {
  return value ? new Date(value) : null;
}

export function deterministicCasinoIngestionId(key: string) {
  const bytes = createHash("sha256").update(`b4gamble:casino-ingestion:v1:${key}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function planCasinoIngestion(bundle: CasinoIngestionBundle): CasinoIngestionResult {
  return {
    mode: "DRY_RUN",
    casinoKey: bundle.casino.key,
    markets: bundle.markets.map((market) => market.countryCode).sort(),
    planned: {
      casinos: 1,
      marketProfiles: bundle.markets.length,
      licenses: bundle.markets.reduce((total, market) => total + market.licenses.length, 0),
      licenseEvidence: bundle.markets.reduce((total, market) => total + market.licenses.reduce((subtotal, license) => subtotal + license.evidence.length, 0), 0),
      payments: bundle.markets.reduce((total, market) => total + market.payments.length, 0),
      bonuses: bundle.markets.reduce((total, market) => total + market.bonuses.length, 0),
      providers: bundle.markets.reduce((total, market) => total + market.providers.length, 0),
      categories: bundle.markets.reduce((total, market) => total + market.categories.length, 0),
      marketEvidence: bundle.markets.reduce((total, market) => total + market.evidence.length, 0),
      commercialWrites: 0,
    },
    reconciliation: null,
  };
}

async function reconcileOperator(tx: Transaction, bundleKey: string, operator: CasinoIngestionBundle["markets"][number]["operator"], counts: ReconciliationCounts) {
  const desired = {
    name: operator.name,
    legalName: operator.legalName,
    websiteUrl: operator.websiteUrl,
    status: CasinoLifecycleStatus.ACTIVE,
  };
  const current = await tx.casinoOperator.findUnique({ where: { name: operator.name } });
  if (!current) {
    const created = await tx.casinoOperator.create({ data: { id: deterministicCasinoIngestionId(`${bundleKey}:operator:${operator.key}`), ...desired } });
    mark(counts, "CasinoOperator", "created");
    return created.id;
  }
  if (!equivalent(current, desired)) {
    await tx.casinoOperator.update({ where: { id: current.id }, data: desired });
    mark(counts, "CasinoOperator", "updated");
  } else mark(counts, "CasinoOperator", "unchanged");
  return current.id;
}

async function reconcileBrand(tx: Transaction, bundle: CasinoIngestionBundle, counts: ReconciliationCounts) {
  const desired = {
    operatorId: null,
    name: bundle.casino.brand.name,
    domain: bundle.casino.brand.domain,
    status: CasinoLifecycleStatus.ACTIVE,
  };
  const deterministicId = deterministicCasinoIngestionId(`${bundle.casino.key}:brand:${bundle.casino.brand.key}`);
  const current = await tx.casinoBrand.findUnique({ where: { id: deterministicId } })
    ?? await tx.casinoBrand.findFirst({ where: { operatorId: null, name: bundle.casino.brand.name } });
  if (!current) {
    const created = await tx.casinoBrand.create({ data: { id: deterministicId, ...desired } });
    mark(counts, "CasinoBrand", "created");
    return created.id;
  }
  if (!equivalent(current, desired)) {
    await tx.casinoBrand.update({ where: { id: current.id }, data: desired });
    mark(counts, "CasinoBrand", "updated");
  } else mark(counts, "CasinoBrand", "unchanged");
  return current.id;
}

async function reconcileCasino(tx: Transaction, bundle: CasinoIngestionBundle, brandProfileId: string, counts: ReconciliationCounts) {
  const desired = {
    internalName: bundle.casino.internalName,
    title: bundle.casino.title,
    domain: bundle.casino.domain,
    websiteUrl: bundle.casino.websiteUrl,
    operator: null,
    operatorProfileId: null,
    brandProfileId,
    domainLifecycleStatus: CasinoLifecycleStatus.ACTIVE,
    summary: bundle.casino.summary,
    languages: [],
    currencies: [],
    license: null,
    country: null,
    updatedBy: bundle.actor,
  };
  const domainOwner = await tx.casino.findUnique({ where: { domain: bundle.casino.domain }, select: { id: true, slug: true } });
  if (domainOwner && domainOwner.slug !== bundle.casino.slug) throw new Error(`Casino domain conflict for ${bundle.casino.domain}.`);
  const current = await tx.casino.findUnique({ where: { slug: bundle.casino.slug } });
  if (!current) {
    const created = await tx.casino.create({
      data: {
        id: deterministicCasinoIngestionId(`${bundle.casino.key}:casino`),
        slug: bundle.casino.slug,
        ...desired,
        status: EditorialStatus.DRAFT,
        createdBy: bundle.actor,
      },
    });
    mark(counts, "Casino", "created");
    return created.id;
  }
  if (!equivalent(current, desired)) {
    await tx.casino.update({ where: { id: current.id }, data: desired });
    mark(counts, "Casino", "updated");
  } else mark(counts, "Casino", "unchanged");
  return current.id;
}

async function reconcileMarket(
  tx: Transaction,
  bundle: CasinoIngestionBundle,
  casinoId: string,
  market: CasinoIngestionBundle["markets"][number],
  counts: ReconciliationCounts,
) {
  const operatorProfileId = await reconcileOperator(tx, bundle.casino.key, market.operator, counts);
  const desired = {
    availability: market.availability,
    localDomain: market.localDomain,
    localWebsiteUrl: market.localWebsiteUrl,
    operatorProfileId,
    operatingLegalEntity: market.operatingLegalEntity,
    termsUrl: market.termsUrl,
    privacyUrl: market.privacyUrl,
    responsibleGamblingUrl: market.responsibleGamblingUrl,
    primaryLanguage: market.primaryLanguage,
    supportedLanguages: market.supportedLanguages,
    supportLanguages: market.supportLanguages,
    primaryCurrency: market.primaryCurrency,
    supportedCurrencies: market.supportedCurrencies,
    minimumAge: market.minimumAge,
    kycSummary: market.kycSummary,
    withdrawalSummary: market.withdrawalSummary,
    supportSummary: market.supportSummary,
    lastVerifiedAt: date(market.lastVerifiedAt),
    notes: market.notes,
  };
  const current = await tx.casinoCountry.findUnique({ where: { casinoId_countryCode: { casinoId, countryCode: market.countryCode } } });
  let casinoCountryId: string;
  if (!current) {
    const created = await tx.casinoCountry.create({
      data: { id: deterministicCasinoIngestionId(`${bundle.casino.key}:market:${market.countryCode}`), casinoId, countryCode: market.countryCode, ...desired },
    });
    casinoCountryId = created.id;
    mark(counts, "CasinoCountry", "created");
  } else {
    casinoCountryId = current.id;
    if (!equivalent(current, desired)) {
      await tx.casinoCountry.update({ where: { id: current.id }, data: desired });
      mark(counts, "CasinoCountry", "updated");
    } else mark(counts, "CasinoCountry", "unchanged");
  }

  for (const evidence of market.evidence) {
    const id = deterministicCasinoIngestionId(`${bundle.casino.key}:market:${market.countryCode}:evidence:${evidence.key}`);
    const desiredEvidence = {
      casinoCountryId,
      classification: evidence.classification,
      sourceType: evidence.sourceType,
      sourceUrl: evidence.sourceUrl,
      sourceReference: evidence.sourceReference,
      fieldKeys: evidence.fieldKeys,
      observedAt: date(evidence.observedAt),
      lastVerifiedAt: date(evidence.lastVerifiedAt),
      notes: evidence.rawSourceType ? `[rawSourceType=${evidence.rawSourceType}] ${evidence.notes ?? ""}`.trim() : evidence.notes,
    };
    const currentEvidence = await tx.casinoCountryEvidence.findUnique({ where: { id } });
    if (currentEvidence && currentEvidence.casinoCountryId !== casinoCountryId) {
      throw new Error(`Casino market evidence identity conflict for ${id}.`);
    }
    if (!currentEvidence) {
      await tx.casinoCountryEvidence.create({ data: { id, ...desiredEvidence } });
      mark(counts, "CasinoCountryEvidence", "created");
    } else if (!equivalent(currentEvidence, desiredEvidence)) {
      await tx.casinoCountryEvidence.update({ where: { id }, data: desiredEvidence });
      mark(counts, "CasinoCountryEvidence", "updated");
    } else mark(counts, "CasinoCountryEvidence", "unchanged");
  }

  for (const license of market.licenses) {
    const deterministicId = deterministicCasinoIngestionId(`${bundle.casino.key}:license:${market.countryCode}:${license.key}`);
    const desiredLicense = {
      authority: license.authority,
      licenseNumber: license.licenseNumber,
      jurisdiction: license.jurisdiction,
      status: license.status,
      canonicalStatus: license.canonicalStatus,
      verificationUrl: license.verificationUrl,
      issuedAt: date(license.issuedAt),
      expiresAt: date(license.expiresAt),
      lastVerifiedAt: date(license.lastVerifiedAt),
      notes: license.notes,
    };
    const currentLicense = license.licenseNumber
      ? await tx.casinoLicense.findUnique({ where: { casinoId_authority_licenseNumber: { casinoId, authority: license.authority, licenseNumber: license.licenseNumber } } })
      : await tx.casinoLicense.findUnique({ where: { id: deterministicId } });
    let casinoLicenseId: string;
    if (!currentLicense) {
      const created = await tx.casinoLicense.create({ data: { id: deterministicId, casinoId, ...desiredLicense } });
      casinoLicenseId = created.id;
      mark(counts, "CasinoLicense", "created");
    } else {
      casinoLicenseId = currentLicense.id;
      if (!equivalent(currentLicense, desiredLicense)) {
        await tx.casinoLicense.update({ where: { id: currentLicense.id }, data: desiredLicense });
        mark(counts, "CasinoLicense", "updated");
      } else mark(counts, "CasinoLicense", "unchanged");
    }
    const relation = await tx.casinoCountryLicense.findUnique({ where: { casinoCountryId_casinoLicenseId: { casinoCountryId, casinoLicenseId } } });
    if (!relation) {
      await tx.casinoCountryLicense.create({ data: { casinoCountryId, casinoLicenseId, casinoId } });
      mark(counts, "CasinoCountryLicense", "created");
    } else mark(counts, "CasinoCountryLicense", "unchanged");

    for (const evidence of license.evidence) {
      const id = deterministicCasinoIngestionId(`${bundle.casino.key}:license:${market.countryCode}:${license.key}:evidence:${evidence.key}`);
      const desiredLicenseEvidence = {
        casinoLicenseId,
        sourceUrl: evidence.sourceUrl,
        sourceReference: evidence.sourceReference,
        status: evidence.status,
        observedAt: date(evidence.observedAt),
        expiresAt: date(evidence.expiresAt),
        reviewedAt: date(evidence.reviewedAt),
        notes: evidence.notes,
      };
      const currentLicenseEvidence = await tx.casinoLicenseEvidence.findUnique({ where: { id } });
      if (currentLicenseEvidence && currentLicenseEvidence.casinoLicenseId !== casinoLicenseId) {
        throw new Error(`Casino licence evidence identity conflict for ${id}.`);
      }
      if (!currentLicenseEvidence) {
        await tx.casinoLicenseEvidence.create({ data: { id, ...desiredLicenseEvidence } });
        mark(counts, "CasinoLicenseEvidence", "created");
      } else if (!equivalent(currentLicenseEvidence, desiredLicenseEvidence)) {
        await tx.casinoLicenseEvidence.update({ where: { id }, data: desiredLicenseEvidence });
        mark(counts, "CasinoLicenseEvidence", "updated");
      } else mark(counts, "CasinoLicenseEvidence", "unchanged");
    }
  }

  for (const payment of market.payments) {
    const desiredPayment = {
      casinoId,
      casinoCountryId,
      methodKey: payment.key,
      name: payment.name,
      supportsDeposits: payment.supportsDeposits,
      supportsWithdrawals: payment.supportsWithdrawals,
      currencies: payment.currencies,
      minimumDeposit: payment.minimumDeposit,
      minimumWithdrawal: payment.minimumWithdrawal,
      maximumWithdrawal: payment.maximumWithdrawal,
      depositProcessingTime: payment.depositProcessingTime,
      withdrawalTime: payment.withdrawalTime,
      fees: payment.fees,
      crypto: payment.crypto,
      lastVerifiedAt: date(payment.lastVerifiedAt),
      notes: payment.notes,
      sortOrder: payment.sortOrder,
    };
    const currentPayment = await tx.casinoPaymentMethod.findUnique({ where: { casinoCountryId_methodKey: { casinoCountryId, methodKey: payment.key } } });
    if (!currentPayment) {
      await tx.casinoPaymentMethod.create({ data: { id: deterministicCasinoIngestionId(`${bundle.casino.key}:market:${market.countryCode}:payment:${payment.key}`), ...desiredPayment } });
      mark(counts, "CasinoPaymentMethod", "created");
    } else if (!equivalent(currentPayment, desiredPayment)) {
      await tx.casinoPaymentMethod.update({ where: { id: currentPayment.id }, data: desiredPayment });
      mark(counts, "CasinoPaymentMethod", "updated");
    } else mark(counts, "CasinoPaymentMethod", "unchanged");
  }

  for (const category of market.categories) {
    const desiredCategory = { casinoId, casinoCountryId, categoryKey: category.key, name: category.name, gameCount: category.gameCount, featured: category.featured, sortOrder: category.sortOrder };
    const currentCategory = await tx.casinoGameCategory.findUnique({ where: { casinoCountryId_categoryKey: { casinoCountryId, categoryKey: category.key } } });
    if (!currentCategory) {
      await tx.casinoGameCategory.create({ data: { id: deterministicCasinoIngestionId(`${bundle.casino.key}:market:${market.countryCode}:category:${category.key}`), ...desiredCategory } });
      mark(counts, "CasinoGameCategory", "created");
    } else if (!equivalent(currentCategory, desiredCategory)) {
      await tx.casinoGameCategory.update({ where: { id: currentCategory.id }, data: desiredCategory });
      mark(counts, "CasinoGameCategory", "updated");
    } else mark(counts, "CasinoGameCategory", "unchanged");
  }

  for (const provider of market.providers) {
    const desiredProvider = { casinoId, casinoCountryId, providerKey: provider.key, name: provider.name, websiteUrl: provider.websiteUrl, gameCount: provider.gameCount, liveCasino: provider.liveCasino, verifiedAt: date(provider.verifiedAt), sortOrder: provider.sortOrder };
    const currentProvider = await tx.casinoGameProvider.findUnique({ where: { casinoCountryId_providerKey: { casinoCountryId, providerKey: provider.key } } });
    if (!currentProvider) {
      await tx.casinoGameProvider.create({ data: { id: deterministicCasinoIngestionId(`${bundle.casino.key}:market:${market.countryCode}:provider:${provider.key}`), ...desiredProvider } });
      mark(counts, "CasinoGameProvider", "created");
    } else if (!equivalent(currentProvider, desiredProvider)) {
      await tx.casinoGameProvider.update({ where: { id: currentProvider.id }, data: desiredProvider });
      mark(counts, "CasinoGameProvider", "updated");
    } else mark(counts, "CasinoGameProvider", "unchanged");
  }

  for (const bonus of market.bonuses) {
    const desiredBonus = {
      casinoId,
      casinoCountryId,
      title: bonus.title,
      summary: bonus.summary,
      type: bonus.type,
      percentage: bonus.percentage,
      minimumDeposit: bonus.minimumDeposit,
      maximumBonus: bonus.maximumBonus,
      currency: bonus.currency,
      freeSpins: bonus.freeSpins,
      wageringMultiplier: bonus.wageringMultiplier,
      wageringText: bonus.wageringText,
      eligibility: bonus.eligibility,
      importantConditions: bonus.importantConditions,
      termsUrl: bonus.termsUrl,
      startsAt: date(bonus.startsAt),
      expiresAt: date(bonus.expiresAt),
      domainLifecycleStatus: CasinoLifecycleStatus.ACTIVE,
      lastVerifiedAt: date(bonus.lastVerifiedAt),
      sortOrder: bonus.sortOrder,
      updatedBy: bundle.actor,
    };
    const currentBonus = await tx.casinoBonus.findUnique({ where: { slug: bonus.slug } });
    if (currentBonus && (currentBonus.casinoId !== casinoId || currentBonus.casinoCountryId !== casinoCountryId)) {
      throw new Error(`Casino bonus slug conflict for ${bonus.slug}.`);
    }
    if (!currentBonus) {
      await tx.casinoBonus.create({ data: {
        id: deterministicCasinoIngestionId(`${bundle.casino.key}:market:${market.countryCode}:bonus:${bonus.key}`),
        slug: bonus.slug,
        ...desiredBonus,
        status: EditorialStatus.DRAFT,
        offerStatus: OfferStatus.DRAFT,
        createdBy: bundle.actor,
      } });
      mark(counts, "CasinoBonus", "created");
    } else if (!equivalent(currentBonus, desiredBonus)) {
      await tx.casinoBonus.update({ where: { id: currentBonus.id }, data: desiredBonus });
      mark(counts, "CasinoBonus", "updated");
    } else mark(counts, "CasinoBonus", "unchanged");
  }
}

async function reconcileCasinoBundle(tx: Transaction, bundle: CasinoIngestionBundle, counts: ReconciliationCounts) {
  const brandProfileId = await reconcileBrand(tx, bundle, counts);
  const casinoId = await reconcileCasino(tx, bundle, brandProfileId, counts);
  for (const market of [...bundle.markets].sort((left, right) => left.countryCode.localeCompare(right.countryCode))) {
    await reconcileMarket(tx, bundle, casinoId, market, counts);
  }
}

function orderedBatch(bundles: CasinoIngestionBundle[]) {
  if (bundles.length === 0) throw new Error("Casino ingestion batch must contain at least one bundle.");
  const ordered = [...bundles].sort((left, right) => left.casino.key.localeCompare(right.casino.key));
  for (const field of ["key", "slug", "domain"] as const) {
    const values = ordered.map((bundle) => bundle.casino[field]);
    if (new Set(values).size !== values.length) throw new Error(`Casino ingestion batch ${field} values must be unique.`);
  }
  return ordered;
}

export async function ingestCasinoBundles(prisma: PrismaClient, bundles: CasinoIngestionBundle[]): Promise<CasinoIngestionResult[]> {
  const ordered = orderedBatch(bundles);
  const results: CasinoIngestionResult[] = [];
  await prisma.$transaction(async (tx) => {
    for (const bundle of ordered) {
      const counts = blankCounts();
      await reconcileCasinoBundle(tx, bundle, counts);
      results.push({ ...planCasinoIngestion(bundle), mode: "WRITE", reconciliation: counts });
    }
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 5_000,
    timeout: 65_000,
  });
  return results;
}

export async function ingestCasinoBundle(prisma: PrismaClient, bundle: CasinoIngestionBundle): Promise<CasinoIngestionResult> {
  return (await ingestCasinoBundles(prisma, [bundle]))[0]!;
}

export async function verifyCasinoBundlesIdempotency(prisma: PrismaClient, bundles: CasinoIngestionBundle[]) {
  const counts = blankCounts();
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '20s'");
    await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '5s'");
    await tx.$executeRawUnsafe("SET LOCAL idle_in_transaction_session_timeout = '60s'");
    for (const bundle of orderedBatch(bundles)) await reconcileCasinoBundle(tx, bundle, counts);
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    maxWait: 5_000,
    timeout: 65_000,
  });
  if (counts.created !== 0 || counts.updated !== 0) {
    throw new Error("Casino ingestion idempotency verification detected a pending write.");
  }
  return counts;
}

export async function verifyCasinoBundleIdempotency(prisma: PrismaClient, bundle: CasinoIngestionBundle) {
  return verifyCasinoBundlesIdempotency(prisma, [bundle]);
}
