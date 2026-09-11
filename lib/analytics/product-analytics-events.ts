import { z } from "zod";

/**
 * RFC-046 Product Core v1 has one persisted event dictionary. Database enum
 * values are the uppercase transport form of these public names.
 */
export const productAnalyticsEventNames = [
  "session_started",
  "page_viewed",
  "signup_completed",
  "login_completed",
  "programme_started",
  "programme_step_viewed",
  "programme_step_completed",
  "programme_completed",
  "casino_viewed",
  "offer_viewed",
  "commercial_cta_clicked",
  "outbound_redirect_attempted",
  "outbound_redirect_succeeded",
  "outbound_redirect_blocked",
  "email_sent",
  "email_delivered",
  "email_bounced",
  "email_clicked",
  "email_unsubscribed",
] as const;

export type ProductAnalyticsEventName = (typeof productAnalyticsEventNames)[number];
export type ProgrammeMissionNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** Transitional UI-only types for call sites whose legacy aliases are no-ops. */
export type ProductAnalyticsEventMap = {
  programme_start_clicked: {
    sourceSurface: "ten_steps" | "public_header" | "home" | "other_public";
  };
  commercial_surface_viewed: {
    surface: "best_offers" | "casinos" | "bonuses" | "casino_review";
  };
  casino_review_opened: { sourceSurface: string };
  programme_home_viewed: {
    engagementDayBucket: "day_0" | "day_1" | "day_2_3" | "day_4_7" | "day_8_plus" | "unknown";
  };
};

export const clientProductAnalyticsEventNames = [
  "page_viewed",
  "programme_step_viewed",
  "casino_viewed",
  "offer_viewed",
  "commercial_cta_clicked",
] as const satisfies readonly ProductAnalyticsEventName[];

export type ClientProductAnalyticsEventName = (typeof clientProductAnalyticsEventNames)[number];

const boundedText = (maximum: number) => z.string().trim().min(1).max(maximum);
const optionalUuid = z.uuid().optional();
const optionalAcquisitionDimension = (maximum: number) => boundedText(maximum)
  .regex(/^[\p{L}\p{N}][\p{L}\p{N} ._+():-]*$/u)
  .optional();
const optionalReferrerHost = boundedText(253)
  .regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i)
  .optional();
const optionalPlacement = boundedText(64).regex(/^[A-Z0-9][A-Z0-9_:-]*$/).optional();
const pagePath = z.string()
  .min(1)
  .max(512)
  .refine((value) => value.startsWith("/") && !/[?#\r\n]/.test(value), "pagePath must be a query-free site path");
const locale = z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/).max(16);

export const clientAnalyticsEventSchema = z.object({
  eventId: z.uuid(),
  schemaVersion: z.literal(1),
  name: z.enum(clientProductAnalyticsEventNames),
  occurredAt: z.iso.datetime({ offset: true }),
  pagePath: pagePath.optional(),
  locale: locale.optional(),
  referrerHost: optionalReferrerHost,
  acquisitionSource: optionalAcquisitionDimension(64),
  utmSource: optionalAcquisitionDimension(100),
  utmMedium: optionalAcquisitionDimension(100),
  utmCampaign: optionalAcquisitionDimension(100),
  utmContent: optionalAcquisitionDimension(100),
  utmTerm: optionalAcquisitionDimension(100),
  casinoId: optionalUuid,
  affiliateOfferId: optionalUuid,
  placement: optionalPlacement,
  programmeStep: z.number().int().min(1).max(10).optional(),
}).strict().superRefine((event, context) => {
  const programmeStepEvent = event.name === "programme_step_viewed";
  if (programmeStepEvent !== (event.programmeStep !== undefined)) {
    context.addIssue({
      code: "custom",
      path: ["programmeStep"],
      message: "programmeStep is required only for a Programme step view",
    });
  }
  if (event.casinoId !== undefined && event.name !== "casino_viewed" && event.name !== "offer_viewed") {
    context.addIssue({ code: "custom", path: ["casinoId"], message: "casinoId is allowed only for casino or offer views" });
  }
  if (event.affiliateOfferId !== undefined && event.name !== "offer_viewed") {
    context.addIssue({ code: "custom", path: ["affiliateOfferId"], message: "affiliateOfferId is allowed only for offer views" });
  }
  if (event.placement !== undefined && event.name !== "commercial_cta_clicked") {
    context.addIssue({ code: "custom", path: ["placement"], message: "placement is allowed only for commercial CTA clicks" });
  }
});

export type ClientProductAnalyticsEvent = z.infer<typeof clientAnalyticsEventSchema>;

export type ProductAnalyticsEvent = ClientProductAnalyticsEvent;

export const analyticsDatabaseEventTypes = Object.fromEntries(
  productAnalyticsEventNames.map((name) => [name, name.toUpperCase()]),
) as Record<ProductAnalyticsEventName, Uppercase<ProductAnalyticsEventName>>;

export function parseProductAnalyticsEvent(value: unknown) {
  return clientAnalyticsEventSchema.parse(value);
}

export function safeParseProductAnalyticsEvent(value: unknown) {
  return clientAnalyticsEventSchema.safeParse(value);
}

export function createClientProductAnalyticsEvent(
  name: ClientProductAnalyticsEventName,
  dimensions: Omit<ClientProductAnalyticsEvent, "eventId" | "schemaVersion" | "name" | "occurredAt"> = {},
  options: { eventId?: string; occurredAt?: Date } = {},
): ClientProductAnalyticsEvent {
  return parseProductAnalyticsEvent({
    eventId: options.eventId ?? crypto.randomUUID(),
    schemaVersion: 1,
    name,
    occurredAt: (options.occurredAt ?? new Date()).toISOString(),
    ...dimensions,
  });
}

export function programmeEngagementDayBucket(startedAt: Date | null, now = new Date()) {
  if (!startedAt || !Number.isFinite(startedAt.getTime()) || !Number.isFinite(now.getTime()) || startedAt > now) {
    return "unknown" as const;
  }
  const elapsedDays = Math.floor((now.getTime() - startedAt.getTime()) / 86_400_000);
  if (elapsedDays === 0) return "day_0" as const;
  if (elapsedDays === 1) return "day_1" as const;
  if (elapsedDays <= 3) return "day_2_3" as const;
  if (elapsedDays <= 7) return "day_4_7" as const;
  return "day_8_plus" as const;
}
