import "server-only";

import { readBoundedRequestText } from "@/lib/programme/http";
import { ServiceError } from "@/lib/services/service-error";

export function isSameOriginMutation(request: Request) {
  let requestOrigin: string;
  try { requestOrigin = new URL(request.url).origin; } catch { return false; }
  const origin = request.headers.get("origin");
  if (origin) {
    try { return new URL(origin).origin === requestOrigin && origin === new URL(origin).origin; }
    catch { return false; }
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
