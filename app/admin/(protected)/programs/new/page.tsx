import type { Metadata } from "next";
import { headers } from "next/headers";
import { AdminPageShell } from "@/components/admin/AdminShell";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { NewProgramForm } from "@/components/admin/ProgramBuilder";
import { Card } from "@/components/ui";
import { getAdminPageAccess } from "@/lib/auth/admin";

export const metadata: Metadata = { title: "Create Program | B4GAMBLE CMS", robots: { index: false, follow: false } };

export default async function NewProgramPage() {
  if (!await getAdminPageAccess(await headers(), "program-create")) return <AdminPermissionDenied />;
  return <AdminPageShell title="Create program" intro="Start with stable IDs, structured completion rules and a private draft."><Card className="adminPanel"><NewProgramForm /></Card></AdminPageShell>;
}
