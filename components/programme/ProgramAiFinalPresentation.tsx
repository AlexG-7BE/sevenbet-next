"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { PROGRAMME_MARKETING_OPT_IN_DEFAULT, PROGRAMME_MARKETING_OPT_IN_LABEL } from "@/lib/customers/email-preference-client";
import { programmeText, type ProgrammeMessageKey } from "@/lib/i18n/programme-catalog";
import {
  PROGRAMME_ANSWER_FOCUS,
  PROGRAMME_ANSWER_NOTE_MAX_LENGTH,
  PROGRAMME_READY_ANSWERS,
  PROGRAMME_START_QUESTION,
  type ProgrammeReadyAnswer,
} from "@/lib/programme/program-ai/ready-answers";
import { programmeHelpPath, type ProgrammeLocale } from "@/lib/programme/presentation";
import styles from "./ProgramAiFinalPresentation.module.css";

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

/**
 * Founder decisions, 11 Oct 2026. The Programme starts with ready answers; several can be picked,
 * and "Something else" opens a short optional note. There is no voice. One button under the list
 * is the explicit consent to process the answers: its statement stands directly above it and is
 * asked nowhere else on this route. On a first visit the same press, under the line, is also the
 * 18+, Terms and Privacy affirmation. There is no consent tick and no separate consent screen,
 * and the next screen opens at once.
 */
export function ProgrammeStartScreen({ accessLine, error, initialAnswers, onAgree, onOpenPlan, locale }: {
  /** Shown on a first visit; an account that already affirmed access is not asked again. */
  accessLine: boolean;
  error: string;
  /** Answers picked in this tab before the account existed; shown picked, to be agreed once. */
  initialAnswers?: readonly ProgrammeReadyAnswer[];
  onAgree: (choice: { answers: ProgrammeReadyAnswer[]; note: string }) => void;
  /** An account may open its plan without answering now. */
  onOpenPlan?: () => void;
  locale: ProgrammeLocale;
}) {
  const t = translated(locale);
  const [answers, setAnswers] = useState<ProgrammeReadyAnswer[]>(() => [...(initialAnswers ?? [])]);
  const [note, setNote] = useState("");
  const toggle = (answer: ProgrammeReadyAnswer) => setAnswers((current) => current.includes(answer) ? current.filter((item) => item !== answer) : [...current, answer]);
  return (
    <div className={styles.canvas} data-programme-presentation="start">
      <main className={styles.standardFrame} data-site-classification="STANDARD" data-site-frame="standard">
        <div className={styles.startState}>
          <p className={styles.eyebrow}>{t("Mission 01")}</p>
          <h1 id="programme-start-title"><SerifTail text={t(PROGRAMME_START_QUESTION)} /></h1>
          <p className={styles.startLead}>{t("Pick everything that fits.")}</p>
          <div aria-labelledby="programme-start-title" className={styles.answerList} data-programme-ready-answers="" role="group">
            {PROGRAMME_READY_ANSWERS.map((answer) => (
              <label className={styles.answerOption} key={answer}>
                <input checked={answers.includes(answer)} onChange={() => toggle(answer)} type="checkbox" />
                <span>{t(answer)}</span>
              </label>
            ))}
            {answers.includes("Something else") ? <textarea aria-label={t("Tell us in a few words")} className={styles.answerNote} data-programme-answer-note="" maxLength={PROGRAMME_ANSWER_NOTE_MAX_LENGTH} onChange={(event) => setNote(event.target.value)} placeholder={t("Tell us in a few words")} rows={2} value={note} /> : null}
          </div>
          <p className={styles.consentStatement} data-programme-start-consent="">{t("I agree that B4GAMBLE and its AI provider use my answers, which may reveal my health, to personalise my plan.")}</p>
          <button className={styles.primaryAction} data-programme-agree="" disabled={answers.length === 0} onClick={() => onAgree({ answers, note: answers.includes("Something else") ? note : "" })} type="button">
            {t("Agree and continue")}
          </button>
          {accessLine ? <>
            <p className={styles.accessNote} data-programme-access-note="">{t("By continuing, you confirm you are 18+ and accept the Terms and Privacy Notice.")}</p>
            <p className={styles.legalLinks}><Link href="/terms">{t("Read Terms")}</Link><Link href="/privacy">{t("Read Privacy Notice")}</Link></p>
          </> : null}
          <StatusMessage error={error} />
          {onOpenPlan ? <button className={styles.quietAction} data-programme-open-plan="" onClick={onOpenPlan} type="button">{t("Open my plan")}</button> : null}
          <Link className={styles.helpLink} href={programmeHelpPath(locale)}>{t("Protected Help / pause options →")}</Link>
        </div>
      </main>
    </div>
  );
}

/**
 * A signed-in account that has not affirmed access yet opens its plan with one press under the
 * line. The story consent is not asked here: it belongs to the start screen above.
 */
export function ProgrammeAccessScreen({ busy, error, onConfirm, locale }: {
  busy: boolean;
  error: string;
  onConfirm: () => void;
  locale: ProgrammeLocale;
}) {
  const t = translated(locale);
  return (
    <div className={styles.canvas} data-programme-presentation="access">
      <main className={styles.standardFrame} data-site-classification="STANDARD" data-site-frame="standard">
        <div className={styles.accessState}>
          <p className={styles.eyebrow}>{t("Programme access")}</p>
          <h1 id="programme-access-title"><SerifTail text={t("Open your plan.")} /></h1>
          <section className={styles.accessBoundary} aria-labelledby="programme-access-title">
            <button className={styles.primaryAction} disabled={busy} onClick={onConfirm} type="button">
              {busy ? t("Verifying access…") : t("Open my plan")}
            </button>
            <p className={styles.accessNote} data-programme-access-note="">{t("By continuing, you confirm you are 18+ and accept the Terms and Privacy Notice.")}</p>
            <p className={styles.legalLinks}><Link href="/terms">{t("Read Terms")}</Link><Link href="/privacy">{t("Read Privacy Notice")}</Link></p>
            <StatusMessage error={error} />
            <Link className={styles.helpLink} href={programmeHelpPath(locale)}>{t("Protected Help / pause options →")}</Link>
          </section>
        </div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return <svg aria-hidden="true" height="18" viewBox="0 0 24 24" width="18"><path d="M21.35 11.1H12v2.9h5.35c-.5 2.4-2.55 3.8-5.35 3.8a5.8 5.8 0 1 1 0-11.6c1.45 0 2.75.5 3.8 1.45l2.15-2.15A8.9 8.9 0 0 0 12 3a9 9 0 1 0 0 18c5.2 0 8.65-3.65 8.65-8.8 0-.35-.1-.75-.3-1.1z" fill="currentColor" /></svg>;
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
  answers,
  fallbackFocus = null,
  googleLinkRecovery,
  googleAvailable,
  googleOpening = false,
  busy,
  error,
  onSave,
  onEmail,
  onGoogle,
  onLinkGoogle,
  passwordResetHref = null,
  locale,
}: {
  authenticated: boolean;
  /** The picked answers. Empty when a Google sign-up started on Log in returns here without them. */
  answers: readonly ProgrammeReadyAnswer[];
  /** The focus of a Starting Point kept in the tab from before the answers were remembered. */
  fallbackFocus?: string | null;
  googleLinkRecovery: boolean;
  googleAvailable: boolean;
  /** A press on Google is leaving the page: the button is off and says so (Founder, 12 Oct 2026). */
  googleOpening?: boolean;
  busy: boolean;
  error: string;
  onSave: () => void;
  onEmail: (input: { email: string; password: string; marketingAllowed: boolean }) => void;
  onGoogle: (input: { marketingAllowed: boolean }) => void;
  onLinkGoogle: () => void;
  /** Set once the email already has an account and the password did not match. */
  passwordResetHref?: string | null;
  locale: ProgrammeLocale;
}) {
  const t = translated(locale);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketingAllowed, setMarketingAllowed] = useState(PROGRAMME_MARKETING_OPT_IN_DEFAULT);
  // Founder decisions, 11 Oct 2026: one email step creates the account or signs in to the one
  // that owns the email. Email, then password, then the button, all visible at once.
  // Founder decisions, 27 Sep and 11 Oct 2026: one opt-in serves both Google and email sign-up,
  // asked once on this screen. It is ticked when the form opens, short, and the last thing in
  // the form.
  const marketingChoiceShown = !googleLinkRecovery;
  // Founder decisions, 11 Oct 2026: the screen does not repeat the picked answers back. It shows
  // what the Programme will work on first, one line of ours per answer, under one large heading,
  // so it opens at once and waits for nothing.
  const lines = answers.length ? answers.map((answer) => t(PROGRAMME_ANSWER_FOCUS[answer])) : fallbackFocus ? [fallbackFocus] : [];
  return (
    <div className={styles.canvas} data-programme-presentation="starting-point-ready">
      <main className={styles.standardFrame} data-site-classification="STANDARD" data-site-frame="standard">
        <div className={styles.readyState}>
          {lines.length ? <>
        <h1><SerifTail text={t("Here's what we can do together.")} /></h1>
        <section className={styles.startingPointCard} data-programme-understanding="">
          <ul>{lines.map((line) => <li key={line}>{line}</li>)}</ul>
        </section>
          </> : <>
        <h1><SerifTail text={t("Save your place first.")} words={2} /></h1>
        <p className={styles.accountFirstLead}>{t("Create your account now. Mission 01 waits in your plan whenever you are ready.")}</p>
          </>}
        <section className={styles.registrationActions} data-programme-presentation-state="registration">
          {googleLinkRecovery ? <p>{t("Your confirmed Starting Point stays in this browser while you sign in and link Google securely.")}</p> : null}
          {authenticated && !lines.length ? null : authenticated ? <button className={styles.primaryAction} disabled={busy} onClick={googleLinkRecovery ? onLinkGoogle : onSave} type="button">{t(busy ? "Saving your Starting Point…" : googleLinkRecovery ? "Link Google securely" : "Save to my account")}</button> : <>
            {googleAvailable && !googleLinkRecovery ? <button className={`${styles.primaryAction} ${styles.googleAction}`} disabled={busy} onClick={() => onGoogle({ marketingAllowed: marketingChoiceShown && marketingAllowed })} type="button"><GoogleIcon />{t(googleOpening ? "Opening Google…" : "Continue with Google")}</button> : null}
            {googleAvailable && !googleLinkRecovery ? <p className={styles.entryDivider}><span>{t("or")}</span></p> : null}
            <form className={styles.emailForm} data-programme-email-entry="" onSubmit={(event: FormEvent) => { event.preventDefault(); onEmail({ email, password, marketingAllowed: marketingChoiceShown && marketingAllowed }); }}>
              <label><span>{t("Email")}</span><input autoComplete="email" inputMode="email" name="email" onChange={(event) => setEmail(event.target.value)} required spellCheck={false} type="email" value={email} /></label>
              <label><span>{t("Password")}</span><input autoComplete={googleLinkRecovery ? "current-password" : "new-password"} minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />{googleLinkRecovery ? null : <small>{t("Use at least 8 characters.")}</small>}</label>
              <button className={styles.primaryAction} disabled={busy} type="submit">{t(googleLinkRecovery ? "Sign in, then link Google" : "Continue with email")}</button>
              {passwordResetHref ? <Link className={styles.inlineLink} href={passwordResetHref}>{t("Forgot password?")}</Link> : null}
            </form>
            {marketingChoiceShown ? <label className={styles.marketingChoice} data-programme-marketing-choice=""><input checked={marketingAllowed} onChange={(event) => setMarketingAllowed(event.target.checked)} type="checkbox" /><span>{t(PROGRAMME_MARKETING_OPT_IN_LABEL)}</span></label> : null}
          </>}
          <StatusMessage error={error} />
          </section>
        </div>
      </main>
    </div>
  );
}
