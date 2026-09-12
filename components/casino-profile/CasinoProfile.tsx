import Link from "next/link";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { CasinoProfileInteractions } from "@/components/casino-profile/CasinoProfileInteractions";
import { CommercialBadges, CommercialFacts, CommercialScore, CompactProtection } from "@/components/commercial/CommercialPrimitives";
import { ResponsivePlacementImage } from "@/components/media/ResponsivePlacementImage";
import { casinoProfileDecisionPresentation, formatCommercialMoney, safeCommercialTermsUrl, structuredOfferHeadline, type CommercialFact } from "@/lib/commercial/commercial-presentation";
import { commercialUxMessages } from "@/lib/commercial/commercial-ux-messages";
import { formatProfileDate, profileAction, selectProfileBonus } from "@/lib/casino-profile/presentation";
import { isTemporaryDemoCasinoId } from "@/lib/demo-data/temporary-demo-authority";
import type { CasinoEditorialDocument, EditorialBlock } from "@/lib/editorial-review/types";
import { formatProductMessage, type ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";
import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";

import styles from "./CasinoProfile.module.css";

function SourceBlock({ block }: { block: EditorialBlock }) {
  if (block.type === "paragraph") return <p>{block.text}</p>;
  if (block.type === "heading") return <h4>{block.text}</h4>;
  if (block.type === "quote") return <blockquote>{block.text}</blockquote>;
  if (block.type === "divider") return <hr />;
  if (block.type === "faq" || block.type === "image" || block.type === "video") return null;
  if ("items" in block) {
    const List = block.type === "numbered-list" ? "ol" : "ul";
    return <List>{block.items.map((item) => <li key={item}>{item}</li>)}</List>;
  }
  return <aside><strong>{block.title}</strong><p>{block.text}</p></aside>;
}

function SectionFacts({ facts }: { facts: readonly CommercialFact[] }) {
  return <dl className={styles.sectionFacts}>{facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>;
}

export function CasinoProfile({ casino, editorial, messages, presentation, availableForPresentation }: {
  casino: PublicCasinoDTO;
  editorial: CasinoEditorialDocument | null;
  messages: ProductPageMessages;
  presentation: PresentationResolution;
  availableForPresentation: boolean;
}) {
  const copy = commercialUxMessages(presentation.locale);
  const demo = isTemporaryDemoCasinoId(casino.id);
  const informationalOnly = casino.presentationDisposition === "INFORMATIONAL_ONLY";
  const bonus = selectProfileBonus(casino);
  const decision = casinoProfileDecisionPresentation(casino, presentation.locale, messages, copy, presentation.marketCountryCode);
  const governed = informationalOnly ? null : profileAction(casino, bonus);
  const action = governed ? { ...governed, label: copy.viewOffer } : null;
  const score = casino.editorScore;
  const offerHeadline = bonus ? structuredOfferHeadline(bonus, presentation.locale, copy) : messages.profile.offerUnavailable;
  const hasClearTerms = Boolean(bonus && bonus.wageringMultiplier !== null && bonus.minimumDeposit !== null);
  const heroBadges = [decision.payout.bucket !== "unknown" ? copy.fastPayouts : null, hasClearTerms ? copy.clearTerms : null].filter((value): value is string => Boolean(value)).slice(0, 2);
  const paymentCurrency = bonus?.currency ?? casino.payments.flatMap((payment) => payment.currencies)[0] ?? casino.currencies[0] ?? null;
  const profilePayments = decision.marketProfile?.payments.length ? decision.marketProfile.payments : casino.payments;
  const minimumWithdrawal = profilePayments.find((payment) => payment.minimumWithdrawal !== null)?.minimumWithdrawal ?? null;
  const paymentFacts: CommercialFact[] = [
    { label: messages.common.payout, value: decision.payout.primary },
    { label: copy.minimumWithdrawal, value: formatCommercialMoney(minimumWithdrawal, paymentCurrency, presentation.locale, copy.notVerified) },
    { label: copy.fees, value: profilePayments.some((payment) => Boolean(payment.fees?.trim())) ? copy.detailsRecorded : copy.notVerified },
  ];
  const offerFacts: CommercialFact[] = bonus ? [
    { label: messages.common.wagering, value: bonus.wageringMultiplier === null ? copy.notVerified : `${new Intl.NumberFormat(presentation.locale, { maximumFractionDigits: 2 }).format(bonus.wageringMultiplier)}×` },
    { label: messages.common.minimumDeposit, value: formatCommercialMoney(bonus.minimumDeposit, bonus.currency, presentation.locale, copy.notVerified) },
    { label: messages.common.maximumBet, value: formatCommercialMoney(bonus.maximumBet, bonus.currency, presentation.locale, copy.notVerified) },
    { label: messages.common.expiry, value: formatProfileDate(bonus.expiresAt, presentation.locale) ?? copy.notVerified },
  ] : [];
  const marketProfile = decision.marketProfile;
  const licence = decision.licence;
  const regulationFacts: CommercialFact[] = [
    { label: copy.operator, value: casino.operator ?? copy.notVerified },
    { label: copy.market, value: marketProfile?.countryCode ?? presentation.marketCountryCode ?? copy.notVerified },
    { label: copy.licenceStatus, value: licence ? `${licence.authority} · ${licence.status === "ACTIVE" ? messages.common.current : copy.notVerified}` : copy.notVerified },
  ];
  const supportFacts: CommercialFact[] = [
    { label: copy.supportLanguages, value: marketProfile?.supportLanguages.join(" · ") || casino.languages.join(" · ") || copy.notVerified },
    ...(marketProfile?.supportSummary ? [{ label: copy.support, value: marketProfile.supportSummary }] : []),
  ];
  const gameFacts = casino.categories.slice(0, 4).map((category) => ({
    label: category.name,
    value: category.gameCount === null ? copy.detailsRecorded : new Intl.NumberFormat(presentation.locale).format(category.gameCount),
  }));
  const providers = casino.providers.slice(0, 6).map((provider) => provider.name);

  return <article className={styles.page} data-runtime-renderer="casino-review">
    <CasinoProfileInteractions />
    <div className={styles.shell}>
      <section aria-labelledby="casino-profile-title" className={styles.hero} data-nav-theme="dark">
        <nav aria-label={messages.common.breadcrumb} className={styles.breadcrumb}><Link href={productHref(presentation, "/casinos")}>{messages.casinos.directoryTitle}</Link><span aria-hidden="true">/</span><span aria-current="page">{casino.name}</span></nav>
        {demo ? <p className={styles.stateNote}><strong>{messages.common.demoData}</strong> · {action ? messages.common.marketPresentationNotice : messages.profile.demoDisclosure}</p> : null}
        {!availableForPresentation && !demo ? <p className={styles.stateNote}>{formatProductMessage(messages.profile.marketUnavailable, { market: presentation.marketDisplayName })}</p> : null}
        <div className={styles.heroGrid}>
          <div className={styles.heroIdentity}>
            <div className={styles.logo}>{casino.media.logo ? <ResponsivePlacementImage alt="" height={casino.media.logo.height ?? 100} media={casino.media.logo} width={casino.media.logo.width ?? 200} /> : <span aria-hidden="true">{casino.name.slice(0, 1)}</span>}</div>
            <div className={styles.titleLine}><div><p>{messages.profile.operatorReview}</p><h1 id="casino-profile-title">{casino.name}</h1></div><CommercialScore label={messages.common.editorScore} locale={presentation.locale} score={score} /></div>
            <p className={styles.verdict} data-intentional-line-clamp="2">{decision.verdict}</p>
            <CommercialBadges badges={heroBadges} />
          </div>
          <div className={styles.heroOffer}>
            <span>{copy.currentOffer}</span>
            <h2>{offerHeadline}</h2>
            <CommercialFacts facts={decision.heroFacts} />
            <div className={styles.heroAction}>{action ? <CasinoOutboundAction action={action} context={{ source: "CTA", placement: "CASINO_HERO" }} messages={messages.outbound} showDisclosure={false} /> : <span className={styles.reviewOnly}>{messages.common.reviewOnly}</span>}</div>
            <small>{action ? demo ? messages.common.marketPresentationNotice : copy.compactDisclosure : messages.common.reviewAvailableNoAction}</small>
          </div>
        </div>
      </section>

      {action ? <aside className={styles.stickyAction} data-casino-decision-bar data-mobile-visible="false">
        <span>{casino.name}{score === null ? "" : ` · ${new Intl.NumberFormat(presentation.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(score)}`}</span>
        <CasinoOutboundAction action={action} context={{ source: "CTA", placement: "CASINO_MOBILE_STICKY" }} messages={messages.outbound} showDisclosure={false} />
      </aside> : null}

      <section aria-labelledby="why-heading" className={styles.section} id="why-we-rate">
        <header><p>01</p><h2 id="why-heading">{copy.whyWeRate}</h2></header>
        <ul className={styles.ratingReasons}>{decision.reasons.map((item) => <li className={item.tone === "caveat" ? styles.ratingCaveat : undefined} data-reason-tone={item.tone} key={`${item.tone}:${item.text}`}><span aria-hidden="true">{item.tone === "caveat" ? "!" : "+"}</span>{item.text}</li>)}</ul>
      </section>

      <section aria-labelledby="payments-heading" className={`${styles.section} ${styles.altSection}`} id="payments">
        <header><p>02</p><h2 id="payments-heading">{copy.paymentsAndPayouts}</h2></header>
        <div><SectionFacts facts={paymentFacts} />{profilePayments.length ? <div className={styles.methodLabels}>{profilePayments.slice(0, 6).map((payment) => <span key={payment.key}>{payment.name}</span>)}</div> : null}</div>
      </section>

      <section aria-labelledby="offer-heading" className={`${styles.section} ${styles.offerSection}`} id="current-offer">
        <header><p>03</p><h2 id="offer-heading">{copy.currentOffer}</h2></header>
        <div className={styles.offerPanel} data-analytics-casino-id={!demo && bonus ? casino.id : undefined} data-analytics-offer-key={!demo && bonus ? bonus.id : undefined}>
          <h3>{offerHeadline}</h3>
          {bonus ? <SectionFacts facts={offerFacts} /> : <p>{messages.common.reviewAvailableNoAction}</p>}
          {bonus ? <p className={styles.materialWarning}>{decision.restriction}</p> : null}
          <div className={styles.offerActions}>{action ? <CasinoOutboundAction action={action} context={{ source: "CTA", placement: "CASINO_OFFER_SECTION" }} messages={messages.outbound} showDisclosure={false} /> : <span className={styles.reviewOnly}>{messages.common.reviewOnly}</span>}{safeCommercialTermsUrl(bonus?.termsUrl) ? <a href={safeCommercialTermsUrl(bonus?.termsUrl) as string} rel="noopener noreferrer" target="_blank">{copy.terms}</a> : null}</div>
        </div>
      </section>

      <section aria-labelledby="games-heading" className={`${styles.section} ${styles.altSection}`} id="games">
        <header><p>04</p><h2 id="games-heading">{messages.profile.games}</h2></header>
        <div>{gameFacts.length ? <SectionFacts facts={gameFacts} /> : <p className={styles.notVerified}>{copy.notVerified}</p>}{providers.length ? <p className={styles.providerLine}><strong>{messages.profile.providers}</strong>{providers.join(" · ")}</p> : null}</div>
      </section>

      <section aria-labelledby="support-heading" className={styles.section} id="support">
        <header><p>05</p><h2 id="support-heading">{copy.support}</h2></header>
        <SectionFacts facts={supportFacts} />
      </section>

      <section aria-labelledby="regulation-heading" className={`${styles.section} ${styles.altSection}`} id="regulation">
        <header><p>06</p><h2 id="regulation-heading">{copy.operatorMarketRegulation}</h2></header>
        <SectionFacts facts={regulationFacts} />
      </section>

      <section className={styles.protectionSection}>
        <CompactProtection copy={copy} presentation={presentation} />
      </section>

      <nav aria-label={messages.profile.relatedTitle} className={styles.relatedLinks}><Link href={productHref(presentation, "/casinos")}>{messages.common.browseReviews}</Link><Link href={productHref(presentation, "/bonuses")}>{messages.profile.compareBonusTerms}</Link></nav>

      <section className={styles.sourceAccess} id="sources">
        <details>
          <summary>{copy.methodologyAndSources}<span aria-hidden="true">+</span></summary>
          <div className={styles.sourceBody}>
            <p><Link href={productHref(presentation, "/methodology")}>{messages.common.reviewMethodology}</Link> · <Link href={productHref(presentation, "/affiliate-disclosure")}>{messages.common.affiliateDisclosure}</Link></p>
            {editorial ? <><h2>{editorial.title}</h2><p>{editorial.author}{formatProfileDate(editorial.factCheckedAt, presentation.locale) ? ` · ${formatProfileDate(editorial.factCheckedAt, presentation.locale)}` : ""}</p>{editorial.sections.slice().sort((a, b) => a.order - b.order).map((section) => <section key={section.id}><h3>{section.title}</h3>{section.blocks.map((block) => <SourceBlock block={block} key={block.id} />)}</section>)}</> : <p>{messages.common.originalSourceCopy}</p>}
          </div>
        </details>
      </section>
    </div>
  </article>;
}
