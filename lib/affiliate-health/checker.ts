import { performance } from "node:perf_hooks";

import { assertPublicNetworkUrl } from "./public-network-url";

export type AffiliateRouteHealthStatus =
  | "HEALTHY"
  | "DEGRADED"
  | "EXTERNAL_CHALLENGE"
  | "BROKEN"
  | "EXPIRED"
  | "CROSS_GEO"
  | "ATTRIBUTION_FAILURE";

export interface AffiliateRouteHealthExpectation {
  expectedFinalHost: string;
  expectedPathPrefix?: string | null;
  requiredAttributionParameters: string[];
}

export interface AffiliateRouteHttpCheck {
  status: AffiliateRouteHealthStatus;
  reason: string;
  method: "HEAD" | "GET";
  statusCode: number | null;
  durationMs: number;
  redirectCount: number;
  finalHost: string | null;
}

interface SafeFetchResult {
  response: Response;
  finalUrl: URL;
  chain: URL[];
}

const maximumRedirects = 6;
const challengeStatuses = new Set([401, 403, 429]);

function timeoutSignal(deadline: number) {
  const remaining = Math.ceil(deadline - performance.now());
  if (remaining <= 0) throw new Error("TIMEOUT");
  return AbortSignal.timeout(remaining);
}

async function safeFetchChain(
  initialUrl: URL,
  method: "HEAD" | "GET",
  fetcher: typeof fetch,
  deadline: number,
  validateUrl: (url: URL) => Promise<void>,
): Promise<SafeFetchResult> {
  let current = initialUrl;
  const chain = [new URL(current)];
  for (let redirects = 0; redirects <= maximumRedirects; redirects += 1) {
    await validateUrl(current);
    const response = await fetcher(current, {
      method,
      redirect: "manual",
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      headers: {
        "User-Agent": "B4Gamble-Affiliate-Route-Health/1.0",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
        ...(method === "GET" ? { Range: "bytes=0-0", Purpose: "prefetch" } : {}),
      },
      signal: timeoutSignal(deadline),
    });
    if (response.status < 300 || response.status >= 400) return { response, finalUrl: current, chain };
    const location = response.headers.get("location");
    if (!location) return { response, finalUrl: current, chain };
    await response.body?.cancel();
    if (redirects === maximumRedirects) throw new Error("REDIRECT_LIMIT_EXCEEDED");
    const next = new URL(location, current);
    if (chain.some((url) => url.href === next.href)) throw new Error("REDIRECT_LOOP");
    current = next;
    chain.push(new URL(current));
  }
  throw new Error("REDIRECT_LIMIT_EXCEEDED");
}

function attributionPresent(chain: URL[], names: string[]) {
  const seen = new Set(chain.flatMap((url) => [...url.searchParams.keys()]));
  return names.every((name) => seen.has(name));
}

function classify(result: SafeFetchResult, method: "HEAD" | "GET", expectation: AffiliateRouteHealthExpectation, durationMs: number): AffiliateRouteHttpCheck {
  const { response, finalUrl, chain } = result;
  const base = { method, statusCode: response.status, durationMs: Math.round(durationMs), redirectCount: chain.length - 1, finalHost: finalUrl.hostname.toLowerCase() };
  if (response.status === 410) return { ...base, status: "EXPIRED", reason: "HTTP_410" };
  const server = response.headers.get("server")?.toLowerCase() ?? "";
  if (response.status === 503 && (response.headers.has("cf-ray") || response.headers.get("cf-mitigated") === "challenge" || server.includes("cloudflare"))) {
    return { ...base, status: "EXTERNAL_CHALLENGE", reason: "HTTP_503_CDN_CHALLENGE" };
  }
  if (challengeStatuses.has(response.status)) return { ...base, status: "EXTERNAL_CHALLENGE", reason: `HTTP_${response.status}` };
  if (response.status >= 400) return { ...base, status: "BROKEN", reason: `HTTP_${response.status}` };
  const expectedHost = expectation.expectedFinalHost.toLowerCase().replace(/\.$/, "");
  if (finalUrl.hostname.toLowerCase().replace(/\.$/, "") !== expectedHost
    || (expectation.expectedPathPrefix && !finalUrl.pathname.startsWith(expectation.expectedPathPrefix))) {
    return { ...base, status: "CROSS_GEO", reason: "UNEXPECTED_FINAL_DESTINATION" };
  }
  if (!attributionPresent(chain, expectation.requiredAttributionParameters)) {
    return { ...base, status: "ATTRIBUTION_FAILURE", reason: "REQUIRED_ATTRIBUTION_PARAMETER_MISSING" };
  }
  if (response.status >= 200 && response.status < 300) return { ...base, status: "HEALTHY", reason: method === "GET" ? "GET_FALLBACK_OK" : "HEAD_OK" };
  return { ...base, status: "DEGRADED", reason: `UNEXPECTED_HTTP_${response.status}` };
}

export async function checkAffiliateRouteHttp(input: {
  url: URL;
  expectation: AffiliateRouteHealthExpectation;
  fetcher?: typeof fetch;
  timeoutMs?: number;
  validateUrl?: (url: URL) => Promise<void>;
}): Promise<AffiliateRouteHttpCheck> {
  const started = performance.now();
  const fetcher = input.fetcher ?? fetch;
  const timeoutMs = input.timeoutMs ?? 12_000;
  const validateUrl = input.validateUrl ?? assertPublicNetworkUrl;
  const deadline = started + timeoutMs;
  try {
    let method: "HEAD" | "GET" = "HEAD";
    let result = await safeFetchChain(input.url, method, fetcher, deadline, validateUrl);
    if (result.response.status === 405 || result.response.status === 501) {
      method = "GET";
      result = await safeFetchChain(input.url, method, fetcher, deadline, validateUrl);
    }
    return classify(result, method, input.expectation, performance.now() - started);
  } catch (error) {
    const reason = error instanceof Error && /^[A-Z0-9_]+$/.test(error.message) ? error.message
      : error instanceof DOMException && error.name === "TimeoutError" ? "TIMEOUT"
        : "NETWORK_ERROR";
    return { status: "BROKEN", reason, method: "HEAD", statusCode: null, durationMs: Math.round(performance.now() - started), redirectCount: 0, finalHost: null };
  }
}
