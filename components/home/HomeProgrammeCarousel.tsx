"use client";

import { useState } from "react";

import styles from "./TiltHome.module.css";

const slides = [
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
    key: "path",
    eyebrow: "10 MISSIONS",
    title: "A path you can finish.",
    body: "Each mission creates something you can reuse in a difficult moment.",
    metric: "1 of 10 complete",
    status: "Mission 02 unlocks next",
    progress: 18,
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
] as const;

function ArrowIcon({ direction = "right" }: { direction?: "left" | "right" }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d={direction === "right" ? "M5 12h14m-5-5 5 5-5 5" : "M19 12H5m5-5-5 5 5 5"} /></svg>;
}

export function HomeProgrammeCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);

  function move(direction: number) {
    setActiveSlide((current) => (current + direction + slides.length) % slides.length);
  }

  function positionFor(index: number) {
    const relative = (index - activeSlide + slides.length) % slides.length;
    if (relative === 0) return "active";
    if (relative === 1) return "next";
    return "previous";
  }

  return (
    <div
      className={styles.carouselStage}
      role="region"
      aria-roledescription="carousel"
      aria-label="Programme preview"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") move(-1);
        if (event.key === "ArrowRight") move(1);
      }}
    >
      {slides.map((slide, index) => {
        const position = positionFor(index);
        return (
          <article
            aria-hidden={position !== "active"}
            className={`${styles.programmeCard} ${styles[`programmeCard${position[0].toUpperCase()}${position.slice(1)}`]}`}
            data-carousel-position={position}
            key={slide.key}
          >
            <span className={styles.cardEyebrow}>{slide.eyebrow}</span>
            <strong>{slide.title}</strong>
            <p>{slide.body}</p>
            <span className={styles.miniScreen}>
              <b>{slide.metric}</b>
              <i><span style={{ width: `${slide.progress}%` }} /></i>
              <small>{slide.status}</small>
            </span>
          </article>
        );
      })}
      <div className={styles.carouselControls}>
        <button type="button" onClick={() => move(-1)} aria-label="Previous programme preview"><ArrowIcon direction="left" /></button>
        <span aria-live="polite" aria-atomic="true">{String(activeSlide + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
        <button type="button" onClick={() => move(1)} aria-label="Next programme preview"><ArrowIcon /></button>
      </div>
    </div>
  );
}
