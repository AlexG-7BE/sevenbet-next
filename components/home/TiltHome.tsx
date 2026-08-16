import Image from "next/image";

import { ProgrammeStartActionLink } from "@/components/analytics/ProgrammeStartActionLink";
import styles from "./TiltHome.module.css";

const recognitionSigns = [
  "You spend or risk more than you planned.",
  "You return to win back what you lost.",
  "Gambling brings guilt, stress, money or relationship problems.",
];

const heroPhotos = [
  {
    className: styles.heroPhotoOne,
    src: "/home/hero-creator.jpg",
    priority: true,
  },
  {
    className: styles.heroPhotoTwo,
    src: "/home/hero-confidence.jpg",
    priority: false,
  },
  {
    className: styles.heroPhotoThree,
    src: "/home/hero-plan.jpg",
    priority: false,
  },
  {
    className: styles.heroPhotoFour,
    src: "/home/hero-outcome.jpg",
    priority: false,
  },
] as const;

export function TiltHome() {
  return (
    <div
      className={`tiltHomePage ${styles.home}`}
      data-home-contract="figma-289-946"
      data-home-canonical-node="289:946"
      data-home-responsive-authority="661:7551 661:7554 661:7607 657:2545 657:2548 661:2635 661:2686 661:2711"
    >
      <section className={styles.hero} data-home-section="hero" data-nav-theme="dark" aria-labelledby="home-title">
        {heroPhotos.map((photo) => (
          <figure
            className={`${styles.heroPhoto} ${photo.className}`}
            key={photo.src}
          >
            <Image
              alt=""
              fill
              priority={photo.priority}
              sizes="(max-width: 760px) 108px, (max-width: 1280px) 18vw, 228px"
              src={photo.src}
            />
          </figure>
        ))}
        <div className={styles.heroCopy}>
          <span className={styles.heroKicker}>A PRIVATE 10-STEP PROGRAMME</span>
          <h1 id="home-title"><strong>CONTROL</strong><em>starts here.</em></h1>
          <p>Keep gambling your decision, not a habit: ten short missions help you see your patterns and set limits that actually hold. Free and private.</p>
          <ProgrammeStartActionLink className={styles.primaryButton} href="/program?entry=start" size="large" sourceSurface="home">Start Programme</ProgrammeStartActionLink>
          <span className={styles.heroProof}>10 missions · 5–15 minutes each · Free — no paywall inside, ever · Your words never price anything</span>
        </div>
        <a className={styles.scrollCue} href="#programme" aria-label="Scroll to the programme"><span /></a>
      </section>

      <section className={styles.recognition} data-home-section="self-recognition" data-nav-theme="light" aria-labelledby="recognition-title">
        <div className={styles.recognitionHeading}>
          <span>01 / 03</span>
          <h2 id="recognition-title"><strong>Is gambling becoming</strong><em>harder to control?</em></h2>
          <p>No need to answer us — just notice what feels familiar.</p>
        </div>
        <div className={styles.signGrid}>
          {recognitionSigns.map((sign, index) => (
            <article key={sign}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{sign}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.theatre} id="programme" data-home-section="programme-theatre" data-nav-theme="light" aria-labelledby="programme-title">
        <div className={styles.sectionIntro}>
          <span>SEE THE PRODUCT</span>
          <h2 id="programme-title">A plan you can actually see.</h2>
          <div className={styles.programmeFacts}>
            <div><strong>10</strong><span>missions</span></div>
            <div><strong>~2</strong><span>weeks, your pace</span></div>
            <div><strong>Free</strong><span>now and always</span></div>
          </div>
        </div>
      </section>

      <HumanChapter
        section="recognise"
        chapter="01–03 · UNDERSTAND"
        heavy="SEE"
        serif="the pattern."
        body="Notice the trigger, the moment and the cost before the next decision."
        image="/home/hero-confidence.jpg"
      />
      <HumanChapter
        section="build"
        align="right"
        chapter="04–07 · BUILD"
        heavy="WRITE"
        serif="the rule."
        body="Choose a pause, an alternative action and a limit while the moment is calm."
        image="/home/hero-plan.jpg"
      />
      <HumanChapter
        section="apply"
        chapter="08–10 · APPLY"
        heavy="USE IT."
        serif="Make it yours."
        body="Try the plan in real life, review what happened and strengthen the next action."
        image="/home/chapter-apply.jpg"
      />

      <section className={styles.evidenceSection} data-home-section="evidence" data-nav-theme="light" aria-labelledby="evidence-title">
        <div className={styles.evidenceHeading}>
          <span>WHY THIS EXISTS</span>
          <h2 id="evidence-title"><strong>Built from evidence.</strong><em>Honest about its limits.</em></h2>
          <p>B4GAMBLE uses public NHS and NICE guidance to shape recognition language and Programme risk boundaries. The complete Programme has not yet been clinically evaluated.</p>
        </div>
        <div className={styles.evidenceGrid}>
          <article><span>NHS</span><strong>Recognition and support guidance</strong><p>Used to shape the self-recognition language.</p></article>
          <article><span>NICE NG248</span><strong>Assessment and treatment guidance</strong><p>A source for bounded Programme language and risk controls.</p></article>
          <article className={styles.limitCard}><span>CLEAR LIMIT</span><strong>No clinical claim</strong><p>The complete Programme has not yet been clinically evaluated.</p></article>
        </div>
      </section>

      <section className={styles.trustBoundary} data-home-section="trust-boundary" data-nav-theme="cream" aria-labelledby="trust-boundary-title">
        <div><span>WHY TRUST B4GAMBLE</span><h2 id="trust-boundary-title"><strong>Two businesses.</strong><em>One wall between them.</em></h2></div>
        <div className={styles.trustColumns}>
          <article><span>THE PROGRAMME</span><h3>Private by design.</h3><p>Free — no paywall, no upsell inside missions, ever.<br />Your words never feed offers, rankings or ads.<br />Delete everything, any time, in one action.</p></article>
          <article><span>THE REVIEWS</span><h3>Independent by design.</h3><p>Tested with real money — our own.<br />Funded by commission, never shaped by it.<br />Every commercial link disclosed.</p></article>
        </div>
      </section>

      <section className={styles.finalCta} data-home-section="final-programme-cta" data-nav-theme="dark" aria-labelledby="final-cta-title">
        <span>READY WHEN YOU ARE</span>
        <h2 id="final-cta-title"><strong>START WITH ONE</strong><em>honest minute.</em></h2>
        <p>One question at a time. Your starting point builds itself as you answer.</p>
        <ProgrammeStartActionLink className={styles.primaryButton} href="/program?entry=start" size="large" sourceSurface="home">Start Programme</ProgrammeStartActionLink>
        <small>Free · private by default · no marketing consent</small>
      </section>
    </div>
  );
}

function HumanChapter({ align = "left", section, chapter, heavy, serif, body, image }: {
  align?: "left" | "right";
  section: "recognise" | "build" | "apply";
  chapter: string;
  heavy: string;
  serif: string;
  body: string;
  image: string;
}) {
  return (
    <section className={`${styles.humanChapter} ${align === "right" ? styles.humanChapterRight : ""}`} data-home-section={section} data-nav-theme="photo" aria-label={`${heavy} ${serif}`}>
      <Image
        alt=""
        fill
        loading="eager"
        sizes="100vw"
        src={image}
      />
      <div className={styles.chapterShade} />
      <div className={styles.chapterCopy}>
        <span>{chapter}</span>
        <h2><strong>{heavy}</strong><em>{serif}</em></h2>
        <p>{body}</p>
        <i aria-hidden="true" />
      </div>
    </section>
  );
}
