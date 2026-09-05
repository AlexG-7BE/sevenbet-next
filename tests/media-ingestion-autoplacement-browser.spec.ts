import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("Media Operations publishes separate OAuth metadata and fails closed without its exact bearer token", async ({ request }) => {
  const metadata = await request.get(`${baseUrl}/.well-known/oauth-protected-resource/api/mcp/media`);
  expect(metadata.status()).toBe(200);
  await expect(metadata.json()).resolves.toMatchObject({
    resource: `${baseUrl}/api/mcp/media`,
    authorization_servers: [baseUrl],
    scopes_supported: ["media:read", "media:safe_write", "offline_access"],
  });
  const anonymous = await request.post(`${baseUrl}/api/mcp/media`, {
    data: { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "media-test", version: "1" } } },
  });
  expect(anonymous.status()).toBe(401);
  expect(anonymous.headers()["www-authenticate"]).toContain("/.well-known/oauth-protected-resource/api/mcp/media");
  expect(anonymous.headers()["www-authenticate"]).not.toContain("/api/mcp/commercial");
});

test("dynamic registration binds a Media Operations client to only the media resource", async ({ request }) => {
  const response = await request.post(`${baseUrl}/api/mcp/oauth/register`, {
    data: {
      redirect_uris: ["https://chatgpt.com/connector_platform_oauth_redirect"],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      client_name: "B4GAMBLE Media Operations browser fixture",
      resource: `${baseUrl}/api/mcp/media`,
      scope: "media:read media:safe_write offline_access",
    },
  });
  expect([200, 201]).toContain(response.status());
  await expect(response.json()).resolves.toMatchObject({
    token_endpoint_auth_method: "none",
    scope: "media:read media:safe_write offline_access",
  });

  const crossResourceScope = await request.post(`${baseUrl}/api/mcp/oauth/register`, {
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
