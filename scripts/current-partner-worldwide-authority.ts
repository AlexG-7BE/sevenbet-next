import {
  buildWorldwideAuthorityMatrix,
  validateWorldwideAuthorityMatrix,
  WORLDWIDE_AUTHORITY_RELEASE,
} from "@/lib/current-partner-worldwide-authority/inventory";

const command = process.argv[2] ?? "audit";
if (command !== "audit") throw new Error("WORLDWIDE_AUTHORITY_COMMAND_UNSUPPORTED");

const rows = buildWorldwideAuthorityMatrix();
const summary = validateWorldwideAuthorityMatrix(rows);
const supported = rows.filter((row) => row.marketSupportState === "SUPPORTED");
const inferredSupportRows = supported.filter((row) => row.supportEvidenceClassification !== "DETECTED").length;
const inferredLegalRows = supported.filter((row) => row.legalEvidenceClassification !== "DETECTED").length;
const releaseGates = {
  canadaClosedMarketClassificationApproved: false,
  cleanDatabaseMigrationRecorded: false,
};
const productionGates = {
  productionSnapshotRecorded: false,
  productionPostflightRecorded: false,
};
const mergeReady = inferredSupportRows === 0
  && inferredLegalRows === 0
  && Object.values(releaseGates).every(Boolean);

console.log(JSON.stringify({
  release: WORLDWIDE_AUTHORITY_RELEASE,
  targetClassification: "AUTHORIZED_TARGET",
  productionMutationPerformed: false,
  mergeReady,
  productionReleaseReady: mergeReady && Object.values(productionGates).every(Boolean),
  mergeBlockers: {
    inferredSupportRows,
    inferredLegalRows,
    ...releaseGates,
  },
  productionBlockers: {
    ...productionGates,
  },
  summary,
  stagingSnapshot: {
    meaning: "Review branch state after rebasing onto the canonical registrar; this is not Production state.",
    trackingRegistrationMechanismMerged: true,
    trackingRegistrationMergeCommit: "6366906",
    canonicalRegistrationInventoryIntegrated: true,
    exactSubdivisionRuntimeImplemented: true,
    exactSubdivisionRuntimeAvailableInProduction: false,
    currentRuntimePostflightRecorded: false,
  },
  regulatoryActions: supported
    .filter((row) => row.targetFinalState === "ACTION_REQUIRED_REGULATORY")
    .map((row) => ({ partner: row.partner, casino: row.casino, geo: row.geo, action: row.regulatoryAction })),
}, null, 2));
