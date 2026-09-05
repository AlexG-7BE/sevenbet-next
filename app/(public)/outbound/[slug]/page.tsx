import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Managed Commercial Action | B4GAMBLE",
  description: "Compatibility route for B4GAMBLE's governed commercial redirect.",
  robots: { index: false, follow: false },
};

const managedSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default async function CommercialHandoffPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!managedSlug.test(slug)) redirect("/outbound/unavailable");
  redirect(`/r/${slug}`);
}
