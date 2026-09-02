export const BETSSON_FACTUAL_RELEASE_VERCEL_ORG_ID = "team_WhkUGuXZeIMlU1uFHtowNUqa";
export const BETSSON_FACTUAL_RELEASE_VERCEL_PROJECT_ID = "prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb";
export const BETSSON_FACTUAL_RELEASE_VERCEL_PROJECT_NAME = "sevenbet-next";

export function betssonFactualReleaseVercelEnvironment<
  Environment extends Record<string, string | undefined>,
>(environment: Environment): Environment & { VERCEL_ORG_ID: string; VERCEL_PROJECT_ID: string } {
  return {
    ...environment,
    VERCEL_ORG_ID: BETSSON_FACTUAL_RELEASE_VERCEL_ORG_ID,
    VERCEL_PROJECT_ID: BETSSON_FACTUAL_RELEASE_VERCEL_PROJECT_ID,
  };
}
