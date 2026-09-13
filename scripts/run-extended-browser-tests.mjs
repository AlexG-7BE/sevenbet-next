import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ciDatabaseUrl = "postgresql://sevenbet:sevenbet@127.0.0.1:54329/sevenbet_ci";
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

export async function main(extraArgs = process.argv.slice(2)) {
  const environment = fixtureEnvironment();
  const comparisonOnly = extraArgs.includes("--comparison-only");
  const playwrightArgs = extraArgs.filter((argument) => argument !== "--comparison-only");
  if (playwrightArgs.includes("--list")) {
    if (!comparisonOnly) runPlaywright(baseSpecs, playwrightArgs, environment);
    runPlaywright(comparisonSpecs, playwrightArgs, environment);
    return;
  }

  if (!comparisonOnly) runPlaywright(baseSpecs, playwrightArgs, environment);
  runPlaywright(comparisonSpecs, playwrightArgs, environment);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Extended browser suite failed");
    process.exitCode = 1;
  });
}
