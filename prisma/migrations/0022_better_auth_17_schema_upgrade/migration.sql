-- PARTNER-OPS-WORK-BRIDGE-02
-- Coordinated Better Auth 1.7 account-identity and OAuth protected-resource
-- schema upgrade. Migration 0021 remains immutable.

BEGIN;

-- Better Auth 1.7 identifies accounts by the trusted (issuer, accountId) pair.
-- B4GAMBLE has only credential and Google accounts. Refuse any other state
-- rather than inventing an issuer.
ALTER TABLE "Account" ADD COLUMN "issuer" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Account"
    WHERE "providerId" NOT IN ('credential', 'google')
  ) THEN
    RAISE EXCEPTION 'Better Auth 1.7 account migration refused: unsupported provider rows exist';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Account"
    WHERE "providerId" = 'credential'
      AND "accountId" <> "userId"
  ) THEN
    RAISE EXCEPTION 'Better Auth 1.7 account migration refused: credential accountId/userId mismatch';
  END IF;
END $$;

UPDATE "Account"
SET "issuer" = CASE "providerId"
  WHEN 'credential' THEN 'local:credential'
  WHEN 'google' THEN 'https://accounts.google.com'
END;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Account"
    WHERE "issuer" IS NULL OR btrim("issuer") = ''
  ) THEN
    RAISE EXCEPTION 'Better Auth 1.7 account migration refused: issuer backfill is incomplete';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Account"
    GROUP BY "issuer", "accountId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Better Auth 1.7 account migration refused: issuer/accountId collision exists';
  END IF;
END $$;

ALTER TABLE "Account" ALTER COLUMN "issuer" SET NOT NULL;
CREATE UNIQUE INDEX "account_issuer_accountId_uidx"
ON "Account"("issuer", "accountId");

-- Keep the old 1.6 application safe while 0021 and 0022 are applied before
-- the 1.7 deployment. The trigger fills only the two documented B4GAMBLE
-- issuer namespaces and rejects every unknown provider.
CREATE FUNCTION "set_better_auth_account_issuer"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."issuer" IS NULL OR btrim(NEW."issuer") = '' THEN
    NEW."issuer" := CASE NEW."providerId"
      WHEN 'credential' THEN 'local:credential'
      WHEN 'google' THEN 'https://accounts.google.com'
      ELSE NULL
    END;
  END IF;

  IF NEW."providerId" = 'credential' THEN
    IF NEW."issuer" <> 'local:credential' OR NEW."accountId" <> NEW."userId" THEN
      RAISE EXCEPTION 'Invalid credential account identity';
    END IF;
  ELSIF NEW."providerId" = 'google' THEN
    IF NEW."issuer" <> 'https://accounts.google.com' THEN
      RAISE EXCEPTION 'Invalid Google account issuer';
    END IF;
  ELSE
    RAISE EXCEPTION 'Unsupported Better Auth account provider';
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER "Account_better_auth_issuer_compat"
BEFORE INSERT OR UPDATE OF "issuer", "providerId", "accountId", "userId"
ON "Account"
FOR EACH ROW
EXECUTE FUNCTION "set_better_auth_account_issuer"();

-- OAuth client fields introduced or renamed by @better-auth/oauth-provider
-- 1.7. The obsolete public/type columns remain temporarily for safe 1.6 code
-- rollback; 1.7 reads applicationType and tokenEndpointAuthMethod.
ALTER TABLE "oauthClient"
  ADD COLUMN "clientDiscoveryId" TEXT,
  ADD COLUMN "clientCredentialsScopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "backchannelLogoutUri" TEXT,
  ADD COLUMN "backchannelLogoutSessionRequired" BOOLEAN,
  ADD COLUMN "applicationType" TEXT,
  ADD COLUMN "jwks" TEXT,
  ADD COLUMN "jwksUri" TEXT,
  ADD COLUMN "dpopBoundAccessTokens" BOOLEAN DEFAULT false;

UPDATE "oauthClient"
SET "applicationType" = CASE
  WHEN "type" IN ('web', 'native') THEN "type"
  WHEN "public" = true AND "tokenEndpointAuthMethod" = 'none' THEN 'web'
  ELSE NULL
END;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "oauthClient"
    WHERE "applicationType" NOT IN ('web', 'native')
       OR "applicationType" IS NULL
       OR "public" IS DISTINCT FROM true
       OR "tokenEndpointAuthMethod" IS DISTINCT FROM 'none'
       OR NOT ("grantTypes" @> ARRAY['authorization_code', 'refresh_token']::TEXT[])
       OR "grantTypes" @> ARRAY['client_credentials']::TEXT[]
       OR NOT ("responseTypes" @> ARRAY['code']::TEXT[])
       OR "metadata" IS NULL
       OR jsonb_typeof("metadata") <> 'object'
       OR "metadata" ->> 'integration' IS DISTINCT FROM 'CHATGPT_WORK'
       OR "metadata" ->> 'b4gambleMcpResource' IS NULL
       OR (
         "metadata" ->> 'b4gambleMcpResource'
           !~ '^https://[A-Za-z0-9.-]+(:[0-9]+)?/api/mcp/commercial$'
         AND "metadata" ->> 'b4gambleMcpResource'
           !~ '^http://(localhost|127[.]0[.]0[.]1)(:[0-9]+)?/api/mcp/commercial$'
       )
  ) THEN
    RAISE EXCEPTION 'Better Auth 1.7 OAuth migration refused: unsupported client state exists';
  END IF;
END $$;

-- client_credentials remains unavailable unless a future administrator both
-- assigns scopes and changes the closed application policy.
UPDATE "oauthClient" SET "clientCredentialsScopes" = ARRAY[]::TEXT[];

CREATE TABLE "oauthResource" (
  "id" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "accessTokenTtl" INTEGER,
  "refreshTokenTtl" INTEGER,
  "signingAlgorithm" TEXT,
  "signingKeyId" TEXT,
  "allowedScopes" TEXT[] NOT NULL,
  "customClaims" JSONB,
  "dpopBoundAccessTokensRequired" BOOLEAN DEFAULT false,
  "disabled" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3),
  "policyVersion" INTEGER DEFAULT 1,
  "metadata" JSONB,

  CONSTRAINT "oauthResource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "oauthClientResource" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3),

  CONSTRAINT "oauthClientResource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "oauthResource_identifier_key"
ON "oauthResource"("identifier");
CREATE UNIQUE INDEX "oauthClientResource_clientId_resourceId_uidx"
ON "oauthClientResource"("clientId", "resourceId");
CREATE INDEX "oauthClientResource_clientId_idx"
ON "oauthClientResource"("clientId");
CREATE INDEX "oauthClientResource_resourceId_idx"
ON "oauthClientResource"("resourceId");

ALTER TABLE "oauthClientResource" ADD CONSTRAINT "oauthClientResource_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "oauthClient"("clientId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "oauthClientResource" ADD CONSTRAINT "oauthClientResource_resourceId_fkey"
FOREIGN KEY ("resourceId") REFERENCES "oauthResource"("identifier") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve any bounded 1.6 DCR client by deriving its one resource only from
-- the application-owned metadata written by the existing bridge.
INSERT INTO "oauthResource" (
  "id",
  "identifier",
  "name",
  "accessTokenTtl",
  "refreshTokenTtl",
  "allowedScopes",
  "dpopBoundAccessTokensRequired",
  "disabled",
  "createdAt",
  "updatedAt",
  "policyVersion"
)
SELECT DISTINCT
  'oauth_resource_' || md5("metadata" ->> 'b4gambleMcpResource'),
  "metadata" ->> 'b4gambleMcpResource',
  'B4GAMBLE Commercial MCP',
  900,
  2592000,
  ARRAY['commercial:read', 'commercial:safe_write', 'offline_access']::TEXT[],
  false,
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  1
FROM "oauthClient";

INSERT INTO "oauthClientResource" (
  "id",
  "clientId",
  "resourceId",
  "createdAt"
)
SELECT
  'oauth_client_resource_' || md5("clientId" || ':' || ("metadata" ->> 'b4gambleMcpResource')),
  "clientId",
  "metadata" ->> 'b4gambleMcpResource',
  COALESCE("createdAt", CURRENT_TIMESTAMP)
FROM "oauthClient";

-- Resource-bound tokens, replay protection, revocation and requested-claim
-- fields from the generated 1.7.1 provider schema.
ALTER TABLE "oauthRefreshToken"
  ADD COLUMN "authorizationCodeId" TEXT,
  ADD COLUMN "resources" TEXT[],
  ADD COLUMN "requestedUserInfoClaims" TEXT[],
  ADD COLUMN "rotatedAt" TIMESTAMP(3),
  ADD COLUMN "rotationReplayResponse" TEXT,
  ADD COLUMN "rotationReplayExpiresAt" TIMESTAMP(3),
  ADD COLUMN "confirmation" JSONB;

ALTER TABLE "oauthAccessToken"
  ADD COLUMN "authorizationCodeId" TEXT,
  ADD COLUMN "resources" TEXT[],
  ADD COLUMN "requestedUserInfoClaims" TEXT[],
  ADD COLUMN "revoked" TIMESTAMP(3),
  ADD COLUMN "confirmation" JSONB;

ALTER TABLE "oauthConsent"
  ADD COLUMN "resources" TEXT[],
  ADD COLUMN "requestedUserInfoClaims" TEXT[];

UPDATE "oauthRefreshToken" AS token
SET
  "resources" = ARRAY[client."metadata" ->> 'b4gambleMcpResource']::TEXT[],
  "requestedUserInfoClaims" = ARRAY[]::TEXT[]
FROM "oauthClient" AS client
WHERE client."clientId" = token."clientId";

UPDATE "oauthAccessToken" AS token
SET
  "resources" = ARRAY[client."metadata" ->> 'b4gambleMcpResource']::TEXT[],
  "requestedUserInfoClaims" = ARRAY[]::TEXT[]
FROM "oauthClient" AS client
WHERE client."clientId" = token."clientId";

UPDATE "oauthConsent" AS consent
SET
  "resources" = ARRAY[client."metadata" ->> 'b4gambleMcpResource']::TEXT[],
  "requestedUserInfoClaims" = ARRAY[]::TEXT[]
FROM "oauthClient" AS client
WHERE client."clientId" = consent."clientId";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "oauthRefreshToken"
    WHERE "resources" IS NULL OR "requestedUserInfoClaims" IS NULL
  ) OR EXISTS (
    SELECT 1 FROM "oauthAccessToken"
    WHERE "resources" IS NULL OR "requestedUserInfoClaims" IS NULL
  ) OR EXISTS (
    SELECT 1 FROM "oauthConsent"
    WHERE "resources" IS NULL OR "requestedUserInfoClaims" IS NULL
  ) THEN
    RAISE EXCEPTION 'Better Auth 1.7 OAuth migration refused: resource backfill is incomplete';
  END IF;
END $$;

-- During the migration-before-code window the old Better Auth 1.6 runtime may
-- still execute OAuth writes. It does not know the 1.7 resources columns. Fill
-- only an omitted resource from exactly one enabled client/resource relation;
-- never guess a resource and never permit an explicit token/consent resource
-- outside that relation. This keeps the overlap fail-closed and exact-resource
-- bound until the 1.7 application is promoted.
CREATE FUNCTION "set_better_auth_oauth_resource_compat"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  allowed_resource TEXT;
  allowed_count INTEGER;
BEGIN
  SELECT COUNT(*), MIN(client_resource."resourceId")
  INTO allowed_count, allowed_resource
  FROM "oauthClientResource" AS client_resource
  INNER JOIN "oauthResource" AS resource
    ON resource."identifier" = client_resource."resourceId"
  WHERE client_resource."clientId" = NEW."clientId"
    AND resource."disabled" IS DISTINCT FROM true;

  IF allowed_count <> 1 OR allowed_resource IS NULL THEN
    RAISE EXCEPTION 'OAuth resource compatibility refused: client must have exactly one enabled resource';
  END IF;

  IF NEW."resources" IS NULL OR cardinality(NEW."resources") = 0 THEN
    NEW."resources" := ARRAY[allowed_resource]::TEXT[];
  ELSIF cardinality(NEW."resources") <> 1 OR NEW."resources"[1] IS DISTINCT FROM allowed_resource THEN
    RAISE EXCEPTION 'OAuth resource compatibility refused: resource does not match client authority';
  END IF;

  IF NEW."requestedUserInfoClaims" IS NULL THEN
    NEW."requestedUserInfoClaims" := ARRAY[]::TEXT[];
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER "oauthRefreshToken_resource_compat"
BEFORE INSERT OR UPDATE OF "clientId", "resources", "requestedUserInfoClaims"
ON "oauthRefreshToken"
FOR EACH ROW
EXECUTE FUNCTION "set_better_auth_oauth_resource_compat"();

CREATE TRIGGER "oauthAccessToken_resource_compat"
BEFORE INSERT OR UPDATE OF "clientId", "resources", "requestedUserInfoClaims"
ON "oauthAccessToken"
FOR EACH ROW
EXECUTE FUNCTION "set_better_auth_oauth_resource_compat"();

CREATE TRIGGER "oauthConsent_resource_compat"
BEFORE INSERT OR UPDATE OF "clientId", "resources", "requestedUserInfoClaims"
ON "oauthConsent"
FOR EACH ROW
EXECUTE FUNCTION "set_better_auth_oauth_resource_compat"();

ALTER TABLE "oauthRefreshToken"
  ALTER COLUMN "resources" SET NOT NULL,
  ALTER COLUMN "requestedUserInfoClaims" SET NOT NULL,
  ALTER COLUMN "requestedUserInfoClaims" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "oauthAccessToken"
  ALTER COLUMN "resources" SET NOT NULL,
  ALTER COLUMN "requestedUserInfoClaims" SET NOT NULL,
  ALTER COLUMN "requestedUserInfoClaims" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "oauthConsent"
  ALTER COLUMN "resources" SET NOT NULL,
  ALTER COLUMN "requestedUserInfoClaims" SET NOT NULL,
  ALTER COLUMN "requestedUserInfoClaims" SET DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "oauthRefreshToken_authorizationCodeId_idx"
ON "oauthRefreshToken"("authorizationCodeId");
CREATE INDEX "oauthAccessToken_authorizationCodeId_idx"
ON "oauthAccessToken"("authorizationCodeId");

CREATE TABLE "oauthClientAssertion" (
  "id" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "oauthClientAssertion_pkey" PRIMARY KEY ("id")
);

COMMIT;
