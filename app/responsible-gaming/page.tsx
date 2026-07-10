import { Card, Container, CTA, FAQ, SectionHeader } from "@/components/ui";

export default function ResponsibleGamingPage() {
  return (
    <>
      <section className="pageShell">
        <Container className="narrow">
          <SectionHeader
            eyebrow="Responsible gaming"
            title="If control is already lost, offers should not be the next step."
            intro="Use self-exclusion, remove fast payment methods, talk to someone you trust and seek professional help if gambling is harming money, work or relationships."
          />
          <div className="guideGrid oneCol">
            <Card className="guideCard" tone="warning">
              <h3>Red flags</h3>
              <p className="muted">Recovering losses, hidden deposits, borrowed money, broken limits and playing to handle stress.</p>
            </Card>
            <Card className="guideCard">
              <h3>First action</h3>
              <p className="muted">Set today&apos;s gambling limit to zero and activate available blocking tools.</p>
            </Card>
            <Card className="guideCard">
              <h3>SevenBet&apos;s role</h3>
              <p className="muted">Help you make a more mindful decision, not replace therapy, legal advice or financial advice.</p>
            </Card>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container>
          <CTA
            eyebrow="Pause path"
            title="A safer choice can be no gambling today."
            intro="If there is pressure, secrecy or financial harm, the useful next action is support, not another comparison page."
            primary={{ href: "/self-check", label: "Start with limit check" }}
            secondary={{ href: "/program", label: "Open 10-step program" }}
          />
        </Container>
      </section>

      <section className="section">
        <Container>
          <SectionHeader eyebrow="FAQ" title="Responsible gambling basics." />
          <FAQ
            items={[
              ["Is this medical advice?", "No. SevenBet provides decision support and educational prompts, not diagnosis or treatment."],
              ["When should I avoid offers?", "Avoid them when you feel pressure, hide spending, borrow money or continue after broken limits."],
              ["What should I do first?", "Pause, set the limit to zero for today and use available blocking or self-exclusion tools."],
              ["Can I return later?", "Only after the decision is calm, budgeted and not connected to recovering losses."],
            ]}
          />
        </Container>
      </section>
    </>
  );
}
