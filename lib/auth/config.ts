import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { mcp } from "better-auth/plugins";

import prisma from "@/lib/db/prisma";
import { resolveGoogleAuthConfig } from "@/lib/auth/google-config";
import {
  IDENTITY_ONLY_DISABLED_AUTH_PATHS,
  identityOnlyOAuthAccountDatabaseHooks,
} from "@/lib/auth/identity-only-oauth";
import { resolveBetterAuthRuntimeConfig } from "@/lib/auth/runtime-config";

type SevenBetAuthOptions = {
  autoSignIn?: boolean;
};

export function createSevenBetAuth({
  autoSignIn = true,
}: SevenBetAuthOptions = {}) {
  const runtimeConfig = resolveBetterAuthRuntimeConfig();
  const googleConfig = resolveGoogleAuthConfig();

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
      mcp({
        loginPage: "/admin/integrations/chatgpt-work/login",
        resource: "https://b4gamble.com/api/mcp/commercial",
        oidcConfig: {
          loginPage: "/admin/integrations/chatgpt-work/login",
          accessTokenExpiresIn: 15 * 60,
          refreshTokenExpiresIn: 30 * 24 * 60 * 60,
          codeExpiresIn: 5 * 60,
          requirePKCE: true,
          allowPlainCodeChallengeMethod: false,
          consentPage: "/admin/integrations/chatgpt-work/consent",
          defaultScope: "commercial:read",
          scopes: ["commercial:read", "commercial:safe_write"],
        },
      }),
    ],
    disabledPaths: [...IDENTITY_ONLY_DISABLED_AUTH_PATHS],
    trustedOrigins: runtimeConfig.trustedOrigins,
  });
}
