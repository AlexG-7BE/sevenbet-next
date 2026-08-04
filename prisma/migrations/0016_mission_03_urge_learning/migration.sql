-- RFC-009: additive private persistence for Mission 03.
-- No existing participant data is removed or rewritten.

CREATE TYPE "EarlySignalCategory" AS ENUM (
  'BODY',
  'THOUGHT',
  'ATTENTION',
  'ACTION_TENDENCY',
  'NOT_SURE'
);

CREATE TABLE "UrgeLearningRecord" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "enrollmentId" UUID NOT NULL,
  "missionVersion" TEXT NOT NULL,
  "learningItemId" TEXT NOT NULL,
  "evidenceVersion" TEXT NOT NULL,
  "reviewedAt" TIMESTAMP(3) NOT NULL,
  "scenarioCheckCompletedAt" TIMESTAMP(3) NOT NULL,
  "meaningCheckCompletedAt" TIMESTAMP(3) NOT NULL,
  "earlySignalCategory" "EarlySignalCategory",
  "earlySignalText" TEXT,
  "notNow" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "UrgeLearningRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UrgeLearningRecord_signal_choice_check" CHECK (
    ("notNow" = TRUE AND "earlySignalCategory" IS NULL AND "earlySignalText" IS NULL)
    OR ("notNow" = FALSE AND "earlySignalCategory" IS NOT NULL)
  ),
  CONSTRAINT "UrgeLearningRecord_signal_text_length_check" CHECK (
    "earlySignalText" IS NULL OR char_length("earlySignalText") <= 240
  )
);

CREATE UNIQUE INDEX "UrgeLearningRecord_enrollmentId_key"
  ON "UrgeLearningRecord"("enrollmentId");

ALTER TABLE "UrgeLearningRecord"
  ADD CONSTRAINT "UrgeLearningRecord_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
