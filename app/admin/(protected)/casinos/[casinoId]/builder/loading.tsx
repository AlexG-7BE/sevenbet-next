export default function CasinoBuilderLoading() {
  return (
    <div className="casinoBuilder casinoBuilderState" aria-live="polite" aria-busy="true">
      <div className="casinoBuilderSkeleton" />
      <div className="casinoBuilderSkeleton tall" />
      <p>Loading casino builder...</p>
    </div>
  );
}
