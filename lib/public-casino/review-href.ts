type PublicReviewCandidate = Readonly<{
  slug: string;
  reviewHref?: string | null;
}>;

/**
 * An explicit null suppresses a review link for layout-only fixture records.
 * Normal projected records omit the override and retain their canonical slug.
 */
export function publicCasinoReviewHref(casino: PublicReviewCandidate) {
  return casino.reviewHref === undefined ? `/casino/${casino.slug}` : casino.reviewHref;
}
