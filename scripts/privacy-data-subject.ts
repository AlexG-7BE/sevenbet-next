import { closeSync, constants, openSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildDataSubjectDeletionPlan,
  collectDataSubjectExport,
  executeDataSubjectDeletion,
  findDataSubjectUser,
} from "../lib/privacy/data-subject";
import { assertPrivacyDeletionAuthority, parsePrivacyTargetEnvironment } from "../lib/privacy/deletion-confirmation";

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function writeRestrictedJson(path: string, value: unknown) {
  const target = resolve(path);
  const descriptor = openSync(target, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
  try {
    writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8" });
  } finally {
    closeSync(descriptor);
  }
  return target;
}

async function main() {
  const operation = process.argv[2];
  const identifier = option("--identifier");
  const output = option("--output");
  const environment = parsePrivacyTargetEnvironment(option("--environment"));
  const execute = process.argv.includes("--execute");
  if (!identifier || !output || !["export", "delete"].includes(operation)) {
    throw new Error("Usage: privacy-data-subject <export|delete> --environment <local|preview|production> --identifier <email-or-id> --output <new-json-path> [--execute]");
  }
  const { default: database } = await import("../lib/db/prisma");
  const user = await findDataSubjectUser(database, identifier);
  if (!user) throw new Error("No exact data subject match was found");

  let result: unknown;
  let status: string;
  if (operation === "export") {
    result = await collectDataSubjectExport(database, user.id);
    status = "exported";
  } else if (!execute) {
    result = await buildDataSubjectDeletionPlan(database, user.id);
    status = "dry-run";
  } else {
    assertPrivacyDeletionAuthority({
      execute,
      environment,
      userId: user.id,
      generalConfirmation: process.env.SEVENBET_PRIVACY_DELETE_CONFIRM,
      productionConfirmation: process.env.SEVENBET_PRIVACY_PRODUCTION_DELETE_CONFIRM,
    });
    result = await executeDataSubjectDeletion(database, user.id);
    status = "deleted";
  }
  const target = writeRestrictedJson(output, result);
  process.stdout.write(`${JSON.stringify({ operation, environment, status, output: target })}\n`);
  await database.$disconnect();
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Privacy operation failed"}\n`);
  process.exitCode = 1;
});
