import { ProgrammeStartActionLink } from "@/components/analytics/ProgrammeStartActionLink";
import { ActionLink } from "@/components/design-system/Action";
import { programmeMissionTitles } from "@/lib/programme/program-ai/mission-registry";
import type { TenStepsLandingState } from "@/lib/ten-steps-landing";
import styles from "./TenStepsLanding.module.css";

const missionDescriptions = [
  "Say what’s happening; get your Starting Point.",
  "First pass at time and money lines.",
  "Map the moments that start sessions.",
  "One limit you can keep this week.",
  "An honest week-two look at the numbers.",
  "A simple rule for yes, no and not-tonight.",
  "Write the plan you’ll actually follow.",
  "Reduce friction, judge operators, protect your plan.",
  "See what held. Fix what didn’t.",
  "Turn ten missions into a habit that lasts.",
];

const missions = programmeMissionTitles.map((title, index) => ({ number:String(index + 1).padStart(2,"0"), title, description:missionDescriptions[index] }));

export function TenStepsLanding({ state }: { state: TenStepsLandingState }) {
  const returning = state.kind === "returning" || state.kind === "available-programme-complete";
  const fallback = state.kind === "signed-in-fallback";
  return <div className={`tenStepsPage ${styles.page}`} data-account-state={state.kind === "anonymous" ? "anonymous" : "signed-in"}>
    <section className={styles.hero} aria-labelledby="ten-steps-title" data-ten-steps-section="hero">
      <p className={styles.srOnly}>The B4GAMBLE Programme does not diagnose or treat gambling addiction. Completion does not mean gambling is safe or suitable.</p>
      {returning || fallback ? <ReturningHero state={state} /> : <AnonymousHero />}
    </section>

    <section className={styles.builds} aria-labelledby="programme-builds-title" data-ten-steps-section="programme-builds">
      <div className={styles.sectionIntro}><span>WHAT YOU WILL BUILD</span><h2 id="programme-builds-title">Three things you&apos;ll have at the end.</h2></div>
      <div className={styles.buildGrid}>
        <article><span>I</span><div><h3>A clear picture</h3><p>Your triggers, patterns and the moments decisions actually happen.</p></div></article>
        <article><span>II</span><div><h3>Working boundaries</h3><p>Limits you design, test in real weeks, and adjust until they hold.</p></div></article>
        <article><span>III</span><div><h3>A reviewable plan</h3><p>One document that says how you play — yours to revisit any time.</p></div></article>
      </div>
    </section>

    <section className={styles.missionMap} aria-labelledby="mission-map-title" data-ten-steps-section="mission-map">
      <div className={styles.pathIntro}><span>THE PROGRAMME, STEP BY STEP</span><h2 id="mission-map-title">The path</h2></div>
      <ol className={styles.missionList}>{missions.map((mission,index) => <li className={index === 0 ? styles.currentMission : styles.futureMission} key={mission.number}><span>{mission.number}</span><div><h3>{mission.title}</h3><p>{mission.description}</p></div></li>)}</ol>
    </section>

    <section className={styles.accountBoundary} aria-labelledby="account-boundary-title" data-ten-steps-section="account-boundary">
      <div className={styles.accountCopy}><span>START PRIVATE</span><h2 id="account-boundary-title"><strong>What you say here,</strong><em>stays here.</em></h2></div>
      <div className={styles.accountPromises}><p>✓ &nbsp; Your situation and plan are never used for offers, rankings or ads.</p><p>✓ &nbsp; Export and deletion requests are handled under the Privacy policy.</p><p>✓ &nbsp; No mission asks you to deposit, claim or play.</p></div>
    </section>

    <section className={styles.finalAction} aria-labelledby="final-action-title" data-ten-steps-section="final-action"><span>{returning ? "YOUR PROGRAMME" : fallback ? "YOUR ACCOUNT" : "ONE USEFUL MISSION"}</span><h2 id="final-action-title">{returning ? "Return to the plan you already started." : fallback ? "Programme status is unavailable here." : <>Mission 01 takes about <em>one minute.</em></>}</h2><p>{returning ? "Your saved progress stays inside My Programme." : fallback ? "Open the Programme to start or retry." : "No registration until your starting point is ready."}</p>{returning || fallback ? <ActionLink className={styles.primaryButton} href="/program" size="large">Open My Programme</ActionLink> : <ProgrammeStartActionLink className={styles.primaryButton} href="/program?entry=start" size="large" sourceSurface="ten_steps">Start Mission 01</ProgrammeStartActionLink>}</section>
  </div>;
}

function AnonymousHero() {
  return <div className={styles.heroInner}><div className={styles.heroCopy}><span>THE PROGRAMME, STEP BY STEP</span><h1 id="ten-steps-title"><strong>TEN STEPS.</strong><em>One plan.</em></h1><p>Each mission takes 5–15 minutes and ends with something you keep. Here&apos;s exactly what happens — no surprises, no fine print.</p><ProgrammeStartActionLink className={styles.primaryButton} href="/program?entry=start" size="large" sourceSurface="ten_steps">Start Mission 01</ProgrammeStartActionLink><small>01–03 UNDERSTAND &nbsp; · &nbsp; 04–07 BUILD &nbsp; · &nbsp; 08–10 APPLY</small></div><div className={styles.heroVisual}><img alt="" fetchPriority="high" height="1200" src="/home/hero-plan.jpg" width="1800" /></div></div>;
}

function ReturningHero({ state }: { state: Exclude<TenStepsLandingState,{kind:"anonymous"}> }) {
  if (state.kind === "signed-in-fallback") {
    return <div className={styles.returningInner}><div className={styles.returningCopy}><span>YOUR ACCOUNT</span><h1 id="ten-steps-title">Programme status is unavailable here.</h1><p>Open the Programme to start or retry.</p><ActionLink className={styles.primaryButton} href="/program" size="large">Open My Programme</ActionLink></div><div className={styles.returningImage}><img alt="" fetchPriority="high" height="1200" src="/home/hero-creator.jpg" width="1800" /></div></div>;
  }
  const progress = state.kind === "returning" ? `Mission ${String(state.currentMission).padStart(2,"0")} · ${state.completedMissions} of 10 complete · ${state.totalXp} XP` : state.kind === "available-programme-complete" ? `${state.completedMissions} of 10 complete · ${state.totalXp} XP` : "Open the Programme to start or retry.";
  return <div className={styles.returningInner}><div className={styles.returningCopy}><span>WELCOME BACK</span><h1 id="ten-steps-title">Continue the plan you already started.</h1><p>Your saved progress, XP and next Mission stay inside My Programme.</p><ActionLink className={styles.primaryButton} href="/program" size="large">Open My Programme</ActionLink><div className={styles.serverState}><strong>MY PROGRAMME</strong><p>{progress}</p><small>Live values from your server-owned Programme record.</small></div></div><div className={styles.returningImage}><img alt="" fetchPriority="high" height="1200" src="/home/hero-creator.jpg" width="1800" /></div></div>;
}
