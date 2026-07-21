import { AffiliateStatus } from "@prisma/client";

import type { AffiliateOfferInput } from "@/lib/affiliate/types";
import { assertAffiliateStatusTransition, normalizeAffiliateOffer } from "@/lib/affiliate/validation";
import { affiliateOfferRepository, type AffiliateOfferAggregate, type AffiliateOfferStore } from "@/lib/repositories/affiliate-offer.repository";
import { affiliateProgramRepository, type AffiliateProgramStore } from "@/lib/repositories/affiliate-program.repository";

import { ConflictError, NotFoundError, ValidationError } from "./service-error";

function aggregateAsInput(offer: AffiliateOfferAggregate) {
  return {
    ...offer,
    payoutAmount: offer.payoutAmount?.toString() ?? null,
    revenueSharePercentage: offer.revenueSharePercentage?.toString() ?? null,
    countries: offer.countries.map(({ countryCode, mode }) => ({ countryCode, mode })),
    currencies: offer.currencies.map(({ currencyCode }) => currencyCode),
    trackingLinks: offer.trackingLinks.map((link) => ({
      ...link,
      countries: link.countries.map(({ countryCode, mode }) => ({ countryCode, mode })),
    })),
  };
}

export class AffiliateOfferService {
  constructor(
    private readonly store: AffiliateOfferStore = affiliateOfferRepository,
    private readonly programStore: AffiliateProgramStore = affiliateProgramRepository,
  ) {}

  list(input?: Parameters<AffiliateOfferStore["list"]>[0]) {
    return this.store.list(input);
  }

  async get(id: string) {
    const offer = await this.store.findById(id);
    if (!offer) throw new NotFoundError("Affiliate offer", { id });
    return offer;
  }

  private async validate(input: AffiliateOfferInput, excludeId?: string) {
    const program = await this.programStore.findById(input.programId);
    if (!program) throw new NotFoundError("Affiliate program", { id: input.programId });
    if (input.status === "ACTIVE" && (program.status !== "ACTIVE" || !program.network.active || program.network.archivedAt)) {
      throw new ValidationError("An archived or inactive network/program cannot have an active offer");
    }
    const identity = await this.store.findCasinoBonus(input.casinoId, input.casinoBonusId);
    if (!identity.casinoExists) throw new NotFoundError("Casino", { id: input.casinoId });
    if (input.casinoBonusId && identity.bonusCasinoId !== input.casinoId) {
      throw new ValidationError("Selected bonus does not belong to the selected casino", { casinoId: input.casinoId, casinoBonusId: input.casinoBonusId });
    }
    if (input.externalOfferId && await this.store.existsExternalOfferId(input.programId, input.externalOfferId, excludeId)) {
      throw new ConflictError("External offer ID already exists in this program", { externalOfferId: input.externalOfferId });
    }
    const externalLinkIds = input.trackingLinks.flatMap((link) => link.externalLinkId ? [link.externalLinkId] : []);
    if (new Set(externalLinkIds).size !== externalLinkIds.length) throw new ConflictError("Duplicate external tracking link ID in offer");
    const duplicateLink = await this.store.findDuplicateExternalLinkId(input.programId, externalLinkIds, excludeId);
    if (duplicateLink) throw new ConflictError("External tracking link ID already exists in this program", { externalLinkId: duplicateLink });
  }

  async create(input: AffiliateOfferInput | unknown, actorId: string) {
    const normalized = normalizeAffiliateOffer(input);
    await this.validate(normalized);
    return this.store.create(normalized, actorId);
  }

  async update(id: string, input: AffiliateOfferInput | unknown, actorId: string, expectedUpdatedAt?: Date) {
    const current = await this.get(id);
    const normalized = normalizeAffiliateOffer({ ...aggregateAsInput(current), ...(input as object) });
    if (normalized.casinoId !== current.casinoId) {
      throw new ValidationError("An affiliate offer cannot be moved between casinos", { id, casinoId: current.casinoId });
    }
    assertAffiliateStatusTransition(current.status, normalized.status);
    await this.validate(normalized, id);
    try {
      return await this.store.update(id, normalized, actorId, expectedUpdatedAt);
    } catch (error) {
      if (error instanceof Error && error.message === "AFFILIATE_TRACKING_LINK_OWNERSHIP") {
        throw new ValidationError("Tracking links cannot be moved between offers");
      }
      if (error instanceof Error && error.message === "AFFILIATE_EDIT_CONFLICT") {
        throw new ConflictError("This affiliate offer was changed by another editor. Reload before saving.", { id });
      }
      throw error;
    }
  }

  async duplicate(id: string, actorId: string) {
    const current = await this.get(id);
    const source = aggregateAsInput(current);
    const copy = normalizeAffiliateOffer({
      ...source,
      externalOfferId: null,
      internalName: `${current.internalName} copy`,
      publicLabel: `${current.publicLabel} copy`,
      status: AffiliateStatus.DRAFT,
      featured: false,
      trackingLinks: source.trackingLinks.map((link) => ({
        ...link,
        id: undefined,
        externalLinkId: null,
        label: `${link.label} copy`,
        active: false,
      })),
    });
    await this.validate(copy);
    return this.store.create(copy, actorId);
  }

  activeCandidates(input: Parameters<AffiliateOfferStore["findActiveCandidates"]>[0]) {
    return this.store.findActiveCandidates(input);
  }

  async archive(id: string, actorId: string) {
    const current = await this.get(id);
    if (current.status === AffiliateStatus.ARCHIVED) return current;
    assertAffiliateStatusTransition(current.status, AffiliateStatus.ARCHIVED);
    return this.store.archive(id, actorId);
  }

  revisions(id: string) {
    return this.store.listRevisions(id);
  }

  trackingHistory(trackingLinkId: string) {
    return this.store.listTrackingHistory(trackingLinkId);
  }
}

export const affiliateOfferService = new AffiliateOfferService();
