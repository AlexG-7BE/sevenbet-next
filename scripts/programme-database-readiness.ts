import { inspectProgrammeDatabaseReadiness } from "@/lib/db/programme-database-readiness";

const labelIndex = process.argv.indexOf("--label");
const label = labelIndex >= 0 ? process.argv[labelIndex + 1] : "unspecified";
if (!label || !/^[a-z0-9_-]{1,32}$/i.test(label)) {
  throw new Error("--label must be a short safe environment name");
}

function variableOption(name: string, fallback: string) {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : fallback;
  if (!value || !/^[A-Z][A-Z0-9_]{1,63}$/.test(value)) {
    throw new Error(`${name} must name a safe environment variable`);
  }
  return value;
}

const databaseVariable = variableOption("--database-variable", "DATABASE_URL");
const directVariable = variableOption("--direct-variable", "DIRECT_URL");
const result = inspectProgrammeDatabaseReadiness({
  DATABASE_URL: process.env[databaseVariable],
  DIRECT_URL: process.env[directVariable],
});
process.stdout.write(`${JSON.stringify({ label, databaseVariable, directVariable, ...result }, null, 2)}\n`);
if (!result.ready) process.exitCode = 2;
