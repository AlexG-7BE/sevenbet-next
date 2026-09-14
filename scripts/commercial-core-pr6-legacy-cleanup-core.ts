import { createHash } from "node:crypto";

export const PR6_BASE_SHA = "313b18bfff5db98d7e66b16088ec3ed8537fc299";
export const PR6_BRANCH = "founder-office/pr6-legacy-cleanup-plan";
export const PR6_MIGRATION_PATH =
  "prisma/migrations/0041_commercial_core_legacy_connector_cleanup/migration.sql";

export const PR6_EXACT_COUNT_TARGETS = [
  { model: "OauthClient", table: "oauthClient", expectedCurrentCount: 11 },
  { model: "OauthResource", table: "oauthResource", expectedCurrentCount: 5 },
  { model: "OauthClientResource", table: "oauthClientResource", expectedCurrentCount: 11 },
  { model: "OauthRefreshToken", table: "oauthRefreshToken", expectedCurrentCount: 230 },
  { model: "OauthAccessToken", table: "oauthAccessToken", expectedCurrentCount: 240 },
  { model: "OauthConsent", table: "oauthConsent", expectedCurrentCount: 8 },
  { model: "OauthClientAssertion", table: "oauthClientAssertion", expectedCurrentCount: 0 },
] as const;

export const PR6_RATE_BUCKET_TARGET = {
  model: "CommercialMcpRateLimitBucket",
  table: "CommercialMcpRateLimitBucket",
  historicalReferenceCount: 8,
} as const;

export const PR6_TARGET_TABLES = [
  ...PR6_EXACT_COUNT_TARGETS,
  PR6_RATE_BUCKET_TARGET,
] as const;

export const PR6_RATE_BUCKET_DRIFT_CLASSIFICATION =
  "EXPECTED_EPHEMERAL_RETIREMENT_DRIFT" as const;
export const PR6_RATE_BUCKET_STABILITY_REFERENCE_SCHEMA =
  "commercial-core-pr6-rate-bucket-stability.v1" as const;

export const PR6_TARGET_TRIGGERS = [
  {
    name: "oauthClient_prepare_compat",
    parentTable: "oauthClient",
    functionName: "prepare_better_auth_oauth_client_compat",
  },
  {
    name: "oauthClient_resource_compat",
    parentTable: "oauthClient",
    functionName: "sync_better_auth_oauth_client_resource_compat",
  },
  {
    name: "oauthRefreshToken_resource_compat",
    parentTable: "oauthRefreshToken",
    functionName: "set_better_auth_oauth_resource_compat",
  },
  {
    name: "oauthAccessToken_resource_compat",
    parentTable: "oauthAccessToken",
    functionName: "set_better_auth_oauth_resource_compat",
  },
  {
    name: "oauthConsent_resource_compat",
    parentTable: "oauthConsent",
    functionName: "set_better_auth_oauth_resource_compat",
  },
] as const;

export const PR6_TARGET_FUNCTIONS = [
  "prepare_better_auth_oauth_client_compat",
  "sync_better_auth_oauth_client_resource_compat",
  "set_better_auth_oauth_resource_compat",
] as const;

export const PR6_KEEP_TABLES = [
  "User",
  "Session",
  "Account",
  "Verification",
  "AuditLog",
] as const;

export const PR6_PUBLIC_RUNTIME_FILES = [
  "lib/commercial/public-commercial-action-resolver.ts",
  "lib/services/affiliate-redirect.service.ts",
  "lib/market-activation/runtime.ts",
  "lib/market-activation/repository.ts",
  "lib/services/public-casino-discovery.service.ts",
] as const;

export const PR6_ROUTE_BASELINE = {
  canonicalRouteCount: 81,
  healthyActiveRouteCount: 39,
  legacyZzRouteCount: 6,
  canonicalRouteDigestSha256:
    "4764a59536fef067eed786b82f214ab55f3126d00dd2359b75eba7603f73600c",
} as const;

export type Pr6ForeignKey = {
  name: string;
  sourceTable: string;
  targetTable: string;
  onDelete: string;
  onUpdate: string;
};

export const PR6_EXPECTED_FOREIGN_KEYS: readonly Pr6ForeignKey[] = [
  {
    name: "oauthAccessToken_clientId_fkey",
    sourceTable: "oauthAccessToken",
    targetTable: "oauthClient",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },
  {
    name: "oauthAccessToken_refreshId_fkey",
    sourceTable: "oauthAccessToken",
    targetTable: "oauthRefreshToken",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },
  {
    name: "oauthAccessToken_sessionId_fkey",
    sourceTable: "oauthAccessToken",
    targetTable: "Session",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  },
  {
    name: "oauthAccessToken_userId_fkey",
    sourceTable: "oauthAccessToken",
    targetTable: "User",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },
  {
    name: "oauthClientResource_clientId_fkey",
    sourceTable: "oauthClientResource",
    targetTable: "oauthClient",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },
  {
    name: "oauthClientResource_resourceId_fkey",
    sourceTable: "oauthClientResource",
    targetTable: "oauthResource",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },
  {
    name: "oauthClient_userId_fkey",
    sourceTable: "oauthClient",
    targetTable: "User",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },
  {
    name: "oauthConsent_clientId_fkey",
    sourceTable: "oauthConsent",
    targetTable: "oauthClient",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },
  {
    name: "oauthConsent_userId_fkey",
    sourceTable: "oauthConsent",
    targetTable: "User",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },
  {
    name: "oauthRefreshToken_clientId_fkey",
    sourceTable: "oauthRefreshToken",
    targetTable: "oauthClient",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },
  {
    name: "oauthRefreshToken_sessionId_fkey",
    sourceTable: "oauthRefreshToken",
    targetTable: "Session",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  },
  {
    name: "oauthRefreshToken_userId_fkey",
    sourceTable: "oauthRefreshToken",
    targetTable: "User",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },
] as const;

export type Pr6TriggerInventory = {
  name: string;
  parentTable: string;
  functionName: string;
  enabled: string;
};

export type Pr6FunctionInventory = {
  name: string;
  identityArguments: string;
  returnType: string;
};

export type Pr6FunctionDependant = {
  functionName: string;
  dependantType: string;
  dependantName: string;
  parentTable: string | null;
};

export type Pr6RelationDependant = {
  targetTable: string;
  dependantType: string;
  dependantName: string;
};

export type Pr6MigrationStatement =
  | { kind: "TRIGGER"; name: string; parentTable: string }
  | { kind: "FUNCTION"; name: string }
  | { kind: "TABLE"; name: string };

export type Pr6MigrationInspection = {
  containsCascade: boolean;
  statements: Pr6MigrationStatement[];
  unexpectedStatements: string[];
  exactApprovedOrder: boolean;
  approvedObjectsOnly: boolean;
  keepSetTargets: string[];
};

const expectedMigrationStatements: Pr6MigrationStatement[] = [
  ...PR6_TARGET_TRIGGERS.map((trigger) => ({
    kind: "TRIGGER" as const,
    name: trigger.name,
    parentTable: trigger.parentTable,
  })),
  ...PR6_TARGET_FUNCTIONS.map((name) => ({ kind: "FUNCTION" as const, name })),
  ...[
    "oauthAccessToken",
    "oauthConsent",
    "oauthClientResource",
    "oauthRefreshToken",
    "oauthClientAssertion",
    "CommercialMcpRateLimitBucket",
    "oauthResource",
    "oauthClient",
  ].map((name) => ({ kind: "TABLE" as const, name })),
];

function stableRecord(value: unknown): unknown {
  if (typeof value === "bigint") return Number(value);
  if (Array.isArray(value)) return value.map(stableRecord);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, child]) => child !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, stableRecord(child)]),
    );
  }
  return value;
}

export function canonicalJson(value: unknown) {
  return JSON.stringify(stableRecord(value));
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createPr6RateBucketStabilityReference(
  input: Omit<Pr6RateBucketStabilityReferencePayload, "schemaVersion">,
): Pr6RateBucketStabilityReference {
  const payload: Pr6RateBucketStabilityReferencePayload = {
    schemaVersion: PR6_RATE_BUCKET_STABILITY_REFERENCE_SCHEMA,
    ...input,
  };
  return {
    ...payload,
    referenceSha256: sha256(canonicalJson(payload)),
  };
}

export function parsePr6RateBucketStabilityReference(
  value: unknown,
): Pr6RateBucketStabilityReference {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("RATE_BUCKET_STABILITY_REFERENCE_INVALID");
  }
  const record = value as Record<string, unknown>;
  const expectedKeys = [
    "capturedAt",
    "head",
    "originMain",
    "productionMutationPerformed",
    "rateBucketCount",
    "referenceSha256",
    "schemaVersion",
    "transactionReadOnly",
  ];
  if (canonicalJson(Object.keys(record).sort()) !== canonicalJson(expectedKeys)) {
    throw new Error("RATE_BUCKET_STABILITY_REFERENCE_INVALID");
  }
  if (
    record.schemaVersion !== PR6_RATE_BUCKET_STABILITY_REFERENCE_SCHEMA
    || typeof record.head !== "string"
    || !/^[0-9a-f]{40}$/.test(record.head)
    || typeof record.originMain !== "string"
    || !/^[0-9a-f]{40}$/.test(record.originMain)
    || typeof record.capturedAt !== "string"
    || Number.isNaN(Date.parse(record.capturedAt))
    || !Number.isSafeInteger(record.rateBucketCount)
    || Number(record.rateBucketCount) < 0
    || record.transactionReadOnly !== "on"
    || record.productionMutationPerformed !== false
    || typeof record.referenceSha256 !== "string"
    || !/^[0-9a-f]{64}$/.test(record.referenceSha256)
  ) {
    throw new Error("RATE_BUCKET_STABILITY_REFERENCE_INVALID");
  }
  const reference = record as Pr6RateBucketStabilityReference;
  const { referenceSha256, ...payload } = reference;
  if (sha256(canonicalJson(payload)) !== referenceSha256) {
    throw new Error("RATE_BUCKET_STABILITY_REFERENCE_CHECKSUM_MISMATCH");
  }
  return reference;
}

export function inspectPr6MigrationSql(sql: string): Pr6MigrationInspection {
  const statements: Pr6MigrationStatement[] = [];
  const unexpectedStatements: string[] = [];
  const rawStatements = sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of rawStatements) {
    let match = statement.match(/^DROP\s+TRIGGER\s+"([^"]+)"\s+ON\s+"([^"]+)"$/i);
    if (match) {
      statements.push({ kind: "TRIGGER", name: match[1]!, parentTable: match[2]! });
      continue;
    }
    match = statement.match(/^DROP\s+FUNCTION\s+"([^"]+)"\(\)$/i);
    if (match) {
      statements.push({ kind: "FUNCTION", name: match[1]! });
      continue;
    }
    match = statement.match(/^DROP\s+TABLE\s+"([^"]+)"$/i);
    if (match) {
      statements.push({ kind: "TABLE", name: match[1]! });
      continue;
    }
    unexpectedStatements.push(statement.replace(/\s+/g, " "));
  }

  const approvedTriggerKeys = new Set(
    PR6_TARGET_TRIGGERS.map((trigger) => `${trigger.name}\n${trigger.parentTable}`),
  );
  const approvedFunctions = new Set<string>(PR6_TARGET_FUNCTIONS);
  const approvedTables = new Set<string>(PR6_TARGET_TABLES.map(({ table }) => table));
  const approvedObjectsOnly = unexpectedStatements.length === 0 && statements.every((statement) => {
    if (statement.kind === "TRIGGER") {
      return approvedTriggerKeys.has(`${statement.name}\n${statement.parentTable}`);
    }
    if (statement.kind === "FUNCTION") return approvedFunctions.has(statement.name);
    return approvedTables.has(statement.name);
  });
  const keepSetTargets = statements
    .filter((statement) => statement.kind === "TABLE" && (PR6_KEEP_TABLES as readonly string[]).includes(statement.name))
    .map((statement) => statement.name)
    .sort();

  return {
    containsCascade: /\bCASCADE\b/i.test(sql),
    statements,
    unexpectedStatements,
    exactApprovedOrder: canonicalJson(statements) === canonicalJson(expectedMigrationStatements),
    approvedObjectsOnly,
    keepSetTargets,
  };
}

export type Pr6KeepSetEvidence = {
  tables: Record<string, boolean>;
  accountIssuer: { exists: boolean; nonNullable: boolean };
  accountIdentityInvariant: {
    exists: boolean;
    unique: boolean;
    columns: string[];
  };
  accountCompatibilityTrigger: {
    exists: boolean;
    parentTable: string | null;
    functionName: string | null;
    enabled: string | null;
  };
  accountCompatibilityFunction: {
    exists: boolean;
    identityArguments: string | null;
    returnType: string | null;
  };
};

export type Pr6RateBucketStabilityReferencePayload = {
  schemaVersion: typeof PR6_RATE_BUCKET_STABILITY_REFERENCE_SCHEMA;
  head: string;
  originMain: string;
  capturedAt: string;
  rateBucketCount: number;
  transactionReadOnly: "on";
  productionMutationPerformed: false;
};

export type Pr6RateBucketStabilityReference =
  Pr6RateBucketStabilityReferencePayload & {
    referenceSha256: string;
  };

export type Pr6RetirementEvidence = {
  mcpOauthTransportAbsent: boolean;
  externalConnectorsRetiredAccordingToPr5: boolean;
  unexpectedMcpOauthRuntimeSurfaceFiles: string[];
};

export type Pr6ProjectionEvidence = {
  head: string;
  originMain: string;
  branch: string;
  workingTreeClean: boolean;
  transactionReadOnly: string;
  targetTables: Array<{ table: string; exists: boolean; indexes: string[] }>;
  targetRowCounts: Record<string, number | null>;
  foreignKeys: Pr6ForeignKey[];
  triggers: Pr6TriggerInventory[];
  functions: Pr6FunctionInventory[];
  functionDependants: Pr6FunctionDependant[];
  relationDependants: Pr6RelationDependant[];
  functionTableReferences: Array<{ functionName: string; targetTable: string }>;
  keepSet: Pr6KeepSetEvidence;
  routeBaseline: {
    canonicalRouteCount: number;
    healthyActiveRouteCount: number;
    legacyZzRouteCount: number;
    canonicalRouteDigestSha256: string;
  };
  migration: {
    path: string;
    sqlSha256: string;
    inspection: Pr6MigrationInspection;
    appliedProductionRows: number;
  };
  immutableMigrationChangedFiles: string[];
  publicRuntimeChangedFiles: string[];
  activeRuntimeConsumerFiles: string[];
  retirementEvidence: Pr6RetirementEvidence;
  rateBucketStabilityReference: Pr6RateBucketStabilityReference | null;
};

function sorted<T>(values: readonly T[], render: (value: T) => string) {
  return [...values].sort((left, right) => render(left).localeCompare(render(right)));
}

export function expectedPr6HistoricalReferenceTotalRows() {
  return PR6_EXACT_COUNT_TARGETS.reduce<number>(
    (total, target) => total + target.expectedCurrentCount,
    PR6_RATE_BUCKET_TARGET.historicalReferenceCount,
  );
}

export function assessPr6Projection(evidence: Pr6ProjectionEvidence) {
  const conflicts: string[] = [];
  if (evidence.originMain !== PR6_BASE_SHA) {
    conflicts.push(`ORIGIN_MAIN_DRIFT:${evidence.originMain}`);
  }
  if (evidence.branch !== PR6_BRANCH) conflicts.push(`UNEXPECTED_BRANCH:${evidence.branch}`);
  if (!/^[0-9a-f]{40}$/.test(evidence.head)) conflicts.push("HEAD_INVALID");
  if (!evidence.workingTreeClean) conflicts.push("WORKTREE_NOT_CLEAN");
  const transactionReadOnly = evidence.transactionReadOnly === "on";
  if (!transactionReadOnly) conflicts.push("TRANSACTION_NOT_READ_ONLY");

  for (const target of PR6_TARGET_TABLES) {
    const inventory = evidence.targetTables.find((entry) => entry.table === target.table);
    if (!inventory?.exists) conflicts.push(`TARGET_TABLE_MISSING:${target.table}`);
  }
  for (const target of PR6_EXACT_COUNT_TARGETS) {
    const count = evidence.targetRowCounts[target.table];
    if (count !== target.expectedCurrentCount) {
      conflicts.push(
        `TARGET_ROW_COUNT_DRIFT:${target.table}:${String(count)}!=${target.expectedCurrentCount}`,
      );
    }
  }

  const rateBucketRawCount = evidence.targetRowCounts[PR6_RATE_BUCKET_TARGET.table];
  const rateBucketCount = typeof rateBucketRawCount === "number"
    && Number.isSafeInteger(rateBucketRawCount)
    && rateBucketRawCount >= 0
    ? rateBucketRawCount
    : null;
  const rateBucketWithinHistoricalReference = rateBucketCount !== null
    && rateBucketCount <= PR6_RATE_BUCKET_TARGET.historicalReferenceCount;
  if (rateBucketCount === null) {
    conflicts.push(`RATE_BUCKET_COUNT_INVALID:${String(rateBucketRawCount)}`);
  } else if (!rateBucketWithinHistoricalReference) {
    conflicts.push(
      `RATE_BUCKET_COUNT_EXCEEDS_HISTORICAL_REFERENCE:${rateBucketCount}>${PR6_RATE_BUCKET_TARGET.historicalReferenceCount}`,
    );
  }

  const actualForeignKeys = sorted(evidence.foreignKeys, (entry) => canonicalJson(entry));
  const expectedForeignKeys = sorted(PR6_EXPECTED_FOREIGN_KEYS, (entry) => canonicalJson(entry));
  const foreignKeyGraphMatches = canonicalJson(actualForeignKeys) === canonicalJson(expectedForeignKeys);
  if (!foreignKeyGraphMatches) conflicts.push("FOREIGN_KEY_GRAPH_DRIFT");

  const actualTriggers = sorted(
    evidence.triggers.map(({ name, parentTable, functionName }) => ({ name, parentTable, functionName })),
    (entry) => canonicalJson(entry),
  );
  const expectedTriggers = sorted(PR6_TARGET_TRIGGERS, (entry) => canonicalJson(entry));
  const triggerGraphMatches = canonicalJson(actualTriggers) === canonicalJson(expectedTriggers);
  if (!triggerGraphMatches) conflicts.push("TRIGGER_GRAPH_DRIFT");
  const targetTriggersEnabled = evidence.triggers.every((trigger) => trigger.enabled !== "DISABLED");
  if (!targetTriggersEnabled) conflicts.push("TARGET_TRIGGER_DISABLED_DRIFT");

  const actualFunctions = sorted(evidence.functions, (entry) => canonicalJson(entry));
  const expectedFunctions = sorted(
    PR6_TARGET_FUNCTIONS.map((name) => ({ name, identityArguments: "", returnType: "trigger" })),
    (entry) => canonicalJson(entry),
  );
  const functionInventoryMatches = canonicalJson(actualFunctions) === canonicalJson(expectedFunctions);
  if (!functionInventoryMatches) conflicts.push("FUNCTION_INVENTORY_DRIFT");

  const actualFunctionDependants = sorted(evidence.functionDependants, (entry) => canonicalJson(entry));
  const expectedFunctionDependants = sorted(
    PR6_TARGET_TRIGGERS.map((trigger) => ({
      functionName: trigger.functionName,
      dependantType: "TRIGGER",
      dependantName: trigger.name,
      parentTable: trigger.parentTable,
    })),
    (entry) => canonicalJson(entry),
  );
  const functionDependantGraphMatches = canonicalJson(actualFunctionDependants)
    === canonicalJson(expectedFunctionDependants);
  if (!functionDependantGraphMatches) conflicts.push("FUNCTION_DEPENDANT_GRAPH_DRIFT");
  if (evidence.relationDependants.length) conflicts.push("UNEXPECTED_RELATION_DEPENDENCY");
  if (evidence.functionTableReferences.length) conflicts.push("UNEXPECTED_FUNCTION_TABLE_DEPENDENCY");
  const dependencyGraphMatches = foreignKeyGraphMatches
    && triggerGraphMatches
    && targetTriggersEnabled
    && functionInventoryMatches
    && functionDependantGraphMatches
    && evidence.relationDependants.length === 0
    && evidence.functionTableReferences.length === 0;

  for (const table of PR6_KEEP_TABLES) {
    if (!evidence.keepSet.tables[table]) conflicts.push(`KEEP_TABLE_MISSING:${table}`);
  }
  if (!evidence.keepSet.accountIssuer.exists || !evidence.keepSet.accountIssuer.nonNullable) {
    conflicts.push("ACCOUNT_ISSUER_INVARIANT_MISSING");
  }
  if (
    !evidence.keepSet.accountIdentityInvariant.exists
    || !evidence.keepSet.accountIdentityInvariant.unique
    || canonicalJson(evidence.keepSet.accountIdentityInvariant.columns) !== canonicalJson(["issuer", "accountId"])
  ) {
    conflicts.push("ACCOUNT_IDENTITY_INDEX_MISSING");
  }
  const keepTrigger = evidence.keepSet.accountCompatibilityTrigger;
  if (
    !keepTrigger.exists
    || keepTrigger.parentTable !== "Account"
    || keepTrigger.functionName !== "set_better_auth_account_issuer"
    || keepTrigger.enabled === "DISABLED"
  ) {
    conflicts.push("ACCOUNT_COMPATIBILITY_TRIGGER_MISSING");
  }
  const keepFunction = evidence.keepSet.accountCompatibilityFunction;
  if (
    !keepFunction.exists
    || keepFunction.identityArguments !== ""
    || keepFunction.returnType !== "trigger"
  ) {
    conflicts.push("ACCOUNT_COMPATIBILITY_FUNCTION_MISSING");
  }

  let routeBaselineMatches = true;
  for (const [key, expected] of Object.entries(PR6_ROUTE_BASELINE)) {
    if (evidence.routeBaseline[key as keyof typeof PR6_ROUTE_BASELINE] !== expected) {
      conflicts.push(`ROUTE_BASELINE_DRIFT:${key}`);
      routeBaselineMatches = false;
    }
  }
  if (evidence.migration.path !== PR6_MIGRATION_PATH) conflicts.push("MIGRATION_PATH_DRIFT");
  if (evidence.migration.inspection.containsCascade) conflicts.push("MIGRATION_CONTAINS_CASCADE");
  if (!evidence.migration.inspection.approvedObjectsOnly) conflicts.push("MIGRATION_SCOPE_DRIFT");
  if (!evidence.migration.inspection.exactApprovedOrder) conflicts.push("MIGRATION_ORDER_DRIFT");
  if (evidence.migration.inspection.keepSetTargets.length) conflicts.push("MIGRATION_TARGETS_KEEP_SET");
  if (evidence.migration.appliedProductionRows !== 0) conflicts.push("MIGRATION_ALREADY_APPLIED");
  if (evidence.immutableMigrationChangedFiles.length) conflicts.push("IMMUTABLE_MIGRATION_CHANGED");
  if (evidence.publicRuntimeChangedFiles.length) conflicts.push("PUBLIC_RUNTIME_CHANGED");
  const noActiveRuntimeConsumer = evidence.activeRuntimeConsumerFiles.length === 0;
  if (!noActiveRuntimeConsumer) conflicts.push("ACTIVE_RUNTIME_CONSUMER_FOUND");
  if (!evidence.retirementEvidence.mcpOauthTransportAbsent) {
    conflicts.push("MCP_OAUTH_TRANSPORT_PRESENT");
  }
  if (!evidence.retirementEvidence.externalConnectorsRetiredAccordingToPr5) {
    conflicts.push("EXTERNAL_CONNECTOR_RETIREMENT_NOT_VERIFIED");
  }
  if (evidence.retirementEvidence.unexpectedMcpOauthRuntimeSurfaceFiles.length) {
    conflicts.push("UNEXPECTED_MCP_OAUTH_RUNTIME_SURFACE");
  }

  const reference = evidence.rateBucketStabilityReference;
  let referenceValid = reference !== null;
  if (reference) {
    const { referenceSha256, ...payload } = reference;
    if (sha256(canonicalJson(payload)) !== referenceSha256) {
      conflicts.push("RATE_BUCKET_STABILITY_REFERENCE_CHECKSUM_MISMATCH");
      referenceValid = false;
    }
    if (reference.head !== evidence.head) {
      conflicts.push("RATE_BUCKET_STABILITY_REFERENCE_HEAD_MISMATCH");
      referenceValid = false;
    }
    if (reference.originMain !== evidence.originMain) {
      conflicts.push("RATE_BUCKET_STABILITY_REFERENCE_BASE_MISMATCH");
      referenceValid = false;
    }
    if (reference.transactionReadOnly !== "on" || reference.productionMutationPerformed !== false) {
      conflicts.push("RATE_BUCKET_STABILITY_REFERENCE_NOT_READ_ONLY");
      referenceValid = false;
    }
    if (reference.rateBucketCount !== rateBucketCount) {
      conflicts.push("RATE_BUCKET_STATE_STILL_MUTATING");
    }
  }
  const rateBucketStateStable = Boolean(
    reference
    && referenceValid
    && rateBucketCount !== null
    && reference.rateBucketCount === rateBucketCount,
  );
  const rateBucketPreStabilityGatePassed = noActiveRuntimeConsumer
    && evidence.retirementEvidence.mcpOauthTransportAbsent
    && evidence.retirementEvidence.externalConnectorsRetiredAccordingToPr5
    && evidence.retirementEvidence.unexpectedMcpOauthRuntimeSurfaceFiles.length === 0
    && rateBucketWithinHistoricalReference
    && dependencyGraphMatches
    && transactionReadOnly
    && routeBaselineMatches;
  const rateBucketAccepted = rateBucketPreStabilityGatePassed && rateBucketStateStable;
  const rateBucketReconciliation = {
    historicalReferenceCount: PR6_RATE_BUCKET_TARGET.historicalReferenceCount,
    firstProjectionCount: reference?.rateBucketCount ?? null,
    secondProjectionCount: rateBucketCount,
    reviewedCurrentBaseline: rateBucketAccepted ? rateBucketCount : null,
    deltaFromHistoricalReference: rateBucketCount === null
      ? null
      : rateBucketCount - PR6_RATE_BUCKET_TARGET.historicalReferenceCount,
    driftClassification: rateBucketAccepted
      ? rateBucketCount! < PR6_RATE_BUCKET_TARGET.historicalReferenceCount
        ? PR6_RATE_BUCKET_DRIFT_CLASSIFICATION
        : "NO_EPHEMERAL_RETIREMENT_DRIFT"
      : "NOT_ACCEPTED",
    stabilityStatus: reference === null
      ? "SECOND_PROJECTION_REQUIRED"
      : rateBucketStateStable
        ? "STABLE"
        : reference.rateBucketCount !== rateBucketCount
          ? "CHANGED"
          : "INVALID_REFERENCE",
  } as const;

  const uniqueConflicts = [...new Set(conflicts)].sort();
  const targetRowCounts = Object.fromEntries(
    PR6_TARGET_TABLES.map(({ table }) => [table, evidence.targetRowCounts[table] ?? null]),
  );
  const totalRowsScheduledForDeletion = Object.values(targetRowCounts).every((value) => typeof value === "number")
    ? Object.values(targetRowCounts).reduce<number>((total, value) => total + Number(value), 0)
    : null;
  const reviewedPlan = {
    schemaVersion: "commercial-core-pr6-reviewed-plan.v2",
    head: evidence.head,
    originMain: evidence.originMain,
    migrationSqlSha256: evidence.migration.sqlSha256,
    targets: {
      tables: [
        ...PR6_EXACT_COUNT_TARGETS.map(({ model, table, expectedCurrentCount }) => ({
          model,
          table,
          countPolicy: "EXACT_CURRENT_BASELINE" as const,
          expectedCurrentCount,
        })),
        {
          model: PR6_RATE_BUCKET_TARGET.model,
          table: PR6_RATE_BUCKET_TARGET.table,
          countPolicy: "EPHEMERAL_HISTORICAL_REFERENCE" as const,
          historicalReferenceCount: PR6_RATE_BUCKET_TARGET.historicalReferenceCount,
        },
      ],
      triggers: PR6_TARGET_TRIGGERS.map(({ name, parentTable }) => ({ name, parentTable })),
      functions: [...PR6_TARGET_FUNCTIONS],
    },
    targetRowCounts,
    rateBucketReconciliation,
    totalRowsScheduledForDeletion,
    retirementEvidence: {
      mcpOauthTransportAbsent: evidence.retirementEvidence.mcpOauthTransportAbsent,
      externalConnectorsRetiredAccordingToPr5:
        evidence.retirementEvidence.externalConnectorsRetiredAccordingToPr5,
      unexpectedMcpOauthRuntimeSurfaceFiles: [
        ...evidence.retirementEvidence.unexpectedMcpOauthRuntimeSurfaceFiles,
      ].sort(),
      activeRuntimeConsumerFiles: [...evidence.activeRuntimeConsumerFiles].sort(),
    },
    dependencyGraph: {
      foreignKeys: actualForeignKeys,
      triggerFunctions: actualFunctionDependants,
      unexpectedRelationDependants: sorted(evidence.relationDependants, (entry) => canonicalJson(entry)),
      unexpectedFunctionTableReferences: sorted(
        evidence.functionTableReferences,
        (entry) => canonicalJson(entry),
      ),
    },
    keepSet: evidence.keepSet,
    routeBaseline: evidence.routeBaseline,
    conflicts: uniqueConflicts,
  };

  return {
    conflicts: uniqueConflicts,
    readyToApply: uniqueConflicts.length === 0 && rateBucketAccepted,
    requiresSecondProjection: reference === null,
    referenceEligibleForSecondProjection:
      reference === null && uniqueConflicts.length === 0 && rateBucketPreStabilityGatePassed,
    rateBucketReconciliation,
    reviewedPlan,
    reviewedPlanSha256: sha256(canonicalJson(reviewedPlan)),
    totalRowsScheduledForDeletion,
  };
}

export function assessPr6ExactApplyState(
  authorisedReviewedPlanSha256: string,
  freshAssessment: Pick<ReturnType<typeof assessPr6Projection>, "readyToApply" | "reviewedPlanSha256">,
) {
  const conflicts: string[] = [];
  if (!/^[0-9a-f]{64}$/.test(authorisedReviewedPlanSha256)) {
    conflicts.push("AUTHORISED_REVIEWED_PLAN_HASH_INVALID");
  }
  if (!freshAssessment.readyToApply) conflicts.push("FRESH_STATE_NOT_READY");
  if (freshAssessment.reviewedPlanSha256 !== authorisedReviewedPlanSha256) {
    conflicts.push("REVIEWED_PLAN_HASH_MISMATCH");
  }
  return {
    exactStateAndHashMatch: conflicts.length === 0,
    conflicts,
  };
}
