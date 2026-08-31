CREATE TYPE "ProgrammeAccessAcceptanceSource" AS ENUM (
  'DIRECT_AUTHENTICATED',
  'ANONYMOUS_JOURNEY',
  'PROGRAM_AI_CLAIM_BACKFILL'
);

CREATE TABLE "ProgrammeAccessAcceptance" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" TEXT,
  "anonymousSessionId" UUID,
  "adultSelfAttestedAt" TIMESTAMP(3) NOT NULL,
  "termsAcceptedAt" TIMESTAMP(3) NOT NULL,
  "privacyAcknowledgedAt" TIMESTAMP(3) NOT NULL,
  "termsVersionAtAcceptance" TEXT,
  "privacyVersionAtAcceptance" TEXT,
  "source" "ProgrammeAccessAcceptanceSource" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProgrammeAccessAcceptance_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProgrammeAccessAcceptance_subject_check"
    CHECK (("anonymousSessionId" IS NOT NULL) <> ("userId" IS NOT NULL)),
  CONSTRAINT "ProgrammeAccessAcceptance_lifecycle_check"
    CHECK (
      "termsAcceptedAt" >= "adultSelfAttestedAt"
      AND "privacyAcknowledgedAt" >= "adultSelfAttestedAt"
    ),
  CONSTRAINT "ProgrammeAccessAcceptance_versions_check"
    CHECK (
      ("termsVersionAtAcceptance" IS NULL OR NULLIF(BTRIM("termsVersionAtAcceptance"), '') IS NOT NULL)
      AND ("privacyVersionAtAcceptance" IS NULL OR NULLIF(BTRIM("privacyVersionAtAcceptance"), '') IS NOT NULL)
    )
);

CREATE UNIQUE INDEX "ProgrammeAccessAcceptance_userId_key"
  ON "ProgrammeAccessAcceptance"("userId");
CREATE UNIQUE INDEX "ProgrammeAccessAcceptance_anonymousSessionId_key"
  ON "ProgrammeAccessAcceptance"("anonymousSessionId");
CREATE INDEX "ProgrammeAccessAcceptance_source_createdAt_idx"
  ON "ProgrammeAccessAcceptance"("source", "createdAt");

ALTER TABLE "ProgrammeAccessAcceptance"
  ADD CONSTRAINT "ProgrammeAccessAcceptance_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgrammeAccessAcceptance"
  ADD CONSTRAINT "ProgrammeAccessAcceptance_anonymousSessionId_fkey"
  FOREIGN KEY ("anonymousSessionId") REFERENCES "AnonymousProgrammeSession"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Conservative compatibility backfill. A generic enrollment is not evidence
-- of the two Programme access affirmations. This subset is directly tied to a
-- PROGRAM-AI anonymous session whose creation required a valid signed access
-- proof and whose claim and user-confirmed Starting Point were committed in
-- the same transaction. The session creation time is the nearest durable
-- timestamp after the original affirmation; historical legal-copy versions
-- were not persisted and therefore remain NULL rather than being fabricated.
INSERT INTO "ProgrammeAccessAcceptance" (
  "userId",
  "anonymousSessionId",
  "adultSelfAttestedAt",
  "termsAcceptedAt",
  "privacyAcknowledgedAt",
  "termsVersionAtAcceptance",
  "privacyVersionAtAcceptance",
  "source",
  "createdAt",
  "updatedAt"
)
SELECT DISTINCT ON (claim."consumedByUserId")
  claim."consumedByUserId",
  NULL,
  anonymous_session."createdAt",
  anonymous_session."createdAt",
  anonymous_session."createdAt",
  NULL,
  NULL,
  'PROGRAM_AI_CLAIM_BACKFILL'::"ProgrammeAccessAcceptanceSource",
  claim."consumedAt",
  claim."consumedAt"
FROM "PendingProgrammeClaim" AS claim
JOIN "AnonymousProgrammeSession" AS anonymous_session
  ON anonymous_session."id" = claim."anonymousSessionId"
JOIN "ProgrammeStartingPoint" AS starting_point
  ON starting_point."userId" = claim."consumedByUserId"
  AND starting_point."confirmedAt" = claim."consumedAt"
  AND starting_point."version" = 'program-ai-01:v1'
JOIN "ProgramEnrollment" AS enrollment
  ON enrollment."id" = starting_point."enrollmentId"
  AND enrollment."userId" = claim."consumedByUserId"
WHERE claim."consumedAt" IS NOT NULL
  AND claim."consumedByUserId" IS NOT NULL
  AND anonymous_session."missionVersion" = 'program-ai-01:v1'
ORDER BY claim."consumedByUserId", anonymous_session."createdAt" ASC;
