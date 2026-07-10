"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card } from "@/components/ui";

type Answer = {
  label: string;
  value: number;
};

type Question = {
  category: string;
  prompt: string;
  helper: string;
  answers: Answer[];
};

type Resource = {
  title: string;
  text: string;
  href: string;
};

type Profile = {
  title: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  nextStep: string;
  nextHref: string;
  resources: Resource[];
};

const questions: Question[] = [
  {
    category: "Planning",
    prompt: "Before gambling, how often do you decide why you are playing and when you will stop?",
    helper: "This question reflects planning, not personal judgment.",
    answers: [
      { label: "Usually", value: 0 },
      { label: "Sometimes", value: 1 },
      { label: "Rarely", value: 2 },
    ],
  },
  {
    category: "Budgeting",
    prompt: "How clear is your gambling budget before a session starts?",
    helper: "A budget can include deposit, loss and time boundaries.",
    answers: [
      { label: "Clear before I start", value: 0 },
      { label: "Somewhat clear", value: 1 },
      { label: "Not clear", value: 2 },
    ],
  },
  {
    category: "Impulse control",
    prompt: "When you feel an urge to continue, how often do you pause before making the next decision?",
    helper: "Pausing can help separate automatic behavior from deliberate choice.",
    answers: [
      { label: "Often", value: 0 },
      { label: "Sometimes", value: 1 },
      { label: "Rarely", value: 2 },
    ],
  },
  {
    category: "Time awareness",
    prompt: "How often do gambling sessions last longer than you expected?",
    helper: "This is about time awareness and session boundaries.",
    answers: [
      { label: "Rarely", value: 0 },
      { label: "Sometimes", value: 1 },
      { label: "Often", value: 2 },
    ],
  },
  {
    category: "Bonus understanding",
    prompt: "Before using a casino bonus, how often do you read wagering, max bet and expiry terms?",
    helper: "Bonus terms can affect how long and how much someone plays.",
    answers: [
      { label: "Usually", value: 0 },
      { label: "Sometimes", value: 1 },
      { label: "Rarely", value: 2 },
    ],
  },
  {
    category: "Decision making",
    prompt: "How often do emotions such as stress, boredom or frustration influence gambling decisions?",
    helper: "This question supports reflection on context around decisions.",
    answers: [
      { label: "Rarely", value: 0 },
      { label: "Sometimes", value: 1 },
      { label: "Often", value: 2 },
    ],
  },
  {
    category: "Responsible gambling tools",
    prompt: "How familiar are you with deposit limits, cooling-off periods and self-exclusion tools?",
    helper: "These tools can be useful to understand before they are urgently needed.",
    answers: [
      { label: "Very familiar", value: 0 },
      { label: "Somewhat familiar", value: 1 },
      { label: "Not familiar", value: 2 },
    ],
  },
];

const resources: Record<string, Resource> = {
  wagering: {
    title: "Understanding wagering requirements",
    text: "Learn how wagering, max bet rules and expiry windows affect bonus terms.",
    href: "/bonus-guide",
  },
  budget: {
    title: "Setting a gambling budget",
    text: "Use deposit, loss and session limits before comparing casino options.",
    href: "/tools/budget-calculator",
  },
  time: {
    title: "Managing gambling time",
    text: "Create time boundaries and review sessions before they drift.",
    href: "/program",
  },
  licensing: {
    title: "Understanding casino licensing",
    text: "Review licensing, payment options and trust signals as factual comparison criteria.",
    href: "/methodology",
  },
  tools: {
    title: "Using deposit limits",
    text: "Understand limits, cooling-off periods and self-exclusion information.",
    href: "/responsible-gambling",
  },
  comparison: {
    title: "Casino comparison guide",
    text: "Use casino comparisons as optional informational resources after setting boundaries.",
    href: "/casinos",
  },
};

function getProfile(score: number): Profile {
  if (score >= 10) {
    return {
      title: "Needs More Information",
      summary: "Your answers suggest several areas where more education and planning may be useful before gambling decisions.",
      strengths: ["You completed the reflection process", "You identified topics worth reviewing"],
      improvements: ["Review limits and responsible gambling tools", "Pause before casino comparison", "Use the 10-Step Program in order"],
      nextStep: "Start Step 1: Understand Your Starting Point",
      nextHref: "/program#step-1",
      resources: [resources.budget, resources.tools, resources.wagering],
    };
  }

  if (score >= 6) {
    return {
      title: "Building Healthy Habits",
      summary: "Your answers show some existing awareness, with room to strengthen planning, time limits and bonus understanding.",
      strengths: ["You can identify some decision patterns", "You are ready for structured planning"],
      improvements: ["Clarify budget and time boundaries", "Review bonus terms before comparing offers"],
      nextStep: "Continue Step 4: Set Financial Limits",
      nextHref: "/program#step-4",
      resources: [resources.budget, resources.time, resources.wagering],
    };
  }

  if (score >= 3) {
    return {
      title: "Planning-Oriented Player",
      summary: "Your answers suggest a planning mindset. The next useful step is to make those plans more explicit and repeatable.",
      strengths: ["You show signs of pre-session planning", "You may already use some boundaries"],
      improvements: ["Write down personal rules", "Review trust signals before optional casino comparison"],
      nextStep: "Continue Step 7: Build a Personal Gambling Plan",
      nextHref: "/program#step-7",
      resources: [resources.licensing, resources.comparison, resources.tools],
    };
  }

  return {
    title: "Confident but Continue Reviewing",
    summary: "Your answers suggest many decisions are already planned. Continue reviewing terms, limits and responsible gambling tools before comparing casinos.",
    strengths: ["Clearer planning signals", "Lower need for immediate educational review", "Good starting point for informed comparison"],
    improvements: ["Repeat the assessment when habits change", "Keep limits visible before casino comparison"],
    nextStep: "Continue Step 10: Make an Informed Decision",
    nextHref: "/program#step-10",
    resources: [resources.comparison, resources.licensing, resources.wagering],
  };
}

export function AssessmentProgress({
  current,
  total,
  answered,
}: {
  current: number;
  total: number;
  answered: number;
}) {
  const progress = Math.round((answered / total) * 100);
  const remaining = Math.max(1, total - current);

  return (
    <Card className="assessmentProgress" tone="soft">
      <div className="cardTopline">
        <Badge tone="green">Question {current} of {total}</Badge>
        <Badge tone="dark">~{remaining} min remaining</Badge>
      </div>
      <div className="ratingBar" aria-label={`Assessment progress ${progress}%`}>
        <span style={{ width: `${progress}%` }} />
      </div>
    </Card>
  );
}

export function QuestionCard({
  question,
  selected,
  onSelect,
}: {
  question: Question;
  selected: number | null;
  onSelect: (value: number) => void;
}) {
  return (
    <Card className="questionPanel">
      <Badge tone="warning">{question.category}</Badge>
      <h2>{question.prompt}</h2>
      <p className="muted">{question.helper}</p>
      <div className="answerList" role="radiogroup" aria-label={question.category}>
        {question.answers.map((answer) => (
          <button
            className={`answerButton ${selected === answer.value ? "selected" : ""}`}
            key={answer.label}
            onClick={() => onSelect(answer.value)}
            type="button"
            role="radio"
            aria-checked={selected === answer.value}
          >
            {answer.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

export function RecommendationCard({ resource }: { resource: Resource }) {
  return (
    <Card className="guideCard">
      <h3>{resource.title}</h3>
      <p className="muted">{resource.text}</p>
      <Button href={resource.href} variant="ghost">
        Read guide
      </Button>
    </Card>
  );
}

export function ProfileSummary({ profile, score }: { profile: Profile; score: number }) {
  return (
    <Card className="resultPanel" tone="soft">
      <Badge tone={score >= 6 ? "warning" : "green"}>Educational profile</Badge>
      <h2>{profile.title}</h2>
      <p className="muted">{profile.summary}</p>
      <div className="guideGrid twoCards">
        <Card className="guideCard">
          <h3>Key strengths</h3>
          <div className="miniTasks">
            {profile.strengths.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </Card>
        <Card className="guideCard">
          <h3>Areas to improve</h3>
          <div className="miniTasks">
            {profile.improvements.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </Card>
      </div>
      <Button href={profile.nextHref} variant="primary">
        {profile.nextStep}
      </Button>
    </Card>
  );
}

export function SelfAssessment() {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(Array(questions.length).fill(null));
  const [complete, setComplete] = useState(false);

  const score = answers.reduce<number>((total, answer) => total + (answer ?? 0), 0);
  const answered = answers.filter((answer) => answer !== null).length;
  const profile = useMemo(() => getProfile(score), [score]);
  const question = questions[current];

  function setAnswer(value: number) {
    const next = [...answers];
    next[current] = value;
    setAnswers(next);
  }

  function goNext() {
    if (current === questions.length - 1) {
      setComplete(true);
      return;
    }
    setCurrent((value) => value + 1);
  }

  function goBack() {
    if (complete) {
      setComplete(false);
      return;
    }
    setCurrent((value) => Math.max(0, value - 1));
  }

  if (!started) {
    return (
      <Card className="assessmentIntro" tone="soft">
        <Badge tone="green">3-5 minutes</Badge>
        <h2>Start with reflection, not judgment.</h2>
        <p className="muted">
          This assessment is anonymous in the current version and is designed to provide educational recommendations.
          It does not diagnose gambling addiction or provide treatment advice.
        </p>
        <button className="button gold sectionButton" onClick={() => setStarted(true)} type="button">
          Start Assessment
        </button>
      </Card>
    );
  }

  if (complete) {
    return (
      <div className="assessmentFlow">
        <ProfileSummary profile={profile} score={score} />
        <div className="guideGrid pageGrid">
          {profile.resources.map((resource) => (
            <RecommendationCard resource={resource} key={resource.title} />
          ))}
        </div>
        <div className="heroActions">
          <Button href="/program" variant="primary">
            Continue the 10-Step Program
          </Button>
          <Button href="/responsible-gambling" variant="ghost">
            Explore responsible gambling tools
          </Button>
          <Button href="/casinos" variant="ghost">
            Browse verified casino comparisons
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="assessmentFlow" id="assessment">
      <AssessmentProgress current={current + 1} total={questions.length} answered={answered} />
      <QuestionCard question={question} selected={answers[current]} onSelect={setAnswer} />
      <div className="heroActions">
        <button className="button ghost" onClick={goBack} type="button" disabled={current === 0}>
          Back
        </button>
        <button className="button gold" onClick={goNext} type="button" disabled={answers[current] === null}>
          {current === questions.length - 1 ? "View results" : "Next"}
        </button>
      </div>
    </div>
  );
}
