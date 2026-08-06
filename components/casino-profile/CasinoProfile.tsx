import Link from "next/link";

import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";
import { bonusTerms, casinoProfileFacts, casinoProfileFaq, formatProfileDate, governedVisitHref, publishedScore } from "@/lib/casino-profile/presentation";

import { CasinoOutboundAction } from "./CasinoOutboundAction";
import styles from "./CasinoProfile.module.css";

function CasinoLogo({ casino }: { casino: PublicCasinoDTO }) {
  return <div className={styles.logo}>{casino.media.logo
    ? <img alt={casino.media.logo.alt || `${casino.name} logo`} height={casino.media.logo.height ?? 96} src={casino.media.logo.url} width={casino.media.logo.width ?? 160} />
    : <span aria-hidden="true">{casino.name.slice(0, 1).toUpperCase()}</span>}
  </div>;
}

function OfferCard({ casino, href }: { casino: PublicCasinoDTO; href: string | null }) {
  const bonus = casino.bonuses[0];
  const terms = bonusTerms(bonus);
  return <aside className={styles.offerCard} aria-label={href ? "Eligible published offer" : "Commercial visit unavailable"}>
    <p className={styles.offerEyebrow}>{bonus ? "Published offer" : "Offer status"}</p>
    <h2>{bonus?.title ?? "No active public offer"}</h2>
    {bonus?.summary ? <p className={styles.offerSummary}>{bonus.summary}</p> : null}
    {terms.length ? <ul>{terms.slice(0, 5).map((term) => <li key={term}>{term}</li>)}</ul> : null}
    {href ? <CasinoOutboundAction casinoName={casino.name} href={href} /> : <div className={styles.unavailableAction} aria-disabled="true">Offer unavailable</div>}
    <p className={styles.riskCopy}>18+ · Published terms apply · Gambling involves financial risk</p>
  </aside>;
}

export function CasinoProfile({ casino }: { casino: PublicCasinoDTO }) {
  const score = publishedScore(casino);
  const reviewedAt = formatProfileDate(casino.lastReviewedAt ?? casino.publishedAt);
  const href = governedVisitHref(casino);
  const bonus = casino.bonuses[0];
  const facts = casinoProfileFacts(casino);
  const faq = casinoProfileFaq(casino);
  const firstPayment = casino.payments[0];
  const signals = [
    casino.licenses[0] ? `${casino.licenses[0].authority}${casino.licenses[0].lastVerifiedAt ? " checked" : " listed"}` : null,
    casino.payments.length ? casino.payments.slice(0, 2).map((item) => item.name).join(" + ") : null,
    firstPayment?.withdrawalTime ? `${firstPayment.withdrawalTime} withdrawals` : null,
  ].filter((item): item is string => Boolean(item));

  return <article className={styles.page} data-casino-profile data-commercial-state={href ? "available" : "unavailable"}>
    <section className={styles.hero} aria-labelledby="casino-profile-title">
      <div className={styles.shell}>
        <p className={styles.breadcrumb}><Link href="/casinos">Casinos</Link> / {casino.name} review</p>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <div className={styles.identity}>
              <CasinoLogo casino={casino} />
              <div><strong>{casino.name}</strong>{reviewedAt ? <span>Reviewed {reviewedAt}</span> : <span>Published review</span>}</div>
              <span className={styles.agePill}>18+ only</span>
            </div>
            <h1 id="casino-profile-title">{casino.name} review</h1>
            <div className={score === null ? styles.verdictOnly : styles.scoreVerdict}>
              {score !== null ? <strong aria-label={`Editorial score ${score.toFixed(1)} out of 10`}>{score.toFixed(1)}</strong> : null}
              <p>{casino.summary}</p>
            </div>
            {signals.length ? <div className={styles.signals} aria-label="Published review signals">{signals.map((signal, index) => <span className={index === 0 && casino.licenses[0]?.lastVerifiedAt ? styles.verifiedSignal : undefined} key={signal}>{signal}</span>)}</div> : null}
            <p className={styles.commission}>SevenBet may earn a commission through an eligible governed link. This does not change the editorial score.</p>
          </div>
          <OfferCard casino={casino} href={href} />
        </div>
      </div>
    </section>

    <nav className={styles.decisionBar} aria-label="Casino review sections">
      <div className={styles.decisionInner}>
        <div><a href="#overview">Overview</a><a href="#offer">Offer</a><a href="#safety">Safety</a><a href="#faq">FAQ</a></div>
        {href ? <CasinoOutboundAction casinoName={casino.name} compact href={href} /> : <span className={styles.compactUnavailable} aria-disabled="true">Offer unavailable</span>}
      </div>
    </nav>

    <section className={styles.overview} id="overview" aria-labelledby="overview-title">
      <div className={styles.shell}>
        <p className={styles.eyebrow}>The 30-second answer</p>
        <h2 id="overview-title">Should you choose {casino.name}?</h2>
        <div className={styles.overviewGrid}>
          <div>
            <div className={styles.decisionSummary}><p>{casino.reviewContent || casino.summary}</p></div>
            {casino.pros.length ? <div className={styles.standout}><h3>Published strengths</h3><ul>{casino.pros.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
            {casino.cons.length ? <div className={styles.watchouts}><h3>Published watch-outs</h3><ul>{casino.cons.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
          </div>
          {facts.length ? <dl className={styles.factList}>{facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl> : <div className={styles.neutralState}><strong>Facts unavailable</strong><p>No additional public facts are attached to this review.</p></div>}
        </div>
      </div>
    </section>

    <section className={styles.evidence} id="offer" aria-labelledby="evidence-title">
      <div className={styles.shell}>
        <p className={styles.eyebrow}>Published evidence</p>
        <h2 id="evidence-title">Everything that matters before you click.</h2>
        <div className={styles.evidenceGrid}>
          <article className={styles.publishedOffer}>
            <p>{bonus ? "Current published offer" : "Offer status"}</p>
            <h3>{bonus?.title ?? "No active public offer is attached."}</h3>
            {bonus?.summary ? <span>{bonus.summary}</span> : null}
            {bonusTerms(bonus).length ? <dl>{bonusTerms(bonus).map((term, index) => <div key={term}><dt>{String(index + 1).padStart(2, "0")}</dt><dd>{term}</dd></div>)}</dl> : null}
            {href ? <CasinoOutboundAction casinoName={casino.name} href={href} /> : <div className={styles.reviewAvailable} role="note"><strong>Review available · Visit unavailable</strong><p>The editorial profile remains readable. No operator CTA or destination is exposed.</p><a href="#safety">Continue reading review</a></div>}
          </article>
          <article className={styles.checkedEvidence} id="safety">
            <p>What is published</p>
            <h3>Evidence stays separate from commercial availability.</h3>
            <dl>
              {casino.licenses.map((license) => <div key={`${license.authority}-${license.licenseNumber ?? "listed"}`}><dt>Licence</dt><dd><strong>{license.authority}</strong><span>{license.licenseNumber ?? "Number not published"}{license.lastVerifiedAt ? ` · checked ${formatProfileDate(license.lastVerifiedAt)}` : " · verification date unavailable"}</span></dd></div>)}
              {casino.payments.length ? <div><dt>Payments</dt><dd><strong>{casino.payments.map((item) => item.name).join(", ")}</strong><span>Methods listed in the public profile</span></dd></div> : null}
              {casino.responsibleGamblingTools.length ? <div><dt>Control tools</dt><dd><strong>{casino.responsibleGamblingTools.join(", ")}</strong><span>Availability should be checked before depositing</span></dd></div> : null}
            </dl>
            {!casino.licenses.length && !casino.payments.length && !casino.responsibleGamblingTools.length ? <div className={styles.neutralState}><strong>Evidence unavailable</strong><p>No licence, payment or control-tool fields are currently published.</p></div> : null}
          </article>
        </div>
      </div>
    </section>

    <section className={styles.methodology} aria-labelledby="methodology-title">
      <div className={styles.shell}>
        <div className={styles.methodologyGrid}>
          <div><p className={styles.darkEyebrow}>Editorial verdict</p><h2 id="methodology-title">A useful review does not depend on a visit link.</h2><p>{casino.summary}</p></div>
          <div className={styles.methodologyPanel}>
            {score !== null ? <div className={styles.methodologyScore}><strong>{score.toFixed(1)}</strong><span>Published editorial score / 10</span></div> : null}
            <ul>
              {casino.licenses.length ? <li><span>Licence evidence</span><strong>Published</strong></li> : null}
              {casino.payments.length ? <li><span>Payment evidence</span><strong>Published</strong></li> : null}
              {casino.bonuses.length ? <li><span>Offer terms</span><strong>Published</strong></li> : null}
              <li><span>Eligible visit route</span><strong>{href ? "Available" : "Unavailable"}</strong></li>
            </ul>
            <Link href="/methodology">Read the review methodology <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </div>
    </section>

    <section className={styles.faq} id="faq" aria-labelledby="faq-title">
      <div className={styles.shell}>
        <div className={styles.faqGrid}>
          <div><p className={styles.eyebrow}>Questions, answered</p><h2 id="faq-title">What to know about {casino.name}.</h2><Link className={styles.helpLink} href="/responsible-gambling">Open protected Help</Link></div>
          <div>{faq.map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div>
        </div>
      </div>
    </section>

    {bonus ? <section className={styles.finalOffer} aria-label="Published offer summary"><div className={styles.shell}><div><p>{href ? "Published offer · Eligible route" : "Published offer · Visit unavailable"}</p><h2>{bonus.title}</h2>{bonus.summary ? <span>{bonus.summary}</span> : null}</div>{href ? <CasinoOutboundAction casinoName={casino.name} href={href} /> : <div className={styles.unavailableAction} aria-disabled="true">Offer unavailable</div>}</div></section> : null}
  </article>;
}
