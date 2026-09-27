import assert from "node:assert/strict";
import test from "node:test";

import {
  ANALYTICS_ANONYMOUS_COOKIE,
  ANALYTICS_CONSENT_COOKIE,
} from "../lib/analytics/consent-contract";
import { analyticsConsentLedgerAction } from "../lib/analytics/consent.server";
import {
  analyticsCookieSecure,
  analyticsDeviceCategory,
  analyticsEnvironment,
  analyticsSigningSecret,
  analyticsTrafficKind,
  newAnalyticsUuid,
  readAnalyticsConsent,
  readAnalyticsUuid,
  safeReferrerContext,
  signedAnalyticsConsent,
  signedAnalyticsUuid,
} from "../lib/analytics/identity.server";
import { analyticsRange, percentage, safeRate } from "../lib/analytics/metrics";
import {
  ANALYTICS_EVENTS_PER_SOURCE_PER_MINUTE,
  consumeAnalyticsRateLimit,
  deriveAnalyticsRateLimitKey,
} from "../lib/analytics/rate-limit.server";
import {
  isRetryableOutboundWriteError,
  recordOutboundAttribution,
  recordOutboundAttributionBestEffort,
  safeOutboundPlacement,
  safeOutboundSlug,
  type OutboundAttributionDependencies,
  type OutboundAttributionInput,
} from "../lib/analytics/outbound-attribution.server";
import { customerWhere } from "../lib/customers/admin.server";
import { normalizeCustomerEmail } from "../lib/customers/auth-hooks.server";
import { campaignAudienceWhere, campaignRecipientIdempotencyKey } from "../lib/email/campaigns.server";
import { emailSendEligibility } from "../lib/email/eligibility";
import {
  MemoryLifecycleEmailProvider,
  ResendLifecycleEmailProvider,
  type EmailProviderEnvelope,
} from "../lib/email/provider.server";
import { resolveLifecycleEmailRuntimeConfig } from "../lib/email/runtime-config.server";
import { saveProgrammeMarketingPreference } from "../lib/customers/email-preference-client";
import {
  authEmailIdempotencyKey,
  hashUnsubscribeToken,
  programmeReminderIdempotencyKey,
  unsubscribeTokenForMessage,
  welcomeEmailIdempotencyKey,
} from "../lib/email/service.server";
import { renderEmailTemplate, sanitizeEmailTemplate } from "../lib/email/templates.server";
import { isValidUnsubscribeToken } from "../lib/email/unsubscribe.server";
import { normalizeResendWebhook } from "../lib/email/webhook.server";
import { createLifecycleQueueCronHandler } from "../lib/email/lifecycle-queue-cron.server";
import { isSameOriginMutation } from "../lib/http/mutation-request";
import {
  customerDataRetentionConfig,
  DEFAULT_ANALYTICS_RETENTION_DAYS,
  DEFAULT_EMAIL_HISTORY_RETENTION_DAYS,
} from "../lib/privacy/customer-data-retention.server";
import { POST as postEmailUnsubscribe } from "../app/api/email/unsubscribe/route";

const secret = "customer-analytics-unit-test-secret-32";

test("outbound attribution failure remains best-effort and logs no click dimensions", async () => {
  const warnings: Array<{ message: string; context: unknown }> = [];
  const result = await recordOutboundAttributionBestEffort({
    clickId: "11111111-1111-4111-8111-111111111111",
    request: new Request("https://b4gamble.com/r/verified-casino"),
    requestedSlug: "verified-casino",
    attemptedAt: new Date("2026-09-14T12:00:00.000Z"),
    state: "SUCCEEDED",
    countryCode: "GB",
    casinoId: "22222222-2222-4222-8222-222222222222",
    affiliateOfferId: "33333333-3333-4333-8333-333333333333",
    redirectSlugId: "44444444-4444-4444-8444-444444444444",
    trackingLinkId: "55555555-5555-4555-8555-555555555555",
  }, {
    recorder: async () => { throw new Error("database URL and click identifiers must never escape"); },
    warn: (message, context) => warnings.push({ message, context }),
  });
  assert.equal(result, false);
  assert.deepEqual(warnings, [{
    message: "[analytics] outbound attribution failed",
    context: { analytics_failure_category: "database", outbound_state: "SUCCEEDED" },
  }]);
  assert.doesNotMatch(JSON.stringify(warnings), /database URL|11111111|22222222|verified-casino/i);
});

test("analytics identifiers are stable, signed, and reject tampering", () => {
  const anonymousId = newAnalyticsUuid();
  const consent = signedAnalyticsConsent("granted", secret);
  const identity = signedAnalyticsUuid(anonymousId, secret);
  const headers = new Headers({
    cookie: `${ANALYTICS_CONSENT_COOKIE}=${consent}; ${ANALYTICS_ANONYMOUS_COOKIE}=${identity}`,
  });
  assert.equal(readAnalyticsConsent(headers, secret), "granted");
  assert.equal(readAnalyticsUuid(headers, ANALYTICS_ANONYMOUS_COOKIE, secret), anonymousId);

  const tampered = new Headers({ cookie: `${ANALYTICS_CONSENT_COOKIE}=${consent.slice(0, -1)}x` });
  assert.equal(readAnalyticsConsent(tampered, secret), "unknown");
  assert.throws(() => signedAnalyticsUuid("not-a-uuid", secret), /must be a UUID/);
  assert.equal(analyticsSigningSecret({ BETTER_AUTH_SECRET: secret }), secret);
  assert.throws(() => analyticsSigningSecret({ BETTER_AUTH_SECRET: "x".repeat(31) }), /not configured/);
  assert.throws(() => analyticsSigningSecret({ BETTER_AUTH_SECRET: "short" }), /not configured/);
});

test("consent ledger transitions distinguish a first denial from withdrawal", () => {
  assert.equal(analyticsConsentLedgerAction(false, null), "DENIED");
  assert.equal(analyticsConsentLedgerAction(false, "DENIED"), "DENIED");
  assert.equal(analyticsConsentLedgerAction(false, "GRANTED"), "WITHDRAWN");
  assert.equal(analyticsConsentLedgerAction(true, "WITHDRAWN"), "GRANTED");
});

test("unsafe browser mutations require exact same-origin evidence", () => {
  const url = "https://b4gamble.com/api/consent/analytics";
  assert.equal(isSameOriginMutation(new Request(url, { headers: { origin: "https://b4gamble.com" } })), true);
  assert.equal(isSameOriginMutation(new Request("http://localhost:4173/api/consent/analytics", {
    headers: { host: "127.0.0.1:4173", origin: "http://127.0.0.1:4173" },
  })), true);
  assert.equal(isSameOriginMutation(new Request("http://internal:4173/api/consent/analytics", {
    headers: { host: "b4gamble.com", origin: "https://b4gamble.com", "x-forwarded-proto": "https" },
  })), true);
  assert.equal(isSameOriginMutation(new Request(url, { headers: { origin: "https://b4gamble.com/path" } })), false);
  assert.equal(isSameOriginMutation(new Request("http://localhost:4173/api/consent/analytics", {
    headers: { host: "127.0.0.1:4173", origin: "https://127.0.0.1:4173" },
  })), false);
  assert.equal(isSameOriginMutation(new Request(url, { headers: { origin: "https://attacker.invalid" } })), false);
  assert.equal(isSameOriginMutation(new Request(url)), false);
  assert.equal(isSameOriginMutation(new Request(url, { headers: { "sec-fetch-site": "same-origin" } })), true);
  assert.equal(isSameOriginMutation(new Request(url, { headers: { "sec-fetch-site": "same-site" } })), false);
});

test("unsubscribe browser forms return a private redirect without mutating immutable headers", async () => {
  const response = await postEmailUnsubscribe(new Request("https://b4gamble.com/api/email/unsubscribe", {
    method: "POST",
    headers: {
      origin: "https://b4gamble.com",
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "token=tampered",
  }));

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "https://b4gamble.com/unsubscribe?status=invalid");
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
});

test("analytics environment, bot/device classification, and referrer context stay bounded", () => {
  assert.equal(analyticsCookieSecure({ NODE_ENV: "production" }), true);
  assert.equal(analyticsCookieSecure({ NODE_ENV: "production", CI: "true", BETTER_AUTH_URL: "http://127.0.0.1:4173" }), false);
  assert.equal(analyticsCookieSecure({ NODE_ENV: "production", CI: "true", BETTER_AUTH_URL: "http://localhost:4173" }), false);
  assert.equal(analyticsCookieSecure({ NODE_ENV: "production", CI: "true", BETTER_AUTH_URL: "https://b4gamble.com" }), true);
  assert.equal(analyticsCookieSecure({ NODE_ENV: "production", CI: "true", BETTER_AUTH_URL: "http://127.0.0.1:4173", VERCEL_ENV: "production" }), true);
  assert.equal(analyticsCookieSecure({ NODE_ENV: "production", CI: "true", BETTER_AUTH_URL: "http://127.0.0.1.attacker.invalid", VERCEL_ENV: "production" }), true);
  assert.equal(analyticsCookieSecure({ NODE_ENV: "development", CI: "true", BETTER_AUTH_URL: "http://127.0.0.1:4173" }), false);
  assert.equal(analyticsEnvironment({ NODE_ENV: "test" }), "TEST");
  assert.equal(analyticsEnvironment({ VERCEL_ENV: "production", NODE_ENV: "production" }), "PRODUCTION");
  assert.equal(analyticsEnvironment({ VERCEL_ENV: "preview" }), "PREVIEW");
  assert.equal(analyticsEnvironment({}), "LOCAL");
  assert.equal(analyticsTrafficKind(new Headers({ "user-agent": "Googlebot" }), "PRODUCTION"), "BOT");
  // The launch click check clicks /r/ from Globalping probes; they must never count as visitors.
  assert.equal(analyticsTrafficKind(new Headers({ "user-agent": "globalping probe (https://github.com/jsdelivr/globalping)" }), "PRODUCTION"), "BOT");
  assert.equal(analyticsTrafficKind(new Headers({ "user-agent": "Mozilla/5.0" }), "PRODUCTION"), "HUMAN");
  assert.equal(analyticsDeviceCategory(new Headers({ "user-agent": "Mozilla iPhone Mobile" })), "MOBILE");
  assert.equal(analyticsDeviceCategory(new Headers({ "user-agent": "Mozilla iPad" })), "TABLET");
  assert.equal(analyticsDeviceCategory(new Headers()), "UNKNOWN");
  assert.deepEqual(safeReferrerContext("https://b4gamble.com/casinos", "https://b4gamble.com/offers?token=secret"), {
    referrerHost: "b4gamble.com",
    sourcePage: "/offers",
  });
  assert.deepEqual(safeReferrerContext("https://b4gamble.com/", "https://external.example/path?secret=1"), {
    referrerHost: "external.example",
    sourcePage: null,
  });
});

test("analytics rate limiting uses keyed, atomic minute buckets", async () => {
  const first = deriveAnalyticsRateLimitKey({ source: "203.0.113.8", windowNumber: 42, secret });
  assert.equal(first, deriveAnalyticsRateLimitKey({ source: "203.0.113.8", windowNumber: 42, secret }));
  assert.notEqual(first, deriveAnalyticsRateLimitKey({ source: "203.0.113.9", windowNumber: 42, secret }));
  assert.doesNotMatch(first, /203\.0\.113/);

  type Store = NonNullable<Parameters<typeof consumeAnalyticsRateLimit>[0]["store"]>;
  let count = 0;
  const store: Store = {
    async upsert(args) {
      count = count === 0 ? args.create.count : count + args.update.count.increment;
      return { count };
    },
  };
  const now = new Date("2026-09-11T10:00:00.000Z");
  const allowed = await consumeAnalyticsRateLimit({ source: "source", eventCount: 20, now, store, secret });
  assert.equal(allowed.allowed, true);
  count = ANALYTICS_EVENTS_PER_SOURCE_PER_MINUTE;
  const denied = await consumeAnalyticsRateLimit({ source: "source", eventCount: 1, now, store, secret });
  assert.equal(denied.allowed, false);
  assert.equal(denied.retryAfterSeconds, 60);
  await assert.rejects(consumeAnalyticsRateLimit({ source: "source", eventCount: 21, now, store, secret }), /Invalid/);
});

test("canonical metric range and ratio boundaries are UTC and reproducible", () => {
  const now = new Date("2026-09-11T19:30:00.000Z");
  const seven = analyticsRange({ range: "7" }, now);
  assert.deepEqual([seven.fromDate, seven.toDate, seven.days, seven.until.toISOString()], [
    "2026-09-05", "2026-09-11", 7, "2026-09-12T00:00:00.000Z",
  ]);
  const reversed = analyticsRange({ range: "custom", from: "2026-09-10", to: "2026-09-01" }, now);
  assert.deepEqual([reversed.fromDate, reversed.toDate, reversed.days], ["2026-09-01", "2026-09-10", 10]);
  const bounded = analyticsRange({ range: "custom", from: "2020-01-01", to: "2026-09-11" }, now);
  assert.equal(bounded.days, 366);
  const malformed = analyticsRange({ range: "custom", from: "9999-99-99", to: "not-a-date" }, now);
  assert.deepEqual([malformed.fromDate, malformed.toDate, malformed.days], ["2026-09-11", "2026-09-11", 1]);
  assert.equal(safeRate(4, 8), 0.5);
  assert.equal(safeRate(1, 0), 0);
  assert.equal(percentage(0.125), "12.5%");
});

test("email eligibility separates transactional from marketing and enforces final suppression", () => {
  const base = {
    accountState: "ACTIVE" as const,
    emailVerified: false,
    email: "person@example.com",
    marketingAllowed: false,
    unsubscribedAt: null,
    suppressionScope: "NONE" as const,
  };
  assert.deepEqual(emailSendEligibility({ ...base, purpose: "PASSWORD_RESET" }), { allowed: true, reason: "TRANSACTIONAL" });
  assert.deepEqual(emailSendEligibility({ ...base, purpose: "PROGRAMME_REMINDER" }), { allowed: false, reason: "EMAIL_UNVERIFIED" });
  assert.deepEqual(emailSendEligibility({ ...base, purpose: "PASSWORD_RESET", suppressionScope: "ALL" }), { allowed: false, reason: "ALL_EMAIL_SUPPRESSED" });
  assert.deepEqual(emailSendEligibility({ ...base, emailVerified: true, marketingAllowed: true, purpose: "MARKETING_BROADCAST" }), {
    allowed: true,
    reason: "MARKETING_AUTHORITY_CONFIRMED",
  });
  assert.deepEqual(emailSendEligibility({ ...base, emailVerified: true, marketingAllowed: true, purpose: "MARKETING_BROADCAST", unsubscribedAt: new Date() }), {
    allowed: false,
    reason: "NO_MARKETING_AUTHORITY",
  });
  assert.deepEqual(emailSendEligibility({ ...base, purpose: "ACCOUNT_SECURITY", accountState: "SUSPENDED" }), {
    allowed: false,
    reason: "ACCOUNT_INACTIVE",
  });
});

test("template validation sanitizes XSS, locks variables, and preserves approved URLs", () => {
  const template = sanitizeEmailTemplate({
    key: "WELCOME",
    type: "LIFECYCLE",
    locale: "en",
    subject: "Welcome {{name}}",
    htmlBody: '<h1>Hello {{name}}</h1><script>alert(1)</script><a href="{{programme_url}}">Continue</a>',
    textBody: "Hello {{name}}. Continue: {{programme_url}}",
  });
  assert.doesNotMatch(template.htmlBody, /script|alert/i);
  assert.match(template.htmlBody, /href="{{programme_url}}"/);
  const rendered = renderEmailTemplate(template, { name: '<Admin "One">', programme_url: "https://b4gamble.com/program?from=email&v=1" });
  assert.match(rendered.html, /&lt;Admin &quot;One&quot;&gt;/);
  assert.match(rendered.html, /from=email&amp;v=1/);
  assert.doesNotMatch(rendered.html, /<Admin/);

  const input = { ...template, htmlBody: '<a href="{{programme_url}}">Continue</a>' };
  assert.throws(() => sanitizeEmailTemplate({ ...input, type: "TRANSACTIONAL" }), /invalid/);
  assert.throws(() => sanitizeEmailTemplate({ ...input, subject: "Hello {{email}}" }), /Unsupported/);
  assert.throws(() => sanitizeEmailTemplate({ ...input, subject: "Hello {{action_url}}" }), /subject supports only/);
  assert.throws(() => sanitizeEmailTemplate({ ...input, subject: "Hello\r\nBcc: attacker@example.invalid" }), /line breaks|control/);
  assert.throws(() => sanitizeEmailTemplate({ ...input, subject: "Hello {{name" }), /malformed/);
  assert.throws(() => sanitizeEmailTemplate({ ...input, htmlBody: '<a href="https://example.com/{{programme_url}}">Continue</a>' }), /complete href/);
  assert.throws(() => sanitizeEmailTemplate({ ...input, htmlBody: '<a href="{{programme_url}}">Continue</a><a href="https://example.com/news">News</a>' }), /canonical B4GAMBLE/);
  assert.throws(() => sanitizeEmailTemplate({ ...input, htmlBody: '<a href={{programme_url}}>Continue</a><a href=https:\/\/example.com\/news>News</a>' }), /approved URL|canonical B4GAMBLE/);
  assert.throws(() => sanitizeEmailTemplate({ ...input, htmlBody: '<a href="{{programme_url}}">Continue</a><a href="https://b4gamble.com:8443/news">News</a>' }), /canonical B4GAMBLE/);
  assert.throws(() => sanitizeEmailTemplate({ ...input, htmlBody: '<a href="{{programme_url}}">Continue</a><a href="https://b4gamble.com/%72/partner">Partner</a>' }), /canonical B4GAMBLE/);
  assert.throws(() => sanitizeEmailTemplate({ ...input, htmlBody: "<p>Continue</p>" }), /requires/);
  assert.throws(() => sanitizeEmailTemplate({ ...input, extra: "unknown" }), /unsupported fields/);
  assert.throws(() => renderEmailTemplate(template, { name: "Customer\nBcc: attacker@example.invalid", programme_url: "https://b4gamble.com/program" }), /subject contains/);
});

test("lifecycle provider activation is exact, Production-only, and validates sender configuration", async () => {
  const environment = {
    VERCEL_ENV: "production",
    NODE_ENV: "production",
    LIFECYCLE_EMAIL_DELIVERY_ENABLED: "true",
    RESEND_API_KEY: "re_unit_test",
    LIFECYCLE_EMAIL_FROM: "B4GAMBLE <info@b4gamble.com>",
    LIFECYCLE_EMAIL_REPLY_TO: "support@b4gamble.com",
    RESEND_WEBHOOK_SECRET: "whsec_unit_test",
    NEXT_PUBLIC_SITE_URL: "https://b4gamble.com",
  };
  const config = resolveLifecycleEmailRuntimeConfig(environment);
  assert.ok(config);
  assert.equal(config.environment, "PRODUCTION");
  assert.equal(resolveLifecycleEmailRuntimeConfig({ ...environment, VERCEL_ENV: "preview" }), null);
  assert.equal(resolveLifecycleEmailRuntimeConfig({ ...environment, LIFECYCLE_EMAIL_DELIVERY_ENABLED: "TRUE" }), null);
  assert.equal(resolveLifecycleEmailRuntimeConfig({ ...environment, NEXT_PUBLIC_SITE_URL: "http://b4gamble.com" }), null);
  assert.equal(resolveLifecycleEmailRuntimeConfig({ ...environment, NEXT_PUBLIC_SITE_URL: "https://other.example" }), null);
  assert.equal(resolveLifecycleEmailRuntimeConfig({ ...environment, LIFECYCLE_EMAIL_FROM: "Sender <sender@other.example>" }), null);
  assert.equal(resolveLifecycleEmailRuntimeConfig({ ...environment, LIFECYCLE_EMAIL_FROM: "bad\nBcc: attacker@example.com" }), null);
  assert.equal(resolveLifecycleEmailRuntimeConfig({ ...environment, RESEND_WEBHOOK_SECRET: "" }), null);
  assert.equal(resolveLifecycleEmailRuntimeConfig({ ...environment, RESEND_WEBHOOK_SECRET: "invalid" }), null);

  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return Response.json({ id: "provider-message-1" }, { status: 200 });
  }) as typeof fetch;
  const provider = new ResendLifecycleEmailProvider(config, fetcher);
  const envelope: EmailProviderEnvelope = {
    to: "test@example.invalid",
    subject: "Test",
    html: "<p>Test</p>",
    text: "Test",
    idempotencyKey: "test:provider:00000001",
  };
  assert.deepEqual(await provider.send(envelope), { status: "accepted", provider: "resend", messageId: "provider-message-1" });
  assert.equal(calls[0]?.url, "https://api.resend.com/emails");
  assert.equal(new Headers(calls[0]?.init?.headers).get("idempotency-key"), envelope.idempotencyKey);
  assert.doesNotMatch(JSON.stringify(calls[0]?.init?.body), /re_unit_test|whsec_unit_test/);
  const invalidResponseProvider = new ResendLifecycleEmailProvider(config, (async () => (
    Response.json({ id: "provider id with spaces" }, { status: 200 })
  )) as typeof fetch);
  assert.deepEqual(await invalidResponseProvider.send(envelope), { status: "unavailable", code: "REJECTED" });
  const rateLimitedProvider = new ResendLifecycleEmailProvider(config, (async () => new Response(null, { status: 429 })) as typeof fetch);
  assert.deepEqual(await rateLimitedProvider.send(envelope), { status: "unavailable", code: "RATE_LIMITED" });
  const serverErrorProvider = new ResendLifecycleEmailProvider(config, (async () => new Response(null, { status: 503 })) as typeof fetch);
  assert.deepEqual(await serverErrorProvider.send(envelope), { status: "unavailable", code: "PROVIDER_5XX" });
  const clientErrorProvider = new ResendLifecycleEmailProvider(config, (async () => new Response(null, { status: 400 })) as typeof fetch);
  assert.deepEqual(await clientErrorProvider.send(envelope), { status: "unavailable", code: "REJECTED" });
});

test("Programme marketing preference retries only an explicit server-unavailable response", async () => {
  let unavailableCalls = 0;
  assert.equal(await saveProgrammeMarketingPreference("en-GB", async () => {
    unavailableCalls += 1;
    return unavailableCalls === 1 ? { ok: false, status: 503 } : { ok: true, status: 200 };
  }), true);
  assert.equal(unavailableCalls, 2);

  let ambiguousCalls = 0;
  assert.equal(await saveProgrammeMarketingPreference("en-GB", async () => {
    ambiguousCalls += 1;
    throw new Error("ambiguous network result");
  }), false);
  assert.equal(ambiguousCalls, 1);

  let rejectedCalls = 0;
  assert.equal(await saveProgrammeMarketingPreference("en-GB", async () => {
    rejectedCalls += 1;
    return { ok: false, status: 400 };
  }), false);
  assert.equal(rejectedCalls, 1);
});

test("memory provider and lifecycle keys are idempotent", async () => {
  const provider = new MemoryLifecycleEmailProvider();
  const envelope: EmailProviderEnvelope = {
    to: "safe-test@example.invalid",
    subject: "Test",
    html: "<p>Test</p>",
    text: "Test",
    idempotencyKey: "test:memory:00000001",
  };
  const first = await provider.send(envelope);
  const second = await provider.send(envelope);
  assert.deepEqual(first, second);
  assert.equal(provider.messages().length, 1);
  const welcomeKey = welcomeEmailIdempotencyKey("user-1", 2);
  const reminderKey = programmeReminderIdempotencyKey("enrollment-1", 3);
  const campaignKey = campaignRecipientIdempotencyKey("campaign-1", "user-1");
  assert.match(welcomeKey, /^lifecycle:welcome:v2:[a-f0-9]{64}$/);
  assert.match(reminderKey, /^lifecycle:programme-reminder:v3:[a-f0-9]{64}$/);
  assert.match(campaignKey, /^campaign:campaign-1:recipient:[a-f0-9]{64}$/);
  assert.doesNotMatch(`${welcomeKey} ${reminderKey} ${campaignKey}`, /user-1|enrollment-1/);
  assert.equal(authEmailIdempotencyKey("user-1", "https://b4gamble.com/verify?t=secret", secret), authEmailIdempotencyKey("user-1", "https://b4gamble.com/verify?t=secret", secret));
  assert.notEqual(authEmailIdempotencyKey("user-1", "https://b4gamble.com/verify?t=one", secret), authEmailIdempotencyKey("user-1", "https://b4gamble.com/verify?t=two", secret));
});

test("webhook normalization is closed and unsubscribe tokens are opaque", () => {
  const event = normalizeResendWebhook("evt_123", {
    type: "email.delivered",
    created_at: "2026-09-11T10:00:00.000Z",
    data: { email_id: "provider-123", to: ["ignored@example.com"] },
  });
  assert.deepEqual(event, {
    providerEventId: "evt_123",
    providerMessageId: "provider-123",
    type: "DELIVERED",
    occurredAt: new Date("2026-09-11T10:00:00.000Z"),
  });
  assert.equal(normalizeResendWebhook("evt_suppressed", {
    type: "email.suppressed",
    created_at: "2026-09-11T10:01:00.000Z",
    data: { email_id: "provider-124", suppressed: { type: "OnAccountSuppressionList" } },
  }).type, "SUPPRESSED");
  assert.throws(() => normalizeResendWebhook("bad event", { type: "email.opened", data: { email_id: "id" } }), /Invalid|Unsupported/);
  assert.throws(() => normalizeResendWebhook("evt_124", { type: "email.delivered", created_at: "2026-09-11T10:00:00.000Z", data: { email_id: "" } }), /Unsupported/);
  assert.throws(() => normalizeResendWebhook("evt_125", { type: "email.delivered", created_at: "2026-09-11T10:00:00.000Z", data: { email_id: "bad id" } }), /Unsupported/);
  const token = "A".repeat(43);
  assert.equal(isValidUnsubscribeToken(token), true);
  assert.equal(isValidUnsubscribeToken(`${token}x`), false);
  assert.match(hashUnsubscribeToken(token), /^[a-f0-9]{64}$/);
  assert.doesNotMatch(hashUnsubscribeToken(token), /A{4}/);
  const generated = unsubscribeTokenForMessage("message-1", secret);
  assert.equal(isValidUnsubscribeToken(generated), true);
  assert.notEqual(generated, unsubscribeTokenForMessage("message-2", secret));
});

test("customer, campaign, and outbound helpers compose only fixed safe filters", () => {
  assert.equal(normalizeCustomerEmail("  Person@Example.COM "), "person@example.com");
  const customer = customerWhere({ query: "person@example.com", marketing: "allowed", programme: "completed" });
  assert.ok(Array.isArray(customer.AND));
  assert.equal(customer.AND?.length, 3);

  const now = new Date("2026-09-11T00:00:00.000Z");
  const campaign = campaignAudienceWhere({
    locale: "en",
    countryCode: "GB",
    programmeSegment: "NOT_COMPLETED",
    inactiveDays: 30,
    newUsersOnly: false,
  }, now);
  assert.equal(campaign.accountState, "ACTIVE");
  assert.equal(campaign.emailVerified, true);
  assert.equal(campaign.preferredLocale, "en");
  assert.equal(campaign.signupCountryCode, "GB");
  assert.ok(campaign.emailPreference);
  assert.ok(campaign.programEnrollments);
  assert.ok(Array.isArray(campaign.AND));

  assert.equal(safeOutboundSlug(" ../CaSiNo?token=secret "), "casinotokensecret");
  assert.equal(safeOutboundPlacement("casino_detail_hero"), "CASINO_DETAIL_HERO");
  assert.equal(safeOutboundPlacement("bad placement!"), null);
});

test("retention configuration stays bounded and deterministic", () => {
  assert.deepEqual(customerDataRetentionConfig({}), {
    analyticsDays: DEFAULT_ANALYTICS_RETENTION_DAYS,
    emailHistoryDays: DEFAULT_EMAIL_HISTORY_RETENTION_DAYS,
  });
  assert.deepEqual(customerDataRetentionConfig({ ANALYTICS_RETENTION_DAYS: "90", EMAIL_HISTORY_RETENTION_DAYS: "2555" }), {
    analyticsDays: 90,
    emailHistoryDays: 2555,
  });
  assert.deepEqual(customerDataRetentionConfig({ ANALYTICS_RETENTION_DAYS: "89", EMAIL_HISTORY_RETENTION_DAYS: "99999" }), {
    analyticsDays: DEFAULT_ANALYTICS_RETENTION_DAYS,
    emailHistoryDays: DEFAULT_EMAIL_HISTORY_RETENTION_DAYS,
  });
  assert.equal(customerDataRetentionConfig({ ANALYTICS_RETENTION_DAYS: "90days" }).analyticsDays, DEFAULT_ANALYTICS_RETENTION_DAYS);
});

test("lifecycle cron is fail-closed, exact-Bearer protected, and processes the bounded delivery queue", async () => {
  let queueCalls = 0;
  let processCalls = 0;
  let refreshCalls = 0;
  let retentionCalls = 0;
  const handler = createLifecycleQueueCronHandler({
    environment: { CRON_SECRET: "cron-unit-secret" },
    queueReminders: async () => { queueCalls += 1; return { eligible: 2, queued: 1 }; },
    processMessages: async (limit) => {
      processCalls += 1;
      assert.equal(limit, 50);
      return { selected: 3, sent: 2, suppressed: 1, failed: 0 };
    },
    refreshCampaigns: async () => { refreshCalls += 1; return 1; },
    purgeRetention: async () => {
      retentionCalls += 1;
      return {
        analyticsEvents: 1,
        outboundClicks: 2,
        analyticsSessions: 3,
        anonymousConsentEvents: 4,
        emailMessages: 5,
        expiredRateLimitBuckets: 6,
        analyticsCutoff: new Date("2025-01-01T00:00:00.000Z"),
        emailCutoff: new Date("2024-01-01T00:00:00.000Z"),
        limited: false,
      };
    },
  });
  assert.equal((await handler(new Request("https://b4gamble.com/api/internal/cron/customer-lifecycle"))).status, 401);
  assert.equal((await handler(new Request("https://b4gamble.com/api/internal/cron/customer-lifecycle", { headers: { authorization: "bearer cron-unit-secret" } }))).status, 401);
  const response = await handler(new Request("https://b4gamble.com/api/internal/cron/customer-lifecycle", { headers: { authorization: "Bearer cron-unit-secret" } }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json() as Record<string, unknown>;
  assert.equal(typeof body.durationMs, "number");
  assert.deepEqual({ ...body, durationMs: 0 }, {
    ok: true,
    reminderEligible: 2,
    reminderQueued: 1,
    delivery: { selected: 3, sent: 2, suppressed: 1, failed: 0 },
    campaignsRefreshed: 1,
    retention: {
      analyticsEvents: 1,
      outboundClicks: 2,
      analyticsSessions: 3,
      anonymousConsentEvents: 4,
      emailMessages: 5,
      expiredRateLimitBuckets: 6,
      limited: false,
    },
    durationMs: 0,
  });
  assert.deepEqual(
    { queueCalls, processCalls, refreshCalls, retentionCalls },
    { queueCalls: 1, processCalls: 1, refreshCalls: 1, retentionCalls: 1 },
  );
  const unavailable = createLifecycleQueueCronHandler({ environment: {} });
  assert.equal((await unavailable(new Request("https://b4gamble.com/api/internal/cron/customer-lifecycle"))).status, 503);
});

// Click writes under concurrency (Package B, 27 Sep 2026): one non-interactive
// batch, retried once on a connection/pool failure, never double-counted.

type BatchStep = { op: string; args: Record<string, unknown> };

function prismaFailure(code: string) {
  return Object.assign(new Error(`simulated ${code}`), { name: "PrismaClientKnownRequestError", code });
}

function fakeAttributionDatabase(failures: Array<Error | null> = [], options: { clickAlreadyStored?: boolean } = {}) {
  const calls = { batches: [] as BatchStep[][], networkReads: 0, clickLookups: 0, sleeps: [] as number[] };
  let attempt = 0;
  const step = (op: string) => (args: Record<string, unknown>) => ({ op, args });
  const database = {
    outboundClick: {
      create: step("outboundClick.create"),
      findUnique: async () => {
        calls.clickLookups += 1;
        return options.clickAlreadyStored ? { id: "stored" } : null;
      },
    },
    analyticsEvent: { createMany: step("analyticsEvent.createMany") },
    affiliateOutboundClickDaily: { upsert: step("affiliateOutboundClickDaily.upsert") },
    affiliateOffer: {
      findUnique: async () => {
        calls.networkReads += 1;
        return { program: { networkId: "66666666-6666-4666-8666-666666666666" } };
      },
    },
    analyticsSession: { findUnique: async () => null },
    $transaction: async (batch: unknown) => {
      assert.ok(Array.isArray(batch), "the click write is a non-interactive batch, never a callback");
      calls.batches.push(batch as BatchStep[]);
      const failure = failures[attempt];
      attempt += 1;
      if (failure) throw failure;
      return (batch as BatchStep[]).map(() => ({}));
    },
  };
  const dependencies: OutboundAttributionDependencies = {
    database: database as unknown as OutboundAttributionDependencies["database"],
    sleep: async (milliseconds) => { calls.sleeps.push(milliseconds); },
  };
  return { calls, dependencies };
}

function successfulClick(overrides: Partial<OutboundAttributionInput> = {}): OutboundAttributionInput {
  return {
    clickId: "11111111-1111-4111-8111-111111111111",
    request: new Request("https://b4gamble.com/r/verified-casino?placement=review_hero", {
      headers: { referer: "https://b4gamble.com/en/casino/verified?utm_source=x", "user-agent": "Mozilla/5.0 (iPhone)" },
    }),
    requestedSlug: "verified-casino",
    attemptedAt: new Date("2026-09-28T12:00:00.000Z"),
    resolvedAt: new Date("2026-09-28T12:00:00.050Z"),
    state: "SUCCEEDED",
    countryCode: "GB",
    locale: "en-GB",
    casinoId: "22222222-2222-4222-8222-222222222222",
    affiliateOfferId: "33333333-3333-4333-8333-333333333333",
    affiliateNetworkId: "77777777-7777-4777-8777-777777777777",
    redirectSlugId: "44444444-4444-4444-8444-444444444444",
    trackingLinkId: "55555555-5555-4555-8555-555555555555",
    ...overrides,
  };
}

async function asProductionRuntime<T>(run: () => Promise<T>) {
  const previous = { NODE_ENV: process.env.NODE_ENV, VERCEL_ENV: process.env.VERCEL_ENV };
  Object.assign(process.env, { NODE_ENV: "production", VERCEL_ENV: "production" });
  try {
    return await run();
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) Reflect.deleteProperty(process.env, name);
      else Object.assign(process.env, { [name]: value });
    }
  }
}

test("a Production human click writes detail, events and the daily count in one batch, without reads", async () => {
  const { calls, dependencies } = fakeAttributionDatabase();
  await asProductionRuntime(() => recordOutboundAttribution(successfulClick(), dependencies));
  assert.equal(calls.batches.length, 1);
  const [batch] = calls.batches;
  assert.deepEqual(batch.map(({ op }) => op), ["outboundClick.create", "analyticsEvent.createMany", "affiliateOutboundClickDaily.upsert"]);
  assert.equal(calls.networkReads, 0, "the network id carried from the route lookup needs no read");
  const click = batch[0].args.data as Record<string, unknown>;
  assert.equal(click.affiliateNetworkId, "77777777-7777-4777-8777-777777777777");
  // Where the click came from is always kept; who clicked stays behind consent.
  assert.equal(click.sourcePage, "/en/casino/verified");
  assert.equal(click.placement, "REVIEW_HERO");
  assert.equal(click.anonymousId, null);
  assert.equal(click.userId, null);
  assert.equal(click.locale, null);
  const events = (batch[1].args.data as Array<Record<string, unknown>>);
  assert.deepEqual(events.map((event) => event.type), ["OUTBOUND_REDIRECT_ATTEMPTED", "OUTBOUND_REDIRECT_SUCCEEDED"]);
  assert.deepEqual(events.map((event) => event.deviceCategory), ["UNKNOWN", "UNKNOWN"]);
  assert.equal(batch[1].args.skipDuplicates, true);
  const daily = batch[2].args as { update: Record<string, unknown> };
  assert.deepEqual(daily.update.clickCount, { increment: 1 });
});

test("without a carried network id the recorder still reads it, and a blocked click adds no daily count", async () => {
  const { calls, dependencies } = fakeAttributionDatabase();
  await asProductionRuntime(() => recordOutboundAttribution(successfulClick({
    state: "BLOCKED",
    blockedReason: "UNSAFE_REDIRECT_RESPONSE",
    affiliateNetworkId: undefined,
  }), dependencies));
  assert.equal(calls.networkReads, 1);
  assert.deepEqual(calls.batches[0].map(({ op }) => op), ["outboundClick.create", "analyticsEvent.createMany"]);
  assert.equal((calls.batches[0][0].args.data as Record<string, unknown>).affiliateNetworkId, "66666666-6666-4666-8666-666666666666");
});

test("a transient connection or pool failure is retried once with a fresh batch", async () => {
  for (const code of ["P2028", "P1017", "P2024", "P1001", "P1008", "P2034"]) {
    assert.equal(isRetryableOutboundWriteError(prismaFailure(code)), true, code);
    const { calls, dependencies } = fakeAttributionDatabase([prismaFailure(code)]);
    assert.equal(await recordOutboundAttribution(successfulClick(), dependencies), "11111111-1111-4111-8111-111111111111");
    assert.equal(calls.batches.length, 2, code);
    assert.notEqual(calls.batches[0], calls.batches[1], "each attempt builds its own batch");
    assert.equal(calls.sleeps.length, 1);
    assert.ok(calls.sleeps[0] >= 150 && calls.sleeps[0] < 300);
  }
});

test("data errors are not retried, and a second transient failure gives up", async () => {
  for (const error of [prismaFailure("P2002"), prismaFailure("P2003"), new Error("check constraint")]) {
    assert.equal(isRetryableOutboundWriteError(error), false);
    const { calls, dependencies } = fakeAttributionDatabase([error]);
    await assert.rejects(recordOutboundAttribution(successfulClick(), dependencies));
    assert.equal(calls.batches.length, 1);
  }
  const { calls, dependencies } = fakeAttributionDatabase([prismaFailure("P1017"), prismaFailure("P1017")]);
  await assert.rejects(recordOutboundAttribution(successfulClick(), dependencies), /P1017/);
  assert.equal(calls.batches.length, 2);
});

test("a retry that meets the click already committed counts it once and succeeds", async () => {
  const committed = fakeAttributionDatabase([prismaFailure("P1017"), prismaFailure("P2002")], { clickAlreadyStored: true });
  assert.equal(await recordOutboundAttribution(successfulClick(), committed.dependencies), "11111111-1111-4111-8111-111111111111");
  assert.equal(committed.calls.batches.length, 2);
  assert.equal(committed.calls.clickLookups, 1);

  // A duplicate that is not this click (the row is absent) is still an error.
  const foreign = fakeAttributionDatabase([prismaFailure("P1017"), prismaFailure("P2002")]);
  await assert.rejects(recordOutboundAttribution(successfulClick(), foreign.dependencies), /P2002/);
});

