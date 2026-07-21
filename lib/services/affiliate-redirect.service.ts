import type { AffiliateRedirectSlugInput } from "@/lib/affiliate/types";
import { resolveAffiliateCandidates, type CandidateResolverInput } from "@/lib/affiliate-routing/candidate-resolver";
import { normalizeCurrencyHint, normalizeLanguageHint, normalizeRedirectSlug, validateRedirectTargetUrl } from "@/lib/affiliate-routing/redirect-validation";
import { affiliateRedirectRepository, type AffiliateRedirectStore } from "@/lib/repositories/affiliate-redirect.repository";
import { affiliateOfferService, type AffiliateOfferService } from "@/lib/services/affiliate-offer.service";

import { ConflictError, NotFoundError, ValidationError } from "./service-error";

export type RedirectFailureReason = "SLUG_NOT_FOUND" | "SLUG_INACTIVE" | "NO_ACTIVE_OFFER" | "NO_ELIGIBLE_TRACKING_LINK" | "UNSAFE_REDIRECT_URL";

export type AffiliateRedirectResolution =
  | { ok: true; destination: URL; slugId: string; casinoId: string; offerId: string; trackingLinkId: string; candidates: ReturnType<typeof resolveAffiliateCandidates>["candidates"] }
  | { ok: false; reason: RedirectFailureReason; slugId?: string; casinoId?: string; candidates: ReturnType<typeof resolveAffiliateCandidates>["candidates"] };

function optionalId(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new ValidationError(`${field} must be a string identifier`);
  return value.trim() || null;
}

function externalIdFragment(value?: string | null) {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized.length >= 4 ? normalized : null;
}

export class AffiliateRedirectService {
  constructor(
    private readonly store: AffiliateRedirectStore = affiliateRedirectRepository,
    private readonly offers: Pick<AffiliateOfferService, "activeCandidates"> = affiliateOfferService,
  ) {}

  list(input?: Parameters<AffiliateRedirectStore["list"]>[0]) {
    return this.store.list(input);
  }

  async get(id: string) {
    const redirect = await this.store.findById(id);
    if (!redirect) throw new NotFoundError("Affiliate redirect slug", { id });
    return redirect;
  }

  private async normalizeAndValidate(input: unknown, current?: Awaited<ReturnType<AffiliateRedirectService["get"]>>): Promise<AffiliateRedirectSlugInput> {
    if (!input || typeof input !== "object") throw new ValidationError("Redirect slug payload is required");
    const value = input as Record<string, unknown>;
    const slug = current?.slug ?? normalizeRedirectSlug(value.slug);
    const casinoId = current?.casinoId ?? optionalId(value.casinoId, "casinoId");
    if (!casinoId) throw new ValidationError("casinoId is required");
    if (current && value.casinoId && value.casinoId !== current.casinoId) throw new ValidationError("A redirect slug cannot be moved to another casino");
    if (current && value.slug && normalizeRedirectSlug(value.slug) !== current.slug) throw new ValidationError("A redirect slug is immutable; archive it and create a new slug instead");
    const casinoBonusId = optionalId(value.casinoBonusId, "casinoBonusId");
    const affiliateOfferId = optionalId(value.affiliateOfferId, "affiliateOfferId");
    const identity = await this.store.resolveTargets(casinoId, casinoBonusId, affiliateOfferId);
    if (!identity.casinoExists) throw new NotFoundError("Casino", { id: casinoId });
    if (casinoBonusId && identity.bonusCasinoId !== casinoId) throw new ValidationError("Selected bonus does not belong to the redirect casino");
    if (affiliateOfferId && !identity.offer) throw new NotFoundError("Affiliate offer", { id: affiliateOfferId });
    if (identity.offer && identity.offer.casinoId !== casinoId) throw new ValidationError("Selected offer does not belong to the redirect casino");
    if (identity.offer && identity.offer.casinoBonusId !== casinoBonusId) throw new ValidationError("Redirect bonus must match the selected affiliate offer");
    for (const externalId of [identity.offer?.externalOfferId, identity.offer?.externalProgramId]) {
      const fragment = externalIdFragment(externalId);
      if (fragment && slug.includes(fragment)) throw new ValidationError("Redirect slug must not contain external affiliate identifiers");
    }
    if (value.active !== undefined && typeof value.active !== "boolean") throw new ValidationError("active must be a boolean");
    return {
      slug,
      casinoId,
      casinoBonusId,
      affiliateOfferId,
      defaultCurrency: normalizeCurrencyHint(value.defaultCurrency, "defaultCurrency"),
      defaultLanguage: normalizeLanguageHint(value.defaultLanguage, "defaultLanguage"),
      active: value.active === undefined ? current?.active ?? true : value.active,
    };
  }

  async create(input: unknown, actorId: string) {
    const normalized = await this.normalizeAndValidate(input);
    if (await this.store.existsBySlug(normalized.slug)) throw new ConflictError("Affiliate redirect slug already exists", { slug: normalized.slug });
    try {
      return await this.store.create(normalized, actorId);
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") throw new ConflictError("Affiliate redirect slug already exists", { slug: normalized.slug });
      throw error;
    }
  }

  async update(id: string, input: unknown, actorId: string, expectedUpdatedAt?: Date) {
    if (!expectedUpdatedAt) throw new ValidationError("expectedUpdatedAt is required for redirect updates");
    const current = await this.get(id);
    const normalized = await this.normalizeAndValidate({ ...current, ...(input as object) }, current);
    try {
      return await this.store.update(id, normalized, actorId, expectedUpdatedAt);
    } catch (error) {
      if (error instanceof Error && error.message === "AFFILIATE_EDIT_CONFLICT") throw new ConflictError("This redirect mapping was changed by another editor. Reload before saving.", { id });
      if (error instanceof Error && error.message === "AFFILIATE_REDIRECT_NOT_FOUND") throw new NotFoundError("Affiliate redirect slug", { id });
      throw error;
    }
  }

  async resolve(slugValue: string, input: Omit<CandidateResolverInput, "casinoId" | "casinoBonusId"> = {}): Promise<AffiliateRedirectResolution> {
    let slug: string;
    try {
      slug = normalizeRedirectSlug(slugValue);
    } catch {
      return { ok: false, reason: "SLUG_NOT_FOUND", candidates: [] };
    }
    const mapping = await this.store.findBySlug(slug);
    if (!mapping) return { ok: false, reason: "SLUG_NOT_FOUND", candidates: [] };
    if (!mapping.active || mapping.archivedAt) return { ok: false, reason: "SLUG_INACTIVE", slugId: mapping.id, casinoId: mapping.casinoId, candidates: [] };
    const currencyCode = normalizeCurrencyHint(input.currencyCode ?? mapping.defaultCurrency);
    const language = normalizeLanguageHint(input.language ?? mapping.defaultLanguage);
    const offers = await this.offers.activeCandidates({ casinoId: mapping.casinoId, casinoBonusId: mapping.casinoBonusId ?? undefined, countryCode: input.countryCode ?? undefined, currencyCode: currencyCode ?? undefined, now: input.now });
    const scopedOffers = mapping.affiliateOfferId ? offers.filter((offer) => offer.id === mapping.affiliateOfferId) : offers;
    const result = resolveAffiliateCandidates(scopedOffers, { casinoId: mapping.casinoId, casinoBonusId: mapping.casinoBonusId, countryCode: input.countryCode, currencyCode, language, now: input.now });
    if (!result.winner) return { ok: false, reason: result.failureReason ?? "NO_ELIGIBLE_TRACKING_LINK", slugId: mapping.id, casinoId: mapping.casinoId, candidates: result.candidates };
    const trackingUrl = validateRedirectTargetUrl(result.winner.trackingUrl);
    const destinationUrl = validateRedirectTargetUrl(result.winner.destinationUrl);
    if (!trackingUrl || !destinationUrl) return { ok: false, reason: "UNSAFE_REDIRECT_URL", slugId: mapping.id, casinoId: mapping.casinoId, candidates: result.candidates };
    return { ok: true, destination: trackingUrl, slugId: mapping.id, casinoId: mapping.casinoId, offerId: result.winner.offerId, trackingLinkId: result.winner.trackingLinkId, candidates: result.candidates };
  }
}

export const affiliateRedirectService = new AffiliateRedirectService();
