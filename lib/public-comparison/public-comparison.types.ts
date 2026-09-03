import type { PublicCasinoMedia } from "@/lib/public-casino/public-casino.types";
import type { PublicCasinoPresentationDisposition } from "@/lib/public-casino/presentation-disposition";
import type { PublicCasinoDataClassification, PublicCasinoInventoryMode } from "@/lib/public-casino-discovery/public-casino-discovery.types";

export type PublicComparisonEvidenceStatus =
  | "Published"
  | "Demonstration"
  | "Editorial"
  | "Operator-published"
  | "Unknown"
  | "Unavailable"
  | "Not comparable"
  | "Policy-gated";

export type PublicComparisonMarketState = "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN";
export type PublicComparisonSelectionMode = "default" | "explicit" | "empty";
export type PublicComparisonReasonCode =
  | "UNKNOWN_OR_UNPUBLISHED"
  | "DECLARED_MARKET_UNAVAILABLE"
  | "DECLARED_MARKET_UNKNOWN"
  | "PROJECTION_UNAVAILABLE";

export interface PublicComparisonQuery {
  casinos: string[];
  country: string;
  differences: boolean;
  selectionMode: PublicComparisonSelectionMode;
  issues: Array<"INVALID_CASINO" | "TOO_MANY_CASINOS" | "INVALID_COUNTRY" | "INVALID_DIFFERENCES">;
}

export interface PublicComparisonCandidate {
  dataClassification: PublicCasinoDataClassification;
  disposition: PublicCasinoPresentationDisposition;
  slug: string;
  name: string;
  logo: PublicCasinoMedia | null;
  editorScore: number | null;
  marketState: PublicComparisonMarketState;
  marketLabel: string;
}

export interface PublicComparisonReason {
  slug: string;
  code: PublicComparisonReasonCode;
  message: string;
}

export interface PublicComparisonAction {
  available: boolean;
  href: string | null;
  label: string;
  reason: string;
}

export interface PublicComparisonCasino {
  id: string;
  dataClassification: PublicCasinoDataClassification;
  disposition: PublicCasinoPresentationDisposition;
  slug: string;
  name: string;
  summary: string;
  logo: PublicCasinoMedia | null;
  editorScore: number | null;
  publishedAt: string | null;
  lastReviewedAt: string | null;
  reviewHref: string;
  marketState: PublicComparisonMarketState;
  action: PublicComparisonAction;
}

export interface PublicComparisonValue {
  text: string;
  status: PublicComparisonEvidenceStatus;
  statusLabel?: string;
}

export interface PublicComparisonRow {
  id: string;
  label: string;
  description: string;
  values: Record<string, PublicComparisonValue>;
}

export interface PublicComparisonGroup {
  id: string;
  label: string;
  rows: PublicComparisonRow[];
}

export interface PublicComparisonResult {
  status: "available" | "empty" | "one-selected" | "no-comparable" | "projection-unavailable";
  query: PublicComparisonQuery;
  selectedSlugs: string[];
  candidates: PublicComparisonCandidate[];
  casinos: PublicComparisonCasino[];
  reasons: PublicComparisonReason[];
  groups: PublicComparisonGroup[];
  hiddenEqualRows: number;
  defaulted: boolean;
  inventoryMode: PublicCasinoInventoryMode | "UNAVAILABLE";
}
