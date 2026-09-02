import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const OBSERVED_AT = "2026-08-31T00:00:00.000Z";
const OUTPUT_DIRECTORY = "data/casino-ingestion/casino-data-population-01";
const RESEARCH_DIRECTORY = "research_staging/casino_ingestion_2026-08-31/casinos";
const DECISION_SOURCE_PATHS = [
  "research_staging/casino_ingestion_2026-08-31/FINAL_REPORT.md",
  "research_staging/casino_ingestion_2026-08-31_phase1_5/FINAL_REPORT.md",
  "research_staging/casino_next_batch_2026-09-01/readiness-matrix.json",
  "research_staging/affiliate_assets_2026-08-31/FINAL_REPORT.md",
  "research_staging/affiliate_assets_2026-08-31/quality-control.json",
];
const ALLOWED_SOURCE_TYPES = new Set([
  "OFFICIAL_CASINO",
  "OFFICIAL_OPERATOR",
  "REGULATOR",
  "AFFILIATE_PORTAL",
  "OFFICIAL_TERMS",
  "PARTNER_COMMUNICATION",
  "INTERNAL_RECORD",
  "OTHER",
]);

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function checksum(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function timestamp(value) {
  return value?.includes("T") ? value : `${value}T00:00:00.000Z`;
}

function nullable(value) {
  return value ?? null;
}

const basicWhiteHat = [
  {
    sourceSlug: "hello-casino",
    key: "hello-casino",
    slug: "hello-casino",
    title: "Hello Casino",
    domain: "hellocasino.com",
    websiteUrl: "https://www.hellocasino.com/",
    evidencePrefix: "hello",
    operatorEvidenceId: "whg-operator-identity",
  },
  {
    sourceSlug: "skol-casino",
    key: "skol-casino",
    slug: "skol-casino",
    title: "Skol Casino",
    domain: "skolcasino.com",
    websiteUrl: "https://www.skolcasino.com/",
    evidencePrefix: "skol",
    operatorEvidenceId: "skol-whg-operator-identity",
  },
  {
    sourceSlug: "diamond7",
    key: "diamond7",
    slug: "diamond7",
    title: "Diamond7",
    domain: "diamond7casino.com",
    websiteUrl: "https://www.diamond7casino.com/",
    evidencePrefix: "diamond7",
    operatorEvidenceId: "diamond7-whg-operator-identity",
  },
].map((configuration) => ({
  ...configuration,
  operatorKey: "white-hat-gaming-limited",
  operatorName: "White Hat Gaming Limited",
  operatorLegalName: "White Hat Gaming Limited (Malta C73232)",
  summary: `${configuration.title} is a casino brand on the exact domain www.${configuration.domain}, which the Gambling Commission lists as active under White Hat Gaming Limited's remote casino licence.`,
  termsUrl: null,
  privacyUrl: null,
  responsibleGamblingUrl: null,
  primaryLanguage: null,
  supportedLanguages: [],
  supportLanguages: [],
  primaryCurrency: null,
  supportedCurrencies: [],
  minimumAge: null,
  kycSummary: null,
  withdrawalSummary: null,
  supportSummary: null,
  providers: [],
  categories: ["casino"],
  evidenceMappings: [
    {
      id: `${configuration.evidencePrefix}-ukgc-domain`,
      fieldKeys: ["casino.title", "casino.domain", "availability", "localDomain", "localWebsiteUrl", "operatorProfile", "operatingLegalEntity"],
    },
    {
      id: configuration.operatorEvidenceId,
      fieldKeys: ["operatorProfile", "operatingLegalEntity"],
    },
  ],
  unknownFieldKeys: [
    "termsUrl", "privacyUrl", "responsibleGamblingUrl", "primaryLanguage", "supportedLanguages",
    "supportLanguages", "primaryCurrency", "supportedCurrencies", "minimumAge", "kycSummary",
    "withdrawalSummary", "supportSummary", "payments", "bonuses", "providers",
  ],
}));

const supportedWhiteHat = [
  {
    sourceSlug: "gday-casino",
    key: "gday-casino",
    slug: "gday-casino",
    title: "G'day Casino",
    domain: "gdaycasino.com",
    websiteUrl: "https://www.gdaycasino.com/",
    evidencePrefix: "gday",
    supportUrl: "https://gdaycasino.zendesk.com/hc/en-us",
  },
  {
    sourceSlug: "21-prive",
    key: "21-prive",
    slug: "21-prive",
    title: "21 Privé",
    domain: "21prive.com",
    websiteUrl: "https://www.21prive.com/",
    evidencePrefix: "21prive",
    supportUrl: "https://21prive.zendesk.com/hc/en-us",
  },
  {
    sourceSlug: "slotnite",
    key: "slotnite",
    slug: "slotnite",
    title: "Slotnite",
    domain: "slotnite.com",
    websiteUrl: "https://www.slotnite.com/",
    evidencePrefix: "slotnite",
    supportUrl: "https://slotnite.zendesk.com/hc/en-us",
  },
].map((configuration) => ({
  ...configuration,
  operatorKey: "white-hat-gaming-limited",
  operatorName: "White Hat Gaming Limited",
  operatorLegalName: "White Hat Gaming Limited (Malta C73232)",
  summary: `${configuration.title} is a casino brand on the exact domain www.${configuration.domain}, which the Gambling Commission lists as active under White Hat Gaming Limited's remote casino licence.`,
  termsUrl: `${configuration.websiteUrl}terms`,
  privacyUrl: null,
  responsibleGamblingUrl: `${configuration.websiteUrl}index.php?page=playerprotection`,
  primaryLanguage: "en",
  supportedLanguages: [],
  supportLanguages: ["en"],
  primaryCurrency: null,
  supportedCurrencies: [],
  minimumAge: 18,
  kycSummary: "Automated checks against registration details verify age 18+, identity and address; further documents may include identity, address, payment-account/card or e-wallet evidence.",
  withdrawalSummary: "UKGC withdrawals may remain under review for a minimum of 24 hours; time after approval depends on the withdrawal method. Available methods are account-specific, and the operator states it charges no withdrawal fee while third-party charges may apply.",
  supportSummary: `The official ${configuration.title} support centre provides English-language help at ${configuration.supportUrl}.`,
  providers: [],
  categories: ["casino"],
  evidenceMappings: [
    {
      id: `${configuration.evidencePrefix}-ukgc-domain`,
      fieldKeys: ["casino.title", "casino.domain", "availability", "localDomain", "localWebsiteUrl", "operatorProfile", "operatingLegalEntity"],
    },
    {
      id: `${configuration.evidencePrefix}-official-support`,
      fieldKeys: ["termsUrl", "responsibleGamblingUrl", "primaryLanguage", "supportLanguages", "supportSummary", "operatingLegalEntity"],
    },
    {
      id: `${configuration.evidencePrefix}-verification`,
      fieldKeys: ["minimumAge", "kycSummary", "termsUrl"],
    },
    {
      id: `${configuration.evidencePrefix}-document-requirements`,
      fieldKeys: ["kycSummary"],
    },
    {
      id: `${configuration.evidencePrefix}-withdrawal-timing`,
      fieldKeys: ["withdrawalSummary"],
    },
    {
      id: `${configuration.evidencePrefix}-withdrawal-methods`,
      fieldKeys: ["withdrawalSummary"],
    },
    {
      id: `${configuration.evidencePrefix}-withdrawal-fees`,
      fieldKeys: ["withdrawalSummary"],
    },
    {
      id: `${configuration.evidencePrefix}-general-payments`,
      fieldKeys: ["payments"],
      classification: "UNKNOWN",
    },
    {
      id: `${configuration.evidencePrefix}-current-bonus-unknown`,
      fieldKeys: ["bonuses"],
    },
    {
      id: `${configuration.evidencePrefix}-site-access-limited`,
      fieldKeys: ["privacyUrl", "primaryCurrency", "supportedCurrencies", "supportedLanguages", "providers"],
    },
  ],
  unknownFieldKeys: ["privacyUrl", "primaryCurrency", "supportedCurrencies", "supportedLanguages", "payments", "bonuses", "providers"],
}));

const dragonBet = {
  sourceSlug: "dragonbet",
  key: "dragonbet",
  slug: "dragonbet",
  title: "DragonBet",
  domain: "dragonbet.co.uk",
  websiteUrl: "https://dragonbet.co.uk/",
  operatorKey: "dragonbet-ltd",
  operatorName: "DragonBet Ltd",
  operatorLegalName: "DragonBet Ltd (UK company 15718764)",
  summary: "DragonBet offers sportsbook and casino products through one account.",
  termsUrl: "https://dragonbet.co.uk/casino?account=static&static=terms-and-conditions",
  privacyUrl: "https://dragonbet.co.uk/casino?account=static&static=privacy-policy",
  responsibleGamblingUrl: "https://dragonbet.co.uk/casino?account=static&static=safer-gambling",
  primaryLanguage: "en",
  supportedLanguages: ["en"],
  supportLanguages: [],
  primaryCurrency: null,
  supportedCurrencies: [],
  minimumAge: null,
  kycSummary: null,
  withdrawalSummary: null,
  supportSummary: "Customer support is published at customerservice@dragonbet.co.uk; an official support URL was not established.",
  providers: ["Inspired", "Hacksaw Gaming", "Trigger Studios"],
  categories: ["casino", "live-casino", "slots", "roulette", "blackjack", "baccarat", "jackpots", "virtual-sports"],
  evidenceMappings: [
    {
      id: "dragon-site",
      fieldKeys: ["casino.title", "casino.summary", "availability", "localWebsiteUrl", "operatorProfile", "operatingLegalEntity", "termsUrl", "privacyUrl", "responsibleGamblingUrl", "primaryLanguage", "supportedLanguages", "supportSummary", "providers", "categories"],
    },
    {
      id: "dragon-ukgc-domain",
      fieldKeys: ["casino.domain", "localDomain", "availability", "operatorProfile"],
    },
    {
      id: "dragon-companies-house",
      fieldKeys: ["operatorProfile", "operatingLegalEntity"],
    },
    {
      id: "dragon-legacy-trading-name",
      fieldKeys: ["operatorProfile", "operatingLegalEntity"],
    },
  ],
  unknownFieldKeys: ["primaryCurrency", "supportedCurrencies", "minimumAge", "kycSummary", "withdrawalSummary", "payments", "bonuses"],
};

const configurations = [...basicWhiteHat, ...supportedWhiteHat, dragonBet];

function categoryName(key) {
  return key.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}

function evidenceRecord(row, mapping, sourcePath) {
  const rowSourceType = row.sourceType ?? "OTHER";
  const sourceType = ALLOWED_SOURCE_TYPES.has(rowSourceType) ? rowSourceType : "OTHER";
  const details = Array.isArray(row.facts) ? row.facts.join(" ") : row.claim;
  return {
    key: row.id,
    classification: mapping.classification ?? row.classification,
    sourceType,
    rawSourceType: sourceType === rowSourceType ? null : rowSourceType,
    sourceUrl: nullable(row.sourceUrl ?? row.url),
    sourceReference: `${sourcePath}#${row.id}`,
    fieldKeys: mapping.fieldKeys,
    observedAt: timestamp(row.observedAt ?? "2026-08-31"),
    lastVerifiedAt: timestamp(row.observedAt ?? "2026-08-31"),
    notes: [details, row.notes].filter(Boolean).join(" ") || null,
  };
}

function unknownEvidence(configuration, marketSourcePath) {
  return {
    key: "explicit-unknowns",
    classification: "UNKNOWN",
    sourceType: "OTHER",
    rawSourceType: "FROZEN_RESEARCH_PROFILE",
    sourceUrl: null,
    sourceReference: marketSourcePath,
    fieldKeys: configuration.unknownFieldKeys,
    observedAt: OBSERVED_AT,
    lastVerifiedAt: OBSERVED_AT,
    notes: "The frozen exact-market research did not establish these fields. Null values and empty scoped arrays are intentional and must not be backfilled from another market, operator-wide assumptions, creative labels, or commercial portal state.",
  };
}

function summaryEvidence(configuration, marketSourcePath) {
  if (configuration.key === "dragonbet") return null;
  return {
    key: "factual-summary-synthesis",
    classification: "INFERRED",
    sourceType: "INTERNAL_RECORD",
    rawSourceType: null,
    sourceUrl: null,
    sourceReference: marketSourcePath,
    fieldKeys: ["casino.summary"],
    observedAt: OBSERVED_AT,
    lastVerifiedAt: OBSERVED_AT,
    notes: "The public summary is a concise synthesis of the exact-domain Gambling Commission relationship and active remote-casino licence. It is not a bonus, commercial, or wider-country claim.",
  };
}

function licence(configuration, evidenceById, evidenceSourcePath) {
  const dragon = configuration.key === "dragonbet";
  const licenceRow = evidenceById.get(dragon ? "dragon-ukgc" : `${configuration.evidencePrefix}-ukgc-licence`);
  const domainRow = evidenceById.get(dragon ? "dragon-ukgc-domain" : `${configuration.evidencePrefix}-ukgc-domain`);
  if (!licenceRow || !domainRow) throw new Error(`Missing exact UKGC licence/domain evidence for ${configuration.key}.`);
  const licenceNumber = dragon ? "064908-R-339041-003" : "052894-R-329546-008";
  const accountNumber = dragon ? "64908" : "52894";
  return {
    key: `ukgc-${licenceNumber.toLowerCase()}`,
    authority: "Gambling Commission",
    licenseNumber: licenceNumber,
    jurisdiction: "GB",
    status: "Active",
    canonicalStatus: "ACTIVE",
    verificationUrl: licenceRow.sourceUrl ?? licenceRow.url,
    issuedAt: dragon ? "2024-07-31T00:00:00.000Z" : "2018-10-29T00:00:00.000Z",
    expiresAt: null,
    lastVerifiedAt: OBSERVED_AT,
    notes: `Remote casino licence for account ${accountNumber}; exact-domain evidence is retained separately.`,
    evidence: [
      {
        key: "licence-register",
        sourceUrl: licenceRow.sourceUrl ?? licenceRow.url,
        sourceReference: `${evidenceSourcePath}#${licenceRow.id}`,
        status: "VERIFIED",
        observedAt: OBSERVED_AT,
        expiresAt: null,
        reviewedAt: OBSERVED_AT,
        notes: Array.isArray(licenceRow.facts) ? licenceRow.facts.join(" ") : licenceRow.claim,
      },
      {
        key: "exact-domain-register",
        sourceUrl: domainRow.sourceUrl ?? domainRow.url,
        sourceReference: `${evidenceSourcePath}#${domainRow.id}`,
        status: "VERIFIED",
        observedAt: OBSERVED_AT,
        expiresAt: null,
        reviewedAt: OBSERVED_AT,
        notes: Array.isArray(domainRow.facts) ? domainRow.facts.join(" ") : domainRow.claim,
      },
    ],
  };
}

async function loadSource(sourceRoot, relativePath) {
  const bytes = await readFile(path.join(sourceRoot, relativePath));
  return {
    bytes,
    json: relativePath.endsWith(".json") ? JSON.parse(bytes.toString("utf8")) : null,
    sha256: checksum(bytes),
  };
}

async function buildBundle(sourceRoot, configuration) {
  const base = `${RESEARCH_DIRECTORY}/${configuration.sourceSlug}`;
  const sourcePaths = [`${base}/casino.json`, `${base}/markets/GB.json`, `${base}/evidence.json`, `${base}/assets.json`];
  const sources = new Map();
  for (const sourcePath of sourcePaths) sources.set(sourcePath, await loadSource(sourceRoot, sourcePath));
  const casino = sources.get(`${base}/casino.json`).json;
  const market = sources.get(`${base}/markets/GB.json`).json;
  const evidenceSourcePath = `${base}/evidence.json`;
  const evidenceDocument = sources.get(evidenceSourcePath).json;
  const evidenceRows = evidenceDocument.records ?? evidenceDocument.evidence;
  const evidenceById = new Map(evidenceRows.map((row) => [row.id, row]));

  if (casino.productionEligible !== false || market.productionEligible !== false) throw new Error(`${configuration.key} source is not fail-closed.`);
  if (casino.canonicalName.value !== configuration.title || market.market !== "GB") throw new Error(`${configuration.key} source identity mismatch.`);
  const evidence = configuration.evidenceMappings.map((mapping) => {
    const row = evidenceById.get(mapping.id);
    if (!row) throw new Error(`Missing evidence ${mapping.id} for ${configuration.key}.`);
    return evidenceRecord(row, mapping, evidenceSourcePath);
  });
  const synthesis = summaryEvidence(configuration, `${base}/markets/GB.json`);
  if (synthesis) evidence.push(synthesis);
  evidence.push(unknownEvidence(configuration, `${base}/markets/GB.json`));

  return {
    schemaVersion: "casino-market-ingestion.v1",
    actor: "casino-data-population-01",
    sourceFiles: sourcePaths.map((sourcePath) => ({ path: sourcePath, sha256: sources.get(sourcePath).sha256 })),
    casino: {
      key: configuration.key,
      slug: configuration.slug,
      internalName: configuration.title,
      title: configuration.title,
      domain: configuration.domain,
      websiteUrl: configuration.websiteUrl,
      summary: configuration.summary,
      brand: { key: configuration.key, name: configuration.title, domain: configuration.domain },
    },
    markets: [
      {
        countryCode: "GB",
        availability: "AVAILABLE",
        localDomain: new URL(configuration.websiteUrl).host,
        localWebsiteUrl: configuration.websiteUrl,
        operator: {
          key: configuration.operatorKey,
          name: configuration.operatorName,
          legalName: configuration.operatorName,
          websiteUrl: null,
        },
        operatingLegalEntity: configuration.operatorLegalName,
        termsUrl: configuration.termsUrl,
        privacyUrl: configuration.privacyUrl,
        responsibleGamblingUrl: configuration.responsibleGamblingUrl,
        primaryLanguage: configuration.primaryLanguage,
        supportedLanguages: configuration.supportedLanguages,
        supportLanguages: configuration.supportLanguages,
        primaryCurrency: configuration.primaryCurrency,
        supportedCurrencies: configuration.supportedCurrencies,
        minimumAge: configuration.minimumAge,
        kycSummary: configuration.kycSummary,
        withdrawalSummary: configuration.withdrawalSummary,
        supportSummary: configuration.supportSummary,
        lastVerifiedAt: OBSERVED_AT,
        notes: "PARTIAL exact-market factual profile from the frozen 31 August 2026 corpus. Missing fields remain explicit UNKNOWN values; no commercial eligibility or cross-market fallback is implied.",
        evidence,
        licenses: [licence(configuration, evidenceById, evidenceSourcePath)],
        payments: [],
        bonuses: [],
        providers: configuration.providers.map((name, index) => ({
          key: name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, ""),
          name,
          websiteUrl: null,
          gameCount: null,
          liveCasino: null,
          verifiedAt: OBSERVED_AT,
          sortOrder: index,
        })),
        categories: configuration.categories.map((key, index) => ({
          key,
          name: categoryName(key),
          gameCount: null,
          featured: index === 0,
          sortOrder: index,
        })),
      },
    ],
    commercialMappings: [],
  };
}

async function main() {
  const sourceRoot = option("--source-root");
  if (!sourceRoot || process.argv.length !== 4) {
    throw new Error("Use exactly --source-root <absolute frozen-corpus repository root>.");
  }
  const resolvedSourceRoot = path.resolve(sourceRoot);
  const outputDirectory = path.join(process.cwd(), OUTPUT_DIRECTORY);
  await mkdir(outputDirectory, { recursive: true });
  const manifestBundles = [];

  for (const configuration of configurations) {
    const bundle = await buildBundle(resolvedSourceRoot, configuration);
    const relativePath = `${OUTPUT_DIRECTORY}/${configuration.slug}-gb.v1.json`;
    const bytes = Buffer.from(`${JSON.stringify(bundle, null, 2)}\n`);
    await writeFile(path.join(process.cwd(), relativePath), bytes);
    manifestBundles.push({
      casinoKey: configuration.key,
      casino: configuration.title,
      countryCode: "GB",
      path: relativePath,
      sha256: checksum(bytes),
      sourceFiles: bundle.sourceFiles.length,
    });
  }

  const manifest = {
    schemaVersion: "casino-data-population-01.v1",
    actor: "casino-data-population-01",
    frozenCorpusObservedAt: "2026-08-31",
    decisionSources: await Promise.all(DECISION_SOURCE_PATHS.map(async (sourcePath) => ({
      path: sourcePath,
      sha256: (await loadSource(resolvedSourceRoot, sourcePath)).sha256,
    }))),
    bundles: manifestBundles,
    skipped: [
      {
        casino: "Betsson",
        reasonCode: "UNCHANGED_ALREADY_PRESENT",
        reason: "The exact PE and SE factual profiles were already imported and published in Production; the Founder instruction forbids re-importing them.",
      },
      {
        casino: "Gentleman Jim",
        reasonCode: "BLOCKED_NO_CURRENT_ACTIVE_GB_CASINO",
        reason: "The frozen corpus records a surrendered GB remote-casino licence, inactive exact domain, HTTP 503 site, disabled affiliate account, and contradictory stale affiliate inventory.",
      },
    ],
    assets: {
      publicationCount: 0,
      fallbackRequired: true,
      reason: "The frozen asset evidence marks every candidate publicationEligible=false; Diamond7 GEO remains unknown and the other eligible profiles have no authorised binary.",
    },
    commercial: {
      routeWrites: 0,
      productionEligibleRoutes: 0,
      reason: "The six Superfly GB plans are denied and the DragonBet affiliate account is disabled; no exact eligible outbound route exists in the frozen corpus.",
    },
  };
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(outputDirectory, "manifest.v1.json"), manifestBytes);
  process.stdout.write(`${JSON.stringify({ manifest: `${OUTPUT_DIRECTORY}/manifest.v1.json`, sha256: checksum(manifestBytes), bundles: manifestBundles }, null, 2)}\n`);
}

await main();
