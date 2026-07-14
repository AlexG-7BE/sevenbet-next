import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProgramBuilder } from "@/components/admin/ProgramBuilder";
import { programBuilderService } from "@/lib/services";

export const metadata: Metadata = { title: "Program Builder | SevenBet CMS", robots: { index: false, follow: false } };

export default async function ProgramBuilderPage({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = await params;
  const snapshot = await programBuilderService.findSnapshot(programId);
  if (!snapshot) notFound();
  return <ProgramBuilder initialSnapshot={snapshot} />;
}
