import { readFile } from "node:fs/promises";
import path from "node:path";

import { parseCasinoIngestionBundle } from "../lib/casino-ingestion/contract";
import { ingestCasinoBundle, planCasinoIngestion } from "../lib/casino-ingestion/importer";
import { verifyCasinoIngestionSources } from "../lib/casino-ingestion/source-verification";
import { assertCasinoIngestionWriteAuthority } from "../lib/casino-ingestion/write-guard";

function option(name: string) {
  const exact = process.argv.indexOf(name);
  if (exact >= 0) return process.argv[exact + 1];
  return process.argv.find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

async function main() {
  const bundlePath = option("--bundle");
  if (!bundlePath) throw new Error("An explicit --bundle path is required.");
  const writeRequested = process.argv.includes("--write");
  const sourceRoot = option("--source-root");
  if (writeRequested && !sourceRoot) throw new Error("Write mode requires an explicit --source-root for checksum verification.");

  const authority = assertCasinoIngestionWriteAuthority({
    writeRequested,
    confirmation: option("--confirm-disposable"),
    databaseUrl: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
    ci: process.env.CI,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });
  const absoluteBundlePath = path.resolve(bundlePath);
  const bundle = parseCasinoIngestionBundle(JSON.parse(await readFile(absoluteBundlePath, "utf8")));
  const sourceVerification = sourceRoot ? await verifyCasinoIngestionSources(bundle, sourceRoot) : null;

  if (authority.mode === "DRY_RUN") {
    console.info(JSON.stringify({ ...planCasinoIngestion(bundle), sourceVerification, databaseConnected: false }, null, 2));
  } else {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    try {
      const result = await ingestCasinoBundle(prisma, bundle);
      console.info(JSON.stringify({ ...result, sourceVerification, target: authority.target }, null, 2));
    } finally {
      await prisma.$disconnect();
    }
  }
}

void main();
