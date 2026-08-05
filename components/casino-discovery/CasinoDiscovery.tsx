import Link from "next/link";
import type { ReactNode } from "react";

import { isSafePublicSlug } from "@/lib/public-casino/public-casino-validation";
import { discoveryHref } from "@/lib/public-casino-discovery/query";
import type { CasinoDiscoveryFacetValue, CasinoDiscoveryQuery, CasinoDiscoveryResult, PublicCasinoCardDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import { visitActionUnavailableCopy } from "@/lib/public-casino-discovery/visit-action-presentation";

import { MobileCasinoFilters } from "./MobileCasinoFilters";
import styles from "./CasinoDiscovery.module.css";

const sortLabels = { FEATURED: "Featured", RELEVANCE: "Relevance", NEWEST: "Newest", NAME_ASC: "Name A–Z", NAME_DESC: "Name Z–A" } as const;
const pageSizes = [12, 24, 48] as const;
const arrayFields = [["country", "country"], ["license", "license"], ["payment", "payment"], ["gameProvider", "gameProvider"], ["category", "category"], ["bonusType", "bonusType"]] as const;
const booleanFields = [["hasBonus", "Published bonus"], ["hasAvailableVisitAction", "Visit action available"], ["supportsCrypto", "Cryptocurrency support"], ["supportsMobile", "Mobile support"]] as const;

function HiddenQuery({ query, except = [] }: { query: CasinoDiscoveryQuery; except?: string[] }) {
  return <>
    {arrayFields.flatMap(([field, name]) => except.includes(name) ? [] : (query[field] ?? []).map((value) => <input key={`${name}-${value}`} name={name} type="hidden" value={value} />))}
    {booleanFields.map(([name]) => query[name] && !except.includes(name) ? <input key={name} name={name} type="hidden" value="true" /> : null)}
    {query.search && !except.includes("q") ? <input name="q" type="hidden" value={query.search} /> : null}
    {query.sort && !except.includes("sort") ? <input name="sort" type="hidden" value={query.sort} /> : null}
    {query.pageSize && !except.includes("pageSize") ? <input name="pageSize" type="hidden" value={query.pageSize} /> : null}
  </>;
}

function FilterGroup({ legend, name, values, selected }: { legend: string; name: string; values: CasinoDiscoveryFacetValue[]; selected: string[] }) {
  if (!values.length) return null;
  return <fieldset className={styles.filterGroup}><legend>{legend}</legend><div>
    {values.slice(0, 12).map((value) => <label key={value.key}>
      <input defaultChecked={selected.includes(value.key)} name={name} type="checkbox" value={value.key} />
      <span>{value.label}</span><small>{value.count}</small>
    </label>)}
  </div></fieldset>;
}

function FilterFields({ result }: { result: CasinoDiscoveryResult }) {
  const query = result.appliedFilters;
  return <div className={styles.filterGrid}>
    <FilterGroup legend="Market preference" name="country" selected={query.country ?? []} values={result.facets.countries} />
    <FilterGroup legend="Licence" name="license" selected={query.license ?? []} values={result.facets.licenses} />
    <FilterGroup legend="Payment method" name="payment" selected={query.payment ?? []} values={result.facets.payments} />
    <FilterGroup legend="Game provider" name="gameProvider" selected={query.gameProvider ?? []} values={result.facets.gameProviders} />
    <FilterGroup legend="Category" name="category" selected={query.category ?? []} values={result.facets.categories} />
    <FilterGroup legend="Bonus type" name="bonusType" selected={query.bonusType ?? []} values={result.facets.bonusTypes} />
    <fieldset className={styles.filterGroup}><legend>Availability</legend><div>
      {booleanFields.map(([name, label]) => <label key={name}><input defaultChecked={Boolean(query[name])} name={name} type="checkbox" value="true" /><span>{label}</span></label>)}
    </div></fieldset>
  </div>;
}

function activeFilterCount(query: CasinoDiscoveryQuery) {
  return (query.search ? 1 : 0) + arrayFields.reduce((count, [field]) => count + (query[field]?.length ?? 0), 0) + booleanFields.filter(([field]) => query[field]).length;
}

function FilterForm({ result, mobile = false }: { result: CasinoDiscoveryResult; mobile?: boolean }) {
  const query = result.appliedFilters;
  return <form action="/casinos" className={mobile ? styles.mobileFilterForm : styles.filterForm} method="get">
    <HiddenQuery except={["country", "license", "payment", "gameProvider", "category", "bonusType", ...booleanFields.map(([name]) => name)]} query={query} />
    <FilterFields result={result} />
    <p className={styles.preferenceNote}><strong>Market preference, not location.</strong> This filters published market information. It does not confirm legal eligibility or where you are.</p>
    <div className={styles.filterActions}><Link href="/casinos">Reset all</Link><button type="submit">{mobile ? `Show ${result.total} results` : "Apply filters"}</button></div>
  </form>;
}

export function DiscoveryControls({ result }: { result: CasinoDiscoveryResult }) {
  const query = result.appliedFilters;
  const count = activeFilterCount(query);
  return <div className={styles.controls}>
    <form action="/casinos" className={styles.searchForm} method="get">
      <HiddenQuery except={["q"]} query={query} />
      <label htmlFor="casino-search">Search published reviews</label>
      <div><input defaultValue={query.search ?? ""} id="casino-search" maxLength={100} name="q" placeholder="Casino, licence, payment…" type="search" /><button type="submit">Search</button></div>
    </form>
    <div className={styles.desktopFilters}><FilterForm result={result} /></div>
    <MobileCasinoFilters activeCount={count}><FilterForm mobile result={result} /></MobileCasinoFilters>
    <noscript><details className={styles.noScriptFilters}><summary>Filters{count ? ` (${count})` : ""}</summary><FilterForm mobile result={result} /></details></noscript>
    <form action="/casinos" className={styles.sortForm} method="get">
      <HiddenQuery except={["sort", "pageSize"]} query={query} />
      <label htmlFor="casino-sort">Sort by<select defaultValue={query.sort} id="casino-sort" name="sort">{Object.entries(sortLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label htmlFor="casino-page-size">Show<select defaultValue={query.pageSize} id="casino-page-size" name="pageSize">{pageSizes.map((size) => <option key={size} value={size}>{size}</option>)}</select></label>
      <button type="submit">Update</button>
    </form>
  </div>;
}

function removeValue(query: CasinoDiscoveryQuery, field: keyof CasinoDiscoveryQuery, value?: string) {
  if (value === undefined) return discoveryHref(query, { [field]: undefined, page: 1 });
  return discoveryHref(query, { [field]: ((query[field] as string[] | undefined) ?? []).filter((entry) => entry !== value), page: 1 });
}

function facetLabels(result: CasinoDiscoveryResult) {
  const values: Record<string, Map<string, string>> = {};
  for (const [field, facet] of [["country", result.facets.countries], ["license", result.facets.licenses], ["payment", result.facets.payments], ["gameProvider", result.facets.gameProviders], ["category", result.facets.categories], ["bonusType", result.facets.bonusTypes]] as const) values[field] = new Map(facet.map((item) => [item.key, item.label]));
  return values;
}

export function ActiveDiscoveryFilters({ result }: { result: CasinoDiscoveryResult }) {
  const query = result.appliedFilters;
  const labels = facetLabels(result);
  const chips: Array<{ label: string; context: string; href: string }> = [];
  if (query.search) chips.push({ label: `“${query.search}”`, context: "search", href: removeValue(query, "search") });
  for (const [field] of arrayFields) for (const value of query[field] ?? []) chips.push({ label: labels[field]?.get(value) ?? value.replaceAll("_", " "), context: field, href: removeValue(query, field, value) });
  for (const [field, label] of booleanFields) if (query[field]) chips.push({ label, context: "availability", href: removeValue(query, field) });
  if (!chips.length) return null;
  return <div aria-label="Active filters" className={styles.activeFilters}>{chips.map((chip) => <Link aria-label={`Remove ${chip.context} filter ${chip.label}`} href={chip.href} key={`${chip.context}-${chip.label}`}><span>{chip.label}</span><b aria-hidden="true">×</b></Link>)}<Link className={styles.clearAll} href="/casinos">Clear all</Link></div>;
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function Tags({ children }: { children: ReactNode }) { return <div className={styles.tags}>{children}</div>; }

export function CasinoDiscoveryCard({ casino, position }: { casino: PublicCasinoCardDto; position: number }) {
  const canVisit = casino.visitAction.available && casino.visitAction.redirectSlug && isSafePublicSlug(casino.visitAction.redirectSlug);
  const unavailable = visitActionUnavailableCopy(casino.visitAction);
  const freshness = formatDate(casino.editorialUpdatedAt ?? casino.publishedAt);
  return <article className={styles.casinoCard}>
    <div className={styles.cardHeader}>
      <span className={styles.position}>{String(position).padStart(2, "0")}</span>
      <div className={styles.logo}>{casino.logo ? <img alt={casino.logo.alt} height={casino.logo.height ?? 72} loading="lazy" src={casino.logo.url} width={casino.logo.width ?? 144} /> : <span aria-hidden="true">{casino.name.slice(0, 2).toUpperCase()}</span>}</div>
      <div><p>Published review</p><h2><Link href={`/casino/${casino.slug}`}>{casino.name}</Link></h2>{freshness && <small>Editorial check {freshness}</small>}</div>
      {casino.rating !== null && <div aria-label={`Editorial score ${casino.rating.toFixed(1)} out of 10`} className={styles.score}><strong>{casino.rating.toFixed(1)}</strong><span>/10</span></div>}
    </div>
    {casino.shortDescription && <p className={styles.description}>{casino.shortDescription}</p>}
    <div className={styles.cardFacts}>
      <div><span>Licence</span><Tags>{casino.licenses.slice(0, 3).map((item) => <b key={item.key}>{item.label}</b>)}</Tags></div>
      <div><span>Published markets</span><Tags>{casino.countries.slice(0, 3).map((item) => <b key={item.key}>{item.label}</b>)}</Tags></div>
      <div><span>Payments</span><Tags>{casino.paymentMethods.slice(0, 3).map((item) => <b key={item.key}>{item.label}</b>)}</Tags></div>
    </div>
    {casino.highlights.length > 0 && <ul className={styles.highlights}>{casino.highlights.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul>}
    <div className={styles.offerBlock}>
      {casino.featuredBonus ? <><span>Published bonus terms</span><strong>{casino.featuredBonus.title}</strong>{casino.featuredBonus.summary && <p>{casino.featuredBonus.summary}</p>}<Tags>{casino.featuredBonus.keyTerms.slice(0, 3).map((term) => <b key={term}>{term}</b>)}</Tags><small>18+ · Terms apply</small></> : <><span>Bonus status</span><p>No active public bonus is attached to this review.</p></>}
    </div>
    <p className={styles.commission}>SevenBet may receive a commission if you use an eligible visit link. Rankings and editorial reviews remain independently governed.</p>
    {unavailable && <p className={styles.unavailable} role="note">{unavailable} The published review remains available.</p>}
    <div className={styles.cardActions}><Link href={`/casino/${casino.slug}`}>Read review</Link>{canVisit && <a href={`/r/${casino.visitAction.redirectSlug}`} rel="nofollow sponsored noopener" target="_blank">{casino.visitAction.label}</a>}</div>
  </article>;
}

export function FeaturedCasinoReview({ casino }: { casino: PublicCasinoCardDto | undefined }) {
  if (!casino) return <div className={styles.featurePlaceholder}><span>Published directory</span><strong>Reviews appear only after editorial publication.</strong><p>No placeholder casino or promotional claim is substituted.</p></div>;
  return <article className={styles.featureCard}>
    <div className={styles.featureTop}><span>Featured published review</span>{casino.rating !== null && <strong>{casino.rating.toFixed(1)}<small>/10</small></strong>}</div>
    <h2>{casino.name}</h2><p>{casino.shortDescription ?? "Open the full review for published evidence, terms and responsible gambling information."}</p>
    <Tags>{casino.licenses.slice(0, 2).map((item) => <b key={item.key}>{item.label}</b>)}{casino.categories.slice(0, 2).map((item) => <b key={item.key}>{item.label}</b>)}</Tags>
    <Link href={`/casino/${casino.slug}`}>Read the review <span aria-hidden="true">→</span></Link>
  </article>;
}

export function DiscoveryResults({ result }: { result: CasinoDiscoveryResult }) {
  const firstPosition = (result.page - 1) * result.pageSize + 1;
  const noVisitActions = result.items.length > 0 && result.items.every((casino) => !casino.visitAction.available);
  return <div className={styles.results} id="casino-results">
    <div className={styles.resultsHeader}><div><span>Published directory</span><h2>{result.total} {result.total === 1 ? "casino review" : "casino reviews"}</h2></div><p aria-live="polite" role="status">Page {result.page} of {result.pageCount}</p></div>
    {noVisitActions && <div className={styles.reviewOnlyNotice} role="note"><strong>Review-only results</strong><span>No governed visit action is available for this result set. Reviews and public evidence remain accessible.</span></div>}
    {result.items.length ? <div className={styles.cards}>{result.items.map((casino, index) => <CasinoDiscoveryCard casino={casino} key={casino.id} position={firstPosition + index} />)}</div> : <div className={styles.emptyState}><span>No matches</span><h2>No published reviews match these controls.</h2><p>Remove a filter or try a broader search. Nothing has been substituted from draft or private data.</p><Link href="/casinos">Reset the directory</Link></div>}
    {result.pageCount > 1 && <nav aria-label="Casino results pagination" className={styles.pagination}>{result.page === 1 ? <span aria-disabled="true">Previous</span> : <Link href={discoveryHref(result.appliedFilters, { page: result.page - 1 })}>Previous</Link>}<b>Page {result.page} of {result.pageCount}</b>{result.page === result.pageCount ? <span aria-disabled="true">Next</span> : <Link href={discoveryHref(result.appliedFilters, { page: result.page + 1 })}>Next</Link>}</nav>}
  </div>;
}
