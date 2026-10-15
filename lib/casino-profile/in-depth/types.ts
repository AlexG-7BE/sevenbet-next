export type CasinoInDepthPart = Readonly<{ title: string; paragraphs: readonly string[] }>;

/** A long review written natively in one language for one market (no translation catalog). */
export type CasinoInDepthReview = Readonly<{
  /** Date the facts were checked against the catalogue, ISO `YYYY-MM-DD`. */
  checked: string;
  parts: readonly CasinoInDepthPart[];
}>;
