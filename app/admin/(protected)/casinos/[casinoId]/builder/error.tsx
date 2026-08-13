"use client";

export default function CasinoBuilderError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="casinoBuilder casinoBuilderState" role="alert">
      <p className="eyebrow">Casino Builder</p>
      <h1>Builder data could not be loaded.</h1>
      <p className="muted">Try loading the casino again. If the problem continues, record the time and escalate it to the operations owner.</p>
      <button className="button gold" onClick={reset} type="button">Try again</button>
    </div>
  );
}
