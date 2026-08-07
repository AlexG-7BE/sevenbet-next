import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CommercialHandoffConfirmation } from "@/components/commercial-handoff/CommercialHandoffPage";

export const metadata: Metadata = {
  title: "Confirm External Commercial Action | SevenBet",
  description: "Review SevenBet's commercial handoff before a managed external action.",
  robots: { index: false, follow: false },
};

const managedSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default async function CommercialHandoffPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!managedSlug.test(slug)) redirect("/outbound/unavailable");
  return <CommercialHandoffConfirmation slug={slug} />;
}
