import { PageHero, ResourceCards } from "@/components/PageTemplates";
import { Section } from "@/components/ui";

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacy"
        title="Privacy policy placeholder."
        intro="This page outlines the intended privacy structure for SevenBet. Replace with reviewed legal copy before production launch."
      />
      <Section eyebrow="Data principles" title="Privacy copy to finalize.">
        <ResourceCards
          items={[
            { title: "Minimal data", text: "SevenBet should collect only what is needed to operate the product." },
            { title: "No casino account handling", text: "SevenBet does not accept deposits or manage casino accounts." },
            { title: "Analytics and affiliates", text: "Analytics and sponsored link tracking should be disclosed clearly." },
          ]}
        />
      </Section>
    </>
  );
}
