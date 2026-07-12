import type { Metadata } from "next";
import { ProgramExperience } from "@/components/ProgramExperience";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "SevenBet 10-Step Control Program | Interactive Learning Experience",
  description:
    "A guided educational program with saved progress, short lessons, scenario questions, quizzes, XP, achievements, and responsible gambling takeaways.",
  alternates: {
    canonical: absoluteUrl("/program"),
  },
};

function breadcrumbSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "10-Step Control Program",
        item: absoluteUrl("/program"),
      },
    ],
  };
}

export default function ProgramPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema()) }}
      />
      <ProgramExperience />
    </>
  );
}
