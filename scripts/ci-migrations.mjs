import { spawnSync } from "node:child_process";
import { copyFile, cp, mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const allowedHosts = new Set(["127.0.0.1", "localhost"]);
const allowedPorts = new Set(["5432", "54329"]);
const expectedPr6ForeignKeyGraph = [
  "oauthAccessToken_clientId_fkey|oauthAccessToken|oauthClient|CASCADE|CASCADE",
  "oauthAccessToken_refreshId_fkey|oauthAccessToken|oauthRefreshToken|CASCADE|CASCADE",
  "oauthAccessToken_sessionId_fkey|oauthAccessToken|Session|SET NULL|CASCADE",
  "oauthAccessToken_userId_fkey|oauthAccessToken|User|CASCADE|CASCADE",
  "oauthClientResource_clientId_fkey|oauthClientResource|oauthClient|CASCADE|CASCADE",
  "oauthClientResource_resourceId_fkey|oauthClientResource|oauthResource|CASCADE|CASCADE",
  "oauthClient_userId_fkey|oauthClient|User|CASCADE|CASCADE",
  "oauthConsent_clientId_fkey|oauthConsent|oauthClient|CASCADE|CASCADE",
  "oauthConsent_userId_fkey|oauthConsent|User|CASCADE|CASCADE",
  "oauthRefreshToken_clientId_fkey|oauthRefreshToken|oauthClient|CASCADE|CASCADE",
  "oauthRefreshToken_sessionId_fkey|oauthRefreshToken|Session|SET NULL|CASCADE",
  "oauthRefreshToken_userId_fkey|oauthRefreshToken|User|CASCADE|CASCADE",
];

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

async function deployMigrationPrefix(migrationEntries, inclusiveIndex, environment) {
  const staged = await stageMigrations(migrationEntries.slice(0, inclusiveIndex + 1));
  try {
    run("npx", ["prisma", "migrate", "deploy", "--schema", path.join(staged, "schema.prisma")], environment);
  } finally {
    await rm(staged, { recursive: true, force: true });
  }
}

async function verifyBetterAuth17Upgrade(migrationEntries, programmeMigrationIndex) {
  const migration0020Index = migrationEntries.indexOf("0020_commercial_ops_01");
  const migration0021Index = migrationEntries.indexOf("0021_partner_ops_work_bridge_01");
  const migration0022Index = migrationEntries.indexOf("0022_better_auth_17_schema_upgrade");
  const migration0040Index = migrationEntries.indexOf("0040_commercial_core_exact_routes_geo_simplification");
  const migration0041Index = migrationEntries.indexOf("0041_commercial_core_legacy_connector_cleanup");
  const migration0042Index = migrationEntries.indexOf("0042_admin_mfa");
  if (
    migration0020Index < programmeMigrationIndex
    || migration0021Index !== migration0020Index + 1
    || migration0022Index !== migration0021Index + 1
    || migration0041Index !== migration0040Index + 1
    || migration0042Index !== migration0041Index + 1
    || migration0042Index !== migrationEntries.length - 1
  ) {
    throw new Error("Expected sequential migrations 0020-0022 and exact latest Admin MFA migration 0042");
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

  await deployMigrationPrefix(migrationEntries, migration0040Index, environment);

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

    const [
      users,
      adminUser,
      commercialOpportunity,
      clientRows,
      resourceRows,
      clientResourceRows,
      refreshTokenRows,
      accessTokenRows,
      consentRows,
    ] = await Promise.all([
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
      prisma.$queryRawUnsafe(`
        SELECT "applicationType", cardinality("clientCredentialsScopes")::int AS "scopeCount"
        FROM "${schema}"."oauthClient"
        WHERE "clientId" = 'ba17-chatgpt-client'
      `),
      prisma.$queryRawUnsafe(`
        SELECT "disabled"
        FROM "${schema}"."oauthResource"
        WHERE "identifier" = 'http://localhost:4173/api/mcp/commercial'
      `),
      prisma.$queryRawUnsafe(`
        SELECT 1 AS "present"
        FROM "${schema}"."oauthClientResource"
        WHERE "clientId" = 'ba17-chatgpt-client'
          AND "resourceId" = 'http://localhost:4173/api/mcp/commercial'
      `),
      prisma.$queryRawUnsafe(`
        SELECT "resources"
        FROM "${schema}"."oauthRefreshToken"
        WHERE "id" = 'ba17-refresh-row'
      `),
      prisma.$queryRawUnsafe(`
        SELECT "resources"
        FROM "${schema}"."oauthAccessToken"
        WHERE "id" = 'ba17-access-row'
      `),
      prisma.$queryRawUnsafe(`
        SELECT "resources"
        FROM "${schema}"."oauthConsent"
        WHERE "id" = 'ba17-consent-row'
      `),
    ]);
    const client = clientRows[0];
    const resource = resourceRows[0];
    const clientResource = clientResourceRows[0];
    const refreshToken = refreshTokenRows[0];
    const accessToken = accessTokenRows[0];
    const consent = consentRows[0];
    const expectedResources = ["http://localhost:4173/api/mcp/commercial"];
    if (
      users.length !== 2
      || adminUser.userId !== "ba17-credential-user"
      || adminUser.role !== "AFFILIATE_MANAGER"
      || commercialOpportunity.stage !== "PROSPECT"
      || commercialOpportunity.evidence.length !== 1
      || commercialOpportunity.evidence[0].claim !== "This isolated fixture verifies Commercial data preservation only."
      || client?.applicationType !== "web"
      || client.scopeCount !== 0
      || resource?.disabled
      || clientResource?.present !== 1
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
      clientCredentialsScopes: client.scopeCount,
      legacyOverlapIssuers: [overlap.issuer, googleOverlap.issuer],
      duplicateIdentityRejected: duplicateRejected,
    });

    const [preCleanupEvidence] = await prisma.$queryRawUnsafe(`
      SELECT
        (SELECT count(*) FROM "${schema}"."oauthClient")
        + (SELECT count(*) FROM "${schema}"."oauthResource")
        + (SELECT count(*) FROM "${schema}"."oauthClientResource")
        + (SELECT count(*) FROM "${schema}"."oauthRefreshToken")
        + (SELECT count(*) FROM "${schema}"."oauthAccessToken")
        + (SELECT count(*) FROM "${schema}"."oauthConsent")
        + (SELECT count(*) FROM "${schema}"."oauthClientAssertion")
        + (SELECT count(*) FROM "${schema}"."CommercialMcpRateLimitBucket") AS "rowCount",
        (
          SELECT count(*)::int
          FROM pg_class AS relation
          INNER JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
          WHERE namespace.nspname = '${schema}'
            AND relation.relkind IN ('r', 'p')
            AND relation.relname IN (
              'oauthClient', 'oauthResource', 'oauthClientResource', 'oauthRefreshToken',
              'oauthAccessToken', 'oauthConsent', 'oauthClientAssertion',
              'CommercialMcpRateLimitBucket'
            )
        ) AS "targetTables",
        (
          SELECT count(*)::int
          FROM pg_trigger AS trigger
          INNER JOIN pg_class AS relation ON relation.oid = trigger.tgrelid
          INNER JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
          WHERE namespace.nspname = '${schema}'
            AND NOT trigger.tgisinternal
            AND trigger.tgname IN (
              'oauthClient_prepare_compat', 'oauthClient_resource_compat',
              'oauthRefreshToken_resource_compat', 'oauthAccessToken_resource_compat',
              'oauthConsent_resource_compat'
            )
        ) AS "targetTriggers",
        (
          SELECT count(*)::int
          FROM pg_proc AS procedure
          INNER JOIN pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
          WHERE namespace.nspname = '${schema}'
            AND procedure.proname IN (
              'prepare_better_auth_oauth_client_compat',
              'sync_better_auth_oauth_client_resource_compat',
              'set_better_auth_oauth_resource_compat'
            )
        ) AS "targetFunctions",
        (
          SELECT count(*)::int
          FROM pg_constraint AS fk_constraint
          INNER JOIN pg_class AS source ON source.oid = fk_constraint.conrelid
          INNER JOIN pg_namespace AS source_namespace ON source_namespace.oid = source.relnamespace
          INNER JOIN pg_class AS target ON target.oid = fk_constraint.confrelid
          INNER JOIN pg_namespace AS target_namespace ON target_namespace.oid = target.relnamespace
          WHERE fk_constraint.contype = 'f'
            AND source_namespace.nspname = '${schema}'
            AND target_namespace.nspname = '${schema}'
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
        ) AS "targetForeignKeys"
    `);
    const preCleanupForeignKeys = await prisma.$queryRawUnsafe(`
      SELECT concat_ws(
        '|',
        fk_constraint.conname,
        source.relname,
        target.relname,
        CASE fk_constraint.confdeltype
          WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE'
          WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT'
        END,
        CASE fk_constraint.confupdtype
          WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE'
          WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT'
        END
      ) AS "key"
      FROM pg_constraint AS fk_constraint
      INNER JOIN pg_class AS source ON source.oid = fk_constraint.conrelid
      INNER JOIN pg_namespace AS source_namespace ON source_namespace.oid = source.relnamespace
      INNER JOIN pg_class AS target ON target.oid = fk_constraint.confrelid
      INNER JOIN pg_namespace AS target_namespace ON target_namespace.oid = target.relnamespace
      WHERE fk_constraint.contype = 'f'
        AND source_namespace.nspname = '${schema}'
        AND target_namespace.nspname = '${schema}'
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
    if (
      Number(preCleanupEvidence?.rowCount ?? 0) < 6
      || preCleanupEvidence.targetTables !== 8
      || preCleanupEvidence.targetTriggers !== 5
      || preCleanupEvidence.targetFunctions !== 3
      || preCleanupEvidence.targetForeignKeys !== 12
      || JSON.stringify(preCleanupForeignKeys.map((foreignKey) => foreignKey.key))
        !== JSON.stringify(expectedPr6ForeignKeyGraph)
    ) {
      throw new Error("PR6 staged migration fixture did not preserve the reviewed connector graph through 0040");
    }

    run("npx", ["prisma", "migrate", "deploy"], environment);

    const [cleanupEvidence] = await prisma.$queryRawUnsafe(`
      SELECT
        (
          SELECT count(*)::int
          FROM pg_class AS relation
          INNER JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
          WHERE namespace.nspname = '${schema}'
            AND relation.relkind IN ('r', 'p')
            AND relation.relname IN (
              'oauthClient', 'oauthResource', 'oauthClientResource', 'oauthRefreshToken',
              'oauthAccessToken', 'oauthConsent', 'oauthClientAssertion',
              'CommercialMcpRateLimitBucket'
            )
        ) AS "retiredTables",
        (
          SELECT count(*)::int
          FROM pg_trigger AS trigger
          INNER JOIN pg_class AS relation ON relation.oid = trigger.tgrelid
          INNER JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
          WHERE namespace.nspname = '${schema}'
            AND trigger.tgname IN (
              'oauthClient_prepare_compat', 'oauthClient_resource_compat',
              'oauthRefreshToken_resource_compat', 'oauthAccessToken_resource_compat',
              'oauthConsent_resource_compat'
            )
        ) AS "retiredTriggers",
        (
          SELECT count(*)::int
          FROM pg_proc AS procedure
          INNER JOIN pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
          WHERE namespace.nspname = '${schema}'
            AND procedure.proname IN (
              'prepare_better_auth_oauth_client_compat',
              'sync_better_auth_oauth_client_resource_compat',
              'set_better_auth_oauth_resource_compat'
            )
        ) AS "retiredFunctions",
        (
          SELECT count(*)::int
          FROM pg_class AS relation
          INNER JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
          WHERE namespace.nspname = '${schema}'
            AND relation.relkind IN ('r', 'p')
            AND relation.relname IN ('User', 'Session', 'Account', 'Verification', 'AuditLog')
        ) AS "keepTables",
        (
          SELECT count(*)::int
          FROM information_schema.columns
          WHERE table_schema = '${schema}'
            AND table_name = 'Account'
            AND column_name = 'issuer'
            AND is_nullable = 'NO'
        ) AS "issuerColumns",
        (
          SELECT count(*)::int
          FROM pg_class AS index_relation
          INNER JOIN pg_namespace AS namespace ON namespace.oid = index_relation.relnamespace
          INNER JOIN pg_index AS index ON index.indexrelid = index_relation.oid
          WHERE namespace.nspname = '${schema}'
            AND index_relation.relname = 'account_issuer_accountId_uidx'
            AND index.indisunique
        ) AS "issuerIndexes",
        (
          SELECT count(*)::int
          FROM pg_trigger AS trigger
          INNER JOIN pg_class AS relation ON relation.oid = trigger.tgrelid
          INNER JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
          INNER JOIN pg_proc AS procedure ON procedure.oid = trigger.tgfoid
          WHERE namespace.nspname = '${schema}'
            AND relation.relname = 'Account'
            AND trigger.tgname = 'Account_better_auth_issuer_compat'
            AND procedure.proname = 'set_better_auth_account_issuer'
            AND trigger.tgenabled <> 'D'
            AND NOT trigger.tgisinternal
        ) AS "accountCompatibilityTriggers",
        (
          SELECT count(*)::int
          FROM pg_proc AS procedure
          INNER JOIN pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
          WHERE namespace.nspname = '${schema}'
            AND procedure.proname = 'set_better_auth_account_issuer'
            AND pg_get_function_result(procedure.oid) = 'trigger'
        ) AS "accountCompatibilityFunctions"
    `);
    if (
      cleanupEvidence?.retiredTables !== 0
      || cleanupEvidence.retiredTriggers !== 0
      || cleanupEvidence.retiredFunctions !== 0
      || cleanupEvidence.keepTables !== 5
      || cleanupEvidence.issuerColumns !== 1
      || cleanupEvidence.issuerIndexes !== 1
      || cleanupEvidence.accountCompatibilityTriggers !== 1
      || cleanupEvidence.accountCompatibilityFunctions !== 1
      || await prisma.account.count({
        where: { id: { in: [
          "ba17-credential-account",
          "ba17-google-account",
          "ba17-legacy-overlap-account",
          "ba17-legacy-google-overlap-account",
        ] } },
      }) !== 4
    ) {
      throw new Error("PR6 cleanup did not retire the exact connector objects while preserving auth identity");
    }
    console.info("PR6 legacy connector cleanup staged migration passed", {
      from: "0040_commercial_core_exact_routes_geo_simplification",
      to: "0041_commercial_core_legacy_connector_cleanup",
      representativeConnectorRowsDeleted: Number(preCleanupEvidence.rowCount),
      reviewedForeignKeys: preCleanupEvidence.targetForeignKeys,
      retiredTables: 8,
      retiredTriggers: 5,
      retiredFunctions: 3,
      keepTables: 5,
      accountIdentityPreserved: true,
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyAdminMfaUpgrade(migrationEntries, programmeMigrationIndex) {
  const migration = "0042_admin_mfa";
  const migrationIndex = migrationEntries.indexOf(migration);
  const priorIndex = migrationEntries.indexOf("0041_commercial_core_legacy_connector_cleanup");
  if (migrationIndex !== priorIndex + 1 || migrationIndex !== migrationEntries.length - 1) {
    throw new Error(`Expected ${migration} directly after 0041 and as the exact latest migration`);
  }

  const schema = "admin_mfa_upgrade_ci";
  const databaseUrl = databaseUrlForSchema(process.env.DATABASE_URL, schema);
  const directUrl = databaseUrlForSchema(process.env.DIRECT_URL, schema);
  const environment = { DATABASE_URL: databaseUrl, DIRECT_URL: directUrl };

  const preProgramme = await stageMigrations(
    migrationEntries.slice(0, programmeMigrationIndex),
  );
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

  await deployMigrationPrefix(migrationEntries, priorIndex, environment);

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "${schema}"."User" (
        "id", "name", "email", "emailVerified", "createdAt", "updatedAt"
      ) VALUES (
        'admin-mfa-existing-user',
        'Existing Admin MFA fixture',
        'admin-mfa-existing@invalid.example',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `);
    await prisma.$executeRawUnsafe(`
      INSERT INTO "${schema}"."AdminUser" (
        "id", "userId", "email", "name", "role", "createdAt", "updatedAt"
      ) VALUES (
        '00000000-0000-4000-8000-000000000242',
        'admin-mfa-existing-user',
        'admin-mfa-existing@invalid.example',
        'Existing Admin MFA fixture',
        'SUPER_ADMIN',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `);
    await prisma.$executeRawUnsafe(`
      INSERT INTO "${schema}"."Session" (
        "id", "expiresAt", "token", "createdAt", "updatedAt", "userId"
      ) VALUES (
        'admin-mfa-existing-session',
        CURRENT_TIMESTAMP + INTERVAL '1 day',
        'admin-mfa-existing-session-token',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        'admin-mfa-existing-user'
      )
    `);

    await deployMigrationPrefix(migrationEntries, migrationIndex, environment);

    const [columnEvidence, indexEvidence, foreignKeyEvidence, preservedEvidence] = await Promise.all([
      prisma.$queryRawUnsafe(`
        SELECT "column_name" AS "columnName", "is_nullable" AS "isNullable", "column_default" AS "columnDefault"
        FROM information_schema.columns
        WHERE table_schema = '${schema}'
          AND (
            (table_name = 'User' AND column_name = 'twoFactorEnabled')
            OR (table_name = 'TwoFactor' AND column_name IN (
              'id', 'secret', 'backupCodes', 'userId', 'verified',
              'failedVerificationCount', 'lockedUntil'
            ))
          )
        ORDER BY table_name, column_name
      `),
      prisma.$queryRawUnsafe(`
        SELECT indexname AS "indexName"
        FROM pg_indexes
        WHERE schemaname = '${schema}'
          AND indexname IN ('TwoFactor_pkey', 'TwoFactor_secret_idx', 'TwoFactor_userId_idx')
        ORDER BY indexname
      `),
      prisma.$queryRawUnsafe(`
        SELECT
          fk_constraint.confdeltype AS "deleteAction",
          fk_constraint.confupdtype AS "updateAction"
        FROM pg_constraint AS fk_constraint
        INNER JOIN pg_class AS source ON source.oid = fk_constraint.conrelid
        INNER JOIN pg_namespace AS namespace ON namespace.oid = source.relnamespace
        WHERE namespace.nspname = '${schema}'
          AND fk_constraint.conname = 'TwoFactor_userId_fkey'
      `),
      prisma.$queryRawUnsafe(`
        SELECT
          (SELECT count(*)::int FROM "${schema}"."User" WHERE "id" = 'admin-mfa-existing-user') AS "users",
          (SELECT count(*)::int FROM "${schema}"."AdminUser" WHERE "userId" = 'admin-mfa-existing-user') AS "admins",
          (SELECT count(*)::int FROM "${schema}"."Session" WHERE "userId" = 'admin-mfa-existing-user') AS "sessions",
          (SELECT "twoFactorEnabled" FROM "${schema}"."User" WHERE "id" = 'admin-mfa-existing-user') AS "twoFactorEnabled",
          (SELECT count(*)::int FROM "${schema}"."TwoFactor") AS "twoFactors"
      `),
    ]);

    const defaultByColumn = new Map(columnEvidence.map((column) => [
      column.columnName,
      { default: column.columnDefault, nullable: column.isNullable },
    ]));
    const preserved = preservedEvidence[0];
    if (
      columnEvidence.length !== 8
      || defaultByColumn.get("twoFactorEnabled")?.nullable !== "YES"
      || defaultByColumn.get("twoFactorEnabled")?.default !== "false"
      || defaultByColumn.get("verified")?.default !== "true"
      || defaultByColumn.get("failedVerificationCount")?.default !== "0"
      || JSON.stringify(indexEvidence.map((index) => index.indexName)) !== JSON.stringify([
        "TwoFactor_pkey",
        "TwoFactor_secret_idx",
        "TwoFactor_userId_idx",
      ])
      || foreignKeyEvidence.length !== 1
      || foreignKeyEvidence[0].deleteAction !== "c"
      || foreignKeyEvidence[0].updateAction !== "c"
      || preserved?.users !== 1
      || preserved.admins !== 1
      || preserved.sessions !== 1
      || preserved.twoFactorEnabled !== false
      || preserved.twoFactors !== 0
    ) {
      throw new Error("Admin MFA additive migration shape or preservation verification failed");
    }

    console.info("Admin MFA staged migration smoke passed", {
      from: "0041_commercial_core_legacy_connector_cleanup",
      to: migration,
      preservedUsers: preserved.users,
      preservedAdmins: preserved.admins,
      preservedSessions: preserved.sessions,
      existingUsersEnrolled: preserved.twoFactorEnabled,
      pluginColumns: columnEvidence.length,
      pluginIndexes: indexEvidence.length,
      cascadeForeignKey: true,
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

async function verifyRuntimePartnerMarketSupportUpgrade(migrationEntries, programmeMigrationIndex) {
  const migrationIndex = migrationEntries.indexOf("0036_partner_casino_runtime_market_support");
  const priorIndex = migrationEntries.indexOf("0035_market_activation_exact_market_code");
  if (migrationIndex !== priorIndex + 1) {
    throw new Error("Expected runtime Partner market support migration directly after 0035");
  }
  const schema = "partner_market_support_upgrade_ci";
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

  const through0035 = await stageMigrations(migrationEntries.slice(0, priorIndex + 1));
  try {
    run("npx", ["prisma", "migrate", "deploy", "--schema", path.join(through0035, "schema.prisma")], environment);
  } finally {
    await rm(through0035, { recursive: true, force: true });
  }

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  const actorId = "36000000-0000-4000-8000-000000000001";
  const casinoId = "36000000-0000-4000-8000-000000000002";
  try {
    await prisma.adminUser.create({ data: {
      id: actorId,
      email: "runtime-market-upgrade@invalid.example",
      name: "Runtime market migration fixture",
      role: "AFFILIATE_MANAGER",
    } });
    await prisma.casino.create({ data: {
      id: casinoId,
      title: "Runtime market upgrade fixture",
      slug: "runtime-market-upgrade-fixture",
      domain: "runtime-market-upgrade.invalid",
      status: "DRAFT",
      domainPublicationStatus: "DRAFT",
      createdBy: actorId,
      updatedBy: actorId,
    } });
    await prisma.casinoCountry.create({ data: {
      casinoId,
      countryCode: "PT",
      availability: "AVAILABLE",
      lastVerifiedAt: new Date("2026-09-11T00:00:00.000Z"),
      notes: "0035 preservation fixture",
    } });

    run("npx", ["prisma", "migrate", "deploy"], environment);

    const [preservedProfiles, supportRows] = await Promise.all([
      prisma.casinoCountry.count({ where: { casinoId, countryCode: "PT", notes: "0035 preservation fixture" } }),
      prisma.partnerCasinoMarketSupport.count(),
    ]);
    if (preservedProfiles !== 1 || supportRows !== 0) {
      throw new Error("Runtime Partner market support upgrade did not preserve current schema data");
    }
    console.info("Runtime Partner market support staged upgrade passed", {
      from: "0035_market_activation_exact_market_code",
      to: "0036_partner_casino_runtime_market_support",
      preservedCasinoCountries: preservedProfiles,
      backfilledSupportRows: supportRows,
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyProgrammeAccessUpgrade(migrationEntries) {
  const migrationIndex = migrationEntries.indexOf("0024_programme_access_acceptance");
  if (migrationIndex < 1) throw new Error("Expected migration 0024_programme_access_acceptance");
  const programmeMigrationIndex = migrationEntries.indexOf("0015_active_control_program_flow");
  if (programmeMigrationIndex < 1) throw new Error("Expected migration 0015_active_control_program_flow");
  const schema = "programme_access_upgrade_v2_ci";
  const databaseUrl = databaseUrlForSchema(process.env.DATABASE_URL, schema);
  const directUrl = databaseUrlForSchema(process.env.DIRECT_URL, schema);
  const environment = { DATABASE_URL: databaseUrl, DIRECT_URL: directUrl };
  const preProgramme = await stageMigrations(migrationEntries.slice(0, programmeMigrationIndex));
  try {
    run("npx", ["prisma", "migrate", "deploy", "--schema", path.join(preProgramme, "schema.prisma")], environment);
    run("npx", [
      "prisma", "db", "execute", "--schema", path.join(preProgramme, "schema.prisma"),
      "--file", "prisma/preflight/0015_active_control_program_flow.sql",
    ], environment);
  } finally {
    await rm(preProgramme, { recursive: true, force: true });
  }
  const staged = await stageMigrations(migrationEntries.slice(0, migrationIndex));
  try {
    run("npx", ["prisma", "migrate", "deploy", "--schema", path.join(staged, "schema.prisma")], environment);
    run("npx", [
      "prisma", "db", "execute", "--schema", path.join(staged, "schema.prisma"),
      "--file", "prisma/fixtures/0024_pre_programme_access_acceptance.sql",
    ], environment);
    run("npx", [
      "prisma", "db", "execute", "--schema", path.join(staged, "schema.prisma"),
      "--file", "prisma/preflight/0024_programme_access_acceptance.sql",
    ], environment);
  } finally {
    await rm(staged, { recursive: true, force: true });
  }

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    const snapshot = async () => JSON.parse(JSON.stringify(await Promise.all([
      prisma.programEnrollment.findMany({
        where: { userId: { in: ["access-safe-user", "access-unknown-user"] } },
        orderBy: { userId: "asc" },
        select: { id: true, userId: true, currentStepId: true, programVersionId: true },
      }),
      prisma.programmeMissionProgress.findMany({
        where: { enrollment: { userId: { in: ["access-safe-user", "access-unknown-user"] } } },
        orderBy: { id: "asc" },
        select: { id: true, enrollmentId: true, missionNumber: true, status: true, taskStates: true, completedAt: true },
      }),
      prisma.userXpEvent.findMany({
        where: { userId: { in: ["access-safe-user", "access-unknown-user"] } },
        orderBy: { id: "asc" },
        select: { id: true, userId: true, awardKey: true, xp: true },
      }),
      prisma.programmeStartingPoint.findMany({
        where: { userId: { in: ["access-safe-user", "access-unknown-user"] } },
        select: { id: true, userId: true, enrollmentId: true, startingPoint: true, confirmedAt: true },
      }),
    ])));
    const before = await snapshot();
    run("npx", ["prisma", "migrate", "deploy"], environment);
    run("npx", ["prisma", "migrate", "deploy"], environment);
    const after = await snapshot();
    if (JSON.stringify(after) !== JSON.stringify(before)) {
      throw new Error("Programme access migration changed Programme progress, rewards, currentStep or Starting Point");
    }
    const acceptances = await prisma.programmeAccessAcceptance.findMany({
      where: { userId: { in: ["access-safe-user", "access-unknown-user"] } },
      orderBy: { userId: "asc" },
    });
    if (
      acceptances.length !== 1
      || acceptances[0].userId !== "access-safe-user"
      || acceptances[0].source !== "PROGRAM_AI_CLAIM_BACKFILL"
      || acceptances[0].termsVersionAtAcceptance !== null
      || acceptances[0].privacyVersionAtAcceptance !== null
      || acceptances[0].adultSelfAttestedAt.toISOString() !== "2026-08-01T12:00:00.000Z"
    ) {
      throw new Error("Programme access compatibility backfill was not conservative and deterministic");
    }
    console.info("Programme access staged migration smoke passed", {
      safeBackfills: acceptances.length,
      unknownEnrollmentsBackfilled: 0,
      progressAndRewardsPreserved: true,
      replayIdempotent: true,
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyCasinoMarketProfileUpgrade(migrationEntries, programmeMigrationIndex) {
  const marketMigration = "0025_casino_market_profile_architecture";
  const migrationIndex = migrationEntries.indexOf(marketMigration);
  if (migrationIndex < 1) throw new Error(`Expected migration ${marketMigration}`);
  const schema = "casino_market_profile_upgrade_ci";
  const databaseUrl = databaseUrlForSchema(process.env.DATABASE_URL, schema);
  const directUrl = databaseUrlForSchema(process.env.DIRECT_URL, schema);
  const environment = { DATABASE_URL: databaseUrl, DIRECT_URL: directUrl };

  const beforeProgramme = await stageMigrations(migrationEntries.slice(0, programmeMigrationIndex));
  try {
    run("npx", ["prisma", "migrate", "deploy", "--schema", path.join(beforeProgramme, "schema.prisma")], environment);
    run("npx", ["prisma", "db", "execute", "--schema", "prisma/schema.prisma", "--file", "prisma/preflight/0015_active_control_program_flow.sql"], environment);
  } finally {
    await rm(beforeProgramme, { recursive: true, force: true });
  }

  const beforeMarket = await stageMigrations(migrationEntries.slice(0, migrationIndex));
  try {
    run("npx", ["prisma", "migrate", "deploy", "--schema", path.join(beforeMarket, "schema.prisma")], environment);
    run("npx", ["prisma", "db", "execute", "--schema", path.join(beforeMarket, "schema.prisma"), "--file", "prisma/fixtures/0025_pre_casino_market_profile.sql"], environment);
  } finally {
    await rm(beforeMarket, { recursive: true, force: true });
  }

  run("npx", ["prisma", "migrate", "deploy"], environment);
  run("npx", ["prisma", "migrate", "deploy"], environment);

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT
        (SELECT COUNT(*)::int FROM "${schema}"."Casino" WHERE "id" = '25000000-0000-4000-8000-000000000001') AS "casinos",
        (SELECT COUNT(*)::int FROM "${schema}"."CasinoCountry" WHERE "casinoId" = '25000000-0000-4000-8000-000000000001') AS "markets",
        (SELECT COUNT(*)::int FROM "${schema}"."CasinoLicense" WHERE "casinoId" = '25000000-0000-4000-8000-000000000001') AS "licenses",
        (SELECT COUNT(*)::int FROM "${schema}"."CasinoPaymentMethod" WHERE "casinoId" = '25000000-0000-4000-8000-000000000001' AND "casinoCountryId" IS NULL) AS "legacyPayments",
        (SELECT COUNT(*)::int FROM "${schema}"."CasinoGameProvider" WHERE "casinoId" = '25000000-0000-4000-8000-000000000001' AND "casinoCountryId" IS NULL) AS "legacyProviders",
        (SELECT COUNT(*)::int FROM "${schema}"."CasinoGameCategory" WHERE "casinoId" = '25000000-0000-4000-8000-000000000001' AND "casinoCountryId" IS NULL) AS "legacyCategories",
        (SELECT COUNT(*)::int FROM "${schema}"."CasinoBonus" WHERE "casinoId" = '25000000-0000-4000-8000-000000000001' AND "casinoCountryId" IS NULL) AS "legacyBonuses",
        (SELECT COUNT(*)::int FROM "${schema}"."CasinoCountryLicense" WHERE "casinoId" = '25000000-0000-4000-8000-000000000001') AS "inferredLicenseLinks"
    `);
    const result = rows[0];
    if (!result || [result.casinos, result.markets, result.licenses, result.legacyPayments, result.legacyProviders, result.legacyCategories, result.legacyBonuses].some((count) => Number(count) !== 1)
      || Number(result.inferredLicenseLinks) !== 0) {
      throw new Error("Casino market profile upgrade did not preserve legacy records without inferred GEO links");
    }
    const profile = await prisma.$queryRawUnsafe(`
      SELECT "localDomain", "primaryLanguage", "primaryCurrency", "supportedLanguages", "supportedCurrencies"
      FROM "${schema}"."CasinoCountry"
      WHERE "id" = '25000000-0000-4000-8000-000000000002'
    `);
    if (!profile[0] || profile[0].localDomain !== null || profile[0].primaryLanguage !== null || profile[0].primaryCurrency !== null
      || profile[0].supportedLanguages.length !== 0 || profile[0].supportedCurrencies.length !== 0) {
      throw new Error("Casino market profile migration invented values for previously unknown facts");
    }
    console.info("Casino market profile staged migration smoke passed", {
      preserved: { casinos: 1, markets: 1, licenses: 1, legacyPayments: 1, legacyProviders: 1, legacyCategories: 1, legacyBonuses: 1 },
      inferredGeoLinks: 0,
      duplicateMarketProfiles: 0,
      replayIdempotent: true,
      unknownFactsPreserved: true,
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyCommercialPlatformUpgrade(migrationEntries, programmeMigrationIndex) {
  const migration = "0026_commercial_platform_completion";
  const migrationIndex = migrationEntries.indexOf(migration);
  if (migrationIndex < 1) throw new Error(`Expected migration ${migration}`);
  const schema = "commercial_platform_upgrade_ci";
  const databaseUrl = databaseUrlForSchema(process.env.DATABASE_URL, schema);
  const directUrl = databaseUrlForSchema(process.env.DIRECT_URL, schema);
  const environment = { DATABASE_URL: databaseUrl, DIRECT_URL: directUrl };

  const beforeProgramme = await stageMigrations(migrationEntries.slice(0, programmeMigrationIndex));
  try {
    run("npx", ["prisma", "migrate", "deploy", "--schema", path.join(beforeProgramme, "schema.prisma")], environment);
    run("npx", ["prisma", "db", "execute", "--schema", path.join(beforeProgramme, "schema.prisma"), "--file", "prisma/preflight/0015_active_control_program_flow.sql"], environment);
  } finally {
    await rm(beforeProgramme, { recursive: true, force: true });
  }

  const beforeCommercialPlatform = await stageMigrations(migrationEntries.slice(0, migrationIndex));
  try {
    run("npx", ["prisma", "migrate", "deploy", "--schema", path.join(beforeCommercialPlatform, "schema.prisma")], environment);
    for (const fixture of [
      "prisma/fixtures/0024_pre_programme_access_acceptance.sql",
      "prisma/fixtures/0025_pre_casino_market_profile.sql",
      "prisma/fixtures/0026_pre_commercial_platform_completion.sql",
      "prisma/fixtures/0027_pre_placement_media_assignments.sql",
    ]) {
      run("npx", ["prisma", "db", "execute", "--schema", path.join(beforeCommercialPlatform, "schema.prisma"), "--file", fixture], environment);
    }
  } finally {
    await rm(beforeCommercialPlatform, { recursive: true, force: true });
  }

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    const snapshot = async () => JSON.parse(JSON.stringify(await Promise.all([
      prisma.programEnrollment.findMany({
        where: { userId: { in: ["access-safe-user", "access-unknown-user"] } },
        orderBy: { id: "asc" },
        select: { id: true, userId: true, currentStepId: true, programVersionId: true },
      }),
      prisma.programmeMissionProgress.findMany({
        where: { enrollment: { userId: { in: ["access-safe-user", "access-unknown-user"] } } },
        orderBy: { id: "asc" },
        select: { id: true, enrollmentId: true, missionNumber: true, status: true, taskStates: true, completedAt: true },
      }),
      prisma.userXpEvent.findMany({
        where: { userId: { in: ["access-safe-user", "access-unknown-user"] } },
        orderBy: { id: "asc" },
        select: { id: true, userId: true, awardKey: true, xp: true },
      }),
      prisma.programmeStartingPoint.findMany({
        where: { userId: { in: ["access-safe-user", "access-unknown-user"] } },
        orderBy: { id: "asc" },
        select: { id: true, userId: true, enrollmentId: true, startingPoint: true, confirmedAt: true },
      }),
      prisma.casino.findMany({
        where: { id: "25000000-0000-4000-8000-000000000001" },
        select: { id: true, slug: true, status: true, publishedVersion: true, draftVersion: true },
      }),
      prisma.casinoCountry.findMany({
        where: { id: "25000000-0000-4000-8000-000000000002" },
        select: { id: true, casinoId: true, countryCode: true, availability: true },
      }),
      prisma.affiliateNetwork.findMany({
        where: { id: "26000000-0000-4000-8000-000000000001" },
        select: { id: true, slug: true, type: true, active: true },
      }),
      prisma.affiliateProgram.findMany({
        where: { id: "26000000-0000-4000-8000-000000000002" },
        select: { id: true, networkId: true, casinoId: true, status: true, supportedCountries: true, supportedCurrencies: true },
      }),
      prisma.affiliateOffer.findMany({
        where: { id: "26000000-0000-4000-8000-000000000003" },
        select: { id: true, programId: true, casinoId: true, casinoBonusId: true, status: true, payoutAmount: true, metadata: true },
      }),
      prisma.affiliateTrackingLink.findMany({
        where: { id: "26000000-0000-4000-8000-000000000006" },
        select: { id: true, offerId: true, externalLinkId: true, trackingUrl: true, active: true, metadata: true },
      }),
      prisma.affiliateTrackingLinkCountry.findMany({
        where: { id: "26000000-0000-4000-8000-000000000007" },
        select: { id: true, trackingLinkId: true, countryCode: true, mode: true, productionEligible: true },
      }),
      prisma.affiliateRedirectSlug.findMany({
        where: { id: "26000000-0000-4000-8000-000000000008" },
        select: { id: true, slug: true, casinoId: true, casinoBonusId: true, affiliateOfferId: true, active: true },
      }),
      prisma.mediaAsset.findMany({
        where: { id: "27000000-0000-4000-8000-000000000090" },
        select: { id: true, casinoId: true, type: true, storageKey: true, publicUrl: true, checksum: true, status: true },
      }),
    ])));

    const before = await snapshot();
    run("npx", ["prisma", "migrate", "deploy"], environment);
    run("npx", ["prisma", "migrate", "deploy"], environment);
    const after = await snapshot();
    if (JSON.stringify(after) !== JSON.stringify(before)) {
      throw new Error("Commercial platform migration changed protected Programme or existing affiliate routing data");
    }

    const aggregate = await prisma.affiliateOutboundClickDaily.create({
      data: {
        id: "26000000-0000-4000-8000-000000000009",
        day: new Date("2026-09-02T00:00:00.000Z"),
        casinoId: "25000000-0000-4000-8000-000000000001",
        countryCode: "GB",
        redirectSlugId: "26000000-0000-4000-8000-000000000008",
        affiliateOfferId: "26000000-0000-4000-8000-000000000003",
        trackingLinkId: "26000000-0000-4000-8000-000000000006",
        clickCount: 3,
        lastClickedAt: new Date("2026-09-02T12:00:00.000Z"),
      },
      select: { countryCode: true, clickCount: true },
    });
    if (aggregate.countryCode !== "GB" || aggregate.clickCount !== 3) {
      throw new Error("Commercial platform aggregate click table did not accept a valid exact-market counter");
    }

    console.info("Commercial platform staged migration smoke passed", {
      protectedProgrammeDataPreserved: true,
      existingAffiliateRoutingDataPreserved: true,
      existingMediaDataPreservedAcross0027: true,
      aggregateOnlyTableOperational: true,
      replayIdempotent: true,
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyGeoLocalizedCreativeUpgrade(migrationEntries) {
  const migration = "0028_geo_localized_creative_assignments";
  const migrationIndex = migrationEntries.indexOf(migration);
  const programmeMigrationIndex = migrationEntries.indexOf("0015_active_control_program_flow");
  if (migrationIndex < 1 || migrationEntries[migrationIndex - 1] !== "0027_placement_media_assignments") {
    throw new Error(`Expected ${migration} immediately after 0027`);
  }
  const schema = "geo_localized_creative_upgrade_ci";
  const databaseUrl = databaseUrlForSchema(process.env.DATABASE_URL, schema);
  const directUrl = databaseUrlForSchema(process.env.DIRECT_URL, schema);
  const environment = { DATABASE_URL: databaseUrl, DIRECT_URL: directUrl };
  const beforeProgramme = await stageMigrations(migrationEntries.slice(0, programmeMigrationIndex));
  try {
    run("npx", ["prisma", "migrate", "deploy", "--schema", path.join(beforeProgramme, "schema.prisma")], environment);
    run("npx", [
      "prisma", "db", "execute", "--schema", path.join(beforeProgramme, "schema.prisma"),
      "--file", "prisma/preflight/0015_active_control_program_flow.sql",
    ], environment);
  } finally {
    await rm(beforeProgramme, { recursive: true, force: true });
  }
  const through0027 = await stageMigrations(migrationEntries.slice(0, migrationIndex));
  try {
    run("npx", ["prisma", "migrate", "deploy", "--schema", path.join(through0027, "schema.prisma")], environment);
    for (const fixture of [
      "prisma/fixtures/0025_pre_casino_market_profile.sql",
      "prisma/fixtures/0026_pre_commercial_platform_completion.sql",
      "prisma/fixtures/0027_pre_placement_media_assignments.sql",
      "prisma/fixtures/0028_pre_geo_localized_creative_assignments.sql",
    ]) {
      run("npx", ["prisma", "db", "execute", "--schema", path.join(through0027, "schema.prisma"), "--file", fixture], environment);
    }
  } finally {
    await rm(through0027, { recursive: true, force: true });
  }

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  const protectedCounts = async () => {
    const [row] = await prisma.$queryRawUnsafe(`
      SELECT
        (SELECT COUNT(*)::int FROM "${schema}"."Casino") AS casinos,
        (SELECT COUNT(*)::int FROM "${schema}"."CasinoBonus") AS bonuses,
        (SELECT COUNT(*)::int FROM "${schema}"."AffiliateOffer") AS offers,
        (SELECT COUNT(*)::int FROM "${schema}"."MediaAsset") AS assets,
        (SELECT COUNT(*)::int FROM "${schema}"."CasinoMediaAssignment") AS casino_assignments,
        (SELECT COUNT(*)::int FROM "${schema}"."CasinoBonusMediaAssignment") AS bonus_assignments,
        (SELECT COUNT(*)::int FROM "${schema}"."AffiliateOfferMediaAssignment") AS offer_assignments
    `);
    return row;
  };
  try {
    const before = await protectedCounts();
    await deployMigrationPrefix(migrationEntries, migrationIndex, environment);
    const after = await protectedCounts();
    if (JSON.stringify(after) !== JSON.stringify(before)) {
      throw new Error("0028 changed protected entity or assignment counts");
    }
    await deployMigrationPrefix(migrationEntries, migrationIndex, environment);

    const legacy = await prisma.$queryRawUnsafe(`
      SELECT "id", "countryCode", "languageCode"
      FROM "${schema}"."CasinoMediaAssignment"
      WHERE "reference" = '0028-preservation-fixture'
      UNION ALL
      SELECT "id", "countryCode", "languageCode"
      FROM "${schema}"."CasinoBonusMediaAssignment"
      WHERE "reference" = '0028-preservation-fixture'
      UNION ALL
      SELECT "id", "countryCode", "languageCode"
      FROM "${schema}"."AffiliateOfferMediaAssignment"
      WHERE "reference" = '0028-preservation-fixture'
      ORDER BY "id"
    `);
    if (legacy.length !== 3 || legacy.some((row) => row.countryCode !== null || row.languageCode !== null)) {
      throw new Error("0028 did not preserve existing assignments as NULL/NULL global-neutral rows");
    }

    await prisma.$executeRawUnsafe(`
      INSERT INTO "${schema}"."CasinoMediaAssignment"
        ("id", "casinoId", "mediaAssetId", "placement", "countryCode", "languageCode", "updatedAt")
      VALUES
        ('28000000-0000-4000-8000-000000000011', '25000000-0000-4000-8000-000000000001', '27000000-0000-4000-8000-000000000090', 'CASINO_DIRECTORY_CARD', 'FI', 'fi', CURRENT_TIMESTAMP),
        ('28000000-0000-4000-8000-000000000012', '25000000-0000-4000-8000-000000000001', '27000000-0000-4000-8000-000000000090', 'CASINO_DIRECTORY_CARD', NULL, 'en', CURRENT_TIMESTAMP),
        ('28000000-0000-4000-8000-000000000013', '25000000-0000-4000-8000-000000000001', '27000000-0000-4000-8000-000000000090', 'CASINO_DIRECTORY_CARD', 'SE', NULL, CURRENT_TIMESTAMP)
    `);
    const validTargets = await prisma.$queryRawUnsafe(`
      SELECT "countryCode", "languageCode" FROM "${schema}"."CasinoMediaAssignment"
      WHERE "id" IN (
        '28000000-0000-4000-8000-000000000011',
        '28000000-0000-4000-8000-000000000012',
        '28000000-0000-4000-8000-000000000013'
      ) ORDER BY "id"
    `);
    if (JSON.stringify(validTargets) !== JSON.stringify([
      { countryCode: "FI", languageCode: "fi" },
      { countryCode: null, languageCode: "en" },
      { countryCode: "SE", languageCode: null },
    ])) throw new Error("0028 valid targeting matrix did not persist exactly");

    for (const [id, countryCode, languageCode] of [
      ["28000000-0000-4000-8000-000000000021", "fi", "en"],
      ["28000000-0000-4000-8000-000000000022", "F1", "en"],
      ["28000000-0000-4000-8000-000000000023", "FI", "EN"],
      ["28000000-0000-4000-8000-000000000024", "FI", "e"],
    ]) {
      let rejected = false;
      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO "${schema}"."CasinoMediaAssignment"
            ("id", "casinoId", "mediaAssetId", "placement", "countryCode", "languageCode", "updatedAt")
          VALUES ($1::uuid, '25000000-0000-4000-8000-000000000001', '27000000-0000-4000-8000-000000000090', 'CASINO_DIRECTORY_CARD', $2, $3, CURRENT_TIMESTAMP)
        `, id, countryCode, languageCode);
      } catch {
        rejected = true;
      }
      if (!rejected) throw new Error(`0028 accepted malformed target ${countryCode}/${languageCode}`);
    }

    run("npx", ["prisma", "migrate", "deploy"], environment);
    const retiredTargets = await prisma.casinoMediaAssignment.count({
      where: { id: { in: [
        "28000000-0000-4000-8000-000000000011",
        "28000000-0000-4000-8000-000000000012",
        "28000000-0000-4000-8000-000000000013",
      ] }, active: true },
    });
    if (retiredTargets !== 0) throw new Error("0034 did not retire staged 0028 assignment authority");

    console.info("Geo-localized creative staged migration smoke passed", {
      protectedCountsPreserved: true,
      existingAssignmentsGlobalNeutral: legacy.length,
      validTargetShapes: validTargets.length,
      malformedTargetsRejected: 4,
      historicalAssignmentsRetiredBy0034: 3,
      replayIdempotent: true,
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyVettedPartnerHostedCreativeUpgrade(migrationEntries) {
  const migration = "0029_vetted_partner_hosted_creatives";
  const migrationIndex = migrationEntries.indexOf(migration);
  const programmeMigrationIndex = migrationEntries.indexOf("0015_active_control_program_flow");
  if (migrationIndex < 1 || migrationEntries[migrationIndex - 1] !== "0028_geo_localized_creative_assignments") {
    throw new Error(`Expected ${migration} immediately after 0028`);
  }
  const schema = "vetted_partner_hosted_creative_upgrade_ci";
  const databaseUrl = databaseUrlForSchema(process.env.DATABASE_URL, schema);
  const directUrl = databaseUrlForSchema(process.env.DIRECT_URL, schema);
  const environment = { DATABASE_URL: databaseUrl, DIRECT_URL: directUrl };

  const beforeProgramme = await stageMigrations(migrationEntries.slice(0, programmeMigrationIndex));
  try {
    run("npx", ["prisma", "migrate", "deploy", "--schema", path.join(beforeProgramme, "schema.prisma")], environment);
    run("npx", [
      "prisma", "db", "execute", "--schema", path.join(beforeProgramme, "schema.prisma"),
      "--file", "prisma/preflight/0015_active_control_program_flow.sql",
    ], environment);
  } finally {
    await rm(beforeProgramme, { recursive: true, force: true });
  }

  const through0028 = await stageMigrations(migrationEntries.slice(0, migrationIndex));
  try {
    run("npx", ["prisma", "migrate", "deploy", "--schema", path.join(through0028, "schema.prisma")], environment);
    for (const fixture of [
      "prisma/fixtures/0025_pre_casino_market_profile.sql",
      "prisma/fixtures/0026_pre_commercial_platform_completion.sql",
      "prisma/fixtures/0027_pre_placement_media_assignments.sql",
      "prisma/fixtures/0028_pre_geo_localized_creative_assignments.sql",
      "prisma/fixtures/0029_pre_vetted_partner_hosted_creatives.sql",
    ]) {
      run("npx", ["prisma", "db", "execute", "--schema", path.join(through0028, "schema.prisma"), "--file", fixture], environment);
    }
  } finally {
    await rm(through0028, { recursive: true, force: true });
  }

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  const protectedState = async () => JSON.parse(JSON.stringify(await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: "0029-preservation-fixture" }, select: { key: true, value: true } }),
    prisma.casino.findMany({ where: { id: "25000000-0000-4000-8000-000000000001" }, select: { id: true, slug: true, status: true, publishedVersion: true, draftVersion: true } }),
    prisma.casinoBonus.findMany({ where: { id: "25000000-0000-4000-8000-000000000007" }, select: { id: true, casinoId: true, slug: true, status: true } }),
    prisma.affiliateOffer.findMany({ where: { id: "26000000-0000-4000-8000-000000000003" }, select: { id: true, casinoId: true, programId: true, status: true } }),
    prisma.affiliateTrackingLink.findMany({ where: { id: "26000000-0000-4000-8000-000000000006" }, select: { id: true, offerId: true, trackingUrl: true, destinationUrl: true, active: true } }),
    prisma.affiliateRedirectSlug.findMany({ where: { id: "26000000-0000-4000-8000-000000000008" }, select: { id: true, slug: true, casinoId: true, affiliateOfferId: true, active: true } }),
    prisma.mediaAsset.findMany({ where: { id: "27000000-0000-4000-8000-000000000090" }, select: { id: true, casinoId: true, storageKey: true, publicUrl: true, checksum: true, status: true } }),
    prisma.casinoMediaAssignment.count(),
    prisma.casinoBonusMediaAssignment.count(),
    prisma.affiliateOfferMediaAssignment.count(),
  ])));
  try {
    const before = await protectedState();
    await deployMigrationPrefix(migrationEntries, migrationIndex, environment);
    const after = await protectedState();
    if (JSON.stringify(after) !== JSON.stringify(before)) {
      throw new Error("0029 changed protected editorial, commercial routing, media, or assignment state");
    }
    await deployMigrationPrefix(migrationEntries, migrationIndex, environment);
    const emptyHostedCounts = await Promise.all([
      prisma.partnerHostedCreative.count(),
      prisma.casinoPartnerHostedCreativeAssignment.count(),
      prisma.casinoBonusPartnerHostedCreativeAssignment.count(),
      prisma.affiliateOfferPartnerHostedCreativeAssignment.count(),
    ]);
    if (emptyHostedCounts.some((count) => count !== 0)) throw new Error("0029 invented hosted creative data");

    await prisma.partnerHostedCreative.create({
      data: {
        id: "29000000-0000-4000-8000-000000000001",
        provider: "SUPERFLY",
        sourceMode: "PARTNER_HOSTED_IMAGE",
        providerIdentityKey: "SUPERFLY:3:16924502:46:200",
        casinoId: "25000000-0000-4000-8000-000000000001",
        affiliateOfferId: "26000000-0000-4000-8000-000000000003",
        redirectSlugId: "26000000-0000-4000-8000-000000000008",
        trackingLinkId: "26000000-0000-4000-8000-000000000006",
        externalCreativeId: "200",
        affiliateId: "16924502",
        campaignId: "46",
        operatorProgramId: "3",
        declaredWidth: 250,
        declaredHeight: 250,
        hostedImageUrl: "https://go.superflypartners.net/impression?creative_id=200&affiliate_id=16924502",
        languageState: "UNKNOWN",
        destinationUrl: "https://go.superflypartners.net/click?o=3&a=16924502&c=46&creative_id=200",
        destinationUrlHash: "a".repeat(64),
        destinationHost: "go.superflypartners.net",
        expectedOperatorHost: "fixture.example",
        verifiedFinalHost: "fixture.example",
        destinationVerificationState: "VERIFIED",
        destinationVerifiedAt: new Date("2030-01-01T00:00:00Z"),
        validationState: "VALIDATED",
        sourceChecksum: "b".repeat(64),
        provenance: { source: "0029-ci" },
        createdBy: "0029-ci",
        updatedBy: "0029-ci",
      },
    });
    await prisma.affiliateOfferPartnerHostedCreativeAssignment.create({
      data: {
        id: "29000000-0000-4000-8000-000000000002",
        affiliateOfferId: "26000000-0000-4000-8000-000000000003",
        creativeId: "29000000-0000-4000-8000-000000000001",
        placement: "BEST_OFFER_FEATURED",
        languageState: "UNKNOWN",
      },
    });
    if (await prisma.partnerHostedCreative.count() !== 1 || await prisma.affiliateOfferPartnerHostedCreativeAssignment.count() !== 1) {
      throw new Error("0029 valid hosted creative graph did not persist");
    }

    let rejected = false;
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "${schema}"."PartnerHostedCreative"
          ("id", "provider", "sourceMode", "providerIdentityKey", "casinoId", "externalCreativeId", "declaredWidth", "declaredHeight", "hostedImageUrl", "languageState", "destinationUrl", "destinationUrlHash", "destinationHost", "destinationVerificationState", "validationState", "sourceChecksum", "provenance", "createdBy", "updatedBy", "updatedAt")
        VALUES
          ('29000000-0000-4000-8000-000000000003', 'BANNERFLOW', 'PARTNER_HOSTED_IMAGE', 'invalid-provider-shape', '25000000-0000-4000-8000-000000000001', 'invalid', 300, 100, 'https://c.bannerflow.net/not-an-image', 'UNKNOWN', 'https://example.invalid', repeat('c',64), 'example.invalid', 'PENDING', 'REVIEW_REQUIRED', repeat('d',64), '{}'::jsonb, '0029-ci', '0029-ci', CURRENT_TIMESTAMP)
      `);
    } catch {
      rejected = true;
    }
    if (!rejected) throw new Error("0029 accepted an invalid provider/source shape");

    run("npx", ["prisma", "migrate", "deploy"], environment);
    const retiredHostedCreative = await prisma.partnerHostedCreative.findUnique({
      where: { id: "29000000-0000-4000-8000-000000000001" },
      select: { active: true, archivedAt: true },
    });
    const retiredHostedAssignment = await prisma.affiliateOfferPartnerHostedCreativeAssignment.findUnique({
      where: { id: "29000000-0000-4000-8000-000000000002" },
      select: { active: true },
    });
    if (retiredHostedCreative?.active !== false || !retiredHostedCreative.archivedAt || retiredHostedAssignment?.active !== false) {
      throw new Error("0034 did not preserve and retire the staged 0029 hosted creative graph");
    }

    console.info("Vetted partner-hosted creative staged migration smoke passed", {
      protectedStatePreserved: true,
      hostedRowsInvented: 0,
      validHostedGraph: true,
      invalidProviderShapeRejected: true,
      historicalGraphRetiredBy0034: true,
      replayIdempotent: true,
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyExactCanonicalRouteUpgrade(migrationEntries, programmeMigrationIndex) {
  const migration = "0040_commercial_core_exact_routes_geo_simplification";
  const migrationIndex = migrationEntries.indexOf(migration);
  const priorMigration = "0039_commercial_core_partner_relationship";
  const priorIndex = migrationEntries.indexOf(priorMigration);
  if (migrationIndex !== priorIndex + 1) {
    throw new Error(`Expected ${migration} directly after ${priorMigration}`);
  }

  const schema = "exact_canonical_route_upgrade_ci";
  const databaseUrl = databaseUrlForSchema(process.env.DATABASE_URL, schema);
  const directUrl = databaseUrlForSchema(process.env.DIRECT_URL, schema);
  const environment = { DATABASE_URL: databaseUrl, DIRECT_URL: directUrl };
  const preProgramme = await stageMigrations(migrationEntries.slice(0, programmeMigrationIndex));
  try {
    run("npx", ["prisma", "migrate", "deploy", "--schema", path.join(preProgramme, "schema.prisma")], environment);
    run("npx", [
      "prisma", "db", "execute", "--schema", "prisma/schema.prisma",
      "--file", "prisma/preflight/0015_active_control_program_flow.sql",
    ], environment);
  } finally {
    await rm(preProgramme, { recursive: true, force: true });
  }

  const through0039 = await stageMigrations(migrationEntries.slice(0, migrationIndex));
  try {
    run("npx", ["prisma", "migrate", "deploy", "--schema", path.join(through0039, "schema.prisma")], environment);
  } finally {
    await rm(through0039, { recursive: true, force: true });
  }

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  const ids = {
    casino: "40000000-0000-4000-8000-000000000001",
    secondCasino: "40000000-0000-4000-8000-000000000002",
    network: "40000000-0000-4000-8000-000000000003",
    program: "40000000-0000-4000-8000-000000000004",
    offer: "40000000-0000-4000-8000-000000000005",
    tracking: "40000000-0000-4000-8000-000000000006",
    redirect: "40000000-0000-4000-8000-000000000007",
    legacyRoute: "40000000-0000-4000-8000-000000000008",
    rejectedRoute: "40000000-0000-4000-8000-000000000009",
    exactRoute: "40000000-0000-4000-8000-000000000010",
    scopeChangeRoute: "40000000-0000-4000-8000-000000000011",
    invalidActiveRoute: "40000000-0000-4000-8000-000000000012",
  };
  const now = new Date("2031-01-15T00:00:00.000Z");
  try {
    await prisma.casino.createMany({ data: [
      { id: ids.casino, slug: "exact-route-upgrade-fixture", title: "Exact route upgrade fixture", domain: "exact-route-upgrade.invalid", createdBy: "ci", updatedBy: "ci" },
      { id: ids.secondCasino, slug: "exact-route-upgrade-rejection", title: "Exact route rejection fixture", domain: "exact-route-rejection.invalid", createdBy: "ci", updatedBy: "ci" },
    ] });
    await prisma.affiliateNetwork.create({ data: {
      id: ids.network, name: "Exact route upgrade network", slug: "exact-route-upgrade-network", createdBy: "ci", updatedBy: "ci",
    } });
    await prisma.affiliateProgram.create({ data: {
      id: ids.program, networkId: ids.network, casinoId: ids.casino, name: "Exact route upgrade program", operator: "Fixture operator", createdBy: "ci", updatedBy: "ci",
    } });
    await prisma.affiliateOffer.create({ data: {
      id: ids.offer, programId: ids.program, casinoId: ids.casino, internalName: "Exact route upgrade offer", publicLabel: "Visit", offerType: "CASINO", createdBy: "ci", updatedBy: "ci",
    } });
    await prisma.affiliateTrackingLink.create({ data: {
      id: ids.tracking, offerId: ids.offer, label: "Exact route upgrade link", destinationUrl: "https://operator.invalid/casino", trackingUrl: "https://tracking.invalid/click", active: true, createdBy: "ci", updatedBy: "ci",
    } });
    await prisma.affiliateTrackingLinkCountry.create({ data: {
      trackingLinkId: ids.tracking, countryCode: "ZZ", mode: "BLOCK", productionEligible: true,
      productionEligibilityVerifiedAt: now, productionEligibilityEvidence: "CI:LEGACY-ZZ",
    } });
    await prisma.affiliateRedirectSlug.create({ data: {
      id: ids.redirect, slug: "exact-route-upgrade-visit", casinoId: ids.casino, affiliateOfferId: ids.offer, active: true, createdBy: "ci", updatedBy: "ci",
    } });
    await prisma.marketActivation.create({ data: {
      id: ids.legacyRoute, casinoId: ids.casino, countryCode: "ZZ", marketCode: "ZZ", product: "CASINO",
      desiredState: "ACTIVE", status: "ACTIVE", affiliateOfferId: ids.offer, primaryTrackingLinkId: ids.tracking,
      redirectSlugId: ids.redirect, version: 1, controllerVersion: "MARKET-ACTIVATION-V2",
      reconciliationFingerprint: "a".repeat(64), requestedBy: "ci", requestedAt: now,
      requestReason: "Pre-0040 legacy route preservation fixture.", sourceReferences: ["CI:LEGACY-ZZ"],
      activatedAt: now, lastReconciledAt: now, routeVerificationStatus: "HEALTHY", routeLastCheckedAt: now,
      globalFallbackBlockedCountries: ["CL", "DK", "ES", "FI", "GB", "NO", "SE"],
    } });

    run("npx", ["prisma", "migrate", "deploy"], environment);
    const [legacyAfterUpgrade, exactConstraint, scopeGuard] = await Promise.all([
      prisma.marketActivation.findUnique({ where: { id: ids.legacyRoute } }),
      prisma.$queryRawUnsafe(`
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'MarketActivation_exact_canonical_scope_check'
          AND conrelid = '${schema}."MarketActivation"'::regclass
      `),
      prisma.$queryRawUnsafe(`
        SELECT trigger.tgenabled
        FROM pg_trigger trigger
        JOIN pg_proc procedure ON procedure.oid = trigger.tgfoid
        WHERE trigger.tgname = 'MarketActivation_guard_new_scope_trigger'
          AND trigger.tgrelid = '${schema}."MarketActivation"'::regclass
          AND procedure.proname = 'MarketActivation_guard_new_scope'
          AND NOT trigger.tgisinternal
      `),
    ]);
    if (legacyAfterUpgrade?.marketCode !== "ZZ" || legacyAfterUpgrade.desiredState !== "ACTIVE") {
      throw new Error("0040 staged upgrade changed legacy business route state");
    }
    if (exactConstraint.length !== 0 || scopeGuard.length !== 1 || scopeGuard[0].tgenabled === "D") {
      throw new Error("0040 must replace the row-wide exact-route CHECK with the scope-change guard");
    }

    const healthCheckedAt = new Date(now.getTime() + 1_000);
    const previousBinaryHealthUpdate = await prisma.$transaction(async (transaction) => {
      await transaction.affiliateTrackingLink.update({
        where: { id: ids.tracking },
        data: { lastCheckedAt: healthCheckedAt, verifiedAt: healthCheckedAt, updatedBy: "MARKET-ACTIVATION-V2" },
      });
      const compatibility = await transaction.affiliateTrackingLinkCountry.updateMany({
        where: { trackingLinkId: ids.tracking, countryCode: "ZZ" },
        data: {
          productionEligible: true,
          productionEligibilityVerifiedAt: healthCheckedAt,
          productionEligibilityExpiresAt: null,
        },
      });
      if (compatibility.count !== 1) throw new Error("Previous-binary ZZ compatibility projection is missing");
      return transaction.marketActivation.update({
        where: { id: ids.legacyRoute },
        data: {
          status: "ACTIVE",
          version: 2,
          activatedAt: now,
          blockedAt: null,
          lastReconciledAt: healthCheckedAt,
          routeVerificationStatus: "HEALTHY",
          routeLastCheckedAt: healthCheckedAt,
          routeFinalHost: "operator.invalid",
          routeVerificationDetail: "PREVIOUS_BINARY_HEALTH_UPDATE",
          externalBlockerCode: null,
          externalBlockerDetail: null,
          externalBlockerSource: null,
        },
      });
    });
    if (previousBinaryHealthUpdate.marketCode !== "ZZ" || previousBinaryHealthUpdate.version !== 2) {
      throw new Error("0040 blocked the previous binary's legitimate legacy ZZ health update");
    }

    let rejectedNewZz = false;
    try {
      await prisma.marketActivation.create({ data: {
        id: ids.rejectedRoute, casinoId: ids.secondCasino, countryCode: "ZZ", marketCode: "ZZ", product: "CASINO",
        desiredState: "DISABLED", status: "DISABLED", version: 1, controllerVersion: "MARKET-ACTIVATION-V2",
        reconciliationFingerprint: "b".repeat(64), requestedBy: "ci", requestedAt: now,
        requestReason: "0040 new-ZZ rejection fixture.", sourceReferences: ["CI:REJECT-ZZ"], disabledAt: now,
      } });
    } catch (error) {
      rejectedNewZz = String(error).includes("MARKET_ACTIVATION_GLOBAL_FALLBACK_CREATION_FORBIDDEN");
    }
    if (!rejectedNewZz) throw new Error("0040 admitted a new ZZ route");

    await prisma.marketActivation.create({ data: {
      id: ids.scopeChangeRoute, casinoId: ids.secondCasino, countryCode: "IE", marketCode: "IE", product: "CASINO",
      desiredState: "DISABLED", status: "DISABLED", version: 1, controllerVersion: "MARKET-ACTIVATION-V2",
      reconciliationFingerprint: "d".repeat(64), requestedBy: "ci", requestedAt: now,
      requestReason: "0040 scope-change guard fixture.", sourceReferences: ["CI:SCOPE-CHANGE"], disabledAt: now,
    } });
    let rejectedScopeChangeToZz = false;
    try {
      await prisma.marketActivation.update({
        where: { id: ids.scopeChangeRoute },
        data: { countryCode: "ZZ", marketCode: "ZZ" },
      });
    } catch (error) {
      rejectedScopeChangeToZz = String(error).includes("MARKET_ACTIVATION_GLOBAL_FALLBACK_CREATION_FORBIDDEN");
    }
    if (!rejectedScopeChangeToZz) throw new Error("0040 admitted a non-ZZ to ZZ scope change");

    await prisma.marketActivation.create({ data: {
      id: ids.invalidActiveRoute, casinoId: ids.secondCasino, countryCode: "US", marketCode: "US-VA", product: "CASINO",
      desiredState: "DISABLED", status: "DISABLED", version: 1, controllerVersion: "MARKET-ACTIVATION-V2",
      reconciliationFingerprint: "e".repeat(64), requestedBy: "ci", requestedAt: now,
      requestReason: "0040 canonical activation-transition fixture.", sourceReferences: ["CI:CANONICAL-SCOPE"], disabledAt: now,
    } });
    let rejectedInvalidActivation = false;
    try {
      await prisma.marketActivation.update({
        where: { id: ids.invalidActiveRoute },
        data: { desiredState: "ACTIVE", status: "PREPARING", disabledAt: null },
      });
    } catch (error) {
      rejectedInvalidActivation = String(error).includes("MARKET_ACTIVATION_CANONICAL_SCOPE_REQUIRED");
    }
    if (!rejectedInvalidActivation) throw new Error("0040 admitted a non-canonical active scope transition");

    await prisma.marketActivation.create({ data: {
      id: ids.exactRoute, casinoId: ids.casino, countryCode: "IE", marketCode: "IE", product: "CASINO",
      desiredState: "ACTIVE", status: "ACTIVE", affiliateOfferId: ids.offer, primaryTrackingLinkId: ids.tracking,
      redirectSlugId: ids.redirect, version: 1, controllerVersion: "MARKET-ACTIVATION-V2",
      reconciliationFingerprint: "c".repeat(64), requestedBy: "ci", requestedAt: now,
      requestReason: "0040 exact route fixture.", sourceReferences: ["CI:EXACT-IE"],
      activatedAt: now, lastReconciledAt: now, routeVerificationStatus: "HEALTHY", routeLastCheckedAt: now,
    } });
    console.info("Exact canonical route staged migration smoke passed", {
      from: priorMigration,
      to: migration,
      legacyBusinessRowsMutatedByMigration: 0,
      previousBinaryLegacyZzHealthUpdateSucceeded: true,
      newZzRejected: true,
      nonZzToZzScopeChangeRejected: true,
      nonCanonicalActivationRejected: true,
      exactRouteWithoutMarketProfileAccepted: true,
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
  await verifyAdminMfaUpgrade(migrationEntries, programmeMigrationIndex);
  await verifyUnsupportedAccountRefusal(migrationEntries, programmeMigrationIndex);
  await verifyProgrammeAccessUpgrade(migrationEntries);
  await verifyCasinoMarketProfileUpgrade(migrationEntries, programmeMigrationIndex);
  await verifyCommercialPlatformUpgrade(migrationEntries, programmeMigrationIndex);
  await verifyGeoLocalizedCreativeUpgrade(migrationEntries);
  await verifyVettedPartnerHostedCreativeUpgrade(migrationEntries);
  await verifyRuntimePartnerMarketSupportUpgrade(migrationEntries, programmeMigrationIndex);
  await verifyExactCanonicalRouteUpgrade(migrationEntries, programmeMigrationIndex);

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

    const [users, casinos, missionProgress, programmeAccessAcceptances] = await Promise.all([
      prisma.user.count(),
      prisma.casino.count(),
      prisma.programmeMissionProgress.count(),
      prisma.programmeAccessAcceptance.count(),
    ]);
    console.info("Ephemeral migration smoke passed", {
      appliedMigrations,
      representativeRows: { users, casinos, missionProgress, programmeAccessAcceptances },
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Migration verification failed");
  process.exitCode = 1;
});
