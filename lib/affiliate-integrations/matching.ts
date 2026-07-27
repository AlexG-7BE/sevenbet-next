import {
  AffiliateMatchMethod,
  AffiliateMatchStatus,
} from "@prisma/client";

import type {
  CasinoMatchCandidate,
  CasinoMatchResult,
  ExistingExternalMapping,
  ExternalCasinoReference,
} from "./types";

export function normalizeCasinoName(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export function normalizeCasinoDomain(value: string | null | undefined) {
  if (!value) return null;
  const candidate = value.includes("://") ? value : `https://${value}`;
  try {
    const hostname = new URL(candidate).hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
    return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(hostname) ? hostname : null;
  } catch {
    return null;
  }
}

export function matchCasino(input: {
  external: ExternalCasinoReference;
  existingMapping?: ExistingExternalMapping | null;
  casinos: CasinoMatchCandidate[];
}): CasinoMatchResult {
  const mappedId = input.existingMapping?.internalEntityId;
  if (mappedId && input.casinos.some((casino) => casino.id === mappedId)) {
    return {
      casinoId: mappedId,
      status: AffiliateMatchStatus.MATCHED,
      method: AffiliateMatchMethod.EXTERNAL_MAPPING,
      confidence: 1,
    };
  }

  const domain = normalizeCasinoDomain(input.external.domain);
  if (domain) {
    const domainMatches = input.casinos.filter((casino) => normalizeCasinoDomain(casino.domain) === domain);
    if (domainMatches.length === 1) {
      return {
        casinoId: domainMatches[0].id,
        status: AffiliateMatchStatus.MATCHED,
        method: AffiliateMatchMethod.DOMAIN,
        confidence: 1,
      };
    }
  }

  const brand = normalizeCasinoName(input.external.name);
  const brandMatches = input.casinos.filter((casino) =>
    [casino.title, casino.internalName].some((value) => value && normalizeCasinoName(value) === brand),
  );
  if (brand && brandMatches.length === 1) {
    return {
      casinoId: brandMatches[0].id,
      status: AffiliateMatchStatus.MATCHED,
      method: AffiliateMatchMethod.BRAND,
      confidence: 0.98,
    };
  }

  const aliasMatches = input.casinos.filter((casino) => casino.aliases.some((alias) => (
    alias.type === "DOMAIN"
      ? domain !== null && alias.normalizedValue === domain
      : alias.normalizedValue === brand
  )));
  if (aliasMatches.length === 1) {
    return {
      casinoId: aliasMatches[0].id,
      status: AffiliateMatchStatus.MATCHED,
      method: AffiliateMatchMethod.ALIAS,
      confidence: 0.95,
    };
  }

  return {
    casinoId: null,
    status: AffiliateMatchStatus.REVIEW_REQUIRED,
    method: null,
    confidence: null,
  };
}
