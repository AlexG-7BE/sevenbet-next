import type { Metadata } from "next";

import type { CasinoEditorialDocument } from "@/lib/editorial-review/types";
import { profileFaqItems, selectProfileBonus } from "@/lib/casino-profile/presentation";
import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";
import { parseRobotsMetadata } from "@/lib/public-casino/public-casino-validation";
import { absoluteUrl } from "@/lib/site";
import { isTemporaryDemoCasinoId } from "@/lib/demo-data/temporary-demo-authority";

function editorialCanonical(document: CasinoEditorialDocument | null, fallback: string) {
  const path = document?.seo.canonicalPath;
  return path?.startsWith("/") && !path.startsWith("//") ? absoluteUrl(path) : fallback;
}

function profileCanonical(casino: PublicCasinoDTO, editorial: CasinoEditorialDocument | null) {
  return isTemporaryDemoCasinoId(casino.id)
    ? absoluteUrl(`/casino/${casino.slug}`)
    : editorialCanonical(editorial, casino.seo.canonical);
}

function demoSocialImage(casino: PublicCasinoDTO) {
  const value = casino.media.socialImage?.url ?? casino.media.hero?.url;
  return value?.startsWith("/") && !value.startsWith("//")
    ? absoluteUrl(value)
    : null;
}

export function casinoProfileMetadata(casino: PublicCasinoDTO | null, editorial: CasinoEditorialDocument | null): Metadata {
  if (!casino) {
    return {
      title: "Casino profile unavailable | B4GAMBLE",
      description: "This casino profile is not published or is unavailable.",
      robots: { index: false, follow: false },
    };
  }

  const demo = isTemporaryDemoCasinoId(casino.id);
  const seo = editorial?.seo;
  const title = demo ? `${casino.name} Fictional Review Demonstration | B4GAMBLE` : seo?.title || casino.seo.title;
  const description = demo ? "A fictional casino review demonstration, not a current GB operator, licence claim, partner offer or live promotion. No commercial visit is available." : seo?.description || casino.seo.description;
  const canonical = profileCanonical(casino, editorial);
  const robots = demo ? { index: false, follow: true } : parseRobotsMetadata(seo?.robots || casino.seo.robots);
  const socialTitle = demo ? title : seo?.socialTitle || casino.seo.socialTitle || title;
  const socialDescription = demo ? description : seo?.socialDescription || casino.seo.socialDescription || description;
  const socialImage = demo ? demoSocialImage(casino) : casino.seo.socialImage;
  const images = socialImage ? [{ url: socialImage, alt: `${casino.name} published review` }] : undefined;

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
  const canonical = profileCanonical(casino, editorial);
  const demo = isTemporaryDemoCasinoId(casino.id);
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
      name: demo ? `${casino.name} fictional review demonstration` : editorial?.title || casino.title,
      description: demo ? "Fictional product demonstration; not a current operator, licence claim, partner offer or live promotion." : editorial?.summary || casino.summary,
      url: canonical,
      ...(casino.publishedAt ? { datePublished: casino.publishedAt } : {}),
      ...(casino.lastReviewedAt ? { dateModified: casino.lastReviewedAt } : {}),
    },
  ];

  if (demo) return schemas;

  if (Number.isFinite(casino.editorScore) && casino.editorScore >= 0 && casino.editorScore <= 10 && casino.reviewContent.trim()) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Review",
      itemReviewed: { "@type": "Organization", name: casino.name },
      author: { "@type": editorial?.author ? "Person" : "Organization", name: editorial?.author || "B4GAMBLE" },
      publisher: { "@type": "Organization", name: "B4GAMBLE", url: absoluteUrl("/") },
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
