import { pathToFileURL } from "node:url";

export const DEFAULT_VERCEL_PROJECT_ID = "prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb";
export const DEFAULT_VERCEL_TEAM_ID = "team_WhkUGuXZeIMlU1uFHtowNUqa";
const ANALYTICS_API = "https://api.vercel.com/v1/query/web-analytics/events/aggregate";
const safeAuthority = /^(?:prj|team)_[A-Za-z0-9]+$/;

function option(argv, name) {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

function dateOnly(value, name) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "") || Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))) {
    throw new Error(`${name} must use YYYY-MM-DD`);
  }
  return value;
}

export function parseProgrammeAnalyticsArgs(argv, now = new Date()) {
  const projectId = option(argv, "--project-id") ?? DEFAULT_VERCEL_PROJECT_ID;
  const teamId = option(argv, "--team-id") ?? DEFAULT_VERCEL_TEAM_ID;
  if (!safeAuthority.test(projectId) || !safeAuthority.test(teamId)) {
    throw new Error("Vercel project/team override is invalid");
  }
  const sinceOption = option(argv, "--since");
  const fromOption = option(argv, "--from");
  const toOption = option(argv, "--to");
  if (sinceOption && (fromOption || toOption)) {
    throw new Error("Use --since or --from/--to, not both");
  }
  let since;
  let until;
  if (sinceOption) {
    const match = /^(\d{1,3})d$/.exec(sinceOption);
    if (!match || Number(match[1]) < 1 || Number(match[1]) > 90) {
      throw new Error("--since must be 1d-90d");
    }
    since = new Date(now.getTime() - Number(match[1]) * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    until = now.toISOString().slice(0, 10);
  } else {
    since = dateOnly(fromOption ?? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), "--from");
    until = dateOnly(toOption ?? now.toISOString().slice(0, 10), "--to");
  }
  if (Date.parse(`${since}T00:00:00.000Z`) > Date.parse(`${until}T23:59:59.999Z`)) {
    throw new Error("Analytics date range is reversed");
  }
  return { projectId, teamId, since, until };
}

function stringLiteral(value) {
  if (!/^[a-zA-Z0-9_]+$/.test(value)) throw new Error("Analytics filter value is invalid");
  return `'${value}'`;
}

function eventFilter(eventName, properties = {}) {
  return [
    `eventName eq ${stringLiteral(eventName)}`,
    ...Object.entries(properties).map(([key, value]) => {
      if (!/^[A-Za-z0-9_]+$/.test(key)) throw new Error("Analytics filter key is invalid");
      return `eventData/${key} eq ${typeof value === "number" ? value : stringLiteral(value)}`;
    }),
  ].join(" and ");
}

export const programmeAnalyticsQueries = {
  startClicks: ["programme_start_clicked"],
  accessGranted: ["programme_access_granted"],
  situationSubmitted: ["programme_m1_situation_submitted"],
  situationVoice: ["programme_m1_situation_submitted", { inputMode: "voice" }],
  situationText: ["programme_m1_situation_submitted", { inputMode: "text" }],
  personalisedValue: ["programme_m1_personalised_value_presented"],
  registrationCta: ["programme_registration_cta_presented"],
  claimRedeemed: ["programme_claim_redeemed"],
  ...Object.fromEntries(
    ["day_0", "day_1", "day_2_3", "day_4_7", "day_8_plus", "unknown"].map((engagementDayBucket) => [
      `engagement:${engagementDayBucket}`,
      ["programme_home_viewed", { engagementDayBucket }],
    ]),
  ),
  ...Object.fromEntries(Array.from({ length: 9 }, (_, index) => [
    `mission${index + 2}Completed`,
    ["programme_mission_completed", { mission: index + 2 }],
  ])),
  reviewFirst: ["programme_review_opened", { milestone: "first" }],
  reviewMid: ["programme_review_opened", { milestone: "mid" }],
  reviewFull: ["programme_review_opened", { milestone: "full" }],
  programmeCompleted: ["programme_completed"],
  ...Object.fromEntries(
    ["programme_home", "mission_08", "mission_10"].flatMap((sourceSurface) =>
      ["casinos", "compare", "bonuses", "best_offers", "bonus_guide"].map((destinationRoute) => [
        `discovery:${sourceSurface}:${destinationRoute}`,
        ["programme_discovery_clicked", { sourceSurface, destinationRoute }],
      ]),
    ),
  ),
  ...Object.fromEntries(
    ["provider", "fallback", "rate_limited", "timeout", "invalid_output", "provider_error"].map((result) => [
      `ai:${result}`,
      ["programme_ai_outcome", { result }],
    ]),
  ),
  ...Object.fromEntries(
    ["recording_started", "transcription_success", "permission_denied", "transcription_error", "cancelled"].map((result) => [
      `voice:${result}`,
      ["programme_voice_outcome", { result }],
    ]),
  ),
};

export async function fetchProgrammeAnalyticsMetrics({
  token,
  projectId,
  teamId,
  since,
  until,
  fetchImpl = fetch,
}) {
  if (!token?.trim()) throw new Error("VERCEL_TOKEN is required for the aggregate analytics report");
  const entries = await Promise.all(Object.entries(programmeAnalyticsQueries).map(async ([key, definition]) => {
    const [eventName, properties = {}] = definition;
    const url = new URL(ANALYTICS_API);
    url.searchParams.set("teamId", teamId);
    url.searchParams.set("projectId", projectId);
    url.searchParams.set("since", since);
    url.searchParams.set("until", until);
    url.searchParams.set("by", "eventName");
    url.searchParams.set("filter", eventFilter(eventName, properties));
    const response = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`Vercel aggregate analytics API unavailable (HTTP ${response.status})`);
    }
    const body = await response.json();
    if (!body || !Array.isArray(body.data)) {
      throw new Error("Vercel aggregate analytics API returned an invalid response");
    }
    const count = body.data.reduce((total, row) => total + (
      row && typeof row.count === "number" && Number.isFinite(row.count) ? row.count : 0
    ), 0);
    return [key, count];
  }));
  return Object.fromEntries(entries);
}

export function percentage(numerator, denominator) {
  if (!denominator) return "N/A";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

export function buildProgrammeAnalyticsReport(metrics) {
  const activation = [
    ["Start clicks", "startClicks"],
    ["Access granted", "accessGranted"],
    ["Situation submitted", "situationSubmitted"],
    ["Personalised value presented", "personalisedValue"],
    ["Registration CTA presented", "registrationCta"],
    ["Claim redeemed", "claimRedeemed"],
  ].map(([label, key], index, rows) => ({
    label,
    count: metrics[key] ?? 0,
    fromPrevious: index === 0 ? null : percentage(metrics[key] ?? 0, metrics[rows[index - 1][1]] ?? 0),
  }));
  const missionRetention = Array.from({ length: 9 }, (_, index) => {
    const mission = index + 2;
    const count = metrics[`mission${mission}Completed`] ?? 0;
    const previous = mission === 2 ? metrics.claimRedeemed ?? 0 : metrics[`mission${mission - 1}Completed`] ?? 0;
    return { mission, count, continuationFromPrevious: percentage(count, previous) };
  });
  return {
    activation,
    inputMode: { voice: metrics.situationVoice ?? 0, text: metrics.situationText ?? 0 },
    engagement: Object.fromEntries(Object.entries(metrics).filter(([key]) => key.startsWith("engagement:"))),
    missionRetention,
    reviews: {
      first: metrics.reviewFirst ?? 0,
      mid: metrics.reviewMid ?? 0,
      full: metrics.reviewFull ?? 0,
    },
    programmeCompleted: metrics.programmeCompleted ?? 0,
    discovery: Object.fromEntries(Object.entries(metrics).filter(([key]) => key.startsWith("discovery:"))),
    ai: Object.fromEntries(Object.entries(metrics).filter(([key]) => key.startsWith("ai:"))),
    voice: Object.fromEntries(Object.entries(metrics).filter(([key]) => key.startsWith("voice:"))),
  };
}

export function formatProgrammeAnalyticsReport(report, range) {
  const lines = [
    `PROGRAMME ANALYTICS · ${range.since} to ${range.until}`,
    "",
    "M1 ACTIVATION",
    ...report.activation.map((row) => `${row.label}: ${row.count}${row.fromPrevious ? ` · from previous ${row.fromPrevious}` : ""}`),
    `Voice / type submissions: ${report.inputMode.voice} / ${report.inputMode.text}`,
    "",
    "PROGRAMME RETURN DAYS (aggregate home views)",
    ...Object.entries(report.engagement).map(([key, count]) => `${key.slice("engagement:".length)}: ${count}`),
    "",
    "MISSION RETENTION",
    ...report.missionRetention.map((row) => `M${row.mission} completion: ${row.count} · continuation ${row.continuationFromPrevious}`),
    `Programme completion: ${report.programmeCompleted}`,
    "",
    "REVIEWS",
    `First: ${report.reviews.first} · Mid: ${report.reviews.mid} · Full: ${report.reviews.full}`,
    "",
    "COMMERCIAL DISCOVERY (aggregate clicks, not cohort conversion)",
    ...Object.entries(report.discovery).map(([key, count]) => `${key.slice("discovery:".length)}: ${count}`),
    "",
    "AI RELIABILITY",
    ...Object.entries(report.ai).map(([key, count]) => `${key.slice("ai:".length)}: ${count}`),
    "",
    "VOICE",
    ...Object.entries(report.voice).map(([key, count]) => `${key.slice("voice:".length)}: ${count}`),
    "",
    "Rates are aggregate event continuation ratios, not cohort-perfect retention.",
  ];
  return `${lines.join("\n")}\n`;
}

async function main() {
  const range = parseProgrammeAnalyticsArgs(process.argv.slice(2));
  const metrics = await fetchProgrammeAnalyticsMetrics({
    token: process.env.VERCEL_TOKEN,
    ...range,
  });
  process.stdout.write(formatProgrammeAnalyticsReport(buildProgrammeAnalyticsReport(metrics), range));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : "Programme analytics report failed"}\n`);
    process.exitCode = 1;
  });
}
