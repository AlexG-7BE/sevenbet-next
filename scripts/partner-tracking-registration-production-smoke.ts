import { createHash, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { CURRENT_PARTNER_INVENTORY, CURRENT_PARTNER_RECORDS } from "@/lib/current-partner-rollout/inventory";

if (!process.env.DATABASE_URL && process.env.PRODDB_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.PRODDB_DATABASE_URL;
}
if (!process.env.DIRECT_URL && process.env.PRODDB_POSTGRES_URL) {
  process.env.DIRECT_URL = process.env.PRODDB_POSTGRES_URL;
}

let commercialMcpService: (typeof import("@/lib/commercial/commercial-mcp-service"))["commercialMcpService"];
let prisma: (typeof import("@/lib/db/prisma"))["default"];
let hashCommercialMcpProviderToken: (typeof import("@/lib/mcp/commercial/provider"))["hashCommercialMcpProviderToken"];

const EXPECTED_DATABASE_FINGERPRINT = "ce94f1e2b465c25d62b13a8c3f2db47aa07b96b541603c818ef6219c9c970a5e";
const EXPECTED_REPOSITORY = "AlexG-7BE/sevenbet-next";
const EXPECTED_PROJECT_ID = "prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb";
const EXPECTED_ORG_ID = "team_WhkUGuXZeIMlU1uFHtowNUqa";
const CONFIRMATION = "PARTNER_TRACKING_REGISTRATION_PRODUCTION_SMOKE";
const MCP_RESOURCE = "https://b4gamble.com/api/mcp/commercial";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function argument(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function databaseFingerprint() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return "UNAVAILABLE";
  const target = new URL(raw);
  return sha256([
    target.protocol,
    target.hostname,
    target.port || "5432",
    target.username,
    target.pathname,
    target.searchParams.get("schema") ?? "public",
  ].join("\n"));
}

function assertAuthority() {
  const expectedSha = argument("expected-sha");
  const confirmation = argument("confirmation");
  const actualSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const remote = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" }).trim();
  const project = JSON.parse(readFileSync(".vercel/project.json", "utf8")) as { projectId?: string; orgId?: string };
  if (!expectedSha || expectedSha !== actualSha) throw new Error("PRODUCTION_SMOKE_SHA_MISMATCH");
  if (confirmation !== CONFIRMATION) throw new Error("PRODUCTION_SMOKE_CONFIRMATION_REQUIRED");
  if (process.env.VERCEL_ENV !== "production") throw new Error("PRODUCTION_SMOKE_ENVIRONMENT_MISMATCH");
  if (!remote.includes(EXPECTED_REPOSITORY)) throw new Error("PRODUCTION_SMOKE_REPOSITORY_MISMATCH");
  if (project.projectId !== EXPECTED_PROJECT_ID || project.orgId !== EXPECTED_ORG_ID) throw new Error("PRODUCTION_SMOKE_PROJECT_MISMATCH");
  if (databaseFingerprint() !== EXPECTED_DATABASE_FINGERPRINT) throw new Error("PRODUCTION_SMOKE_DATABASE_MISMATCH");
  return actualSha;
}

async function scopedCounts(casinoId: string, networkId: string, countryCode: string) {
  const [programs, offers, trackingLinks, redirects, activations] = await Promise.all([
    prisma.affiliateProgram.count({ where: { casinoId, networkId } }),
    prisma.affiliateOffer.count({ where: { casinoId, program: { networkId } } }),
    prisma.affiliateTrackingLink.count({ where: { offer: { casinoId, program: { networkId } } } }),
    prisma.affiliateRedirectSlug.count({ where: { casinoId } }),
    prisma.marketActivation.count({ where: { casinoId, countryCode, product: "CASINO" } }),
  ]);
  return { programs, offers, trackingLinks, redirects, activations };
}

async function runBeforeStateSnapshot(sha: string) {
  const partnerIds = CURRENT_PARTNER_RECORDS.map((partner) => partner.opportunityId);
  const opportunities = await prisma.commercialOpportunity.findMany({
    where: { id: { in: partnerIds } },
    select: { id: true, stage: true, affiliateNetworkId: true },
    orderBy: { id: "asc" },
  });
  const networkIds = [...new Set(opportunities.flatMap((opportunity) => opportunity.affiliateNetworkId ? [opportunity.affiliateNetworkId] : []))];
  const casinoNames = [...new Set(CURRENT_PARTNER_INVENTORY.map((row) => row.casino))];
  const casinoSlugs = [...new Set(CURRENT_PARTNER_INVENTORY.flatMap((row) => row.casinoSlug ? [row.casinoSlug] : []))];
  const casinos = await prisma.casino.findMany({
    where: { OR: [{ title: { in: casinoNames } }, { slug: { in: casinoSlugs } }] },
    select: { id: true },
  });
  const casinoIds = casinos.map((casino) => casino.id);
  const [programCount, offerCount, trackingLinkCount, redirectCount, activations] = await Promise.all([
    prisma.affiliateProgram.count({ where: { casinoId: { in: casinoIds }, networkId: { in: networkIds } } }),
    prisma.affiliateOffer.count({ where: { casinoId: { in: casinoIds }, program: { networkId: { in: networkIds } } } }),
    prisma.affiliateTrackingLink.count({ where: { offer: { casinoId: { in: casinoIds }, program: { networkId: { in: networkIds } } } } }),
    prisma.affiliateRedirectSlug.count({ where: { casinoId: { in: casinoIds } } }),
    prisma.marketActivation.findMany({
      where: { casinoId: { in: casinoIds }, product: "CASINO" },
      select: { status: true, routeVerificationStatus: true },
    }),
  ]);
  const activationStates = activations.reduce<Record<string, number>>((counts, activation) => {
    const key = `${activation.status}:${activation.routeVerificationStatus}`;
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
  return {
    sha,
    mode: "READ_ONLY_BEFORE_STATE",
    expectedPartnerRecords: partnerIds.length,
    foundPartnerRecords: opportunities.length,
    activePartnerRecords: opportunities.filter((opportunity) => opportunity.stage === "ACTIVE").length,
    boundPartnerNetworks: networkIds.length,
    canonicalInventoryRows: CURRENT_PARTNER_INVENTORY.length,
    resolvedCanonicalCasinos: casinos.length,
    objects: { programCount, offerCount, trackingLinkCount, redirectCount, marketActivationCount: activations.length },
    activationStates,
    schemaMigrationRequired: false,
    rawTrackingValuesRead: false,
  };
}

async function runServiceSmoke(sha: string) {
  const activation = await prisma.marketActivation.findUniqueOrThrow({
    where: { casinoId_countryCode_product: {
      casinoId: (await prisma.casino.findUniqueOrThrow({ where: { slug: "betsson" }, select: { id: true } })).id,
      countryCode: "PE",
      product: "CASINO",
    } },
    include: {
      casino: { select: { id: true, title: true } },
      primaryTrackingLink: { include: { offer: { include: { program: true } } } },
      redirectSlug: { select: { slug: true } },
    },
  });
  if (activation.status !== "ACTIVE" || activation.routeVerificationStatus !== "HEALTHY" || !activation.primaryTrackingLink || !activation.redirectSlug) {
    throw new Error("PRODUCTION_SMOKE_CANONICAL_ROUTE_UNAVAILABLE");
  }
  const actor = await prisma.adminUser.findUnique({ where: { id: activation.requestedBy }, select: { id: true } })
    ?? await prisma.adminUser.findFirstOrThrow({ where: { role: { in: ["SUPER_ADMIN", "ADMIN", "AFFILIATE_MANAGER"] } }, orderBy: { createdAt: "asc" }, select: { id: true } });
  const rawTrackingUrl = activation.primaryTrackingLink.trackingUrl;
  const linkHash = sha256(rawTrackingUrl);
  const tokenValues = [...new URL(rawTrackingUrl).searchParams.values()].filter((value) => value.length >= 4);
  const networkId = activation.primaryTrackingLink.offer.program.networkId;
  const before = await scopedCounts(activation.casinoId, networkId, activation.countryCode);
  const result = await commercialMcpService.registerPartnerTrackingLink({
    partner: "Betsson Group Affiliates",
    casino: activation.casino.title,
    trackingUrl: rawTrackingUrl,
    geo: activation.countryCode,
  }, { actorId: actor.id, clientId: "production-idempotent-smoke" });
  const serialized = JSON.stringify(result);
  if (serialized.includes(rawTrackingUrl) || tokenValues.some((value) => serialized.includes(value))) {
    throw new Error("PRODUCTION_SMOKE_RESPONSE_LEAK");
  }
  if (result.status !== "NO_CHANGE" || result.verification !== "ALREADY_REGISTERED" || result.linkHash !== linkHash) {
    throw new Error("PRODUCTION_SMOKE_NOT_IDEMPOTENT");
  }
  const after = await scopedCounts(activation.casinoId, networkId, activation.countryCode);
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("PRODUCTION_SMOKE_DUPLICATE_OBJECT_CREATED");
  const current = await prisma.marketActivation.findUniqueOrThrow({ where: { id: activation.id } });
  if (current.status !== "ACTIVE" || current.routeVerificationStatus !== "HEALTHY" || current.primaryTrackingLinkId !== activation.primaryTrackingLinkId) {
    throw new Error("PRODUCTION_SMOKE_ACTIVATION_REGRESSION");
  }
  const audit = await prisma.auditLog.findFirstOrThrow({
    where: { action: "commercial-partner-tracking-link-registered", entityId: result.partnerId },
    orderBy: { timestamp: "desc" },
  });
  const boundedAudit = JSON.stringify({ summary: audit.summary, metadata: audit.metadata });
  if (boundedAudit.includes(rawTrackingUrl) || tokenValues.some((value) => boundedAudit.includes(value))) {
    throw new Error("PRODUCTION_SMOKE_AUDIT_LEAK");
  }
  return {
    sha,
    status: result.status,
    partner: result.partner,
    casino: result.casino,
    scope: result.trackingScope,
    geo: result.geo,
    linkHash: result.linkHash,
    verification: result.verification,
    finalHost: result.finalHost,
    redirectCount: result.redirectCount,
    marketActivationId: result.results[0]?.marketActivationId ?? null,
    marketActivationStatus: current.status,
    routeHealth: current.routeVerificationStatus,
    internalRedirect: result.internalRedirect,
    duplicateObjectCheck: before,
    responseLeak: false,
    auditLeak: false,
  };
}

async function postMcp(token: string, body: Record<string, unknown>) {
  const response = await fetch(MCP_RESOURCE, {
    method: "POST",
    headers: {
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`PRODUCTION_MCP_HTTP_${response.status}`);
  return response.json() as Promise<Record<string, unknown>>;
}

async function runLiveSchemaSmoke(sha: string) {
  const suffix = randomBytes(12).toString("hex");
  const userId = `partner-tracking-schema-${suffix}`;
  const adminId = `${suffix.slice(0, 8)}-${suffix.slice(8, 12)}-4${suffix.slice(13, 16)}-8${suffix.slice(17, 20)}-${suffix.slice(20, 24).padEnd(12, "0")}`;
  const clientId = `partner-tracking-schema-${suffix}`;
  const presentedSuffix = randomBytes(32).toString("base64url");
  const presentedToken = `b4mcp_at_${presentedSuffix}`;
  try {
    await prisma.user.create({ data: {
      id: userId,
      name: "Partner tracking schema verifier",
      email: `${userId}@invalid.example`,
      emailVerified: true,
    } });
    await prisma.adminUser.create({ data: {
      id: adminId,
      userId,
      name: "Partner tracking schema verifier",
      email: `${userId}@invalid.example`,
      role: "AFFILIATE_MANAGER",
    } });
    await prisma.oauthClient.create({ data: {
      id: `${clientId}-row`,
      clientId,
      disabled: false,
      scopes: ["commercial:read", "commercial:safe_write"],
      clientCredentialsScopes: [],
      contacts: [],
      redirectUris: ["https://chatgpt.com/connector_platform_oauth_redirect"],
      postLogoutRedirectUris: [],
      tokenEndpointAuthMethod: "none",
      applicationType: "web",
      grantTypes: ["authorization_code", "refresh_token"],
      responseTypes: ["code"],
      requirePKCE: true,
      metadata: { integration: "CHATGPT_WORK", b4gambleMcpResource: MCP_RESOURCE },
    } });
    await prisma.oauthClientResource.create({ data: {
      id: `${clientId}-resource`,
      clientId,
      resourceId: MCP_RESOURCE,
    } });
    await prisma.oauthAccessToken.create({ data: {
      id: `${clientId}-access`,
      token: await hashCommercialMcpProviderToken(presentedSuffix, "access_token"),
      clientId,
      userId,
      resources: [MCP_RESOURCE],
      scopes: ["commercial:read", "commercial:safe_write"],
      expiresAt: new Date(Date.now() + 5 * 60_000),
      createdAt: new Date(),
    } });
    const response = await postMcp(presentedToken, { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
    const result = response.result as { tools?: Array<{ name: string; inputSchema: { properties?: Record<string, unknown>; required?: string[]; additionalProperties?: boolean } }> } | undefined;
    const tools = result?.tools ?? [];
    const tool = tools.find((entry) => entry.name === "commercial_register_partner_tracking_link");
    if (!tool) throw new Error("PRODUCTION_MCP_TOOL_MISSING");
    const properties = Object.keys(tool.inputSchema.properties ?? {}).sort();
    if (JSON.stringify(properties) !== JSON.stringify(["casino", "geo", "partner", "trackingUrl"])) throw new Error("PRODUCTION_MCP_SCHEMA_PROPERTIES_MISMATCH");
    if (JSON.stringify(tool.inputSchema.required) !== JSON.stringify(["partner", "casino", "trackingUrl"])) throw new Error("PRODUCTION_MCP_SCHEMA_REQUIRED_MISMATCH");
    if (tool.inputSchema.additionalProperties !== false) throw new Error("PRODUCTION_MCP_SCHEMA_NOT_STRICT");
    return {
      sha,
      endpoint: MCP_RESOURCE,
      toolCount: tools.length,
      tool: tool.name,
      required: tool.inputSchema.required,
      optional: ["geo"],
      properties,
      strict: true,
      ephemeralAuthorizationFixtureRemoved: true,
    };
  } finally {
    await prisma.oauthAccessToken.deleteMany({ where: { clientId } });
    await prisma.oauthClientResource.deleteMany({ where: { clientId } });
    await prisma.oauthClient.deleteMany({ where: { clientId } });
    await prisma.adminUser.deleteMany({ where: { id: adminId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  }
}

async function main() {
  const [commercialModule, prismaModule, providerModule] = await Promise.all([
    import("@/lib/commercial/commercial-mcp-service"),
    import("@/lib/db/prisma"),
    import("@/lib/mcp/commercial/provider"),
  ]);
  commercialMcpService = commercialModule.commercialMcpService;
  prisma = prismaModule.default;
  hashCommercialMcpProviderToken = providerModule.hashCommercialMcpProviderToken;
  const sha = assertAuthority();
  const mode = process.argv[2];
  const result = mode === "snapshot" ? await runBeforeStateSnapshot(sha)
    : mode === "service" ? await runServiceSmoke(sha)
    : mode === "schema" ? await runLiveSchemaSmoke(sha)
      : (() => { throw new Error("PRODUCTION_SMOKE_MODE_REQUIRED"); })();
  process.stdout.write(`${JSON.stringify(await result, null, 2)}\n`);
}

main().finally(async () => { if (prisma) await prisma.$disconnect(); }).catch((error) => {
  const code = error instanceof Error && /^[A-Z0-9_]+$/.test(error.message) ? error.message : "PRODUCTION_SMOKE_FAILED";
  process.stderr.write(`${code}\n`);
  process.exitCode = 1;
});
