"use client";

import { ProgramAiAuthenticatedHeader } from "@/components/programme/ProgramAiAuthenticatedHeader";
import type { ProgramAiHome } from "@/components/programme/ProgramAiAuthenticated.types";
import { programmeMissionProgressCopy, programmeReviewStatusCopy } from "@/components/programme/ProgramAiHome.copy";
import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import { programmeMissionCopy, programmeText, type ProgrammeMessageKey } from "@/lib/i18n/programme-catalog";
import type { ProgrammeLocale } from "@/lib/programme/presentation";
import styles from "./ProgramAiAuthenticated.module.css";

export function ProgramAiHomeScreen({ error, home, userId, onMission, onMissionOneEntry, onReview, locale, programmePath }: {
  error?: string;
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
  return (
    <div className={`${styles.shell} ${styles.dashboardShell}`} data-programme-presentation="dashboard">
      <ProgramAiAuthenticatedHeader dashboard locale={locale} programmePath={programmePath} totalXp={home.totalXp} userId={userId} />
      <main className={styles.dashboard} data-site-classification="STANDARD" data-site-frame="standard">
        {error ? <p role="alert">{error}</p> : null}
        <p className="srOnly">{t("Completion, current position and locks come from your server record. Each Review becomes available at a meaningful point.")}</p>
        <div className={styles.dashboardGrid}>
          <div className={styles.dashboardLeft}>
            <section className={styles.currentCard}>
              <div><span>{t(home.primaryAction === "review-mission" ? "Mission complete" : "Current mission")}</span><h1 aria-label={t("Mission {number} — {title}", { number: String(home.currentMission).padStart(2, "0"), title: currentTitle || t("Continue your Programme") })}><span className={styles.currentMissionNumber}>{t("Mission {number} — {title}", { number: String(home.currentMission).padStart(2, "0"), title: "" })}</span>{currentTitle || t("Continue your Programme")}</h1><p>{programmeCurrentCue(home, locale)}</p><div className={styles.currentActions}><button onClick={() => home.primaryAction === "start-mission-one" || home.primaryAction === "finish-mission-one" ? onMissionOneEntry() : onMission(home.currentMission)} type="button">{programmePrimaryActionLabel(home.primaryAction, locale)}</button>{current ? <small>{programmeMissionProgressCopy(current, locale)}</small> : null}</div></div>
              <strong><span>{String(home.currentMission).padStart(2, "0")}/10</span><small>{t("Missions")}</small></strong>
            </section>
            <section className={styles.journeyCard} aria-labelledby="programme-path-title"><span id="programme-path-title">{t("Your 10-mission journey")}</span><ol>{home.missions.map((mission) => <li aria-current={mission.status === "current" ? "step" : undefined} data-state={mission.status} key={mission.missionNumber}><b>{String(mission.missionNumber).padStart(2, "0")}</b><strong>{programmeMissionCopy(locale, mission.missionNumber).title}</strong><small>{t(mission.status === "completed" ? "Complete" : mission.status === "current" ? "In progress" : "Locked")}</small></li>)}</ol></section>
          </div>
          <div className={styles.dashboardRight}>
            <section className={styles.compactStats} aria-label={t("Programme progress")}><div><span className="srOnly">{home.totalXp} XP</span><strong aria-hidden="true">{formatProgrammeNumber(home.totalXp, locale)}</strong><span aria-hidden="true">XP</span></div><div><strong>{home.currentStreak}</strong><span className={styles.desktopStatLabel}>{t("day streak")}</span><span className={styles.mobileStatLabel}>{t("streak")}</span></div><div><strong>{home.activeDays}</strong><span>{t("active days")}</span></div></section>
            {home.startingPoint ? <section className={styles.compactStartingPoint}><span>{t("Your starting point")}</span><p>{home.startingPoint.startingPoint}</p><small>{t("Saved Starting Point")}</small></section> : null}
            <section className={styles.compactAchievements}><span>{t("Achievements")}</span><div>{home.achievements.length ? home.achievements.map((achievement) => <b data-state={achievement.state} key={achievement.slug}>{achievementTitle(achievement.slug, locale)}</b>) : <b data-state="locked">{t("First achievement waits ahead")}</b>}</div></section>
            <section className={styles.compactReviews}><span>{t("Personal reviews")}</span><p>{programmeReviewStatusCopy(home, locale)}</p>{home.reviews.filter((review) => review.status === "available").map((review) => <button key={review.milestone} onClick={() => onReview(review.milestone)} type="button"><strong>{reviewTitle(review.milestone, locale)}</strong><small>{t("Open review")}</small></button>)}</section>
            <section className={styles.compactResearch}><span>{t("Research")}</span>{home.discoveryLinks.length ? <nav>{home.discoveryLinks.map((item) => <a href={item.href} key={item.href} onClick={() => { const destinationRoute = discoveryDestination(item.href); if (destinationRoute) productAnalyticsClient.discoveryClicked({ sourceSurface: "programme_home", destinationRoute }); }}>{discoveryLabel(item.href, locale)}</a>)}</nav> : <p>{t("Use the main navigation for public casino information.")}</p>}</section>
          </div>
        </div>
        <footer className={styles.dashboardFooter}><span>{t("Your data is private. We never use it for offers or rankings.")}</span><span>{t("18+ · Protected Help remains available.")}</span></footer>
      </main>
    </div>
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
