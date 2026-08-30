"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { CommercialOfferMedia, OperatorLogo } from "@/components/commercial-media/CommercialOfferMedia";
import { formatProfileScore } from "@/lib/casino-profile/presentation";
import { publicCasinoReviewHref } from "@/lib/public-casino/review-href";
import {
  curatedBonusSelectors as selectors,
  selectCuratedBonuses,
  type CuratedBonusSelector as Selector,
} from "@/lib/public-offer/curated-selector";
import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";
import { formatProductMessage, type ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";

import styles from "./CuratedBonusShortlist.module.css";

function money(value: number | null, currency: string | null, locale: string, notListed: string) {
  if (value === null) return notListed;
  if (!currency) return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  try { return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(value); }
  catch { return `${value} ${currency || ""}`.trim(); }
}

function Action({ offer, messages }: { offer: PublicOfferDTO; messages: ProductPageMessages }) {
  const href = offer.dataClassification !== "DEMO_FIXTURE" && offer.action.available && offer.action.href && /^\/r\/[a-z0-9][a-z0-9-]*$/i.test(offer.action.href) ? offer.action.href : null;
  if (!href) return <span className={styles.unavailable}>{messages.common.reviewOnly}</span>;
  return <CasinoOutboundAction action={{ href, label: messages.common.actionAvailable }} className={styles.action} messages={messages.outbound} />;
}

function Review({ offer, messages, presentation }: { offer: PublicOfferDTO; messages: ProductPageMessages; presentation: PresentationResolution }) {
  const href = publicCasinoReviewHref(offer.casino);
  return href ? <Link href={productHref(presentation, href)}>{messages.common.readReview}</Link> : null;
}

function payout(offer: PublicOfferDTO, messages: ProductPageMessages) {
  return offer.casino.payments.find((payment) => payment.supportsWithdrawals && payment.withdrawalTime)?.withdrawalTime || messages.common.notListed;
}

export function CuratedBonusShortlist({ offers, messages, presentation }: { offers: PublicOfferDTO[]; messages: ProductPageMessages; presentation: PresentationResolution }) {
  const [selector, setSelector] = useState<Selector>("Best Overall");
  const top = useMemo(() => selectCuratedBonuses(offers, selector), [offers, selector]);
  return <section className={styles.section} aria-labelledby="bonus-shortlist-title" data-motion-reveal data-nav-theme="light"><div className={styles.shell}>
    {offers.length ? <div className={styles.tabs} aria-label={messages.bonuses.directoryTitle} data-selector-group="curated-bonuses" role="group">{selectors.map((label) => {
      const localizedLabel = label === "Best Overall" ? messages.bonuses.selectorBestOverall
        : label === "Low Wagering" ? messages.bonuses.selectorLowWagering
          : label === "Low Deposit" ? messages.bonuses.selectorLowDeposit
            : label === "Crypto" ? messages.bonuses.selectorCrypto
              : messages.bonuses.selectorNewest;
      return <button aria-pressed={selector === label} key={label} onClick={() => setSelector(label)} type="button">{localizedLabel}</button>;
    })}</div> : null}
    <p className={styles.label} id="bonus-shortlist-title">{messages.bestOffers.sectionTitle} · {messages.bonuses.sortedByValue}</p>
    {!top.length ? <div className={styles.empty} role="status"><strong>{formatProductMessage(messages.bonuses.noMatchesTitle, { market: presentation.market.seoDisplayName })}</strong><p>{messages.bonuses.noMatchesCopy}</p></div> : <div className={styles.cards}>{top.map((offer, index) => <article className={index === 0 ? styles.primary : styles.card} key={`${offer.casino.id}:${offer.bonus.id}`}>
      <header><small>{offer.dataClassification === "DEMO_FIXTURE" ? messages.common.demoData : messages.common.published}</small><span className={styles.rank}>0{index + 1}</span></header>
      <strong className={styles.headline}>{offer.bonus.title}</strong>
      <div className={styles.identity}><OperatorLogo offer={offer} prominent={index === 0} /><div><h2>{offer.casino.name}</h2><small>{messages.common.editorScore} {formatProfileScore(offer.casino.editorScore, presentation.locale)} <span aria-hidden="true">★★★★★</span></small></div></div>
      <dl><div><dt>{messages.common.wagering}</dt><dd>{offer.bonus.wageringMultiplier === null ? offer.bonus.wageringText || messages.common.notListed : `${offer.bonus.wageringMultiplier}x`}</dd></div><div><dt>{messages.common.minimumDeposit}</dt><dd>{money(offer.bonus.minimumDeposit, offer.bonus.currency, presentation.locale, messages.common.notListed)}</dd></div><div><dt>{messages.common.maximumBonus}</dt><dd>{money(offer.bonus.maximumBonus, offer.bonus.currency, presentation.locale, messages.common.notListed)}</dd></div><div><dt>{messages.common.payout}</dt><dd>{payout(offer, messages)}</dd></div></dl>
      <p>{offer.bonus.importantConditions.slice(0, 2).join(" · ") || offer.bonus.summary}</p>
      <CommercialOfferMedia messages={messages} offer={offer} variant="bonus" />
      {offer.dataClassification === "DEMO_FIXTURE" ? <b className={styles.demo}>{messages.common.demoData} — {messages.common.demoDisclosure}</b> : null}
      <div className={styles.actions}><Action messages={messages} offer={offer} /><Review messages={messages} offer={offer} presentation={presentation} /></div>
    </article>)}</div>}
    {top.length ? <aside className={styles.method}><strong>{messages.bonuses.methodKicker}</strong><span>{messages.bonuses.sortedByValue}</span><span>{messages.bonuses.proofSources}</span><Link href="/bonus-guide">{messages.common.bonusGuide} →</Link></aside> : null}
  </div></section>;
}
