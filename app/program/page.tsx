import type { Metadata } from "next";

import { ProgramAiExperience } from "@/components/programme/ProgramAiExperience";
import { JsonLd } from "@/components/seo/JsonLd";
import { isGoogleAuthAvailable } from "@/lib/auth/google-config";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "B4GAMBLE 10-Step Control Programme | Personal Control Plan",
  description:
    "Begin B4GAMBLE's private 10-Step Control Programme with a personal exercise, then continue through structured goals, limits, reflection and review.",
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
        name: "10-Step Control Programme",
        item: absoluteUrl("/program"),
      },
    ],
  };
}

export default function ProgramPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema()} />
      <div data-public-programme-renderer="program-ai" tabIndex={-1}>
        <ProgramAiExperience googleAvailable={isGoogleAuthAvailable()} />
      </div>
    </>
  );
}
