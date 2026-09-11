export const canonicalMetricDefinitions = {
  registeredUsers: "All canonical Better Auth User rows at the report end.",
  newRegistrations: "Canonical users whose createdAt is inside the selected UTC range.",
  activeUsers: "Distinct authenticated users with at least one Production, human analytics event in the selected UTC range.",
  programmeStarts: "Canonical Programme enrollments whose startedAt is inside the selected UTC range.",
  programmeCompletions: "Selected-range Programme start cohort with canonical enrollment.completedAt at or before the report end.",
  programmeCompletionRate: "Programme completions divided by Programme starts for the same selected-range start cohort.",
  casinoViews: "Production human casino_viewed events in the selected UTC range.",
  offerViews: "Production human offer_viewed events in the selected UTC range.",
  commercialCtaClicks: "Production human commercial_cta_clicked events in the selected UTC range.",
  outboundAttempts: "Server-authoritative OutboundClick rows attempted in the selected UTC range.",
  successfulOutbound: "Outbound attempts whose final state is SUCCEEDED.",
  blockedOutbound: "Outbound attempts whose final state is BLOCKED.",
  uniqueOutboundActor: "Distinct authenticated user IDs, otherwise analytics session IDs, among outbound attempts.",
  ctr: "Commercial CTA clicks divided by offer views. Both are consented Production human events in the selected UTC range; zero when offer views are zero.",
  emailSent: "EmailMessage rows accepted by the provider (sentAt) in the selected UTC range.",
  emailDelivered: "Messages sent in the selected UTC range with a normalized deliveredAt provider outcome by report end.",
  emailBounced: "Messages sent in the selected UTC range with a normalized bouncedAt provider outcome by report end.",
  emailClicked: "Messages sent in the selected UTC range with a normalized clickedAt provider outcome by report end.",
  emailUnsubscribed: "Messages sent in the selected UTC range whose secure unsubscribe state was recorded by report end. Provider complaints remain a separate suppression outcome.",
  deliveryRate: "Delivered messages divided by messages sent in the same selected-range cohort.",
  bounceRate: "Bounced messages divided by messages sent in the same selected-range cohort.",
  clickRate: "Clicked messages divided by delivered messages in the same selected-range cohort.",
} as const;

export type AnalyticsRange = { from: Date; until: Date; fromDate: string; toDate: string; days: number };

function dateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

export function analyticsRange(
  input: { range?: string; from?: string; to?: string } = {},
  now = new Date(),
): AnalyticsRange {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const preset = input.range === "7" || input.range === "90" ? Number(input.range) : 30;
  let from = new Date(today);
  let to = new Date(today);
  if (input.range === "custom") {
    from = dateOnly(input.from ?? "") ?? from;
    to = dateOnly(input.to ?? "") ?? to;
  } else {
    from.setUTCDate(from.getUTCDate() - preset + 1);
  }
  if (from > to) [from, to] = [to, from];
  const days = Math.min(366, Math.floor((to.getTime() - from.getTime()) / 86_400_000) + 1);
  if (days === 366 && to.getTime() - from.getTime() >= 366 * 86_400_000) {
    from = new Date(to);
    from.setUTCDate(from.getUTCDate() - 365);
  }
  const until = new Date(to);
  until.setUTCDate(until.getUTCDate() + 1);
  return { from, until, fromDate: from.toISOString().slice(0, 10), toDate: to.toISOString().slice(0, 10), days };
}

export function safeRate(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

export function percentage(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}
