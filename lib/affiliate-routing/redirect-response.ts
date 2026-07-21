import { validateRedirectTargetUrl } from "@/lib/affiliate-routing/redirect-validation";

export const affiliateRedirectHeaders = {
  "Cache-Control": "no-store, private, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
} as const;

export function unavailableRedirectResponse(status = 404) {
  return new Response("Redirect unavailable.", {
    status,
    headers: { ...affiliateRedirectHeaders, "Content-Type": "text/plain; charset=utf-8" },
  });
}

export function safeAffiliateRedirectResponse(value: string | URL) {
  const destination = validateRedirectTargetUrl(value.toString());
  if (!destination) return unavailableRedirectResponse();
  return new Response(null, {
    status: 302,
    headers: { ...affiliateRedirectHeaders, Location: destination.toString() },
  });
}
