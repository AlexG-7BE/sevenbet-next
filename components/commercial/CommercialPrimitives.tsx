import Link from "next/link";
import type { ReactNode } from "react";

import type { CommercialFact } from "@/lib/commercial/commercial-presentation";
import type { CommercialUxMessages } from "@/lib/commercial/commercial-ux-messages";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";

import styles from "./CommercialPrimitives.module.css";

export function CommercialScore({ score, label, locale }: { score: number | null; label: string; locale: string }) {
  if (score === null) return null;
  const value = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(score);
  return <span aria-label={`${label} ${value} / 10`} className={styles.score}><strong>{value}</strong><small>/10</small></span>;
}

export function CommercialBadges({ badges }: { badges: readonly string[] }) {
  if (!badges.length) return null;
  return <div className={styles.badges}>{badges.slice(0, 2).map((badge) => <span key={badge}>{badge}</span>)}</div>;
}

export function CommercialFacts({ facts }: { facts: readonly CommercialFact[] }) {
  return <dl className={styles.facts}>{facts.slice(0, 3).map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>;
}

export function CommercialReviewLink({ children, href, presentation }: { children: ReactNode; href: string; presentation: PresentationResolution }) {
  return <Link className={styles.reviewLink} href={productHref(presentation, href)}>{children}</Link>;
}

export function CompactProtection({ copy, presentation }: { copy: CommercialUxMessages; presentation: PresentationResolution }) {
  return <p className={styles.protection}>18+ · {copy.playResponsibly} · <Link href={productHref(presentation, "/help")}>{copy.getHelp}</Link></p>;
}
