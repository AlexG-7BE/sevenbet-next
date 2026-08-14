"use client";

import Link from "next/link";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="adminPage">
      <div className="container narrow">
        <section className="adminHeader" aria-labelledby="admin-error-title">
          <div>
            <p className="eyebrow">B4GAMBLE CMS · safe failure</p>
            <h1 id="admin-error-title">This admin area could not load.</h1>
            <p className="lead">No cached record or technical detail has been substituted. Retry, or return to the dashboard.</p>
            <div className="heroActions">
              <button className="button gold" onClick={reset} type="button">Try again</button>
              <Link className="button ghost" href="/admin">Admin dashboard</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
