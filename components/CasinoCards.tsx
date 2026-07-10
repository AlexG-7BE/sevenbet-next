import type { Casino } from "@/lib/data";
import { CasinoCard, OfferCard } from "@/components/ui";

export function BonusCard({ casino, rank }: { casino: Casino; rank: number }) {
  return <OfferCard casino={casino} rank={rank} />;
}

export function CasinoRow({ casino }: { casino: Casino }) {
  return <CasinoCard casino={casino} />;
}
