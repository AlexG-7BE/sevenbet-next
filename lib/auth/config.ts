import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import prisma from "@/lib/db/prisma";
import { databaseAwareBetterAuthLogger } from "@/lib/auth/database-availability";
import { resolveGoogleAuthConfig } from "@/lib/auth/google-config";
import {
  IDENTITY_ONLY_DISABLED_AUTH_PATHS,
  identityOnlyOAuthAccountDatabaseHooks,
} from "@/lib/auth/identity-only-oauth";
import { customerAuthDatabaseHooks } from "@/lib/customers/auth-hooks.server";
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
    logger: databaseAwareBetterAuthLogger,
    ...(runtimeConfig.baseURL ? { baseURL: runtimeConfig.baseURL } : {}),
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn,
      sendResetPassword: async ({ user, url }) => {
        const { sendAuthEmail } = await import("@/lib/email/service.server");
        await sendAuthEmail({ user, actionUrl: url, templateKey: "PASSWORD_RESET" });
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        const { sendAuthEmail } = await import("@/lib/email/service.server");
        await sendAuthEmail({ user, actionUrl: url, templateKey: "EMAIL_VERIFICATION" });
      },
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
    databaseHooks: {
      ...customerAuthDatabaseHooks,
      ...identityOnlyOAuthAccountDatabaseHooks,
    },
    disabledPaths: [...IDENTITY_ONLY_DISABLED_AUTH_PATHS],
    trustedOrigins: runtimeConfig.trustedOrigins,
  });
}
