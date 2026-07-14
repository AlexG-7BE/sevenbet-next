-- Achievement XP is a separate server-authored source from an XP rule.
ALTER TABLE "UserXpEvent"
ALTER COLUMN "ruleId" DROP NOT NULL,
ADD COLUMN "achievementId" UUID;

ALTER TABLE "UserXpEvent"
ADD CONSTRAINT "UserXpEvent_source_check"
CHECK (
  ("ruleId" IS NOT NULL AND "achievementId" IS NULL)
  OR ("ruleId" IS NULL AND "achievementId" IS NOT NULL)
);

CREATE INDEX "UserXpEvent_ruleId_idx" ON "UserXpEvent"("ruleId");
CREATE INDEX "UserXpEvent_achievementId_idx" ON "UserXpEvent"("achievementId");
CREATE INDEX "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");

ALTER TABLE "UserXpEvent"
ADD CONSTRAINT "UserXpEvent_ruleId_fkey"
FOREIGN KEY ("ruleId") REFERENCES "XpRule"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserXpEvent"
ADD CONSTRAINT "UserXpEvent_achievementId_fkey"
FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserAchievement"
ADD CONSTRAINT "UserAchievement_achievementId_fkey"
FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
