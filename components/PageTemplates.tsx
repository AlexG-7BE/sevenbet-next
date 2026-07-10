import type { ReactNode } from "react";
import { Badge, Button, Card, Container, SectionHeader } from "@/components/ui";
import type { ProgramStep } from "@/lib/program";

export function PageHero({
  eyebrow,
  title,
  intro,
  primary,
  secondary,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <section className="pageShell">
      <Container>
        <SectionHeader eyebrow={eyebrow} title={title} intro={intro} />
        {(primary || secondary) && (
          <div className="heroActions">
            {primary && (
              <Button href={primary.href} variant="primary">
                {primary.label}
              </Button>
            )}
            {secondary && (
              <Button href={secondary.href} variant="ghost">
                {secondary.label}
              </Button>
            )}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}

export function ResourceCards({
  items,
}: {
  items: Array<{ title: string; text: string; href?: string; badge?: string }>;
}) {
  return (
    <div className="guideGrid">
      {items.map((item) => (
        <Card className="guideCard" key={item.title}>
          {item.badge && <Badge tone="dark">{item.badge}</Badge>}
          <h3>{item.title}</h3>
          <p className="muted">{item.text}</p>
          {item.href && (
            <Button href={item.href} variant="ghost">
              Read more
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}

export function ProgramTimeline({ steps }: { steps: ProgramStep[] }) {
  return (
    <div className="stepTimeline">
      {steps.map((step) => (
        <StepCard step={step} key={step.day} />
      ))}
    </div>
  );
}

export function StepCard({ step }: { step: ProgramStep }) {
  return (
    <Card className="timelineCard">
      <div className="timelineMeta">
        <span className="cardRank">Step {step.day}</span>
        <Badge tone="dark">{step.estimatedTime}</Badge>
      </div>
      <div>
        <h3>{step.title}</h3>
        <p className="muted">{step.focus}</p>
        <p className="muted"><strong>Key takeaway:</strong> {step.keyTakeaway}</p>
        <div className="miniTasks">
          {step.tasks.map((task) => (
            <span key={task}>{task}</span>
          ))}
        </div>
      </div>
      <Button href={`/program#step-${step.day}`} variant="ghost">
        Continue
      </Button>
    </Card>
  );
}

export function ProgramProgress() {
  return (
    <Card className="verificationPanel" tone="soft">
      <div className="verificationScore">
        <strong>0%</strong>
        <span>saved progress placeholder</span>
      </div>
      <div className="verificationList">
        <div><span>Completed steps</span><strong>0 of 10</strong></div>
        <div><span>Current step</span><strong>Step 1</strong></div>
        <div><span>Estimated completion</span><strong>20-30 min</strong></div>
        <div><span>Suggested path</span><strong>Finish all steps before comparison</strong></div>
      </div>
    </Card>
  );
}
