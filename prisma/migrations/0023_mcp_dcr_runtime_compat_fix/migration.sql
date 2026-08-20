-- MCP DCR runtime fix
--
-- Migration 0022 added a legacy Better Auth 1.6 compatibility trigger that
-- intentionally fail-closed on unsupported OAuth client state. After the
-- Better Auth 1.7 runtime was promoted, its DCR flow correctly began creating
-- provider-owned oauthClient rows before the application-owned metadata update.
-- Those 1.7 inserts leave the legacy `public` column NULL and therefore must
-- not be treated as legacy 1.6 overlap writes.
--
-- Keep the strict legacy 1.6 guard for public=true clients, but allow the
-- bounded Better Auth 1.7 public-client shape through so the provider can own
-- oauthClientResource creation and the application can then attach its
-- CHATGPT_WORK metadata. client_credentials remains fail-closed.

BEGIN;

CREATE OR REPLACE FUNCTION "prepare_better_auth_oauth_client_compat"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  resource_identifier TEXT;
BEGIN
  IF NEW."clientCredentialsScopes" IS NULL THEN
    NEW."clientCredentialsScopes" := ARRAY[]::TEXT[];
  END IF;

  -- Better Auth 1.7 clients do not use the legacy public/type compatibility
  -- columns. The provider writes the protected-resource relation itself, while
  -- the B4GAMBLE DCR wrapper attaches its canonical integration metadata only
  -- after the provider client insert succeeds.
  IF NEW."public" IS DISTINCT FROM true THEN
    IF NEW."applicationType" IS DISTINCT FROM 'web'
       OR NEW."tokenEndpointAuthMethod" IS DISTINCT FROM 'none'
       OR cardinality(NEW."clientCredentialsScopes") <> 0
       OR NOT (NEW."grantTypes" @> ARRAY['authorization_code', 'refresh_token']::TEXT[])
       OR NEW."grantTypes" @> ARRAY['client_credentials']::TEXT[]
       OR NOT (NEW."responseTypes" @> ARRAY['code']::TEXT[])
    THEN
      RAISE EXCEPTION 'OAuth client compatibility refused: unsupported Better Auth 1.7 Commercial MCP client state';
    END IF;

    RETURN NEW;
  END IF;

  -- Legacy Better Auth 1.6 overlap path. Preserve the original 0022 guard
  -- exactly: only the already-approved B4GAMBLE public-client shape with
  -- application-owned CHATGPT_WORK resource metadata is accepted.
  IF NEW."applicationType" IS NULL THEN
    NEW."applicationType" := CASE
      WHEN NEW."type" IN ('web', 'native') THEN NEW."type"
      WHEN NEW."public" = true AND NEW."tokenEndpointAuthMethod" = 'none' THEN 'web'
      ELSE NULL
    END;
  END IF;

  resource_identifier := NEW."metadata" ->> 'b4gambleMcpResource';

  IF NEW."applicationType" NOT IN ('web', 'native')
     OR NEW."tokenEndpointAuthMethod" IS DISTINCT FROM 'none'
     OR cardinality(NEW."clientCredentialsScopes") <> 0
     OR NOT (NEW."grantTypes" @> ARRAY['authorization_code', 'refresh_token']::TEXT[])
     OR NEW."grantTypes" @> ARRAY['client_credentials']::TEXT[]
     OR NOT (NEW."responseTypes" @> ARRAY['code']::TEXT[])
     OR NEW."metadata" IS NULL
     OR jsonb_typeof(NEW."metadata") <> 'object'
     OR NEW."metadata" ->> 'integration' IS DISTINCT FROM 'CHATGPT_WORK'
     OR resource_identifier IS NULL
     OR (
       resource_identifier !~ '^https://[A-Za-z0-9.-]+(:[0-9]+)?/api/mcp/commercial$'
       AND resource_identifier !~ '^http://(localhost|127[.]0[.]0[.]1)(:[0-9]+)?/api/mcp/commercial$'
     )
  THEN
    RAISE EXCEPTION 'OAuth client compatibility refused: unsupported Commercial MCP client state';
  END IF;

  RETURN NEW;
END $$;

COMMIT;
