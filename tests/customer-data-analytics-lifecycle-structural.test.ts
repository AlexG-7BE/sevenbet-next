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

test("0038 extends the closed Core dictionary additively and is DB-first guarded", () => {
  const migration = source("prisma/migrations/0038_commercial_ux_analytics_events/migration.sql");
  assert.equal((migration.match(/ALTER TYPE "AnalyticsEventType" ADD VALUE IF NOT EXISTS/g) ?? []).length, 3);
  for (const event of ["COMMERCIAL_VIEW_SELECTED", "COMMERCIAL_CARD_VIEWED", "CASINO_REVIEW_CLICKED"]) {
    assert.match(migration, new RegExp(`'${event}'`));
  }
  assert.match(migration, /ALTER TABLE "AnalyticsEvent" ADD COLUMN "position" INTEGER/);
  assert.match(migration, /AnalyticsEvent_position_check/);
  assert.match(migration, /"position" >= 1 AND "position" <= 1000/);
  assert.doesNotMatch(migration, /\b(?:DROP|TRUNCATE|DELETE|INSERT|UPDATE)\b/i);

  const releaseGuard = source("scripts/vercel-build-preflight.ts");
  assert.match(releaseGuard, /COMMERCIAL_UX_ANALYTICS_MIGRATION = "0038_commercial_ux_analytics_events"/);
  assert.match(releaseGuard, /assertCommercialUxAnalyticsInvariants/);
  assert.match(releaseGuard, /Production DB-first release requires completed.*COMMERCIAL_UX_ANALYTICS_MIGRATION/s);
});

test("analytics has one closed relational dictionary with no arbitrary JSON or PII fields", () => {
  const schema = source("prisma/schema.prisma");
  const model = schema.slice(schema.indexOf("model AnalyticsEvent"), schema.indexOf("model OutboundClick"));
  assert.match(model, /schemaVersion\s+Int/);
  assert.match(model, /dedupeKey\s+String\s+@unique/);
  assert.doesNotMatch(model, /\bJson\b/);
  assert.doesNotMatch(model, /^\s+(?:email|password|token|ipAddress|userAgent|freeText|transcript)\s/m);
  const dictionary = source("lib/analytics/product-analytics-events.ts");
  const eventNames = dictionary.slice(
    dictionary.indexOf("export const productAnalyticsEventNames"),
    dictionary.indexOf("] as const;"),
  );
  assert.equal((eventNames.match(/^\s+"[a-z_]+",?$/gm) ?? []).length, 22);
  assert.doesNotMatch(dictionary, /programme_start_clicked|programme_home_viewed/);
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

test("the fixed Commercial dashboard renders every active bounded funnel metric", () => {
  const page = source("app/admin/(protected)/analytics/page.tsx");
  for (const metric of ["casinoViews", "offerViews", "cardViews", "viewSelections", "reviewClicks", "ctaClicks", "outboundSuccesses", "ctr"]) {
    assert.match(page, new RegExp(`data\\.${metric}\\b`), metric);
  }
  assert.match(page, /Detailed runtime attribution/);
  assert.match(page, /success-only daily aggregate/);
  assert.match(page, /must not be added/);
});

test("current analytics documentation records the applied 22-event and persisted-state baseline", () => {
  const productRunbook = source("docs/06_Operations/Product-Analytics.md");
  assert.match(productRunbook, /closed 22-event dictionary/);
  assert.match(productRunbook, /Migrations 0037 and 0038 are already applied/);
  assert.match(productRunbook, /fixed dashboard use canonical persisted Programme state/);
  assert.match(productRunbook, /never add detailed and aggregate\s+totals/);
  assert.doesNotMatch(productRunbook, /NOT YET VERIFIED|extension candidate/i);

  const lifecycleRunbook = source("docs/06_Operations/Customer-Data-Analytics-Lifecycle-Core.md");
  assert.match(lifecycleRunbook, /Applied Commercial UX analytics extension/);
  assert.match(lifecycleRunbook, /Do not re-run, repair or roll back 0038/);

  const baseline = source("docs/05_Engineering/Technical_Baseline/README.md");
  assert.match(baseline, /109 Prisma models/);
  assert.match(baseline, /41 ordered Prisma migration directories/);
  assert.match(source("docs/CURRENT_STATE.md"), /6\/6 PASS/);

  const externalServices = source("docs/05_Engineering/Technical_Baseline/04_External_Services.md");
  assert.match(externalServices, /active under bounded Production controls/);
  assert.match(externalServices, /all six controlled acceptance cases are verified/);
  assert.doesNotMatch(externalServices, /Production delivery disabled/);

  const assumptions = source("docs/05_Engineering/Technical_Baseline/08_Assumptions_and_Constraints.md");
  assert.match(assumptions, /one exact `MarketActivation`/);
  assert.match(assumptions, /Parent-country and active `ZZ` runtime permission fallback are absent/);
  assert.doesNotMatch(assumptions, /denying commercial\/referral capability/);
  assert.match(source("docs/05_Engineering/Technical_Baseline/07_Known_Technical_Debt.md"), /Status:\*\* HISTORICAL ONLY/);
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
  assert.match(layout, /analyticsEnabled \? <AnalyticsConsentBanner locale=\{presentation\.locale\} \/> : null/);

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
  assert.match(source("lib/email/webhook.server.ts"), /"email\.suppressed": "SUPPRESSED"/);
  assert.match(source("lib/email/webhook.server.ts"), /PROVIDER_SUPPRESSION/);
  assert.doesNotMatch(webhook.slice(0, webhook.indexOf(".verify(rawBody")), /JSON\.parse\(rawBody\)/);
  const cron = source("lib/email/lifecycle-queue-cron.server.ts");
  assert.match(cron, /timingSafeEqual/);
  assert.match(cron, /processQueuedEmailBatch/);
  assert.match(cron, /refreshCampaignStates/);
  assert.doesNotMatch(cron, /ResendLifecycleEmailProvider|\.send\(/);
});

test("email delivery remains provider-abstracted, idempotent, and invoked only by approved server authorities", () => {
  const provider = source("lib/email/provider.server.ts");
  assert.match(provider, /interface LifecycleEmailProvider/);
  assert.match(provider, /Idempotency-Key/);
  assert.match(provider, /AbortSignal\.timeout/);
  const service = source("lib/email/service.server.ts");
  assert.match(service, /currentEligibility\(message\.userId, message\.purpose\)/);
  assert.match(service, /MAX_EMAIL_ATTEMPTS = 5/);
  assert.match(service, /PROVIDER_IDEMPOTENCY_HORIZON_MS = 23 \* 60 \* 60_000/);
  assert.match(service, /WORKER_EMAIL_PURPOSES = \["WELCOME", "PROGRAMME_REMINDER", "MARKETING_BROADCAST", "TEST"\]/);
  assert.match(service, /AUTH_EMAIL_PURPOSES = \["EMAIL_VERIFICATION", "PASSWORD_RESET"\]/);
  assert.match(service, /campaignSendAuthority\(environment\)/);
  assert.match(service, /lastAttemptAt: claimStartedAt/);
  assert.match(service, /recoverStaleEmailClaims/);
  assert.match(service, /ensureCurrentUnsubscribeToken/);
  assert.match(service, /UNSUBSCRIBE_TOKEN_MISMATCH/);
  assert.match(service, /message\.isTest \? `\[TEST\]/);
  assert.match(service, /if \(!resolveLifecycleEmailRuntimeConfig\(\) && !overrides\.provider\)[\s\S]*selected: 0,[\s\S]*recovery:/);
  assert.doesNotMatch(service, /emailUnsubscribeToken\.upsert[\s\S]*update:\s*\{\s*tokenHash/);
  assert.doesNotMatch(service, /console\.(?:info|warn|error)\([^\n]*(?:recipientEmail|user\.email|apiKey|token)/);

  const runtimeFiles = ["app", "components", "lib/customers", "lib/auth"]
    .flatMap(filesUnder)
    .filter((path) => /\.(?:ts|tsx)$/.test(path)
      && path !== "lib/email/service.server.ts"
      && path !== "lib/auth/config.ts");
  for (const file of runtimeFiles) {
    const text = source(file);
    assert.doesNotMatch(text, /\b(?:processQueuedEmailMessage|processQueuedEmailBatch|sendAuthEmail|queueAndProcessWelcomeEmail)\b/, file);
  }
  assert.match(source("lib/customers/auth-observer.server.ts"), /queueWelcomeEmail\(user\.id\)/);
  assert.match(source("lib/email/lifecycle-queue-cron.server.ts"), /processQueuedEmailBatch/);
  const authConfig = source("lib/auth/config.ts");
  assert.match(authConfig, /customerAuthDatabaseHooks/);
  assert.match(authConfig, /sendResetPassword:[\s\S]*sendAuthEmail[\s\S]*templateKey: "PASSWORD_RESET"/);
  assert.match(authConfig, /sendVerificationEmail:[\s\S]*sendAuthEmail[\s\S]*templateKey: "EMAIL_VERIFICATION"/);
  assert.doesNotMatch(authConfig, /processQueuedEmailMessage|processQueuedEmailBatch|queueEmailMessage/);
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
  // Click source is kept for every click; reader identity only with consent.
  assert.match(attribution, /sourcePage: referrer\.sourcePage,/);
  assert.match(attribution, /pagePath: referrer\.sourcePage,/);
  assert.doesNotMatch(attribution, /placement: consented \?|sourcePage: consented \?|pagePath: consented \?/);
  assert.match(attribution, /if \(consented\) \{\s*anonymousId = readAnalyticsUuid/);
  assert.match(attribution, /locale: consented \? input\.locale : null/);
  assert.match(attribution, /deviceCategory: consented \? analyticsDeviceCategory/);
  const outboundAction = source("components/casino-profile/CasinoOutboundAction.tsx");
  assert.match(outboundAction, /\?placement=\$\{context\.source\}_\$\{context\.placement\}/);
  assert.match(outboundAction, /\^\\\/r\\\//);

  const surfaceObserver = source("components/analytics/CommercialSurfaceView.tsx");
  assert.match(surfaceObserver, /IntersectionObserver/);
  assert.match(surfaceObserver, /browserAnalyticsConsentState\(\) !== "granted"/);
  assert.match(surfaceObserver, /productAnalyticsClient\.offerViewed/);
  // Every offer surface a route renders. BonusDirectory and CuratedBonusShortlist
  // were imported by no route and have been deleted; /bonuses renders BonusOfferDirectory.
  for (const file of [
    "components/best-offers/BestOffersExperience.tsx",
    "components/bonus-directory/BonusOfferDirectory.tsx",
    "components/casino-profile/CasinoProfile.tsx",
  ]) {
    assert.match(source(file), /data-analytics-offer-key/, file);
    assert.match(source(file), /data-analytics-casino-id/, file);
  }
  // The observer only counts a card carrying a casino id beside its card key, so
  // the casino directory has to emit the pair or its impressions go unrecorded.
  assert.match(surfaceObserver, /\[data-analytics-card-key\]\[data-analytics-casino-id\]/);
  const casinoDirectory = source("components/casino-discovery/CasinoCollection.tsx");
  assert.match(casinoDirectory, /data-analytics-card-key=/);
  assert.match(casinoDirectory, /data-analytics-casino-id=/);
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

test("undecided visitors see the analytics choice after their first scroll or a short delay, outside focused flows and without losing focus", async () => {
  const { PRIVACY_CHOICE_AUTO_OPEN_DELAY_MS, PRIVACY_CHOICE_SCROLL_THRESHOLD_PX, shouldAutoOpenPrivacyChoice } = await import("../lib/analytics/consent-prompt");
  const base = { pathname: "/best-offers", consentState: "unknown" as const, dismissed: false, automated: false, automationOptIn: false };
  assert.equal(shouldAutoOpenPrivacyChoice(base), true);
  assert.equal(shouldAutoOpenPrivacyChoice({ ...base, consentState: "granted" }), false);
  assert.equal(shouldAutoOpenPrivacyChoice({ ...base, consentState: "denied" }), false);
  assert.equal(shouldAutoOpenPrivacyChoice({ ...base, dismissed: true }), false, "Not now holds for the tab session");
  assert.equal(shouldAutoOpenPrivacyChoice({ ...base, automated: true }), false, "automation opts in explicitly");
  assert.equal(shouldAutoOpenPrivacyChoice({ ...base, automated: true, automationOptIn: true }), true);
  for (const pathname of ["/program", "/de/program", "/program/mission", "/help", "/help/gamstop", "/es/help", "/login", "/admin/casinos", "/unsubscribe"]) {
    assert.equal(shouldAutoOpenPrivacyChoice({ ...base, pathname }), false, pathname);
  }
  for (const pathname of ["/", "/de", "/10-steps", "/casino/demo-northstar", "/learn/casino-bonuses/wagering-requirements", "/programme-guide"]) {
    assert.equal(shouldAutoOpenPrivacyChoice({ ...base, pathname }), true, pathname);
  }
  const banner = source("components/analytics/AnalyticsConsentBanner.tsx");
  assert.match(banner, /if \(editing && !autoOpened\.current\) closeRef\.current\?\.focus\(\);/);
  assert.match(banner, /writeSession\(PRIVACY_CHOICE_DISMISSED_KEY, "1"\);/);
  assert.match(banner, /automated: navigator\.webdriver === true/);
  // Founder decision 25 Sep 2026 (B3): the first screen stays clear until the first scroll or 5 seconds.
  assert.equal(PRIVACY_CHOICE_AUTO_OPEN_DELAY_MS, 5000);
  assert.equal(PRIVACY_CHOICE_SCROLL_THRESHOLD_PX, 24);
  assert.match(banner, /window\.setTimeout\(reveal, PRIVACY_CHOICE_AUTO_OPEN_DELAY_MS\)/);
  assert.match(banner, /window\.addEventListener\("scroll", onScroll, \{ passive: true \}\)/);
  assert.match(banner, /return \(\) => \{\s*armed = false;\s*window\.removeEventListener\("scroll", onScroll\);\s*window\.clearTimeout\(timer\);/);
});

test("analytics choice is a compact site-style banner opened from the footer, localised for every market", async () => {
  const { analyticsConsentMessages } = await import("../lib/i18n/analytics-consent-catalog");
  const banner = source("components/analytics/AnalyticsConsentBanner.tsx");
  const footer = source("components/public-shell/PublicFooter.tsx");
  const layout = source("app/layout.tsx");
  const css = source("app/globals.css");
  const consentCss = css.slice(css.indexOf(".analyticsConsent {"), css.indexOf("* { box-sizing: border-box; }"));

  // No floating edge tab: the choice opens from the footer and only while analytics is enabled.
  assert.doesNotMatch(banner + css, /privacyChoiceTrigger/);
  assert.match(banner, /if \(!editing\) return null;/);
  assert.match(footer, /isProductAnalyticsEnabled\(\) \? <PrivacyChoicesButton className=\{styles\.footerChoice\} label=\{analyticsConsentMessages\(presentation\.locale\)\.trigger\} \/> : null/);
  assert.match(layout, /<AnalyticsConsentBanner locale=\{presentation\.locale\} \/>/);
  // Decline is as easy as Allow; "Not now" is the close control.
  assert.match(banner, /className="analyticsConsentDecline"[\s\S]*className="analyticsConsentAllow"/);
  assert.match(banner, /className="analyticsConsentClose" aria-label=\{text\.notNow\}/);
  assert.match(consentCss, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  // Public site system rather than the admin palette.
  assert.match(consentCss, /background: var\(--sb-night\)/);
  assert.match(consentCss, /border-radius: var\(--sb-radius-button\)/);
  assert.doesNotMatch(consentCss, /#101a23|Inter|border-radius: 1rem/);

  const english = analyticsConsentMessages("en-GB");
  assert.equal(english.trigger, "Cookie settings");
  assert.equal(english.dialogLabel, "Cookie settings");
  // Founder decision 25 Sep 2026: people know "cookies", not "analytics".
  assert.equal(english.allow, "Accept cookies");
  assert.equal(english.decline, "Reject cookies");
  assert.match(english.body, /our own cookies/);
  assert.match(english.detail, /email, Programme answers or partner tokens/);
  // The exclusion statement stays on screen at every width.
  assert.match(banner, /<span className="analyticsConsentDetail">\{text\.detail\}<\/span>/);
  assert.doesNotMatch(consentCss, /analyticsConsentDetail[^{]*\{[^}]*display: none/);
  for (const locale of ["en-GB", "de-DE", "it-IT", "es-ES", "es-PE", "pt-PT", "el-GR", "nl-NL", "sv-SE", "da-DK", "fi-FI", "nb-NO", "en-CA", "fr-CA"] as const) {
    const messages = analyticsConsentMessages(locale);
    for (const [key, value] of Object.entries(messages)) assert.ok(value.trim(), `${locale} ${key}`);
    assert.notEqual(messages.allow, messages.decline, locale);
    if (!locale.startsWith("en-")) assert.notEqual(messages.trigger, english.trigger, `${locale} trigger is localised`);
  }
});
