"use client";

import { usePathname } from "next/navigation";

import { productPageMessages } from "./product-pages-catalog";
import { isLocalizedPublicDestination, parsePublicMarketRoute, localizePublicPath } from "@/lib/market/routing";

export function useProductPageContext() {
  const pathname = usePathname();
  const parsed = parsePublicMarketRoute(pathname);
  const explicit = parsed.kind === "INVALID" ? null : parsed;
  const messages = productPageMessages(explicit?.locale ?? "en-GB");
  return {
    messages,
    productHref(href: string) {
      return explicit && isLocalizedPublicDestination(href, explicit.market)
        ? localizePublicPath(explicit.market, explicit.locale, href)
        : href;
    },
  };
}
