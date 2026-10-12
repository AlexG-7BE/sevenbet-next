"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";

import { authClient, useSession } from "@/lib/auth/client";
import { continueWithEmail } from "@/lib/auth/email-entry";
import { googleLoginCallbacks, programmeGoogleCallbacks } from "@/lib/auth/google-flow";
import { passwordResetPath } from "@/lib/auth/password-reset";
import { useGooglePress } from "@/lib/auth/use-google-press";
import {
  PROGRAMME_MARKETING_OPT_IN_DEFAULT,
  PROGRAMME_MARKETING_OPT_IN_LABEL,
  clearGoogleMarketingChoice,
  rememberGoogleMarketingChoice,
  saveProgrammeMarketingPreference,
} from "@/lib/customers/email-preference-client";
import { programmeText } from "@/lib/i18n/programme-catalog";
import {
  affirmAnonymousProgrammeAccess,
  forgetClaimMade,
  journeyWithAccessProof,
  markStartingPointForAccount,
  noteClaimMade,
  prepareAccountFirstGoogleReturn,
  recordAccountProgrammeAccess,
  tabProgrammeProgress,
  type TabProgrammeProgress,
} from "@/lib/programme/access-client";
import {
  anonymousProgrammeSubject,
  clearProgrammeOAuthClaimMarker,
  programmeAuthAccessHeaders,
  programmeMutationAccessHeaders,
  type ProgrammeLocalSubject,
} from "@/lib/programme/local-subject-storage";
import {
  PENDING_CLAIM_FRESH_FOR_EMAIL_MS,
  PENDING_CLAIM_FRESH_FOR_GOOGLE_MS,
  makePendingClaim,
  pendingClaimIsFresh,
} from "@/lib/programme/program-ai/pending-claim-client";
import { programmeHelpPath, programmePublicHref, type ProgrammeLocale } from "@/lib/programme/presentation";
import styles from "./LoginExperience.module.css";

type LoginExperienceProps = {
  authError: string | null;
  authState: string | null;
  googleAvailable: boolean;
  locale: ProgrammeLocale;
  programmePath: string;
  returnTo: string;
};

export function LoginExperience({ authError, authState, googleAvailable, locale, programmePath, returnTo }: LoginExperienceProps) {
  const { data: session } = useSession();
  const t = (key: Parameters<typeof programmeText>[1]) => programmeText(locale, key);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketingAllowed, setMarketingAllowed] = useState(PROGRAMME_MARKETING_OPT_IN_DEFAULT);
  const [busy, setBusy] = useState(false);
  /** A press on Google is under way, so a second one does nothing. */
  const googlePressed = useRef(false);
  const [error, setError] = useState(() => {
    if (authState === "google-error" && authError === "account_not_linked") return "";
    if (authState === "google-link-error") return t("Google linking was not completed. Your account is unchanged; you can retry safely.");
    if (authState === "google-error") return t("Google sign-in was not completed. You can retry or use email instead.");
    return "";
  });
  const linkRecovery = (authState === "google-error" && authError === "account_not_linked")
    || authState === "google-link-error";

  function continueToDestination() {
    window.location.assign(returnTo);
  }

  // Founder decision, 11 Oct 2026: a person who already answered in this tab is not sent back to
  // the Programme to press the same button again. Their Starting Point goes with the account from
  // here: the claim is made (or reused while fresh) and the Programme page redeems it on arrival.
  async function carryStartingPoint(journey: ProgrammeLocalSubject, progress: Extract<TabProgrammeProgress, { kind: "starting-point" }>, freshForMs: number) {
    if (!pendingClaimIsFresh(progress.claimReadyAt, freshForMs)) {
      await makePendingClaim(programmeMutationAccessHeaders(window.sessionStorage, journey), progress.startingPoint);
      noteClaimMade(window.sessionStorage, journey);
    }
    markStartingPointForAccount(window.sessionStorage, journey);
  }

  // Founder decision, 12 Oct 2026: a press on Google leaves at once where that needs no new
  // consent. Nothing is affirmed behind the screen, so the Google address is prepared only in a
  // tab that already holds the access proof (the person continued under the line in the
  // Programme); a Starting Point made there has its claim kept ready too. Anyone else gets the
  // immediate button feedback, and the press does the rest.
  const googlePress = useGooglePress({
    enabled: googleAvailable && !linkRecovery,
    paused: busy,
    prepareAddress: async () => {
      const journey = journeyWithAccessProof(window.sessionStorage);
      if (!journey) return null;
      const result = await authClient.signIn.social({ provider: "google", ...programmeGoogleCallbacks(locale), requestSignUp: true, disableRedirect: true, fetchOptions: { headers: programmeAuthAccessHeaders(window.sessionStorage, journey) } });
      return result.data;
    },
    claim: () => {
      const journey = journeyWithAccessProof(window.sessionStorage);
      const progress = journey ? tabProgrammeProgress(window.sessionStorage, journey) : null;
      if (!journey || progress?.kind !== "starting-point") return null;
      return {
        readyAt: progress.claimReadyAt,
        make: async () => {
          // The earlier claim stops counting as soon as a new one is started.
          forgetClaimMade(window.sessionStorage, journey);
          await makePendingClaim(programmeMutationAccessHeaders(window.sessionStorage, journey), progress.startingPoint);
          noteClaimMade(window.sessionStorage, journey);
        },
      };
    },
    onStayed: (reason) => {
      googlePressed.current = false;
      setBusy(false);
      if (reason === "not-left") setError(t("Google account access failed"));
    },
  });

  // Founder decision, 11 Oct 2026: Log in also creates the account. Continuing under the line
  // below the form is the 18+, Terms and Privacy affirmation. The Programme page finishes a
  // Google return: it redeems a Starting Point made in this tab, or records the affirmation for
  // the account and opens the answers.
  async function startGoogle() {
    if (googlePressed.current) return;
    // Founder decision, 12 Oct 2026: the button answers at once, and a second press does nothing.
    googlePressed.current = true;
    setBusy(true); setError("");
    try {
      // With the address ready behind the screen (and the claim, for a person who answered), the
      // press awaits nothing. A request in flight is finished first.
      const prepared = googlePress.press() ?? await googlePress.settled();
      const held = prepared ? journeyWithAccessProof(window.sessionStorage) : null;
      if (prepared && held) {
        if (tabProgrammeProgress(window.sessionStorage, held).kind === "starting-point") markStartingPointForAccount(window.sessionStorage, held);
        else prepareAccountFirstGoogleReturn(window.sessionStorage, held);
        rememberGoogleMarketingChoice(window.sessionStorage, held.id, marketingAllowed);
        googlePress.leave(prepared);
        return;
      }
      // Nothing was prepared, or it went stale: the press does the work itself, as it always did.
      const journey = await affirmAnonymousProgrammeAccess(window.sessionStorage);
      const progress = tabProgrammeProgress(window.sessionStorage, journey);
      let carried = false;
      if (progress.kind === "starting-point") {
        // If the claim cannot be made, signing in still goes ahead; the answers stay picked.
        try { await carryStartingPoint(journey, progress, PENDING_CLAIM_FRESH_FOR_GOOGLE_MS); carried = true; } catch { carried = false; }
      }
      if (!carried) prepareAccountFirstGoogleReturn(window.sessionStorage, journey);
      rememberGoogleMarketingChoice(window.sessionStorage, journey.id, marketingAllowed);
      const result = await authClient.signIn.social({
        provider: "google",
        ...programmeGoogleCallbacks(locale),
        requestSignUp: true,
        fetchOptions: { headers: programmeAuthAccessHeaders(window.sessionStorage, journey) },
      });
      if (result.error) throw new Error("GOOGLE_SIGN_IN_NOT_STARTED");
      googlePress.leave();
    } catch {
      clearProgrammeOAuthClaimMarker(window.sessionStorage);
      clearGoogleMarketingChoice(window.sessionStorage);
      setError(t("Google account access failed"));
      googlePress.release();
      googlePressed.current = false;
      setBusy(false);
    }
  }

  async function startGoogleLink() {
    setBusy(true); setError("");
    try {
      const callbacks = googleLoginCallbacks(returnTo, "link");
      const result = await authClient.linkSocial({ provider: "google", ...callbacks });
      if (result.error) throw new Error("GOOGLE_LINK_NOT_STARTED");
    } catch {
      setError(t("Google linking failed"));
      setBusy(false);
    }
  }

  async function continueWithEmailEntry(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const entry = await continueWithEmail({ email, password, expect: linkRecovery ? "existing-only" : "returning" }, {
        signIn: (credentials) => authClient.signIn.email(credentials),
        // Creating an account needs the server-verified affirmation; signing in does not.
        signUp: async (credentials) => {
          const journey = await affirmAnonymousProgrammeAccess(window.sessionStorage);
          // The confirmation link in the sign-up email lands on the Programme page.
          return authClient.signUp.email({ ...credentials, name: credentials.email.split("@")[0] || "B4GAMBLE member", callbackURL: programmePath, fetchOptions: { headers: programmeAuthAccessHeaders(window.sessionStorage, journey) } });
        },
      });
      if (entry.kind === "wrong-password" || entry.kind === "failed") {
        setError(t(entry.kind === "wrong-password" ? "Email or password is incorrect." : "Account access failed"));
        setBusy(false);
        return;
      }
      if (linkRecovery) {
        await startGoogleLink();
        return;
      }
      // With the affirmation on the account the Programme opens straight to the plan. If this
      // request fails, the Programme asks its own access check once instead.
      await recordAccountProgrammeAccess().catch(() => undefined);
      if (entry.kind === "created" && marketingAllowed) await saveProgrammeMarketingPreference(locale);
      // A Starting Point made in this tab goes with the account: the Programme page redeems it.
      // A claim being renewed behind the screen is finished first.
      await googlePress.settled();
      const progress = tabProgrammeProgress(window.sessionStorage, anonymousProgrammeSubject(window.sessionStorage));
      if (progress.kind === "starting-point") {
        try {
          const journey = await affirmAnonymousProgrammeAccess(window.sessionStorage);
          await carryStartingPoint(journey, progress, PENDING_CLAIM_FRESH_FOR_EMAIL_MS);
          window.location.assign(programmePath);
          return;
        } catch {
          // The Programme page then shows the answers again, already picked.
        }
      }
      continueToDestination();
    } catch {
      setError(t("Account access failed"));
      setBusy(false);
    }
  }

  return (
    <div className={styles.page} data-login-page>
      <header className={styles.nav}><Link href={programmePublicHref(locale, "/")}>B4GAMBLE</Link><Link href={programmePublicHref(locale, "/")}>← {t("Back to site")}</Link></header>
      <main className={styles.main}>
        <div aria-hidden="true" className={styles.glow} />
        <section aria-labelledby="login-title" className={styles.panel}>
          <p className={styles.kicker}><span aria-hidden="true" />{t(linkRecovery ? "Existing account · Secure recovery" : "Members")}</p>
          <h1 id="login-title">{linkRecovery ? t("Confirm the account that already owns this email.") : <>{t("Log in.")}<br /><em>{t("Pick up your plan.")}</em></>}</h1>
          <p className={styles.lead}>{t(linkRecovery ? "Sign in with the existing B4GAMBLE email and password first. Only then can Google be explicitly linked to that authenticated account." : "Your Programme progress, saved rules and dashboard.")}</p>

          {linkRecovery && session?.user ? <button className={styles.primary} disabled={busy} onClick={startGoogleLink} type="button">{t(busy ? "Opening Google…" : "Link Google securely")}</button> : <>
            {googleAvailable && !linkRecovery ? <button className={styles.google} disabled={busy} onClick={startGoogle} type="button"><svg aria-hidden="true" height="18" viewBox="0 0 18 18" width="18"><path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z" fill="#4285F4"/><path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" fill="#34A853"/><path d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" fill="#FBBC05"/><path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/></svg>{t(busy ? "Opening Google…" : "Continue with Google")}</button> : null}
            {googleAvailable && !linkRecovery ? <div className={styles.divider}><span>{t("or")}</span></div> : null}
            <form data-login-email-entry="" onSubmit={continueWithEmailEntry}>
              <input aria-label={t("Email")} autoComplete="email" inputMode="email" name="email" onChange={(event) => setEmail(event.target.value)} placeholder={t("Email")} required spellCheck={false} type="email" value={email} />
              <input aria-label={t("Password")} autoComplete="current-password" minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} placeholder={t("Password")} required type="password" value={password} />
              {!linkRecovery ? <Link className={styles.forgot} href={passwordResetPath(returnTo)}>{t("Forgot password?")}</Link> : null}
              <button className={styles.primary} disabled={busy} type="submit">{busy ? t("Checking account…") : linkRecovery ? t("Sign in, then link Google") : t("Continue with email")}</button>
            </form>
            {!linkRecovery ? <label className={styles.marketing} data-login-marketing-choice=""><input checked={marketingAllowed} onChange={(event) => setMarketingAllowed(event.target.checked)} type="checkbox" /><span>{t(PROGRAMME_MARKETING_OPT_IN_LABEL)}</span></label> : null}
            {/* The line sits with the actions it governs, above the note for newcomers. */}
            {!linkRecovery ? <p className={styles.legal} data-login-access-note="">{t("By continuing, you confirm you are 18+ and accept the Terms and Privacy Notice.")}<span><Link href="/terms">{t("Read Terms")}</Link><Link href="/privacy">{t("Read Privacy Notice")}</Link></span></p> : null}
          </>}

          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          {linkRecovery ? <p className={styles.assurance}>{t("An email match alone is not enough. B4GAMBLE links Google only after both sign-in steps succeed.")}</p> : <aside className={styles.newHere}><strong>{t("New here?")}</strong><p>{t("The same form creates your account: continue with Google, or enter your email and choose a password.")}</p><Link href={programmePath}>{t("Start the 10-Step Programme →")}</Link></aside>}
          {linkRecovery ? <p className={styles.legal}>{t("18+ · Private by default — narrative answers stay in your browser.")}</p> : null}
        </section>
      </main>
      <footer className={styles.footer}><span>18+</span><span>{t("Private Programme")}</span><Link href={programmeHelpPath(locale)}>{t("Help — protected support →")}</Link></footer>
    </div>
  );
}
