import Link from "next/link";

import { EmphasisTail } from "@/components/commercial/CommercialPrimitives";
import { tenStepsTranslation } from "@/lib/i18n/static-pages/ten-steps";
import type { SupportedLocale } from "@/lib/market/registry";

import styles from "./TenStepsPage.module.css";
import { TenStepsStickyStart } from "./TenStepsStickyStart";

const BUILD_NUMERALS = ["I", "II", "III"] as const;

function stageLabel(value: string) {
  const split = value.indexOf(" ");
  return split < 0 ? { range: "", label: value } : { range: value.slice(0, split), label: value.slice(split + 1) };
}

export function TenStepsPage({ aboutHref, locale, programmePath }: {
  aboutHref: string;
  locale: SupportedLocale;
  programmePath: string;
}) {
  const text = tenStepsTranslation(locale).text;
  const startHref = `${programmePath}?entry=start`;
  const stages = [text[7], text[8], text[9]].map(stageLabel);
  const builds = BUILD_NUMERALS.map((numeral, index) => ({ numeral, title: text[13 + index * 2], body: text[14 + index * 2] }));
  const missions = Array.from({ length: 10 }, (_, index) => ({
    number: String(index + 1).padStart(2, "0"),
    title: text[20 + index * 2],
    body: text[21 + index * 2],
    stage: stages[index < 3 ? 0 : index < 7 ? 1 : 2].label,
  }));

  return <div className={styles.page} data-runtime-renderer="ten-steps">
    <section aria-labelledby="ten-steps-title" className={styles.hero} data-nav-theme="dark" data-ten-steps-section="hero">
      <div className={styles.art}><div className={styles.artMotion}><img alt={text[49]} decoding="async" loading="eager" src="/home/hero-plan.jpg" /></div></div>
      <div aria-hidden="true" className={styles.gradient} />
      <div className={styles.heroBody}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow} data-ten-steps-eyebrow>{text[0]}</p>
          <h1 id="ten-steps-title"><span>{text[1]}</span><span><em>{text[2]}</em> {text[3]}</span></h1>
          <p className={styles.lead}>{text[4]}</p>
          <div className={styles.ctas}>
            <Link className={styles.primaryAction} data-ten-steps-hero-action href={startHref} prefetch={false}>{text[5]}</Link>
            <Link className={styles.textLink} href={aboutHref} prefetch={false}>{text[6]}</Link>
          </div>
        </div>
      </div>
      <div className={styles.heroMeta}>
        <div>{stages.map((stage) => <span key={stage.label}>{stage.range ? <em>{stage.range}</em> : null}{stage.label}</span>)}</div>
        <span aria-hidden="true">{text[10]}</span>
      </div>
    </section>

    <section aria-labelledby="ten-steps-builds-title" className={styles.builds} data-nav-theme="dark" data-ten-steps-section="programme-builds">
      <div aria-hidden="true" className={styles.buildsGlow} />
      <div className={`${styles.shell} ${styles.reveal}`}>
        <header className={styles.sectionHeader}>
          <p className={styles.eyebrow}>{text[11]}</p>
          <h2 id="ten-steps-builds-title"><EmphasisTail text={text[12]} words={3} /></h2>
        </header>
        <div className={styles.buildGrid}>
          {builds.map((build) => <article className={styles.card} key={build.numeral}>
            <span aria-hidden="true">{build.numeral}</span>
            <strong>{build.title}</strong>
            <p>{build.body}</p>
          </article>)}
        </div>
      </div>
    </section>

    <section aria-labelledby="ten-steps-path-title" className={styles.path} data-nav-theme="dark" data-ten-steps-section="mission-map">
      <div className={styles.shell}>
        <header className={`${styles.pathHeader} ${styles.reveal}`}>
          <p>{text[0]}</p>
          <h2 id="ten-steps-path-title"><EmphasisTail text={text[19]} /></h2>
        </header>
        <div aria-labelledby="ten-steps-path-title" className={styles.missionGrid} data-ten-steps-mission-list role="list">
          {missions.map((mission, index) => <article className={index === 0 ? `${styles.mission} ${styles.firstMission}` : styles.mission} data-ten-steps-mission key={mission.number} role="listitem">
            <div className={styles.missionTop}><span>{mission.number}</span><small>{mission.stage}</small></div>
            <strong>{mission.title}</strong>
            <p>{mission.body}</p>
            {index === 0 ? <Link className={styles.missionLink} href={startHref} prefetch={false}>{text[5]} <span aria-hidden="true">→</span></Link> : null}
          </article>)}
        </div>
      </div>
    </section>

    <section aria-labelledby="ten-steps-account-title" className={styles.account} data-nav-theme="cream" data-ten-steps-section="account-boundary">
      <div className={`${styles.shell} ${styles.reveal}`}>
        <div>
          <p className={styles.lightEyebrow}>{text[40]}</p>
          <h2 id="ten-steps-account-title">{text[41]} <em>{text[42]}</em></h2>
        </div>
        <ul>
          {[text[43], text[44], text[45]].map((promise) => <li key={promise}><span aria-hidden="true">✓</span><p>{promise}</p></li>)}
        </ul>
      </div>
    </section>

    <section aria-labelledby="ten-steps-final-title" className={styles.final} data-nav-theme="dark" data-ten-steps-section="final-action">
      <div aria-hidden="true" className={styles.finalGlow} />
      <div className={`${styles.finalInner} ${styles.reveal}`}>
        <h2 id="ten-steps-final-title">{text[46]}<br /><em>{text[47]}</em></h2>
        <p>{text[48]}</p>
        <Link className={`${styles.primaryAction} ${styles.finalAction}`} href={startHref} prefetch={false}>{text[5]}</Link>
      </div>
    </section>

    <div className={styles.stickyStart} data-mobile-visible="false" data-ten-steps-sticky-start>
      <Link className={styles.primaryAction} href={startHref} prefetch={false}>{text[5]}</Link>
    </div>
    <TenStepsStickyStart />
  </div>;
}
