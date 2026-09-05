import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("Media Operations publishes separate OAuth metadata and fails closed without its exact bearer token", async ({ request }) => {
  const metadata = await request.get(`${baseUrl}/.well-known/oauth-protected-resource/api/mcp/media`);
  expect(metadata.status()).toBe(200);
  await expect(metadata.json()).resolves.toMatchObject({
    resource: `${baseUrl}/api/mcp/media`,
    authorization_servers: [`${baseUrl}/api/mcp/media`],
    scopes_supported: ["media:read", "media:safe_write", "offline_access"],
  });
  const authorizationServer = await request.get(`${baseUrl}/.well-known/oauth-authorization-server/api/mcp/media`);
  expect(authorizationServer.status()).toBe(200);
  await expect(authorizationServer.json()).resolves.toMatchObject({
    issuer: `${baseUrl}/api/mcp/media`,
    registration_endpoint: `${baseUrl}/api/mcp/oauth/register/media`,
    authorization_endpoint: `${baseUrl}/api/mcp/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/mcp/oauth/token`,
    scopes_supported: ["media:read", "media:safe_write", "offline_access"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
  });
  const anonymous = await request.post(`${baseUrl}/api/mcp/media`, {
    data: { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "media-test", version: "1" } } },
  });
  expect(anonymous.status()).toBe(401);
  expect(anonymous.headers()["www-authenticate"]).toContain("/.well-known/oauth-protected-resource/api/mcp/media");
  expect(anonymous.headers()["www-authenticate"]).not.toContain("/api/mcp/commercial");
});

test("discriminator-free DCR binds each discovery path to one resource and rejects cross-resource authorization", async ({ request }) => {
  const registrationBody = {
    redirect_uris: ["https://chatgpt.com/connector_platform_oauth_redirect"],
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    client_name: "ChatGPT",
  };
  const response = await request.post(`${baseUrl}/api/mcp/oauth/register/media`, {
    data: registrationBody,
  });
  expect([200, 201]).toContain(response.status());
  const mediaClient = await response.json();
  expect(mediaClient).toMatchObject({
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code", "refresh_token"],
    scope: "media:read media:safe_write offline_access",
  });
  expect(mediaClient.client_secret).toBeUndefined();

  const commercialRegistration = await request.post(`${baseUrl}/api/mcp/oauth/register`, {
    data: registrationBody,
  });
  expect([200, 201]).toContain(commercialRegistration.status());
  const commercialClient = await commercialRegistration.json();
  expect(commercialClient).toMatchObject({
    token_endpoint_auth_method: "none",
    grant_types: ["authorization_code", "refresh_token"],
    scope: "commercial:read commercial:safe_write offline_access",
  });
  expect(commercialClient.client_secret).toBeUndefined();

  const scopeHintOnly = await request.post(`${baseUrl}/api/mcp/oauth/register`, {
    data: { ...registrationBody, scope: "media:read media:safe_write offline_access" },
  });
  expect(scopeHintOnly.status()).toBe(400);
  await expect(scopeHintOnly.json()).resolves.toMatchObject({ error: "invalid_scope" });

  const authorize = (clientId: string, resource: string, scope: string) => {
    const query = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: "https://chatgpt.com/connector_platform_oauth_redirect",
      scope,
      state: "dcr-resource-fixture",
      code_challenge: "A".repeat(43),
      code_challenge_method: "S256",
      resource,
    });
    return request.get(`${baseUrl}/api/mcp/oauth/authorize?${query}`, { maxRedirects: 0 });
  };

  const mediaAuthorization = await authorize(mediaClient.client_id, `${baseUrl}/api/mcp/media`, "media:read media:safe_write offline_access");
  expect(mediaAuthorization.status()).toBe(303);
  expect(mediaAuthorization.headers().location).toContain("/admin/integrations/chatgpt-work/login");

  const mediaAgainstCommercial = await authorize(mediaClient.client_id, `${baseUrl}/api/mcp/commercial`, "commercial:read commercial:safe_write offline_access");
  expect(mediaAgainstCommercial.status()).toBe(401);
  await expect(mediaAgainstCommercial.json()).resolves.toMatchObject({ error: "invalid_target" });

  const commercialAuthorization = await authorize(commercialClient.client_id, `${baseUrl}/api/mcp/commercial`, "commercial:read commercial:safe_write offline_access");
  expect(commercialAuthorization.status()).toBe(303);
  expect(commercialAuthorization.headers().location).toContain("/admin/integrations/chatgpt-work/login");

  const commercialAgainstMedia = await authorize(commercialClient.client_id, `${baseUrl}/api/mcp/media`, "media:read media:safe_write offline_access");
  expect(commercialAgainstMedia.status()).toBe(401);
  await expect(commercialAgainstMedia.json()).resolves.toMatchObject({ error: "invalid_target" });

  const crossResourceScope = await request.post(`${baseUrl}/api/mcp/oauth/register/media`, {
    data: {
      redirect_uris: ["https://chatgpt.com/connector_platform_oauth_redirect"],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      client_name: "Cross-resource scope fixture",
      resource: `${baseUrl}/api/mcp/media`,
      scope: "commercial:read",
    },
  });
  expect(crossResourceScope.status()).toBe(400);
  await expect(crossResourceScope.json()).resolves.toMatchObject({ error: "invalid_scope" });
});

test("Media Operations Admin and APIs remain private and absent from public navigation", async ({ request, page }) => {
  const admin = await request.get(`${baseUrl}/admin/media-operations`, { maxRedirects: 0 });
  expect([302, 303, 307, 308]).toContain(admin.status());
  expect(admin.headers().location).toContain("/admin/login");
  const api = await request.get(`${baseUrl}/api/admin/media-operations/ingestions`);
  expect(api.status()).toBe(401);
  await page.goto(baseUrl);
  await expect(page.locator('body > header a[href^="/admin/media-operations"], body > footer a[href^="/admin/media-operations"]')).toHaveCount(0);
});
