"use client";

import Link from "next/link";

import { ActionButton } from "@/components/design-system/Action";
import { ProgramAiAuthenticatedHeader } from "@/components/programme/ProgramAiAuthenticatedHeader";
import type { ProgramAiHome } from "@/components/programme/ProgramAiAuthenticated.types";
import styles from "./ProgramAiAuthenticated.module.css";

export function ProgramAiHomeScreen({ home, userId, onMission, onReview, onStart }: {
  home: ProgramAiHome;
  userId: string;
  onMission: (missionNumber: number) => void;
  onReview: (milestone: "first" | "mid" | "full") => void;
  onStart: () => void;
}) {
  const current = home.missions.find((mission) => mission.missionNumber === home.currentMission);
  const authenticatedMission = home.currentMission >= 2;
  return (
    <div className={styles.shell}>
      <ProgramAiAuthenticatedHeader totalXp={home.totalXp} userId={userId} />
      <main className={styles.home}>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>MY PROGRAMME · RESUME</span>
            <h1>{authenticatedMission ? `${String(home.currentMission).padStart(2, "0")} · ${current?.title}` : "Your private Programme is ready."}</h1>
            <p>{home.startingPoint?.continuationCue || "Continue from the first action that is not yet complete."}</p>
            {current && authenticatedMission ? <div className={styles.continueMeta}><span>{current.actionsCompleted}/3 actions</span><span>{current.xpEarnedHere} XP earned here</span><span>+25 XP completion bonus</span></div> : null}
          </div>
          <ActionButton onClick={() => authenticatedMission ? onMission(home.currentMission) : onStart()} size="large">
            {authenticatedMission ? `${home.currentAction ? "Resume" : "Review"} Mission ${String(home.currentMission).padStart(2, "0")}` : "Start Mission 01"}
          </ActionButton>
        </section>

        {home.startingPoint ? <article className={styles.startingPoint}>
          <span className={styles.eyebrow}>YOUR CONFIRMED STARTING POINT</span>
          <blockquote>{home.startingPoint.startingPoint}</blockquote>
          <p>{home.startingPoint.desiredChange}</p>
        </article> : null}

        <section aria-labelledby="programme-path-title">
          <div className={styles.sectionHead}><span className={styles.eyebrow}>THE 10-STEP PATH</span><h2 id="programme-path-title">One useful result at a time.</h2><p>Completion, current position and locks come from your server record.</p></div>
          <ol className={styles.path}>
            {home.missions.map((mission) => <li aria-current={mission.status === "current" ? "step" : undefined} className={styles.pathItem} data-state={mission.status} key={mission.missionNumber}>
              <span className={styles.pathNumber}>{String(mission.missionNumber).padStart(2, "0")}</span>
              <strong className={styles.pathTitle}>{mission.title}</strong>
              <span className={styles.pathState}>{mission.status === "completed" ? `Complete · ${mission.xpEarnedHere} XP here` : mission.status === "current" ? `${mission.actionsCompleted}/3 actions` : "Locked"}</span>
            </li>)}
          </ol>
        </section>

        {home.nextReview ? <section className={styles.distance} aria-label="Next Personal Review">
          <div><span className={styles.eyebrow}>NEXT PERSONAL REVIEW</span><h3>{home.nextReview.title}</h3></div>
          <strong>{home.nextReview.xpRemaining} XP</strong>
          <small>{home.nextReview.missionsRemaining} Mission{home.nextReview.missionsRemaining === 1 ? "" : "s"} remaining</small>
        </section> : null}

        <section aria-labelledby="personal-reviews-title">
          <div className={styles.sectionHead}><span className={styles.eyebrow}>PERSONAL REVIEWS</span><h2 id="personal-reviews-title">Pause and see what you built.</h2><p>Each Review becomes available at a meaningful point in the Programme.</p></div>
          <div className={styles.reviews}>{home.reviews.map((review) => <article className={styles.reviewCard} data-state={review.status} key={review.milestone}>
            <span className={styles.eyebrow}>AFTER MISSION {review.unlockMission}</span><h3>{review.title}</h3>
            <p>{review.status === "available" ? "Available now. See the choices and tools you have built so far." : `Complete Mission ${review.unlockMission} to unlock.`}</p>
            <button className={styles.reviewButton} disabled={review.status !== "available"} onClick={() => onReview(review.milestone)} type="button">{review.status === "available" ? "Open review" : "Locked"}</button>
          </article>)}</div>
        </section>

        <section className={styles.explore} aria-labelledby="explore-title">
          <div className={styles.sectionHead}><span className={styles.eyebrow}>EXPLORE B4GAMBLE</span><h2 id="explore-title">Ready to research?</h2><p>Compare casinos and offers using B4GAMBLE’s public guides.</p></div>
          <nav aria-label="Explore B4GAMBLE" className={styles.exploreLinks}>{home.discoveryLinks.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}</nav>
        </section>
      </main>
    </div>
  );
}
