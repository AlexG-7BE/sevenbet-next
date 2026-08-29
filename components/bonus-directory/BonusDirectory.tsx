import Link from "next/link";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { DirectoryFilterSurface } from "@/components/directory-filters/DirectoryFilterSurface";
import filterStyles from "@/components/directory-filters/DirectoryFilterSurface.module.css";
import { DirectoryPagination } from "@/components/directory-pagination/DirectoryPagination";
import { InstantDiscoveryForm } from "@/components/discovery/InstantDiscoveryForm";
import styles from "@/components/bonus-directory/BonusDirectory.module.css";
import { MobileBonusFilters } from "@/components/bonus-directory/MobileBonusFilters";
import type { PublicOfferDTO, PublicOfferFacets, PublicOfferQuery } from "@/lib/public-offer/public-offer.types";
import type { PublicOfferSearchParams } from "@/lib/public-offer/query";
import { productPageMessages, type ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";

const defaultMessages = productPageMessages("en-GB");

function money(value: number | null, currency: string | null, messages = defaultMessages, locale = "en-GB") {
  if (value === null) return messages.common.notListed;
  if (!currency) return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value} ${currency || ""}`.trim();
  }
}

function date(value: string | null, messages = defaultMessages, locale = "en-GB") {
  if (!value) return messages.common.notListed;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return messages.common.notListed;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parsed);
}

function safeActionHref(offer: PublicOfferDTO) {
  return offer.dataClassification !== "DEMO_FIXTURE" && offer.action.available && offer.action.href && /^\/r\/[a-z0-9][a-z0-9-]*$/i.test(offer.action.href) ? offer.action.href : null;
}

function DemoFixtureNotice({ offer, messages = defaultMessages }: { offer: PublicOfferDTO; messages?: ProductPageMessages }) {
  if (offer.dataClassification !== "DEMO_FIXTURE") return null;
  return <p className={styles.conditions} style={{ gridColumn: "1 / -1", overflowWrap: "break-word", wordBreak: "normal" }}><strong>{messages.common.demoData}</strong> — {messages.common.demoDisclosure}</p>;
}

function bonusType(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

function materialTerms(offer: PublicOfferDTO) {
  return [
    { label: "Minimum deposit", value: money(offer.bonus.minimumDeposit, offer.bonus.currency) },
    { label: "Wagering", value: offer.bonus.wageringMultiplier === null ? offer.bonus.wageringText || "Not listed" : `${offer.bonus.wageringMultiplier}×` },
    { label: "Maximum bonus", value: money(offer.bonus.maximumBonus, offer.bonus.currency) },
    { label: "Expiry", value: date(offer.bonus.expiresAt) },
  ];
}

function evidenceRows(offer: PublicOfferDTO) {
  return [
    ...materialTerms(offer),
    { label: "Eligibility", value: offer.bonus.eligibility || "Not listed" },
    { label: "Licence", value: offer.casino.licenses[0]?.authority || "Not listed" },
    { label: "Payments", value: offer.casino.payments.slice(0, 3).map((item) => item.name).join(" · ") || "Not listed" },
    { label: "Reviewed", value: date(offer.casino.lastReviewedAt) },
  ];
}

function payoutEvidence(offer: PublicOfferDTO, messages = defaultMessages) {
  return offer.casino.payments.find((payment) => payment.supportsWithdrawals && payment.withdrawalTime?.trim())?.withdrawalTime?.trim() || messages.common.notListed;
}

function mobileFeaturedTerms(offer: PublicOfferDTO) {
  return [
    { label: "Min deposit", value: money(offer.bonus.minimumDeposit, offer.bonus.currency) },
    { label: "Wagering", value: offer.bonus.wageringMultiplier === null ? offer.bonus.wageringText || "Not listed" : `${offer.bonus.wageringMultiplier}×` },
    { label: "Payout", value: payoutEvidence(offer) },
    { label: "License", value: offer.casino.licenses[0]?.authority || "Not listed" },
    { label: "Payments", value: offer.casino.payments.slice(0, 3).map((item) => item.name).join(" · ") || "Not listed" },
  ];
}

function OfferAction({ offer, compact = false, messages = defaultMessages }: { offer: PublicOfferDTO; compact?: boolean; messages?: ProductPageMessages }) {
  const href = safeActionHref(offer);
  if (!href) return <span aria-disabled="true" className={compact ? styles.actionUnavailableCompact : styles.actionUnavailable}>{messages.common.noGovernedVisit}</span>;
  return <CasinoOutboundAction action={{ href, label: messages.common.actionAvailable }} className={compact ? styles.offerActionCompact : styles.offerAction} messages={messages.outbound} />;
}

function OfferLogo({ offer }: { offer: PublicOfferDTO }) {
  return offer.casino.logo ? <img
    alt={offer.casino.logo.alt || `${offer.casino.name} logo`}
    height={offer.casino.logo.height ?? 80}
    loading="lazy"
    src={offer.casino.logo.url}
    width={offer.casino.logo.width ?? 160}
  /> : <span aria-hidden="true">{offer.casino.name.slice(0, 1)}</span>;
}

export function FeaturedBonusCard({ offer, position, primary = false }: { offer: PublicOfferDTO; position: number; primary?: boolean }) {
  return <article className={`${styles.featureCard} ${primary ? styles.featureCardPrimary : ""}`}>
    <div className={styles.featureMeta}><span>{String(position).padStart(2, "0")} / {offer.dataClassification === "DEMO_FIXTURE" ? "Demo fixture" : "Published"}</span><span>{offer.commercialAvailability === "AVAILABLE" ? "Action available" : "Review only"}</span></div>
    <p className={styles.offerType}>{bonusType(offer.bonus.type)}</p>
    <h3>{offer.casino.name}</h3>
    <p className={styles.offerHeadline}>{offer.bonus.title}</p>
    <dl className={styles.featureTerms}>{evidenceRows(offer).slice(0, 7).map((term) => <div key={term.label}><dt>{term.label}</dt><dd>{term.value}</dd></div>)}</dl>
    <dl className={styles.featureMobileTerms}>{mobileFeaturedTerms(offer).map((term) => <div key={term.label}><dt>{term.label}</dt><dd>{term.value}</dd></div>)}</dl>
    {offer.bonus.importantConditions.length > 0 && <p className={styles.conditions}>{offer.bonus.importantConditions.slice(0, 2).join(" · ")}</p>}
    <DemoFixtureNotice offer={offer} />
    <div className={styles.featureActions}><Link href={`/casino/${offer.casino.slug}`}>Read Review <span aria-hidden="true">→</span></Link><OfferAction offer={offer} /></div>
  </article>;
}

function BonusHiddenQuery({ query, except = [] }: { query: PublicOfferQuery; except?: string[] }) {
  return <>
    {query.country && !except.includes("country") ? <input name="country" type="hidden" value={query.country} /> : null}
    {query.type && !except.includes("type") ? <input name="type" type="hidden" value={query.type} /> : null}
    {query.payment && !except.includes("payment") ? <input name="payment" type="hidden" value={query.payment} /> : null}
    {query.crypto !== undefined && !except.includes("crypto") ? <input name="crypto" type="hidden" value={String(query.crypto)} /> : null}
    {query.maxDeposit !== undefined && !except.includes("maxDeposit") ? <input name="maxDeposit" type="hidden" value={String(query.maxDeposit)} /> : null}
    {query.maxWagering !== undefined && !except.includes("maxWagering") ? <input name="maxWagering" type="hidden" value={String(query.maxWagering)} /> : null}
    {query.availability && !except.includes("availability") ? <input name="availability" type="hidden" value={query.availability} /> : null}
    {query.sort && !except.includes("sort") ? <input name="sort" type="hidden" value={query.sort} /> : null}
  </>;
}

function FilterFields({ facets, query, messages }: { facets: PublicOfferFacets; query: PublicOfferQuery; messages: ProductPageMessages }) {
  return <div className={styles.filterGrid}>
    <label><span>{messages.common.countryPreference}</span><select defaultValue={query.country || ""} name="country"><option value="">{messages.common.countryPreference}</option>{facets.countries.map((item) => <option key={item.value} value={item.value}>{item.label} · {item.count}</option>)}</select></label>
    <label><span>{messages.common.bonusType}</span><select defaultValue={query.type || ""} name="type"><option value="">{messages.common.bonusType}</option>{facets.types.map((item) => <option key={item.value} value={item.value}>{item.label} · {item.count}</option>)}</select></label>
    <label><span>{messages.common.paymentMethods}</span><select defaultValue={query.payment || ""} name="payment"><option value="">{messages.common.paymentMethods}</option>{facets.payments.map((item) => <option key={item.value} value={item.value}>{item.label} · {item.count}</option>)}</select></label>
    <label><span>{messages.common.cryptoSupport}</span><select defaultValue={query.crypto === undefined ? "" : String(query.crypto)} name="crypto"><option value="">{messages.common.cryptoSupport}</option>{facets.crypto.map((item) => <option key={item.value} value={item.value}>{item.value === "true" ? messages.common.cryptoSupported : messages.common.cryptoUnsupported} · {item.count}</option>)}</select></label>
    <label><span>{messages.common.minimumDeposit} ≤</span><input aria-label={`${messages.common.minimumDeposit} ≤`} defaultValue={query.maxDeposit} inputMode="decimal" min="0" name="maxDeposit" placeholder={`${messages.common.minimumDeposit} ≤`} step="1" type="number" /></label>
    <label><span>{messages.common.wagering}</span><input aria-label={messages.common.wagering} defaultValue={query.maxWagering} inputMode="decimal" min="0" name="maxWagering" placeholder={messages.common.wagering} step="1" type="number" /></label>
    <label><span>{messages.common.availability}</span><select defaultValue={query.availability || ""} name="availability"><option value="">{messages.common.availability}</option>{facets.availability.map((item) => <option key={item.value} value={item.value}>{item.value === "AVAILABLE" ? messages.common.actionAvailable : messages.common.reviewOnly} · {item.count}</option>)}</select></label>
    <label><span>{messages.common.sortResults}</span><select defaultValue={query.sort} name="sort"><option value="editorial">{messages.common.editorScore}</option><option value="newest">{messages.common.current}</option><option value="highest-bonus">{messages.common.maximumBonus}</option><option value="lowest-wagering">{messages.common.wagering}</option><option value="lowest-deposit">{messages.common.minimumDeposit}</option></select></label>
  </div>;
}

function PrimaryBonusFields({ facets, query, messages }: { facets: PublicOfferFacets; query: PublicOfferQuery; messages: ProductPageMessages }) {
  return <div className={filterStyles.primaryGrid}>
    <label className={filterStyles.field}><span>{messages.common.countryPreference}</span><select defaultValue={query.country || ""} name="country"><option value="">{messages.common.countryPreference}</option>{facets.countries.map((item) => <option key={item.value} value={item.value}>{item.label} · {item.count}</option>)}</select></label>
    <label className={filterStyles.field}><span>{messages.common.bonusType}</span><select defaultValue={query.type || ""} name="type"><option value="">{messages.common.bonusType}</option>{facets.types.map((item) => <option key={item.value} value={item.value}>{item.label} · {item.count}</option>)}</select></label>
    <label className={filterStyles.field}><span>{messages.common.paymentMethods}</span><select defaultValue={query.payment || ""} name="payment"><option value="">{messages.common.paymentMethods}</option>{facets.payments.map((item) => <option key={item.value} value={item.value}>{item.label} · {item.count}</option>)}</select></label>
    <label className={filterStyles.field}><span>{messages.common.wagering}</span><input aria-label={messages.common.wagering} defaultValue={query.maxWagering} inputMode="decimal" min="0" name="maxWagering" placeholder={messages.common.wagering} step="1" type="number" /></label>
  </div>;
}

function SecondaryBonusFields({ facets, query, messages }: { facets: PublicOfferFacets; query: PublicOfferQuery; messages: ProductPageMessages }) {
  return <div className={filterStyles.drawerGrid}>
    <label className={filterStyles.drawerField}><span>{messages.common.cryptoSupport}</span><select defaultValue={query.crypto === undefined ? "" : String(query.crypto)} name="crypto"><option value="">{messages.common.cryptoSupport}</option>{facets.crypto.map((item) => <option key={item.value} value={item.value}>{item.value === "true" ? messages.common.cryptoSupported : messages.common.cryptoUnsupported} · {item.count}</option>)}</select></label>
    <label className={filterStyles.drawerField}><span>{messages.common.minimumDeposit} ≤</span><input aria-label={`${messages.common.minimumDeposit} ≤`} defaultValue={query.maxDeposit} inputMode="decimal" min="0" name="maxDeposit" placeholder={`${messages.common.minimumDeposit} ≤`} step="1" type="number" /></label>
    <label className={filterStyles.drawerField}><span>{messages.common.availability}</span><select defaultValue={query.availability || ""} name="availability"><option value="">{messages.common.availability}</option>{facets.availability.map((item) => <option key={item.value} value={item.value}>{item.value === "AVAILABLE" ? messages.common.actionAvailable : messages.common.reviewOnly} · {item.count}</option>)}</select></label>
    <label className={filterStyles.drawerField}><span>{messages.common.sortResults}</span><select defaultValue={query.sort} name="sort"><option value="editorial">{messages.common.editorScore}</option><option value="newest">{messages.common.current}</option><option value="highest-bonus">{messages.common.maximumBonus}</option><option value="lowest-wagering">{messages.common.wagering}</option><option value="lowest-deposit">{messages.common.minimumDeposit}</option></select></label>
  </div>;
}

function BonusFilterForm({ facets, query, total, messages, presentation, compact = false, noScript = false }: { facets: PublicOfferFacets; query: PublicOfferQuery; total: number; messages: ProductPageMessages; presentation: PresentationResolution; compact?: boolean; noScript?: boolean }) {
  return <InstantDiscoveryForm action={productHref(presentation, "/bonuses")} className={compact ? styles.filterFormCompact : styles.filterForm} debouncedFields={["maxDeposit", "maxWagering"]} key={`bonus-filters:${compact}:${JSON.stringify(query)}`} pendingLabel={messages.common.updatingResults}>
    <FilterFields facets={facets} messages={messages} query={query} />
    <p className={styles.marketNote}>{messages.common.marketPresentationNotice}</p>
    <div className={styles.filterActions}><div><strong>{total} {total === 1 ? messages.common.record : messages.common.records}</strong><span>{messages.common.updatingResults}</span></div>{noScript ? <button type="submit">{messages.common.applyFilters}</button> : null}</div>
  </InstantDiscoveryForm>;
}

function PrimaryBonusFilterForm({ facets, query, messages, presentation }: { facets: PublicOfferFacets; query: PublicOfferQuery; messages: ProductPageMessages; presentation: PresentationResolution }) {
  return <InstantDiscoveryForm action={productHref(presentation, "/bonuses")} className={filterStyles.primaryForm} debouncedFields={["maxWagering"]} key={`bonus-primary:${JSON.stringify(query)}`} pendingLabel={messages.common.updatingResults}>
    <BonusHiddenQuery except={["country", "type", "payment", "maxWagering"]} query={query} />
    <PrimaryBonusFields facets={facets} messages={messages} query={query} />
  </InstantDiscoveryForm>;
}

function SecondaryBonusFilterForm({ facets, query, messages, presentation }: { facets: PublicOfferFacets; query: PublicOfferQuery; messages: ProductPageMessages; presentation: PresentationResolution }) {
  return <InstantDiscoveryForm action={productHref(presentation, "/bonuses")} className={filterStyles.drawerForm} debouncedFields={["maxDeposit"]} key={`bonus-secondary:${JSON.stringify(query)}`} pendingLabel={messages.common.updatingResults}>
    <BonusHiddenQuery except={["crypto", "maxDeposit", "availability", "sort"]} query={query} />
    <SecondaryBonusFields facets={facets} messages={messages} query={query} />
    <div className={filterStyles.drawerFooter}><Link href={productHref(presentation, "/bonuses")}>{messages.common.clearAll}</Link><span>{messages.common.updatingResults}</span></div>
  </InstantDiscoveryForm>;
}

export function BonusFilters({ facets, query, total, activeCount, messages, presentation }: { facets: PublicOfferFacets; query: PublicOfferQuery; total: number; activeCount: number; messages: ProductPageMessages; presentation: PresentationResolution }) {
  return <>
    <div className={styles.desktopFilters}>
      <DirectoryFilterSurface
        activeCount={activeCount}
        dialogId="bonus-all-filters-dialog"
        labels={{ allFilters: messages.common.allFilters, directoryControls: messages.common.directoryControls, closeFilters: messages.common.closeFilters }}
        note={messages.common.marketPresentationNotice}
        primary={<PrimaryBonusFilterForm facets={facets} messages={messages} presentation={presentation} query={query} />}
        secondary={<SecondaryBonusFilterForm facets={facets} messages={messages} presentation={presentation} query={query} />}
        summary={`${total} ${total === 1 ? messages.common.record : messages.common.records}`}
        title={`${messages.common.filters} · ${messages.bonuses.directoryTitle}`}
      />
    </div>
    <MobileBonusFilters activeCount={activeCount} messages={messages}><BonusFilterForm compact facets={facets} messages={messages} presentation={presentation} query={query} total={total} /></MobileBonusFilters>
    <noscript><div className={styles.noScriptFilters} style={{ display: "block" }}><BonusFilterForm compact facets={facets} messages={messages} noScript presentation={presentation} query={query} total={total} /></div></noscript>
  </>;
}

function filterHref(raw: PublicOfferSearchParams, omitted: string) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (key === omitted || key === "page") continue;
    for (const item of Array.isArray(value) ? value : value ? [value] : []) params.append(key, item);
  }
  return `/bonuses${params.size ? `?${params}` : ""}`;
}

export function ActiveBonusFilters({ query, raw, messages, presentation }: { query: PublicOfferQuery; raw: PublicOfferSearchParams; messages: ProductPageMessages; presentation: PresentationResolution }) {
  const values = [
    ["country", query.country], ["type", query.type && bonusType(query.type)], ["payment", query.payment],
    ["crypto", query.crypto === undefined ? null : query.crypto ? messages.common.cryptoSupported : messages.common.cryptoUnsupported],
    ["maxDeposit", query.maxDeposit === undefined ? null : `${messages.common.minimumDeposit} ≤ ${query.maxDeposit}`],
    ["maxWagering", query.maxWagering === undefined ? null : `${messages.common.wagering} ≤ ${query.maxWagering}`],
    ["availability", query.availability === "AVAILABLE" ? messages.common.actionAvailable : query.availability === "UNAVAILABLE" ? messages.common.reviewOnly : null],
  ].filter((item): item is [string, string] => Boolean(item[1]));
  if (!values.length) return <p className={styles.filterSummary}>{messages.bonuses.proofSources}</p>;
  return <div className={styles.activeFilters} aria-label={messages.common.activeFilters}><strong>{messages.common.activeFilters}</strong>{values.map(([key, label]) => <Link aria-label={`${messages.comparison.remove} ${label}`} href={productHref(presentation, filterHref(raw, key))} key={key}>{label}<span aria-hidden="true">×</span></Link>)}<Link className={styles.clearFilters} href={productHref(presentation, "/bonuses")}>{messages.common.clearAll}</Link></div>;
}

export function BonusComparisonList({ offers, startPosition, messages, presentation }: { offers: PublicOfferDTO[]; startPosition: number; messages: ProductPageMessages; presentation: PresentationResolution }) {
  return <div className={styles.comparison}>
    {offers.map((offer, index) => <article className={styles.comparisonRow} data-bonus-directory-card key={`${offer.casino.id}:${offer.bonus.id}`}>
      <span className={styles.compactLogo} data-logo-state={offer.casino.logo ? "image" : "fallback"}><OfferLogo offer={offer} /></span>
      <div className={styles.compactIdentity}>
        <strong>{offer.casino.name}</strong>
        <span>{messages.common.editorScore} {offer.casino.editorScore.toFixed(1)} · {offer.casino.licenses[0]?.authority || messages.common.notListed} · {offer.casino.payments.slice(0, 2).map((item) => item.name).join(" · ") || messages.common.notListed}</span>
      </div>
      <div className={styles.compactOffer}>
        <span>{offer.dataClassification === "DEMO_FIXTURE" ? messages.common.demoData : messages.common.current}</span>
        <p className={styles.compactHeadline}>{offer.bonus.title}</p>
      </div>
      <DemoFixtureNotice messages={messages} offer={offer} />
      <dl className={styles.compactTerms} data-material-terms>
        <div><dt>{messages.common.wagering}</dt><dd>{offer.bonus.wageringMultiplier === null ? offer.bonus.wageringText || "—" : `${offer.bonus.wageringMultiplier}x`}</dd></div>
        <div><dt>{messages.common.minimumDeposit}</dt><dd>{money(offer.bonus.minimumDeposit, offer.bonus.currency, messages, presentation.locale)}</dd></div>
        <div><dt>{messages.common.payout}</dt><dd>{payoutEvidence(offer, messages)}</dd></div>
      </dl>
      <div className={styles.compactActions} data-governed-actions><OfferAction compact messages={messages} offer={offer} /><Link href={productHref(presentation, `/casino/${offer.casino.slug}`)}>{messages.common.readReview}</Link></div>
      <span className={styles.compactPosition} aria-label={`${messages.common.result} ${startPosition + index}`}>{String(startPosition + index).padStart(2, "0")}</span>
    </article>)}
    <aside className={styles.reviewSeparationNote}><strong>{messages.common.reviewOnly} · {offers.length} {messages.common.results}</strong><p>{messages.common.marketPresentationNotice}</p></aside>
  </div>;
}

export function BonusPagination({ page, pageCount, raw, messages, presentation }: { page: number; pageCount: number; raw: PublicOfferSearchParams; messages: ProductPageMessages; presentation: PresentationResolution }) {
  if (pageCount <= 1) return null;
  const href = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(raw)) for (const item of Array.isArray(value) ? value : value ? [value] : []) if (key !== "page") params.append(key, item);
    if (target > 1) params.set("page", String(target));
    return productHref(presentation, `/bonuses${params.size ? `?${params}` : ""}`);
  };
  return <DirectoryPagination
    ariaLabel={messages.bonuses.directoryTitle}
    currentPage={page}
    labels={{ previous: messages.common.previous, next: messages.common.next, pageOf: messages.common.pageOf }}
    nextHref={page < pageCount ? href(page + 1) : null}
    pageCount={pageCount}
    previousHref={page > 1 ? href(page - 1) : null}
  />;
}

export function BonusEducation() {
  return <>
    <section className={styles.contractSection}><div className={styles.contractHeading}><p>Compare the contract,<br />not the headline.</p></div></section>
    <section className={styles.ledgerSection}><div className={styles.shell}><div className={styles.ledgerIntro}><span>Expressive method · terms ledger</span><h2>One offer.<br />Four decision fields.</h2></div><ol className={styles.ledgerList}><li><b>01</b><div><strong>Wagering</strong><span>How much turnover?</span></div></li><li><b>02</b><div><strong>Deposit</strong><span>What cash is required?</span></div></li><li><b>03</b><div><strong>Expiry</strong><span>When do rights end?</span></div></li><li><b>04</b><div><strong>Limits</strong><span>What blocks withdrawal?</span></div></li></ol></div></section>
    <section className={styles.noTerm}><div className={styles.shell}><h2>No term, no promise.</h2></div></section>
    <section className={styles.evidenceSection}><div className={styles.shell}><div className={styles.evidenceGrid}><article><span><span className={styles.desktopOnly}>Decision method · compare in this order</span><span className={styles.mobileOnly}>Terms anatomy / missing data stays visible</span></span><h2>Headline ≠ Terms.</h2><div className={styles.evidenceTable}><div><b>Headline</b><span>Recorded offer description</span><em>Source field</em></div><div><b>Wagering</b><span>Recorded multiplier or wording</span><em>Source field</em></div><div><b>Min deposit</b><span>Recorded cash requirement</span><em>Source field</em></div><div><b>Max bet</b><span>Not listed remains not listed</span><em>Missing</em></div><div><b>Game contribution</b><span>Not listed remains not listed</span><em>Missing</em></div><div><b>Expiry / withdrawal</b><span>Not listed remains not listed</span><em>Missing</em></div></div></article><article className={styles.stateCard}><span>State contract</span><h2>When evidence breaks, action stops.</h2><div><b>Unavailable</b><span>Review remains</span></div><div><b>Expired</b><span>Terms remain</span></div><div className={styles.dangerRow}><b>Terms under review</b><span>Action removed</span></div><div><b>No governed visit</b><span>Internal review only</span></div></article></div></div></section>
    <section className={styles.faqSection}><div className={styles.shell}><div className={styles.faqHeading}><span>Bonus education · neutral answers</span><h2>Questions before action.</h2><p>A published bonus is not a recommendation to play. Compare the cost, restrictions and local context first.</p></div><div className={styles.faqList}><details><summary>What does wagering mean?</summary><p>It describes the turnover required under the published terms. If the value is missing, B4GAMBLE shows it as not listed instead of estimating it.</p></details><details><summary>Does a larger maximum bonus make an offer better?</summary><p>No. Deposit requirements, wagering, eligibility, expiry and withdrawal restrictions may matter more than the headline amount.</p></details><details><summary>Does an available action prove I am eligible?</summary><p>No. Country is only a comparison preference. Confirm local law, operator eligibility and the current operator terms yourself.</p></details><details><summary>How does B4GAMBLE earn money?</summary><p>Some clearly labelled affiliate links may compensate B4GAMBLE. Affiliate compensation does not determine Editor Score or natural editorial ranking.</p></details></div></div></section>
  </>;
}

export function BonusRelatedNavigation() {
  return <section className={styles.relatedSection}><div className={styles.shell}><div><span>Continue without pressure</span><h2>Keep the decision in context.</h2></div><nav aria-label="Related bonus information"><Link href="/bonus-guide"><span>01 · Learn</span><strong>Read the Bonus Guide</strong></Link><Link href="/methodology"><span>02 · Trust</span><strong>Review the Methodology</strong></Link><Link href="/casinos"><span>03 · Reviews</span><strong>Browse Casino Reviews</strong></Link><Link href="/help"><span>04 · Control</span><strong>Open Protected Help</strong></Link></nav></div></section>;
}
