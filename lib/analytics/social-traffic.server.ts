import "server-only";

import { z } from "zod";

import { prisma } from "@/lib/db/prisma";

/**
 * Read-only social traffic aggregates for the Founder's Claude SMM agents
 * (Founder, 3 Oct 2026, SOCIAL-TRAFFIC-MCP-2026-10-03): how many consented
 * Production visits and partner (casino) clicks each UTM source, campaign and
 * post brought in a date range. Counts only; no visitor, session, user, IP or
 * email value ever leaves this module, and it writes nothing.
 *
 * Semantics follow the fixed Admin dashboards (`lib/analytics/dashboard.server.ts`):
 * Production + human traffic only; a visit is an AnalyticsSession whose
 * startedAt is in the range; a click is an OutboundClick attempted in the
 * range, credited to the UTM tags of the consented visit it happened in.
 */

export const SOCIAL_TRAFFIC_DEFAULT_DAYS = 7;
export const SOCIAL_TRAFFIC_MAX_DAYS = 92;
export const SOCIAL_TRAFFIC_DEFAULT_LIMIT = 50;
export const SOCIAL_TRAFFIC_MAX_LIMIT = 200;
export const SOCIAL_TRAFFIC_TOP_COUNTRIES = 5;
/** Fail closed instead of returning partial sums when a range holds more raw groups or clicks than this. */
export const SOCIAL_TRAFFIC_MAX_SESSION_GROUPS = 20_000;
export const SOCIAL_TRAFFIC_MAX_ATTRIBUTED_CLICKS = 50_000;

const DAY_MS = 86_400_000;

export const SOCIAL_TRAFFIC_GROUP_BY = ["source", "source_campaign", "source_campaign_content"] as const;
export type SocialTrafficGroupBy = (typeof SOCIAL_TRAFFIC_GROUP_BY)[number];

export const SOCIAL_REFERRER_NETWORKS = ["instagram", "threads", "x", "facebook", "youtube", "pinterest", "tiktok"] as const;
export type SocialReferrerNetwork = (typeof SOCIAL_REFERRER_NETWORKS)[number];

const NETWORK_DOMAINS: ReadonlyArray<readonly [SocialReferrerNetwork, readonly string[]]> = [
  ["instagram", ["instagram.com"]],
  ["threads", ["threads.net", "threads.com"]],
  ["x", ["x.com", "t.co", "twitter.com"]],
  ["facebook", ["facebook.com", "fb.com", "fb.me"]],
  ["youtube", ["youtube.com", "youtu.be"]],
  ["pinterest", ["pinterest.com", "pin.it"]],
  ["tiktok", ["tiktok.com"]],
];
const PINTEREST_COUNTRY_HOST = /(?:^|\.)pinterest\.(?:[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/;

/**
 * The social network a referring host belongs to, or null. Bio and app links
 * often arrive without UTM tags (l.instagram.com, t.co, l.facebook.com), so the
 * referrer is the only evidence of where those visits came from.
 */
export function socialReferrerNetwork(host: string | null | undefined): SocialReferrerNetwork | null {
  const normalized = host?.trim().toLowerCase().replace(/\.$/, "");
  if (!normalized) return null;
  for (const [network, domains] of NETWORK_DOMAINS) {
    if (domains.some((domain) => normalized === domain || normalized.endsWith(`.${domain}`))) return network;
  }
  return PINTEREST_COUNTRY_HOST.test(normalized) ? "pinterest" : null;
}

const boundaryText = z.string().min(10).max(40);

export const socialTrafficInputSchema = z.object({
  from: boundaryText.optional().describe("Range start, inclusive: a UTC date YYYY-MM-DD or an ISO 8601 date-time with Z or an offset. Default: 7 days before `to`."),
  to: boundaryText.optional().describe("Range end: a UTC date YYYY-MM-DD includes that whole day; an ISO 8601 date-time is exclusive. Default: now. The range may span at most 92 days."),
  utmSource: z.string().min(1).max(100).regex(/^[A-Za-z0-9][A-Za-z0-9 ._+():-]*$/).optional()
    .describe("Only this source, case-insensitive (for example instagram, threads, x, facebook, youtube, pinterest, tiktok, lana). Also includes untagged visits whose referrer is that social network."),
  groupBy: z.enum(SOCIAL_TRAFFIC_GROUP_BY).optional()
    .describe("Row grain: source, source_campaign or source_campaign_content (default, one row per post when utm_content names the post)."),
  limit: z.number().int().min(1).max(SOCIAL_TRAFFIC_MAX_LIMIT).optional()
    .describe("Maximum rows returned, 1-200 (default 50). Totals always cover every matching row."),
}).strict();

const countSchema = z.number().int().min(0);
const dimensionSchema = z.string().min(1).max(100).nullable();

const countrySchema = z.object({
  countryCode: z.string().regex(/^[A-Z]{2}$/).nullable(),
  sessions: countSchema,
}).strict();

const rowSchema = z.object({
  channel: z.enum(["utm", "social_referrer"]),
  utmSource: dimensionSchema,
  utmCampaign: dimensionSchema,
  utmContent: dimensionSchema,
  referrerNetwork: z.enum(SOCIAL_REFERRER_NETWORKS).nullable(),
  sessions: countSchema,
  outboundClicks: countSchema,
  partnerClicks: countSchema,
  topCountries: z.array(countrySchema).max(SOCIAL_TRAFFIC_TOP_COUNTRIES),
}).strict();

export const socialTrafficResultSchema = z.object({
  generatedAt: z.iso.datetime(),
  range: z.object({ from: z.iso.datetime(), to: z.iso.datetime(), days: z.number().positive().max(SOCIAL_TRAFFIC_MAX_DAYS) }).strict(),
  groupBy: z.enum(SOCIAL_TRAFFIC_GROUP_BY),
  filter: z.object({ utmSource: dimensionSchema }).strict(),
  totals: z.object({
    rows: countSchema,
    sessions: countSchema,
    outboundClicks: countSchema,
    partnerClicks: countSchema,
  }).strict(),
  site: z.object({
    sessions: countSchema,
    outboundClicks: countSchema,
    partnerClicks: countSchema,
    outboundClicksWithoutConsent: countSchema,
  }).strict(),
  rows: z.array(rowSchema).max(SOCIAL_TRAFFIC_MAX_LIMIT),
  omittedRows: countSchema,
  notes: z.array(z.string().min(1).max(400)).max(10),
}).strict();

export type SocialTrafficResult = z.infer<typeof socialTrafficResultSchema>;
export type SocialTrafficRow = z.infer<typeof rowSchema>;

export const SOCIAL_TRAFFIC_ERROR_CODES = ["INVALID_INPUT", "RANGE_TOO_LONG", "RESULT_TOO_LARGE", "TRAFFIC_UNAVAILABLE"] as const;

export const socialTrafficErrorResultSchema = z.object({
  result: z.literal("ERROR"),
  error: z.object({
    code: z.enum(SOCIAL_TRAFFIC_ERROR_CODES),
    message: z.string().min(1).max(300),
    retryable: z.boolean(),
  }).strict(),
}).strict();

export class SocialTrafficError extends Error {
  constructor(
    readonly code: (typeof SOCIAL_TRAFFIC_ERROR_CODES)[number],
    message: string,
    readonly retryable = false,
  ) {
    super(message);
    this.name = "SocialTrafficError";
  }
}

export const SOCIAL_TRAFFIC_NOTES = [
  "Only visitors who allowed analytics cookies are counted as sessions; partner clicks without that consent appear only in site.outboundClicksWithoutConsent.",
  "A session is one visit (it ends after 30 minutes without activity). A click is credited to the UTM tags of the visit it happened in.",
  "social_referrer rows are visits without UTM tags whose referrer was a social network, for example a bio link that dropped the tags.",
  "Production human traffic only: staff-marked, bot, preview and test traffic are excluded. UTM values are compared in lower case.",
  "outboundClicks are all partner-button clicks; partnerClicks are those that reached the partner (the others were refused by market or route rules).",
] as const;

export type SocialTrafficRange = { from: Date; until: Date };
export type SocialTrafficTouch = {
  utmSource: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  referrerHost: string | null;
};
export type SocialTrafficSessionGroup = SocialTrafficTouch & { countryCode: string | null; sessions: number };
export type SocialTrafficClick = { succeeded: boolean; touch: SocialTrafficTouch };
export type SocialTrafficSiteTotals = SocialTrafficResult["site"];

/** The only data the tool reads; each method is one bounded aggregate read. */
export type SocialTrafficStore = {
  sessionGroups(range: SocialTrafficRange): Promise<SocialTrafficSessionGroup[]>;
  attributedClicks(range: SocialTrafficRange): Promise<SocialTrafficClick[]>;
  siteTotals(range: SocialTrafficRange): Promise<SocialTrafficSiteTotals>;
};

export type SocialTrafficReader = (input: unknown) => Promise<SocialTrafficResult>;

const productionHuman = { environment: "PRODUCTION", trafficKind: "HUMAN" } as const;

/**
 * Prisma reads over the indexed [environment, trafficKind, startedAt|attemptedAt]
 * columns. Sessions are grouped in the database; clicks come back one row per
 * click with only the state and their visit's UTM/referrer fields (the visit is
 * loaded by primary key in one batched query, not per click).
 */
export const prismaSocialTrafficStore: SocialTrafficStore = {
  async sessionGroups({ from, until }) {
    const groups = await prisma.analyticsSession.groupBy({
      by: ["utmSource", "utmCampaign", "utmContent", "referrerHost", "countryCode"],
      where: {
        ...productionHuman,
        startedAt: { gte: from, lt: until },
        OR: [
          { utmSource: { not: null } },
          { utmCampaign: { not: null } },
          { utmContent: { not: null } },
          { referrerHost: { not: null } },
        ],
      },
      _count: { _all: true },
      orderBy: [{ utmSource: "asc" }, { utmCampaign: "asc" }, { utmContent: "asc" }, { referrerHost: "asc" }, { countryCode: "asc" }],
      take: SOCIAL_TRAFFIC_MAX_SESSION_GROUPS + 1,
    });
    if (groups.length > SOCIAL_TRAFFIC_MAX_SESSION_GROUPS) {
      throw new SocialTrafficError("RESULT_TOO_LARGE", "The range holds too many distinct sources to aggregate at once. Ask for a shorter range or one utmSource.");
    }
    return groups.map((group) => ({
      utmSource: group.utmSource,
      utmCampaign: group.utmCampaign,
      utmContent: group.utmContent,
      referrerHost: group.referrerHost,
      countryCode: group.countryCode,
      sessions: group._count._all,
    }));
  },

  async attributedClicks({ from, until }) {
    const clicks = await prisma.outboundClick.findMany({
      where: { ...productionHuman, attemptedAt: { gte: from, lt: until }, analyticsSessionId: { not: null } },
      select: {
        state: true,
        session: { select: { utmSource: true, utmCampaign: true, utmContent: true, referrerHost: true } },
      },
      take: SOCIAL_TRAFFIC_MAX_ATTRIBUTED_CLICKS + 1,
    });
    if (clicks.length > SOCIAL_TRAFFIC_MAX_ATTRIBUTED_CLICKS) {
      throw new SocialTrafficError("RESULT_TOO_LARGE", "The range holds too many partner clicks to aggregate at once. Ask for a shorter range.");
    }
    return clicks.flatMap((click) => click.session
      ? [{ succeeded: click.state === "SUCCEEDED", touch: click.session }]
      : []);
  },

  async siteTotals({ from, until }) {
    const [sessions, clicksByState, outboundClicksWithoutConsent] = await Promise.all([
      prisma.analyticsSession.count({ where: { ...productionHuman, startedAt: { gte: from, lt: until } } }),
      prisma.outboundClick.groupBy({
        by: ["state"],
        where: { ...productionHuman, attemptedAt: { gte: from, lt: until } },
        _count: { _all: true },
      }),
      prisma.outboundClick.count({ where: { ...productionHuman, attemptedAt: { gte: from, lt: until }, analyticsSessionId: null } }),
    ]);
    const outboundClicks = clicksByState.reduce((sum, group) => sum + group._count._all, 0);
    const partnerClicks = clicksByState.find((group) => group.state === "SUCCEEDED")?._count._all ?? 0;
    return { sessions, outboundClicks, partnerClicks, outboundClicksWithoutConsent };
  },
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

function parseBoundary(value: string, edge: "from" | "to") {
  if (DATE_ONLY.test(value)) {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
    if (edge === "to") date.setUTCDate(date.getUTCDate() + 1);
    return date;
  }
  if (!DATE_TIME.test(value)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

/** Resolves the UTC range: `from` inclusive, `until` exclusive. */
export function resolveSocialTrafficRange(input: { from?: string; to?: string }, now: Date): SocialTrafficRange {
  const until = input.to === undefined ? new Date(now) : parseBoundary(input.to, "to");
  if (!until) throw new SocialTrafficError("INVALID_INPUT", "`to` must be a UTC date YYYY-MM-DD or an ISO 8601 date-time with Z or an offset.");
  const from = input.from === undefined
    ? new Date(until.getTime() - SOCIAL_TRAFFIC_DEFAULT_DAYS * DAY_MS)
    : parseBoundary(input.from, "from");
  if (!from) throw new SocialTrafficError("INVALID_INPUT", "`from` must be a UTC date YYYY-MM-DD or an ISO 8601 date-time with Z or an offset.");
  if (from >= until) throw new SocialTrafficError("INVALID_INPUT", "`from` must be earlier than `to`.");
  if (until.getTime() - from.getTime() > SOCIAL_TRAFFIC_MAX_DAYS * DAY_MS) {
    throw new SocialTrafficError("RANGE_TOO_LONG", `The range may span at most ${SOCIAL_TRAFFIC_MAX_DAYS} days.`);
  }
  return { from, until };
}

type RowKey = Pick<SocialTrafficRow, "channel" | "utmSource" | "utmCampaign" | "utmContent" | "referrerNetwork">;

function dimension(value: string | null) {
  const normalized = value?.trim().toLowerCase().slice(0, 100);
  return normalized ? normalized : null;
}

/** The row a visit or click belongs to at the requested grain, or null when it has no UTM tag and no social referrer. */
export function socialTrafficRowKey(touch: SocialTrafficTouch, groupBy: SocialTrafficGroupBy): RowKey | null {
  const utmSource = dimension(touch.utmSource);
  const utmCampaign = dimension(touch.utmCampaign);
  const utmContent = dimension(touch.utmContent);
  if (utmSource || utmCampaign || utmContent) {
    return {
      channel: "utm",
      utmSource,
      utmCampaign: groupBy === "source" ? null : utmCampaign,
      utmContent: groupBy === "source_campaign_content" ? utmContent : null,
      referrerNetwork: null,
    };
  }
  const referrerNetwork = socialReferrerNetwork(touch.referrerHost);
  return referrerNetwork
    ? { channel: "social_referrer", utmSource: null, utmCampaign: null, utmContent: null, referrerNetwork }
    : null;
}

type Accumulator = RowKey & { sessions: number; outboundClicks: number; partnerClicks: number; countries: Map<string | null, number> };

/** Pure aggregation of store rows into the tool's rows; exported for tests. */
export function aggregateSocialTraffic(input: {
  sessionGroups: readonly SocialTrafficSessionGroup[];
  clicks: readonly SocialTrafficClick[];
  groupBy: SocialTrafficGroupBy;
  utmSource: string | null;
  limit: number;
}) {
  const filter = input.utmSource?.toLowerCase() ?? null;
  const rows = new Map<string, Accumulator>();
  const rowFor = (touch: SocialTrafficTouch) => {
    const key = socialTrafficRowKey(touch, input.groupBy);
    if (!key) return null;
    if (filter && key.utmSource !== filter && key.referrerNetwork !== filter) return null;
    const id = JSON.stringify([key.channel, key.utmSource, key.utmCampaign, key.utmContent, key.referrerNetwork]);
    let current = rows.get(id);
    if (!current) {
      current = { ...key, sessions: 0, outboundClicks: 0, partnerClicks: 0, countries: new Map() };
      rows.set(id, current);
    }
    return current;
  };
  for (const group of input.sessionGroups) {
    const current = rowFor(group);
    if (!current) continue;
    current.sessions += group.sessions;
    current.countries.set(group.countryCode, (current.countries.get(group.countryCode) ?? 0) + group.sessions);
  }
  for (const click of input.clicks) {
    const current = rowFor(click.touch);
    if (!current) continue;
    current.outboundClicks += 1;
    if (click.succeeded) current.partnerClicks += 1;
  }
  const all = [...rows.values()]
    .map(({ countries, ...row }): SocialTrafficRow => ({
      ...row,
      topCountries: [...countries.entries()]
        .sort((left, right) => right[1] - left[1] || String(left[0] ?? "~").localeCompare(String(right[0] ?? "~")))
        .slice(0, SOCIAL_TRAFFIC_TOP_COUNTRIES)
        .map(([countryCode, sessions]) => ({ countryCode, sessions })),
    }))
    .sort((left, right) => right.sessions - left.sessions
      || right.outboundClicks - left.outboundClicks
      || right.partnerClicks - left.partnerClicks
      || JSON.stringify([left.channel, left.utmSource, left.utmCampaign, left.utmContent, left.referrerNetwork])
        .localeCompare(JSON.stringify([right.channel, right.utmSource, right.utmCampaign, right.utmContent, right.referrerNetwork])));
  return {
    totals: {
      rows: all.length,
      sessions: all.reduce((sum, row) => sum + row.sessions, 0),
      outboundClicks: all.reduce((sum, row) => sum + row.outboundClicks, 0),
      partnerClicks: all.reduce((sum, row) => sum + row.partnerClicks, 0),
    },
    rows: all.slice(0, input.limit),
    omittedRows: Math.max(0, all.length - input.limit),
  };
}

export async function readSocialTraffic(
  input: unknown,
  store: SocialTrafficStore = prismaSocialTrafficStore,
  now = new Date(),
): Promise<SocialTrafficResult> {
  const parsed = socialTrafficInputSchema.safeParse(input ?? {});
  if (!parsed.success) {
    throw new SocialTrafficError("INVALID_INPUT", "social_traffic accepts only { from?, to?, utmSource?, groupBy?, limit? } as described in its input schema.");
  }
  const range = resolveSocialTrafficRange(parsed.data, now);
  const groupBy = parsed.data.groupBy ?? "source_campaign_content";
  const limit = parsed.data.limit ?? SOCIAL_TRAFFIC_DEFAULT_LIMIT;

  let sessionGroups: SocialTrafficSessionGroup[];
  let clicks: SocialTrafficClick[];
  let site: SocialTrafficSiteTotals;
  try {
    [sessionGroups, clicks, site] = await Promise.all([
      store.sessionGroups(range),
      store.attributedClicks(range),
      store.siteTotals(range),
    ]);
  } catch (error) {
    if (error instanceof SocialTrafficError) throw error;
    throw new SocialTrafficError("TRAFFIC_UNAVAILABLE", "Site traffic could not be read. Retry later.", true);
  }

  const aggregate = aggregateSocialTraffic({ sessionGroups, clicks, groupBy, utmSource: parsed.data.utmSource ?? null, limit });
  return socialTrafficResultSchema.parse({
    generatedAt: now.toISOString(),
    range: {
      from: range.from.toISOString(),
      to: range.until.toISOString(),
      days: Math.round(((range.until.getTime() - range.from.getTime()) / DAY_MS) * 100) / 100,
    },
    groupBy,
    filter: { utmSource: parsed.data.utmSource?.toLowerCase() ?? null },
    totals: aggregate.totals,
    site,
    rows: aggregate.rows,
    omittedRows: aggregate.omittedRows,
    notes: [...SOCIAL_TRAFFIC_NOTES],
  });
}
