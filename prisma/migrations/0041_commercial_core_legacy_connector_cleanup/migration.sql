DROP TRIGGER "oauthClient_prepare_compat" ON "oauthClient";
DROP TRIGGER "oauthClient_resource_compat" ON "oauthClient";
DROP TRIGGER "oauthRefreshToken_resource_compat" ON "oauthRefreshToken";
DROP TRIGGER "oauthAccessToken_resource_compat" ON "oauthAccessToken";
DROP TRIGGER "oauthConsent_resource_compat" ON "oauthConsent";

DROP FUNCTION "prepare_better_auth_oauth_client_compat"();
DROP FUNCTION "sync_better_auth_oauth_client_resource_compat"();
DROP FUNCTION "set_better_auth_oauth_resource_compat"();

DROP TABLE "oauthAccessToken";
DROP TABLE "oauthConsent";
DROP TABLE "oauthClientResource";
DROP TABLE "oauthRefreshToken";
DROP TABLE "oauthClientAssertion";
DROP TABLE "CommercialMcpRateLimitBucket";
DROP TABLE "oauthResource";
DROP TABLE "oauthClient";
