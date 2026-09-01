import assert from "node:assert/strict";
import test from "node:test";

import {
  CASINO_MARKET_0025_VERCEL_ORG_ID,
  CASINO_MARKET_0025_VERCEL_PROJECT_ID,
  CASINO_MARKET_0025_VERCEL_PROJECT_NAME,
  casinoMarket0025VercelChildEnvironment,
} from "../lib/db/casino-market-0025-vercel-target";

test("Casino 0025 release launchers share the exact existing B4GAMBLE Vercel target", () => {
  assert.equal(CASINO_MARKET_0025_VERCEL_ORG_ID, "team_WhkUGuXZeIMlU1uFHtowNUqa");
  assert.equal(CASINO_MARKET_0025_VERCEL_PROJECT_ID, "prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb");
  assert.equal(CASINO_MARKET_0025_VERCEL_PROJECT_NAME, "sevenbet-next");

  const childEnvironment = casinoMarket0025VercelChildEnvironment({
    PATH: "/reviewed-bin",
    VERCEL_ORG_ID: "arbitrary-team-refused",
    VERCEL_PROJECT_ID: "arbitrary-project-refused",
  });
  assert.equal(childEnvironment.PATH, "/reviewed-bin");
  assert.equal(childEnvironment.VERCEL_ORG_ID, CASINO_MARKET_0025_VERCEL_ORG_ID);
  assert.equal(childEnvironment.VERCEL_PROJECT_ID, CASINO_MARKET_0025_VERCEL_PROJECT_ID);
});
