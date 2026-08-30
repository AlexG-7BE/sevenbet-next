"use client";

import { ProgramAiAuthenticatedHeader } from "@/components/programme/ProgramAiAuthenticatedHeader";
import type { ProgramAiHome } from "@/components/programme/ProgramAiAuthenticated.types";
import { programmeMissionProgressCopy, programmeReviewStatusCopy } from "@/components/programme/ProgramAiHome.copy";
import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import styles from "./ProgramAiAuthenticated.module.css";

export function ProgramAiHomeScreen({ home, userId, onMission, onMissionOneEntry, onReview }: {
  home: ProgramAiHome;
  userId: string;
  onMission: (missionNumber: number) => void;
  onReview: (milestone: "first" | "mid" | "full") => void;
  onMissionOneEntry: () => void;
}) {
  const current = home.missions.find((mission) => mission.missionNumber === home.currentMission);
  return (
    <div className={`${styles.shell} ${styles.dashboardShell}`} data-programme-presentation="dashboard">
      <ProgramAiAuthenticatedHeader dashboard totalXp={home.totalXp} userId={userId} />
      <main className={styles.dashboard} data-site-classification="STANDARD" data-site-frame="standard">
        <p className="srOnly">Completion, current position and locks come from your server record. Each Review becomes available at a meaningful point.</p>
        <div className={styles.dashboardGrid}>
          <div className={styles.dashboardLeft}>
            <section className={styles.currentCard}>
              <div><span>{home.primaryAction === "review-mission" ? "Mission complete" : "Current mission"}</span><h1 aria-label={`Mission ${String(home.currentMission).padStart(2, "0")} — ${current?.title || "Continue your Programme"}`}><span className={styles.currentMissionNumber}>Mission {String(home.currentMission).padStart(2, "0")} — </span>{current?.title || "Continue your Programme"}</h1><p>{programmeCurrentCue(home)}</p><div className={styles.currentActions}><button onClick={() => home.primaryAction === "start-mission-one" || home.primaryAction === "finish-mission-one" ? onMissionOneEntry() : onMission(home.currentMission)} type="button">{programmePrimaryActionLabel(home.primaryAction)}</button>{current ? <small>{programmeMissionProgressCopy(current)}</small> : null}</div></div>
              <strong><span>{String(home.currentMission).padStart(2, "0")}/10</span><small>Missions</small></strong>
            </section>
            <section className={styles.journeyCard} aria-labelledby="programme-path-title"><span id="programme-path-title">Your 10-mission journey</span><ol>{home.missions.map((mission) => <li aria-current={mission.status === "current" ? "step" : undefined} data-state={mission.status} key={mission.missionNumber}><b>{String(mission.missionNumber).padStart(2, "0")}</b><strong>{mission.title}</strong><small>{mission.status === "completed" ? "Complete" : mission.status === "current" ? "In progress" : "Locked"}</small></li>)}</ol></section>
          </div>
          <div className={styles.dashboardRight}>
            <section className={styles.compactStats} aria-label="Programme progress"><div><span className="srOnly">{home.totalXp} XP</span><strong aria-hidden="true">{formatProgrammeNumber(home.totalXp)}</strong><span aria-hidden="true">XP</span></div><div><strong>{home.currentStreak}</strong><span className={styles.desktopStatLabel}>day streak</span><span className={styles.mobileStatLabel}>streak</span></div><div><strong>{home.activeDays}</strong><span>active days</span></div></section>
            {home.startingPoint ? <section className={styles.compactStartingPoint}><span>Your starting point</span><p>{home.startingPoint.startingPoint}</p><small>Saved Starting Point</small></section> : null}
            <section className={styles.compactAchievements}><span>Achievements</span><div>{home.achievements.length ? home.achievements.map((achievement) => <b data-state={achievement.state} key={achievement.slug}>{achievement.title}</b>) : <b data-state="locked">First achievement waits ahead</b>}</div></section>
            <section className={styles.compactReviews}><span>Personal reviews</span><p>{programmeReviewStatusCopy(home)}</p>{home.reviews.filter((review) => review.status === "available").map((review) => <button key={review.milestone} onClick={() => onReview(review.milestone)} type="button"><strong>{review.title}</strong><small>Open review</small></button>)}</section>
            <section className={styles.compactResearch}><span>Research</span>{home.discoveryLinks.length ? <nav>{home.discoveryLinks.map((item) => <a href={item.href} key={item.href} onClick={() => { const destinationRoute = discoveryDestination(item.href); if (destinationRoute) productAnalyticsClient.discoveryClicked({ sourceSurface: "programme_home", destinationRoute }); }}>{item.label}</a>)}</nav> : <p>Use the main navigation for public casino information.</p>}</section>
          </div>
        </div>
        <footer className={styles.dashboardFooter}><span>Your data is private. We never use it for offers or rankings.</span><span>18+ · BeGambleAware.org</span></footer>
      </main>
    </div>
  );
}

function formatProgrammeNumber(value: number) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
}

function programmePrimaryActionLabel(action: ProgramAiHome["primaryAction"]) {
  if (action === "start-mission-one") return "Start Mission 01";
  if (action === "finish-mission-one") return "Finish Mission 01";
  if (action === "start-mission") return "Start mission";
  if (action === "review-mission") return "Review mission";
  return "Resume mission";
}

function programmeCurrentCue(home: ProgramAiHome) {
  if (home.primaryAction === "finish-mission-one") {
    return "Your first action and XP are saved. For privacy, the situation itself was not retained. Enter one again to finish your Starting Point.";
  }
  if (home.startingPoint?.continuationCue) return home.startingPoint.continuationCue;
  if (home.primaryAction === "start-mission-one") return "Share one situation to create your Starting Point.";
  return "Continue from the current Mission action shown below.";
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
