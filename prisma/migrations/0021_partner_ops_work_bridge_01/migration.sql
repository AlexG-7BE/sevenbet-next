-- PARTNER-OPS-WORK-BRIDGE-01
-- Additive Better Auth OAuth provider storage for the bounded Commercial MCP
-- resource. No consumer-auth or Commercial CRM table is altered.

CREATE TABLE "OAuthApplication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "metadata" TEXT,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT,
    "redirectUrls" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OAuthAccessToken" (
    "id" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "accessTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "refreshTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT,
    "scopes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthAccessToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OAuthConsent" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "consentGiven" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthConsent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommercialMcpRateLimitBucket" (
    "bucketKey" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialMcpRateLimitBucket_pkey" PRIMARY KEY ("bucketKey")
);

CREATE UNIQUE INDEX "OAuthApplication_clientId_key" ON "OAuthApplication"("clientId");
CREATE INDEX "OAuthApplication_userId_idx" ON "OAuthApplication"("userId");
CREATE UNIQUE INDEX "OAuthAccessToken_accessToken_key" ON "OAuthAccessToken"("accessToken");
CREATE UNIQUE INDEX "OAuthAccessToken_refreshToken_key" ON "OAuthAccessToken"("refreshToken");
CREATE INDEX "OAuthAccessToken_clientId_idx" ON "OAuthAccessToken"("clientId");
CREATE INDEX "OAuthAccessToken_userId_idx" ON "OAuthAccessToken"("userId");
CREATE INDEX "OAuthConsent_clientId_idx" ON "OAuthConsent"("clientId");
CREATE INDEX "OAuthConsent_userId_idx" ON "OAuthConsent"("userId");
CREATE INDEX "CommercialMcpRateLimitBucket_expiresAt_idx" ON "CommercialMcpRateLimitBucket"("expiresAt");

ALTER TABLE "OAuthApplication"
ADD CONSTRAINT "OAuthApplication_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OAuthAccessToken"
ADD CONSTRAINT "OAuthAccessToken_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "OAuthApplication"("clientId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OAuthAccessToken"
ADD CONSTRAINT "OAuthAccessToken_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OAuthConsent"
ADD CONSTRAINT "OAuthConsent_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "OAuthApplication"("clientId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OAuthConsent"
ADD CONSTRAINT "OAuthConsent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
