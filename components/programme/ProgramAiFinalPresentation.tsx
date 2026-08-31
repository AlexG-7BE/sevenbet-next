"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";

import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import { programmeText, type ProgrammeMessageKey } from "@/lib/i18n/programme-catalog";
import type { ProgrammeStartingPointValue } from "@/lib/programme/program-ai/contracts";
import {
  programmeAudioBlobFitsUploadLimit,
} from "@/lib/programme/program-ai/transcription-limits";
import { programmeHelpPath, type ProgrammeLocale } from "@/lib/programme/presentation";
import styles from "./ProgramAiFinalPresentation.module.css";

export type ProgrammeRecorderState = "idle" | "requesting" | "recording" | "cancelled" | "denied" | "policy-denied" | "unsupported" | "transcribing" | "success" | "error";
type MicrophonePermissionState = PermissionState | "unknown";

type DocumentPermissionsPolicy = Readonly<{
  allowsFeature: (feature: string) => boolean;
}>;

function microphoneDeniedByDocumentPolicy() {
  const controlledDocument = document as Document & {
    featurePolicy?: DocumentPermissionsPolicy;
    permissionsPolicy?: DocumentPermissionsPolicy;
  };
  const policy = controlledDocument.permissionsPolicy ?? controlledDocument.featurePolicy;
  if (!policy?.allowsFeature) return false;
  try {
    return !policy.allowsFeature("microphone");
  } catch {
    return false;
  }
}

function StatusMessage({ error, message }: { error?: string; message?: string }) {
  if (error) return <p className={styles.error} role="alert">{error}</p>;
  return message ? <p className={styles.status} role="status">{message}</p> : null;
}

function translated(locale: ProgrammeLocale) {
  return (key: ProgrammeMessageKey, values: Readonly<Record<string, string | number>> = {}) => programmeText(locale, key, values);
}

export function ProgrammeLoadingScreen({ locale }: { locale: ProgrammeLocale }) {
  const t = translated(locale);
  return (
    <div className={styles.canvas} data-programme-presentation="loading">
      <main className={styles.standardFrame} data-site-classification="STANDARD" data-site-frame="standard">
        <div className={styles.focusedState}>
          <p className={styles.eyebrow}>{t("Private Programme")}</p>
          <h1>{t("Loading your private Programme session…")}</h1>
          <Link className={styles.inlineLink} href={programmeHelpPath(locale)}>{t("Protected Help remains available.")}</Link>
        </div>
      </main>
    </div>
  );
}

export function ProgrammeUnavailableScreen({ error, locale }: { error: string; locale: ProgrammeLocale }) {
  const t = translated(locale);
  return (
    <div className={styles.canvas} data-programme-presentation="unavailable">
      <main className={styles.standardFrame} data-site-classification="STANDARD" data-site-frame="standard">
        <div className={styles.focusedState}>
          <p className={styles.eyebrow}>{t("Programme")}</p>
          <h1>{t("We could not open your Programme.")}</h1>
          <StatusMessage error={error || t("Programme Home is unavailable. Refresh to retry.")} />
        </div>
      </main>
    </div>
  );
}

export function ProgrammeAccessScreen({ busy, error, onConfirm, locale }: {
  busy: boolean;
  error: string;
  onConfirm: () => void;
  locale: ProgrammeLocale;
}) {
  const t = translated(locale);
  const [adult, setAdult] = useState(false);
  const [legal, setLegal] = useState(false);
  return (
    <div className={styles.canvas} data-programme-presentation="access">
      <main className={styles.standardFrame} data-site-classification="STANDARD" data-site-frame="standard">
        <div className={styles.accessState}>
          <p className={styles.eyebrow}>{t("Programme access")}</p>
          <h1 id="programme-access-title">{t("Two checks before you begin.")}</h1>
          <section className={styles.accessBoundary} aria-labelledby="programme-access-title">
            <label className={styles.checkRow}>
              <input checked={adult} onChange={(event) => setAdult(event.target.checked)} type="checkbox" />
              <span>{t("I confirm I am 18 or over")} <small>{t("Required")}</small></span>
            </label>
            <div className={styles.checkRow}>
              <input checked={legal} id="programme-legal-acknowledgement" onChange={(event) => setLegal(event.target.checked)} type="checkbox" />
              <span><label htmlFor="programme-legal-acknowledgement">{t("I agree to the Terms and confirm I have read the Privacy Notice")}</label><small>{t("Required")}</small></span>
            </div>
            <p className={styles.legalLinks}><Link href="/terms">{t("Read Terms")}</Link><Link href="/privacy">{t("Read Privacy Notice")}</Link></p>
            <button className={styles.primaryAction} disabled={busy || !adult || !legal} onClick={onConfirm} type="button">
              {busy ? t("Verifying access…") : t("Enter Mission 01")}
            </button>
            <StatusMessage error={error} />
            <Link className={styles.helpLink} href={programmeHelpPath(locale)}>{t("Protected Help / pause options →")}</Link>
          </section>
        </div>
      </main>
    </div>
  );
}

function VoiceWave() {
  return <span aria-hidden="true" className={styles.voiceWave}>{[18, 38, 58, 30, 46, 22, 40, 28, 16].map((height, index) => <i data-recording-indicator={index === 0 ? "" : undefined} key={index} style={{ "--bar-height": `${height}px`, "--bar-delay": `${index * 70}ms` } as CSSProperties} />)}</span>;
}

function MicrophoneIcon() {
  return <svg aria-hidden="true" fill="none" height="36" viewBox="0 0 24 24" width="36"><rect height="11" rx="3" stroke="currentColor" strokeWidth="1.8" width="6" x="9" y="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>;
}

function GoogleIcon() {
  return <svg aria-hidden="true" height="18" viewBox="0 0 24 24" width="18"><path d="M21.35 11.1H12v2.9h5.35c-.5 2.4-2.55 3.8-5.35 3.8a5.8 5.8 0 1 1 0-11.6c1.45 0 2.75.5 3.8 1.45l2.15-2.15A8.9 8.9 0 0 0 12 3a9 9 0 1 0 0 18c5.2 0 8.65-3.65 8.65-8.8 0-.35-.1-.75-.3-1.1z" fill="currentColor" /></svg>;
}

function Mission01VoiceControl({ disabled, state, onState, onTranscript, onTranscribe, onUseTyped, locale }: {
  disabled: boolean;
  state: ProgrammeRecorderState;
  onState: (state: ProgrammeRecorderState) => void;
  onTranscript: (transcript: string, timing: { recordingDurationMs: number; transcriptionRequestMs: number }) => void;
  onTranscribe: (audio: Blob, durationMs: number) => Promise<{ transcript: string; transcriptionRequestMs: number }>;
  onUseTyped: () => void;
  locale: ProgrammeLocale;
}) {
  const t = translated(locale);
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
        .catch(() => { if (active) setMicrophonePermission("unknown"); });
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
      setRecordingError(t("This recording is too large to upload. Record a shorter voice note or type instead."));
      productAnalyticsClient.voiceOutcome("transcription_error");
      onState("error");
      return;
    }
    onState("transcribing");
    try {
      const result = await onTranscribe(audio, durationMs);
      releaseRecording();
      onTranscript(result.transcript, { recordingDurationMs: durationMs, transcriptionRequestMs: result.transcriptionRequestMs });
      productAnalyticsClient.voiceOutcome("transcription_success");
      onState("success");
    } catch {
      setRecordingError(t("Voice transcription could not be completed."));
      productAnalyticsClient.voiceOutcome("transcription_error");
      onState("error");
    }
  }

  function preferredMimeType() {
    return ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
  }

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      productAnalyticsClient.voiceOutcome("transcription_error");
      onState("unsupported");
      return;
    }
    if (microphoneDeniedByDocumentPolicy()) {
      onState("policy-denied");
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
      recorder.current.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
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
        const audio = new Blob(chunks.current, { type: recorder.current?.mimeType || chunks.current[0]?.type || "audio/webm" });
        retainedRecording.current = audio;
        chunks.current = [];
        void transcribe(audio, recordingDurationMs.current);
      };
      recorder.current.onerror = () => {
        recorderFailed.current = true;
        productAnalyticsClient.voiceOutcome("transcription_error");
        clearMaximumTimer();
        clearRecordingTimer();
        if (recorder.current?.state === "recording") recorder.current.stop();
        else {
          stopTracks();
          releaseRecording();
          onState("error");
        }
      };
      cancelling.current = false;
      recorderFailed.current = false;
      recorder.current.start();
      productAnalyticsClient.voiceOutcome("recording_started");
      recordingStartedAt.current = Date.now();
      recordingTimer.current = window.setInterval(() => setRecordingElapsedSeconds(Math.min(90, Math.floor((Date.now() - recordingStartedAt.current) / 1_000))), 1_000);
      maximumTimer.current = window.setTimeout(stop, 90_000);
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

  function useTyped() {
    clearMaximumTimer();
    clearRecordingTimer();
    stopTracks();
    releaseRecording();
    onState("idle");
    onUseTyped();
  }

  const elapsed = `${String(Math.floor(recordingElapsedSeconds / 60)).padStart(2, "0")}:${String(recordingElapsedSeconds % 60).padStart(2, "0")}`;
  const blocked = state === "denied" && microphonePermission === "denied";
  const policyDenied = state === "policy-denied";
  return (
    <section className={styles.voiceControl} data-state={state} data-voice-state={state}>
      {state === "recording" ? <>
        <p className={styles.eyebrow}>{t("Listening…")}</p>
        <VoiceWave />
        <p className={styles.recordingTime}>{elapsed} / 01:30</p>
        <p className={styles.recordingTranscript}>{t("Your editable transcript will appear here when you tap Done.")}</p>
        <strong className={styles.srOnly} role="status">{t("Recording · {elapsed} / 01:30. Microphone is recording now.", { elapsed })}</strong>
        <div className={styles.voiceActions}><button aria-label={t("Stop recording")} className={styles.lightAction} onClick={stop} type="button">{t("Done")}</button><button aria-label={t("Cancel")} className={styles.secondaryAction} onClick={cancel} type="button">{t("Start over")}</button></div>
      </> : state === "success" ? <>
        <button aria-label={t("Record again")} className={styles.typingAction} disabled={disabled} onClick={start} type="button">{t("Record again")}</button>
        <p className={styles.voiceMessage} role="status">{t("Check the editable transcript below, then create your Starting Point.")}</p>
      </> : <>
        <button aria-label={t(policyDenied ? "Voice recording is unavailable on this page" : blocked ? "Check microphone access" : state === "denied" ? "Try microphone again" : "Tap to speak")} className={styles.microphoneAction} disabled={disabled || policyDenied || state === "requesting" || state === "transcribing"} onClick={state === "denied" ? async () => { if (!blocked || await readMicrophonePermission() !== "denied") await start(); } : start} type="button"><MicrophoneIcon /></button>
        <strong className={styles.voiceLabel}>{t(state === "requesting" ? "Requesting microphone…" : state === "transcribing" ? "Transcribing securely…" : policyDenied ? "Voice recording is unavailable on this page" : blocked ? "Microphone is blocked for this site" : state === "unsupported" ? "Voice recording is not supported here" : state === "cancelled" ? "Recording discarded" : "Tap to speak")}</strong>
        <button className={styles.typingAction} disabled={disabled} onClick={useTyped} type="button">{t("I'd rather type")}</button>
      </>}
      {state === "error" ? <p className={styles.error} role="alert">{recordingError || t("Voice transcription could not be completed.")} {retainedRecording.current ? <button className={styles.inlineButton} onClick={() => void transcribe(retainedRecording.current!, recordingDurationMs.current)} type="button">{t("Retry this recording")}</button> : null} <button className={styles.inlineButton} onClick={useTyped} type="button">{t("type instead")}</button>.</p> : null}
      {state === "unsupported" ? <p className={styles.error} role="alert">{t("This browser cannot record audio with the features B4GAMBLE needs.")} <button className={styles.inlineButton} onClick={useTyped} type="button">{t("type instead")}</button>.</p> : null}
      {policyDenied ? <p className={styles.error} role="alert">{t("Voice recording is unavailable on this page")} — <button className={styles.inlineButton} onClick={useTyped} type="button">{t("type instead")}</button>.</p> : null}
      {state === "denied" ? <p className={styles.error} role="alert">{t(blocked ? "Your browser will not show another prompt while this site is blocked. Allow microphone access using the site controls beside the address bar, then check access again." : "The permission prompt was dismissed or the microphone was not made available.")} {t("Nothing was recorded.")} <button className={styles.inlineButton} onClick={useTyped} type="button">{t("type instead")}</button>.</p> : null}
      {state === "cancelled" ? <p className={styles.voiceMessage} role="status">{t("The recording was discarded. Nothing was submitted.")}</p> : null}
    </section>
  );
}

export function Mission01IntakeScreen({
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
  locale,
}: {
  authorityActive: boolean;
  busy: boolean;
  error: string;
  situation: string;
  onSituation: (value: string) => void;
  onSubmit: () => void;
  onTranscript: (transcript: string, timing: { recordingDurationMs: number; transcriptionRequestMs: number }) => void;
  onTranscribe: (audio: Blob, durationMs: number) => Promise<{ transcript: string; transcriptionRequestMs: number }>;
  onUseTyped: () => void;
  inputMode: "text" | "voice";
  locale: ProgrammeLocale;
}) {
  const t = translated(locale);
  const [authority, setAuthority] = useState(authorityActive);
  const [recorderState, setRecorderState] = useState<ProgrammeRecorderState>("idle");
  useEffect(() => setAuthority(authorityActive), [authorityActive]);
  const textVisible = inputMode === "text" || Boolean(situation);
  const recording = recorderState === "recording";
  return (
    <div className={styles.canvas} data-programme-presentation="mission-01-intake" data-programme-presentation-state={recording ? "recording" : textVisible ? inputMode === "voice" ? "transcript" : "text-fallback" : "idle"}>
      <main className={styles.standardFrame} data-site-classification="STANDARD" data-site-frame="standard">
        <div className={styles.intakeState} data-intake-state={recording ? "recording" : textVisible ? "text" : "idle"}>
          {!recording && !textVisible ? <section className={styles.intakeIntro}>
          <p className={styles.eyebrow}>{t("Mission 01")}</p>
          <span className={styles.srOnly}>{t("Before you share.")}</span>
          <span className={styles.srOnly}>{t("What feels hardest to control right now?")}</span>
          <h1>{t("Tell us what is happening right now.")}</h1>
          <p>{t("In your own words. A minute is plenty — we'll build your Starting Point from it.")}</p>
        </section> : null}
        <Mission01VoiceControl disabled={busy || !authority} locale={locale} onState={setRecorderState} onTranscript={onTranscript} onTranscribe={onTranscribe} onUseTyped={onUseTyped} state={recorderState} />
        {textVisible ? <section className={styles.transcriptState} data-transcript-mode={inputMode === "voice" ? "transcript" : "text-fallback"}>
          <label>
            <span>{t(inputMode === "voice" ? "Editable transcript" : "Your situation")}</span>
            <textarea autoFocus maxLength={4000} onChange={(event) => onSituation(event.target.value)} placeholder={t("For example: I keep opening betting apps late at night after a stressful day…")} rows={6} value={situation} />
            <small>{situation.length}/4000 · {inputMode === "voice" ? t("Correct anything you want. ") : ""}{t("This draft stays in this browser session; only the Starting Point you confirm is saved.")}</small>
          </label>
          <button className={styles.primaryAction} disabled={busy || !authority || situation.trim().length < 20 || situation.trim().split(/\s+/).length < 4} onClick={onSubmit} type="button">{t(busy ? "Preparing your Starting Point…" : "Create my Starting Point")}</button>
        </section> : null}
        <StatusMessage error={error} />
        {!recording ? <aside className={styles.privacyBoundary}>
          <div><strong>{t("Before you share.")}</strong><span>{t("Your words may reveal health or other sensitive information. Typed input, or audio for transcription, is sent to our AI provider to create a suggested Starting Point. B4GAMBLE does not save the audio or use your words for offers or rankings.")} <Link href="/privacy#ai">{t("Privacy details")}</Link>.</span></div>
          <label><input checked={authority} disabled={busy || authorityActive} onChange={(event) => setAuthority(event.target.checked)} type="checkbox" /><span>{t("I explicitly consent to B4GAMBLE processing what I type or say, including information that may reveal my health, and sending it to its AI and transcription provider to personalise my Programme.")}</span></label>
          <small>{t("Optional. You can withdraw before saving. Withdrawal stops future processing and clears this draft, but cannot undo processing already completed.")}</small>
          </aside> : null}
        </div>
      </main>
    </div>
  );
}

export function ProgrammeSupportScreen({ busy, error, onContinue, xpPreview, locale }: { busy: boolean; error: string; onContinue: () => void; xpPreview: number; locale: ProgrammeLocale }) {
  const t = translated(locale);
  return (
    <div className={styles.canvas} data-programme-presentation="support-first">
      <main className={styles.standardFrame} data-site-classification="STANDARD" data-site-frame="standard">
        <div className={styles.focusedState}>
          <p className={styles.eyebrow}>{t("Support first")}</p>
          <h1>{t("Pause the Programme. Keep support close.")}</h1>
          <p>{t("Nothing here labels or diagnoses you. If continuing does not feel right, protected Help and pause options are available now.")}</p>
          <div className={styles.focusedActions}><Link className={styles.primaryAction} href={programmeHelpPath(locale)}>{t("Open protected Help")}</Link><button className={styles.secondaryAction} disabled={busy} onClick={onContinue} type="button">{t("Continue when I'm ready")}</button></div>
          <StatusMessage error={error} />
          <small>{t("Your {xp} XP for describing the situation is preserved. Registration and celebration are paused on this screen.", { xp: xpPreview })}</small>
        </div>
      </main>
    </div>
  );
}

export function StartingPointReadyScreen({
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
  locale,
}: {
  authenticated: boolean;
  candidate: ProgrammeStartingPointValue;
  googleLinkRecovery: boolean;
  googleAvailable: boolean;
  busy: boolean;
  error: string;
  onSave: () => void;
  onEmail: (input: { email: string; password: string; mode: "sign-up" | "sign-in" }) => void;
  onGoogle: () => void;
  onLinkGoogle: () => void;
  onWithdraw: () => void;
  locale: ProgrammeLocale;
}) {
  const t = translated(locale);
  const [emailOpen, setEmailOpen] = useState(googleLinkRecovery);
  const [mode, setMode] = useState<"sign-up" | "sign-in">(googleLinkRecovery ? "sign-in" : "sign-up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className={styles.canvas} data-programme-presentation="starting-point-ready">
      <main className={styles.standardFrame} data-site-classification="STANDARD" data-site-frame="standard">
        <div className={styles.readyState}>
          <p className={styles.readyEyebrow}>{t("✓ Your Starting Point is ready")}</p>
        <h1>{t("Your Starting Point, in your words.")}</h1>
        <section className={styles.startingPointCard}>
          <p>{candidate.startingPoint}</p>
          <span className={styles.srOnly}>{t("What changes next: {change}. Mission 02 continues here: {cue}.", { change: candidate.desiredChange.replace(/[.!?]+$/, ""), cue: candidate.continuationCue.replace(/[.!?]+$/, "") })}</span>
        </section>
        <section className={styles.registrationActions} data-programme-presentation-state="registration">
          {googleLinkRecovery ? <p>{t("Your confirmed Starting Point stays in this browser while you sign in and link Google securely.")}</p> : null}
          {authenticated ? <button className={styles.primaryAction} disabled={busy} onClick={googleLinkRecovery ? onLinkGoogle : onSave} type="button">{t(busy ? "Saving your Starting Point…" : googleLinkRecovery ? "Link Google securely" : "Save to my account")}</button> : <>
            {googleAvailable && !googleLinkRecovery ? <button className={`${styles.primaryAction} ${styles.googleAction}`} disabled={busy} onClick={onGoogle} type="button"><GoogleIcon />{t("Continue with Google — save my Starting Point")}</button> : null}
            {!googleLinkRecovery ? <button className={styles.typingAction} onClick={() => setEmailOpen((value) => !value)} type="button">{t(emailOpen ? "Hide email option" : "Use email instead")}</button> : null}
            {emailOpen ? <form className={styles.emailForm} onSubmit={(event: FormEvent) => { event.preventDefault(); onEmail({ email, password, mode }); }}>
              <label><span>{t("Email")}</span><input autoComplete="email" inputMode="email" name="email" onChange={(event) => setEmail(event.target.value)} required spellCheck={false} type="email" value={email} /></label>
              <label><span>{t("Password")}</span><input autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
              <button className={styles.primaryAction} disabled={busy} type="submit">{t(googleLinkRecovery ? "Sign in, then link Google" : mode === "sign-up" ? "Create account with email" : "Sign in with email")}</button>
              {!googleLinkRecovery ? <button className={styles.inlineButton} onClick={() => setMode((value) => value === "sign-up" ? "sign-in" : "sign-up")} type="button">{t(mode === "sign-up" ? "Already have an account? Sign in" : "Need an account? Create one")}</button> : null}
            </form> : null}
          </>}
          <StatusMessage error={error} />
          <small>{t("Google provides identity only; it does not verify age or receive your Programme words from B4GAMBLE. Registration adds 0 XP. Programme and Help data never feeds offers or rankings.")}</small>
          {!authenticated && !googleLinkRecovery ? <button className={styles.withdrawAction} disabled={busy} onClick={onWithdraw} type="button">{t("Withdraw consent and clear this draft")}</button> : null}
          </section>
        </div>
      </main>
    </div>
  );
}
