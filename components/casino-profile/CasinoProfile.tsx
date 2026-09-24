import Link from "next/link";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { CasinoProfileInteractions } from "@/components/casino-profile/CasinoProfileInteractions";
import { CommercialBadges, CommercialFacts, CommercialScore, EmphasisTail, OfferHeadline } from "@/components/commercial/CommercialPrimitives";
import { ResponsivePlacementImage } from "@/components/media/ResponsivePlacementImage";
import { casinoProfileDecisionPresentation, formatCommercialMoney, safeCommercialTermsUrl, structuredOfferHeadline, type CommercialFact } from "@/lib/commercial/commercial-presentation";
import { commercialUxMessages } from "@/lib/commercial/commercial-ux-messages";
import { formatProfileDate, profileAction, profileFaqItems, selectProfileBonus } from "@/lib/casino-profile/presentation";
import type { CasinoEditorialDocument } from "@/lib/editorial-review/types";
import { formatProductMessage, type ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";
import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";

import styles from "./CasinoProfile.module.css";

/**
 * A fact row whose value is unknown tells the reader nothing, and a section
 * built entirely from those told them nothing six times over. Unknown rows are
 * dropped, and a section left with none says so once, in a line that is about
 * our record rather than about the casino.
 */
function knownFacts(facts: readonly CommercialFact[], unknown: string) {
  return facts.filter((fact) => fact.value !== unknown && Boolean(fact.value.trim()));
}

function SectionFacts({ facts, empty }: { facts: readonly CommercialFact[]; empty: string }) {
  if (!facts.length) return empty ? <p className={styles.notVerified}>{empty}</p> : null;
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
  const demo = casino.dataClassification === "DEMO_FIXTURE";
  const bonus = selectProfileBonus(casino);
  const decision = casinoProfileDecisionPresentation(casino, presentation.locale, messages, copy, presentation.marketCountryCode);
  const governed = profileAction(casino);
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
  const heroFacts = knownFacts(decision.heroFacts, copy.notVerified);
  // Most market profiles record withdrawal timing as a sentence rather than as
  // a per-method duration, and the payout fact only reads the structured
  // field. Parsing the sentence into a speed bucket would be unsafe: several
  // say the opposite of a timing ("method-specific timing not verified"), and
  // a mixed one such as "cards 1-3 banking days; e-wallets same day" would
  // yield "same day" and earn a fast-payout badge a card user never sees. The
  // sentence is shown as written instead, and the badge and the fast-payout
  // ranking keep reading only the structured field.
  const withdrawalSummary = decision.marketProfile?.withdrawalSummary?.trim() || null;
  const marketProfile = decision.marketProfile;
  const licence = decision.licence;
  // Without an exact market profile there is no local licence or market to
  // report, and projection has already emptied the country list so that no
  // market fact can leak. The brand's own record still says who operates it
  // and which regulators licence it, each named with its jurisdiction so it
  // cannot read as authority in the reader's market. The market row is dropped
  // rather than filled with "Not verified" three times over.
  // Tolerate a projection cached before this field existed: the shape is
  // versioned in the cache key, but a stale entry must degrade to "not
  // verified" rather than throw on the server during a rollout.
  const licensedIn = (casino.regulatoryFootprint ?? [])
    .map((entry) => entry.jurisdiction ? `${entry.authority} (${entry.jurisdiction})` : entry.authority)
    .join(" · ");
  // Founded year and control tools were carried on the DTO but rendered only
  // by components no route imports, so neither reached a reader. Both belong
  // here, and the empty-fact rule keeps them out of sight until the record has
  // them rather than printing an unknown.
  const regulationFacts: CommercialFact[] = [
    { label: copy.operator, value: casino.operator ?? copy.notVerified },
    ...(casino.foundedYear ? [{ label: messages.profile.founded, value: String(casino.foundedYear) }] : []),
    ...(marketProfile ? [{ label: copy.market, value: marketProfile.countryCode }] : []),
    licence
      ? { label: copy.licenceStatus, value: `${licence.authority} · ${licence.status === "ACTIVE" ? messages.common.current : copy.notVerified}` }
      : { label: copy.licensedIn, value: licensedIn || copy.notVerified },
    ...(casino.responsibleGamblingTools.length
      ? [{ label: messages.profile.controlTools, value: casino.responsibleGamblingTools.join(" · ") }]
      : []),
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
  const faqItems = profileFaqItems(casino, bonus, editorial).slice(0, 3);
  const verdictLabel = messages.profile.verdict.replace(/:\s*$/, "");
  const finalVerdict = score !== null && score >= 8.5 ? copy.verdictStrong : score !== null && score >= 7 ? copy.verdictSolid : copy.verdictReviewed;
  const bestFor = decision.reasons.find((reason) => reason.tone === "strength")?.text ?? null;
  const watch = decision.reasons.find((reason) => reason.tone === "caveat")?.text ?? decision.restriction;

  const formattedScore = score === null ? null : new Intl.NumberFormat(presentation.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(score);

  return <article className={styles.page} data-runtime-renderer="casino-review">
    <CasinoProfileInteractions />
    <div className={styles.shell}>
      <section aria-labelledby="casino-profile-title" className={styles.hero} data-nav-theme="dark" id="overview">
        <div aria-hidden="true" className={styles.heroGlow} />
        <nav aria-label={messages.common.breadcrumb} className={styles.breadcrumb}><Link href={productHref(presentation, "/casinos")}>{messages.casinos.directoryTitle}</Link><span aria-hidden="true">/</span><span aria-current="page">{casino.name}</span></nav>
        {demo ? <p className={styles.stateNote}><strong>{messages.common.demoData}</strong> · {action ? messages.common.marketPresentationNotice : messages.profile.demoDisclosure}</p> : null}
        {!availableForPresentation && !demo && !action ? <p className={styles.stateNote}>{formatProductMessage(messages.profile.marketUnavailable, { market: presentation.marketDisplayName })}</p> : null}
        <div className={styles.heroGrid}>
          <div className={styles.heroIdentity}>
            <div className={styles.identityRow}>
              <div className={styles.logo}>{casino.media.logo ? <ResponsivePlacementImage alt="" height={casino.media.logo.height ?? 100} media={casino.media.logo} width={casino.media.logo.width ?? 200} /> : <span aria-hidden="true">{casino.name.slice(0, 1)}</span>}</div>
              <div className={styles.identityMeta}><p>{messages.profile.operatorReview}</p><CommercialBadges badges={heroBadges} className={styles.heroBadges} /></div>
            </div>
            <div className={styles.titleLine}><h1 id="casino-profile-title"><EmphasisTail single="plain" text={casino.name} /></h1><CommercialScore label={messages.common.editorScore} locale={presentation.locale} score={score} className={styles.heroScore} /></div>
            <p className={styles.verdict} data-intentional-line-clamp="2">{decision.verdict}</p>
          </div>
          <div className={styles.heroOffer}>
            <span>{copy.currentOffer}</span>
            <h2><OfferHeadline text={offerHeadline} /></h2>
            {heroFacts.length ? <CommercialFacts facts={heroFacts} className={styles.heroFacts} /> : null}
            <div className={styles.heroAction}>{action ? <CasinoOutboundAction action={action} className={styles.offerAction} context={{ source: "CTA", placement: "CASINO_HERO" }} messages={messages.outbound} showDisclosure={false} /> : <span className={styles.reviewOnly}>{messages.common.reviewOnly}</span>}</div>
            <small>{action ? demo ? messages.common.marketPresentationNotice : copy.compactDisclosure : messages.common.reviewAvailableNoAction}</small>
          </div>
        </div>
      </section>

      <nav aria-label={messages.profile.overview} className={styles.sectionNav} data-casino-section-nav>
        <a href="#overview">{messages.profile.overview}</a>
        <a href="#current-offer">{messages.profile.offerTerms}</a>
        <a href="#casino-faq">{messages.profile.questions}</a>
        <a href="#our-verdict">{verdictLabel}</a>
      </nav>

      {action ? <aside className={styles.stickyAction} data-casino-decision-bar data-mobile-visible="false">
        <span><strong>{casino.name}</strong>{formattedScore === null ? null : <em>{formattedScore}</em>}</span>
        <CasinoOutboundAction action={action} context={{ source: "CTA", placement: "CASINO_MOBILE_STICKY" }} messages={messages.outbound} showDisclosure={false} />
      </aside> : null}

      <section aria-labelledby="why-heading" className={styles.section} id="why-we-rate">
        <header><p>01</p><h2 id="why-heading">{copy.whyWeRate}</h2></header>
        <ul className={styles.ratingReasons}>{decision.reasons.map((item) => <li className={item.tone === "caveat" ? styles.ratingCaveat : undefined} data-reason-tone={item.tone} key={`${item.tone}:${item.text}`}><span aria-hidden="true">{item.tone === "caveat" ? "!" : "+"}</span>{item.text}</li>)}</ul>
      </section>

      <section aria-labelledby="payments-heading" className={`${styles.section} ${styles.altSection}`} id="payments">
        <header><p>02</p><h2 id="payments-heading">{copy.paymentsAndPayouts}</h2></header>
        <div className={styles.sectionBody}>
          <SectionFacts empty={withdrawalSummary ? "" : copy.nothingPublishedYet} facts={knownFacts(paymentFacts, copy.notVerified)} />
          {profilePayments.length ? <div className={styles.methodLabels}>{profilePayments.slice(0, 6).map((payment) => <span key={payment.key}>{payment.name}</span>)}</div> : null}
          {withdrawalSummary ? <p className={styles.withdrawalSummary}>{withdrawalSummary}</p> : null}
        </div>
      </section>

      <section aria-labelledby="offer-heading" className={`${styles.section} ${styles.offerSection}`} id="current-offer">
        <header><p>03</p><h2 id="offer-heading">{copy.currentOffer}</h2></header>
        <div className={styles.offerPanel} data-analytics-casino-id={!demo && bonus ? casino.id : undefined} data-analytics-offer-key={!demo && bonus ? bonus.id : undefined}>
          <h3><OfferHeadline text={offerHeadline} /></h3>
          {bonus ? <SectionFacts empty={copy.nothingPublishedYet} facts={knownFacts(offerFacts, copy.notVerified)} /> : <p>{messages.common.reviewAvailableNoAction}</p>}
          {bonus ? <p className={styles.materialWarning}>{decision.restriction}</p> : null}
          <div className={styles.offerActions}>{action ? <CasinoOutboundAction action={action} className={styles.offerAction} context={{ source: "CTA", placement: "CASINO_OFFER_SECTION" }} messages={messages.outbound} showDisclosure={false} /> : <span className={styles.reviewOnly}>{messages.common.reviewOnly}</span>}{safeCommercialTermsUrl(bonus?.termsUrl) ? <a href={safeCommercialTermsUrl(bonus?.termsUrl) as string} rel="noopener noreferrer" target="_blank">{copy.terms} <span aria-hidden="true">→</span></a> : null}</div>
        </div>
      </section>

      <section aria-labelledby="games-heading" className={`${styles.section} ${styles.altSection}`} id="games">
        <header><p>04</p><h2 id="games-heading">{messages.profile.games}</h2></header>
        <div className={styles.sectionBody}>{gameFacts.length ? <SectionFacts empty={copy.nothingPublishedYet} facts={gameFacts} /> : <p className={styles.notVerified}>{copy.nothingPublishedYet}</p>}{providers.length ? <p className={styles.providerLine}><strong>{messages.profile.providers}</strong><span>{providers.join(" · ")}</span></p> : null}</div>
      </section>

      <section aria-labelledby="support-heading" className={styles.section} id="support">
        <header><p>05</p><h2 id="support-heading">{copy.support}</h2></header>
        <SectionFacts empty={copy.nothingPublishedYet} facts={knownFacts(supportFacts, copy.notVerified)} />
      </section>

      <section aria-labelledby="regulation-heading" className={`${styles.section} ${styles.altSection}`} id="regulation">
        <header><p>06</p><h2 id="regulation-heading">{copy.operatorMarketRegulation}</h2></header>
        <SectionFacts empty={copy.nothingPublishedYet} facts={knownFacts(regulationFacts, copy.notVerified)} />
      </section>

      <section aria-labelledby="faq-heading" className={styles.profileFaq} data-nav-theme="cream" data-premium-section="casino-faq" id="casino-faq">
        <div className={styles.profileFaqInner}>
          <h2 id="faq-heading"><EmphasisTail single="plain" text={messages.profile.questions} /></h2>
          {faqItems.map((item) => <details key={item.question} name="casino-faq"><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}
        </div>
      </section>

      <section aria-labelledby="verdict-heading" className={styles.finalVerdictSection} data-nav-theme="dark" data-premium-section="casino-verdict" id="our-verdict">
        <div aria-hidden="true" className={styles.verdictGlow} />
        <div className={styles.finalVerdictInner}>
          <p className={styles.finalVerdictKicker}>{messages.profile.verdict}</p>
          <h2 className={styles.finalVerdictHeading} id="verdict-heading">
            <span>{casino.name}</span><span aria-hidden="true">—</span><em>{formattedScore ?? copy.notVerified}</em>
          </h2>
          <p className={styles.finalVerdictSummary}>{finalVerdict}</p>
          {bestFor || watch ? <dl className={styles.finalVerdictFacts}>{bestFor ? <div><dt>{messages.profile.bestFor}</dt><dd>{bestFor}</dd></div> : null}{watch ? <div><dt>{messages.profile.keepInView}</dt><dd>{watch}</dd></div> : null}</dl> : null}
        </div>
      </section>
    </div>
  </article>;
}
