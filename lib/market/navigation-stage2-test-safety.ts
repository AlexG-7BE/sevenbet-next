import type { MarketRule } from "../market-access/register";

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

/**
 * The isolated Navigation Stage 2 catalogue is Irish. It was written when Ireland was the
 * licence register's open grey zone, where any casino may be promoted, so its fictional casinos
 * are judged on navigation alone. Production closed Ireland on 4 October 2026 (Founder decision,
 * Google UK gambling certification). Only the disposable fixture server and the representative
 * repository test keep the old rule, behind the same local-and-disposable guard as the other seams.
 */
export const NAVIGATION_STAGE2_FIXTURE_MARKET = "IE";

const NAVIGATION_STAGE2_FIXTURE_MARKET_RULE: MarketRule = Object.freeze({
  regime: "GREY_ZONE",
  open: true,
  reason: "Disposable Navigation Stage 2 fixture only: the fictional catalogue keeps Ireland's pre-4-October-2026 open grey zone.",
});

export function navigationStage2FixtureMarketRule(
  market: string,
  environment: NavigationStage2TestEnvironment = process.env,
): MarketRule | null {
  if (market !== NAVIGATION_STAGE2_FIXTURE_MARKET) return null;
  if (environment.NAVIGATION_STAGE2_LOCAL_TRUSTED_GEO !== "true"
    && environment.NAVIGATION_STAGE2_REPRESENTATIVE_DATABASE !== "true") return null;
  assertNavigationStage2TestSafety(environment);
  return NAVIGATION_STAGE2_FIXTURE_MARKET_RULE;
}
