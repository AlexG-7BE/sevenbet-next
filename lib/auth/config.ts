import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins";

import prisma from "@/lib/db/prisma";
import { databaseAwareBetterAuthLogger } from "@/lib/auth/database-availability";
import { resolveGoogleAuthConfig } from "@/lib/auth/google-config";
import {
  IDENTITY_ONLY_DISABLED_AUTH_PATHS,
  identityOnlyOAuthAccountDatabaseHooks,
} from "@/lib/auth/identity-only-oauth";
import { customerAuthDatabaseHooks } from "@/lib/customers/auth-hooks.server";
import { resolveBetterAuthRuntimeConfig } from "@/lib/auth/runtime-config";
import {
  adminMfaDatabaseHooks,
  adminMfaRequestHooks,
} from "@/lib/auth/admin-mfa.server";

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
      user: {
        create: customerAuthDatabaseHooks.user.create,
        update: {
          before: customerAuthDatabaseHooks.user.update.before,
          after: adminMfaDatabaseHooks.user?.update?.after,
        },
      },
      session: {
        create: {
          before: adminMfaDatabaseHooks.session?.create?.before,
          after: customerAuthDatabaseHooks.session.create.after,
        },
      },
      account: identityOnlyOAuthAccountDatabaseHooks.account,
    },
    hooks: adminMfaRequestHooks,
    plugins: [
      twoFactor({
        issuer: "B4GAMBLE Admin",
        skipVerificationOnEnable: false,
        trustDeviceMaxAge: 0,
        totpOptions: {
          digits: 6,
          period: 30,
        },
        backupCodeOptions: {
          storeBackupCodes: "encrypted",
        },
        accountLockout: {
          enabled: true,
          maxFailedAttempts: 10,
          durationSeconds: 900,
        },
      }),
    ],
    // Vercel Firewall is the distributed public auth limiter. Better Auth's
    // in-process memory store is disabled so serverless instances cannot apply
    // inconsistent per-instance budgets.
    rateLimit: { enabled: false },
    disabledPaths: [
      ...IDENTITY_ONLY_DISABLED_AUTH_PATHS,
      "/two-factor/disable",
      "/two-factor/send-otp",
      "/two-factor/verify-otp",
    ],
    trustedOrigins: runtimeConfig.trustedOrigins,
  });
}
