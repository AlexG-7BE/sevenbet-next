export const GB_COMMERCIAL_DOMAIN_EVIDENCE_VERSION = "gb-domain-evidence.v1" as const;

export type GbCommercialDomainStatus = "ACTIVE" | "INACTIVE" | "WHITE_LABEL";

export interface GbCommercialDomainEvidenceRecord {
  evidenceId: string;
  authorityVersion: typeof GB_COMMERCIAL_DOMAIN_EVIDENCE_VERSION;
  casinoId: string;
  operatorId: string;
  brandId: string | null;
  licenceId: string;
  licenceAccountReference: string;
  domain: string;
  officialSourceUrl: string;
  domainStatus: GbCommercialDomainStatus;
  relationshipType: "DIRECT" | "WHITE_LABEL";
  observedAt: string;
  revalidateAt: string;
}

/**
 * Activation-sensitive evidence. Intentionally empty until a real agreement,
 * due diligence and an approved activation change exist for a real operator.
 */
export const gbCommercialDomainEvidenceRecords: readonly GbCommercialDomainEvidenceRecord[] = [];

export interface GbCommercialDomainEvidenceStore {
  findExact(casinoId: string, domain: string): GbCommercialDomainEvidenceRecord | null;
}

function normalizeDomain(value: string) {
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  } catch {
    return "";
  }
}

export class RepositoryGbCommercialDomainEvidenceStore implements GbCommercialDomainEvidenceStore {
  constructor(private readonly records: readonly GbCommercialDomainEvidenceRecord[] = gbCommercialDomainEvidenceRecords) {}

  findExact(casinoId: string, domain: string) {
    const normalized = normalizeDomain(domain);
    return this.records.find((record) => record.casinoId === casinoId && normalizeDomain(record.domain) === normalized) ?? null;
  }
}

export const gbCommercialDomainEvidenceStore = new RepositoryGbCommercialDomainEvidenceStore();
