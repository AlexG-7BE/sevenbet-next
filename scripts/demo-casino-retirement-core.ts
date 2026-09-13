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

type PrimaryKeyRow = {
  tableName: string;
  columns: string[];
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

type DemoRetirementDisposition =
  | "EXACT_ROOT_DELETE"
  | "EXACT_AFFILIATE_GRAPH_DELETE"
  | "CASCADE_DELETE"
  | "SET_NULL_RETAIN"
  | "RESTRICT_REVIEW"
  | "IMMUTABLE_HISTORY_RETAIN";

export type DemoRetirementDependency = Readonly<{
  table: string;
  totalRows: number;
  rowsByCasino: Readonly<Record<string, number>>;
  disposition: DemoRetirementDisposition;
  dispositionCounts: Readonly<Partial<Record<DemoRetirementDisposition, number>>>;
  relationPaths: readonly (readonly string[])[];
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
  "AffiliateNetwork",
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

function quoteLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
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

async function primaryKeys(database: Database) {
  return database.$queryRawUnsafe<PrimaryKeyRow[]>(`
    SELECT
      relation.relname AS "tableName",
      array_agg(attribute.attname ORDER BY key_column.ordinality)::text[] AS "columns"
    FROM pg_constraint constraint_row
    JOIN pg_class relation ON relation.oid = constraint_row.conrelid
    JOIN pg_namespace relation_namespace ON relation_namespace.oid = relation.relnamespace
    JOIN LATERAL unnest(constraint_row.conkey)
      WITH ORDINALITY AS key_column(attnum, ordinality) ON TRUE
    JOIN pg_attribute attribute
      ON attribute.attrelid = relation.oid AND attribute.attnum = key_column.attnum
    WHERE constraint_row.contype = 'p'
      AND relation_namespace.nspname = 'public'
    GROUP BY relation.relname
    ORDER BY relation.relname
  `);
}

function jsonObjectExpression(alias: string, columns: readonly string[]) {
  if (columns.length === 0) return `'{}'::jsonb`;
  return `jsonb_build_object(${columns.flatMap((column) => [quoteLiteral(column), `to_jsonb((${alias}.${quoteIdentifier(column)})::text)`]).join(", ")})`;
}

function edgeDescription(edge: ForeignKeyRow) {
  return `${edge.childTable}.${edge.childColumns.join("+")} -> ${edge.parentTable}.${edge.parentColumns.join("+")} [${edge.constraintName}] (${edge.deleteAction})`;
}

type ClosurePath = {
  segments: string[];
  actions: ForeignKeyRow["deleteAction"][];
  visitedRows: string[];
};

type AffectedRow = {
  locator: string;
  columnValues: Record<string, unknown>;
  casinoIds: Set<string>;
  exactDisposition?: "EXACT_ROOT_DELETE" | "EXACT_AFFILIATE_GRAPH_DELETE";
  paths: Map<string, ClosurePath>;
};

type AffectedClosure = {
  rowsByTable: Map<string, Map<string, AffectedRow>>;
};

type RootSpec = {
  table: string;
  id: string;
  casinoIds: readonly string[];
  disposition: "EXACT_ROOT_DELETE" | "EXACT_AFFILIATE_GRAPH_DELETE";
};

function retirementRootSpecs(): RootSpec[] {
  return [
    ...demoCasinoRetirementManifest.map((casino) => ({
      table: "Casino",
      id: casino.id,
      casinoIds: [casino.id],
      disposition: "EXACT_ROOT_DELETE" as const,
    })),
    {
      table: "AffiliateNetwork",
      id: demoAffiliateNetworkRetirementManifest.id,
      casinoIds: [],
      disposition: "EXACT_AFFILIATE_GRAPH_DELETE" as const,
    },
    ...demoAffiliateRetirementManifest.flatMap((entry) => ([
      ["AffiliateProgram", entry.programId],
      ["AffiliateOffer", entry.offerId],
      ["AffiliateTrackingLink", entry.trackingLinkId],
      ["AffiliateRedirectSlug", entry.redirectId],
      ["AffiliateOfferRevision", entry.offerRevisionId],
      ["AffiliateTrackingLinkRevision", entry.trackingRevisionId],
      ["AffiliateRedirectRevision", entry.redirectRevisionId],
    ] as const).map(([table, id]) => ({
      table,
      id,
      casinoIds: [entry.casinoId],
      disposition: "EXACT_AFFILIATE_GRAPH_DELETE" as const,
    }))),
  ].sort((left, right) => left.table.localeCompare(right.table) || left.id.localeCompare(right.id));
}

function rowLocator(table: string, primaryKey: readonly string[], values: Record<string, unknown>) {
  return `${table}:${stableJson(primaryKey.map((column) => values[column]))}`;
}

function pathSignature(path: ClosurePath) {
  return stableJson(path);
}

function addPath(row: AffectedRow, path: ClosurePath) {
  const signature = pathSignature(path);
  if (row.paths.has(signature)) return false;
  row.paths.set(signature, path);
  return true;
}

function pathDeletesRow(path: ClosurePath) {
  return path.actions.length > 0 && path.actions.every((action) => action === "CASCADE");
}

function deletingPaths(row: AffectedRow) {
  if (row.exactDisposition) return [...row.paths.values()];
  return [...row.paths.values()].filter(pathDeletesRow);
}

function rowDisposition(row: AffectedRow): DemoRetirementDisposition {
  if (row.exactDisposition) return row.exactDisposition;
  const paths = [...row.paths.values()];
  if (paths.some((path) => path.actions.some((action) => action === "RESTRICT" || action === "NO_ACTION" || action === "SET_DEFAULT"))) {
    return "RESTRICT_REVIEW";
  }
  if (paths.some(pathDeletesRow)) return "CASCADE_DELETE";
  return "SET_NULL_RETAIN";
}

function aggregateDisposition(counts: Partial<Record<DemoRetirementDisposition, number>>): DemoRetirementDisposition {
  const priority: DemoRetirementDisposition[] = [
    "RESTRICT_REVIEW",
    "EXACT_ROOT_DELETE",
    "EXACT_AFFILIATE_GRAPH_DELETE",
    "CASCADE_DELETE",
    "SET_NULL_RETAIN",
    "IMMUTABLE_HISTORY_RETAIN",
  ];
  return priority.find((disposition) => (counts[disposition] ?? 0) > 0) ?? "SET_NULL_RETAIN";
}

async function buildAffectedClosure(
  database: Database,
  edges: readonly ForeignKeyRow[],
  keyRows: readonly PrimaryKeyRow[],
  conflicts: DemoRetirementConflict[],
): Promise<AffectedClosure> {
  const primaryKeysByTable = new Map(keyRows.map((row) => [row.tableName, row.columns]));
  const referenceColumnsByTable = new Map<string, Set<string>>();
  for (const [table, columns] of primaryKeysByTable) referenceColumnsByTable.set(table, new Set(columns));
  for (const edge of edges) {
    const columns = referenceColumnsByTable.get(edge.parentTable) ?? new Set<string>();
    edge.parentColumns.forEach((column) => columns.add(column));
    referenceColumnsByTable.set(edge.parentTable, columns);
  }

  const rowsByTable = new Map<string, Map<string, AffectedRow>>();
  const rootsByTable = new Map<string, RootSpec[]>();
  for (const root of retirementRootSpecs()) {
    const roots = rootsByTable.get(root.table) ?? [];
    roots.push(root);
    rootsByTable.set(root.table, roots);
  }

  const queue: string[] = [];
  const queued = new Set<string>();
  const enqueue = (table: string) => {
    if (queued.has(table)) return;
    queued.add(table);
    queue.push(table);
  };

  for (const [table, roots] of [...rootsByTable].sort(([left], [right]) => left.localeCompare(right))) {
    const primaryKey = primaryKeysByTable.get(table);
    if (!primaryKey?.length) {
      addConflict(conflicts, {
        code: "DEMO_RETIREMENT_UNEXPECTED_DEPENDENCY",
        table,
        detail: "An exact retirement root has no primary key, so affected rows cannot be identified safely.",
      });
      continue;
    }
    const columns = [...(referenceColumnsByTable.get(table) ?? new Set(primaryKey))].sort();
    const sourceRows = await database.$queryRawUnsafe<Array<{ columnValues: Record<string, unknown> }>>(`
      SELECT ${jsonObjectExpression("root_row", columns)} AS "columnValues"
      FROM ${quoteIdentifier(table)} root_row
      WHERE root_row."id"::text = ANY($1::text[])
      ORDER BY root_row."id"::text
    `, roots.map((root) => root.id));
    const rootsById = new Map(roots.map((root) => [root.id, root]));
    const tableRows = rowsByTable.get(table) ?? new Map<string, AffectedRow>();
    for (const sourceRow of sourceRows) {
      const id = String(sourceRow.columnValues.id);
      const root = rootsById.get(id);
      if (!root) continue;
      const locator = rowLocator(table, primaryKey, sourceRow.columnValues);
      const row: AffectedRow = tableRows.get(locator) ?? {
        locator,
        columnValues: sourceRow.columnValues,
        casinoIds: new Set(),
        exactDisposition: root.disposition,
        paths: new Map(),
      };
      root.casinoIds.forEach((casinoId) => row.casinoIds.add(casinoId));
      row.exactDisposition = root.disposition;
      addPath(row, {
        segments: [`exact immutable ${table}.id allowlist`],
        actions: [],
        visitedRows: [locator],
      });
      tableRows.set(locator, row);
    }
    rowsByTable.set(table, tableRows);
    if (tableRows.size > 0) enqueue(table);
  }

  const outgoingEdges = new Map<string, ForeignKeyRow[]>();
  for (const edge of edges) {
    const outgoing = outgoingEdges.get(edge.parentTable) ?? [];
    outgoing.push(edge);
    outgoingEdges.set(edge.parentTable, outgoing);
  }

  while (queue.length > 0) {
    const parentTable = queue.shift()!;
    queued.delete(parentTable);
    const parentRows = [...(rowsByTable.get(parentTable)?.values() ?? [])]
      .filter((row) => deletingPaths(row).length > 0)
      .sort((left, right) => left.locator.localeCompare(right.locator));
    if (parentRows.length === 0) continue;

    for (const edge of outgoingEdges.get(parentTable) ?? []) {
      const parentPayload = parentRows.map((row) => ({
        locator: row.locator,
        values: Object.fromEntries(edge.parentColumns.map((column) => [column, row.columnValues[column]])),
      }));
      const joinPredicate = edge.childColumns.map((column, index) =>
        `child_row.${quoteIdentifier(column)} IS NOT NULL AND to_jsonb((child_row.${quoteIdentifier(column)})::text) = affected_parent."values"->${quoteLiteral(edge.parentColumns[index]!)}`,
      ).join(" AND ");
      const primaryKey = primaryKeysByTable.get(edge.childTable);
      if (!primaryKey?.length) {
        const [{ rowCount }] = await database.$queryRawUnsafe<Array<{ rowCount: bigint | number }>>(`
          WITH affected_parent AS (
            SELECT item->>'locator' AS "locator", item->'values' AS "values"
            FROM jsonb_array_elements($1::jsonb) item
          )
          SELECT COUNT(*)::bigint AS "rowCount"
          FROM ${quoteIdentifier(edge.childTable)} child_row
          JOIN affected_parent ON ${joinPredicate}
        `, JSON.stringify(parentPayload));
        const totalRows = Number(rowCount ?? 0);
        if (totalRows > 0) addConflict(conflicts, {
          code: "DEMO_RETIREMENT_UNEXPECTED_DEPENDENCY",
          table: edge.childTable,
          detail: `${totalRows} affected row(s) were found through ${edge.constraintName}, but the table has no primary key; closure and deduplication are blocked rather than approximated.`,
        });
        continue;
      }

      const columns = [...(referenceColumnsByTable.get(edge.childTable) ?? new Set(primaryKey))].sort();
      const matches = await database.$queryRawUnsafe<Array<{ parentLocator: string; columnValues: Record<string, unknown> }>>(`
        WITH affected_parent AS (
          SELECT item->>'locator' AS "locator", item->'values' AS "values"
          FROM jsonb_array_elements($1::jsonb) item
        )
        SELECT affected_parent."locator" AS "parentLocator",
          ${jsonObjectExpression("child_row", columns)} AS "columnValues"
        FROM ${quoteIdentifier(edge.childTable)} child_row
        JOIN affected_parent ON ${joinPredicate}
        ORDER BY affected_parent."locator", ${primaryKey.map((column) => `child_row.${quoteIdentifier(column)}`).join(", ")}
      `, JSON.stringify(parentPayload));
      if (matches.length === 0) continue;

      const parentByLocator = new Map(parentRows.map((row) => [row.locator, row]));
      const childRows = rowsByTable.get(edge.childTable) ?? new Map<string, AffectedRow>();
      let changed = false;
      for (const match of matches) {
        const parent = parentByLocator.get(match.parentLocator);
        if (!parent) continue;
        const locator = rowLocator(edge.childTable, primaryKey, match.columnValues);
        let child = childRows.get(locator);
        if (!child) {
          child = {
            locator,
            columnValues: match.columnValues,
            casinoIds: new Set(),
            paths: new Map(),
          };
          childRows.set(locator, child);
          changed = true;
        }
        for (const casinoId of parent.casinoIds) {
          if (!child.casinoIds.has(casinoId)) {
            child.casinoIds.add(casinoId);
            changed = true;
          }
        }
        for (const parentPath of deletingPaths(parent)) {
          if (parentPath.visitedRows.includes(locator)) continue;
          changed = addPath(child, {
            segments: [edgeDescription(edge), ...parentPath.segments],
            actions: [edge.deleteAction, ...parentPath.actions],
            visitedRows: [locator, ...parentPath.visitedRows],
          }) || changed;
        }
      }
      rowsByTable.set(edge.childTable, childRows);
      if (changed) enqueue(edge.childTable);
    }
  }

  return { rowsByTable };
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
      dispositionCounts: { IMMUTABLE_HISTORY_RETAIN: Object.values(rowsByCasino).reduce((total, count) => total + count, 0) },
      relationPaths: [["polymorphic entityId snapshot; no Casino foreign key"]],
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

function inspectAffiliateDependencies(
  edges: readonly ForeignKeyRow[],
  closure: AffectedClosure,
) {
  const affiliateRootTables = new Set([
    "AffiliateNetwork",
    "AffiliateProgram",
    "AffiliateOffer",
    "AffiliateTrackingLink",
    "AffiliateRedirectSlug",
  ]);
  const dependencies: DemoRetirementAffiliateDependency[] = [];
  for (const edge of edges.filter((candidate) => affiliateRootTables.has(candidate.parentTable)).sort((left, right) =>
    left.childTable.localeCompare(right.childTable) || left.constraintName.localeCompare(right.constraintName))) {
    const relationPath = edgeDescription(edge);
    const totalRows = [...(closure.rowsByTable.get(edge.childTable)?.values() ?? [])]
      .filter((row) => [...row.paths.values()].some((path) => path.segments[0] === relationPath))
      .length;
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
      column: edge.childColumns.join("+"),
      parentTable: edge.parentTable,
      totalRows,
      disposition,
    });
  }
  return dependencies;
}

export async function inspectDemoCasinoRetirementPlan(database: Database): Promise<DemoCasinoRetirementPlan> {
  const conflicts: DemoRetirementConflict[] = [];
  const [edges, keyRows, casinoRows] = await Promise.all([
    foreignKeys(database),
    primaryKeys(database),
    inspectCasinoIdentities(database, conflicts),
  ]);
  const existingAffiliateRows = await inspectAffiliateGraph(database, conflicts);
  const closure = await buildAffectedClosure(database, edges, keyRows, conflicts);
  const affiliateDependencies = inspectAffiliateDependencies(edges, closure);
  const dependencies: DemoRetirementDependency[] = [];

  for (const [table, tableRows] of [...closure.rowsByTable].sort(([left], [right]) => left.localeCompare(right))) {
    if (tableRows.size === 0) continue;
    const rows = [...tableRows.values()].sort((left, right) => left.locator.localeCompare(right.locator));
    const rowsByCasino = Object.fromEntries(demoCasinoRetirementIds.flatMap((casinoId) => {
      const count = rows.filter((row) => row.casinoIds.has(casinoId)).length;
      return count > 0 ? [[casinoId, count] as const] : [];
    }));
    const dispositionCounts: Partial<Record<DemoRetirementDisposition, number>> = {};
    for (const row of rows) {
      const disposition = rowDisposition(row);
      dispositionCounts[disposition] = (dispositionCounts[disposition] ?? 0) + 1;
    }
    const relationPaths = [...new Map(rows.flatMap((row) => [...row.paths.values()])
      .map((path) => [stableJson(path.segments), path.segments] as const)).values()]
      .sort((left, right) => stableJson(left).localeCompare(stableJson(right)));
    const disposition = aggregateDisposition(dispositionCounts);
    dependencies.push({
      table,
      totalRows: rows.length,
      rowsByCasino,
      disposition,
      dispositionCounts,
      relationPaths,
    });

    if (!EXPECTED_REACHABLE_TABLES.has(table) && !EXACT_AFFILIATE_GRAPH_TABLES.has(table) && table !== "Casino") {
      addConflict(conflicts, {
        code: "DEMO_RETIREMENT_UNEXPECTED_DEPENDENCY",
        table,
        detail: `${rows.length} affected row(s) were found through an unreviewed foreign-key relation path.`,
      });
    }
    const restrictedRows = dispositionCounts.RESTRICT_REVIEW ?? 0;
    if (restrictedRows > 0) addConflict(conflicts, {
      code: "DEMO_RETIREMENT_UNEXPECTED_DEPENDENCY",
      table,
      detail: `${restrictedRows} affected row(s) require RESTRICT, NO ACTION or SET DEFAULT review before deletion.`,
    });
    if (REAL_DATA_CONFLICT_TABLES.has(table)) {
      const attributed = Object.entries(rowsByCasino);
      if (attributed.length === 0) addConflict(conflicts, {
        code: "DEMO_RETIREMENT_REAL_DATA_CONFLICT",
        table,
        detail: `${rows.length} protected Partner, commercial, activation or media row(s) are in the affected-row closure.`,
      });
      for (const [casinoId, count] of attributed) addConflict(conflicts, {
        code: "DEMO_RETIREMENT_REAL_DATA_CONFLICT",
        table,
        casinoId,
        detail: `${count} protected Partner, commercial, activation or media row(s) are in the affected-row closure.`,
      });
    }
    if (UNEXPECTED_AFFILIATE_DEPENDENCY_TABLES.has(table)) addConflict(conflicts, {
      code: "DEMO_RETIREMENT_REAL_DATA_CONFLICT",
      table,
      detail: `${rows.length} row(s) extend the RFC-012 affiliate graph beyond its immutable source manifest.`,
    });
  }

  dependencies.push(...await polymorphicHistory(database));
  dependencies.sort((left, right) => left.table.localeCompare(right.table));
  const retainedHistory = dependencies.flatMap((dependency) => {
    const setNullRows = dependency.dispositionCounts.SET_NULL_RETAIN ?? 0;
    const immutableRows = dependency.dispositionCounts.IMMUTABLE_HISTORY_RETAIN ?? 0;
    return [
      ...(setNullRows > 0 ? [{
        table: dependency.table,
        totalRows: setNullRows,
        rationale: "Schema intentionally preserves the historical row and clears its affected foreign-key reference when the root is retired.",
      }] : []),
      ...(immutableRows > 0 ? [{
        table: dependency.table,
        totalRows: immutableRows,
        rationale: "No Casino foreign key exists; the truthful immutable history record remains unchanged.",
      }] : []),
    ];
  });
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

export async function applyDemoCasinoRetirement(
  database: Database,
  reviewedPlanSha256: string,
  options: Readonly<{
    postDeleteVerification?: (verification: DemoCasinoRetirementPlan) => Promise<void> | void;
  }> = {},
) {
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
  await options.postDeleteVerification?.(verification);
  return { reviewedPlanSha256, alreadyRetired: false, deleted, verification };
}
