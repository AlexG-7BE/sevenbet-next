import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";

import { CasinoProfile } from "@/components/casino-profile/CasinoProfile";
import { CommercialSurfaceView } from "@/components/analytics/CommercialSurfaceView";
import { PublicRouteLoadingFrame } from "@/components/public-shell/PublicRouteLoadingFrame";
import { JsonLd } from "@/components/seo/JsonLd";
import { profileEditorialDocument } from "@/lib/casino-profile/presentation";
import { casinoProfileMetadata, casinoProfileSchemas, projectCasinoProfileSchemas } from "@/lib/casino-profile/seo";
import { editorialReviewService } from "@/lib/services/editorial-review.service";
import { publicCasinoService } from "@/lib/services/public-casino.service";
import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";
import { commercialUxFixtureMarket, isCommercialUxVisualDataFixture, visualCasinoProfileFixture, withCommercialUxFixturePresentation, withHandoffCasinoEditorialData, withHandoffCasinoProfileData } from "@/lib/final-handoff/visual-data-fixture";
import { productPageMessages } from "@/lib/i18n/product-pages-catalog";
import { productHref, productMetadata } from "@/lib/market/product-context";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { isCrawlerUserAgent } from "@/lib/seo/crawler";
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
const loadCasinoPage = cache(async (slug: string, visualFixture: boolean) => {
  const [presentation, authority, editorialResult] = await Promise.all([
    resolveServerPresentationContext(),
    resolveServerJurisdiction(),
    visualFixture ? Promise.resolve(null) : loadEditorial(slug),
  ]);
  const candidate = visualFixture
    ? visualCasinoProfileFixture(slug)
    : await publicCasinoService.getCasino(
        slug,
        authority,
        presentation.marketCountryCode,
        presentation.language,
        presentation.marketCode,
      );
  const availableForPresentation = candidate
    ? Boolean(presentation.marketCountryCode && candidate.countries.some((country) => country.countryCode === presentation.marketCountryCode && country.availability === "AVAILABLE"))
    : false;
  return {
    casino: candidate && (visualFixture || candidate.source === "cms") ? candidate : null,
    editorialResult: candidate ? editorialResult : null,
    presentation,
    availableForPresentation,
  };
});

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const { slug } = await params;
  const raw = await searchParams;
  const visualFixture = isCommercialUxVisualDataFixture(raw.visualFixture);
  const loaded = await loadCasinoPage(slug, visualFixture);
  const fixtureMarket = commercialUxFixtureMarket(raw.qaMarket, visualFixture);
  const presentation = withCommercialUxFixturePresentation(loaded.presentation, fixtureMarket);
  const casino = loaded.casino ? withHandoffCasinoProfileData(loaded.casino, visualFixture, presentation.locale, fixtureMarket) : null;
  const messages = productPageMessages(presentation.locale);
  if (!casino) return productMetadata({ presentation, pathname: `/casino/${slug}`, title: messages.profile.unavailableTitle, description: messages.profile.unavailableDescription, robots: { index: false, follow: false }, openGraphType: "article" });
  const base = casinoProfileMetadata(casino, profileEditorialDocument(loaded.editorialResult, casino.id));
  const title = `${casino.name} ${messages.profile.review} | B4GAMBLE`;
  const description = `${messages.profile.currentReview}: ${casino.name}. ${casino.summary || messages.common.originalSourceCopy}`;
  return productMetadata({
    presentation,
    pathname: `/casino/${casino.slug}`,
    title,
    description,
    robots: base.robots,
    openGraphType: "article",
  });
}

async function CasinoContent({ raw, slug, visualDataFixture }: { raw: Record<string, string | string[] | undefined>; slug: string; visualDataFixture: boolean }) {
  const loaded = await loadCasinoPage(slug, visualDataFixture);
  const casino = loaded.casino;
  if (!casino) notFound();
  const fixtureMarket = commercialUxFixtureMarket(raw.qaMarket, visualDataFixture);
  const presentation = withCommercialUxFixturePresentation(loaded.presentation, fixtureMarket);
  const runtimeCasino = withHandoffCasinoProfileData(casino, visualDataFixture, presentation.locale, fixtureMarket);
  const editorial = withHandoffCasinoEditorialData(profileEditorialDocument(loaded.editorialResult, casino.id), visualDataFixture, presentation.locale);
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
    <CommercialSurfaceView casinoId={runtimeCasino.id} surface="casino_review" />
    {schemas.map((schema, index) => <JsonLd data={schema} key={index} />)}
    <CasinoProfile availableForPresentation={loaded.availableForPresentation} casino={runtimeCasino} editorial={editorial} messages={messages} presentation={presentation} />
  </>;
}

/**
 * The profile frame streams at once while the review, offers and action decision load; a cold
 * instance used to send nothing for 3–4.6s (25 Sep 2026). Existence is settled first from the
 * cached published projection, so a missing casino still answers 404 rather than a streamed 200.
 */
export default async function CasinoPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  triggerPublicCommercialErrorHarness(raw.errorFixture);
  const { slug } = await params;
  const visualDataFixture = isCommercialUxVisualDataFixture(raw.visualFixture);
  const [presentation, requestHeaders] = await Promise.all([resolveServerPresentationContext(), headers()]);
  const published = visualDataFixture
    ? visualCasinoProfileFixture(slug)
    : await publicCasinoService.findPublishedCasino(slug, presentation.marketCountryCode);
  if (!published) notFound();
  // Crawlers read the whole profile in the first response; only people get the streamed frame.
  if (isCrawlerUserAgent(requestHeaders.get("user-agent"))) return <CasinoContent raw={raw} slug={slug} visualDataFixture={visualDataFixture} />;
  return <Suspense fallback={<PublicRouteLoadingFrame destination="casino" label={published.name} />}><CasinoContent raw={raw} slug={slug} visualDataFixture={visualDataFixture} /></Suspense>;
}
