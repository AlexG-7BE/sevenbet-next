import Link from "next/link";

import { InstantDiscoveryForm } from "@/components/discovery/InstantDiscoveryForm";
import { discoveryHref } from "@/lib/public-casino-discovery/query";
import type { CasinoDiscoveryFacetValue, CasinoDiscoveryQuery, CasinoDiscoveryResult, PublicCasinoCardDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";

import { CasinoDiscoveryCardMarkup, DirectoryFeaturedTheatreMarkup, type CasinoCardClassNames } from "./CasinoDiscoveryCard";
import { MobileCasinoFilters } from "./MobileCasinoFilters";
import styles from "./CasinoDiscovery.module.css";

const sortLabels = { FEATURED: "Featured", RELEVANCE: "Relevance", NEWEST: "Newest", NAME_ASC: "Name A–Z", NAME_DESC: "Name Z–A" } as const;
const pageSizes = [12, 24, 48] as const;
const arrayFields = [["country", "country"], ["license", "license"], ["payment", "payment"], ["gameProvider", "gameProvider"], ["category", "category"], ["bonusType", "bonusType"]] as const;
const booleanFields = [["hasBonus", "Published bonus"], ["hasAvailableVisitAction", "Visit action available"], ["hasResponsibleGambling", "Responsible gambling information"], ["supportsCrypto", "Cryptocurrency support"], ["supportsMobile", "Mobile support"]] as const;
const cardClassNames = styles as unknown as CasinoCardClassNames;

function HiddenQuery({ query, except = [] }: { query: CasinoDiscoveryQuery; except?: string[] }) {
  return <>
    {arrayFields.flatMap(([field, name]) => except.includes(name) ? [] : (query[field] ?? []).map((value) => <input key={`${name}-${value}`} name={name} type="hidden" value={value} />))}
    {booleanFields.map(([name]) => query[name] && !except.includes(name) ? <input key={name} name={name} type="hidden" value="true" /> : null)}
    {query.search && !except.includes("q") ? <input name="q" type="hidden" value={query.search} /> : null}
    {query.sort && !except.includes("sort") ? <input name="sort" type="hidden" value={query.sort} /> : null}
    {query.pageSize && !except.includes("pageSize") ? <input name="pageSize" type="hidden" value={query.pageSize} /> : null}
  </>;
}

function FilterSelect({ label, name, values, selected }: { label: string; name: string; values: CasinoDiscoveryFacetValue[]; selected: string[] }) {
  if (!values.length) return null;
  return <label className={styles.filterSelect}><span>{label}</span><select defaultValue={selected[0] ?? ""} name={name}><option value="">Any</option>{values.slice(0, 24).map((value) => <option key={value.key} value={value.key}>{value.label} · {value.count}</option>)}</select></label>;
}

function BooleanSelect({ active, label, name }: { active: boolean; label: string; name: string }) {
  return <label className={styles.filterSelect}><span>{label}</span><select defaultValue={active ? "true" : ""} name={name}><option value="">Any</option><option value="true">Required</option></select></label>;
}

function FilterFields({ result }: { result: CasinoDiscoveryResult }) {
  const query = result.appliedFilters;
  return <div className={styles.filterGrid}>
    <FilterSelect label="Market preference" name="country" selected={query.country ?? []} values={result.facets.countries} />
    <FilterSelect label="Licence" name="license" selected={query.license ?? []} values={result.facets.licenses} />
    <FilterSelect label="Payment method" name="payment" selected={query.payment ?? []} values={result.facets.payments} />
    <FilterSelect label="Game provider" name="gameProvider" selected={query.gameProvider ?? []} values={result.facets.gameProviders} />
    <FilterSelect label="Category" name="category" selected={query.category ?? []} values={result.facets.categories} />
    <FilterSelect label="Bonus type" name="bonusType" selected={query.bonusType ?? []} values={result.facets.bonusTypes} />
    <BooleanSelect active={Boolean(query.hasBonus)} label="Published bonus" name="hasBonus" />
    <BooleanSelect active={Boolean(query.hasAvailableVisitAction)} label="Visit availability" name="hasAvailableVisitAction" />
    <BooleanSelect active={Boolean(query.hasResponsibleGambling)} label="Responsible gambling" name="hasResponsibleGambling" />
    <BooleanSelect active={Boolean(query.supportsCrypto)} label="Cryptocurrency" name="supportsCrypto" />
    <BooleanSelect active={Boolean(query.supportsMobile)} label="Mobile support" name="supportsMobile" />
  </div>;
}

function activeFilterCount(query: CasinoDiscoveryQuery) {
  return (query.search ? 1 : 0) + arrayFields.reduce((count, [field]) => count + (query[field]?.length ?? 0), 0) + booleanFields.filter(([field]) => query[field]).length;
}

function FilterForm({ result, mobile = false }: { result: CasinoDiscoveryResult; mobile?: boolean }) {
  const query = result.appliedFilters;
  return <InstantDiscoveryForm action="/casinos" className={mobile ? styles.mobileFilterForm : styles.filterForm} key={`filters:${mobile}:${JSON.stringify(query)}`} pendingLabel="Updating casino results…">
    <HiddenQuery except={["country", "license", "payment", "gameProvider", "category", "bonusType", ...booleanFields.map(([name]) => name)]} query={query} />
    <div className={styles.filterPrompt}><span>Filters and sort</span><strong>Select the facts you want to compare.</strong></div>
    <FilterFields result={result} />
    <p className={styles.preferenceNote}><strong>Market preference, not location.</strong> Filters published market information; it does not confirm eligibility.</p>
    <div className={styles.filterActions}><div><strong>{result.total} {result.total === 1 ? "classified match" : "classified matches"}</strong><span>Server-classified review snapshots</span></div><Link href="/casinos">Reset all</Link><button type="submit">{mobile ? `Show ${result.total} results` : "Apply filters →"}</button></div>
  </InstantDiscoveryForm>;
}

function SearchForm({ result }: { result: CasinoDiscoveryResult }) {
  return <InstantDiscoveryForm action="/casinos" className={styles.searchForm} debouncedFields={["q"]} key={`search:${JSON.stringify(result.appliedFilters)}`} pendingLabel="Updating casino results…"><HiddenQuery except={["q"]} query={result.appliedFilters} /><label className={styles.srOnly} htmlFor="casino-search">Search published reviews</label><input defaultValue={result.appliedFilters.search ?? ""} id="casino-search" maxLength={100} name="q" placeholder="Search casino, licence, payment…" type="search" /><button aria-label="Search" type="submit">→</button></InstantDiscoveryForm>;
}

function SortForm({ result }: { result: CasinoDiscoveryResult }) {
  const query = result.appliedFilters;
  return <InstantDiscoveryForm action="/casinos" className={styles.sortForm} key={`sort:${JSON.stringify(query)}`} pendingLabel="Updating casino results…"><HiddenQuery except={["sort", "pageSize"]} query={query} /><label><span>Sort</span><select aria-label="Sort by" defaultValue={query.sort} name="sort">{Object.entries(sortLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label><span>Show</span><select aria-label="Show" defaultValue={query.pageSize} name="pageSize">{pageSizes.map((size) => <option key={size} value={size}>{size} per page</option>)}</select></label><button type="submit">Update</button></InstantDiscoveryForm>;
}

export function DiscoveryControls({ result }: { result: CasinoDiscoveryResult }) {
  const count = activeFilterCount(result.appliedFilters);
  return <div className={styles.controls}>
    <div className={styles.commandHeader}><SearchForm result={result} /><SortForm result={result} /><div className={styles.activeCount}><strong>{count} active</strong><span>{count ? "Filters applied" : "All published reviews"}</span></div></div>
    <div className={styles.desktopFilters}><FilterForm result={result} /></div>
    <div className={styles.mobileControls}><MobileCasinoFilters activeCount={count}><FilterForm mobile result={result} /></MobileCasinoFilters></div>
    <noscript><details className={styles.noScriptFilters}><summary>Filters{count ? ` (${count})` : ""}</summary><FilterForm mobile result={result} /></details></noscript>
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

export function CasinoDiscoveryCard({ casino, position }: { casino: PublicCasinoCardDto; position: number }) {
  return <CasinoDiscoveryCardMarkup casino={casino} classNames={cardClassNames} position={position} />;
}

export function DirectoryFeaturedTheatre({ casino }: { casino: PublicCasinoCardDto | undefined }) {
  return <DirectoryFeaturedTheatreMarkup casino={casino} classNames={cardClassNames} />;
}

export function DiscoveryResults({ result }: { result: CasinoDiscoveryResult }) {
  const firstPosition = (result.page - 1) * result.pageSize + 1;
  const noVisitActions = result.items.length > 0 && result.items.every((casino) => !casino.visitAction.available);
  return <div className={styles.results} id="casino-results">
    <div className={styles.resultsHeader}><div><span>Casino directory</span><h2>{result.total} {result.total === 1 ? "review record" : "review records"}</h2></div><p aria-atomic="true" aria-live="polite" role="status">{result.total} {result.total === 1 ? "result" : "results"} · Page {result.page} of {result.pageCount}</p></div>
    {noVisitActions && <div className={styles.reviewOnlyNotice} role="note"><strong>Reviews remain available.</strong><span>Commercial actions stay hidden until offer and internal redirect eligibility pass.</span></div>}
    {result.items.length ? <div className={styles.cards}>{result.items.map((casino, index) => <CasinoDiscoveryCard casino={casino} key={casino.id} position={firstPosition + index} />)}</div> : <div className={styles.emptyState}><span>No matches</span><h2>No published reviews match these controls.</h2><p>Remove one or more filters or clear the search. SevenBet will not fill the gap with ineligible operators.</p><Link href="/casinos">Clear filters</Link></div>}
    {result.pageCount > 1 && <nav aria-label="Casino results pagination" className={styles.pagination}>{result.page === 1 ? <span aria-disabled="true">Previous</span> : <Link href={discoveryHref(result.appliedFilters, { page: result.page - 1 })}>Previous</Link>}<b>Page {result.page} of {result.pageCount}</b>{result.page === result.pageCount ? <span aria-disabled="true">Next</span> : <Link href={discoveryHref(result.appliedFilters, { page: result.page + 1 })}>Next</Link>}</nav>}
  </div>;
}
