"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { programSteps as fallbackProgramSteps, type ProgramStep } from "@/lib/program";
import { Badge, Button, Card, Container, CTA, Section } from "@/components/ui";
import { useSession } from "@/lib/auth/client";
import {
  applyServerProgress,
  buildLocalMergePayload,
  hasLocalProgramProgress,
  initialProgramState,
  normalizeLocalProgramState,
  preserveDeviceProgress,
  resolveProgressAfterSave,
  shouldOfferProgressMerge,
  type ProgramClientState,
} from "@/lib/progress/client-state";
import type {
  ServerProgramState,
  UserProgressResponse,
} from "@/lib/progress/types";
import type { AchievementSummary } from "@/lib/rewards/types";

const STORAGE_KEY = "sevenbet-program-progress-v1";

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
  source,
}: {
  activeStep: number;
  completedCount: number;
  total: number;
  xp: number;
  streak: number;
  source: "server" | "device";
}) {
  const progress = Math.round((completedCount / total) * 100);

  return (
    <Card className="programHeader" tone="soft">
      <div>
        <Badge tone="green">Step {activeStep} of {total}</Badge>
        <h2>{progress}% complete</h2>
        <p className="muted">
          {source === "server"
            ? "Completion progress is saved to your account."
            : "Progress is saved in this browser."} Each step is designed to take 5-10 calm minutes.
        </p>
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
  source,
  rewardSource,
}: {
  steps: ProgramStep[];
  state: ProgramClientState;
  onSelect: (step: number) => void;
  source: "server" | "device";
  rewardSource: "server" | "device";
}) {
  const completedCount =
    state.completedStepIds?.length || state.completedSteps.length;
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
            <div><span>{rewardSource === "server" ? "Account educational XP" : "Local educational XP"}</span><strong>{state.xp}</strong></div>
            <div><span>Completion source</span><strong>{source === "server" ? "Account" : "This device"}</strong></div>
            <div><span>Recommended next lesson</span><strong>{nextStep.title}</strong></div>
            <div><span>Daily streak</span><strong>{state.streak >= 2 ? `${state.streak} days` : "Shown after consecutive days"}</strong></div>
          </div>
        </Card>
        <Card className="guideCard">
          <Badge tone="green">Achievements</Badge>
          <h3>{rewardSource === "server" ? "Account achievements" : "Local achievement badges"}</h3>
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

export function CompletionScreen({
  onRestart,
  source,
}: {
  onRestart: () => void;
  source: "server" | "device";
}) {
  return (
    <Section eyebrow="Program complete" title="You completed the 10-Step Control Program.">
      <CTA
        title="Use your plan before comparing casino information."
        intro="Completion is not a prompt to gamble. It is a checkpoint for calmer, better-informed decisions."
        primary={{ href: "/responsible-gambling", label: "Responsible Gambling Hub" }}
        secondary={{ href: "/casinos", label: "Browse Casino Reviews" }}
      />
      <div className="sectionButton">
        <button className="button ghost" onClick={onRestart} type="button">
          {source === "server" ? "Clear device-only answers" : "Restart local progress"}
        </button>
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

async function progressRequest(path: string, body?: object) {
  const response = await fetch(path, {
    method: body ? "POST" : "GET",
    credentials: "same-origin",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = (await response.json()) as ServerProgramState & {
    ok?: boolean;
    error?: string;
  };
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Progress could not be saved");
  }
  return payload;
}

export function ProgramExperience({
  steps = fallbackProgramSteps,
  programId,
}: {
  steps?: ProgramStep[];
  programId?: string;
}) {
  const { data: session, isPending: sessionPending } = useSession();
  const [state, setState] = useState<ProgramClientState>(initialProgramState);
  const [toast, setToast] = useState<string>();
  const [localReady, setLocalReady] = useState(false);
  const [hydrationStatus, setHydrationStatus] = useState<
    "idle" | "loading" | "ready"
  >("idle");
  const [serverProgress, setServerProgress] =
    useState<UserProgressResponse | null>(null);
  const [serverXp, setServerXp] = useState(0);
  const [serverAchievements, setServerAchievements] = useState<
    AchievementSummary[]
  >([]);
  const [xpAwardNotice, setXpAwardNotice] = useState(0);
  const [serverRewardsReady, setServerRewardsReady] = useState(false);
  const [hasEnrollment, setHasEnrollment] = useState(false);
  const [mergeOffer, setMergeOffer] = useState(false);
  const [mergeDecision, setMergeDecision] = useState<
    "saved" | "device" | null
  >(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const localSnapshot = useRef<ProgramClientState>(initialProgramState);
  const userId = session?.user.id;
  const mergeMarkerKey =
    userId && programId
      ? `sevenbet-program-merge-v1:${userId}:${programId}`
      : null;
  const activeStep = steps.find((step) => step.stableId && step.stableId === state.activeStepId) || steps.find((step) => step.day === state.activeStep) || steps[0];

  const consumeServerState = useCallback(
    (result: ServerProgramState, notify = true) => {
      setServerProgress(result.progress);
      setServerXp(result.xp.total);
      setServerAchievements(result.achievements.allUnlocked);
      setServerRewardsReady(true);
      if (notify && result.xp.awardedNow > 0) {
        setXpAwardNotice((current) => current + result.xp.awardedNow);
      }
      if (notify && result.achievements.newlyUnlocked.length > 0) {
        setToast(result.achievements.newlyUnlocked.at(-1)?.title);
      }
      if (result.progress) {
        setState((current) =>
          applyServerProgress(current, result.progress as UserProgressResponse, steps),
        );
      }
      return result.progress;
    },
    [steps],
  );

  useEffect(() => {
    let parsed: unknown = null;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      parsed = saved ? JSON.parse(saved) : null;
    } catch {
      parsed = null;
    }
    const normalized = normalizeLocalProgramState(parsed, steps);
    const diff = dayDifference(normalized.lastVisitDate);
    const nextState = {
      ...normalized,
      streak:
        diff === 1
          ? normalized.streak + 1
          : diff === 0
            ? normalized.streak
            : 1,
      lastVisitDate: todayKey(),
    };
    localSnapshot.current = nextState;
    setState(nextState);
    setLocalReady(true);
  }, [steps]);

  useEffect(() => {
    if (
      !localReady ||
      (serverProgress && (mergeOffer || mergeDecision === "device"))
    ) {
      return;
    }
    const deviceState = serverProgress
      ? preserveDeviceProgress(localSnapshot.current, state, steps)
      : state;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deviceState));
    localSnapshot.current = deviceState;
  }, [localReady, mergeDecision, mergeOffer, serverProgress, state, steps]);

  useEffect(() => {
    if (!localReady || sessionPending) return;

    if (!userId || !programId) {
      setServerProgress(null);
      setServerXp(0);
      setServerAchievements([]);
      setServerRewardsReady(false);
      setHasEnrollment(false);
      setMergeOffer(false);
      setHydrationStatus("ready");
      setState(localSnapshot.current);
      return;
    }

    let cancelled = false;
    setServerProgress(null);
    setServerRewardsReady(false);
    setHasEnrollment(false);
    setMergeOffer(false);
    setMergeDecision(null);
    setState(localSnapshot.current);
    setHydrationStatus("loading");
    void progressRequest(
      `/api/program/progress?programId=${encodeURIComponent(programId)}`,
    )
      .then((result) => {
        if (cancelled) return;
        const progress = consumeServerState(result, false);
        const decision = mergeMarkerKey
          ? (window.localStorage.getItem(mergeMarkerKey) as
              | "saved"
              | "device"
              | null)
          : null;
        setMergeDecision(decision);
        setHasEnrollment(Boolean(progress));
        setMergeOffer(
          !decision &&
            shouldOfferProgressMerge(localSnapshot.current, progress, steps),
        );
        setHydrationStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setSaveStatus("error");
        setSaveMessage("Account progress is unavailable. Device progress is still safe.");
        setHydrationStatus("ready");
      });

    return () => {
      cancelled = true;
    };
  }, [consumeServerState, localReady, mergeMarkerKey, programId, sessionPending, steps, userId]);

  const progressSource = serverProgress ? "server" : "device";
  const rewardSource = serverRewardsReady ? "server" : "device";
  const canonicalState =
    progressSource === "server" && serverProgress
      ? applyServerProgress(state, serverProgress, steps)
      : state;
  const dashboardState =
    rewardSource === "server"
      ? {
          ...canonicalState,
          xp: serverXp,
          achievements: serverAchievements.map((achievement) => achievement.title),
        }
      : canonicalState;
  const completedCount =
    canonicalState.completedStepIds?.length ||
    canonicalState.completedSteps.length;
  const selectedScenario = state.scenarioAnswers[activeStep.day];
  const selectedQuiz = state.quizAnswers[activeStep.day];
  const exerciseAnswer = state.answers[`exercise-${activeStep.day}`] || "";
  const canComplete = exerciseAnswer.trim().length >= 8 && selectedScenario !== undefined && selectedQuiz !== undefined;

  const xpAvailable = useMemo(() => stepXp(activeStep), [activeStep]);

  function updateState(partial: Partial<ProgramClientState>) {
    setState((current) => ({ ...current, ...partial }));
  }

  async function saveAction(path: string, body: object) {
    if (!hasEnrollment) return null;
    setSaveStatus("saving");
    setSaveMessage("Saving progress...");
    try {
      const result = await progressRequest(path, body);
      const progress = consumeServerState(result);
      setSaveStatus("saved");
      setSaveMessage(
        result.xp.awardedNow > 0
          ? `Progress saved. +${result.xp.awardedNow} account XP.`
          : "Progress saved to your account.",
      );
      return progress;
    } catch {
      setSaveStatus("error");
      setSaveMessage("Could not save right now. Your device progress was not reset.");
      return null;
    }
  }

  async function startSavedProgress() {
    if (!programId) return;
    setSaveStatus("saving");
    setSaveMessage("Starting saved progress...");
    try {
      const result = await progressRequest("/api/program/progress/start", {
        programId,
      });
      const progress = consumeServerState(result, false);
      if (progress) {
        setHasEnrollment(true);
      }
      setSaveStatus("saved");
      setSaveMessage("Future completion progress will be saved to your account.");
    } catch {
      setSaveStatus("error");
      setSaveMessage("Could not start account saving. You can continue on this device.");
    }
  }

  async function mergeProgress() {
    if (!programId || !mergeMarkerKey) return;
    setSaveStatus("saving");
    setSaveMessage("Saving device progress to your account...");
    try {
      const result = await progressRequest("/api/program/progress/merge", {
        ...buildLocalMergePayload(programId, localSnapshot.current, steps),
      });
      const progress = consumeServerState(result);
      if (progress) {
        setHasEnrollment(true);
      }
      window.localStorage.setItem(mergeMarkerKey, "saved");
      setMergeDecision("saved");
      setMergeOffer(false);
      setSaveStatus("saved");
      setSaveMessage(
        result.xp.awardedNow > 0
          ? `Device progress saved. +${result.xp.awardedNow} account XP.`
          : "Device progress was saved to your account.",
      );
    } catch {
      setSaveStatus("error");
      setSaveMessage("Merge was not completed. Device progress remains unchanged.");
    }
  }

  function keepProgressOnDevice() {
    if (mergeMarkerKey) window.localStorage.setItem(mergeMarkerKey, "device");
    setMergeDecision("device");
    setMergeOffer(false);
    setSaveStatus("idle");
    setSaveMessage("The device copy was not merged and remains unchanged.");
  }

  function selectStep(day: number) {
    const step = steps.find((item) => item.day === day);
    updateState({ activeStep: day, activeStepId: step?.stableId });
    const serverOrder = steps.findIndex(
      (item) => item.stableId === serverProgress?.currentStepId,
    );
    const targetOrder = steps.findIndex((item) => item.day === day);
    if (
      hasEnrollment &&
      programId &&
      step?.stableId &&
      targetOrder > serverOrder
    ) {
      void saveAction("/api/program/progress/current-step", {
        programId,
        stepId: step.stableId,
      });
    }
  }

  async function saveCompletedStep(
    step: ProgramStep,
    exerciseResponse: string,
    scenarioAnswer: number,
    quizAnswer: number,
    programCompleted: boolean,
  ) {
    if (!hasEnrollment || !programId || !step.stableId) return;
    setSaveStatus("saving");
    setSaveMessage("Saving completed activities...");
    try {
      let progress: UserProgressResponse | null = null;
      let awardedNow = 0;
      if (step.exerciseBlockId) {
        const result = await progressRequest("/api/program/progress/exercise", {
          programId,
          blockId: step.exerciseBlockId,
          response: exerciseResponse,
        });
        awardedNow += result.xp.awardedNow;
        progress = consumeServerState(result);
      }
      if (step.scenarioBlockId) {
        const result = await progressRequest("/api/program/progress/scenario", {
          programId,
          blockId: step.scenarioBlockId,
          answerIndex: scenarioAnswer,
        });
        awardedNow += result.xp.awardedNow;
        progress = consumeServerState(result);
      }
      if (step.quizBlockId) {
        const result = await progressRequest("/api/program/progress/quiz", {
          programId,
          blockId: step.quizBlockId,
          answerIndex: quizAnswer,
        });
        awardedNow += result.xp.awardedNow;
        progress = consumeServerState(result);
      }
      if (step.lessonId) {
        const result = await progressRequest("/api/program/progress/lesson", {
          programId,
          lessonId: step.lessonId,
        });
        awardedNow += result.xp.awardedNow;
        progress = consumeServerState(result);
      }
      const stepResult = await progressRequest("/api/program/progress/step", {
        programId,
        stepId: step.stableId,
      });
      awardedNow += stepResult.xp.awardedNow;
      progress = consumeServerState(stepResult);
      if (programCompleted) {
        const result = await progressRequest("/api/program/progress/complete", {
          programId,
        });
        awardedNow += result.xp.awardedNow;
        progress = consumeServerState(result);
      }
      if (progress) {
        setState((current) => resolveProgressAfterSave(current, progress, steps));
      }
      setSaveStatus("saved");
      setSaveMessage(
        awardedNow > 0
          ? `Completion saved. +${awardedNow} account XP.`
          : "Completion progress saved to your account.",
      );
    } catch {
      setSaveStatus("error");
      setSaveMessage("Account save failed. Your device progress remains available.");
    }
  }

  function completeStep() {
    const alreadyCompleted = activeStep.stableId
      ? state.completedStepIds?.includes(activeStep.stableId)
      : state.completedSteps.includes(activeStep.day);
    const completedOnServer = activeStep.stableId
      ? serverProgress?.completedStepIds.includes(activeStep.stableId)
      : false;
    const needsAccountRetry = Boolean(
      hasEnrollment && alreadyCompleted && !completedOnServer,
    );
    if (!canComplete || (alreadyCompleted && !needsAccountRetry)) return;

    if (needsAccountRetry) {
      void saveCompletedStep(
        activeStep,
        exerciseAnswer,
        selectedScenario,
        selectedQuiz,
        state.completedSteps.length === steps.length,
      );
      return;
    }

    const completedSteps = unique([...state.completedSteps, activeStep.day]).sort((a, b) => a - b);
    const completedStepIds = activeStep.stableId ? unique([...(state.completedStepIds || []), activeStep.stableId]) : state.completedStepIds;
    const previousAchievements = state.achievements;
    const nextAchievements =
      rewardSource === "server"
        ? previousAchievements
        : unique([...previousAchievements, ...achievementsFor(completedSteps)]);
    const newAchievement = nextAchievements.find((achievement) => !previousAchievements.includes(achievement));
    const nextStep = steps.find((step) => step.stableId ? !completedStepIds?.includes(step.stableId) : !completedSteps.includes(step.day));

    setState((current) => ({
      ...current,
      completedSteps,
      completedStepIds,
      achievements: nextAchievements,
      xp: rewardSource === "server" ? current.xp : current.xp + xpAvailable,
      activeStep: nextStep?.day || activeStep.day,
      activeStepId: nextStep?.stableId || activeStep.stableId,
    }));

    if (rewardSource === "device" && newAchievement) setToast(newAchievement);

    void saveCompletedStep(
      activeStep,
      exerciseAnswer,
      selectedScenario,
      selectedQuiz,
      completedSteps.length === steps.length,
    );
  }

  function resetProgress() {
    window.localStorage.removeItem(STORAGE_KEY);
    const reset = { ...initialProgramState, lastVisitDate: todayKey() };
    localSnapshot.current = reset;
    setState(
      serverProgress ? applyServerProgress(reset, serverProgress, steps) : reset,
    );
  }

  const waitingForHydration = Boolean(
    !localReady ||
      sessionPending ||
      (userId && programId &&
        (hydrationStatus === "idle" || hydrationStatus === "loading")),
  );
  const activeStepCompleted = activeStep.stableId
    ? state.completedStepIds?.includes(activeStep.stableId)
    : state.completedSteps.includes(activeStep.day);
  const activeStepCompletedOnServer = activeStep.stableId
    ? serverProgress?.completedStepIds.includes(activeStep.stableId)
    : false;
  const canRetryAccountSave = Boolean(
    hasEnrollment && activeStepCompleted && !activeStepCompletedOnServer,
  );

  if (waitingForHydration) {
    return (
      <section className="pageShell">
        <Container className="narrow">
          <Card tone="soft">
            <Badge tone="green">Program progress</Badge>
            <h1>The SevenBet 10-Step Control Program</h1>
            <p className="lead">Loading your saved progress...</p>
          </Card>
        </Container>
      </section>
    );
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
            <Badge>{progressSource === "server" ? "Account progress active" : "Progress saved locally"}</Badge>
            <Badge tone="dark">Educational XP</Badge>
            <Badge tone="warning">No pressure to continue</Badge>
          </div>
        </Container>
      </section>

      {mergeOffer && (
        <Section eyebrow="Optional account saving" title="Save your progress to your account">
          <Card className="verificationPanel" tone="soft">
            <p className="muted">
              You have progress on this device. Save verified completion facts to your account, or keep this device copy separate.
            </p>
            <div className="heroActions">
              <button className="button gold" onClick={() => void mergeProgress()} type="button">
                Save progress
              </button>
              <button className="button ghost" onClick={keepProgressOnDevice} type="button">
                Keep on this device
              </button>
            </div>
          </Card>
        </Section>
      )}

      {userId && programId && !hasEnrollment && !mergeOffer && mergeDecision !== "device" && !hasLocalProgramProgress(state) && (
        <Section eyebrow="Account progress" title="Save future progress across sessions">
          <Card tone="soft">
            <p className="muted">Starting account progress is optional. Nothing is created until you choose this action.</p>
            <button className="button gold" onClick={() => void startSavedProgress()} type="button">
              Start saved progress
            </button>
          </Card>
        </Section>
      )}

      {(saveMessage || saveStatus !== "idle") && (
        <Container>
          <p className={`programSaveStatus ${saveStatus}`} role="status">
            {saveMessage}
          </p>
        </Container>
      )}

      {xpAwardNotice > 0 && rewardSource === "server" && (
        <Container>
          <p className="programSaveStatus saved" role="status">
            +{xpAwardNotice} educational XP added to your account.
            <button
              className="programStatusDismiss"
              onClick={() => setXpAwardNotice(0)}
              type="button"
              aria-label="Dismiss XP notification"
            >
              x
            </button>
          </p>
        </Container>
      )}

      <div id="program-dashboard">
        <Dashboard
          steps={steps}
          state={dashboardState}
          source={progressSource}
          rewardSource={rewardSource}
          onSelect={selectStep}
        />
      </div>

      <Section eyebrow="Progress" title="Move through the steps at your own pace.">
        <ProgressHeader
          activeStep={state.activeStep}
          completedCount={completedCount}
          total={steps.length}
          xp={rewardSource === "server" ? serverXp : state.xp}
          streak={state.streak}
          source={progressSource}
        />
        <ProgressTimeline
          steps={steps}
          activeStep={state.activeStep}
          completedSteps={canonicalState.completedSteps}
          completedStepIds={canonicalState.completedStepIds}
          onSelect={selectStep}
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
            onSelect={(index) => {
              updateState({
                scenarioAnswers: {
                  ...state.scenarioAnswers,
                  [activeStep.day]: index,
                },
              });
              if (hasEnrollment && programId && activeStep.scenarioBlockId) {
                void saveAction("/api/program/progress/scenario", {
                  programId,
                  blockId: activeStep.scenarioBlockId,
                  answerIndex: index,
                });
              }
            }}
          />
          <QuizCard
            step={activeStep}
            selected={selectedQuiz}
            onSelect={(index) => {
              updateState({
                quizAnswers: {
                  ...state.quizAnswers,
                  [activeStep.day]: index,
                },
              });
              if (hasEnrollment && programId && activeStep.quizBlockId) {
                void saveAction("/api/program/progress/quiz", {
                  programId,
                  blockId: activeStep.quizBlockId,
                  answerIndex: index,
                });
              }
            }}
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
              disabled={!canComplete || (activeStepCompleted && !canRetryAccountSave)}
              onClick={completeStep}
              type="button"
            >
              {canRetryAccountSave
                ? "Retry account save"
                : activeStepCompleted
                  ? "Step completed"
                  : rewardSource === "server"
                    ? "Complete step"
                    : `Complete step (+${xpAvailable} local XP)`}
            </button>
            {!canComplete && <p className="muted">Answer the exercise, scenario, and quiz to complete this step.</p>}
          </Card>
        </div>
      </Section>

      {completedCount === steps.length && <CompletionScreen onRestart={resetProgress} source={progressSource} />}
      <AchievementToast achievement={toast} onClose={() => setToast(undefined)} />
    </>
  );
}
