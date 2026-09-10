import { expect, test, type APIResponse } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

async function expectRetired(response: APIResponse) {
  expect(response.status()).toBe(410);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["x-robots-tag"]).toContain("noindex");
  await expect(response.json()).resolves.toEqual({ error: "MEDIA_OPERATIONS_RETIRED" });
}

test("Media Operations discovery and MCP entry points are retired cache-proof", async ({ request }) => {
  const metadata = await request.get(`${baseUrl}/.well-known/oauth-protected-resource/api/mcp/media`);
  await expectRetired(metadata);
  const authorizationServer = await request.get(`${baseUrl}/.well-known/oauth-authorization-server/api/mcp/media`);
  await expectRetired(authorizationServer);
  const anonymous = await request.post(`${baseUrl}/api/mcp/media`, {
    data: { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "media-test", version: "1" } } },
  });
  await expectRetired(anonymous);
});

test("commercial DCR remains resource-bound while retired media is absent from operational routing", async ({ request }) => {
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
  await expectRetired(response);

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

  const commercialAuthorization = await authorize(commercialClient.client_id, `${baseUrl}/api/mcp/commercial`, "commercial:read commercial:safe_write offline_access");
  expect(commercialAuthorization.status()).toBe(303);
  expect(commercialAuthorization.headers().location).toContain("/admin/integrations/chatgpt-work/login");

  const commercialAgainstMedia = await authorize(commercialClient.client_id, `${baseUrl}/api/mcp/media`, "media:read media:safe_write offline_access");
  expect(commercialAgainstMedia.status()).toBe(503);
  expect(commercialAgainstMedia.headers()["cache-control"]).toContain("no-store");
  await expect(commercialAgainstMedia.json()).resolves.toEqual({
    error: "temporarily_unavailable",
    error_description: "Commercial MCP is not configured",
  });

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
  await expectRetired(crossResourceScope);
});

test("Media Operations Admin and APIs remain private and absent from public navigation", async ({ request, page }) => {
  const admin = await request.get(`${baseUrl}/admin/media-operations`, { maxRedirects: 0 });
  expect([302, 303, 307, 308]).toContain(admin.status());
  expect(admin.headers().location).toContain("/admin/login");
  const api = await request.get(`${baseUrl}/api/admin/media-operations/ingestions`);
  await expectRetired(api);
  await page.goto(baseUrl);
  await expect(page.locator('body > header a[href^="/admin/media-operations"], body > footer a[href^="/admin/media-operations"]')).toHaveCount(0);
});
