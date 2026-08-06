import styles from "@/components/casino-profile/CasinoProfile.module.css";

export default function CasinoProfileLoading() {
  return <div aria-busy="true" aria-label="Loading casino profile" className={styles.loadingPage}>
    <div className={styles.shell}>
      <span className={styles.loadingLine} />
      <span className={styles.loadingTitle} />
      <div className={styles.loadingGrid}><span /><span /></div>
    </div>
  </div>;
}
