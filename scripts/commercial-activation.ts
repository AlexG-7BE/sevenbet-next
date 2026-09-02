import { readFile } from "node:fs/promises";
import path from "node:path";
import { ZodError } from "zod";

import { parseCommercialActivationBundle } from "../lib/commercial-activation/contract";
import { commercialActivationFingerprint } from "../lib/commercial-activation/planner";
import { commercialActivationService } from "../lib/commercial-activation/service";
import { prisma } from "../lib/db/prisma";

type Operation = "validate" | "preview" | "apply" | "verify";

function option(name: string) {
  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1];
  return process.argv.find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

function operation(): Operation {
  const value = process.argv[2];
  if (!value || !["validate", "preview", "apply", "verify"].includes(value)) {
    throw new Error("USAGE: commercial-activation <validate|preview|apply|verify> --bundle <path>");
  }
  return value as Operation;
}

async function readBundle() {
  const filename = option("--bundle");
  if (!filename) throw new Error("BUNDLE_PATH_REQUIRED");
  const absolute = path.resolve(filename);
  return parseCommercialActivationBundle(JSON.parse(await readFile(absolute, "utf8")));
}

function actorId() {
  const value = option("--actor-id") ?? process.env.COMMERCIAL_ACTIVATION_ACTOR_ID;
  if (!value || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error("AUTHORIZED_ACTOR_ID_REQUIRED");
  }
  return value;
}

async function main() {
  const command = operation();
  const bundle = await readBundle();
  if (command === "validate") {
    console.info(JSON.stringify({
      ok: true,
      schemaVersion: bundle.schemaVersion,
      bundleId: bundle.bundleId,
      fingerprint: commercialActivationFingerprint(bundle),
      records: bundle.records.length,
    }, null, 2));
    return;
  }
  if (command === "preview") {
    console.info(JSON.stringify(await commercialActivationService.preview(bundle), null, 2));
    return;
  }
  if (command === "verify") {
    const verification = await commercialActivationService.verify(bundle);
    console.info(JSON.stringify(verification, null, 2));
    if (!verification.verified) process.exitCode = 1;
    return;
  }
  if (option("--confirm") !== bundle.bundleId) throw new Error("BUNDLE_CONFIRMATION_REQUIRED");
  console.info(JSON.stringify(await commercialActivationService.apply(bundle, actorId()), null, 2));
}

main().catch((error: unknown) => {
  if (error instanceof ZodError) {
    console.error(JSON.stringify({ ok: false, code: "BUNDLE_VALIDATION_FAILED", issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) }, null, 2));
  } else {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const safeCode = /^(?:[A-Z][A-Z0-9_]*(?::[A-Z0-9_,.-]+)?|USAGE: [a-z<|> -]+)$/.test(message) ? message : "COMMERCIAL_ACTIVATION_COMMAND_FAILED";
    console.error(JSON.stringify({ ok: false, code: safeCode }, null, 2));
  }
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
