import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { oauthProvider } from "@better-auth/oauth-provider";

import prisma from "@/lib/db/prisma";
import { databaseAwareBetterAuthLogger } from "@/lib/auth/database-availability";
import { resolveGoogleAuthConfig } from "@/lib/auth/google-config";
import {
  IDENTITY_ONLY_DISABLED_AUTH_PATHS,
  identityOnlyOAuthAccountDatabaseHooks,
} from "@/lib/auth/identity-only-oauth";
import { resolveBetterAuthRuntimeConfig } from "@/lib/auth/runtime-config";
import {
  commercialMcpProviderTokenStorage,
  resolveCommercialMcpProviderResource,
} from "@/lib/mcp/commercial/provider";
import { resolveMediaMcpProviderResource } from "@/lib/mcp/media/provider";

const COMMERCIAL_MCP_DURABLE_TOKEN_TTL_SECONDS = 10 * 365 * 24 * 60 * 60;

type SevenBetAuthOptions = {
  autoSignIn?: boolean;
  operationalMcpProvider?: boolean;
};

export function createSevenBetAuth({
  autoSignIn = true,
  operationalMcpProvider = true,
}: SevenBetAuthOptions = {}) {
  const runtimeConfig = resolveBetterAuthRuntimeConfig();
  const googleConfig = resolveGoogleAuthConfig();
  const operationalMcpPlugins = operationalMcpProvider
    ? (() => {
        const commercialMcpResource = resolveCommercialMcpProviderResource();
        const mediaMcpResource = resolveMediaMcpProviderResource();
        return [
          oauthProvider({
            loginPage: "/admin/integrations/chatgpt-work/login",
            consentPage: "/admin/integrations/chatgpt-work/consent",
            accessTokenExpiresIn: COMMERCIAL_MCP_DURABLE_TOKEN_TTL_SECONDS,
            refreshTokenExpiresIn: COMMERCIAL_MCP_DURABLE_TOKEN_TTL_SECONDS,
            codeExpiresIn: 5 * 60,
            scopes: ["commercial:read", "commercial:safe_write", "media:read", "media:safe_write", "offline_access"],
            grantTypes: ["authorization_code", "refresh_token"],
            allowDynamicClientRegistration: true,
            allowUnauthenticatedClientRegistration: true,
            allowPublicClientPrelogin: true,
            clientRegistrationDefaultScopes: ["commercial:read"],
            clientRegistrationAllowedScopes: [
              "commercial:read",
              "commercial:safe_write",
              "media:read",
              "media:safe_write",
              "offline_access",
            ],
            resources: [
              {
                identifier: commercialMcpResource,
                name: "B4GAMBLE Commercial MCP",
                accessTokenTtl: COMMERCIAL_MCP_DURABLE_TOKEN_TTL_SECONDS,
                refreshTokenTtl: COMMERCIAL_MCP_DURABLE_TOKEN_TTL_SECONDS,
                allowedScopes: [
                  "commercial:read",
                  "commercial:safe_write",
                  "offline_access",
                ],
              },
              {
                identifier: mediaMcpResource,
                name: "B4GAMBLE Media Operations MCP",
                accessTokenTtl: COMMERCIAL_MCP_DURABLE_TOKEN_TTL_SECONDS,
                refreshTokenTtl: COMMERCIAL_MCP_DURABLE_TOKEN_TTL_SECONDS,
                allowedScopes: ["media:read", "media:safe_write", "offline_access"],
              },
            ],
            resourceSeedMode: "merge",
            enforcePerClientResources: true,
            clientRegistrationDefaultResources: [commercialMcpResource],
            clientRegistrationAllowedResources: [commercialMcpResource, mediaMcpResource],
            refreshTokenReuseInterval: 0,
            clientPrivileges: () => false,
            disableJwtPlugin: true,
            storeTokens: commercialMcpProviderTokenStorage,
            prefix: {
              opaqueAccessToken: "b4mcp_at_",
              refreshToken: "b4mcp_rt_",
              clientSecret: "b4mcp_cs_",
            },
          }),
        ];
      })()
    : [];

  return betterAuth({
    appName: "B4GAMBLE",
    logger: databaseAwareBetterAuthLogger,
    ...(runtimeConfig.baseURL ? { baseURL: runtimeConfig.baseURL } : {}),
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn,
    },
    account: {
      encryptOAuthTokens: true,
      updateAccountOnSignIn: false,
      accountLinking: {
        enabled: true,
        disableImplicitLinking: false,
        requireLocalEmailVerified: true,
        allowDifferentEmails: false,
        allowUnlinkingAll: false,
        updateUserInfoOnLink: false,
      },
    },
    ...(googleConfig
      ? {
          socialProviders: {
            google: {
              ...googleConfig,
              accessType: "online" as const,
              disableIdTokenSignIn: true,
              disableImplicitSignUp: true,
            },
          },
        }
      : {}),
    databaseHooks: identityOnlyOAuthAccountDatabaseHooks,
    plugins: operationalMcpPlugins,
    disabledPaths: [...IDENTITY_ONLY_DISABLED_AUTH_PATHS],
    trustedOrigins: runtimeConfig.trustedOrigins,
  });
}
