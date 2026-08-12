CREATE TABLE "ProgrammeRuntimeRateLimitBucket" (
  "bucketKey" CHAR(64) NOT NULL,
  "scope" VARCHAR(64) NOT NULL,
  "count" INTEGER NOT NULL,
  "windowStartedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProgrammeRuntimeRateLimitBucket_pkey" PRIMARY KEY ("bucketKey"),
  CONSTRAINT "ProgrammeRuntimeRateLimitBucket_count_check" CHECK ("count" > 0),
  CONSTRAINT "ProgrammeRuntimeRateLimitBucket_scope_check" CHECK (
    "scope" IN (
      'PROGRAMME_SESSION_CREATE_IP',
      'PROGRAMME_TRANSCRIPTION_SESSION',
      'PROGRAMME_TRANSCRIPTION_IP',
      'PROGRAMME_M1_AI_SESSION',
      'PROGRAMME_M1_AI_IP',
      'PROGRAMME_MISSION_GUIDANCE_USER',
      'PROGRAMME_REVIEW_USER',
      'PROGRAMME_MUTATION_SESSION',
      'PROGRAMME_MUTATION_USER'
    )
  ),
  CONSTRAINT "ProgrammeRuntimeRateLimitBucket_window_check" CHECK (
    "expiresAt" > "windowStartedAt"
  )
);

CREATE INDEX "ProgrammeRuntimeRateLimitBucket_expiresAt_idx"
  ON "ProgrammeRuntimeRateLimitBucket"("expiresAt");
