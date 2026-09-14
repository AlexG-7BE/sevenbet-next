import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname } from "node:path";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import {
  PR6_BASE_SHA,
  PR6_BRANCH,
  PR6_EXPECTED_FOREIGN_KEYS,
  PR6_MIGRATION_PATH,
  PR6_PUBLIC_RUNTIME_FILES,
  PR6_TARGET_FUNCTIONS,
  PR6_TARGET_TABLES,
  PR6_TARGET_TRIGGERS,
  assessPr6Projection,
  canonicalJson,
  inspectPr6MigrationSql,
  sha256,
  type Pr6ForeignKey,
  type Pr6FunctionDependant,
  type Pr6FunctionInventory,
  type Pr6KeepSetEvidence,
  type Pr6RelationDependant,
  type Pr6TriggerInventory,
} from "./commercial-core-pr6-legacy-cleanup-core";

const EXPECTED_DATABASE_FINGERPRINT =
  "ce94f1e2b465c25d62b13a8c3f2db47aa07b96b541603c818ef6219c9c970a5e";
const runtimeRoots = ["app", "components", "lib"];
const runtimeExtensions = new Set([".ts", ".tsx", ".js", ".mjs"]);
const retiredRuntimeReference = new RegExp(
  `\\b(?:${PR6_TARGET_TABLES.flatMap(({ model, table }) => [model, table]).join("|")})\\b`,
);

function git(args: string[]) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function changedFiles(paths: readonly string[]) {
  const output = git(["diff", "--name-only", "origin/main", "--", ...paths]);
  return output ? output.split("\n") : [];
}

function activeRuntimeConsumerFiles() {
  const listed = git(["ls-files", "--", ...runtimeRoots, "middleware.ts", "next.config.mjs"]);
  return listed
    .split("\n")
    .filter(Boolean)
    .filter((path) => runtimeExtensions.has(extname(path)))
    .filter((path) => retiredRuntimeReference.test(readFileSync(path, "utf8")));
}

function databaseFingerprint() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return "UNAVAILABLE";
  const target = new URL(raw);
  return sha256([
    target.protocol,
    target.hostname,
    target.port || "5432",
    target.username,
    target.pathname,
    target.searchParams.get("schema") ?? "public",
  ].join("\n"));
}

function action(code: string) {
  return ({
    a: "NO ACTION",
    r: "RESTRICT",
    c: "CASCADE",
    n: "SET NULL",
    d: "SET DEFAULT",
  } as const)[code as "a" | "r" | "c" | "n" | "d"] ?? `UNKNOWN:${code}`;
}

async function targetTableInventory(transaction: Prisma.TransactionClient) {
  const tables = await transaction.$queryRawUnsafe<Array<{ table: string; exists: boolean }>>(`
    WITH target("table", ordinal) AS (
      VALUES
        ('oauthClient', 1),
        ('oauthResource', 2),
        ('oauthClientResource', 3),
        ('oauthRefreshToken', 4),
        ('oauthAccessToken', 5),
        ('oauthConsent', 6),
        ('oauthClientAssertion', 7),
        ('CommercialMcpRateLimitBucket', 8)
    )
    SELECT target."table", relation.oid IS NOT NULL AS "exists"
    FROM target
    LEFT JOIN pg_namespace AS namespace ON namespace.nspname = current_schema()
    LEFT JOIN pg_class AS relation
      ON relation.relnamespace = namespace.oid
     AND relation.relname = target."table"
     AND relation.relkind IN ('r', 'p')
    ORDER BY target.ordinal
  `);
  const indexes = await transaction.$queryRawUnsafe<Array<{ table: string; index: string }>>(`
    SELECT tablename AS "table", indexname AS "index"
    FROM pg_indexes
    WHERE schemaname = current_schema()
      AND tablename IN (
        'oauthClient', 'oauthResource', 'oauthClientResource', 'oauthRefreshToken',
        'oauthAccessToken', 'oauthConsent', 'oauthClientAssertion',
        'CommercialMcpRateLimitBucket'
      )
    ORDER BY tablename, indexname
  `);
  return tables.map((table) => ({
    ...table,
    indexes: indexes.filter((index) => index.table === table.table).map((index) => index.index),
  }));
}

async function targetCounts(transaction: Prisma.TransactionClient, allTablesExist: boolean) {
  if (!allTablesExist) {
    return Object.fromEntries(PR6_TARGET_TABLES.map(({ table }) => [table, null]));
  }
  const rows = await transaction.$queryRawUnsafe<Array<{ table: string; count: number }>>(`
    SELECT 'oauthClient' AS "table", count(*)::int AS "count" FROM "oauthClient"
    UNION ALL SELECT 'oauthResource', count(*)::int FROM "oauthResource"
    UNION ALL SELECT 'oauthClientResource', count(*)::int FROM "oauthClientResource"
    UNION ALL SELECT 'oauthRefreshToken', count(*)::int FROM "oauthRefreshToken"
    UNION ALL SELECT 'oauthAccessToken', count(*)::int FROM "oauthAccessToken"
    UNION ALL SELECT 'oauthConsent', count(*)::int FROM "oauthConsent"
    UNION ALL SELECT 'oauthClientAssertion', count(*)::int FROM "oauthClientAssertion"
    UNION ALL SELECT 'CommercialMcpRateLimitBucket', count(*)::int FROM "CommercialMcpRateLimitBucket"
  `);
  return Object.fromEntries(rows.map((row) => [row.table, row.count]));
}

async function rateBucketLifecycleSummary(
  transaction: Prisma.TransactionClient,
  rateBucketTableExists: boolean,
) {
  if (!rateBucketTableExists) return null;
  const [summary] = await transaction.$queryRawUnsafe<Array<{
    connectorRequestBuckets: number;
    partnerTrackingMetricBuckets: number;
    unexpectedScopeBuckets: number;
    expiredAtCapture: number;
    postPr5MergeWindowBuckets: number;
    latestWindowStartedAt: Date | null;
    latestExpiresAt: Date | null;
  }>>(`
    SELECT
      count(*) FILTER (WHERE "scope" IN (
        'dcr', 'token', 'revoke', 'resource-auth', 'read', 'write',
        'media-resource-auth', 'media-read', 'media-write'
      ))::int AS "connectorRequestBuckets",
      count(*) FILTER (WHERE "scope" LIKE 'partner-tracking-registration:%')::int
        AS "partnerTrackingMetricBuckets",
      count(*) FILTER (WHERE "scope" NOT IN (
        'dcr', 'token', 'revoke', 'resource-auth', 'read', 'write',
        'media-resource-auth', 'media-read', 'media-write'
      ) AND "scope" NOT LIKE 'partner-tracking-registration:%')::int AS "unexpectedScopeBuckets",
      count(*) FILTER (WHERE "expiresAt" <= CURRENT_TIMESTAMP)::int AS "expiredAtCapture",
      count(*) FILTER (
        WHERE "windowStartedAt" > TIMESTAMPTZ '2026-09-14 02:23:31+00'
      )::int AS "postPr5MergeWindowBuckets",
      max("windowStartedAt") AS "latestWindowStartedAt",
      max("expiresAt") AS "latestExpiresAt"
    FROM "CommercialMcpRateLimitBucket"
  `);
  if (!summary) return null;
  return {
    ...summary,
    latestWindowStartedAt: summary.latestWindowStartedAt?.toISOString() ?? null,
    latestExpiresAt: summary.latestExpiresAt?.toISOString() ?? null,
  };
}

async function foreignKeys(transaction: Prisma.TransactionClient): Promise<Pr6ForeignKey[]> {
  const rows = await transaction.$queryRawUnsafe<Array<{
    name: string;
    sourceTable: string;
    targetTable: string;
    deleteCode: string;
    updateCode: string;
  }>>(`
    SELECT
      fk_constraint.conname AS "name",
      source.relname AS "sourceTable",
      target.relname AS "targetTable",
      fk_constraint.confdeltype::text AS "deleteCode",
      fk_constraint.confupdtype::text AS "updateCode"
    FROM pg_constraint AS fk_constraint
    INNER JOIN pg_class AS source ON source.oid = fk_constraint.conrelid
    INNER JOIN pg_namespace AS source_namespace ON source_namespace.oid = source.relnamespace
    INNER JOIN pg_class AS target ON target.oid = fk_constraint.confrelid
    INNER JOIN pg_namespace AS target_namespace ON target_namespace.oid = target.relnamespace
    WHERE fk_constraint.contype = 'f'
      AND source_namespace.nspname = current_schema()
      AND target_namespace.nspname = current_schema()
      AND (
        source.relname IN (
          'oauthClient', 'oauthResource', 'oauthClientResource', 'oauthRefreshToken',
          'oauthAccessToken', 'oauthConsent', 'oauthClientAssertion',
          'CommercialMcpRateLimitBucket'
        )
        OR target.relname IN (
          'oauthClient', 'oauthResource', 'oauthClientResource', 'oauthRefreshToken',
          'oauthAccessToken', 'oauthConsent', 'oauthClientAssertion',
          'CommercialMcpRateLimitBucket'
        )
      )
    ORDER BY fk_constraint.conname
  `);
  return rows.map((row) => ({
    name: row.name,
    sourceTable: row.sourceTable,
    targetTable: row.targetTable,
    onDelete: action(row.deleteCode),
    onUpdate: action(row.updateCode),
  }));
}

async function targetTriggers(transaction: Prisma.TransactionClient): Promise<Pr6TriggerInventory[]> {
  const rows = await transaction.$queryRawUnsafe<Array<{
    name: string;
    parentTable: string;
    functionName: string;
    enabledCode: string;
  }>>(`
    SELECT
      trigger.tgname AS "name",
      relation.relname AS "parentTable",
      procedure.proname AS "functionName",
      trigger.tgenabled::text AS "enabledCode"
    FROM pg_trigger AS trigger
    INNER JOIN pg_class AS relation ON relation.oid = trigger.tgrelid
    INNER JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    INNER JOIN pg_proc AS procedure ON procedure.oid = trigger.tgfoid
    WHERE namespace.nspname = current_schema()
      AND trigger.tgisinternal = false
      AND relation.relname IN (
        'oauthClient', 'oauthResource', 'oauthClientResource', 'oauthRefreshToken',
        'oauthAccessToken', 'oauthConsent', 'oauthClientAssertion',
        'CommercialMcpRateLimitBucket'
      )
    ORDER BY trigger.tgname
  `);
  return rows.map((row) => ({
    name: row.name,
    parentTable: row.parentTable,
    functionName: row.functionName,
    enabled: row.enabledCode === "D" ? "DISABLED" : row.enabledCode === "O" ? "ENABLED" : row.enabledCode,
  }));
}

async function targetFunctions(transaction: Prisma.TransactionClient): Promise<Pr6FunctionInventory[]> {
  return transaction.$queryRawUnsafe<Pr6FunctionInventory[]>(`
    SELECT
      procedure.proname AS "name",
      pg_get_function_identity_arguments(procedure.oid) AS "identityArguments",
      pg_get_function_result(procedure.oid) AS "returnType"
    FROM pg_proc AS procedure
    INNER JOIN pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
    WHERE namespace.nspname = current_schema()
      AND procedure.proname IN (
        'prepare_better_auth_oauth_client_compat',
        'sync_better_auth_oauth_client_resource_compat',
        'set_better_auth_oauth_resource_compat'
      )
    ORDER BY procedure.proname, pg_get_function_identity_arguments(procedure.oid)
  `);
}

async function functionDependants(transaction: Prisma.TransactionClient): Promise<Pr6FunctionDependant[]> {
  return transaction.$queryRawUnsafe<Pr6FunctionDependant[]>(`
    WITH target_function AS (
      SELECT procedure.oid, procedure.proname
      FROM pg_proc AS procedure
      INNER JOIN pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
      WHERE namespace.nspname = current_schema()
        AND procedure.proname IN (
          'prepare_better_auth_oauth_client_compat',
          'sync_better_auth_oauth_client_resource_compat',
          'set_better_auth_oauth_resource_compat'
        )
    ), dependants AS (
      SELECT
        target_function.proname AS "functionName",
        'TRIGGER'::text AS "dependantType",
        trigger.tgname AS "dependantName",
        relation.relname AS "parentTable"
      FROM target_function
      INNER JOIN pg_trigger AS trigger
        ON trigger.tgfoid = target_function.oid
       AND trigger.tgisinternal = false
      INNER JOIN pg_class AS relation ON relation.oid = trigger.tgrelid
      INNER JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
      WHERE namespace.nspname = current_schema()

      UNION ALL

      SELECT
        target_function.proname,
        CASE relation.relkind
          WHEN 'v' THEN 'VIEW'
          WHEN 'm' THEN 'MATERIALIZED_VIEW'
          ELSE 'REWRITE'
        END,
        relation.relname,
        NULL::name
      FROM target_function
      INNER JOIN pg_depend AS dependency
        ON dependency.refclassid = 'pg_proc'::regclass
       AND dependency.refobjid = target_function.oid
       AND dependency.classid = 'pg_rewrite'::regclass
      INNER JOIN pg_rewrite AS rewrite ON rewrite.oid = dependency.objid
      INNER JOIN pg_class AS relation ON relation.oid = rewrite.ev_class
      INNER JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
      WHERE namespace.nspname = current_schema()

      UNION ALL

      SELECT
        target_function.proname,
        'CONSTRAINT',
        dependent_constraint.conname,
        relation.relname
      FROM target_function
      INNER JOIN pg_depend AS dependency
        ON dependency.refclassid = 'pg_proc'::regclass
       AND dependency.refobjid = target_function.oid
       AND dependency.classid = 'pg_constraint'::regclass
      INNER JOIN pg_constraint AS dependent_constraint ON dependent_constraint.oid = dependency.objid
      INNER JOIN pg_class AS relation ON relation.oid = dependent_constraint.conrelid
      INNER JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
      WHERE namespace.nspname = current_schema()

      UNION ALL

      SELECT
        target_function.proname,
        'COLUMN_DEFAULT',
        relation.relname || '.' || attribute.attname,
        relation.relname
      FROM target_function
      INNER JOIN pg_depend AS dependency
        ON dependency.refclassid = 'pg_proc'::regclass
       AND dependency.refobjid = target_function.oid
       AND dependency.classid = 'pg_attrdef'::regclass
      INNER JOIN pg_attrdef AS attribute_default ON attribute_default.oid = dependency.objid
      INNER JOIN pg_class AS relation ON relation.oid = attribute_default.adrelid
      INNER JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
      INNER JOIN pg_attribute AS attribute
        ON attribute.attrelid = relation.oid
       AND attribute.attnum = attribute_default.adnum
      WHERE namespace.nspname = current_schema()

      UNION ALL

      SELECT
        target_function.proname,
        'ROUTINE',
        dependant.proname,
        NULL::name
      FROM target_function
      INNER JOIN pg_depend AS dependency
        ON dependency.refclassid = 'pg_proc'::regclass
       AND dependency.refobjid = target_function.oid
       AND dependency.classid = 'pg_proc'::regclass
      INNER JOIN pg_proc AS dependant
        ON dependant.oid = dependency.objid
       AND dependant.oid <> target_function.oid
      INNER JOIN pg_namespace AS namespace ON namespace.oid = dependant.pronamespace
      WHERE namespace.nspname = current_schema()

      UNION ALL

      SELECT
        target_function.proname,
        'ROUTINE_DEFINITION',
        dependant.proname,
        NULL::name
      FROM target_function
      CROSS JOIN pg_proc AS dependant
      INNER JOIN pg_namespace AS namespace ON namespace.oid = dependant.pronamespace
      WHERE namespace.nspname = current_schema()
        AND dependant.prokind IN ('f', 'p')
        AND dependant.oid <> target_function.oid
        AND dependant.proname NOT IN (
          'prepare_better_auth_oauth_client_compat',
          'sync_better_auth_oauth_client_resource_compat',
          'set_better_auth_oauth_resource_compat'
        )
        AND position(lower(target_function.proname) IN lower(pg_get_functiondef(dependant.oid))) > 0
    )
    SELECT DISTINCT
      "functionName",
      "dependantType",
      "dependantName",
      "parentTable"
    FROM dependants
    ORDER BY "functionName", "dependantType", "dependantName"
  `);
}

async function relationDependants(transaction: Prisma.TransactionClient): Promise<Pr6RelationDependant[]> {
  return transaction.$queryRawUnsafe<Pr6RelationDependant[]>(`
    SELECT DISTINCT
      target.relname AS "targetTable",
      CASE dependant.relkind WHEN 'v' THEN 'VIEW' WHEN 'm' THEN 'MATERIALIZED_VIEW' ELSE dependant.relkind::text END AS "dependantType",
      dependant.relname AS "dependantName"
    FROM pg_depend AS dependency
    INNER JOIN pg_class AS target ON target.oid = dependency.refobjid
    INNER JOIN pg_namespace AS target_namespace ON target_namespace.oid = target.relnamespace
    INNER JOIN pg_rewrite AS rewrite ON rewrite.oid = dependency.objid
    INNER JOIN pg_class AS dependant ON dependant.oid = rewrite.ev_class
    INNER JOIN pg_namespace AS dependant_namespace ON dependant_namespace.oid = dependant.relnamespace
    WHERE dependency.classid = 'pg_rewrite'::regclass
      AND dependency.refclassid = 'pg_class'::regclass
      AND target_namespace.nspname = current_schema()
      AND dependant_namespace.nspname = current_schema()
      AND target.relname IN (
        'oauthClient', 'oauthResource', 'oauthClientResource', 'oauthRefreshToken',
        'oauthAccessToken', 'oauthConsent', 'oauthClientAssertion',
        'CommercialMcpRateLimitBucket'
      )
      AND dependant.oid <> target.oid
    ORDER BY target.relname, dependant.relname
  `);
}

async function functionTableReferences(transaction: Prisma.TransactionClient) {
  return transaction.$queryRawUnsafe<Array<{ functionName: string; targetTable: string }>>(`
    WITH target("table") AS (
      VALUES
        ('oauthClient'), ('oauthResource'), ('oauthClientResource'), ('oauthRefreshToken'),
        ('oauthAccessToken'), ('oauthConsent'), ('oauthClientAssertion'),
        ('CommercialMcpRateLimitBucket')
    )
    SELECT DISTINCT
      procedure.proname AS "functionName",
      target."table" AS "targetTable"
    FROM pg_proc AS procedure
    INNER JOIN pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
    CROSS JOIN target
    WHERE namespace.nspname = current_schema()
      AND procedure.prokind IN ('f', 'p')
      AND procedure.proname NOT IN (
        'prepare_better_auth_oauth_client_compat',
        'sync_better_auth_oauth_client_resource_compat',
        'set_better_auth_oauth_resource_compat'
      )
      AND position(lower(target."table") IN lower(pg_get_functiondef(procedure.oid))) > 0
    ORDER BY procedure.proname, target."table"
  `);
}

async function keepSetEvidence(transaction: Prisma.TransactionClient): Promise<Pr6KeepSetEvidence> {
  const [tableRows, issuerRows, indexRows, triggerRows, functionRows] = await Promise.all([
    transaction.$queryRawUnsafe<Array<{ table: string; exists: boolean }>>(`
      WITH required("table", ordinal) AS (
        VALUES ('User', 1), ('Session', 2), ('Account', 3), ('Verification', 4), ('AuditLog', 5)
      )
      SELECT required."table", relation.oid IS NOT NULL AS "exists"
      FROM required
      LEFT JOIN pg_namespace AS namespace ON namespace.nspname = current_schema()
      LEFT JOIN pg_class AS relation
        ON relation.relnamespace = namespace.oid
       AND relation.relname = required."table"
       AND relation.relkind IN ('r', 'p')
      ORDER BY required.ordinal
    `),
    transaction.$queryRawUnsafe<Array<{ exists: boolean; nonNullable: boolean }>>(`
      SELECT
        count(*) = 1 AS "exists",
        bool_and(is_nullable = 'NO') AS "nonNullable"
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'Account'
        AND column_name = 'issuer'
    `),
    transaction.$queryRawUnsafe<Array<{ exists: boolean; unique: boolean; columns: string[] | null }>>(`
      SELECT
        true AS "exists",
        index.indisunique AS "unique",
        columns.names AS "columns"
      FROM pg_class AS relation
      INNER JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
      INNER JOIN pg_index AS index ON index.indrelid = relation.oid
      INNER JOIN pg_class AS index_relation
        ON index_relation.oid = index.indexrelid
       AND index_relation.relname = 'account_issuer_accountId_uidx'
      INNER JOIN LATERAL (
        SELECT array_agg(attribute.attname ORDER BY key.ordinality) AS names
        FROM unnest(index.indkey) WITH ORDINALITY AS key(attnum, ordinality)
        INNER JOIN pg_attribute AS attribute
          ON attribute.attrelid = relation.oid AND attribute.attnum = key.attnum
      ) AS columns ON true
      WHERE namespace.nspname = current_schema()
        AND relation.relname = 'Account'
    `),
    transaction.$queryRawUnsafe<Array<{
      exists: boolean;
      parentTable: string | null;
      functionName: string | null;
      enabledCode: string | null;
    }>>(`
      SELECT
        count(*) = 1 AS "exists",
        min(relation.relname) AS "parentTable",
        min(procedure.proname) AS "functionName",
        min(trigger.tgenabled::text) AS "enabledCode"
      FROM pg_trigger AS trigger
      INNER JOIN pg_class AS relation ON relation.oid = trigger.tgrelid
      INNER JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
      INNER JOIN pg_proc AS procedure ON procedure.oid = trigger.tgfoid
      WHERE namespace.nspname = current_schema()
        AND trigger.tgname = 'Account_better_auth_issuer_compat'
        AND trigger.tgisinternal = false
    `),
    transaction.$queryRawUnsafe<Array<{
      exists: boolean;
      identityArguments: string | null;
      returnType: string | null;
    }>>(`
      SELECT
        count(*) = 1 AS "exists",
        min(pg_get_function_identity_arguments(procedure.oid)) AS "identityArguments",
        min(pg_get_function_result(procedure.oid)) AS "returnType"
      FROM pg_proc AS procedure
      INNER JOIN pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
      WHERE namespace.nspname = current_schema()
        AND procedure.proname = 'set_better_auth_account_issuer'
    `),
  ]);

  const issuer = issuerRows[0] ?? { exists: false, nonNullable: false };
  const identity = indexRows[0] ?? { exists: false, unique: false, columns: null };
  const trigger = triggerRows[0] ?? {
    exists: false,
    parentTable: null,
    functionName: null,
    enabledCode: null,
  };
  const compatibilityFunction = functionRows[0] ?? {
    exists: false,
    identityArguments: null,
    returnType: null,
  };
  return {
    tables: Object.fromEntries(tableRows.map((table) => [table.table, table.exists])),
    accountIssuer: issuer,
    accountIdentityInvariant: {
      exists: identity.exists,
      unique: identity.unique,
      columns: identity.columns ?? [],
    },
    accountCompatibilityTrigger: {
      exists: trigger.exists,
      parentTable: trigger.parentTable,
      functionName: trigger.functionName,
      enabled: trigger.enabledCode === "D" ? "DISABLED" : trigger.enabledCode === "O" ? "ENABLED" : trigger.enabledCode,
    },
    accountCompatibilityFunction: compatibilityFunction,
  };
}

async function project(transaction: Prisma.TransactionClient) {
  await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
  const [readOnly] = await transaction.$queryRawUnsafe<Array<{ transaction_read_only: string }>>(
    "SHOW transaction_read_only",
  );
  if (readOnly?.transaction_read_only !== "on") {
    throw new Error("PR6 projection could not enforce a read-only transaction.");
  }

  const targetTables = await targetTableInventory(transaction);
  const allTablesExist = targetTables.every((table) => table.exists);
  const targetRowCounts = await targetCounts(transaction, allTablesExist);
  const rateBucketLifecycle = await rateBucketLifecycleSummary(
    transaction,
    targetTables.some((table) => table.table === "CommercialMcpRateLimitBucket" && table.exists),
  );
  const [
    routes,
    targetForeignKeys,
    triggers,
    functions,
    targetFunctionDependants,
    targetRelationDependants,
    unexpectedFunctionReferences,
    keepSet,
    migrationRows,
  ] = await Promise.all([
    transaction.marketActivation.findMany({
      where: { product: "CASINO" },
      select: {
        id: true,
        casinoId: true,
        countryCode: true,
        marketCode: true,
        desiredState: true,
        status: true,
        routeVerificationStatus: true,
        affiliateOfferId: true,
        primaryTrackingLinkId: true,
        redirectSlugId: true,
      },
      orderBy: [{ marketCode: "asc" }, { casinoId: "asc" }, { id: "asc" }],
    }),
    foreignKeys(transaction),
    targetTriggers(transaction),
    targetFunctions(transaction),
    functionDependants(transaction),
    relationDependants(transaction),
    functionTableReferences(transaction),
    keepSetEvidence(transaction),
    transaction.$queryRawUnsafe<Array<{ count: number }>>(`
      SELECT count(*)::int AS "count"
      FROM "_prisma_migrations"
      WHERE migration_name = '0041_commercial_core_legacy_connector_cleanup'
        AND finished_at IS NOT NULL
        AND rolled_back_at IS NULL
    `),
  ]);
  const canonicalRoutes = routes.filter((route) => route.marketCode !== "ZZ");
  const healthyActiveRoutes = canonicalRoutes.filter((route) =>
    route.desiredState === "ACTIVE"
    && route.status === "ACTIVE"
    && route.routeVerificationStatus === "HEALTHY");
  const migrationSql = readFileSync(PR6_MIGRATION_PATH, "utf8");
  const head = git(["rev-parse", "HEAD"]);
  const originMain = git(["rev-parse", "origin/main"]);
  const branch = git(["branch", "--show-current"]);
  const evidence = {
    head,
    originMain,
    branch,
    workingTreeClean: git(["status", "--porcelain"]) === "",
    transactionReadOnly: readOnly.transaction_read_only,
    targetTables,
    targetRowCounts,
    foreignKeys: targetForeignKeys,
    triggers,
    functions,
    functionDependants: targetFunctionDependants,
    relationDependants: targetRelationDependants,
    functionTableReferences: unexpectedFunctionReferences,
    keepSet,
    routeBaseline: {
      canonicalRouteCount: canonicalRoutes.length,
      healthyActiveRouteCount: healthyActiveRoutes.length,
      legacyZzRouteCount: routes.length - canonicalRoutes.length,
      canonicalRouteDigestSha256: sha256(JSON.stringify(canonicalRoutes)),
    },
    migration: {
      path: PR6_MIGRATION_PATH,
      sqlSha256: sha256(migrationSql),
      inspection: inspectPr6MigrationSql(migrationSql),
      appliedProductionRows: migrationRows[0]?.count ?? 0,
    },
    immutableMigrationChangedFiles: changedFiles([
      "prisma/migrations/0021_partner_ops_work_bridge_01",
      "prisma/migrations/0022_better_auth_17_schema_upgrade",
      "prisma/migrations/0023_mcp_dcr_runtime_compat_fix",
    ]),
    publicRuntimeChangedFiles: changedFiles(PR6_PUBLIC_RUNTIME_FILES),
    activeRuntimeConsumerFiles: activeRuntimeConsumerFiles(),
  };
  const assessment = assessPr6Projection(evidence);
  const expectedForeignKeyKeys = new Set(PR6_EXPECTED_FOREIGN_KEYS.map((foreignKey) => canonicalJson(foreignKey)));

  return {
    operation: "COMMERCIAL-CORE-PR6-LEGACY-CLEANUP-PROJECTION",
    mode: "READ_ONLY",
    identity: {
      head,
      originMain,
      branch,
      capturedAt: new Date().toISOString(),
      databaseFingerprint: "MATCHED",
      transactionReadOnly: readOnly.transaction_read_only,
      productionMutationPerformed: false,
    },
    targetStorage: {
      rowCounts: assessment.reviewedPlan.targetRowCounts,
      totalRowsScheduledForDeletion: assessment.totalRowsScheduledForDeletion,
      rateBucketLifecycle,
    },
    databaseObjectInventory: {
      tables: PR6_TARGET_TABLES.map(({ model, table }) => {
        const inventory = targetTables.find((entry) => entry.table === table);
        const dependencies = targetForeignKeys.filter((foreignKey) =>
          foreignKey.sourceTable === table || foreignKey.targetTable === table);
        const unexpectedForeignKeys = dependencies
          .filter((foreignKey) => !expectedForeignKeyKeys.has(canonicalJson(foreignKey)))
          .map((foreignKey) => ({ type: "FOREIGN_KEY", name: foreignKey.name }));
        const unexpectedRelations = targetRelationDependants
          .filter((dependant) => dependant.targetTable === table)
          .map((dependant) => ({ type: dependant.dependantType, name: dependant.dependantName }));
        const unexpectedRoutines = unexpectedFunctionReferences
          .filter((reference) => reference.targetTable === table)
          .map((reference) => ({ type: "ROUTINE_REFERENCE", name: reference.functionName }));
        return {
          model,
          table,
          exists: inventory?.exists ?? false,
          indexCount: inventory?.indexes.length ?? 0,
          incomingForeignKeys: dependencies
            .filter((foreignKey) => foreignKey.targetTable === table)
            .map((foreignKey) => foreignKey.name),
          outgoingForeignKeys: dependencies
            .filter((foreignKey) => foreignKey.sourceTable === table)
            .map((foreignKey) => foreignKey.name),
          unexpectedDependencies: [
            ...unexpectedForeignKeys,
            ...unexpectedRelations,
            ...unexpectedRoutines,
          ],
        };
      }),
      triggers: PR6_TARGET_TRIGGERS.map((expected) => {
        const found = triggers.find((trigger) => trigger.name === expected.name);
        return {
          name: expected.name,
          exists: Boolean(found),
          parentTable: found?.parentTable ?? null,
          functionName: found?.functionName ?? null,
          enabled: found?.enabled ?? null,
        };
      }),
      unexpectedTriggers: triggers.filter((trigger) =>
        !PR6_TARGET_TRIGGERS.some((expected) => expected.name === trigger.name)),
      functions: PR6_TARGET_FUNCTIONS.map((name) => {
        const found = functions.find((candidate) => candidate.name === name);
        const expectedDependants = new Set(
          PR6_TARGET_TRIGGERS
            .filter((trigger) => trigger.functionName === name)
            .map((trigger) => canonicalJson({
              functionName: name,
              dependantType: "TRIGGER",
              dependantName: trigger.name,
              parentTable: trigger.parentTable,
            })),
        );
        return {
          name,
          exists: Boolean(found),
          identityArguments: found?.identityArguments ?? null,
          returnType: found?.returnType ?? null,
          unexpectedDependants: targetFunctionDependants.filter((dependant) =>
            dependant.functionName === name && !expectedDependants.has(canonicalJson(dependant))),
        };
      }),
      unexpectedRelationDependants: targetRelationDependants,
      unexpectedFunctionTableReferences: unexpectedFunctionReferences,
    },
    keepSet,
    runtimeRegressionBaseline: {
      ...evidence.routeBaseline,
      changedPublicRuntimeFilesAgainstOriginMain: evidence.publicRuntimeChangedFiles,
      activeRuntimeConsumerFiles: evidence.activeRuntimeConsumerFiles,
    },
    migrationScope: {
      path: PR6_MIGRATION_PATH,
      sqlSha256: evidence.migration.sqlSha256,
      containsCascade: evidence.migration.inspection.containsCascade,
      approvedObjectsOnly: evidence.migration.inspection.approvedObjectsOnly,
      exactApprovedOrder: evidence.migration.inspection.exactApprovedOrder,
      immutableMigrations0021Through0023Changed: evidence.immutableMigrationChangedFiles,
      appliedProductionRows: evidence.migration.appliedProductionRows,
    },
    conflicts: assessment.conflicts,
    reviewedPlanSha256: assessment.reviewedPlanSha256,
    readyToApply: assessment.readyToApply,
    productionMutationPerformed: false,
  };
}

async function main() {
  if (databaseFingerprint() !== EXPECTED_DATABASE_FINGERPRINT) {
    throw new Error("PR6 projection refused an unexpected database fingerprint.");
  }
  if (git(["rev-parse", "origin/main"]) !== PR6_BASE_SHA) {
    throw new Error("PR6 projection refused origin/main drift.");
  }
  if (git(["branch", "--show-current"]) !== PR6_BRANCH) {
    throw new Error("PR6 projection refused an unexpected branch.");
  }
  const result = await prisma.$transaction(project, {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    timeout: 60_000,
  });
  console.log(JSON.stringify(result, (_key, value) => typeof value === "bigint" ? Number(value) : value, 2));
  if (!result.readyToApply) process.exitCode = 2;
}

void main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(`[commercial-core-pr6-projection] ${error instanceof Error ? error.message : "Unknown error"}`);
    process.exitCode = 1;
  });
