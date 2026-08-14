import styles from "./AboutPage.module.css";

const operatingSteps = ["Learn", "Control", "Choose", "Verify when needed"] as const;

const boundaries = [
  ["No financial advice", "Decisions remain the reader's."],
  ["No medical or psychological treatment", "Protected Help stays separate."],
  ["No guaranteed outcomes", "Scores never predict results."],
  ["No casino operation", "No deposits or withdrawals."],
  ["No licensing authority", "Public registers remain external."],
  ["No dispute resolution", "Evidence and routes can be explained."],
] as const;

const principles = [
  "Transparency",
  "Consistency",
  "Clear comparisons",
  "Regular updates",
  "Responsible communication",
  "Visible affiliate disclosure",
  "Educational focus",
] as const;

const outputs = [
  ["Editorial reviews", "Dated evidence + limitations"],
  ["Structured comparisons", "Fields before action"],
  ["Programme tools", "Private control artefacts"],
  ["Evidence + context", "Sources and corrections"],
  ["Protected Help", "No casino, bonus or affiliate prompts"],
] as const;

export function AboutDocument() {
  return (
    <article
      className={styles.page}
      data-about-document
      data-figma-family="835:5298"
      data-figma-desktop="923:2694"
      data-figma-compact-hero="923:2694"
      data-figma-mobile="835:5436"
    >
      <header className={styles.hero} data-about-section="hero">
        <div className={styles.heroInner}>
          <p className={styles.heroEyebrow}>
            <span className={styles.desktopOnly}>About · Typographic / diagrammatic</span>
            <span className={styles.mobileOnly}>Operating model</span>
          </p>
          <h1 className={styles.heroTitle}>
            {operatingSteps.map((step, index) => (
              <span className={styles.heroWord} key={step}>
                {step}
                <span className={styles.desktopOnly}>.</span>
                {index < operatingSteps.length - 1 && <span className={styles.mobileArrow} aria-hidden="true">↓</span>}
              </span>
            ))}
          </h1>

          <ol className={styles.heroStairs} aria-label="B4GAMBLE operating sequence">
            {operatingSteps.map((step, index) => (
              <li key={step} className={index === 2 ? styles.activeStep : undefined}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step}</strong>
              </li>
            ))}
          </ol>

          <p className={styles.heroNote}>Recommendation first.<br />Evidence on demand.</p>
          <span className={styles.mobileMarker} aria-hidden="true" />
        </div>
      </header>

      <section className={styles.sequenceOverview} data-about-section="operating-model" aria-labelledby="operating-model-title">
        <div className={styles.contentShell}>
          <p className={styles.eyebrow}>Expressive section · Operating model</p>
          <h2 id="operating-model-title">Control comes before choice.<br />Evidence stays within reach.</h2>
          <ol className={styles.sequenceLine} aria-label="Education-first operating sequence">
            {operatingSteps.map((step, index) => (
              <li key={step} className={index === operatingSteps.length - 1 ? styles.finalDot : undefined}>
                <span aria-hidden="true" />
                <strong>{step}</strong>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className={styles.freshInterruption} aria-hidden="true" />

      <section className={styles.boundaries} data-about-section="clear-boundaries" aria-labelledby="boundaries-title">
        <div className={styles.boundariesInner}>
          <div className={styles.boundariesIntro}>
            <p className={styles.eyebrow}>Clear boundaries<span className={styles.desktopOnly}> / Product limits</span></p>
            <h2 id="boundaries-title">
              <span className={styles.desktopOnly}>What we build</span>
              <span className={styles.mobileOnly}>The product</span><br />ends here.
            </h2>
            <p className={styles.boundariesLead}>
              B4GAMBLE explains and organizes information. It does not become the authority, operator,
              adviser or treatment provider.
            </p>
          </div>
          <div className={styles.boundaryStrip} aria-hidden="true" />
          <ol className={styles.boundaryList}>
            {boundaries.map(([title, body], index) => (
              <li key={title} className={index === 2 ? styles.highlightBoundary : undefined}>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.principles} data-about-section="editorial-principles" aria-labelledby="principles-title">
        <div className={styles.principlesInner}>
          <div className={styles.principlesIntro}>
            <p className={styles.eyebrow}>Editorial principles<span className={styles.desktopOnly}> / Decision margins</span></p>
            <h2 id="principles-title">
              <span className={styles.desktopOnly}>The principles<br />control the work.</span>
              <span className={styles.mobileOnly}>Principles are<br />not badges.</span>
            </h2>
          </div>
          <ul className={styles.principleList}>
            {principles.map((principle, index) => (
              <li key={principle} className={index === 5 ? styles.accentPrinciple : undefined}>{principle}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.flow} data-about-section="six-step-flow" aria-labelledby="flow-title">
        <div className={styles.flowInner}>
          <p className={styles.flowEyebrow}>
            <span className={styles.desktopOnly}>How B4GAMBLE works / Non-manipulative path</span>
            <span className={styles.mobileOnly}>Six step flow</span>
          </p>
          <h2 id="flow-title">
            <span className={styles.desktopOnly}>Learn → Control → Choose → Verify when needed</span>
            <span className={styles.mobileOnly}>A path,<br />not a funnel.</span>
          </h2>

          <div className={styles.flowPanel}>
            <ol className={styles.flowSteps}>
              {operatingSteps.map((step, index) => (
                <li key={step} className={index === 2 ? styles.activeStep : undefined}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{step}</strong>
                </li>
              ))}
            </ol>
            <div className={styles.separationPanels}>
              <article>
                <p>Optional reflection branch</p>
                <h3>Programme or self-check</h3>
                <p>Optional. No Programme reward for casino, bonus, affiliate or commercial action. Reflection data does not personalize offers.</p>
              </article>
              <article>
                <p>Commercial information</p>
                <h3>Recommendations come before research tools.</h3>
                <p>Three public editorial picks reduce choice. Full reviews and comparison remain evidence on demand; readers may stop, return to learning or use protected Help.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.outputs} data-about-section="what-sevenbet-builds" aria-labelledby="outputs-title">
        <div className={styles.outputsInner}>
          <div className={styles.outputsIntro}>
            <p className={styles.eyebrow}>What B4GAMBLE builds</p>
            <h2 id="outputs-title" className={styles.desktopOnly}>Five outputs.<br />One boundary<br />system.</h2>
          </div>
          <ul className={styles.outputList}>
            {outputs.map(([title, body], index) => (
              <li key={title} className={index === 1 ? styles.activeOutput : index === 4 ? styles.protectedOutput : undefined}>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </article>
  );
}
