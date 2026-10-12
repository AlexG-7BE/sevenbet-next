import "server-only";

import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { programmeJourney } from "@/lib/programme/program-ai/mission-registry";

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
 *
 * Since 12 Oct 2026 (Founder) the report also says how many of those visitors
 * started the Programme and how many completed its first step. This is
 * aggregate, read-only measurement: it changes nothing a visitor sees, and no
 * page, offer, ranking or route reads these numbers. The Programme
 * observations carry no session, so the store matches each one to a visit by
 * the browser's analytics ID; that ID is used only for the match inside the
 * store and is dropped before anything is returned.
 */

export const SOCIAL_TRAFFIC_DEFAULT_DAYS = 7;
export const SOCIAL_TRAFFIC_MAX_DAYS = 92;
export const SOCIAL_TRAFFIC_DEFAULT_LIMIT = 50;
export const SOCIAL_TRAFFIC_MAX_LIMIT = 200;
export const SOCIAL_TRAFFIC_TOP_COUNTRIES = 5;
export const SOCIAL_TRAFFIC_TOP_PROGRAMME_COUNTRIES = 3;
/** A Programme start is credited to the visitor's latest social visit that began at most this many days before it. */
export const SOCIAL_TRAFFIC_PROGRAMME_ATTRIBUTION_DAYS = 30;
/** Fail closed instead of returning partial sums when a range holds more raw groups, clicks or Programme rows than this. */
export const SOCIAL_TRAFFIC_MAX_SESSION_GROUPS = 20_000;
export const SOCIAL_TRAFFIC_MAX_ATTRIBUTED_CLICKS = 50_000;
export const SOCIAL_TRAFFIC_MAX_PROGRAMME_EVENTS = 10_000;
export const SOCIAL_TRAFFIC_MAX_PROGRAMME_SESSIONS = 50_000;

const DAY_MS = 86_400_000;
/** Programme events store the Mission number; the first step people take is the first Mission of the journey (01). */
const FIRST_STEP_MISSION_NUMBER = programmeJourney[0];

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

const countryCodeSchema = z.string().regex(/^[A-Z]{2}$/).nullable();

const countrySchema = z.object({
  countryCode: countryCodeSchema,
  sessions: countSchema,
}).strict();

const programmeStartCountrySchema = z.object({
  countryCode: countryCodeSchema,
  starts: countSchema,
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
  programmeStarts: countSchema,
  stepOneCompletions: countSchema,
  topCountries: z.array(countrySchema).max(SOCIAL_TRAFFIC_TOP_COUNTRIES),
  programmeStartCountries: z.array(programmeStartCountrySchema).max(SOCIAL_TRAFFIC_TOP_PROGRAMME_COUNTRIES),
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
    programmeStarts: countSchema,
    stepOneCompletions: countSchema,
  }).strict(),
  site: z.object({
    sessions: countSchema,
    outboundClicks: countSchema,
    partnerClicks: countSchema,
    outboundClicksWithoutConsent: countSchema,
    programmeStarts: countSchema,
    stepOneCompletions: countSchema,
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
  "programmeStarts are visitors who started the Programme in the range; stepOneCompletions are visitors whose first Programme step was saved as completed in the range (that needs an account). Only visitors who allowed analytics cookies are counted, each visitor once per range.",
  "A Programme start or first-step completion is attributed to the visitor's latest social visit (UTM tags or a social-network referrer) within 30 days before the event, and counts in that visit's row and country. Events with no such visit appear only in site.programmeStarts and site.stepOneCompletions.",
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
/** Site-wide visit and click totals; the reader adds the Programme counters from the Programme events. */
export type SocialTrafficSiteTotals = Pick<SocialTrafficResult["site"], "sessions" | "outboundClicks" | "partnerClicks" | "outboundClicksWithoutConsent">;

export type SocialTrafficProgrammeEventKind = "started" | "step_one_completed";
/**
 * One visitor's Programme start or first-step completion, already counted once
 * and matched to the visit it is credited to (null when there is none). It
 * carries no identifier.
 */
export type SocialTrafficProgrammeEvent = {
  kind: SocialTrafficProgrammeEventKind;
  visit: (SocialTrafficTouch & { countryCode: string | null }) | null;
};
/** A raw Programme observation; `visitor` is the browser's analytics ID and never leaves the store. */
export type SocialTrafficProgrammeObservation = {
  kind: SocialTrafficProgrammeEventKind;
  occurredAt: Date;
  visitor: string | null;
};
/** A consented visit of one of the observed visitors; `visitor` never leaves the store. */
export type SocialTrafficVisitorSession = SocialTrafficTouch & {
  visitor: string;
  startedAt: Date;
  countryCode: string | null;
};

/** The only data the tool reads; each method is one bounded aggregate read (two for Programme events). */
export type SocialTrafficStore = {
  sessionGroups(range: SocialTrafficRange): Promise<SocialTrafficSessionGroup[]>;
  attributedClicks(range: SocialTrafficRange): Promise<SocialTrafficClick[]>;
  programmeEvents(range: SocialTrafficRange): Promise<SocialTrafficProgrammeEvent[]>;
  siteTotals(range: SocialTrafficRange): Promise<SocialTrafficSiteTotals>;
};

export type SocialTrafficReader = (input: unknown) => Promise<SocialTrafficResult>;

const productionHuman = { environment: "PRODUCTION", trafficKind: "HUMAN" } as const;
/** A visit that may carry a social touch: any UTM tag or any referrer (the network is checked in code). */
const taggedOrReferred = [
  { utmSource: { not: null } },
  { utmCampaign: { not: null } },
  { utmContent: { not: null } },
  { referrerHost: { not: null } },
];

/**
 * Prisma reads over the indexed [environment, trafficKind, startedAt|attemptedAt]
 * columns. Sessions are grouped in the database; clicks come back one row per
 * click with only the state and their visit's UTM/referrer fields (the visit is
 * loaded by primary key in one batched query, not per click). Programme events
 * are read over [environment, type, occurredAt] and their visitors' visits
 * over the session index on the analytics ID and startedAt.
 */
export const prismaSocialTrafficStore: SocialTrafficStore = {
  async sessionGroups({ from, until }) {
    const groups = await prisma.analyticsSession.groupBy({
      by: ["utmSource", "utmCampaign", "utmContent", "referrerHost", "countryCode"],
      where: {
        ...productionHuman,
        startedAt: { gte: from, lt: until },
        OR: taggedOrReferred,
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

  /**
   * Programme starts and first-step completions observed in the range, then
   * the consented visits of the same browsers that could be credited with
   * them. The analytics ID joins the two reads and goes no further:
   * `attributeProgrammeEvents` returns only a kind, a touch and a country.
   */
  async programmeEvents({ from, until }) {
    const observed = await prisma.analyticsEvent.findMany({
      where: {
        ...productionHuman,
        occurredAt: { gte: from, lt: until },
        OR: [
          { type: "PROGRAMME_STARTED" },
          { type: "PROGRAMME_STEP_COMPLETED", programmeStep: FIRST_STEP_MISSION_NUMBER },
        ],
      },
      select: { type: true, occurredAt: true, anonymousId: true },
      take: SOCIAL_TRAFFIC_MAX_PROGRAMME_EVENTS + 1,
    });
    if (observed.length > SOCIAL_TRAFFIC_MAX_PROGRAMME_EVENTS) {
      throw new SocialTrafficError("RESULT_TOO_LARGE", "The range holds too many Programme starts to aggregate at once. Ask for a shorter range.");
    }
    const observations = observed.map((event): SocialTrafficProgrammeObservation => ({
      kind: event.type === "PROGRAMME_STARTED" ? "started" : "step_one_completed",
      occurredAt: event.occurredAt,
      visitor: event.anonymousId,
    }));
    const visitors = [...new Set(observations.flatMap((observation) => observation.visitor ? [observation.visitor] : []))];
    if (visitors.length === 0) return attributeProgrammeEvents(observations, []);
    const sessions = await prisma.analyticsSession.findMany({
      where: {
        ...productionHuman,
        anonymousId: { in: visitors },
        startedAt: { gte: new Date(from.getTime() - SOCIAL_TRAFFIC_PROGRAMME_ATTRIBUTION_DAYS * DAY_MS), lt: until },
        OR: taggedOrReferred,
      },
      select: { anonymousId: true, startedAt: true, countryCode: true, utmSource: true, utmCampaign: true, utmContent: true, referrerHost: true },
      take: SOCIAL_TRAFFIC_MAX_PROGRAMME_SESSIONS + 1,
    });
    if (sessions.length > SOCIAL_TRAFFIC_MAX_PROGRAMME_SESSIONS) {
      throw new SocialTrafficError("RESULT_TOO_LARGE", "The visitors who started the Programme in this range have too many visits to match at once. Ask for a shorter range.");
    }
    return attributeProgrammeEvents(observations, sessions.map(({ anonymousId, ...session }) => ({ ...session, visitor: anonymousId })));
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

/**
 * Counts each visitor's Programme start and first-step completion once and
 * credits it to a visit; exported for tests.
 *
 * Once per visitor: one person's start can be observed twice, first while
 * anonymous (dedupe key `programme:anonymous:<token>:started`) and again when
 * the account's enrolment is observed (`programme:<enrolment>:started`). The
 * database keys differ, but both rows carry the same browser analytics ID, so
 * a kind is counted once per analytics ID and the earliest observation in the
 * range wins — the start is credited to the visit that led to it. An
 * observation without an analytics ID can only be an enrolment observation,
 * which the database already holds once per enrolment; it is counted as it is
 * and can be matched to no visit.
 *
 * Credit: the same visitor's most recent visit that began at or before the
 * event, at most 30 days before it, and has a social touch by the report's
 * own rule (`socialTrafficRowKey`: a UTM tag or a social-network referrer).
 * A later direct or search visit does not take the credit away.
 */
export function attributeProgrammeEvents(
  observations: readonly SocialTrafficProgrammeObservation[],
  sessions: readonly SocialTrafficVisitorSession[],
): SocialTrafficProgrammeEvent[] {
  const socialVisits = new Map<string, SocialTrafficVisitorSession[]>();
  for (const session of sessions) {
    if (!socialTrafficRowKey(session, "source")) continue;
    const visitor = session.visitor.toLowerCase();
    const visits = socialVisits.get(visitor);
    if (visits) visits.push(session);
    else socialVisits.set(visitor, [session]);
  }
  const counted = new Set<string>();
  const events: SocialTrafficProgrammeEvent[] = [];
  for (const observation of [...observations].sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime())) {
    const visitor = observation.visitor?.toLowerCase() ?? null;
    if (visitor) {
      const once = `${observation.kind}:${visitor}`;
      if (counted.has(once)) continue;
      counted.add(once);
    }
    const occurredAt = observation.occurredAt.getTime();
    const earliest = occurredAt - SOCIAL_TRAFFIC_PROGRAMME_ATTRIBUTION_DAYS * DAY_MS;
    let credited: SocialTrafficVisitorSession | null = null;
    for (const visit of visitor ? socialVisits.get(visitor) ?? [] : []) {
      const startedAt = visit.startedAt.getTime();
      if (startedAt > occurredAt || startedAt < earliest) continue;
      if (!credited || startedAt > credited.startedAt.getTime()) credited = visit;
    }
    events.push({
      kind: observation.kind,
      visit: credited && {
        utmSource: credited.utmSource,
        utmCampaign: credited.utmCampaign,
        utmContent: credited.utmContent,
        referrerHost: credited.referrerHost,
        countryCode: credited.countryCode,
      },
    });
  }
  return events;
}

type Accumulator = RowKey & {
  sessions: number;
  outboundClicks: number;
  partnerClicks: number;
  programmeStarts: number;
  stepOneCompletions: number;
  countries: Map<string | null, number>;
  programmeStartCountries: Map<string | null, number>;
};

/**
 * Countries by count; on a tie by code, an unknown country last. (The earlier
 * `"~"` placeholder compared by locale sorted before every letter, so an
 * unknown country came first on a tie.)
 */
function topCountries(counts: Map<string | null, number>, limit: number) {
  return [...counts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) return right[1] - left[1];
      if (left[0] === right[0]) return 0;
      if (left[0] === null) return 1;
      if (right[0] === null) return -1;
      return left[0] < right[0] ? -1 : 1;
    })
    .slice(0, limit);
}

/** Pure aggregation of store rows into the tool's rows; exported for tests. */
export function aggregateSocialTraffic(input: {
  sessionGroups: readonly SocialTrafficSessionGroup[];
  clicks: readonly SocialTrafficClick[];
  programmeEvents: readonly SocialTrafficProgrammeEvent[];
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
      current = {
        ...key,
        sessions: 0,
        outboundClicks: 0,
        partnerClicks: 0,
        programmeStarts: 0,
        stepOneCompletions: 0,
        countries: new Map(),
        programmeStartCountries: new Map(),
      };
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
  // Like a click, a Programme event counts in the range it happened in, so its
  // row may show it with zero sessions when the credited visit began earlier.
  for (const event of input.programmeEvents) {
    if (!event.visit) continue;
    const current = rowFor(event.visit);
    if (!current) continue;
    if (event.kind === "started") {
      current.programmeStarts += 1;
      current.programmeStartCountries.set(event.visit.countryCode, (current.programmeStartCountries.get(event.visit.countryCode) ?? 0) + 1);
    } else {
      current.stepOneCompletions += 1;
    }
  }
  const all = [...rows.values()]
    .map(({ countries, programmeStartCountries, ...row }): SocialTrafficRow => ({
      ...row,
      topCountries: topCountries(countries, SOCIAL_TRAFFIC_TOP_COUNTRIES)
        .map(([countryCode, sessions]) => ({ countryCode, sessions })),
      programmeStartCountries: topCountries(programmeStartCountries, SOCIAL_TRAFFIC_TOP_PROGRAMME_COUNTRIES)
        .map(([countryCode, starts]) => ({ countryCode, starts })),
    }))
    .sort((left, right) => right.sessions - left.sessions
      || right.outboundClicks - left.outboundClicks
      || right.partnerClicks - left.partnerClicks
      || right.programmeStarts - left.programmeStarts
      || JSON.stringify([left.channel, left.utmSource, left.utmCampaign, left.utmContent, left.referrerNetwork])
        .localeCompare(JSON.stringify([right.channel, right.utmSource, right.utmCampaign, right.utmContent, right.referrerNetwork])));
  return {
    totals: {
      rows: all.length,
      sessions: all.reduce((sum, row) => sum + row.sessions, 0),
      outboundClicks: all.reduce((sum, row) => sum + row.outboundClicks, 0),
      partnerClicks: all.reduce((sum, row) => sum + row.partnerClicks, 0),
      programmeStarts: all.reduce((sum, row) => sum + row.programmeStarts, 0),
      stepOneCompletions: all.reduce((sum, row) => sum + row.stepOneCompletions, 0),
    },
    // Site-wide: every counted Programme event, with or without a social visit to credit.
    siteProgramme: {
      programmeStarts: input.programmeEvents.filter((event) => event.kind === "started").length,
      stepOneCompletions: input.programmeEvents.filter((event) => event.kind === "step_one_completed").length,
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
  let programmeEvents: SocialTrafficProgrammeEvent[];
  let site: SocialTrafficSiteTotals;
  try {
    [sessionGroups, clicks, programmeEvents, site] = await Promise.all([
      store.sessionGroups(range),
      store.attributedClicks(range),
      store.programmeEvents(range),
      store.siteTotals(range),
    ]);
  } catch (error) {
    if (error instanceof SocialTrafficError) throw error;
    throw new SocialTrafficError("TRAFFIC_UNAVAILABLE", "Site traffic could not be read. Retry later.", true);
  }

  const aggregate = aggregateSocialTraffic({ sessionGroups, clicks, programmeEvents, groupBy, utmSource: parsed.data.utmSource ?? null, limit });
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
    site: {
      sessions: site.sessions,
      outboundClicks: site.outboundClicks,
      partnerClicks: site.partnerClicks,
      outboundClicksWithoutConsent: site.outboundClicksWithoutConsent,
      ...aggregate.siteProgramme,
    },
    rows: aggregate.rows,
    omittedRows: aggregate.omittedRows,
    notes: [...SOCIAL_TRAFFIC_NOTES],
  });
}
