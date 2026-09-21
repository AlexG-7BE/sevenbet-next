// Read-only: compares data/casino-registry.json with the casinos in the connected database.
// Usage: npm run casino-registry:verify   (uses DATABASE_URL from .env / .env.local)
import { readFileSync } from "node:fs";

import prisma from "../lib/db/prisma";

type RegistryEntry = { slug: string; status: string };

async function main() {
  const registry = JSON.parse(readFileSync("data/casino-registry.json", "utf8")) as { casinos: RegistryEntry[] };
  const database = await prisma.casino.findMany({ select: { slug: true, status: true }, orderBy: { slug: "asc" } });

  const inRegistry = new Map(registry.casinos.map((entry) => [entry.slug, entry.status]));
  const inDatabase = new Map(database.map((entry) => [entry.slug, String(entry.status)]));
  const problems: string[] = [];

  for (const [slug, status] of inDatabase) {
    if (!inRegistry.has(slug)) problems.push(`${slug}: in the database (${status}) but missing from the registry`);
    else if (inRegistry.get(slug) !== status) problems.push(`${slug}: registry says ${inRegistry.get(slug)}, database says ${status}`);
  }
  for (const slug of inRegistry.keys()) {
    if (!inDatabase.has(slug)) problems.push(`${slug}: in the registry but not in the database`);
  }

  const published = database.filter((entry) => entry.status === "PUBLISHED").length;
  console.log(`Database: ${database.length} casinos (${published} published). Registry: ${registry.casinos.length}.`);
  if (problems.length) {
    console.error(problems.map((line) => `✗ ${line}`).join("\n"));
    process.exitCode = 1;
  } else {
    console.log("✓ Registry matches the database.");
  }
}

main().finally(() => prisma.$disconnect());
