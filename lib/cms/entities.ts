import type { CmsEntity, CmsPermission } from "@/lib/cms/types";

export const cmsEntities: CmsEntity[] = [
  "program",
  "program-step",
  "lesson",
  "achievement",
  "xp-rule",
  "article",
  "casino",
  "bonus",
  "affiliate-link",
  "navigation",
  "settings",
];

export const entityLabels: Record<CmsEntity, string> = {
  program: "Programs",
  "program-step": "Program Steps",
  lesson: "Lessons",
  achievement: "Achievements",
  "xp-rule": "XP Rules",
  article: "Articles",
  casino: "Casinos",
  bonus: "Bonuses",
  "affiliate-link": "Affiliate Links",
  navigation: "Navigation",
  settings: "Settings",
};

export function isCmsEntity(value: string): value is CmsEntity {
  return cmsEntities.includes(value as CmsEntity);
}

const programManagedEntities: CmsEntity[] = [
  "program",
  "program-step",
  "lesson",
  "achievement",
  "xp-rule",
];

export function isProgramManagedEntity(entity: CmsEntity) {
  return programManagedEntities.includes(entity);
}

export function permissionForEntity(entity: CmsEntity, action: "create" | "read" | "update" | "delete"): CmsPermission {
  if (entity === "program" || entity === "program-step") {
    if (action === "read") return "program.view";
    if (action === "create") return "program.create";
    if (action === "delete") return "program.archive";
    return "program.edit";
  }
  if (entity === "lesson") return action === "read" ? "program.view" : "lesson.edit";
  if (entity === "achievement") return "achievement.manage";
  if (entity === "xp-rule") return "xp.manage";
  if (action === "read") return entity === "affiliate-link" ? "affiliate.manage" : "article.edit";
  if (entity === "casino") return "casino.edit";
  if (entity === "bonus") return "bonus.edit";
  if (entity === "affiliate-link") return "affiliate.manage";
  if (entity === "settings" || entity === "navigation") return "settings.manage";
  return action === "create" ? "article.create" : "article.edit";
}
