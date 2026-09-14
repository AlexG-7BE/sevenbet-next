import { Prisma } from "@prisma/client";

import { createSevenBetAuth } from "../lib/auth/config";
import prisma from "../lib/db/prisma";

type BootstrapInput = {
  email: string;
  name: string;
  password: string;
  profileId: string;
};

type BootstrapUser = {
  id: string;
  email: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requiredEnvironmentVariable(
  name: string,
  { trim = true }: { trim?: boolean } = {},
) {
  const rawValue = process.env[name];
  const value = trim ? rawValue?.trim() : rawValue;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readBootstrapInput(): BootstrapInput {
  const email = requiredEnvironmentVariable("BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
  const name = requiredEnvironmentVariable("BOOTSTRAP_ADMIN_NAME");
  const password = requiredEnvironmentVariable("BOOTSTRAP_ADMIN_PASSWORD", {
    trim: false,
  });
  const profileId = requiredEnvironmentVariable("BOOTSTRAP_ADMIN_PROFILE_ID");

  if (!emailPattern.test(email)) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL must be a valid email address");
  }

  if (password.length < 12) {
    throw new Error("BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters");
  }

  if (!uuidPattern.test(profileId)) {
    throw new Error("BOOTSTRAP_ADMIN_PROFILE_ID must be a valid UUID");
  }

  return { email, name, password, profileId };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function findUniqueUserByEmail(email: string) {
  const users = await prisma.user.findMany({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      email: true,
    },
    take: 2,
  });

  if (users.length > 1) {
    throw new Error("Multiple Better Auth users match the normalized email");
  }

  return users[0] ?? null;
}

async function assertInitialStaffState(input: BootstrapInput) {
  const profile = await prisma.adminUser.findUnique({
    where: { id: input.profileId },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!profile) {
    throw new Error("No AdminUser exists for BOOTSTRAP_ADMIN_PROFILE_ID");
  }

  const staffWithEmail = await prisma.adminUser.findFirst({
    where: {
      id: { not: input.profileId },
      email: {
        equals: input.email,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (staffWithEmail) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL belongs to another staff profile");
  }

  if (!profile.userId) {
    return null;
  }

  const linkedUser = await prisma.user.findUnique({
    where: { id: profile.userId },
    select: {
      id: true,
      email: true,
    },
  });

  if (!linkedUser || normalizeEmail(linkedUser.email) !== input.email) {
    throw new Error("The selected AdminUser is already linked to another User");
  }

  return linkedUser;
}

async function assertUserIsAvailableForProfile(
  user: BootstrapUser,
  input: BootstrapInput,
) {
  if (normalizeEmail(user.email) !== input.email) {
    throw new Error("The Better Auth user email does not match the bootstrap email");
  }

  const linkedProfile = await prisma.adminUser.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (linkedProfile && linkedProfile.id !== input.profileId) {
    throw new Error("The Better Auth user is already linked to another AdminUser");
  }
}

async function createBetterAuthUser(input: BootstrapInput) {
  const bootstrapAuth = createSevenBetAuth({ autoSignIn: false });

  try {
    const result = await bootstrapAuth.api.signUpEmail({
      body: {
        email: input.email,
        name: input.name,
        password: input.password,
      },
    });

    return {
      id: result.user.id,
      email: result.user.email,
    };
  } catch {
    throw new Error(
      "Better Auth email/password signup failed; no staff profile was linked",
    );
  }
}

async function linkStaffProfile(user: BootstrapUser, input: BootstrapInput) {
  return prisma.$transaction(
    async (transaction) => {
      const profile = await transaction.adminUser.findUnique({
        where: { id: input.profileId },
        select: {
          id: true,
          userId: true,
        },
      });

      if (!profile) {
        throw new Error("The selected AdminUser no longer exists");
      }

      if (profile.userId && profile.userId !== user.id) {
        throw new Error("The selected AdminUser is already linked to another User");
      }

      const currentUser = await transaction.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
        },
      });

      if (!currentUser || normalizeEmail(currentUser.email) !== input.email) {
        throw new Error("The Better Auth user changed before staff linking");
      }

      const credentialAccountCount = await transaction.account.count({
        where: {
          userId: currentUser.id,
          providerId: "credential",
        },
      });

      if (credentialAccountCount !== 1) {
        throw new Error(
          "The Better Auth user must have exactly one credential account before staff linking",
        );
      }

      const conflictingProfile = await transaction.adminUser.findUnique({
        where: { userId: currentUser.id },
        select: { id: true },
      });

      if (conflictingProfile && conflictingProfile.id !== profile.id) {
        throw new Error("The Better Auth user is linked to another AdminUser");
      }

      const staffWithEmail = await transaction.adminUser.findFirst({
        where: {
          id: { not: profile.id },
          email: {
            equals: input.email,
            mode: "insensitive",
          },
        },
        select: { id: true },
      });

      if (staffWithEmail) {
        throw new Error("The bootstrap email belongs to another staff profile");
      }

      if (!profile.userId) {
        await transaction.adminUser.update({
          where: { id: profile.id },
          data: { userId: currentUser.id },
        });
      }

      const verifiedUser = await transaction.user.findUniqueOrThrow({
        where: { id: currentUser.id },
        select: {
          id: true,
          email: true,
        },
      });
      const verifiedProfile = await transaction.adminUser.findUniqueOrThrow({
        where: { id: profile.id },
        select: {
          id: true,
          userId: true,
          role: true,
        },
      });

      if (verifiedProfile.userId !== verifiedUser.id) {
        throw new Error("Staff link verification failed");
      }

      return {
        user: verifiedUser,
        profile: verifiedProfile,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}

async function bootstrapFirstAdmin() {
  const input = readBootstrapInput();
  const linkedUser = await assertInitialStaffState(input);
  const existingUser = linkedUser ?? (await findUniqueUserByEmail(input.email));
  const user = existingUser ?? (await createBetterAuthUser(input));

  await assertUserIsAvailableForProfile(user, input);

  const result = await linkStaffProfile(user, input);

  console.info("Better Auth staff bootstrap completed successfully");
  console.info({
    userId: result.user.id,
    userEmail: result.user.email,
    adminUserId: result.profile.id,
    adminUserUserId: result.profile.userId,
    adminUserRole: result.profile.role,
  });
}

bootstrapFirstAdmin()
  .catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Unknown bootstrap failure";
    console.error(`Better Auth staff bootstrap failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
