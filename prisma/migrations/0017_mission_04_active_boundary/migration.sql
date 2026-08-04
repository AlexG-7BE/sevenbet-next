CREATE TYPE "BoundaryCategory" AS ENUM ('MONEY', 'TIME', 'ACCESS', 'PAUSE');
CREATE TYPE "BoundaryStatus" AS ENUM ('ACTIVE', 'PAUSED', 'RETIRED');

CREATE TABLE "ActiveBoundary" (
  "id" UUID NOT NULL,
  "enrollmentId" UUID NOT NULL,
  "sourceCurrentGoalId" UUID,
  "sourceUrgeLearningRecordId" UUID,
  "missionVersion" TEXT NOT NULL,
  "evidenceVersion" TEXT NOT NULL,
  "category" "BoundaryCategory" NOT NULL,
  "triggerType" TEXT NOT NULL,
  "triggerText" TEXT,
  "ruleText" TEXT NOT NULL,
  "limitValue" DECIMAL(12,2),
  "limitUnit" TEXT,
  "limitPeriod" TEXT,
  "executionMethod" TEXT NOT NULL,
  "executionDetail" TEXT,
  "copingAction" TEXT NOT NULL,
  "reviewAt" TIMESTAMP(3) NOT NULL,
  "status" "BoundaryStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "ActiveBoundary_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ActiveBoundary_limitValue_positive_check"
    CHECK ("limitValue" IS NULL OR "limitValue" > 0),
  CONSTRAINT "ActiveBoundary_material_value_check"
    CHECK (
      "category" = 'ACCESS'
      OR ("limitValue" IS NOT NULL AND NULLIF(BTRIM("limitUnit"), '') IS NOT NULL)
    ),
  CONSTRAINT "ActiveBoundary_money_period_check"
    CHECK ("category" <> 'MONEY' OR NULLIF(BTRIM("limitPeriod"), '') IS NOT NULL),
  CONSTRAINT "ActiveBoundary_trigger_check"
    CHECK (
      "triggerType" = 'saved_early_signal'
      OR NULLIF(BTRIM("triggerText"), '') IS NOT NULL
    ),
  CONSTRAINT "ActiveBoundary_custom_execution_check"
    CHECK (
      "executionMethod" <> 'custom'
      OR NULLIF(BTRIM("executionDetail"), '') IS NOT NULL
    ),
  CONSTRAINT "ActiveBoundary_content_check"
    CHECK (
      NULLIF(BTRIM("ruleText"), '') IS NOT NULL
      AND NULLIF(BTRIM("copingAction"), '') IS NOT NULL
    )
);

CREATE UNIQUE INDEX "ActiveBoundary_enrollmentId_key"
  ON "ActiveBoundary"("enrollmentId");
CREATE INDEX "ActiveBoundary_sourceCurrentGoalId_idx"
  ON "ActiveBoundary"("sourceCurrentGoalId");
CREATE INDEX "ActiveBoundary_sourceUrgeLearningRecordId_idx"
  ON "ActiveBoundary"("sourceUrgeLearningRecordId");

ALTER TABLE "ActiveBoundary"
  ADD CONSTRAINT "ActiveBoundary_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActiveBoundary"
  ADD CONSTRAINT "ActiveBoundary_sourceCurrentGoalId_fkey"
  FOREIGN KEY ("sourceCurrentGoalId") REFERENCES "CurrentGoal"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ActiveBoundary"
  ADD CONSTRAINT "ActiveBoundary_sourceUrgeLearningRecordId_fkey"
  FOREIGN KEY ("sourceUrgeLearningRecordId") REFERENCES "UrgeLearningRecord"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Achievement" (
  "id", "slug", "internalName", "title", "description", "icon", "category",
  "tier", "xpReward", "active", "hidden", "triggerType", "triggerConfig",
  "status", "createdAt", "updatedAt", "createdBy", "updatedBy"
) VALUES (
  '0e8f6f37-f495-4c9a-8a25-3df750fd2d47',
  'boundary-built',
  'boundary_built',
  'Boundary Built',
  'Create and save the first editable Active Boundary in Mission 04.',
  '04',
  'PROGRAM',
  'COMMON',
  0,
  TRUE,
  FALSE,
  'BOUNDARY_CREATED',
  '{}'::JSONB,
  'PUBLISHED',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'system:rfc-010',
  'system:rfc-010'
) ON CONFLICT DO NOTHING;
