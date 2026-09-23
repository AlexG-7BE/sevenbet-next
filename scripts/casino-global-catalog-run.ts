// Entry point for `npm run casino-global-catalog`. Loads the target database URL from an env file
// (--db-env-file <path> [--db-env-key <KEY>]) before Prisma is imported, then runs the executor.
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
  if (!value) throw new Error(`CASINO_GLOBAL_CATALOG_DB_ENV_KEY_MISSING:${key}`);
  process.env.DATABASE_URL = value;
  process.env.DIRECT_URL = value;
}
// Republishing a casino runs the governed workflow as one interactive transaction
// against a remote database, well past Prisma's 5s default.
process.env.PRISMA_INTERACTIVE_TRANSACTION_TIMEOUT_MS ??= "1800000";

void import("./casino-global-catalog-01");
