import "server-only";

import { readBoundedRequestText } from "@/lib/programme/http";
import { ServiceError } from "@/lib/services/service-error";

export function isSameOriginMutation(request: Request) {
  let requestUrl: URL;
  try { requestUrl = new URL(request.url); } catch { return false; }
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const parsedOrigin = new URL(origin);
      if (origin !== parsedOrigin.origin) return false;
      const acceptedOrigins = new Set([requestUrl.origin]);
      const requestHost = request.headers.get("host");
      if (requestHost) {
        const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",", 1)[0]?.trim();
        const protocol = forwardedProtocol === "http" || forwardedProtocol === "https"
          ? `${forwardedProtocol}:`
          : requestUrl.protocol;
        const hostOrigin = new URL(`${protocol}//${requestHost}`);
        if (hostOrigin.host === requestHost && hostOrigin.pathname === "/") {
          acceptedOrigins.add(hostOrigin.origin);
        }
      }
      return acceptedOrigins.has(parsedOrigin.origin);
    } catch { return false; }
  }
  // Modern browsers supply Origin for unsafe methods. Sec-Fetch-Site is the
  // only accepted fallback; requests with neither signal fail closed.
  return request.headers.get("sec-fetch-site") === "same-origin";
}

export function assertSameOriginMutation(request: Request) {
  if (!isSameOriginMutation(request)) {
    throw new ServiceError("Cross-origin mutation denied", "CROSS_ORIGIN_DENIED", 403);
  }
}

export async function readBoundedJson(request: Request, maximumBytes = 64 * 1024) {
  const text = await readBoundedRequestText(request, maximumBytes);
  return text ? JSON.parse(text) as unknown : {};
}
