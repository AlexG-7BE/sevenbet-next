"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type { PublicComparisonResult } from "@/lib/public-comparison/public-comparison.types";
import styles from "./ContextualComparison.module.css";
import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";

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
  const router = useRouter();
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
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
    if (autoOpen && next.length === 2 && previousCount.current < 2) setOpen(true);
    previousCount.current = next.length;
  }, [announce, pathname, router, searchParams]);

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

  return <>
    <aside aria-label="Casino comparison tray" className={styles.tray}>
      <div><strong>{slugs.length} of 3 selected</strong><span>{slugs.length === 1 ? "Choose one more to compare" : "Your comparison is ready"}</span></div>
      <div className={styles.trayActions}>
        {slugs.length >= 2 && <button onClick={() => setOpen(true)} type="button">Open comparison</button>}
        <button onClick={() => commit([], false)} type="button">Clear</button>
      </div>
    </aside>
    <dialog aria-labelledby="comparison-title" className={styles.dialog} onCancel={(event) => { event.preventDefault(); setOpen(false); }} onClose={() => setOpen(false)} ref={dialogRef}>
      <div className={styles.sheet}>
        <header><div><span>CONTEXTUAL COMPARISON · {slugs.length} / 3</span><h2 id="comparison-title">See the differences.</h2><p>Published evidence, side by side. No fabricated winner.</p></div><button aria-label="Close comparison" onClick={() => setOpen(false)} type="button">Close</button></header>
        <div className={styles.selected}>
          {slugs.map((slug) => {
            const casino = names.find((entry) => entry.slug === slug);
            return <article key={slug}><strong>{casino?.name ?? slug.replaceAll("-", " ")}</strong><span>{casino ? `${casino.editorScore.toFixed(1)} / 10` : loading ? "Checking…" : "Unavailable"}</span><button onClick={() => commit(slugs.filter((entry) => entry !== slug), false)} type="button">Remove</button></article>;
          })}
        </div>
        {loading ? <p className={styles.state} role="status">Building the comparison…</p> : (result?.status === "available" || result?.status === "no-comparable") && result.groups.length ? <div className={styles.groups}>
          {result.groups.map((group) => <section key={group.id}><h3>{group.label}</h3>{group.rows.map((row) => <div className={styles.row} key={row.id}><div><strong>{row.label}</strong><small>{row.description}</small></div>{slugs.map((slug) => <p key={slug}><span>{row.values[slug]?.text ?? "Unavailable"}</span><small>{row.values[slug]?.status ?? "Unavailable"}</small></p>)}</div>)}</section>)}
        </div> : <p className={styles.state} role="status">The selected public comparison is unavailable. No substitute has been inserted.</p>}
        <footer><span>Country is a comparison preference, not proof of eligibility.</span><div>{names.map((casino) => <Link href={casino.reviewHref} key={casino.slug}>Review {casino.name}</Link>)}</div></footer>
      </div>
    </dialog>
  </>;
}
