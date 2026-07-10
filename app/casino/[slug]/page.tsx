import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CasinoFaqSection,
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
  REVIEW_DATE,
  WageringSection,
  WelcomeBonusSection,
} from "@/components/CasinoReviewSections";
import { CTA, Section } from "@/components/ui";
import { getCasino, getCasinos, getTopCasinos } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

export function generateStaticParams() {
  return getCasinos().slice(0, 80).map((casino) => ({ slug: casino.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const casino = getCasino(slug);
  if (!casino) {
    return { title: "Casino review | SevenBet" };
  }

  return {
    title: `${casino.name} Review | SevenBet`,
    description: `${casino.name} review with editor score, license, bonus terms, wagering, payments, withdrawal speed and responsible gambling information.`,
  };
}

function reviewSchema(casino: NonNullable<ReturnType<typeof getCasino>>) {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "Organization",
      name: casino.name,
      url: `https://${casino.domain}`,
    },
    author: {
      "@type": "Organization",
      name: "SevenBet",
      url: absoluteUrl("/"),
    },
    publisher: {
      "@type": "Organization",
      name: "SevenBet",
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: casino.rating,
      bestRating: 10,
      worstRating: 0,
    },
    reviewBody: casino.description,
    dateModified: REVIEW_DATE,
  };
}

function faqSchema(casino: NonNullable<ReturnType<typeof getCasino>>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: getCasinoFaqItems(casino).map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

export default async function CasinoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const casino = getCasino(slug);
  if (!casino) notFound();

  const similarCasinos = getTopCasinos(8)
    .filter((item) => item.slug !== casino.slug)
    .slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema(casino)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(casino)) }}
      />

      <CasinoReviewHero casino={casino} />
      <QuickOverview casino={casino} />
      <WelcomeBonusSection casino={casino} />
      <WageringSection casino={casino} />
      <ProsConsSection casino={casino} />
      <LicensingSafetySection casino={casino} />
      <PaymentsSection casino={casino} />
      <ResponsibleToolsSection />
      <EditorialReviewSection casino={casino} />
      <SimilarCasinosSection casinos={similarCasinos} />
      <CasinoFaqSection casino={casino} />
      <MethodologyDisclosureSection />

      <Section eyebrow="Next step" title="Compare More Casinos">
        <CTA
          title="Review more casino profiles or read the methodology behind SevenBet reviews."
          primary={{ href: "/casinos", label: "Browse Casino Comparisons" }}
          secondary={{ href: "/methodology", label: "Read Review Methodology" }}
        />
      </Section>
    </>
  );
}
