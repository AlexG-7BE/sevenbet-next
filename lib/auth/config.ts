import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import prisma from "@/lib/db/prisma";
import { resolveBetterAuthRuntimeConfig } from "@/lib/auth/runtime-config";

type SevenBetAuthOptions = {
  autoSignIn?: boolean;
};

export function createSevenBetAuth({
  autoSignIn = true,
}: SevenBetAuthOptions = {}) {
  const runtimeConfig = resolveBetterAuthRuntimeConfig();

  return betterAuth({
    appName: "SevenBet",
    ...(runtimeConfig.baseURL ? { baseURL: runtimeConfig.baseURL } : {}),
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn,
    },
    trustedOrigins: runtimeConfig.trustedOrigins,
  });
}
