import Image from "next/image";
import Link from "next/link";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import styles from "@/components/public-offers/PublicOffers.module.css";
import type { PublicOfferDTO, PublicOfferFacets, PublicOfferQuery } from "@/lib/public-offer/public-offer.types";

function money(value: number | null, currency: string | null) {
  if (value === null) return "Not listed";
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value} ${currency || ""}`.trim();
  }
}
function terms(offer: PublicOfferDTO) {
  return [
    offer.bonus.minimumDeposit === null ? "Deposit not listed" : `Min deposit ${money(offer.bonus.minimumDeposit, offer.bonus.currency)}`,
    offer.bonus.wageringMultiplier === null ? offer.bonus.wageringText || "Wagering not listed" : `${offer.bonus.wageringMultiplier}× wagering`,
    offer.bonus.maximumBonus === null ? null : `Max ${money(offer.bonus.maximumBonus, offer.bonus.currency)}`,
    offer.bonus.freeSpins === null ? null : `${offer.bonus.freeSpins} free spins`,
  ].filter(Boolean) as string[];
}

function OfferAction({ offer }: { offer: PublicOfferDTO }) {
  if (!offer.action.available || !offer.action.href) return <span aria-disabled="true" className={styles.unavailable}>Offer unavailable</span>;
  return <CasinoOutboundAction action={{ href: offer.action.href, label: "View offer" }} className={styles.primaryAction} />;
}

export function FeaturedOfferCard({ offer, rank }: { offer: PublicOfferDTO; rank: number }) {
  const licence = offer.casino.licenses[0];
  return <article className={styles.featureCard}>
    <div className={styles.cardTop}>
      <span className={styles.rank}>0{rank}</span>
      <span className={offer.commercialAvailability === "AVAILABLE" ? styles.available : styles.reviewOnly}>
        {offer.commercialAvailability === "AVAILABLE" ? "Affiliate action" : "Review only"}
      </span>
    </div>
    <div className={styles.identity}>
      {offer.casino.logo ? <Image alt={offer.casino.logo.alt || ""} height={56} src={offer.casino.logo.url} width={112} /> : <span aria-hidden="true">{offer.casino.name.slice(0, 2)}</span>}
      <div><p>{offer.bonus.type.replaceAll("_", " ")}</p><h3>{offer.casino.name}</h3></div>
    </div>
    <div className={styles.score}><strong>{offer.casino.editorScore.toFixed(1)}</strong><span>Editorial score / 10</span></div>
    <div className={styles.offerTitle}><h4>{offer.bonus.title}</h4><p>{offer.bonus.summary}</p></div>
    <dl className={styles.termGrid}>{terms(offer).map((term) => <div key={term}><dt>Material term</dt><dd>{term}</dd></div>)}</dl>
    <p className={styles.context}><strong>Licence:</strong> {licence?.authority || "Not listed"}<br /><strong>Payments:</strong> {offer.casino.payments.slice(0, 3).map((item) => item.name).join(", ") || "Not listed"}</p>
    <div className={styles.actions}><Link className={styles.reviewAction} href={`/casino/${offer.casino.slug}`}>Read full review</Link><OfferAction offer={offer} /></div>
  </article>;
}

export function OfferComparisonList({ offers, startRank = 1 }: { offers: PublicOfferDTO[]; startRank?: number }) {
  return <div className={styles.comparison} role="list">
    {offers.map((offer, index) => <article className={styles.comparisonRow} key={`${offer.casino.id}:${offer.bonus.id}`} role="listitem">
      <span className={styles.rowRank}>{String(startRank + index).padStart(2, "0")}</span>
      <div className={styles.rowIdentity}>
        <p>{offer.bonus.type.replaceAll("_", " ")}</p>
        <h3>{offer.casino.name}</h3>
        <Link href={`/casino/${offer.casino.slug}`}>Editorial review →</Link>
      </div>
      <div className={styles.rowOffer}><strong>{offer.bonus.title}</strong><span>{terms(offer).join(" · ")}</span></div>
      <div className={styles.rowContext}><span>Score</span><strong>{offer.casino.editorScore.toFixed(1)}/10</strong><small>{offer.casino.responsibleGamblingTools.slice(0, 2).join(" · ") || "Responsible tools not listed"}</small></div>
      <OfferAction offer={offer} />
    </article>)}
  </div>;
}

export function OfferFilters({ facets, query }: { facets: PublicOfferFacets; query: PublicOfferQuery }) {
  return <form action="/bonuses" className={styles.filters} method="get">
    <label><span>Bonus type</span><select defaultValue={query.type || ""} name="type"><option value="">All types</option>{facets.types.map((item) => <option key={item.value} value={item.value}>{item.label} ({item.count})</option>)}</select></label>
    <label><span>Payment</span><select defaultValue={query.payment || ""} name="payment"><option value="">All payments</option>{facets.payments.map((item) => <option key={item.value} value={item.value}>{item.label} ({item.count})</option>)}</select></label>
    <label><span>Crypto</span><select defaultValue={query.crypto === undefined ? "" : String(query.crypto)} name="crypto"><option value="">Any support</option>{facets.crypto.map((item) => <option key={item.value} value={item.value}>{item.label} ({item.count})</option>)}</select></label>
    <label><span>Max deposit</span><input defaultValue={query.maxDeposit} min="0" name="maxDeposit" placeholder="e.g. 20" step="1" type="number" /></label>
    <label><span>Max wagering</span><input defaultValue={query.maxWagering} min="0" name="maxWagering" placeholder="e.g. 35" step="1" type="number" /></label>
    <label><span>Action state</span><select defaultValue={query.availability || ""} name="availability"><option value="">Any state</option>{facets.availability.map((item) => <option key={item.value} value={item.value}>{item.label} ({item.count})</option>)}</select></label>
    <label><span>Sort</span><select defaultValue={query.sort} name="sort"><option value="editorial">Editorial</option><option value="newest">Newest</option><option value="highest-bonus">Highest max bonus</option><option value="lowest-wagering">Lowest wagering</option><option value="lowest-deposit">Lowest min deposit</option></select></label>
    <button type="submit">Apply filters</button>
    <Link href="/bonuses">Clear all</Link>
  </form>;
}

export function ActiveOfferFilters({ query }: { query: PublicOfferQuery }) {
  const values = [query.type?.replaceAll("_", " "), query.payment, query.crypto === undefined ? null : query.crypto ? "Crypto" : "No crypto", query.maxDeposit === undefined ? null : `Deposit ≤ ${query.maxDeposit}`, query.maxWagering === undefined ? null : `Wagering ≤ ${query.maxWagering}`, query.availability?.replaceAll("_", " ")].filter(Boolean);
  if (!values.length) return <p className={styles.filterSummary}>Showing all eligible published offers.</p>;
  return <div className={styles.activeFilters}><p>Active filters</p>{values.map((value) => <span key={value}>{value}</span>)}<Link href="/bonuses">Clear</Link></div>;
}

export function OfferPagination({ page, pageCount, searchParams }: { page: number; pageCount: number; searchParams: Record<string, string | string[] | undefined> }) {
  if (pageCount <= 1) return null;
  const href = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      for (const item of Array.isArray(value) ? value : value ? [value] : []) if (key !== "page" && key !== "country") params.append(key, item);
    }
    if (target > 1) params.set("page", String(target));
    return `/bonuses${params.size ? `?${params}` : ""}`;
  };
  return <nav aria-label="Bonus result pages" className={styles.pagination}>
    {page > 1 ? <Link href={href(page - 1)}>← Previous</Link> : <span aria-disabled="true">← Previous</span>}
    <strong>Page {page} of {pageCount}</strong>
    {page < pageCount ? <Link href={href(page + 1)}>Next →</Link> : <span aria-disabled="true">Next →</span>}
  </nav>;
}
