import { notFound, permanentRedirect } from "next/navigation";

import {
  getLegacyResponsibleGamblingRoute,
  withPreservedLegacyQuery,
} from "@/lib/responsible-gambling";

export const dynamic = "force-dynamic";

export default async function LegacyResponsibleGamblingGuide({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const route = getLegacyResponsibleGamblingRoute(slug);
  if (!route) notFound();
  permanentRedirect(withPreservedLegacyQuery(route.destination, await searchParams));
}
