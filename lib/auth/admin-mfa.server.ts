import "server-only";

import { APIError, type BetterAuthOptions } from "better-auth";
import { createAuthMiddleware, getSessionFromCtx } from "better-auth/api";

import prisma from "@/lib/db/prisma";
import {
  isAdminMfaManagementPath,
  isAllowedAdminSessionCreationPath,
} from "@/lib/auth/admin-mfa-policy";

type DatabaseHooks = NonNullable<BetterAuthOptions["databaseHooks"]>;

export const adminMfaDatabaseHooks = {
  user: {
    update: {
      after: async (user, context) => {
        if (
          context?.path !== "/two-factor/verify-totp" ||
          user.twoFactorEnabled !== true
        ) {
          return;
        }

        const adminUser = await prisma.adminUser.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        if (!adminUser) return;

        // Enrollment changes the privileged account's authentication strength.
        // Revoke every pre-enrollment session before Better Auth issues the
        // replacement session for the verified TOTP request.
        await context.context.internalAdapter.deleteUserSessions(user.id);
      },
    },
  },
  session: {
    create: {
      before: async (session, context) => {
        const adminUser = await prisma.adminUser.findUnique({
          where: { userId: session.userId },
          select: { id: true },
        });
        if (!adminUser) return;

        if (!isAllowedAdminSessionCreationPath(context?.path)) {
          throw APIError.from("FORBIDDEN", {
            code: "ADMIN_MFA_REQUIRED",
            message: "Privileged sign-in requires email, password, and a second factor.",
          });
        }
      },
    },
  },
} satisfies DatabaseHooks;

export const adminMfaRequestHooks = {
  before: createAuthMiddleware(async (context) => {
    if (!isAdminMfaManagementPath(context.path)) return;

    const session = await getSessionFromCtx(context, {
      disableCookieCache: true,
      disableRefresh: true,
    });
    if (!session) {
      throw APIError.from("UNAUTHORIZED", {
        code: "ADMIN_AUTH_REQUIRED",
        message: "Admin authentication is required.",
      });
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!adminUser) {
      throw APIError.from("FORBIDDEN", {
        code: "STAFF_ACCESS_REQUIRED",
        message: "A linked B4GAMBLE staff profile is required.",
      });
    }
  }),
};
