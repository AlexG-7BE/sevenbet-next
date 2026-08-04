-- RFC-008: additive persistence for Mission 01 -> registration -> Dashboard -> Mission 02.
-- No existing user content is removed or rewritten.

ALTER TYPE "XpEventType" ADD VALUE IF NOT EXISTS 'MISSION_COMPLETION';

CREATE TYPE "ProgrammeMissionStatus" AS ENUM (
  'NOT_STARTED',
  'IN_PROGRESS',
  'READY_TO_SAVE',
  'REGISTRATION_REQUIRED',
  'COMPLETED'
);

CREATE TYPE "GoalDirection" AS ENUM (
  'UNDERSTAND',
  'PAUSE',
  'REDUCE_IMPULSE',
  'SET_BOUNDARY',
  'RESEARCH_LATER',
  'SEEK_SUPPORT'
);

CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED');

ALTER TABLE "ProgramEnrollment"
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';

CREATE TABLE "AnonymousProgrammeSession" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tokenHash" TEXT NOT NULL,
  "missionState" "ProgrammeMissionStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "taskStates" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "draft" JSONB,
  "missionVersion" TEXT NOT NULL,
  "evidenceVersion" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AnonymousProgrammeSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AnonymousProgrammeSession_tokenHash_key"
  ON "AnonymousProgrammeSession"("tokenHash");
CREATE INDEX "AnonymousProgrammeSession_expiresAt_idx"
  ON "AnonymousProgrammeSession"("expiresAt");

CREATE TABLE "PendingProgrammeClaim" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "anonymousSessionId" UUID NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "consumedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PendingProgrammeClaim_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PendingProgrammeClaim_anonymousSessionId_key"
  ON "PendingProgrammeClaim"("anonymousSessionId");
CREATE UNIQUE INDEX "PendingProgrammeClaim_tokenHash_key"
  ON "PendingProgrammeClaim"("tokenHash");
CREATE INDEX "PendingProgrammeClaim_expiresAt_consumedAt_idx"
  ON "PendingProgrammeClaim"("expiresAt", "consumedAt");
CREATE INDEX "PendingProgrammeClaim_consumedByUserId_idx"
  ON "PendingProgrammeClaim"("consumedByUserId");

CREATE TABLE "ProgrammeMissionProgress" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "enrollmentId" UUID NOT NULL,
  "missionNumber" INTEGER NOT NULL,
  "status" "ProgrammeMissionStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "taskStates" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "draft" JSONB,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProgrammeMissionProgress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProgrammeMissionProgress_missionNumber_check"
    CHECK ("missionNumber" BETWEEN 1 AND 10)
);

CREATE UNIQUE INDEX "ProgrammeMissionProgress_enrollmentId_missionNumber_key"
  ON "ProgrammeMissionProgress"("enrollmentId", "missionNumber");
CREATE INDEX "ProgrammeMissionProgress_enrollmentId_updatedAt_idx"
  ON "ProgrammeMissionProgress"("enrollmentId", "updatedAt");

CREATE TABLE "MomentMap" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "enrollmentId" UUID NOT NULL,
  "situation" TEXT NOT NULL,
  "cues" TEXT[] NOT NULL,
  "thoughtOrFeeling" TEXT NOT NULL,
  "response" TEXT NOT NULL,
  "immediateConsequence" TEXT NOT NULL,
  "noticeRule" TEXT NOT NULL,
  "neutralFlags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "notSureFlags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "missionVersion" TEXT NOT NULL,
  "evidenceVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "MomentMap_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MomentMap_enrollmentId_key" ON "MomentMap"("enrollmentId");

CREATE TABLE "CurrentGoal" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "enrollmentId" UUID NOT NULL,
  "sourceMomentMapId" UUID NOT NULL,
  "direction" "GoalDirection" NOT NULL,
  "action" TEXT NOT NULL,
  "triggerOrSituation" TEXT NOT NULL,
  "alternativeAction" TEXT NOT NULL,
  "successSignal" TEXT NOT NULL,
  "reviewAt" TIMESTAMP(3) NOT NULL,
  "confidence" INTEGER NOT NULL,
  "confidenceAdjustment" TEXT NOT NULL,
  "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "CurrentGoal_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CurrentGoal_confidence_check" CHECK ("confidence" BETWEEN 0 AND 10)
);

CREATE UNIQUE INDEX "CurrentGoal_enrollmentId_key" ON "CurrentGoal"("enrollmentId");
CREATE INDEX "CurrentGoal_sourceMomentMapId_idx" ON "CurrentGoal"("sourceMomentMapId");

CREATE TABLE "ProgrammeActiveDay" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "enrollmentId" UUID NOT NULL,
  "localDate" DATE NOT NULL,
  "timezone" TEXT NOT NULL,
  "sourceEventKey" TEXT NOT NULL,
  "eligibleActivityAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "voidedAt" TIMESTAMP(3),
  "voidReason" TEXT,
  "voidedByAdminId" UUID,
  CONSTRAINT "ProgrammeActiveDay_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProgrammeActiveDay_void_check"
    CHECK (
      ("voidedAt" IS NULL AND "voidReason" IS NULL AND "voidedByAdminId" IS NULL)
      OR ("voidedAt" IS NOT NULL AND "voidReason" IS NOT NULL AND "voidedByAdminId" IS NOT NULL)
    )
);

CREATE UNIQUE INDEX "ProgrammeActiveDay_userId_localDate_key"
  ON "ProgrammeActiveDay"("userId", "localDate");
CREATE UNIQUE INDEX "ProgrammeActiveDay_enrollmentId_sourceEventKey_key"
  ON "ProgrammeActiveDay"("enrollmentId", "sourceEventKey");
CREATE INDEX "ProgrammeActiveDay_userId_localDate_voidedAt_idx"
  ON "ProgrammeActiveDay"("userId", "localDate", "voidedAt");
CREATE INDEX "ProgrammeActiveDay_voidedByAdminId_idx"
  ON "ProgrammeActiveDay"("voidedByAdminId");

ALTER TABLE "PendingProgrammeClaim"
  ADD CONSTRAINT "PendingProgrammeClaim_anonymousSessionId_fkey"
  FOREIGN KEY ("anonymousSessionId") REFERENCES "AnonymousProgrammeSession"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PendingProgrammeClaim_consumedByUserId_fkey"
  FOREIGN KEY ("consumedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProgrammeMissionProgress"
  ADD CONSTRAINT "ProgrammeMissionProgress_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MomentMap"
  ADD CONSTRAINT "MomentMap_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CurrentGoal"
  ADD CONSTRAINT "CurrentGoal_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "CurrentGoal_sourceMomentMapId_fkey"
  FOREIGN KEY ("sourceMomentMapId") REFERENCES "MomentMap"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProgrammeActiveDay"
  ADD CONSTRAINT "ProgrammeActiveDay_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ProgrammeActiveDay_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ProgrammeActiveDay_voidedByAdminId_fkey"
  FOREIGN KEY ("voidedByAdminId") REFERENCES "AdminUser"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserXpEvent"
  ADD COLUMN "programId" UUID,
  ADD COLUMN "missionNumber" INTEGER,
  ADD COLUMN "sourceArtifactType" TEXT,
  ADD COLUMN "sourceArtifactId" UUID;

ALTER TABLE "UserXpEvent" DROP CONSTRAINT "UserXpEvent_source_check";
ALTER TABLE "UserXpEvent"
  ADD CONSTRAINT "UserXpEvent_source_check"
  CHECK (num_nonnulls("ruleId", "achievementId", "missionNumber") = 1),
  ADD CONSTRAINT "UserXpEvent_non_negative_check" CHECK ("xp" >= 0),
  ADD CONSTRAINT "UserXpEvent_mission_source_check"
  CHECK (
    ("missionNumber" IS NULL AND "sourceArtifactType" IS NULL AND "sourceArtifactId" IS NULL)
    OR (
      "missionNumber" BETWEEN 1 AND 10
      AND "programId" IS NOT NULL
      AND "sourceArtifactType" IS NOT NULL
      AND "sourceArtifactId" IS NOT NULL
      AND "eventType" = 'MISSION_COMPLETION'
    )
  );

CREATE INDEX "UserXpEvent_programId_missionNumber_idx"
  ON "UserXpEvent"("programId", "missionNumber");
ALTER TABLE "UserXpEvent"
  ADD CONSTRAINT "UserXpEvent_programId_fkey"
  FOREIGN KEY ("programId") REFERENCES "Program"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Stable catalogue record used by the deterministic Mission 02 unlock.
INSERT INTO "Achievement" (
  "id", "slug", "internalName", "title", "description", "icon", "category",
  "tier", "xpReward", "active", "hidden", "triggerType", "triggerConfig",
  "status", "createdAt", "updatedAt", "createdBy", "updatedBy"
) VALUES (
  '7f17da5e-5edf-4e7e-8c30-c873e3cdfb02',
  'first-plan',
  'first_plan',
  'First Plan',
  'Create and save the first Current Goal in Mission 02.',
  '02',
  'PROGRAM',
  'COMMON',
  0,
  TRUE,
  FALSE,
  'PLAN_CREATED',
  '{}'::JSONB,
  'PUBLISHED',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'system:rfc-008',
  'system:rfc-008'
) ON CONFLICT DO NOTHING;
