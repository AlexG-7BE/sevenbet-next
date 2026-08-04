"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import styles from "./TiltHome.module.css";

const programmeSlides = [
  {
    key: "mission",
    eyebrow: "START HERE",
    title: "Make the urge wait.",
    body: "Choose a pause you can use before the next bet.",
    metric: "4 min · one saved rule",
    status: "Saved to your plan",
    progress: 34,
  },
  {
    key: "dashboard",
    eyebrow: "YOUR PLAN",
    title: "See what works.",
    body: "Track completed missions, saved rules and the next useful action.",
    metric: "3 rules active",
    status: "Next: build a pause rule",
    progress: 64,
  },
  {
    key: "path",
    eyebrow: "10 MISSIONS",
    title: "A path you can finish.",
    body: "Each mission creates something you can reuse in a difficult moment.",
    metric: "1 of 10 complete",
    status: "Mission 02 unlocks next",
    progress: 18,
  },
] as const;

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
    short: "Capture what happened before the urge.",
    detail: "Save the situation, feeling and trigger so you can recognise the same pattern earlier next time.",
  },
  {
    key: "pause",
    number: "02",
    title: "Decide before it gets hard.",
    short: "Set a delay and a different action.",
    detail: "Write a pause duration and one alternative action while the moment is calm, then keep the rule in your plan.",
  },
  {
    key: "review",
    number: "03",
    title: "Learn from what happened.",
    short: "Review the choice without rewriting it.",
    detail: "Record what you tried, what helped and what needs changing. Your dashboard keeps the next version visible.",
  },
] as const;

const heroPhotos = [
  {
    className: styles.heroPhotoOne,
    src: "https://images.pexels.com/photos/4450147/pexels-photo-4450147.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "Creative professional working in an art studio",
    rotation: "-7deg",
  },
  {
    className: styles.heroPhotoTwo,
    src: "https://images.pexels.com/photos/34947154/pexels-photo-34947154.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "Confident adult looking at the camera",
    rotation: "6deg",
  },
  {
    className: styles.heroPhotoThree,
    src: "https://images.pexels.com/photos/5710657/pexels-photo-5710657.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "Adult writing a personal plan at a desk",
    rotation: "8deg",
  },
  {
    className: styles.heroPhotoFour,
    src: "https://images.pexels.com/photos/37057075/pexels-photo-37057075.jpeg?auto=compress&cs=tinysrgb&w=900",
    alt: "Confident smiling adult",
    rotation: "-6deg",
  },
] as const;

function ArrowIcon({ direction = "right" }: { direction?: "left" | "right" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d={direction === "right" ? "M5 12h14m-5-5 5 5-5 5" : "M19 12H5m5-5-5 5 5 5"} />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className={styles.menuIcon} aria-hidden="true">
      <i className={open ? styles.menuLineOpenOne : undefined} />
      <i className={open ? styles.menuLineOpenTwo : undefined} />
    </span>
  );
}

export function TiltHome() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTool, setActiveTool] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("[data-seven-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.setAttribute("data-seven-visible", "true");
        });
      },
      { threshold: 0.14 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateHeader = () => setHeaderScrolled(window.scrollY > 24);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  function moveCarousel(direction: number) {
    setActiveSlide((current) => (current + direction + programmeSlides.length) % programmeSlides.length);
  }

  function positionFor(index: number) {
    const relative = (index - activeSlide + programmeSlides.length) % programmeSlides.length;
    if (relative === 0) return "active";
    if (relative === 1) return "next";
    return "previous";
  }

  function handleHeroPointerMove(event: React.PointerEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 12;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 12;
    event.currentTarget.style.setProperty("--hero-shift-x", `${x}px`);
    event.currentTarget.style.setProperty("--hero-shift-y", `${y}px`);
  }

  function resetHeroPointer() {
    heroRef.current?.style.setProperty("--hero-shift-x", "0px");
    heroRef.current?.style.setProperty("--hero-shift-y", "0px");
  }

  return (
    <div className={`tiltHomePage ${styles.home}`}>
      <header className={`${styles.header} ${headerScrolled ? styles.headerScrolled : ""}`}>
        <Link className={styles.wordmark} href="/" aria-label="SevenBet home">
          SEVENBET
        </Link>
        <button
          className={styles.menuButton}
          type="button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <MenuIcon open={menuOpen} />
        </button>
        <nav className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ""}`} aria-label="Primary navigation">
          <Link href="/casinos" onClick={() => setMenuOpen(false)}>Casinos</Link>
          <Link href="/bonuses" onClick={() => setMenuOpen(false)}>Bonuses</Link>
          <Link href="/best-offers" onClick={() => setMenuOpen(false)}>Best offers</Link>
          <Link href="/casinos" onClick={() => setMenuOpen(false)}>Reviews</Link>
          <Link href="/catalog" onClick={() => setMenuOpen(false)}>Compare</Link>
        </nav>
        <Link className={`${styles.primaryButton} ${styles.headerCta}`} href="/program">
          Start the 10-Step Program
        </Link>
      </header>

      <section
        className={styles.hero}
        ref={heroRef}
        onPointerMove={handleHeroPointerMove}
        onPointerLeave={resetHeroPointer}
      >
        {heroPhotos.map((photo) => (
          <figure
            className={`${styles.heroPhoto} ${photo.className}`}
            key={photo.src}
            style={{ "--photo-rotation": photo.rotation } as CSSProperties}
          >
            <img src={photo.src} alt={photo.alt} />
          </figure>
        ))}
        <div className={styles.heroCopy} data-seven-reveal>
          <h1><strong>CONTROL</strong><em>starts here.</em></h1>
          <p>Ten practical missions turn difficult moments into a plan you wrote yourself.</p>
          <Link className={styles.primaryButton} href="/program">Start the 10-Step Program</Link>
          <span className={styles.heroProof}>10 missions · practical rules · progress you can see</span>
        </div>
        <a className={styles.scrollCue} href="#programme" aria-label="Scroll to the programme">
          <span />
        </a>
      </section>

      <section className={styles.theatre} id="programme">
        <div className={styles.sectionIntro} data-seven-reveal>
          <span>THE PROGRAMME</span>
          <h2>It turns into something useful.</h2>
          <p>A rule. A plan. A next action.</p>
        </div>
        <div className={styles.carouselStage} aria-roledescription="carousel" aria-label="Programme preview">
          {programmeSlides.map((slide, index) => {
            const position = positionFor(index);
            return (
              <button
                className={`${styles.programmeCard} ${styles[`programmeCard${position[0].toUpperCase()}${position.slice(1)}`]}`}
                key={slide.key}
                type="button"
                aria-label={`Show ${slide.title}`}
                aria-current={position === "active" ? "true" : undefined}
                onClick={() => setActiveSlide(index)}
              >
                <span className={styles.cardEyebrow}>{slide.eyebrow}</span>
                <strong>{slide.title}</strong>
                <p>{slide.body}</p>
                <span className={styles.miniScreen}>
                  <b>{slide.metric}</b>
                  <i><span style={{ width: `${slide.progress}%` }} /></i>
                  <small>{slide.status}</small>
                </span>
              </button>
            );
          })}
          <div className={styles.carouselControls}>
            <button type="button" onClick={() => moveCarousel(-1)} aria-label="Previous programme preview"><ArrowIcon direction="left" /></button>
            <span aria-live="polite">{String(activeSlide + 1).padStart(2, "0")} / {String(programmeSlides.length).padStart(2, "0")}</span>
            <button type="button" onClick={() => moveCarousel(1)} aria-label="Next programme preview"><ArrowIcon /></button>
          </div>
        </div>
      </section>

      <section className={styles.recognition}>
        <div className={styles.recognitionHeading} data-seven-reveal>
          <h2><strong>Is gambling becoming</strong><em>harder to control?</em></h2>
          <p>You do not need to answer us. Notice whether any of these feel familiar.</p>
        </div>
        <div className={styles.signGrid}>
          {recognitionSigns.map((sign, index) => (
            <article key={sign} data-seven-reveal>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{sign}</strong>
            </article>
          ))}
        </div>
        <p className={styles.recognitionFoot}>One or more of these signs can be a reason to pause and start the 10-Step Program.</p>
      </section>

      <HumanChapter
        chapter="MISSION 01–03"
        heavy="SEE"
        serif="the pattern."
        body="Notice the trigger, the moment and the cost before the next decision."
        image="https://images.pexels.com/photos/34947154/pexels-photo-34947154.jpeg?auto=compress&cs=tinysrgb&w=2000"
        imageAlt="Confident adult in a warm interior"
      />
      <HumanChapter
        align="right"
        chapter="MISSION 04–07"
        heavy="WRITE"
        serif="the rule."
        body="Choose a pause, an alternative action and a limit while the moment is calm."
        image="https://images.pexels.com/photos/5710657/pexels-photo-5710657.jpeg?auto=compress&cs=tinysrgb&w=2000"
        imageAlt="Adult writing a plan at a desk"
      />
      <HumanChapter
        chapter="MISSION 08–10"
        heavy="USE IT."
        serif="Make it yours."
        body="Try the plan in real life, review what happened and strengthen the next action."
        image="https://images.pexels.com/photos/7870310/pexels-photo-7870310.jpeg?auto=compress&cs=tinysrgb&w=2000"
        imageAlt="Adult reviewing notes outdoors"
      />

      <section className={styles.toolsSection}>
        <div className={styles.toolsHeading} data-seven-reveal>
          <span>WHAT YOU KEEP</span>
          <h2><strong>Not advice to remember.</strong><em>Tools you can use.</em></h2>
          <p>Every mission saves a concrete rule, map or review to your dashboard.</p>
        </div>
        <div className={styles.toolGrid}>
          {tools.map((tool, index) => (
            <button
              className={`${styles.toolCard} ${activeTool === index ? styles.toolCardActive : ""}`}
              key={tool.key}
              type="button"
              aria-pressed={activeTool === index}
              onClick={() => setActiveTool(index)}
              data-seven-reveal
            >
              <span className={styles.toolNumber}>{tool.number}</span>
              <ToolVisual type={tool.key} />
              <strong>{tool.title}</strong>
              <small>{tool.short}</small>
              <p>{tool.detail}</p>
              <span className={styles.toolAction}>{activeTool === index ? "Selected" : "See how it works"}<ArrowIcon /></span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.evidenceSection}>
        <div className={styles.evidenceHeading} data-seven-reveal>
          <span>WHY THIS EXISTS</span>
          <h2><strong>Built from evidence.</strong><em>Honest about its limits.</em></h2>
          <p>SevenBet draws on methods studied in gambling-harm treatment and behaviour-change research. The complete programme has not yet been clinically evaluated.</p>
        </div>
        <div className={styles.evidenceGrid}>
          <article data-seven-reveal><span>NHS</span><strong>Recognition and support guidance</strong><p>Used to shape the self-recognition language.</p></article>
          <article data-seven-reveal><span>NICE NG248</span><strong>Assessment and treatment guidance</strong><p>A source for safe programme boundaries.</p></article>
          <article data-seven-reveal className={styles.missionMetric}><span>10</span><strong>Practical missions</strong><p>Each mission produces a saved tool or rule.</p></article>
          <article data-seven-reveal className={styles.limitCard}><span>CLEAR LIMIT</span><strong>No clinical claim</strong><p>The complete programme has not yet been clinically evaluated.</p></article>
        </div>
      </section>

      <section className={styles.finalCta} data-seven-reveal>
        <span>READY WHEN YOU ARE</span>
        <h2><strong>START WITH ONE</strong><em>useful mission.</em></h2>
        <p>No promise of a perfect outcome. Just a practical first step you can finish.</p>
        <Link className={styles.primaryButton} href="/program">Start the 10-Step Program</Link>
      </section>

      <section className={styles.helpPanel}>
        <div>
          <span>NEED SUPPORT NOW?</span>
          <h2>Help without offers.</h2>
          <p>Open a protected route with no casino, bonus or affiliate calls to action.</p>
        </div>
        <Link href="/responsible-gambling">Open Help <ArrowIcon /></Link>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerLead}>
          <Link className={styles.wordmark} href="/">SEVENBET</Link>
          <p>Choose better. Play with more control.</p>
        </div>
        <div className={styles.footerLinks}>
          <div><strong>Explore</strong><Link href="/casinos">Casinos</Link><Link href="/bonuses">Bonuses</Link><Link href="/best-offers">Best offers</Link></div>
          <div><strong>Understand</strong><Link href="/casinos">Reviews</Link><Link href="/catalog">Comparisons</Link><Link href="/learn">Learn</Link></div>
          <div><strong>Control</strong><Link href="/10-steps">10-Step Program</Link><Link href="/self-check">Self-check</Link><Link href="/responsible-gambling">Help</Link></div>
          <div><strong>SevenBet</strong><Link href="/about">About</Link><Link href="/privacy">Privacy</Link><Link href="/affiliate-disclosure">Affiliate disclosure</Link></div>
        </div>
        <p className={styles.legal}>18+ · GambleAware · Safer gambling · Terms apply · Some links may be affiliate links.</p>
      </footer>
    </div>
  );
}

function HumanChapter({
  align = "left",
  chapter,
  heavy,
  serif,
  body,
  image,
  imageAlt,
}: {
  align?: "left" | "right";
  chapter: string;
  heavy: string;
  serif: string;
  body: string;
  image: string;
  imageAlt: string;
}) {
  return (
    <section className={`${styles.humanChapter} ${align === "right" ? styles.humanChapterRight : ""}`}>
      <img src={image} alt={imageAlt} loading="lazy" />
      <div className={styles.chapterShade} />
      <div className={styles.chapterCopy} data-seven-reveal>
        <span>{chapter}</span>
        <h2><strong>{heavy}</strong><em>{serif}</em></h2>
        <p>{body}</p>
        <i />
      </div>
    </section>
  );
}

function ToolVisual({ type }: { type: "map" | "pause" | "review" }) {
  if (type === "pause") {
    return <span className={`${styles.toolVisual} ${styles.pauseVisual}`}><i /><i /></span>;
  }
  if (type === "review") {
    return <span className={`${styles.toolVisual} ${styles.reviewVisual}`}><i /><i /><i /><i /></span>;
  }
  return <span className={`${styles.toolVisual} ${styles.mapVisual}`}><i /><i /><i /><b /></span>;
}
