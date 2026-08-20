import assert from "node:assert/strict";
import test from "node:test";

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

const config = resolveCommercialMcpConfig("https://b4gamble.com/api/mcp/commercial", {
  COMMERCIAL_MCP_ENABLED: "true",
  COMMERCIAL_MCP_PUBLIC_ORIGIN: "https://b4gamble.com",
});
assert.ok(config);

const token = {
  id: "token-row-id",
  clientId: "chatgpt-client",
  userId: "staff-user-id",
  scopes: "commercial:read commercial:safe_write offline_access",
  accessTokenExpiresAt: new Date("2026-08-20T12:00:00.000Z"),
  client: {
    disabled: false,
    type: "public",
    metadata: JSON.stringify({ integration: "CHATGPT_WORK", b4gambleMcpResource: config.resource }),
  },
};
const commercialStaff = { id: "staff-id", userId: "staff-user-id", email: "staff@example.com", name: "Staff", role: "AFFILIATE_MANAGER" as const };

test("OAuth discovery advertises PKCE, DCR, refresh, revocation, resource, and exact scopes", () => {
  const server = commercialMcpAuthorizationServerMetadata(config);
  const resource = commercialMcpProtectedResourceMetadata(config);
  assert.deepEqual(server.code_challenge_methods_supported, ["S256"]);
  assert.deepEqual(server.grant_types_supported, ["authorization_code", "refresh_token"]);
  assert.equal(server.token_endpoint_auth_methods_supported.includes("none"), true);
  assert.equal(server.scopes_supported.includes("commercial:admin"), false);
  assert.equal(resource.resource, "https://b4gamble.com/api/mcp/commercial");
});

test("configuration is explicit and fails closed", () => {
  assert.equal(resolveCommercialMcpConfig("https://b4gamble.com/api/mcp/commercial", {}), null);
  assert.throws(() => resolveCommercialMcpConfig("https://b4gamble.com/api/mcp/commercial", {
    COMMERCIAL_MCP_ENABLED: "true",
    COMMERCIAL_MCP_PUBLIC_ORIGIN: "http://example.com",
  }));
});

test("DCR accepts only current ChatGPT callback shapes", () => {
  assert.equal(isAllowedChatGptRedirect("https://chatgpt.com/connector_platform_oauth_redirect"), true);
  assert.equal(isAllowedChatGptRedirect("https://chatgpt.com/connector/oauth/abcdefgh"), true);
  assert.equal(isAllowedChatGptRedirect("https://evil.example/connector/oauth/abcdefgh"), false);
  assert.equal(isAllowedChatGptRedirect("https://chatgpt.com/connector/oauth/abcdefgh?next=evil"), false);
});

test("valid commercial staff token is accepted for read and safe write", () => {
  const context = validateCommercialMcpTokenRecord(token, commercialStaff, config, "commercial:safe_write", new Date("2026-08-20T10:00:00.000Z"));
  assert.equal(context.staff.id, "staff-id");
  assert.equal(context.scopes.has("commercial:read"), true);
});

test("consumer, unprivileged staff, expired token, wrong resource, and insufficient scope are denied", () => {
  assert.throws(() => validateCommercialMcpTokenRecord(token, null, config), CommercialMcpAuthError);
  assert.throws(() => validateCommercialMcpTokenRecord(token, { ...commercialStaff, role: "AUTHOR" }, config), /affiliate\.manage/);
  assert.throws(() => validateCommercialMcpTokenRecord(token, commercialStaff, config, undefined, new Date("2026-08-20T13:00:00.000Z")), /expired/);
  assert.throws(() => validateCommercialMcpTokenRecord({ ...token, client: { ...token.client, metadata: JSON.stringify({ integration: "CHATGPT_WORK", b4gambleMcpResource: "https://b4gamble.com/api/mcp/other" }) } }, commercialStaff, config), /wrong resource/);
  assert.throws(() => validateCommercialMcpTokenRecord({ ...token, scopes: "commercial:read" }, commercialStaff, config, "commercial:safe_write"), /insufficient scope/);
});
