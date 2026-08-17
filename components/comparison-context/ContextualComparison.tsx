"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type { PublicComparisonResult } from "@/lib/public-comparison/public-comparison.types";
import styles from "./ContextualComparison.module.css";
import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";

const STORAGE_KEY = "b4gamble:public-comparison:v1";
const CHANGE_EVENT = "b4gamble:comparison-change";
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validSlugs(values: unknown) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((value): value is string => typeof value === "string" && value.length <= 80 && SLUG.test(value)))].slice(0, 3);
}

function urlSlugs(searchParams: URLSearchParams) {
  return validSlugs(searchParams.getAll("casino").flatMap((value) => value.split(",")).map((value) => value.trim().toLowerCase()));
}

export function ContextualComparison() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [slugs, setSlugs] = useState<string[]>([]);
  const [result, setResult] = useState<PublicComparisonResult | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousCount = useRef(0);
  const initialLocationApplied = useRef(false);

  const announce = useCallback((next: string[]) => {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { slugs: next } }));
  }, []);

  const commit = useCallback((nextRaw: string[], autoOpen = true) => {
    const next = validSlugs(nextRaw);
    setSlugs(next);
    announce(next);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    const params = new URLSearchParams(searchParams.toString());
    params.delete("casino");
    for (const slug of next) params.append("casino", slug);
    if (next.length) params.set("country", params.get("country") || "GB");
    else {
      params.delete("differences");
      if (params.get("country") === "GB") params.delete("country");
    }
    window.history.replaceState(window.history.state, "", `${pathname}${params.size ? `?${params}` : ""}`);
    if (autoOpen && next.length === 2 && previousCount.current < 2) setOpen(true);
    previousCount.current = next.length;
  }, [announce, pathname, searchParams]);

  useEffect(() => {
    const fromUrl = urlSlugs(new URLSearchParams(searchParams.toString()));
    let stored: string[] = [];
    try { stored = validSlugs(JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]")); } catch { stored = []; }
    const initial = fromUrl.length ? fromUrl : stored;
    previousCount.current = initial.length;
    setSlugs(initial);
    announce(initial);
    if (!initialLocationApplied.current) {
      initialLocationApplied.current = true;
      if (fromUrl.length >= 2) setOpen(true);
    }
  }, [announce, searchParams]);

  useEffect(() => {
    const onToggle = (event: Event) => {
      const slug = (event as CustomEvent<{ slug?: string }>).detail?.slug;
      if (!slug || !SLUG.test(slug)) return;
      commit(slugs.includes(slug) ? slugs.filter((entry) => entry !== slug) : [...slugs, slug]);
    };
    const onRequest = () => announce(slugs);
    window.addEventListener("b4gamble:comparison-toggle", onToggle);
    window.addEventListener("b4gamble:comparison-request", onRequest);
    return () => {
      window.removeEventListener("b4gamble:comparison-toggle", onToggle);
      window.removeEventListener("b4gamble:comparison-request", onRequest);
    };
  }, [announce, commit, slugs]);

  useEffect(() => {
    if (slugs.length < 2) { setResult(null); return; }
    const controller = new AbortController();
    const params = new URLSearchParams();
    for (const slug of slugs) params.append("casino", slug);
    params.set("country", searchParams.get("country") || "GB");
    if (searchParams.get("differences") === "true") params.set("differences", "true");
    if (searchParams.get("visualFixture") === "true") params.set("visualFixture", "true");
    setLoading(true);
    fetch(`/api/public/comparison?${params}`, { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Comparison unavailable")))
      .then((data: PublicComparisonResult) => setResult(data))
      .catch((error: Error) => { if (error.name !== "AbortError") setResult(null); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [searchParams, slugs]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && slugs.length >= 2 && dialog && !dialog.open) dialog.showModal();
    if ((!open || slugs.length < 2) && dialog?.open) dialog.close();
  }, [open, slugs.length]);

  useEffect(() => {
    if (open && slugs.length >= 2) productAnalyticsClient.comparisonOpened(slugs.length === 2 ? "two" : "three");
  }, [open, slugs.length]);

  if (!slugs.length) return null;
  const names = result?.casinos ?? [];
  const comparisonRows = result?.groups.flatMap((group) => group.rows) ?? [];
  const presentationRows = ["offer-title", "wagering", "minimum-deposit", "withdrawal-time", "methods", "control-tools"]
    .flatMap((id) => {
      const row = comparisonRows.find((candidate) => candidate.id === id);
      return row ? [row] : [];
    });
  const highestScore = names.length ? Math.max(...names.map((casino) => casino.editorScore)) : null;

  return <>
    <aside aria-label="Casino comparison tray" className={styles.tray} data-comparison-count={slugs.length} data-comparison-tray>
      <div><strong>{slugs.length} of 3 selected</strong><span>{slugs.length === 1 ? "Choose one more to compare" : "Your comparison is ready"}</span></div>
      <div className={styles.trayActions}>
        {slugs.length >= 2 && <button onClick={() => setOpen(true)} type="button">Open comparison</button>}
        <button onClick={() => commit([], false)} type="button">Clear</button>
      </div>
    </aside>
    <dialog aria-labelledby="comparison-title" className={styles.dialog} data-runtime-renderer="contextual-comparison" data-screen-label="Compare overlay" onCancel={(event) => { event.preventDefault(); setOpen(false); }} onClose={() => setOpen(false)} ref={dialogRef}>
      <div className={styles.sheet}>
        <header>
          <div><h2 id="comparison-title">Side by side</h2><span>Same test cycle for every casino</span></div>
          <button aria-label="Close comparison" onClick={() => setOpen(false)} type="button"><span aria-hidden="true">×</span></button>
        </header>
        {loading ? <p className={styles.state} role="status">Building the comparison…</p> : (result?.status === "available" || result?.status === "no-comparable") && names.length ? <div className={styles.comparisonCards}>
          {slugs.map((slug) => {
            const casino = names.find((entry) => entry.slug === slug);
            const displayName = casino?.name ?? slug.replaceAll("-", " ");
            return <article className={styles.comparisonCard} key={slug}>
              <div className={styles.casinoHead}>
                <span aria-hidden="true">{displayName.slice(0, 1).toUpperCase()}</span>
                <div><h3>{displayName}</h3><small>{casino?.summary || (casino?.dataClassification === "DEMO_FIXTURE" ? "Fictional demo profile" : "Independent review")}</small></div>
              </div>
              {casino && casino.editorScore === highestScore && <strong className={styles.topScore}>Top score</strong>}
              <div className={styles.editorScore}><strong>{casino ? casino.editorScore.toFixed(1) : "—"}</strong><span>/10</span><span aria-hidden="true">★★★★★</span></div>
              <div className={styles.factList}>
                {presentationRows.map((row) => <dl key={row.id} title={row.description}>
                  <dt>{row.id === "withdrawal-time" ? "Payout" : row.id === "methods" ? "Payments" : row.id === "control-tools" ? "Features" : row.label}</dt>
                  <dd>{row.values[slug]?.text ?? "Unavailable"}</dd>
                  <small>{row.values[slug]?.status ?? "Unavailable"}</small>
                </dl>)}
              </div>
              {!presentationRows.length && <p className={styles.noEvidence}>Published comparison evidence is unavailable.</p>}
              <div className={styles.columnActions}>
                {casino?.action.available && casino.action.href
                  ? <CasinoOutboundAction action={{ href: casino.action.href, label: casino.action.label }} className={styles.visitAction} />
                  : casino ? <Link className={styles.reviewAction} href={casino.reviewHref}>Full review</Link> : null}
                <button onClick={() => commit(slugs.filter((entry) => entry !== slug), false)} type="button">Remove</button>
              </div>
            </article>;
          })}
        </div> : <p className={styles.state} role="status">The selected public comparison is unavailable. No substitute has been inserted.</p>}
        <footer><span>18+ · Availability is never assumed · Scores are editorial — <Link href="/methodology">how we test</Link>. Country is a comparison preference, not proof of eligibility.</span></footer>
      </div>
    </dialog>
  </>;
}
