CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "EditorialStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED');
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'REVIEWER', 'AFFILIATE_MANAGER', 'ANALYST', 'SUPPORT');
CREATE TYPE "CmsBlockType" AS ENUM ('TEXT', 'CALLOUT', 'VIDEO', 'IMAGE', 'QUIZ', 'SCENARIO', 'EXERCISE', 'CHECKLIST', 'SUMMARY', 'RESOURCE_LINK');

CREATE TABLE "AdminUser" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "role" "AdminRole" NOT NULL DEFAULT 'AUTHOR',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Program" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "status" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL
);

CREATE TABLE "ProgramStep" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "programId" UUID NOT NULL REFERENCES "Program"("id") ON DELETE CASCADE,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "status" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
  "order" INTEGER NOT NULL,
  "estimatedMinutes" INTEGER NOT NULL,
  "xp" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL
);

CREATE INDEX "ProgramStep_programId_order_idx" ON "ProgramStep"("programId", "order");

CREATE TABLE "Lesson" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "programStepId" UUID NOT NULL REFERENCES "ProgramStep"("id") ON DELETE CASCADE,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "status" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
  "order" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL
);

CREATE TABLE "LessonBlock" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "lessonId" UUID NOT NULL REFERENCES "Lesson"("id") ON DELETE CASCADE,
  "type" "CmsBlockType" NOT NULL,
  "order" INTEGER NOT NULL,
  "data" JSONB NOT NULL
);

CREATE INDEX "LessonBlock_lessonId_order_idx" ON "LessonBlock"("lessonId", "order");

CREATE TABLE "Article" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL DEFAULT '{}',
  "status" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
  "bodyBlocks" JSONB NOT NULL,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "canonicalUrl" TEXT,
  "readingTime" TEXT,
  "difficulty" TEXT,
  "publishedAt" TIMESTAMPTZ,
  "lastReviewedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL
);

CREATE TABLE "Casino" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "domain" TEXT NOT NULL UNIQUE,
  "operator" TEXT,
  "editorScore" DOUBLE PRECISION,
  "license" TEXT,
  "country" TEXT,
  "status" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMPTZ,
  "lastReviewedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL
);

CREATE TABLE "Bonus" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "casinoId" UUID NOT NULL REFERENCES "Casino"("id") ON DELETE CASCADE,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "amount" INTEGER,
  "percentage" INTEGER,
  "minimumDeposit" INTEGER,
  "maximumBonus" INTEGER,
  "wageringMultiplier" INTEGER,
  "termsUrl" TEXT,
  "status" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
  "offerStatus" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
  "lastVerifiedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL
);

CREATE TABLE "AffiliateLink" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "destinationUrl" TEXT NOT NULL,
  "casinoId" UUID REFERENCES "Casino"("id") ON DELETE SET NULL,
  "bonusId" UUID REFERENCES "Bonus"("id") ON DELETE SET NULL,
  "country" TEXT,
  "language" TEXT,
  "campaign" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "status" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
  "effectiveStart" TIMESTAMPTZ,
  "effectiveEnd" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdBy" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL
);

CREATE TABLE "ContentRevision" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "revisionNumber" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "summary" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "ContentRevision_entity_idx" ON "ContentRevision"("entityType", "entityId");

CREATE TABLE "AuditLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorId" UUID NOT NULL REFERENCES "AdminUser"("id") ON DELETE CASCADE,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

CREATE TABLE "MediaAsset" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "url" TEXT NOT NULL,
  "alt" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "SiteSetting" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" TEXT NOT NULL UNIQUE,
  "value" JSONB NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
