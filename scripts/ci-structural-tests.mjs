import { spawnSync } from "node:child_process";

const requiredTests = [
  "tests/admin-auth.test.ts",
  "tests/auth-runtime-config.test.ts",
  "tests/affiliate-redirect-engine.test.ts",
  "tests/design-system-contract.test.ts",
  "tests/fe-gap-02-structural.test.ts",
  "tests/home-parity.test.ts",
  "tests/jurisdiction-resolver.test.ts",
  "tests/legal-programme-privacy.test.ts",
  "tests/prisma-runtime-pooling.test.ts",
  "tests/public-casino-discovery.test.ts",
  "tests/public-casino-rendering.test.ts",
  "tests/public-casino-service.test.ts",
  "tests/public-comparison.test.ts",
  "tests/public-offer-service.test.ts",
  "tests/public-shell.test.ts",
  "tests/responsible-gambling-protected-help.test.ts",
  "tests/responsible-gambling-safety.test.ts",
  "tests/ten-steps-parity.test.ts",
  "tests/ten-steps-render.test.cjs",
  "tests/ux-perf-structural.test.ts",
];

const prohibitedRequiredTests = [
  "programme-flow.test.ts",
  "temporary-production-demo-casinos.test.ts",
];

for (const prohibited of prohibitedRequiredTests) {
  if (requiredTests.some((testFile) => testFile.endsWith(prohibited))) {
    throw new Error(`${prohibited} must not enter the deterministic required manifest`);
  }
}

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", ...requiredTests],
  { stdio: "inherit" },
);

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const feGapResult = spawnSync(
  process.execPath,
  [
    "--import",
    "tsx",
    "--test-name-pattern=^(Privacy|Terms|Self-Check|Personal Limit Tracker|About uses)",
    "--test",
    "tests/fe-gap-01-structural.test.ts",
  ],
  { stdio: "inherit" },
);

if (feGapResult.error) throw feGapResult.error;
if (feGapResult.status !== 0) process.exitCode = feGapResult.status ?? 1;
