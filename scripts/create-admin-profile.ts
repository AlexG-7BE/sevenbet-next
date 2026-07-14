import prisma from "../lib/db/prisma";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requiredEnvironmentVariable(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function createAdminProfile() {
  const email = requiredEnvironmentVariable("ADMIN_PROFILE_EMAIL").toLowerCase();
  const name = requiredEnvironmentVariable("ADMIN_PROFILE_NAME");

  if (!emailPattern.test(email)) {
    throw new Error("ADMIN_PROFILE_EMAIL must be a valid email address");
  }

  const matchingProfiles = await prisma.adminUser.findMany({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
      userId: true,
    },
    take: 2,
  });

  if (matchingProfiles.length > 1) {
    throw new Error("Multiple AdminUser records match the normalized email");
  }

  const existingProfile = matchingProfiles[0];
  const profile =
    existingProfile ??
    (await prisma.adminUser.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        role: "SUPER_ADMIN",
        userId: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        userId: true,
      },
    }));

  if (profile.role !== "SUPER_ADMIN") {
    throw new Error(
      "An AdminUser with this email already exists with a different role; no changes were made",
    );
  }

  if (profile.userId !== null) {
    throw new Error(
      "The existing AdminUser is already linked to a Better Auth user; no changes were made",
    );
  }

  console.info(existingProfile ? "AdminUser already exists" : "AdminUser created");
  console.info({
    adminUserId: profile.id,
    email: profile.email,
    role: profile.role,
  });
}

createAdminProfile()
  .catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Unknown profile creation failure";
    console.error(`AdminUser profile creation failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
