import type { Metadata } from "next";
import Link from "next/link";

import { ActiveDiscoveryFilters, DirectoryFeaturedTheatre, DiscoveryControls, DiscoveryResults } from "@/components/casino-discovery/CasinoDiscovery";
import styles from "@/components/casino-discovery/CasinoDiscovery.module.css";
import { InstantDiscoveryForm } from "@/components/discovery/InstantDiscoveryForm";
import { resolveServerJurisdiction } from "@/lib/jurisdiction/server";
import { safeJsonLd } from "@/lib/public-casino/public-casino-validation";
import { hasDiscoveryFilters, parseCasinoDiscoveryQuery } from "@/lib/public-casino-discovery/query";
import { publicCasinoDiscoveryService } from "@/lib/services/public-casino-discovery.service";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = parseCasinoDiscoveryQuery(await searchParams);
  const filtered = hasDiscoveryFilters(query);
  const authority = await resolveServerJurisdiction({ userSelectedCountry: query.country?.[0] ?? null });
  const result = await publicCasinoDiscoveryService.discover(query, authority);
  const containsDemo = result.inventoryMode !== "PUBLISHED_ONLY";
  const canonicalParams = new URLSearchParams();
  if (!filtered && (query.page ?? 1) > 1) canonicalParams.set("page", String(query.page));
  const canonical = absoluteUrl(`/casinos${canonicalParams.size ? `?${canonicalParams}` : ""}`);
  const title = query.page && query.page > 1 ? `Casino Reviews — Page ${query.page} | B4GAMBLE` : containsDemo ? "Casino Review Demonstration | B4GAMBLE" : "Casino Reviews and Comparisons | B4GAMBLE";
  const description = containsDemo ? "Fictional demonstration casino records showing B4GAMBLE's review format. Not current GB operators, partner offers or live promotions." : "Search and compare published casino reviews by market preference, licence, payments, games, bonus availability and responsible gambling information.";
  return { title, description, alternates: { canonical }, robots: filtered || containsDemo ? { index: false, follow: true } : { index: true, follow: true }, openGraph: { type: "website", title, description, url: canonical } };
}

export default async function CasinosPage({ searchParams }: PageProps) {
  const query = parseCasinoDiscoveryQuery(await searchParams);
  const authority = await resolveServerJurisdiction({ userSelectedCountry: query.country?.[0] ?? null });
  const result = await publicCasinoDiscoveryService.discover(query, authority);
  const schemas = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Casino Reviews", item: absoluteUrl("/casinos") }] },
    ...(result.inventoryMode === "PUBLISHED_ONLY" ? [{ "@context": "https://schema.org", "@type": "ItemList", name: "Published casino reviews", numberOfItems: result.total, itemListElement: result.items.map((casino, index) => ({ "@type": "ListItem", position: (result.page - 1) * result.pageSize + index + 1, name: casino.name, url: absoluteUrl(`/casino/${casino.slug}`) })) }] : []),
  ];

  return <div className={styles.page}>
    {schemas.map((schema, index) => <script dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} key={index} type="application/ld+json" />)}
    <section className={styles.hero}>
      <div className={styles.shell}>
        <div className={styles.heroIntro}>
          <header><p>Editorial casino discovery · Server-classified reviews · 18+</p><h1>A clearer casino<br /><em>choice.</em></h1><span>Search review snapshots before you compare a bonus or consider a governed visit action.</span></header>
          <div className={styles.heroSearch}><InstantDiscoveryForm action="/casinos" debouncedFields={["q"]} key={`hero:${result.appliedFilters.search ?? ""}`} pendingLabel="Updating casino results…"><label className={styles.srOnly} htmlFor="hero-casino-search">Search casinos, payments or providers</label><input defaultValue={result.appliedFilters.search ?? ""} id="hero-casino-search" maxLength={100} name="q" placeholder="Search casinos, payments or providers" type="search" /><button aria-label="Search directory" type="submit">→</button></InstantDiscoveryForm><p>B4GAMBLE may earn a commission from qualifying visits. Review access does not depend on whether a public visit action is available.</p></div>
        </div>
        <DirectoryFeaturedTheatre casino={result.items[0]} />
      </div>
    </section>

    <section className={styles.directory} id="casino-directory">
      <div className={styles.shell}>
        <div className={styles.directoryHeading}><div><p>Casino directory</p><h2>Find the facts that fit<br /><em>your priorities.</em></h2></div><span>{result.total} {result.inventoryMode === "PUBLISHED_ONLY" ? "published" : "classified"} {result.total === 1 ? "record" : "records"}</span></div>
        {result.inventoryMode !== "PUBLISHED_ONLY" ? <div className={styles.disclosure} role="note"><strong>DEMONSTRATION DATA</strong><p>Fictional operators and offer fields show the product experience. They are not current GB operators, licence claims, partner offers or live promotions. No commercial visit action is available.</p><Link href="/methodology">Read our review method →</Link></div> : null}
        <div className={styles.disclosure}><strong>Affiliate disclosure</strong><p>B4GAMBLE may receive commission from future eligible governed visit links. Affiliate compensation does not determine Editor Score or natural editorial ranking, and no listing guarantees winnings or income.</p><Link href="/methodology">Read our review method →</Link></div>
        <DiscoveryControls result={result} />
        <ActiveDiscoveryFilters result={result} />
        <DiscoveryResults result={result} />
      </div>
    </section>

    <section className={styles.readingGuide}><div className={styles.shell}><div className={styles.sectionIntro}><p>How to read a review</p><h2>Three checks before<br /><em>you follow an offer.</em></h2></div><div className={styles.guideGrid}>{[
      ["01", "Qualification first", "Confirm the published licence, market information and age conditions before comparing offers."],
      ["02", "Facts before promotion", "Read wagering, withdrawals, payments and limits before considering a visit action."],
      ["03", "Decision stays yours", "An Editor Score is a comparison aid, never a safety, winnings or outcomes guarantee."],
    ].map(([number, title, copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

    <section className={styles.anatomy}><div className={styles.shell}><div className={styles.sectionIntro}><p>Review anatomy</p><h2>Compare what<br /><em>actually matters.</em></h2><span>The same published fields stay visible across every review. Missing optional evidence is omitted or shown as unavailable.</span></div><div className={styles.anatomyGrid}>{[
      ["Identity + licence", "Operator name, published review date and applicable licence evidence appear before promotion."],
      ["Material facts", "Payments, providers, responsible gambling information, bonus terms and uncertainty use one comparable structure."],
      ["Action + disclosure", "Affiliate compensation does not determine Editor Score or natural editorial ranking; a governed internal visit action is conditional and disclosed."],
    ].map(([title, copy]) => <article key={title}><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

    <section className={styles.method}><div className={styles.shell}><div className={styles.methodHead}><div><p>Editor Score</p><h2>What the score means—<br /><em>and what it never promises.</em></h2></div><p>A 10-point comparison aid built from observable published review fields. It does not predict safety, financial outcomes, withdrawals, disputes or personal suitability.</p></div><div className={styles.methodGrid}>{[
      ["01", "Licence & market fit", "Licence source, supported geography and snapshot recency."],
      ["02", "Bonus clarity", "Material restrictions separated from headline value."],
      ["03", "Money movement", "Payment methods, withdrawal signals and verification rules."],
      ["04", "Controls & account rules", "Limits, timeout, self-exclusion and closure information."],
      ["05", "Usability & support", "Published device, provider and support evidence."],
      ["06", "Commercial eligibility", "Visit availability changes the action—not whether a review can exist."],
    ].map(([number, title, copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div><aside><strong>A higher score is not a safety guarantee.</strong><p>Always read the underlying review and current operator terms.</p><span>10 / 10 is the maximum comparison score</span></aside></div></section>

    <section className={styles.compare}><div className={styles.shell}><div><p>Continue comparing</p><h2>Review first.<br /><em>Then compare the deal.</em></h2><span>Terms, eligibility and disclosure stay visible before any outbound action.</span></div><nav aria-label="Related comparison pages"><Link href="/bonuses"><span>01 · Bonuses</span><b>Explore published bonus terms →</b></Link><Link href="/best-offers"><span>02 · Best offers</span><b>See editorial comparisons →</b></Link></nav></div></section>

    <section className={styles.faq}><div className={styles.shell}><div className={styles.sectionIntro}><p>Casino FAQ</p><h2>Know what<br /><em>you are comparing.</em></h2></div><div>{[
      ["Can a review stay visible without a visit action?", "Yes. A published editorial review can remain useful when no eligible governed offer or redirect is available."],
      ["What does Editor Score measure?", "It compares published evidence using a consistent editorial structure. It does not predict safety, winnings or suitability."],
      ["How are bonuses shown?", result.inventoryMode === "PUBLISHED_ONLY" ? "Published bonus summaries are shown with material terms. Missing information is omitted or marked unavailable." : "Fictional demonstration bonus fields are labelled and cannot open a commercial visit. Missing information is omitted or marked unavailable."],
      ["Why might a casino be unavailable?", "Publication, market information, offer dates, tracking status or redirect eligibility may prevent a public action."],
    ].map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></div></section>
  </div>;
}
