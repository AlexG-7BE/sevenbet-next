"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card, Container, CTA, SectionHeader } from "@/components/ui";

const questions = [
  "I played longer than planned",
  "I tried to recover losses",
  "I hid deposit amounts or time spent playing",
  "I deposited while emotional",
  "I raised the bet after a losing streak",
  "I reviewed an offer without reading the terms",
  "A no-deposit day feels difficult",
  "Gambling has already affected money, work or relationships",
];

export default function SelfCheckPage() {
  const [checked, setChecked] = useState<boolean[]>(Array(questions.length).fill(false));
  const score = checked.filter(Boolean).length;
  const result = useMemo(() => {
    if (score >= 5) {
      return {
        tone: "warning" as const,
        title: "High risk signal",
        text: "Today, it is better not to continue to offers. Start with responsible gaming tools, self-exclusion and support.",
        href: "/responsible-gaming",
        cta: "Open help resources",
      };
    }
    if (score >= 2) {
      return {
        tone: "warning" as const,
        title: "Impulse signs detected",
        text: "Start with the 10-step program and limits. Leave operator offers for later.",
        href: "/program",
        cta: "Start the program",
      };
    }
    return {
      tone: "green" as const,
      title: "Lower risk signal",
      text: "Still set a budget, timer and stop-loss before moving to offer comparison.",
      href: "/tools/budget-calculator",
      cta: "Start with limit check",
    };
  }, [score]);

  return (
    <>
      <section className="pageShell">
        <Container className="twoCol">
          <div>
            <SectionHeader
              eyebrow="Self-check"
              title="Check your state before reviewing offers."
              intro="This is not a diagnosis. It is a protective filter before depositing or comparing operator terms."
            />
            <Card className="questionPanel">
              <div className="questionList">
                {questions.map((question, index) => (
                  <label key={question} className="questionItem">
                    <input
                      checked={checked[index]}
                      onChange={(event) => {
                        const next = [...checked];
                        next[index] = event.target.checked;
                        setChecked(next);
                      }}
                      type="checkbox"
                    />
                    <span>{question}</span>
                  </label>
                ))}
              </div>
            </Card>
          </div>

          <Card className="resultPanel" tone={result.tone === "warning" ? "warning" : "soft"}>
            <Badge tone={result.tone}>{score}/8 checked</Badge>
            <h2>{result.title}</h2>
            <p className="muted">{result.text}</p>
            <Button href={result.href} variant="primary">
              {result.cta}
            </Button>
          </Card>
        </Container>
      </section>

      <section className="section">
        <Container>
          <CTA
            eyebrow="Responsible gambling"
            title="If the check feels uncomfortable, pause before any offer page."
            intro="A controlled decision can wait. Pressure, secrecy or chasing losses are reasons to step away."
            primary={{ href: "/responsible-gaming", label: "Responsible gaming" }}
            secondary={{ href: "/tools/budget-calculator", label: "Start with limit check" }}
          />
        </Container>
      </section>
    </>
  );
}
