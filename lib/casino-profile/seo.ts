import type { Metadata } from "next";

import type { CasinoEditorialDocument } from "@/lib/editorial-review/types";
import { profileFaqItems, selectProfileBonus } from "@/lib/casino-profile/presentation";
import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";
import { parseRobotsMetadata } from "@/lib/public-casino/public-casino-validation";
import { absoluteUrl } from "@/lib/site";

function editorialCanonical(document: CasinoEditorialDocument | null, fallback: string) {
  const path = document?.seo.canonicalPath;
  return path?.startsWith("/") && !path.startsWith("//") ? absoluteUrl(path) : fallback;
}

export function casinoProfileMetadata(casino: PublicCasinoDTO | null, editorial: CasinoEditorialDocument | null): Metadata {
  if (!casino) {
    return {
      title: "Casino profile unavailable | SevenBet",
      description: "This casino profile is not published or is unavailable.",
      robots: { index: false, follow: false },
    };
  }

  const seo = editorial?.seo;
  const title = seo?.title || casino.seo.title;
  const description = seo?.description || casino.seo.description;
  const canonical = editorialCanonical(editorial, casino.seo.canonical);
  const robots = parseRobotsMetadata(seo?.robots || casino.seo.robots);
  const socialTitle = seo?.socialTitle || casino.seo.socialTitle || title;
  const socialDescription = seo?.socialDescription || casino.seo.socialDescription || description;
  const images = casino.seo.socialImage ? [{ url: casino.seo.socialImage, alt: `${casino.name} published review` }] : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    robots,
    openGraph: { type: "article", title: socialTitle, description: socialDescription, url: canonical, images },
    twitter: { card: images ? "summary_large_image" : "summary", title: socialTitle, description: socialDescription, images: images?.map((image) => image.url) },
  };
}

export function casinoProfileSchemas(casino: PublicCasinoDTO, editorial: CasinoEditorialDocument | null) {
  const canonical = editorialCanonical(editorial, casino.seo.canonical);
  const faq = profileFaqItems(casino, selectProfileBonus(casino), editorial);
  const schemas: Array<Record<string, unknown>> = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Casino reviews", item: absoluteUrl("/casinos") },
        { "@type": "ListItem", position: 2, name: casino.name, item: canonical },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: editorial?.title || casino.title,
      description: editorial?.summary || casino.summary,
      url: canonical,
      ...(casino.publishedAt ? { datePublished: casino.publishedAt } : {}),
      ...(casino.lastReviewedAt ? { dateModified: casino.lastReviewedAt } : {}),
    },
  ];

  if (Number.isFinite(casino.editorScore) && casino.editorScore >= 0 && casino.editorScore <= 10 && casino.reviewContent.trim()) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Review",
      itemReviewed: { "@type": "Organization", name: casino.name },
      author: { "@type": editorial?.author ? "Person" : "Organization", name: editorial?.author || "SevenBet" },
      publisher: { "@type": "Organization", name: "SevenBet", url: absoluteUrl("/") },
      reviewRating: { "@type": "Rating", ratingValue: casino.editorScore, bestRating: 10, worstRating: 0 },
      reviewBody: casino.reviewContent,
      ...(casino.publishedAt ? { datePublished: casino.publishedAt } : {}),
      ...(casino.lastReviewedAt ? { dateModified: casino.lastReviewedAt } : {}),
    });
  }

  if (faq.length) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
    });
  }

  if (Array.isArray(casino.seo.structuredData)) schemas.push(...casino.seo.structuredData);
  else if (casino.seo.structuredData) schemas.push(casino.seo.structuredData);
  return schemas;
}
