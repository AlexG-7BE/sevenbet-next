"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { ActionButton, ActionLink } from "@/components/design-system/Action";
import { ActiveControlProgramme } from "@/components/programme/ActiveControlProgramme";
import { authClient, useSession } from "@/lib/auth/client";
import { GOOGLE_AUTH_CALLBACK, GOOGLE_AUTH_ERROR_CALLBACK } from "@/lib/auth/google-flow";
import {
  PROGRAMME_ACCESS_HEADERS,
  PROGRAMME_ACCESS_HEADER_VALUES,
  PROGRAMME_PRIVACY_VERSION,
  PROGRAMME_TERMS_VERSION,
  type ProgrammeAccessAuthority,
} from "@/lib/programme/access-contract";
import {
  PROGRAM_AI_SENSITIVE_PURPOSE_VERSION,
  PROGRAM_AI_SENSITIVE_STATEMENT_VERSION,
  type ProgramAiBroadContext,
  type ProgrammeStartingPointValue,
} from "@/lib/programme/program-ai/contracts";
import {
  anonymousProgrammeSubject,
  clearProgrammeOAuthClaimMarker,
  clearProgrammeSubjectContent,
  hasProgrammeAccessAuthority,
  loadProgrammeSubjectContent,
  programmeAuthAccessHeaders,
  readProgrammeOAuthClaimMarker,
  rotateAnonymousProgrammeSubject,
  saveProgrammeSubjectContent,
  transitionProgrammeAccessToUserForPendingClaim,
  userProgrammeSubject,
  writeProgrammeAccessContinuation,
  writeProgrammeOAuthClaimMarker,
  type ProgrammeLocalSubject,
} from "@/lib/programme/local-subject-storage";
import styles from "./ProgramAiExperience.module.css";

type Phase =
  | "loading"
  | "access"
  | "intake"
  | "clarification"
  | "candidate"
  | "support"
  | "reward"
  | "registration"
  | "home"
  | "legacy";

type RecorderState = "idle" | "requesting" | "recording" | "cancelled" | "denied" | "transcribing" | "error";

type ProgramAiLocalState = {
  phase: Phase;
  situation: string;
  clarificationAnswers: string[];
  clarificationPrompt: string;
  candidate: ProgrammeStartingPointValue | null;
  candidateGeneration?: "PROVIDER" | "USER_CONTROLLED_FALLBACK";
  inputMode: "text" | "voice";
};

type ProgramAiHome = {
  totalXp: number;
  currentMission: number;
  startingPoint: ProgrammeStartingPointValue | null;
  missions: Array<{ missionNumber: number; status: "completed" | "current" | "locked" }>;
  reviews: Array<{ missionNumber: number; status: "available" | "locked" }>;
};

type ApiPayload<T> = { ok?: boolean; error?: string; code?: string } & T;

const emptyLocalState: ProgramAiLocalState = {
  phase: "access",
  situation: "",
  clarificationAnswers: [],
  clarificationPrompt: "",
  candidate: null,
  inputMode: "text",
};

const contextLabels: Record<ProgramAiBroadContext, string> = {
  WORK: "Work",
  HOME: "Home",
  SOCIAL: "Social situations",
  FINANCIAL_PRESSURE: "Financial pressure",
  ONLINE_ACCESS: "Online access",
  OTHER: "Another context",
  NOT_SPECIFIED: "Prefer not to specify",
};

async function programAiRequest<T>(
  path: string,
  subject: ProgrammeLocalSubject,
  init?: RequestInit,
) {
  const response = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(hasProgrammeAccessAuthority(window.sessionStorage, subject)
        ? { [PROGRAMME_ACCESS_HEADERS.age]: PROGRAMME_ACCESS_HEADER_VALUES.age }
        : {}),
      ...init?.headers,
    },
  });
  const payload = await response.json() as ApiPayload<T>;
  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.error || "This Programme step could not be completed") as Error & {
      code?: string;
      status?: number;
    };
    error.code = payload.code;
    error.status = response.status;
    throw error;
  }
  return payload;
}

function Header({ xp = 0 }: { xp?: number }) {
  return (
    <header className={styles.header}>
      <Link className={styles.wordmark} href="/">B4GAMBLE</Link>
      <span className={styles.missionLabel}>10-STEP CONTROL PROGRAM · MISSION 01</span>
      <span className={styles.xpPill}>{xp} XP</span>
    </header>
  );
}

function StatusMessage({ error, message }: { error?: string; message?: string }) {
  if (error) return <p className={styles.error} role="alert">{error}</p>;
  return message ? <p className={styles.status} role="status">{message}</p> : null;
}

function AccessScreen({ busy, error, onConfirm }: {
  busy: boolean;
  error: string;
  onConfirm: () => void;
}) {
  const [adult, setAdult] = useState(false);
  const [legal, setLegal] = useState(false);
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.accessGrid}>
        <section className={styles.heroCopy}>
          <span>PRIVATE · EVIDENCE-INFORMED · USER-CONTROLLED</span>
          <h1>Start with what is happening now.</h1>
          <p>Mission 01 helps you turn one situation into a Starting Point you can review and edit before anything is saved.</p>
          <ul><li>No diagnosis or treatment claim</li><li>No commercial personalisation</li><li>Protected Help stays available throughout</li></ul>
        </section>
        <section className={styles.accessCard} aria-labelledby="access-title">
          <span>PROGRAMME ACCESS</span>
          <h2 id="access-title">Two checks before you begin</h2>
          <label><input checked={adult} onChange={(event) => setAdult(event.target.checked)} type="checkbox" /> I confirm I am 18 or over · required</label>
          <label><input checked={legal} onChange={(event) => setLegal(event.target.checked)} type="checkbox" /> I agree to the <Link href="/terms">Terms</Link> and acknowledge the <Link href="/privacy">Privacy Notice</Link> · required</label>
          <ActionButton disabled={busy || !adult || !legal} onClick={onConfirm} size="large">
            {busy ? "Verifying access…" : "Enter Mission 01"}
          </ActionButton>
          <StatusMessage error={error} />
          <Link className={styles.helpLink} href="/responsible-gambling">Protected Help / pause options</Link>
        </section>
      </main>
    </div>
  );
}

function Recorder({ state, onState, onUseTyped }: {
  state: RecorderState;
  onState: (state: RecorderState) => void;
  onUseTyped: () => void;
}) {
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const cancelling = useRef(false);

  useEffect(() => () => stream.current?.getTracks().forEach((track) => track.stop()), []);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      onState("error");
      return;
    }
    onState("requesting");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder.current = new MediaRecorder(stream.current);
      chunks.current = [];
      recorder.current.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      recorder.current.onstop = () => {
        if (cancelling.current) {
          cancelling.current = false;
          chunks.current = [];
          stream.current?.getTracks().forEach((track) => track.stop());
          stream.current = null;
          onState("cancelled");
          return;
        }
        onState("transcribing");
        stream.current?.getTracks().forEach((track) => track.stop());
        stream.current = null;
        chunks.current = [];
        window.setTimeout(() => onState("error"), 450);
      };
      recorder.current.start();
      onState("recording");
    } catch (cause) {
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
      onState(cause instanceof DOMException && cause.name === "NotAllowedError" ? "denied" : "error");
    }
  }

  function stop() {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  function cancel() {
    if (recorder.current?.state !== "recording") return;
    cancelling.current = true;
    recorder.current.stop();
  }

  return (
    <div className={styles.recorder} data-state={state}>
      <div aria-hidden="true" className={styles.mic}>●</div>
      <div><strong>{state === "recording" ? "Listening locally" : state === "transcribing" ? "Preparing your words" : state === "denied" ? "Microphone permission was denied" : state === "cancelled" ? "Recording cancelled" : "Prefer to speak?"}</strong><small>Audio is kept in memory only and is never saved by this preview.</small></div>
      {["idle", "error", "denied", "cancelled"].includes(state) ? <button onClick={start} type="button">Start recording</button> : null}
      {state === "recording" ? <span className={styles.recorderActions}><button onClick={stop} type="button">Stop recording</button><button onClick={cancel} type="button">Cancel</button></span> : null}
      {state === "requesting" || state === "transcribing" ? <span role="status">{state === "requesting" ? "Requesting microphone…" : "Transcribing…"}</span> : null}
      {state === "error" ? <p role="alert">Voice transcription is not connected in this preview. Nothing was uploaded or stored. <button onClick={onUseTyped} type="button">Use typed input</button>.</p> : null}
      {state === "denied" ? <p role="alert">You can allow microphone access in your browser, or <button onClick={onUseTyped} type="button">use typed input</button>. Nothing was recorded.</p> : null}
      {state === "cancelled" ? <p role="status">The recording was discarded. Nothing was submitted.</p> : null}
    </div>
  );
}

function IntakeScreen({
  authorityActive,
  busy,
  error,
  situation,
  onSituation,
  onSubmit,
}: {
  authorityActive: boolean;
  busy: boolean;
  error: string;
  situation: string;
  onSituation: (value: string) => void;
  onSubmit: () => void;
}) {
  const [authority, setAuthority] = useState(authorityActive);
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  useEffect(() => setAuthority(authorityActive), [authorityActive]);
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.intakeGrid}>
        <section className={styles.heroCopy}>
          <span>MISSION 01 · YOUR SITUATION</span>
          <h1>What feels hardest to control right now?</h1>
          <p>Describe one recent or recurring situation in your own words. You decide what is accurate, what to change and whether to save the result.</p>
          <div className={styles.jitCard}>
            <strong>Before you share</strong>
            <p>Your words may include health or addiction information. B4GAMBLE may process them only to draft this Starting Point. They are not used for advertising, affiliate targeting or diagnosis.</p>
            <label><input checked={authority} disabled={busy || authorityActive} onChange={(event) => setAuthority(event.target.checked)} type="checkbox" /> I choose to share this for Programme personalisation and understand I can withdraw before saving.</label>
          </div>
          <Link className={styles.helpLink} href="/responsible-gambling">Protected Help / pause options</Link>
        </section>
        <section className={styles.inputPanel}>
          <Recorder state={recorderState} onState={setRecorderState} onUseTyped={() => setRecorderState("idle")} />
          <div className={styles.or}><span>or type it</span></div>
          <label className={styles.field}>
            <span>Your situation</span>
            <textarea autoFocus maxLength={4000} onChange={(event) => onSituation(event.target.value)} placeholder="For example: I keep opening betting apps late at night after a stressful day…" rows={8} value={situation} />
            <small>{situation.length}/4000 · Stored only in this browser session.</small>
          </label>
          <ActionButton disabled={busy || !authority || situation.trim().length < 20 || situation.trim().split(/\s+/).length < 4} onClick={onSubmit} size="large">
            {busy ? "Preparing your Starting Point…" : "Create my Starting Point"}
          </ActionButton>
          <StatusMessage error={error} />
        </section>
      </main>
    </div>
  );
}

function ClarificationScreen({ prompt, value, count, busy, error, onValue, onSubmit }: {
  prompt: string;
  value: string;
  count: number;
  busy: boolean;
  error: string;
  onValue: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className={styles.page}><Header xp={20} /><main className={styles.singlePanel}>
      <span>ONE SHORT FOLLOW-UP · {count} OF 2 MAXIMUM</span>
      <h1>{prompt}</h1>
      <p>This clarification earns no XP. It only helps make the draft more accurate.</p>
      <label className={styles.field}><span>Your answer</span><textarea autoFocus maxLength={1000} onChange={(event) => onValue(event.target.value)} rows={5} value={value} /></label>
      <ActionButton disabled={busy || value.trim().length < 2} onClick={onSubmit} size="large">Continue</ActionButton>
      <StatusMessage error={error} />
      <Link className={styles.helpLink} href="/responsible-gambling">Protected Help / pause options</Link>
    </main></div>
  );
}

function CandidateScreen({ candidate, generation, busy, error, onChange, onConfirm, onWithdraw }: {
  candidate: ProgrammeStartingPointValue;
  generation?: "PROVIDER" | "USER_CONTROLLED_FALLBACK";
  busy: boolean;
  error: string;
  onChange: (candidate: ProgrammeStartingPointValue) => void;
  onConfirm: () => void;
  onWithdraw: () => void;
}) {
  const valid = candidate.startingPoint.trim().length >= 10
    && candidate.desiredChange.trim().length >= 2
    && candidate.continuationCue.trim().length >= 2;
  return (
    <div className={styles.page}><Header xp={20} /><main className={styles.candidateGrid}>
      <section className={styles.heroCopy}><span>DRAFT · YOU ARE THE AUTHORITY</span><h1>Check your Starting Point.</h1><p>This is a draft, not a diagnosis. Edit anything that does not sound like you. Only your confirmed version can be saved after account access.</p><div className={styles.xpNote}><b>+20 XP</b><span>earned for describing the situation</span></div></section>
      <section className={styles.startingPointCard}>
        {generation === "USER_CONTROLLED_FALLBACK" ? <p className={styles.fallbackNotice} role="status"><strong>No AI provider is connected in this preview.</strong> This editable draft only carries forward words you supplied. Complete the missing fields yourself.</p> : null}
        <label className={styles.field}><span>What is happening now?</span><textarea maxLength={320} onChange={(event) => onChange({ ...candidate, startingPoint: event.target.value })} rows={4} value={candidate.startingPoint} /></label>
        <label className={styles.field}><span>What would you like to change?</span><textarea maxLength={200} onChange={(event) => onChange({ ...candidate, desiredChange: event.target.value })} placeholder="Write this in your own words" rows={3} value={candidate.desiredChange} /></label>
        <label className={styles.field}><span>Broad context</span><select onChange={(event) => onChange({ ...candidate, broadContext: event.target.value as ProgramAiBroadContext })} value={candidate.broadContext}>{Object.entries(contextLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className={styles.field}><span>What should Mission 02 continue from?</span><textarea maxLength={200} onChange={(event) => onChange({ ...candidate, continuationCue: event.target.value })} placeholder="A short cue for the next Mission" rows={3} value={candidate.continuationCue} /></label>
        <label className={styles.field}><span>Optional boundary action</span><input maxLength={200} onChange={(event) => onChange({ ...candidate, chosenBoundaryAction: event.target.value })} value={candidate.chosenBoundaryAction || ""} /></label>
        <ActionButton disabled={busy || !valid} onClick={onConfirm} size="large">{busy ? "Confirming…" : "Confirm my Starting Point"}</ActionButton>
        <button className={styles.textButton} disabled={busy} onClick={onWithdraw} type="button">Withdraw sensitive-input authority and clear this draft</button>
        <StatusMessage error={error} />
      </section>
    </main></div>
  );
}

function SupportScreen({ busy, error, onContinue }: { busy: boolean; error: string; onContinue: () => void }) {
  return (
    <div className={styles.supportPage}><Header xp={20} /><main className={styles.supportCard}>
      <span>SUPPORT FIRST</span><h1>Pause the Programme. Keep support close.</h1>
      <p>Nothing here labels or diagnoses you. If continuing does not feel right, protected Help and pause options are available now.</p>
      <div className={styles.supportActions}><ActionLink href="/responsible-gambling" size="large">Open protected Help</ActionLink><ActionButton disabled={busy} onClick={onContinue} size="large" variant="ghost-night">Continue when I’m ready</ActionButton></div>
      <StatusMessage error={error} />
      <small>Your 20 XP for describing the situation is preserved. Registration and celebration are paused on this screen.</small>
    </main></div>
  );
}

function RewardScreen({ busy, error, onContinue }: { busy: boolean; error: string; onContinue: () => void }) {
  return (
    <div className={styles.rewardPage}><Header xp={40} /><main className={styles.rewardCard}>
      <span>MISSION 01 COMPLETE</span><div className={styles.rewardNumber}>+40 XP</div><h1>Your Starting Point is ready.</h1><p>20 XP for describing the situation. 20 XP for confirming your Starting Point. Clarifications and registration add 0 XP.</p>
      <ActionButton disabled={busy} onClick={onContinue} size="large">{busy ? "Opening account step…" : "Keep this progress"}</ActionButton><StatusMessage error={error} />
    </main></div>
  );
}

function RegistrationScreen({
  authenticated,
  googleAvailable,
  busy,
  error,
  onSave,
  onEmail,
  onGoogle,
}: {
  authenticated: boolean;
  googleAvailable: boolean;
  busy: boolean;
  error: string;
  onSave: () => void;
  onEmail: (input: { email: string; password: string; mode: "sign-up" | "sign-in" }) => void;
  onGoogle: (mode: "sign-up" | "sign-in") => void;
}) {
  const [emailOpen, setEmailOpen] = useState(!googleAvailable);
  const [mode, setMode] = useState<"sign-up" | "sign-in">("sign-up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className={styles.page}><Header xp={40} /><main className={styles.registrationGrid}>
      <section className={styles.heroCopy}><span>SAVE ONLY AFTER ACCOUNT ACCESS</span><h1>Keep the Starting Point you confirmed.</h1><p>Your raw audio, provider payload and unconfirmed drafts are not saved. Registration earns 0 XP and includes no marketing consent.</p><ul><li>Confirmed Starting Point saved exactly once</li><li>Mission 01 marked complete</li><li>Continue to Mission 02</li></ul></section>
      <section className={styles.registrationCard}>
        {authenticated ? <ActionButton disabled={busy} onClick={onSave} size="large">{busy ? "Saving exactly once…" : "Save to my account"}</ActionButton> : <>
          {googleAvailable ? <ActionButton className={styles.googleButton} disabled={busy} onClick={() => onGoogle(mode)} size="large">Continue with Google</ActionButton> : null}
          <button className={styles.emailToggle} onClick={() => setEmailOpen((value) => !value)} type="button">{emailOpen ? "Hide email option" : "Use email instead"}</button>
          {emailOpen ? <form onSubmit={(event: FormEvent) => { event.preventDefault(); onEmail({ email, password, mode }); }}>
            <label className={styles.field}><span>Email</span><input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
            <label className={styles.field}><span>Password</span><input autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
            <ActionButton disabled={busy} size="large" type="submit">{mode === "sign-up" ? "Create account with email" : "Sign in with email"}</ActionButton>
            <button className={styles.textButton} onClick={() => setMode((value) => value === "sign-up" ? "sign-in" : "sign-up")} type="button">{mode === "sign-up" ? "Already have an account? Sign in" : "Need an account? Create one"}</button>
          </form> : null}
        </>}
        <StatusMessage error={error} />
        <small>Google or email provides account identity only. It is not age verification, sensitive-input authority or marketing consent.</small>
      </section>
    </main></div>
  );
}

function HomeScreen({ home, onContinue, onStart }: { home: ProgramAiHome; onContinue: () => void; onStart: () => void }) {
  const hasStartingPoint = Boolean(home.startingPoint);
  const hasCompletedMissionOne = home.missions.some((mission) => mission.missionNumber === 1 && mission.status === "completed");
  const continueExistingProgress = hasStartingPoint || hasCompletedMissionOne || home.currentMission > 1;
  return (
    <div className={styles.page}><Header xp={home.totalXp} /><main className={styles.home}>
      <section className={styles.homeHero}><div><span>MY PROGRAMME</span><h1>{continueExistingProgress ? `Continue with Mission ${home.currentMission}.` : "Your private Programme is ready."}</h1><p>{home.startingPoint?.continuationCue || (continueExistingProgress ? "Your existing Programme progress remains in control." : "Start Mission 01 when you are ready.")}</p></div><ActionButton onClick={continueExistingProgress ? onContinue : onStart} size="large">{continueExistingProgress ? `Continue Mission ${home.currentMission}` : "Start Mission 01"}</ActionButton></section>
      {home.startingPoint ? <article className={styles.homeStartingPoint}><span>YOUR STARTING POINT</span><h2>{home.startingPoint.startingPoint}</h2><p>{home.startingPoint.desiredChange}</p><small>{contextLabels[home.startingPoint.broadContext]}</small></article> : null}
      <section><div className={styles.sectionHeading}><span>THE 10-STEP PATH</span><h2>Progress is shown as completed, current or locked.</h2></div><div className={styles.missionPath}>{Array.from({ length: 10 }, (_, index) => { const item = home.missions.find((mission) => mission.missionNumber === index + 1); return <article data-state={item?.status || (index === 0 ? "current" : "locked")} key={index}><span>{String(index + 1).padStart(2, "0")}</span><b>Mission {String(index + 1).padStart(2, "0")}</b><small>{item?.status || (index === 0 ? "current" : "locked")}</small></article>; })}</div></section>
      <section><div className={styles.sectionHeading}><span>REVIEWS</span><h2>Only the approved review moments unlock.</h2></div><div className={styles.reviews}>{[3, 6, 10].map((missionNumber) => { const review = home.reviews.find((item) => item.missionNumber === missionNumber); return <article key={missionNumber}><span>AFTER MISSION {missionNumber}</span><h3>{missionNumber === 3 ? "Starting Point review" : missionNumber === 6 ? "Mid-programme review" : "Ten-step review"}</h3><p>{review?.status === "available" ? "Available now" : `Unlocks after Mission ${missionNumber}`}</p></article>; })}</div></section>
    </main></div>
  );
}

export function ProgramAiExperience({ googleAvailable = false }: { googleAvailable?: boolean }) {
  const { data: session, isPending: sessionPending } = useSession();
  const [phase, setPhase] = useState<Phase>("loading");
  const [subject, setSubject] = useState<ProgrammeLocalSubject | null>(null);
  const [local, setLocal] = useState<ProgramAiLocalState>(emptyLocalState);
  const [home, setHome] = useState<ProgramAiHome | null>(null);
  const [clarificationValue, setClarificationValue] = useState("");
  const [sensitiveAuthorityActive, setSensitiveAuthorityActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const oauthRedeemStarted = useRef(false);
  const emailRedeemStarted = useRef(false);

  const persist = useCallback((next: ProgramAiLocalState, exactSubject = subject) => {
    setLocal(next);
    setPhase(next.phase);
    if (exactSubject) saveProgrammeSubjectContent(window.sessionStorage, exactSubject, { programAi: next });
  }, [subject]);

  const redeem = useCallback(async (userId: string, journey: ProgrammeLocalSubject, state: ProgramAiLocalState) => {
    if (!state.candidate) throw new Error("Your confirmed Starting Point is unavailable in this browser session");
    const payload = await programAiRequest<{ home: ProgramAiHome }>(
      "/api/program/program-ai/claims/redeem",
      journey,
      {
        method: "POST",
        body: JSON.stringify({
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          startingPoint: state.candidate,
        }),
      },
    );
    transitionProgrammeAccessToUserForPendingClaim(window.sessionStorage, journey, userProgrammeSubject(userId));
    clearProgrammeOAuthClaimMarker(window.sessionStorage);
    clearProgrammeSubjectContent(window.sessionStorage, journey);
    setSubject(userProgrammeSubject(userId));
    setHome(payload.home);
    setPhase("home");
  }, []);

  useEffect(() => {
    if (sessionPending) return;
    const oauthJourney = readProgrammeOAuthClaimMarker(window.sessionStorage);
    if (session?.user.id && oauthJourney) {
      const restored = loadProgrammeSubjectContent<{ programAi: ProgramAiLocalState }>(window.sessionStorage, oauthJourney).programAi;
      setSubject(oauthJourney);
      if (restored) setLocal(restored);
      setPhase("registration");
      if (!oauthRedeemStarted.current && restored?.candidate) {
        oauthRedeemStarted.current = true;
        setBusy(true);
        redeem(session.user.id, oauthJourney, restored)
          .catch((cause) => setError(cause instanceof Error ? cause.message : "Your progress could not be saved yet"))
          .finally(() => { setBusy(false); oauthRedeemStarted.current = false; });
      }
      return;
    }
    if (session?.user.id && emailRedeemStarted.current) return;
    if (session?.user.id) {
      const userSubject = userProgrammeSubject(session.user.id);
      setSubject(userSubject);
      fetch("/api/program/program-ai/home", { credentials: "same-origin", cache: "no-store" })
        .then(async (response) => {
          const payload = await response.json() as ApiPayload<{ home: ProgramAiHome }>;
          if (!response.ok || !payload.home) throw new Error(payload.error || "Programme home unavailable");
          setHome(payload.home);
          setPhase("home");
        })
        .catch((cause) => { setError(cause instanceof Error ? cause.message : "Programme home unavailable"); setPhase("home"); });
      return;
    }
    const journey = anonymousProgrammeSubject(window.sessionStorage);
    const restored = loadProgrammeSubjectContent<{ programAi: ProgramAiLocalState }>(window.sessionStorage, journey).programAi;
    const accessActive = hasProgrammeAccessAuthority(window.sessionStorage, journey);
    setSubject(journey);
    setLocal(restored || emptyLocalState);
    setPhase(restored?.phase && restored.phase !== "home" ? restored.phase : accessActive ? "intake" : "access");
    if (accessActive) {
      programAiRequest<{ authority: { active: boolean } }>("/api/program/program-ai/authority", journey)
        .then((payload) => setSensitiveAuthorityActive(Boolean(payload.authority?.active)))
        .catch(() => setSensitiveAuthorityActive(false));
    } else {
      setSensitiveAuthorityActive(false);
    }
  }, [redeem, session?.user.id, sessionPending]);

  async function grantAccess() {
    if (!subject) return;
    setBusy(true); setError("");
    try {
      const journey = subject.kind === "journey" ? subject : rotateAnonymousProgrammeSubject(window.sessionStorage);
      const response = await fetch("/api/programme-access/authority", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          journeyId: journey.id,
          adultConfirmed: true,
          termsAccepted: true,
          privacyAcknowledged: true,
          termsVersion: PROGRAMME_TERMS_VERSION,
          privacyVersion: PROGRAMME_PRIVACY_VERSION,
        }),
      });
      const payload = await response.json() as ApiPayload<{ authority: ProgrammeAccessAuthority }>;
      if (!response.ok || !payload.authority) throw new Error("Current access could not be verified. Try again.");
      writeProgrammeAccessContinuation(window.sessionStorage, journey, payload.authority);
      await programAiRequest("/api/program/program-ai/session", journey, {
        method: "POST",
        headers: programmeAuthAccessHeaders(window.sessionStorage, journey),
      });
      setSensitiveAuthorityActive(false);
      setSubject(journey);
      persist({ ...emptyLocalState, phase: "intake" }, journey);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Current access could not be verified");
    } finally { setBusy(false); }
  }

  async function submitTurn(answers = local.clarificationAnswers, confirmSensitiveAuthority = false) {
    if (!subject) return;
    setBusy(true); setError("");
    try {
      if (confirmSensitiveAuthority && !sensitiveAuthorityActive) {
        await programAiRequest("/api/program/program-ai/authority", subject, {
          method: "POST",
          body: JSON.stringify({
            confirmed: true,
            purposeVersion: PROGRAM_AI_SENSITIVE_PURPOSE_VERSION,
            statementVersion: PROGRAM_AI_SENSITIVE_STATEMENT_VERSION,
          }),
        });
        setSensitiveAuthorityActive(true);
      }
      const payload = await programAiRequest<{
        result: {
          kind: "CLARIFICATION_REQUIRED" | "STARTING_POINT_CANDIDATE";
          prompt?: string;
          candidate?: ProgrammeStartingPointValue;
          generation?: "PROVIDER" | "USER_CONTROLLED_FALLBACK";
          disposition: "CONTINUE" | "SUPPORT_FIRST";
        };
      }>("/api/program/program-ai/turn", subject, {
        method: "POST",
        body: JSON.stringify({ inputMode: local.inputMode, situation: local.situation, clarificationAnswers: answers }),
      });
      if (payload.result.disposition === "SUPPORT_FIRST") {
        persist({ ...local, clarificationAnswers: answers, candidate: payload.result.candidate || local.candidate, candidateGeneration: payload.result.generation || local.candidateGeneration, phase: "support" });
      } else if (payload.result.kind === "CLARIFICATION_REQUIRED") {
        persist({ ...local, clarificationAnswers: answers, clarificationPrompt: payload.result.prompt || "What would feel different if this situation were more under your control?", phase: "clarification" });
      } else if (payload.result.candidate) {
        persist({ ...local, clarificationAnswers: answers, candidate: payload.result.candidate, candidateGeneration: payload.result.generation, phase: "candidate" });
      }
    } catch (cause) {
      const requestError = cause as Error & { code?: string };
      if (requestError.code === "SENSITIVE_INPUT_AUTHORITY_REQUIRED") {
        setSensitiveAuthorityActive(false);
        persist({ ...local, clarificationAnswers: [], clarificationPrompt: "", phase: "intake" });
      }
      setError(cause instanceof Error ? cause.message : "Your Starting Point could not be prepared");
    }
    finally { setBusy(false); }
  }

  async function submitClarification() {
    const answers = [...local.clarificationAnswers, clarificationValue.trim()].slice(0, 2);
    setClarificationValue("");
    await submitTurn(answers);
  }

  async function continueAfterSupport() {
    if (!subject) return;
    setBusy(true); setError("");
    try {
      await programAiRequest("/api/program/program-ai/support/continue", subject, { method: "POST" });
      persist({ ...local, phase: local.candidate ? "candidate" : "intake" });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The Programme could not resume"); }
    finally { setBusy(false); }
  }

  async function confirmStartingPoint() {
    if (!subject || !local.candidate) return;
    setBusy(true); setError("");
    try {
      await programAiRequest("/api/program/program-ai/starting-point", subject, { method: "POST", body: JSON.stringify(local.candidate) });
      persist({ ...local, phase: "reward" });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Your Starting Point could not be confirmed"); }
    finally { setBusy(false); }
  }

  async function withdrawSensitiveInput() {
    if (!subject) return;
    setBusy(true); setError("");
    try {
      await programAiRequest("/api/program/program-ai/authority", subject, { method: "DELETE" });
      setSensitiveAuthorityActive(false);
      persist({ ...emptyLocalState, phase: "intake" });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Authority could not be withdrawn"); }
    finally { setBusy(false); }
  }

  async function openRegistration() {
    if (!subject) return;
    setBusy(true); setError("");
    try {
      await programAiRequest("/api/program/program-ai/claim", subject, { method: "POST" });
      persist({ ...local, phase: "registration" });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The account step could not be opened"); }
    finally { setBusy(false); }
  }

  async function saveAuthenticated() {
    if (!session?.user.id || !subject) return;
    setBusy(true); setError("");
    try { await redeem(session.user.id, subject, local); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Your progress could not be saved yet"); }
    finally { setBusy(false); }
  }

  async function handleEmail(input: { email: string; password: string; mode: "sign-up" | "sign-in" }) {
    if (!subject) return;
    emailRedeemStarted.current = true;
    setBusy(true); setError("");
    try {
      const result = input.mode === "sign-up"
        ? await authClient.signUp.email({ email: input.email.trim().toLowerCase(), password: input.password, name: input.email.split("@")[0] || "B4GAMBLE member", fetchOptions: { headers: programmeAuthAccessHeaders(window.sessionStorage, subject) } })
        : await authClient.signIn.email({ email: input.email.trim().toLowerCase(), password: input.password });
      if (result.error || !result.data?.user.id) throw new Error(input.mode === "sign-up" ? "This account could not be created. Try signing in if it already exists." : "Email or password is incorrect.");
      await redeem(result.data.user.id, subject, local);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Account access failed"); }
    finally { emailRedeemStarted.current = false; setBusy(false); }
  }

  async function handleGoogle(mode: "sign-up" | "sign-in") {
    if (!subject || subject.kind !== "journey") return;
    setBusy(true); setError("");
    try {
      writeProgrammeOAuthClaimMarker(window.sessionStorage, subject);
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: GOOGLE_AUTH_CALLBACK,
        errorCallbackURL: GOOGLE_AUTH_ERROR_CALLBACK,
        requestSignUp: mode === "sign-up",
        fetchOptions: { headers: programmeAuthAccessHeaders(window.sessionStorage, subject) },
      });
      if (result.error) throw new Error("Google account access could not be started");
    } catch (cause) {
      clearProgrammeOAuthClaimMarker(window.sessionStorage);
      setError(cause instanceof Error ? cause.message : "Google account access failed");
      setBusy(false);
    }
  }

  function startFromHome() {
    const journey = rotateAnonymousProgrammeSubject(window.sessionStorage);
    setSubject(journey);
    setLocal(emptyLocalState);
    setSensitiveAuthorityActive(false);
    setPhase("access");
    setHome(null);
  }

  if (phase === "legacy") return <ActiveControlProgramme googleAvailable={googleAvailable} />;
  if (phase === "loading" || sessionPending) return <div className={styles.page}><Header /><main className={styles.singlePanel}><p role="status">Loading your private Programme session…</p><Link href="/responsible-gambling">Protected Help remains available.</Link></main></div>;
  if (phase === "access") return <AccessScreen busy={busy} error={error} onConfirm={grantAccess} />;
  if (phase === "intake") return <IntakeScreen authorityActive={sensitiveAuthorityActive} busy={busy} error={error} onSituation={(situation) => { const next = { ...local, situation, inputMode: "text" as const }; setLocal(next); if (subject) saveProgrammeSubjectContent(window.sessionStorage, subject, { programAi: next }); }} onSubmit={() => submitTurn(local.clarificationAnswers, true)} situation={local.situation} />;
  if (phase === "clarification") return <ClarificationScreen busy={busy} count={local.clarificationAnswers.length + 1} error={error} onSubmit={submitClarification} onValue={setClarificationValue} prompt={local.clarificationPrompt} value={clarificationValue} />;
  if (phase === "candidate" && local.candidate) return <CandidateScreen busy={busy} candidate={local.candidate} error={error} generation={local.candidateGeneration} onChange={(candidate) => persist({ ...local, candidate })} onConfirm={confirmStartingPoint} onWithdraw={withdrawSensitiveInput} />;
  if (phase === "support") return <SupportScreen busy={busy} error={error} onContinue={continueAfterSupport} />;
  if (phase === "reward") return <RewardScreen busy={busy} error={error} onContinue={openRegistration} />;
  if (phase === "registration") return <RegistrationScreen authenticated={Boolean(session?.user.id)} busy={busy} error={error} googleAvailable={googleAvailable} onEmail={handleEmail} onGoogle={handleGoogle} onSave={saveAuthenticated} />;
  if (phase === "home") return <HomeScreen home={home || { totalXp: 0, currentMission: 1, startingPoint: null, missions: [], reviews: [] }} onContinue={() => setPhase("legacy")} onStart={startFromHome} />;
  return <AccessScreen busy={busy} error={error} onConfirm={grantAccess} />;
}
