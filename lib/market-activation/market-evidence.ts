const activationCriticalMarketFields = new Set([
  "availability",
  "casino.domain",
  "casino.title",
  "countryCode",
  "localDomain",
  "localWebsiteUrl",
]);

export function marketEvidenceBlocksActivation(evidence: Array<{ classification: string; fieldKeys: string[] }>) {
  return evidence.some((entry) => entry.classification === "CONTRADICTION"
    && (entry.fieldKeys.length === 0 || entry.fieldKeys.some((field) =>
      activationCriticalMarketFields.has(field) || field.startsWith("casino.identity"))));
}
