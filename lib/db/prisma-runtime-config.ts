export type PrismaRuntimeConnectionMode = "pooled" | "direct" | "other" | "missing" | "invalid";

export type PrismaRuntimeConnectionInspection = {
  mode: PrismaRuntimeConnectionMode;
  warnings: string[];
};

const POOLED_HOST = "pooled.db.prisma.io";
const DIRECT_HOST = "db.prisma.io";

/**
 * The application's pool on the Prisma Postgres pooled endpoint, applied in
 * code to the runtime `DATABASE_URL` (Founder decision, 27 September 2026:
 * "B. База и клики без провалов").
 *
 * Why code and not the environment: Vercel Fluid compute serves many
 * concurrent requests from one function instance, and the Production
 * `DATABASE_URL` still says `connection_limit=1`. That serialised every query
 * on an instance — pages, `/r/` lookups, click writes in `after()` and auth —
 * on one connection (p90 over 1 s for `/r/`, P2024 pool timeouts, click
 * writes lost to the 5 s transaction timeout). Environment values are not
 * edited from the repository, so the runtime overrides these four parameters
 * for the pooled host whatever the URL says; every other parameter (TLS,
 * credentials, database) still comes from the environment.
 *
 * - `connection_limit` 3: a few queries in flight per instance. The pooled
 *   endpoint multiplexes onto the database's own pool (Prisma Postgres
 *   Starter allows roughly 50–100 pooled connections), so instances × 3 stays
 *   well inside it at our traffic.
 * - `pool_timeout` 5 s: a request that cannot get a connection fails fast
 *   into its fallback instead of waiting the 10 s default.
 * - `connect_timeout` 5 s: Prisma's documented default, pinned.
 * - `socket_timeout` 25 s: a half-open socket (P1017-class failure) or a hung
 *   query ends inside the 30 s function limit instead of the platform's 300 s.
 *   10 s cut off the whole-catalogue projection on Production (28 Sep 2026).
 *
 * Since 3 October 2026 the runtime client talks to the database through the
 * `pg` driver adapter; {@link runtimePgPool} carries these four values over
 * to the `pg` pool.
 *
 * Local, CI and any other host are left exactly as configured, so their
 * `connection_limit=1` disposable databases keep the one-connection FIFO of
 * `public-database-read-coordinator.ts`. `DIRECT_URL` (migrations and release
 * administration) is never touched.
 */
export const RUNTIME_POOL_POLICY = Object.freeze({
  connection_limit: 3,
  pool_timeout: 5,
  connect_timeout: 5,
  socket_timeout: 25,
});

/** The readiness gate refuses a policy that would stop bounding the pool. */
const MAXIMUM_RUNTIME_CONNECTION_LIMIT = 5;

function parseUrl(value: string | undefined) {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/**
 * The URL the application's Prisma client actually connects with: the
 * environment's pooled URL with the runtime pool policy applied. Any other
 * value is returned unchanged.
 */
export function applyRuntimePoolPolicy(value: string | undefined) {
  const url = parseUrl(value);
  if (!url || url.hostname !== POOLED_HOST) return value;
  for (const [name, setting] of Object.entries(RUNTIME_POOL_POLICY)) {
    url.searchParams.set(name, String(setting));
  }
  return url.toString();
}

/**
 * The effective per-instance connection limit, or null when the URL leaves it
 * to Prisma's default (num_cpus × 2 + 1) or cannot be read.
 */
export function runtimeConnectionLimit(value: string | undefined = process.env.DATABASE_URL) {
  const limit = parseUrl(applyRuntimePoolPolicy(value))?.searchParams.get("connection_limit");
  if (!limit || !/^\d+$/.test(limit)) return null;
  return Number(limit);
}

/**
 * True only when the effective runtime pool has exactly one connection
 * (disposable local/CI databases). Public reads then share one process-local
 * FIFO instead of competing for the single slot until Prisma's pool timeout.
 */
export function usesSingleConnectionPool(value: string | undefined = process.env.DATABASE_URL) {
  return runtimeConnectionLimit(value) === 1;
}

function positiveSeconds(url: URL, name: string) {
  const value = url.searchParams.get(name);
  return Boolean(value && /^\d+$/.test(value) && Number(value) > 0);
}

/**
 * Checks the runtime binding as the application will use it. Host and TLS
 * come from the environment and must be the approved pooled endpoint with
 * `sslmode=require`. Pool size and timeouts are the effective values after
 * {@link applyRuntimePoolPolicy}: a `connection_limit` in the environment is
 * overridden, so it is not a readiness condition any more, but the effective
 * pool must stay bounded and every timeout finite.
 */
export function inspectPrismaRuntimeConnection(value: string | undefined): PrismaRuntimeConnectionInspection {
  if (!value) return { mode: "missing", warnings: ["DATABASE_URL is missing."] };

  const url = parseUrl(value);
  if (!url) return { mode: "invalid", warnings: ["DATABASE_URL is not a valid URL."] };

  if (url.hostname === DIRECT_HOST) {
    return {
      mode: "direct",
      warnings: ["Production runtime is using the direct Prisma Postgres endpoint; configure the pooled runtime endpoint."],
    };
  }

  if (url.hostname !== POOLED_HOST) {
    return { mode: "other", warnings: ["Production runtime is not using the approved Prisma Postgres pooled endpoint."] };
  }

  const effective = new URL(applyRuntimePoolPolicy(value)!);
  const limit = runtimeConnectionLimit(value);
  const warnings: string[] = [];
  if (url.searchParams.get("sslmode") !== "require") warnings.push("Pooled runtime DATABASE_URL must preserve sslmode=require.");
  if (limit === null || limit < 1 || limit > MAXIMUM_RUNTIME_CONNECTION_LIMIT) {
    warnings.push(`Pooled runtime connection_limit must be between 1 and ${MAXIMUM_RUNTIME_CONNECTION_LIMIT}.`);
  }
  for (const timeout of ["pool_timeout", "connect_timeout", "socket_timeout"]) {
    if (!positiveSeconds(effective, timeout)) warnings.push(`Pooled runtime ${timeout} must be a finite number of seconds.`);
  }
  return { mode: "pooled", warnings };
}

/** Query parameters only the Prisma engine reads; `pg` would ignore them or (sslmode) read them differently. */
const PRISMA_ENGINE_PARAMETERS = [
  "connection_limit",
  "pool_timeout",
  "connect_timeout",
  "socket_timeout",
  "sslmode",
  "sslaccept",
  "sslcert",
  "sslidentity",
  "sslpassword",
  "schema",
  "pgbouncer",
  "statement_cache_size",
] as const;

/** `pg` connection settings for the runtime client, without importing `pg` here. */
export type RuntimePgPoolConfig = {
  connectionString: string | undefined;
  max?: number;
  connectionTimeoutMillis: number;
  idleTimeoutMillis?: number;
  query_timeout?: number;
  keepAlive: true;
  ssl: false | { rejectUnauthorized: true };
};

function seconds(url: URL, name: string) {
  const value = url.searchParams.get(name);
  return value && /^\d+$/.test(value) ? Number(value) : null;
}

/**
 * The runtime database URL translated into a `pg` pool for the Prisma driver adapter (Founder,
 * 3 October 2026). The Prisma engine's own pool kept connections across Fluid compute
 * suspensions; they went stale while the instance idled, and the next request waited out the
 * pool timeout (P2024) at about one request a minute. A `pg` pool attached to the function
 * lifecycle (`attachDatabasePool` in `lib/db/prisma.ts`) closes idle clients before the
 * instance suspends instead.
 *
 * The same URL parameters keep meaning the same thing, so {@link RUNTIME_POOL_POLICY} still
 * governs the pooled endpoint:
 * - `connection_limit` → `max`;
 * - `pool_timeout` / `connect_timeout` → `connectionTimeoutMillis` (`pg` bounds the wait for a
 *   pooled client and the connect together, so the longer of the two; Prisma's 10 s default
 *   when neither is set);
 * - `socket_timeout` → `query_timeout`, a client-side bound on every query;
 * - `sslmode=require|verify-ca|verify-full` → TLS with certificate verification (both Prisma
 *   Postgres hosts present publicly trusted certificates), otherwise no TLS, as before;
 * - `schema` → the adapter's schema option; the other engine-only parameters are dropped.
 *
 * On the pooled endpoint idle clients close after 5 s, so a suspended instance holds none.
 */
export function runtimePgPool(value: string | undefined): { config: RuntimePgPoolConfig; schema: string | undefined } {
  const url = parseUrl(applyRuntimePoolPolicy(value));
  if (!url) {
    return { config: { connectionString: value, connectionTimeoutMillis: 10_000, keepAlive: true, ssl: false }, schema: undefined };
  }
  const limit = seconds(url, "connection_limit");
  const waitSeconds = Math.max(seconds(url, "pool_timeout") ?? 0, seconds(url, "connect_timeout") ?? 0) || 10;
  const querySeconds = seconds(url, "socket_timeout");
  const sslmode = url.searchParams.get("sslmode");
  const schema = url.searchParams.get("schema") || undefined;
  for (const name of PRISMA_ENGINE_PARAMETERS) url.searchParams.delete(name);
  return {
    config: {
      connectionString: url.toString(),
      ...(limit ? { max: limit } : {}),
      connectionTimeoutMillis: waitSeconds * 1000,
      ...(url.hostname === POOLED_HOST ? { idleTimeoutMillis: 5_000 } : {}),
      ...(querySeconds ? { query_timeout: querySeconds * 1000 } : {}),
      keepAlive: true,
      ssl: sslmode === "require" || sslmode === "verify-ca" || sslmode === "verify-full" ? { rejectUnauthorized: true } : false,
    },
    schema: schema === "public" ? undefined : schema,
  };
}

export function warnForUnsafePrismaRuntimeConnection(
  environment: { DATABASE_URL?: string; NODE_ENV?: string } = process.env,
  warn: (message: string) => void = console.warn,
) {
  if (environment.NODE_ENV !== "production") return;
  for (const warning of inspectPrismaRuntimeConnection(environment.DATABASE_URL).warnings) {
    warn(`[prisma-runtime-config] ${warning}`);
  }
}
