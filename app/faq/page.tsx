import { PageHero } from "@/components/PageTemplates";
import { FAQ, Section } from "@/components/ui";

export default function FAQPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title="Common questions about SevenBet."
        intro="Short answers about the control program, self-assessment, casino comparison and affiliate disclosure."
      />
      <Section eyebrow="Questions" title="The essentials.">
        <FAQ
          items={[
            ["Is SevenBet a casino?", "No. SevenBet does not operate casinos, accept deposits or provide gambling services."],
            ["What is the main product?", "The SevenBet 10-Step Control Program is the primary product and user journey."],
            ["Why include casino comparisons?", "They help users understand terms, licensing, wagering and payment details if comparison is appropriate."],
            ["Does SevenBet earn commissions?", "SevenBet may earn commissions from some partner links. Affiliate disclosure remains visible."],
            ["Is the self-check medical advice?", "No. It is educational decision support, not diagnosis or treatment."],
            ["When should I avoid offers?", "Avoid offers when there is pressure, chasing losses, hidden spending, borrowing or broken limits."],
          ]}
        />
      </Section>
    </>
  );
}
