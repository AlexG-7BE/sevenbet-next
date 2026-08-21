import assert from "node:assert/strict";
import test from "node:test";
import { generateCodeChallenge } from "better-auth/oauth2";

import type { CommercialMcpResearchBundle } from "../lib/commercial/commercial-mcp-contract";
import { CommercialMcpResearchBundleSchema } from "../lib/commercial/commercial-mcp-contract";
import prisma from "../lib/db/prisma";
import {
  exchangeCommercialMcpToken,
  revokeCommercialMcpToken,
  validateCommercialMcpAccessToken,
} from "../lib/mcp/commercial/oauth";
import { resolveCommercialMcpConfig } from "../lib/mcp/commercial/config";
import {
  hashCommercialMcpPresentedToken,
  hashCommercialMcpProviderToken,
  resolveCommercialMcpProviderResource,
} from "../lib/mcp/commercial/provider";
import { consumeCommercialMcpRateLimit } from "../lib/mcp/commercial/rate-limit";
import { commercialRepository } from "../lib/repositories/commercial.repository";

const actor = {
  id: "00000000-0000-4000-8000-000000000271",
  email: "commercial-mcp-postgres@invalid.example",
  name: "Commercial MCP PostgreSQL fixture",
};
const displayName = "MCP PostgreSQL Fixture Partner";
const context = { actorId: actor.id, clientId: "chatgpt-work-postgres-fixture" };
const oauthResource = resolveCommercialMcpProviderResource();
const oauthOrigin = new URL(oauthResource).origin;
const resolvedOauthConfig = resolveCommercialMcpConfig(`${oauthOrigin}/api/mcp/commercial`, {
  COMMERCIAL_MCP_ENABLED: "true",
  COMMERCIAL_MCP_PUBLIC_ORIGIN: oauthOrigin,
});
if (!resolvedOauthConfig) throw new Error("Commercial MCP OAuth test configuration is unavailable");
const oauthConfig = resolvedOauthConfig;

function assertDisposablePostgres() {
  assert.equal(process.env.CI, "true");
  const url = new URL(process.env.DATABASE_URL ?? "");
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
  assert.ok(["5432", "54329"].includes(url.port));
  assert.ok(url.pathname.endsWith("_ci"));
}

function bundle(idempotencyKey = "postgres-bundle-0001") {
  return CommercialMcpResearchBundleSchema.parse({
    idempotencyKey,
    opportunity: {
      displayName,
      legalName: "MCP PostgreSQL Fixture Partner Limited",
      organizationType: "AFFILIATE_NETWORK",
      priority: "HIGH",
    },
    profile: {
      idempotencyKey: "postgres-profile-0001",
      strategicFit: "Original evidenced research profile.",
    },
    evidence: [{
      idempotencyKey: "postgres-evidence-0001",
      sourceType: "PUBLIC_WEB",
      sourceUrl: "https://example.com/partner-programme",
      title: "Public partner programme",
      claim: "A public partner application path is available.",
      classification: "DETECTED",
      category: "APPLICATION_PATH",
      observedAt: "2026-08-20T08:00:00.000Z",
    }],
    contacts: [{
      idempotencyKey: "postgres-contact-0001",
      evidenceIdempotencyKey: "postgres-evidence-0001",
      name: "Partnerships team",
      businessEmail: "partners@example.com",
    }],
    tasks: [{
      idempotencyKey: "postgres-task-0001",
      type: "RESEARCH",
      title: "Verify current programme terms",
    }],
    nextAction: {
      idempotencyKey: "postgres-next-action-0001",
      summary: "Staff should review the application path.",
      waitingOn: "INTERNAL_ACTION",
    },
    drafts: [{
      idempotencyKey: "postgres-draft-0001",
      type: "OUTREACH",
      state: "DRAFT",
      channel: "EMAIL",
      title: "Partner introduction draft",
      draftText: "Draft only; do not send.",
      evidenceIdempotencyKey: "postgres-evidence-0001",
    }],
  });
}

async function clearFixtures() {
  await prisma.verification.deleteMany({ where: { id: { startsWith: "mcp-postgres-code-row-" } } });
  await prisma.oauthAccessToken.deleteMany({ where: { clientId: { startsWith: "mcp-postgres-client-" } } });
  await prisma.oauthRefreshToken.deleteMany({ where: { clientId: { startsWith: "mcp-postgres-client-" } } });
  await prisma.oauthConsent.deleteMany({ where: { clientId: { startsWith: "mcp-postgres-client-" } } });
  await prisma.oauthClient.deleteMany({ where: { clientId: { startsWith: "mcp-postgres-client-" } } });
  await prisma.session.deleteMany({ where: { userId: { startsWith: "mcp-postgres-user-" } } });
  await prisma.adminUser.deleteMany({ where: { email: { startsWith: "mcp-oauth-" } } });
  await prisma.user.deleteMany({ where: { id: { startsWith: "mcp-postgres-user-" } } });
  await prisma.commercialMcpRateLimitBucket.deleteMany();
  await prisma.commercialAgentRun.deleteMany({ where: { triggeredBy: actor.id } });
  await prisma.commercialOpportunity.deleteMany({ where: { displayName: { startsWith: displayName } } });
  await prisma.adminUser.deleteMany({ where: { email: actor.email } });
}

type IssuedTokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: "Bearer";
  scope: string;
};

function tokenRequest(body: URLSearchParams) {
  return new Request(oauthConfig.tokenEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-forwarded-for": "127.0.0.1",
    },
    body,
  });
}

async function exchangeToken(body: URLSearchParams) {
  return exchangeCommercialMcpToken(tokenRequest(body), oauthConfig);
}

async function createOAuthFixture(suffix: string, scopes = ["commercial:read", "commercial:safe_write", "offline_access"]) {
  const userId = `mcp-postgres-user-${suffix}`;
  const clientId = `mcp-postgres-client-${suffix}`;
  const sessionId = `mcp-postgres-session-${suffix}`;
  const adminId = `00000000-0000-4000-8000-${suffix.padStart(12, "0").slice(-12)}`;
  const redirectUri = "https://chatgpt.com/connector_platform_oauth_redirect";
  const verifier = `${"v".repeat(48)}${suffix}`;
  const code = `authorization-code-${suffix}-${"c".repeat(32)}`;

  await prisma.user.create({ data: {
    id: userId,
    name: `OAuth Staff ${suffix}`,
    email: `mcp-oauth-${suffix}@invalid.example`,
    emailVerified: true,
  } });
  await prisma.adminUser.create({ data: {
    id: adminId,
    userId,
    name: `OAuth Staff ${suffix}`,
    email: `mcp-oauth-${suffix}@invalid.example`,
    role: "AFFILIATE_MANAGER",
  } });
  await prisma.session.create({ data: {
    id: sessionId,
    token: `mcp-postgres-session-token-${suffix}`,
    userId,
    expiresAt: new Date(Date.now() + 60 * 60 * 1_000),
  } });
  await prisma.oauthClient.create({ data: {
    id: `mcp-postgres-client-row-${suffix}`,
    clientId,
    disabled: false,
    scopes: ["commercial:read", "commercial:safe_write", "offline_access"],
    contacts: [],
    redirectUris: [redirectUri],
    postLogoutRedirectUris: [],
    tokenEndpointAuthMethod: "none",
    applicationType: "web",
    grantTypes: ["authorization_code", "refresh_token"],
    responseTypes: ["code"],
    requirePKCE: true,
    metadata: { integration: "CHATGPT_WORK", b4gambleMcpResource: oauthConfig.resource },
  } });
  await prisma.oauthResource.upsert({
    where: { identifier: oauthConfig.resource },
    create: {
      id: "mcp-postgres-commercial-resource",
      identifier: oauthConfig.resource,
      name: "B4GAMBLE Commercial MCP",
      accessTokenTtl: 15 * 60,
      refreshTokenTtl: 30 * 24 * 60 * 60,
      allowedScopes: ["commercial:read", "commercial:safe_write", "offline_access"],
    },
    update: {},
  });
  await prisma.oauthClientResource.create({ data: {
    id: `mcp-postgres-client-resource-${suffix}`,
    clientId,
    resourceId: oauthConfig.resource,
  } });
  await prisma.verification.create({ data: {
    id: `mcp-postgres-code-row-${suffix}`,
    identifier: await hashCommercialMcpProviderToken(code, "authorization_code"),
    value: JSON.stringify({
      type: "authorization_code",
      query: {
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scopes.join(" "),
        code_challenge: await generateCodeChallenge(verifier),
        code_challenge_method: "S256",
      },
      userId,
      sessionId,
      resource: [oauthConfig.resource],
    }),
    expiresAt: new Date(Date.now() + 5 * 60 * 1_000),
  } });

  const response = await exchangeToken(new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    resource: oauthConfig.resource,
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  }));
  const responseText = await response.text();
  assert.equal(response.status, 200, responseText);
  const issued = JSON.parse(responseText) as IssuedTokenResponse;
  return { userId, clientId, sessionId, issued };
}

test("real PostgreSQL atomically enforces hashed fixed-window MCP rate limits", async () => {
  assertDisposablePostgres();
  await prisma.commercialMcpRateLimitBucket.deleteMany();
  const source = "203.0.113.27";
  const decisions = await Promise.all(Array.from({ length: 30 }, () => consumeCommercialMcpRateLimit({
    bucket: "postgres-fixture",
    key: source,
    limit: 10,
    windowMs: 60_000,
    now: Date.parse("2026-08-20T08:00:00.000Z"),
  })));
  assert.equal(decisions.filter((decision) => decision.allowed).length, 10);
  const rows = await prisma.commercialMcpRateLimitBucket.findMany();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].count, 30);
  assert.match(rows[0].bucketKey, /^[a-f0-9]{64}$/);
  assert.doesNotMatch(JSON.stringify(rows), new RegExp(source.replaceAll(".", "\\.")));
});

test("real PostgreSQL enforces the provider-owned OAuth token lifecycle", async (t) => {
  assertDisposablePostgres();
  await clearFixtures();

  await t.test("issued opaque access and refresh tokens are provider-hashed and verifiable", async () => {
    const fixture = await createOAuthFixture("101");
    assert.match(fixture.issued.access_token, /^b4mcp_at_/);
    assert.match(fixture.issued.refresh_token ?? "", /^b4mcp_rt_/);

    const accessHash = await hashCommercialMcpPresentedToken(fixture.issued.access_token, "access_token");
    const refreshHash = await hashCommercialMcpPresentedToken(fixture.issued.refresh_token!, "refresh_token");
    const accessRow = await prisma.oauthAccessToken.findUniqueOrThrow({ where: { token: accessHash! } });
    const refreshRow = await prisma.oauthRefreshToken.findUniqueOrThrow({ where: { token: refreshHash! } });
    assert.notEqual(accessRow.token, fixture.issued.access_token);
    assert.notEqual(refreshRow.token, fixture.issued.refresh_token);

    const context = await validateCommercialMcpAccessToken(new Request(oauthConfig.resource, {
      headers: { Authorization: `Bearer ${fixture.issued.access_token}` },
    }), oauthConfig, "commercial:safe_write");
    assert.equal(context.staff.userId, fixture.userId);
  });

  await t.test("expired, wrong-resource, consumer, and unprivileged staff access fail", async () => {
    const fixture = await createOAuthFixture("102");
    const accessHash = await hashCommercialMcpPresentedToken(fixture.issued.access_token, "access_token");
    const bearerRequest = () => new Request(oauthConfig.resource, {
      headers: { Authorization: `Bearer ${fixture.issued.access_token}` },
    });

    await prisma.oauthAccessToken.update({ where: { token: accessHash! }, data: { expiresAt: new Date(Date.now() - 1_000) } });
    await assert.rejects(validateCommercialMcpAccessToken(bearerRequest(), oauthConfig), /invalid or expired/);
    await prisma.oauthAccessToken.update({ where: { token: accessHash! }, data: { expiresAt: new Date(Date.now() + 15 * 60 * 1_000) } });

    await prisma.oauthClient.update({
      where: { clientId: fixture.clientId },
      data: { metadata: { integration: "CHATGPT_WORK", b4gambleMcpResource: "https://preview.invalid/api/mcp/commercial" } },
    });
    await assert.rejects(validateCommercialMcpAccessToken(bearerRequest(), oauthConfig), /wrong resource/);
    await prisma.oauthClient.update({
      where: { clientId: fixture.clientId },
      data: { metadata: { integration: "CHATGPT_WORK", b4gambleMcpResource: oauthConfig.resource } },
    });

    await prisma.adminUser.update({ where: { userId: fixture.userId }, data: { role: "AUTHOR" } });
    await assert.rejects(validateCommercialMcpAccessToken(bearerRequest(), oauthConfig), /affiliate\.manage/);
    await prisma.adminUser.delete({ where: { userId: fixture.userId } });
    await assert.rejects(validateCommercialMcpAccessToken(bearerRequest(), oauthConfig), /not B4GAMBLE staff/);
  });

  await t.test("refresh rotation succeeds and replay cannot create a second valid family", async () => {
    const fixture = await createOAuthFixture("103");
    const firstRefresh = fixture.issued.refresh_token!;
    const rotatedResponse = await exchangeToken(new URLSearchParams({
      grant_type: "refresh_token",
      client_id: fixture.clientId,
      resource: oauthConfig.resource,
      refresh_token: firstRefresh,
    }));
    const rotatedText = await rotatedResponse.text();
    assert.equal(rotatedResponse.status, 200, rotatedText);
    const rotated = JSON.parse(rotatedText) as IssuedTokenResponse;
    assert.notEqual(rotated.refresh_token, firstRefresh);

    const oldHash = await hashCommercialMcpPresentedToken(firstRefresh, "refresh_token");
    assert.ok((await prisma.oauthRefreshToken.findUniqueOrThrow({ where: { token: oldHash! } })).revoked);

    const replay = await exchangeToken(new URLSearchParams({
      grant_type: "refresh_token",
      client_id: fixture.clientId,
      resource: oauthConfig.resource,
      refresh_token: firstRefresh,
    }));
    assert.notEqual(replay.status, 200);
    assert.equal(await prisma.oauthRefreshToken.count({ where: { clientId: fixture.clientId, revoked: null } }), 0);
  });

  await t.test("concurrent refresh cannot leave two independently valid access tokens", async () => {
    const fixture = await createOAuthFixture("104");
    const refresh = fixture.issued.refresh_token!;
    const responses = await Promise.all([1, 2].map(() => exchangeToken(new URLSearchParams({
      grant_type: "refresh_token",
      client_id: fixture.clientId,
      resource: oauthConfig.resource,
      refresh_token: refresh,
    }))));
    const successfulBodies: IssuedTokenResponse[] = [];
    for (const response of responses) {
      const text = await response.text();
      if (response.status === 200) successfulBodies.push(JSON.parse(text) as IssuedTokenResponse);
    }
    assert.equal(successfulBodies.length, 1);

    let usable = 0;
    for (const body of successfulBodies) {
      try {
        await validateCommercialMcpAccessToken(new Request(oauthConfig.resource, {
          headers: { Authorization: `Bearer ${body.access_token}` },
        }), oauthConfig);
        usable += 1;
      } catch {
        // Replay detection may invalidate the whole family; either result is fail-closed.
      }
    }
    assert.ok(usable <= 1);
  });

  await t.test("revocation is immediate and a read token cannot pass the write boundary", async () => {
    const fixture = await createOAuthFixture("105", ["commercial:read"]);
    const bearer = new Request(oauthConfig.resource, {
      headers: { Authorization: `Bearer ${fixture.issued.access_token}` },
    });
    await assert.rejects(validateCommercialMcpAccessToken(bearer, oauthConfig, "commercial:safe_write"), /insufficient scope/);

    const revokeResponse = await revokeCommercialMcpToken(new Request(oauthConfig.revocationEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-forwarded-for": "127.0.0.1",
      },
      body: new URLSearchParams({
        token: fixture.issued.access_token,
        token_type_hint: "access_token",
        client_id: fixture.clientId,
        resource: oauthConfig.resource,
      }),
    }), oauthConfig);
    assert.equal(revokeResponse.status, 200);
    await assert.rejects(validateCommercialMcpAccessToken(new Request(oauthConfig.resource, {
      headers: { Authorization: `Bearer ${fixture.issued.access_token}` },
    }), oauthConfig), /invalid or expired/);
  });
});

test("real PostgreSQL serializes concurrent bundle replay and preserves safe CRM truth", async () => {
  assertDisposablePostgres();
  await clearFixtures();
  await prisma.adminUser.create({ data: { ...actor, role: "AFFILIATE_MANAGER" } });

  const input = bundle();
  const results = await Promise.all(Array.from(
    { length: 12 },
    () => commercialRepository.mcpUpsertResearchBundle(input, context),
  ));
  assert.equal(results.filter((result) => result.status === "CREATED").length, 1);
  assert.equal(results.filter((result) => result.status === "IDEMPOTENT_REPLAY").length, 11);

  const opportunities = await prisma.commercialOpportunity.findMany({
    where: { displayName },
    include: {
      evidence: true,
      contacts: true,
      tasks: true,
      applications: true,
      agentRuns: { include: { operations: true } },
      activities: true,
      activationPackets: true,
    },
  });
  assert.equal(opportunities.length, 1);
  const opportunity = opportunities[0];
  assert.equal(opportunity.stage, "PROSPECT");
  assert.equal(opportunity.evidence.length, 1);
  assert.equal(opportunity.evidence[0].sourceAuthority, null);
  assert.equal(opportunity.contacts.length, 1);
  assert.equal(opportunity.tasks.length, 1);
  assert.equal(opportunity.applications.length, 1);
  assert.equal(opportunity.applications[0].state, "DRAFT");
  assert.equal(opportunity.applications[0].sentAt, null);
  assert.equal(opportunity.applications[0].submittedAt, null);
  assert.equal(opportunity.agentRuns.length, 1);
  assert.equal(opportunity.activities.every((activity) => activity.actorKind === "PARTNER_OPERATIONS_AGENT"), true);
  assert.equal(opportunity.activationPackets.length, 0);

  const auditRows = await prisma.auditLog.findMany({ where: { actorId: actor.id } });
  assert.equal(auditRows.length, 1);
  assert.match(JSON.stringify(auditRows[0].metadata), /CHATGPT_WORK/);
  assert.doesNotMatch(JSON.stringify(auditRows), /access[_-]?token|refresh[_-]?token|authorization[_-]?code/i);
});

test("real PostgreSQL enforces child idempotency and rolls back a late repository failure", async () => {
  const opportunity = await prisma.commercialOpportunity.findFirstOrThrow({ where: { displayName } });
  const repeated = bundle("postgres-bundle-0002");
  repeated.opportunity.opportunityId = opportunity.id;
  repeated.profile!.strategicFit = "A repeated child key must not overwrite the original profile.";
  repeated.nextAction!.summary = "A repeated child key must not overwrite the original action.";
  const repeatResult = await commercialRepository.mcpUpsertResearchBundle(repeated, context);
  assert.equal(repeatResult.status, "UPDATED");

  const afterRepeat = await prisma.commercialOpportunity.findUniqueOrThrow({ where: { id: opportunity.id } });
  assert.equal(afterRepeat.strategicFit, "Original evidenced research profile.");
  assert.equal(afterRepeat.nextActionSummary, "Staff should review the application path.");
  assert.equal(await prisma.commercialEvidence.count({ where: { opportunityId: opportunity.id } }), 1);
  assert.equal(await prisma.commercialApplication.count({ where: { opportunityId: opportunity.id } }), 1);

  const runCount = await prisma.commercialAgentRun.count({ where: { opportunityId: opportunity.id } });
  const evidenceCount = await prisma.commercialEvidence.count({ where: { opportunityId: opportunity.id } });
  const invalid = bundle("postgres-bundle-rollback");
  invalid.opportunity.opportunityId = opportunity.id;
  invalid.profile = { idempotencyKey: "postgres-profile-rollback", strategicFit: "This must roll back." };
  invalid.evidence[0].idempotencyKey = "postgres-evidence-rollback";
  invalid.contacts[0].idempotencyKey = "postgres-contact-rollback";
  invalid.contacts[0].evidenceIdempotencyKey = "missing-evidence-key";

  await assert.rejects(
    commercialRepository.mcpUpsertResearchBundle(invalid as CommercialMcpResearchBundle, context),
    /was not resolved/,
  );
  const afterFailure = await prisma.commercialOpportunity.findUniqueOrThrow({ where: { id: opportunity.id } });
  assert.equal(afterFailure.strategicFit, "Original evidenced research profile.");
  assert.equal(await prisma.commercialAgentRun.count({ where: { opportunityId: opportunity.id } }), runCount);
  assert.equal(await prisma.commercialEvidence.count({ where: { opportunityId: opportunity.id } }), evidenceCount);
});

test.after(async () => {
  await clearFixtures();
  await prisma.$disconnect();
});
