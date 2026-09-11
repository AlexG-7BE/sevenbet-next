-- B4GAMBLE Customer Data, Analytics & Lifecycle Core v1.
-- This migration is additive. It preserves Better Auth identity and the
-- existing RFC-042 commercial routing authority.

CREATE TYPE "CustomerAccountState" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "AnalyticsEnvironment" AS ENUM ('LOCAL', 'PREVIEW', 'PRODUCTION', 'TEST');
CREATE TYPE "AnalyticsTrafficKind" AS ENUM ('HUMAN', 'BOT', 'INTERNAL', 'TEST');
CREATE TYPE "AnalyticsDeviceCategory" AS ENUM ('DESKTOP', 'MOBILE', 'TABLET', 'UNKNOWN');
CREATE TYPE "AnalyticsEventType" AS ENUM (
  'SESSION_STARTED', 'PAGE_VIEWED', 'SIGNUP_COMPLETED', 'LOGIN_COMPLETED',
  'PROGRAMME_STARTED', 'PROGRAMME_STEP_VIEWED', 'PROGRAMME_STEP_COMPLETED', 'PROGRAMME_COMPLETED',
  'CASINO_VIEWED', 'OFFER_VIEWED', 'COMMERCIAL_CTA_CLICKED',
  'OUTBOUND_REDIRECT_ATTEMPTED', 'OUTBOUND_REDIRECT_SUCCEEDED', 'OUTBOUND_REDIRECT_BLOCKED',
  'EMAIL_SENT', 'EMAIL_DELIVERED', 'EMAIL_BOUNCED', 'EMAIL_CLICKED', 'EMAIL_UNSUBSCRIBED'
);
CREATE TYPE "ConsentPurpose" AS ENUM ('ANALYTICS', 'MARKETING_EMAIL');
CREATE TYPE "ConsentAction" AS ENUM ('GRANTED', 'DENIED', 'WITHDRAWN', 'SUPPRESSED', 'UNSUPPRESSED');
CREATE TYPE "ConsentSource" AS ENUM (
  'ANALYTICS_PREFERENCE', 'PROGRAMME_SIGNUP', 'ACCOUNT_PREFERENCES',
  'UNSUBSCRIBE_LINK', 'PROVIDER_WEBHOOK', 'ADMIN', 'SYSTEM'
);
CREATE TYPE "EmailSuppressionScope" AS ENUM ('NONE', 'MARKETING', 'ALL');
CREATE TYPE "EmailTemplateKey" AS ENUM (
  'EMAIL_VERIFICATION', 'PASSWORD_RESET', 'ACCOUNT_SECURITY',
  'WELCOME', 'PROGRAMME_REMINDER', 'MARKETING_BROADCAST'
);
CREATE TYPE "EmailTemplateType" AS ENUM ('TRANSACTIONAL', 'LIFECYCLE', 'MARKETING');
CREATE TYPE "EmailPurpose" AS ENUM (
  'EMAIL_VERIFICATION', 'PASSWORD_RESET', 'ACCOUNT_SECURITY',
  'WELCOME', 'PROGRAMME_REMINDER', 'MARKETING_BROADCAST', 'TEST'
);
CREATE TYPE "EmailMessageStatus" AS ENUM (
  'QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'BOUNCED', 'FAILED',
  'UNKNOWN', 'SUPPRESSED', 'CANCELLED'
);
CREATE TYPE "EmailProviderEventType" AS ENUM ('DELIVERED', 'BOUNCED', 'CLICKED', 'COMPLAINED', 'SUPPRESSED');
CREATE TYPE "EmailCampaignStatus" AS ENUM (
  'DRAFT', 'REVIEWED', 'QUEUED', 'SENDING', 'COMPLETED',
  'PARTIALLY_FAILED', 'FAILED', 'CANCELLED'
);
CREATE TYPE "EmailProgrammeSegment" AS ENUM ('ANY', 'STARTED', 'COMPLETED', 'NOT_COMPLETED');
CREATE TYPE "OutboundClickState" AS ENUM ('SUCCEEDED', 'BLOCKED');

ALTER TABLE "User"
  ADD COLUMN "accountState" "CustomerAccountState" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "preferredLocale" VARCHAR(16),
  ADD COLUMN "signupCountryCode" VARCHAR(2),
  ADD COLUMN "signupSource" VARCHAR(64),
  ADD COLUMN "signupReferrerHost" VARCHAR(253),
  ADD COLUMN "signupUtmSource" VARCHAR(100),
  ADD COLUMN "signupUtmMedium" VARCHAR(100),
  ADD COLUMN "signupUtmCampaign" VARCHAR(100),
  ADD COLUMN "signupUtmContent" VARCHAR(100),
  ADD COLUMN "signupUtmTerm" VARCHAR(100),
  ADD COLUMN "lastSeenAt" TIMESTAMP(3);

ALTER TABLE "User"
  ADD CONSTRAINT "User_signupCountryCode_check" CHECK (
    "signupCountryCode" IS NULL OR "signupCountryCode" ~ '^[A-Z]{2}$'
  );

-- Better Auth remains identity authority; this closes case/whitespace
-- duplicates without introducing a parallel customer identifier.
CREATE UNIQUE INDEX "User_email_normalized_key" ON "User" (lower(btrim("email")));
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX "User_lastSeenAt_idx" ON "User"("lastSeenAt");
CREATE INDEX "User_accountState_createdAt_idx" ON "User"("accountState", "createdAt");
CREATE INDEX "User_preferredLocale_idx" ON "User"("preferredLocale");
CREATE INDEX "User_signupCountryCode_idx" ON "User"("signupCountryCode");

CREATE TABLE "AnalyticsSession" (
  "id" UUID NOT NULL,
  "anonymousId" UUID NOT NULL,
  "userId" TEXT,
  "environment" "AnalyticsEnvironment" NOT NULL,
  "trafficKind" "AnalyticsTrafficKind" NOT NULL DEFAULT 'HUMAN',
  "startedAt" TIMESTAMP(3) NOT NULL,
  "lastActivityAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "landingPath" VARCHAR(512),
  "locale" VARCHAR(16),
  "countryCode" CHAR(2),
  "referrerHost" VARCHAR(253),
  "acquisitionSource" VARCHAR(64),
  "utmSource" VARCHAR(100),
  "utmMedium" VARCHAR(100),
  "utmCampaign" VARCHAR(100),
  "utmContent" VARCHAR(100),
  "utmTerm" VARCHAR(100),
  "deviceCategory" "AnalyticsDeviceCategory" NOT NULL DEFAULT 'UNKNOWN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnalyticsSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AnalyticsSession_countryCode_check" CHECK (
    "countryCode" IS NULL OR "countryCode" ~ '^[A-Z]{2}$'
  ),
  CONSTRAINT "AnalyticsSession_time_check" CHECK (
    "startedAt" <= "lastActivityAt" AND "lastActivityAt" <= "expiresAt"
  )
);

CREATE TABLE "AnalyticsEvent" (
  "id" UUID NOT NULL,
  "dedupeKey" VARCHAR(200) NOT NULL,
  "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  "type" "AnalyticsEventType" NOT NULL,
  "environment" "AnalyticsEnvironment" NOT NULL,
  "trafficKind" "AnalyticsTrafficKind" NOT NULL DEFAULT 'HUMAN',
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "anonymousId" UUID,
  "analyticsSessionId" UUID,
  "userId" TEXT,
  "pagePath" VARCHAR(512),
  "locale" VARCHAR(16),
  "countryCode" CHAR(2),
  "referrerHost" VARCHAR(253),
  "acquisitionSource" VARCHAR(64),
  "utmSource" VARCHAR(100),
  "utmMedium" VARCHAR(100),
  "utmCampaign" VARCHAR(100),
  "utmContent" VARCHAR(100),
  "utmTerm" VARCHAR(100),
  "deviceCategory" "AnalyticsDeviceCategory" NOT NULL DEFAULT 'UNKNOWN',
  "casinoId" UUID,
  "affiliateOfferId" UUID,
  "affiliateNetworkId" UUID,
  "placement" VARCHAR(64),
  "programmeStep" INTEGER,
  "outboundClickId" UUID,
  "emailMessageId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AnalyticsEvent_schemaVersion_check" CHECK ("schemaVersion" = 1),
  CONSTRAINT "AnalyticsEvent_programmeStep_check" CHECK (
    "programmeStep" IS NULL OR "programmeStep" BETWEEN 1 AND 10
  ),
  CONSTRAINT "AnalyticsEvent_countryCode_check" CHECK (
    "countryCode" IS NULL OR "countryCode" ~ '^[A-Z]{2}$'
  )
);

CREATE TABLE "OutboundClick" (
  "id" UUID NOT NULL,
  "state" "OutboundClickState" NOT NULL,
  "blockedReason" VARCHAR(64),
  "environment" "AnalyticsEnvironment" NOT NULL,
  "trafficKind" "AnalyticsTrafficKind" NOT NULL DEFAULT 'HUMAN',
  "attemptedAt" TIMESTAMP(3) NOT NULL,
  "resolvedAt" TIMESTAMP(3) NOT NULL,
  "anonymousId" UUID,
  "analyticsSessionId" UUID,
  "userId" TEXT,
  "sourcePage" VARCHAR(512),
  "locale" VARCHAR(16),
  "countryCode" CHAR(2),
  "acquisitionSource" VARCHAR(64),
  "placement" VARCHAR(64),
  "requestedSlug" VARCHAR(80) NOT NULL,
  "casinoId" UUID,
  "affiliateOfferId" UUID,
  "affiliateNetworkId" UUID,
  "redirectSlugId" UUID,
  "trackingLinkId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OutboundClick_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OutboundClick_time_check" CHECK ("attemptedAt" <= "resolvedAt"),
  CONSTRAINT "OutboundClick_countryCode_check" CHECK (
    "countryCode" IS NULL OR "countryCode" ~ '^[A-Z]{2}$'
  ),
  CONSTRAINT "OutboundClick_state_check" CHECK (
    ("state" = 'SUCCEEDED' AND "blockedReason" IS NULL)
    OR ("state" = 'BLOCKED' AND length(btrim("blockedReason")) > 0)
  )
);

CREATE TABLE "CustomerEmailPreference" (
  "id" UUID NOT NULL,
  "userId" TEXT NOT NULL,
  "marketingAllowed" BOOLEAN NOT NULL DEFAULT false,
  "consentedAt" TIMESTAMP(3),
  "unsubscribedAt" TIMESTAMP(3),
  "suppressedAt" TIMESTAMP(3),
  "suppressionScope" "EmailSuppressionScope" NOT NULL DEFAULT 'NONE',
  "suppressionReason" VARCHAR(64),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomerEmailPreference_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CustomerEmailPreference_state_check" CHECK (
    ("marketingAllowed" = false)
    OR ("consentedAt" IS NOT NULL AND "unsubscribedAt" IS NULL AND "suppressionScope" = 'NONE')
  ),
  CONSTRAINT "CustomerEmailPreference_suppression_check" CHECK (
    ("suppressionScope" = 'NONE' AND "suppressedAt" IS NULL)
    OR ("suppressionScope" <> 'NONE' AND "suppressedAt" IS NOT NULL)
  )
);

CREATE TABLE "ConsentEvent" (
  "id" UUID NOT NULL,
  "userId" TEXT,
  "anonymousId" UUID,
  "purpose" "ConsentPurpose" NOT NULL,
  "action" "ConsentAction" NOT NULL,
  "source" "ConsentSource" NOT NULL,
  "policyVersion" VARCHAR(64),
  "locale" VARCHAR(16),
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConsentEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ConsentEvent_subject_check" CHECK (
    "userId" IS NOT NULL OR "anonymousId" IS NOT NULL
  )
);

CREATE TABLE "EmailTemplate" (
  "id" UUID NOT NULL,
  "key" "EmailTemplateKey" NOT NULL,
  "type" "EmailTemplateType" NOT NULL,
  "locale" VARCHAR(16) NOT NULL,
  "subject" VARCHAR(200) NOT NULL,
  "htmlBody" TEXT NOT NULL,
  "textBody" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "createdBy" VARCHAR(100) NOT NULL,
  "updatedBy" VARCHAR(100) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmailTemplate_version_check" CHECK ("version" > 0),
  CONSTRAINT "EmailTemplate_key_type_check" CHECK (
    ("key" IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'ACCOUNT_SECURITY') AND "type" = 'TRANSACTIONAL')
    OR ("key" IN ('WELCOME', 'PROGRAMME_REMINDER') AND "type" = 'LIFECYCLE')
    OR ("key" = 'MARKETING_BROADCAST' AND "type" = 'MARKETING')
  ),
  CONSTRAINT "EmailTemplate_content_check" CHECK (
    length(btrim("locale")) > 0 AND length(btrim("subject")) > 0
    AND length(btrim("htmlBody")) > 0 AND length(btrim("textBody")) > 0
  )
);

CREATE TABLE "EmailCampaign" (
  "id" UUID NOT NULL,
  "environment" "AnalyticsEnvironment" NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "templateId" UUID NOT NULL,
  "locale" VARCHAR(16),
  "countryCode" CHAR(2),
  "programmeSegment" "EmailProgrammeSegment" NOT NULL DEFAULT 'ANY',
  "inactiveDays" INTEGER,
  "newUsersOnly" BOOLEAN NOT NULL DEFAULT false,
  "status" "EmailCampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "idempotencyKey" VARCHAR(200) NOT NULL,
  "estimatedEligibleCount" INTEGER NOT NULL DEFAULT 0,
  "estimatedExcludedCount" INTEGER NOT NULL DEFAULT 0,
  "estimatedSuppressedCount" INTEGER NOT NULL DEFAULT 0,
  "queuedCount" INTEGER NOT NULL DEFAULT 0,
  "sentCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "createdByAdminId" UUID NOT NULL,
  "reviewedByAdminId" UUID,
  "reviewedAt" TIMESTAMP(3),
  "queuedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmailCampaign_countryCode_check" CHECK (
    "countryCode" IS NULL OR "countryCode" ~ '^[A-Z]{2}$'
  ),
  CONSTRAINT "EmailCampaign_inactiveDays_check" CHECK (
    "inactiveDays" IS NULL OR "inactiveDays" IN (7, 30)
  ),
  CONSTRAINT "EmailCampaign_counts_check" CHECK (
    "estimatedEligibleCount" >= 0 AND "estimatedExcludedCount" >= 0 AND "estimatedSuppressedCount" >= 0
    AND "queuedCount" >= 0 AND "sentCount" >= 0 AND "failedCount" >= 0
  ),
  CONSTRAINT "EmailCampaign_review_check" CHECK (
    "status" = 'DRAFT' OR ("reviewedByAdminId" IS NOT NULL AND "reviewedAt" IS NOT NULL)
  )
);

CREATE TABLE "EmailMessage" (
  "id" UUID NOT NULL,
  "userId" TEXT NOT NULL,
  "campaignId" UUID,
  "templateId" UUID NOT NULL,
  "purpose" "EmailPurpose" NOT NULL,
  "status" "EmailMessageStatus" NOT NULL DEFAULT 'QUEUED',
  "environment" "AnalyticsEnvironment" NOT NULL,
  "locale" VARCHAR(16) NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "subject" VARCHAR(200) NOT NULL,
  "templateVersion" INTEGER NOT NULL,
  "idempotencyKey" VARCHAR(200) NOT NULL,
  "provider" VARCHAR(32),
  "providerMessageId" VARCHAR(200),
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastAttemptAt" TIMESTAMP(3),
  "nextAttemptAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "bouncedAt" TIMESTAMP(3),
  "clickedAt" TIMESTAMP(3),
  "unsubscribedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "deliveryErrorCode" VARCHAR(64),
  "isTest" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmailMessage_attemptCount_check" CHECK ("attemptCount" BETWEEN 0 AND 5),
  CONSTRAINT "EmailMessage_templateVersion_check" CHECK ("templateVersion" > 0),
  CONSTRAINT "EmailMessage_recipient_check" CHECK (
    length(btrim("recipientEmail")) BETWEEN 3 AND 320 AND position('@' in "recipientEmail") > 1
  ),
  CONSTRAINT "EmailMessage_provider_pair_check" CHECK (
    ("provider" IS NULL) = ("providerMessageId" IS NULL)
  ),
  CONSTRAINT "EmailMessage_test_purpose_check" CHECK (
    ("purpose" = 'TEST') = "isTest"
  ),
  CONSTRAINT "EmailMessage_provider_state_check" CHECK (
    "status" NOT IN ('SENT', 'DELIVERED', 'BOUNCED')
    OR ("provider" IS NOT NULL AND "providerMessageId" IS NOT NULL AND "sentAt" IS NOT NULL)
  ),
  CONSTRAINT "EmailMessage_outcome_time_check" CHECK (
    ("status" <> 'DELIVERED' OR "deliveredAt" IS NOT NULL)
    AND ("status" <> 'BOUNCED' OR "bouncedAt" IS NOT NULL)
  )
);

CREATE TABLE "EmailProviderEvent" (
  "id" UUID NOT NULL,
  "providerEventId" VARCHAR(200) NOT NULL,
  "messageId" UUID NOT NULL,
  "providerMessageId" VARCHAR(200) NOT NULL,
  "type" "EmailProviderEventType" NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailProviderEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailUnsubscribeToken" (
  "id" UUID NOT NULL,
  "messageId" UUID NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" CHAR(64) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "consumedAt" TIMESTAMP(3),
  CONSTRAINT "EmailUnsubscribeToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmailUnsubscribeToken_hash_check" CHECK ("tokenHash" ~ '^[a-f0-9]{64}$')
);

CREATE TABLE "AnalyticsRateLimitBucket" (
  "bucketKey" CHAR(64) NOT NULL,
  "count" INTEGER NOT NULL,
  "windowStartedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnalyticsRateLimitBucket_pkey" PRIMARY KEY ("bucketKey"),
  CONSTRAINT "AnalyticsRateLimitBucket_count_check" CHECK ("count" > 0)
);

CREATE INDEX "AnalyticsSession_anonymousId_startedAt_idx" ON "AnalyticsSession"("anonymousId", "startedAt");
CREATE INDEX "AnalyticsSession_userId_startedAt_idx" ON "AnalyticsSession"("userId", "startedAt");
CREATE INDEX "AnalyticsSession_environment_trafficKind_startedAt_idx" ON "AnalyticsSession"("environment", "trafficKind", "startedAt");
CREATE INDEX "AnalyticsSession_expiresAt_idx" ON "AnalyticsSession"("expiresAt");

CREATE UNIQUE INDEX "AnalyticsEvent_dedupeKey_key" ON "AnalyticsEvent"("dedupeKey");
CREATE INDEX "AnalyticsEvent_environment_trafficKind_occurredAt_idx" ON "AnalyticsEvent"("environment", "trafficKind", "occurredAt");
CREATE INDEX "AnalyticsEvent_environment_type_occurredAt_idx" ON "AnalyticsEvent"("environment", "type", "occurredAt");
CREATE INDEX "AnalyticsEvent_occurredAt_idx" ON "AnalyticsEvent"("occurredAt");
CREATE INDEX "AnalyticsEvent_userId_occurredAt_idx" ON "AnalyticsEvent"("userId", "occurredAt");
CREATE INDEX "AnalyticsEvent_analyticsSessionId_occurredAt_idx" ON "AnalyticsEvent"("analyticsSessionId", "occurredAt");
CREATE INDEX "AnalyticsEvent_anonymousId_occurredAt_idx" ON "AnalyticsEvent"("anonymousId", "occurredAt");
CREATE INDEX "AnalyticsEvent_casinoId_occurredAt_idx" ON "AnalyticsEvent"("casinoId", "occurredAt");
CREATE INDEX "AnalyticsEvent_affiliateOfferId_occurredAt_idx" ON "AnalyticsEvent"("affiliateOfferId", "occurredAt");
CREATE INDEX "AnalyticsEvent_countryCode_occurredAt_idx" ON "AnalyticsEvent"("countryCode", "occurredAt");
CREATE INDEX "AnalyticsEvent_pagePath_occurredAt_idx" ON "AnalyticsEvent"("pagePath", "occurredAt");
CREATE INDEX "AnalyticsEvent_outboundClickId_idx" ON "AnalyticsEvent"("outboundClickId");
CREATE INDEX "AnalyticsEvent_emailMessageId_idx" ON "AnalyticsEvent"("emailMessageId");

CREATE INDEX "OutboundClick_environment_trafficKind_attemptedAt_idx" ON "OutboundClick"("environment", "trafficKind", "attemptedAt");
CREATE INDEX "OutboundClick_state_attemptedAt_idx" ON "OutboundClick"("state", "attemptedAt");
CREATE INDEX "OutboundClick_attemptedAt_idx" ON "OutboundClick"("attemptedAt");
CREATE INDEX "OutboundClick_userId_attemptedAt_idx" ON "OutboundClick"("userId", "attemptedAt");
CREATE INDEX "OutboundClick_analyticsSessionId_attemptedAt_idx" ON "OutboundClick"("analyticsSessionId", "attemptedAt");
CREATE INDEX "OutboundClick_casinoId_attemptedAt_idx" ON "OutboundClick"("casinoId", "attemptedAt");
CREATE INDEX "OutboundClick_affiliateOfferId_attemptedAt_idx" ON "OutboundClick"("affiliateOfferId", "attemptedAt");
CREATE INDEX "OutboundClick_countryCode_attemptedAt_idx" ON "OutboundClick"("countryCode", "attemptedAt");
CREATE INDEX "OutboundClick_sourcePage_attemptedAt_idx" ON "OutboundClick"("sourcePage", "attemptedAt");

CREATE UNIQUE INDEX "CustomerEmailPreference_userId_key" ON "CustomerEmailPreference"("userId");
CREATE INDEX "CustomerEmailPreference_marketingAllowed_suppressionScope_idx" ON "CustomerEmailPreference"("marketingAllowed", "suppressionScope");
CREATE INDEX "CustomerEmailPreference_unsubscribedAt_idx" ON "CustomerEmailPreference"("unsubscribedAt");
CREATE INDEX "ConsentEvent_userId_purpose_occurredAt_idx" ON "ConsentEvent"("userId", "purpose", "occurredAt");
CREATE INDEX "ConsentEvent_userId_occurredAt_idx" ON "ConsentEvent"("userId", "occurredAt");
CREATE INDEX "ConsentEvent_anonymousId_purpose_occurredAt_idx" ON "ConsentEvent"("anonymousId", "purpose", "occurredAt");
CREATE INDEX "ConsentEvent_purpose_action_occurredAt_idx" ON "ConsentEvent"("purpose", "action", "occurredAt");

CREATE UNIQUE INDEX "EmailTemplate_key_locale_version_key" ON "EmailTemplate"("key", "locale", "version");
CREATE UNIQUE INDEX "EmailTemplate_active_key_locale_key" ON "EmailTemplate"("key", "locale") WHERE "active" = true;
CREATE INDEX "EmailTemplate_key_locale_active_idx" ON "EmailTemplate"("key", "locale", "active");
CREATE INDEX "EmailTemplate_type_active_idx" ON "EmailTemplate"("type", "active");

CREATE UNIQUE INDEX "EmailCampaign_environment_idempotencyKey_key" ON "EmailCampaign"("environment", "idempotencyKey");
CREATE INDEX "EmailCampaign_environment_status_createdAt_idx" ON "EmailCampaign"("environment", "status", "createdAt");
CREATE INDEX "EmailCampaign_templateId_createdAt_idx" ON "EmailCampaign"("templateId", "createdAt");
CREATE INDEX "EmailCampaign_createdByAdminId_createdAt_idx" ON "EmailCampaign"("createdByAdminId", "createdAt");

CREATE UNIQUE INDEX "EmailMessage_environment_idempotencyKey_key" ON "EmailMessage"("environment", "idempotencyKey");
CREATE UNIQUE INDEX "EmailMessage_providerMessageId_key" ON "EmailMessage"("providerMessageId");
CREATE UNIQUE INDEX "EmailMessage_campaignId_userId_key" ON "EmailMessage"("campaignId", "userId");
CREATE INDEX "EmailMessage_userId_createdAt_idx" ON "EmailMessage"("userId", "createdAt");
CREATE INDEX "EmailMessage_status_nextAttemptAt_queuedAt_idx" ON "EmailMessage"("status", "nextAttemptAt", "queuedAt");
CREATE INDEX "EmailMessage_purpose_createdAt_idx" ON "EmailMessage"("purpose", "createdAt");
CREATE INDEX "EmailMessage_environment_status_createdAt_idx" ON "EmailMessage"("environment", "status", "createdAt");
CREATE INDEX "EmailMessage_environment_sentAt_idx" ON "EmailMessage"("environment", "sentAt");
CREATE INDEX "EmailMessage_status_createdAt_idx" ON "EmailMessage"("status", "createdAt");
CREATE INDEX "EmailMessage_campaignId_status_idx" ON "EmailMessage"("campaignId", "status");

CREATE UNIQUE INDEX "EmailProviderEvent_providerEventId_key" ON "EmailProviderEvent"("providerEventId");
CREATE INDEX "EmailProviderEvent_messageId_occurredAt_idx" ON "EmailProviderEvent"("messageId", "occurredAt");
CREATE INDEX "EmailProviderEvent_type_occurredAt_idx" ON "EmailProviderEvent"("type", "occurredAt");
CREATE INDEX "EmailProviderEvent_occurredAt_idx" ON "EmailProviderEvent"("occurredAt");
CREATE INDEX "EmailProviderEvent_providerMessageId_idx" ON "EmailProviderEvent"("providerMessageId");
CREATE UNIQUE INDEX "EmailUnsubscribeToken_messageId_key" ON "EmailUnsubscribeToken"("messageId");
CREATE UNIQUE INDEX "EmailUnsubscribeToken_tokenHash_key" ON "EmailUnsubscribeToken"("tokenHash");
CREATE INDEX "EmailUnsubscribeToken_userId_consumedAt_idx" ON "EmailUnsubscribeToken"("userId", "consumedAt");
CREATE INDEX "AnalyticsRateLimitBucket_expiresAt_idx" ON "AnalyticsRateLimitBucket"("expiresAt");
CREATE INDEX "ProgramEnrollment_startedAt_idx" ON "ProgramEnrollment"("startedAt");

ALTER TABLE "AnalyticsSession" ADD CONSTRAINT "AnalyticsSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_analyticsSessionId_fkey" FOREIGN KEY ("analyticsSessionId") REFERENCES "AnalyticsSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_affiliateOfferId_fkey" FOREIGN KEY ("affiliateOfferId") REFERENCES "AffiliateOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_affiliateNetworkId_fkey" FOREIGN KEY ("affiliateNetworkId") REFERENCES "AffiliateNetwork"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OutboundClick" ADD CONSTRAINT "OutboundClick_analyticsSessionId_fkey" FOREIGN KEY ("analyticsSessionId") REFERENCES "AnalyticsSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OutboundClick" ADD CONSTRAINT "OutboundClick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OutboundClick" ADD CONSTRAINT "OutboundClick_casinoId_fkey" FOREIGN KEY ("casinoId") REFERENCES "Casino"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OutboundClick" ADD CONSTRAINT "OutboundClick_affiliateOfferId_fkey" FOREIGN KEY ("affiliateOfferId") REFERENCES "AffiliateOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OutboundClick" ADD CONSTRAINT "OutboundClick_affiliateNetworkId_fkey" FOREIGN KEY ("affiliateNetworkId") REFERENCES "AffiliateNetwork"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OutboundClick" ADD CONSTRAINT "OutboundClick_redirectSlugId_fkey" FOREIGN KEY ("redirectSlugId") REFERENCES "AffiliateRedirectSlug"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OutboundClick" ADD CONSTRAINT "OutboundClick_trackingLinkId_fkey" FOREIGN KEY ("trackingLinkId") REFERENCES "AffiliateTrackingLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerEmailPreference" ADD CONSTRAINT "CustomerEmailPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConsentEvent" ADD CONSTRAINT "ConsentEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmailProviderEvent" ADD CONSTRAINT "EmailProviderEvent_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "EmailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailUnsubscribeToken" ADD CONSTRAINT "EmailUnsubscribeToken_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "EmailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailUnsubscribeToken" ADD CONSTRAINT "EmailUnsubscribeToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_outboundClickId_fkey" FOREIGN KEY ("outboundClickId") REFERENCES "OutboundClick"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_emailMessageId_fkey" FOREIGN KEY ("emailMessageId") REFERENCES "EmailMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Approved English operational defaults. Unsupported customer locales use
-- these documented EN fallbacks until approved translations are supplied.
INSERT INTO "EmailTemplate" (
  "id", "key", "type", "locale", "subject", "htmlBody", "textBody",
  "version", "active", "createdBy", "updatedBy", "updatedAt"
) VALUES
  ('4a910001-89d2-4aad-a001-000000000001', 'EMAIL_VERIFICATION', 'TRANSACTIONAL', 'en',
   'Verify your B4GAMBLE email',
   '<p>Hello {{name}},</p><p>Verify your email to secure your B4GAMBLE account.</p><p><a href="{{action_url}}">Verify email</a></p>',
   E'Hello {{name}},\n\nVerify your email to secure your B4GAMBLE account: {{action_url}}',
   1, true, 'migration-0037', 'migration-0037', CURRENT_TIMESTAMP),
  ('4a910001-89d2-4aad-a001-000000000002', 'PASSWORD_RESET', 'TRANSACTIONAL', 'en',
   'Reset your B4GAMBLE password',
   '<p>Hello {{name}},</p><p>Use the secure link below to reset your password.</p><p><a href="{{action_url}}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>',
   E'Hello {{name}},\n\nReset your password: {{action_url}}\n\nIf you did not request this, you can ignore this email.',
   1, true, 'migration-0037', 'migration-0037', CURRENT_TIMESTAMP),
  ('4a910001-89d2-4aad-a001-000000000003', 'WELCOME', 'LIFECYCLE', 'en',
   'Welcome to B4GAMBLE',
   '<p>Hello {{name}},</p><p>Your B4GAMBLE account is ready. You can return to your private 10 Steps Programme whenever you choose.</p><p><a href="{{programme_url}}">Continue to B4GAMBLE</a></p>',
   E'Hello {{name}},\n\nYour B4GAMBLE account is ready. Continue when you choose: {{programme_url}}',
   1, true, 'migration-0037', 'migration-0037', CURRENT_TIMESTAMP),
  ('4a910001-89d2-4aad-a001-000000000004', 'PROGRAMME_REMINDER', 'LIFECYCLE', 'en',
   'Continue your B4GAMBLE Programme when you are ready',
   '<p>Hello {{name}},</p><p>Your saved Programme is ready when you want to continue.</p><p><a href="{{programme_url}}">Continue Programme</a></p><p><a href="{{unsubscribe_url}}">Unsubscribe from these emails</a></p>',
   E'Hello {{name}},\n\nYour saved Programme is ready when you want to continue: {{programme_url}}\n\nUnsubscribe: {{unsubscribe_url}}',
   1, true, 'migration-0037', 'migration-0037', CURRENT_TIMESTAMP),
  ('4a910001-89d2-4aad-a001-000000000005', 'MARKETING_BROADCAST', 'MARKETING', 'en',
   'B4GAMBLE update',
   '<p>Hello {{name}},</p><p>Here is the latest B4GAMBLE product update.</p><p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>',
   E'Hello {{name}},\n\nHere is the latest B4GAMBLE product update.\n\nUnsubscribe: {{unsubscribe_url}}',
   1, true, 'migration-0037', 'migration-0037', CURRENT_TIMESTAMP)
ON CONFLICT ("key", "locale", "version") DO NOTHING;

COMMENT ON TABLE "AnalyticsEvent" IS 'Closed-schema consented Product Core observations; never identity or Programme-progress authority.';
COMMENT ON TABLE "OutboundClick" IS 'Server-authoritative observation of RFC-042 redirect outcomes; never redirect authority and never stores partner URLs/tokens.';
COMMENT ON TABLE "ConsentEvent" IS 'Append-only material consent history; current email eligibility is projected in CustomerEmailPreference.';
