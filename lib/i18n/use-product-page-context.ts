"use client";

import { usePathname } from "next/navigation";

import { productPageMessages } from "./product-pages-catalog";
import { parseLocalizedPublicPath, localizePublicPath } from "@/lib/market/routing";

export function useProductPageContext() {
  const pathname = usePathname();
  const explicit = parseLocalizedPublicPath(pathname);
  const messages = productPageMessages(explicit?.locale ?? "en-GB");
  return {
    messages,
    productHref(href: string) {
      return explicit ? localizePublicPath(explicit.market, explicit.locale, href) : href;
    },
  };
}
