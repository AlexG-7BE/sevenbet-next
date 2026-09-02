import { outboundClickRepository, type OutboundClickStore } from "@/lib/repositories/outbound-click.repository";

import { ValidationError } from "./service-error";

export interface RecordOutboundClickInput {
  clickedAt?: Date;
  casinoId: string;
  countryCode: string;
  redirectSlugId: string;
  affiliateOfferId: string;
  trackingLinkId: string;
}

export interface OutboundClickReportInput {
  from?: string | null;
  to?: string | null;
  casinoId?: string;
  countryCode?: string | null;
  redirectSlugId?: string;
  now?: Date;
}

function utcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function dateOnly(value: string | null | undefined, field: string, fallback: Date) {
  if (!value) return utcDay(fallback);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ValidationError(`${field} must use YYYY-MM-DD`);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new ValidationError(`${field} is not a valid calendar date`);
  return parsed;
}

function country(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) throw new ValidationError("countryCode must be an ISO alpha-2 code");
  return normalized;
}

export class OutboundClickService {
  constructor(private readonly store: OutboundClickStore = outboundClickRepository) {}

  record(input: RecordOutboundClickInput) {
    const clickedAt = input.clickedAt ?? new Date();
    if (Number.isNaN(clickedAt.getTime())) throw new ValidationError("clickedAt must be valid");
    return this.store.increment({
      day: utcDay(clickedAt),
      clickedAt,
      casinoId: input.casinoId,
      countryCode: country(input.countryCode),
      redirectSlugId: input.redirectSlugId,
      affiliateOfferId: input.affiliateOfferId,
      trackingLinkId: input.trackingLinkId,
    });
  }

  async report(input: OutboundClickReportInput = {}) {
    const now = input.now ?? new Date();
    const today = utcDay(now);
    const defaultFrom = new Date(today);
    defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 29);
    const from = dateOnly(input.from, "from", defaultFrom);
    const to = dateOnly(input.to, "to", today);
    if (from > to) throw new ValidationError("from must not be later than to");
    const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
    if (days > 366) throw new ValidationError("Report range cannot exceed 366 days");
    const until = new Date(to);
    until.setUTCDate(until.getUTCDate() + 1);
    const countryCode = input.countryCode ? country(input.countryCode) : undefined;
    const rows = await this.store.report({ from, until, casinoId: input.casinoId, countryCode, redirectSlugId: input.redirectSlugId });
    const routes = new Map<string, {
      casinoId: string; casinoName: string; countryCode: string; redirectSlugId: string; redirectSlug: string;
      affiliateOfferId: string; trackingLinkId: string; clicks: number;
    }>();
    for (const row of rows) {
      const key = [row.casinoId, row.countryCode, row.redirectSlugId, row.trackingLinkId].join("|");
      const current = routes.get(key);
      if (current) current.clicks += row.clickCount;
      else routes.set(key, {
        casinoId: row.casinoId,
        casinoName: row.casinoName,
        countryCode: row.countryCode,
        redirectSlugId: row.redirectSlugId,
        redirectSlug: row.redirectSlug,
        affiliateOfferId: row.affiliateOfferId,
        trackingLinkId: row.trackingLinkId,
        clicks: row.clickCount,
      });
    }
    return {
      range: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10), days },
      filters: { casinoId: input.casinoId ?? null, countryCode: countryCode ?? null, redirectSlugId: input.redirectSlugId ?? null },
      totals: { clicks: rows.reduce((total, row) => total + row.clickCount, 0), routes: routes.size },
      routes: [...routes.values()],
      daily: rows.map((row) => ({ ...row, day: row.day.toISOString().slice(0, 10) })),
      privacy: "aggregate-only",
    } as const;
  }
}

export const outboundClickService = new OutboundClickService();

export async function recordOutboundClickBestEffort(
  input: RecordOutboundClickInput,
  dependencies: {
    recorder?: Pick<OutboundClickService, "record">;
    warn?: (message: string, context: { slugId: string; casinoId: string; countryCode: string }) => void;
  } = {},
) {
  try {
    await (dependencies.recorder ?? outboundClickService).record(input);
    return true;
  } catch {
    (dependencies.warn ?? console.warn)("affiliate_outbound_click_metric_failed", {
      slugId: input.redirectSlugId,
      casinoId: input.casinoId,
      countryCode: input.countryCode,
    });
    return false;
  }
}
