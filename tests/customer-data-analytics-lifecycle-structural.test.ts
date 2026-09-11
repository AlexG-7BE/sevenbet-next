import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { canAccessAdminArea } from "../lib/auth/admin-page-policy";
import { permissionsForRole } from "../lib/cms/permissions";

function source(path: string) {
  return readFileSync(path, "utf8");
}

function filesUnder(path: string): string[] {
  return readdirSync(path).flatMap((entry) => {
    const candidate = join(path, entry);
    return statSync(candidate).isDirectory() ? filesUnder(candidate) : [candidate];
  });
}

test("0037 is additive, constrained, indexed, preflighted, and seeds no customer identities", () => {
  const migration = source("prisma/migrations/0037_customer_data_analytics_lifecycle_core/migration.sql");
  for (const table of [
    "AnalyticsSession", "AnalyticsEvent", "OutboundClick", "CustomerEmailPreference", "ConsentEvent",
    "EmailTemplate", "EmailCampaign", "EmailMessage", "EmailProviderEvent", "EmailUnsubscribeToken",
    "AnalyticsRateLimitBucket",
  ]) {
    assert.match(migration, new RegExp(`CREATE TABLE "${table}"`), table);
  }
  assert.match(migration, /CREATE UNIQUE INDEX "User_email_normalized_key" ON "User" \(lower\(btrim\("email"\)\)\)/);
  assert.match(migration, /CREATE UNIQUE INDEX "AnalyticsEvent_dedupeKey_key"/);
  assert.equal(migration.match(/CREATE UNIQUE INDEX "AnalyticsEvent_dedupeKey_key"/g)?.length, 1);
  assert.match(migration, /CREATE UNIQUE INDEX "EmailMessage_environment_idempotencyKey_key"/);
  assert.match(migration, /CREATE UNIQUE INDEX "EmailCampaign_environment_idempotencyKey_key"/);
  assert.match(migration, /CREATE UNIQUE INDEX "EmailProviderEvent_providerEventId_key"/);
  assert.match(migration, /CREATE UNIQUE INDEX "EmailTemplate_active_key_locale_key"[\s\S]*WHERE "active" = true/);
  assert.match(migration, /OutboundClick_state_check/);
  assert.match(migration, /ConsentEvent_subject_check/);
  assert.match(migration, /CustomerEmailPreference_state_check/);
  assert.match(migration, /EmailTemplate_key_type_check/);
  assert.match(migration, /EmailMessage_provider_pair_check/);
  assert.match(migration, /EmailMessage_test_purpose_check/);
  assert.match(migration, /EmailMessage_provider_state_check/);
  assert.doesNotMatch(migration, /\b(?:DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM|prisma migrate reset)\b/i);
  assert.doesNotMatch(migration, /INSERT INTO "User"|INSERT INTO "AnalyticsEvent"|INSERT INTO "EmailMessage"/);

  const preflight = source("prisma/preflight/0037_customer_data_analytics_lifecycle_core.sql");
  assert.match(preflight, /duplicateNormalizedEmailGroups/);
  assert.match(preflight, /emailsRequiringNormalization/);
  const releaseGuard = source("scripts/vercel-build-preflight.ts");
  assert.match(releaseGuard, /0037_customer_data_analytics_lifecycle_core/);
  assert.match(releaseGuard, /assertCustomerDataAnalyticsLifecycleInvariants/);
  assert.match(releaseGuard, /duplicate_normalized_emails/);
  assert.match(releaseGuard, /EmailTemplate_key_type_check/);
  assert.match(releaseGuard, /EmailMessage_provider_pair_check/);
  assert.match(releaseGuard, /provider_event_message_id_mismatches/);
  assert.match(releaseGuard, /analytics_session_environment_mismatches/);
});

test("analytics has one closed relational dictionary with no arbitrary JSON or PII fields", () => {
  const schema = source("prisma/schema.prisma");
  const model = schema.slice(schema.indexOf("model AnalyticsEvent"), schema.indexOf("model OutboundClick"));
  assert.match(model, /schemaVersion\s+Int/);
  assert.match(model, /dedupeKey\s+String\s+@unique/);
  assert.doesNotMatch(model, /\bJson\b/);
  assert.doesNotMatch(model, /^\s+(?:email|password|token|ipAddress|userAgent|freeText|transcript)\s/m);
  const dictionary = source("lib/analytics/product-analytics-events.ts");
  assert.equal((dictionary.match(/^\s+"[a-z_]+",?$/gm) ?? []).filter((line) => !line.includes("programme_start_clicked")).length >= 19, true);
  assert.match(dictionary, /\.strict\(\)/);
  assert.match(dictionary, /query-free site path/);
  assert.doesNotMatch(dictionary, /email:\s*z\.|password:\s*z\.|token:\s*z\./);
});

test("new route and React boundaries never import Prisma directly", () => {
  const roots = [
    "app/api/admin/email", "app/api/analytics", "app/api/consent", "app/api/customer", "app/api/email",
    "app/api/internal/cron/customer-lifecycle", "app/admin/(protected)/analytics", "app/admin/(protected)/customers",
    "app/admin/(protected)/email", "app/admin/(protected)/templates", "components/admin/email", "components/analytics",
  ];
  for (const file of roots.flatMap(filesUnder).filter((path) => /\.(?:ts|tsx)$/.test(path))) {
    const text = source(file);
    assert.doesNotMatch(text, /@\/lib\/db\/prisma|from ["']@prisma\/client["']/, file);
  }
});

test("all Customer Core admin pages and actions are protected server-side", () => {
  const pages = [
    ["app/admin/(protected)/customers/page.tsx", "customers"],
    ["app/admin/(protected)/customers/[customerId]/page.tsx", "customers"],
    ["app/admin/(protected)/analytics/page.tsx", "analytics"],
    ["app/admin/(protected)/email/page.tsx", "email"],
    ["app/admin/(protected)/templates/page.tsx", "templates"],
  ] as const;
  for (const [path, area] of pages) {
    assert.match(source(path), new RegExp(`getAdminPageAccess\\(await headers\\(\\), "${area}"\\)`), path);
  }
  const actionRoutes = [
    ["app/api/admin/email/campaigns/route.ts", "email\\.manage"],
    ["app/api/admin/email/campaigns/[campaignId]/action/route.ts", "email\\.manage"],
    ["app/api/admin/email/templates/route.ts", "template\\.manage"],
    ["app/api/admin/email/templates/[templateId]/action/route.ts", "template\\.manage"],
  ] as const;
  for (const [path, permission] of actionRoutes) {
    const text = source(path);
    assert.match(text, new RegExp(`requireAdminPermission\\(request, "${permission}"\\)`), path);
    assert.match(text, /assertSameOriginMutation\(request\)/, path);
    assert.match(text, /readBoundedJson\(request,/i, path);
  }
});

test("roles expose only the intended Customer Core areas", () => {
  const user = (role: Parameters<typeof permissionsForRole>[0]) => ({ role, permissions: permissionsForRole(role) });
  assert.equal(canAccessAdminArea(user("SUPPORT"), "customers"), true);
  assert.equal(canAccessAdminArea(user("SUPPORT"), "analytics"), false);
  assert.equal(canAccessAdminArea(user("SUPPORT"), "email"), false);
  assert.equal(canAccessAdminArea(user("ANALYST"), "analytics"), true);
  assert.equal(canAccessAdminArea(user("ANALYST"), "customers"), false);
  assert.equal(canAccessAdminArea(user("ADMIN"), "email"), true);
  assert.equal(canAccessAdminArea(user("ADMIN"), "templates"), true);
  assert.equal(canAccessAdminArea(null, "customers"), false);
});

test("consent, ingestion, unsubscribe, webhook, and cron public mutations fail closed", () => {
  const analyticsRuntime = source("lib/analytics/product-analytics.ts");
  assert.match(analyticsRuntime, /process\.env\.NEXT_PUBLIC_ANALYTICS_ENABLED/);
  assert.doesNotMatch(analyticsRuntime, /= process\.env[,)\n]/);

  const analytics = source("app/api/analytics/events/route.ts");
  assert.match(analytics, /MAX_ANALYTICS_BODY_BYTES = 32 \* 1024/);
  assert.match(analytics, /MAX_EVENTS_PER_REQUEST = 20/);
  assert.match(analytics, /isSameOriginMutation\(request\)/);
  assert.match(analytics, /consumeAnalyticsRateLimit/);
  assert.match(analytics, /AnalyticsConsentRequiredError/);
  assert.match(analytics, /isProductAnalyticsEnabled/);
  assert.match(analytics, /ANALYTICS_DISABLED/);
  assert.match(analytics, /outcomes\.some[\s\S]*207/);

  const layout = source("app/layout.tsx");
  assert.match(layout, /isProductAnalyticsEnabled/);
  assert.match(layout, /analyticsEnabled \? <AnalyticsPageView \/> : null/);
  assert.match(layout, /analyticsEnabled \? <AnalyticsConsentBanner \/> : null/);

  const consent = source("app/api/consent/analytics/route.ts");
  assert.match(consent, /isSameOriginMutation\(request\)/);
  assert.match(consent, /recordAnalyticsConsentPreference/);
  assert.match(consent, /clearAnalyticsIdentityCookies/);
  const preference = source("app/api/customer/email-preference/route.ts");
  assert.match(preference, /requireCurrentUser\(request\.headers\)/);
  assert.match(preference, /isSameOriginMutation\(request\)/);
  const unsubscribe = source("app/api/email/unsubscribe/route.ts");
  assert.match(unsubscribe, /isSameOriginMutation\(request\)/);
  assert.doesNotMatch(unsubscribe, /searchParams\.get\(["'](?:email|userId)["']\)/);

  const webhook = source("app/api/email/webhooks/resend/route.ts");
  assert.match(webhook, /process\.env\.VERCEL_ENV !== "production"/);
  assert.match(webhook, /validatedResendWebhookSecret/);
  assert.match(webhook, /new Webhook\(secret\)\.verify\(rawBody/);
  assert.match(webhook, /svix-id/);
  assert.match(webhook, /svix-timestamp/);
  assert.match(webhook, /svix-signature/);
  assert.doesNotMatch(webhook.slice(0, webhook.indexOf(".verify(rawBody")), /JSON\.parse\(rawBody\)/);
  const cron = source("lib/email/lifecycle-queue-cron.server.ts");
  assert.match(cron, /timingSafeEqual/);
  assert.doesNotMatch(cron, /processQueuedEmail|ResendLifecycleEmailProvider|\.send\(/);
});

test("email delivery remains provider-abstracted, idempotent, and uninvoked by live routes", () => {
  const provider = source("lib/email/provider.server.ts");
  assert.match(provider, /interface LifecycleEmailProvider/);
  assert.match(provider, /Idempotency-Key/);
  assert.match(provider, /AbortSignal\.timeout/);
  const service = source("lib/email/service.server.ts");
  assert.match(service, /currentEligibility\(message\.userId, message\.purpose\)/);
  assert.match(service, /MAX_EMAIL_ATTEMPTS = 5/);
  assert.match(service, /providerIdempotencyHorizon/);
  assert.match(service, /purpose: \{ in: \["WELCOME", "PROGRAMME_REMINDER", "MARKETING_BROADCAST", "TEST"\] \}/);
  assert.match(service, /ensureCurrentUnsubscribeToken/);
  assert.match(service, /UNSUBSCRIBE_TOKEN_MISMATCH/);
  assert.doesNotMatch(service, /emailUnsubscribeToken\.upsert[\s\S]*update:\s*\{\s*tokenHash/);
  assert.doesNotMatch(service, /console\.(?:info|warn|error)\([^\n]*(?:recipientEmail|user\.email|apiKey|token)/);

  const runtimeFiles = ["app", "components", "lib/customers", "lib/auth"]
    .flatMap(filesUnder)
    .filter((path) => /\.(?:ts|tsx)$/.test(path) && path !== "lib/email/service.server.ts");
  for (const file of runtimeFiles) {
    const text = source(file);
    assert.doesNotMatch(text, /\b(?:processQueuedEmailMessage|processQueuedEmailBatch|sendAuthEmail|queueAndProcessWelcomeEmail)\b/, file);
  }
  assert.match(source("lib/customers/auth-observer.server.ts"), /queueWelcomeEmail\(user\.id\)/);
  const authConfig = source("lib/auth/config.ts");
  assert.match(authConfig, /customerAuthDatabaseHooks/);
  assert.match(source("lib/customers/auth-hooks.server.ts"), /normalizeCustomerEmail/);
});

test("email template and campaign administration writes relational audit records", () => {
  const templates = source("lib/email/template-admin.server.ts");
  for (const action of ["email-template-version-created", "email-template-activated", "email-template-deactivated", "email-template-test-queued"]) {
    assert.match(templates, new RegExp(action));
  }
  const campaigns = source("lib/email/campaigns.server.ts");
  for (const action of ["email-campaign-created", "email-campaign-reviewed", "email-campaign-queued"]) {
    assert.match(campaigns, new RegExp(action));
  }
  assert.match(campaigns, /where: \{ id: campaignId, status: "DRAFT" \}/);
  assert.match(campaigns, /where: \{ id: campaign\.id, status: "REVIEWED" \}/);
});

test("commercial attribution observes governed outcomes and never stores partner destinations", () => {
  const route = source("app/r/[slug]/route.ts");
  const resolve = route.indexOf("affiliateRedirectService.resolve");
  const safeResponse = route.indexOf("safeAffiliateRedirectResponse", resolve);
  const successObservation = route.indexOf('state: "SUCCEEDED"', safeResponse);
  assert.ok(resolve >= 0 && safeResponse > resolve && successObservation > safeResponse);
  assert.match(route, /state: "BLOCKED"/);
  assert.match(route, /after\(work\)/);
  const model = source("prisma/schema.prisma").split("model OutboundClick")[1]?.split("model CustomerEmailPreference")[0] ?? "";
  assert.doesNotMatch(model, /destination|trackingUrl|affiliateUrl|token/i);
  const attribution = source("lib/analytics/outbound-attribution.server.ts");
  assert.doesNotMatch(attribution, /result\.destination|trackingUrl|affiliateUrl/);
  const outboundAction = source("components/casino-profile/CasinoOutboundAction.tsx");
  assert.match(outboundAction, /\?placement=\$\{context\.source\}_\$\{context\.placement\}/);
  assert.match(outboundAction, /\^\\\/r\\\//);

  const surfaceObserver = source("components/analytics/CommercialSurfaceView.tsx");
  assert.match(surfaceObserver, /IntersectionObserver/);
  assert.match(surfaceObserver, /browserAnalyticsConsentState\(\) !== "granted"/);
  assert.match(surfaceObserver, /productAnalyticsClient\.offerViewed/);
  for (const file of [
    "components/best-offers/BestOffersExperience.tsx",
    "components/bonus-directory/BonusDirectory.tsx",
    "components/bonus-directory/CuratedBonusShortlist.tsx",
    "components/casino-profile/CasinoProfile.tsx",
  ]) {
    assert.match(source(file), /data-analytics-offer-key/, file);
    assert.match(source(file), /data-analytics-casino-id/, file);
  }
});

test("Programme state remains canonical and is not used for commercial targeting", () => {
  const observer = source("lib/analytics/programme-observer.server.ts");
  assert.match(observer, /programEnrollment/);
  assert.match(observer, /programme_step_completed/);
  assert.match(observer, /programme_completed/);
  assert.doesNotMatch(observer, /affiliate|casino|offer|tracking/i);
  const commercialFiles = ["lib/analytics/outbound-attribution.server.ts", "app/r/[slug]/route.ts"];
  for (const file of commercialFiles) assert.doesNotMatch(source(file), /ProgramEnrollment|MissionProgress|Help|vulnerab/i, file);
});

test("privacy export/deletion and retention include every new customer-linked store", () => {
  const privacy = source("lib/privacy/data-subject.ts");
  for (const model of [
    "analyticsSession", "analyticsEvent", "outboundClick", "consentEvent", "customerEmailPreference",
    "emailMessage", "emailProviderEvent", "emailUnsubscribeToken",
  ]) assert.match(privacy, new RegExp(model), model);
  const retention = source("lib/privacy/customer-data-retention.server.ts");
  assert.match(retention, /CUSTOMER_DATA_RETENTION_BATCH_SIZE = 5_000/);
  assert.match(retention, /anonymousConsentEvents/);
  assert.match(retention, /status: \{ in: terminalEmailStates \}/);
});

test("configuration and schedules are explicit and environment-isolated", () => {
  const example = source(".env.example");
  for (const name of [
    "NEXT_PUBLIC_ANALYTICS_ENABLED", "ANALYTICS_SIGNING_SECRET", "ANALYTICS_INTERNAL_TRAFFIC_TOKEN",
    "ANALYTICS_RETENTION_DAYS", "EMAIL_HISTORY_RETENTION_DAYS", "LIFECYCLE_EMAIL_DELIVERY_ENABLED",
    "LIFECYCLE_EMAIL_FROM", "LIFECYCLE_EMAIL_REPLY_TO", "RESEND_WEBHOOK_SECRET",
    "PROGRAMME_REMINDER_INACTIVITY_DAYS", "CRON_SECRET",
  ]) assert.match(example, new RegExp(`^${name}=`, "m"), name);
  const runtime = source("lib/email/runtime-config.server.ts");
  assert.match(runtime, /VERCEL_ENV !== "production"/);
  assert.match(runtime, /LIFECYCLE_EMAIL_DELIVERY_ENABLED !== "true"/);
  assert.match(source("lib/email/service.server.ts"), /environment,\s*status: "SENDING"/);
  assert.match(source("lib/email/service.server.ts"), /environment,\s*purpose: \{ in:/);
  assert.match(source("lib/analytics/product-analytics.ts"), /NEXT_PUBLIC_ANALYTICS_ENABLED === "true"/);
  const schedules = JSON.parse(source("vercel.json")) as { crons?: Array<{ path: string; schedule: string }> };
  assert.equal(schedules.crons?.some((cron) => cron.path === "/api/internal/cron/customer-lifecycle" && Boolean(cron.schedule)), true);
});
