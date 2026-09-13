import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  applyExactRouteMaterialization,
  EXACT_ROUTE_MATERIALIZATION_VERSION,
  planExactRouteMaterialization,
} from "@/lib/market-activation/exact-route-materialization";
import { inspectExactRouteReadiness } from "@/lib/market-activation/exact-route-readiness";

const TARGET_MIGRATION = "0040_commercial_core_exact_routes_geo_simplification";
const APPLY_CONFIRMATION = EXACT_ROUTE_MATERIALIZATION_VERSION;

type Mode = "plan" | "apply" | "verify";

type MigrationRow = {
  checksum: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

function argument(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function repositoryMigrationChecksum() {
  return createHash("sha256")
    .update(readFileSync(`prisma/migrations/${TARGET_MIGRATION}/migration.sql`))
    .digest("hex");
}

async function inspectSchemaState(database: Prisma.TransactionClient) {
  const rows = await database.$queryRawUnsafe<MigrationRow[]>(`
    SELECT "checksum", "finished_at", "rolled_back_at"
    FROM "_prisma_migrations"
    WHERE "migration_name" = '${TARGET_MIGRATION}'
    ORDER BY "started_at" DESC
    LIMIT 1
  `);
  const row = rows[0];
  const completed = Boolean(row?.finished_at && !row.rolled_back_at);
  return {
    migration: TARGET_MIGRATION,
    completed,
    checksumMatched: completed && row?.checksum === repositoryMigrationChecksum(),
  };
}

async function readOnlyReport(mode: "plan" | "verify") {
  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    const schema = await inspectSchemaState(transaction);
    const plan = await planExactRouteMaterialization(transaction);
    const readiness = await inspectExactRouteReadiness(transaction);
    return {
      operation: EXACT_ROUTE_MATERIALIZATION_VERSION,
      mode: mode.toUpperCase(),
      productionMutationPerformed: false,
      schema,
      plan,
      readiness,
    };
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    maxWait: 10_000,
    timeout: 120_000,
  });
}

async function main() {
  const mode = (process.argv[2] ?? "plan") as Mode;
  if (!(["plan", "apply", "verify"] as const).includes(mode)) {
    throw new Error("EXACT_ROUTE_MATERIALIZATION_MODE_UNSUPPORTED");
  }

  if (mode === "plan") {
    console.log(JSON.stringify(await readOnlyReport("plan"), null, 2));
    return;
  }

  if (mode === "verify") {
    const report = await readOnlyReport("verify");
    console.log(JSON.stringify(report, null, 2));
    if (!report.schema.completed || !report.schema.checksumMatched) {
      throw new Error("EXACT_ROUTE_SCHEMA_NOT_READY");
    }
    if (
      !report.plan.readyToApply
      || !report.plan.cutoverSafe
      || report.plan.create.length > 0
      || report.plan.disable.length > 0
      || !report.readiness.ready
    ) {
      throw new Error("EXACT_ROUTE_VERIFICATION_FAILED");
    }
    return;
  }

  if (argument("confirm") !== APPLY_CONFIRMATION) {
    throw new Error(`EXACT_ROUTE_APPLY_CONFIRMATION_REQUIRED:--confirm=${APPLY_CONFIRMATION}`);
  }
  const schema = await prisma.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
    return inspectSchemaState(transaction);
  });
  if (!schema.completed || !schema.checksumMatched) throw new Error("EXACT_ROUTE_SCHEMA_NOT_READY");
  const result = await applyExactRouteMaterialization(prisma);
  console.log(JSON.stringify({
    operation: EXACT_ROUTE_MATERIALIZATION_VERSION,
    mode: "APPLY",
    productionMutationPerformed: true,
    schema,
    result,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
