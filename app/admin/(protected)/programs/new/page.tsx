import type { Metadata } from "next";
import { AdminPageShell } from "@/components/admin/AdminShell";
import { NewProgramForm } from "@/components/admin/ProgramBuilder";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Create Program | SevenBet CMS", robots: { index: false, follow: false } };

export default function NewProgramPage() {
  return <AdminPageShell title="Create program" intro="Start with stable IDs, structured completion rules and a private draft."><Card className="adminPanel"><NewProgramForm /></Card></AdminPageShell>;
}
