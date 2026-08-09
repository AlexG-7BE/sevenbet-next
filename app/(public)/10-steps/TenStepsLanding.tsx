import { ActionLink } from "@/components/design-system/Action";
import { missionRegistry } from "@/lib/programme/domain/mission-registry";
import type { TenStepsLandingState } from "@/lib/ten-steps-landing";
import styles from "./TenStepsLanding.module.css";

const heroImage = "https://images.pexels.com/photos/5710657/pexels-photo-5710657.jpeg?auto=compress&cs=tinysrgb&w=1800";
const contractImage = "https://images.pexels.com/photos/37057075/pexels-photo-37057075.jpeg?auto=compress&cs=tinysrgb&w=1800";
const accountImage = "https://images.pexels.com/photos/34947154/pexels-photo-34947154.jpeg?auto=compress&cs=tinysrgb&w=1800";
const returningImage = "https://images.pexels.com/photos/4450147/pexels-photo-4450147.jpeg?auto=compress&cs=tinysrgb&w=1800";

const programmeMissions = missionRegistry.map((mission) => ({
  number: String(mission.missionNumber).padStart(2, "0"),
  title: mission.title,
  status:
    mission.missionNumber === 1
      ? "START HERE · AVAILABLE NOW"
      : mission.completion
        ? "UPCOMING · AFTER ACCOUNT"
        : "PLANNED · NOT YET AVAILABLE",
  current: mission.missionNumber === 1,
}));

export function TenStepsLanding({ state }: { state: TenStepsLandingState }) {
  const confirmedProgramme = state.kind === "returning" || state.kind === "available-programme-complete";
  const signedIn = state.kind !== "anonymous";
  const actionLabel = confirmedProgramme ? "Open My Programme" : state.kind === "signed-in-fallback" ? "Open the Programme" : "Start Mission 01";
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
          <p>Start privately. Save your work after Mission 01. Return through My Programme when you are ready.</p>
        </div>
        <div className={styles.buildGrid}>
          <article>
            <span>MISSION 01</span>
            <h3>Map the moment.</h3>
            <p>Notice the context and cue, then write one personal notice rule.</p>
            <div className={styles.miniResult}><small>PRIVATE RESULT</small><b>Moment Map</b><i /></div>
          </article>
          <article>
            <span>YOUR WORK</span>
            <h3>See what works.</h3>
            <p>Turn reflection into a practical plan you can edit and revisit.</p>
            <div className={styles.miniResult}><small>SAVED AFTER ACCOUNT</small><b>My Programme</b><i /></div>
          </article>
          <article>
            <span>10 MISSIONS</span>
            <h3>A path you can finish.</h3>
            <p>See every approved title while unavailable Missions stay clearly locked.</p>
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
          <p>Mission 01 is available now. Later Missions remain visible without pretending they are complete or available.</p>
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
          <h2 id="account-boundary-title"><strong>Start private.</strong><em>Save only when you choose.</em></h2>
          <p>Mission 01 does not require an account. After completion, create one only if you want to save the result and claim +60 XP.</p>
          <ol>
            <li>Open Mission 01</li>
            <li>Complete it privately</li>
            <li>Create an account to save +60 XP</li>
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
          <article className={styles.limitCard}><span>IMPORTANT LIMIT</span><h3>No clinical claim</h3><p>The complete Programme has not yet been clinically evaluated.</p></article>
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
        <ActionLink className={styles.primaryButton} href="/program" size="large">{actionLabel}</ActionLink>
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
        <ActionLink className={styles.primaryButton} href="/program" size="large">Start Mission 01</ActionLink>
        <small>MISSION 01 IS PRIVATE. CREATE AN ACCOUNT ONLY AFTER COMPLETION TO SAVE +60 XP.</small>
      </div>
      <div className={styles.heroVisual}>
        <img alt="" fetchPriority="high" height="1200" src={heroImage} width="1800" />
        <div className={styles.rewardCard} aria-label="Mission 01 pending recognition">
          <span>SAVE PROGRESS TO EARN</span><strong>+60 XP</strong><small>Awarded when Mission 01 completion is saved to your account. Personal wording stays in your browser session.</small>
        </div>
      </div>
    </div>
  );
}

type ConfirmedProgrammeState = Extract<TenStepsLandingState, { kind: "returning" | "available-programme-complete" }>;

function ReturningHero({ state }: { state: ConfirmedProgrammeState }) {
  const progress = state.kind === "returning"
    ? `Mission ${String(state.currentMission).padStart(2, "0")} · ${state.completedMissions} of 10 complete · ${state.totalXp} XP`
    : `${state.completedMissions} of 10 complete · ${state.totalXp} XP · later Missions unavailable`;

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
