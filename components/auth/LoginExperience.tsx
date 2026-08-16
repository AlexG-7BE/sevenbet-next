"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { authClient, useSession } from "@/lib/auth/client";
import { googleLoginCallbacks } from "@/lib/auth/google-flow";
import styles from "./LoginExperience.module.css";

type LoginExperienceProps = {
  authError: string | null;
  authState: string | null;
  googleAvailable: boolean;
  returnTo: string;
};

export function LoginExperience({ authError, authState, googleAvailable, returnTo }: LoginExperienceProps) {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(() => {
    if (authState === "google-error" && authError === "account_not_linked") return "";
    if (authState === "google-link-error") return "Google linking was not completed. Your account is unchanged; you can retry safely.";
    if (authState === "google-error" && authError) return "Google sign-in was not completed. You can retry or use email instead.";
    return "";
  });
  const linkRecovery = (authState === "google-error" && authError === "account_not_linked")
    || authState === "google-link-error";

  function continueToDestination() {
    window.location.assign(returnTo);
  }

  async function startGoogleSignIn() {
    setBusy(true); setError("");
    try {
      const callbacks = googleLoginCallbacks(returnTo);
      const result = await authClient.signIn.social({
        provider: "google",
        ...callbacks,
        requestSignUp: false,
      });
      if (result.error) throw new Error("Google sign-in could not be started");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Google sign-in failed");
      setBusy(false);
    }
  }

  async function startGoogleLink() {
    setBusy(true); setError("");
    try {
      const callbacks = googleLoginCallbacks(returnTo, "link");
      const result = await authClient.linkSocial({ provider: "google", ...callbacks });
      if (result.error) throw new Error("Google linking could not be started");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Google linking failed");
      setBusy(false);
    }
  }

  async function signInWithEmail(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const result = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });
      if (result.error || !result.data?.user.id) throw new Error("Email or password is incorrect.");
      if (linkRecovery) {
        await startGoogleLink();
        return;
      }
      continueToDestination();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Account access failed");
      setBusy(false);
    }
  }

  return (
    <div className={styles.page} data-login-page>
      <header className={styles.nav}><Link href="/">B4GAMBLE</Link><Link href="/">← Back to site</Link></header>
      <main className={styles.main}>
        <div aria-hidden="true" className={styles.glow} />
        <section aria-labelledby="login-title" className={styles.panel}>
          <p className={styles.kicker}><span aria-hidden="true" />{linkRecovery ? "Existing account · Secure recovery" : "Members"}</p>
          <h1 id="login-title">{linkRecovery ? "Confirm the account that already owns this email." : <>Log in.<br /><em>Pick up your plan.</em></>}</h1>
          <p className={styles.lead}>{linkRecovery ? "Sign in with the existing B4GAMBLE email and password first. Only then can Google be explicitly linked to that authenticated account." : "Your Programme progress, saved rules and dashboard."}</p>

          {linkRecovery && session?.user ? <button className={styles.primary} disabled={busy} onClick={startGoogleLink} type="button">{busy ? "Opening Google…" : "Link Google securely"}</button> : <>
            {googleAvailable && !linkRecovery ? <button className={styles.google} disabled={busy} onClick={startGoogleSignIn} type="button"><svg aria-hidden="true" height="18" viewBox="0 0 18 18" width="18"><path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z" fill="#4285F4"/><path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" fill="#34A853"/><path d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" fill="#FBBC05"/><path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/></svg>{busy ? "Opening Google…" : "Continue with Google"}</button> : null}
            {googleAvailable && !linkRecovery ? <div className={styles.divider}><span>or</span></div> : null}
            <form onSubmit={signInWithEmail}>
              <input aria-label="Email" autoComplete="email" inputMode="email" name="email" onChange={(event) => setEmail(event.target.value)} placeholder="Email" required spellCheck={false} type="email" value={email} />
              <input aria-label="Password" autoComplete="current-password" minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} placeholder="Password" required type="password" value={password} />
              {!linkRecovery ? <span className={styles.forgot}>Forgot password?</span> : null}
              <button className={styles.primary} disabled={busy} type="submit">{busy ? "Checking account…" : linkRecovery ? "Sign in, then link Google" : "Log in"}</button>
            </form>
          </>}

          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          {linkRecovery ? <p className={styles.assurance}>An email match alone is not enough. B4GAMBLE links Google only after both sign-in steps succeed.</p> : <aside className={styles.newHere}><strong>New here?</strong><p>There&apos;s no signup form. Your account is created inside the Programme — Mission 01 builds your starting point, then you choose what to save.</p><Link href="/program?entry=start">Start the 10-Step Programme →</Link></aside>}
          <p className={styles.legal}>18+ · Private by default — narrative answers stay in your browser.</p>
        </section>
      </main>
      <footer className={styles.footer}><span>18+</span><span>BeGambleAware.org</span><Link href="/help">Help — protected support →</Link></footer>
    </div>
  );
}
