"use client";

import { useState } from "react";

import { ActionButton } from "@/components/design-system/Action";
import { ProgramAiAuthenticatedHeader } from "@/components/programme/ProgramAiAuthenticatedHeader";
import type { ProgramAiReview } from "@/components/programme/ProgramAiAuthenticated.types";
import { programmeText } from "@/lib/i18n/programme-catalog";
import { PROGRAMME_ACCESS_HEADERS, PROGRAMME_ACCESS_HEADER_VALUES } from "@/lib/programme/access-contract";
import { hasProgrammeAccessAuthority, userProgrammeSubject } from "@/lib/programme/local-subject-storage";
import type { ProgrammeLocale } from "@/lib/programme/presentation";
import styles from "./ProgramAiAuthenticated.module.css";

async function generateReview(milestone: string, localWording: string, userId: string, locale: ProgrammeLocale) {
  const subject = userProgrammeSubject(userId);
  const response = await fetch(`/api/program/program-ai/reviews/${milestone}?locale=${encodeURIComponent(locale)}`, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      ...(hasProgrammeAccessAuthority(window.sessionStorage, subject)
        ? { [PROGRAMME_ACCESS_HEADERS.age]: PROGRAMME_ACCESS_HEADER_VALUES.age }
        : {}),
    },
    body: JSON.stringify({ locale, ...(localWording.trim() ? { localWording: localWording.trim() } : {}) }),
  });
  const payload = await response.json() as { ok?: boolean; review?: ProgramAiReview };
  if (!response.ok || !payload.review) throw new Error(programmeText(locale, "The Review could not be prepared"));
  return payload.review;
}

export function ProgramAiReviewScreen({ initialReview, milestone, totalXp, userId, localWording, onLocalWording, onBack, locale, programmePath }: {
  initialReview: ProgramAiReview;
  milestone: "first" | "mid" | "full";
  totalXp: number;
  userId: string;
  localWording: string;
  onLocalWording: (value: string) => void;
  onBack: () => void;
  locale: ProgrammeLocale;
  programmePath: string;
}) {
  const [review, setReview] = useState(initialReview);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);
  async function personalise() {
    setBusy(true); setError("");
    try { setReview(await generateReview(milestone, localWording, userId, locale)); setGenerated(true); }
    catch { setError(programmeText(locale, "The Review could not be prepared")); }
    finally { setBusy(false); }
  }
  const reviewLabel = programmeText(locale, milestone === "first" ? "First Personal Review" : milestone === "mid" ? "Mid-Programme Personal Review" : "Full Programme Personal Review");
  return <div className={styles.shell}>
    <ProgramAiAuthenticatedHeader label={reviewLabel} locale={locale} programmePath={programmePath} totalXp={totalXp} userId={userId} />
    <main className={styles.reviewMain}>
      <div className={styles.missionTopline}><button className={styles.back} onClick={onBack} type="button">← {programmeText(locale, "Programme Home")}</button><span className={styles.eyebrow}>{programmeText(locale, "UNLOCKED BY MISSION COMPLETION")}</span></div>
      <section className={styles.reviewIntro}><span className={styles.eyebrow}>{reviewLabel}</span><h1>{review.title}</h1><p>{programmeText(locale, "Here’s what your Programme looks like so far.")}</p></section>
      <label className={styles.localField}><span>{programmeText(locale, "Optional current wording · this tab only")}</span><textarea maxLength={600} onChange={(event) => onLocalWording(event.target.value)} placeholder={programmeText(locale, "Add a current note for this generation, or leave blank.")} value={localWording} /></label>
      {!generated ? <div className={styles.submitRow}><ActionButton disabled={busy} onClick={personalise} size="large">{programmeText(locale, busy ? "Preparing…" : "Personalise this Review")}</ActionButton><span>{programmeText(locale, "Add your current wording above if you want it reflected here.")}</span></div> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <article className={styles.reviewSurface} aria-live="polite">
        <span className={styles.eyebrow}>{programmeText(locale, "HERE’S WHAT YOU’VE BUILT")}</span>
        {review.sections.map((section) => <section className={styles.reviewSection} key={section.id}><h2>{section.title}</h2><p>{section.body}</p></section>)}
      </article>
      <ActionButton onClick={onBack} size="large">{programmeText(locale, "Return to Programme Home")}</ActionButton>
    </main>
  </div>;
}
