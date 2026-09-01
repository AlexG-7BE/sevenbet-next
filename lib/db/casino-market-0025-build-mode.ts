type CasinoMarket0025BuildEnvironment = Record<string, string | undefined>;

export type CasinoMarket0025BuildMode = "read-only-probe" | "migration-execution" | null;

export function casinoMarket0025BuildMode(
  environment: CasinoMarket0025BuildEnvironment,
): CasinoMarket0025BuildMode {
  const probeRequested = [
    environment.CASINO_MARKET_0025_PROBE_AUTHORITY,
    environment.CASINO_MARKET_0025_PROBE_SOURCE_COMMIT,
    environment.CASINO_MARKET_0025_EXPECTED_PROBE_COMMIT,
  ].some((value) => value !== undefined);
  const executionRequested = [
    environment.CASINO_MARKET_0025_EXECUTION_AUTHORITY,
    environment.CASINO_MARKET_0025_EXECUTION_SOURCE_COMMIT,
    environment.CASINO_MARKET_0025_EXPECTED_RELEASE_COMMIT,
    environment.CASINO_MARKET_0025_EXECUTE_PRODUCTION_0025,
  ].some((value) => value !== undefined);
  if (probeRequested && executionRequested) {
    throw new Error("Casino market 0025 build modes are mutually exclusive.");
  }
  if (probeRequested) return "read-only-probe";
  if (executionRequested) return "migration-execution";
  return null;
}
