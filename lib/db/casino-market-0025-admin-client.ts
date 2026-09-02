import { PrismaClient } from "@prisma/client";

type CasinoMarketAdminEnvironment = {
  [key: string]: string | undefined;
  DIRECT_URL?: string;
};

export class CasinoMarket0025AdminClientError extends Error {
  constructor(public readonly code: "DIRECT_URL_REQUIRED", message: string) {
    super(message);
    this.name = "CasinoMarket0025AdminClientError";
  }
}

export function casinoMarket0025AdminDatasourceUrl(
  environment: CasinoMarketAdminEnvironment = process.env as CasinoMarketAdminEnvironment,
) {
  if (!environment.DIRECT_URL) {
    throw new CasinoMarket0025AdminClientError(
      "DIRECT_URL_REQUIRED",
      "Casino market release administration requires the approved direct database binding.",
    );
  }
  return environment.DIRECT_URL;
}

export function createCasinoMarket0025AdminClient(
  environment: CasinoMarketAdminEnvironment = process.env as CasinoMarketAdminEnvironment,
) {
  return new PrismaClient({
    datasourceUrl: casinoMarket0025AdminDatasourceUrl(environment),
    transactionOptions: {
      maxWait: 5_000,
      timeout: 65_000,
    },
  });
}
