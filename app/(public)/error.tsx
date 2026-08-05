"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="pageShell">
      <div className="container">
        <div className="card discoveryEmpty" role="alert">
          <p className="eyebrow">Something went wrong</p>
          <h1>We could not load this page.</h1>
          <p>Please try again. Technical details have not been exposed.</p>
          <button className="button gold" onClick={reset} type="button">Try again</button>
        </div>
      </div>
    </section>
  );
}
