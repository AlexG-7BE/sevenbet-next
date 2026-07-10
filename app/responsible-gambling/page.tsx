import { PageHero, ResourceCards } from "@/components/PageTemplates";
import { CTA, FAQ, Section } from "@/components/ui";

export default function ResponsibleGamblingPage() {
  return (
    <>
      <PageHero
        eyebrow="Responsible gambling"
        title="If control is already lost, casino offers should not be the next step."
        intro="Use limits, cool-off periods, self-exclusion information and external support when gambling affects money, work, relationships or mental health."
        primary={{ href: "/self-check", label: "Complete self-assessment" }}
        secondary={{ href: "/program", label: "Open 10-Step Program" }}
      />

      <Section eyebrow="Resources" title="Responsible gambling tools and support routes.">
        <ResourceCards
          items={[
            { title: "Deposit limits", text: "Set a maximum before gambling and avoid changing it during a session." },
            { title: "Cool-off periods", text: "Use a pause when gambling feels emotional, automatic or connected to losses." },
            { title: "Self-exclusion information", text: "If control is lost, self-exclusion may be a safer next action than another limit." },
            { title: "External support", text: "Talk to someone you trust and seek local professional support if gambling is causing harm." },
          ]}
        />
      </Section>

      <Section eyebrow="Red flags" title="Do not continue to casino comparison if these are present.">
        <ResourceCards
          items={[
            { title: "Chasing losses", text: "Trying to recover losses often leads to higher risk decisions." },
            { title: "Hidden deposits", text: "Secrecy around money or time is a sign to pause and seek support." },
            { title: "Borrowed money", text: "Do not gamble with borrowed money or money needed for essentials." },
          ]}
        />
      </Section>

      <Section eyebrow="FAQ" title="Responsible gambling basics.">
        <FAQ
          items={[
            ["Is this medical advice?", "No. SevenBet provides educational decision support, not diagnosis or treatment."],
            ["What should I do first?", "Pause, set the limit to zero for today and use available blocking or self-exclusion tools."],
            ["Can I return later?", "Only after the decision is calm, budgeted and not connected to recovering losses."],
            ["Should I compare bonuses under stress?", "No. Complete the self-assessment or use support resources instead."],
          ]}
        />
      </Section>

      <Section eyebrow="Pause path" title="A safer choice can be no gambling today.">
        <CTA
          title="If there is pressure, secrecy or financial harm, choose support first."
          primary={{ href: "/self-check", label: "Complete self-assessment" }}
          secondary={{ href: "/program", label: "Continue the program" }}
        />
      </Section>
    </>
  );
}
