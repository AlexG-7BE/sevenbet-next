export const CASINO_DATA_POPULATION_01_VERCEL_PROJECT_ID = "prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb";

export function casinoDataPopulation01VercelEnvironment(
  environment: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv {
  return {
    ...environment,
    VERCEL_ORG_ID: "team_WhkUGuXZeIMlU1uFHtowNUqa",
    VERCEL_PROJECT_ID: CASINO_DATA_POPULATION_01_VERCEL_PROJECT_ID,
  };
}
