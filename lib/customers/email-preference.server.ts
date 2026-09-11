import "server-only";

import prisma from "@/lib/db/prisma";

export type CustomerEmailPreferenceInput = {
  locale: string | null;
  marketingAllowed: boolean;
  policyVersion: string | null;
  source: "PROGRAMME_SIGNUP" | "ACCOUNT_PREFERENCES";
};

export async function readCustomerEmailPreference(userId: string) {
  return prisma.customerEmailPreference.findUnique({ where: { userId } });
}

export async function updateCustomerEmailPreference(
  userId: string,
  input: CustomerEmailPreferenceInput,
) {
  const now = new Date();
  await prisma.$transaction(async (transaction) => {
    if (input.marketingAllowed) {
      const liftAllowedPreference = () => transaction.customerEmailPreference.updateMany({
        where: {
          userId,
          OR: [
            { suppressionScope: "NONE" },
            { suppressionScope: "MARKETING", suppressionReason: "UNSUBSCRIBE" },
          ],
        },
        data: {
          marketingAllowed: true,
          consentedAt: now,
          unsubscribedAt: null,
          suppressionScope: "NONE",
          suppressedAt: null,
          suppressionReason: null,
        },
      });
      let updated = await liftAllowedPreference();
      if (!updated.count) {
        try {
          await transaction.customerEmailPreference.create({
            data: { userId, marketingAllowed: true, consentedAt: now },
          });
          updated = { count: 1 };
        } catch (error) {
          const unique = Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
          if (!unique) throw error;
          updated = await liftAllowedPreference();
        }
      }
      if (!updated.count) throw new Error("Email suppression cannot be removed by a marketing preference");
    } else {
      await transaction.customerEmailPreference.upsert({
        where: { userId },
        create: { userId, marketingAllowed: false, unsubscribedAt: now },
        update: { marketingAllowed: false, unsubscribedAt: now },
      });
    }
    await transaction.consentEvent.create({
      data: {
        userId,
        purpose: "MARKETING_EMAIL",
        action: input.marketingAllowed ? "GRANTED" : "WITHDRAWN",
        source: input.source,
        policyVersion: input.policyVersion,
        locale: input.locale,
        occurredAt: now,
      },
    });
  });
  return { marketingAllowed: input.marketingAllowed };
}
