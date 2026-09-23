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
import { readFile } from "node:fs/promises";
import path from "node:path";

import { EditorialStatus, Prisma } from "@prisma/client";

import {
  deriveGlobalCatalog,
  type DerivationInput,
  type GlobalCatalogDerivation,
} from "@/lib/casino-global-catalog/derivation";
import {
  editorScoreBreakdown,
  editorScoreInputFromRecord,
  licenceIdentityKey,
} from "@/lib/casino-global-catalog/editor-score";
import { readCasinoEditorMetadata, writeCasinoEditorMetadata } from "@/lib/casino-builder/editor-metadata";
import prisma from "@/lib/db/prisma";
import { casinoService } from "@/lib/services/casino.service";
import { editorialReviewService } from "@/lib/services/editorial-review.service";

const RELEASE = "CASINO-GLOBAL-CATALOG-01";
const EDITORIAL_CORPUS = "data/casino-global-catalog-01/editorial.v1.json";

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

interface EditorialEntry {
  slug: string;
  bestFor: string[];
  thingsToKnow: string[];
  description: string;
}

/**
 * The generated lists this corpus replaces all opened with the same licence
 * recital, so the guard refuses a corpus that has drifted back toward one.
 */
const GENERATED_OPENING = /^Players who want a licensed site:/i;

async function loadEditorialCorpus() {
  const corpus = JSON.parse(await readFile(path.join(process.cwd(), EDITORIAL_CORPUS), "utf8")) as {
    schemaVersion: string;
    release: string;
    commercialAuthority: boolean;
    entries: EditorialEntry[];
  };
  if (corpus.schemaVersion !== "casino-global-catalog-editorial.v1" || corpus.release !== RELEASE) {
    throw new Error(`${RELEASE}: editorial corpus identity mismatch`);
  }
  if (corpus.commercialAuthority !== false) throw new Error(`${RELEASE}: an editorial corpus must not grant commercial authority`);
  for (const entry of corpus.entries) {
    if (!entry.bestFor.length || !entry.thingsToKnow.length || !entry.description.trim()) {
      throw new Error(`${RELEASE}: ${entry.slug} editorial entry is incomplete`);
    }
    for (const line of [...entry.bestFor, ...entry.thingsToKnow]) {
      if (GENERATED_OPENING.test(line.trim())) throw new Error(`${RELEASE}: ${entry.slug} still carries a generated licence recital`);
    }
  }
  return corpus;
}

async function applyEditorial(entry: EditorialEntry, actorId: string) {
  const record = await prisma.casino.findUnique({ where: { slug: entry.slug }, select: { id: true } });
  if (!record) throw new Error(`${RELEASE}: ${entry.slug} is not in the database`);

  let casino = await casinoService.getCasinoById(record.id);
  if (casino.status !== EditorialStatus.DRAFT) {
    casino = await casinoService.transitionWorkflow(record.id, EditorialStatus.DRAFT, actorId, casino.updatedAt);
  }
  casino = await casinoService.updateCasino(casino.id, {
    description: entry.description,
    pros: entry.bestFor,
    cons: entry.thingsToKnow,
    updatedBy: actorId,
    expectedUpdatedAt: casino.updatedAt,
  });

  // Keep the published editorial review in step with the profile copy.
  let review = await editorialReviewService.getByCasinoId(casino.id);
  if (review) {
    const published = review.revisions.find((revision) => revision.id === review?.publishedRevisionId);
    const document = published?.content;
    if (document) {
      const next = {
        ...document,
        sections: document.sections.map((section) => {
          if (section.kind === "pros") return { ...section, blocks: section.blocks.map((block) => block.type === "pros" ? { ...block, items: entry.bestFor } : block) };
          if (section.kind === "cons") return { ...section, blocks: section.blocks.map((block) => block.type === "cons" ? { ...block, items: entry.thingsToKnow } : block) };
          if (section.kind === "overview") return { ...section, blocks: section.blocks.map((block) => block.type === "paragraph" ? { ...block, text: entry.description } : block) };
          return section;
        }),
      };
      if (review.status !== "DRAFT") review = await editorialReviewService.transition(review.id, "DRAFT", actorId);
      review = await editorialReviewService.saveDraft(casino.id, next, `${RELEASE}: reader-facing editorial rewrite`, actorId);
      review = await editorialReviewService.transition(review.id, "IN_REVIEW", actorId);
      review = await editorialReviewService.transition(review.id, "APPROVED", actorId);
      const revision = review.revisions.find((candidate) => candidate.revisionNumber === review?.draftRevisionNumber);
      if (!revision) throw new Error(`${RELEASE}: ${entry.slug} editorial revision is missing`);
      await editorialReviewService.publish(review.id, revision.id, actorId);
    }
  }

  await republish(casino.id, actorId);
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "casino-global-catalog-01-editorial",
      entityType: "casino",
      entityId: casino.id,
      summary: `${RELEASE}: replaced generated Best for / Things to know for ${entry.slug}`,
      metadata: { release: RELEASE, slug: entry.slug, bestFor: entry.bestFor.length, thingsToKnow: entry.thingsToKnow.length, commercialAuthorityGranted: false },
    },
  });
}

async function editorial() {
  if (option("confirm") !== RELEASE) throw new Error(`${RELEASE}: editorial requires --confirm=${RELEASE}`);
  const expected = option("expected-database");
  const fingerprint = await databaseFingerprint();
  if (expected !== fingerprint) throw new Error(`${RELEASE}: --expected-database must be ${fingerprint}`);
  const actor = await selectActor(option("actor-email"));
  const corpus = await loadEditorialCorpus();
  const only = option("only");
  const entries = only ? corpus.entries.filter((entry) => entry.slug === only) : corpus.entries;
  if (!entries.length) throw new Error(`${RELEASE}: no editorial entry matched`);
  for (const entry of entries) {
    await applyEditorial(entry, actor.id);
    console.log(`  ${entry.slug.padEnd(16)} rewritten`);
  }
  console.log(`${RELEASE}: rewrote editorial copy for ${entries.length} casinos`);
}

async function computeScore(slug: string) {
  const record = await prisma.casino.findUnique({
    where: { slug },
    select: {
      id: true,
      editorScore: true,
      licenses: {
        select: {
          authority: true,
          licenseNumber: true,
          jurisdiction: true,
          status: true,
          marketProfiles: { select: { marketProfile: { select: { countryCode: true } } } },
        },
      },
      paymentMethods: { where: { casinoCountryId: null }, select: { methodKey: true } },
      gameProviders: { where: { casinoCountryId: null }, select: { providerKey: true, liveCasino: true } },
      gameCategories: { where: { casinoCountryId: null }, select: { categoryKey: true } },
      countries: {
        select: {
          countryCode: true,
          availability: true,
          supportLanguages: true,
          supportSummary: true,
          paymentMethods: { select: { methodKey: true } },
          gameProviders: { select: { providerKey: true, liveCasino: true } },
          gameCategories: { select: { categoryKey: true } },
          licenses: { select: { license: { select: { authority: true, licenseNumber: true, jurisdiction: true } } } },
        },
      },
    },
  });
  if (!record) throw new Error(`${RELEASE}: ${slug} is not in the database`);

  const { score, components } = editorScoreBreakdown(editorScoreInputFromRecord({
    markets: record.countries.map((market) => ({
      availability: market.availability,
      supportLanguages: market.supportLanguages,
      supportSummary: market.supportSummary,
      paymentKeys: market.paymentMethods.map((payment) => payment.methodKey),
      providerKeys: market.gameProviders.map((provider) => provider.providerKey),
      categoryKeys: market.gameCategories.map((category) => category.categoryKey),
      liveCasino: market.gameProviders.some((provider) => provider.liveCasino === true),
      licenceKeys: market.licenses.map((link) => licenceIdentityKey(link.license)),
    })),
    globalPaymentKeys: record.paymentMethods.map((payment) => payment.methodKey),
    globalProviderKeys: record.gameProviders.map((provider) => provider.providerKey),
    globalCategoryKeys: record.gameCategories.map((category) => category.categoryKey),
    globalLiveCasino: record.gameProviders.some((provider) => provider.liveCasino === true),
    licences: record.licenses.map((licence) => ({
      key: licenceIdentityKey(licence),
      authority: licence.authority,
      status: licence.status,
    })),
  }));

  return { casinoId: record.id, previous: record.editorScore, score, components };
}

async function recomputeScore(slug: string, actorId: string) {
  const { casinoId, previous, score, components } = await computeScore(slug);
  let casino = await casinoService.getCasinoById(casinoId);
  if (casino.status !== EditorialStatus.DRAFT) {
    casino = await casinoService.transitionWorkflow(casinoId, EditorialStatus.DRAFT, actorId, casino.updatedAt);
  }
  // The six component fields already exist on the builder metadata and are
  // what the admin score breakdown reads. CASINO-REAL-CATALOG-03 wrote the
  // overall score into trustScore, which is the trust component's field; each
  // component now goes to its own.
  const metadata = readCasinoEditorMetadata(casino.reviewBlocks);
  metadata.general = {
    ...metadata.general,
    trustScore: components.trust,
    userExperienceScore: components.userExperience,
    paymentsScore: components.payments,
    gamesScore: components.games,
    supportScore: components.support,
    responsibleGamblingScore: components.responsibleGambling,
    internalNotes: `${RELEASE}: Editor Score recomputed from the completed record; editorial only, no commercial authority.`,
  };
  casino = await casinoService.updateCasino(casino.id, {
    editorScore: score,
    reviewBlocks: writeCasinoEditorMetadata(casino.reviewBlocks, metadata),
    lastReviewedAt: new Date(),
    updatedBy: actorId,
    expectedUpdatedAt: casino.updatedAt,
  });
  await republish(casino.id, actorId);
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "casino-global-catalog-01-score",
      entityType: "casino",
      entityId: casino.id,
      summary: `${RELEASE}: Editor Score recomputed for ${slug} (${previous ?? "none"} to ${score})`,
      metadata: { release: RELEASE, slug, previousScore: previous, score, components, commercialAuthorityGranted: false },
    },
  });
  return { slug, previous, score, components };
}

async function scores() {
  const dryRun = process.argv[2] === "score-plan";
  if (!dryRun && option("confirm") !== RELEASE) throw new Error(`${RELEASE}: scores requires --confirm=${RELEASE}`);
  if (!dryRun) {
    const expected = option("expected-database");
    const fingerprint = await databaseFingerprint();
    if (expected !== fingerprint) throw new Error(`${RELEASE}: --expected-database must be ${fingerprint}`);
  }
  const actor = dryRun ? { id: "", email: "" } : await selectActor(option("actor-email"));
  const slugs = (await prisma.casino.findMany({
    where: { status: EditorialStatus.PUBLISHED },
    orderBy: { slug: "asc" },
    select: { slug: true },
  })).map((casino) => casino.slug);
  const only = option("only");
  // The published Editor Scores for the fourteen CASINO-REAL-CATALOG-02/03
  // casinos are Founder editorial judgements, not outputs of this method.
  // Recomputing them replaces a human call with a count of how much evidence
  // we happen to hold: Inkabet, a strong single-market Peruvian brand, drops
  // from 9.0 to 7.6 purely for having one market. The method therefore fills a
  // missing score and never overwrites one, unless a caller asks for a named
  // casino explicitly. See FOUNDER-CASINO-GLOBAL-CATALOG-2026-09-23.
  const candidates = only ? slugs.filter((slug) => slug === only) : slugs;
  const scored = new Set((await prisma.casino.findMany({
    where: { slug: { in: candidates }, editorScore: { not: null } },
    select: { slug: true },
  })).map((casino) => casino.slug));
  const overwrite = process.argv.includes("--overwrite-editorial-scores");
  const targets = only || overwrite ? candidates : candidates.filter((slug) => !scored.has(slug));
  const skipped = candidates.length - targets.length;
  if (skipped) console.log(`${RELEASE}: keeping ${skipped} existing editorial Editor Scores; pass --only <slug> or --overwrite-editorial-scores to replace one`);

  for (const slug of targets) {
    if (dryRun) {
      // Recompute without writing, so the movement can be reviewed first.
      const preview = await computeScore(slug);
      const delta = preview.previous === null ? "new" : (preview.score - preview.previous).toFixed(1);
      console.log(`  ${slug.padEnd(16)} ${String(preview.previous ?? "—").padStart(4)} -> ${preview.score.toFixed(1)}  (${delta})  ${Object.entries(preview.components).map(([key, value]) => `${key.slice(0, 4)}=${value}`).join(" ")}`);
      continue;
    }
    const result = await recomputeScore(slug, actor.id);
    console.log(`  ${result.slug.padEnd(16)} ${String(result.previous ?? "—").padStart(4)} -> ${result.score.toFixed(1)}`);
  }
  console.log(`${RELEASE}: ${dryRun ? "previewed" : "recomputed"} ${targets.length} Editor Scores`);
}

async function main() {
  const command = process.argv[2];
  if (command === "plan") await plan();
  else if (command === "apply") await apply();
  else if (command === "editorial") await editorial();
  else if (command === "score-plan" || command === "scores") await scores();
  else throw new Error(`${RELEASE}: usage — plan | apply | editorial | score-plan | scores`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
