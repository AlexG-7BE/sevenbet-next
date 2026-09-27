"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth/client";
import {
  loginPath,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  passwordResetFailure,
  passwordResetPath,
  passwordResetRequestFailure,
  type PasswordResetFailure,
  type PasswordResetRequestFailure,
  type PasswordResetView,
} from "@/lib/auth/password-reset";
import { programmeText } from "@/lib/i18n/programme-catalog";
import { publicShellMessages } from "@/lib/i18n/public-shell-catalog";
import { programmeHelpPath, programmePublicHref, type ProgrammeLocale } from "@/lib/programme/presentation";
import styles from "./LoginExperience.module.css";

type PasswordResetExperienceProps = {
  locale: ProgrammeLocale;
  returnTo: string;
  view: PasswordResetView;
};

type Stage = "request" | "sent" | "invalid" | "reset" | "done";
type MessageKey = Parameters<typeof programmeText>[1];

const requestFailureMessage = {
  INVALID_EMAIL: "Enter a valid email address.",
  RATE_LIMITED: "Too many attempts. Wait a few minutes and try again.",
  FAILED: "We could not send the link right now. Try again in a few minutes.",
} as const satisfies Record<PasswordResetRequestFailure, MessageKey>;

const resetFailureMessage = {
  TOO_SHORT: "Use at least 8 characters.",
  TOO_LONG: "Use 128 characters or fewer.",
  RATE_LIMITED: "Too many attempts. Wait a few minutes and try again.",
  FAILED: "Your password could not be changed. Try again.",
} as const satisfies Record<Exclude<PasswordResetFailure, "INVALID_LINK">, MessageKey>;

export function PasswordResetExperience({ locale, returnTo, view }: PasswordResetExperienceProps) {
  const shell = publicShellMessages(locale);
  const t = (key: MessageKey) => programmeText(locale, key);
  const token = view.kind === "reset" ? view.token : null;
  const [stage, setStage] = useState<Stage>(view.kind);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const shownStage = useRef(stage);

  // Each step replaces the panel; move focus to its heading so the change is announced.
  useEffect(() => {
    if (shownStage.current === stage) return;
    shownStage.current = stage;
    heading.current?.focus();
  }, [stage]);

  function showStage(next: Stage) {
    setError("");
    setStage(next);
  }

  async function requestLink(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const result = await authClient.requestPasswordReset({
        email: email.trim().toLowerCase(),
        redirectTo: passwordResetPath(returnTo),
      });
      // Better Auth answers the same way whether or not the account exists.
      const failure = passwordResetRequestFailure(result.error);
      if (failure) setError(t(requestFailureMessage[failure]));
      else showStage("sent");
    } catch {
      setError(t(requestFailureMessage.FAILED));
    } finally {
      setBusy(false);
    }
  }

  async function saveNewPassword(event: FormEvent) {
    event.preventDefault();
    if (!token) { showStage("invalid"); return; }
    if (password !== confirmation) { setError(t("The passwords do not match.")); return; }
    setBusy(true); setError("");
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      const failure = passwordResetFailure(result.error);
      if (failure === "INVALID_LINK") {
        setPassword(""); setConfirmation("");
        showStage("invalid");
      } else if (failure) {
        setError(t(resetFailureMessage[failure]));
      } else {
        setPassword(""); setConfirmation("");
        showStage("done");
      }
    } catch {
      setError(t(resetFailureMessage.FAILED));
    } finally {
      setBusy(false);
    }
  }

  const backToLogin = <Link className={styles.backLink} href={loginPath(returnTo)}>{t("Back to log in")}</Link>;
  const title = {
    request: t("Reset your password."),
    sent: t("Check your email."),
    invalid: t("This link no longer works."),
    reset: t("Choose a new password."),
    done: t("Password changed."),
  }[stage];
  const lead = {
    request: t("Enter the email you use for B4GAMBLE. We'll send you a link to choose a new password."),
    sent: t("If this email belongs to a B4GAMBLE account, we've sent a link there to reset your password. The link works for 1 hour."),
    invalid: t("Each reset link works once, for 1 hour. Enter your email and we'll send you a new one."),
    reset: t("Use at least 8 characters."),
    done: t("You can now log in with your new password."),
  }[stage];

  return (
    <div className={styles.page} data-login-page data-password-reset-page={stage}>
      <header className={styles.nav}><Link href={programmePublicHref(locale, "/")}>B4GAMBLE</Link><Link href={programmePublicHref(locale, "/")}>← {t("Back to site")}</Link></header>
      <main className={styles.main}>
        <div aria-hidden="true" className={styles.glow} />
        <section aria-labelledby="password-reset-title" className={styles.panel}>
          <p className={styles.kicker}><span aria-hidden="true" />{t("Members")}</p>
          <h1 id="password-reset-title" ref={heading} tabIndex={-1}>{title}</h1>
          <p className={styles.lead}>{lead}</p>

          {stage === "request" || stage === "invalid" ? <>
            <form onSubmit={requestLink}>
              <input aria-label={t("Email")} autoComplete="email" inputMode="email" name="email" onChange={(event) => setEmail(event.target.value)} placeholder={t("Email")} required spellCheck={false} type="email" value={email} />
              <button className={styles.primary} disabled={busy} type="submit">{busy ? t("Sending…") : t("Send reset link")}</button>
            </form>
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            {backToLogin}
          </> : null}

          {stage === "sent" ? <>
            <p className={styles.hint}>{t("No email? Check your spam folder, or send a new link in a few minutes.")}</p>
            <button className={styles.secondary} onClick={() => showStage("request")} type="button">{t("Send another link")}</button>
            {backToLogin}
          </> : null}

          {stage === "reset" ? <>
            <form onSubmit={saveNewPassword}>
              <input aria-label={t("New password")} autoComplete="new-password" maxLength={PASSWORD_MAX_LENGTH} minLength={PASSWORD_MIN_LENGTH} name="password" onChange={(event) => setPassword(event.target.value)} placeholder={t("New password")} required type="password" value={password} />
              <input aria-label={t("Repeat new password")} autoComplete="new-password" maxLength={PASSWORD_MAX_LENGTH} minLength={PASSWORD_MIN_LENGTH} name="confirmPassword" onChange={(event) => setConfirmation(event.target.value)} placeholder={t("Repeat new password")} required type="password" value={confirmation} />
              <button className={styles.primary} disabled={busy} type="submit">{busy ? t("Saving…") : t("Save new password")}</button>
            </form>
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
          </> : null}

          {stage === "done" ? <Link className={`${styles.primary} ${styles.primaryLink}`} href={loginPath(returnTo)}>{shell.logIn}</Link> : null}
        </section>
      </main>
      <footer className={styles.footer}><span>18+</span><span>{t("Private Programme")}</span><Link href={programmeHelpPath(locale)}>{t("Help — protected support →")}</Link></footer>
    </div>
  );
}
