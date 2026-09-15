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
  | "learning"
  | "casinos"
  | "affiliate"
  | "commercial"
  | "customers"
  | "analytics"
  | "email"
  | "templates";

export const adminAreaPermissions: Record<AdminArea, readonly CmsPermission[]> = {
  dashboard: [],
  programs: ["program.view"],
  "program-create": ["program.create"],
  "program-edit": ["program.edit"],
  "program-preview": ["program.preview_draft"],
  achievements: ["achievement.manage"],
  "xp-rules": ["xp.manage"],
  learning: ["article.create", "article.edit", "article.review", "article.publish"],
  casinos: ["casino.edit"],
  affiliate: ["affiliate.manage"],
  commercial: ["affiliate.manage"],
  customers: ["user.view"],
  analytics: ["analytics.view"],
  email: ["email.manage"],
  templates: ["template.manage"],
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
