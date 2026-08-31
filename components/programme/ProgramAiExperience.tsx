"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ProgramAiHomeScreen } from "@/components/programme/ProgramAiHome";
import {
  Mission01IntakeScreen,
  ProgrammeAccessScreen,
  ProgrammeLoadingScreen,
  ProgrammeSupportScreen,
  ProgrammeUnavailableScreen,
  StartingPointReadyScreen,
} from "@/components/programme/ProgramAiFinalPresentation";
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
  programmeGoogleCallbacks,
} from "@/lib/auth/google-flow";
import { programmeText, type ProgrammeMessageKey } from "@/lib/i18n/programme-catalog";
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
import { programmeAccessFailureMessageKey } from "@/lib/programme/program-ai/access-errors";
import { programmeAudioBlobFitsUploadLimit } from "@/lib/programme/program-ai/transcription-limits";
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
import type { ProgrammeLocale } from "@/lib/programme/presentation";
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


type ProgramAiLocalState = {
  phase: Phase;
  situation: string;
  candidate: ProgrammeStartingPointValue | null;
  inputMode: "text" | "voice";
  xpPreview: number;
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
  xpPreview: 0,
};

const phaseMessageKeys = {
  loading: "loading",
  access: "access",
  intake: "intake",
  support: "support",
  registration: "registration",
  home: "home",
  mission: "mission",
  review: "review",
} as const satisfies Record<Phase, ProgrammeMessageKey>;

function restoredAnonymousState(value: ProgramAiLocalState | null | undefined): ProgramAiLocalState {
  if (!value) return emptyLocalState;
  const legacyPhase = String(value.phase);
  const phase = legacyPhase === "clarification"
    ? "intake"
    : legacyPhase === "candidate" || legacyPhase === "reward"
      ? value.candidate ? "registration" : "intake"
      : value.phase === "home" ? "intake" : value.phase;
  return { phase, situation: value.situation || "", candidate: value.candidate || null, inputMode: value.inputMode === "text" ? "text" : "voice", xpPreview: Number.isFinite(value.xpPreview) ? value.xpPreview : 0 };
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
      ...(subject.kind === "journey" && hasProgrammeAccessAuthority(window.sessionStorage, subject)
        ? { [PROGRAMME_ACCESS_HEADERS.age]: PROGRAMME_ACCESS_HEADER_VALUES.age }
        : {}),
      ...init?.headers,
    },
  });
  const payload = await response.json() as ApiPayload<T>;
  if (!response.ok || payload.ok === false) {
    const error = new Error("PROGRAMME_REQUEST_FAILED") as Error & {
      code?: string;
      status?: number;
    };
    error.code = payload.code;
    error.status = response.status;
    throw error;
  }
  return payload;
}

export function ProgramAiExperience({
  googleAvailable = false,
  locale,
  programmePath,
}: {
  googleAvailable?: boolean;
  locale: ProgrammeLocale;
  programmePath: string;
}) {
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
      setError(programmeText(locale, "Google linking was not completed. Your Starting Point is still here; retry when you are ready."));
    } else if (authState === "google-error") {
      setError(programmeText(locale, "Google account access was not completed. You can retry or use email instead."));
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
          .catch(() => setError(programmeText(locale, "Your progress could not be saved yet")))
          .finally(() => setBusy(false));
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
      fetch("/api/programme-access/authority", { credentials: "same-origin", cache: "no-store" })
        .then(async (response) => {
          const access = await response.json() as ApiPayload<{ accepted: boolean }>;
          if (!response.ok || access.ok === false) throw new Error("PROGRAMME_ACCESS_STATUS_UNAVAILABLE");
          if (!access.accepted) {
            setHome(null);
            setPhase("access");
            return;
          }
          const homeResponse = await fetch("/api/program/program-ai/home", { credentials: "same-origin", cache: "no-store" });
          const payload = await homeResponse.json() as ApiPayload<{ home: ProgramAiHome }>;
          if (!homeResponse.ok || !payload.home) throw new Error("PROGRAMME_HOME_UNAVAILABLE");
          setHome(payload.home);
          setPhase("home");
        })
        .catch(() => { setError(programmeText(locale, "Programme home unavailable")); setHome(null); setPhase("home"); });
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
  }, [googleLinkRecovery, locale, redeem, session?.user.id, sessionPending]);

  async function grantAccess() {
    if (!subject) return;
    const entryMode = subject.kind === "journey" && hasProgrammeAccessAuthority(window.sessionStorage, subject) ? "resume" : "start";
    productAnalyticsClient.startClicked("other_public");
    setBusy(true); setError("");
    const journey = subject.kind === "journey" ? subject : null;
    try {
      const response = await fetch("/api/programme-access/authority", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(journey ? { journeyId: journey.id } : {}),
          adultConfirmed: true,
          termsAccepted: true,
          privacyAcknowledged: true,
          termsVersion: PROGRAMME_TERMS_VERSION,
          privacyVersion: PROGRAMME_PRIVACY_VERSION,
        }),
      });
      const payload = await response.json() as ApiPayload<{ accepted: boolean; authority?: ProgrammeAccessAuthority }>;
      if (!response.ok || payload.ok === false) throw new Error("PROGRAMME_ACCESS_NOT_VERIFIED");
      if (!journey) {
        const homeResponse = await fetch("/api/program/program-ai/home", { credentials: "same-origin", cache: "no-store" });
        const homePayload = await homeResponse.json() as ApiPayload<{ home: ProgramAiHome }>;
        if (!homeResponse.ok || !homePayload.home) throw new Error("PROGRAMME_HOME_UNAVAILABLE");
        productAnalyticsClient.accessGranted(entryMode);
        setHome(homePayload.home);
        setPhase("home");
        setBusy(false);
        return;
      }
      if (!payload.authority) throw new Error("PROGRAMME_ACCESS_NOT_VERIFIED");
      writeProgrammeAccessContinuation(window.sessionStorage, journey, payload.authority);
    } catch {
      setError(programmeText(locale, programmeAccessFailureMessageKey("authority")));
      setBusy(false);
      return;
    }
    try {
      if (!journey) return;
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
      const requestError = cause as Error & { code?: string };
      setError(programmeText(locale, programmeAccessFailureMessageKey("session", requestError)));
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
        progress: { taskStates: string[]; xpPreview: number };
        timing?: { programmeAiTurnMs?: number };
      }>("/api/program/program-ai/turn", subject, {
        method: "POST",
        body: JSON.stringify({ locale, inputMode: local.inputMode, situation: local.situation, clarificationAnswers: [] }),
      });
      accumulatedAiLatencyMs.current += payload.timing?.programmeAiTurnMs ?? 0;
      if (payload.result.kind !== "STARTING_POINT_CANDIDATE" || !payload.result.candidate) {
        throw new Error("STARTING_POINT_NOT_PREPARED");
      }
      const readyState = { ...local, candidate: payload.result.candidate, phase: "registration" as const, xpPreview: payload.progress?.xpPreview ?? 0 };
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
      setError(programmeText(locale, "Your Starting Point could not be prepared"));
    }
    finally { setBusy(false); }
  }

  async function transcribeVoice(audio: Blob, durationMs: number) {
    if (!subject) throw new Error(programmeText(locale, "Programme session unavailable"));
    if (!programmeAudioBlobFitsUploadLimit(audio.size)) {
      throw new Error(programmeText(locale, "This recording is too large to upload. Record a shorter voice note or type instead."));
    }
    await ensureSensitiveAuthority();
    const form = new FormData();
    form.set("audio", audio, "programme-m1-recording");
    form.set("durationMs", String(durationMs));
    form.set("locale", locale);
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
    } catch { setError(programmeText(locale, "The Programme could not resume")); }
    finally { setBusy(false); }
  }

  async function withdrawSensitiveInput() {
    if (!subject) return;
    setBusy(true); setError("");
    try {
      await programAiRequest("/api/program/program-ai/authority", subject, { method: "DELETE" });
      setSensitiveAuthorityActive(false);
      persist({ ...emptyLocalState, phase: "intake" });
    } catch { setError(programmeText(locale, "Authority could not be withdrawn")); }
    finally { setBusy(false); }
  }

  async function prepareClaimForRegistration() {
    if (!subject || !local.candidate) throw new Error(programmeText(locale, "Your Starting Point is unavailable in this browser session"));
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
    catch { setError(programmeText(locale, "Your progress could not be saved yet")); }
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
      if (result.error || !result.data?.user.id) {
        setError(programmeText(locale, input.mode === "sign-up" && !googleLinkRecovery
          ? "This account could not be created. Try signing in if it already exists."
          : "Email or password is incorrect."));
        return;
      }
      if (googleLinkRecovery) {
        await startGoogleLink();
        return;
      }
      await redeem(result.data.user.id, subject, local);
    } catch { setError(programmeText(locale, "Account access failed")); }
    finally { emailRedeemStarted.current = false; setBusy(false); }
  }

  async function handleGoogle() {
    if (!subject || subject.kind !== "journey") return;
    setBusy(true); setError("");
    try {
      const callbacks = programmeGoogleCallbacks(locale);
      await prepareClaimForRegistration();
      writeProgrammeOAuthClaimMarker(window.sessionStorage, subject);
      const result = await authClient.signIn.social({
        provider: "google",
        ...callbacks,
        requestSignUp: true,
        fetchOptions: { headers: programmeAuthAccessHeaders(window.sessionStorage, subject) },
      });
      if (result.error) throw new Error("GOOGLE_ACCOUNT_ACCESS_NOT_STARTED");
    } catch {
      clearProgrammeOAuthClaimMarker(window.sessionStorage);
      setError(programmeText(locale, "Google account access failed"));
      setBusy(false);
    }
  }

  async function startGoogleLink() {
    setBusy(true); setError("");
    try {
      const callbacks = programmeGoogleCallbacks(locale, "link");
      const result = await authClient.linkSocial({
        provider: "google",
        ...callbacks,
      });
      if (result.error) throw new Error("GOOGLE_LINK_NOT_STARTED");
    } catch {
      setError(programmeText(locale, "Google linking failed"));
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
    } catch {
      setError(programmeText(locale, "The Mission could not be opened"));
      setPhase("home");
    } finally { setBusy(false); }
  }

  async function openReview(milestone: "first" | "mid" | "full") {
    if (!subject) return;
    setBusy(true); setError("");
    try {
      const payload = await programAiRequest<{ review: ProgramAiReview }>(
        `/api/program/program-ai/reviews/${milestone}?locale=${encodeURIComponent(locale)}`,
        subject,
      );
      setActiveReview({ milestone, review: payload.review });
      setPhase("review");
      productAnalyticsClient.reviewOpened(milestone);
    } catch {
      setError(programmeText(locale, "The Review could not be opened"));
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

  async function enterMissionOneFromHome() {
    const journey = rotateAnonymousProgrammeSubject(window.sessionStorage);
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/programme-access/authority", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ journeyId: journey.id }),
      });
      const payload = await response.json() as ApiPayload<{ authority?: ProgrammeAccessAuthority }>;
      if (!response.ok || !payload.authority) throw new Error("PROGRAMME_ACCESS_REFRESH_FAILED");
      writeProgrammeAccessContinuation(window.sessionStorage, journey, payload.authority);
      await programAiRequest("/api/program/program-ai/session", journey, {
        method: "POST",
        headers: programmeAuthAccessHeaders(window.sessionStorage, journey),
      });
      setSubject(journey);
      setSensitiveAuthorityActive(false);
      personalisationStartedAt.current = null;
      accumulatedAiLatencyMs.current = 0;
      voiceTiming.current = null;
      persist({ ...emptyLocalState, phase: "intake" }, journey);
    } catch {
      setError(programmeText(locale, programmeAccessFailureMessageKey("authority")));
      setPhase("home");
    } finally {
      setBusy(false);
    }
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
      aria-label={programmeText(locale, "Programme {phase} screen", { phase: programmeText(locale, phaseMessageKeys[phase]) })}
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

  if (phase === "loading" || sessionPending) return renderPhase(<ProgrammeLoadingScreen locale={locale} />);
  if (phase === "access") return renderPhase(<ProgrammeAccessScreen busy={busy} error={error} locale={locale} onConfirm={grantAccess} />);
  if (phase === "intake") return renderPhase(<Mission01IntakeScreen authorityActive={sensitiveAuthorityActive} busy={busy} error={error} inputMode={local.inputMode} locale={locale} onSituation={(situation) => { const next = { ...local, situation }; setLocal(next); if (subject) mergeProgrammeSubjectContent(window.sessionStorage, subject, { programAi: next }); }} onSubmit={() => submitTurn(true)} onTranscript={acceptTranscript} onTranscribe={transcribeVoice} onUseTyped={useTypedInput} situation={local.situation} />);
  if (phase === "support") return renderPhase(<ProgrammeSupportScreen busy={busy} error={error} locale={locale} onContinue={continueAfterSupport} xpPreview={local.xpPreview} />);
  if (phase === "registration" && local.candidate) return renderPhase(<StartingPointReadyScreen authenticated={Boolean(session?.user.id)} busy={busy} candidate={local.candidate} error={error} googleAvailable={googleAvailable} googleLinkRecovery={googleLinkRecovery} locale={locale} onEmail={handleEmail} onGoogle={handleGoogle} onLinkGoogle={startGoogleLink} onSave={saveAuthenticated} onWithdraw={withdrawSensitiveInput} />);
  if (phase === "mission" && activeMission && home && session?.user.id) return renderPhase(<ProgramAiMissionExperience home={home} locale={locale} localWording={missionWording[activeMission.missionNumber] ?? ""} mission={activeMission} onBack={() => { setActiveMission(null); setPhase("home"); }} onHome={setHome} onLocalWording={(value) => saveMissionWording(activeMission.missionNumber, value)} programmePath={programmePath} userId={session.user.id} />);
  if (phase === "review" && activeReview && home && session?.user.id) return renderPhase(<ProgramAiReviewScreen initialReview={activeReview.review} locale={locale} localWording={reviewWording[activeReview.milestone] ?? ""} milestone={activeReview.milestone} onBack={() => { setActiveReview(null); setPhase("home"); }} onLocalWording={(value) => saveReviewWording(activeReview.milestone, value)} programmePath={programmePath} totalXp={home.totalXp} userId={session.user.id} />);
  if (phase === "home" && home && session?.user.id) return renderPhase(<ProgramAiHomeScreen error={error} home={home} locale={locale} onMission={openMission} onMissionOneEntry={enterMissionOneFromHome} onReview={openReview} programmePath={programmePath} userId={session.user.id} />);
  if (phase === "home") return renderPhase(<ProgrammeUnavailableScreen error={error} locale={locale} />);
  return renderPhase(<ProgrammeAccessScreen busy={busy} error={error} locale={locale} onConfirm={grantAccess} />);
}
