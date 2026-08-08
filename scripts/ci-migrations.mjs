import { spawnSync } from "node:child_process";
import { copyFile, cp, mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const allowedHosts = new Set(["127.0.0.1", "localhost"]);

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
    url.port !== "5432" ||
    !databaseName.endsWith("_ci")
  ) {
    throw new Error(
      `${variableName} refused: CI migrations require localhost:5432 and an _ci database`,
    );
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with status ${result.status}`);
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
