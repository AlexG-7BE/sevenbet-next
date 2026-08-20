import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("Commercial MCP exposes bounded OAuth discovery and fails closed without a bearer token", async ({ request }) => {
  const authorizationServer = await request.get(`${baseUrl}/.well-known/oauth-authorization-server`);
  expect(authorizationServer.status()).toBe(200);
  expect(authorizationServer.headers()["cache-control"]).toContain("no-store");
  await expect(authorizationServer.json()).resolves.toMatchObject({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/mcp/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/mcp/oauth/token`,
    registration_endpoint: `${baseUrl}/api/mcp/oauth/register`,
    revocation_endpoint: `${baseUrl}/api/mcp/oauth/revoke`,
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    authorization_response_iss_parameter_supported: true,
  });

  const resource = await request.get(`${baseUrl}/.well-known/oauth-protected-resource/api/mcp/commercial`);
  expect(resource.status()).toBe(200);
  await expect(resource.json()).resolves.toMatchObject({
    resource: `${baseUrl}/api/mcp/commercial`,
    authorization_servers: [baseUrl],
    scopes_supported: ["commercial:read", "commercial:safe_write"],
  });

  const anonymous = await request.post(`${baseUrl}/api/mcp/commercial`, {
    data: {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "browser-test", version: "1" } },
    },
  });
  expect(anonymous.status()).toBe(401);
  expect(anonymous.headers()["cache-control"]).toContain("no-store");
  expect(anonymous.headers()["www-authenticate"]).toContain("/.well-known/oauth-protected-resource/api/mcp/commercial");

  const unsupported = await request.get(`${baseUrl}/api/mcp/commercial`);
  expect(unsupported.status()).toBe(405);
  expect(unsupported.headers().allow).toBe("POST");
});

test("provider internals and untrusted OAuth registration remain unreachable", async ({ request }) => {
  const internal = await request.post(`${baseUrl}/api/auth/oauth2/register`, {
    data: { redirect_uris: ["https://chatgpt.com/connector_platform_oauth_redirect"] },
  });
  expect(internal.status()).toBe(404);

  const untrusted = await request.post(`${baseUrl}/api/mcp/oauth/register`, {
    data: {
      redirect_uris: ["https://attacker.invalid/callback"],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      client_name: "Untrusted client",
    },
  });
  expect(untrusted.status()).toBe(400);
  await expect(untrusted.json()).resolves.toMatchObject({ error: "invalid_client_metadata" });

  const registration = await request.post(`${baseUrl}/api/mcp/oauth/register`, {
    data: {
      redirect_uris: ["https://chatgpt.com/connector_platform_oauth_redirect"],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      client_name: "B4GAMBLE Commercial Ops browser fixture",
    },
  });
  expect([200, 201]).toContain(registration.status());
  const client = await registration.json();
  expect(client.client_id).toEqual(expect.any(String));
  expect(client.token_endpoint_auth_method).toBe("none");
  expect(client.application_type).toBe("web");
  expect(client.client_secret).toBeUndefined();

  const dcrAlone = await request.post(`${baseUrl}/api/mcp/commercial`, {
    headers: { Authorization: `Bearer ${client.client_id}` },
    data: {
      jsonrpc: "2.0",
      id: 2,
      method: "initialize",
      params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "dcr-only", version: "1" } },
    },
  });
  expect(dcrAlone.status()).toBe(401);

  const clientCredentials = await request.post(`${baseUrl}/api/mcp/oauth/token`, {
    form: {
      grant_type: "client_credentials",
      client_id: client.client_id,
      resource: `${baseUrl}/api/mcp/commercial`,
      scope: "commercial:read",
    },
  });
  expect(clientCredentials.status()).toBe(400);
  await expect(clientCredentials.json()).resolves.toMatchObject({ error: "invalid_request" });
});

test("anonymous staff authorization entry renders the explicit authority boundary", async ({ page }) => {
  await page.goto("/admin/integrations/chatgpt-work/login");
  await expect(page.getByRole("heading", { name: "Sign in to continue to ChatGPT Work" })).toBeVisible();
  await expect(page.getByText("A normal customer account cannot authorize this integration.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

test("Commercial MCP consent page alone permits the exact ChatGPT form-return origin", async ({ request }) => {
  const consent = await request.get(`${baseUrl}/admin/integrations/chatgpt-work/consent?response_type=code`, {
    maxRedirects: 0,
    headers: { Origin: "https://chatgpt.com" },
  });
  const consentPolicy = consent.headers()["content-security-policy"] ?? "";
  expect(consentPolicy).toContain("form-action 'self' https://chatgpt.com");

  const login = await request.get(`${baseUrl}/admin/integrations/chatgpt-work/login`, { maxRedirects: 0 });
  const loginPolicy = login.headers()["content-security-policy"] ?? "";
  expect(loginPolicy).toContain("form-action 'self'");
  expect(loginPolicy).not.toContain("form-action 'self' https://chatgpt.com");
});
