import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import {
  CasinoFaqSection,
  CasinoMediaSection,
  CasinoReviewHero,
  EditorialReviewSection,
  getCasinoFaqItems,
  LicensingSafetySection,
  MethodologyDisclosureSection,
  PaymentsSection,
  ProsConsSection,
  QuickOverview,
  ResponsibleToolsSection,
  SimilarCasinosSection,
  WageringSection,
  WelcomeBonusSection,
} from "@/components/CasinoReviewSections";
import { Badge, Card, CTA, Section } from "@/components/ui";
import { publicCasinoToLegacy } from "@/lib/public-casino/public-casino.mapper";
import { safeJsonLd } from "@/lib/public-casino/public-casino-validation";
import { publicCasinoService } from "@/lib/services/public-casino.service";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

const loadCasino = cache((slug: string) => publicCasinoService.getCasino(slug));

function robots(value: string) {
  const directives = value.toLowerCase().split(",").map((entry) => entry.trim());
  return { index: !directives.includes("noindex"), follow: !directives.includes("nofollow") };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const casino = await loadCasino((await params).slug);
  if (!casino) return { title: "Casino review | SevenBet", robots: { index: false, follow: false } };
  const socialImages = casino.seo.socialImage ? [{ url: casino.seo.socialImage, alt: `${casino.name} review` }] : undefined;
  return {
    title: casino.seo.title,
    description: casino.seo.description,
    alternates: { canonical: casino.seo.canonical },
    robots: robots(casino.seo.robots),
    openGraph: {
      type: "article",
      title: casino.seo.socialTitle,
      description: casino.seo.socialDescription,
      url: casino.seo.canonical,
      images: socialImages,
    },
    twitter: { card: socialImages ? "summary_large_image" : "summary", title: casino.seo.socialTitle, description: casino.seo.socialDescription, images: socialImages?.map((image) => image.url) },
  };
}

function reviewSchema(casino: Awaited<ReturnType<typeof publicCasinoService.getCasino>>) {
  if (!casino) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: { "@type": "Organization", name: casino.name, url: `https://${casino.domain}` },
    author: { "@type": "Organization", name: "SevenBet", url: absoluteUrl("/") },
    publisher: { "@type": "Organization", name: "SevenBet", url: absoluteUrl("/") },
    reviewRating: { "@type": "Rating", ratingValue: casino.editorScore, bestRating: 10, worstRating: 0 },
    reviewBody: casino.reviewContent,
    datePublished: casino.publishedAt ?? undefined,
    dateModified: casino.lastReviewedAt ?? casino.publishedAt ?? undefined,
  };
}

export default async function CasinoPage({ params }: { params: Promise<{ slug: string }> }) {
  const casino = await loadCasino((await params).slug);
  if (!casino) notFound();
  const view = publicCasinoToLegacy(casino);
  const similarCasinos = (await publicCasinoService.listCasinoViews()).filter((item) => item.slug !== casino.slug).slice(0, 3);
  const faq = getCasinoFaqItems(view);
  const schemas = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Casino Reviews", item: absoluteUrl("/casinos") },
      { "@type": "ListItem", position: 2, name: casino.name, item: casino.seo.canonical },
    ] },
    reviewSchema(casino),
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
    casino.seo.structuredData,
  ].filter(Boolean);

  return (
    <>
      {schemas.map((schema, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />)}
      <CasinoReviewHero casino={view} />
      <CasinoMediaSection casino={view} />
      <QuickOverview casino={view} />
      <WelcomeBonusSection casino={view} />
      <WageringSection casino={view} />
      <ProsConsSection casino={view} />
      <LicensingSafetySection casino={view} />
      <PaymentsSection casino={view} />
      <ResponsibleToolsSection />
      <EditorialReviewSection casino={view} />
      <SimilarCasinosSection casinos={similarCasinos} />
      <CasinoFaqSection casino={view} />
      <MethodologyDisclosureSection />

      <Section eyebrow="Player protection" title="Review your limits before any casino decision.">
        <Card className="ctaBlock" tone="warning">
          <div><div className="badgeCluster"><Badge tone="warning">18+ only</Badge><Badge>Affiliate links may be present</Badge></div><p className="muted">Gambling involves financial risk. Review bonus terms, local availability and responsible gambling tools before registering. SevenBet does not guarantee outcomes.</p></div>
        </Card>
      </Section>
      <Section eyebrow="Next step" title="Compare More Casinos">
        <CTA title="Review more casino profiles or read the methodology behind SevenBet reviews." primary={{ href: "/casinos", label: "Browse Casino Comparisons" }} secondary={{ href: "/methodology", label: "Read Review Methodology" }} />
      </Section>
    </>
  );
}
