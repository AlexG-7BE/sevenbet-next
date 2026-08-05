"use client";

export default function CasinoDiscoveryError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="pageShell"><div className="container"><div className="card discoveryEmpty"><p className="eyebrow">Casino discovery</p><h1>We could not load the catalog.</h1><p>Please try again. No database or technical details have been exposed.</p><button className="button gold" onClick={reset} type="button">Try again</button></div></div></section>;
}
