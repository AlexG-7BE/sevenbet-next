import { permanentRedirect } from "next/navigation";

import { parsePublicComparisonQuery, serializePublicComparisonQuery } from "@/lib/public-comparison/query";

export default async function CompareRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parsePublicComparisonQuery(await searchParams);
  const params = serializePublicComparisonQuery(query);
  permanentRedirect(`/casinos${params.size ? `?${params}` : ""}`);
}
