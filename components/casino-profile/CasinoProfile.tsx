import Link from "next/link";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { CasinoProfileInteractions } from "@/components/casino-profile/CasinoProfileInteractions";
import { ResponsivePlacementImage } from "@/components/media/ResponsivePlacementImage";
import type { CasinoEditorialDocument, EditorialBlock, EditorialSectionKind } from "@/lib/editorial-review/types";
import {
  formatProfileDate,
  formatProfileMoney,
  formatProfileScore,
  profileAction,
  profileFaqItems,
  profileOfferHeadline,
  profileReviewFreshness,
  selectProfileBonus,
} from "@/lib/casino-profile/presentation";
import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";
import { isTemporaryDemoCasinoId } from "@/lib/demo-data/temporary-demo-authority";
import type { ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import { commercialUiLabels } from "@/lib/i18n/commercial-ui-labels";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";
import { offerPresentationCopy } from "@/lib/public-offer/offer-presentation-copy";
import { formatCompactPayout, formatCompactWagering } from "@/lib/presentation/commercial-terms";

import styles from "./CasinoProfile.module.css";

function Signal({ children, verified = false }: { children: React.ReactNode; verified?: boolean }) {
  return <span className={verified ? styles.verifiedSignal : styles.signal}>{children}</span>;
}

function editorialSectionLabel(kind: EditorialSectionKind, messages: ProductPageMessages, locale: string) {
  if (locale === "en-GB") return kind.replaceAll("-", " ");
  const labels: Record<EditorialSectionKind, string> = {
    overview: messages.profile.overview,
    "key-facts": messages.profile.quickCheck,
    pros: messages.profile.bestFor,
    cons: messages.profile.thingsToKnow,
    trust: messages.common.sourceStatus,
    bonuses: messages.profile.offerTerms,
    payments: messages.profile.paymentRecords,
    games: messages.profile.games,
    licensing: messages.profile.licenceRecord,
    company: messages.profile.operatorReview,
    "responsible-gambling": messages.profile.controlTools,
    faq: messages.profile.questions,
    "related-casinos": messages.profile.relatedTitle,
    notes: messages.profile.keepInView,
  };
  return labels[kind];
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
  const contentOrigin = demonstration ? "localized-fixture" : "source-controlled";
  return <section aria-labelledby="editorial-review-heading" className={styles.editorialSection} data-motion-reveal data-nav-theme="light" id="editorial-review">
    <div className={styles.sectionHeading}>
      <p>{demonstration ? messages.profile.demoReview : messages.profile.publishedReview}</p>
      <h2 id="editorial-review-heading">{document.title}</h2>
      <span>{document.summary}</span>
      <small>{document.author}{formatProfileDate(document.factCheckedAt, locale) ? ` · ${messages.common.current} ${formatProfileDate(document.factCheckedAt, locale)}` : ""}</small>
    </div>
    <div className={styles.editorialLayout}>
      <nav aria-label={messages.profile.currentReview}>{document.sections.slice().sort((a, b) => a.order - b.order).map((section) => <a href={`#editorial-${section.id}`} key={section.id}>{section.title}</a>)}</nav>
      <div className={styles.editorialGrid}>{document.sections.slice().sort((a, b) => a.order - b.order).map((section) => <article data-content-origin={contentOrigin} id={`editorial-${section.id}`} key={section.id}>
        <span data-content-origin="localized-taxonomy">{editorialSectionLabel(section.kind, messages, locale)}</span>
        <h3>{section.title}</h3>
        {section.blocks.map((block) => <EditorialBlockView block={block} key={block.id} />)}
      </article>)}</div>
    </div>
  </section>;
}

export function CasinoProfile({ casino, editorial, messages, presentation, availableForPresentation }: { casino: PublicCasinoDTO; editorial: CasinoEditorialDocument | null; messages: ProductPageMessages; presentation: PresentationResolution; availableForPresentation: boolean }) {
  const demo = isTemporaryDemoCasinoId(casino.id);
  const informationalOnly = casino.presentationDisposition === "INFORMATIONAL_ONLY";
  const selectedBonus = selectProfileBonus(casino);
  const bonus = casino.offerPresentation?.relation === "EXACT" || casino.offerPresentation?.relation === "ROW" ? selectedBonus : null;
  const commercialLabels = commercialUiLabels(presentation.locale);
  const offerScope = offerPresentationCopy(casino.offerPresentation, messages, presentation);
  const projectedAction = !informationalOnly && bonus ? profileAction(casino, bonus) : null;
  const action = projectedAction ? { ...projectedAction, label: commercialLabels.visitCasino } : null;
  const faq = informationalOnly
    ? [
        { question: messages.casinos.faqReviewOnlyQuestion, answer: messages.casinos.faqReviewOnlyAnswer },
        { question: messages.casinos.faqDifferenceQuestion, answer: messages.casinos.faqDifferenceAnswer },
        { question: messages.casinos.faqCommissionQuestion, answer: messages.casinos.faqCommissionAnswer },
      ]
    : presentation.locale === "en-GB"
    ? profileFaqItems(casino, bonus, editorial)
    : [
        { question: messages.casinos.faqReviewOnlyQuestion, answer: messages.casinos.faqReviewOnlyAnswer },
        { question: messages.bestOffers.faqWageringQuestion, answer: messages.bestOffers.faqWageringAnswer },
        { question: messages.casinos.faqCommissionQuestion, answer: messages.casinos.faqCommissionAnswer },
      ];
  const freshness = profileReviewFreshness(casino, presentation.locale);
  const licence = casino.licenses[0] ?? null;
  const licenceEvidence = casino.licenses.map((entry) => entry.licenseNumber ? `${entry.authority} ${entry.licenseNumber}` : entry.authority).join(" · ");
  const licenceChecked = Boolean(licence?.lastVerifiedAt);
  const payments = casino.payments.slice(0, 2).map((payment) => payment.name);
  const withdrawal = formatCompactPayout(casino.payments, messages.common.notListed);
  const wagering = bonus ? formatCompactWagering(bonus.wageringMultiplier, bonus.wageringText, { notListed: messages.common.notListed, notStated: commercialLabels.notStated }) : messages.common.notListed;
  const minimumDeposit = bonus ? formatProfileMoney(bonus.minimumDeposit, bonus.currency, presentation.locale) : null;
  const maximumBet = bonus ? formatProfileMoney(bonus.maximumBet, bonus.currency, presentation.locale) : null;
  const publishedGameCount = Math.max(0, ...casino.categories.map((category) => category.gameCount ?? 0), ...casino.providers.map((provider) => provider.gameCount ?? 0));
  const age = Math.max(18, ...casino.countries.flatMap((country) => country.minimumAge ? [country.minimumAge] : []));
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
  const hasEditorScore = casino.editorScore !== null;
  const formattedEditorScore = casino.editorScore === null
    ? messages.common.notListed
    : formatProfileScore(casino.editorScore, presentation.locale);
  const heroOfferPanel = <aside aria-label={messages.profile.offerTerms} className={styles.heroOfferPanel} data-offer-relation={casino.offerPresentation?.relation} data-offer-state={bonus ? "current" : "unavailable"}>
    {bonus ? <>
      <span>{demo ? messages.profile.demoOfferField : offerScope.label}</span>
      <h2>{offerHeadline}</h2>
      <dl>
        <div><dt>{messages.common.wagering}</dt><dd>{wagering}</dd></div>
        <div><dt>{messages.common.minimumDeposit}</dt><dd>{minimumDeposit ?? messages.common.notListed}</dd></div>
        <div><dt>{messages.common.payout}</dt><dd>{withdrawal}</dd></div>
        <div><dt>{messages.common.eligibility}</dt><dd>{bonus.eligibility || messages.common.notListed}</dd></div>
      </dl>
      {action ? <CasinoOutboundAction action={action} context={{ source: "CTA", placement: "CASINO_OFFER_BLOCK" }} messages={messages.outbound} /> : null}
    </> : <><span>{messages.profile.offerTerms}</span><h2>{commercialLabels.noCurrentOffer}</h2></>}
  </aside>;

  return <article className={styles.page} data-market-profile-available={availableForPresentation} data-runtime-renderer="casino-review">
    <div aria-hidden="true" className={styles.readProgress} data-casino-read-progress />
    <CasinoProfileInteractions />
    <div className={styles.shell}>
      <section aria-labelledby="casino-profile-title" className={styles.hero} data-nav-theme="dark">
        <div className={styles.heroReview}>
          <nav aria-label={messages.common.breadcrumb} className={styles.breadcrumb}><Link href={productHref(presentation, "/casinos")}>{messages.casinos.directoryTitle}</Link><span aria-hidden="true">/</span><span aria-current="page">{casino.name} {messages.profile.review}</span></nav>
          {demo ? <p className={styles.demoDisclosure} role="note"><strong>{messages.common.demoData}.</strong> {messages.profile.demoDisclosure}</p> : null}
          <p className={styles.heroKicker}>B4GAMBLE · {messages.profile.review} · {formatProfileDate(casino.lastReviewedAt || casino.publishedAt, presentation.locale) || messages.common.current}</p>
          <div className={styles.identityRow}>
            <div className={styles.logo}>
              {casino.media.logo ? <ResponsivePlacementImage alt="" height={casino.media.logo.height || 80} media={casino.media.logo} width={casino.media.logo.width || 80} /> : null}
            </div>
            <div><small>{messages.profile.operatorReview}</small><strong>{casino.name}</strong>{freshness ? <span>{demo ? messages.profile.demoReview : `${messages.common.current} ${freshness.value}`}</span> : <span>{demo ? messages.profile.demoReview : messages.profile.publishedReview}</span>}</div>
            <Signal>{demo ? messages.profile.demoAgeField : `${age}+`}</Signal>
          </div>
          <h1 id="casino-profile-title">{casino.name}</h1>
          <div className={styles.scoreVerdict}>
            <div><strong aria-label={hasEditorScore ? `${messages.common.editorScore} ${formattedEditorScore} / 10` : `${messages.common.editorScore} ${messages.common.notListed}`}>{formattedEditorScore}</strong>{hasEditorScore ? <span aria-hidden="true">★★★★★</span> : null}<small>{messages.common.editorScore}</small></div>
            <p><em>{messages.profile.verdict}</em> {editorial?.summary || casino.summary}</p>
          </div>
          <div aria-label={demo ? messages.common.demoData : messages.common.sourceStatus} className={styles.signals}>
            {licence ? <Signal verified={!demo && licenceChecked}>{demo ? messages.profile.demoLicenceField : `${messages.common.licence} · ${licenceChecked ? messages.common.current : messages.common.notListed}`}</Signal> : null}
            {payments.length ? <Signal>{demo ? messages.profile.demoPaymentFields : payments.join(" + ").toUpperCase()}</Signal> : null}
            {withdrawal ? <Signal>{demo ? messages.profile.demoWithdrawalField : withdrawal}</Signal> : null}
          </div>
        </div>

        {heroOfferPanel}
      </section>

      <nav aria-label={messages.profile.currentReview} className={styles.decisionBar} data-casino-decision-bar>
        <span className={styles.decisionIdentity}><b>{casino.name} · {formattedEditorScore}</b><small>{offerHeadline ?? (demo ? messages.profile.demoReview : messages.profile.publishedReview)}</small></span>
        <div><a href="#overview">{messages.profile.overview}</a><a href="#offer-evidence">{messages.profile.offerEvidence}</a><a href="#verdict">{messages.profile.verdict}</a><a href="#faq">{messages.profile.questions}</a></div>
        {action ? <CasinoOutboundAction action={action} className={styles.compactAction} context={{ source: "CTA", placement: "CASINO_OFFER_BLOCK" }} messages={messages.outbound} /> : null}
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
            <div><dt>{messages.common.licence}</dt><dd>{licenceEvidence || messages.common.notListed}</dd></div>
            <div><dt>{messages.profile.games}</dt><dd>{publishedGameCount ? `${new Intl.NumberFormat(presentation.locale).format(publishedGameCount)}+` : casino.categories.map((category) => category.name).join(" · ") || messages.common.notListed}</dd></div>
            <div><dt>{messages.common.payout}</dt><dd>{withdrawal ?? messages.common.notListed}</dd></div>
            <div><dt>Languages</dt><dd>{casino.languages.join(" · ") || messages.common.notListed}</dd></div>
            <div><dt>Currencies</dt><dd>{casino.currencies.join(" · ") || messages.common.notListed}</dd></div>
            <div><dt>Mobile</dt><dd>{casino.supportsMobile ? messages.common.supported : messages.common.notListed}</dd></div>
            <div><dt>{messages.profile.providers}</dt><dd>{casino.providers.map((provider) => provider.name).join(" · ") || messages.common.notListed}</dd></div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="offer-heading" className={`${styles.section} ${styles.offerSection}`} data-motion-reveal data-nav-theme="cream" id="offer-evidence">
        <div className={styles.sectionHeading}>
          <p>{messages.profile.offerEvidence}</p>
          <h2 id="offer-heading">{messages.profile.offerTerms}</h2>
        </div>
        <div className={styles.offerComposition}>
          <div className={styles.offerCopy} data-offer-relation={casino.offerPresentation?.relation}>
            <span>{demo ? messages.profile.demoTerms : offerScope.label}</span>
            {bonus ? <>
              <h3>{structuredOfferHeading ? <><span>{structuredOfferHeading.primary}</span>{structuredOfferHeading.secondary ? <em>{structuredOfferHeading.secondary}</em> : null}</> : offerHeadline}</h3>
              <p>{bonus.summary}</p>
              {action ? <CasinoOutboundAction action={action} context={{ source: "CTA", placement: "CASINO_OFFER_BLOCK" }} messages={messages.outbound} /> : null}
              <small>18+ · {messages.common.materialTerms}{offerScope.qualification ? ` · ${offerScope.qualification}` : ""}</small>
            </> : <div className={styles.neutralState}><strong>{commercialLabels.noCurrentOffer}</strong></div>}
          </div>
          <div className={styles.offerTermsCard}>
            {bonus ? <dl className={styles.termRows}>
              <div><dt>{messages.common.wagering}</dt><dd>{wagering}</dd></div>
              {minimumDeposit ? <div><dt>{messages.common.minimumDeposit}</dt><dd>{minimumDeposit}</dd></div> : null}
              {maximumBet ? <div><dt>{messages.common.maximumBet}</dt><dd>{maximumBet}</dd></div> : null}
              {bonus.expiresAt ? <div><dt>{messages.common.expiry}</dt><dd>{formatProfileDate(bonus.expiresAt, presentation.locale)}</dd></div> : null}
              {bonus.eligibility ? <div><dt>{messages.common.eligibility}</dt><dd>{bonus.eligibility}</dd></div> : null}
              <div><dt>{messages.common.payout}</dt><dd>{withdrawal ?? messages.common.notListed}</dd></div>
            </dl> : null}
            {bonus?.importantConditions.length ? <div className={styles.conditions}>
              <strong>{messages.common.materialTerms}</strong>
              <ul>{bonus.importantConditions.slice(0, 2).map((condition) => <li key={condition}>{condition}</li>)}</ul>
            </div> : null}
            <details className={styles.evidenceDisclosure}>
              <summary>{messages.profile.evidencePaymentsTools}</summary>
              <dl>
                {licence ? <div><dt>{messages.profile.licenceRecord}</dt><dd>{licence.authority}</dd></div> : null}
                {casino.payments.length ? <div><dt>{messages.profile.paymentRecords}</dt><dd>{casino.payments.map((payment) => {
                  const timing = payment.withdrawalTime ? ` · ${payment.withdrawalTime}` : "";
                  const limit = payment.maximumWithdrawal !== null ? ` · ${formatProfileMoney(payment.maximumWithdrawal, payment.currencies[0] ?? null, presentation.locale)} reported maximum` : "";
                  return `${payment.name}${timing}${limit}`;
                }).join("; ")}</dd></div> : null}
                {casino.providers.length ? <div><dt>{messages.profile.providers}</dt><dd>{casino.providers.map((provider) => provider.name).join(", ")}</dd></div> : null}
                {casino.categories.length ? <div><dt>{messages.profile.games}</dt><dd>{casino.categories.map((category) => category.name).join(", ")}</dd></div> : null}
                {casino.languages.length ? <div><dt>Languages</dt><dd>{casino.languages.join(", ")}</dd></div> : null}
                {casino.currencies.length ? <div><dt>Currencies</dt><dd>{casino.currencies.join(", ")}</dd></div> : null}
                {casino.responsibleGamblingTools.length ? <div><dt>{messages.profile.controlTools}</dt><dd>{casino.responsibleGamblingTools.join(", ")}</dd></div> : null}
              </dl>
            </details>
          </div>
        </div>
      </section>

      {editorial ? <><p className={styles.profileDisclosure}>{demo ? messages.profile.demoDisclosure : messages.profile.originalEditorialNotice}</p><EditorialEvidence demonstration={demo} document={editorial} locale={presentation.locale} messages={messages} /></> : null}

      <section aria-labelledby="verdict-heading" className={styles.verdict} data-motion-reveal data-nav-theme="cream" id="verdict">
        <div className={styles.verdictIdentity}>
          <p>B4GAMBLE · {messages.profile.verdict}</p>
          <h2 id="verdict-heading">{casino.name} <em>{formattedEditorScore}</em></h2>
          <span>{editorial?.summary || casino.summary}</span>
        </div>
        <div className={styles.verdictDecision}>
          <strong>{offerHeadline ?? commercialLabels.noCurrentOffer}</strong>
          <dl>
            <div><dt>{messages.common.wagering}</dt><dd>{wagering}</dd></div>
            <div><dt>{messages.common.payout}</dt><dd>{withdrawal}</dd></div>
            <div><dt>{messages.common.licence}</dt><dd>{licence?.authority || messages.common.notListed}</dd></div>
          </dl>
          {action ? <CasinoOutboundAction action={action} context={{ source: "CTA", placement: "CASINO_OFFER_BLOCK" }} messages={messages.outbound} /> : null}
        </div>
      </section>

      <section aria-labelledby="faq-heading" className={styles.faqSection} data-motion-reveal data-nav-theme="cream" id="faq">
        <div className={styles.sectionHeading}><p>{messages.profile.questions}</p><h2 id="faq-heading">{messages.profile.questions}: {casino.name.replace(/\s+casino$/i, "")}</h2></div>
        <div className={styles.faqGrid}><div>{faq.slice(0, 3).map((item, index) => <details key={item.question} open={index === 0}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div></div>
      </section>

      <nav aria-label={messages.profile.relatedTitle} className={styles.relatedLinks}>
        <div><span>{messages.profile.relatedTitle}</span><h2>{messages.profile.relatedCopy}</h2></div>
        <div><Link href={productHref(presentation, "/casinos")}>{messages.common.browseReviews} <span aria-hidden="true">→</span></Link>{!informationalOnly ? <Link href={productHref(presentation, "/bonuses")}>{demo ? messages.profile.exploreBonusInformation : messages.profile.compareBonusTerms} <span aria-hidden="true">→</span></Link> : null}<Link href={productHref(presentation, "/methodology")}>{messages.common.reviewMethodology} <span aria-hidden="true">→</span></Link><Link href={productHref(presentation, "/help")}>{messages.common.protectedHelp} <span aria-hidden="true">→</span></Link></div>
      </nav>
    </div>
  </article>;
}
