import assert from "node:assert/strict";
import test from "node:test";

import { normalizeCommercialMcpAuthorizationRequest } from "../lib/mcp/commercial/authorization-request";
import {
  commercialMcpAuthorizationServerMetadata,
  commercialMcpProtectedResourceMetadata,
  resolveCommercialMcpConfig,
} from "../lib/mcp/commercial/config";
import {
  CommercialMcpAuthError,
  isAllowedChatGptRedirect,
  validateCommercialMcpTokenRecord,
} from "../lib/mcp/commercial/oauth-policy";
import { resolveCommercialMcpProviderResource } from "../lib/mcp/commercial/provider";

const config = resolveCommercialMcpConfig("https://b4gamble.com/api/mcp/commercial", {
  COMMERCIAL_MCP_ENABLED: "true",
  COMMERCIAL_MCP_PUBLIC_ORIGIN: "https://b4gamble.com",
});
assert.ok(config);

const token = {
  id: "token-row-id",
  clientId: "chatgpt-client",
  userId: "staff-user-id",
  sessionId: "staff-session-id",
  scopes: ["commercial:read", "commercial:safe_write", "offline_access"],
  resources: [config.resource],
  expiresAt: new Date("2026-08-20T12:00:00.000Z"),
  revoked: null,
  session: { expiresAt: new Date("2026-08-20T14:00:00.000Z") },
  client: {
    disabled: false,
    tokenEndpointAuthMethod: "none",
    applicationType: "web",
    metadata: { integration: "CHATGPT_WORK", b4gambleMcpResource: config.resource },
  },
};
const commercialStaff = { id: "staff-id", userId: "staff-user-id", email: "staff@example.com", name: "Staff", role: "AFFILIATE_MANAGER" as const };

test("OAuth discovery advertises PKCE, DCR, refresh, revocation, resource, and exact scopes", () => {
  const server = commercialMcpAuthorizationServerMetadata(config);
  const resource = commercialMcpProtectedResourceMetadata(config);
  assert.deepEqual(server.code_challenge_methods_supported, ["S256"]);
  assert.equal(server.authorization_response_iss_parameter_supported, true);
  assert.deepEqual(server.grant_types_supported, ["authorization_code", "refresh_token"]);
  assert.equal(server.token_endpoint_auth_methods_supported.includes("none"), true);
  assert.equal(server.scopes_supported.includes("commercial:admin"), false);
  assert.equal(resource.resource, "https://b4gamble.com/api/mcp/commercial");
});

test("configuration enables Production by default, preserves an explicit kill switch, and keeps non-Production closed", () => {
  assert.equal(resolveCommercialMcpConfig("https://b4gamble.com/api/mcp/commercial", {}), null);

  const production = resolveCommercialMcpConfig("https://b4gamble.com/api/mcp/commercial", {
    VERCEL_ENV: "production",
  });
  assert.ok(production);
  assert.equal(production.issuer, "https://b4gamble.com");
  assert.equal(production.resource, "https://b4gamble.com/api/mcp/commercial");

  assert.equal(resolveCommercialMcpConfig("https://b4gamble.com/api/mcp/commercial", {
    VERCEL_ENV: "production",
    COMMERCIAL_MCP_ENABLED: "false",
  }), null);

  assert.equal(resolveCommercialMcpConfig("https://preview.invalid/api/mcp/commercial", {
    VERCEL_ENV: "preview",
    VERCEL_BRANCH_URL: "preview.invalid",
  }), null);

  const preview = resolveCommercialMcpConfig("https://preview.invalid/api/mcp/commercial", {
    VERCEL_ENV: "preview",
    VERCEL_BRANCH_URL: "preview.invalid",
    COMMERCIAL_MCP_ENABLED: "true",
  });
  assert.ok(preview);
  assert.equal(preview.resource, "https://preview.invalid/api/mcp/commercial");

  assert.throws(() => resolveCommercialMcpConfig("https://b4gamble.com/api/mcp/commercial", {
    COMMERCIAL_MCP_ENABLED: "true",
    COMMERCIAL_MCP_PUBLIC_ORIGIN: "http://example.com",
  }));
  assert.throws(() => resolveCommercialMcpProviderResource({
    BETTER_AUTH_URL: "https://b4gamble.com",
    COMMERCIAL_MCP_PUBLIC_ORIGIN: "https://preview.invalid",
  }), /one exact origin/);
});

test("DCR accepts only current ChatGPT callback shapes", () => {
  assert.equal(isAllowedChatGptRedirect("https://chatgpt.com/connector_platform_oauth_redirect"), true);
  assert.equal(isAllowedChatGptRedirect("https://chatgpt.com/connector/oauth/abcdefgh"), true);
  assert.equal(isAllowedChatGptRedirect("https://evil.example/connector/oauth/abcdefgh"), false);
  assert.equal(isAllowedChatGptRedirect("https://chatgpt.com/connector/oauth/abcdefgh?next=evil"), false);
});

test("ChatGPT authorize presentation extensions are ignored without changing authority bindings", () => {
  const codeChallenge = "A".repeat(43);
  const request = new Request(
    `https://b4gamble.com/api/mcp/oauth/authorize?response_type=code&client_id=chatgpt-client&redirect_uri=${encodeURIComponent("https://chatgpt.com/connector/oauth/abcdefgh")}&scope=${encodeURIComponent("commercial:read commercial:safe_write offline_access")}&state=oauth_s_fixture&code_challenge=${codeChallenge}&code_challenge_method=S256&resource=${encodeURIComponent(config.resource)}&ui_locales=ru-RU&response_mode=query&audience=${encodeURIComponent("https://attacker.invalid")}`,
  );
  const normalized = new URL(normalizeCommercialMcpAuthorizationRequest(request).url);

  assert.equal(normalized.searchParams.get("response_type"), "code");
  assert.equal(normalized.searchParams.get("client_id"), "chatgpt-client");
  assert.equal(normalized.searchParams.get("redirect_uri"), "https://chatgpt.com/connector/oauth/abcdefgh");
  assert.equal(normalized.searchParams.get("resource"), config.resource);
  assert.equal(normalized.searchParams.get("state"), "oauth_s_fixture");
  assert.equal(normalized.searchParams.get("code_challenge"), codeChallenge);
  assert.equal(normalized.searchParams.get("code_challenge_method"), "S256");
  assert.equal(normalized.searchParams.has("ui_locales"), false);
  assert.equal(normalized.searchParams.has("response_mode"), false);
  assert.equal(normalized.searchParams.has("audience"), false);
});

test("valid commercial staff token is accepted for read and safe write", () => {
  const context = validateCommercialMcpTokenRecord(token, commercialStaff, config, "commercial:safe_write", new Date("2026-08-20T10:00:00.000Z"));
  assert.equal(context.staff.id, "staff-id");
  assert.equal(context.scopes.has("commercial:read"), true);
});

test("consumer identity without an AdminUser is denied", () => {
  assert.throws(() => validateCommercialMcpTokenRecord(token, null, config), CommercialMcpAuthError);
});

test("staff without affiliate.manage is denied", () => {
  assert.throws(() => validateCommercialMcpTokenRecord(token, { ...commercialStaff, role: "AUTHOR" }, config), /affiliate\.manage/);
});

test("expired and revoked access tokens are denied", () => {
  assert.throws(() => validateCommercialMcpTokenRecord(token, commercialStaff, config, undefined, new Date("2026-08-20T13:00:00.000Z")), /expired/);
  assert.throws(() => validateCommercialMcpTokenRecord({
    ...token,
    session: { expiresAt: new Date("2026-08-20T09:00:00.000Z") },
  }, commercialStaff, config, undefined, new Date("2026-08-20T10:00:00.000Z")), /invalid or expired/);
  assert.throws(() => validateCommercialMcpTokenRecord({ ...token, revoked: new Date("2026-08-20T11:00:00.000Z") }, commercialStaff, config), /invalid or expired/);
  assert.throws(() => validateCommercialMcpTokenRecord(null, commercialStaff, config), /invalid or expired/);
});

test("wrong issuer audience or resource binding is denied", () => {
  const wrongIssuerConfig = resolveCommercialMcpConfig("https://preview.invalid/api/mcp/commercial", {
    COMMERCIAL_MCP_ENABLED: "true",
    COMMERCIAL_MCP_PUBLIC_ORIGIN: "https://preview.invalid",
  });
  assert.ok(wrongIssuerConfig);
  assert.throws(() => validateCommercialMcpTokenRecord(token, commercialStaff, wrongIssuerConfig), /wrong resource/);
  assert.throws(() => validateCommercialMcpTokenRecord({ ...token, resources: ["https://b4gamble.com/api/mcp/other"] }, commercialStaff, config), /wrong resource/);
  assert.throws(() => validateCommercialMcpTokenRecord({ ...token, client: { ...token.client, metadata: { integration: "CHATGPT_WORK", b4gambleMcpResource: "https://b4gamble.com/api/mcp/other" } } }, commercialStaff, config), /wrong resource/);
});

test("read-only access token cannot satisfy safe-write scope", () => {
  assert.throws(() => validateCommercialMcpTokenRecord({ ...token, scopes: ["commercial:read"] }, commercialStaff, config, "commercial:safe_write"), /insufficient scope/);
});
