import { PageHero, ResourceCards } from "@/components/PageTemplates";
import { AffiliateDisclosure, Section } from "@/components/ui";

export default function AffiliateDisclosurePage() {
  return (
    <>
      <PageHero
        eyebrow="Affiliate disclosure"
        title="How SevenBet may earn revenue."
        intro="SevenBet may receive commission from some partner links. The program, risk labels, methodology and responsible gambling resources remain visible regardless of commercial relationships."
      />
      <Section eyebrow="Disclosure" title="Commercial links are clearly marked.">
        <AffiliateDisclosure />
      </Section>
      <Section eyebrow="Editorial principles" title="What does not change because of commissions.">
        <ResourceCards
          items={[
            { title: "Responsible gambling first", text: "Program and self-assessment journeys remain the primary site path." },
            { title: "Terms remain visible", text: "Wagering, minimum deposit, payout speed and license signals stay visible before any click." },
            { title: "Risk labels remain", text: "Commercial relationships do not remove review-needed or terms-check labels." },
          ]}
        />
      </Section>
    </>
  );
}
