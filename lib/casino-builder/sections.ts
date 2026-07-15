import type { CasinoBuilderSection } from "./types";

export const casinoBuilderSections: Array<{
  id: CasinoBuilderSection;
  label: string;
  description: string;
}> = [
  { id: "general", label: "General", description: "Identity and editorial overview" },
  { id: "seo", label: "SEO", description: "Search and social metadata" },
  { id: "licenses", label: "Licenses", description: "Authorities and verification" },
  { id: "countries", label: "Countries", description: "Availability and restrictions" },
  { id: "payments", label: "Payments", description: "Deposit and withdrawal methods" },
  { id: "game-providers", label: "Game Providers", description: "Provider coverage" },
  { id: "game-categories", label: "Game Categories", description: "Game catalogue structure" },
  { id: "bonuses", label: "Bonuses", description: "Structured offer records" },
  { id: "affiliate-links", label: "Affiliate Links", description: "Managed destinations" },
  { id: "media", label: "Media", description: "Logo and review imagery" },
  { id: "publishing", label: "Publishing", description: "Validation and workflow" },
  { id: "history", label: "History", description: "Revisions and versions" },
];

export function isCasinoBuilderSection(value: string | undefined): value is CasinoBuilderSection {
  return casinoBuilderSections.some((section) => section.id === value);
}
