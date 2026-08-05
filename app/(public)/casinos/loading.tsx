import styles from "@/components/casino-discovery/CasinoDiscovery.module.css";

export default function CasinoDiscoveryLoading() {
  return <div aria-busy="true" className={styles.page}><section className={styles.loadingHero}><div className={styles.shell}><span className={styles.skeletonLine} /><span className={styles.skeletonTitle} /><span className={styles.skeletonTitleShort} /></div></section><section className={styles.loadingDirectory}><div className={styles.shell}><p className={styles.srOnly}>Loading published casino reviews</p><div className={styles.skeletonControls} /> <div className={styles.skeletonCards}>{[0, 1, 2].map((item) => <div key={item} />)}</div></div></section></div>;
}
