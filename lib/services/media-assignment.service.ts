import {
  AffiliateStatus,
  EditorialStatus,
  MediaAssetStatus,
  MediaPlacement,
  MediaPlacementVariant,
  MediaRenderingMode,
  Prisma,
} from "@prisma/client";

import {
  casinoMediaPlacements,
  isCasinoMediaPlacement,
  isMediaPlacement,
  isMediaPlacementVariant,
  isMediaRenderingMode,
  isOfferMediaPlacement,
  offerMediaPlacements,
  resolveMedia,
  type MediaAssignmentSubjectType,
  type MediaPlacementName,
} from "@/lib/media/placement-media";
import {
  mediaAssignmentRepository,
  type MediaAssignmentRepository,
} from "@/lib/repositories/media-assignment.repository";

import { ConflictError, NotFoundError, ValidationError } from "./service-error";

export interface AssignMediaInput {
  casinoId: string;
  subjectType: MediaAssignmentSubjectType;
  subjectId: string;
  mediaAssetId: string;
  placement: string;
  variant?: string;
  renderingMode?: string;
  sortOrder?: number;
  active?: boolean;
  cropSafe?: boolean;
  altTextOverride?: string | null;
  focalPointX?: number | null;
  focalPointY?: number | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  reference?: string | null;
  actorId: string;
}

function cleanText(value: string | null | undefined, maximum: number) {
  const result = value?.trim() || "";
  if (result.length > maximum) throw new ValidationError(`Text must be ${maximum} characters or fewer`);
  return result || null;
}

function placementForSubject(subjectType: MediaAssignmentSubjectType, placement: string) {
  if (!isMediaPlacement(placement)) throw new ValidationError("Unsupported media placement");
  if (subjectType === "CASINO" && !isCasinoMediaPlacement(placement)) {
    throw new ValidationError("Casino assignments only accept Casino placements");
  }
  if (subjectType !== "CASINO" && !isOfferMediaPlacement(placement)) {
    throw new ValidationError("Bonus and Affiliate Offer assignments only accept offer placements");
  }
  return placement;
}

function decimal(value: number | null | undefined, field: string) {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new ValidationError(`${field} must be between 0 and 1`);
  return new Prisma.Decimal(value);
}

export class MediaAssignmentService {
  constructor(private readonly repository: MediaAssignmentRepository = mediaAssignmentRepository) {}

  private async validateSubject(casinoId: string, subjectType: MediaAssignmentSubjectType, subjectId: string) {
    const subject = await this.repository.resolveSubject(subjectType, subjectId);
    if (!subject) throw new NotFoundError(subjectType.replaceAll("_", " "), { id: subjectId });
    if (subject.casinoId !== casinoId) throw new ValidationError("Media assignment subject does not belong to the requested casino");
    return subject;
  }

  private async validateMutableSubject(casinoId: string, subjectType: MediaAssignmentSubjectType, subjectId: string) {
    const subject = await this.validateSubject(casinoId, subjectType, subjectId);
    if (subjectType === "AFFILIATE_OFFER") {
      if (subject.affiliateOfferStatus === AffiliateStatus.ARCHIVED) {
        throw new ConflictError("Restore the Affiliate Offer before changing partner-specific placement media", {
          casinoId,
          affiliateOfferId: subjectId,
          currentStatus: subject.affiliateOfferStatus,
        });
      }
      return subject;
    }
    if (subject.casinoStatus !== EditorialStatus.DRAFT) {
      throw new ConflictError("Return the Casino to draft before changing placement media", {
        casinoId,
        currentStatus: subject.casinoStatus,
      });
    }
    return subject;
  }

  async schemaReady() {
    return this.repository.schemaReady();
  }

  async assignMedia(input: AssignMediaInput) {
    const subject = await this.validateMutableSubject(input.casinoId, input.subjectType, input.subjectId);
    const placement = placementForSubject(input.subjectType, input.placement);
    const variant = input.variant ?? "DEFAULT";
    const renderingMode = input.renderingMode ?? "AUTO";
    if (!isMediaPlacementVariant(variant)) throw new ValidationError("Unsupported media placement variant");
    if (!isMediaRenderingMode(renderingMode)) throw new ValidationError("Unsupported media rendering mode");
    const asset = await this.repository.findAsset(input.mediaAssetId);
    if (!asset) throw new NotFoundError("Media asset", { id: input.mediaAssetId });
    if (asset.casinoId !== subject.casinoId) throw new ValidationError("Media asset does not belong to the assignment casino");
    if (asset.status !== MediaAssetStatus.ACTIVE || asset.archivedAt) throw new ValidationError("Archived or inactive media cannot be assigned");
    const focalPointX = decimal(input.focalPointX, "focalPointX");
    const focalPointY = decimal(input.focalPointY, "focalPointY");
    if ((focalPointX === null) !== (focalPointY === null)) throw new ValidationError("Both focal point coordinates are required together");
    const cropSafe = Boolean(input.cropSafe);
    if (renderingMode === "COVER" && !cropSafe) throw new ValidationError("COVER requires an explicit crop-safe confirmation");
    const validFrom = input.validFrom ?? null;
    const validUntil = input.validUntil ?? null;
    if (validFrom && Number.isNaN(validFrom.getTime())) throw new ValidationError("validFrom must be a valid date");
    if (validUntil && Number.isNaN(validUntil.getTime())) throw new ValidationError("validUntil must be a valid date");
    if (validFrom && validUntil && validFrom >= validUntil) throw new ValidationError("validUntil must be later than validFrom");
    const sortOrder = input.sortOrder ?? 0;
    if (!Number.isSafeInteger(sortOrder) || sortOrder < 0 || sortOrder > 1_000_000) throw new ValidationError("sortOrder must be an integer between 0 and 1000000");
    return this.repository.assign(input.subjectType, input.subjectId, {
      mediaAssetId: input.mediaAssetId,
      placement: placement as MediaPlacement,
      variant: variant as MediaPlacementVariant,
      renderingMode: renderingMode as MediaRenderingMode,
      sortOrder,
      active: input.active ?? true,
      cropSafe,
      altTextOverride: cleanText(input.altTextOverride, 300),
      focalPointX,
      focalPointY,
      validFrom,
      validUntil,
      reference: cleanText(input.reference, 500),
    }, input.actorId);
  }

  async unassignMedia(input: {
    casinoId: string;
    subjectType: MediaAssignmentSubjectType;
    subjectId: string;
    assignmentId: string;
    actorId: string;
  }) {
    await this.validateMutableSubject(input.casinoId, input.subjectType, input.subjectId);
    const removed = await this.repository.unassign(
      input.subjectType,
      input.subjectId,
      input.assignmentId,
      input.actorId,
    );
    if (!removed) throw new NotFoundError("Media assignment", { id: input.assignmentId });
    return removed;
  }

  async setAssignmentActive(input: {
    casinoId: string;
    subjectType: MediaAssignmentSubjectType;
    subjectId: string;
    assignmentId: string;
    active: boolean;
    actorId: string;
  }) {
    await this.validateMutableSubject(input.casinoId, input.subjectType, input.subjectId);
    const assignment = await this.repository.setActive(
      input.subjectType,
      input.subjectId,
      input.assignmentId,
      input.active,
      input.actorId,
    );
    if (!assignment) throw new NotFoundError("Media assignment", { id: input.assignmentId });
    return assignment;
  }

  async listEffectivePlacements(input: {
    casinoId: string;
    subjectType: MediaAssignmentSubjectType;
    subjectId: string;
    requestedVariant?: string;
    now?: Date;
  }) {
    await this.validateSubject(input.casinoId, input.subjectType, input.subjectId);
    const requestedVariant = input.requestedVariant ?? "DEFAULT";
    if (!isMediaPlacementVariant(requestedVariant)) throw new ValidationError("Unsupported media placement variant");
    const context = await this.repository.loadResolutionContext(input);
    if (!context) throw new NotFoundError("Casino", { id: input.casinoId });
    const placements = input.subjectType === "CASINO" ? casinoMediaPlacements : offerMediaPlacements;
    const resolved = Object.fromEntries(placements.map((placement) => [
      placement,
      resolveMedia({
        placement,
        requestedVariant,
        context,
        now: input.now,
      }),
    ])) as Record<MediaPlacementName, ReturnType<typeof resolveMedia>>;
    const assignments = input.subjectType === "CASINO"
      ? context.casinoAssignments
      : input.subjectType === "CASINO_BONUS"
        ? context.casinoBonusAssignments
        : context.affiliateOfferAssignments;
    const usage = await this.repository.listAssetUsage(context.assets.map((asset) => asset.id));
    return { resolved, assignments, assets: context.assets, usage, requestedVariant };
  }

  async listAssetUsage(assetIds: string[]) {
    return this.repository.listAssetUsage(assetIds);
  }
}

export const mediaAssignmentService = new MediaAssignmentService();
