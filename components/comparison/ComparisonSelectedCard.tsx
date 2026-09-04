import Link from "next/link";
import React from "react";

import { ResponsivePlacementImage } from "@/components/media/ResponsivePlacementImage";
import { comparisonHref } from "@/lib/public-comparison/query";
import type { PublicComparisonCasino, PublicComparisonResult } from "@/lib/public-comparison/public-comparison.types";

export type ComparisonSelectedCardClassNames = Record<"selectedCard" | "selectedIdentity" | "selectedLinks", string>;

function publishedProfileContext(casino: PublicComparisonCasino, country: string) {
  return `Published profile · ${country} ${casino.marketState === "AVAILABLE" ? "declared available" : "context not available"}`;
}

export function ComparisonSelectedCardMarkup({
  casino,
  classNames,
  index,
  result,
}: {
  casino: PublicComparisonCasino;
  classNames: ComparisonSelectedCardClassNames;
  index: number;
  result: PublicComparisonResult;
}) {
  const remaining = result.selectedSlugs.filter((slug) => slug !== casino.slug);
  const demonstration = casino.dataClassification === "DEMO_FIXTURE";

  return <article className={classNames.selectedCard}>
    <div className={classNames.selectedIdentity}>
      {casino.logo ? <ResponsivePlacementImage alt={casino.logo.alt || `${casino.name} logo`} height={casino.logo.height ?? 72} media={casino.logo} width={casino.logo.width ?? 72} /> : <span aria-hidden="true">{casino.name.slice(0, 1)}</span>}
      <div>
        <p>{String(index + 1).padStart(2, "0")} · SELECTED</p>
        <h3>{casino.name}</h3>
        <small>{demonstration ? <><strong>DEMONSTRATION DATA</strong> · Fictional profile · {result.query.country} illustrative context</> : publishedProfileContext(casino, result.query.country)}</small>
      </div>
    </div>
    <div className={classNames.selectedLinks}><Link href={casino.reviewHref}>{demonstration ? "Open fictional profile" : "Read full review"}</Link><Link href={comparisonHref(result.query, remaining, { empty: remaining.length === 0 })}>Remove</Link></div>
  </article>;
}
