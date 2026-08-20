import styles from "@/components/best-offers/BestOffers.module.css";

export default function BestOffersLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading Best Offers"
      className={styles.page}
      data-runtime-renderer="best-offers-loading"
    >
      <section className={styles.hero} data-nav-theme="dark">
        <div className={`${styles.shell} ${styles.heroInner}`}>
          <p className={styles.kicker}>Current eligible shortlist</p>
          <h1>
            <span>Three picks.</span>
            <em>Not thirty.</em>
          </h1>
          <p className={styles.heroCopy}>
            Loading the current shortlist and material terms.
          </p>
          <div className={styles.heroStats} aria-hidden="true">
            <div><strong>—</strong><span>eligible records</span></div>
            <div><strong>GB</strong><span>current scope</span></div>
            <div><strong>0</strong><span>inferred actions</span></div>
          </div>
          <div className={styles.heroTicker} aria-hidden="true">
            <span>Published records only</span>
            <span>Material terms shown before action</span>
            <span>Availability fails closed</span>
          </div>
        </div>
      </section>
      <section className={styles.topThree} data-nav-theme="light" aria-hidden="true">
        <div className={styles.shell}>
          <div className={styles.sectionRule}>
            <span>The shortlist</span>
            <i />
          </div>
          <div className={styles.loadingCard} />
        </div>
      </section>
    </div>
  );
}
