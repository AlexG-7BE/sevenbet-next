import type { AdminRole, CmsUser } from "@/lib/cms/types";
import { permissionsForRole } from "@/lib/cms/permissions";

type StaffUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string | null;
};

type StaffProfile = {
  id: string;
  userId: string | null;
  email: string;
  name: string;
  role: AdminRole;
  createdAt: Date;
  updatedAt: Date;
};

export type StaffContext = CmsUser & {
  authMethod: "better-auth" | "legacy-preview";
  user: StaffUser;
  adminUser: StaffProfile;
};

export function createStaffContext({
  user,
  adminUser,
  authMethod,
}: {
  user: StaffUser;
  adminUser: StaffProfile;
  authMethod: StaffContext["authMethod"];
}): StaffContext {
  return {
    id: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
    role: adminUser.role,
    permissions: permissionsForRole(adminUser.role),
    authProvider: "email",
    createdAt: adminUser.createdAt.toISOString(),
    updatedAt: adminUser.updatedAt.toISOString(),
    authMethod,
    user,
    adminUser,
  };
}
