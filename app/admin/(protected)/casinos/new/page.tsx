import type { Metadata } from "next";
import { headers } from "next/headers";

import { NewCasinoForm } from "@/components/admin/CasinoBuilder";
import { AdminPageShell } from "@/components/admin/AdminShell";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { Card } from "@/components/ui";
import { getAdminPageAccess } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Create Casino | B4GAMBLE CMS",
  robots: { index: false, follow: false },
};

export default async function NewCasinoPage() {
  if (!await getAdminPageAccess(await headers(), "casinos")) return <AdminPermissionDenied />;
  return (
    <AdminPageShell
      title="Create casino"
      intro="Create a private PostgreSQL draft. Structured comparison sections can be completed in the Builder."
    >
      <Card className="adminPanel">
        <NewCasinoForm />
      </Card>
    </AdminPageShell>
  );
}
