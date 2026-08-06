import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { MethodologyDisclosureSection } from "@/components/CasinoReviewSections";
import { CasinoProfile } from "@/components/casino-profile/CasinoProfile";
import { EditorialReviewRenderer } from "@/components/editorial-review/EditorialReviewRenderer";
import { casinoProfileFaq, publishedScore } from "@/lib/casino-profile/presentation";
import type { EditorialBlock } from "@/lib/editorial-review/types";
import { parseRobotsMetadata, safeJsonLd } from "@/lib/public-casino/public-casino-validation";
import { editorialReviewService } from "@/lib/services/editorial-review.service";
import { publicCasinoService } from "@/lib/services/public-casino.service";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

const loadCasino = cache((slug: string) => publicCasinoService.getCasino(slug));
const loadEditorial = cache((slug: string) => editorialReviewService.getPublishedBySlug(slug));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug;
  const editorial = await loadEditorial(slug);
  if (editorial) {
    const document = editorial.review.revisions.find((revision) => revision.id === editorial.review.publishedRevisionId)?.content;
    const seo = document?.seo;
    if (seo) return { title: seo.title, description: seo.description, alternates: { canonical: seo.canonicalPath || `/casino/${slug}` }, robots: parseRobotsMetadata(seo.robots || "index,follow"), openGraph: { type: "article", title: seo.socialTitle || seo.title, description: seo.socialDescription || seo.description } };
    return { title: document?.title ?? `${editorial.casino.title} Review | SevenBet`, description: document?.summary, alternates: { canonical: `/casino/${slug}` }, robots: { index: true, follow: true } };
  }
  const casino = await loadCasino(slug);
  if (!casino) notFound();
  const socialImages = casino.seo.socialImage ? [{ url: casino.seo.socialImage, alt: `${casino.name} review` }] : undefined;
  return {
    title: casino.seo.title,
    description: casino.seo.description,
    alternates: { canonical: casino.seo.canonical },
    robots: parseRobotsMetadata(casino.seo.robots),
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
  const score = publishedScore(casino);
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: { "@type": "Organization", name: casino.name },
    author: { "@type": "Organization", name: "SevenBet", url: absoluteUrl("/") },
    publisher: { "@type": "Organization", name: "SevenBet", url: absoluteUrl("/") },
    reviewRating: score === null ? undefined : { "@type": "Rating", ratingValue: score, bestRating: 10, worstRating: 0 },
    reviewBody: casino.reviewContent,
    datePublished: casino.publishedAt ?? undefined,
    dateModified: casino.lastReviewedAt ?? casino.publishedAt ?? undefined,
  };
}

export default async function CasinoPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const editorial = await loadEditorial(slug);
  if (editorial) {
    const revision = editorial.review.revisions.find((item) => item.id === editorial.review.publishedRevisionId);
    if (revision) {
      const document = revision.content;
      const faq = document.sections.flatMap((section) => section.blocks).filter((block): block is Extract<EditorialBlock, { type: "faq" }> => block.type === "faq");
      const schemas = [
        { "@context": "https://schema.org", "@type": "WebPage", name: document.title, description: document.summary, datePublished: editorial.review.publishedAt?.toISOString(), dateModified: revision.createdAt.toISOString() },
        { "@context": "https://schema.org", "@type": "Review", itemReviewed: { "@type": "Organization", name: editorial.casino.title }, author: { "@type": "Person", name: document.author }, reviewRating: document.trustScore ? { "@type": "Rating", ratingValue: document.trustScore.overall, bestRating: 10, worstRating: 0 } : undefined },
        faq.length ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) } : null,
      ].filter(Boolean);
      return <>{schemas.map((schema, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />)}<section className="pageShell"><div className="container"><p className="eyebrow">Editorial casino review</p><h1>{document.title}</h1><p className="lead">{document.summary}</p></div></section><EditorialReviewRenderer document={document} /><MethodologyDisclosureSection /></>;
    }
  }
  const casino = await loadCasino(slug);
  if (!casino) notFound();
  const faq = casinoProfileFaq(casino);
  const schemas = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Casino Reviews", item: absoluteUrl("/casinos") },
      { "@type": "ListItem", position: 2, name: casino.name, item: casino.seo.canonical },
    ] },
    reviewSchema(casino),
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) },
    casino.seo.structuredData,
  ].filter(Boolean);

  return (
    <>
      {schemas.map((schema, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />)}
      <CasinoProfile casino={casino} />
    </>
  );
}
