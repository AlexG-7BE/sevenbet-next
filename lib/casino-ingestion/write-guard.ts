const LOCAL_DATABASE_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

export interface CasinoIngestionWriteAuthority {
  writeRequested: boolean;
  confirmation: string | undefined;
  databaseUrl: string | undefined;
  directUrl: string | undefined;
  ci: string | undefined;
  nodeEnv: string | undefined;
  vercelEnv: string | undefined;
}

function disposableUrl(value: string | undefined, label: string) {
  if (!value) throw new Error(`${label} is required for write mode.`);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid PostgreSQL URL.`);
  }
  if (!new Set(["postgres:", "postgresql:"]).has(parsed.protocol)) throw new Error(`${label} must use PostgreSQL.`);
  if (!LOCAL_DATABASE_HOSTS.has(parsed.hostname)) throw new Error(`${label} must resolve to loopback.`);
  const queryKeys = [...parsed.searchParams.keys()];
  if (queryKeys.some((key) => key !== "schema") || parsed.searchParams.getAll("schema").length > 1) {
    throw new Error(`${label} may only use one optional schema query parameter.`);
  }
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!databaseName.endsWith("_ci")) throw new Error(`${label} database name must end in _ci.`);
  const schema = parsed.searchParams.get("schema") ?? "public";
  if (!schema) throw new Error(`${label} schema must not be empty.`);
  return { hostname: parsed.hostname, port: parsed.port || "5432", databaseName, schema };
}

export function assertCasinoIngestionWriteAuthority(authority: CasinoIngestionWriteAuthority) {
  if (!authority.writeRequested) return { mode: "DRY_RUN" as const };
  if (authority.confirmation !== "CASINO_DATA_INGEST_02") throw new Error("Write mode requires --confirm-disposable=CASINO_DATA_INGEST_02.");
  if (authority.ci !== "true") throw new Error("Write mode requires CI=true.");
  if (authority.nodeEnv === "production" || authority.vercelEnv === "production") throw new Error("Production environments are forbidden.");
  const database = disposableUrl(authority.databaseUrl, "DATABASE_URL");
  const direct = disposableUrl(authority.directUrl, "DIRECT_URL");
  if (database.hostname !== direct.hostname || database.port !== direct.port || database.databaseName !== direct.databaseName || database.schema !== direct.schema) {
    throw new Error("DATABASE_URL and DIRECT_URL must identify the same disposable local database.");
  }
  return { mode: "WRITE" as const, target: `${database.hostname}:${database.port}/${database.databaseName}?schema=${encodeURIComponent(database.schema)}` };
}
