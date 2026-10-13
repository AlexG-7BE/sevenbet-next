"use client";

import { useState } from "react";

import { ProgramAiAuthenticatedHeader } from "@/components/programme/ProgramAiAuthenticatedHeader";
import type { ProgramAiHome } from "@/components/programme/ProgramAiAuthenticated.types";
import { programmeReviewStatusCopy } from "@/components/programme/ProgramAiHome.copy";
import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import { authClient } from "@/lib/auth/client";
import { programmeMissionCopy, programmeText, type ProgrammeMessageKey } from "@/lib/i18n/programme-catalog";
import { programmePublicHref, type ProgrammeLocale } from "@/lib/programme/presentation";
import { humanValue } from "@/lib/programme/program-ai/mission-presentation";
import styles from "./ProgramAiAuthenticated.module.css";

/** The Mission whose wording, kept in the tab, is the sentence of the weekly goal. */
export const GOAL_WORDING_MISSION = 2;

export function ProgramAiHomeScreen({ error, home, userId, onMission, onMissionOneEntry, onReview, locale, programmePath, unconfirmedEmail = null, goalWording = "" }: {
  error?: string;
  /**
   * The person's own wording of the goal, when this tab holds it (the same tab storage the result
   * card of the goal Mission reads). It is shown and nothing else: the home never sends or stores it.
   */
  goalWording?: string;
  /** The signed-in customer's address while it is still unconfirmed. */
  unconfirmedEmail?: string | null;
  home: ProgramAiHome;
  userId: string;
  onMission: (missionNumber: number) => void;
  onReview: (milestone: "first" | "mid" | "full") => void;
  onMissionOneEntry: () => void;
  locale: ProgrammeLocale;
  programmePath: string;
}) {
  const current = home.missions.find((mission) => mission.missionNumber === home.currentMission);
  const currentTitle = programmeMissionCopy(locale, home.currentMission).title;
  const t = (key: ProgrammeMessageKey, values: Readonly<Record<string, string | number>> = {}) => programmeText(locale, key, values);
  // Founder decisions, 25 Sep and 10 Oct 2026: the generic research links appear once the "Research
  // responsibly" Mission is complete, right under the current mission, and not before. They stay
  // generic: no Programme data picks them. Each opens in the Programme's own language, as the
  // completion screen's links do, instead of going through the unprefixed address's redirect.
  const researchFeatured = home.discoveryLinks.length > 0 && home.researchAccess === "open";
  // clean route: see lib/research-access.ts researchDoorOpen
  const researchLinksShown = true;
  const research = <section className={`${styles.compactResearch} ${styles.researchFeatured}`} data-programme-research="featured"><span>{t("Research")}</span><nav>{home.discoveryLinks.map((item) => <a href={programmePublicHref(locale, item.href)} key={item.href} onClick={() => { const destinationRoute = discoveryDestination(item.href); if (destinationRoute) productAnalyticsClient.discoveryClicked({ sourceSurface: "programme_home", destinationRoute }); }}>{discoveryLabel(item.href, locale)}</a>)}</nav></section>;
  // The home (Founder, 13 October 2026). Every number, date and state below is the server's: the
  // weekly goal's day and check-in date, the step, the statuses and the action count are shown as
  // they come. The path only folds: all its rows stay in the page.
  const [allSteps, setAllSteps] = useState(false);
  const weekGoal = home.weekGoal ?? null;
  // The goal's sentence is the person's own wording while this tab holds it; otherwise, and on any
  // other device, the saved approach the server sends stands as the sentence.
  const ownGoal = goalWording.trim();
  const pathStart = Math.min(Math.max(home.currentStep - PATH_ROWS_BEFORE - 1, 0), Math.max(home.missions.length - PATH_ROWS, 0));
  const startingPoint = home.startingPoint ? <section className={styles.homeStartingPoint} data-place={weekGoal ? "below" : "lead"} data-programme-home="starting-point"><span>{t("Your starting point")}</span><p>{home.startingPoint.startingPoint}</p><small>{t("Saved Starting Point")}</small></section> : null;
  return (
    <div className={`${styles.shell} ${styles.dashboardShell}`} data-programme-presentation="dashboard">
      <ProgramAiAuthenticatedHeader dashboard locale={locale} programmePath={programmePath} totalXp={home.totalXp} userId={userId} />
      <main className={styles.home} data-site-classification="STANDARD" data-site-frame="standard">
        {error ? <p role="alert">{error}</p> : null}
        <p className="srOnly">{t("Completion, current position and locks come from your server record. Each Review becomes available at a meaningful point.")}</p>
        <div className={styles.homeHello}>
          <div><p className={styles.homeGreeting}>{t("Hello.")}</p><p className={styles.homeQuiet}>{t("One step at a time.")}</p></div>
          <section className={styles.homeStats} aria-label={t("Programme progress")}><span><span className="srOnly">{home.totalXp} XP</span><b aria-hidden="true">{formatProgrammeNumber(home.totalXp, locale)} XP</b></span><span><b>{home.currentStreak}</b> <span className={styles.desktopStatLabel}>{t("day streak")}</span><span className={styles.mobileStatLabel}>{t("streak")}</span></span><span><b>{home.activeDays}</b> {t("active days")}</span></section>
        </div>
        {weekGoal ? (
          <section className={styles.homeGoal} data-goal-day={weekGoal.day ?? "check-in"} data-programme-home="goal">
            <span>{t("Your goal this week")}</span>
            <blockquote data-goal-sentence={ownGoal ? "own" : "approach"}>{ownGoal || humanValue(weekGoal.goalStyle, locale, "goalStyle")}</blockquote>
            {ownGoal ? <small data-goal-approach>{humanValue(weekGoal.goalStyle, locale, "goalStyle")}</small> : null}
            <ol aria-hidden="true">{Array.from({ length: weekGoal.totalDays }, (_, index) => <li data-day={weekGoalDayMark(weekGoal.day, index + 1)} key={index}>{index + 1}</li>)}</ol>
            <p>{weekGoal.day ? t("Day {day} of {total} · check-in {date}", { day: weekGoal.day, total: weekGoal.totalDays, date: formatProgrammeDate(weekGoal.checkInDate, locale) }) : t("Check-in {date}", { date: formatProgrammeDate(weekGoal.checkInDate, locale) })}</p>
          </section>
        ) : startingPoint}
        <section className={styles.homeNext} data-programme-home="next">
          <div><span>{t(home.primaryAction === "review-mission" ? "Mission complete" : "Next step")}</span><em>{String(home.currentStep).padStart(2, "0")} / {home.missions.length}</em></div>
          <h1 aria-label={t("Mission {number} — {title}", { number: String(home.currentStep).padStart(2, "0"), title: currentTitle || t("Continue your Programme") })}>{currentTitle || t("Continue your Programme")}</h1>
          {current && home.primaryAction !== "review-mission" ? <p data-programme-home="next-length">{t("About {minutes} minutes · {questions} questions", { minutes: current.actionsTotal, questions: current.actionsTotal })}</p> : null}
          <p className={styles.homeNextCue}>{programmeCurrentCue(home, locale)}</p>
          <button onClick={() => home.primaryAction === "start-mission-one" || home.primaryAction === "finish-mission-one" ? onMissionOneEntry() : onMission(home.currentMission)} type="button">{programmePrimaryActionLabel(home.primaryAction, locale)}<svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
        </section>
        {researchLinksShown && researchFeatured ? research : null}
        {unconfirmedEmail ? <EmailConfirmationNotice email={unconfirmedEmail} locale={locale} programmePath={programmePath} /> : null}
        <section className={styles.homePath} aria-labelledby="programme-path-title" data-programme-home="path" data-programme-path={allSteps ? "all" : "folded"}>
          <div><span id="programme-path-title">{t("Your path")}</span><button aria-controls="programme-path-steps" aria-expanded={allSteps} onClick={() => setAllSteps((shown) => !shown)} type="button">{allSteps ? t("Show fewer steps") : t("Show all {count} steps", { count: home.missions.length })}</button></div>
          <ol id="programme-path-steps">{home.missions.map((mission, index) => <li aria-current={mission.status === "current" ? "step" : undefined} data-state={mission.status} hidden={!allSteps && (index < pathStart || index >= pathStart + PATH_ROWS)} key={mission.missionNumber}><i aria-hidden="true">{mission.status === "completed" ? <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.4" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg> : mission.step}</i><strong>{programmeMissionCopy(locale, mission.missionNumber).title}</strong>{mission.status === "current" ? <small>{t("Now")}</small> : <small className="srOnly">{t(mission.status === "completed" ? "Complete" : "Locked")}</small>}</li>)}</ol>
        </section>
        {weekGoal ? startingPoint : null}
        <section className={styles.homeReviews}><span>{t("Personal reviews")}</span><p>{programmeReviewStatusCopy(home, locale)}</p>{home.reviews.filter((review) => review.status === "available").map((review) => <button key={review.milestone} onClick={() => onReview(review.milestone)} type="button"><strong>{reviewTitle(review.milestone, locale)}</strong><small>{t("Open review")}</small></button>)}</section>
        <section className={styles.homeAchievements}><span>{t("Achievements")}</span><div>{home.achievements.length ? home.achievements.map((achievement) => <b data-state={achievement.state} key={achievement.slug}>{achievementTitle(achievement.slug, locale)}</b>) : <b data-state="locked">{t("First achievement waits ahead")}</b>}</div></section>
        <footer className={styles.dashboardFooter}><span>{t("Your data is private. We never use it for offers or rankings.")}</span><span>{t("18+ · Protected Help remains available.")}</span></footer>
      </main>
    </div>
  );
}

/** The folded path shows the current step with two rows before it and two after. */
const PATH_ROWS = 5;
const PATH_ROWS_BEFORE = 2;

/** A day circle's mark, from the server's day: the running day is lit; from the check-in date on none is. */
function weekGoalDayMark(day: number | null, circle: number) {
  if (day === null || circle < day) return "past";
  return circle === day ? "now" : "ahead";
}

/** A server date (YYYY-MM-DD) in the reader's language, as day and month. */
function formatProgrammeDate(date: string, locale: ProgrammeLocale) {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00.000Z`));
}

/**
 * Founder decision, 27 Sep 2026: an unconfirmed customer can ask for the
 * confirmation link again from their dashboard. The link lands back here.
 */
function EmailConfirmationNotice({ email, locale, programmePath }: { email: string; locale: ProgrammeLocale; programmePath: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  async function resend() {
    setState("sending");
    try {
      const result = await authClient.sendVerificationEmail({ email, callbackURL: programmePath });
      setState(result.error ? "failed" : "sent");
    } catch {
      setState("failed");
    }
  }
  return (
    <section className={styles.emailNotice} data-programme-email-confirmation={state}>
      <p>{programmeText(locale, "Confirm your email: open the link we sent to {email}.", { email })}</p>
      {state === "sent"
        ? <p role="status">{programmeText(locale, "Link sent. Check your inbox.")}</p>
        : <button disabled={state === "sending"} onClick={resend} type="button">{programmeText(locale, state === "sending" ? "Sending the link…" : "Send the link again")}</button>}
      {state === "failed" ? <p role="alert">{programmeText(locale, "The link could not be sent right now. Try again in a few minutes.")}</p> : null}
    </section>
  );
}

function formatProgrammeNumber(value: number, locale: ProgrammeLocale) {
  return new Intl.NumberFormat(locale, { useGrouping: true }).format(value);
}

function programmePrimaryActionLabel(action: ProgramAiHome["primaryAction"], locale: ProgrammeLocale) {
  if (action === "start-mission-one") return programmeText(locale, "Start Mission 01");
  if (action === "finish-mission-one") return programmeText(locale, "Finish Mission 01");
  if (action === "start-mission") return programmeText(locale, "Start mission");
  if (action === "review-mission") return programmeText(locale, "Review mission");
  return programmeText(locale, "Resume mission");
}

function programmeCurrentCue(home: ProgramAiHome, locale: ProgrammeLocale) {
  if (home.primaryAction === "finish-mission-one") {
    return programmeText(locale, "Your first action and XP are saved. For privacy, the situation itself was not retained. Enter one again to finish your Starting Point.");
  }
  if (home.startingPoint?.continuationCue) return home.startingPoint.continuationCue;
  if (home.primaryAction === "start-mission-one") return programmeText(locale, "Share one situation to create your Starting Point.");
  return programmeText(locale, "Continue from the current Mission action shown below.");
}

function reviewTitle(milestone: "first" | "mid" | "full", locale: ProgrammeLocale) {
  return programmeText(locale, milestone === "first" ? "First Personal Review" : milestone === "mid" ? "Mid-Programme Personal Review" : "Full Programme Personal Review");
}

function achievementTitle(slug: string, locale: ProgrammeLocale) {
  if (slug === "first-plan") return programmeText(locale, "First Plan");
  if (slug === "boundary-built") return programmeText(locale, "Boundary Built");
  return slug;
}

function discoveryLabel(href: string, locale: ProgrammeLocale) {
  if (href === "/casinos") return programmeText(locale, "Compare casinos");
  if (href === "/bonuses") return programmeText(locale, "Bonuses");
  if (href === "/best-offers") return programmeText(locale, "Best offers");
  return href;
}

function discoveryDestination(href: string) {
  switch (href) {
    case "/casinos": return "casinos" as const;
    case "/bonuses": return "bonuses" as const;
    case "/best-offers": return "best_offers" as const;
    case "/bonus-guide": return "bonus_guide" as const;
    default: return null;
  }
}
