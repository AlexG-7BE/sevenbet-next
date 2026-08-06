import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { CasinoProfile } from "@/components/casino-profile/CasinoProfile";
import { profileEditorialDocument } from "@/lib/casino-profile/presentation";
import { casinoProfileMetadata, casinoProfileSchemas } from "@/lib/casino-profile/seo";
import { safeJsonLd } from "@/lib/public-casino/public-casino-validation";
import { editorialReviewService } from "@/lib/services/editorial-review.service";
import { publicCasinoService } from "@/lib/services/public-casino.service";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

const loadCasino = cache((slug: string) => publicCasinoService.getCasino(slug));
const loadEditorial = cache(async (slug: string) => {
  try {
    return await editorialReviewService.getPublishedBySlug(slug);
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [casino, editorialResult] = await Promise.all([loadCasino(slug), loadEditorial(slug)]);
  return casinoProfileMetadata(casino, casino ? profileEditorialDocument(editorialResult) : null);
}

export default async function CasinoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [casino, editorialResult] = await Promise.all([loadCasino(slug), loadEditorial(slug)]);
  if (!casino) notFound();
  const editorial = profileEditorialDocument(editorialResult);
  const schemas = casinoProfileSchemas(casino, editorial);

  return <>
    {schemas.map((schema, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />)}
    <CasinoProfile casino={casino} editorial={editorial} />
  </>;
}
