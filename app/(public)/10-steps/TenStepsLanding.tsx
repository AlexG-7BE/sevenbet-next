import { ActionLink } from "@/components/design-system/Action";
import { programmeMissionTitles } from "@/lib/programme/program-ai/mission-registry";
import type { TenStepsLandingState } from "@/lib/ten-steps-landing";
import styles from "./TenStepsLanding.module.css";

const heroImage = "https://images.pexels.com/photos/5710657/pexels-photo-5710657.jpeg?auto=compress&cs=tinysrgb&w=1800";
const contractImage = "https://images.pexels.com/photos/37057075/pexels-photo-37057075.jpeg?auto=compress&cs=tinysrgb&w=1800";
const accountImage = "https://images.pexels.com/photos/34947154/pexels-photo-34947154.jpeg?auto=compress&cs=tinysrgb&w=1800";
const returningImage = "https://images.pexels.com/photos/4450147/pexels-photo-4450147.jpeg?auto=compress&cs=tinysrgb&w=1800";

const programmeMissions = programmeMissionTitles.map((title, index) => ({
  number: String(index + 1).padStart(2, "0"),
  title,
  status: index === 0 ? "START HERE · NO ACCOUNT REQUIRED" : "MVP PATH · AFTER ACCOUNT",
  current: index === 0,
}));

export function TenStepsLanding({ state }: { state: TenStepsLandingState }) {
  const confirmedProgramme = state.kind === "returning" || state.kind === "available-programme-complete";
  const signedIn = state.kind !== "anonymous";
  const actionLabel = confirmedProgramme ? "Open My Programme" : state.kind === "signed-in-fallback" ? "Open the Programme" : "Start Mission 01";
  const actionHref = confirmedProgramme || state.kind === "signed-in-fallback" ? "/program" : "/program?entry=start";
  const finalAction = confirmedProgramme
    ? {
        eyebrow: "YOUR PROGRAMME",
        title: "Return to the plan you already started.",
        copy: "Your saved progress stays inside My Programme.",
      }
    : state.kind === "signed-in-fallback"
      ? {
          eyebrow: "YOUR ACCOUNT",
          title: "Programme status is unavailable here.",
          copy: "Open the Programme to start or retry.",
        }
      : {
          eyebrow: "ONE USEFUL MISSION",
          title: "Start with the moment in front of you.",
          copy: "No account until Mission 01 is complete.",
        };

  return (
    <div
      className={`tenStepsPage ${styles.page}`}
      data-account-state={signedIn ? "signed-in" : "anonymous"}
      data-figma-contract="502:2238 502:2240 502:2241 502:2412 502:2414 502:2415 502:2416"
    >
      <section className={styles.hero} data-ten-steps-section="hero" aria-labelledby="ten-steps-title">
        {state.kind === "anonymous" ? (
          <AnonymousHero />
        ) : state.kind === "signed-in-fallback" ? (
          <SignedInFallbackHero />
        ) : (
          <ReturningHero state={state} />
        )}
      </section>

      <section className={styles.builds} data-ten-steps-section="programme-builds" aria-labelledby="programme-builds-title">
        <div className={styles.sectionIntro}>
          <span>WHAT YOU BUILD</span>
          <h2 id="programme-builds-title">A programme that leaves you with something useful.</h2>
          <p>Start privately. Save completion and rewards after Mission 01 while personal wording stays in this browser session.</p>
        </div>
        <div className={styles.buildGrid}>
          <article>
            <span>MISSION 01</span>
            <h3>Map the moment.</h3>
            <p>Turn one current situation into a personalised Starting Point you control.</p>
            <div className={styles.miniResult}><small>PRIVATE RESULT</small><b>Starting Point</b><i /></div>
          </article>
          <article>
            <span>YOUR WORK</span>
            <h3>See what works.</h3>
            <p>Turn reflection into a local plan you can edit in this tab while your account keeps neutral progress.</p>
            <div className={styles.miniResult}><small>LOCAL WORDING · SAVED PROGRESS</small><b>My Programme</b><i /></div>
          </article>
          <article>
            <span>10 MISSIONS</span>
            <h3>A path you can finish.</h3>
            <p>See the complete approved MVP path from Starting Point to a reviewable plan.</p>
            <div className={styles.miniResult}><small>VISIBLE PATH</small><b>01 → 10</b><i /></div>
          </article>
        </div>
      </section>

      <section className={styles.contract} data-ten-steps-section="editorial-contract" aria-labelledby="editorial-contract-title">
        <div className={styles.contractImage}><img alt="" height="1200" loading="lazy" src={contractImage} width="1800" /></div>
        <div className={styles.contractCopy}>
          <span>THE CONTRACT</span>
          <h2 id="editorial-contract-title"><strong>Not a checklist.</strong><em>A plan you can return to.</em></h2>
          <p>Each available Mission produces a concrete result: a map, a boundary, or a decision you can review.</p>
          <ul>
            <li>Practical result</li>
            <li>Your own pace</li>
            <li>No commercial reward link</li>
          </ul>
        </div>
      </section>

      <section className={styles.missionMap} data-ten-steps-section="mission-map" aria-labelledby="mission-map-title">
        <div className={styles.pathIntro}>
          <span>THE FULL PATH</span>
          <h2 id="mission-map-title">Ten missions. One decision you can review.</h2>
          <p>Mission 01 starts without an account. Missions 02–10 continue the MVP after you choose to save the Starting Point.</p>
        </div>
        <ol className={styles.missionList}>
          {programmeMissions.map((mission) => (
            <li className={mission.current ? styles.currentMission : styles.futureMission} key={mission.number}>
              <span aria-hidden="true">{mission.number}</span>
              <div><h3>{mission.title}</h3><p>{mission.status}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.accountBoundary} data-ten-steps-section="account-boundary" aria-labelledby="account-boundary-title">
        <div className={styles.accountCopy}>
          <span>ACCOUNT BOUNDARY</span>
          <h2 id="account-boundary-title"><strong>Start private.</strong><em>Save progress if you choose.</em></h2>
          <p>Mission 01 does not require an account. Its two actions earn 40 XP before registration. Create an account only if you want to save the already-earned Starting Point, completion and XP. Personal wording stays in this browser session.</p>
          <ol>
            <li>Open Mission 01</li>
            <li>Complete it privately</li>
            <li>Earn 20 + 20 XP for the two Mission actions</li>
            <li>Create an account to save the already-earned 40 XP</li>
          </ol>
        </div>
        <div className={styles.accountImage}><img alt="" height="1200" loading="eager" src={accountImage} width="1800" /></div>
      </section>

      <section className={styles.evidence} data-ten-steps-section="evidence" aria-labelledby="evidence-title">
        <div className={styles.evidenceIntro}>
          <span>WHAT IS TRUE NOW</span>
          <h2 id="evidence-title">Clear claims. Clear limits.</h2>
        </div>
        <div className={styles.evidenceGrid}>
          <article><span>APPROVED PATH</span><strong>10</strong><h3>Mission titles</h3><p>Mission availability comes from the current Programme contract, not this landing page.</p></article>
          <article className={styles.limitCard}><span>IMPORTANT LIMIT</span><h3>No clinical claim</h3><p>The Programme does not diagnose or treat gambling addiction or another medical condition. Completion does not mean gambling is safe or suitable. The complete Programme has not yet been clinically evaluated.</p></article>
        </div>
        <aside className={styles.dataBoundary} aria-label="Programme data boundary">
          <strong>PROTECTED</strong>
          <p>Programme, pause and Help data are not used for affiliate targeting or commercial personalisation.</p>
        </aside>
      </section>

      <section className={styles.finalAction} data-ten-steps-section="final-action" aria-labelledby="final-action-title">
        <span>{finalAction.eyebrow}</span>
        <h2 id="final-action-title">{finalAction.title}</h2>
        <p>{finalAction.copy}</p>
        <ActionLink className={styles.primaryButton} href={actionHref} size="large">{actionLabel}</ActionLink>
      </section>
    </div>
  );
}

function AnonymousHero() {
  return (
    <div className={styles.heroInner}>
      <div className={styles.heroCopy}>
        <span>PUBLIC PROGRAMME · START WITHOUT AN ACCOUNT</span>
        <h1 id="ten-steps-title"><strong>10 STEPS</strong><em>before you choose.</em></h1>
        <p>Compare casinos, understand offers, build your own rules.</p>
        <ActionLink className={styles.primaryButton} href="/program?entry=start" size="large">Start Mission 01</ActionLink>
        <small>MISSION 01 IS PRIVATE. ITS TWO ACTIONS EARN 40 XP. REGISTRATION EARNS 0 XP.</small>
      </div>
      <div className={styles.heroVisual}>
        <img alt="" fetchPriority="high" height="1200" src={heroImage} width="1800" />
        <div className={styles.rewardCard} aria-label="Mission 01 pending recognition">
          <span>EARNED IN MISSION 01</span><strong>+40 XP</strong><small>20 XP for describing the situation and 20 XP for confirming the Starting Point. Registration adds 0 XP.</small>
        </div>
      </div>
    </div>
  );
}

type ConfirmedProgrammeState = Extract<TenStepsLandingState, { kind: "returning" | "available-programme-complete" }>;

function ReturningHero({ state }: { state: ConfirmedProgrammeState }) {
  const progress = state.kind === "returning"
    ? `Mission ${String(state.currentMission).padStart(2, "0")} · ${state.completedMissions} of 10 complete · ${state.totalXp} XP`
    : `${state.completedMissions} of 10 complete · ${state.totalXp} XP`;

  return (
    <div className={styles.returningInner}>
      <div className={styles.returningCopy}>
        <span>WELCOME BACK</span>
        <h1 id="ten-steps-title">Continue the plan you already started.</h1>
        <p>Your saved progress, XP and next Mission stay inside My Programme.</p>
        <ActionLink className={styles.primaryButton} href="/program" size="large">Open My Programme</ActionLink>
        <div className={styles.serverState}>
          <strong>MY PROGRAMME</strong>
          <p>{progress}</p>
          <small>Live values from your server-owned Programme record.</small>
        </div>
      </div>
      <div className={styles.returningImage}><img alt="" fetchPriority="high" height="1200" src={returningImage} width="1800" /></div>
    </div>
  );
}

function SignedInFallbackHero() {
  return (
    <div className={styles.returningInner}>
      <div className={styles.returningCopy}>
        <span>YOUR ACCOUNT</span>
        <h1 id="ten-steps-title">Programme status is unavailable here.</h1>
        <p>Open the Programme to start or retry.</p>
        <ActionLink className={styles.primaryButton} href="/program" size="large">Open the Programme</ActionLink>
      </div>
      <div className={styles.returningImage}><img alt="" fetchPriority="high" height="1200" src={returningImage} width="1800" /></div>
    </div>
  );
}
