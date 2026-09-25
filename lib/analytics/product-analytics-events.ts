// zod/mini: this schema also runs in the browser on every page, where full zod costs ~19 kB gzip.
import * as z from "zod/mini";

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
  "commercial_view_selected",
  "commercial_card_viewed",
  "casino_review_clicked",
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

export type ProgrammeStartSourceSurface = "ten_steps" | "public_header" | "home" | "other_public";
export type ProgrammeEngagementDayBucket = "day_0" | "day_1" | "day_2_3" | "day_4_7" | "day_8_plus" | "unknown";

/** Transitional UI-only types for non-Programme compatibility aliases. */
export type ProductAnalyticsEventMap = {
  commercial_surface_viewed: {
    surface: "best_offers" | "casinos" | "bonuses" | "casino_review";
  };
  casino_review_opened: { sourceSurface: string };
};

export const clientProductAnalyticsEventNames = [
  "page_viewed",
  "programme_step_viewed",
  "casino_viewed",
  "offer_viewed",
  "commercial_view_selected",
  "commercial_card_viewed",
  "casino_review_clicked",
  "commercial_cta_clicked",
] as const satisfies readonly ProductAnalyticsEventName[];

export type ClientProductAnalyticsEventName = (typeof clientProductAnalyticsEventNames)[number];

const boundedText = (maximum: number, ...checks: Parameters<ReturnType<typeof z.string>["check"]>) => z.string()
  .check(z.trim(), z.minLength(1), z.maxLength(maximum), ...checks);
const optionalUuid = z.optional(z.uuid());
const optionalAcquisitionDimension = (maximum: number) => z.optional(boundedText(
  maximum,
  z.regex(/^[\p{L}\p{N}][\p{L}\p{N} ._+():-]*$/u),
));
const optionalReferrerHost = z.optional(boundedText(
  253,
  z.regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i),
));
const optionalPlacement = z.optional(boundedText(64, z.regex(/^[A-Z0-9][A-Z0-9_:-]*$/)));
const pagePath = z.string().check(
  z.minLength(1),
  z.maxLength(512),
  z.refine((value) => value.startsWith("/") && !/[?#\r\n]/.test(value), "pagePath must be a query-free site path"),
);
const locale = z.string().check(z.regex(/^[a-z]{2}(?:-[A-Z]{2})?$/), z.maxLength(16));
const boundedInt = (maximum: number) => z.optional(z.int().check(z.minimum(1), z.maximum(maximum)));

export const clientAnalyticsEventSchema = z.strictObject({
  eventId: z.uuid(),
  schemaVersion: z.literal(1),
  name: z.enum(clientProductAnalyticsEventNames),
  occurredAt: z.iso.datetime({ offset: true }),
  pagePath: z.optional(pagePath),
  locale: z.optional(locale),
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
  position: boundedInt(1000),
  programmeStep: boundedInt(10),
}).check(z.superRefine((event, context) => {
  const programmeStepEvent = event.name === "programme_step_viewed";
  if (programmeStepEvent !== (event.programmeStep !== undefined)) {
    context.addIssue({
      code: "custom",
      path: ["programmeStep"],
      message: "programmeStep is required only for a Programme step view",
    });
  }
  const casinoEvents: ClientProductAnalyticsEventName[] = ["casino_viewed", "offer_viewed", "commercial_card_viewed", "casino_review_clicked"];
  if (event.casinoId !== undefined && !casinoEvents.includes(event.name)) {
    context.addIssue({ code: "custom", path: ["casinoId"], message: "casinoId is allowed only for bounded casino or offer interactions" });
  }
  if (event.affiliateOfferId !== undefined && event.name !== "offer_viewed") {
    context.addIssue({ code: "custom", path: ["affiliateOfferId"], message: "affiliateOfferId is allowed only for offer views" });
  }
  const placementEvents: ClientProductAnalyticsEventName[] = ["commercial_view_selected", "commercial_card_viewed", "casino_review_clicked", "commercial_cta_clicked"];
  if (event.placement !== undefined && !placementEvents.includes(event.name)) {
    context.addIssue({ code: "custom", path: ["placement"], message: "placement is allowed only for bounded commercial interactions" });
  }
  const positionedEvents: ClientProductAnalyticsEventName[] = ["commercial_card_viewed", "casino_review_clicked"];
  if (event.position !== undefined && !positionedEvents.includes(event.name)) {
    context.addIssue({ code: "custom", path: ["position"], message: "position is allowed only for commercial card or review interactions" });
  }
  if (event.name === "commercial_view_selected" && event.placement === undefined) {
    context.addIssue({ code: "custom", path: ["placement"], message: "selected view is required" });
  }
  if ((event.name === "commercial_card_viewed" || event.name === "casino_review_clicked") && event.placement === undefined) {
    context.addIssue({ code: "custom", path: ["placement"], message: "commercial placement is required for this interaction" });
  }
  if (event.name === "commercial_card_viewed" && event.position === undefined) {
    context.addIssue({ code: "custom", path: ["position"], message: "card position is required for a commercial card view" });
  }
  if ((event.name === "commercial_card_viewed" || event.name === "casino_review_clicked") && event.casinoId === undefined) {
    context.addIssue({ code: "custom", path: ["casinoId"], message: "casinoId is required for this interaction" });
  }
}));

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
