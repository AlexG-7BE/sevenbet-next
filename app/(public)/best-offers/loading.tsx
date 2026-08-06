import styles from "@/components/best-offers/BestOffers.module.css";

export default function BestOffersLoading() {
  return <div aria-busy="true" aria-label="Checking Best Offers eligibility" className={styles.page}><section className={styles.hero}><div className={`${styles.shell} ${styles.heroInner}`}><p className={styles.kicker}>Checking eligibility</p><h1>The shortlist <em>is being verified.</em></h1><p className={styles.heroCopy}>Confirming market availability, publication state and complete material terms. No operator action is shown while status is unresolved.</p></div></section><section className={styles.shortlistSection}><div className={styles.shell}><h2>Preserving the decision geometry.</h2><div className={styles.loadingCard} /></div></section></div>;
}
