import type { CmsPermission, CmsUser } from "@/lib/cms/types";
import { canPerformAction } from "@/lib/cms/permissions";

export type AdminArea =
  | "dashboard"
  | "programs"
  | "program-create"
  | "program-edit"
  | "program-preview"
  | "achievements"
  | "xp-rules"
  | "program-settings"
  | "learning"
  | "casinos"
  | "bonuses"
  | "affiliate"
  | "commercial"
  | "media-operations"
  | "users"
  | "analytics"
  | "settings";

export const adminAreaPermissions: Record<AdminArea, readonly CmsPermission[]> = {
  dashboard: [],
  programs: ["program.view"],
  "program-create": ["program.create"],
  "program-edit": ["program.edit"],
  "program-preview": ["program.preview_draft"],
  achievements: ["achievement.manage"],
  "xp-rules": ["xp.manage"],
  "program-settings": ["settings.manage"],
  learning: ["article.create", "article.edit", "article.review", "article.publish"],
  casinos: ["casino.edit"],
  bonuses: ["bonus.edit"],
  affiliate: ["affiliate.manage"],
  commercial: ["affiliate.manage"],
  "media-operations": ["media.manage"],
  users: ["user.view"],
  analytics: ["analytics.view"],
  settings: ["settings.manage"],
};

export function canAccessAdminArea(
  staff: Pick<CmsUser, "permissions" | "role"> | null,
  area: AdminArea,
) {
  if (!staff) return false;
  const permissions = adminAreaPermissions[area];
  return permissions.length === 0
    || permissions.some((permission) => canPerformAction(staff, permission));
}
