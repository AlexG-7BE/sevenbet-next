import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

import { assertVercelDatabaseReadiness } from "@/lib/db/vercel-database-readiness";

const BASELINE_MIGRATION = "0022_better_auth_17_schema_upgrade";
const TARGET_MIGRATION = "0023_mcp_dcr_runtime_compat_fix";

type MigrationRow = {
  migration_name: string;
  checksum: string;
  finished_at: Date | null;
  rolled_back_at: Date | null;
};

function writeEvent(payload: Record<string, unknown>) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

function migrationFile(name: string) {
  return `prisma/migrations/${name}/migration.sql`;
}

function repositoryChecksum(name: string) {
  return createHash("sha256").update(readFileSync(migrationFile(name))).digest("hex");
}

async function readMigrationRows(prisma: PrismaClient) {
  return prisma.$queryRawUnsafe<MigrationRow[]>(
    'SELECT "migration_name", "checksum", "finished_at", "rolled_back_at" FROM "_prisma_migrations" ORDER BY "started_at" ASC',
  );
}

function completedRows(rows: MigrationRow[]) {
  return rows.filter((row) => row.finished_at !== null && row.rolled_back_at === null);
}

function assertChecksum(row: MigrationRow | undefined, name: string) {
  if (!row) {
    throw new Error(`Production DCR fix guard could not find completed row for ${name}.`);
  }
  const expected = repositoryChecksum(name);
  if (row.checksum !== expected) {
    throw new Error(`Production DCR fix guard checksum mismatch for ${name}; refusing to continue.`);
  }
}

async function assertPostMigrationInvariants(prisma: PrismaClient) {
  const [functionState] = await prisma.$queryRawUnsafe<Array<{ definition: string }>>(`
    SELECT pg_get_functiondef('public.prepare_better_auth_oauth_client_compat()'::regprocedure) AS definition
  `);
  if (!functionState?.definition) {
    throw new Error("Production DCR fix guard could not read OAuth compatibility function.");
  }

  const definition = functionState.definition;
  if (
    !definition.includes('NEW."public" IS DISTINCT FROM true')
    || !definition.includes("unsupported Better Auth 1.7 Commercial MCP client state")
    || !definition.includes("client_credentials")
  ) {
    throw new Error("Production DCR fix guard found unexpected OAuth compatibility function definition.");
  }

  const [oauthState] = await prisma.$queryRawUnsafe<Array<{ nonempty_client_credentials: bigint }>>(`
    SELECT COUNT(*)::bigint AS nonempty_client_credentials
    FROM "oauthClient"
    WHERE cardinality("clientCredentialsScopes") > 0
  `);
  if (!oauthState || oauthState.nonempty_client_credentials !== 0n) {
    throw new Error("Production DCR fix guard found unexpected client_credentials scope authority.");
  }

  writeEvent({
    event: "production_mcp_dcr_fix_invariants",
    legacyCompatibilityStillPresent: definition.includes("unsupported Commercial MCP client state"),
    betterAuth17ProviderInsertPathPresent: true,
    nonemptyClientCredentialsScopes: Number(oauthState.nonempty_client_credentials),
  });
}

async function maybeApplyDcrFix() {
  const readiness = assertVercelDatabaseReadiness();

  if (!readiness.checked) {
    process.stdout.write("[vercel-build-preflight] skipped outside Vercel Preview/Production\n");
    return;
  }

  writeEvent({
    event: "vercel_database_readiness",
    environment: readiness.environment,
    runtimeMode: readiness.runtimeMode,
    directMode: readiness.directMode,
    sameDatabaseIdentity: readiness.sameDatabaseIdentity,
    ready: readiness.ready,
  });

  if (readiness.environment !== "production") return;

  const repositoryMigrations = readdirSync("prisma/migrations", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const name of [BASELINE_MIGRATION, TARGET_MIGRATION]) {
    if (!repositoryMigrations.includes(name)) {
      throw new Error(`Production DCR fix guard missing repository migration ${name}.`);
    }
  }

  const prisma = new PrismaClient();
  try {
    const rows = await readMigrationRows(prisma);
    const unresolved = rows.filter((row) => row.finished_at === null && row.rolled_back_at === null);
    if (unresolved.length > 0) {
      throw new Error(`Production DCR fix guard found ${unresolved.length} unresolved migration row(s); refusing to mutate Production.`);
    }

    const completed = completedRows(rows);
    const completedByName = new Map(completed.map((row) => [row.migration_name, row]));
    assertChecksum(completedByName.get(BASELINE_MIGRATION), BASELINE_MIGRATION);

    const applied = new Set(completed.map((row) => row.migration_name));
    const pending = repositoryMigrations.filter((name) => !applied.has(name));
    const expectedPending = applied.has(TARGET_MIGRATION) ? [] : [TARGET_MIGRATION];

    if (
      pending.length !== expectedPending.length
      || pending.some((name, index) => name !== expectedPending[index])
    ) {
      throw new Error(
        `Production DCR fix guard expected pending suffix ${expectedPending.join(", ") || "none"}; found ${pending.join(", ") || "none"}.`,
      );
    }

    if (applied.has(TARGET_MIGRATION)) {
      assertChecksum(completedByName.get(TARGET_MIGRATION), TARGET_MIGRATION);
      await assertPostMigrationInvariants(prisma);
      writeEvent({
        event: "production_mcp_dcr_fix",
        state: "already_applied_and_verified",
        migration: TARGET_MIGRATION,
      });
      return;
    }

    writeEvent({
      event: "production_mcp_dcr_fix",
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
      const verifiedCompleted = new Map(completedRows(verifiedRows).map((row) => [row.migration_name, row]));
      assertChecksum(verifiedCompleted.get(TARGET_MIGRATION), TARGET_MIGRATION);
      await assertPostMigrationInvariants(verifier);
    } finally {
      await verifier.$disconnect();
    }

    writeEvent({
      event: "production_mcp_dcr_fix",
      state: "applied_and_verified",
      migration: TARGET_MIGRATION,
    });
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

maybeApplyDcrFix().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[vercel-build-preflight] ${message}\n`);
  process.exit(1);
});
