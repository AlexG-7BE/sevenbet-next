import Link from "next/link";
import type { ReactNode } from "react";

import type { CommercialFact } from "@/lib/commercial/commercial-presentation";
import type { CommercialUxMessages } from "@/lib/commercial/commercial-ux-messages";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";

import styles from "./CommercialPrimitives.module.css";

function classes(...names: readonly (string | undefined)[]) {
  return names.filter(Boolean).join(" ");
}

/** Renders the last word of a translated heading in the editorial serif without changing the copy. */
export function EmphasisTail({ text }: { text: string }) {
  const trimmed = text.trim();
  const split = trimmed.lastIndexOf(" ");
  if (split < 0) return <em>{trimmed}</em>;
  return <>{trimmed.slice(0, split)} <em>{trimmed.slice(split + 1)}</em></>;
}

export function CommercialScore({ className, score, label, locale }: { className?: string; score: number | null; label: string; locale: string }) {
  if (score === null) return null;
  const value = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(score);
  return <span aria-label={`${label} ${value} / 10`} className={classes(styles.score, className)}><strong>{value}</strong><small>/10</small></span>;
}

export function CommercialBadges({ badges, className }: { badges: readonly string[]; className?: string }) {
  if (!badges.length) return null;
  return <div className={classes(styles.badges, className)}>{badges.slice(0, 2).map((badge) => <span key={badge}>{badge}</span>)}</div>;
}

export function CommercialFacts({ className, facts }: { className?: string; facts: readonly CommercialFact[] }) {
  return <dl className={classes(styles.facts, className)}>{facts.slice(0, 3).map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>;
}

export function CommercialReviewLink({ children, href, presentation }: { children: ReactNode; href: string; presentation: PresentationResolution }) {
  return <Link className={styles.reviewLink} href={productHref(presentation, href)}>{children}</Link>;
}

export function CompactProtection({ copy, presentation }: { copy: CommercialUxMessages; presentation: PresentationResolution }) {
  return <p className={styles.protection}>18+ · {copy.playResponsibly} · <Link href={productHref(presentation, "/help")}>{copy.getHelp}</Link></p>;
}
