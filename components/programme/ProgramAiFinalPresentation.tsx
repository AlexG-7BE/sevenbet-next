"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import { PROGRAMME_MARKETING_OPT_IN_LABEL } from "@/lib/customers/email-preference-client";
import { programmeText, type ProgrammeMessageKey } from "@/lib/i18n/programme-catalog";
import type { ProgrammeStartingPointValue } from "@/lib/programme/program-ai/contracts";
import {
  programmeAudioBlobFitsUploadLimit,
} from "@/lib/programme/program-ai/transcription-limits";
import {
  connectProgrammeRealtimeTranscription,
  type ProgrammeRealtimeTranscription,
} from "@/lib/programme/program-ai/realtime-transcription-client";
import {
  applyProgrammeVoiceDraftText,
  beginProgrammeVoiceDraftSegment,
  reconcileProgrammeVoiceDraftEdit,
  type ProgrammeVoiceDraftSegment,
} from "@/lib/programme/program-ai/voice-draft";
import { programmeHelpPath, type ProgrammeLocale } from "@/lib/programme/presentation";
import styles from "./ProgramAiFinalPresentation.module.css";

export type ProgrammeRecorderState = "idle" | "requesting" | "recording" | "live" | "finalizing" | "fallback" | "denied" | "policy-denied" | "unsupported" | "success" | "error";
export type ProgrammeVoiceTiming = {
  recordingDurationMs: number;
  transcriptionMode: "realtime" | "file_fallback";
  transcriptionRequestMs: number;
  firstPartialTranscriptMs?: number;
  stopToFinalTranscriptMs: number;
  fallbackReason?: string;
};
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

/** Sets the closing words of a catalogued heading in the editorial serif without changing the copy. */
function SerifTail({ text, words = 2 }: { text: string; words?: number }) {
  const parts = text.trim().split(/\s+/);
  if (parts.length <= words) return <>{text}</>;
  return <>{parts.slice(0, -words).join(" ")} <em>{parts.slice(-words).join(" ")}</em></>;
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
  // Founder decision, 25 Sep 2026: the explicit consent to process the story is the third
  // required check here and is asked nowhere else on this route, so Mission 01 opens ready to speak.
  const [processing, setProcessing] = useState(false);
  return (
    <div className={styles.canvas} data-programme-presentation="access">
      <main className={styles.standardFrame} data-site-classification="STANDARD" data-site-frame="standard">
        <div className={styles.accessState}>
          <p className={styles.eyebrow}>{t("Programme access")}</p>
          <h1 id="programme-access-title"><SerifTail text={t("Three checks before you begin.")} /></h1>
          <section className={styles.accessBoundary} aria-labelledby="programme-access-title">
            <label className={styles.checkRow}>
              <input checked={adult} onChange={(event) => setAdult(event.target.checked)} type="checkbox" />
              <span>{t("I confirm I am 18 or over")} <small>{t("Required")}</small></span>
            </label>
            <div className={styles.checkRow}>
              <input checked={legal} id="programme-legal-acknowledgement" onChange={(event) => setLegal(event.target.checked)} type="checkbox" />
              <span><label htmlFor="programme-legal-acknowledgement">{t("I agree to the Terms and confirm I have read the Privacy Notice")}</label><small>{t("Required")}</small></span>
            </div>
            <label className={`${styles.checkRow} ${styles.consentRow}`} data-programme-access-consent="">
              <input checked={processing} onChange={(event) => setProcessing(event.target.checked)} type="checkbox" />
              <span>{t("I explicitly consent to B4GAMBLE processing what I type or say, including information that may reveal my health, and sending it to its AI and transcription provider to personalise my Programme.")} <small>{t("Required")}</small></span>
            </label>
            <button className={styles.primaryAction} disabled={busy || !adult || !legal || !processing} onClick={onConfirm} type="button">
              {busy ? t("Verifying access…") : t("Enter Mission 01")}
            </button>
            <p className={styles.legalLinks}><Link href="/terms">{t("Read Terms")}</Link><Link href="/privacy">{t("Read Privacy Notice")}</Link></p>
            <StatusMessage error={error} />
            <Link className={styles.helpLink} href={programmeHelpPath(locale)}>{t("Protected Help / pause options →")}</Link>
          </section>
        </div>
      </main>
    </div>
  );
}

function MicrophoneIcon() {
  return <svg aria-hidden="true" fill="none" height="28" viewBox="0 0 24 24" width="28"><rect height="11" rx="3" stroke="currentColor" strokeWidth="1.8" width="6" x="9" y="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>;
}

function GoogleIcon() {
  return <svg aria-hidden="true" height="18" viewBox="0 0 24 24" width="18"><path d="M21.35 11.1H12v2.9h5.35c-.5 2.4-2.55 3.8-5.35 3.8a5.8 5.8 0 1 1 0-11.6c1.45 0 2.75.5 3.8 1.45l2.15-2.15A8.9 8.9 0 0 0 12 3a9 9 0 1 0 0 18c5.2 0 8.65-3.65 8.65-8.8 0-.35-.1-.75-.3-1.1z" fill="currentColor" /></svg>;
}

function Mission01Composer({
  disabled,
  getRealtimeRequestHeaders,
  locale,
  onPrepareVoice,
  onSituation,
  onState,
  onTranscribe,
  onVoiceTiming,
  situation,
  state,
}: {
  disabled: boolean;
  getRealtimeRequestHeaders: () => HeadersInit;
  locale: ProgrammeLocale;
  onPrepareVoice: () => Promise<void>;
  onSituation: (value: string, source: "text" | "voice") => void;
  state: ProgrammeRecorderState;
  onState: (state: ProgrammeRecorderState) => void;
  onTranscribe: (audio: Blob, durationMs: number) => Promise<{ transcript: string; transcriptionRequestMs: number }>;
  onVoiceTiming: (timing: ProgrammeVoiceTiming) => void;
  situation: string;
}) {
  const t = translated(locale);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const realtime = useRef<ProgrammeRealtimeTranscription | null>(null);
  const realtimeSetup = useRef<Promise<ProgrammeRealtimeTranscription> | null>(null);
  const realtimeAbandoned = useRef(false);
  const realtimeFailure = useRef<string | undefined>(undefined);
  const firstPartialTranscriptMs = useRef<number | undefined>(undefined);
  const [recordingElapsedSeconds, setRecordingElapsedSeconds] = useState(0);
  const [microphonePermission, setMicrophonePermission] = useState<MicrophonePermissionState>("unknown");
  const [recordingError, setRecordingError] = useState("");
  const [composerNotice, setComposerNotice] = useState("");
  const draftRef = useRef(situation);
  const voiceSegment = useRef<ProgrammeVoiceDraftSegment | null>(null);
  const recordingStartedAt = useRef(0);
  const recordingDurationMs = useRef(0);
  const maximumTimer = useRef<number | null>(null);
  const recordingTimer = useRef<number | null>(null);
  const recorderFailed = useRef(false);

  useEffect(() => {
    draftRef.current = situation;
  }, [situation]);

  function updateDraft(value: string, source: "text" | "voice") {
    draftRef.current = value;
    onSituation(value, source);
  }

  function applyVoiceText(value: string) {
    const segment = voiceSegment.current;
    if (!segment || segment.conflicted) {
      if (segment?.conflicted) setComposerNotice(t("Your edits are preserved; this voice result will not overwrite them."));
      return;
    }
    const applied = applyProgrammeVoiceDraftText(draftRef.current, segment, value);
    voiceSegment.current = applied.segment;
    updateDraft(applied.draft, "voice");
    setComposerNotice(applied.truncated ? t("Draft limit reached. Your existing text was preserved.") : "");
  }

  function editDraft(value: string) {
    if (voiceSegment.current) {
      voiceSegment.current = reconcileProgrammeVoiceDraftEdit(draftRef.current, value, voiceSegment.current);
      if (voiceSegment.current.conflicted) {
        setComposerNotice(t("Your edits are preserved; this voice result will not overwrite them."));
      }
    }
    updateDraft(value, "text");
  }

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

  function closeRealtime() {
    realtimeAbandoned.current = true;
    realtime.current?.close();
    realtime.current = null;
    realtimeSetup.current = null;
  }

  function releaseRecording() {
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
      closeRealtime();
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

  function logVoiceTiming(timing: ProgrammeVoiceTiming) {
    console.info(JSON.stringify({
      event: "programme_voice_transcription_client",
      transcriptionMode: timing.transcriptionMode,
      recordingDurationMs: timing.recordingDurationMs,
      transcriptionRequestMs: timing.transcriptionRequestMs,
      firstPartialTranscriptMs: timing.firstPartialTranscriptMs,
      stopToFinalTranscriptMs: timing.stopToFinalTranscriptMs,
      fallbackReason: timing.fallbackReason,
    }));
  }

  async function transcribe(
    audio: Blob,
    durationMs: number,
    stoppedAt = Date.now(),
    fallbackReason = "manual_retry",
  ) {
    setRecordingError("");
    if (!programmeAudioBlobFitsUploadLimit(audio.size)) {
      releaseRecording();
      setRecordingError(t("This recording is too large to upload. Record a shorter voice note or type instead."));
      productAnalyticsClient.voiceOutcome("transcription_error");
      onState("error");
      return;
    }
    onState("fallback");
    try {
      const result = await onTranscribe(audio, durationMs);
      const timing: ProgrammeVoiceTiming = {
        recordingDurationMs: durationMs,
        transcriptionMode: "file_fallback",
        transcriptionRequestMs: result.transcriptionRequestMs,
        stopToFinalTranscriptMs: Math.max(0, Date.now() - stoppedAt),
        fallbackReason,
      };
      releaseRecording();
      applyVoiceText(result.transcript);
      onVoiceTiming(timing);
      logVoiceTiming(timing);
      productAnalyticsClient.voiceOutcome("transcription_success");
      onState("success");
    } catch {
      releaseRecording();
      setRecordingError(t("Voice transcription could not be completed."));
      productAnalyticsClient.voiceOutcome("transcription_error");
      onState("error");
    }
  }

  function withDeadline<T>(promise: Promise<T>, milliseconds: number) {
    return Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => window.setTimeout(
        () => reject(new Error("REALTIME_TRANSCRIPTION_TIMEOUT")),
        milliseconds,
      )),
    ]);
  }

  async function finalize(audio: Blob, durationMs: number) {
    const stoppedAt = Date.now();
    onState("finalizing");
    try {
      const connection = realtime.current
        ?? (realtimeSetup.current ? await withDeadline(realtimeSetup.current, 1_500) : null);
      if (!connection) throw new Error("REALTIME_TRANSCRIPTION_UNAVAILABLE");
      realtime.current = connection;
      connection.commit();
      stopTracks();
      const transcript = await withDeadline(connection.finalTranscript, 6_000);
      if (!transcript.trim()) {
        throw new Error("REALTIME_TRANSCRIPTION_INVALID");
      }
      const timing: ProgrammeVoiceTiming = {
        recordingDurationMs: durationMs,
        transcriptionMode: "realtime",
        transcriptionRequestMs: 0,
        firstPartialTranscriptMs: firstPartialTranscriptMs.current,
        stopToFinalTranscriptMs: Math.max(0, Date.now() - stoppedAt),
      };
      connection.close();
      realtime.current = null;
      realtimeSetup.current = null;
      releaseRecording();
      applyVoiceText(transcript);
      onVoiceTiming(timing);
      logVoiceTiming(timing);
      productAnalyticsClient.voiceOutcome("transcription_success");
      onState("success");
    } catch {
      const failure = realtimeFailure.current ?? "realtime_finalization_failed";
      closeRealtime();
      stopTracks();
      await transcribe(audio, durationMs, stoppedAt, failure);
    }
  }

  function startRealtime(activeStream: MediaStream) {
    realtimeAbandoned.current = false;
    realtimeFailure.current = undefined;
    firstPartialTranscriptMs.current = undefined;
    if (typeof RTCPeerConnection === "undefined") {
      realtimeFailure.current = "webrtc_unsupported";
      return;
    }
    const setup = connectProgrammeRealtimeTranscription({
      locale,
      stream: activeStream,
      requestHeaders: getRealtimeRequestHeaders(),
      onPartial: (partial) => {
        if (realtimeAbandoned.current) return;
        if (firstPartialTranscriptMs.current === undefined) {
          firstPartialTranscriptMs.current = Math.max(0, Date.now() - recordingStartedAt.current);
        }
        applyVoiceText(partial);
      },
    });
    realtimeSetup.current = setup;
    void setup.then((connection) => {
      if (realtimeAbandoned.current) {
        connection.close();
        return;
      }
      realtime.current = connection;
      if (recorder.current?.state === "recording") onState("live");
    }).catch(() => {
      realtimeFailure.current = "realtime_setup_failed";
      realtimeSetup.current = null;
    });
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
    setComposerNotice("");
    onState("requesting");
    try {
      await onPrepareVoice();
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
        if (recorderFailed.current) {
          recorderFailed.current = false;
          closeRealtime();
          stopTracks();
          releaseRecording();
          onState("error");
          return;
        }
        const audio = new Blob(chunks.current, { type: recorder.current?.mimeType || chunks.current[0]?.type || "audio/webm" });
        chunks.current = [];
        void finalize(audio, recordingDurationMs.current);
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
      recorderFailed.current = false;
      voiceSegment.current = beginProgrammeVoiceDraftSegment(draftRef.current);
      recorder.current.start();
      productAnalyticsClient.voiceOutcome("recording_started");
      recordingStartedAt.current = Date.now();
      startRealtime(stream.current);
      recordingTimer.current = window.setInterval(() => setRecordingElapsedSeconds(Math.min(90, Math.floor((Date.now() - recordingStartedAt.current) / 1_000))), 1_000);
      maximumTimer.current = window.setTimeout(stop, 90_000);
      onState("recording");
    } catch (cause) {
      clearMaximumTimer();
      clearRecordingTimer();
      closeRealtime();
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

  const elapsed = `${String(Math.floor(recordingElapsedSeconds / 60)).padStart(2, "0")}:${String(recordingElapsedSeconds % 60).padStart(2, "0")}`;
  const blocked = state === "denied" && microphonePermission === "denied";
  const policyDenied = state === "policy-denied";
  const recording = state === "recording" || state === "live";
  const transitioning = state === "requesting" || state === "finalizing" || state === "fallback";
  const microphoneDisabled = disabled || transitioning || policyDenied || state === "unsupported";
  const microphoneLabel = recording ? t("Stop voice input") : t("Start voice input");
  const status = state === "requesting"
    ? t("Requesting microphone…")
    : state === "finalizing" || state === "fallback"
      ? t("Transcribing securely…")
      : recording
        ? t("Listening…")
        : state === "success"
          ? t("Voice added. You can edit it or add more.")
          : "";
  return (
    <section className={styles.composer} data-state={state} data-voice-state={state}>
      <label className={styles.composerLabel} htmlFor="mission-01-situation">{t("Your situation")}</label>
      <div className={styles.composerField} data-recording={recording ? "true" : "false"}>
        <textarea id="mission-01-situation" maxLength={4000} onChange={(event) => editDraft(event.target.value)} placeholder={t("For example: I keep opening betting apps late at night after a stressful day…")} rows={7} value={situation} />
        <button aria-label={microphoneLabel} aria-pressed={recording} className={styles.composerMicrophone} disabled={microphoneDisabled} onClick={recording ? stop : state === "denied" ? async () => { if (!blocked || await readMicrophonePermission() !== "denied") await start(); } : start} type="button"><MicrophoneIcon /></button>
      </div>
      <div className={styles.composerMeta}>
        <small>{situation.length}/4000 · {t("This draft stays in this browser session; only the Starting Point you confirm is saved.")}</small>
        {recording ? <small aria-hidden="true">{elapsed} / 01:30</small> : null}
      </div>
      {status ? <p className={styles.composerStatus} role="status">{status}</p> : null}
      {composerNotice ? <p className={styles.composerStatus} role="status">{composerNotice}</p> : null}
      {state === "error" ? <p className={styles.error} role="alert">{recordingError || t("Voice transcription could not be completed.")} {t("Your existing draft is still here.")}</p> : null}
      {state === "unsupported" ? <p className={styles.error} role="alert">{t("This browser cannot record audio with the features B4GAMBLE needs.")} {t("You can keep typing in the same field.")}</p> : null}
      {policyDenied ? <p className={styles.error} role="alert">{t("Voice recording is unavailable on this page")} — {t("You can keep typing in the same field.")}</p> : null}
      {state === "denied" ? <p className={styles.error} role="alert">{t(blocked ? "Your browser will not show another prompt while this site is blocked. Allow microphone access using the site controls beside the address bar, then check access again." : "The permission prompt was dismissed or the microphone was not made available.")} {t("Nothing was recorded.")} {t("Your existing draft is still here.")}</p> : null}
    </section>
  );
}

export function Mission01IntakeScreen({
  busy,
  error,
  getRealtimeRequestHeaders,
  situation,
  onAccountFirst,
  onPrepareVoice,
  onSituation,
  onSubmit,
  onTranscribe,
  onVoiceTiming,
  locale,
}: {
  busy: boolean;
  error: string;
  getRealtimeRequestHeaders: () => HeadersInit;
  situation: string;
  onAccountFirst?: () => void;
  onPrepareVoice: () => Promise<void>;
  onSituation: (value: string, source: "text" | "voice") => void;
  onSubmit: () => void;
  onTranscribe: (audio: Blob, durationMs: number) => Promise<{ transcript: string; transcriptionRequestMs: number }>;
  onVoiceTiming: (timing: ProgrammeVoiceTiming) => void;
  locale: ProgrammeLocale;
}) {
  const t = translated(locale);
  const [recorderState, setRecorderState] = useState<ProgrammeRecorderState>("idle");
  const recording = ["requesting", "recording", "live", "finalizing", "fallback"].includes(recorderState);
  return (
    <div className={styles.canvas} data-programme-presentation="mission-01-intake" data-programme-presentation-state={recording ? "recording" : "composer"}>
      <main className={styles.standardFrame} data-site-classification="STANDARD" data-site-frame="standard">
        <div className={styles.intakeState} data-intake-state={recording ? "recording" : "composer"}>
          <section className={styles.intakeIntro}>
          <p className={styles.eyebrow}>{t("Mission 01")}</p>
          <span className={styles.srOnly}>{t("What feels hardest to control right now?")}</span>
          <h1><SerifTail text={t("Tell us what is happening right now.")} /></h1>
          <p>{t("In your own words. A minute is plenty — we'll build your Starting Point from it.")}</p>
          </section>
        <Mission01Composer disabled={busy} getRealtimeRequestHeaders={getRealtimeRequestHeaders} locale={locale} onPrepareVoice={onPrepareVoice} onSituation={onSituation} onState={setRecorderState} onTranscribe={onTranscribe} onVoiceTiming={onVoiceTiming} situation={situation} state={recorderState} />
        <button className={styles.primaryAction} disabled={busy || recording || situation.trim().length < 20 || situation.trim().split(/\s+/).length < 4} onClick={onSubmit} type="button">{t(busy ? "Preparing your Starting Point…" : "Create my Starting Point")}</button>
        {onAccountFirst && !recording && !situation ? <button className={styles.accountFirstAction} data-programme-account-first="" disabled={busy} onClick={onAccountFirst} type="button">{t("Create an account first →")}</button> : null}
        <StatusMessage error={error} />
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
  onBack,
  googleLinkRecovery,
  googleAvailable,
  busy,
  error,
  onSave,
  onEmail,
  onGoogle,
  onLinkGoogle,
  locale,
}: {
  authenticated: boolean;
  /** Null on the account-first route: the person registers before telling their story. */
  candidate: ProgrammeStartingPointValue | null;
  onBack?: () => void;
  googleLinkRecovery: boolean;
  googleAvailable: boolean;
  busy: boolean;
  error: string;
  onSave: () => void;
  onEmail: (input: { email: string; password: string; mode: "sign-up" | "sign-in"; marketingAllowed: boolean }) => void;
  onGoogle: () => void;
  onLinkGoogle: () => void;
  locale: ProgrammeLocale;
}) {
  const t = translated(locale);
  const [emailOpen, setEmailOpen] = useState(googleLinkRecovery);
  const [mode, setMode] = useState<"sign-up" | "sign-in">(googleLinkRecovery ? "sign-in" : "sign-up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketingAllowed, setMarketingAllowed] = useState(false);
  return (
    <div className={styles.canvas} data-programme-presentation="starting-point-ready">
      <main className={styles.standardFrame} data-site-classification="STANDARD" data-site-frame="standard">
        <div className={styles.readyState}>
          {candidate ? <>
          <p className={styles.readyEyebrow}>{t("✓ Your Starting Point is ready")}</p>
        <h1><SerifTail text={t("Your Starting Point, in your words.")} words={3} /></h1>
        <section className={styles.startingPointCard}>
          <p>{candidate.startingPoint}</p>
        </section>
        <section className={styles.understandingSummary} data-programme-understanding="">
          <div>
            <h2>{t("What we'll work on first")}</h2>
            <p>{candidate.desiredChange}</p>
          </div>
        </section>
          </> : <>
        <h1><SerifTail text={t("Save your place first.")} words={2} /></h1>
        <p className={styles.accountFirstLead}>{t("Create your account now. Mission 01 waits in your plan whenever you are ready.")}</p>
          </>}
        <section className={styles.registrationActions} data-programme-presentation-state="registration">
          {googleLinkRecovery ? <p>{t("Your confirmed Starting Point stays in this browser while you sign in and link Google securely.")}</p> : null}
          {authenticated && !candidate ? null : authenticated ? <button className={styles.primaryAction} disabled={busy} onClick={googleLinkRecovery ? onLinkGoogle : onSave} type="button">{t(busy ? "Saving your Starting Point…" : googleLinkRecovery ? "Link Google securely" : "Save to my account")}</button> : <>
            {googleAvailable && !googleLinkRecovery ? <button className={`${styles.primaryAction} ${styles.googleAction}`} disabled={busy} onClick={onGoogle} type="button"><GoogleIcon />{t("Continue with Google — save my Starting Point")}</button> : null}
            {!googleLinkRecovery ? <button className={styles.typingAction} onClick={() => setEmailOpen((value) => !value)} type="button">{t(emailOpen ? "Hide email option" : "Use email instead")}</button> : null}
            {emailOpen ? <form className={styles.emailForm} onSubmit={(event: FormEvent) => { event.preventDefault(); onEmail({ email, password, mode, marketingAllowed: mode === "sign-up" && marketingAllowed }); }}>
              <label><span>{t("Email")}</span><input autoComplete="email" inputMode="email" name="email" onChange={(event) => setEmail(event.target.value)} required spellCheck={false} type="email" value={email} /></label>
              <label><span>{t("Password")}</span><input autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
              {mode === "sign-up" ? <label className={styles.marketingChoice}><input checked={marketingAllowed} onChange={(event) => setMarketingAllowed(event.target.checked)} type="checkbox" /><span>{PROGRAMME_MARKETING_OPT_IN_LABEL}</span></label> : null}
              <button className={styles.primaryAction} disabled={busy} type="submit">{t(googleLinkRecovery ? "Sign in, then link Google" : mode === "sign-up" ? "Create account with email" : "Sign in with email")}</button>
              {!googleLinkRecovery ? <button className={styles.inlineButton} onClick={() => setMode((value) => value === "sign-up" ? "sign-in" : "sign-up")} type="button">{t(mode === "sign-up" ? "Already have an account? Sign in" : "Need an account? Create one")}</button> : null}
            </form> : null}
          </>}
          <StatusMessage error={error} />
          {!candidate && onBack && !googleLinkRecovery ? <button className={styles.typingAction} disabled={busy} onClick={onBack} type="button">{t("← Tell my story first")}</button> : null}
          </section>
        </div>
      </main>
    </div>
  );
}
