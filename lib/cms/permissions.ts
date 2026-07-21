import type { AdminRole, CmsPermission, CmsUser } from "@/lib/cms/types";

export const permissionsByRole: Record<AdminRole, CmsPermission[]> = {
  SUPER_ADMIN: [
    "article.create",
    "article.edit",
    "article.review",
    "article.publish",
    "program.view",
    "program.create",
    "program.edit",
    "program.review",
    "program.approve",
    "program.publish",
    "program.archive",
    "program.restore_revision",
    "program.preview_draft",
    "lesson.edit",
    "quiz.edit",
    "scenario.edit",
    "exercise.edit",
    "achievement.manage",
    "xp.manage",
    "casino.edit",
    "bonus.edit",
    "affiliate.manage",
    "media.manage",
    "user.view",
    "analytics.view",
    "settings.manage",
  ],
  ADMIN: [
    "article.create",
    "article.edit",
    "article.review",
    "article.publish",
    "program.view",
    "program.create",
    "program.edit",
    "program.review",
    "program.approve",
    "program.publish",
    "program.archive",
    "program.restore_revision",
    "program.preview_draft",
    "lesson.edit",
    "quiz.edit",
    "scenario.edit",
    "exercise.edit",
    "achievement.manage",
    "xp.manage",
    "casino.edit",
    "bonus.edit",
    "affiliate.manage",
    "media.manage",
    "user.view",
    "analytics.view",
  ],
  EDITOR: [
    "article.create", "article.edit", "article.review", "program.view", "program.create", "program.edit",
    "program.review", "program.preview_draft", "lesson.edit", "quiz.edit", "scenario.edit", "exercise.edit",
    "casino.edit", "bonus.edit", "media.manage",
  ],
  AUTHOR: ["article.create", "article.edit"],
  REVIEWER: ["article.review", "program.view", "program.review", "program.approve", "program.preview_draft", "casino.edit", "bonus.edit"],
  AFFILIATE_MANAGER: ["affiliate.manage", "casino.edit", "bonus.edit", "media.manage"],
  ANALYST: ["analytics.view"],
  SUPPORT: ["user.view"],
};

export function canPerformAction(user: Pick<CmsUser, "permissions" | "role"> | null, permission: CmsPermission) {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  return user.permissions.includes(permission);
}

export function requirePermission(user: Pick<CmsUser, "permissions" | "role"> | null, permission: CmsPermission) {
  if (!canPerformAction(user, permission)) {
    throw new Error(`Missing CMS permission: ${permission}`);
  }
}

export function permissionsForRole(role: AdminRole) {
  return permissionsByRole[role];
}
