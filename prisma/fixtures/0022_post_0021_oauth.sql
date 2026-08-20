-- Synthetic Better Auth 1.6.30 provider rows for the isolated 0022 replay.
INSERT INTO "Session" (
  "id", "expiresAt", "token", "createdAt", "updatedAt", "userId"
) VALUES (
  'ba17-oauth-session',
  CURRENT_TIMESTAMP + INTERVAL '1 hour',
  'ba17-oauth-session-token',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'ba17-credential-user'
);

INSERT INTO "oauthClient" (
  "id",
  "clientId",
  "disabled",
  "scopes",
  "createdAt",
  "updatedAt",
  "contacts",
  "redirectUris",
  "postLogoutRedirectUris",
  "tokenEndpointAuthMethod",
  "grantTypes",
  "responseTypes",
  "public",
  "type",
  "requirePKCE",
  "metadata"
) VALUES (
  'ba17-oauth-client-row',
  'ba17-chatgpt-client',
  false,
  ARRAY['commercial:read', 'commercial:safe_write', 'offline_access']::TEXT[],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  ARRAY[]::TEXT[],
  ARRAY['https://chatgpt.com/connector_platform_oauth_redirect']::TEXT[],
  ARRAY[]::TEXT[],
  'none',
  ARRAY['authorization_code', 'refresh_token']::TEXT[],
  ARRAY['code']::TEXT[],
  true,
  'web',
  true,
  '{"integration":"CHATGPT_WORK","b4gambleMcpResource":"http://localhost:4173/api/mcp/commercial"}'::JSONB
);

INSERT INTO "oauthRefreshToken" (
  "id", "token", "clientId", "sessionId", "userId", "expiresAt",
  "createdAt", "scopes"
) VALUES (
  'ba17-refresh-row',
  'synthetic-refresh-hash',
  'ba17-chatgpt-client',
  'ba17-oauth-session',
  'ba17-credential-user',
  CURRENT_TIMESTAMP + INTERVAL '30 days',
  CURRENT_TIMESTAMP,
  ARRAY['commercial:read', 'offline_access']::TEXT[]
);

INSERT INTO "oauthAccessToken" (
  "id", "token", "clientId", "sessionId", "userId", "refreshId",
  "expiresAt", "createdAt", "scopes"
) VALUES (
  'ba17-access-row',
  'synthetic-access-hash',
  'ba17-chatgpt-client',
  'ba17-oauth-session',
  'ba17-credential-user',
  'ba17-refresh-row',
  CURRENT_TIMESTAMP + INTERVAL '15 minutes',
  CURRENT_TIMESTAMP,
  ARRAY['commercial:read']::TEXT[]
);

INSERT INTO "oauthConsent" (
  "id", "clientId", "userId", "scopes", "createdAt", "updatedAt"
) VALUES (
  'ba17-consent-row',
  'ba17-chatgpt-client',
  'ba17-credential-user',
  ARRAY['commercial:read', 'offline_access']::TEXT[],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
