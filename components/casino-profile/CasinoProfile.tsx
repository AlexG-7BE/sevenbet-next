import Link from "next/link";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { CasinoProfileInteractions } from "@/components/casino-profile/CasinoProfileInteractions";
import type { CasinoEditorialDocument, EditorialBlock } from "@/lib/editorial-review/types";
import {
  formatProfileDate,
  formatProfileMoney,
  profileAction,
  profileFaqItems,
  profileOfferHeadline,
  profileReviewFreshness,
  selectProfileBonus,
} from "@/lib/casino-profile/presentation";
import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";
import { isTemporaryDemoCasinoId } from "@/lib/demo-data/temporary-demo-authority";
import { classifyMediaRatio, isCasinoHeroMediaCompatible, mayPresentPromotionalMedia } from "@/lib/media/media-presentation";
import { formatProductMessage, type ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";

import styles from "./CasinoProfile.module.css";

function Signal({ children, verified = false }: { children: React.ReactNode; verified?: boolean }) {
  return <span className={verified ? styles.verifiedSignal : styles.signal}>{children}</span>;
}

function UnavailableAction({ messages }: { messages: ProductPageMessages }) {
  return <span aria-disabled="true" className={styles.unavailableAction}>{messages.profile.offerUnavailable}</span>;
}

function EditorialBlockView({ block }: { block: EditorialBlock }) {
  if (block.type === "paragraph") return <p>{block.text}</p>;
  if (block.type === "heading") return <h4>{block.text}</h4>;
  if (block.type === "quote") return <blockquote><p>{block.text}</p>{block.attribution ? <cite>— {block.attribution}</cite> : null}</blockquote>;
  if (block.type === "divider") return <hr />;
  if (block.type === "faq" || block.type === "image" || block.type === "video") return null;
  if ("items" in block) {
    const List = block.type === "numbered-list" ? "ol" : "ul";
    return <List>{block.items.map((item) => <li key={item}>{item}</li>)}</List>;
  }
  return <aside className={block.type === "warning" || block.type === "responsible-gambling" ? styles.editorialWarning : styles.editorialNote}><strong>{block.title}</strong><p>{block.text}</p></aside>;
}

function EditorialEvidence({ document, demonstration, messages, locale }: { document: CasinoEditorialDocument; demonstration: boolean; messages: ProductPageMessages; locale: string }) {
  return <section aria-labelledby="editorial-review-heading" className={styles.editorialSection} data-motion-reveal data-nav-theme="light" id="editorial-review">
    <div className={styles.sectionHeading}>
      <p>{demonstration ? messages.profile.demoReview : messages.profile.publishedReview}</p>
      <h2 id="editorial-review-heading">{document.title}</h2>
      <span>{document.summary}</span>
      <small>{document.author}{formatProfileDate(document.factCheckedAt, locale) ? ` · ${messages.common.current} ${formatProfileDate(document.factCheckedAt, locale)}` : ""}</small>
    </div>
    <div className={styles.editorialLayout}>
      <nav aria-label={messages.profile.currentReview}>{document.sections.slice().sort((a, b) => a.order - b.order).map((section) => <a href={`#editorial-${section.id}`} key={section.id}>{section.title}</a>)}</nav>
      <div className={styles.editorialGrid}>{document.sections.slice().sort((a, b) => a.order - b.order).map((section) => <article id={`editorial-${section.id}`} key={section.id}>
        <span>{section.kind.replaceAll("-", " ")}</span>
        <h3>{section.title}</h3>
        {section.blocks.map((block) => <EditorialBlockView block={block} key={block.id} />)}
      </article>)}</div>
    </div>
  </section>;
}

export function CasinoProfile({ casino, editorial, messages, presentation, availableForPresentation }: { casino: PublicCasinoDTO; editorial: CasinoEditorialDocument | null; messages: ProductPageMessages; presentation: PresentationResolution; availableForPresentation: boolean }) {
  const demo = isTemporaryDemoCasinoId(casino.id);
  const bonus = selectProfileBonus(casino);
  const projectedAction = availableForPresentation ? profileAction(casino, bonus) : null;
  const action = projectedAction ? { ...projectedAction, label: `${messages.common.actionAvailable}: ${casino.name}` } : null;
  const faq = presentation.locale === "en-GB"
    ? profileFaqItems(casino, bonus, editorial)
    : [
        { question: messages.casinos.faqReviewOnlyQuestion, answer: messages.casinos.faqReviewOnlyAnswer },
        { question: messages.bestOffers.faqWageringQuestion, answer: messages.bestOffers.faqWageringAnswer },
        { question: messages.casinos.faqCommissionQuestion, answer: messages.casinos.faqCommissionAnswer },
      ];
  const freshness = profileReviewFreshness(casino);
  const licence = casino.licenses[0] ?? null;
  const licenceChecked = Boolean(licence?.lastVerifiedAt);
  const payments = casino.payments.slice(0, 2).map((payment) => payment.name);
  const withdrawal = casino.payments.find((payment) => payment.withdrawalTime)?.withdrawalTime ?? null;
  const minimumDeposit = bonus ? formatProfileMoney(bonus.minimumDeposit, bonus.currency, presentation.locale) : null;
  const maximumBet = bonus ? formatProfileMoney(bonus.maximumBet, bonus.currency, presentation.locale) : null;
  const publishedGameCount = Math.max(0, ...casino.categories.map((category) => category.gameCount ?? 0), ...casino.providers.map((provider) => provider.gameCount ?? 0));
  const age = Math.max(18, ...casino.countries.flatMap((country) => country.minimumAge ? [country.minimumAge] : []));
  const scoreCategories = editorial?.trustScore?.categories ?? [];
  const reviewEvidence = editorial?.trustScore?.evidence?.slice(0, 3) ?? casino.pros.slice(0, 3);
  const offerHeadline = bonus
    ? presentation.locale === "en-GB" ? profileOfferHeadline(bonus, presentation.locale) : bonus.title
    : null;
  const structuredOfferHeading = presentation.locale === "en-GB" && bonus && bonus.percentage !== null && bonus.maximumBonus !== null
    ? {
        primary: `${bonus.percentage}% · ${formatProfileMoney(bonus.maximumBonus, bonus.currency, presentation.locale)}`,
        secondary: bonus.freeSpins ? `+ ${bonus.freeSpins} Free Spins` : null,
      }
    : null;
  const heroRatio = classifyMediaRatio({ width: casino.media.hero?.width, height: casino.media.hero?.height });
  const heroMediaAvailable = Boolean(
    casino.media.hero
    && isCasinoHeroMediaCompatible(heroRatio)
    && mayPresentPromotionalMedia({ demonstration: demo, governedActionAvailable: Boolean(action) }),
  );

  return <article className={styles.page} data-runtime-renderer="casino-review">
    <div aria-hidden="true" className={styles.readProgress} data-casino-read-progress />
    <CasinoProfileInteractions />
    <div className={styles.shell}>
      <section aria-labelledby="casino-profile-title" className={styles.hero} data-nav-theme={heroMediaAvailable ? "photo" : "dark"}>
        <div className={styles.heroReview}>
          <nav aria-label={messages.common.breadcrumb} className={styles.breadcrumb}><Link href={productHref(presentation, "/casinos")}>{messages.casinos.directoryTitle}</Link><span aria-hidden="true">/</span><span aria-current="page">{casino.name} {messages.profile.review}</span></nav>
          {demo ? <p className={styles.demoDisclosure} role="note"><strong>{messages.common.demoData}.</strong> {messages.profile.demoDisclosure}</p> : null}
          {!availableForPresentation ? <p className={styles.demoDisclosure} role="note"><strong>{formatProductMessage(messages.profile.marketUnavailable, { market: presentation.market.seoDisplayName })}.</strong> {formatProductMessage(messages.profile.marketUnavailableCopy, { market: presentation.market.seoDisplayName })}</p> : null}
          <p className={styles.heroKicker}>B4GAMBLE · {messages.profile.review} · {formatProfileDate(casino.lastReviewedAt || casino.publishedAt, presentation.locale) || messages.common.current}</p>
          <div className={styles.identityRow}>
            <div className={styles.logo}>
              {casino.media.logo ? <img alt={casino.media.logo.alt || `${casino.name} logo`} height={casino.media.logo.height || 80} src={casino.media.logo.url} width={casino.media.logo.width || 80} /> : <span aria-hidden="true">{casino.name.slice(0, 1).toUpperCase()}</span>}
            </div>
            <div><small>{messages.profile.operatorReview}</small><strong>{casino.name}</strong>{freshness ? <span>{messages.common.current} {freshness.value}</span> : <span>{demo ? messages.profile.demoReview : messages.profile.publishedReview}</span>}</div>
            <Signal>{demo ? messages.common.demoData : `${age}+`}</Signal>
          </div>
          <h1 id="casino-profile-title">{casino.name}</h1>
          <div className={styles.scoreVerdict}>
            <div><strong aria-label={`${messages.common.editorScore} ${casino.editorScore} / 10`}>{casino.editorScore.toFixed(1)}</strong><span aria-hidden="true">★★★★★</span><small>{messages.common.editorScore}</small></div>
            <p><em>{messages.profile.verdict}</em> {editorial?.summary || casino.summary}</p>
          </div>
          <div aria-label={demo ? messages.common.demoData : messages.common.sourceStatus} className={styles.signals}>
            {licence ? <Signal verified={!demo && licenceChecked}>{demo ? messages.common.demoData : `${messages.common.licence} · ${licenceChecked ? messages.common.current : messages.common.notListed}`}</Signal> : null}
            {payments.length ? <Signal>{demo ? messages.common.demoData : payments.join(" + ").toUpperCase()}</Signal> : null}
            {withdrawal ? <Signal>{demo ? messages.common.demoData : withdrawal}</Signal> : null}
          </div>
          {bonus ? <div className={styles.heroOfferSummary}>
            <div className={styles.heroOfferCopy}><span>{demo ? messages.common.demoData : messages.common.current}</span><strong>{offerHeadline}</strong><dl>
              <div><dt>{messages.common.wagering}</dt><dd>{bonus.wageringText || (bonus.wageringMultiplier !== null ? `${bonus.wageringMultiplier}×` : messages.common.notListed)}</dd></div>
              <div><dt>{messages.common.minimumDeposit}</dt><dd>{minimumDeposit ?? messages.common.notListed}</dd></div>
              {bonus.eligibility ? <div><dt>{messages.common.eligibility}</dt><dd>{bonus.eligibility}</dd></div> : null}
              {bonus.expiresAt ? <div><dt>{messages.common.expiry}</dt><dd>{formatProfileDate(bonus.expiresAt, presentation.locale)}</dd></div> : null}
            </dl></div>
            <div className={styles.heroOfferAction}>{action ? <CasinoOutboundAction action={action} messages={messages.outbound} /> : <UnavailableAction messages={messages} />}</div>
          </div> : null}
          <p className={styles.profileDisclosure}>{demo ? messages.common.demoDisclosure : messages.bestOffers.commissionNote}</p>
        </div>

        <aside aria-label={heroMediaAvailable ? casino.name : messages.common.commercialUnavailable} className={styles.heroMedia} data-media-ratio={casino.media.hero ? heroRatio : "missing"}>
          {heroMediaAvailable && casino.media.hero ? <div className={styles.heroMediaCanvas}><img alt={casino.media.hero.alt || casino.name} height={casino.media.hero.height ?? 900} src={casino.media.hero.url} width={casino.media.hero.width ?? 1600} /></div> : <div className={styles.heroMediaFallback}><span>B4GAMBLE</span><strong>{messages.common.commercialUnavailable}</strong><p>{messages.common.reviewAvailableNoAction}</p><i aria-hidden="true" /></div>}
        </aside>
      </section>

      <nav aria-label={messages.profile.currentReview} className={styles.decisionBar} data-casino-decision-bar>
        <span className={styles.decisionIdentity}><b>{casino.name} · {casino.editorScore.toFixed(1)}</b><small>{offerHeadline ?? messages.profile.publishedReview}</small></span>
        <div><a href="#overview">{messages.profile.overview}</a><a href="#offer-evidence">{messages.profile.offerEvidence}</a><a href="#verdict">{messages.profile.verdict}</a><a href="#faq">{messages.profile.questions}</a></div>
        {action ? <CasinoOutboundAction action={action} className={styles.compactAction} messages={messages.outbound} /> : <UnavailableAction messages={messages} />}
      </nav>

      <section aria-labelledby="overview-heading" className={`${styles.section} ${styles.overviewSection}`} data-motion-reveal data-nav-theme="light" id="overview">
        <div className={`${styles.sectionHeading} ${styles.overviewHeading}`}>
          <p>{messages.profile.quickCheck}</p>
          <h2 id="overview-heading">{messages.profile.quickCheck}</h2>
          <span>{messages.profile.quickCheckCopy}</span>
        </div>
        <div className={styles.overviewGrid}>
          <section className={styles.checkCard}><h3>{messages.profile.bestFor}</h3><ul>{casino.pros.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul></section>
          <section className={styles.checkCard}><h3>{messages.profile.whyWeLikeIt}</h3><ul>{reviewEvidence.map((item) => <li key={item}>✓ {item}</li>)}</ul></section>
          <section className={styles.checkCard}><h3>{messages.profile.thingsToKnow}</h3><ul>{casino.cons.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul></section>
          <dl className={`${styles.facts} ${styles.checkCard}`}>
            <div><dt>{messages.profile.founded}</dt><dd>{casino.foundedYear ?? messages.common.notListed}</dd></div>
            <div><dt>{messages.common.licence}</dt><dd>{licence?.authority ?? messages.common.notListed}</dd></div>
            <div><dt>{messages.profile.games}</dt><dd>{publishedGameCount ? `${new Intl.NumberFormat(presentation.locale).format(publishedGameCount)}+` : messages.common.notListed}</dd></div>
            <div><dt>{messages.common.payout}</dt><dd>{withdrawal ?? messages.common.notListed}</dd></div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="offer-heading" className={`${styles.section} ${styles.offerSection}`} data-motion-reveal data-nav-theme="cream" id="offer-evidence">
        <div className={styles.sectionHeading}>
          <p>{messages.profile.offerEvidence}</p>
          <h2 id="offer-heading">{messages.profile.offerTerms}</h2>
        </div>
        <div className={styles.offerComposition}>
          <div className={styles.offerCopy}>
            <span>{demo ? messages.common.demoData : messages.common.materialTerms}</span>
            {bonus ? <>
              <h3>{structuredOfferHeading ? <><span>{structuredOfferHeading.primary}</span>{structuredOfferHeading.secondary ? <em>{structuredOfferHeading.secondary}</em> : null}</> : offerHeadline}</h3>
              <p>{bonus.summary}</p>
              {action ? <CasinoOutboundAction action={action} messages={messages.outbound} /> : <UnavailableAction messages={messages} />}
              <small>18+ · {messages.common.materialTerms}</small>
            </> : <div className={styles.neutralState}><strong>{messages.profile.offerUnavailable}</strong><p>{messages.common.reviewAvailableNoAction}</p></div>}
          </div>
          <div className={styles.offerTermsCard}>
            {bonus ? <dl className={styles.termRows}>
              {bonus.wageringMultiplier !== null || bonus.wageringText ? <div><dt>{messages.common.wagering}</dt><dd>{bonus.wageringText || `${bonus.wageringMultiplier}×`}</dd></div> : null}
              {minimumDeposit ? <div><dt>{messages.common.minimumDeposit}</dt><dd>{minimumDeposit}</dd></div> : null}
              {maximumBet ? <div><dt>{messages.common.maximumBet}</dt><dd>{maximumBet}</dd></div> : null}
              {bonus.expiresAt ? <div><dt>{messages.common.expiry}</dt><dd>{formatProfileDate(bonus.expiresAt, presentation.locale)}</dd></div> : null}
              {bonus.eligibility ? <div><dt>{messages.common.eligibility}</dt><dd>{bonus.eligibility}</dd></div> : null}
              <div><dt>{messages.common.payout}</dt><dd>{withdrawal ?? messages.common.notListed}</dd></div>
            </dl> : null}
            <details className={styles.evidenceDisclosure}>
              <summary>{messages.profile.evidencePaymentsTools}</summary>
              <dl>
                {licence ? <div><dt>{messages.profile.licenceRecord}</dt><dd>{licence.authority}</dd></div> : null}
                {casino.payments.length ? <div><dt>{messages.profile.paymentRecords}</dt><dd>{casino.payments.map((payment) => payment.name).join(", ")}</dd></div> : null}
                {casino.providers.length ? <div><dt>{messages.profile.providers}</dt><dd>{casino.providers.map((provider) => provider.name).join(", ")}</dd></div> : null}
                {casino.responsibleGamblingTools.length ? <div><dt>{messages.profile.controlTools}</dt><dd>{casino.responsibleGamblingTools.join(", ")}</dd></div> : null}
              </dl>
            </details>
          </div>
        </div>
      </section>

      {editorial ? <><p className={styles.profileDisclosure}>{messages.profile.originalEditorialNotice}</p><EditorialEvidence demonstration={demo} document={editorial} locale={presentation.locale} messages={messages} /></> : null}

      <section aria-labelledby="verdict-heading" className={`${styles.verdict} ${scoreCategories.length ? styles.verdictWithBreakdown : ""}`} data-motion-reveal data-nav-theme="cream" id="verdict">
        <div>
          <p>B4GAMBLE · {messages.profile.verdict}</p>
          <h2 id="verdict-heading">Why {casino.editorScore.toFixed(1)}</h2>
          <span>{scoreCategories.length ? messages.profile.scoreExplanation : editorial?.summary || casino.reviewContent}</span>
          {!scoreCategories.length && casino.cons.length ? <div className={styles.verdictLimit}><strong>{messages.profile.keepInView}</strong><span>{casino.cons[0]}</span></div> : null}
        </div>
        {scoreCategories.length ? <div className={styles.scoreBreakdown}>
          {scoreCategories.map((category, index) => <div className={styles.scoreRow} data-score-row key={category.key} style={{ "--score-delay": `${index * 90}ms`, "--score-width": `${Math.min(10, Math.max(0, category.score)) * 10}%` } as React.CSSProperties}>
            <div><strong>{category.key.replaceAll("-", " ")}</strong><span>{category.score.toFixed(1)}</span></div>
            <i aria-hidden="true"><b /></i>
          </div>)}
          <p>{messages.common.editorScore}: <Link href="/methodology">{messages.common.methodology}</Link> · <Link href="/affiliate-disclosure">{messages.common.affiliateDisclosure}</Link>.</p>
        </div> : <div className={styles.scorePanel}>
          <strong>{casino.editorScore.toFixed(1)}</strong><span>{messages.common.editorScore} / 10</span>
          <dl>
            <div><dt>{messages.profile.licenceRecord}</dt><dd>{demo ? messages.common.demoData : licenceChecked ? messages.common.current : licence ? messages.common.published : messages.common.notListed}</dd></div>
            <div><dt>{messages.profile.offerTerms}</dt><dd>{demo && bonus ? messages.common.demoData : bonus ? messages.common.published : messages.common.notListed}</dd></div>
            <div><dt>{messages.profile.paymentRecords}</dt><dd>{casino.payments.length || messages.common.notListed}</dd></div>
            <div><dt>{messages.profile.controlTools}</dt><dd>{casino.responsibleGamblingTools.length || messages.common.notListed}</dd></div>
          </dl>
        </div>}
      </section>

      <section aria-labelledby="faq-heading" className={styles.faqSection} data-motion-reveal data-nav-theme="cream" id="faq">
        <div className={styles.sectionHeading}><p>{messages.profile.questions}</p><h2 id="faq-heading">{messages.profile.questions}: {casino.name.replace(/\s+casino$/i, "")}</h2></div>
        <div className={styles.faqGrid}>
          <div>{faq.slice(0, 3).map((item, index) => <details key={item.question} open={index === 0}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div>
          <aside className={styles.finalOffer} data-demo-state={demo ? "fictional" : undefined} data-motion-reveal data-nav-theme="dark">
            <div className={styles.finalOfferInner}>
              {bonus ? <><span>{demo ? messages.common.demoData : messages.profile.verdict}</span><h3>{casino.name} — <em>{casino.editorScore.toFixed(1)}</em></h3><p>{[offerHeadline, bonus.wageringText, minimumDeposit ? `${messages.common.minimumDeposit} ${minimumDeposit}` : null, withdrawal ? `${messages.common.payout} ${withdrawal}` : null].filter(Boolean).join(" · ")}</p>{action ? <CasinoOutboundAction action={action} messages={messages.outbound} /> : <UnavailableAction messages={messages} />}</> : <><span>{messages.profile.currentReview}</span><h3>{messages.profile.offerUnavailable}</h3><p>{messages.common.reviewAvailableNoAction}</p><UnavailableAction messages={messages} /></>}
            </div>
          </aside>
        </div>
      </section>

      <nav aria-label={messages.profile.relatedTitle} className={styles.relatedLinks}>
        <div><span>{messages.profile.relatedTitle}</span><h2>{messages.profile.relatedCopy}</h2></div>
        <div><Link href={productHref(presentation, "/casinos")}>{messages.common.browseReviews} <span aria-hidden="true">→</span></Link><Link href={productHref(presentation, "/bonuses")}>{demo ? messages.profile.exploreBonusInformation : messages.profile.compareBonusTerms} <span aria-hidden="true">→</span></Link><Link href="/methodology">{messages.common.reviewMethodology} <span aria-hidden="true">→</span></Link><Link href="/help">{messages.common.protectedHelp} <span aria-hidden="true">→</span></Link></div>
      </nav>
    </div>
  </article>;
}
