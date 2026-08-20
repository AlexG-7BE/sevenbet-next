import { spawnSync } from "node:child_process";
import { copyFile, cp, mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const allowedHosts = new Set(["127.0.0.1", "localhost"]);
const allowedPorts = new Set(["5432", "54329"]);

function assertDisposableDatabase(variableName) {
  const value = process.env[variableName];
  if (!value) throw new Error(`${variableName} is required for migration verification`);

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${variableName} must be a valid PostgreSQL URL`);
  }

  const databaseName = url.pathname.replace(/^\//, "");
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !allowedHosts.has(url.hostname) ||
    !allowedPorts.has(url.port) ||
    !databaseName.endsWith("_ci")
  ) {
    throw new Error(
      `${variableName} refused: CI migrations require localhost:5432 or :54329 and an _ci database`,
    );
  }
}

function run(command, args, environment = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, ...environment },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with status ${result.status}`);
  }
}

function runExpectFailure(command, args, environment = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, ...environment },
  });
  if (result.error) throw result.error;
  if (result.status === 0) {
    throw new Error(`${command} ${args.join(" ")} unexpectedly succeeded`);
  }
}

function databaseUrlForSchema(value, schema) {
  const url = new URL(value);
  url.searchParams.set("schema", schema);
  return url.toString();
}

async function stageMigrations(migrationEntries) {
  const stagedSchemaDirectory = await mkdtemp(
    path.join(tmpdir(), "sevenbet-ci-migrations-"),
  );
  const stagedMigrations = path.join(stagedSchemaDirectory, "migrations");
  await mkdir(stagedMigrations);
  await copyFile(
    "prisma/schema.prisma",
    path.join(stagedSchemaDirectory, "schema.prisma"),
  );
  for (const migration of migrationEntries) {
    await cp(
      path.join("prisma/migrations", migration),
      path.join(stagedMigrations, migration),
      { recursive: true },
    );
  }
  return stagedSchemaDirectory;
}

async function verifyBetterAuth17Upgrade(migrationEntries, programmeMigrationIndex) {
  const migration0020Index = migrationEntries.indexOf("0020_commercial_ops_01");
  const migration0021Index = migrationEntries.indexOf("0021_partner_ops_work_bridge_01");
  const migration0022Index = migrationEntries.indexOf("0022_better_auth_17_schema_upgrade");
  if (
    migration0020Index < programmeMigrationIndex
    || migration0021Index !== migration0020Index + 1
    || migration0022Index !== migration0021Index + 1
  ) {
    throw new Error("Expected sequential migrations 0020, 0021 and 0022");
  }

  const schema = "better_auth_17_upgrade_ci";
  const databaseUrl = databaseUrlForSchema(process.env.DATABASE_URL, schema);
  const directUrl = databaseUrlForSchema(process.env.DIRECT_URL, schema);
  const environment = { DATABASE_URL: databaseUrl, DIRECT_URL: directUrl };

  const preProgramme = await stageMigrations(
    migrationEntries.slice(0, programmeMigrationIndex),
  );
  try {
    run("npx", [
      "prisma",
      "migrate",
      "deploy",
      "--schema",
      path.join(preProgramme, "schema.prisma"),
    ], environment);
    run("npx", [
      "prisma",
      "db",
      "execute",
      "--schema",
      "prisma/schema.prisma",
      "--file",
      "prisma/preflight/0015_active_control_program_flow.sql",
    ], environment);
  } finally {
    await rm(preProgramme, { recursive: true, force: true });
  }

  const through0020 = await stageMigrations(
    migrationEntries.slice(0, migration0020Index + 1),
  );
  try {
    run("npx", [
      "prisma",
      "migrate",
      "deploy",
      "--schema",
      path.join(through0020, "schema.prisma"),
    ], environment);
    run("npx", [
      "prisma",
      "db",
      "execute",
      "--schema",
      path.join(through0020, "schema.prisma"),
      "--file",
      "prisma/fixtures/0022_post_0020_accounts.sql",
    ], environment);
  } finally {
    await rm(through0020, { recursive: true, force: true });
  }

  const through0021 = await stageMigrations(
    migrationEntries.slice(0, migration0021Index + 1),
  );
  try {
    run("npx", [
      "prisma",
      "migrate",
      "deploy",
      "--schema",
      path.join(through0021, "schema.prisma"),
    ], environment);
    run("npx", [
      "prisma",
      "db",
      "execute",
      "--schema",
      path.join(through0021, "schema.prisma"),
      "--file",
      "prisma/fixtures/0022_post_0021_oauth.sql",
    ], environment);
  } finally {
    await rm(through0021, { recursive: true, force: true });
  }

  run("npx", ["prisma", "migrate", "deploy"], environment);

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    const accounts = await prisma.account.findMany({
      where: { id: { in: ["ba17-credential-account", "ba17-google-account"] } },
      orderBy: { id: "asc" },
      select: { id: true, issuer: true, accountId: true, userId: true },
    });
    if (
      accounts.length !== 2
      || accounts.find((account) => account.id === "ba17-credential-account")?.issuer !== "local:credential"
      || accounts.find((account) => account.id === "ba17-google-account")?.issuer !== "https://accounts.google.com"
    ) {
      throw new Error("Better Auth 1.7 account issuer backfill verification failed");
    }

    const [users, adminUser, commercialOpportunity, client, resource, clientResource, refreshToken, accessToken, consent] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: ["ba17-credential-user", "ba17-google-user"] } },
        orderBy: { id: "asc" },
        select: { id: true, email: true },
      }),
      prisma.adminUser.findUniqueOrThrow({
        where: { id: "00000000-0000-4000-8000-000000000222" },
        select: { userId: true, role: true },
      }),
      prisma.commercialOpportunity.findUniqueOrThrow({
        where: { id: "00000000-0000-4000-8000-000000000223" },
        include: { evidence: true },
      }),
      prisma.oauthClient.findUniqueOrThrow({ where: { clientId: "ba17-chatgpt-client" } }),
      prisma.oauthResource.findUniqueOrThrow({
        where: { identifier: "http://localhost:4173/api/mcp/commercial" },
      }),
      prisma.oauthClientResource.findUniqueOrThrow({
        where: {
          clientId_resourceId: {
            clientId: "ba17-chatgpt-client",
            resourceId: "http://localhost:4173/api/mcp/commercial",
          },
        },
      }),
      prisma.oauthRefreshToken.findUniqueOrThrow({ where: { id: "ba17-refresh-row" } }),
      prisma.oauthAccessToken.findUniqueOrThrow({ where: { id: "ba17-access-row" } }),
      prisma.oauthConsent.findUniqueOrThrow({ where: { id: "ba17-consent-row" } }),
    ]);
    const expectedResources = ["http://localhost:4173/api/mcp/commercial"];
    if (
      users.length !== 2
      || adminUser.userId !== "ba17-credential-user"
      || adminUser.role !== "AFFILIATE_MANAGER"
      || commercialOpportunity.stage !== "PROSPECT"
      || commercialOpportunity.evidence.length !== 1
      || commercialOpportunity.evidence[0].claim !== "This isolated fixture verifies Commercial data preservation only."
      || client.applicationType !== "web"
      || client.clientCredentialsScopes.length !== 0
      || resource.disabled
      || clientResource.clientId !== client.clientId
      || JSON.stringify(refreshToken.resources) !== JSON.stringify(expectedResources)
      || JSON.stringify(accessToken.resources) !== JSON.stringify(expectedResources)
      || JSON.stringify(consent.resources) !== JSON.stringify(expectedResources)
    ) {
      throw new Error("Better Auth 1.7 protected-resource backfill verification failed");
    }

    await prisma.$executeRawUnsafe(`
      INSERT INTO "${schema}"."User" (
        "id", "name", "email", "emailVerified", "createdAt", "updatedAt"
      ) VALUES (
        'ba17-legacy-overlap-user',
        'Legacy overlap fixture',
        'ba17-overlap@invalid.example',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `);
    await prisma.$executeRawUnsafe(`
      INSERT INTO "${schema}"."Account" (
        "id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt"
      ) VALUES (
        'ba17-legacy-overlap-account',
        'ba17-legacy-overlap-user',
        'credential',
        'ba17-legacy-overlap-user',
        'synthetic-password-hash',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `);
    const overlap = await prisma.account.findUniqueOrThrow({
      where: { id: "ba17-legacy-overlap-account" },
    });
    if (overlap.issuer !== "local:credential") {
      throw new Error("Better Auth 1.6 overlap compatibility verification failed");
    }

    await prisma.$executeRawUnsafe(`
      INSERT INTO "${schema}"."User" (
        "id", "name", "email", "emailVerified", "createdAt", "updatedAt"
      ) VALUES (
        'ba17-legacy-google-overlap-user',
        'Legacy Google overlap fixture',
        'ba17-google-overlap@invalid.example',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `);
    await prisma.$executeRawUnsafe(`
      INSERT INTO "${schema}"."Account" (
        "id", "accountId", "providerId", "userId", "createdAt", "updatedAt"
      ) VALUES (
        'ba17-legacy-google-overlap-account',
        'legacy-google-subject-fixture',
        'google',
        'ba17-legacy-google-overlap-user',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `);
    const googleOverlap = await prisma.account.findUniqueOrThrow({
      where: { id: "ba17-legacy-google-overlap-account" },
    });
    if (googleOverlap.issuer !== "https://accounts.google.com") {
      throw new Error("Better Auth 1.6 Google overlap compatibility verification failed");
    }

    let duplicateRejected = false;
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "${schema}"."Account" (
          "id", "issuer", "accountId", "providerId", "userId", "createdAt", "updatedAt"
        ) VALUES (
          'ba17-duplicate-account',
          'https://accounts.google.com',
          'google-subject-fixture',
          'google',
          'ba17-google-user',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `);
    } catch {
      duplicateRejected = true;
    }
    if (!duplicateRejected) {
      throw new Error("Better Auth 1.7 duplicate issuer identity was not rejected");
    }

    console.info("Better Auth 1.7 staged migration smoke passed", {
      startingMigration: "0020_commercial_ops_01",
      appliedInOrder: [
        "0021_partner_ops_work_bridge_01",
        "0022_better_auth_17_schema_upgrade",
      ],
      usersPreserved: users.length,
      accountsPreserved: accounts.length,
      adminUsersPreserved: 1,
      commercialOpportunitiesPreserved: 1,
      commercialEvidenceRowsPreserved: commercialOpportunity.evidence.length,
      protectedResources: 1,
      clientCredentialsScopes: client.clientCredentialsScopes.length,
      legacyOverlapIssuers: [overlap.issuer, googleOverlap.issuer],
      duplicateIdentityRejected: duplicateRejected,
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyUnsupportedAccountRefusal(migrationEntries, programmeMigrationIndex) {
  const migration0021Index = migrationEntries.indexOf("0021_partner_ops_work_bridge_01");
  const schema = "better_auth_17_unsupported_account_ci";
  const databaseUrl = databaseUrlForSchema(process.env.DATABASE_URL, schema);
  const directUrl = databaseUrlForSchema(process.env.DIRECT_URL, schema);
  const environment = { DATABASE_URL: databaseUrl, DIRECT_URL: directUrl };
  const preProgramme = await stageMigrations(migrationEntries.slice(0, programmeMigrationIndex));
  try {
    run("npx", ["prisma", "migrate", "deploy", "--schema", path.join(preProgramme, "schema.prisma")], environment);
    run("npx", [
      "prisma",
      "db",
      "execute",
      "--schema",
      "prisma/schema.prisma",
      "--file",
      "prisma/preflight/0015_active_control_program_flow.sql",
    ], environment);
  } finally {
    await rm(preProgramme, { recursive: true, force: true });
  }

  const through0021 = await stageMigrations(migrationEntries.slice(0, migration0021Index + 1));
  try {
    run("npx", ["prisma", "migrate", "deploy", "--schema", path.join(through0021, "schema.prisma")], environment);
  } finally {
    await rm(through0021, { recursive: true, force: true });
  }

  const unsupportedFixture = await mkdtemp(path.join(tmpdir(), "sevenbet-unsupported-account-"));
  const unsupportedSql = path.join(unsupportedFixture, "fixture.sql");
  try {
    await copyFile("prisma/fixtures/0022_unsupported_account.sql", unsupportedSql);
    run("npx", ["prisma", "db", "execute", "--schema", "prisma/schema.prisma", "--file", unsupportedSql], environment);
    runExpectFailure("npx", ["prisma", "migrate", "deploy"], environment);
  } finally {
    await rm(unsupportedFixture, { recursive: true, force: true });
  }

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT "providerId", "accountId", "userId"
      FROM "${schema}"."Account"
      WHERE "id" = 'ba17-unsupported-account'
    `);
    if (
      rows.length !== 1
      || rows[0].providerId !== "unsupported-provider"
      || rows[0].accountId !== "unsupported-subject"
      || rows[0].userId !== "ba17-unsupported-user"
    ) {
      throw new Error("Unsupported legacy Account row was modified during refused migration");
    }
    console.info("Better Auth 1.7 unsupported Account refusal passed", {
      providerPreserved: rows[0].providerId,
      migrationRefused: true,
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  if (process.env.CI !== "true") {
    throw new Error("Migration verification is restricted to an explicit CI environment");
  }

  assertDisposableDatabase("DATABASE_URL");
  assertDisposableDatabase("DIRECT_URL");

  run("npx", ["prisma", "validate"]);
  run("npx", ["prisma", "generate"]);

  const migrationEntries = (await readdir("prisma/migrations", {
    withFileTypes: true,
  }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const programmeMigration = "0015_active_control_program_flow";
  const programmeMigrationIndex = migrationEntries.indexOf(programmeMigration);
  if (programmeMigrationIndex < 1) {
    throw new Error(`Expected historical migration ${programmeMigration}`);
  }

  // Migration 0015 adds and then uses a PostgreSQL enum value. On a clean
  // database PostgreSQL requires a commit between those operations. Replay
  // the unchanged prior Prisma history first, commit the approved idempotent
  // preflight, then let normal migrate deploy apply 0015 and everything later.
  const stagedSchemaDirectory = await mkdtemp(
    path.join(tmpdir(), "sevenbet-ci-migrations-"),
  );
  try {
    const stagedMigrations = path.join(stagedSchemaDirectory, "migrations");
    await mkdir(stagedMigrations);
    await copyFile(
      "prisma/schema.prisma",
      path.join(stagedSchemaDirectory, "schema.prisma"),
    );
    for (const migration of migrationEntries.slice(0, programmeMigrationIndex)) {
      await cp(
        path.join("prisma/migrations", migration),
        path.join(stagedMigrations, migration),
        { recursive: true },
      );
    }

    run("npx", [
      "prisma",
      "migrate",
      "deploy",
      "--schema",
      path.join(stagedSchemaDirectory, "schema.prisma"),
    ]);
    run("npx", [
      "prisma",
      "db",
      "execute",
      "--schema",
      "prisma/schema.prisma",
      "--file",
      "prisma/preflight/0015_active_control_program_flow.sql",
    ]);
    run("npx", ["prisma", "migrate", "deploy"]);
  } finally {
    await rm(stagedSchemaDirectory, { recursive: true, force: true });
  }

  await verifyBetterAuth17Upgrade(migrationEntries, programmeMigrationIndex);
  await verifyUnsupportedAccountRefusal(migrationEntries, programmeMigrationIndex);

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const migrationDirectories = migrationEntries.length;
    const appliedRows = await prisma.$queryRawUnsafe(
      'SELECT COUNT(*)::int AS "count" FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL',
    );
    const appliedMigrations = Number(appliedRows[0]?.count ?? 0);
    if (appliedMigrations !== migrationDirectories) {
      throw new Error(
        `Expected ${migrationDirectories} applied migrations, found ${appliedMigrations}`,
      );
    }

    const [users, casinos, missionProgress] = await Promise.all([
      prisma.user.count(),
      prisma.casino.count(),
      prisma.programmeMissionProgress.count(),
    ]);
    console.info("Ephemeral migration smoke passed", {
      appliedMigrations,
      representativeRows: { users, casinos, missionProgress },
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Migration verification failed");
  process.exitCode = 1;
});
