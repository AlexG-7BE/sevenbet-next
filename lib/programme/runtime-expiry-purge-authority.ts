export type ProgrammePurgeEnvironment = "local" | "preview" | "production";

export function parseProgrammePurgeEnvironment(value: string | undefined): ProgrammePurgeEnvironment {
  if (value === "local" || value === "preview" || value === "production") return value;
  throw new Error("Programme expiry purge requires --environment local|preview|production");
}

export function assertProgrammePurgeExecutionAuthority({
  execute,
  environment,
  confirmation,
  productionConfirmation,
}: {
  execute: boolean;
  environment: ProgrammePurgeEnvironment;
  confirmation?: string;
  productionConfirmation?: string;
}) {
  if (!execute) return;
  const expected = `EXECUTE:${environment}:programme-expiry-purge`;
  if (confirmation !== expected) {
    throw new Error(`Execution requires PROGRAMME_PURGE_CONFIRM=${expected}`);
  }
  if (
    environment === "production"
    && productionConfirmation !== "PRODUCTION:programme-expiry-purge"
  ) {
    throw new Error(
      "Production execution also requires PROGRAMME_PURGE_PRODUCTION_CONFIRM=PRODUCTION:programme-expiry-purge",
    );
  }
}
