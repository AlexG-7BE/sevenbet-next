/**
 * RFC-046 §17 cookieless count. Its rows never carry an anonymous ID and consented
 * rows always do, so these filters select the count without reading any identifier.
 */
export const cookielessVisitWhere = { type: "SESSION_STARTED", anonymousId: null } as const;
export const cookielessPageViewWhere = { type: "PAGE_VIEWED", anonymousId: null } as const;
export const consentedEventWhere = { anonymousId: { not: null } } as const;
