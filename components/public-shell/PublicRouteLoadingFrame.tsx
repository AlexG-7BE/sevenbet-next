import styles from "./PublicRouteLoading.module.css";

export type PublicLoadingDestination = "home" | "best-offers" | "casinos" | "casino" | "bonuses" | "learn" | "article";

/**
 * Casinos, Bonuses, Best Offers and the casino review were redesigned dark on 22 Sep 2026, but
 * their frame kept the 17 Sep layout (dark band over cream columns), so every slow transition
 * flashed the old design first (Founder, 4 Oct 2026). Those pages now get a frame cut like them:
 * night page, top-right glow, acid kicker with its rule, the hero title's type, dark cards.
 * Home keeps its frame: the desktop Home composition is frozen.
 */
export function PublicRouteLoadingFrame({ destination, label }: { destination: PublicLoadingDestination; label: string }) {
  const dark = destination !== "home";
  return (
    <div aria-busy="true" className={styles.page} data-frame-theme={dark ? "dark" : "classic"} data-navigation-destination={destination} data-route-loading>
      <section className={styles.hero} data-nav-theme="dark">
        {dark ? <div aria-hidden="true" className={styles.glow} /> : null}
        <div className={styles.heroInner}>
          <p className={styles.kicker} role="status">{label}</p>
          {/* Not a heading: a streamed page arrives beside its frame, and its own h1 must stay the only one. */}
          <p aria-hidden="true" className={styles.title}>{label}</p>
          {dark ? null : <span aria-hidden="true" className={styles.progress} />}
        </div>
      </section>
      <section aria-hidden="true" className={styles.content} data-nav-theme={dark ? "dark" : "cream"}>
        <div className={styles.contentInner}>
          {dark ? (
            <div className={styles.cards}>
              <span><i /><i /><i /></span>
              <span><i /><i /><i /></span>
            </div>
          ) : (
            <>
              <span className={styles.rule} />
              <div className={styles.columns}>
                <div><i /><i /><i /></div>
                <div><i /><i /><i /></div>
                <div><i /><i /><i /></div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
