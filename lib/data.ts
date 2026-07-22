import casinoData from "@/data/casinos.json";

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

const casinos = (casinoData as { casinos: Casino[] }).casinos;

export function getCasinos() {
  return casinos;
}

export function getTopCasinos(limit = 8) {
  return [...casinos]
    .sort((a, b) => b.rating - a.rating || b.bonusAmountUsd - a.bonusAmountUsd)
    .slice(0, limit);
}

export function getCasino(slug: string) {
  return casinos.find((casino) => casino.slug === slug);
}

export function getStats() {
  return {
    total: casinos.length,
    verified: casinos.filter((casino) => casino.isVerified).length,
    payments: new Set(casinos.flatMap((casino) => casino.payments)).size,
    licenses: new Set(casinos.map((casino) => casino.license)).size,
  };
}

export function formatMoney(value: number) {
  return `$${Number(value || 0).toLocaleString("en-US")}`;
}
