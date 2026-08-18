import { inspectProgrammeDatabaseReadiness } from "@/lib/db/programme-database-readiness";

type VercelDatabaseEnvironment = {
  DATABASE_URL?: string;
  DIRECT_URL?: string;
  VERCEL_ENV?: string;
};

export type VercelDatabaseReadinessResult =
  | { checked: false; environment: "local" }
  | ({ checked: true; environment: "preview" | "production" } & ReturnType<typeof inspectProgrammeDatabaseReadiness>);

export function assertVercelDatabaseReadiness(
  environment: VercelDatabaseEnvironment = process.env as VercelDatabaseEnvironment,
): VercelDatabaseReadinessResult {
  const deploymentEnvironment = environment.VERCEL_ENV;
  if (deploymentEnvironment !== "preview" && deploymentEnvironment !== "production") {
    return { checked: false, environment: "local" };
  }

  const readiness = inspectProgrammeDatabaseReadiness(environment);
  if (!readiness.ready) {
    throw new Error(
      `Vercel ${deploymentEnvironment} database readiness failed: ${readiness.warnings.join(" ")}`,
    );
  }

  return {
    checked: true,
    environment: deploymentEnvironment,
    ...readiness,
  };
}
