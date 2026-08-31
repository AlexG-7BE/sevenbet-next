import { ActiveDayService } from "@/lib/programme/application/active-day.service";
import { MissionFourService } from "@/lib/programme/application/mission-04.service";
import { MissionOneService } from "@/lib/programme/application/mission-01.service";
import { MissionThreeService } from "@/lib/programme/application/mission-03.service";
import { MissionTwoService } from "@/lib/programme/application/mission-02.service";
import { ProgrammeArtefactService } from "@/lib/programme/application/programme-artefact.service";
import { ProgrammeClaimService } from "@/lib/programme/application/programme-claim.service";
import { ProgrammeDashboardService } from "@/lib/programme/application/programme-dashboard.service";
import { ProgrammeRewardService } from "@/lib/programme/application/programme-reward.service";
import { ProgrammeSessionService } from "@/lib/programme/application/programme-session.service";
import {
  ProgrammeUnitOfWork,
  programmeUnitOfWork,
} from "@/lib/programme/infrastructure/programme-unit-of-work";

/**
 * Compatibility facade for non-HTTP callers and focused tests.
 * Routes import the bounded use-case services directly.
 */
export class ProgrammeFlowService {
  private readonly sessions: ProgrammeSessionService;
  private readonly claims: ProgrammeClaimService;
  private readonly missionOne: MissionOneService;
  private readonly dashboard: ProgrammeDashboardService;
  private readonly missionTwo: MissionTwoService;
  private readonly missionThree: MissionThreeService;
  private readonly missionFour: MissionFourService;
  private readonly artefacts: ProgrammeArtefactService;
  private readonly rewards: ProgrammeRewardService;
  private readonly activeDays: ActiveDayService;

  constructor(unitOfWork: ProgrammeUnitOfWork = programmeUnitOfWork) {
    this.sessions = new ProgrammeSessionService(unitOfWork);
    this.claims = new ProgrammeClaimService(unitOfWork);
    this.missionOne = new MissionOneService(unitOfWork);
    this.dashboard = new ProgrammeDashboardService(unitOfWork);
    this.missionTwo = new MissionTwoService(unitOfWork);
    this.missionThree = new MissionThreeService(unitOfWork);
    this.missionFour = new MissionFourService(unitOfWork);
    this.artefacts = new ProgrammeArtefactService(unitOfWork);
    this.rewards = new ProgrammeRewardService(this.dashboard);
    this.activeDays = new ActiveDayService(unitOfWork);
  }

  createAnonymousSession(
    accessAuthority: import("@/lib/programme/access-contract").ProgrammeAccessAuthority,
    now?: Date,
  ) {
    return this.sessions.createAnonymousSession(accessAuthority, now);
  }
  saveMissionOneDraft(token: string, value: unknown, now?: Date) {
    return this.sessions.saveMissionOneDraft(token, value, now);
  }
  createPendingClaim(token: string, now?: Date) {
    return this.sessions.createPendingClaim(token, now);
  }
  redeemPendingClaim(userId: string, token: string, timezone: unknown, now?: Date) {
    return this.claims.redeemPendingClaim(userId, token, timezone, now);
  }
  saveAuthenticatedMissionOneDraft(userId: string, value: unknown) {
    return this.missionOne.saveDraft(userId, value);
  }
  completeAuthenticatedMissionOne(userId: string, timezone: unknown, now?: Date) {
    return this.missionOne.complete(userId, timezone, now);
  }
  getDashboard(userId: string) {
    return this.dashboard.getDashboard(userId);
  }
  getMissionTwoDraft(userId: string) {
    return this.missionTwo.getDraft(userId);
  }
  saveMissionTwoDraft(userId: string, value: unknown) {
    return this.missionTwo.saveDraft(userId, value);
  }
  completeMissionTwo(userId: string, now?: Date) {
    return this.missionTwo.complete(userId, now);
  }
  getMissionThreeDraft(userId: string) {
    return this.missionThree.getDraft(userId);
  }
  saveMissionThreeDraft(userId: string, value: unknown) {
    return this.missionThree.saveDraft(userId, value);
  }
  completeMissionThree(userId: string, now?: Date) {
    return this.missionThree.complete(userId, now);
  }
  getMissionFourDraft(userId: string) {
    return this.missionFour.getDraft(userId);
  }
  saveMissionFourDraft(userId: string, value: unknown) {
    return this.missionFour.saveDraft(userId, value);
  }
  completeMissionFour(userId: string, now?: Date) {
    return this.missionFour.complete(userId, now);
  }
  updateMomentMap(userId: string, value: unknown) {
    return this.artefacts.updateMomentMap(userId, value);
  }
  deleteMomentMap(userId: string, now?: Date) {
    return this.artefacts.deleteMomentMap(userId, now);
  }
  updateCurrentGoal(userId: string, value: unknown, now?: Date) {
    return this.artefacts.updateCurrentGoal(userId, value, now);
  }
  deleteCurrentGoal(userId: string, now?: Date) {
    return this.artefacts.deleteCurrentGoal(userId, now);
  }
  updateUrgeLearningRecord(userId: string, value: unknown) {
    return this.artefacts.updateUrgeLearningRecord(userId, value);
  }
  deleteUrgeLearningRecord(userId: string, now?: Date) {
    return this.artefacts.deleteUrgeLearningRecord(userId, now);
  }
  updateActiveBoundary(userId: string, value: unknown, now?: Date) {
    return this.artefacts.updateActiveBoundary(userId, value, now);
  }
  deleteActiveBoundary(userId: string, now?: Date) {
    return this.artefacts.deleteActiveBoundary(userId, now);
  }
  getRewards(userId: string) {
    return this.rewards.getRewards(userId);
  }
  voidActiveDay(
    actor: { id: string; role: string },
    id: string,
    reason: unknown,
    now?: Date,
  ) {
    return this.activeDays.voidActiveDay(actor, id, reason, now);
  }
}

export const programmeFlowService = new ProgrammeFlowService();
