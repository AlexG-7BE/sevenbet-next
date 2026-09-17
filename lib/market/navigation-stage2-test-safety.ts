type NavigationStage2TestEnvironment = Readonly<Record<string, string | undefined>>;

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost"]);
const DISPOSABLE_PORTS = new Set(["5432", "54329"]);

function disposableDatabaseTarget(raw: string | undefined, name: string) {
  let url: URL;
  try {
    url = new URL(raw ?? "");
  } catch {
    throw new Error(`${name} must be an explicit disposable PostgreSQL URL`);
  }
  const database = url.pathname.replace(/^\//, "");
  if (
    !["postgres:", "postgresql:"].includes(url.protocol)
    || !LOOPBACK_HOSTS.has(url.hostname)
    || !DISPOSABLE_PORTS.has(url.port)
    || !database.endsWith("_ci")
  ) {
    throw new Error(`${name} must target localhost:5432 or :54329 and an _ci database`);
  }
  return `${url.hostname}:${url.port}/${database}`;
}

export function assertNavigationStage2TestSafety(
  environment: NavigationStage2TestEnvironment = process.env,
) {
  if (environment.CI !== "true") {
    throw new Error("Navigation Stage 2 fixtures require CI=true");
  }
  if (environment.VERCEL_URL || environment.VERCEL_REGION || environment.VERCEL_TARGET_ENV) {
    throw new Error("Navigation Stage 2 fixtures refuse deployed Vercel environments");
  }
  if (environment.VERCEL_ENV === "production") {
    throw new Error("Navigation Stage 2 fixtures refuse Production");
  }
  const database = disposableDatabaseTarget(environment.DATABASE_URL, "DATABASE_URL");
  const direct = disposableDatabaseTarget(environment.DIRECT_URL, "DIRECT_URL");
  if (database !== direct) {
    throw new Error("DATABASE_URL and DIRECT_URL must target the same disposable database");
  }
  return database;
}

export function navigationStage2CommercialStateRejectionEnabled(
  environment: NavigationStage2TestEnvironment = process.env,
) {
  if (environment.NAVIGATION_STAGE2_REJECT_COMMERCIAL_STATE !== "true") return false;
  assertNavigationStage2TestSafety(environment);
  return true;
}

export function navigationStage2LocalTrustedGeoEnabled(
  environment: NavigationStage2TestEnvironment = process.env,
) {
  if (environment.NAVIGATION_STAGE2_LOCAL_TRUSTED_GEO !== "true") return false;
  assertNavigationStage2TestSafety(environment);
  return true;
}

export function navigationStage2EditorialCacheBypassEnabled(
  environment: NavigationStage2TestEnvironment = process.env,
) {
  if (environment.NAVIGATION_STAGE2_STREAMED_HEADER_DATABASE_LOCK !== "true") return false;
  assertNavigationStage2TestSafety(environment);
  return true;
}
