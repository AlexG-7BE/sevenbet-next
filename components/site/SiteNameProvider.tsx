"use client";

import { createContext, useContext, type ReactNode } from "react";

import { DEFAULT_SITE_CLASS, type SiteClass } from "@/lib/site/host-gate";
import { siteName, withSiteName } from "@/lib/site/help-copy";

/**
 * RFC-057 §7.2 reaches the server through one trusted header, which a client component cannot
 * read. The Programme, the sign-in forms and the keepsake card are client components that name
 * the site in their own copy, so the root layout hands the decided class down once and they
 * read it here. The default is `main`, which is what every client component assumed before.
 *
 * It carries the class, not the name, so a component can also ask the question the class
 * answers (is this the help host?) without a second provider.
 */
const SiteClassContext = createContext<SiteClass>(DEFAULT_SITE_CLASS);

export function SiteNameProvider({ children, site }: { children: ReactNode; site: SiteClass }) {
  return <SiteClassContext.Provider value={site}>{children}</SiteClassContext.Provider>;
}

export function useSiteClass() {
  return useContext(SiteClassContext);
}

/** The name this site calls itself: "B4GAMBLE" on the main host, "Pause Plan" on the help host. */
export function useSiteName() {
  return siteName(useSiteClass());
}

/**
 * A translated string that names the main site, as the site that is answering would say it.
 * The hook form so that a client component needs one call and no prop threading.
 */
export function useSiteNameIn() {
  const site = useSiteClass();
  return (text: string) => withSiteName(text, site);
}
