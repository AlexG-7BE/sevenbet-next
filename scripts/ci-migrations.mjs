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
  await verifyProgrammeAccessUpgrade(migrationEntries);
  await verifyCasinoMarketProfileUpgrade(migrationEntries, programmeMigrationIndex);
  await verifyCommercialPlatformUpgrade(migrationEntries, programmeMigrationIndex);

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
