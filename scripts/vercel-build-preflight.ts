import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { assertVercelDatabaseReadiness } from "@/lib/db/vercel-database-readiness";

const TARGET_MIGRATIONS = [
  "0021_partner_ops_work_bridge_01",
  "0022_better_auth_17_schema_upgrade",
] as const;
const BASELINE_MIGRATION = "0020_commercial_ops_01";

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
    throw new Error(`Production migration guard could not find completed row for ${name}.`);
  }
  const expected = repositoryChecksum(name);
  if (row.checksum !== expected) {
    throw new Error(`Production migration guard checksum mismatch for ${name}; refusing to continue.`);
  }
}

async function assertAccountPreconditions(prisma: PrismaClient) {
  const [state] = await prisma.$queryRawUnsafe<
    Array<{
      total: bigint;
      unsupported: bigint;
      credential_mismatch: bigint;
      identity_collisions: bigint;
    }>
  >(`
    SELECT
      COUNT(*)::bigint AS total,
      COUNT(*) FILTER (WHERE "providerId" NOT IN ('credential', 'google'))::bigint AS unsupported,
      COUNT(*) FILTER (WHERE "providerId" = 'credential' AND "accountId" <> "userId")::bigint AS credential_mismatch,
      (
        SELECT COUNT(*)::bigint FROM (
          SELECT
            CASE "providerId"
              WHEN 'credential' THEN 'local:credential'
              WHEN 'google' THEN 'https://accounts.google.com'
              ELSE NULL
            END AS future_issuer,
            "accountId"
          FROM "Account"
          GROUP BY 1, "accountId"
          HAVING COUNT(*) > 1
        ) collisions
      ) AS identity_collisions
    FROM "Account"
  `);

  if (!state) {
    throw new Error("Production migration guard could not inspect Account state.");
  }
  if (state.unsupported !== 0n || state.credential_mismatch !== 0n || state.identity_collisions !== 0n) {
    throw new Error(
      `Production migration guard rejected Account state: unsupported=${state.unsupported}, credential_mismatch=${state.credential_mismatch}, identity_collisions=${state.identity_collisions}.`,
    );
  }

  writeEvent({
    event: "bridge_release_account_precheck",
    totalAccounts: Number(state.total),
    unsupportedProviders: Number(state.unsupported),
    credentialMismatches: Number(state.credential_mismatch),
    identityCollisions: Number(state.identity_collisions),
  });
}

async function assertPostMigrationInvariants(prisma: PrismaClient) {
  const [accounts] = await prisma.$queryRawUnsafe<
    Array<{ total: bigint; missing_issuer: bigint; invalid_issuer: bigint }>
  >(`
    SELECT
      COUNT(*)::bigint AS total,
      COUNT(*) FILTER (WHERE "issuer" IS NULL OR btrim("issuer") = '')::bigint AS missing_issuer,
      COUNT(*) FILTER (
        WHERE ("providerId" = 'credential' AND "issuer" <> 'local:credential')
           OR ("providerId" = 'google' AND "issuer" <> 'https://accounts.google.com')
           OR "providerId" NOT IN ('credential', 'google')
      )::bigint AS invalid_issuer
    FROM "Account"
  `);

  const [oauth] = await prisma.$queryRawUnsafe<
    Array<{ nonempty_client_credentials: bigint; resources: bigint }>
  >(`
    SELECT
      (SELECT COUNT(*)::bigint FROM "oauthClient" WHERE cardinality("clientCredentialsScopes") > 0) AS nonempty_client_credentials,
      (SELECT COUNT(*)::bigint FROM "oauthResource" WHERE "disabled" IS DISTINCT FROM true) AS resources
  `);

  if (!accounts || !oauth) {
    throw new Error("Production migration guard could not verify post-migration invariants.");
  }
  if (accounts.missing_issuer !== 0n || accounts.invalid_issuer !== 0n) {
    throw new Error("Production migration guard found invalid Account issuer state after migration.");
  }
  if (oauth.nonempty_client_credentials !== 0n) {
    throw new Error("Production migration guard found unexpected client_credentials scope authority.");
  }

  writeEvent({
    event: "bridge_release_post_migration_invariants",
    totalAccounts: Number(accounts.total),
    missingIssuers: Number(accounts.missing_issuer),
    invalidIssuers: Number(accounts.invalid_issuer),
    oauthResources: Number(oauth.resources),
    nonemptyClientCredentialsScopes: Number(oauth.nonempty_client_credentials),
  });
}

async function maybeApplyBridgeReleaseMigrations() {
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

  if (readiness.environment !== "production") {
    return;
  }

  const repositoryMigrations = readdirSync("prisma/migrations", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const name of [BASELINE_MIGRATION, ...TARGET_MIGRATIONS]) {
    if (!repositoryMigrations.includes(name)) {
      throw new Error(`Production migration guard missing repository migration ${name}.`);
    }
  }

  const prisma = new PrismaClient();
  try {
    const rows = await readMigrationRows(prisma);
    const unresolved = rows.filter((row) => row.finished_at === null && row.rolled_back_at === null);
    if (unresolved.length > 0) {
      throw new Error(`Production migration guard found ${unresolved.length} unresolved migration row(s); refusing to mutate Production.`);
    }

    const completed = completedRows(rows);
    const completedByName = new Map(completed.map((row) => [row.migration_name, row]));
    assertChecksum(completedByName.get(BASELINE_MIGRATION), BASELINE_MIGRATION);

    const applied = new Set(completed.map((row) => row.migration_name));
    const pending = repositoryMigrations.filter((name) => !applied.has(name));
    const allowedPending = TARGET_MIGRATIONS.filter((name) => !applied.has(name));

    if (pending.length !== allowedPending.length || pending.some((name, index) => name !== allowedPending[index])) {
      throw new Error(
        `Production migration guard expected pending suffix ${allowedPending.join(", ") || "none"}; found ${pending.join(", ") || "none"}.`,
      );
    }

    for (const name of TARGET_MIGRATIONS) {
      if (applied.has(name)) {
        assertChecksum(completedByName.get(name), name);
      }
    }

    if (pending.length === 0) {
      await assertPostMigrationInvariants(prisma);
      writeEvent({
        event: "production_bridge_migrations",
        state: "already_applied_and_verified",
        migrations: TARGET_MIGRATIONS,
      });
      return;
    }

    await assertAccountPreconditions(prisma);

    writeEvent({
      event: "production_bridge_migrations",
      state: "applying",
      pending,
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
      for (const name of TARGET_MIGRATIONS) {
        assertChecksum(verifiedCompleted.get(name), name);
      }
      await assertPostMigrationInvariants(verifier);
    } finally {
      await verifier.$disconnect();
    }

    writeEvent({
      event: "production_bridge_migrations",
      state: "applied_and_verified",
      migrations: TARGET_MIGRATIONS,
    });
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

maybeApplyBridgeReleaseMigrations().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[vercel-build-preflight] ${message}\n`);
  process.exit(1);
});
