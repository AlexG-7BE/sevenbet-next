import type { Metadata } from "next";
import Link from "next/link";

import { ActiveDiscoveryFilters, DirectoryReviewPreview, DiscoveryControls, DiscoveryResults } from "@/components/casino-discovery/CasinoDiscovery";
import styles from "@/components/casino-discovery/CasinoDiscovery.module.css";
import { evaluateJurisdictionShadow } from "@/lib/jurisdiction/shadow";
import { safeJsonLd } from "@/lib/public-casino/public-casino-validation";
import { hasDiscoveryFilters, parseCasinoDiscoveryQuery } from "@/lib/public-casino-discovery/query";
import { publicCasinoDiscoveryService } from "@/lib/services/public-casino-discovery.service";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const query = parseCasinoDiscoveryQuery(await searchParams);
  const filtered = hasDiscoveryFilters(query);
  const canonicalParams = new URLSearchParams();
  if (!filtered && (query.page ?? 1) > 1) canonicalParams.set("page", String(query.page));
  const canonical = absoluteUrl(`/casinos${canonicalParams.size ? `?${canonicalParams}` : ""}`);
  const title = query.page && query.page > 1 ? `Casino Reviews — Page ${query.page} | SevenBet` : "Casino Reviews and Comparisons | SevenBet";
  const description = "Search and compare published casino reviews by market preference, licence, payments, games, bonus availability and responsible gambling information.";
  return { title, description, alternates: { canonical }, robots: filtered ? { index: false, follow: true } : { index: true, follow: true }, openGraph: { type: "website", title, description, url: canonical } };
}

export default async function CasinosPage({ searchParams }: PageProps) {
  const query = parseCasinoDiscoveryQuery(await searchParams);
  const result = await publicCasinoDiscoveryService.discover(query);
  const legacyCommercialAllowed = result.items.some((casino) => casino.visitAction.available);
  await evaluateJurisdictionShadow("CASINO_DISCOVERY", { userSelectedCountry: query.country?.[0] ?? null, now: new Date() }, { commercialAllowed: legacyCommercialAllowed, referralAllowed: legacyCommercialAllowed });
  const schemas = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Casino Reviews", item: absoluteUrl("/casinos") }] },
    { "@context": "https://schema.org", "@type": "ItemList", name: "Published casino reviews", numberOfItems: result.total, itemListElement: result.items.map((casino, index) => ({ "@type": "ListItem", position: (result.page - 1) * result.pageSize + index + 1, name: casino.name, url: absoluteUrl(`/casino/${casino.slug}`) })) },
  ];

  return <div className={styles.page}>
    {schemas.map((schema, index) => <script dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} key={index} type="application/ld+json" />)}
    <section className={styles.hero}>
      <div className={styles.shell}>
        <div className={styles.heroGrid}>
          <header><p>Independent casino discovery · Published reviews · 18+</p><h1>Casino reviews,<br /><em>without the noise.</em></h1><span>Search published editorial profiles, compare the facts that matter and keep review access separate from commercial availability.</span><a href="#casino-directory">Explore the directory <b aria-hidden="true">↓</b></a></header>
          <DirectoryReviewPreview casino={result.items[0]} />
        </div>
      </div>
    </section>

    <section className={styles.directory} id="casino-directory">
      <div className={styles.shell}>
        <div className={styles.sectionIntro}><p>Casino directory</p><h2>Find a published review that fits your priorities.</h2><span>Search and filter canonical editorial snapshots. Draft content, raw affiliate destinations and private operator data never belong here.</span></div>
        <div className={styles.disclosure}><strong>Affiliate disclosure</strong><p>SevenBet may receive commission from eligible governed visit links. This does not change the editorial review. Gambling involves risk; no listing guarantees winnings or income.</p><Link href="/methodology">How reviews work →</Link></div>
        <DiscoveryControls result={result} />
        <ActiveDiscoveryFilters result={result} />
        <DiscoveryResults result={result} />
      </div>
    </section>

    <section className={styles.readingGuide}><div className={styles.shell}><div className={styles.sectionIntro}><p>How to read the directory</p><h2>Separate evidence from availability.</h2></div><div className={styles.guideGrid}>{[
      ["01", "Published evidence", "Names, licences, markets, payments and bonus terms come from the current published editorial snapshot."],
      ["02", "Editorial score", "A score is an editorial assessment, not a promise of safety, winnings, access or product performance."],
      ["03", "Visit availability", "A visit action appears only when a governed offer, an active tracking link and an internal redirect are available."],
      ["04", "Your responsibility", "Confirm local law, operator terms and account eligibility yourself. A market preference is not proof of location."],
    ].map(([number, title, copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

    <section className={styles.anatomy}><div className={styles.shell}><div className={styles.sectionIntro}><p>Review anatomy</p><h2>Facts first. Commercial action last.</h2><span>Every card keeps the published review usable even when no visit link can be shown.</span></div><div className={styles.anatomyGrid}><ol><li><b>Identity and freshness</b><span>Canonical name, logo and latest published editorial timestamp.</span></li><li><b>Evidence labels</b><span>Published licence, market and payment information only.</span></li><li><b>Bonus terms</b><span>Displayed only when an active public bonus summary exists.</span></li><li><b>Governed action</b><span>Internal redirect only; unavailable states remain explicit.</span></li></ol><div><strong>Review access is not a commercial entitlement.</strong><p>A casino can remain visible for research while its visit action is unavailable, restricted or no longer eligible.</p><Link href="/methodology">Read the full methodology</Link></div></div></div></section>

    <section className={styles.compare}><div className={styles.shell}><div><p>Continue comparing</p><h2>Look beyond a single headline.</h2><span>Compare published bonus terms or inspect the current best-offer editorial view before deciding what to read next.</span></div><nav aria-label="Related comparison pages"><Link href="/bonuses"><span>Published bonus terms</span><b>Browse bonuses →</b></Link><Link href="/best-offers"><span>Editorial comparison</span><b>See best offers →</b></Link><Link href="/responsible-gambling"><span>Stay in control</span><b>Responsible gambling →</b></Link></nav></div></section>

    <section className={styles.faq}><div className={styles.shell}><div className={styles.sectionIntro}><p>Questions before you compare</p><h2>Clear boundaries matter.</h2></div><div>{[
      ["Does a listing mean I can access the casino?", "No. A published review is editorial content. Access and legal eligibility depend on your location, the operator and applicable law."],
      ["Why can a review have no visit button?", "The review remains useful even if no eligible governed offer, tracking link or redirect is currently available."],
      ["Does the market filter detect my country?", "No. It is a declared preference used to filter published information; it is not GEO detection or legal advice."],
      ["Are bonus terms guaranteed current?", "Only the current published snapshot is rendered, but operator terms can change. Verify final terms with the operator before acting."],
    ].map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></div></section>
  </div>;
}
