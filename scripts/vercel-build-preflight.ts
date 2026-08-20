import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { assertVercelDatabaseReadiness } from "@/lib/db/vercel-database-readiness";

const TARGET_MIGRATION = "0020_commercial_ops_01";

function writeEvent(payload: Record<string, unknown>) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

async function readMigrationRows(prisma: PrismaClient) {
  return prisma.$queryRawUnsafe<
    Array<{
      migration_name: string;
      finished_at: Date | null;
      rolled_back_at: Date | null;
    }>
  >(
    'SELECT "migration_name", "finished_at", "rolled_back_at" FROM "_prisma_migrations" ORDER BY "started_at" ASC',
  );
}

async function maybeApplyCommercialOpsMigration() {
  const result = assertVercelDatabaseReadiness();

  if (!result.checked) {
    process.stdout.write(
      "[vercel-build-preflight] skipped outside Vercel Preview/Production\n",
    );
    return;
  }

  writeEvent({
    event: "vercel_database_readiness",
    environment: result.environment,
    runtimeMode: result.runtimeMode,
    directMode: result.directMode,
    sameDatabaseIdentity: result.sameDatabaseIdentity,
    ready: result.ready,
  });

  if (result.environment !== "production") {
    return;
  }

  const prisma = new PrismaClient();

  try {
    const rows = await readMigrationRows(prisma);
    const unresolvedFailedRows = rows.filter(
      (row) => row.finished_at === null && row.rolled_back_at === null,
    );

    if (unresolvedFailedRows.length > 0) {
      throw new Error(
        `Production migration guard found ${unresolvedFailedRows.length} unresolved migration row(s); refusing to mutate Production.`,
      );
    }

    const applied = new Set(
      rows
        .filter(
          (row) => row.finished_at !== null && row.rolled_back_at === null,
        )
        .map((row) => row.migration_name),
    );

    const repositoryMigrations = readdirSync("prisma/migrations", {
      withFileTypes: true,
    })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    const pending = repositoryMigrations.filter((name) => !applied.has(name));

    if (pending.length === 0) {
      if (!applied.has(TARGET_MIGRATION)) {
        throw new Error(
          `Production migration guard found no pending migrations but ${TARGET_MIGRATION} is not recorded as applied.`,
        );
      }

      writeEvent({
        event: "production_migration_0020",
        state: "already_applied",
        migration: TARGET_MIGRATION,
      });
      return;
    }

    if (pending.length !== 1 || pending[0] !== TARGET_MIGRATION) {
      throw new Error(
        `Production migration guard expected only ${TARGET_MIGRATION} pending; found: ${pending.join(", ") || "none"}.`,
      );
    }

    writeEvent({
      event: "production_migration_0020",
      state: "applying",
      migration: TARGET_MIGRATION,
    });

    await prisma.$disconnect();

    const executable = process.platform === "win32" ? "npx.cmd" : "npx";
    const deployment = spawnSync(executable, ["prisma", "migrate", "deploy"], {
      cwd: process.cwd(),
      env: process.env,
      encoding: "utf-8",
    });

    if (deployment.status !== 0) {
      throw new Error(
        `prisma migrate deploy failed with exit code ${deployment.status ?? "unknown"}; Production build stopped before application deployment.`,
      );
    }

    const verifier = new PrismaClient();
    try {
      const verifiedRows = await readMigrationRows(verifier);
      const target = verifiedRows.find(
        (row) =>
          row.migration_name === TARGET_MIGRATION &&
          row.finished_at !== null &&
          row.rolled_back_at === null,
      );

      if (!target) {
        throw new Error(
          `${TARGET_MIGRATION} was not verified as applied after prisma migrate deploy.`,
        );
      }
    } finally {
      await verifier.$disconnect();
    }

    writeEvent({
      event: "production_migration_0020",
      state: "applied_and_verified",
      migration: TARGET_MIGRATION,
    });
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

maybeApplyCommercialOpsMigration().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[vercel-build-preflight] ${message}\n`);
  process.exit(1);
});
