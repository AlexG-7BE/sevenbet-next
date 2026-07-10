import { PageHero, ResourceCards } from "@/components/PageTemplates";
import { SelfAssessment } from "@/components/SelfAssessment";
import { CTA, FAQ, Section } from "@/components/ui";

export default function SelfCheckPage() {
  return (
    <>
      <PageHero
        eyebrow="Educational self-assessment"
        title="Take a Moment to Reflect"
        intro="Answer a short series of questions about your gambling habits. Your responses will be used to provide educational recommendations and suggest relevant SevenBet resources."
        primary={{ href: "#assessment", label: "Start Assessment" }}
        secondary={{ href: "/program", label: "Open 10-Step Program" }}
      >
        <p className="muted">Estimated time: 3-5 minutes. This is not a medical diagnosis.</p>
      </PageHero>

      <Section eyebrow="How it works" title="A short reflection flow with educational next steps.">
        <div className="stageGrid">
          {[
            ["01", "Answer honestly", "Respond to neutral questions about planning, budgeting, time awareness and bonus understanding."],
            ["02", "Receive educational insights", "See a non-diagnostic profile that summarizes strengths and areas to review."],
            ["03", "Explore recommended resources", "Use SevenBet guides, tools and program steps based on your responses."],
          ].map(([number, title, text]) => (
            <article className="card stageCard" key={number}>
              <span className="cardRank">{number}</span>
              <h3>{title}</h3>
              <p className="muted">{text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Assessment flow"
        title="Reflect on habits, not labels."
        intro="Questions focus on planning, budgeting, impulse control, time awareness, bonus understanding, decision making and responsible gambling tools."
      >
        <SelfAssessment />
      </Section>

      <Section eyebrow="Personalized recommendations" title="Educational resources you may see after the assessment.">
        <ResourceCards
          items={[
            { title: "Understanding wagering requirements", text: "Learn how wagering, max bet rules and expiry windows affect bonus terms.", href: "/bonus-guide", badge: "Guide" },
            { title: "Setting a gambling budget", text: "Use deposit, loss and session limits before comparing casino options.", href: "/tools/budget-calculator", badge: "Tool" },
            { title: "Managing gambling time", text: "Create time boundaries and review sessions before they drift.", href: "/program", badge: "Program" },
            { title: "Understanding casino licensing", text: "Review licensing, payment options and trust signals as factual comparison criteria.", href: "/methodology", badge: "Methodology" },
            { title: "Using deposit limits", text: "Understand limits, cooling-off periods and self-exclusion information.", href: "/responsible-gambling", badge: "Safety" },
            { title: "Casino comparison guide", text: "Use comparisons as optional informational resources after setting boundaries.", href: "/casinos", badge: "Optional" },
          ]}
        />
      </Section>

      <Section eyebrow="Continue your journey" title="Choose the next educational step.">
        <ResourceCards
          items={[
            { title: "Continue the 10-Step Program", text: "Move from reflection into a structured control framework.", href: "/program", badge: "Primary" },
            { title: "Read educational guides", text: "Review wagering, bonus terms, licensing and withdrawal concepts.", href: "/bonus-guide", badge: "Education" },
            { title: "Explore responsible gambling tools", text: "Learn about deposit limits, cooling-off periods and self-exclusion information.", href: "/responsible-gambling", badge: "Safety" },
            { title: "Browse verified casino comparisons", text: "Optional informational resource after your plan and limits are clear.", href: "/casinos", badge: "Optional" },
          ]}
        />
      </Section>

      <Section eyebrow="FAQ" title="Questions about this assessment.">
        <FAQ
          items={[
            ["What is this assessment?", "It is an educational reflection tool that suggests SevenBet resources based on your answers."],
            ["Is it anonymous?", "The current version does not require an account. Future progress features should explain clearly how data is stored."],
            ["Does SevenBet diagnose gambling addiction?", "No. SevenBet does not diagnose gambling addiction or provide medical treatment."],
            ["Can I retake the assessment?", "Yes. Retaking it can be useful if your habits, limits or gambling context changes."],
            ["How are recommendations generated?", "Recommendations are based on response patterns across planning, budgeting, time awareness, bonus understanding and responsible gambling tools."],
            ["Why am I seeing different recommendations?", "Different answers point to different educational topics, such as limits, wagering terms or responsible gambling resources."],
          ]}
        />
      </Section>

      <Section eyebrow="Keep Learning" title="Continue with a structured plan.">
        <CTA
          title="Use the assessment as a starting point, then continue the 10-Step Program."
          primary={{ href: "/program", label: "Continue the 10-Step Program" }}
          secondary={{ href: "/bonus-guide", label: "Browse Educational Guides" }}
        />
      </Section>
    </>
  );
}
