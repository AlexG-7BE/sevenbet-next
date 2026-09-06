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
  allowWwwEquivalentFinalHost?: boolean;
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
const healthCheckUserAgent = "B4Gamble-Affiliate-Route-Health/1.0";
const visitorNavigationUserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

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
  userAgent: string,
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
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
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

async function boundedResponsePrefix(response: Response, maximumBytes = 16_384) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    while (received < maximumBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      const bounded = value.subarray(0, Math.min(value.byteLength, maximumBytes - received));
      chunks.push(bounded);
      received += bounded.byteLength;
      if (bounded.byteLength < value.byteLength) break;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  const combined = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(combined);
}

async function terminalResponseFailure(response: Response) {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (/\b(?:application|text)\/(?:[a-z0-9.+-]*\+)?json\b/.test(contentType)) {
    await response.body?.cancel();
    return "TERMINAL_JSON_RESPONSE";
  }
  if (contentType && !contentType.includes("html") && !contentType.startsWith("text/")) {
    await response.body?.cancel();
    return null;
  }
  const prefix = await boundedResponsePrefix(response);
  const headings = [...prefix.matchAll(/<(?:title|h1)\b[^>]*>([\s\S]{0,500}?)<\/(?:title|h1)>/gi)]
    .map((match) => match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .join(" ");
  if (/\b(?:just a moment|attention required|access denied|checking (?:your )?browser|captcha)\b/i.test(headings)) {
    return "TERMINAL_CHALLENGE_PAGE";
  }
  return /\b(?:404|page not found|not found|invalid (?:link|request)|expired (?:link|offer)|link expired|something went wrong|error)\b/i.test(headings)
    ? "TERMINAL_ERROR_PAGE"
    : null;
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
  const finalHost = finalUrl.hostname.toLowerCase().replace(/\.$/, "");
  const finalHostMatches = finalHost === expectedHost
    || (expectation.allowWwwEquivalentFinalHost
      && finalHost.replace(/^www\./, "") === expectedHost.replace(/^www\./, ""));
  if (!finalHostMatches
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
  inspectTerminalContent?: boolean;
}): Promise<AffiliateRouteHttpCheck> {
  const started = performance.now();
  const fetcher = input.fetcher ?? fetch;
  const timeoutMs = input.timeoutMs ?? 12_000;
  const validateUrl = input.validateUrl ?? assertPublicNetworkUrl;
  const deadline = started + timeoutMs;
  let method: "HEAD" | "GET" = input.inspectTerminalContent ? "GET" : "HEAD";
  const userAgent = input.inspectTerminalContent ? visitorNavigationUserAgent : healthCheckUserAgent;
  try {
    let result = await safeFetchChain(input.url, method, fetcher, deadline, validateUrl, userAgent);
    if (!input.inspectTerminalContent && (result.response.status === 405 || result.response.status === 501)) {
      method = "GET";
      result = await safeFetchChain(input.url, method, fetcher, deadline, validateUrl, userAgent);
    }
    const classified = classify(result, method, input.expectation, performance.now() - started);
    if (!input.inspectTerminalContent || classified.status !== "HEALTHY") {
      await result.response.body?.cancel().catch(() => undefined);
      return classified;
    }
    const terminalFailure = await terminalResponseFailure(result.response);
    return terminalFailure ? { ...classified, status: "BROKEN", reason: terminalFailure } : classified;
  } catch (error) {
    const reason = error instanceof Error && /^[A-Z0-9_]+$/.test(error.message) ? error.message
      : error instanceof DOMException && error.name === "TimeoutError" ? "TIMEOUT"
        : "NETWORK_ERROR";
    return { status: "BROKEN", reason, method, statusCode: null, durationMs: Math.round(performance.now() - started), redirectCount: 0, finalHost: null };
  }
}
