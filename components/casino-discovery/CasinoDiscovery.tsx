import Link from "next/link";

import { Badge, Button, Card } from "@/components/ui";
import { discoveryHref } from "@/lib/public-casino-discovery/query";
import type { CasinoDiscoveryFacetValue, CasinoDiscoveryQuery, CasinoDiscoveryResult, PublicCasinoCardDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";

const sortLabels = { FEATURED: "Featured", RELEVANCE: "Relevance", NEWEST: "Newest", NAME_ASC: "Name A–Z", NAME_DESC: "Name Z–A" } as const;

function FilterGroup({ legend, name, values, selected }: { legend: string; name: string; values: CasinoDiscoveryFacetValue[]; selected: string[] }) {
  if (!values.length) return null;
  return (
    <fieldset className="discoveryFilterGroup">
      <legend>{legend}</legend>
      {values.slice(0, 12).map((value) => (
        <label key={value.key}>
          <input defaultChecked={selected.includes(value.key)} name={name} type="checkbox" value={value.key} />
          <span>{value.label}</span><small>{value.count}</small>
        </label>
      ))}
    </fieldset>
  );
}

function HiddenFilters({ query, except = [] }: { query: CasinoDiscoveryQuery; except?: string[] }) {
  const fields: Array<[keyof CasinoDiscoveryQuery, string]> = [["country", "country"], ["license", "license"], ["payment", "payment"], ["gameProvider", "gameProvider"], ["category", "category"], ["bonusType", "bonusType"]];
  return <>{fields.flatMap(([field, name]) => except.includes(name) ? [] : ((query[field] as string[] | undefined) ?? []).map((value) => <input key={`${name}-${value}`} name={name} type="hidden" value={value} />))}
    {(["hasBonus", "hasAvailableVisitAction", "supportsCrypto", "supportsMobile"] as const).map((name) => query[name] && !except.includes(name) ? <input key={name} name={name} type="hidden" value="true" /> : null)}
    {query.search && !except.includes("q") ? <input name="q" type="hidden" value={query.search} /> : null}</>;
}

function CasinoDiscoveryCard({ casino }: { casino: PublicCasinoCardDto }) {
  return (
    <Card className="discoveryCard">
      <div className="discoveryLogo">
        {casino.logo ? <img alt={casino.logo.alt} height={casino.logo.height ?? 72} loading="lazy" src={casino.logo.url} width={casino.logo.width ?? 144} /> : <span aria-hidden="true">{casino.name.slice(0, 2).toUpperCase()}</span>}
      </div>
      <div className="discoveryCardMain">
        <div className="cardTopline"><h2><Link href={`/casino/${casino.slug}`}>{casino.name}</Link></h2>{casino.rating !== null && <Badge tone="green">{casino.rating.toFixed(1)}/10</Badge>}</div>
        {casino.shortDescription && <p className="muted">{casino.shortDescription}</p>}
        <div className="chips">
          {casino.licenses.slice(0, 2).map((item) => <Badge key={item.key}>{item.label}</Badge>)}
          {casino.categories.slice(0, 2).map((item) => <Badge key={item.key} tone="dark">{item.label}</Badge>)}
          {casino.paymentMethods.slice(0, 2).map((item) => <Badge key={item.key}>{item.label}</Badge>)}
        </div>
        {casino.highlights.length > 0 && <ul className="discoveryHighlights">{casino.highlights.map((item) => <li key={item}>{item}</li>)}</ul>}
      </div>
      <div className="discoveryCommercial">
        {casino.featuredBonus ? <div className="discoveryBonus"><span>{casino.featuredBonus.type.replaceAll("_", " ")}</span><strong>{casino.featuredBonus.title}</strong><small>{casino.featuredBonus.summary}</small><em>18+ · Terms apply</em></div> : <p className="muted">No active public bonus</p>}
        <div className="cardActions">
          <Button href={`/casino/${casino.slug}`} variant="ghost">View details</Button>
          {casino.visitAction.available && casino.visitAction.redirectSlug ? <Button external href={`/r/${casino.visitAction.redirectSlug}`} rel="nofollow sponsored noopener" variant="primary">{casino.visitAction.label}</Button> : null}
        </div>
        <small className="commercialNotice">SevenBet may receive a commission. Gambling involves risk.</small>
      </div>
    </Card>
  );
}

function removeValue(query: CasinoDiscoveryQuery, field: keyof CasinoDiscoveryQuery, value?: string) {
  if (value === undefined) return discoveryHref(query, { [field]: undefined, page: 1 });
  return discoveryHref(query, { [field]: ((query[field] as string[] | undefined) ?? []).filter((entry) => entry !== value), page: 1 });
}

export function ActiveDiscoveryFilters({ query }: { query: CasinoDiscoveryQuery }) {
  const chips: Array<{ label: string; href: string }> = [];
  if (query.search) chips.push({ label: `Search: ${query.search}`, href: removeValue(query, "search") });
  for (const field of ["country", "license", "payment", "gameProvider", "category", "bonusType"] as const) for (const value of query[field] ?? []) chips.push({ label: value.replaceAll("_", " "), href: removeValue(query, field, value) });
  for (const [field, label] of [["hasBonus", "Active bonus"], ["hasAvailableVisitAction", "Visit available"], ["supportsCrypto", "Crypto"], ["supportsMobile", "Mobile"]] as const) if (query[field]) chips.push({ label, href: removeValue(query, field) });
  if (!chips.length) return null;
  return <div aria-label="Active filters" className="activeFilterChips">{chips.map((chip) => <Link className="activeFilterChip" href={chip.href} key={`${chip.label}-${chip.href}`}>{chip.label}<span aria-hidden="true">×</span><span className="srOnly">Remove filter</span></Link>)}<Link className="clearFilters" href="/casinos">Clear all</Link></div>;
}

export function DiscoveryControls({ result }: { result: CasinoDiscoveryResult }) {
  const query = result.appliedFilters;
  return (
    <form action="/casinos" className="discoveryForm" method="get">
      <div className="discoverySearch">
        <label htmlFor="casino-search">Search casinos</label>
        <div><input defaultValue={query.search ?? ""} id="casino-search" maxLength={100} name="q" placeholder="Name, alias, domain, license…" type="search" /><button className="button gold" type="submit">Search</button></div>
      </div>
      <div className="discoveryFilters">
        <input className="discoveryFilterToggle" id="casino-filter-toggle" type="checkbox" />
        <label aria-controls="casino-filter-panel" className="discoveryFilterSummary" htmlFor="casino-filter-toggle"><span>Filters</span><span aria-hidden="true">Refine results</span></label>
        <div className="discoveryFilterPanel" id="casino-filter-panel">
          <FilterGroup legend="Country" name="country" selected={query.country ?? []} values={result.facets.countries} />
          <FilterGroup legend="License" name="license" selected={query.license ?? []} values={result.facets.licenses} />
          <FilterGroup legend="Payment method" name="payment" selected={query.payment ?? []} values={result.facets.payments} />
          <FilterGroup legend="Game provider" name="gameProvider" selected={query.gameProvider ?? []} values={result.facets.gameProviders} />
          <FilterGroup legend="Category" name="category" selected={query.category ?? []} values={result.facets.categories} />
          <FilterGroup legend="Bonus type" name="bonusType" selected={query.bonusType ?? []} values={result.facets.bonusTypes} />
          <fieldset className="discoveryFilterGroup"><legend>Availability</legend>
            {[["hasBonus", "Active bonus"], ["hasAvailableVisitAction", "Visit action available"], ["supportsCrypto", "Cryptocurrency support"], ["supportsMobile", "Mobile support"]].map(([name, label]) => <label key={name}><input defaultChecked={Boolean(query[name as keyof CasinoDiscoveryQuery])} name={name} type="checkbox" value="true" /><span>{label}</span></label>)}
          </fieldset>
          <button className="button gold" type="submit">Apply filters</button>
        </div>
      </div>
      <div className="discoverySort">
        <label htmlFor="casino-sort">Sort by</label>
        <select defaultValue={query.sort} id="casino-sort" name="sort">{Object.entries(sortLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <button className="button ghost" type="submit">Apply</button>
      </div>
    </form>
  );
}

export function DiscoveryResults({ result }: { result: CasinoDiscoveryResult }) {
  return <div className="discoveryResults" id="casino-results"><p aria-live="polite" className="resultsAnnouncement" role="status">{result.total} {result.total === 1 ? "casino" : "casinos"} found</p>
    {result.items.length ? <div className="discoveryCards">{result.items.map((casino) => <CasinoDiscoveryCard casino={casino} key={casino.id} />)}</div> : <Card className="discoveryEmpty"><h2>No casinos match these filters</h2><p>Try clearing the search or one of the selected filters.</p><Button href="/casinos" variant="primary">Clear filters</Button></Card>}
    {result.pageCount > 1 && <nav aria-label="Casino results pagination" className="pagination"><Link aria-disabled={result.page === 1} className={result.page === 1 ? "disabled" : ""} href={discoveryHref(result.appliedFilters, { page: Math.max(1, result.page - 1) })}>Previous</Link><span>Page {result.page} of {result.pageCount}</span><Link aria-disabled={result.page === result.pageCount} className={result.page === result.pageCount ? "disabled" : ""} href={discoveryHref(result.appliedFilters, { page: Math.min(result.pageCount, result.page + 1) })}>Next</Link></nav>}
  </div>;
}
