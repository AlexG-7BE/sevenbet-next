import { assertVercelDatabaseReadiness } from "@/lib/db/vercel-database-readiness";

const result = assertVercelDatabaseReadiness();

if (!result.checked) {
  process.stdout.write("[vercel-build-preflight] skipped outside Vercel Preview/Production\n");
} else {
  process.stdout.write(`${JSON.stringify({
    event: "vercel_database_readiness",
    environment: result.environment,
    runtimeMode: result.runtimeMode,
    directMode: result.directMode,
    sameDatabaseIdentity: result.sameDatabaseIdentity,
    ready: result.ready,
  })}\n`);
}
