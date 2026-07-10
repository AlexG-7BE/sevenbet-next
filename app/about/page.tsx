import { PageHero, ResourceCards } from "@/components/PageTemplates";
import { Section } from "@/components/ui";

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About SevenBet"
        title="A responsible gambling platform with casino comparison as a secondary tool."
        intro="SevenBet exists to help people build control before gambling decisions, then understand casino information with more transparency."
      />
      <Section eyebrow="Mission" title="Everything supports the 10-Step Control Program.">
        <ResourceCards
          items={[
            { title: "Program-first", text: "The main product is a structured control program, not a bonus feed." },
            { title: "Educational", text: "Guides explain wagering, limits, triggers and risky behavior in plain language." },
            { title: "Transparent", text: "Affiliate disclosure, methodology and review criteria are easy to find." },
          ]}
        />
      </Section>
    </>
  );
}
