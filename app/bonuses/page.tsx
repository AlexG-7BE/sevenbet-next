import {
  AffiliateDisclosure,
  Button,
  Container,
  CTA,
  FAQ,
  MethodologyBlock,
  OfferCard,
  Section,
  SectionHeader,
} from "@/components/ui";
import { getTopCasinos } from "@/lib/data";

export default function BonusesPage() {
  const casinos = getTopCasinos(24);

  return (
    <>
      <section className="pageShell">
        <Container>
          <SectionHeader
            eyebrow="Verified marketplace"
            title="Offers you can compare without the marketing fog."
            intro="See rating, wagering, minimum deposit, license, risk and verification context before any operator transition."
          />
          <div className="heroActions">
            <Button href="/tools/budget-calculator" variant="primary">
              Start with limit check
            </Button>
            <Button href="/bonus-guide" variant="ghost">
              Compare terms guide
            </Button>
          </div>
          <AffiliateDisclosure />
          <div className="bonusGrid pageGrid">
            {casinos.map((casino, index) => (
              <OfferCard casino={casino} key={casino.slug} rank={index + 1} />
            ))}
          </div>
        </Container>
      </section>

      <Section eyebrow="Methodology" title="How offers are presented.">
        <MethodologyBlock />
      </Section>

      <Section eyebrow="Before you continue" title="The offer should fit the limit, not stretch it.">
        <CTA
          title="Not sure about your budget or current state?"
          intro="Run a quick limit check before comparing operator terms."
          primary={{ href: "/self-check", label: "Start with limit check" }}
          secondary={{ href: "/responsible-gaming", label: "Responsible gaming" }}
        />
      </Section>

      <Section eyebrow="FAQ" title="Common offer questions.">
        <FAQ
          items={[
            ["Are these casino offers?", "Yes, but SevenBet presents them as terms to review, not as a prompt to play."],
            ["Why show risk labels?", "Wagering, review status and unclear terms can change whether an offer fits a controlled plan."],
            ["Do affiliate links affect rankings?", "Commercial links are disclosed. License, terms and control context remain visible."],
            ["Should I continue if I feel pressure?", "No. Use self-check, budget tools or responsible gaming resources first."],
          ]}
        />
      </Section>
    </>
  );
}
