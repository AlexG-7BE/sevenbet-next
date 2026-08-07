import styles from "@/components/comparison/Comparison.module.css";

const slots = [0, 1, 2];
const rows = [0, 1, 2, 3];

export default function ComparisonLoading() {
  return <div className={styles.page} data-comparison-loading>
    <section aria-busy="true" aria-label="Casino comparison is loading" className={styles.loadingHero}>
      <div className={styles.shell}>
        <div className={styles.loadingStateLabel}><span>SYSTEM</span><small>05 / LOADING</small></div>
        <h1>Checking context and evidence…</h1>
        <p className={styles.loadingCopy}>Current values wait while the latest published comparison is resolved.</p>
        <div aria-hidden="true" className={styles.loadingSlots}>
          {slots.map((slot) => <div className={styles.loadingSlot} key={slot}>
            <i />
            <div><span /><span /><span /></div>
          </div>)}
        </div>
        <div aria-hidden="true" className={styles.loadingControls}>
          <span />
          <div>{slots.map((slot) => <i key={slot} />)}</div>
          <b />
        </div>
      </div>
    </section>
    <section aria-hidden="true" className={styles.loadingMatrixSection}>
      <div className={styles.shell}>
        <div className={styles.loadingMatrixHeading}><span /><span /></div>
        <div className={styles.loadingMatrix}>
          <div className={styles.loadingMatrixHeader}>{slots.map((slot) => <i key={slot} />)}</div>
          {rows.map((row) => <div className={styles.loadingMatrixRow} key={row}>
            <span />
            <div>{slots.map((slot) => <i key={slot} />)}</div>
          </div>)}
        </div>
      </div>
    </section>
  </div>;
}
