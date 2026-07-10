import { AffiliateDisclosure, Card, Container, CTA, MethodologyBlock, Section, SectionHeader } from "@/components/ui";

const items = [
  ["Wagering", "x35 means the bonus amount must be wagered 35 times. Lower requirements are usually easier to control."],
  ["Max bet", "The maximum allowed bet while wagering a bonus. Breaking it can void winnings."],
  ["Expiry", "A short expiry window can push you to play faster and longer than planned."],
  ["Restricted games", "Slots, live casino and table games often contribute differently to wagering."],
  ["Min deposit", "The minimum deposit must fit your limit instead of stretching it."],
  ["Withdrawal rules", "Check KYC, withdrawal limits, fees and payout speed before depositing."],
];

export default function BonusGuidePage() {
  return (
    <>
      <section className="pageShell">
        <Container>
          <SectionHeader
            eyebrow="Terms guide"
            title="How to read casino offers without walking into pressure."
            intro="A good offer should not make you increase your deposit, bet size or session length."
          />
          <AffiliateDisclosure />
          <div className="guideGrid pageGrid">
            {items.map(([title, text]) => (
              <Card className="guideCard" key={title}>
                <h3>{title}</h3>
                <p className="muted">{text}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <Section eyebrow="Methodology" title="What SevenBet checks before presenting offers.">
        <MethodologyBlock />
      </Section>

      <Section eyebrow="Next step" title="Compare only after the boundaries are clear.">
        <CTA
          title="Set budget, stop-loss and session time before opening operator pages."
          primary={{ href: "/tools/budget-calculator", label: "Start with limit check" }}
          secondary={{ href: "/bonuses", label: "Review offers" }}
        />
      </Section>
    </>
  );
}
