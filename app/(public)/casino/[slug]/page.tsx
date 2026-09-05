import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { CasinoProfile } from "@/components/casino-profile/CasinoProfile";
import { CommercialSurfaceView } from "@/components/analytics/CommercialSurfaceView";
import { JsonLd } from "@/components/seo/JsonLd";
import { profileEditorialDocument } from "@/lib/casino-profile/presentation";
import { casinoProfileMetadata, casinoProfileSchemas, projectCasinoProfileSchemas } from "@/lib/casino-profile/seo";
import { editorialReviewService } from "@/lib/services/editorial-review.service";
import { publicCasinoService } from "@/lib/services/public-casino.service";
import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";
import { isLocalHandoffVisualDataFixture, withHandoffCasinoEditorialData, withHandoffCasinoProfileData } from "@/lib/final-handoff/visual-data-fixture";
import { productPageMessages } from "@/lib/i18n/product-pages-catalog";
import {
  commercialAuthorityForPresentation,
  productHref,
  productMetadata,
} from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { isTemporaryDemoCasinoId } from "@/lib/demo-data/temporary-demo-authority";
import { absoluteUrl } from "@/lib/site";
import { triggerPublicCommercialErrorHarness } from "@/lib/qa/public-commercial-error-harness";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

const loadEditorial = cache(async (slug: string) => {
  try {
    return await editorialReviewService.getPublishedBySlug(slug);
  } catch {
    return null;
  }
});
const loadCasinoPage = cache(async (slug: string) => {
  const [presentation, authority, editorialResult] = await Promise.all([
    resolveServerPresentationContext(),
    resolveServerJurisdiction(),
    loadEditorial(slug),
  ]);
  const candidate = await publicCasinoService.getCasino(
    slug,
    commercialAuthorityForPresentation(authority, presentation.marketCountryCode),
    presentation.marketCountryCode,
    presentation.language,
  );
  const availableForPresentation = candidate
    ? Boolean(presentation.marketCountryCode && candidate.countries.some((country) => country.countryCode === presentation.marketCountryCode && country.availability === "AVAILABLE"))
    : false;
  return {
    casino: candidate?.source === "cms" ? candidate : null,
    editorialResult: candidate ? editorialResult : null,
    presentation,
    availableForPresentation,
  };
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { casino, editorialResult, presentation } = await loadCasinoPage(slug);
  const messages = productPageMessages(presentation.locale);
  if (!casino) return productMetadata({ presentation, pathname: `/casino/${slug}`, title: messages.profile.unavailableTitle, description: messages.profile.unavailableDescription, robots: { index: false, follow: false }, openGraphType: "article" });
  const base = casinoProfileMetadata(casino, profileEditorialDocument(editorialResult, casino.id));
  const title = `${casino.name} ${messages.profile.review} | B4GAMBLE`;
  const description = `${messages.profile.currentReview}: ${casino.name}. ${casino.summary || messages.common.originalSourceCopy}`;
  return productMetadata({
    presentation,
    pathname: `/casino/${casino.slug}`,
    title,
    description,
    robots: isTemporaryDemoCasinoId(casino.id) ? { index: false, follow: true } : base.robots,
    openGraphType: "article",
  });
}

export default async function CasinoPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  triggerPublicCommercialErrorHarness(raw.errorFixture);
  const { slug } = await params;
  const visualDataFixture = isLocalHandoffVisualDataFixture(raw.visualFixture);
  const loaded = await loadCasinoPage(slug);
  const casino = loaded.casino ?? (visualDataFixture ? publicCasinoService.getLocalVisualFixture(slug) : null);
  if (!casino) notFound();
  const { presentation } = loaded;
  const runtimeCasino = withHandoffCasinoProfileData(casino, visualDataFixture, presentation.locale);
  const editorial = withHandoffCasinoEditorialData(profileEditorialDocument(loaded.editorialResult, casino.id), visualDataFixture, loaded.presentation.locale);
  const messages = productPageMessages(presentation.locale);
  const profileUrl = absoluteUrl(productHref(presentation, `/casino/${runtimeCasino.slug}`));
  const casinoDirectoryUrl = absoluteUrl(productHref(presentation, "/casinos"));
  const schemas = projectCasinoProfileSchemas(casinoProfileSchemas(runtimeCasino, editorial), {
    casino: runtimeCasino,
    casinoDirectoryUrl,
    locale: presentation.locale,
    messages,
    profileUrl,
  });

  return <>
    <CommercialSurfaceView surface="casino_review" />
    {schemas.map((schema, index) => <JsonLd data={schema} key={index} />)}
    <CasinoProfile availableForPresentation={loaded.availableForPresentation} casino={runtimeCasino} editorial={editorial} messages={messages} presentation={presentation} />
  </>;
}
