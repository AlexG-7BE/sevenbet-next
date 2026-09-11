import "server-only";

import { randomUUID } from "node:crypto";

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
      const updated = await transaction.$queryRaw<Array<{ id: string }>>`
        INSERT INTO "CustomerEmailPreference" (
          "id", "userId", "marketingAllowed", "consentedAt", "createdAt", "updatedAt"
        ) VALUES (
          ${randomUUID()}::uuid, ${userId}, true, ${now}, ${now}, ${now}
        )
        ON CONFLICT ("userId") DO UPDATE SET
          "marketingAllowed" = true,
          "consentedAt" = ${now},
          "unsubscribedAt" = NULL,
          "suppressionScope" = 'NONE'::"EmailSuppressionScope",
          "suppressedAt" = NULL,
          "suppressionReason" = NULL,
          "updatedAt" = ${now}
        WHERE "CustomerEmailPreference"."suppressionScope" = 'NONE'::"EmailSuppressionScope"
          OR (
            "CustomerEmailPreference"."suppressionScope" = 'MARKETING'::"EmailSuppressionScope"
            AND "CustomerEmailPreference"."suppressionReason" = 'UNSUBSCRIBE'
          )
        RETURNING "id"
      `;
      if (!updated.length) throw new Error("Email suppression cannot be removed by a marketing preference");
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
