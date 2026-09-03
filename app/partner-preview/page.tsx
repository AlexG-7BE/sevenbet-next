import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { casinoRealCatalog } from "@/lib/casino-real-catalog/catalog";
import { PARTNER_PREVIEW_COOKIE, partnerPreviewAuthorized } from "@/lib/partner-preview/authority";

import styles from "./partner-preview.module.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Partner Casino Catalog Preview | B4GAMBLE",
  description: "Private, non-Production B4GAMBLE casino catalog preview.",
  robots: { index: false, follow: false, nocache: true },
};

function EditorialList({ title, items, tone }: { title: string; items: string[]; tone?: "positive" | "caution" }) {
  return <section className={styles.editorialList} data-tone={tone}>
    <h3>{title}</h3>
    <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
  </section>;
}

export default async function PartnerPreviewPage() {
  const token = (await cookies()).get(PARTNER_PREVIEW_COOKIE)?.value;
  if (!partnerPreviewAuthorized(token)) notFound();

  return <main className={styles.page}>
    <header className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.previewLabel}><span>PRIVATE PREVIEW</span><b>NON-PRODUCTION</b></div>
        <p className={styles.eyebrow}>B4GAMBLE · PARTNER CATALOG</p>
        <h1>Real catalog.<br /><em>Routes disabled.</em></h1>
        <p className={styles.lead}>Eight real editorial profiles, independent Editor Scores, sourced brand marks and the current partner-offer evidence. This surface cannot create a Production route and every outbound control is disabled.</p>
        <dl className={styles.heroStats}>
          <div><dt>Real casinos</dt><dd>8</dd></div>
          <div><dt>Demo identities</dt><dd>0</dd></div>
          <div><dt>Active outbound actions</dt><dd>0</dd></div>
          <div><dt>Editorial leader</dt><dd>Betsson · 8.8</dd></div>
        </dl>
      </div>
    </header>

    <section className={styles.matrix} aria-labelledby="catalog-matrix-heading">
      <div className={styles.sectionHeading}>
        <p>Complete release set</p>
        <h2 id="catalog-matrix-heading">Editorial order</h2>
        <span>Offer size and partner status do not influence this ranking.</span>
      </div>
      <div className={styles.matrixRows}>
        {casinoRealCatalog.map((casino, index) => <article key={casino.slug}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <img alt={`${casino.title} logo`} height={casino.brandMark.height} src={casino.brandMark.path} width={casino.brandMark.width} />
          <strong>{casino.title}</strong>
          <b>{casino.score.toFixed(1)}</b>
          <small>INFORMATIONAL ONLY · {casino.previewOffers.length} PREVIEW OFFER{casino.previewOffers.length === 1 ? "" : "S"}</small>
        </article>)}
      </div>
    </section>

    <section className={styles.catalog} aria-label="Casino profile previews">
      {casinoRealCatalog.map((casino, index) => <article className={styles.casino} id={casino.slug} key={casino.slug}>
        <header className={styles.casinoHeader}>
          <div className={styles.identity}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <img alt={`${casino.title} logo`} height={casino.brandMark.height} src={casino.brandMark.path} width={casino.brandMark.width} />
            <div><small>B4GAMBLE REVIEW</small><h2>{casino.title}</h2></div>
          </div>
          <div className={styles.score}><strong>{casino.score.toFixed(1)}</strong><span>EDITOR SCORE / 10</span></div>
          <p>{casino.summary}</p>
        </header>

        <div className={styles.editorialGrid}>
          <EditorialList items={casino.bestFor} title="Best For" />
          <EditorialList items={casino.whyWeLikeIt} title="Why We Like It" tone="positive" />
          <EditorialList items={casino.thingsToKnow} title="Things to Know" tone="caution" />
        </div>

        <div className={styles.evidenceLayout}>
          <section className={styles.facts}>
            <div className={styles.subheading}><p>Useful facts</p><h3>Evidence, with limits</h3></div>
            <dl>{casino.facts.map((fact) => <div key={fact.label}><dt>{fact.label}<span data-classification={fact.classification}>{fact.classification}</span></dt><dd>{fact.value}</dd></div>)}</dl>
          </section>

          <section className={styles.offers}>
            <div className={styles.subheading}><p>Partner Preview</p><h3>{casino.previewOffers.length ? "Observed offer evidence" : "No current offer claimed"}</h3></div>
            {casino.previewCreative ? <figure className={styles.creative}>
              <img alt={`${casino.title} authenticated generic partner creative`} height={casino.previewCreative.height} src={casino.previewCreative.path} width={casino.previewCreative.width} />
              <figcaption>Authenticated partner creative · Preview only · GEO unresolved</figcaption>
            </figure> : null}
            {casino.previewOffers.length ? <div className={styles.offerCards}>{casino.previewOffers.map((offer) => <article key={`${casino.slug}-${offer.label}`}>
              <small>{offer.label} · {offer.evidenceStatus}</small>
              <h4>{offer.amount}</h4>
              <p>{offer.scope}</p>
              <dl>
                <div><dt>Minimum deposit</dt><dd>{offer.minimumDeposit ?? "UNKNOWN"}</dd></div>
                <div><dt>Wagering</dt><dd>{offer.wagering ?? "UNKNOWN"}</dd></div>
                <div><dt>Bonus expiry</dt><dd>{offer.bonusExpiry ?? "UNKNOWN"}</dd></div>
                <div><dt>Free-spin expiry</dt><dd>{offer.freeSpinExpiry ?? "UNKNOWN"}</dd></div>
                <div><dt>Maximum bet</dt><dd>{offer.maximumBet ?? "UNKNOWN"}</dd></div>
              </dl>
              <p className={styles.offerNote}>{offer.availabilityNote}</p>
              <button disabled type="button">Outbound disabled</button>
            </article>)}</div> : <div className={styles.noOffer}><strong>No offer has been invented.</strong><p>The real review remains complete without a commercial promotion.</p><button disabled type="button">Outbound disabled</button></div>}
          </section>
        </div>
      </article>)}
    </section>

    <footer className={styles.footer}>
      <strong>Preview authority ends here.</strong>
      <p>No query, cookie, language selection or simulated market on this page can activate a public commercial route.</p>
    </footer>
  </main>;
}
