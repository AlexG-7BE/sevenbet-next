import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";

import { runCasinoMarket0025Operator } from "../lib/db/casino-market-0025-operator";

function currentCommit() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error || result.status !== 0) throw new Error("Disposable operator test could not read the repository commit.");
  return result.stdout.trim();
}

async function main() {
  const expectedReleaseCommit = currentCommit();
  const common = {
    authority: "disposable-test" as const,
    expectedReleaseCommit,
  };

  const dryRun = await runCasinoMarket0025Operator({
    ...common,
    executeProduction0025: false,
  });
  assert.deepEqual(dryRun, { state: "dry_run_go", mutationPerformed: false });

  const execution = await runCasinoMarket0025Operator({
    ...common,
    executeProduction0025: true,
  });
  assert.deepEqual(execution, { state: "execution_succeeded", mutationPerformed: true });

  const repeated = await runCasinoMarket0025Operator({
    ...common,
    executeProduction0025: true,
  });
  assert.deepEqual(repeated, { state: "already_applied_verified", mutationPerformed: false });
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Disposable operator test failed"}\n`);
  process.exitCode = 1;
});
