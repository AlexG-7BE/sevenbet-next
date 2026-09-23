/**
 * CASINO-GLOBAL-CATALOG-01
 *
 * Rebuilds the global (market-independent) catalog layer for every published
 * casino from facts the database already holds, then republishes the affected
 * casinos so the public snapshot carries it.
 *
 * Read `docs/06_Operations/Casino-Global-Catalog-01-Runbook.md` before running.
 * `plan` writes nothing. `apply` requires an explicit confirmation token, a
 * decision reference, a governed actor and the database fingerprint printed by
 * `plan`.
 */
import { createHash } from "node:crypto";

import { EditorialStatus, Prisma } from "@prisma/client";

import {
  deriveGlobalCatalog,
  type DerivationInput,
  type GlobalCatalogDerivation,
} from "@/lib/casino-global-catalog/derivation";
import prisma from "@/lib/db/prisma";
import { casinoService } from "@/lib/services/casino.service";

const RELEASE = "CASINO-GLOBAL-CATALOG-01";

function option(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) return process.argv[index + 1];
  return process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3);
}

function decimal(value: Prisma.Decimal | null) {
  return value === null ? null : Number(value);
}

async function databaseFingerprint() {
  const [row] = await prisma.$queryRawUnsafe<Array<{ database: string; host: string }>>(
    "SELECT current_database() AS database, coalesce(inet_server_addr()::text, 'local') AS host",
  );
  return createHash("sha256").update(`${row?.host ?? ""}/${row?.database ?? ""}`).digest("hex").slice(0, 16);
}

/** Global rows a casino already carries, which the derivation must not treat as a gap. */
export interface ExistingGlobalLayer {
  payments: number;
  providers: number;
  categories: number;
}

async function loadDerivationInputs(): Promise<Array<DerivationInput & { existing: ExistingGlobalLayer }>> {
  const casinos = await prisma.casino.findMany({
    where: { status: EditorialStatus.PUBLISHED },
    orderBy: { slug: "asc" },
    select: {
      slug: true,
      _count: {
        select: {
          paymentMethods: { where: { casinoCountryId: null } },
          gameProviders: { where: { casinoCountryId: null } },
          gameCategories: { where: { casinoCountryId: null } },
        },
      },
      licenses: {
        select: {
          id: true,
          authority: true,
          licenseNumber: true,
          jurisdiction: true,
          marketProfiles: { select: { marketProfile: { select: { countryCode: true } } } },
        },
      },
      countries: {
        orderBy: { countryCode: "asc" },
        select: {
          countryCode: true,
          availability: true,
          operatingLegalEntity: true,
          primaryLanguage: true,
          supportLanguages: true,
          supportedLanguages: true,
          primaryCurrency: true,
          supportedCurrencies: true,
          paymentMethods: { orderBy: { sortOrder: "asc" } },
          gameProviders: { orderBy: { sortOrder: "asc" } },
          gameCategories: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  return casinos.map((casino) => ({
    slug: casino.slug,
    existing: {
      payments: casino._count.paymentMethods,
      providers: casino._count.gameProviders,
      categories: casino._count.gameCategories,
    },
    licences: casino.licenses.map((licence) => ({
      id: licence.id,
      authority: licence.authority,
      licenseNumber: licence.licenseNumber,
      jurisdiction: licence.jurisdiction,
      marketCountryCodes: licence.marketProfiles.map((link) => link.marketProfile.countryCode),
    })),
    markets: casino.countries.map((market) => ({
      countryCode: market.countryCode,
      availability: market.availability,
      operatingLegalEntity: market.operatingLegalEntity,
      primaryLanguage: market.primaryLanguage,
      supportLanguages: market.supportLanguages,
      supportedLanguages: market.supportedLanguages,
      primaryCurrency: market.primaryCurrency,
      supportedCurrencies: market.supportedCurrencies,
      payments: market.paymentMethods.map((payment) => ({
        key: payment.methodKey,
        name: payment.name,
        supportsDeposits: payment.supportsDeposits,
        supportsWithdrawals: payment.supportsWithdrawals,
        currencies: payment.currencies,
        minimumDeposit: decimal(payment.minimumDeposit),
        minimumWithdrawal: decimal(payment.minimumWithdrawal),
        maximumWithdrawal: decimal(payment.maximumWithdrawal),
        depositProcessingTime: payment.depositProcessingTime,
        withdrawalTime: payment.withdrawalTime,
        fees: payment.fees,
        crypto: payment.crypto,
      })),
      providers: market.gameProviders.map((provider) => ({
        key: provider.providerKey,
        name: provider.name,
        gameCount: provider.gameCount,
        liveCasino: provider.liveCasino,
      })),
      categories: market.gameCategories.map((category) => ({
        key: category.categoryKey,
        name: category.name,
        gameCount: category.gameCount,
        featured: category.featured,
      })),
    })),
  }));
}

function reportLine(derivation: GlobalCatalogDerivation, existing: ExistingGlobalLayer) {
  // A field already covered by an editor-maintained global row is not a gap.
  const covered = new Set<string>([
    ...(existing.payments ? ["payments"] : []),
    ...(existing.providers ? ["providers"] : []),
    ...(existing.categories ? ["categories"] : []),
  ]);
  const gaps = derivation.unresolved.filter((field) => !covered.has(field));
  const unresolved = gaps.length ? ` unresolved=${gaps.join(",")}` : "";
  return `${derivation.slug.padEnd(16)} operator=${(derivation.operator ?? "—").slice(0, 28).padEnd(28)}`
    + ` pay=${String(derivation.payments.length).padStart(2)}`
    + ` prov=${String(derivation.providers.length).padStart(2)}`
    + ` cat=${String(derivation.categories.length).padStart(2)}`
    + ` lang=${String(derivation.languages.length).padStart(2)}`
    + ` cur=${String(derivation.currencies.length).padStart(2)}`
    + ` corpLic=${String(derivation.corporateLicences.length).padStart(2)}`
    + unresolved;
}

async function plan() {
  const inputs = await loadDerivationInputs();
  const derivations = inputs.map((input) => ({ derivation: deriveGlobalCatalog(input), existing: input.existing }));
  console.log(`${RELEASE}: plan for ${derivations.length} published casinos`);
  console.log(`${RELEASE}: targetDatabaseFingerprint=${await databaseFingerprint()}`);
  for (const entry of derivations) console.log(`  ${reportLine(entry.derivation, entry.existing)}`);

  const gained = derivations.filter(({ derivation, existing }) =>
    !existing.payments && !existing.providers && !existing.categories
    && (derivation.payments.length || derivation.providers.length || derivation.categories.length));
  const alreadyGlobal = derivations.filter(({ existing }) => existing.payments || existing.providers || existing.categories);
  const stillEmpty = derivations.filter(({ derivation, existing }) =>
    !existing.payments && !existing.providers && !existing.categories
    && !derivation.payments.length && !derivation.providers.length && !derivation.categories.length);

  console.log(`${RELEASE}: ${gained.length} casinos gain a global catalog layer, ${alreadyGlobal.length} already had one`);
  if (stillEmpty.length) console.log(`${RELEASE}: no derivable catalog for ${stillEmpty.map(({ derivation }) => derivation.slug).join(", ")}`);
  const corporate = derivations.filter(({ derivation }) => derivation.corporateLicences.length);
  console.log(`${RELEASE}: ${corporate.length} casinos expose a corporate licence globally`);
  return derivations;
}

/**
 * Collapses the per-market duplicates of a corporate licence into one row that
 * keeps every market link, then writes the derived global catalog rows.
 */
async function applyDerivation(derivation: GlobalCatalogDerivation, actorId: string) {
  const casino = await prisma.casino.findUnique({
    where: { slug: derivation.slug },
    select: { id: true, operator: true, languages: true, currencies: true },
  });
  if (!casino) throw new Error(`${RELEASE}: ${derivation.slug} disappeared between plan and apply`);

  return prisma.$transaction(async (tx) => {
    const licences = await tx.casinoLicense.findMany({
      where: { casinoId: casino.id },
      select: { id: true, authority: true, licenseNumber: true, jurisdiction: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    const byIdentity = new Map<string, typeof licences>();
    for (const licence of licences) {
      const identity = JSON.stringify([licence.authority, licence.licenseNumber ?? "", licence.jurisdiction ?? ""]);
      byIdentity.set(identity, [...(byIdentity.get(identity) ?? []), licence]);
    }
    let collapsed = 0;
    for (const group of byIdentity.values()) {
      const [keep, ...duplicates] = group;
      if (!keep || !duplicates.length) continue;
      for (const duplicate of duplicates) {
        const links = await tx.casinoCountryLicense.findMany({ where: { casinoLicenseId: duplicate.id } });
        for (const link of links) {
          await tx.casinoCountryLicense.upsert({
            where: { casinoCountryId_casinoLicenseId: { casinoCountryId: link.casinoCountryId, casinoLicenseId: keep.id } },
            create: { casinoCountryId: link.casinoCountryId, casinoLicenseId: keep.id, casinoId: casino.id },
            update: {},
          });
        }
        await tx.casinoLicense.delete({ where: { id: duplicate.id } });
        collapsed += 1;
      }
    }

    let payments = 0;
    for (const [index, payment] of derivation.payments.entries()) {
      const existing = await tx.casinoPaymentMethod.findFirst({
        where: { casinoId: casino.id, casinoCountryId: null, methodKey: payment.key },
        select: { id: true },
      });
      const data = {
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
        sortOrder: index,
        notes: `${RELEASE}: brand-level rail evidenced in every market profile that lists payment methods.`,
      };
      if (existing) await tx.casinoPaymentMethod.update({ where: { id: existing.id }, data });
      else await tx.casinoPaymentMethod.create({ data: { casinoId: casino.id, casinoCountryId: null, methodKey: payment.key, ...data } });
      payments += 1;
    }

    let providers = 0;
    for (const [index, provider] of derivation.providers.entries()) {
      const existing = await tx.casinoGameProvider.findFirst({
        where: { casinoId: casino.id, casinoCountryId: null, providerKey: provider.key },
        select: { id: true },
      });
      const data = { name: provider.name, gameCount: provider.gameCount, liveCasino: provider.liveCasino, sortOrder: index };
      if (existing) await tx.casinoGameProvider.update({ where: { id: existing.id }, data });
      else await tx.casinoGameProvider.create({ data: { casinoId: casino.id, casinoCountryId: null, providerKey: provider.key, ...data } });
      providers += 1;
    }

    let categories = 0;
    for (const [index, category] of derivation.categories.entries()) {
      const existing = await tx.casinoGameCategory.findFirst({
        where: { casinoId: casino.id, casinoCountryId: null, categoryKey: category.key },
        select: { id: true },
      });
      const data = { name: category.name, gameCount: category.gameCount, featured: category.featured, sortOrder: index };
      if (existing) await tx.casinoGameCategory.update({ where: { id: existing.id }, data });
      else await tx.casinoGameCategory.create({ data: { casinoId: casino.id, casinoCountryId: null, categoryKey: category.key, ...data } });
      categories += 1;
    }

    // Derived identity fields never overwrite a value an editor already set.
    const identity: Prisma.CasinoUpdateInput = {};
    if (derivation.operator && !casino.operator?.trim()) identity.operator = derivation.operator;
    if (derivation.languages.length && !casino.languages.length) identity.languages = derivation.languages;
    if (derivation.currencies.length && !casino.currencies.length) identity.currencies = derivation.currencies;
    if (Object.keys(identity).length) {
      await tx.casino.update({ where: { id: casino.id }, data: { ...identity, updatedBy: actorId } });
    }

    return { casinoId: casino.id, collapsed, payments, providers, categories, identity: Object.keys(identity) };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10_000, timeout: 180_000 });
}

async function republish(casinoId: string, actorId: string) {
  let casino = await casinoService.getCasinoById(casinoId);
  if (casino.status !== EditorialStatus.DRAFT) {
    casino = await casinoService.transitionWorkflow(casinoId, EditorialStatus.DRAFT, actorId, casino.updatedAt);
  }
  casino = await casinoService.transitionWorkflow(casino.id, EditorialStatus.IN_REVIEW, actorId, casino.updatedAt);
  casino = await casinoService.transitionWorkflow(casino.id, EditorialStatus.APPROVED, actorId, casino.updatedAt);
  await casinoService.publishCasino(casino.id, actorId, casino.updatedAt);
}

async function selectActor(email: string | undefined) {
  const actor = email
    ? await prisma.adminUser.findFirst({ where: { email }, select: { id: true, email: true } })
    : await prisma.adminUser.findFirst({
        where: { role: { in: ["SUPER_ADMIN", "ADMIN", "EDITOR"] } },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        select: { id: true, email: true },
      });
  if (!actor) throw new Error(`${RELEASE}: no governed CMS actor is available`);
  return actor;
}

async function apply() {
  if (option("confirm") !== RELEASE) throw new Error(`${RELEASE}: apply requires --confirm=${RELEASE}`);
  const decisionRef = option("decision-ref");
  if (!decisionRef) throw new Error(`${RELEASE}: apply requires --decision-ref`);
  const expected = option("expected-database");
  const fingerprint = await databaseFingerprint();
  if (expected !== fingerprint) throw new Error(`${RELEASE}: --expected-database must be ${fingerprint}`);

  const actor = await selectActor(option("actor-email"));
  const derivations = (await loadDerivationInputs()).map(deriveGlobalCatalog);

  const results = [];
  for (const derivation of derivations) {
    const written = await applyDerivation(derivation, actor.id);
    await republish(written.casinoId, actor.id);
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "casino-global-catalog-01",
        entityType: "casino",
        entityId: written.casinoId,
        summary: `${RELEASE}: global catalog layer derived for ${derivation.slug}`,
        metadata: {
          release: RELEASE,
          decisionRef,
          slug: derivation.slug,
          collapsedDuplicateLicences: written.collapsed,
          payments: written.payments,
          providers: written.providers,
          categories: written.categories,
          identityFields: written.identity,
          unresolved: derivation.unresolved,
          commercialAuthorityGranted: false,
        },
      },
    });
    results.push({ slug: derivation.slug, ...written });
    console.log(`  ${derivation.slug.padEnd(16)} pay=${written.payments} prov=${written.providers} cat=${written.categories} licencesCollapsed=${written.collapsed} identity=${written.identity.join(",") || "—"}`);
  }
  console.log(`${RELEASE}: applied to ${results.length} casinos and republished each snapshot`);
}

async function main() {
  const command = process.argv[2];
  if (command === "plan") await plan();
  else if (command === "apply") await apply();
  else throw new Error(`${RELEASE}: usage — plan | apply`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
