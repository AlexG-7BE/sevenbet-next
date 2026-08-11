import {
  assertProgrammePurgeExecutionAuthority,
  parseProgrammePurgeEnvironment,
} from "../lib/programme/runtime-expiry-purge-authority";
import { purgeExpiredProgrammeRuntime } from "../lib/programme/runtime-expiry-purge";

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const execute = process.argv.includes("--execute");
  const dryRun = process.argv.includes("--dry-run") || !execute;
  if (execute && process.argv.includes("--dry-run")) {
    throw new Error("Choose either --dry-run or --execute");
  }
  const environment = parseProgrammePurgeEnvironment(option("--environment"));
  assertProgrammePurgeExecutionAuthority({
    execute,
    environment,
    confirmation: process.env.PROGRAMME_PURGE_CONFIRM,
    productionConfirmation: process.env.PROGRAMME_PURGE_PRODUCTION_CONFIRM,
  });
  const startedAt = performance.now();
  const result = await purgeExpiredProgrammeRuntime({ dryRun });
  process.stdout.write(`${JSON.stringify({
    environment,
    ...result,
    durationMs: Math.round(performance.now() - startedAt),
  })}\n`);
  const { default: database } = await import("../lib/db/prisma");
  await database.$disconnect();
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Programme expiry purge failed"}\n`);
  process.exitCode = 1;
});
