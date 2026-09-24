// Entry point for `npm run market-access:release`. Loads the target database URL from an env file
// (--db-env-file <path> [--db-env-key <KEY>]) before Prisma is imported, then runs the release.
import { readFileSync } from "node:fs";

function option(name: string) {
  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1];
  return process.argv.find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

const envFile = option("--db-env-file");
if (envFile) {
  const key = option("--db-env-key") ?? "DATABASE_URL";
  const line = readFileSync(envFile, "utf8").split("\n").find((entry) => entry.startsWith(`${key}=`));
  const value = line?.slice(key.length + 1).trim().replace(/^"|"$/g, "");
  if (!value) throw new Error(`MARKET_ACCESS_RELEASE_DB_ENV_KEY_MISSING:${key}`);
  process.env.DATABASE_URL = value;
  process.env.DIRECT_URL = value;
}
// Registration runs long interactive transactions against the remote database.
process.env.PRISMA_INTERACTIVE_TRANSACTION_TIMEOUT_MS ??= "1800000";

void import("./market-access-release");
