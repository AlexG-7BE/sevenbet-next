import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  PR6_BASE_SHA,
  PR6_BRANCH,
  PR6_EXACT_COUNT_TARGETS,
  PR6_EXPECTED_FOREIGN_KEYS,
  PR6_KEEP_TABLES,
  PR6_MIGRATION_PATH,
  PR6_PUBLIC_RUNTIME_FILES,
  PR6_RATE_BUCKET_DRIFT_CLASSIFICATION,
  PR6_RATE_BUCKET_TARGET,
  PR6_ROUTE_BASELINE,
  PR6_TARGET_FUNCTIONS,
  PR6_TARGET_TABLES,
  PR6_TARGET_TRIGGERS,
  assessPr6ExactApplyState,
  assessPr6Projection,
  canonicalJson,
  createPr6RateBucketStabilityReference,
  expectedPr6HistoricalReferenceTotalRows,
  inspectPr6MigrationSql,
  parsePr6RateBucketStabilityReference,
  sha256,
  type Pr6ProjectionEvidence,
} from "../scripts/commercial-core-pr6-legacy-cleanup-core";

const root = fileURLToPath(new URL("..", import.meta.url));
const expectedModels = PR6_TARGET_TABLES.map(({ model }) => model);
const expectedTables = PR6_TARGET_TABLES.map(({ table }) => table);

function source(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function gitShow(path: string) {
  return execFileSync("git", ["show", `${PR6_BASE_SHA}:${path}`], {
    cwd: root,
    encoding: "utf8",
  });
}

function sourceFiles(path: string): string[] {
  const absolute = join(root, path);
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    if (entry.isDirectory()) return sourceFiles(child);
    return [".ts", ".tsx", ".js", ".mjs"].includes(extname(entry.name)) ? [child] : [];
  });
}

function modelNames(schema: string) {
  return [...schema.matchAll(/^model\s+(\w+)\s+\{/gm)].map((match) => match[1]!);
}

function modelBlock(schema: string, model: string) {
  const match = schema.match(new RegExp(`^model ${model} \\{[\\s\\S]*?^\\}`, "m"));
  assert.ok(match, `model ${model} must exist`);
  return match[0];
}

function fileSha256(path: string) {
  return createHash("sha256").update(source(path)).digest("hex");
}

function validEvidence({
  rateBucketCount = 6,
  firstProjectionCount = rateBucketCount,
  includeStabilityReference = true,
}: {
  rateBucketCount?: number;
  firstProjectionCount?: number;
  includeStabilityReference?: boolean;
} = {}): Pr6ProjectionEvidence {
  const migrationSql = source(PR6_MIGRATION_PATH);
  const head = "a".repeat(40);
  return {
    head,
    originMain: PR6_BASE_SHA,
    branch: PR6_BRANCH,
    workingTreeClean: true,
    transactionReadOnly: "on",
    targetTables: PR6_TARGET_TABLES.map(({ table }) => ({
      table,
      exists: true,
      indexes: [`${table}_representative_index`],
    })),
    targetRowCounts: Object.fromEntries(
      [
        ...PR6_EXACT_COUNT_TARGETS.map(({ table, expectedCurrentCount }) => [
          table,
          expectedCurrentCount,
        ] as const),
        [PR6_RATE_BUCKET_TARGET.table, rateBucketCount] as const,
      ],
    ),
    foreignKeys: [...PR6_EXPECTED_FOREIGN_KEYS],
    triggers: PR6_TARGET_TRIGGERS.map((trigger) => ({ ...trigger, enabled: "ENABLED" })),
    functions: PR6_TARGET_FUNCTIONS.map((name) => ({
      name,
      identityArguments: "",
      returnType: "trigger",
    })),
    functionDependants: PR6_TARGET_TRIGGERS.map((trigger) => ({
      functionName: trigger.functionName,
      dependantType: "TRIGGER",
      dependantName: trigger.name,
      parentTable: trigger.parentTable,
    })),
    relationDependants: [],
    functionTableReferences: [],
    keepSet: {
      tables: Object.fromEntries(PR6_KEEP_TABLES.map((table) => [table, true])),
      accountIssuer: { exists: true, nonNullable: true },
      accountIdentityInvariant: {
        exists: true,
        unique: true,
        columns: ["issuer", "accountId"],
      },
      accountCompatibilityTrigger: {
        exists: true,
        parentTable: "Account",
        functionName: "set_better_auth_account_issuer",
        enabled: "ENABLED",
      },
      accountCompatibilityFunction: {
        exists: true,
        identityArguments: "",
        returnType: "trigger",
      },
    },
    routeBaseline: { ...PR6_ROUTE_BASELINE },
    migration: {
      path: PR6_MIGRATION_PATH,
      sqlSha256: sha256(migrationSql),
      inspection: inspectPr6MigrationSql(migrationSql),
      appliedProductionRows: 0,
    },
    immutableMigrationChangedFiles: [],
    publicRuntimeChangedFiles: [],
    activeRuntimeConsumerFiles: [],
    retirementEvidence: {
      mcpOauthTransportAbsent: true,
      externalConnectorsRetiredAccordingToPr5: true,
      unexpectedMcpOauthRuntimeSurfaceFiles: [],
    },
    rateBucketStabilityReference: includeStabilityReference
      ? createPr6RateBucketStabilityReference({
          head,
          originMain: PR6_BASE_SHA,
          capturedAt: "2026-09-14T10:00:00.000Z",
          rateBucketCount: firstProjectionCount,
          transactionReadOnly: "on",
          productionMutationPerformed: false,
        })
      : null,
  };
}

test("PR6 removal remains exact while the later official MFA model is isolated", () => {
  const baselineSchema = gitShow("prisma/schema.prisma");
  const currentSchema = source("prisma/schema.prisma");
  const baselineModels = modelNames(baselineSchema);
  const currentModels = modelNames(currentSchema);
  const currentSet = new Set(currentModels);
  const baselineSet = new Set(baselineModels);

  assert.deepEqual(
    baselineModels.filter((model) => !currentSet.has(model)),
    expectedModels,
  );
  assert.deepEqual(currentModels.filter((model) => !baselineSet.has(model)), ["TwoFactor"]);
  for (const model of expectedModels) {
    assert.doesNotMatch(currentSchema, new RegExp(`^model ${model} \\{`, "m"));
  }
});

test("PR6 preserves current authentication, MFA, identity, generic verification, and AuditLog schema", () => {
  const schema = source("prisma/schema.prisma");
  for (const model of ["User", "Session", "Account", "TwoFactor", "Verification", "AuditLog", "AdminUser"]) {
    assert.match(schema, new RegExp(`^model ${model} \\{`, "m"));
  }

  const user = modelBlock(schema, "User");
  const session = modelBlock(schema, "Session");
  const account = modelBlock(schema, "Account");
  assert.match(user, /^\s+sessions\s+Session\[\]/m);
  assert.match(user, /^\s+accounts\s+Account\[\]/m);
  assert.match(session, /^\s+user\s+User\s+@relation/m);
  assert.match(account, /^\s+issuer\s+String$/m);
  assert.match(account, /^\s+providerId\s+String$/m);
  assert.match(account, /^\s+password\s+String\?/m);
  assert.match(account, /@@unique\(\[issuer, accountId\], map: "account_issuer_accountId_uidx"\)/);
  assert.doesNotMatch(`${user}\n${session}`, new RegExp(expectedModels.join("|")));
});

test("immutable auth connector migrations remain byte-for-byte unchanged", () => {
  assert.deepEqual(
    [
      fileSha256("prisma/migrations/0021_partner_ops_work_bridge_01/migration.sql"),
      fileSha256("prisma/migrations/0022_better_auth_17_schema_upgrade/migration.sql"),
      fileSha256("prisma/migrations/0023_mcp_dcr_runtime_compat_fix/migration.sql"),
    ],
    [
      "dafe1e3a52e564033231727f58f0519746aa3e4b23e5ade98b8ec16e8c4758e8",
      "af1303ba125049702afbdbf81deac5ff9dd27d91ef554c695a82b41e498453af",
      "6e0d7fd99766e2ecfdc92018a0efb667d64e4639b8387fd5720ff077742621f9",
    ],
  );
});

test("0041 is an exact explicit no-CASCADE cleanup and cannot target the KEEP set", () => {
  const migrations = readdirSync(join(root, "prisma/migrations"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.ok(migrations.includes("0041_commercial_core_legacy_connector_cleanup"));
  assert.equal(migrations.at(-1), "0042_admin_mfa");

  const sql = source(PR6_MIGRATION_PATH);
  const inspection = inspectPr6MigrationSql(sql);
  assert.equal(inspection.containsCascade, false);
  assert.equal(inspection.approvedObjectsOnly, true);
  assert.equal(inspection.exactApprovedOrder, true);
  assert.deepEqual(inspection.unexpectedStatements, []);
  assert.deepEqual(inspection.keepSetTargets, []);
  assert.equal(inspection.statements.length, 16);
  assert.deepEqual(
    inspection.statements.filter((statement) => statement.kind === "TABLE").map(({ name }) => name).sort(),
    [...expectedTables].sort(),
  );
  assert.doesNotMatch(sql, /\b(?:ALTER|DELETE|UPDATE|TRUNCATE|CASCADE|IF\s+EXISTS)\b/i);
  assert.doesNotMatch(sql, /Account_better_auth_issuer_compat|set_better_auth_account_issuer/);
});

test("current operations documentation marks PR6 applied, retired, and non-repeatable", () => {
  const runbook = source("docs/06_Operations/Commercial-Core-PR6-Legacy-Cleanup.md");
  assert.match(runbook, /Status:\*\* APPLIED — RETIRED — DO NOT RE-RUN/);
  assert.match(runbook, /all 41 ordered\s+migrations are complete/);
  assert.match(runbook, /none of the eight retired target tables remains/);
  assert.match(runbook, /not a current operational instruction/);

  const index = source("docs/06_Operations/README.md");
  assert.match(index, /Commercial-Core-PR5-MCP-Extraction-Retirement\.md/);
  assert.match(index, /Applied one-time connector-schema deletion/);
  assert.doesNotMatch(index, /Review-only exact connector-schema deletion/);
});

test("active application and bounded public-commercial runtime have no PR6 target consumer or change", () => {
  const activeRuntimePaths = [
    ...sourceFiles("app"),
    ...sourceFiles("components"),
    ...sourceFiles("lib"),
    "middleware.ts",
    "next.config.mjs",
  ];
  const targetReference = new RegExp(
    `\\b(?:${PR6_TARGET_TABLES.flatMap(({ model, table }) => [model, table]).join("|")})\\b`,
  );
  assert.deepEqual(
    activeRuntimePaths.filter((path) => targetReference.test(source(path))),
    [],
  );
  for (const path of PR6_PUBLIC_RUNTIME_FILES) {
    assert.equal(source(path), gitShow(path), `${path} must remain byte-for-byte unchanged`);
  }
});

test("the Production projector is fail-closed, truly read-only, and aggregate-only for target storage", () => {
  const projector = source("scripts/commercial-core-pr6-legacy-cleanup-projection.ts");
  assert.match(projector, /TransactionIsolationLevel\.RepeatableRead/);
  assert.match(projector, /SET TRANSACTION READ ONLY/);
  assert.match(projector, /SHOW transaction_read_only/);
  assert.match(projector, /databaseFingerprint:\s*"MATCHED"/);
  assert.match(projector, /productionMutationPerformed:\s*false/g);
  assert.doesNotMatch(projector, /\.(?:oauthClient|oauthResource|oauthClientResource|oauthRefreshToken|oauthAccessToken|oauthConsent|oauthClientAssertion|commercialMcpRateLimitBucket)\b/);
  assert.doesNotMatch(projector, /clientSecret|redirectUris?|authorizationCode|\btokenValue\b|rawMetadata/i);
  assert.match(projector, /--capture-rate-bucket-reference=/);
  assert.match(projector, /--compare-rate-bucket-reference=/);
  assert.match(projector, /flag:\s*"wx"/);

  const countsQuery = projector.match(
    /async function targetCounts[\s\S]*?\n}\n\nasync function rateBucketLifecycleSummary/,
  )?.[0];
  assert.ok(countsQuery);
  assert.equal((countsQuery.match(/count\(\*\)::int/g) ?? []).length, 8);
  assert.doesNotMatch(countsQuery, /SELECT\s+\*/i);
});

test("PR5 retirement evidence is current and contains no stale connector-incomplete state", () => {
  const pr5Runbook = source("docs/06_Operations/Commercial-Core-PR5-MCP-Extraction-Retirement.md");
  const currentState = source("docs/CURRENT_STATE.md");
  assert.match(pr5Runbook, /removed both registrations\. They must not be recreated or reconnected\./);
  assert.match(currentState, /EXTERNAL CONNECTORS COMPLETE/);
  assert.doesNotMatch(
    currentState,
    /EXTERNAL CONNECTIONS DETECTED; PR5 REPOSITORY RETIREMENT READY FOR RE-REVIEW|removal is required immediately before deployment and is not completed/,
  );
});

test("the old rate-bucket count is historical reference only", () => {
  assert.equal(PR6_EXACT_COUNT_TARGETS.length, 7);
  assert.equal(
    PR6_EXACT_COUNT_TARGETS.map(({ table }) => String(table)).includes(PR6_RATE_BUCKET_TARGET.table),
    false,
  );
  assert.deepEqual(PR6_RATE_BUCKET_TARGET, {
    model: "CommercialMcpRateLimitBucket",
    table: "CommercialMcpRateLimitBucket",
    historicalReferenceCount: 8,
  });
  assert.equal(expectedPr6HistoricalReferenceTotalRows(), 513);
  assert.doesNotMatch(canonicalJson(PR6_RATE_BUCKET_TARGET), /expectedCurrentCount|baselineCount/);
});

test("a stable bounded 8 to 6 decrease is accepted as ephemeral retirement drift", () => {
  const firstProjection = assessPr6Projection(validEvidence({ includeStabilityReference: false }));
  assert.deepEqual(firstProjection.conflicts, []);
  assert.equal(firstProjection.readyToApply, false);
  assert.equal(firstProjection.requiresSecondProjection, true);
  assert.equal(firstProjection.referenceEligibleForSecondProjection, true);
  assert.equal(firstProjection.rateBucketReconciliation.stabilityStatus, "SECOND_PROJECTION_REQUIRED");

  const secondProjection = assessPr6Projection(validEvidence());
  assert.deepEqual(secondProjection.conflicts, []);
  assert.equal(secondProjection.readyToApply, true);
  assert.equal(secondProjection.totalRowsScheduledForDeletion, 511);
  assert.deepEqual(secondProjection.rateBucketReconciliation, {
    historicalReferenceCount: 8,
    firstProjectionCount: 6,
    secondProjectionCount: 6,
    reviewedCurrentBaseline: 6,
    deltaFromHistoricalReference: -2,
    driftClassification: PR6_RATE_BUCKET_DRIFT_CLASSIFICATION,
    stabilityStatus: "STABLE",
  });
});

test("rate-bucket increase and second-projection mutation fail closed", () => {
  const increased = assessPr6Projection(validEvidence({
    rateBucketCount: 9,
    firstProjectionCount: 9,
  }));
  assert.equal(increased.readyToApply, false);
  assert.match(
    increased.conflicts.join("\n"),
    /RATE_BUCKET_COUNT_EXCEEDS_HISTORICAL_REFERENCE:9>8/,
  );

  const changedAgain = assessPr6Projection(validEvidence({
    rateBucketCount: 5,
    firstProjectionCount: 6,
  }));
  assert.equal(changedAgain.readyToApply, false);
  assert.equal(changedAgain.rateBucketReconciliation.stabilityStatus, "CHANGED");
  assert.match(changedAgain.conflicts.join("\n"), /RATE_BUCKET_STATE_STILL_MUTATING/);
});

test("rate-bucket stability references are strict, read-only, and checksum-bound", () => {
  const reference = validEvidence().rateBucketStabilityReference;
  assert.ok(reference);
  assert.deepEqual(parsePr6RateBucketStabilityReference(structuredClone(reference)), reference);
  const corrupted = structuredClone(reference);
  corrupted.rateBucketCount = 5;
  assert.throws(
    () => parsePr6RateBucketStabilityReference(corrupted),
    /RATE_BUCKET_STABILITY_REFERENCE_CHECKSUM_MISMATCH/,
  );
});

test("reviewed plan hashing is deterministic, binds the exact current count, and excludes unreviewed values", () => {
  const evidence = validEvidence();
  const first = assessPr6Projection(evidence);
  assert.equal(first.readyToApply, true);
  assert.deepEqual(first.conflicts, []);
  assert.equal(first.totalRowsScheduledForDeletion, 511);

  const reordered = structuredClone(evidence);
  reordered.foreignKeys.reverse();
  reordered.triggers.reverse();
  reordered.functionDependants.reverse();
  const second = assessPr6Projection(reordered);
  assert.equal(second.reviewedPlanSha256, first.reviewedPlanSha256);

  const differentHead = structuredClone(evidence);
  differentHead.head = "b".repeat(40);
  assert.notEqual(assessPr6Projection(differentHead).reviewedPlanSha256, first.reviewedPlanSha256);

  const differentReferenceTimestamp = structuredClone(evidence);
  differentReferenceTimestamp.rateBucketStabilityReference =
    createPr6RateBucketStabilityReference({
      head: evidence.head,
      originMain: evidence.originMain,
      capturedAt: "2026-09-14T10:01:00.000Z",
      rateBucketCount: 6,
      transactionReadOnly: "on",
      productionMutationPerformed: false,
    });
  assert.equal(
    assessPr6Projection(differentReferenceTimestamp).reviewedPlanSha256,
    first.reviewedPlanSha256,
    "volatile capture time must not enter the reviewed plan",
  );

  const stableFive = assessPr6Projection(validEvidence({
    rateBucketCount: 5,
    firstProjectionCount: 5,
  }));
  assert.equal(stableFive.readyToApply, true);
  assert.notEqual(stableFive.reviewedPlanSha256, first.reviewedPlanSha256);
  assert.equal(stableFive.reviewedPlan.targetRowCounts.CommercialMcpRateLimitBucket, 5);

  const withUnreviewedSecret = evidence as Pr6ProjectionEvidence & {
    rawToken: string;
    clientSecret: string;
  };
  withUnreviewedSecret.rawToken = "pr6-token-sentinel-must-not-escape";
  withUnreviewedSecret.clientSecret = "pr6-client-secret-sentinel-must-not-escape";
  const renderedPlan = canonicalJson(assessPr6Projection(withUnreviewedSecret).reviewedPlan);
  assert.doesNotMatch(renderedPlan, /pr6-(?:token|client-secret)-sentinel/);
});

test("future APPLY state comparison is exact-hash with zero count tolerance", () => {
  const reviewedSix = assessPr6Projection(validEvidence());
  assert.equal(
    assessPr6ExactApplyState(reviewedSix.reviewedPlanSha256, reviewedSix).exactStateAndHashMatch,
    true,
  );

  const changedAfterCapture = assessPr6Projection(validEvidence({
    rateBucketCount: 5,
    firstProjectionCount: 6,
  }));
  const movingGate = assessPr6ExactApplyState(reviewedSix.reviewedPlanSha256, changedAfterCapture);
  assert.equal(movingGate.exactStateAndHashMatch, false);
  assert.deepEqual(movingGate.conflicts, ["FRESH_STATE_NOT_READY", "REVIEWED_PLAN_HASH_MISMATCH"]);

  const newlyStableFive = assessPr6Projection(validEvidence({
    rateBucketCount: 5,
    firstProjectionCount: 5,
  }));
  assert.equal(newlyStableFive.readyToApply, true);
  const exactHashGate = assessPr6ExactApplyState(reviewedSix.reviewedPlanSha256, newlyStableFive);
  assert.equal(exactHashGate.exactStateAndHashMatch, false);
  assert.deepEqual(exactHashGate.conflicts, ["REVIEWED_PLAN_HASH_MISMATCH"]);
});

test("count, dependency, KEEP-set, migration, and runtime drift force readyToApply=false", () => {
  const cases: Array<[string, (evidence: Pr6ProjectionEvidence) => void, RegExp]> = [
    ["row count", (evidence) => { evidence.targetRowCounts.oauthClient = 12; }, /TARGET_ROW_COUNT_DRIFT/],
    ["relation dependency", (evidence) => {
      evidence.relationDependants.push({
        targetTable: "oauthClient",
        dependantType: "VIEW",
        dependantName: "unexpected_consumer",
      });
    }, /UNEXPECTED_RELATION_DEPENDENCY/],
    ["function dependency", (evidence) => {
      evidence.functionDependants.push({
        functionName: "set_better_auth_oauth_resource_compat",
        dependantType: "ROUTINE",
        dependantName: "unexpected_consumer",
        parentTable: null,
      });
    }, /FUNCTION_DEPENDANT_GRAPH_DRIFT/],
    ["KEEP set", (evidence) => { evidence.keepSet.tables.AuditLog = false; }, /KEEP_TABLE_MISSING:AuditLog/],
    ["migration scope", (evidence) => { evidence.migration.inspection.approvedObjectsOnly = false; }, /MIGRATION_SCOPE_DRIFT/],
    ["runtime consumer", (evidence) => { evidence.activeRuntimeConsumerFiles = ["lib/unexpected.ts"]; }, /ACTIVE_RUNTIME_CONSUMER_FOUND/],
    ["transport", (evidence) => { evidence.retirementEvidence.mcpOauthTransportAbsent = false; }, /MCP_OAUTH_TRANSPORT_PRESENT/],
    ["runtime surface", (evidence) => {
      evidence.retirementEvidence.unexpectedMcpOauthRuntimeSurfaceFiles = ["app/api/mcp/new/route.ts"];
    }, /UNEXPECTED_MCP_OAUTH_RUNTIME_SURFACE/],
    ["connector retirement", (evidence) => {
      evidence.retirementEvidence.externalConnectorsRetiredAccordingToPr5 = false;
    }, /EXTERNAL_CONNECTOR_RETIREMENT_NOT_VERIFIED/],
  ];

  for (const [label, mutate, conflict] of cases) {
    const evidence = validEvidence();
    mutate(evidence);
    const result = assessPr6Projection(evidence);
    assert.equal(result.readyToApply, false, label);
    assert.match(result.conflicts.join("\n"), conflict, label);
  }
});
