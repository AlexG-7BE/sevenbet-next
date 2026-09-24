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

export type GlobalpingProbe = Readonly<{ country: string; city: string | null; network: string | null }>;

export type GlobalpingFetchOptions = Readonly<{
  /** Optional Globalping token; anonymous use is limited per hour. */
  token?: string | null;
  fetcher?: typeof fetch;
  pollIntervalMs?: number;
  timeoutMs?: number;
  onProbe?: (probe: GlobalpingProbe, url: URL, statusCode: number) => void;
}>;

type MeasurementResult = {
  status: string;
  results?: Array<{
    probe?: { country?: string; city?: string; network?: string };
    result?: {
      status?: string;
      statusCode?: number;
      headers?: Record<string, string | string[]>;
      rawBody?: string | null;
      rawOutput?: string | null;
    };
  }>;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrl(input);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("GLOBALPING_PROTOCOL_UNSUPPORTED");
    const method = (init?.method ?? "GET").toUpperCase();
    if (method !== "GET" && method !== "HEAD") throw new Error("GLOBALPING_METHOD_UNSUPPORTED");

    const created = await fetcher(API, {
      method: "POST",
      headers,
      body: JSON.stringify({
        type: "http",
        target: url.hostname,
        locations: [{ country: market }],
        limit: 1,
        measurementOptions: {
          protocol: url.protocol === "https:" ? "HTTPS" : "HTTP",
          ...(url.port ? { port: Number(url.port) } : {}),
          request: { method, host: url.hostname, path: url.pathname || "/", ...(url.search.length > 1 ? { query: url.search.slice(1) } : {}) },
        },
      }),
    });
    if (!created.ok) throw new Error(created.status === 429 ? "GLOBALPING_RATE_LIMITED" : "GLOBALPING_UNAVAILABLE");
    const { id } = await created.json() as { id?: string };
    if (!id) throw new Error("GLOBALPING_UNAVAILABLE");

    const deadline = Date.now() + timeoutMs;
    let measurement: MeasurementResult;
    do {
      await sleep(pollIntervalMs);
      const polled = await fetcher(`${API}/${id}`, { headers: options.token ? { authorization: `Bearer ${options.token}` } : undefined });
      if (!polled.ok) throw new Error("GLOBALPING_UNAVAILABLE");
      measurement = await polled.json() as MeasurementResult;
      if (Date.now() > deadline) throw new Error("TIMEOUT");
    } while (measurement.status === "in-progress");

    const entry = measurement.results?.[0];
    const result = entry?.result;
    if (!entry?.probe?.country) throw new Error("GLOBALPING_NO_PROBE");
    if (entry.probe.country !== market) throw new Error("GLOBALPING_PROBE_OUTSIDE_MARKET");
    if (!result?.statusCode || result.status !== "finished") throw new Error("NETWORK_ERROR");
    options.onProbe?.({ country: entry.probe.country, city: entry.probe.city ?? null, network: entry.probe.network ?? null }, url, result.statusCode);

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
