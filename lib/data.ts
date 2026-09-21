// Props shape for the older review components in components/ui.tsx. Casino content itself comes from the database.
export type Casino = {
  id: string;
  slug: string;
  domain: string;
  name: string;
  operator: string;
  tagline: string;
  description: string;
  rating: number;
  license: string;
  licenseStatus: string;
  country: string;
  category: string;
  bonusHeadline: string;
  bonusAmountUsd: number;
  freeSpins: number;
  wagering: number;
  minDeposit: number;
  payoutHours: number;
  affiliateUrl: string;
  payments: string[];
  currencies: string[];
  providers: string[];
  gameTypes: string[];
  countries: string[];
  languages: string[];
  crypto: boolean;
  liveChat: boolean;
  mobileApp: boolean;
  isVerified: boolean;
  reviewNeeded: boolean;
  pros: string[];
  cons: string[];
  foundedYear?: number | null;
  publishedAt?: string | null;
  logo?: { url: string; alt: string; width: number | null; height: number | null } | null;
  hero?: { url: string; alt: string; width: number | null; height: number | null } | null;
  gallery?: Array<{ id: string; url: string; alt: string; width: number | null; height: number | null; caption?: string | null }>;
  affiliateAvailable?: boolean;
  termsUrl?: string | null;
  importantConditions?: string[];
  bonusExpiresAt?: string | null;
};

export function formatMoney(value: number) {
  return `$${Number(value || 0).toLocaleString("en-US")}`;
}
