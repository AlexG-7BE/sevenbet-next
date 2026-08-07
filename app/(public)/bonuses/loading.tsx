import styles from "@/components/bonus-directory/BonusDirectory.module.css";

export default function BonusesLoading() {
  return <div aria-busy="true" aria-label="Loading published bonus directory" className={styles.page}>
    <section className={styles.hero}><div className={styles.heroCopy}><p className={styles.eyebrow}>Bonuses · Material Editorial Theatre · 18+</p><h1>Terms<br />Before<br />The Number.</h1><em>A bonus is a contract-shaped object.</em></div></section>
    <section className={styles.directorySection}><div className={styles.shell}><p className={styles.eyebrow}>Loading current published offers</p><h2 className={styles.display}>Preserving The<br />Comparison Geometry.</h2><div className={styles.featuredGrid}>{[0, 1, 2].map((item) => <div className={styles.loadingPulse} key={item} />)}</div><div className={styles.loadingPulse} /></div></section>
  </div>;
}
