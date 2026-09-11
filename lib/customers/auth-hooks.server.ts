import "server-only";

import prisma from "@/lib/db/prisma";

type AuthUserWrite = { id: string; email: string } & Record<string, unknown>;
type AuthSessionWrite = { userId: string } & Record<string, unknown>;

export function normalizeCustomerEmail(value: string) {
  return value.trim().toLowerCase();
}

/**
 * Registry invariants that apply to every Better Auth provider, including
 * Google callback paths that do not pass through the email-auth POST wrapper.
 * Optional projection/queue failures are contained so authentication remains
 * authoritative and available.
 */
export const customerAuthDatabaseHooks = {
  user: {
    create: {
      before: async (user: AuthUserWrite) => ({
        data: { ...user, email: normalizeCustomerEmail(user.email) },
      }),
      after: async (user: AuthUserWrite) => {
        try {
          await prisma.customerEmailPreference.upsert({
            where: { userId: user.id },
            create: { userId: user.id },
            update: {},
          });
        } catch {
          console.warn("[customer] registry preference initialization failed", {
            customer_failure_category: "database",
          });
        }
      },
    },
    update: {
      before: async (user: Partial<AuthUserWrite>) => ({
        data: {
          ...user,
          ...(typeof user.email === "string" ? { email: normalizeCustomerEmail(user.email) } : {}),
        },
      }),
    },
  },
  session: {
    create: {
      after: async (session: AuthSessionWrite) => {
        const observedAt = new Date();
        let recentlyCreated = false;
        try {
          const user = await prisma.user.update({
            where: { id: session.userId },
            data: { lastSeenAt: observedAt },
            select: { createdAt: true },
          });
          recentlyCreated = Math.abs(observedAt.getTime() - user.createdAt.getTime()) <= 60_000;
        } catch {
          console.warn("[customer] last-seen projection failed", {
            customer_failure_category: "database",
          });
        }
        if (recentlyCreated) {
          try {
            const { queueWelcomeEmail } = await import("@/lib/email/service.server");
            await queueWelcomeEmail(session.userId);
          } catch {
            console.warn("[email] welcome queue failed", {
              email_failure_category: "queue",
            });
          }
        }
      },
    },
  },
};
