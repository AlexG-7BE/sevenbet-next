import Link from "next/link";

import styles from "./ProtectedHelp.module.css";
import { protectedHelpResources } from "./support-resources";

const nextActions = [
  { number: "01", title: "Pause right now", description: "Close gambling sites and use cooling-off, operator limits or blocking tools where available." },
  { number: "02", title: "Self-exclude", description: "Check the scope and commitment before registering with an operator or national scheme." },
  { number: "03", title: "Control access", description: "Ask your bank about gambling blocks and review device-blocking or account tools." },
  { number: "04", title: "Talk to support", description: "Open an independent organisation or speak to someone you trust." },
] as const;

export function ProtectedHelpHub() {
  return <article className={styles.hub} data-protected-help-page="help">
    <section className={styles.hero} aria-labelledby="protected-help-title" data-help-section="hero">
      <p className={styles.heroBadge}>Protected Help · No account needed</p>
      <h1 id="protected-help-title">We&apos;re here.<br />No strings.</h1>
      <p className={styles.heroCopy}>Pause, block access, or open independent support. Casino, bonus and affiliate prompts do not appear in this area.</p>
      <div className={styles.heroActions}><a className={styles.primaryAction} href="#next-actions">Pause and block access</a><a className={styles.secondaryAction} href="#external-support">Find external support</a></div>
    </section>

    <section className={styles.nextSteps} id="next-actions" aria-labelledby="next-actions-title" data-help-section="next-actions">
      <p className={styles.eyebrow}>Start with what you need</p><h2 id="next-actions-title">One clear next step.</h2>
      <ol className={styles.actionGrid}>{nextActions.map((action) => <li className={styles.actionCard} id={action.number === "01" ? "cooling-off" : action.number === "02" ? "self-exclusion" : action.number === "03" ? "deposit-limits" : "reality-checks"} key={action.number}><span>{action.number}</span><h3>{action.title}</h3><p>{action.description}</p></li>)}</ol>
    </section>

    <section className={styles.support} id="external-support" aria-labelledby="support-title" data-help-section="external-support">
      <p className={styles.eyebrow}>Verified UK examples</p><h2 id="support-title">Independent support.</h2>
      <p className={styles.sectionIntro}>These destinations were checked against the providers’ official sites on 7 August 2026. Check the provider’s current coverage before relying on a service.</p>
      {protectedHelpResources.length > 0 ? <div className={styles.resourceGrid}>{protectedHelpResources.map((resource) => <article className={styles.resource} key={resource.name}><div className={styles.resourceCopy}><p className={styles.resourceStatus}>Verified source</p><h3>{resource.name}</h3><p>{resource.description}</p><small>{resource.region} · verified 7 August 2026</small></div><a className={styles.resourceAction} href={resource.href} rel="noopener noreferrer" target="_blank">{resource.action} <span aria-hidden="true">↗</span><span className={styles.srOnly}> (opens an external site in a new tab)</span></a></article>)}</div> : <p className={styles.unavailableResource} role="status">No verified external support destination is available to show here. Check current details with an official provider for your location.</p>}
      <aside className={styles.urgentBoundary} aria-labelledby="urgent-boundary-title"><div><p className={styles.eyebrow}>Urgent help</p><h3 id="urgent-boundary-title">B4GAMBLE is not an emergency service.</h3><p>If you or someone else is in immediate danger, contact local emergency services. No regional number is shown because B4GAMBLE has not verified your location.</p></div><a className={styles.secondaryAction} href="https://www.nhs.uk/live-well/addiction-support/gambling-addiction/" rel="noopener noreferrer" target="_blank">View NHS gambling help <span aria-hidden="true">↗</span><span className={styles.srOnly}> (opens an external site in a new tab)</span></a></aside>
    </section>

    <section className={styles.programme} aria-labelledby="programme-title" data-help-section="privacy-boundary"><div><p className={styles.eyebrow}>Optional control plan</p><h2 id="programme-title">Prefer a structured ten-step plan?</h2><p>Open the Programme without casino, bonus or affiliate prompts.</p><p className={styles.privacyCopy}>No account is needed for this Help page. B4GAMBLE does not save your choices here or use Help activity for affiliate targeting, offer ranking or commercial personalisation.</p></div><Link className={styles.programmeAction} href="/program">Open 10-Step Programme</Link></section>
  </article>;
}
