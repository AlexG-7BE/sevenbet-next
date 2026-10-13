import "server-only";

import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { programmeJourney } from "@/lib/programme/program-ai/mission-registry";

/**
 * The weekly funnel count (Founder plan, 13 Oct 2026, PROGRAMME-FUNNEL-MCP-2026-10-14): for a
 * date range, how many accounts were created, how many Programmes were started, how many people
 * completed the third step ("Research responsibly") and how many partner buttons signed-in people
 * pressed, by the country and by the source the account was created from.
 *
 * Aggregate, read-only measurement. Each stage is counted by its own date, so a row is the week's
 * activity and not a cohort. Only two sign-up fields of an account are read beside the dates: its
 * country and its source. No identifier, email, name, answer, Programme text or pause date is read,
 * and a cell that would describe one or two people is withheld. It writes nothing, and no page,
 * offer, ranking, route or letter reads these numbers.
 */

export const PROGRAMME_FUNNEL_DEFAULT_DAYS = 7;
export const PROGRAMME_FUNNEL_MAX_DAYS = 92;
export const PROGRAMME_FUNNEL_MAX_ROWS = 60;
/** A count below this describes too few people to publish; the cell is withheld. */
export const PROGRAMME_FUNNEL_MINIMUM_CELL = 3;
/** Fail closed instead of returning partial sums when a range holds more raw rows than this. */
export const PROGRAMME_FUNNEL_MAX_RECORDS = 50_000;

const DAY_MS = 86_400_000;
/** Progress rows store the Mission number; the third step people take is the third Mission of the journey (08). */
const STEP_THREE_MISSION_NUMBER = programmeJourney[2];

export const PROGRAMME_FUNNEL_METRICS = ["accountsCreated", "programmeStarts", "stepThreeCompletions", "outboundClicks", "partnerClicks"] as const;
export type ProgrammeFunnelMetric = (typeof PROGRAMME_FUNNEL_METRICS)[number];

const boundaryText = z.string().min(10).max(40);

export const programmeFunnelInputSchema = z.object({
  from: boundaryText.optional().describe("Range start, inclusive: a UTC date YYYY-MM-DD or an ISO 8601 date-time with Z or an offset. Default: 7 days before `to`."),
  to: boundaryText.optional().describe("Range end: a UTC date YYYY-MM-DD includes that whole day; an ISO 8601 date-time is exclusive. Default: now. The range may span at most 92 days."),
}).strict();

/** A published count, or null when the cell is withheld. */
const cellSchema = z.number().int().min(0).nullable();
const cellsSchema = z.object({
  accountsCreated: cellSchema,
  programmeStarts: cellSchema,
  stepThreeCompletions: cellSchema,
  outboundClicks: cellSchema,
  partnerClicks: cellSchema,
}).strict();

const countryRowSchema = cellsSchema.extend({ signupCountry: z.string().regex(/^[A-Z]{2}$/).nullable() }).strict();
const sourceRowSchema = cellsSchema.extend({ signupSource: z.string().min(1).max(100).nullable() }).strict();

export const programmeFunnelResultSchema = z.object({
  generatedAt: z.iso.datetime(),
  range: z.object({ from: z.iso.datetime(), to: z.iso.datetime(), days: z.number().positive().max(PROGRAMME_FUNNEL_MAX_DAYS) }).strict(),
  minimumCell: z.literal(PROGRAMME_FUNNEL_MINIMUM_CELL),
  totals: cellsSchema,
  byCountry: z.array(countryRowSchema).max(PROGRAMME_FUNNEL_MAX_ROWS),
  bySource: z.array(sourceRowSchema).max(PROGRAMME_FUNNEL_MAX_ROWS),
  omitted: z.object({ countries: z.number().int().min(0), sources: z.number().int().min(0) }).strict(),
  notes: z.array(z.string().min(1).max(400)).max(10),
}).strict();

export type ProgrammeFunnelResult = z.infer<typeof programmeFunnelResultSchema>;

export const PROGRAMME_FUNNEL_ERROR_CODES = ["INVALID_INPUT", "RANGE_TOO_LONG", "RESULT_TOO_LARGE", "FUNNEL_UNAVAILABLE"] as const;

export const programmeFunnelErrorResultSchema = z.object({
  result: z.literal("ERROR"),
  error: z.object({
    code: z.enum(PROGRAMME_FUNNEL_ERROR_CODES),
    message: z.string().min(1).max(300),
    retryable: z.boolean(),
  }).strict(),
}).strict();

export class ProgrammeFunnelError extends Error {
  constructor(
    readonly code: (typeof PROGRAMME_FUNNEL_ERROR_CODES)[number],
    message: string,
    readonly retryable = false,
  ) {
    super(message);
    this.name = "ProgrammeFunnelError";
  }
}

export const PROGRAMME_FUNNEL_NOTES = [
  "Each stage is counted by its own date in the range: accounts by creation, Programme starts by the start of the enrolment, the third step (Research responsibly) by its completion, partner buttons by the press. A row is the range's activity, not a cohort.",
  "Every count belongs to an account and is shown under the country and the source that account was created from. The source is the sign-up UTM source, or the acquisition source when there was no UTM tag; null means neither was recorded.",
  "outboundClicks are partner-button presses by signed-in people; partnerClicks are those that reached the partner. Presses by people without an account are not here: social_traffic counts them per visit.",
  "A Programme start here is an enrolment, which needs an account. People who began the first step without an account are counted by social_traffic (programmeStarts), not here.",
  "A cell of 1 or 2 is withheld (null). When only one cell of a column is withheld, the next smallest one is withheld too, so a total cannot reveal it. Zero is shown.",
  "Staff accounts are excluded. Partner-button presses are Production human traffic only.",
] as const;

export type ProgrammeFunnelRange = { from: Date; until: Date };
/** The only two account fields a count is grouped by. */
export type ProgrammeFunnelOrigin = { signupCountryCode: string | null; signupUtmSource: string | null; signupSource: string | null };
export type ProgrammeFunnelGroup = ProgrammeFunnelOrigin & { metric: ProgrammeFunnelMetric; count: number };

/** The only data the tool reads; each method is one bounded read that returns origins and counts, never a person. */
export type ProgrammeFunnelStore = {
  accountsCreated(range: ProgrammeFunnelRange): Promise<ProgrammeFunnelGroup[]>;
  programmeStarts(range: ProgrammeFunnelRange): Promise<ProgrammeFunnelGroup[]>;
  stepThreeCompletions(range: ProgrammeFunnelRange): Promise<ProgrammeFunnelGroup[]>;
  partnerButtonPresses(range: ProgrammeFunnelRange): Promise<ProgrammeFunnelGroup[]>;
};

export type ProgrammeFunnelReader = (input: unknown) => Promise<ProgrammeFunnelResult>;

const productionHuman = { environment: "PRODUCTION", trafficKind: "HUMAN" } as const;
const notStaff = { adminUser: null } as const;
const origin = { signupCountryCode: true, signupUtmSource: true, signupSource: true } as const;

function bounded<Row>(rows: Row[]) {
  if (rows.length > PROGRAMME_FUNNEL_MAX_RECORDS) {
    throw new ProgrammeFunnelError("RESULT_TOO_LARGE", "The range holds too many records to aggregate at once. Ask for a shorter range.");
  }
  return rows;
}

/**
 * Prisma reads over the indexed date columns. Accounts are grouped in the database; the three
 * later stages come back one row per record carrying only the account's sign-up country and source.
 */
export const prismaProgrammeFunnelStore: ProgrammeFunnelStore = {
  async accountsCreated({ from, until }) {
    const groups = bounded(await prisma.user.groupBy({
      by: ["signupCountryCode", "signupUtmSource", "signupSource"],
      where: { ...notStaff, createdAt: { gte: from, lt: until } },
      _count: { _all: true },
      orderBy: [{ signupCountryCode: "asc" }, { signupUtmSource: "asc" }, { signupSource: "asc" }],
      take: PROGRAMME_FUNNEL_MAX_RECORDS + 1,
    }));
    return groups.map(({ _count, ...group }) => ({ ...group, metric: "accountsCreated" as const, count: _count._all }));
  },

  async programmeStarts({ from, until }) {
    const enrolments = bounded(await prisma.programEnrollment.findMany({
      where: { startedAt: { gte: from, lt: until }, user: notStaff },
      select: { user: { select: origin } },
      take: PROGRAMME_FUNNEL_MAX_RECORDS + 1,
    }));
    return enrolments.map(({ user }) => ({ ...user, metric: "programmeStarts" as const, count: 1 }));
  },

  async stepThreeCompletions({ from, until }) {
    const completions = bounded(await prisma.programmeMissionProgress.findMany({
      where: {
        missionNumber: STEP_THREE_MISSION_NUMBER,
        status: "COMPLETED",
        completedAt: { gte: from, lt: until },
        enrollment: { user: notStaff },
      },
      select: { enrollment: { select: { user: { select: origin } } } },
      take: PROGRAMME_FUNNEL_MAX_RECORDS + 1,
    }));
    return completions.map(({ enrollment }) => ({ ...enrollment.user, metric: "stepThreeCompletions" as const, count: 1 }));
  },

  async partnerButtonPresses({ from, until }) {
    const presses = bounded(await prisma.outboundClick.findMany({
      where: { ...productionHuman, attemptedAt: { gte: from, lt: until }, user: notStaff },
      select: { state: true, user: { select: origin } },
      take: PROGRAMME_FUNNEL_MAX_RECORDS + 1,
    }));
    return presses.flatMap(({ state, user }): ProgrammeFunnelGroup[] => user
      ? [
          { ...user, metric: "outboundClicks", count: 1 },
          ...(state === "SUCCEEDED" ? [{ ...user, metric: "partnerClicks" as const, count: 1 }] : []),
        ]
      : []);
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
export function resolveProgrammeFunnelRange(input: { from?: string; to?: string }, now: Date): ProgrammeFunnelRange {
  const until = input.to === undefined ? new Date(now) : parseBoundary(input.to, "to");
  if (!until) throw new ProgrammeFunnelError("INVALID_INPUT", "`to` must be a UTC date YYYY-MM-DD or an ISO 8601 date-time with Z or an offset.");
  const from = input.from === undefined
    ? new Date(until.getTime() - PROGRAMME_FUNNEL_DEFAULT_DAYS * DAY_MS)
    : parseBoundary(input.from, "from");
  if (!from) throw new ProgrammeFunnelError("INVALID_INPUT", "`from` must be a UTC date YYYY-MM-DD or an ISO 8601 date-time with Z or an offset.");
  if (from >= until) throw new ProgrammeFunnelError("INVALID_INPUT", "`from` must be earlier than `to`.");
  if (until.getTime() - from.getTime() > PROGRAMME_FUNNEL_MAX_DAYS * DAY_MS) {
    throw new ProgrammeFunnelError("RANGE_TOO_LONG", `The range may span at most ${PROGRAMME_FUNNEL_MAX_DAYS} days.`);
  }
  return { from, until };
}

type Counts = Record<ProgrammeFunnelMetric, number>;
type Cells = Record<ProgrammeFunnelMetric, number | null>;

const emptyCounts = (): Counts => ({ accountsCreated: 0, programmeStarts: 0, stepThreeCompletions: 0, outboundClicks: 0, partnerClicks: 0 });

function countryOf(group: ProgrammeFunnelOrigin) {
  const code = group.signupCountryCode?.trim().toUpperCase();
  return code && /^[A-Z]{2}$/.test(code) ? code : null;
}

/** The sign-up UTM source, else the acquisition source, lower-cased; null when neither was recorded. */
function sourceOf(group: ProgrammeFunnelOrigin) {
  const value = (group.signupUtmSource?.trim() || group.signupSource?.trim() || "").toLowerCase().slice(0, 100);
  return value ? value : null;
}

/**
 * Withholds every cell of one column that is below the minimum; when exactly one was withheld
 * and other non-zero cells remain, the smallest of those goes too, so the column's total cannot
 * give the withheld one away. Exported for tests.
 */
export function withholdSmallCells(values: readonly number[]): (number | null)[] {
  const cells: (number | null)[] = values.map((value) => (value > 0 && value < PROGRAMME_FUNNEL_MINIMUM_CELL ? null : value));
  if (cells.filter((cell) => cell === null).length !== 1) return cells;
  let smallest = -1;
  cells.forEach((cell, index) => {
    if (cell !== null && cell > 0 && (smallest < 0 || cell < (cells[smallest] as number))) smallest = index;
  });
  if (smallest >= 0) cells[smallest] = null;
  return cells;
}

function table<Key extends string | null>(counts: Map<Key, Counts>) {
  const entries = [...counts.entries()].sort((left, right) => {
    for (const metric of PROGRAMME_FUNNEL_METRICS) {
      if (right[1][metric] !== left[1][metric]) return right[1][metric] - left[1][metric];
    }
    if (left[0] === right[0]) return 0;
    if (left[0] === null) return 1;
    if (right[0] === null) return -1;
    return left[0] < right[0] ? -1 : 1;
  });
  const rows = entries.map(([key]) => ({ key, cells: {} as Cells }));
  for (const metric of PROGRAMME_FUNNEL_METRICS) {
    withholdSmallCells(entries.map(([, value]) => value[metric])).forEach((cell, index) => { rows[index].cells[metric] = cell; });
  }
  return { rows: rows.slice(0, PROGRAMME_FUNNEL_MAX_ROWS), omitted: Math.max(0, rows.length - PROGRAMME_FUNNEL_MAX_ROWS) };
}

/** Pure aggregation of store groups into the two tables; exported for tests. */
export function aggregateProgrammeFunnel(groups: readonly ProgrammeFunnelGroup[]) {
  const totals = emptyCounts();
  const countries = new Map<string | null, Counts>();
  const sources = new Map<string | null, Counts>();
  const add = <Key extends string | null>(map: Map<Key, Counts>, key: Key, metric: ProgrammeFunnelMetric, count: number) => {
    const current = map.get(key) ?? emptyCounts();
    current[metric] += count;
    map.set(key, current);
  };
  for (const group of groups) {
    if (!Number.isInteger(group.count) || group.count <= 0) continue;
    totals[group.metric] += group.count;
    add(countries, countryOf(group), group.metric, group.count);
    add(sources, sourceOf(group), group.metric, group.count);
  }
  const byCountry = table(countries);
  const bySource = table(sources);
  return {
    totals: Object.fromEntries(PROGRAMME_FUNNEL_METRICS.map((metric) => [
      metric,
      totals[metric] > 0 && totals[metric] < PROGRAMME_FUNNEL_MINIMUM_CELL ? null : totals[metric],
    ])) as Cells,
    byCountry: byCountry.rows.map(({ key, cells }) => ({ signupCountry: key, ...cells })),
    bySource: bySource.rows.map(({ key, cells }) => ({ signupSource: key, ...cells })),
    omitted: { countries: byCountry.omitted, sources: bySource.omitted },
  };
}

export async function readProgrammeFunnel(
  input: unknown,
  store: ProgrammeFunnelStore = prismaProgrammeFunnelStore,
  now = new Date(),
): Promise<ProgrammeFunnelResult> {
  const parsed = programmeFunnelInputSchema.safeParse(input ?? {});
  if (!parsed.success) {
    throw new ProgrammeFunnelError("INVALID_INPUT", "programme_funnel accepts only { from?, to? } as described in its input schema.");
  }
  const range = resolveProgrammeFunnelRange(parsed.data, now);

  let groups: ProgrammeFunnelGroup[];
  try {
    groups = (await Promise.all([
      store.accountsCreated(range),
      store.programmeStarts(range),
      store.stepThreeCompletions(range),
      store.partnerButtonPresses(range),
    ])).flat();
  } catch (error) {
    if (error instanceof ProgrammeFunnelError) throw error;
    throw new ProgrammeFunnelError("FUNNEL_UNAVAILABLE", "The Programme funnel could not be read. Retry later.", true);
  }

  return programmeFunnelResultSchema.parse({
    generatedAt: now.toISOString(),
    range: {
      from: range.from.toISOString(),
      to: range.until.toISOString(),
      days: Math.round(((range.until.getTime() - range.from.getTime()) / DAY_MS) * 100) / 100,
    },
    minimumCell: PROGRAMME_FUNNEL_MINIMUM_CELL,
    ...aggregateProgrammeFunnel(groups),
    notes: [...PROGRAMME_FUNNEL_NOTES],
  });
}
