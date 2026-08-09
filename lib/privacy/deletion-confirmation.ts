export type PrivacyTargetEnvironment = "local" | "preview" | "production";

export function parsePrivacyTargetEnvironment(value: string | undefined): PrivacyTargetEnvironment {
  if (value === "local" || value === "preview" || value === "production") return value;
  throw new Error("Privacy operations require --environment local|preview|production");
}

export function assertPrivacyDeletionAuthority(input: {
  execute: boolean;
  environment: PrivacyTargetEnvironment;
  userId: string;
  generalConfirmation?: string;
  productionConfirmation?: string;
}) {
  if (!input.execute) return;
  const exactConfirmation = `DELETE:${input.userId}`;
  if (input.generalConfirmation !== exactConfirmation) {
    throw new Error("Deletion execution requires SEVENBET_PRIVACY_DELETE_CONFIRM=DELETE:<exact-user-id>");
  }
  if (input.environment === "production" && input.productionConfirmation !== exactConfirmation) {
    throw new Error("Production deletion also requires SEVENBET_PRIVACY_PRODUCTION_DELETE_CONFIRM=DELETE:<exact-user-id>");
  }
}
