import { headers } from "next/headers";

import { SITE_CLASS_HEADER, siteClassFromHeaderValue, type SiteClass } from "@/lib/site/host-gate";

/**
 * The one helper server code uses to learn which site is answering (RFC-057 §7.2). The class
 * comes from the trusted header middleware sets after it has decided the host; middleware
 * strips any incoming copy first, so a client cannot name a site. No component reads `Host`.
 *
 * Outside a request (a build-time render, a unit test) there is no header and the answer is
 * `main`, which is what every main-site surface already assumed.
 */
export async function resolveServerSite(): Promise<SiteClass> {
  try {
    const requestHeaders = await headers();
    return siteClassFromHeaderValue(requestHeaders.get(SITE_CLASS_HEADER));
  } catch {
    return "main";
  }
}
