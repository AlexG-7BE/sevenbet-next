import assert from "node:assert/strict";
import test from "node:test";

import { PrismaClient, type Prisma } from "@prisma/client";

import {
  PR6_KEEP_TABLES,
  PR6_TARGET_FUNCTIONS,
  PR6_TARGET_TABLES,
  PR6_TARGET_TRIGGERS,
} from "../scripts/commercial-core-pr6-legacy-cleanup-core";

function assertDisposableDatabase(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  if (
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
    || !["5432", "54329"].includes(url.port)
    || !url.pathname.slice(1).endsWith("_ci")
  ) {
    throw new Error("PR6 PostgreSQL verification requires a loopback _ci database");
  }
}

async function catalogSnapshot(database: PrismaClient) {
  const [tables, triggers, functions, keepTables, issuer, identityIndex, accountTrigger, accountFunction, migration] = await Promise.all([
    database.$queryRawUnsafe<Array<{ name: string }>>(`
      SELECT relation.relname AS "name"
      FROM pg_class AS relation
      INNER JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
      WHERE namespace.nspname = current_schema()
        AND relation.relkind IN ('r', 'p')
        AND relation.relname IN (
          'oauthClient', 'oauthResource', 'oauthClientResource', 'oauthRefreshToken',
          'oauthAccessToken', 'oauthConsent', 'oauthClientAssertion',
          'CommercialMcpRateLimitBucket'
        )
      ORDER BY relation.relname
    `),
    database.$queryRawUnsafe<Array<{ name: string }>>(`
      SELECT trigger.tgname AS "name"
      FROM pg_trigger AS trigger
      INNER JOIN pg_class AS relation ON relation.oid = trigger.tgrelid
      INNER JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
      WHERE namespace.nspname = current_schema()
        AND NOT trigger.tgisinternal
        AND trigger.tgname IN (
          'oauthClient_prepare_compat', 'oauthClient_resource_compat',
          'oauthRefreshToken_resource_compat', 'oauthAccessToken_resource_compat',
          'oauthConsent_resource_compat'
        )
      ORDER BY trigger.tgname
    `),
    database.$queryRawUnsafe<Array<{ name: string }>>(`
      SELECT procedure.proname AS "name"
      FROM pg_proc AS procedure
      INNER JOIN pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
      WHERE namespace.nspname = current_schema()
        AND procedure.proname IN (
          'prepare_better_auth_oauth_client_compat',
          'sync_better_auth_oauth_client_resource_compat',
          'set_better_auth_oauth_resource_compat'
        )
      ORDER BY procedure.proname
    `),
    database.$queryRawUnsafe<Array<{ name: string }>>(`
      SELECT relation.relname AS "name"
      FROM pg_class AS relation
      INNER JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
      WHERE namespace.nspname = current_schema()
        AND relation.relkind IN ('r', 'p')
        AND relation.relname IN ('User', 'Session', 'Account', 'Verification', 'AuditLog')
      ORDER BY relation.relname
    `),
    database.$queryRawUnsafe<Array<{ nonNullable: boolean }>>(`
      SELECT is_nullable = 'NO' AS "nonNullable"
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'Account'
        AND column_name = 'issuer'
    `),
    database.$queryRawUnsafe<Array<{ unique: boolean; columns: string[] }>>(`
      SELECT
        index.indisunique AS "unique",
        array_agg(attribute.attname ORDER BY key.ordinality) AS "columns"
      FROM pg_class AS relation
      INNER JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
      INNER JOIN pg_index AS index ON index.indrelid = relation.oid
      INNER JOIN pg_class AS index_relation
        ON index_relation.oid = index.indexrelid
       AND index_relation.relname = 'account_issuer_accountId_uidx'
      CROSS JOIN LATERAL unnest(index.indkey) WITH ORDINALITY AS key(attnum, ordinality)
      INNER JOIN pg_attribute AS attribute
        ON attribute.attrelid = relation.oid
       AND attribute.attnum = key.attnum
      WHERE namespace.nspname = current_schema()
        AND relation.relname = 'Account'
      GROUP BY index.indisunique
    `),
    database.$queryRawUnsafe<Array<{ enabled: string; functionName: string }>>(`
      SELECT
        trigger.tgenabled::text AS "enabled",
        procedure.proname AS "functionName"
      FROM pg_trigger AS trigger
      INNER JOIN pg_class AS relation ON relation.oid = trigger.tgrelid
      INNER JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
      INNER JOIN pg_proc AS procedure ON procedure.oid = trigger.tgfoid
      WHERE namespace.nspname = current_schema()
        AND relation.relname = 'Account'
        AND trigger.tgname = 'Account_better_auth_issuer_compat'
        AND NOT trigger.tgisinternal
    `),
    database.$queryRawUnsafe<Array<{ identityArguments: string; returnType: string }>>(`
      SELECT
        pg_get_function_identity_arguments(procedure.oid) AS "identityArguments",
        pg_get_function_result(procedure.oid) AS "returnType"
      FROM pg_proc AS procedure
      INNER JOIN pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
      WHERE namespace.nspname = current_schema()
        AND procedure.proname = 'set_better_auth_account_issuer'
    `),
    database.$queryRawUnsafe<Array<{ count: bigint }>>(`
      SELECT count(*) AS "count"
      FROM "_prisma_migrations"
      WHERE migration_name = '0041_commercial_core_legacy_connector_cleanup'
        AND finished_at IS NOT NULL
        AND rolled_back_at IS NULL
    `),
  ]);
  return {
    tables,
    triggers,
    functions,
    keepTables,
    issuer,
    identityIndex,
    accountTrigger,
    accountFunction,
    migration,
  };
}

test("0041 removes only the reviewed connector objects and preserves the hard KEEP set", async () => {
  assert.equal(process.env.CI, "true");
  assertDisposableDatabase(process.env.DATABASE_URL);
  assertDisposableDatabase(process.env.DIRECT_URL);
  const database = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });
  try {
    const snapshot = await catalogSnapshot(database);
    assert.deepEqual(snapshot.tables, [], PR6_TARGET_TABLES.map(({ table }) => table).join(", "));
    assert.deepEqual(snapshot.triggers, [], PR6_TARGET_TRIGGERS.map(({ name }) => name).join(", "));
    assert.deepEqual(snapshot.functions, [], PR6_TARGET_FUNCTIONS.join(", "));
    assert.deepEqual(
      snapshot.keepTables.map(({ name }) => name),
      [...PR6_KEEP_TABLES].sort(),
    );
    assert.deepEqual(snapshot.issuer, [{ nonNullable: true }]);
    assert.deepEqual(snapshot.identityIndex, [{ unique: true, columns: ["issuer", "accountId"] }]);
    assert.deepEqual(snapshot.accountTrigger, [{
      enabled: "O",
      functionName: "set_better_auth_account_issuer",
    }]);
    assert.deepEqual(snapshot.accountFunction, [{ identityArguments: "", returnType: "trigger" }]);
    assert.equal(snapshot.migration[0]?.count, 1n);
  } finally {
    await database.$disconnect();
  }
});

test("post-0041 email/password and Google identity compatibility remains operational", async () => {
  assert.equal(process.env.CI, "true");
  assertDisposableDatabase(process.env.DIRECT_URL);
  const database = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });
  const rollbackSentinel = new Error("PR6_AUTH_FIXTURE_ROLLBACK");
  let verified = false;
  try {
    await assert.rejects(
      database.$transaction(async (transaction: Prisma.TransactionClient) => {
        await transaction.$executeRawUnsafe(`
          INSERT INTO "User" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
          VALUES
            ('pr6-credential-user', 'PR6 credential fixture', 'pr6-credential@invalid.example', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('pr6-google-user', 'PR6 Google fixture', 'pr6-google@invalid.example', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);
        await transaction.$executeRawUnsafe(`
          INSERT INTO "Account" (
            "id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt"
          ) VALUES (
            'pr6-credential-account', 'pr6-credential-user', 'credential',
            'pr6-credential-user', 'synthetic-password-hash', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `);
        await transaction.$executeRawUnsafe(`
          INSERT INTO "Account" (
            "id", "accountId", "providerId", "userId", "createdAt", "updatedAt"
          ) VALUES (
            'pr6-google-account', 'pr6-google-subject', 'google',
            'pr6-google-user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `);
        const rows = await transaction.$queryRawUnsafe<Array<{
          id: string;
          issuer: string;
          passwordPresent: boolean;
        }>>(`
          SELECT "id", "issuer", "password" IS NOT NULL AS "passwordPresent"
          FROM "Account"
          WHERE "id" IN ('pr6-credential-account', 'pr6-google-account')
          ORDER BY "id"
        `);
        assert.deepEqual(rows, [
          { id: "pr6-credential-account", issuer: "local:credential", passwordPresent: true },
          { id: "pr6-google-account", issuer: "https://accounts.google.com", passwordPresent: false },
        ]);
        verified = true;
        throw rollbackSentinel;
      }),
      (error: unknown) => error === rollbackSentinel,
    );
    assert.equal(verified, true);
  } finally {
    await database.$disconnect();
  }
});
