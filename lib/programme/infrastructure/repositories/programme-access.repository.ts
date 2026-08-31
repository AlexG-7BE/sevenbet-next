import { Prisma, type ProgrammeAccessAcceptanceSource } from "@prisma/client";

export type ProgrammeAccessAcceptanceInput = {
  adultSelfAttestedAt: Date;
  termsAcceptedAt: Date;
  privacyAcknowledgedAt: Date;
  termsVersionAtAcceptance: string | null;
  privacyVersionAtAcceptance: string | null;
};

export class ProgrammeAccessRepository {
  constructor(private readonly database: Prisma.TransactionClient) {}

  findUserAcceptance(userId: string) {
    return this.database.programmeAccessAcceptance.findUnique({ where: { userId } });
  }

  findAnonymousAcceptance(anonymousSessionId: string) {
    return this.database.programmeAccessAcceptance.findUnique({ where: { anonymousSessionId } });
  }

  acceptUserOnce(
    userId: string,
    input: ProgrammeAccessAcceptanceInput,
    source: ProgrammeAccessAcceptanceSource = "DIRECT_AUTHENTICATED",
  ) {
    return this.database.programmeAccessAcceptance.upsert({
      where: { userId },
      update: {},
      create: { userId, source, ...input },
    });
  }

  acceptAnonymousSessionOnce(
    anonymousSessionId: string,
    input: ProgrammeAccessAcceptanceInput,
  ) {
    return this.database.programmeAccessAcceptance.upsert({
      where: { anonymousSessionId },
      update: {},
      create: {
        anonymousSessionId,
        source: "ANONYMOUS_JOURNEY",
        ...input,
      },
    });
  }

  async bindAnonymousAcceptanceToUser(anonymousSessionId: string, userId: string) {
    const [anonymousAcceptance, userAcceptance] = await Promise.all([
      this.findAnonymousAcceptance(anonymousSessionId),
      this.findUserAcceptance(userId),
    ]);
    if (!anonymousAcceptance) return null;
    if (userAcceptance) {
      await this.database.programmeAccessAcceptance.delete({
        where: { id: anonymousAcceptance.id },
      });
      return userAcceptance;
    }
    return this.database.programmeAccessAcceptance.update({
      where: { id: anonymousAcceptance.id },
      data: { anonymousSessionId: null, userId },
    });
  }
}
