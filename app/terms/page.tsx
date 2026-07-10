import { PageHero, ResourceCards } from "@/components/PageTemplates";
import { Section } from "@/components/ui";

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Terms"
        title="Terms of use placeholder."
        intro="This page is a structured placeholder. Replace with reviewed legal terms before production launch."
      />
      <Section eyebrow="Important context" title="Terms copy to finalize.">
        <ResourceCards
          items={[
            { title: "18+ only", text: "SevenBet content is intended only for adults in jurisdictions where gambling content is legal." },
            { title: "Educational information", text: "Program and self-check content are educational, not medical, legal or financial advice." },
            { title: "No gambling services", text: "SevenBet does not operate casinos, accept deposits or guarantee operator availability." },
          ]}
        />
      </Section>
    </>
  );
}
