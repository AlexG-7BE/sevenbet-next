import Link from "next/link";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { DirectoryFilterSurface } from "@/components/directory-filters/DirectoryFilterSurface";
import filterStyles from "@/components/directory-filters/DirectoryFilterSurface.module.css";
import { InstantDiscoveryForm } from "@/components/discovery/InstantDiscoveryForm";
import styles from "@/components/bonus-directory/BonusDirectory.module.css";
import { MobileBonusFilters } from "@/components/bonus-directory/MobileBonusFilters";
import type { PublicOfferDTO, PublicOfferFacets, PublicOfferQuery } from "@/lib/public-offer/public-offer.types";
import type { PublicOfferSearchParams } from "@/lib/public-offer/query";

function money(value: number | null, currency: string | null) {
  if (value === null) return "Not listed";
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${value} ${currency || ""}`.trim();
  }
}

function date(value: string | null) {
  if (!value) return "Not listed";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return "Not listed";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parsed);
}

function safeActionHref(offer: PublicOfferDTO) {
  return offer.dataClassification !== "DEMO_FIXTURE" && offer.action.available && offer.action.href && /^\/r\/[a-z0-9][a-z0-9-]*$/i.test(offer.action.href) ? offer.action.href : null;
}

function DemoFixtureNotice({ offer }: { offer: PublicOfferDTO }) {
  if (offer.dataClassification !== "DEMO_FIXTURE") return null;
  return <p className={styles.conditions}><strong>DEMONSTRATION DATA</strong> — Fictional example for interface testing. Not a real casino, current offer or B4GAMBLE partner. No gambling or affiliate link is available.</p>;
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

function payoutEvidence(offer: PublicOfferDTO) {
  return offer.casino.payments.find((payment) => payment.supportsWithdrawals && payment.withdrawalTime?.trim())?.withdrawalTime?.trim() || "Not listed";
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

function OfferAction({ offer, compact = false }: { offer: PublicOfferDTO; compact?: boolean }) {
  const href = safeActionHref(offer);
  if (!href) return <span aria-disabled="true" className={compact ? styles.actionUnavailableCompact : styles.actionUnavailable}>No governed visit</span>;
  return <CasinoOutboundAction action={{ href, label: "View Offer" }} className={compact ? styles.offerActionCompact : styles.offerAction} />;
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

function FilterFields({ facets, query }: { facets: PublicOfferFacets; query: PublicOfferQuery }) {
  return <div className={styles.filterGrid}>
    <label><span>Country preference</span><select defaultValue={query.country || ""} name="country"><option value="">Country preference</option>{facets.countries.map((item) => <option key={item.value} value={item.value}>{item.label} · {item.count}</option>)}</select></label>
    <label><span>Bonus type</span><select defaultValue={query.type || ""} name="type"><option value="">Bonus type</option>{facets.types.map((item) => <option key={item.value} value={item.value}>{item.label} · {item.count}</option>)}</select></label>
    <label><span>Payment method</span><select defaultValue={query.payment || ""} name="payment"><option value="">Payment method</option>{facets.payments.map((item) => <option key={item.value} value={item.value}>{item.label} · {item.count}</option>)}</select></label>
    <label><span>Crypto support</span><select defaultValue={query.crypto === undefined ? "" : String(query.crypto)} name="crypto"><option value="">Crypto support</option>{facets.crypto.map((item) => <option key={item.value} value={item.value}>{item.label} · {item.count}</option>)}</select></label>
    <label><span>Maximum deposit</span><input defaultValue={query.maxDeposit} inputMode="decimal" min="0" name="maxDeposit" placeholder="Maximum deposit" step="1" type="number" /></label>
    <label><span>Maximum wagering</span><input defaultValue={query.maxWagering} inputMode="decimal" min="0" name="maxWagering" placeholder="Maximum wagering" step="1" type="number" /></label>
    <label><span>Commercial availability</span><select defaultValue={query.availability || ""} name="availability"><option value="">Commercial availability</option>{facets.availability.map((item) => <option key={item.value} value={item.value}>{item.label} · {item.count}</option>)}</select></label>
    <label><span>Sort results</span><select defaultValue={query.sort} name="sort"><option value="editorial">Editorial order</option><option value="newest">Newest publication</option><option value="highest-bonus">Highest maximum bonus</option><option value="lowest-wagering">Lowest wagering</option><option value="lowest-deposit">Lowest deposit</option></select></label>
  </div>;
}

function PrimaryBonusFields({ facets, query }: { facets: PublicOfferFacets; query: PublicOfferQuery }) {
  return <div className={filterStyles.primaryGrid}>
    <label className={filterStyles.field}><span>Country preference</span><select defaultValue={query.country || ""} name="country"><option value="">Country preference</option>{facets.countries.map((item) => <option key={item.value} value={item.value}>{item.label} · {item.count}</option>)}</select></label>
    <label className={filterStyles.field}><span>Bonus type</span><select defaultValue={query.type || ""} name="type"><option value="">Bonus type</option>{facets.types.map((item) => <option key={item.value} value={item.value}>{item.label} · {item.count}</option>)}</select></label>
    <label className={filterStyles.field}><span>Payment method</span><select defaultValue={query.payment || ""} name="payment"><option value="">Payment method</option>{facets.payments.map((item) => <option key={item.value} value={item.value}>{item.label} · {item.count}</option>)}</select></label>
    <label className={filterStyles.field}><span>Maximum wagering</span><input defaultValue={query.maxWagering} inputMode="decimal" min="0" name="maxWagering" placeholder="Maximum wagering" step="1" type="number" /></label>
  </div>;
}

function SecondaryBonusFields({ facets, query }: { facets: PublicOfferFacets; query: PublicOfferQuery }) {
  return <div className={filterStyles.drawerGrid}>
    <label className={filterStyles.drawerField}><span>Crypto support</span><select defaultValue={query.crypto === undefined ? "" : String(query.crypto)} name="crypto"><option value="">Crypto support</option>{facets.crypto.map((item) => <option key={item.value} value={item.value}>{item.label} · {item.count}</option>)}</select></label>
    <label className={filterStyles.drawerField}><span>Maximum deposit</span><input defaultValue={query.maxDeposit} inputMode="decimal" min="0" name="maxDeposit" placeholder="Maximum deposit" step="1" type="number" /></label>
    <label className={filterStyles.drawerField}><span>Commercial availability</span><select defaultValue={query.availability || ""} name="availability"><option value="">Commercial availability</option>{facets.availability.map((item) => <option key={item.value} value={item.value}>{item.label} · {item.count}</option>)}</select></label>
    <label className={filterStyles.drawerField}><span>Sort results</span><select defaultValue={query.sort} name="sort"><option value="editorial">Editorial order</option><option value="newest">Newest publication</option><option value="highest-bonus">Highest maximum bonus</option><option value="lowest-wagering">Lowest wagering</option><option value="lowest-deposit">Lowest deposit</option></select></label>
  </div>;
}

function BonusFilterForm({ facets, query, total, compact = false, noScript = false }: { facets: PublicOfferFacets; query: PublicOfferQuery; total: number; compact?: boolean; noScript?: boolean }) {
  return <InstantDiscoveryForm action="/bonuses" className={compact ? styles.filterFormCompact : styles.filterForm} debouncedFields={["maxDeposit", "maxWagering"]} key={`bonus-filters:${compact}:${JSON.stringify(query)}`} pendingLabel="Updating bonus results…">
    <FilterFields facets={facets} query={query} />
    <p className={styles.marketNote}>Country is a comparison preference, not detected location, legal advice or proof that an offer is available to you.</p>
    <div className={styles.filterActions}><div><strong>{total} matching record{total === 1 ? "" : "s"}</strong><span>{noScript ? "Submit to update these server-classified records" : "Updates immediately when a filter changes"}</span></div>{noScript ? <button type="submit">Apply filters</button> : null}</div>
  </InstantDiscoveryForm>;
}

function PrimaryBonusFilterForm({ facets, query }: { facets: PublicOfferFacets; query: PublicOfferQuery }) {
  return <InstantDiscoveryForm action="/bonuses" className={filterStyles.primaryForm} debouncedFields={["maxWagering"]} key={`bonus-primary:${JSON.stringify(query)}`} pendingLabel="Updating bonus results…">
    <BonusHiddenQuery except={["country", "type", "payment", "maxWagering"]} query={query} />
    <PrimaryBonusFields facets={facets} query={query} />
  </InstantDiscoveryForm>;
}

function SecondaryBonusFilterForm({ facets, query }: { facets: PublicOfferFacets; query: PublicOfferQuery }) {
  return <InstantDiscoveryForm action="/bonuses" className={filterStyles.drawerForm} debouncedFields={["maxDeposit"]} key={`bonus-secondary:${JSON.stringify(query)}`} pendingLabel="Updating bonus results…">
    <BonusHiddenQuery except={["crypto", "maxDeposit", "availability", "sort"]} query={query} />
    <SecondaryBonusFields facets={facets} query={query} />
    <div className={filterStyles.drawerFooter}><Link href="/bonuses">Clear all</Link><span>Changes update the directory immediately.</span></div>
  </InstantDiscoveryForm>;
}

export function BonusFilters({ facets, query, total, activeCount }: { facets: PublicOfferFacets; query: PublicOfferQuery; total: number; activeCount: number }) {
  return <>
    <div className={styles.desktopFilters}>
      <DirectoryFilterSurface
        activeCount={activeCount}
        dialogId="bonus-all-filters-dialog"
        note="Country preference is a comparison preference, not detected location or proof that an offer is available."
        primary={<PrimaryBonusFilterForm facets={facets} query={query} />}
        secondary={<SecondaryBonusFilterForm facets={facets} query={query} />}
        summary={`${total} ${total === 1 ? "matching record" : "matching records"}`}
        title="Filter bonuses"
      />
    </div>
    <MobileBonusFilters activeCount={activeCount}><BonusFilterForm compact facets={facets} query={query} total={total} /></MobileBonusFilters>
    <noscript><div className={styles.noScriptFilters} style={{ display: "block" }}><BonusFilterForm compact facets={facets} noScript query={query} total={total} /></div></noscript>
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

export function ActiveBonusFilters({ query, raw }: { query: PublicOfferQuery; raw: PublicOfferSearchParams }) {
  const values = [
    ["country", query.country], ["type", query.type && bonusType(query.type)], ["payment", query.payment],
    ["crypto", query.crypto === undefined ? null : query.crypto ? "Crypto supported" : "No crypto listed"],
    ["maxDeposit", query.maxDeposit === undefined ? null : `Deposit ≤ ${query.maxDeposit}`],
    ["maxWagering", query.maxWagering === undefined ? null : `Wagering ≤ ${query.maxWagering}`],
    ["availability", query.availability === "AVAILABLE" ? "Action available" : query.availability === "UNAVAILABLE" ? "Review only" : null],
  ].filter((item): item is [string, string] => Boolean(item[1]));
  if (!values.length) return <p className={styles.filterSummary}>All eligible published comparison records are shown.</p>;
  return <div className={styles.activeFilters} aria-label="Active filters"><strong>Active Filters</strong>{values.map(([key, label]) => <Link aria-label={`Remove ${label} filter`} href={filterHref(raw, key)} key={key}>{label}<span aria-hidden="true">×</span></Link>)}<Link className={styles.clearFilters} href="/bonuses">Clear All</Link></div>;
}

export function BonusComparisonList({ offers, startPosition }: { offers: PublicOfferDTO[]; startPosition: number }) {
  return <div className={styles.comparison}>
    {offers.map((offer, index) => <article className={styles.comparisonRow} key={`${offer.casino.id}:${offer.bonus.id}`}>
      <span className={styles.compactLogo} aria-hidden="true">{offer.casino.name.slice(0, 1)}</span>
      <div className={styles.compactIdentity}>
        <strong>{offer.bonus.title}</strong>
        <span>{offer.casino.name} · Score {offer.casino.editorScore.toFixed(1)}</span>
        <small>{offer.casino.licenses[0]?.authority || "Licence not listed"} · {offer.casino.payments.slice(0, 2).map((item) => item.name).join(" · ") || "Payments not listed"}</small>
        <DemoFixtureNotice offer={offer} />
      </div>
      <dl className={styles.compactTerms}>
        <div><dt>Wagering</dt><dd>{offer.bonus.wageringMultiplier === null ? offer.bonus.wageringText || "—" : `${offer.bonus.wageringMultiplier}x`}</dd></div>
        <div><dt>Min deposit</dt><dd>{money(offer.bonus.minimumDeposit, offer.bonus.currency)}</dd></div>
        <div><dt>Payout</dt><dd>{payoutEvidence(offer)}</dd></div>
      </dl>
      <div className={styles.compactActions}><OfferAction compact offer={offer} /><Link href={`/casino/${offer.casino.slug}`}>Review</Link></div>
      <span className={styles.compactPosition} aria-label={`Position ${startPosition + index}`}>{String(startPosition + index).padStart(2, "0")}</span>
      <div className={`${styles.mobileMaterialResult} ${index === 0 ? styles.mobileMaterialResultFeatured : ""}`}>
        <span className={styles.mobileResultRank}>{String(startPosition + index).padStart(2, "0")}</span>
        <h3>{offer.casino.name}</h3>
        <span className={styles.mobileResultStatus}>{index === 0 ? "Featured" : "Result"}</span>
        <p className={styles.mobileResultHeadline}>{offer.bonus.title}</p>
        <DemoFixtureNotice offer={offer} />
        <div className={styles.mobileResultTerms}><span>DEP&nbsp; {money(offer.bonus.minimumDeposit, offer.bonus.currency)}</span><span>WAGER&nbsp; {offer.bonus.wageringMultiplier === null ? offer.bonus.wageringText || "—" : `${offer.bonus.wageringMultiplier}×`}</span><span>PAYOUT&nbsp; {payoutEvidence(offer)}</span></div>
        <p className={styles.mobileResultEvidence}>{offer.casino.licenses[0]?.authority || "Not listed"} · {offer.casino.payments.slice(0, 2).map((item) => item.name).join(" · ") || "Not listed"}</p>
        <Link className={styles.mobileReviewAction} href={`/casino/${offer.casino.slug}`}>Review →</Link>
      </div>
    </article>)}
    <aside className={styles.reviewSeparationNote}><strong>Review-first contract · {offers.length} results</strong><p>Material terms stay visible in the list. Review access remains separate from governed visit availability.</p></aside>
  </div>;
}

export function BonusPagination({ page, pageCount, raw }: { page: number; pageCount: number; raw: PublicOfferSearchParams }) {
  if (pageCount <= 1) return null;
  const href = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(raw)) for (const item of Array.isArray(value) ? value : value ? [value] : []) if (key !== "page") params.append(key, item);
    if (target > 1) params.set("page", String(target));
    return `/bonuses${params.size ? `?${params}` : ""}`;
  };
  return <nav aria-label="Bonus result pages" className={styles.pagination}>
    {page > 1 ? <Link href={href(page - 1)}>← Previous</Link> : <span aria-disabled="true">← Previous</span>}
    <div><span>Comparison directory</span><strong>Page {page} / {pageCount}</strong></div>
    {page < pageCount ? <Link href={href(page + 1)}>Next →</Link> : <span aria-disabled="true">Next →</span>}
  </nav>;
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
