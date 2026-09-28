import type { Metadata } from "next";

import type { CasinoEditorialDocument } from "@/lib/editorial-review/types";
import type { ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import { casinoEditorialLanguage, translateCasinoEditorialText } from "@/lib/i18n/casino-editorial-translations";
import { profileFaqLocalization, selectProfileBonus } from "@/lib/casino-profile/presentation";
import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";
import { parseRobotsMetadata } from "@/lib/public-casino/public-casino-validation";
import type { SupportedLocale } from "@/lib/market/registry";
import { editorialAuthor, EDITORIAL_AUTHOR_NAME, modifiedNotBeforePublished, organizationReference } from "@/lib/seo/structured-data";
import { absoluteUrl } from "@/lib/site";

export const REVIEW_DESCRIPTION_MAX_LENGTH = 155;
const AGE_NOTICE = " 18+.";

/** Shortens text to `max` characters at a word boundary, ending with an ellipsis. */
export function trimAtWordBoundary(text: string, max = REVIEW_DESCRIPTION_MAX_LENGTH) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const boundary = cut.lastIndexOf(" ");
  return `${(boundary > max * 0.6 ? cut.slice(0, boundary) : cut).replace(/[\s,.;:–—-]+$/, "")}…`;
}

/** The date a review last changed, never earlier than its publication. */
export function reviewModifiedAt(casino: Pick<PublicCasinoDTO, "publishedAt" | "lastReviewedAt">) {
  return modifiedNotBeforePublished(casino.publishedAt, casino.lastReviewedAt);
}

type ReviewCopy = {
  title: (brand: string, year: string) => string;
  description: (brand: string, score: string | null) => string;
};

const namesCasino = (brand: string) => /casino/i.test(brand);

/**
 * Localized review titles and descriptions for the four indexed languages (audit 27 Sep 2026:
 * every review was titled "{Brand} review | B4GAMBLE" and Swedish, Danish and German pages
 * carried an English summary). German follows lib/i18n/german-terminology.ts: no generic
 * "Casino"; the brand name is kept as it is.
 */
const REVIEW_COPY: Partial<Record<SupportedLocale, ReviewCopy>> = {
  "en-GB": {
    title: (brand, year) => `${brand}${namesCasino(brand) ? "" : " casino"} review${year}: bonus, payouts & licence | B4GAMBLE`,
    description: (brand, score) => `${brand}${namesCasino(brand) ? "" : " casino"} review${score ? `: editor score ${score}/10` : ""}. Welcome bonus and wagering, payout speed, payments and licence, checked before you play.`,
  },
  "sv-SE": {
    title: (brand, year) => `${brand}${namesCasino(brand) ? "" : " casino"} recension${year}: bonus, uttag & licens | B4GAMBLE`,
    description: (brand, score) => `${brand}${namesCasino(brand) ? "" : " casino"} recension${score ? `: betyg ${score}/10` : ""}. Välkomstbonus, omsättningskrav, uttagstid, betalningar och licens – granskat innan du spelar.`,
  },
  "da-DK": {
    title: (brand, year) => `${brand}${namesCasino(brand) ? "" : " casino"} anmeldelse${year}: bonus & udbetaling | B4GAMBLE`,
    description: (brand, score) => `${brand}${namesCasino(brand) ? "" : " casino"} anmeldelse${score ? `: score ${score}/10` : ""}. Velkomstbonus, omsætningskrav, udbetalingstid, betalinger og licens – gennemgået før du spiller.`,
  },
  "de-DE": {
    title: (brand, year) => `${brand} Test${year}: Bonus, Auszahlung & Lizenz | B4GAMBLE`,
    description: (brand, score) => `${brand} im Test${score ? `: Wertung ${score}/10` : ""}. Willkommensbonus, Umsatzbedingungen, Auszahlungsdauer, Zahlungen und Lizenz – geprüft, bevor du spielst.`,
  },
};

/**
 * SEO copy the catalogue importers and the mapper write for every casino
 * (lib/casino-real-catalog/catalog.ts, scripts/casino-real-catalog-03.ts, the EGO editorial
 * import, lib/public-casino/public-casino.mapper.ts). It is a placeholder, not an editor's
 * choice, so it does not count as a CMS SEO title or description.
 */
const GENERATED_SEO_TITLE = /^.+ (?:casino )?review(?: & editor score)? \| B4GAMBLE$/i;
const GENERATED_SEO_DESCRIPTION = /evidence limits and market-safe availability context|exact-market facts and B4GAMBLE Editor Score/i;

function editorSet(value: string | null | undefined, generated: RegExp, fallback?: string) {
  const text = value?.trim();
  return text && !generated.test(text) && text !== fallback?.trim() ? text : null;
}

/** The CMS SEO title/description only when an editor wrote one. */
function cmsSeoCopy(casino: PublicCasinoDTO, editorial: CasinoEditorialDocument | null) {
  return {
    title: editorSet(editorial?.seo.title, GENERATED_SEO_TITLE) ?? editorSet(casino.seo.title, GENERATED_SEO_TITLE),
    description: editorSet(editorial?.seo.description, GENERATED_SEO_DESCRIPTION, casino.summary)
      ?? editorSet(casino.seo.description, GENERATED_SEO_DESCRIPTION, casino.summary),
  };
}

/**
 * Title and meta description of a review page. The CMS SEO fields are written in English, so
 * they are honoured on English pages; every indexed language otherwise gets its own template,
 * with the year of the review's last change. Descriptions stay within 155 characters.
 */
export function casinoReviewMetadataCopy(input: {
  casino: PublicCasinoDTO;
  editorial: CasinoEditorialDocument | null;
  locale: SupportedLocale;
  fallback: { title: string; description: string };
}) {
  const { casino, locale } = input;
  const template = casino.dataClassification === "DEMO_FIXTURE" ? undefined : REVIEW_COPY[locale];
  const cms = locale === "en-GB" ? cmsSeoCopy(casino, input.editorial) : { title: null, description: null };
  const modifiedAt = reviewModifiedAt(casino);
  const year = modifiedAt ? ` ${new Date(modifiedAt).getUTCFullYear()}` : "";
  const score = typeof casino.editorScore === "number" && Number.isFinite(casino.editorScore)
    ? new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(casino.editorScore)
    : null;
  return {
    title: cms.title ?? template?.title(casino.name, year) ?? input.fallback.title,
    // The age notice survives trimming: the template body is shortened, never "18+".
    description: cms.description
      ? trimAtWordBoundary(cms.description)
      : template
        ? `${trimAtWordBoundary(template.description(casino.name, score), REVIEW_DESCRIPTION_MAX_LENGTH - AGE_NOTICE.length)}${AGE_NOTICE}`
        : trimAtWordBoundary(input.fallback.description),
  };
}

function editorialCanonical(document: CasinoEditorialDocument | null, fallback: string) {
  const path = document?.seo.canonicalPath;
  return path?.startsWith("/") && !path.startsWith("//") ? absoluteUrl(path) : fallback;
}

function profileCanonical(casino: PublicCasinoDTO, editorial: CasinoEditorialDocument | null) {
  return casino.dataClassification === "DEMO_FIXTURE"
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

  const demo = casino.dataClassification === "DEMO_FIXTURE";
  const legacy = casino.source === "legacy";
  const seo = editorial?.seo;
  const title = demo ? `${casino.name} Fictional Review Demonstration | B4GAMBLE` : seo?.title || casino.seo.title;
  const description = demo ? "A fictional casino review demonstration, not a current GB operator, licence claim, partner offer or live promotion. No commercial visit is available." : seo?.description || casino.seo.description;
  const canonical = profileCanonical(casino, editorial);
  const robots = demo || legacy ? { index: false, follow: true } : parseRobotsMetadata(seo?.robots || casino.seo.robots);
  const socialTitle = demo ? title : seo?.socialTitle || casino.seo.socialTitle || title;
  const socialDescription = demo ? description : seo?.socialDescription || casino.seo.socialDescription || description;
  const socialImage = demo ? demoSocialImage(casino) : casino.seo.socialImage;
  const images = socialImage ? [{
    url: socialImage,
    alt: demo ? `${casino.name} fictional review demonstration` : `${casino.name} published review`,
  }] : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    robots,
    openGraph: { type: "article", title: socialTitle, description: socialDescription, url: canonical, images },
    twitter: { card: images ? "summary_large_image" : "summary", title: socialTitle, description: socialDescription, images: images?.map((image) => image.url) },
  };
}

/**
 * The editorial team writes the reviews: "B4GAMBLE Editorial" (or no byline) is an
 * Organization, not a Person. A named person in the CMS byline stays a Person.
 */
function reviewAuthor(byline: string | undefined) {
  const name = byline?.trim();
  if (!name || /b4gamble/i.test(name)) return { ...editorialAuthor(), name: EDITORIAL_AUTHOR_NAME };
  return { "@type": "Person", name };
}

export function casinoProfileSchemas(casino: PublicCasinoDTO, editorial: CasinoEditorialDocument | null) {
  const canonical = profileCanonical(casino, editorial);
  const demo = casino.dataClassification === "DEMO_FIXTURE";
  const legacy = casino.source === "legacy";
  const faq = profileFaqLocalization(casino, selectProfileBonus(casino), editorial);
  const editorialSummary = editorial?.summary && casino.editorialLanguage
    ? translateCasinoEditorialText(editorial.summary, casino.editorialLanguage)
    : editorial?.summary;
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
      description: demo ? "Fictional product demonstration; not a current operator, licence claim, partner offer or live promotion." : editorialSummary || casino.summary,
      url: canonical,
      ...(casino.publishedAt ? { datePublished: casino.publishedAt } : {}),
      ...(reviewModifiedAt(casino) ? { dateModified: reviewModifiedAt(casino) } : {}),
    },
  ];

  if (demo || legacy) return schemas;

  if (typeof casino.editorScore === "number" && Number.isFinite(casino.editorScore) && casino.editorScore >= 0 && casino.editorScore <= 10 && casino.reviewContent.trim()) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Review",
      itemReviewed: { "@type": "Organization", name: casino.name },
      author: reviewAuthor(editorial?.author),
      publisher: organizationReference(),
      reviewRating: { "@type": "Rating", ratingValue: casino.editorScore, bestRating: 10, worstRating: 0 },
      reviewBody: casino.reviewContent,
      ...(casino.publishedAt ? { datePublished: casino.publishedAt } : {}),
      ...(reviewModifiedAt(casino) ? { dateModified: reviewModifiedAt(casino) } : {}),
    });
  }

  // A translated FAQ is described only when every entry reads in the page
  // language, and then says which language it is in (see projectCasinoProfileSchemas).
  if (faq.items.length && (!faq.language || faq.complete)) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      ...(faq.language ? { inLanguage: faq.language } : {}),
      mainEntity: faq.items.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
    });
  }

  if (Array.isArray(casino.seo.structuredData)) schemas.push(...casino.seo.structuredData);
  else if (casino.seo.structuredData) schemas.push(casino.seo.structuredData);
  return schemas;
}

export function projectCasinoProfileSchemas(
  schemas: readonly Record<string, unknown>[],
  input: {
    casino: Pick<PublicCasinoDTO, "id" | "name" | "dataClassification">;
    casinoDirectoryUrl: string;
    locale: string;
    messages: ProductPageMessages;
    profileUrl: string;
  },
) {
  const localized = input.locale !== "en-GB";
  const demo = input.casino.dataClassification === "DEMO_FIXTURE";
  const pageLanguage = casinoEditorialLanguage(input.locale);
  return schemas.flatMap((schema) => {
    // A localized page keeps only an FAQ written in its own language: the
    // English FAQ would describe questions the reader does not see.
    if (localized && schema["@type"] === "FAQPage" && !(pageLanguage && schema.inLanguage === pageLanguage)) return [];
    if (schema["@type"] === "BreadcrumbList") {
      return [{
        ...schema,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: input.messages.common.browseReviews, item: input.casinoDirectoryUrl },
          { "@type": "ListItem", position: 2, name: input.casino.name, item: input.profileUrl },
        ],
      }];
    }
    if (schema["@type"] === "WebPage") {
      return [{
        ...schema,
        ...(localized && demo ? {
          name: `${input.casino.name} — ${input.messages.profile.demoReview}`,
          description: input.messages.profile.demoDisclosure,
        } : {}),
        // The English editorial title ("… Casino Review") is not the page's language.
        ...(localized && !demo && pageLanguage ? { name: `${input.casino.name} ${input.messages.profile.review}` } : {}),
        url: input.profileUrl,
      }];
    }
    return [schema];
  });
}
