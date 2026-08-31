import { permanentRedirect } from "next/navigation";

import { parsePublicComparisonQuery, serializePublicComparisonQuery } from "@/lib/public-comparison/query";
import { resolveServerPresentationContext } from "@/lib/market/server";
import { productHref } from "@/lib/market/product-context";
import { triggerPublicCommercialErrorHarness } from "@/lib/qa/public-commercial-error-harness";

export default async function CompareRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  triggerPublicCommercialErrorHarness(raw.errorFixture);
  const presentation = await resolveServerPresentationContext();
  const query = parsePublicComparisonQuery(raw, presentation.market.countryCode);
  const params = serializePublicComparisonQuery(query);
  if (raw.country === undefined) params.delete("country");
  permanentRedirect(productHref(presentation, `/casinos${params.size ? `?${params}` : ""}`));
}
