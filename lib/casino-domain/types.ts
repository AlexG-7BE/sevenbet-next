/** Canonical, framework- and persistence-independent Casino Domain contracts. */
export type CasinoPublicationStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "SUSPENDED" | "ARCHIVED";
export type CasinoLifecycleStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED" | "UNKNOWN";
export type LicenceStatus = "ACTIVE" | "EXPIRED" | "SUSPENDED" | "REVOKED" | "UNKNOWN";
export type LicenceEvidenceStatus = "VERIFIED" | "UNVERIFIED" | "EXPIRED" | "REJECTED" | "UNKNOWN";

export interface DomainError {
  code: "CASINO_NOT_FOUND" | "LICENCE_EVIDENCE_MISSING" | "LICENCE_EVIDENCE_INVALID" | "PUBLICATION_NOT_ELIGIBLE" | "ENTITY_SUSPENDED";
  message: string;
  entityId?: string;
}

export interface CasinoLicenceEvidence {
  id: string;
  sourceUrl: string | null;
  sourceReference: string | null;
  status: LicenceEvidenceStatus;
  observedAt: Date | null;
  expiresAt: Date | null;
  reviewedAt: Date | null;
}

export interface CasinoLicence {
  id: string;
  authority: string;
  number: string | null;
  jurisdiction: string | null;
  status: LicenceStatus;
  expiresAt: Date | null;
  verifiedAt: Date | null;
  evidence: CasinoLicenceEvidence[];
}

export interface CasinoAvailability {
  countryCode: string;
  state: "AVAILABLE" | "RESTRICTED" | "NOT_AVAILABLE" | "UNKNOWN";
  minimumAge: number | null;
}

export interface CasinoBonusTerms {
  wageringText: string | null;
  wageringMultiplier: number | null;
  minimumDeposit: number | null;
  maximumBonus: number | null;
  termsUrl: string | null;
  importantConditions: string[];
}

export interface CasinoBonus {
  id: string;
  slug: string;
  title: string;
  lifecycleStatus: CasinoLifecycleStatus;
  publicationStatus: CasinoPublicationStatus;
  offerStatus: "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED" | "ARCHIVED";
  startsAt: Date | null;
  expiresAt: Date | null;
  terms: CasinoBonusTerms;
}

export interface CasinoAffiliateProgram {
  id: string;
  name: string;
  operator: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED" | "ARCHIVED";
  publicationStatus: CasinoPublicationStatus;
  lifecycleStatus: CasinoLifecycleStatus;
}

export interface CasinoAffiliateOffer {
  id: string;
  programId: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED" | "ARCHIVED";
  lifecycleStatus: CasinoLifecycleStatus;
  countries: string[];
  currencies: string[];
  startsAt: Date | null;
  expiresAt: Date | null;
}

export interface CasinoSeoMetadata { title: string | null; description: string | null; canonicalUrl: string | null; robots: string | null; }
export interface CasinoResponsibleGamblingMetadata { tools: string[]; }
export interface CasinoTrackingMetadata { affiliateProgramIds: string[]; }

export interface CasinoDomain {
  id: string;
  slug: string;
  name: string;
  operator: { id: string | null; name: string | null; lifecycleStatus: CasinoLifecycleStatus };
  brand: { id: string | null; name: string; lifecycleStatus: CasinoLifecycleStatus };
  lifecycleStatus: CasinoLifecycleStatus;
  publicationStatus: CasinoPublicationStatus;
  licences: CasinoLicence[];
  availability: CasinoAvailability[];
  languages: string[];
  currencies: string[];
  bonuses: CasinoBonus[];
  affiliatePrograms: CasinoAffiliateProgram[];
  affiliateOffers: CasinoAffiliateOffer[];
  seo: CasinoSeoMetadata;
  responsibleGambling: CasinoResponsibleGamblingMetadata;
  tracking: CasinoTrackingMetadata;
}

export type CasinoEligibility = { eligible: true; reason: "ELIGIBLE" } | { eligible: false; reason: Exclude<DomainError["code"], "CASINO_NOT_FOUND"> };
