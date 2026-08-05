import Link from "next/link";

import type { TenStepsLandingState } from "@/lib/ten-steps-landing";
import styles from "./TenStepsLanding.module.css";

const programmeMissions = [
  { number: "01", title: "Name the moment", detail: "Notice what happened just before the urge or decision.", status: "START HERE", available: true },
  { number: "02", title: "Set the goal", detail: "Choose what a useful next step would look like for you.", status: "UPCOMING", available: true },
  { number: "03", title: "Understand the urge", detail: "Recognise a decision signal before it writes the next step.", status: "UPCOMING", available: true },
  { number: "04", title: "Build one boundary", detail: "Turn one rule into a clear, reusable part of your plan.", status: "UPCOMING", available: true },
  { number: "05", title: "Check before deciding", detail: "A future mission about checking claims, terms and uncertainty.", status: "PLANNED · NOT YET AVAILABLE", available: false },
  { number: "06", title: "Add friction", detail: "A future mission about making an impulsive choice less automatic.", status: "PLANNED · NOT YET AVAILABLE", available: false },
  { number: "07", title: "Prepare support", detail: "A future mission about keeping a support option ready.", status: "PLANNED · NOT YET AVAILABLE", available: false },
  { number: "08", title: "Research responsibly", detail: "A future mission about comparing options through your own criteria.", status: "PLANNED · NOT YET AVAILABLE", available: false },
  { number: "09", title: "Rehearse the decision", detail: "A future mission about preparing a simple when / then rule.", status: "PLANNED · NOT YET AVAILABLE", available: false },
  { number: "10", title: "Review the plan", detail: "A future mission about making your plan easier to use again.", status: "PLANNED · NOT YET AVAILABLE", available: false },
] as const;

const pauseImage = "https://images.pexels.com/photos/5710657/pexels-photo-5710657.jpeg?auto=compress&cs=tinysrgb&w=1800";
const editorialImage = "https://images.pexels.com/photos/37057075/pexels-photo-37057075.jpeg?auto=compress&cs=tinysrgb&w=1800";
const accountImage = "https://images.pexels.com/photos/34947154/pexels-photo-34947154.jpeg?auto=compress&cs=tinysrgb&w=1800";
const returningImage = "https://images.pexels.com/photos/4450147/pexels-photo-4450147.jpeg?auto=compress&cs=tinysrgb&w=1800";

export function TenStepsLanding({ state }: { state: TenStepsLandingState }) {
  const returning = state.kind === "returning";
  const availableProgrammeComplete = state.kind === "available-programme-complete";
  const hasProgrammeRecord = returning || availableProgrammeComplete;
  const accountState = state.kind === "anonymous" ? "anonymous" : "signed-in";

  return (
    <div className={`tenStepsPage ${styles.page}`} data-account-state={accountState} data-figma-contract="502:2238 502:2412">
      <section className={`${styles.hero} ${hasProgrammeRecord ? styles.heroReturning : ""}`} data-ten-steps-section="hero" aria-labelledby="ten-steps-title">
        {returning
          ? <ReturningHero state={state} />
          : availableProgrammeComplete
            ? <AvailableProgrammeCompleteHero state={state} />
            : <AnonymousHero signedIn={state.kind === "signed-in-fallback"} />}
      </section>

      <section className={styles.builds} data-ten-steps-section="programme-builds" aria-labelledby="programme-builds-title">
        <div className={styles.sectionHeading}>
          <span>WHAT THE PROGRAMME BUILDS</span>
          <h2 id="programme-builds-title"><strong>A clearer next step.</strong><em>Written by you.</em></h2>
          <p>Each available Mission turns a difficult moment into something practical you can return to.</p>
        </div>
        <div className={styles.buildGrid}>
          <article><span>01</span><strong>Notice the pattern.</strong><p>Capture the moment without judging it.</p></article>
          <article><span>02</span><strong>Choose the goal.</strong><p>Decide what would be useful right now.</p></article>
          <article><span>03</span><strong>Keep the rule.</strong><p>Save a boundary or next action to your plan.</p></article>
        </div>
      </section>

      <section className={styles.editorial} data-ten-steps-section="editorial-contract" aria-labelledby="editorial-contract-title">
        <img alt="" height="1200" loading="lazy" src={editorialImage} width="1800" />
        <div className={styles.editorialShade} />
        <div className={styles.editorialCopy}>
          <span>ONE MISSION AT A TIME</span>
          <h2 id="editorial-contract-title"><strong>See the moment.</strong><em>Then write the next move.</em></h2>
          <p>The Programme does not promise control or a clinical outcome. It gives you a practical structure for reflection, boundaries and support.</p>
        </div>
      </section>

      <section className={styles.missionMap} id="the-path" data-ten-steps-section="mission-map" aria-labelledby="mission-map-title">
        <div className={styles.missionHeading}>
          <span>THE 10-MISSION MAP</span>
          <h2 id="mission-map-title"><strong>Start with what is live.</strong><em>See what comes next.</em></h2>
          <p>Missions 01–04 are the current Programme path. Missions 05–10 show the planned direction and are not yet available.</p>
        </div>
        <ol className={styles.missionList}>
          {programmeMissions.map((mission) => (
            <li className={mission.available ? styles.availableMission : styles.plannedMission} key={mission.number}>
              <div><span>{mission.number}</span><small>{mission.status}</small></div>
              <strong>{mission.title}</strong>
              <p>{mission.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.accountBoundary} data-ten-steps-section="account-boundary" aria-labelledby="account-boundary-title">
        <div className={styles.accountImage}><img alt="" fetchPriority="low" height="1200" loading="eager" src={accountImage} width="1800" /></div>
        <div className={styles.accountCopy}>
          <span>THE ACCOUNT BOUNDARY</span>
          <h2 id="account-boundary-title"><strong>Begin privately.</strong><em>Save when you choose.</em></h2>
          <p>Mission 01 can begin before account creation. An account is required only when you choose to save the result and continue with your Programme record.</p>
          <div className={styles.pendingReward} aria-label="Pending Mission 01 reward preview">
            <span>SAVE TO EARN</span><strong>+60 XP</strong><small>Awarded when Mission 01 is saved to your account.</small>
          </div>
        </div>
      </section>

      <section className={styles.evidence} data-ten-steps-section="evidence" aria-labelledby="evidence-title">
        <div className={styles.evidenceHeading}>
          <span>EVIDENCE &amp; DATA TRUTH</span>
          <h2 id="evidence-title"><strong>Useful structure.</strong><em>Clear limits.</em></h2>
          <p>SevenBet draws on recognised support and behaviour-change guidance. The complete Programme has not yet been clinically evaluated.</p>
        </div>
        <div className={styles.evidenceGrid}>
          <article><span>NHS</span><strong>Recognition and support guidance</strong><p>Used to shape safe self-recognition language.</p></article>
          <article><span>NICE NG248</span><strong>Assessment and treatment guidance</strong><p>A source for Programme boundaries, not a clinical endorsement.</p></article>
          <article><span>DATA SEPARATION</span><strong>Your safety data stays separate</strong><p>Programme, pause and Help data are not used for affiliate targeting or commercial personalisation.</p></article>
          <article className={styles.limitCard}><span>CLEAR LIMIT</span><strong>No clinical claim</strong><p>This is a practical digital programme, not treatment or emergency support.</p></article>
        </div>
      </section>

      <section className={styles.finalAction} data-ten-steps-section="final-action" aria-labelledby="final-action-title">
        <span>{availableProgrammeComplete ? "CURRENT AVAILABLE PATH COMPLETE" : returning ? "YOUR PROGRAMME IS READY" : "READY WHEN YOU ARE"}</span>
        <h2 id="final-action-title"><strong>{hasProgrammeRecord ? "RETURN TO YOUR PLAN." : "START WITH ONE"}</strong><em>{availableProgrammeComplete ? "Keep what you built." : returning ? "Keep the next step clear." : "useful mission."}</em></h2>
        <p>{availableProgrammeComplete ? "Your saved Programme remains available while later Missions stay planned and unavailable." : returning ? "Your saved progress and next Mission come from your Programme record." : "No promise of a perfect outcome. Just a practical first step you can finish."}</p>
        <Link className={styles.primaryButton} href="/program">{hasProgrammeRecord ? "Open My Programme" : "Start Mission 01"}</Link>
        <small>{availableProgrammeComplete ? "Missions 05–10 · planned, not yet available" : returning ? "Server-owned progress · account required" : "Private until you choose to save"}</small>
      </section>
    </div>
  );
}

function AnonymousHero({ signedIn }: { signedIn: boolean }) {
  return (
    <div className={styles.heroInner}>
      <div className={styles.heroCopy}>
        <span>THE 10-STEP PROGRAMME</span>
        <h1 id="ten-steps-title"><strong>ONE USEFUL</strong><em>step at a time.</em></h1>
        <p>Turn difficult moments into a plan you wrote yourself. Start Mission 01 privately, then choose whether to save it.</p>
        <Link className={styles.primaryButton} href="/program">{signedIn ? "Open the Programme" : "Start Mission 01"}</Link>
        <small>{signedIn ? "Your account is ready. Programme progress appears only after a saved Mission." : "No account needed to begin"}</small>
      </div>
      <figure className={styles.heroPhoto}>
        <img alt="" fetchPriority="high" height="1200" src={pauseImage} width="1800" />
        <figcaption>Pause. Notice. Choose the next move.</figcaption>
      </figure>
      <a className={styles.pathLink} href="#the-path">See the 10-Mission map <span aria-hidden="true">↓</span></a>
    </div>
  );
}

function ReturningHero({ state }: { state: Extract<TenStepsLandingState, { kind: "returning" }> }) {
  return (
    <div className={styles.returningInner}>
      <div className={styles.returningCopy}>
        <span>WELCOME BACK</span>
        <h1 id="ten-steps-title"><strong>YOUR NEXT STEP</strong><em>is already here.</em></h1>
        <p>Your Programme record is the source of truth for progress, XP and the Mission waiting for you.</p>
        <Link className={styles.secondaryButton} href="/program">Continue Mission {String(state.currentMission).padStart(2, "0")}</Link>
      </div>
      <div className={styles.returningPanel}>
        <img alt="" height="1200" src={returningImage} width="1800" />
        <div className={styles.returningCard}>
          <span>MY PROGRAMME</span>
          <strong>Mission {String(state.currentMission).padStart(2, "0")}</strong>
          <p>{state.completedMissions} of 10 complete · {state.totalXp} XP</p>
          <small>Live values from your saved Programme record</small>
        </div>
      </div>
    </div>
  );
}

function AvailableProgrammeCompleteHero({ state }: { state: Extract<TenStepsLandingState, { kind: "available-programme-complete" }> }) {
  return (
    <div className={styles.returningInner}>
      <div className={styles.returningCopy}>
        <span>CURRENT AVAILABLE PATH COMPLETE</span>
        <h1 id="ten-steps-title"><strong>YOU COMPLETED</strong><em>what is available.</em></h1>
        <p>Your saved Missions 01–04 remain in My Programme. Missions 05–10 are planned and are not yet available.</p>
        <Link className={styles.secondaryButton} href="/program">Open My Programme</Link>
      </div>
      <div className={styles.returningPanel}>
        <img alt="" height="1200" src={returningImage} width="1800" />
        <div className={styles.returningCard}>
          <span>MY PROGRAMME</span>
          <strong>Available path complete</strong>
          <p>{state.completedMissions} of 10 complete · {state.totalXp} XP</p>
          <small>No later Mission is available yet</small>
        </div>
      </div>
    </div>
  );
}
