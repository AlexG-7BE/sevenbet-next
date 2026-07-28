-- Follow-up to 0011: add nullable suspension-capable lifecycle state without
-- altering existing affiliate/CMS statuses or requiring a backfill.
ALTER TABLE "CasinoBonus" ADD COLUMN "domainLifecycleStatus" "CasinoLifecycleStatus";
ALTER TABLE "AffiliateProgram" ADD COLUMN "domainLifecycleStatus" "CasinoLifecycleStatus";
ALTER TABLE "AffiliateOffer" ADD COLUMN "domainLifecycleStatus" "CasinoLifecycleStatus";
