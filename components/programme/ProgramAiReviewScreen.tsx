"use client";

import { useState } from "react";

import { ActionButton } from "@/components/design-system/Action";
import { ProgramAiAuthenticatedHeader } from "@/components/programme/ProgramAiAuthenticatedHeader";
import type { ProgramAiReview } from "@/components/programme/ProgramAiAuthenticated.types";
import styles from "./ProgramAiAuthenticated.module.css";

async function generateReview(milestone: string, localWording: string) {
  const response = await fetch(`/api/program/program-ai/reviews/${milestone}`, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...(localWording.trim() ? { localWording: localWording.trim() } : {}) }),
  });
  const payload = await response.json() as { ok?: boolean; error?: string; review?: ProgramAiReview };
  if (!response.ok || !payload.review) throw new Error(payload.error || "The Review could not be prepared");
  return payload.review;
}

export function ProgramAiReviewScreen({ initialReview, milestone, totalXp, userId, localWording, onLocalWording, onBack }: {
  initialReview: ProgramAiReview;
  milestone: "first" | "mid" | "full";
  totalXp: number;
  userId: string;
  localWording: string;
  onLocalWording: (value: string) => void;
  onBack: () => void;
}) {
  const [review, setReview] = useState(initialReview);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);
  async function personalise() {
    setBusy(true); setError("");
    try { setReview(await generateReview(milestone, localWording)); setGenerated(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "The Review could not be prepared"); }
    finally { setBusy(false); }
  }
  return <div className={styles.shell}>
    <ProgramAiAuthenticatedHeader label="PERSONAL REVIEW · 0 XP" totalXp={totalXp} userId={userId} />
    <main className={styles.reviewMain}>
      <div className={styles.missionTopline}><button className={styles.back} onClick={onBack} type="button">← Programme Home</button><span className={styles.eyebrow}>UNLOCKED BY MISSION COMPLETION</span></div>
      <section className={styles.reviewIntro}><span className={styles.eyebrow}>PRIVATE STRUCTURAL REVIEW</span><h1>{review.title}</h1><p>This Review summarises confirmed structural facts. It awards 0 XP and does not diagnose, score or recommend a commercial action.</p></section>
      <label className={styles.localField}><span>Optional current wording · this tab only</span><textarea maxLength={600} onChange={(event) => onLocalWording(event.target.value)} placeholder="Add a current note for this generation, or leave blank." value={localWording} /></label>
      {!generated ? <div className={styles.submitRow}><ActionButton disabled={busy} onClick={personalise} size="large">{busy ? "Preparing…" : "Prepare this Review"}</ActionButton><span>Provider-off or provider-failure uses the same truthful deterministic structure.</span></div> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <article className={styles.reviewSurface} aria-live="polite">
        <span className={styles.eyebrow}>{review.generation === "provider" ? "BOUNDED AI REVIEW" : "DETERMINISTIC REVIEW"}</span>
        {review.sections.map((section) => <section className={styles.reviewSection} key={section.id}><h2>{section.title}</h2><p>{section.body}</p></section>)}
      </article>
      <ActionButton onClick={onBack} size="large">Return to Programme Home</ActionButton>
    </main>
  </div>;
}
