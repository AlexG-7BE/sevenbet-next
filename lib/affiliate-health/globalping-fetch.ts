/**
 * A `fetch` that performs each request from a probe inside one country,
 * through the Globalping API (https://globalping.io).
 *
 * A partner route checked from our own infrastructure says nothing about what
 * a visitor in the target market is served: SkillOnNet answers a blocked
 * country with HTTP 200 and a block page, and German links only reach the
 * .de site from a German address. Handing this fetch to
 * `checkAffiliateRouteHttp` keeps its redirect-chain, host and attribution
 * rules unchanged while every hop leaves from the market itself.
 *
 * Globalping does not follow redirects, so each hop is its own measurement.
 * The response body is the probe's bounded body (about 10 kB), enough for
 * the HTML head where block markers live.
 */

import { checkAffiliateRouteHttp, type AffiliateRouteHealthExpectation, type AffiliateRouteHttpCheck } from "./checker";

const API = "https://api.globalping.io/v1/measurements";
const EYEBALL_NETWORK_TAG = "eyeball-network";

export type GlobalpingProbe = Readonly<{
  country: string;
  city: string | null;
  network: string | null;
  /** The probe sits on a residential/mobile ("eyeball") network rather than in a datacentre. */
  eyeballNetwork: boolean;
}>;

export type GlobalpingFetchOptions = Readonly<{
  /** Optional Globalping token; anonymous use is limited per hour. */
  token?: string | null;
  fetcher?: typeof fetch;
  pollIntervalMs?: number;
  timeoutMs?: number;
  /**
   * Ask for a probe on a residential/mobile network first. CDNs challenge
   * datacentre addresses (PlayOJO's Cloudflare also challenges London OVH
   * probes), so a player's view needs an eyeball probe. A country without one
   * falls back to any probe there; `onProbe` reports which answered.
   */
  preferEyeballNetwork?: boolean;
  onProbe?: (probe: GlobalpingProbe, url: URL, statusCode: number) => void;
}>;

type MeasurementResult = {
  status: string;
  results?: Array<{
    probe?: { country?: string; city?: string; network?: string; tags?: string[] };
    result?: {
      status?: string;
      statusCode?: number;
      headers?: Record<string, string | string[]>;
      rawBody?: string | null;
      rawOutput?: string | null;
    };
  }>;
};

function sleep(ms: number, signal?: AbortSignal | null) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", aborted);
      resolve();
    }, ms);
    function aborted() {
      clearTimeout(timer);
      reject(signal?.reason);
    }
    signal?.addEventListener("abort", aborted, { once: true });
  });
}

function requestUrl(input: RequestInfo | URL) {
  if (input instanceof URL) return input;
  return new URL(typeof input === "string" ? input : input.url);
}

export function globalpingFetch(country: string, options: GlobalpingFetchOptions = {}): typeof fetch {
  const market = country.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(market)) throw new Error("GLOBALPING_COUNTRY_INVALID");
  const fetcher = options.fetcher ?? fetch;
  const pollIntervalMs = options.pollIntervalMs ?? 750;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  const locations = options.preferEyeballNetwork
    ? [[{ country: market, tags: [EYEBALL_NETWORK_TAG] }], [{ country: market }]]
    : [[{ country: market }]];

  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrl(input);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("GLOBALPING_PROTOCOL_UNSUPPORTED");
    const method = (init?.method ?? "GET").toUpperCase();
    if (method !== "GET" && method !== "HEAD") throw new Error("GLOBALPING_METHOD_UNSUPPORTED");
    // The caller's deadline (checkAffiliateRouteHttp's timeout) bounds every
    // API call and poll, so a slow probe cannot outlive the route check.
    const signal = init?.signal ?? null;

    let created: Response | null = null;
    for (const location of locations) {
      created = await fetcher(API, {
        method: "POST",
        headers,
        signal,
        body: JSON.stringify({
          type: "http",
          target: url.hostname,
          locations: location,
          limit: 1,
          measurementOptions: {
            protocol: url.protocol === "https:" ? "HTTPS" : "HTTP",
            ...(url.port ? { port: Number(url.port) } : {}),
            request: { method, host: url.hostname, path: url.pathname || "/", ...(url.search.length > 1 ? { query: url.search.slice(1) } : {}) },
          },
        }),
      });
      // 422 means no probe matches this location; the next, wider one may.
      if (created.status !== 422) break;
      await created.body?.cancel();
    }
    if (!created) throw new Error("GLOBALPING_UNAVAILABLE");
    if (created.status === 422) throw new Error("GLOBALPING_NO_PROBE");
    if (!created.ok) throw new Error(created.status === 429 ? "GLOBALPING_RATE_LIMITED" : "GLOBALPING_UNAVAILABLE");
    const { id } = await created.json() as { id?: string };
    if (!id) throw new Error("GLOBALPING_UNAVAILABLE");

    const deadline = Date.now() + timeoutMs;
    let measurement: MeasurementResult;
    do {
      await sleep(pollIntervalMs, signal);
      const polled = await fetcher(`${API}/${id}`, { headers: options.token ? { authorization: `Bearer ${options.token}` } : undefined, signal });
      if (!polled.ok) throw new Error("GLOBALPING_UNAVAILABLE");
      measurement = await polled.json() as MeasurementResult;
      if (Date.now() > deadline) throw new Error("TIMEOUT");
    } while (measurement.status === "in-progress");

    const entry = measurement.results?.[0];
    const result = entry?.result;
    if (!entry?.probe?.country) throw new Error("GLOBALPING_NO_PROBE");
    if (entry.probe.country !== market) throw new Error("GLOBALPING_PROBE_OUTSIDE_MARKET");
    if (!result?.statusCode || result.status !== "finished") throw new Error("NETWORK_ERROR");
    options.onProbe?.({
      country: entry.probe.country,
      city: entry.probe.city ?? null,
      network: entry.probe.network ?? null,
      eyeballNetwork: Array.isArray(entry.probe.tags) && entry.probe.tags.includes(EYEBALL_NETWORK_TAG),
    }, url, result.statusCode);

    const responseHeaders = new Headers();
    for (const [name, value] of Object.entries(result.headers ?? {})) {
      // Content-Encoding describes the wire body; Globalping returns it decoded.
      if (name.toLowerCase() === "content-encoding" || name.toLowerCase() === "content-length") continue;
      for (const item of Array.isArray(value) ? value : [value]) responseHeaders.append(name, item);
    }
    const bodyless = method === "HEAD" || [204, 304].includes(result.statusCode) || result.statusCode < 200;
    return new Response(bodyless ? null : result.rawBody ?? "", { status: Math.max(200, result.statusCode), headers: responseHeaders });
  }) as typeof fetch;
}

/**
 * Checks a partner route as a visitor in `country` sees it. The probe, not
 * this process, opens each URL, so the local private-network guard does not
 * apply. The route itself must be HTTPS; a partner's own chain may pass
 * through a plain-HTTP hop (EGO's German links do) as a browser would.
 */
export function checkAffiliateRouteFromMarket(input: {
  url: URL;
  country: string;
  expectation: AffiliateRouteHealthExpectation;
  globalping?: GlobalpingFetchOptions;
  timeoutMs?: number;
}): Promise<AffiliateRouteHttpCheck> {
  return checkAffiliateRouteHttp({
    url: input.url,
    expectation: input.expectation,
    fetcher: globalpingFetch(input.country, input.globalping),
    validateUrl: async (url) => {
      const secureStart = url.href !== input.url.href || url.protocol === "https:";
      if (!secureStart || !["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error("UNSAFE_HEALTH_TARGET");
    },
    timeoutMs: input.timeoutMs ?? 120_000,
    inspectTerminalContent: true,
  });
}
