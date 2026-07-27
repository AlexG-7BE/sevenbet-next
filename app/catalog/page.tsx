import { permanentRedirect } from "next/navigation";

import { parseCasinoDiscoveryQuery, serializeCasinoDiscoveryQuery } from "@/lib/public-casino-discovery/query";

export default async function CatalogRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parseCasinoDiscoveryQuery(await searchParams);
  const params = serializeCasinoDiscoveryQuery(query);
  permanentRedirect(`/casinos${params.size ? `?${params}` : ""}`);
}
