import { notFound, permanentRedirect } from "next/navigation";

import { getLearningArticle } from "@/lib/responsible-gambling";

export const dynamic = "force-dynamic";

export default async function LegacyResponsibleGamblingGuide({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getLearningArticle(slug)) notFound();
  permanentRedirect(`/help/${slug}`);
}
