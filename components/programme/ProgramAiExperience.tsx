"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ProgramAiHomeScreen } from "@/components/programme/ProgramAiHome";
import {
  ProgrammeAccessScreen,
  ProgrammeLoadingScreen,
  ProgrammeStartScreen,
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
import { continueWithEmail } from "@/lib/auth/email-entry";
import { passwordResetPath } from "@/lib/auth/password-reset";
import {
  clearGoogleMarketingChoice,
  rememberGoogleMarketingChoice,
  saveProgrammeMarketingPreference,
  takeGoogleMarketingChoice,
} from "@/lib/customers/email-preference-client";
import {
  programmeGoogleCallbacks,
} from "@/lib/auth/google-flow";
import { programmeText, type ProgrammeMessageKey } from "@/lib/i18n/programme-catalog";
import {
  PROGRAMME_PRIVACY_VERSION,
  PROGRAMME_TERMS_VERSION,
  type ProgrammeAccessAuthority,
} from "@/lib/programme/access-contract";
import { affirmAnonymousProgrammeAccess, recordAccountProgrammeAccess } from "@/lib/programme/access-client";
import {
  PROGRAM_AI_SENSITIVE_PURPOSE_VERSION,
  PROGRAM_AI_SENSITIVE_STATEMENT_VERSION,
  type ProgrammeStartingPointValue,
} from "@/lib/programme/program-ai/contracts";
import { programmeAccessFailureMessageKey } from "@/lib/programme/program-ai/access-errors";
import { readyAnswersSituation, type ProgrammeReadyAnswer } from "@/lib/programme/program-ai/ready-answers";
import {
  anonymousProgrammeSubject,
  clearProgrammeOAuthClaimMarker,
  clearProgrammeSubjectContent,
  hasProgrammeAccessAuthority,
  loadProgrammeSubjectContent,
  mergeProgrammeSubjectContent,
  programmeAuthAccessHeaders,
  programmeMutationAccessHeaders,
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

const MARKETING_CHOICE_NOT_SAVED = "Your account was created, but your optional email choice could not be saved. No marketing email will be sent.";

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
  /** The picked ready answers, as the person read them. */
  situation: string;
  candidate: ProgrammeStartingPointValue | null;
  xpPreview: number;
  /** Founder decision, 25 Sep 2026: a quiet route to register before answering. */
  accountFirst?: boolean;
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
  const accountFirst = value.accountFirst === true && !value.candidate;
  // Registration without a Starting Point exists only on the account-first route.
  const safePhase = phase === "registration" && !value.candidate && !accountFirst ? "intake" : phase;
  return { phase: safePhase, situation: value.situation || "", candidate: value.candidate || null, xpPreview: Number.isFinite(value.xpPreview) ? value.xpPreview : 0, ...(accountFirst ? { accountFirst: true } : {}) };
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
      ...programmeMutationAccessHeaders(window.sessionStorage, subject),
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
  entryOverview,
  googleAvailable = false,
  locale,
  programmePath,
}: {
  /** Server-rendered "what the ten steps are", shown under the entry screens only. */
  entryOverview?: ReactNode;
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
  const [googleLinkRecovery, setGoogleLinkRecovery] = useState(false);
  const [passwordRejected, setPasswordRejected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const oauthRedeemStarted = useRef(false);
  /** The journey whose anonymous session already exists, so a second press does not open another. */
  const openedJourneyId = useRef<string | null>(null);
  const emailRedeemStarted = useRef(false);
  const personalisationStartedAt = useRef<number | null>(null);
  const accumulatedAiLatencyMs = useRef(0);
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

  // Account first: the access checks were affirmed minutes earlier on this journey; record them
  // for the new account, then open the dashboard, where Mission 01 starts whenever they choose.
  const completeAccountFirst = useCallback(async (userId: string, journey: ProgrammeLocalSubject) => {
    const response = await fetch("/api/programme-access/authority", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        adultConfirmed: true,
        termsAccepted: true,
        privacyAcknowledged: true,
        termsVersion: PROGRAMME_TERMS_VERSION,
        privacyVersion: PROGRAMME_PRIVACY_VERSION,
      }),
    });
    const accepted = await response.json() as ApiPayload<{ accepted: boolean }>;
    if (!response.ok || accepted.ok === false) throw new Error("PROGRAMME_ACCESS_NOT_VERIFIED");
    const homeResponse = await fetch("/api/program/program-ai/home", { credentials: "same-origin", cache: "no-store" });
    const payload = await homeResponse.json() as ApiPayload<{ home: ProgramAiHome }>;
    if (!homeResponse.ok || !payload.home) throw new Error("PROGRAMME_HOME_UNAVAILABLE");
    clearProgrammeOAuthClaimMarker(window.sessionStorage);
    clearProgrammeSubjectContent(window.sessionStorage, journey);
    setSubject(userProgrammeSubject(userId));
    setHome(payload.home);
    setPhase("home");
  }, []);

  // The opt-in ticked before leaving for Google is recorded once the account
  // exists, through the same preference service as the email sign-up.
  const saveGoogleMarketingChoice = useCallback((journey: ProgrammeLocalSubject) => (
    takeGoogleMarketingChoice(window.sessionStorage, journey.id)
      ? saveProgrammeMarketingPreference(locale)
      : Promise.resolve(true)
  ), [locale]);

  useEffect(() => {
    if (sessionPending) return;
    const authQuery = new URLSearchParams(window.location.search);
    const authState = authQuery.get("auth");
    const authError = authQuery.get("error");
    const accountNotLinked = authState === "google-error" && authError === "account_not_linked";
    const linkFailed = authState === "google-link-error";
    const linkReturned = authState === "google-link-return";
    const recoveryActive = accountNotLinked || linkFailed || (googleLinkRecovery && !linkReturned);
    if (authState === "google-error" || linkFailed) clearGoogleMarketingChoice(window.sessionStorage);
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
      if (restored) setLocal(restoredAnonymousState(restored));
      setPhase("registration");
      return;
    }
    if (session?.user.id && oauthJourney) {
      const restored = loadProgrammeSubjectContent<{ programAi: ProgramAiLocalState }>(window.sessionStorage, oauthJourney).programAi;
      setSubject(oauthJourney);
      // Log in hands over only the account-first flag, so restore through the reload guard.
      if (restored) setLocal(restoredAnonymousState(restored));
      setPhase("registration");
      if (!oauthRedeemStarted.current && restored?.candidate) {
        if (linkReturned) setGoogleLinkRecovery(false);
        oauthRedeemStarted.current = true;
        setBusy(true);
        const marketingSaved = saveGoogleMarketingChoice(oauthJourney);
        redeem(session.user.id, oauthJourney, restored)
          .then(async () => { if (!await marketingSaved) setError(programmeText(locale, MARKETING_CHOICE_NOT_SAVED)); })
          .catch(() => setError(programmeText(locale, "Your progress could not be saved yet")))
          .finally(() => setBusy(false));
      } else if (!oauthRedeemStarted.current && restored?.accountFirst) {
        oauthRedeemStarted.current = true;
        setBusy(true);
        const marketingSaved = saveGoogleMarketingChoice(oauthJourney);
        completeAccountFirst(session.user.id, oauthJourney)
          .then(async () => { if (!await marketingSaved) setError(programmeText(locale, MARKETING_CHOICE_NOT_SAVED)); })
          .catch(() => setError(programmeText(locale, "Account access failed")))
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
  }, [completeAccountFirst, googleLinkRecovery, locale, redeem, saveGoogleMarketingChoice, session?.user.id, sessionPending]);

  // A signed-in account that has not affirmed access yet: one press under the line, then the plan.
  async function grantAccountAccess() {
    productAnalyticsClient.startClicked("other_public");
    setBusy(true); setError("");
    try {
      await recordAccountProgrammeAccess();
      const homeResponse = await fetch("/api/program/program-ai/home", { credentials: "same-origin", cache: "no-store" });
      const homePayload = await homeResponse.json() as ApiPayload<{ home: ProgramAiHome }>;
      if (!homeResponse.ok || !homePayload.home) throw new Error("PROGRAMME_HOME_UNAVAILABLE");
      productAnalyticsClient.accessGranted("start");
      setHome(homePayload.home);
      setPhase("home");
    } catch {
      setError(programmeText(locale, programmeAccessFailureMessageKey("authority")));
    } finally { setBusy(false); }
  }

  // First visit: records the 18+ / Terms / Privacy affirmation the line states and opens the
  // anonymous Programme session. Returns the message to show when a stage fails.
  async function openJourney(journey: ProgrammeLocalSubject): Promise<ProgrammeMessageKey | null> {
    const entryMode = hasProgrammeAccessAuthority(window.sessionStorage, journey) ? "resume" : "start";
    try {
      await affirmAnonymousProgrammeAccess(window.sessionStorage);
    } catch {
      return programmeAccessFailureMessageKey("authority");
    }
    try {
      await programAiRequest("/api/program/program-ai/session", journey, {
        method: "POST",
        headers: programmeAuthAccessHeaders(window.sessionStorage, journey),
      });
    } catch (cause) {
      return programmeAccessFailureMessageKey("session", cause as Error & { code?: string });
    }
    openedJourneyId.current = journey.id;
    productAnalyticsClient.accessGranted(entryMode);
    productAnalyticsClient.missionOpened(1, entryMode);
    personalisationStartedAt.current = null;
    accumulatedAiLatencyMs.current = 0;
    return null;
  }

  // Founder decisions, 11 Oct 2026: one press under the consent statement. It is the explicit
  // consent to process the picked answers and, on a first visit, the 18+ / Terms / Privacy
  // affirmation. The answers go straight to the Starting Point.
  async function agreeAndContinue(answers: ProgrammeReadyAnswer[]) {
    if (!subject || subject.kind !== "journey" || answers.length === 0) return;
    const journey = subject;
    setBusy(true); setError("");
    // A journey entered from the dashboard already has its session; so does a second press here.
    if (phase === "access" && openedJourneyId.current !== journey.id) {
      productAnalyticsClient.startClicked("other_public");
      const failure = await openJourney(journey);
      if (failure) { setError(programmeText(locale, failure)); setBusy(false); return; }
    }
    try {
      await programAiRequest("/api/program/program-ai/authority", journey, {
        method: "POST",
        body: JSON.stringify({
          confirmed: true,
          purposeVersion: PROGRAM_AI_SENSITIVE_PURPOSE_VERSION,
          statementVersion: PROGRAM_AI_SENSITIVE_STATEMENT_VERSION,
        }),
      });
    } catch {
      setError(programmeText(locale, programmeAccessFailureMessageKey("session")));
      setBusy(false);
      return;
    }
    // The start screen stays up while the Starting Point is prepared; if that fails, the same
    // press sends the answers again.
    await submitTurn({ ...local, situation: readyAnswersSituation(locale, answers), candidate: null }, journey);
  }

  async function submitTurn(state: ProgramAiLocalState, journey: ProgrammeLocalSubject) {
    if (personalisationStartedAt.current === null) personalisationStartedAt.current = performance.now();
    setBusy(true); setError("");
    try {
      const payload = await programAiRequest<{
        result: {
          kind: "CLARIFICATION_REQUIRED" | "STARTING_POINT_CANDIDATE";
          candidate?: ProgrammeStartingPointValue;
          disposition: "CONTINUE" | "SUPPORT_FIRST";
        };
        progress: { taskStates: string[]; xpPreview: number };
        timing?: { programmeAiTurnMs?: number };
      }>("/api/program/program-ai/turn", journey, {
        method: "POST",
        body: JSON.stringify({ locale, inputMode: "text", situation: state.situation, clarificationAnswers: [] }),
      });
      accumulatedAiLatencyMs.current += payload.timing?.programmeAiTurnMs ?? 0;
      if (payload.result.kind !== "STARTING_POINT_CANDIDATE" || !payload.result.candidate) {
        throw new Error("STARTING_POINT_NOT_PREPARED");
      }
      const readyState = { ...state, candidate: payload.result.candidate, phase: "registration" as const, xpPreview: payload.progress?.xpPreview ?? 0 };
      if (payload.result.disposition === "SUPPORT_FIRST") {
        persist({ ...readyState, phase: "support" }, journey);
      } else {
        persist(readyState, journey);
        productAnalyticsClient.personalisedValue("starting_point");
        productAnalyticsClient.registrationCtaPresented();
        console.info(JSON.stringify({
          event: "programme_ai_m1_client_latency",
          inputMode: "text",
          programmeAiTurnMs: accumulatedAiLatencyMs.current,
          totalSubmitToStartingPointMs: personalisationStartedAt.current === null
            ? undefined
            : Math.round(performance.now() - personalisationStartedAt.current),
          summedTechnicalLatencyMs: accumulatedAiLatencyMs.current,
          clarificationCount: 0,
        }));
      }
    } catch {
      setError(programmeText(locale, "Your Starting Point could not be prepared"));
    }
    finally { setBusy(false); }
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

  async function handleEmail(input: { email: string; password: string; marketingAllowed: boolean }) {
    if (!subject) return;
    clearGoogleMarketingChoice(window.sessionStorage);
    emailRedeemStarted.current = true;
    setBusy(true); setError(""); setPasswordRejected(false);
    try {
      if (!googleLinkRecovery && !local.accountFirst) await prepareClaimForRegistration();
      const entry = await continueWithEmail({ email: input.email, password: input.password, expect: googleLinkRecovery ? "existing-only" : "new" }, {
        // The confirmation link in the sign-up email lands back on this Programme page.
        signUp: (credentials) => authClient.signUp.email({ ...credentials, name: credentials.email.split("@")[0] || "B4GAMBLE member", callbackURL: programmePath, fetchOptions: { headers: programmeAuthAccessHeaders(window.sessionStorage, subject) } }),
        signIn: (credentials) => authClient.signIn.email(credentials),
      });
      if (entry.kind === "wrong-password") {
        setPasswordRejected(true);
        setError(programmeText(locale, "Email or password is incorrect."));
        return;
      }
      if (entry.kind === "failed") {
        setError(programmeText(locale, "Account access failed"));
        return;
      }
      if (googleLinkRecovery) {
        await startGoogleLink();
        return;
      }
      const marketingPreferenceSaved = entry.kind !== "created" || !input.marketingAllowed
        || await saveProgrammeMarketingPreference(locale);
      if (local.accountFirst && !local.candidate) await completeAccountFirst(entry.userId, subject);
      else await redeem(entry.userId, subject, local);
      if (!marketingPreferenceSaved) setError(programmeText(locale, MARKETING_CHOICE_NOT_SAVED));
    } catch { setError(programmeText(locale, "Account access failed")); }
    finally { emailRedeemStarted.current = false; setBusy(false); }
  }

  async function handleGoogle(input: { marketingAllowed: boolean }) {
    if (!subject || subject.kind !== "journey") return;
    setBusy(true); setError("");
    try {
      const callbacks = programmeGoogleCallbacks(locale);
      if (!local.accountFirst) await prepareClaimForRegistration();
      writeProgrammeOAuthClaimMarker(window.sessionStorage, subject);
      rememberGoogleMarketingChoice(window.sessionStorage, subject.id, input.marketingAllowed);
      const result = await authClient.signIn.social({
        provider: "google",
        ...callbacks,
        requestSignUp: true,
        fetchOptions: { headers: programmeAuthAccessHeaders(window.sessionStorage, subject) },
      });
      if (result.error) throw new Error("GOOGLE_ACCOUNT_ACCESS_NOT_STARTED");
    } catch {
      clearProgrammeOAuthClaimMarker(window.sessionStorage);
      clearGoogleMarketingChoice(window.sessionStorage);
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

  // Registering first needs only the affirmation the line states. The story consent waits for
  // the story.
  async function startAccountFirst() {
    if (!subject || subject.kind !== "journey") return;
    setBusy(true); setError("");
    try {
      await affirmAnonymousProgrammeAccess(window.sessionStorage);
      persist({ ...local, phase: "registration", accountFirst: true });
    } catch {
      setError(programmeText(locale, programmeAccessFailureMessageKey("authority")));
    } finally { setBusy(false); }
  }

  function returnToStory() {
    setError("");
    const next = { ...local, phase: "access" as const };
    delete next.accountFirst;
    persist(next);
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
      openedJourneyId.current = journey.id;
      personalisationStartedAt.current = null;
      accumulatedAiLatencyMs.current = 0;
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
      // A new Programme screen starts at its top, not at the scroll depth of the screen before it.
      if (phase !== "loading" && window.scrollY > 0) window.scrollTo({ top: 0, behavior: "instant" });
      if (boundary && !boundary.contains(document.activeElement)) boundary.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

  const renderPhase = (screen: ReactNode, options: { entry?: boolean } = {}) => (
    <>
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
      {options.entry ? entryOverview : null}
    </>
  );

  if (phase === "loading" || sessionPending) return renderPhase(<ProgrammeLoadingScreen locale={locale} />, { entry: true });
  // Mission 01 is the start screen. A first visit also carries the 18+ / Terms / Privacy line and
  // the account-first link; a journey entered from the dashboard already has its session and its
  // account, so it shows neither.
  const startScreen = (firstVisit: boolean) => renderPhase(<ProgrammeStartScreen accessLine={firstVisit} busy={busy} error={error} locale={locale} onAccountFirst={firstVisit ? startAccountFirst : undefined} onAgree={agreeAndContinue} />, { entry: firstVisit });
  if (phase === "access" && subject?.kind === "user") return renderPhase(<ProgrammeAccessScreen busy={busy} error={error} locale={locale} onConfirm={grantAccountAccess} />, { entry: true });
  if (phase === "access") return startScreen(true);
  if (phase === "intake") return startScreen(false);
  if (phase === "support") return renderPhase(<ProgrammeSupportScreen busy={busy} error={error} locale={locale} onContinue={continueAfterSupport} xpPreview={local.xpPreview} />);
  if (phase === "registration" && (local.candidate || local.accountFirst)) return renderPhase(<StartingPointReadyScreen authenticated={Boolean(session?.user.id)} busy={busy} candidate={local.candidate} error={error} onBack={returnToStory} googleAvailable={googleAvailable} googleLinkRecovery={googleLinkRecovery} locale={locale} onEmail={handleEmail} onGoogle={handleGoogle} onLinkGoogle={startGoogleLink} onSave={saveAuthenticated} passwordResetHref={passwordRejected ? passwordResetPath(programmePath) : null} />);
  if (phase === "mission" && activeMission && home && session?.user.id) return renderPhase(<ProgramAiMissionExperience home={home} locale={locale} localWording={missionWording[activeMission.missionNumber] ?? ""} mission={activeMission} onBack={() => { setActiveMission(null); setPhase("home"); }} onHome={setHome} onLocalWording={(value) => saveMissionWording(activeMission.missionNumber, value)} programmePath={programmePath} userId={session.user.id} />);
  if (phase === "review" && activeReview && home && session?.user.id) return renderPhase(<ProgramAiReviewScreen initialReview={activeReview.review} locale={locale} localWording={reviewWording[activeReview.milestone] ?? ""} milestone={activeReview.milestone} onBack={() => { setActiveReview(null); setPhase("home"); }} onLocalWording={(value) => saveReviewWording(activeReview.milestone, value)} programmePath={programmePath} totalXp={home.totalXp} userId={session.user.id} />);
  if (phase === "home" && home && session?.user.id) return renderPhase(<ProgramAiHomeScreen error={error} home={home} locale={locale} onMission={openMission} onMissionOneEntry={enterMissionOneFromHome} onReview={openReview} programmePath={programmePath} unconfirmedEmail={session.user.emailVerified ? null : session.user.email} userId={session.user.id} />);
  if (phase === "home") return renderPhase(<ProgrammeUnavailableScreen error={error} locale={locale} />);
  return startScreen(true);
}
