import { ZodError } from "zod";

import { parseCasinoMarketProfileMutation } from "@/lib/casino-market/contract";
import { casinoMarketRepository, type CasinoMarketRepository } from "@/lib/repositories/casino-market.repository";

import { ConflictError, NotFoundError, ValidationError } from "./service-error";

function normalizeCountryCode(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) throw new ValidationError("Country code must use ISO 3166-1 alpha-2 format");
  return normalized;
}

function mapRepositoryError(error: unknown, casinoId: string, countryCode: string): never {
  if (error instanceof Error && error.message === "CASINO_NOT_FOUND") throw new NotFoundError("Casino", { casinoId });
  if (error instanceof Error && error.message === "CASINO_MARKET_NOT_DRAFT") throw new ConflictError("Return the casino to draft before editing market profiles", { casinoId });
  if (error instanceof Error && error.message === "CASINO_MARKET_EDIT_CONFLICT") throw new ConflictError("This market profile changed or was created by another editor. Reload before saving.", { casinoId, countryCode });
  if (error instanceof Error && error.message === "CASINO_MARKET_OPERATOR_NOT_FOUND") throw new ValidationError("The selected market operator does not exist");
  if (error instanceof Error && error.message === "CASINO_MARKET_LICENSE_MISMATCH") throw new ValidationError("Every market licence must belong to the same casino");
  if (error instanceof Error && error.message === "CASINO_MARKET_BONUS_MISMATCH") throw new ValidationError("A market bonus cannot be moved between casinos or market profiles");
  throw error;
}

export class CasinoMarketService {
  constructor(private readonly repository: CasinoMarketRepository = casinoMarketRepository) {}

  list(casinoId: string) {
    return this.repository.list(casinoId);
  }

  async get(casinoId: string, countryCode: string) {
    const normalizedCountry = normalizeCountryCode(countryCode);
    const record = await this.repository.find(casinoId, normalizedCountry);
    if (!record) throw new NotFoundError("Casino market profile", { casinoId, countryCode: normalizedCountry });
    return record;
  }

  async replace(casinoId: string, countryCode: string, raw: unknown, actorId: string) {
    const normalizedCountry = normalizeCountryCode(countryCode);
    let input;
    try {
      input = parseCasinoMarketProfileMutation(raw);
    } catch (error) {
      if (error instanceof ZodError) throw new ValidationError("Casino market profile payload is invalid", error.issues);
      throw error;
    }
    try {
      return await this.repository.replace(casinoId, normalizedCountry, input, actorId);
    } catch (error) {
      mapRepositoryError(error, casinoId, normalizedCountry);
    }
  }
}

export const casinoMarketService = new CasinoMarketService();
