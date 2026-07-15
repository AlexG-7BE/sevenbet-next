import type { Metadata } from "next";

import { NewCasinoForm } from "@/components/admin/CasinoBuilder";
import { AdminPageShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Create Casino | SevenBet CMS",
  robots: { index: false, follow: false },
};

export default function NewCasinoPage() {
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
