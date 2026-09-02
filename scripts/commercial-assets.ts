import { readFile } from "node:fs/promises";
import path from "node:path";
import { ZodError } from "zod";

import { parseCommercialAssetManifest } from "../lib/commercial-activation/asset-contract";
import { commercialAssetManifestService } from "../lib/commercial-activation/asset-service";
import { commercialActivationFingerprint } from "../lib/commercial-activation/planner";
import { prisma } from "../lib/db/prisma";

type Operation = "validate" | "preview" | "apply";

function option(name: string) {
  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1];
  return process.argv.find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

async function main() {
  const operation = process.argv[2] as Operation;
  if (!["validate", "preview", "apply"].includes(operation)) throw new Error("COMMERCIAL_ASSET_USAGE_INVALID");
  const manifestPath = option("--manifest");
  if (!manifestPath) throw new Error("COMMERCIAL_ASSET_MANIFEST_REQUIRED");
  const manifest = parseCommercialAssetManifest(JSON.parse(await readFile(path.resolve(manifestPath), "utf8")));
  if (operation === "validate") {
    console.info(JSON.stringify({ ok: true, schemaVersion: manifest.schemaVersion, manifestId: manifest.manifestId, fingerprint: commercialActivationFingerprint(manifest), assets: manifest.assets.length }, null, 2));
    return;
  }
  const sourceRoot = option("--source-root");
  if (!sourceRoot) throw new Error("COMMERCIAL_ASSET_SOURCE_ROOT_REQUIRED");
  if (operation === "preview") {
    console.info(JSON.stringify(await commercialAssetManifestService.preview(manifest, path.resolve(sourceRoot)), null, 2));
    return;
  }
  const actorId = option("--actor-id") ?? process.env.COMMERCIAL_ACTIVATION_ACTOR_ID;
  if (!actorId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(actorId)) throw new Error("AUTHORIZED_ACTOR_ID_REQUIRED");
  if (option("--confirm") !== manifest.manifestId) throw new Error("ASSET_MANIFEST_CONFIRMATION_REQUIRED");
  console.info(JSON.stringify(await commercialAssetManifestService.apply(manifest, path.resolve(sourceRoot), actorId), null, 2));
}

main().catch((error: unknown) => {
  if (error instanceof ZodError) {
    console.error(JSON.stringify({ ok: false, code: "ASSET_MANIFEST_VALIDATION_FAILED", issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) }, null, 2));
  } else {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    console.error(JSON.stringify({ ok: false, code: /^[A-Z][A-Z0-9_]*$/.test(message) ? message : "COMMERCIAL_ASSET_COMMAND_FAILED" }, null, 2));
  }
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
