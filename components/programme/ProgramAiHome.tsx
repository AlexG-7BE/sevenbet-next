"use client";

import { ProgramAiAuthenticatedHeader } from "@/components/programme/ProgramAiAuthenticatedHeader";
import type { ProgramAiHome } from "@/components/programme/ProgramAiAuthenticated.types";
import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import styles from "./ProgramAiAuthenticated.module.css";

export function ProgramAiHomeScreen({ home, userId, onMission, onReview, onStart }: {
  home: ProgramAiHome;
  userId: string;
  onMission: (missionNumber: number) => void;
  onReview: (milestone: "first" | "mid" | "full") => void;
  onStart: () => void;
}) {
  const current = home.missions.find((mission) => mission.missionNumber === home.currentMission);
  const next = home.currentMission < 10 ? home.missions.find((mission) => mission.missionNumber === home.currentMission + 1) : null;
  const authenticatedMission = home.currentMission >= 2;
  const completedCount = home.missions.filter((mission) => mission.status === "completed").length;
  return (
    <div className={`${styles.shell} ${styles.dashboardShell}`}>
      <ProgramAiAuthenticatedHeader totalXp={home.totalXp} userId={userId} />
      <main className={styles.dashboard}>
        <p className="srOnly">Completion, current position and locks come from your server record. Each Review becomes available at a meaningful point.</p>
        <div className={styles.dashboardGrid}>
          <div className={styles.dashboardLeft}>
            <section className={styles.currentCard}>
              <div><span>Current mission</span><h1>Mission {String(home.currentMission).padStart(2, "0")} — {current?.title || "Continue your Programme"}</h1><p>{home.startingPoint?.continuationCue || "Continue from the first action that is not yet complete."}</p><button onClick={() => authenticatedMission ? onMission(home.currentMission) : onStart()} type="button">{authenticatedMission ? "Resume mission" : "Start Mission 01"}</button></div>
              <strong><span>{String(home.currentMission).padStart(2, "0")}/10</span><small>Missions</small></strong>
            </section>
            {next ? <section className={styles.mobileNextCard}><span>Up next</span><div><b>{String(next.missionNumber).padStart(2, "0")}</b><strong>{next.title}</strong></div></section> : null}
            <section className={styles.journeyCard} aria-labelledby="programme-path-title"><span id="programme-path-title">Your 10-mission journey</span><ol>{home.missions.map((mission) => <li aria-current={mission.status === "current" ? "step" : undefined} data-state={mission.status} key={mission.missionNumber}><b>{String(mission.missionNumber).padStart(2, "0")}</b><strong>{mission.title}</strong><small>{mission.status === "completed" ? "Complete" : mission.status === "current" ? "In progress" : "Locked"}</small></li>)}</ol></section>
          </div>
          <div className={styles.dashboardRight}>
            <section className={styles.compactStats} aria-label="Programme progress"><div><strong>{home.totalXp}</strong><span>XP</span></div><div><strong>{home.currentStreak}</strong><span>day streak</span></div><div><strong>{home.activeDays}</strong><span>active days</span></div></section>
            {home.startingPoint ? <section className={styles.compactStartingPoint}><span>Your starting point</span><p>{home.startingPoint.startingPoint}</p><small>{home.startingPoint.desiredChange}</small></section> : null}
            <section className={styles.compactAchievements}><span>Achievements</span><div>{home.achievements.length ? home.achievements.map((achievement) => <b data-state={achievement.state} key={achievement.slug}>{achievement.title}</b>) : <b data-state="locked">First achievement waits ahead</b>}</div></section>
            <section className={styles.compactReviews}><span>Personal reviews</span>{home.reviews.map((review) => <button disabled={review.status !== "available"} key={review.milestone} onClick={() => onReview(review.milestone)} type="button"><strong>{review.title}</strong><small>{review.status === "available" ? "Open review" : `After Mission ${review.unlockMission}`}</small></button>)}</section>
            <section className={styles.compactResearch}><span>Research</span>{home.discoveryLinks.length ? <nav>{home.discoveryLinks.map((item) => <a href={item.href} key={item.href} onClick={() => { const destinationRoute = discoveryDestination(item.href); if (destinationRoute) productAnalyticsClient.discoveryClicked({ sourceSurface: "programme_home", destinationRoute }); }}>{item.label}</a>)}</nav> : <p>Casino research tools appear here later — once your plan is built, not before.</p>}</section>
          </div>
        </div>
        <footer className={styles.dashboardFooter}><span>Your data is private. We never use it for offers or rankings.</span><span>{completedCount}/10 missions complete · 18+</span></footer>
      </main>
    </div>
  );
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
