-- EPIC-002: additive private-reflection store. Existing progress events remain
-- intact; new reflection content is never written to their JSON metadata.
CREATE TABLE "ProgramReflection" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "enrollmentId" UUID NOT NULL,
  "blockId" UUID NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProgramReflection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProgramReflection_enrollmentId_blockId_key"
  ON "ProgramReflection"("enrollmentId", "blockId");
CREATE INDEX "ProgramReflection_enrollmentId_updatedAt_idx"
  ON "ProgramReflection"("enrollmentId", "updatedAt");
ALTER TABLE "ProgramReflection"
  ADD CONSTRAINT "ProgramReflection_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
