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
      <section className={styles.intro}>
        <p className={styles.kicker}>{linkRecovery ? "EXISTING ACCOUNT · SECURE RECOVERY" : "ACCOUNT ACCESS"}</p>
        <h1>{linkRecovery ? "Confirm the account that already owns this email." : "Welcome back."}</h1>
        <p>{linkRecovery
          ? "Sign in with the existing B4GAMBLE email and password first. Only then can Google be explicitly linked to that authenticated account."
          : "Return to your private Programme with the sign-in method already connected to your account."}</p>
        <ul>
          <li>Account identity is separate from Programme content</li>
          <li>Google is not age verification or marketing consent</li>
          <li>Protected Help stays available without signing in</li>
        </ul>
      </section>

      <section aria-labelledby="login-title" className={styles.card}>
        <div className={styles.cardHeading}>
          <p>{linkRecovery ? "STEP 1 OF 2" : "LOG IN"}</p>
          <h2 id="login-title">{linkRecovery ? (session?.user ? "Link Google" : "Use your existing password") : "Access your account"}</h2>
        </div>

        {linkRecovery && session?.user ? <button className={styles.primary} disabled={busy} onClick={startGoogleLink} type="button">{busy ? "Opening Google…" : "Link Google securely"}</button> : <>
          {googleAvailable && !linkRecovery ? <button className={styles.google} disabled={busy} onClick={startGoogleSignIn} type="button"><span aria-hidden="true">G</span>{busy ? "Opening Google…" : "Continue with Google"}</button> : null}
          {googleAvailable && !linkRecovery ? <div className={styles.divider}><span>or use email</span></div> : null}
          <form onSubmit={signInWithEmail}>
            <label><span>Email</span><input autoComplete="email" inputMode="email" name="email" onChange={(event) => setEmail(event.target.value)} required spellCheck={false} type="email" value={email} /></label>
            <label><span>Password</span><input autoComplete="current-password" minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
            <button className={styles.primary} disabled={busy} type="submit">{busy ? "Checking account…" : linkRecovery ? "Sign in, then link Google" : "Log in"}</button>
          </form>
        </>}

        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {linkRecovery ? <p className={styles.assurance}>An email match alone is not enough. B4GAMBLE links Google only after both sign-in steps succeed.</p> : <p className={styles.secondary}>New to B4GAMBLE? <Link href="/program">Start the 10-Step Programme</Link></p>}
        <p className={styles.legal}>By continuing, you use your existing account under the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Notice</Link>. No marketing consent is added.</p>
      </section>
    </div>
  );
}
