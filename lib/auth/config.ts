import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { oauthProvider } from "@better-auth/oauth-provider";

import prisma from "@/lib/db/prisma";
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

type SevenBetAuthOptions = {
  autoSignIn?: boolean;
};

export function createSevenBetAuth({
  autoSignIn = true,
}: SevenBetAuthOptions = {}) {
  const runtimeConfig = resolveBetterAuthRuntimeConfig();
  const googleConfig = resolveGoogleAuthConfig();
  const commercialMcpResource = resolveCommercialMcpProviderResource();

  return betterAuth({
    appName: "B4GAMBLE",
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
    plugins: [
      oauthProvider({
        loginPage: "/admin/integrations/chatgpt-work/login",
        consentPage: "/admin/integrations/chatgpt-work/consent",
        accessTokenExpiresIn: 15 * 60,
        refreshTokenExpiresIn: 30 * 24 * 60 * 60,
        codeExpiresIn: 5 * 60,
        scopes: ["commercial:read", "commercial:safe_write", "offline_access"],
        grantTypes: ["authorization_code", "refresh_token"],
        allowDynamicClientRegistration: true,
        allowUnauthenticatedClientRegistration: true,
        allowPublicClientPrelogin: true,
        clientRegistrationDefaultScopes: ["commercial:read"],
        clientRegistrationAllowedScopes: [
          "commercial:read",
          "commercial:safe_write",
          "offline_access",
        ],
        resources: [
          {
            identifier: commercialMcpResource,
            name: "B4GAMBLE Commercial MCP",
            accessTokenTtl: 15 * 60,
            refreshTokenTtl: 30 * 24 * 60 * 60,
            allowedScopes: [
              "commercial:read",
              "commercial:safe_write",
              "offline_access",
            ],
          },
        ],
        resourceSeedMode: "insertOnly",
        enforcePerClientResources: true,
        clientRegistrationDefaultResources: [commercialMcpResource],
        clientRegistrationAllowedResources: [commercialMcpResource],
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
    ],
    disabledPaths: [...IDENTITY_ONLY_DISABLED_AUTH_PATHS],
    trustedOrigins: runtimeConfig.trustedOrigins,
  });
}
