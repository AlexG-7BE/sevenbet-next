/**
 * Campaign sub-ID on partner links (Founder instruction, 24 September 2026).
 *
 * `/r/{slug}` appends one sub-ID to the partner's tracking URL so a partner's
 * own reports split registrations and deposits by our campaign. The value is
 * an aggregate label — market, campaign, placement — never a click, visitor
 * or session identifier (RFC-046 §7 amendment).
 *
 * The parameter is recognised from the link itself, so no partner record or
 * database read is involved. A link whose network is not listed is left
 * exactly as stored.
 */

export type CampaignSubIdParts = Readonly<{
  market?: string | null;
  campaign?: string | null;
  placement?: string | null;
}>;

const MAXIMUM_PART_LENGTH = 24;

function part(value: string | null | undefined, fallback: string) {
  const cleaned = (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAXIMUM_PART_LENGTH)
    .replace(/-+$/g, "");
  return cleaned || fallback;
}

/** `gb_autumn-launch_offer-card`: market, campaign ("direct" without one), placement ("page" without one). */
export function campaignSubId(parts: CampaignSubIdParts) {
  return [part(parts.market, "na"), part(parts.campaign, "direct"), part(parts.placement, "page")].join("_");
}

/**
 * The partner parameter that carries our sub-ID.
 * - EGO / SkillOnNet links (`index.php?aname=…`): `dyn_id`, the tracker's dynamic ID.
 * Superfly and Betsson Group links are left unchanged until their parameter is confirmed.
 */
export function subIdParameter(trackingUrl: URL) {
  if (trackingUrl.searchParams.has("aname")) return "dyn_id";
  return null;
}

/** The partner URL with our sub-ID, or the stored URL unchanged when its network takes none. */
export function withCampaignSubId(destination: URL, parts: CampaignSubIdParts) {
  const parameter = subIdParameter(destination);
  if (!parameter || destination.searchParams.has(parameter)) return destination;
  // Appended rather than re-serialised, so the stored query stays byte-for-byte; the value is [a-z0-9_-].
  const tagged = new URL(destination);
  tagged.search = `${destination.search ? `${destination.search}&` : "?"}${parameter}=${campaignSubId(parts)}`;
  return tagged;
}
