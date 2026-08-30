"use client";

import { usePathname } from "next/navigation";

import { publicErrorMessages } from "./public-errors";
import { isLocalizedPublicDestination, localizePublicPath, parsePublicMarketRoute } from "@/lib/market/routing";

export function usePublicErrorContext() {
  const parsed = parsePublicMarketRoute(usePathname());
  const presentation = parsed.kind === "INVALID" ? null : parsed;
  return {
    messages: publicErrorMessages(presentation?.locale ?? "en-GB"),
    hrefFor: (href: string) => presentation && isLocalizedPublicDestination(href) ? localizePublicPath(presentation.market, presentation.locale, href) : href,
  };
}
