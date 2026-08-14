"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- the root fallback must remain independent of the Next app tree */

import styles from "./global-error.module.css";

export default function RootGlobalError() {
  return (
    <html lang="en">
      <body className={styles.body}>
        <main className={styles.main}>
          <p className={styles.brand} translate="no">B4GAMBLE</p>
          <section className={styles.panel} aria-labelledby="root-error-title">
            <h1 id="root-error-title">Something went wrong.</h1>
            <p>We couldn&apos;t load B4GAMBLE right now.</p>
            <div className={styles.actions}>
              <button onClick={() => window.location.reload()} type="button">Try again</button>
              <a href="/">Go home</a>
              <a href="/help">Open Help</a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
