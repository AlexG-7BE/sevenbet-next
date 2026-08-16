"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import { ActionButton, ActionLink } from "@/components/design-system/Action";
import { ProgramAiHomeScreen } from "@/components/programme/ProgramAiHome";
import { ProgramAiMissionExperience } from "@/components/programme/ProgramAiMissionExperience";
import { ProgramAiReviewScreen } from "@/components/programme/ProgramAiReviewScreen";
import type {
  ProgramAiHome,
  ProgramAiMission,
  ProgramAiReview,
} from "@/components/programme/ProgramAiAuthenticated.types";
import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import type { ProgrammeMissionNumber } from "@/lib/analytics/product-analytics-events";
import { authClient, useSession } from "@/lib/auth/client";
import {
  GOOGLE_AUTH_CALLBACK,
  GOOGLE_AUTH_ERROR_CALLBACK,
  GOOGLE_LINK_CALLBACK,
  GOOGLE_LINK_ERROR_CALLBACK,
} from "@/lib/auth/google-flow";
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
  type ProgrammeStartingPointValue,
} from "@/lib/programme/program-ai/contracts";
import {
  PROGRAM_AI_AUDIO_TOO_LARGE_MESSAGE,
  programmeAudioBlobFitsUploadLimit,
} from "@/lib/programme/program-ai/transcription-limits";
import {
  anonymousProgrammeSubject,
  clearProgrammeOAuthClaimMarker,
  clearProgrammeSubjectContent,
  hasProgrammeAccessAuthority,
  loadProgrammeSubjectContent,
  mergeProgrammeSubjectContent,
  programmeAuthAccessHeaders,
  readProgrammeOAuthClaimMarker,
  rotateAnonymousProgrammeSubject,
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
  | "support"
  | "registration"
  | "home"
  | "mission"
  | "review";

type RecorderState = "idle" | "requesting" | "recording" | "cancelled" | "denied" | "unsupported" | "transcribing" | "success" | "error";
type MicrophonePermissionState = PermissionState | "unknown";

type ProgramAiLocalState = {
  phase: Phase;
  situation: string;
  candidate: ProgrammeStartingPointValue | null;
  inputMode: "text" | "voice";
};

type ApiPayload<T> = { ok?: boolean; error?: string; code?: string } & T;
type ProgramAiAuthenticatedLocalContent = {
  programAiMissionWording: Record<string, string>;
  programAiReviewWording: Record<string, string>;
};

const emptyLocalState: ProgramAiLocalState = {
  phase: "access",
  situation: "",
  candidate: null,
  inputMode: "voice",
};

function restoredAnonymousState(value: ProgramAiLocalState | null | undefined): ProgramAiLocalState {
  if (!value) return emptyLocalState;
  const legacyPhase = String(value.phase);
  const phase = legacyPhase === "clarification"
    ? "intake"
    : legacyPhase === "candidate" || legacyPhase === "reward"
      ? value.candidate ? "registration" : "intake"
      : value.phase === "home" ? "intake" : value.phase;
  return { phase, situation: value.situation || "", candidate: value.candidate || null, inputMode: value.inputMode === "text" ? "text" : "voice" };
}

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
      ...(init?.body && !(init.body instanceof FormData) ? { "content-type": "application/json" } : {}),
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
          <label><input checked={adult} onChange={(event) => setAdult(event.target.checked)} type="checkbox" /><span>I confirm I am 18 or over · required</span></label>
          <div className={styles.accessCheck}>
            <input checked={legal} id="programme-legal-acknowledgement" onChange={(event) => setLegal(event.target.checked)} type="checkbox" />
            <div className={styles.accessCheckCopy}>
              <label htmlFor="programme-legal-acknowledgement">I agree to the Terms and acknowledge the Privacy Notice · required</label>
              <span><Link href="/terms">Read Terms</Link><span aria-hidden="true"> · </span><Link href="/privacy">Read Privacy Notice</Link></span>
            </div>
          </div>
          <ActionButton disabled={busy || !adult || !legal} onClick={onConfirm} size="large">
            {busy ? "Verifying access…" : "Enter Mission 01"}
          </ActionButton>
          <StatusMessage error={error} />
          <Link className={styles.helpLink} href="/help">Protected Help / pause options</Link>
        </section>
      </main>
    </div>
  );
}

function Recorder({ disabled, state, onState, onTranscript, onTranscribe, onUseTyped }: {
  disabled: boolean;
  state: RecorderState;
  onState: (state: RecorderState) => void;
  onTranscript: (transcript: string, timing: {
    recordingDurationMs: number;
    transcriptionRequestMs: number;
  }) => void;
  onTranscribe: (audio: Blob, durationMs: number) => Promise<{
    transcript: string;
    transcriptionRequestMs: number;
  }>;
  onUseTyped: () => void;
}) {
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const retainedRecording = useRef<Blob | null>(null);
  const [recordingElapsedSeconds, setRecordingElapsedSeconds] = useState(0);
  const [microphonePermission, setMicrophonePermission] = useState<MicrophonePermissionState>("unknown");
  const [recordingError, setRecordingError] = useState("");
  const recordingStartedAt = useRef(0);
  const recordingDurationMs = useRef(0);
  const maximumTimer = useRef<number | null>(null);
  const recordingTimer = useRef<number | null>(null);
  const cancelling = useRef(false);
  const recorderFailed = useRef(false);
  async function readMicrophonePermission(): Promise<MicrophonePermissionState> {
    if (!navigator.permissions?.query) return "unknown";
    try {
      const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
      setMicrophonePermission(status.state);
      return status.state;
    } catch {
      setMicrophonePermission("unknown");
      return "unknown";
    }
  }

  function clearMaximumTimer() {
    if (maximumTimer.current !== null) window.clearTimeout(maximumTimer.current);
    maximumTimer.current = null;
  }

  function clearRecordingTimer(reset = true) {
    if (recordingTimer.current !== null) window.clearInterval(recordingTimer.current);
    recordingTimer.current = null;
    if (reset) setRecordingElapsedSeconds(0);
  }

  function startRecordingTimer() {
    clearRecordingTimer();
    recordingStartedAt.current = Date.now();
    recordingTimer.current = window.setInterval(() => {
      setRecordingElapsedSeconds(Math.min(90, Math.floor((Date.now() - recordingStartedAt.current) / 1_000)));
    }, 1_000);
  }

  function stopTracks() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }

  function releaseRecording() {
    retainedRecording.current = null;
    chunks.current = [];
  }

  useEffect(() => {
    let active = true;
    let observedStatus: PermissionStatus | null = null;
    const onPermissionChange = () => {
      if (active && observedStatus) setMicrophonePermission(observedStatus.state);
    };
    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: "microphone" as PermissionName })
        .then((status) => {
          if (!active) return;
          observedStatus = status;
          setMicrophonePermission(status.state);
          status.addEventListener?.("change", onPermissionChange);
        })
        .catch(() => {
          if (active) setMicrophonePermission("unknown");
        });
    }
    const releaseAudio = () => {
      clearMaximumTimer();
      clearRecordingTimer(false);
      if (recorder.current) {
        recorder.current.ondataavailable = null;
        recorder.current.onstop = null;
        recorder.current.onerror = null;
        if (recorder.current.state === "recording") recorder.current.stop();
        recorder.current = null;
      }
      stopTracks();
      releaseRecording();
    };
    window.addEventListener("pagehide", releaseAudio);
    return () => {
      active = false;
      observedStatus?.removeEventListener?.("change", onPermissionChange);
      window.removeEventListener("pagehide", releaseAudio);
      releaseAudio();
    };
  }, []);

  async function transcribe(audio: Blob, durationMs: number) {
    setRecordingError("");
    if (!programmeAudioBlobFitsUploadLimit(audio.size)) {
      releaseRecording();
      setRecordingError(PROGRAM_AI_AUDIO_TOO_LARGE_MESSAGE);
      productAnalyticsClient.voiceOutcome("transcription_error");
      onState("error");
      return;
    }
    onState("transcribing");
    try {
      const result = await onTranscribe(audio, durationMs);
      releaseRecording();
      onTranscript(result.transcript, {
        recordingDurationMs: durationMs,
        transcriptionRequestMs: result.transcriptionRequestMs,
      });
      productAnalyticsClient.voiceOutcome("transcription_success");
      onState("success");
    } catch {
      setRecordingError("Voice transcription could not be completed.");
      productAnalyticsClient.voiceOutcome("transcription_error");
      onState("error");
    }
  }

  function preferredMimeType() {
    return ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"]
      .find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
  }

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      productAnalyticsClient.voiceOutcome("transcription_error");
      onState("unsupported");
      return;
    }
    setRecordingError("");
    onState("requesting");
    try {
      releaseRecording();
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophonePermission("granted");
      const mimeType = preferredMimeType();
      recorder.current = new MediaRecorder(stream.current, mimeType ? { mimeType } : undefined);
      chunks.current = [];
      recorder.current.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      recorder.current.onstop = () => {
        clearMaximumTimer();
        clearRecordingTimer();
        recordingDurationMs.current = Math.min(90_000, Math.max(1, Date.now() - recordingStartedAt.current));
        stopTracks();
        if (recorderFailed.current) {
          recorderFailed.current = false;
          releaseRecording();
          onState("error");
          return;
        }
        if (cancelling.current) {
          cancelling.current = false;
          releaseRecording();
          onState("cancelled");
          return;
        }
        const audio = new Blob(chunks.current, {
          type: recorder.current?.mimeType || chunks.current[0]?.type || "audio/webm",
        });
        retainedRecording.current = audio;
        chunks.current = [];
        void transcribe(audio, recordingDurationMs.current);
      };
      recorder.current.onerror = () => {
        recorderFailed.current = true;
        productAnalyticsClient.voiceOutcome("transcription_error");
        clearMaximumTimer();
        clearRecordingTimer();
        if (recorder.current?.state === "recording") {
          recorder.current.stop();
          return;
        }
        stopTracks();
        releaseRecording();
        onState("error");
      };
      cancelling.current = false;
      recorderFailed.current = false;
      recorder.current.start();
      productAnalyticsClient.voiceOutcome("recording_started");
      startRecordingTimer();
      maximumTimer.current = window.setTimeout(() => {
        stop();
      }, 90_000);
      onState("recording");
    } catch (cause) {
      clearMaximumTimer();
      clearRecordingTimer();
      stopTracks();
      const denied = cause instanceof DOMException && cause.name === "NotAllowedError";
      if (denied) await readMicrophonePermission();
      productAnalyticsClient.voiceOutcome(denied ? "permission_denied" : "transcription_error");
      onState(denied ? "denied" : "error");
    }
  }

  async function checkPermissionAndRetry() {
    const state = await readMicrophonePermission();
    if (state === "denied") {
      onState("denied");
      return;
    }
    await start();
  }

  function stop() {
    if (recorder.current?.state !== "recording") return;
    clearMaximumTimer();
    clearRecordingTimer();
    recorder.current.stop();
  }

  function cancel() {
    if (recorder.current?.state !== "recording") return;
    cancelling.current = true;
    productAnalyticsClient.voiceOutcome("cancelled");
    stop();
  }

  function retry() {
    if (retainedRecording.current) {
      void transcribe(retainedRecording.current, recordingDurationMs.current);
    }
  }

  function useTyped() {
    clearMaximumTimer();
    clearRecordingTimer();
    stopTracks();
    releaseRecording();
    onState("idle");
    onUseTyped();
  }

  return (
    <div className={styles.recorder} data-state={state}>
      <div aria-hidden="true" className={styles.mic}><span className={styles.recordingDot} data-recording-indicator><svg fill="none" height="38" viewBox="0 0 24 24" width="38"><rect height="11" rx="3" stroke="currentColor" strokeWidth="1.8" width="6" x="9" y="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8"/></svg></span></div>
      <div><strong>{state === "recording" ? <><span aria-hidden="true">Recording · {String(Math.floor(recordingElapsedSeconds / 60)).padStart(2, "0")}:{String(recordingElapsedSeconds % 60).padStart(2, "0")} / 01:30</span><span className={styles.srOnly} role="status">Microphone is recording now. Stop or cancel when ready.</span></> : state === "transcribing" ? "Transcribing securely" : state === "success" ? "Transcript ready to review" : state === "denied" && microphonePermission === "denied" ? "Microphone is blocked for this site" : state === "denied" ? "Microphone did not start" : state === "unsupported" ? "Voice recording is not supported here" : state === "cancelled" ? "Recording cancelled" : "Prefer to speak?"}</strong><small>Audio stays in short-lived memory, is sent for transcription only, and is never saved by B4GAMBLE.</small></div>
      {["idle", "cancelled", "success"].includes(state) ? <span className={styles.recorderActions}><button disabled={disabled} onClick={start} type="button">{state === "success" ? "Record again" : "Tap to speak"}</button>{state !== "success" ? <button className={styles.cancelRecording} disabled={disabled} onClick={useTyped} type="button">I&apos;d rather type</button> : null}</span> : null}
      {state === "denied" ? <button disabled={disabled} onClick={microphonePermission === "denied" ? checkPermissionAndRetry : start} type="button">{microphonePermission === "denied" ? "Check microphone access" : "Try microphone again"}</button> : null}
      {state === "recording" ? <span className={styles.recorderActions}><button className={styles.stopRecording} onClick={stop} type="button">Stop recording</button><button className={styles.cancelRecording} onClick={cancel} type="button">Cancel</button></span> : null}
      {state === "requesting" || state === "transcribing" ? <span role="status">{state === "requesting" ? "Requesting microphone…" : "Transcribing…"}</span> : null}
      {state === "success" ? <p role="status">Check and correct the editable transcript below before creating your Starting Point.</p> : null}
      {state === "error" ? <p role="alert">{recordingError || "Voice transcription could not be completed."} {retainedRecording.current ? <><button onClick={retry} type="button">Retry this recording</button> or </> : null}<button onClick={useTyped} type="button">type instead</button>.</p> : null}
      {state === "unsupported" ? <p role="alert">This browser cannot record audio with the features B4GAMBLE needs. You can <button onClick={useTyped} type="button">type instead</button>.</p> : null}
      {state === "denied" && microphonePermission === "denied" ? <p role="alert">Your browser will not show another prompt while this site is blocked. Use the site controls beside the address bar to allow the microphone, then check access again, or <button onClick={useTyped} type="button">type instead</button>. Nothing was recorded.</p> : null}
      {state === "denied" && microphonePermission !== "denied" ? <p role="alert">The permission prompt was dismissed or the microphone was not made available. Try again, or <button onClick={useTyped} type="button">type instead</button>. Nothing was recorded.</p> : null}
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
  onTranscript,
  onTranscribe,
  onUseTyped,
  inputMode,
}: {
  authorityActive: boolean;
  busy: boolean;
  error: string;
  situation: string;
  onSituation: (value: string) => void;
  onSubmit: () => void;
  onTranscript: (transcript: string, timing: {
    recordingDurationMs: number;
    transcriptionRequestMs: number;
  }) => void;
  onTranscribe: (audio: Blob, durationMs: number) => Promise<{
    transcript: string;
    transcriptionRequestMs: number;
  }>;
  onUseTyped: () => void;
  inputMode: "text" | "voice";
}) {
  const [authority, setAuthority] = useState(authorityActive);
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  useEffect(() => setAuthority(authorityActive), [authorityActive]);
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.intakeGrid}>
        <section className={styles.heroCopy}>
          <span>MISSION 01</span>
          <span className={styles.srOnly}>Before you share.</span>
          <span className={styles.srOnly}>What feels hardest to control right now?</span>
          <h1>Tell us what is happening right now.</h1>
          <p>In your own words. A minute is plenty — we&apos;ll build your starting point from it.</p>
        </section>
        <section className={styles.inputPanel}>
          <Recorder disabled={busy || !authority} state={recorderState} onState={setRecorderState} onTranscript={onTranscript} onTranscribe={onTranscribe} onUseTyped={onUseTyped} />
          {inputMode === "text" || situation ? <><div className={styles.or}><span>{inputMode === "voice" ? "Transcript — editing is optional" : "Text fallback"}</span></div>
          <label className={styles.field}>
            <span>{inputMode === "voice" ? "Editable transcript" : "Your situation"}</span>
            <textarea autoFocus maxLength={4000} onChange={(event) => onSituation(event.target.value)} placeholder="For example: I keep opening betting apps late at night after a stressful day…" rows={8} value={situation} />
            <small>{situation.length}/4000 · {inputMode === "voice" ? "Correct anything before submitting. " : ""}Stored only in this browser session.</small>
          </label></> : null}
          <ActionButton disabled={busy || !authority || situation.trim().length < 20 || situation.trim().split(/\s+/).length < 4} onClick={onSubmit} size="large">
            {busy ? "Preparing your Starting Point…" : "Create my Starting Point"}
          </ActionButton>
          <StatusMessage error={error} />
        </section>
        <section className={styles.intakeMeta} aria-label="Programme privacy and support">
          <div className={styles.jitCard}>
            <strong>Private by default.</strong>
            <p>Your words are never used for offers or rankings.</p>
            <label><input checked={authority} disabled={busy || authorityActive} onChange={(event) => setAuthority(event.target.checked)} type="checkbox" /> I choose to share this for Programme personalisation and understand I can withdraw before saving.</label>
          </div>
          <Link className={styles.helpLink} href="/help">Protected Help / pause options</Link>
        </section>
      </main>
    </div>
  );
}

function SupportScreen({ busy, error, onContinue }: { busy: boolean; error: string; onContinue: () => void }) {
  return (
    <div className={styles.supportPage}><Header xp={20} /><main className={styles.supportCard}>
      <span>SUPPORT FIRST</span><h1>Pause the Programme. Keep support close.</h1>
      <p>Nothing here labels or diagnoses you. If continuing does not feel right, protected Help and pause options are available now.</p>
      <div className={styles.supportActions}><ActionLink href="/help" size="large">Open protected Help</ActionLink><ActionButton disabled={busy} onClick={onContinue} size="large" variant="ghost-night">Continue when I’m ready</ActionButton></div>
      <StatusMessage error={error} />
      <small>Your 20 XP for describing the situation is preserved. Registration and celebration are paused on this screen.</small>
    </main></div>
  );
}

function StartingPointReadyScreen({
  authenticated,
  candidate,
  googleLinkRecovery,
  googleAvailable,
  busy,
  error,
  onSave,
  onEmail,
  onGoogle,
  onLinkGoogle,
  onWithdraw,
}: {
  authenticated: boolean;
  candidate: ProgrammeStartingPointValue;
  googleLinkRecovery: boolean;
  googleAvailable: boolean;
  busy: boolean;
  error: string;
  onSave: () => void;
  onEmail: (input: { email: string; password: string; mode: "sign-up" | "sign-in" }) => void;
  onGoogle: (mode: "sign-up" | "sign-in") => void;
  onLinkGoogle: () => void;
  onWithdraw: () => void;
}) {
  const [emailOpen, setEmailOpen] = useState(!googleAvailable || googleLinkRecovery);
  const [mode, setMode] = useState<"sign-up" | "sign-in">(googleLinkRecovery ? "sign-in" : "sign-up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return <div className={styles.readyPage}><Header xp={20} /><main className={styles.readyShell}>
    <section className={styles.readyIntro}><span>✓ YOUR STARTING POINT IS READY</span><span className={styles.srOnly}>Your Starting Point is ready.</span><h1>A plan built around your evenings.</h1><p>{googleLinkRecovery ? "Your confirmed Starting Point stays in this browser while you securely link the existing account." : "We made something useful before asking you to register. Save it only if you want to continue."}</p></section>
    <section className={styles.readyCard}>
      <small>YOUR STARTING POINT</small><h2>{candidate.startingPoint}</h2>
      <div><span>What changes next</span><p>{candidate.desiredChange}</p></div>
      <div><span>Mission 02 continues here</span><p>{candidate.continuationCue}</p></div>
    </section>
    <section className={styles.readyActions}>
      {authenticated ? <ActionButton disabled={busy} onClick={googleLinkRecovery ? onLinkGoogle : onSave} size="large">{busy ? "Saving your plan…" : googleLinkRecovery ? "Link Google securely" : "Save to my account"}</ActionButton> : <>
        {googleAvailable && !googleLinkRecovery ? <ActionButton className={styles.googleButton} disabled={busy} onClick={() => onGoogle(mode)} size="large"><span aria-hidden="true" className={styles.googleMark}>G</span>Continue with Google — save your plan</ActionButton> : null}
        {!googleLinkRecovery ? <button className={styles.emailToggle} onClick={() => setEmailOpen((value) => !value)} type="button">{emailOpen ? "Hide email option" : "Use email instead"}</button> : null}
        {emailOpen ? <form onSubmit={(event: FormEvent) => { event.preventDefault(); onEmail({ email, password, mode }); }}>
          <label className={styles.field}><span>Email</span><input autoComplete="email" inputMode="email" name="email" onChange={(event) => setEmail(event.target.value)} required spellCheck={false} type="email" value={email} /></label>
          <label className={styles.field}><span>Password</span><input autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
          <ActionButton disabled={busy} size="large" type="submit">{googleLinkRecovery ? "Sign in, then link Google" : mode === "sign-up" ? "Create account with email" : "Sign in with email"}</ActionButton>
          {!googleLinkRecovery ? <button className={styles.textButton} onClick={() => setMode((value) => value === "sign-up" ? "sign-in" : "sign-up")} type="button">{mode === "sign-up" ? "Already have an account? Sign in" : "Need an account? Create one"}</button> : null}
        </form> : null}
      </>}
      <StatusMessage error={error} />
      <small>Registration adds 0 XP. Your words never feed offers or rankings.</small>
      {!authenticated && !googleLinkRecovery ? <button className={styles.textButton} disabled={busy} onClick={onWithdraw} type="button">Withdraw sensitive-input authority and clear this draft</button> : null}
    </section>
  </main></div>;
}

export function ProgramAiExperience({ googleAvailable = false }: { googleAvailable?: boolean }) {
  const { data: session, isPending: sessionPending } = useSession();
  const [phase, setPhase] = useState<Phase>("loading");
  const [subject, setSubject] = useState<ProgrammeLocalSubject | null>(null);
  const [local, setLocal] = useState<ProgramAiLocalState>(emptyLocalState);
  const [home, setHome] = useState<ProgramAiHome | null>(null);
  const [activeMission, setActiveMission] = useState<ProgramAiMission | null>(null);
  const [activeReview, setActiveReview] = useState<{ milestone: "first" | "mid" | "full"; review: ProgramAiReview } | null>(null);
  const [missionWording, setMissionWording] = useState<Record<string, string>>({});
  const [reviewWording, setReviewWording] = useState<Record<string, string>>({});
  const [sensitiveAuthorityActive, setSensitiveAuthorityActive] = useState(false);
  const [googleLinkRecovery, setGoogleLinkRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const oauthRedeemStarted = useRef(false);
  const emailRedeemStarted = useRef(false);
  const personalisationStartedAt = useRef<number | null>(null);
  const accumulatedAiLatencyMs = useRef(0);
  const voiceTiming = useRef<{
    recordingDurationMs: number;
    transcriptionRequestMs: number;
  } | null>(null);
  const phaseFocusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (phase !== "home" || !home) return;
    productAnalyticsClient.homeViewed({
      currentMission: home.currentMission as ProgrammeMissionNumber,
      engagementDayBucket: home.engagementDayBucket,
    });
  }, [home, phase]);

  const persist = useCallback((next: ProgramAiLocalState, exactSubject = subject) => {
    setLocal(next);
    setPhase(next.phase);
    if (exactSubject) mergeProgrammeSubjectContent(window.sessionStorage, exactSubject, { programAi: next });
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
    const authQuery = new URLSearchParams(window.location.search);
    const authState = authQuery.get("auth");
    const authError = authQuery.get("error");
    const accountNotLinked = authState === "google-error" && authError === "account_not_linked";
    const linkFailed = authState === "google-link-error";
    const linkReturned = authState === "google-link-return";
    const recoveryActive = accountNotLinked || linkFailed || (googleLinkRecovery && !linkReturned);
    if (accountNotLinked) {
      setGoogleLinkRecovery(true);
      setError("");
    } else if (linkFailed) {
      setGoogleLinkRecovery(true);
      setError("Google linking was not completed. Your Starting Point is still here; retry when you are ready.");
    } else if (authState === "google-error" && authError) {
      setError("Google account access was not completed. You can retry or use email instead.");
    }
    const oauthJourney = readProgrammeOAuthClaimMarker(window.sessionStorage);
    if (oauthJourney && recoveryActive) {
      const restored = loadProgrammeSubjectContent<{ programAi: ProgramAiLocalState }>(window.sessionStorage, oauthJourney).programAi;
      setSubject(oauthJourney);
      if (restored) setLocal(restored);
      setPhase("registration");
      return;
    }
    if (session?.user.id && oauthJourney) {
      const restored = loadProgrammeSubjectContent<{ programAi: ProgramAiLocalState }>(window.sessionStorage, oauthJourney).programAi;
      setSubject(oauthJourney);
      if (restored) setLocal(restored);
      setPhase("registration");
      if (!oauthRedeemStarted.current && restored?.candidate) {
        if (linkReturned) setGoogleLinkRecovery(false);
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
      const localContent = loadProgrammeSubjectContent<ProgramAiAuthenticatedLocalContent>(window.sessionStorage, userSubject);
      setMissionWording(localContent.programAiMissionWording ?? {});
      setReviewWording(localContent.programAiReviewWording ?? {});
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
    const restored = restoredAnonymousState(loadProgrammeSubjectContent<{ programAi: ProgramAiLocalState }>(window.sessionStorage, journey).programAi);
    const accessActive = hasProgrammeAccessAuthority(window.sessionStorage, journey);
    setSubject(journey);
    const restoredWithAccess = accessActive ? restored : { ...emptyLocalState, phase: "access" as const };
    setLocal(restoredWithAccess);
    setPhase(restoredWithAccess.phase);
    if (accessActive) {
      programAiRequest<{ authority: { active: boolean } }>("/api/program/program-ai/authority", journey)
        .then((payload) => setSensitiveAuthorityActive(Boolean(payload.authority?.active)))
        .catch(() => setSensitiveAuthorityActive(false));
    } else {
      setSensitiveAuthorityActive(false);
    }
  }, [googleLinkRecovery, redeem, session?.user.id, sessionPending]);

  async function grantAccess() {
    if (!subject) return;
    const entryMode = hasProgrammeAccessAuthority(window.sessionStorage, subject) ? "resume" : "start";
    productAnalyticsClient.startClicked("other_public");
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
      productAnalyticsClient.accessGranted(entryMode);
      productAnalyticsClient.missionOpened(1, entryMode);
      setSensitiveAuthorityActive(false);
      personalisationStartedAt.current = null;
      accumulatedAiLatencyMs.current = 0;
      voiceTiming.current = null;
      setSubject(journey);
      persist({ ...emptyLocalState, phase: "intake" }, journey);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Current access could not be verified");
    } finally { setBusy(false); }
  }

  async function submitTurn(confirmSensitiveAuthority = false) {
    if (!subject) return;
    if (personalisationStartedAt.current === null) personalisationStartedAt.current = performance.now();
    setBusy(true); setError("");
    try {
      if (confirmSensitiveAuthority) await ensureSensitiveAuthority();
      const payload = await programAiRequest<{
        result: {
          kind: "CLARIFICATION_REQUIRED" | "STARTING_POINT_CANDIDATE";
          candidate?: ProgrammeStartingPointValue;
          disposition: "CONTINUE" | "SUPPORT_FIRST";
        };
        timing?: { programmeAiTurnMs?: number };
      }>("/api/program/program-ai/turn", subject, {
        method: "POST",
        body: JSON.stringify({ inputMode: local.inputMode, situation: local.situation, clarificationAnswers: [] }),
      });
      accumulatedAiLatencyMs.current += payload.timing?.programmeAiTurnMs ?? 0;
      if (payload.result.kind !== "STARTING_POINT_CANDIDATE" || !payload.result.candidate) {
        throw new Error("Your Starting Point could not be prepared");
      }
      const readyState = { ...local, candidate: payload.result.candidate, phase: "registration" as const };
      if (payload.result.disposition === "SUPPORT_FIRST") {
        persist({ ...readyState, phase: "support" });
      } else {
        persist(readyState);
        productAnalyticsClient.personalisedValue("starting_point");
        productAnalyticsClient.registrationCtaPresented();
        console.info(JSON.stringify({
          event: "programme_ai_m1_client_latency",
          inputMode: local.inputMode,
          recordingDurationMs: voiceTiming.current?.recordingDurationMs,
          transcriptionRequestMs: voiceTiming.current?.transcriptionRequestMs,
          programmeAiTurnMs: accumulatedAiLatencyMs.current,
          totalSubmitToStartingPointMs: personalisationStartedAt.current === null
            ? undefined
            : Math.round(performance.now() - personalisationStartedAt.current),
          summedTechnicalLatencyMs: (voiceTiming.current?.transcriptionRequestMs ?? 0)
            + accumulatedAiLatencyMs.current,
          clarificationCount: 0,
        }));
      }
    } catch (cause) {
      const requestError = cause as Error & { code?: string };
      if (requestError.code === "SENSITIVE_INPUT_AUTHORITY_REQUIRED") {
        setSensitiveAuthorityActive(false);
        persist({ ...local, candidate: null, phase: "intake" });
      }
      setError(cause instanceof Error ? cause.message : "Your Starting Point could not be prepared");
    }
    finally { setBusy(false); }
  }

  async function transcribeVoice(audio: Blob, durationMs: number) {
    if (!subject) throw new Error("Programme session unavailable");
    if (!programmeAudioBlobFitsUploadLimit(audio.size)) {
      throw new Error(PROGRAM_AI_AUDIO_TOO_LARGE_MESSAGE);
    }
    await ensureSensitiveAuthority();
    const form = new FormData();
    form.set("audio", audio, "programme-m1-recording");
    form.set("durationMs", String(durationMs));
    const payload = await programAiRequest<{
      transcript: string;
      timing?: { transcriptionRequestMs?: number };
    }>("/api/program/program-ai/transcription", subject, {
      method: "POST",
      body: form,
    });
    return {
      transcript: payload.transcript,
      transcriptionRequestMs: payload.timing?.transcriptionRequestMs ?? 0,
    };
  }

  async function ensureSensitiveAuthority() {
    if (!subject || sensitiveAuthorityActive) return;
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

  function acceptTranscript(transcript: string, timing: {
    recordingDurationMs: number;
    transcriptionRequestMs: number;
  }) {
    voiceTiming.current = timing;
    personalisationStartedAt.current = null;
    accumulatedAiLatencyMs.current = 0;
    persist({ ...local, situation: transcript, inputMode: "voice", phase: "intake" });
  }

  function useTypedInput() {
    voiceTiming.current = null;
    personalisationStartedAt.current = null;
    accumulatedAiLatencyMs.current = 0;
    persist({ ...local, inputMode: "text", phase: "intake" });
  }

  async function continueAfterSupport() {
    if (!subject) return;
    setBusy(true); setError("");
    try {
      await programAiRequest("/api/program/program-ai/support/continue", subject, { method: "POST" });
      persist({ ...local, phase: local.candidate ? "registration" : "intake" });
      if (local.candidate) {
        productAnalyticsClient.personalisedValue("starting_point");
        productAnalyticsClient.registrationCtaPresented();
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The Programme could not resume"); }
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

  async function prepareClaimForRegistration() {
    if (!subject || !local.candidate) throw new Error("Your Starting Point is unavailable in this browser session");
    await programAiRequest("/api/program/program-ai/starting-point", subject, {
      method: "POST",
      body: JSON.stringify(local.candidate),
    });
    await programAiRequest("/api/program/program-ai/claim", subject, { method: "POST" });
  }

  async function saveAuthenticated() {
    if (!session?.user.id || !subject) return;
    setBusy(true); setError("");
    try {
      await prepareClaimForRegistration();
      await redeem(session.user.id, subject, local);
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Your progress could not be saved yet"); }
    finally { setBusy(false); }
  }

  async function handleEmail(input: { email: string; password: string; mode: "sign-up" | "sign-in" }) {
    if (!subject) return;
    emailRedeemStarted.current = true;
    setBusy(true); setError("");
    try {
      if (!googleLinkRecovery) await prepareClaimForRegistration();
      const result = input.mode === "sign-up" && !googleLinkRecovery
        ? await authClient.signUp.email({ email: input.email.trim().toLowerCase(), password: input.password, name: input.email.split("@")[0] || "B4GAMBLE member", fetchOptions: { headers: programmeAuthAccessHeaders(window.sessionStorage, subject) } })
        : await authClient.signIn.email({ email: input.email.trim().toLowerCase(), password: input.password });
      if (result.error || !result.data?.user.id) throw new Error(input.mode === "sign-up" && !googleLinkRecovery ? "This account could not be created. Try signing in if it already exists." : "Email or password is incorrect.");
      if (googleLinkRecovery) {
        await startGoogleLink();
        return;
      }
      await redeem(result.data.user.id, subject, local);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Account access failed"); }
    finally { emailRedeemStarted.current = false; setBusy(false); }
  }

  async function handleGoogle(mode: "sign-up" | "sign-in") {
    if (!subject || subject.kind !== "journey") return;
    setBusy(true); setError("");
    try {
      await prepareClaimForRegistration();
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

  async function startGoogleLink() {
    setBusy(true); setError("");
    try {
      const result = await authClient.linkSocial({
        provider: "google",
        callbackURL: GOOGLE_LINK_CALLBACK,
        errorCallbackURL: GOOGLE_LINK_ERROR_CALLBACK,
      });
      if (result.error) throw new Error("Google linking could not be started");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Google linking failed");
      setBusy(false);
    }
  }

  async function openMission(missionNumber: number) {
    if (!subject || missionNumber < 2 || missionNumber > 10) return;
    setBusy(true); setError("");
    try {
      const payload = await programAiRequest<{ mission: ProgramAiMission }>(
        `/api/program/program-ai/missions/${missionNumber}`,
        subject,
      );
      setActiveMission(payload.mission);
      setPhase("mission");
      productAnalyticsClient.missionOpened(
        missionNumber as ProgrammeMissionNumber,
        payload.mission.status === "completed" ? "review" : payload.mission.actionsCompleted > 0 ? "resume" : "start",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The Mission could not be opened");
      setPhase("home");
    } finally { setBusy(false); }
  }

  async function openReview(milestone: "first" | "mid" | "full") {
    if (!subject) return;
    setBusy(true); setError("");
    try {
      const payload = await programAiRequest<{ review: ProgramAiReview }>(
        `/api/program/program-ai/reviews/${milestone}`,
        subject,
      );
      setActiveReview({ milestone, review: payload.review });
      setPhase("review");
      productAnalyticsClient.reviewOpened(milestone);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The Review could not be opened");
      setPhase("home");
    } finally { setBusy(false); }
  }

  function saveMissionWording(missionNumber: number, value: string) {
    if (!subject) return;
    const next = { ...missionWording, [missionNumber]: value };
    setMissionWording(next);
    mergeProgrammeSubjectContent<ProgramAiAuthenticatedLocalContent>(window.sessionStorage, subject, { programAiMissionWording: next });
  }

  function saveReviewWording(milestone: string, value: string) {
    if (!subject) return;
    const next = { ...reviewWording, [milestone]: value };
    setReviewWording(next);
    mergeProgrammeSubjectContent<ProgramAiAuthenticatedLocalContent>(window.sessionStorage, subject, { programAiReviewWording: next });
  }

  function startFromHome() {
    const journey = rotateAnonymousProgrammeSubject(window.sessionStorage);
    setSubject(journey);
    setLocal(emptyLocalState);
    setSensitiveAuthorityActive(false);
    setPhase("access");
    setHome(null);
  }

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const boundary = phaseFocusRef.current;
      if (boundary && !boundary.contains(document.activeElement)) boundary.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

  const renderPhase = (screen: ReactNode) => (
    <div
      aria-label={`Programme ${phase} screen`}
      className={styles.phaseBoundary}
      data-programme-phase={phase}
      data-runtime-renderer="programme"
      ref={phaseFocusRef}
      role="region"
      tabIndex={-1}
    >
      {screen}
    </div>
  );

  if (phase === "loading" || sessionPending) return renderPhase(<div className={styles.page}><Header /><main className={styles.singlePanel}><p role="status">Loading your private Programme session…</p><Link href="/help">Protected Help remains available.</Link></main></div>);
  if (phase === "access") return renderPhase(<AccessScreen busy={busy} error={error} onConfirm={grantAccess} />);
  if (phase === "intake") return renderPhase(<IntakeScreen authorityActive={sensitiveAuthorityActive} busy={busy} error={error} inputMode={local.inputMode} onSituation={(situation) => { const next = { ...local, situation }; setLocal(next); if (subject) mergeProgrammeSubjectContent(window.sessionStorage, subject, { programAi: next }); }} onSubmit={() => submitTurn(true)} onTranscript={acceptTranscript} onTranscribe={transcribeVoice} onUseTyped={useTypedInput} situation={local.situation} />);
  if (phase === "support") return renderPhase(<SupportScreen busy={busy} error={error} onContinue={continueAfterSupport} />);
  if (phase === "registration" && local.candidate) return renderPhase(<StartingPointReadyScreen authenticated={Boolean(session?.user.id)} busy={busy} candidate={local.candidate} error={error} googleAvailable={googleAvailable} googleLinkRecovery={googleLinkRecovery} onEmail={handleEmail} onGoogle={handleGoogle} onLinkGoogle={startGoogleLink} onSave={saveAuthenticated} onWithdraw={withdrawSensitiveInput} />);
  if (phase === "mission" && activeMission && home && session?.user.id) return renderPhase(<ProgramAiMissionExperience home={home} localWording={missionWording[activeMission.missionNumber] ?? ""} mission={activeMission} onBack={() => { setActiveMission(null); setPhase("home"); }} onHome={setHome} onLocalWording={(value) => saveMissionWording(activeMission.missionNumber, value)} userId={session.user.id} />);
  if (phase === "review" && activeReview && home && session?.user.id) return renderPhase(<ProgramAiReviewScreen initialReview={activeReview.review} localWording={reviewWording[activeReview.milestone] ?? ""} milestone={activeReview.milestone} onBack={() => { setActiveReview(null); setPhase("home"); }} onLocalWording={(value) => saveReviewWording(activeReview.milestone, value)} totalXp={home.totalXp} userId={session.user.id} />);
  if (phase === "home" && home && session?.user.id) return renderPhase(<ProgramAiHomeScreen home={home} onMission={openMission} onReview={openReview} onStart={startFromHome} userId={session.user.id} />);
  if (phase === "home") return renderPhase(<div className={styles.page}><Header /><main className={styles.singlePanel}><p role="alert">{error || "Programme Home is unavailable. Refresh to retry."}</p></main></div>);
  return renderPhase(<AccessScreen busy={busy} error={error} onConfirm={grantAccess} />);
}
