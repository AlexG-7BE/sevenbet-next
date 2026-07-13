"use client";

import { useEffect, useMemo, useState } from "react";
import { programSteps as fallbackProgramSteps, type ProgramStep } from "@/lib/program";
import { Badge, Button, Card, Container, CTA, Section } from "@/components/ui";

type ProgramState = {
  completedSteps: number[];
  completedStepIds?: string[];
  xp: number;
  achievements: string[];
  activeStep: number;
  activeStepId?: string;
  answers: Record<string, string>;
  quizAnswers: Record<number, number>;
  scenarioAnswers: Record<number, number>;
  lastVisitDate?: string;
  streak: number;
};

const STORAGE_KEY = "sevenbet-program-progress-v1";

const initialState: ProgramState = {
  completedSteps: [],
  xp: 0,
  achievements: [],
  activeStep: 1,
  answers: {},
  quizAnswers: {},
  scenarioAnswers: {},
  streak: 1,
};

const achievementCopy: Record<string, string> = {
  first_step: "First Step Complete",
  halfway: "Halfway Reflection",
  bonus_literacy: "Bonus Terms Reader",
  limit_planner: "Limit Planner",
  tool_ready: "Tool Awareness",
  program_complete: "Program Complete",
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dayDifference(previous?: string) {
  if (!previous) return 0;
  const previousDate = new Date(`${previous}T00:00:00`);
  const currentDate = new Date(`${todayKey()}T00:00:00`);
  return Math.round((currentDate.getTime() - previousDate.getTime()) / 86400000);
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

export function XPIndicator({ xp }: { xp: number }) {
  return (
    <div className="xpIndicator" aria-label={`${xp} XP earned`}>
      <span>XP</span>
      <strong>{xp}</strong>
    </div>
  );
}

export function ProgressHeader({
  activeStep,
  completedCount,
  total,
  xp,
  streak,
}: {
  activeStep: number;
  completedCount: number;
  total: number;
  xp: number;
  streak: number;
}) {
  const progress = Math.round((completedCount / total) * 100);

  return (
    <Card className="programHeader" tone="soft">
      <div>
        <Badge tone="green">Step {activeStep} of {total}</Badge>
        <h2>{progress}% complete</h2>
        <p className="muted">Progress is saved in this browser. Each step is designed to take 5-10 calm minutes.</p>
      </div>
      <div className="programHeaderStats">
        <XPIndicator xp={xp} />
        <div className="ratingBar" aria-label={`Program progress ${progress}%`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        {streak >= 2 && <Badge tone="warning">{streak}-day learning streak</Badge>}
      </div>
    </Card>
  );
}

export function ProgressTimeline({
  steps,
  activeStep,
  completedSteps,
  completedStepIds,
  onSelect,
}: {
  steps: ProgramStep[];
  activeStep: number;
  completedSteps: number[];
  completedStepIds?: string[];
  onSelect: (step: number) => void;
}) {
  return (
    <Card className="programTimeline">
      {steps.map((step) => {
        const completed = step.stableId ? completedStepIds?.includes(step.stableId) || completedSteps.includes(step.day) : completedSteps.includes(step.day);
        return (
          <button
            className={`timelineStep ${activeStep === step.day ? "active" : ""} ${completed ? "complete" : ""}`}
            key={step.day}
            onClick={() => onSelect(step.day)}
            type="button"
          >
            <span>{completed ? "Done" : step.day}</span>
            <strong>{step.title}</strong>
            <small>{step.estimatedTime}</small>
          </button>
        );
      })}
    </Card>
  );
}

export function LessonCard({ step }: { step: ProgramStep }) {
  return (
    <Card className="lessonCard" tone="soft">
      <div className="badgeCluster">
        <Badge tone="green">Lesson</Badge>
        <Badge>+{step.xp.lesson} XP</Badge>
      </div>
      <h2>{step.title}</h2>
      <p className="muted">{step.lesson}</p>
      <div className="resultRows">
        <div><span>Why it matters</span><strong>{step.whyItMatters}</strong></div>
        <div><span>Estimated time</span><strong>{step.estimatedTime}</strong></div>
      </div>
    </Card>
  );
}

export function ScenarioCard({
  step,
  selected,
  onSelect,
}: {
  step: ProgramStep;
  selected?: number;
  onSelect: (index: number) => void;
}) {
  return (
    <Card className="lessonCard">
      <div className="badgeCluster">
        <Badge tone="dark">Scenario</Badge>
        <Badge>+{step.xp.scenario} XP</Badge>
      </div>
      <h3>{step.scenario.prompt}</h3>
      <div className="answerList">
        {step.scenario.options.map((option, index) => (
          <button
            className={`answerButton ${selected === index ? "selected" : ""}`}
            key={option.label}
            onClick={() => onSelect(index)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
      {selected !== undefined && (
        <p className="muted">
          {step.scenario.options[selected].feedback}
        </p>
      )}
    </Card>
  );
}

export function QuizCard({
  step,
  selected,
  onSelect,
}: {
  step: ProgramStep;
  selected?: number;
  onSelect: (index: number) => void;
}) {
  const answered = selected !== undefined;
  const correct = selected === step.quiz.correctIndex;

  return (
    <Card className="lessonCard">
      <div className="badgeCluster">
        <Badge tone="dark">Quiz</Badge>
        <Badge>+{step.xp.quiz} XP</Badge>
      </div>
      <h3>{step.quiz.question}</h3>
      <div className="answerList">
        {step.quiz.options.map((option, index) => (
          <button
            className={`answerButton ${selected === index ? "selected" : ""}`}
            key={option}
            onClick={() => onSelect(index)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
      {answered && (
        <Card className="quizFeedback" tone={correct ? "soft" : "warning"}>
          <Badge tone={correct ? "green" : "warning"}>{correct ? "Correct" : "Review this"}</Badge>
          <p className="muted">{step.quiz.explanation}</p>
        </Card>
      )}
    </Card>
  );
}

export function AchievementToast({ achievement, onClose }: { achievement?: string; onClose: () => void }) {
  if (!achievement) return null;

  return (
    <div className="achievementToast" role="status">
      <Badge tone="warning">Achievement</Badge>
      <strong>{achievementCopy[achievement] || achievement}</strong>
      <button onClick={onClose} type="button" aria-label="Dismiss achievement">x</button>
    </div>
  );
}

export function Dashboard({
  steps,
  state,
  onSelect,
}: {
  steps: ProgramStep[];
  state: ProgramState;
  onSelect: (step: number) => void;
}) {
  const completedCount = state.completedStepIds?.length || state.completedSteps.length;
  const nextStep = steps.find((step) => step.stableId ? !state.completedStepIds?.includes(step.stableId) : !state.completedSteps.includes(step.day)) || steps[steps.length - 1];

  return (
    <Section eyebrow="Dashboard" title="Your personal program dashboard.">
      <div className="dashboardGrid">
        <Card className="verificationPanel" tone="soft">
          <div className="verificationScore">
            <strong>{completedCount}/10</strong>
            <span>completed steps</span>
          </div>
          <div className="verificationList">
            <div><span>Current progress</span><strong>{Math.round((completedCount / 10) * 100)}%</strong></div>
            <div><span>Earned XP</span><strong>{state.xp}</strong></div>
            <div><span>Recommended next lesson</span><strong>{nextStep.title}</strong></div>
            <div><span>Daily streak</span><strong>{state.streak >= 2 ? `${state.streak} days` : "Shown after consecutive days"}</strong></div>
          </div>
        </Card>
        <Card className="guideCard">
          <Badge tone="green">Achievements</Badge>
          <h3>Earned badges</h3>
          <div className="miniTasks">
            {state.achievements.length ? state.achievements.map((achievement) => (
              <span key={achievement}>{achievementCopy[achievement] || achievement}</span>
            )) : <span>No badges yet</span>}
          </div>
          <button className="button gold" onClick={() => onSelect(nextStep.day)} type="button">
            Continue recommended lesson
          </button>
        </Card>
      </div>
    </Section>
  );
}

export function CompletionScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <Section eyebrow="Program complete" title="You completed the 10-Step Control Program.">
      <CTA
        title="Use your plan before comparing casino information."
        intro="Completion is not a prompt to gamble. It is a checkpoint for calmer, better-informed decisions."
        primary={{ href: "/responsible-gambling", label: "Responsible Gambling Hub" }}
        secondary={{ href: "/casinos", label: "Browse Casino Reviews" }}
      />
      <div className="sectionButton">
        <button className="button ghost" onClick={onRestart} type="button">Restart local progress</button>
      </div>
    </Section>
  );
}

function achievementsFor(completedSteps: number[]) {
  const achievements = [];
  if (completedSteps.includes(1)) achievements.push("first_step");
  if (completedSteps.length >= 5) achievements.push("halfway");
  if (completedSteps.includes(3)) achievements.push("bonus_literacy");
  if (completedSteps.includes(4) && completedSteps.includes(5)) achievements.push("limit_planner");
  if (completedSteps.includes(8)) achievements.push("tool_ready");
  if (completedSteps.length === 10) achievements.push("program_complete");
  return achievements;
}

function stepXp(step: ProgramStep) {
  return step.xp.lesson + step.xp.scenario + step.xp.quiz + step.xp.guide;
}

export function ProgramExperience({ steps = fallbackProgramSteps }: { steps?: ProgramStep[] }) {
  const [state, setState] = useState<ProgramState>(initialState);
  const [toast, setToast] = useState<string>();
  const activeStep = steps.find((step) => step.stableId && step.stableId === state.activeStepId) || steps.find((step) => step.day === state.activeStep) || steps[0];

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) as ProgramState : initialState;
    const diff = dayDifference(parsed.lastVisitDate);
    const nextStreak = diff === 1 ? (parsed.streak || 1) + 1 : diff === 0 ? (parsed.streak || 1) : 1;
    const completedStepIds = parsed.completedStepIds?.length ? parsed.completedStepIds : steps.filter((step) => parsed.completedSteps.includes(step.day)).map((step) => step.stableId).filter((id): id is string => Boolean(id));
    const activeStepId = parsed.activeStepId || steps.find((step) => step.day === parsed.activeStep)?.stableId;
    setState({ ...initialState, ...parsed, completedStepIds, activeStepId, streak: nextStreak, lastVisitDate: todayKey() });
  }, [steps]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const completedCount = state.completedStepIds?.length || state.completedSteps.length;
  const selectedScenario = state.scenarioAnswers[activeStep.day];
  const selectedQuiz = state.quizAnswers[activeStep.day];
  const exerciseAnswer = state.answers[`exercise-${activeStep.day}`] || "";
  const canComplete = exerciseAnswer.trim().length >= 8 && selectedScenario !== undefined && selectedQuiz !== undefined;

  const xpAvailable = useMemo(() => stepXp(activeStep), [activeStep]);

  function updateState(partial: Partial<ProgramState>) {
    setState((current) => ({ ...current, ...partial }));
  }

  function completeStep() {
    const alreadyCompleted = activeStep.stableId ? state.completedStepIds?.includes(activeStep.stableId) : state.completedSteps.includes(activeStep.day);
    if (!canComplete || alreadyCompleted) return;

    const completedSteps = unique([...state.completedSteps, activeStep.day]).sort((a, b) => a - b);
    const completedStepIds = activeStep.stableId ? unique([...(state.completedStepIds || []), activeStep.stableId]) : state.completedStepIds;
    const previousAchievements = state.achievements;
    const nextAchievements = unique([...previousAchievements, ...achievementsFor(completedSteps)]);
    const newAchievement = nextAchievements.find((achievement) => !previousAchievements.includes(achievement));
    const nextStep = steps.find((step) => step.stableId ? !completedStepIds?.includes(step.stableId) : !completedSteps.includes(step.day));

    setState((current) => ({
      ...current,
      completedSteps,
      completedStepIds,
      achievements: nextAchievements,
      xp: current.xp + xpAvailable,
      activeStep: nextStep?.day || activeStep.day,
      activeStepId: nextStep?.stableId || activeStep.stableId,
    }));

    if (newAchievement) setToast(newAchievement);
  }

  function resetProgress() {
    window.localStorage.removeItem(STORAGE_KEY);
    setState({ ...initialState, lastVisitDate: todayKey() });
  }

  return (
    <>
      <section className="pageShell">
        <Container>
          <p className="eyebrow">Flagship interactive program</p>
          <h1>The SevenBet 10-Step Control Program</h1>
          <p className="lead">
            A guided educational experience with short lessons, scenario questions, quizzes, practical takeaways, saved
            progress, XP, and calm achievement badges.
          </p>
          <div className="heroActions">
            <Button href="#program-dashboard" variant="primary">Open Dashboard</Button>
            <Button href="#active-lesson" variant="ghost">Continue Lesson</Button>
          </div>
          <div className="trustStrip">
            <Badge tone="green">5-10 minutes per step</Badge>
            <Badge>Progress saved locally</Badge>
            <Badge tone="dark">Educational XP</Badge>
            <Badge tone="warning">No pressure to continue</Badge>
          </div>
        </Container>
      </section>

      <div id="program-dashboard">
        <Dashboard steps={steps} state={state} onSelect={(step) => updateState({ activeStep: step, activeStepId: steps.find((item) => item.day === step)?.stableId })} />
      </div>

      <Section eyebrow="Progress" title="Move through the steps at your own pace.">
        <ProgressHeader
          activeStep={state.activeStep}
          completedCount={completedCount}
          total={steps.length}
          xp={state.xp}
          streak={state.streak}
        />
        <ProgressTimeline
          steps={steps}
          activeStep={state.activeStep}
          completedSteps={state.completedSteps}
          completedStepIds={state.completedStepIds}
          onSelect={(step) => updateState({ activeStep: step, activeStepId: steps.find((item) => item.day === step)?.stableId })}
        />
      </Section>

      <Section eyebrow="Active lesson" title={`Step ${activeStep.day}: ${activeStep.title}`}>
        <div id="active-lesson" className="programLessonGrid">
          <LessonCard step={activeStep} />
          <Card className="lessonCard">
            <div className="badgeCluster">
              <Badge tone="dark">Exercise</Badge>
              <Badge>+{activeStep.xp.guide} XP guide completion</Badge>
            </div>
            <h3>{activeStep.exercisePrompt}</h3>
            <textarea
              className="reflectionInput"
              value={exerciseAnswer}
              onChange={(event) => updateState({
                answers: { ...state.answers, [`exercise-${activeStep.day}`]: event.target.value },
              })}
              placeholder="Write a short reflection..."
              rows={5}
            />
          </Card>
          <ScenarioCard
            step={activeStep}
            selected={selectedScenario}
            onSelect={(index) => updateState({
              scenarioAnswers: { ...state.scenarioAnswers, [activeStep.day]: index },
            })}
          />
          <QuizCard
            step={activeStep}
            selected={selectedQuiz}
            onSelect={(index) => updateState({
              quizAnswers: { ...state.quizAnswers, [activeStep.day]: index },
            })}
          />
          <Card className="lessonCard" tone="soft">
            <Badge tone="green">Recap</Badge>
            <h3>Practical takeaway</h3>
            <p className="muted">{activeStep.keyTakeaway}</p>
            <ul className="cleanList">
              {activeStep.recap.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <button
              className="button gold"
              disabled={!canComplete || (activeStep.stableId ? state.completedStepIds?.includes(activeStep.stableId) : state.completedSteps.includes(activeStep.day))}
              onClick={completeStep}
              type="button"
            >
              {(activeStep.stableId ? state.completedStepIds?.includes(activeStep.stableId) : state.completedSteps.includes(activeStep.day)) ? "Step completed" : `Complete step (+${xpAvailable} XP)`}
            </button>
            {!canComplete && <p className="muted">Answer the exercise, scenario, and quiz to complete this step.</p>}
          </Card>
        </div>
      </Section>

      {completedCount === steps.length && <CompletionScreen onRestart={resetProgress} />}
      <AchievementToast achievement={toast} onClose={() => setToast(undefined)} />
    </>
  );
}
