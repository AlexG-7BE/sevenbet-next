import { createHash } from "node:crypto";

import type { Prisma } from "@prisma/client";

import {
  DEMO_CASINO_RETIREMENT_CONFIRMATION,
  DEMO_CASINO_RETIREMENT_SOURCE,
  DEMO_CASINO_RETIREMENT_VERSION,
  demoAffiliateNetworkRetirementManifest,
  demoAffiliateRetirementManifest,
  demoCasinoRetirementIds,
  demoCasinoRetirementManifest,
} from "./demo-casino-retirement.manifest";

type Database = Prisma.TransactionClient;

type ForeignKeyRow = {
  constraintName: string;
  childTable: string;
  parentTable: string;
  childColumns: string[];
  parentColumns: string[];
  deleteAction: "CASCADE" | "SET_NULL" | "SET_DEFAULT" | "RESTRICT" | "NO_ACTION";
};

type CasinoRow = {
  id: string;
  slug: string;
  title: string;
  domain: string;
  status: string;
  publishedVersion: number;
  operatorProfileId: string | null;
  brandProfileId: string | null;
};

type CountRow = { casinoId: string; rowCount: bigint | number };
type PolymorphicCountRow = CountRow & { tableName: string };

export type DemoRetirementConflict = Readonly<{
  code:
    | "DEMO_RETIREMENT_MANIFEST_DRIFT"
    | "DEMO_RETIREMENT_IDENTITY_COLLISION"
    | "DEMO_RETIREMENT_UNEXPECTED_DEPENDENCY"
    | "DEMO_RETIREMENT_REAL_DATA_CONFLICT";
  table: string;
  casinoId?: string;
  detail: string;
}>;

export type DemoRetirementDependency = Readonly<{
  table: string;
  totalRows: number;
  rowsByCasino: Readonly<Record<string, number>>;
  disposition: "EXACT_ROOT_DELETE" | "EXACT_AFFILIATE_GRAPH_DELETE" | "CASCADE_DELETE" | "SET_NULL_RETAIN" | "RESTRICT_REVIEW" | "IMMUTABLE_HISTORY_RETAIN";
  relationPath: readonly string[];
}>;

export type DemoRetirementAffiliateDependency = Readonly<{
  constraint: string;
  table: string;
  column: string;
  parentTable: string;
  totalRows: number;
  disposition: "EXACT_AFFILIATE_GRAPH_DELETE" | "CASCADE_DELETE" | "SET_NULL_RETAIN" | "RESTRICT_REVIEW";
}>;

export type DemoCasinoRetirementPlan = Readonly<{
  operation: typeof DEMO_CASINO_RETIREMENT_VERSION;
  evidenceSource: typeof DEMO_CASINO_RETIREMENT_SOURCE;
  demoCasinoCount: number;
  existingDemoCasinoCount: number;
  existingAffiliateRows: Readonly<{
    networks: number;
    programs: number;
    offers: number;
    trackingLinks: number;
    redirects: number;
    offerRevisions: number;
    trackingLinkRevisions: number;
    redirectRevisions: number;
  }>;
  casinos: readonly Readonly<{
    id: string;
    slug: string;
    name: string;
    exists: boolean;
    publicationState: string | null;
    publishedVersion: number | null;
  }>[];
  dependencies: readonly DemoRetirementDependency[];
  affiliateDependencies: readonly DemoRetirementAffiliateDependency[];
  conflicts: readonly DemoRetirementConflict[];
  safeDeleteSet: Readonly<{
    casinoIds: readonly string[];
    affiliateNetworkIds: readonly string[];
    affiliateProgramIds: readonly string[];
    affiliateOfferIds: readonly string[];
    affiliateTrackingLinkIds: readonly string[];
    affiliateRedirectIds: readonly string[];
    affiliateOfferRevisionIds: readonly string[];
    affiliateTrackingLinkRevisionIds: readonly string[];
    affiliateRedirectRevisionIds: readonly string[];
  }>;
  retainedHistory: readonly Readonly<{ table: string; totalRows: number; rationale: string }>[];
  expectedAfterState: Readonly<{
    liveDemoCasinos: 0;
    demoSpecificRuntimeAuthority: 0;
  }>;
  readyToApply: boolean;
  planSha256: string;
}>;

const EXPECTED_REACHABLE_TABLES = new Set([
  "AffiliateExternalMapping",
  "AffiliateImportItem",
  "AffiliateImportJob",
  "AffiliateLink",
  "AffiliateOffer",
  "AffiliateOfferCountry",
  "AffiliateOfferCurrency",
  "AffiliateOfferMediaAssignment",
  "AffiliateOfferPartnerHostedCreativeAssignment",
  "AffiliateOfferRevision",
  "AffiliateOutboundClickDaily",
  "AffiliateProgram",
  "AffiliateRedirectRevision",
  "AffiliateRedirectSlug",
  "AffiliateTrackingLink",
  "AffiliateTrackingLinkCountry",
  "AffiliateTrackingLinkRevision",
  "AnalyticsEvent",
  "Bonus",
  "CasinoAffiliateLink",
  "CasinoAlias",
  "CasinoBonus",
  "CasinoBonusMediaAssignment",
  "CasinoBonusPartnerHostedCreativeAssignment",
  "CasinoCountry",
  "CasinoCountryEvidence",
  "CasinoCountryLicense",
  "CasinoGameCategory",
  "CasinoGameProvider",
  "CasinoImage",
  "CasinoLicense",
  "CasinoLicenseEvidence",
  "CasinoMediaAssignment",
  "CasinoPartnerHostedCreativeAssignment",
  "CasinoPaymentMethod",
  "CasinoRevision",
  "CasinoSeo",
  "CasinoVersion",
  "CommercialActivationPacket",
  "CommercialActivity",
  "CommercialAgentOperation",
  "CommercialAgentRun",
  "CommercialApplication",
  "CommercialContact",
  "CommercialEvidence",
  "CommercialOpportunity",
  "CommercialTask",
  "CommercialTerm",
  "EditorialPreviewToken",
  "EditorialReview",
  "EditorialReviewRevision",
  "MarketActivation",
  "MarketActivationEvent",
  "MarketActivationIntent",
  "MediaAsset",
  "MediaCreativeSet",
  "MediaCreativeVariant",
  "MediaPreflightEntry",
  "MediaRevision",
  "OutboundClick",
  "PartnerCasinoMarketSupport",
  "PartnerCasinoRelationship",
  "PartnerHostedCreative",
]);

const REAL_DATA_CONFLICT_TABLES = new Set([
  "AffiliateLink",
  "AffiliateOutboundClickDaily",
  "CommercialOpportunity",
  "MarketActivation",
  "MediaAsset",
  "MediaCreativeSet",
  "MediaPreflightEntry",
  "MediaRevision",
  "PartnerCasinoMarketSupport",
  "PartnerCasinoRelationship",
  "PartnerHostedCreative",
]);

const EXACT_AFFILIATE_GRAPH_TABLES = new Set([
  "AffiliateOffer",
  "AffiliateOfferRevision",
  "AffiliateProgram",
  "AffiliateRedirectRevision",
  "AffiliateRedirectSlug",
  "AffiliateTrackingLink",
  "AffiliateTrackingLinkRevision",
]);

const UNEXPECTED_AFFILIATE_DEPENDENCY_TABLES = new Set([
  "AffiliateOfferCountry",
  "AffiliateOfferCurrency",
  "AffiliateOfferMediaAssignment",
  "AffiliateOfferPartnerHostedCreativeAssignment",
  "AffiliateTrackingLinkCountry",
]);

const EXACT_AFFILIATE_RELATIONS = new Set([
  "AffiliateProgram->AffiliateNetwork",
  "AffiliateOffer->AffiliateProgram",
  "AffiliateOfferRevision->AffiliateOffer",
  "AffiliateRedirectSlug->AffiliateOffer",
  "AffiliateTrackingLink->AffiliateOffer",
  "AffiliateTrackingLinkRevision->AffiliateTrackingLink",
  "AffiliateRedirectRevision->AffiliateRedirectSlug",
]);

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function stableJson(value: unknown): string {
  if (value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashPlan(value: Omit<DemoCasinoRetirementPlan, "planSha256">) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

async function foreignKeys(database: Database) {
  return database.$queryRawUnsafe<ForeignKeyRow[]>(`
    SELECT
      constraint_row.conname AS "constraintName",
      child.relname AS "childTable",
      parent.relname AS "parentTable",
      array_agg(child_attribute.attname ORDER BY key_columns.ordinality)::text[] AS "childColumns",
      array_agg(parent_attribute.attname ORDER BY key_columns.ordinality)::text[] AS "parentColumns",
      CASE constraint_row.confdeltype
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET_NULL'
        WHEN 'd' THEN 'SET_DEFAULT'
        WHEN 'r' THEN 'RESTRICT'
        ELSE 'NO_ACTION'
      END AS "deleteAction"
    FROM pg_constraint constraint_row
    JOIN pg_class child ON child.oid = constraint_row.conrelid
    JOIN pg_namespace child_namespace ON child_namespace.oid = child.relnamespace
    JOIN pg_class parent ON parent.oid = constraint_row.confrelid
    JOIN pg_namespace parent_namespace ON parent_namespace.oid = parent.relnamespace
    JOIN LATERAL unnest(constraint_row.conkey, constraint_row.confkey)
      WITH ORDINALITY AS key_columns(child_attnum, parent_attnum, ordinality) ON TRUE
    JOIN pg_attribute child_attribute
      ON child_attribute.attrelid = child.oid AND child_attribute.attnum = key_columns.child_attnum
    JOIN pg_attribute parent_attribute
      ON parent_attribute.attrelid = parent.oid AND parent_attribute.attnum = key_columns.parent_attnum
    WHERE constraint_row.contype = 'f'
      AND child_namespace.nspname = 'public'
      AND parent_namespace.nspname = 'public'
    GROUP BY constraint_row.conname, child.relname, parent.relname, constraint_row.confdeltype
    ORDER BY child.relname, parent.relname, constraint_row.conname
  `);
}

function pathsToCasino(edges: readonly ForeignKeyRow[]) {
  const paths = new Map<string, ForeignKeyRow[]>([["Casino", []]]);
  const queue = ["Casino"];
  while (queue.length) {
    const parent = queue.shift()!;
    const parentPath = paths.get(parent)!;
    for (const edge of edges.filter((candidate) => candidate.parentTable === parent)) {
      if (paths.has(edge.childTable)) continue;
      paths.set(edge.childTable, [edge, ...parentPath]);
      queue.push(edge.childTable);
    }
  }
  return paths;
}

function dependencyDisposition(table: string, path: readonly ForeignKeyRow[]): DemoRetirementDependency["disposition"] {
  if (EXACT_AFFILIATE_GRAPH_TABLES.has(table)) return "EXACT_AFFILIATE_GRAPH_DELETE";
  if (path.some((edge) => edge.deleteAction === "RESTRICT" || edge.deleteAction === "NO_ACTION" || edge.deleteAction === "SET_DEFAULT")) {
    return "RESTRICT_REVIEW";
  }
  if (path.some((edge) => edge.deleteAction === "SET_NULL")) return "SET_NULL_RETAIN";
  return "CASCADE_DELETE";
}

async function countDependency(database: Database, table: string, path: readonly ForeignKeyRow[]) {
  const joins: string[] = [];
  let currentAlias = "dependency_row";
  path.forEach((edge, index) => {
    const parentAlias = edge.parentTable === "Casino" ? "root_casino" : `parent_${index}`;
    const predicates = edge.childColumns.map((column, columnIndex) =>
      `${currentAlias}.${quoteIdentifier(column)} = ${parentAlias}.${quoteIdentifier(edge.parentColumns[columnIndex]!)}`,
    );
    joins.push(`JOIN ${quoteIdentifier(edge.parentTable)} ${parentAlias} ON ${predicates.join(" AND ")}`);
    currentAlias = parentAlias;
  });
  const rows = await database.$queryRawUnsafe<CountRow[]>(`
    SELECT root_casino."id"::text AS "casinoId", COUNT(*)::bigint AS "rowCount"
    FROM ${quoteIdentifier(table)} dependency_row
    ${joins.join("\n")}
    WHERE root_casino."id" = ANY($1::uuid[])
    GROUP BY root_casino."id"
    ORDER BY root_casino."id"
  `, demoCasinoRetirementIds);
  return Object.fromEntries(rows.map((row) => [row.casinoId, Number(row.rowCount)]));
}

async function polymorphicHistory(database: Database) {
  const rows = await database.$queryRawUnsafe<PolymorphicCountRow[]>(`
    SELECT 'AuditLog'::text AS "tableName", roots."casinoId"::text AS "casinoId", COUNT(history.*)::bigint AS "rowCount"
    FROM unnest($1::uuid[]) roots("casinoId")
    LEFT JOIN "AuditLog" history ON history."entityId" = roots."casinoId"::text
    GROUP BY roots."casinoId"
    UNION ALL
    SELECT 'ContentRevision'::text AS "tableName", roots."casinoId"::text AS "casinoId", COUNT(history.*)::bigint AS "rowCount"
    FROM unnest($1::uuid[]) roots("casinoId")
    LEFT JOIN "ContentRevision" history ON history."entityId" = roots."casinoId"::text
    GROUP BY roots."casinoId"
    ORDER BY "tableName", "casinoId"
  `, demoCasinoRetirementIds);
  return ["AuditLog", "ContentRevision"].map((table) => {
    const rowsByCasino = Object.fromEntries(rows.filter((row) => row.tableName === table && Number(row.rowCount) > 0).map((row) => [row.casinoId, Number(row.rowCount)]));
    return {
      table,
      totalRows: Object.values(rowsByCasino).reduce((total, count) => total + count, 0),
      rowsByCasino,
      disposition: "IMMUTABLE_HISTORY_RETAIN" as const,
      relationPath: ["polymorphic entityId snapshot; no Casino foreign key"],
    };
  });
}

function addConflict(conflicts: DemoRetirementConflict[], conflict: DemoRetirementConflict) {
  if (!conflicts.some((candidate) => stableJson(candidate) === stableJson(conflict))) conflicts.push(conflict);
}

async function inspectCasinoIdentities(database: Database, conflicts: DemoRetirementConflict[]) {
  const rows = await database.$queryRawUnsafe<CasinoRow[]>(`
    SELECT "id"::text, "slug", "title", "domain", "status"::text, "publishedVersion", "operatorProfileId"::text, "brandProfileId"::text
    FROM "Casino"
    WHERE "id" = ANY($1::uuid[])
    ORDER BY "id"
  `, demoCasinoRetirementIds);
  const byId = new Map(rows.map((row) => [row.id, row]));
  for (const expected of demoCasinoRetirementManifest) {
    const row = byId.get(expected.id);
    if (!row) continue;
    if (row.slug !== expected.slug || row.title !== expected.name || row.domain !== expected.domain) {
      addConflict(conflicts, {
        code: "DEMO_RETIREMENT_MANIFEST_DRIFT",
        table: "Casino",
        casinoId: expected.id,
        detail: "The immutable ID no longer has the exact RFC-012 slug, title and domain.",
      });
    }
    if (row.operatorProfileId || row.brandProfileId) {
      addConflict(conflicts, {
        code: "DEMO_RETIREMENT_REAL_DATA_CONFLICT",
        table: "Casino",
        casinoId: expected.id,
        detail: "The synthetic identity is linked to a structured Operator or Brand.",
      });
    }
  }
  const collisions = await database.$queryRawUnsafe<Array<{ id: string; slug: string; domain: string }>>(`
    SELECT "id"::text, "slug", "domain"
    FROM "Casino"
    WHERE ("slug" = ANY($1::text[]) OR "domain" = ANY($2::text[]))
      AND NOT ("id" = ANY($3::uuid[]))
    ORDER BY "id"
  `, demoCasinoRetirementManifest.map((casino) => casino.slug), demoCasinoRetirementManifest.map((casino) => casino.domain), demoCasinoRetirementIds);
  for (const collision of collisions) {
    addConflict(conflicts, {
      code: "DEMO_RETIREMENT_IDENTITY_COLLISION",
      table: "Casino",
      detail: `A non-manifest Casino owns an RFC-012 slug or domain (${collision.id}).`,
    });
  }
  return rows;
}

async function inspectAffiliateGraph(database: Database, conflicts: DemoRetirementConflict[]) {
  type AffiliateManifestEntry = (typeof demoAffiliateRetirementManifest)[number];
  const expectedPrograms = new Map<string, AffiliateManifestEntry>(demoAffiliateRetirementManifest.map((entry) => [entry.programId, entry]));
  const expectedOffers = new Map<string, AffiliateManifestEntry>(demoAffiliateRetirementManifest.map((entry) => [entry.offerId, entry]));
  const expectedLinks = new Map<string, AffiliateManifestEntry>(demoAffiliateRetirementManifest.map((entry) => [entry.trackingLinkId, entry]));
  const expectedRedirects = new Map<string, AffiliateManifestEntry>(demoAffiliateRetirementManifest.map((entry) => [entry.redirectId, entry]));
  const expectedOfferRevisions = new Map<string, AffiliateManifestEntry>(demoAffiliateRetirementManifest.map((entry) => [entry.offerRevisionId, entry]));
  const expectedTrackingRevisions = new Map<string, AffiliateManifestEntry>(demoAffiliateRetirementManifest.map((entry) => [entry.trackingRevisionId, entry]));
  const expectedRedirectRevisions = new Map<string, AffiliateManifestEntry>(demoAffiliateRetirementManifest.map((entry) => [entry.redirectRevisionId, entry]));
  const datasetId = "temporary-production-demo-casinos-v2";

  const networks = await database.$queryRawUnsafe<Array<{ id: string; slug: string }>>(`
    SELECT "id"::text, "slug" FROM "AffiliateNetwork"
    WHERE "id" = $1::uuid OR "slug" = $2
  `, demoAffiliateNetworkRetirementManifest.id, demoAffiliateNetworkRetirementManifest.slug);
  for (const network of networks) if (network.id !== demoAffiliateNetworkRetirementManifest.id || network.slug !== demoAffiliateNetworkRetirementManifest.slug) {
    addConflict(conflicts, { code: "DEMO_RETIREMENT_IDENTITY_COLLISION", table: "AffiliateNetwork", detail: "The RFC-012 network ID or slug is owned by a different record." });
  }

  const programs = await database.$queryRawUnsafe<Array<{ id: string; networkId: string; casinoId: string | null; dataset: string | null }>>(`
    SELECT "id"::text, "networkId"::text, "casinoId"::text, "metadata"->>'dataset' AS dataset
    FROM "AffiliateProgram"
    WHERE "id" = ANY($1::uuid[]) OR "networkId" = $2::uuid OR "casinoId" = ANY($3::uuid[])
    ORDER BY "id"
  `, [...expectedPrograms.keys()], demoAffiliateNetworkRetirementManifest.id, demoCasinoRetirementIds);
  for (const row of programs) {
    const expected = expectedPrograms.get(row.id);
    if (!expected || row.networkId !== demoAffiliateNetworkRetirementManifest.id || row.casinoId !== expected.casinoId || row.dataset !== datasetId) {
      addConflict(conflicts, { code: "DEMO_RETIREMENT_REAL_DATA_CONFLICT", table: "AffiliateProgram", casinoId: row.casinoId ?? undefined, detail: "A Programme in the retirement contour is not an exact RFC-012 synthetic Programme." });
    }
  }

  const offers = await database.$queryRawUnsafe<Array<{ id: string; programId: string; casinoId: string; offerType: string; dataset: string | null }>>(`
    SELECT "id"::text, "programId"::text, "casinoId"::text, "offerType", "metadata"->>'dataset' AS dataset
    FROM "AffiliateOffer"
    WHERE "id" = ANY($1::uuid[]) OR "programId" = ANY($2::uuid[]) OR "casinoId" = ANY($3::uuid[])
    ORDER BY "id"
  `, [...expectedOffers.keys()], [...expectedPrograms.keys()], demoCasinoRetirementIds);
  for (const row of offers) {
    const expected = expectedOffers.get(row.id);
    if (!expected || row.programId !== expected.programId || row.casinoId !== expected.casinoId || row.offerType !== "INTERNAL_DEMO" || row.dataset !== datasetId) {
      addConflict(conflicts, { code: "DEMO_RETIREMENT_REAL_DATA_CONFLICT", table: "AffiliateOffer", casinoId: row.casinoId, detail: "An Offer in the retirement contour is not an exact RFC-012 synthetic Offer." });
    }
  }

  const links = await database.$queryRawUnsafe<Array<{ id: string; offerId: string; source: string; dataset: string | null }>>(`
    SELECT "id"::text, "offerId"::text, "source", "metadata"->>'dataset' AS dataset
    FROM "AffiliateTrackingLink"
    WHERE "id" = ANY($1::uuid[]) OR "offerId" = ANY($2::uuid[])
    ORDER BY "id"
  `, [...expectedLinks.keys()], [...expectedOffers.keys()]);
  for (const row of links) {
    const expected = expectedLinks.get(row.id);
    if (!expected || row.offerId !== expected.offerId || row.source !== "MANUAL_DEMO" || row.dataset !== datasetId) {
      addConflict(conflicts, { code: "DEMO_RETIREMENT_REAL_DATA_CONFLICT", table: "AffiliateTrackingLink", detail: "A TrackingLink in the retirement contour is not an exact RFC-012 internal-only link." });
    }
  }

  const redirects = await database.$queryRawUnsafe<Array<{ id: string; slug: string; casinoId: string; affiliateOfferId: string | null }>>(`
    SELECT "id"::text, "slug", "casinoId"::text, "affiliateOfferId"::text
    FROM "AffiliateRedirectSlug"
    WHERE "id" = ANY($1::uuid[]) OR "affiliateOfferId" = ANY($2::uuid[]) OR "casinoId" = ANY($3::uuid[])
    ORDER BY "id"
  `, [...expectedRedirects.keys()], [...expectedOffers.keys()], demoCasinoRetirementIds);
  for (const row of redirects) {
    const expected = expectedRedirects.get(row.id);
    if (!expected || row.slug !== expected.redirectSlug || row.casinoId !== expected.casinoId || row.affiliateOfferId !== expected.offerId) {
      addConflict(conflicts, { code: "DEMO_RETIREMENT_REAL_DATA_CONFLICT", table: "AffiliateRedirectSlug", casinoId: row.casinoId, detail: "A Redirect in the retirement contour is not an exact RFC-012 internal-only redirect." });
    }
  }

  const offerRevisions = await database.$queryRawUnsafe<Array<{ id: string; offerId: string; revisionNumber: number; dataset: string | null }>>(`
    SELECT "id"::text, "offerId"::text, "revisionNumber", "snapshot"->>'dataset' AS dataset
    FROM "AffiliateOfferRevision"
    WHERE "id" = ANY($1::uuid[]) OR "offerId" = ANY($2::uuid[])
    ORDER BY "id"
  `, [...expectedOfferRevisions.keys()], [...expectedOffers.keys()]);
  for (const row of offerRevisions) {
    const expected = expectedOfferRevisions.get(row.id);
    if (!expected || row.offerId !== expected.offerId || row.revisionNumber !== 1 || row.dataset !== datasetId) {
      addConflict(conflicts, { code: "DEMO_RETIREMENT_REAL_DATA_CONFLICT", table: "AffiliateOfferRevision", detail: "An Offer revision is not the exact RFC-012 synthetic revision." });
    }
  }

  const trackingRevisions = await database.$queryRawUnsafe<Array<{ id: string; trackingLinkId: string; revisionNumber: number }>>(`
    SELECT "id"::text, "trackingLinkId"::text, "revisionNumber"
    FROM "AffiliateTrackingLinkRevision"
    WHERE "id" = ANY($1::uuid[]) OR "trackingLinkId" = ANY($2::uuid[])
    ORDER BY "id"
  `, [...expectedTrackingRevisions.keys()], [...expectedLinks.keys()]);
  for (const row of trackingRevisions) {
    const expected = expectedTrackingRevisions.get(row.id);
    if (!expected || row.trackingLinkId !== expected.trackingLinkId || row.revisionNumber !== 1) {
      addConflict(conflicts, { code: "DEMO_RETIREMENT_REAL_DATA_CONFLICT", table: "AffiliateTrackingLinkRevision", detail: "A TrackingLink revision is not the exact RFC-012 synthetic revision." });
    }
  }

  const redirectRevisions = await database.$queryRawUnsafe<Array<{ id: string; redirectSlugId: string; revisionNumber: number; dataset: string | null }>>(`
    SELECT "id"::text, "redirectSlugId"::text, "revisionNumber", "snapshot"->>'dataset' AS dataset
    FROM "AffiliateRedirectRevision"
    WHERE "id" = ANY($1::uuid[]) OR "redirectSlugId" = ANY($2::uuid[])
    ORDER BY "id"
  `, [...expectedRedirectRevisions.keys()], [...expectedRedirects.keys()]);
  for (const row of redirectRevisions) {
    const expected = expectedRedirectRevisions.get(row.id);
    if (!expected || row.redirectSlugId !== expected.redirectId || row.revisionNumber !== 1 || row.dataset !== datasetId) {
      addConflict(conflicts, { code: "DEMO_RETIREMENT_REAL_DATA_CONFLICT", table: "AffiliateRedirectRevision", detail: "A Redirect revision is not the exact RFC-012 synthetic revision." });
    }
  }

  const networkConflicts = await database.$queryRawUnsafe<Array<{ tableName: string; rowCount: bigint | number }>>(`
    SELECT 'CommercialOpportunity'::text AS "tableName", COUNT(*)::bigint AS "rowCount" FROM "CommercialOpportunity" WHERE "affiliateNetworkId" = $1::uuid OR "affiliateProgramId" = ANY($2::uuid[])
    UNION ALL
    SELECT 'PartnerCasinoRelationship'::text, COUNT(*)::bigint FROM "PartnerCasinoRelationship" WHERE "partnerId" = $1::uuid
    UNION ALL
    SELECT 'PartnerCasinoMarketSupport'::text, COUNT(*)::bigint FROM "PartnerCasinoMarketSupport" WHERE "affiliateNetworkId" = $1::uuid
  `, demoAffiliateNetworkRetirementManifest.id, [...expectedPrograms.keys()]);
  for (const row of networkConflicts) if (Number(row.rowCount) > 0) {
    addConflict(conflicts, { code: "DEMO_RETIREMENT_REAL_DATA_CONFLICT", table: row.tableName, detail: "The synthetic Affiliate identity is linked to canonical Partner or CRM state." });
  }
  return {
    networks: networks.filter((row) => row.id === demoAffiliateNetworkRetirementManifest.id).length,
    programs: programs.filter((row) => expectedPrograms.has(row.id)).length,
    offers: offers.filter((row) => expectedOffers.has(row.id)).length,
    trackingLinks: links.filter((row) => expectedLinks.has(row.id)).length,
    redirects: redirects.filter((row) => expectedRedirects.has(row.id)).length,
    offerRevisions: offerRevisions.filter((row) => expectedOfferRevisions.has(row.id)).length,
    trackingLinkRevisions: trackingRevisions.filter((row) => expectedTrackingRevisions.has(row.id)).length,
    redirectRevisions: redirectRevisions.filter((row) => expectedRedirectRevisions.has(row.id)).length,
  };
}

async function inspectAffiliateDependencies(
  database: Database,
  edges: readonly ForeignKeyRow[],
  conflicts: DemoRetirementConflict[],
) {
  const parentIds: Readonly<Record<string, readonly string[]>> = {
    AffiliateNetwork: [demoAffiliateNetworkRetirementManifest.id],
    AffiliateProgram: demoAffiliateRetirementManifest.map((entry) => entry.programId),
    AffiliateOffer: demoAffiliateRetirementManifest.map((entry) => entry.offerId),
    AffiliateTrackingLink: demoAffiliateRetirementManifest.map((entry) => entry.trackingLinkId),
    AffiliateRedirectSlug: demoAffiliateRetirementManifest.map((entry) => entry.redirectId),
  };
  const dependencies: DemoRetirementAffiliateDependency[] = [];
  for (const edge of edges.filter((candidate) => parentIds[candidate.parentTable]).sort((left, right) =>
    left.childTable.localeCompare(right.childTable) || left.constraintName.localeCompare(right.constraintName))) {
    if (edge.childColumns.length !== 1 || edge.parentColumns.length !== 1 || edge.parentColumns[0] !== "id") {
      addConflict(conflicts, {
        code: "DEMO_RETIREMENT_UNEXPECTED_DEPENDENCY",
        table: edge.childTable,
        detail: `Affiliate dependency ${edge.constraintName} is composite or does not reference the canonical id column.`,
      });
      continue;
    }
    const [{ rowCount }] = await database.$queryRawUnsafe<Array<{ rowCount: bigint | number }>>(`
      SELECT COUNT(*)::bigint AS "rowCount"
      FROM ${quoteIdentifier(edge.childTable)}
      WHERE ${quoteIdentifier(edge.childColumns[0]!)} = ANY($1::uuid[])
    `, parentIds[edge.parentTable]);
    const totalRows = Number(rowCount ?? 0);
    const relation = `${edge.childTable}->${edge.parentTable}`;
    const disposition: DemoRetirementAffiliateDependency["disposition"] = EXACT_AFFILIATE_RELATIONS.has(relation)
      ? "EXACT_AFFILIATE_GRAPH_DELETE"
      : edge.deleteAction === "SET_NULL"
        ? "SET_NULL_RETAIN"
        : edge.deleteAction === "CASCADE"
          ? "CASCADE_DELETE"
          : "RESTRICT_REVIEW";
    dependencies.push({
      constraint: edge.constraintName,
      table: edge.childTable,
      column: edge.childColumns[0]!,
      parentTable: edge.parentTable,
      totalRows,
      disposition,
    });
    if (totalRows > 0 && disposition !== "EXACT_AFFILIATE_GRAPH_DELETE" && disposition !== "SET_NULL_RETAIN") {
      addConflict(conflicts, {
        code: "DEMO_RETIREMENT_REAL_DATA_CONFLICT",
        table: edge.childTable,
        detail: `${totalRows} row(s) reference exact RFC-012 Affiliate IDs outside the immutable internal graph.`,
      });
    }
    if (totalRows > 0 && REAL_DATA_CONFLICT_TABLES.has(edge.childTable)) {
      addConflict(conflicts, {
        code: "DEMO_RETIREMENT_REAL_DATA_CONFLICT",
        table: edge.childTable,
        detail: `${totalRows} Partner, commercial, activation or media row(s) reference exact RFC-012 Affiliate IDs.`,
      });
    }
  }
  return dependencies;
}

export async function inspectDemoCasinoRetirementPlan(database: Database): Promise<DemoCasinoRetirementPlan> {
  const conflicts: DemoRetirementConflict[] = [];
  const [edges, casinoRows] = await Promise.all([
    foreignKeys(database),
    inspectCasinoIdentities(database, conflicts),
  ]);
  const existingAffiliateRows = await inspectAffiliateGraph(database, conflicts);
  const affiliateDependencies = await inspectAffiliateDependencies(database, edges, conflicts);
  const paths = pathsToCasino(edges);
  const dependencies: DemoRetirementDependency[] = [];
  const rootRowsByCasino = Object.fromEntries(casinoRows.map((casino) => [casino.id, 1]));
  dependencies.push({
    table: "Casino",
    totalRows: casinoRows.length,
    rowsByCasino: rootRowsByCasino,
    disposition: "EXACT_ROOT_DELETE",
    relationPath: ["exact immutable Casino.id allowlist"],
  });

  for (const [table, path] of [...paths.entries()].filter(([table]) => table !== "Casino").sort(([left], [right]) => left.localeCompare(right))) {
    if (!EXPECTED_REACHABLE_TABLES.has(table)) {
      addConflict(conflicts, { code: "DEMO_RETIREMENT_UNEXPECTED_DEPENDENCY", table, detail: "A live table reaches Casino through an unreviewed foreign-key path." });
    }
    const rowsByCasino = await countDependency(database, table, path);
    const totalRows = Object.values(rowsByCasino).reduce((total, count) => total + count, 0);
    const disposition = dependencyDisposition(table, path);
    dependencies.push({
      table,
      totalRows,
      rowsByCasino,
      disposition,
      relationPath: path.map((edge) => `${edge.childTable}.${edge.childColumns.join("+")} -> ${edge.parentTable}.${edge.parentColumns.join("+")} (${edge.deleteAction})`),
    });
    if (totalRows > 0 && REAL_DATA_CONFLICT_TABLES.has(table)) {
      for (const [casinoId, count] of Object.entries(rowsByCasino)) if (count > 0) {
        addConflict(conflicts, { code: "DEMO_RETIREMENT_REAL_DATA_CONFLICT", table, casinoId, detail: `${count} row(s) indicate commercial, Partner, media or retained-history state outside the original synthetic aggregate.` });
      }
    }
    if (totalRows > 0 && UNEXPECTED_AFFILIATE_DEPENDENCY_TABLES.has(table)) {
      addConflict(conflicts, {
        code: "DEMO_RETIREMENT_REAL_DATA_CONFLICT",
        table,
        detail: `${totalRows} row(s) extend the RFC-012 affiliate graph beyond its immutable source manifest.`,
      });
    }
  }

  dependencies.push(...await polymorphicHistory(database));
  dependencies.sort((left, right) => left.table.localeCompare(right.table));
  const retainedHistory = dependencies
    .filter((dependency) => dependency.totalRows > 0 && (dependency.disposition === "SET_NULL_RETAIN" || dependency.disposition === "IMMUTABLE_HISTORY_RETAIN"))
    .map((dependency) => ({
      table: dependency.table,
      totalRows: dependency.totalRows,
      rationale: dependency.disposition === "SET_NULL_RETAIN"
        ? "Schema intentionally preserves the historical row and clears its Casino foreign key when the root is retired."
        : "No Casino foreign key exists; the truthful immutable history record remains unchanged.",
    }));
  retainedHistory.push(...affiliateDependencies
    .filter((dependency) => dependency.totalRows > 0 && dependency.disposition === "SET_NULL_RETAIN")
    .map((dependency) => ({
      table: `${dependency.table}.${dependency.column}`,
      totalRows: dependency.totalRows,
      rationale: `Schema intentionally retains the historical row and clears its ${dependency.parentTable} reference.`,
    })));
  const rowById = new Map(casinoRows.map((row) => [row.id, row]));
  const withoutHash: Omit<DemoCasinoRetirementPlan, "planSha256"> = {
    operation: DEMO_CASINO_RETIREMENT_VERSION,
    evidenceSource: DEMO_CASINO_RETIREMENT_SOURCE,
    demoCasinoCount: demoCasinoRetirementManifest.length,
    existingDemoCasinoCount: casinoRows.length,
    existingAffiliateRows,
    casinos: demoCasinoRetirementManifest.map((casino) => {
      const row = rowById.get(casino.id);
      return {
        id: casino.id,
        slug: casino.slug,
        name: casino.name,
        exists: Boolean(row),
        publicationState: row?.status ?? null,
        publishedVersion: row?.publishedVersion ?? null,
      };
    }),
    dependencies,
    affiliateDependencies,
    conflicts: conflicts.sort((left, right) => left.table.localeCompare(right.table) || (left.casinoId ?? "").localeCompare(right.casinoId ?? "") || left.detail.localeCompare(right.detail)),
    safeDeleteSet: {
      casinoIds: [...demoCasinoRetirementIds],
      affiliateNetworkIds: [demoAffiliateNetworkRetirementManifest.id],
      affiliateProgramIds: demoAffiliateRetirementManifest.map((entry) => entry.programId),
      affiliateOfferIds: demoAffiliateRetirementManifest.map((entry) => entry.offerId),
      affiliateTrackingLinkIds: demoAffiliateRetirementManifest.map((entry) => entry.trackingLinkId),
      affiliateRedirectIds: demoAffiliateRetirementManifest.map((entry) => entry.redirectId),
      affiliateOfferRevisionIds: demoAffiliateRetirementManifest.map((entry) => entry.offerRevisionId),
      affiliateTrackingLinkRevisionIds: demoAffiliateRetirementManifest.map((entry) => entry.trackingRevisionId),
      affiliateRedirectRevisionIds: demoAffiliateRetirementManifest.map((entry) => entry.redirectRevisionId),
    },
    retainedHistory,
    expectedAfterState: { liveDemoCasinos: 0 as const, demoSpecificRuntimeAuthority: 0 as const },
    readyToApply: conflicts.length === 0,
  };
  return { ...withoutHash, planSha256: hashPlan(withoutHash) };
}

export function assertDemoRetirementApplyAuthority(input: {
  confirmation: string | null;
  planSha256: string | null;
  environmentConfirmation: string | undefined;
}) {
  if (input.confirmation !== DEMO_CASINO_RETIREMENT_CONFIRMATION) {
    throw new Error(`DEMO_RETIREMENT_APPLY_CONFIRMATION_REQUIRED:--confirm=${DEMO_CASINO_RETIREMENT_CONFIRMATION}`);
  }
  if (!input.planSha256 || !/^[a-f0-9]{64}$/.test(input.planSha256)) {
    throw new Error("DEMO_RETIREMENT_PLAN_SHA256_REQUIRED");
  }
  if (input.environmentConfirmation !== DEMO_CASINO_RETIREMENT_CONFIRMATION) {
    throw new Error(`DEMO_RETIREMENT_ENV_CONFIRMATION_REQUIRED:${DEMO_CASINO_RETIREMENT_CONFIRMATION}`);
  }
}

export async function applyDemoCasinoRetirement(database: Database, reviewedPlanSha256: string) {
  const plan = await inspectDemoCasinoRetirementPlan(database);
  if (!plan.readyToApply) throw new Error("DEMO_RETIREMENT_REAL_DATA_CONFLICT");
  if (
    plan.existingDemoCasinoCount === 0
    && Object.values(plan.existingAffiliateRows).every((count) => count === 0)
  ) {
    return {
      reviewedPlanSha256,
      alreadyRetired: true,
      deleted: {
        affiliateRedirects: 0,
        affiliateOffers: 0,
        affiliatePrograms: 0,
        affiliateNetworks: 0,
        casinos: 0,
      },
      verification: plan,
    };
  }
  if (plan.planSha256 !== reviewedPlanSha256) throw new Error("DEMO_RETIREMENT_MANIFEST_DRIFT");

  const redirectIds = demoAffiliateRetirementManifest.map((entry) => entry.redirectId);
  const offerIds = demoAffiliateRetirementManifest.map((entry) => entry.offerId);
  const programIds = demoAffiliateRetirementManifest.map((entry) => entry.programId);
  const deleted = {
    affiliateRedirects: await database.$executeRawUnsafe(`DELETE FROM "AffiliateRedirectSlug" WHERE "id" = ANY($1::uuid[])`, redirectIds),
    affiliateOffers: await database.$executeRawUnsafe(`DELETE FROM "AffiliateOffer" WHERE "id" = ANY($1::uuid[])`, offerIds),
    affiliatePrograms: await database.$executeRawUnsafe(`DELETE FROM "AffiliateProgram" WHERE "id" = ANY($1::uuid[])`, programIds),
    affiliateNetworks: await database.$executeRawUnsafe(`DELETE FROM "AffiliateNetwork" WHERE "id" = $1::uuid`, demoAffiliateNetworkRetirementManifest.id),
    casinos: await database.$executeRawUnsafe(`DELETE FROM "Casino" WHERE "id" = ANY($1::uuid[])`, demoCasinoRetirementIds),
  };
  const verification = await inspectDemoCasinoRetirementPlan(database);
  if (
    verification.existingDemoCasinoCount !== 0
    || Object.values(verification.existingAffiliateRows).some((count) => count !== 0)
  ) throw new Error("DEMO_RETIREMENT_POST_APPLY_VERIFICATION_FAILED");
  return { reviewedPlanSha256, alreadyRetired: false, deleted, verification };
}
