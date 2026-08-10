CREATE TABLE "ProgrammeSensitiveInputAuthority" (
  "id" UUID NOT NULL,
  "anonymousSessionId" UUID,
  "userId" TEXT,
  "purposeVersion" TEXT NOT NULL,
  "statementVersion" TEXT NOT NULL,
  "confirmedAt" TIMESTAMP(3) NOT NULL,
  "withdrawnAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProgrammeSensitiveInputAuthority_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProgrammeSensitiveInputAuthority_subject_check"
    CHECK ("anonymousSessionId" IS NOT NULL OR "userId" IS NOT NULL),
  CONSTRAINT "ProgrammeSensitiveInputAuthority_versions_check"
    CHECK (
      NULLIF(BTRIM("purposeVersion"), '') IS NOT NULL
      AND NULLIF(BTRIM("statementVersion"), '') IS NOT NULL
    ),
  CONSTRAINT "ProgrammeSensitiveInputAuthority_lifecycle_check"
    CHECK ("withdrawnAt" IS NULL OR "withdrawnAt" >= "confirmedAt")
);

CREATE UNIQUE INDEX "ProgrammeSensitiveInputAuthority_anonymousSessionId_purposeVersion_statementVersion_key"
  ON "ProgrammeSensitiveInputAuthority"("anonymousSessionId", "purposeVersion", "statementVersion");
CREATE UNIQUE INDEX "ProgrammeSensitiveInputAuthority_userId_purposeVersion_statementVersion_key"
  ON "ProgrammeSensitiveInputAuthority"("userId", "purposeVersion", "statementVersion");
CREATE INDEX "ProgrammeSensitiveInputAuthority_anonymousSessionId_withdrawnAt_idx"
  ON "ProgrammeSensitiveInputAuthority"("anonymousSessionId", "withdrawnAt");
CREATE INDEX "ProgrammeSensitiveInputAuthority_userId_withdrawnAt_idx"
  ON "ProgrammeSensitiveInputAuthority"("userId", "withdrawnAt");

ALTER TABLE "ProgrammeSensitiveInputAuthority"
  ADD CONSTRAINT "ProgrammeSensitiveInputAuthority_anonymousSessionId_fkey"
  FOREIGN KEY ("anonymousSessionId") REFERENCES "AnonymousProgrammeSession"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgrammeSensitiveInputAuthority"
  ADD CONSTRAINT "ProgrammeSensitiveInputAuthority_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ProgrammeStartingPoint" (
  "id" UUID NOT NULL,
  "userId" TEXT NOT NULL,
  "enrollmentId" UUID NOT NULL,
  "startingPoint" TEXT NOT NULL,
  "desiredChange" TEXT NOT NULL,
  "broadContext" TEXT NOT NULL,
  "continuationCue" TEXT NOT NULL,
  "chosenBoundaryAction" TEXT,
  "provenance" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "confirmedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProgrammeStartingPoint_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProgrammeStartingPoint_provenance_check"
    CHECK ("provenance" = 'USER_CONFIRMED'),
  CONSTRAINT "ProgrammeStartingPoint_context_check"
    CHECK ("broadContext" IN ('WORK', 'HOME', 'SOCIAL', 'FINANCIAL_PRESSURE', 'ONLINE_ACCESS', 'OTHER', 'NOT_SPECIFIED')),
  CONSTRAINT "ProgrammeStartingPoint_content_check"
    CHECK (
      CHAR_LENGTH(BTRIM("startingPoint")) BETWEEN 10 AND 320
      AND CHAR_LENGTH(BTRIM("desiredChange")) BETWEEN 2 AND 200
      AND CHAR_LENGTH(BTRIM("continuationCue")) BETWEEN 2 AND 200
      AND ("chosenBoundaryAction" IS NULL OR CHAR_LENGTH(BTRIM("chosenBoundaryAction")) BETWEEN 2 AND 200)
      AND CHAR_LENGTH(BTRIM("version")) BETWEEN 2 AND 80
    )
);

CREATE UNIQUE INDEX "ProgrammeStartingPoint_userId_key"
  ON "ProgrammeStartingPoint"("userId");
CREATE UNIQUE INDEX "ProgrammeStartingPoint_enrollmentId_key"
  ON "ProgrammeStartingPoint"("enrollmentId");
CREATE INDEX "ProgrammeStartingPoint_userId_confirmedAt_idx"
  ON "ProgrammeStartingPoint"("userId", "confirmedAt");

ALTER TABLE "ProgrammeStartingPoint"
  ADD CONSTRAINT "ProgrammeStartingPoint_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgrammeStartingPoint"
  ADD CONSTRAINT "ProgrammeStartingPoint_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
