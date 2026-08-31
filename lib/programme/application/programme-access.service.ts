import type { ProgrammeAccessAuthority } from "@/lib/programme/access-contract";
import {
  ProgrammeUnitOfWork,
  programmeUnitOfWork,
} from "@/lib/programme/infrastructure/programme-unit-of-work";
import type { ProgrammeAccessAcceptanceInput } from "@/lib/programme/infrastructure/repositories/programme-access.repository";
import { ServiceError } from "@/lib/services/service-error";

function fromAuthority(authority: ProgrammeAccessAuthority): ProgrammeAccessAcceptanceInput {
  return {
    adultSelfAttestedAt: new Date(authority.adultConfirmedAt),
    termsAcceptedAt: new Date(authority.termsAcceptedAt),
    privacyAcknowledgedAt: new Date(authority.privacyAcknowledgedAt),
    termsVersionAtAcceptance: authority.termsVersion,
    privacyVersionAtAcceptance: authority.privacyVersion,
  };
}

export class ProgrammeAccessService {
  constructor(private readonly unitOfWork = programmeUnitOfWork) {}

  userStatus(userId: string) {
    return this.unitOfWork.access.findUserAcceptance(userId);
  }

  acceptAuthenticatedUserOnce(
    userId: string,
    input: {
      acceptedAt?: Date;
      termsVersion: string;
      privacyVersion: string;
    },
  ) {
    const acceptedAt = input.acceptedAt ?? new Date();
    return this.unitOfWork.serializable((unitOfWork) => unitOfWork.access.acceptUserOnce(userId, {
      adultSelfAttestedAt: acceptedAt,
      termsAcceptedAt: acceptedAt,
      privacyAcknowledgedAt: acceptedAt,
      termsVersionAtAcceptance: input.termsVersion,
      privacyVersionAtAcceptance: input.privacyVersion,
    }));
  }

  acceptAnonymousSessionOnce(
    unitOfWork: ProgrammeUnitOfWork,
    anonymousSessionId: string,
    authority: ProgrammeAccessAuthority,
  ) {
    return unitOfWork.access.acceptAnonymousSessionOnce(
      anonymousSessionId,
      fromAuthority(authority),
    );
  }

  async requireUserAcceptance(userId: string) {
    const acceptance = await this.userStatus(userId);
    if (!acceptance) {
      throw new ServiceError(
        "Complete the one-time Programme access acknowledgement before continuing",
        "PROGRAMME_ACCESS_ACKNOWLEDGEMENT_REQUIRED",
        403,
      );
    }
    return acceptance;
  }

  async requireAnonymousAcceptance(
    unitOfWork: ProgrammeUnitOfWork,
    anonymousSessionId: string,
  ) {
    const acceptance = await unitOfWork.access.findAnonymousAcceptance(anonymousSessionId);
    if (!acceptance) {
      throw new ServiceError(
        "Current server-verified Programme access authority is required",
        "CURRENT_ACCESS_AUTHORITY_REQUIRED",
        403,
      );
    }
    return acceptance;
  }

  async bindAnonymousAcceptanceToUser(
    unitOfWork: ProgrammeUnitOfWork,
    anonymousSessionId: string,
    userId: string,
  ) {
    const acceptance = await unitOfWork.access.bindAnonymousAcceptanceToUser(
      anonymousSessionId,
      userId,
    );
    if (!acceptance) {
      throw new ServiceError(
        "Current server-verified Programme access authority is required",
        "CURRENT_ACCESS_AUTHORITY_REQUIRED",
        403,
      );
    }
    return acceptance;
  }
}

export const programmeAccessService = new ProgrammeAccessService();
