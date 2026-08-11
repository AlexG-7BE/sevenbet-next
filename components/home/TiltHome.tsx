import Image from "next/image";

import { ProgrammeStartActionLink } from "@/components/analytics/ProgrammeStartActionLink";
import { HomeProgrammeCarousel } from "./HomeProgrammeCarousel";
import styles from "./TiltHome.module.css";

const recognitionSigns = [
  "You spend or risk more than you planned.",
  "You return to win back what you lost.",
  "Gambling brings guilt, stress, money or relationship problems.",
];

const tools = [
  {
    key: "map",
    number: "01",
    title: "Spot the pattern.",
    body: "Capture what happened before the urge.",
  },
  {
    key: "pause",
    number: "02",
    title: "Decide before it gets hard.",
    body: "Set a delay and a different action.",
  },
  {
    key: "review",
    number: "03",
    title: "Learn from what happened.",
    body: "Review the choice without rewriting it.",
  },
] as const;

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
      <section className={styles.hero} data-home-section="hero" aria-labelledby="home-title">
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
          <h1 id="home-title"><strong>CONTROL</strong><em>starts here.</em></h1>
          <p>Ten practical missions turn difficult moments into a plan you wrote yourself.</p>
          <ProgrammeStartActionLink className={styles.primaryButton} href="/program?entry=start" size="large" sourceSurface="home">Start the 10-Step Program</ProgrammeStartActionLink>
          <span className={styles.heroProof}>10 missions · practical rules · progress you can see</span>
        </div>
        <a className={styles.scrollCue} href="#programme" aria-label="Scroll to the programme"><span /></a>
      </section>

      <section className={styles.theatre} id="programme" data-home-section="programme-theatre" aria-labelledby="programme-title">
        <div className={styles.sectionIntro}>
          <span>THE PROGRAMME</span>
          <h2 id="programme-title">It turns into something useful.</h2>
          <p>A rule. A plan. A next action.</p>
        </div>
        <HomeProgrammeCarousel />
      </section>

      <section className={styles.recognition} data-home-section="self-recognition" aria-labelledby="recognition-title">
        <div className={styles.recognitionHeading}>
          <h2 id="recognition-title"><strong>Is gambling becoming</strong><em>harder to control?</em></h2>
          <p>You do not need to answer us. Notice whether any of these feel familiar.</p>
        </div>
        <div className={styles.signGrid}>
          {recognitionSigns.map((sign, index) => (
            <article key={sign}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{sign}</strong>
            </article>
          ))}
        </div>
        <p className={styles.recognitionFoot}>One or more of these signs can be a reason to pause and start the 10-Step Program.</p>
      </section>

      <HumanChapter
        section="recognise"
        chapter="MISSION 01–03"
        heavy="SEE"
        serif="the pattern."
        body="Notice the trigger, the moment and the cost before the next decision."
        image="/home/hero-confidence.jpg"
      />
      <HumanChapter
        section="build"
        align="right"
        chapter="MISSION 04–07"
        heavy="WRITE"
        serif="the rule."
        body="Choose a pause, an alternative action and a limit while the moment is calm."
        image="/home/hero-plan.jpg"
      />
      <HumanChapter
        section="apply"
        chapter="MISSION 08–10"
        heavy="USE IT."
        serif="Make it yours."
        body="Try the plan in real life, review what happened and strengthen the next action."
        image="/home/chapter-apply.jpg"
      />

      <section className={styles.toolsSection} data-home-section="programme-tools" aria-labelledby="tools-title">
        <div className={styles.toolsHeading}>
          <span>WHAT YOU KEEP</span>
          <h2 id="tools-title"><strong>Not advice to remember.</strong><em>Tools you can use.</em></h2>
          <p>Available missions create a concrete map, rule or review. Private narrative stays in this browser session; neutral progress can save to your Programme.</p>
        </div>
        <div className={styles.toolGrid}>
          {tools.map((tool) => (
            <article className={styles.toolCard} key={tool.key}>
              <span className={styles.toolNumber}>{tool.number}</span>
              <ToolVisual type={tool.key} />
              <strong>{tool.title}</strong>
              <p>{tool.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.evidenceSection} data-home-section="evidence" aria-labelledby="evidence-title">
        <div className={styles.evidenceHeading}>
          <span>WHY THIS EXISTS</span>
          <h2 id="evidence-title"><strong>Built from evidence.</strong><em>Honest about its limits.</em></h2>
          <p>B4GAMBLE uses public NHS and NICE guidance to shape recognition language and Programme risk boundaries. The complete Programme has not yet been clinically evaluated.</p>
        </div>
        <div className={styles.evidenceGrid}>
          <article><span>NHS</span><strong>Recognition and support guidance</strong><p>Used to shape the self-recognition language.</p></article>
          <article><span>NICE NG248</span><strong>Assessment and treatment guidance</strong><p>A source for bounded Programme language and risk controls.</p></article>
          <article className={styles.missionMetric}><span>10</span><strong>Practical missions</strong><p>Missions 01–04 are implemented; later missions remain planned.</p></article>
          <article className={styles.limitCard}><span>CLEAR LIMIT</span><strong>No clinical claim</strong><p>The complete Programme has not yet been clinically evaluated.</p></article>
        </div>
      </section>

      <section className={styles.finalCta} data-home-section="final-programme-cta" aria-labelledby="final-cta-title">
        <span>READY WHEN YOU ARE</span>
        <h2 id="final-cta-title"><strong>START WITH ONE</strong><em>useful mission.</em></h2>
        <p>No promise of a perfect outcome. Just a practical first step you can finish.</p>
        <ProgrammeStartActionLink className={styles.primaryButton} href="/program?entry=start" size="large" sourceSurface="home">Start the 10-Step Program</ProgrammeStartActionLink>
        <small>Next: Mission 01 · private narrative stays in this browser session</small>
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
    <section className={`${styles.humanChapter} ${align === "right" ? styles.humanChapterRight : ""}`} data-home-section={section} aria-label={`${heavy} ${serif}`}>
      <Image
        alt=""
        fill
        loading="lazy"
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

function ToolVisual({ type }: { type: "map" | "pause" | "review" }) {
  if (type === "map" || type === "pause") {
    return (
      <span aria-hidden="true" className={styles.toolVisual}>
        <Image
          alt=""
          fill
          loading="lazy"
          sizes="(max-width: 760px) calc(100vw - 88px), 344px"
          src={type === "map" ? "/home/tool-trigger-map.svg" : "/home/tool-pause-rule.svg"}
        />
      </span>
    );
  }
  if (type === "review") return <span aria-hidden="true" className={`${styles.toolVisual} ${styles.reviewVisual}`}><i /><i /><i /><i /></span>;
  return null;
}
