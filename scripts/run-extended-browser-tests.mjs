import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ciDatabaseUrl = "postgresql://sevenbet:sevenbet@127.0.0.1:54329/sevenbet_ci";
const fixtureActor = {
  id: "00000000-0000-4000-8000-999999999999",
  email: "extended-browser-fixture@invalid.example",
  name: "Extended browser fixture actor",
};
const baseSpecs = [
  "tests/casino-profile-browser.spec.ts",
  "tests/final-design-handoff-visual.spec.ts",
  "tests/fe-gap-01-browser.spec.ts",
  "tests/fe-gap-02-browser.spec.ts",
  "tests/public-casino-browser.spec.ts",
  "tests/public-offer-browser.spec.ts",
  "tests/responsible-gambling-browser.spec.ts",
  "tests/ten-steps-browser.spec.ts",
];
const comparisonSpecs = ["tests/public-comparison-browser.spec.ts"];

export function assertDisposableExtendedBrowserEnvironment(environment) {
  if (environment.CI !== "true") throw new Error("Extended browser fixtures require CI=true");
  if (environment.VERCEL_ENV === "production" || environment.VERCEL_ENV === "preview") {
    throw new Error("Extended browser fixtures refuse deployed Vercel environments");
  }
  for (const [name, value] of [["DATABASE_URL", environment.DATABASE_URL], ["DIRECT_URL", environment.DIRECT_URL]]) {
    let parsed;
    try {
      parsed = new URL(value ?? "");
    } catch {
      throw new Error(`${name} must be a valid PostgreSQL URL`);
    }
    const database = parsed.pathname.replace(/^\//, "");
    if (
      !["postgres:", "postgresql:"].includes(parsed.protocol)
      || !["127.0.0.1", "localhost"].includes(parsed.hostname)
      || !["5432", "54329"].includes(parsed.port)
      || !database.endsWith("_ci")
    ) throw new Error(`${name} must target localhost:5432 or :54329 and an _ci database`);
  }
}

function fixtureEnvironment() {
  const environment = {
    ...process.env,
    CI: "true",
    VERCEL_ENV: "",
    DATABASE_URL: ciDatabaseUrl,
    DIRECT_URL: ciDatabaseUrl,
    NEXT_PUBLIC_SITE_URL: "https://b4gamble.com",
    ALLOW_TEMPORARY_PRODUCTION_DEMO_CASINOS: "true",
    AFFILIATE_REDIRECT_ENGINE_ENABLED: "false",
    PUBLIC_CASINO_CMS_ENABLED: "false",
  };
  assertDisposableExtendedBrowserEnvironment(environment);
  return environment;
}

function run(command, args, environment) {
  const result = spawnSync(command, args, { env: environment, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed with status ${result.status}`);
}

function runPlaywright(specs, extraArgs, environment) {
  run("npx", ["playwright", "test", "--config=playwright.ci.config.ts", ...specs, ...extraArgs], environment);
}

function runDemoCommand(mode, environment) {
  run(process.execPath, ["--import", "tsx", "scripts/temporary-production-demo-casinos.ts", mode], environment);
}

async function ensureFixtureActor(environment) {
  process.env.DATABASE_URL = environment.DATABASE_URL;
  process.env.DIRECT_URL = environment.DIRECT_URL;
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.adminUser.findUnique({ where: { email: fixtureActor.email }, select: { id: true } });
    if (existing && existing.id !== fixtureActor.id) throw new Error("Extended browser fixture actor identity collision");
    await prisma.adminUser.upsert({
      where: { email: fixtureActor.email },
      create: { ...fixtureActor, role: "SUPER_ADMIN" },
      update: { name: fixtureActor.name, role: "SUPER_ADMIN" },
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function removeFixtureActor(environment) {
  process.env.DATABASE_URL = environment.DATABASE_URL;
  process.env.DIRECT_URL = environment.DIRECT_URL;
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    await prisma.adminUser.deleteMany({ where: { id: fixtureActor.id, email: fixtureActor.email } });
  } finally {
    await prisma.$disconnect();
  }
}

export async function main(extraArgs = process.argv.slice(2)) {
  const environment = fixtureEnvironment();
  const comparisonOnly = extraArgs.includes("--comparison-only");
  const playwrightArgs = extraArgs.filter((argument) => argument !== "--comparison-only");
  if (playwrightArgs.includes("--list")) {
    if (!comparisonOnly) runPlaywright(baseSpecs, playwrightArgs, environment);
    runPlaywright(comparisonSpecs, playwrightArgs, environment);
    return;
  }

  let failure;
  try {
    runDemoCommand("cleanup", environment);
    await removeFixtureActor(environment);
    if (!comparisonOnly) runPlaywright(baseSpecs, playwrightArgs, environment);
    await ensureFixtureActor(environment);
    runDemoCommand("seed", environment);
    runPlaywright(comparisonSpecs, playwrightArgs, environment);
  } catch (error) {
    failure = error;
  } finally {
    try {
      runDemoCommand("cleanup", environment);
      await removeFixtureActor(environment);
    } catch (cleanupError) {
      failure ??= cleanupError;
    }
  }
  if (failure) throw failure;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Extended browser suite failed");
    process.exitCode = 1;
  });
}
