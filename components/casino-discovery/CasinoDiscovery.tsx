import Link from "next/link";

import { DirectoryFilterSurface } from "@/components/directory-filters/DirectoryFilterSurface";
import filterStyles from "@/components/directory-filters/DirectoryFilterSurface.module.css";
import { DirectoryPagination } from "@/components/directory-pagination/DirectoryPagination";
import { InstantDiscoveryForm } from "@/components/discovery/InstantDiscoveryForm";
import { discoveryHref } from "@/lib/public-casino-discovery/query";
import type { CasinoDiscoveryFacetValue, CasinoDiscoveryQuery, CasinoDiscoveryResult, PublicCasinoCardDto } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import { formatProductMessage, type ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";

import { CasinoDiscoveryCardMarkup, DirectoryFeaturedTheatreMarkup, type CasinoCardClassNames } from "./CasinoDiscoveryCard";
import { MobileCasinoFilters } from "./MobileCasinoFilters";
import styles from "./CasinoDiscovery.module.css";

const sortValues = ["FEATURED", "RELEVANCE", "NEWEST", "NAME_ASC", "NAME_DESC"] as const;
const pageSizes = [12, 24, 48] as const;
const arrayFields = [["currency", "currency"], ["license", "license"], ["payment", "payment"], ["gameProvider", "gameProvider"], ["category", "category"], ["bonusType", "bonusType"]] as const;
const booleanFields = [["hasBonus", "Published bonus"], ["hasAvailableVisitAction", "Visit action available"], ["hasResponsibleGambling", "Responsible gambling information"], ["supportsCrypto", "Cryptocurrency support"], ["supportsMobile", "Mobile support"]] as const;
const cardClassNames = styles as unknown as CasinoCardClassNames;

function HiddenQuery({ query, except = [] }: { query: CasinoDiscoveryQuery; except?: string[] }) {
  return <>
    {arrayFields.flatMap(([field, name]) => except.includes(name) ? [] : (query[field] ?? []).map((value) => <input key={`${name}-${value}`} name={name} type="hidden" value={value} />))}
    {booleanFields.map(([name]) => query[name] && !except.includes(name) ? <input key={name} name={name} type="hidden" value="true" /> : null)}
    {query.search && !except.includes("q") ? <input name="q" type="hidden" value={query.search} /> : null}
    {query.sort && !except.includes("sort") ? <input name="sort" type="hidden" value={query.sort} /> : null}
    {query.pageSize && !except.includes("pageSize") ? <input name="pageSize" type="hidden" value={query.pageSize} /> : null}
    {query.visualFixture && !except.includes("visualFixture") ? <input name="visualFixture" type="hidden" value="true" /> : null}
  </>;
}

function FilterSelect({ className = styles.filterSelect, emptyLabel, label, name, values, selected }: { className?: string; emptyLabel: string; label: string; name: string; values: CasinoDiscoveryFacetValue[]; selected: string[] }) {
  return <label className={className}><span>{label}</span><select defaultValue={selected[0] ?? ""} name={name}><option value="">{emptyLabel}</option>{values.slice(0, 24).map((value) => <option key={value.key} value={value.key}>{value.label} · {value.count}</option>)}</select></label>;
}

function BooleanSelect({ active, activeLabel, className = styles.filterSelect, emptyLabel, label, name }: { active: boolean; activeLabel: string; className?: string; emptyLabel: string; label: string; name: string }) {
  return <label className={className}><span>{label}</span><select defaultValue={active ? "true" : ""} name={name}><option value="">{emptyLabel}</option><option value="true">{activeLabel}</option></select></label>;
}

function FilterFields({ result, messages }: { result: CasinoDiscoveryResult; messages: ProductPageMessages }) {
  const query = result.appliedFilters;
  return <div className={styles.filterGrid}>
    <FilterSelect emptyLabel="Currency" label="Currency" name="currency" selected={query.currency ?? []} values={result.facets.currencies} />
    <FilterSelect emptyLabel={messages.common.licence} label={messages.common.licence} name="license" selected={query.license ?? []} values={result.facets.licenses} />
    <FilterSelect emptyLabel={messages.common.paymentMethods} label={messages.common.paymentMethods} name="payment" selected={query.payment ?? []} values={result.facets.payments} />
    <FilterSelect emptyLabel={messages.profile.providers} label={messages.profile.providers} name="gameProvider" selected={query.gameProvider ?? []} values={result.facets.gameProviders} />
    <FilterSelect emptyLabel={messages.profile.games} label={messages.profile.games} name="category" selected={query.category ?? []} values={result.facets.categories} />
    <FilterSelect emptyLabel={messages.common.bonusType} label={messages.common.bonusType} name="bonusType" selected={query.bonusType ?? []} values={result.facets.bonusTypes} />
    <BooleanSelect active={Boolean(query.hasBonus)} activeLabel={messages.common.supported} emptyLabel={messages.common.bonusAvailability} label={messages.common.bonusAvailability} name="hasBonus" />
    <BooleanSelect active={Boolean(query.hasAvailableVisitAction)} activeLabel={messages.common.actionAvailable} emptyLabel={messages.common.visitAvailability} label={messages.common.visitAvailability} name="hasAvailableVisitAction" />
    <BooleanSelect active={Boolean(query.hasResponsibleGambling)} activeLabel={messages.common.supported} emptyLabel={messages.common.saferGamblingInformation} label={messages.common.saferGamblingInformation} name="hasResponsibleGambling" />
    <BooleanSelect active={Boolean(query.supportsCrypto)} activeLabel={messages.common.cryptoSupported} emptyLabel={messages.common.cryptoSupport} label={messages.common.cryptoSupport} name="supportsCrypto" />
    <BooleanSelect active={Boolean(query.supportsMobile)} activeLabel={messages.common.supported} emptyLabel={messages.common.mobileSupport} label={messages.common.mobileSupport} name="supportsMobile" />
  </div>;
}

function PrimaryFilterFields({ result, messages }: { result: CasinoDiscoveryResult; messages: ProductPageMessages }) {
  const query = result.appliedFilters;
  return <div className={filterStyles.primaryGrid}>
    <FilterSelect className={filterStyles.field} emptyLabel="Currency" label="Currency" name="currency" selected={query.currency ?? []} values={result.facets.currencies} />
    <FilterSelect className={filterStyles.field} emptyLabel={messages.common.licence} label={messages.common.licence} name="license" selected={query.license ?? []} values={result.facets.licenses} />
    <FilterSelect className={filterStyles.field} emptyLabel={messages.common.paymentMethods} label={messages.common.paymentMethods} name="payment" selected={query.payment ?? []} values={result.facets.payments} />
    <FilterSelect className={filterStyles.field} emptyLabel={messages.common.bonusType} label={messages.common.bonusType} name="bonusType" selected={query.bonusType ?? []} values={result.facets.bonusTypes} />
  </div>;
}

function SecondaryFilterFields({ result, messages }: { result: CasinoDiscoveryResult; messages: ProductPageMessages }) {
  const query = result.appliedFilters;
  const sortLabels = [messages.common.featured, messages.common.relevance, messages.common.newest, messages.common.nameAscending, messages.common.nameDescending];
  return <div className={filterStyles.drawerGrid}>
    <FilterSelect className={filterStyles.drawerField} emptyLabel={messages.profile.providers} label={messages.profile.providers} name="gameProvider" selected={query.gameProvider ?? []} values={result.facets.gameProviders} />
    <FilterSelect className={filterStyles.drawerField} emptyLabel={messages.profile.games} label={messages.profile.games} name="category" selected={query.category ?? []} values={result.facets.categories} />
    <BooleanSelect active={Boolean(query.hasBonus)} activeLabel={messages.common.supported} className={filterStyles.drawerField} emptyLabel={messages.common.bonusAvailability} label={messages.common.bonusAvailability} name="hasBonus" />
    <BooleanSelect active={Boolean(query.hasAvailableVisitAction)} activeLabel={messages.common.actionAvailable} className={filterStyles.drawerField} emptyLabel={messages.common.visitAvailability} label={messages.common.visitAvailability} name="hasAvailableVisitAction" />
    <BooleanSelect active={Boolean(query.hasResponsibleGambling)} activeLabel={messages.common.supported} className={filterStyles.drawerField} emptyLabel={messages.common.saferGamblingInformation} label={messages.common.saferGamblingInformation} name="hasResponsibleGambling" />
    <BooleanSelect active={Boolean(query.supportsCrypto)} activeLabel={messages.common.cryptoSupported} className={filterStyles.drawerField} emptyLabel={messages.common.cryptoSupport} label={messages.common.cryptoSupport} name="supportsCrypto" />
    <BooleanSelect active={Boolean(query.supportsMobile)} activeLabel={messages.common.supported} className={filterStyles.drawerField} emptyLabel={messages.common.mobileSupport} label={messages.common.mobileSupport} name="supportsMobile" />
    <label className={filterStyles.drawerField}><span>{messages.common.sortResults}</span><select defaultValue={query.sort} name="sort">{sortValues.map((value, index) => <option key={value} value={value}>{sortLabels[index]}</option>)}</select></label>
    <label className={filterStyles.drawerField}><span>{messages.common.resultsPerPage}</span><select defaultValue={query.pageSize} name="pageSize">{pageSizes.map((size) => <option key={size} value={size}>{size}</option>)}</select></label>
  </div>;
}

function activeFilterCount(query: CasinoDiscoveryQuery) {
  return (query.search ? 1 : 0) + arrayFields.reduce((count, [field]) => count + (query[field]?.length ?? 0), 0) + booleanFields.filter(([field]) => query[field]).length;
}

function FilterForm({ result, messages, presentation, mobile = false, noScript = false }: { result: CasinoDiscoveryResult; messages: ProductPageMessages; presentation: PresentationResolution; mobile?: boolean; noScript?: boolean }) {
  const query = result.appliedFilters;
  return <InstantDiscoveryForm action={productHref(presentation, "/casinos")} className={mobile ? styles.mobileFilterForm : styles.filterForm} key={`filters:${mobile}:${JSON.stringify(query)}`} pendingLabel={messages.common.updatingResults}>
    <HiddenQuery except={["country", "currency", "license", "payment", "gameProvider", "category", "bonusType", ...booleanFields.map(([name]) => name)]} query={query} />
    <div className={styles.filterPrompt}><span>{messages.common.allFilters}</span><strong>{messages.comparison.subtitle}</strong></div>
    <FilterFields messages={messages} result={result} />
    <p className={styles.preferenceNote}>{messages.common.marketPresentationNotice}</p>
    <div className={styles.filterActions}><div><strong>{result.total} {result.total === 1 ? messages.common.result : messages.common.results}</strong><span>{messages.common.updatingResults}</span></div>{noScript ? <button type="submit">{messages.common.applyFilters}</button> : null}</div>
  </InstantDiscoveryForm>;
}

function PrimaryFilterForm({ result, messages, presentation }: { result: CasinoDiscoveryResult; messages: ProductPageMessages; presentation: PresentationResolution }) {
  const query = result.appliedFilters;
  return <InstantDiscoveryForm action={productHref(presentation, "/casinos")} className={filterStyles.primaryForm} key={`casino-primary:${JSON.stringify(query)}`} pendingLabel={messages.common.updatingResults}>
    <HiddenQuery except={["currency", "license", "payment", "bonusType"]} query={query} />
    <PrimaryFilterFields messages={messages} result={result} />
  </InstantDiscoveryForm>;
}

function SecondaryFilterForm({ result, messages, presentation }: { result: CasinoDiscoveryResult; messages: ProductPageMessages; presentation: PresentationResolution }) {
  const query = result.appliedFilters;
  return <InstantDiscoveryForm action={productHref(presentation, "/casinos")} className={filterStyles.drawerForm} key={`casino-secondary:${JSON.stringify(query)}`} pendingLabel={messages.common.updatingResults}>
    <HiddenQuery except={["gameProvider", "category", ...booleanFields.map(([name]) => name), "sort", "pageSize"]} query={query} />
    <SecondaryFilterFields messages={messages} result={result} />
    <div className={filterStyles.drawerFooter}><Link href={productHref(presentation, "/casinos")}>{messages.common.clearAll}</Link><span>{messages.common.updatingResults}</span></div>
  </InstantDiscoveryForm>;
}

export function DiscoveryControls({ result, messages, presentation }: { result: CasinoDiscoveryResult; messages: ProductPageMessages; presentation: PresentationResolution }) {
  const count = activeFilterCount(result.appliedFilters);
  return <>
    <div className={styles.desktopFilters}>
      <DirectoryFilterSurface
        activeCount={count}
        dialogId="casino-all-filters-dialog"
        labels={{ allFilters: messages.common.allFilters, directoryControls: messages.common.directoryControls, closeFilters: messages.common.closeFilters }}
        note={messages.common.marketPresentationNotice}
        primary={<PrimaryFilterForm messages={messages} presentation={presentation} result={result} />}
        secondary={<SecondaryFilterForm messages={messages} presentation={presentation} result={result} />}
        summary={`${result.total} ${result.total === 1 ? messages.common.record : messages.common.records}`}
        title={messages.casinos.filterTitle}
      />
    </div>
    <div className={styles.mobileControls}><MobileCasinoFilters activeCount={count} messages={messages}><FilterForm messages={messages} mobile presentation={presentation} result={result} /></MobileCasinoFilters></div>
    <noscript><details className={styles.noScriptFilters}><summary>{messages.common.filters}{count ? ` (${count})` : ""}</summary><FilterForm messages={messages} mobile noScript presentation={presentation} result={result} /></details></noscript>
  </>;
}

function removeValue(query: CasinoDiscoveryQuery, field: keyof CasinoDiscoveryQuery, value?: string) {
  if (value === undefined) return discoveryHref(query, { [field]: undefined, page: 1 });
  return discoveryHref(query, { [field]: ((query[field] as string[] | undefined) ?? []).filter((entry) => entry !== value), page: 1 });
}

function facetLabels(result: CasinoDiscoveryResult) {
  const values: Record<string, Map<string, string>> = {};
  for (const [field, facet] of [["currency", result.facets.currencies], ["license", result.facets.licenses], ["payment", result.facets.payments], ["gameProvider", result.facets.gameProviders], ["category", result.facets.categories], ["bonusType", result.facets.bonusTypes]] as const) values[field] = new Map(facet.map((item) => [item.key, item.label]));
  return values;
}

function booleanFilterLabel(field: (typeof booleanFields)[number][0], messages: ProductPageMessages) {
  if (field === "hasBonus") return messages.common.bonusAvailability;
  if (field === "hasAvailableVisitAction") return messages.common.visitAvailability;
  if (field === "hasResponsibleGambling") return messages.common.saferGamblingInformation;
  if (field === "supportsCrypto") return messages.common.cryptoSupport;
  return messages.common.mobileSupport;
}

export function ActiveDiscoveryFilters({ result, messages, presentation }: { result: CasinoDiscoveryResult; messages: ProductPageMessages; presentation: PresentationResolution }) {
  const query = result.appliedFilters;
  const labels = facetLabels(result);
  const chips: Array<{ label: string; context: string; href: string }> = [];
  if (query.search) chips.push({ label: `“${query.search}”`, context: "search", href: removeValue(query, "search") });
  for (const [field] of arrayFields) for (const value of query[field] ?? []) chips.push({ label: labels[field]?.get(value) ?? value.replaceAll("_", " "), context: field, href: removeValue(query, field, value) });
  for (const [field] of booleanFields) if (query[field]) chips.push({ label: booleanFilterLabel(field, messages), context: "availability", href: removeValue(query, field) });
  if (!chips.length) return null;
  return <div aria-label={messages.common.activeFilters} className={styles.activeFilters} data-active-filter-state="casinos">{chips.map((chip) => <Link aria-label={`${messages.comparison.remove} ${chip.label}`} href={productHref(presentation, chip.href)} key={`${chip.context}-${chip.label}`}><span>{chip.label}</span><b aria-hidden="true">×</b></Link>)}{result.total > 0 ? <Link className={styles.clearAll} data-empty-reset href={productHref(presentation, "/casinos")}>{messages.common.clearAll}</Link> : null}</div>;
}

export function CasinoDiscoveryCard({ casino, position, messages, presentation }: { casino: PublicCasinoCardDto; position: number; messages: ProductPageMessages; presentation: PresentationResolution }) {
  return <CasinoDiscoveryCardMarkup casino={casino} classNames={cardClassNames} messages={messages} position={position} presentation={presentation} />;
}

export function DirectoryFeaturedTheatre({ casino, messages, presentation }: { casino: PublicCasinoCardDto | undefined; messages: ProductPageMessages; presentation: PresentationResolution }) {
  return <DirectoryFeaturedTheatreMarkup casino={casino} classNames={cardClassNames} messages={messages} presentation={presentation} />;
}

export function DiscoveryResults({ result, messages, presentation }: { result: CasinoDiscoveryResult; messages: ProductPageMessages; presentation: PresentationResolution }) {
  const firstPosition = (result.page - 1) * result.pageSize + 1;
  const noVisitActions = result.items.length > 0 && result.items.every((casino) => !casino.visitAction.available);
  const hasActiveFilters = activeFilterCount(result.appliedFilters) > 0;
  return <div className={styles.results} data-result-count={result.total} id="casino-results">
    <div className={styles.resultsHeader}><div><span>{messages.casinos.directoryTitle}</span><h2>{result.total} {result.total === 1 ? messages.common.record : messages.common.records}</h2></div><p aria-atomic="true" aria-live="polite" role="status">{result.total} {result.total === 1 ? messages.common.result : messages.common.results} · {messages.common.pageOf.replace("{page}", String(result.page)).replace("{pages}", String(result.pageCount))}</p></div>
    {noVisitActions && <div className={styles.reviewOnlyNotice} role="note"><strong>{messages.common.reviewAvailableNoAction}</strong><span>{messages.casinos.reviewOnlyNotice}</span></div>}
    {result.items.length ? <div className={styles.cards}>{result.items.map((casino, index) => <CasinoDiscoveryCard casino={casino} key={casino.id} messages={messages} position={firstPosition + index} presentation={presentation} />)}</div> : hasActiveFilters ? <div className={styles.emptyState} data-public-empty-state="filtered" data-result-count="0"><span>{formatProductMessage(messages.casinos.noMatchesTitle, { market: presentation.marketDisplayName })}</span><h2>{formatProductMessage(messages.casinos.noMatchesTitle, { market: presentation.marketDisplayName })}</h2><p>{formatProductMessage(messages.casinos.noMatchesCopy, { market: presentation.marketDisplayName })}</p><Link data-empty-reset href={productHref(presentation, "/casinos")}>{messages.common.clearAll}</Link></div> : <div className={styles.emptyState} data-public-empty-state="unfiltered" data-result-count="0"><span>{messages.casinos.directoryTitle}</span><h2>{formatProductMessage(messages.casinos.noPublishedTitle, { market: presentation.marketDisplayName })}</h2></div>}
    <DirectoryPagination
      ariaLabel={messages.casinos.directoryTitle}
      currentPage={result.page}
      labels={{ previous: messages.common.previous, next: messages.common.next, pageOf: messages.common.pageOf }}
      nextHref={result.page < result.pageCount ? productHref(presentation, discoveryHref(result.appliedFilters, { page: result.page + 1 })) : null}
      pageCount={result.pageCount}
      previousHref={result.page > 1 ? productHref(presentation, discoveryHref(result.appliedFilters, { page: result.page - 1 })) : null}
    />
  </div>;
}
