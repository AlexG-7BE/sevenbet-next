import {
  AffiliateDisclosure,
  Badge,
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
            title="Compare top casino bonuses by rating, payout and terms."
            intro="See casino rating, wagering, minimum deposit, license, risk labels and verification context before every sponsored transition."
          />
          <div className="heroActions">
            <Button href="/catalog" variant="primary">
              Explore all casinos
            </Button>
            <Button href="/bonus-guide" variant="ghost">
              Compare terms guide
            </Button>
          </div>
          <AffiliateDisclosure />
          <div className="catalogFilters" aria-label="Bonus category tabs">
            {["Editor picks", "Fast payout", "Low wagering", "High rating", "New player offers"].map((label) => (
              <Badge tone={label === "Editor picks" ? "warning" : "dark"} key={label}>
                {label}
              </Badge>
            ))}
          </div>
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

      <Section eyebrow="Responsible comparison" title="A strong bonus should still fit your limit.">
        <CTA
          title="Not sure about your budget or current state?"
          intro="Run a quick limit check before opening casino offer pages."
          primary={{ href: "/self-check", label: "Start with limit check" }}
          secondary={{ href: "/responsible-gaming", label: "Responsible gaming" }}
        />
      </Section>

      <Section eyebrow="FAQ" title="Common offer questions.">
        <FAQ
          items={[
            ["Are these casino offers?", "Yes. SevenBet presents them as offers to compare, with terms visible before the click."],
            ["Why show risk labels?", "Wagering, review status and unclear terms can change whether an offer fits a controlled plan."],
            ["Do affiliate links affect rankings?", "Commercial links are disclosed. License, terms and control context remain visible."],
            ["Should I continue if I feel pressure?", "No. Use self-check, budget tools or responsible gaming resources first."],
          ]}
        />
      </Section>
    </>
  );
}
