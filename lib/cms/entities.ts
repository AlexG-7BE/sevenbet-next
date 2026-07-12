import type { CmsEntity, CmsPermission } from "@/lib/cms/types";

export const cmsEntities: CmsEntity[] = [
  "program",
  "program-step",
  "lesson",
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

export function permissionForEntity(entity: CmsEntity, action: "create" | "read" | "update" | "delete"): CmsPermission {
  if (action === "read") return entity === "affiliate-link" ? "affiliate.manage" : "article.edit";
  if (entity === "program" || entity === "program-step" || entity === "lesson") return "program.edit";
  if (entity === "casino") return "casino.edit";
  if (entity === "bonus") return "bonus.edit";
  if (entity === "affiliate-link") return "affiliate.manage";
  if (entity === "settings" || entity === "navigation") return "settings.manage";
  return action === "create" ? "article.create" : "article.edit";
}
