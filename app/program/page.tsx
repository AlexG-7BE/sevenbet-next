import type { Metadata } from "next";
import { ProgramExperience } from "@/components/ProgramExperience";
import { absoluteUrl } from "@/lib/site";
import { getPublishedProgramSnapshot, programSnapshotToPublicSteps } from "@/lib/cms/program-builder";

export const dynamic = "force-dynamic";

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
  const snapshot = getPublishedProgramSnapshot("program_10_step_control");
  const steps = snapshot ? programSnapshotToPublicSteps(snapshot) : undefined;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema()) }}
      />
      <ProgramExperience steps={steps} />
    </>
  );
}
