import { PageHero, ResourceCards } from "@/components/PageTemplates";
import { AffiliateDisclosure, MethodologyBlock, Section } from "@/components/ui";

export default function MethodologyPage() {
  return (
    <>
      <PageHero
        eyebrow="Methodology"
        title="How SevenBet reviews gambling decisions and casino information."
        intro="Our primary review lens is responsible gambling. Casino comparisons are evaluated only after limits, risk context and clear terms are visible."
      />
      <Section eyebrow="Review process" title="The criteria behind casino comparison.">
        <MethodologyBlock />
      </Section>
      <Section eyebrow="Verification" title="What we try to make visible.">
        <ResourceCards
          items={[
            { title: "Licensing", text: "License authority and operator signals are reviewed where data is available." },
            { title: "Bonus terms", text: "Wagering, max bet, expiry, minimum deposit and withdrawal rules are prioritized over headline value." },
            { title: "Payments", text: "Payment options and withdrawal speed are presented as comparison context." },
            { title: "Responsible tools", text: "Deposit limits, time-outs, self-exclusion and support information are part of the review framework." },
          ]}
        />
      </Section>
      <Section eyebrow="Commercial independence" title="Affiliate links do not remove risk labels.">
        <AffiliateDisclosure />
      </Section>
    </>
  );
}
