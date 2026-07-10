"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const questions = [
  "I played longer than planned",
  "I tried to win back losses",
  "I hid deposit amounts or time spent playing",
  "I deposited while emotional",
  "I raised the bet after a losing streak",
  "I claimed a bonus without reading the terms",
  "A no-deposit day feels difficult",
  "Gambling has already affected money, work or relationships",
];

export default function SelfCheckPage() {
  const [checked, setChecked] = useState<boolean[]>(Array(questions.length).fill(false));
  const score = checked.filter(Boolean).length;
  const result = useMemo(() => {
    if (score >= 5) {
      return {
        title: "High risk",
        text: "Today, it is better not to continue to bonuses. Start with responsible gaming tools, self-exclusion and support.",
        href: "/responsible-gaming",
        cta: "Open help resources",
      };
    }
    if (score >= 2) {
      return {
        title: "Impulse signs detected",
        text: "Start with the 10-step program and limits. Leave bonuses for later.",
        href: "/program",
        cta: "Start the program",
      };
    }
    return {
      title: "Lower risk signal",
      text: "Still set a budget, timer and stop-loss before moving to offers.",
      href: "/tools/budget-calculator",
      cta: "Calculate limit",
    };
  }, [score]);

  return (
    <section className="pageShell">
      <div className="container twoCol">
        <div>
          <p className="eyebrow">Self-check</p>
          <h1>Check your state before bonuses.</h1>
          <p className="lead">This is not a diagnosis. It is a protective filter before depositing.</p>
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
        </div>
        <aside className="resultPanel">
          <span className="safeBadge">{score}/8</span>
          <h2>{result.title}</h2>
          <p className="muted">{result.text}</p>
          <Link className="button gold" href={result.href}>{result.cta}</Link>
        </aside>
      </div>
    </section>
  );
}
