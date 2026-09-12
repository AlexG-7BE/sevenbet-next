-- Founder-authorized Commercial UX observations extend the existing closed
-- RFC-046 dictionary. No free-form properties or new identity authority are
-- introduced.
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'COMMERCIAL_VIEW_SELECTED';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'COMMERCIAL_CARD_VIEWED';
ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS 'CASINO_REVIEW_CLICKED';

ALTER TABLE "AnalyticsEvent" ADD COLUMN "position" INTEGER;

ALTER TABLE "AnalyticsEvent"
  ADD CONSTRAINT "AnalyticsEvent_position_check"
  CHECK ("position" IS NULL OR ("position" >= 1 AND "position" <= 1000));
