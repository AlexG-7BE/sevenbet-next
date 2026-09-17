import styles from "./PublicRouteLoading.module.css";

export type PublicLoadingDestination = "home" | "best-offers" | "casinos" | "casino" | "bonuses" | "learn" | "article";

export function PublicRouteLoadingFrame({ destination, label }: { destination: PublicLoadingDestination; label: string }) {
  return (
    <div aria-busy="true" className={styles.page} data-navigation-destination={destination} data-route-loading>
      <section className={styles.hero} data-nav-theme="dark">
        <div className={styles.heroInner}>
          <p className={styles.kicker} role="status">{label}</p>
          <h1>{label}</h1>
          <span aria-hidden="true" className={styles.progress} />
        </div>
      </section>
      <section aria-hidden="true" className={styles.content} data-nav-theme="cream">
        <div className={styles.contentInner}>
          <span className={styles.rule} />
          <div className={styles.columns}>
            <div><i /><i /><i /></div>
            <div><i /><i /><i /></div>
            <div><i /><i /><i /></div>
          </div>
        </div>
      </section>
    </div>
  );
}
