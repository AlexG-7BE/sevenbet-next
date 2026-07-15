import type { Metadata } from "next";

import { CasinoBuilderLayout } from "@/components/admin/CasinoBuilder";
import { isCasinoBuilderSection } from "@/lib/casino-builder/sections";
import { loadCasinoBuilderData } from "@/lib/casino-builder/server";

export const metadata: Metadata = {
  title: "Casino Builder | SevenBet CMS",
  robots: { index: false, follow: false },
};

export default async function CasinoBuilderPage({
  params,
  searchParams,
}: {
  params: Promise<{ casinoId: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const { casinoId } = await params;
  const { section } = await searchParams;
  const data = await loadCasinoBuilderData(casinoId);

  return (
    <CasinoBuilderLayout
      initialData={data}
      initialSection={isCasinoBuilderSection(section) ? section : "general"}
    />
  );
}
