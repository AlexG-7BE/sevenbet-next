export const CASINO_MARKET_0025_VERCEL_ORG_ID = "team_WhkUGuXZeIMlU1uFHtowNUqa";
export const CASINO_MARKET_0025_VERCEL_PROJECT_ID = "prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb";
export const CASINO_MARKET_0025_VERCEL_PROJECT_NAME = "sevenbet-next";

export function casinoMarket0025VercelChildEnvironment<
  Environment extends Record<string, string | undefined>,
>(environment: Environment): Environment & {
  VERCEL_ORG_ID: string;
  VERCEL_PROJECT_ID: string;
} {
  return {
    ...environment,
    VERCEL_ORG_ID: CASINO_MARKET_0025_VERCEL_ORG_ID,
    VERCEL_PROJECT_ID: CASINO_MARKET_0025_VERCEL_PROJECT_ID,
  };
}
