import { PageHero, ProgramProgress, ProgramTimeline, ResourceCards } from "@/components/PageTemplates";
import { Card, CTA, FAQ, Section } from "@/components/ui";
import { programSteps } from "@/lib/program";

export default function ProgramPage() {
  return (
    <>
      <PageHero
        eyebrow="Flagship program"
        title="The SevenBet 10-Step Control Program"
        intro="A structured educational framework designed to help players slow down, understand gambling decisions, and develop healthier habits before placing bets."
        primary={{ href: "#step-1", label: "Start Step 1" }}
        secondary={{ href: "#all-steps", label: "See all 10 steps" }}
      />

      <Section eyebrow="Why this program exists" title="Many gambling decisions happen automatically.">
        <div className="versusGrid">
          <Card className="versusCard">
            <h3>Pause before the next decision</h3>
            <p className="muted">
              The framework encourages users to slow down, reflect on recent choices and understand common gambling
              concepts before making another decision.
            </p>
          </Card>
          <Card className="versusCard">
            <h3>Create personal rules</h3>
            <p className="muted">
              The goal is educational and practical: identify triggers, read terms clearly, set limits and create a
              personal plan before gambling.
            </p>
          </Card>
        </div>
      </Section>

      <Section eyebrow="How the program works" title="A self-paced framework you can complete in one or more sessions.">
        <div className="statsGrid">
          <Card><strong>10</strong><span>structured steps</span></Card>
          <Card><strong>20-30</strong><span>minutes total</span></Card>
          <Card><strong>Self-paced</strong><span>complete in multiple sessions</span></Card>
          <Card><strong>Saved</strong><span>progress placeholder</span></Card>
        </div>
        <ProgramProgress />
      </Section>

      <Section
        eyebrow="The 10 steps"
        title="Move from reflection to an informed decision."
        intro="Each step includes a short explanation, estimated time, key takeaway and a continue action."
        className="anchoredSection"
      >
        <span id="all-steps" />
        <div id="step-1" />
        <ProgramTimeline steps={programSteps} />
      </Section>

      <Section eyebrow="What you will learn" title="Practical concepts that support better decisions.">
        <ResourceCards
          items={[
            { title: "Understanding wagering requirements", text: "Learn how wagering, max bet rules and expiry windows affect bonus terms." },
            { title: "Reading bonus terms", text: "Look past headline offers and understand the conditions attached to them." },
            { title: "Recognizing common biases", text: "Notice patterns such as chasing losses, streak thinking and urgency." },
            { title: "Planning bankroll limits", text: "Set financial boundaries before gambling decisions become emotional." },
            { title: "Understanding self-exclusion tools", text: "Learn what cool-off and self-exclusion tools are for and when to consider them." },
            { title: "Knowing when to take a break", text: "Identify signals that suggest pausing is the more informed decision." },
            { title: "Evaluating casino trust signals", text: "Review licensing, payment methods, withdrawal speed and responsible gambling features." },
          ]}
        />
      </Section>

      <Section eyebrow="Progress tracking" title="Finish the steps before exploring comparison resources.">
        <ProgramProgress />
        <p className="muted">
          This page currently shows progress placeholders. A future product layer can save completed steps, current step
          and estimated completion locally without requiring an account.
        </p>
      </Section>

      <Section eyebrow="FAQ" title="Questions about the 10-Step Program.">
        <FAQ
          items={[
            ["How long does the program take?", "The full framework is designed to take about 20-30 minutes, but it can be completed over multiple sessions."],
            ["Is it free?", "The program content is presented as a free educational resource on SevenBet."],
            ["Can I skip steps?", "You can navigate freely, but the program is designed to work best when completed in order."],
            ["Do I need an account?", "No account is required for the current version. Progress saving is shown as a product placeholder."],
            ["Is this therapy?", "No. This is educational content, not therapy, medical treatment or psychological counseling."],
            ["Can I repeat the program?", "Yes. Repeating the steps can be useful when your habits, limits or casino choices change."],
          ]}
        />
      </Section>

      <Section eyebrow="Ready to begin?" title="Start with Step 1.">
        <CTA
          title="Begin the SevenBet 10-Step Control Program."
          intro="Move through the steps at your own pace before using casino comparison resources."
          primary={{ href: "#step-1", label: "Start Step 1" }}
          secondary={{ href: "/", label: "Return to Homepage" }}
        />
      </Section>
    </>
  );
}
