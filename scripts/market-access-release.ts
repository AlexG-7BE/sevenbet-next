// MARKET-ACCESS-RELEASE-01 — align MarketActivation with the licence register (RFC-054).
// Runbook: docs/06_Operations/Market-Access-Release-01-Runbook.md
//
//   plan  (default) read-only: lists the activations the register closes and the licensed
//                   markets to open, with the partner link each one would use (by hash).
//   verify          read-only: also opens each link to be registered from a real exit in its
//                   market (Globalping) and reports where a visitor there lands.
//   apply           Founder-confirmed only: disables the closed activations through the
//                   MarketActivation controller and registers each licensed market through
//                   PartnerTrackingRegistrationService, verifying the route from a real exit
//                   in that market (Globalping). --only=disable or --only=enable limits it.
//
// --ego-links <path> reads EGO's link sheet (kept outside git); its link wins for a casino and market.
//
// Output never contains a raw tracking URL; links are identified by their sha256.
import { readFileSync } from "node:fs";

import { checkAffiliateRouteFromMarket } from "../lib/affiliate-health/globalping-fetch";
import { establishTrustedCommercialWriteAuthority } from "../lib/commercial/commercial-write-authority";
import { PartnerTrackingRegistrationService } from "../lib/commercial/partner-tracking-registration-service";
import prisma from "../lib/db/prisma";
import { marketActivationController } from "../lib/market-activation/controller";
import {
  BLOCKED_TARGETS,
  ENABLE_TARGETS,
  MARKET_ACCESS_DECISION_REF,
  MARKET_ACCESS_RELEASE,
  assertMarketAccessApplyAuthority,
  derivedTrackingUrl,
  linkHash,
  planDisables,
  targetKey,
  type EnableTarget,
  type PersistedActivation,
} from "../lib/market-access/release";
import { databaseFingerprint, egoRegistrationPlan, parseEgoLinks } from "../lib/partner-imports/ego-skillonnet-import-01";

function option(name: string) {
  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1];
  return process.argv.find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

const progress = (message: string) => console.error(`[${new Date().toISOString().slice(11, 19)}] ${message}`);
const placeholder = (url: string) => new URL(url).hostname.endsWith(".invalid");

async function loadActivations() {
  const rows = await prisma.marketActivation.findMany({
    where: { product: "CASINO" },
    select: {
      id: true, casinoId: true, marketCode: true, desiredState: true, status: true,
      casino: { select: { slug: true } },
      routeFinalHost: true,
      primaryTrackingLink: { select: { trackingUrl: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    casinoId: row.casinoId,
    casinoSlug: row.casino.slug,
    marketCode: row.marketCode,
    desiredState: row.desiredState,
    status: row.status,
    routeFinalHost: row.routeFinalHost,
    trackingUrl: row.primaryTrackingLink?.trackingUrl ?? null,
  }));
}

type Activation = Awaited<ReturnType<typeof loadActivations>>[number];

async function stagedLinkHash(casinoSlug: string, market: string) {
  const [row] = await prisma.$queryRaw<Array<{ hash: string | null }>>`
    SELECT t.metadata #>> '{partnerTrackingRegistration,linkHash}' AS hash
    FROM "AffiliateTrackingLink" t
    JOIN "AffiliateOffer" o ON o.id = t."offerId"
    JOIN "AffiliateProgram" p ON p.id = o."programId"
    JOIN "Casino" c ON c.id = p."casinoId"
    WHERE c.slug = ${casinoSlug}
      AND t.metadata #>> '{partnerTrackingRegistration,geo}' = ${market}
    ORDER BY t."updatedAt" DESC
    LIMIT 1`;
  return row?.hash ?? null;
}

/** EGO's link sheet (kept outside git), when passed with --ego-links: casino:market → URL. */
function egoSheetLinks() {
  const path = option("--ego-links");
  if (!path) return new Map<string, string>();
  const { commands } = egoRegistrationPlan(parseEgoLinks(readFileSync(path, "utf8")));
  return new Map(commands.map((command) => [`${command.casinoSlug}:${command.geo}`, command.trackingUrl]));
}

async function resolveEnable(target: EnableTarget, activations: Activation[], sheet: Map<string, string>) {
  const live = activations.find((row) => row.casinoSlug === target.casinoSlug && row.marketCode === target.market
    && row.desiredState === "ACTIVE" && row.status === "ACTIVE");
  if (live) return { target, state: "ALREADY_ACTIVE" as const, trackingUrl: null, hash: null };
  const source = activations.find((row) => row.casinoSlug === target.casinoSlug && row.marketCode === target.sourceMarket
    && row.trackingUrl && !placeholder(row.trackingUrl));
  const sheetUrl = sheet.get(targetKey(target));
  if (!sheetUrl && !source?.trackingUrl) return { target, state: "SOURCE_LINK_MISSING" as const, trackingUrl: null, hash: null };
  const trackingUrl = sheetUrl ?? derivedTrackingUrl(source!.trackingUrl!, target.query);
  const hash = linkHash(trackingUrl);
  const staged = await stagedLinkHash(target.casinoSlug, target.market);
  if (staged && staged !== hash) return { target, state: "STAGED_LINK_MISMATCH" as const, trackingUrl: null, hash };
  return { target, state: "READY" as const, trackingUrl, hash, stagedHashMatches: Boolean(staged) };
}

function marketChecker(country: string, probes: string[]) {
  return ((input: Parameters<typeof checkAffiliateRouteFromMarket>[0]) => checkAffiliateRouteFromMarket({
    url: input.url,
    country,
    expectation: input.expectation,
    globalping: { onProbe: (probe, url, status) => probes.push(`${probe.country}/${probe.city ?? "?"} ${status} ${url.hostname}`) },
  })) as unknown as ConstructorParameters<typeof PartnerTrackingRegistrationService>[1];
}

async function main() {
  const mode = ["apply", "verify"].includes(process.argv[2] ?? "") ? process.argv[2] : "plan";
  const only = option("--only");
  const database = databaseFingerprint(process.env.DATABASE_URL);
  const activations = await loadActivations();
  const disables = planDisables(activations as PersistedActivation[]);
  const sheet = egoSheetLinks();
  const enables = await Promise.all(ENABLE_TARGETS.map((target) => resolveEnable(target, activations, sheet)));

  const plan = {
    release: MARKET_ACCESS_RELEASE,
    decisionRef: MARKET_ACCESS_DECISION_REF,
    database,
    disable: disables.map(({ activation, closure }) => ({ casino: activation.casinoSlug, market: activation.marketCode, closure, activationId: activation.id })),
    enable: enables.map(({ target, state, hash }) => ({ casino: target.casinoSlug, market: target.market, state, link: hash?.slice(0, 12) ?? null, note: target.note })),
    blocked: BLOCKED_TARGETS,
  };
  if (mode === "plan") {
    console.info(JSON.stringify(plan, null, 2));
    return;
  }
  if (mode === "verify") {
    const verified = [];
    for (const entry of enables.filter((item) => item.state === "READY")) {
      const probes: string[] = [];
      const expectedFinalHost = activations.find((row) => row.casinoSlug === entry.target.casinoSlug && row.marketCode === entry.target.sourceMarket)?.routeFinalHost ?? "";
      progress(`verify ${entry.target.casinoSlug} ${entry.target.market}`);
      const result = await checkAffiliateRouteFromMarket({
        url: new URL(entry.trackingUrl!),
        country: entry.target.market.slice(0, 2),
        expectation: { expectedFinalHost, requiredAttributionParameters: [], allowWwwEquivalentFinalHost: true },
        globalping: { onProbe: (probe, url, status) => probes.push(`${probe.country}/${probe.city ?? "?"} ${status} ${url.hostname}`) },
      });
      verified.push({ casino: entry.target.casinoSlug, market: entry.target.market, sourceHost: expectedFinalHost, status: result.status, reason: result.reason, finalHost: result.finalHost, probes });
    }
    console.info(JSON.stringify({ ...plan, mode, verified }, null, 2));
    return;
  }

  assertMarketAccessApplyAuthority({
    confirm: option("--confirm"),
    decisionRef: option("--decision-ref"),
    actorEmail: option("--actor-email"),
    expectedDatabase: option("--expected-database"),
    actualDatabase: database,
    env: process.env,
  });
  const actor = await prisma.adminUser.findUnique({ where: { email: option("--actor-email")!.trim().toLowerCase() }, select: { id: true } });
  if (!actor) throw new Error("MARKET_ACCESS_RELEASE_ACTOR_NOT_FOUND");
  const now = new Date();

  const disabled = [];
  if (only !== "enable") {
    for (const [index, { activation, closure }] of disables.entries()) {
      progress(`disable ${index + 1}/${disables.length} ${activation.casinoSlug} ${activation.marketCode} (${closure})`);
      try {
        const result = await marketActivationController.disableCasinoInGeo({
          casinoId: activation.casinoId,
          countryCode: activation.marketCode,
          product: "CASINO",
          actorId: actor.id,
          origin: "FOUNDER",
          reason: `${MARKET_ACCESS_RELEASE}: ${closure} under the licence register (RFC-054).`,
          sourceReferences: [MARKET_ACCESS_DECISION_REF, `MARKET_ACCESS_CLOSURE:${closure}`],
          idempotencyKey: `${MARKET_ACCESS_RELEASE}:DISABLE:${activation.id}`,
        }, now);
        disabled.push({ casino: activation.casinoSlug, market: activation.marketCode, closure, desiredState: result.activation.desiredState, status: result.activation.status });
      } catch (error) {
        disabled.push({ casino: activation.casinoSlug, market: activation.marketCode, closure, status: "ERROR", reason: error instanceof Error ? error.message.slice(0, 200) : "UNKNOWN" });
      }
    }
  }

  const enabled = [];
  const authority = establishTrustedCommercialWriteAuthority({ kind: "FOUNDER_DIRECT", decisionRef: MARKET_ACCESS_DECISION_REF });
  if (only !== "disable") {
    const ready = enables.filter((entry) => entry.state === "READY");
    for (const [index, entry] of ready.entries()) {
      const { target } = entry;
      progress(`enable ${index + 1}/${ready.length} ${target.casinoSlug} ${target.market}`);
      const probes: string[] = [];
      const service = new PartnerTrackingRegistrationService(undefined, marketChecker(target.market.slice(0, 2), probes));
      try {
        const result = await service.register(
          { partner: target.partner, casino: target.casinoSlug, trackingUrl: entry.trackingUrl!, geo: target.market },
          { actorId: actor.id, auditOrigin: "INTERNAL_COMMAND", correlationId: `${MARKET_ACCESS_RELEASE}:${target.casinoSlug}:${target.market}`, commercialAuthority: authority },
        );
        const row = result.results.find((item) => item.geo === target.market);
        enabled.push({ casino: target.casinoSlug, market: target.market, status: result.status, verification: result.verification, finalState: row?.finalState ?? null, finalHost: result.finalHost, reason: row?.reason ?? null, internalRedirect: result.internalRedirect, link: result.linkHash.slice(0, 12), probes });
      } catch (error) {
        enabled.push({ casino: target.casinoSlug, market: target.market, status: "ERROR", reason: error instanceof Error ? error.message.slice(0, 200) : "UNKNOWN", probes });
      }
    }
  }

  console.info(JSON.stringify({ ...plan, mode, applied: { disabled, enabled } }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Market access release failed");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
