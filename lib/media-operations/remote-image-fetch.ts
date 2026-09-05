import { lookup as dnsLookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { isIP, type LookupFunction } from "node:net";

import {
  MediaValidationError,
  validateMediaUpload,
  type SupportedImageMime,
} from "@/lib/media/image-validation";

const ALLOWED_CONTENT_TYPES = new Set<SupportedImageMime>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);
const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);

export class RemoteImageFetchError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "RemoteImageFetchError";
  }
}

export type ResolvedAddress = { address: string; family: 4 | 6 };
export type RemoteImageResolver = (hostname: string) => Promise<ResolvedAddress[]>;
export type RemoteImageResponse = {
  status: number;
  headers: Record<string, string | undefined>;
  body: Uint8Array;
};
export type RemoteImageTransport = (input: {
  url: URL;
  address: ResolvedAddress;
  maximumBytes: number;
  timeoutMs: number;
}) => Promise<RemoteImageResponse>;

export type RemoteImageFetchOptions = {
  resolver?: RemoteImageResolver;
  transport?: RemoteImageTransport;
  maximumBytes?: number;
  timeoutMs?: number;
  maximumRedirects?: number;
};

function ipv4Octets(value: string) {
  if (isIP(value) !== 4) return null;
  const octets = value.split(".").map(Number);
  return octets.length === 4 && octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255) ? octets : null;
}

function expandIpv6(value: string) {
  const zoneIndex = value.indexOf("%");
  const withoutZone = zoneIndex >= 0 ? value.slice(0, zoneIndex) : value;
  if (isIP(withoutZone) !== 6) return null;
  let normalized = withoutZone.toLowerCase();
  const ipv4Tail = normalized.match(/(?:^|:)(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (ipv4Tail) {
    const octets = ipv4Octets(ipv4Tail);
    if (!octets) return null;
    normalized = normalized.slice(0, -ipv4Tail.length) + `${((octets[0] << 8) | octets[1]).toString(16)}:${((octets[2] << 8) | octets[3]).toString(16)}`;
  }
  const sides = normalized.split("::");
  if (sides.length > 2) return null;
  const left = sides[0] ? sides[0].split(":") : [];
  const right = sides[1] ? sides[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if ((sides.length === 1 && missing !== 0) || missing < 0) return null;
  const groups = [...left, ...Array(sides.length === 2 ? missing : 0).fill("0"), ...right].map((group) => Number.parseInt(group || "0", 16));
  return groups.length === 8 && groups.every((group) => Number.isInteger(group) && group >= 0 && group <= 0xffff) ? groups : null;
}

export function isBlockedRemoteAddress(address: string) {
  const v4 = ipv4Octets(address);
  if (v4) {
    const [a, b, c] = v4;
    return a === 0
      || a === 10
      || (a === 100 && b >= 64 && b <= 127)
      || a === 127
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 0 && c === 0)
      || (a === 192 && b === 0 && c === 2)
      || (a === 192 && b === 88 && c === 99)
      || (a === 192 && b === 168)
      || (a === 198 && (b === 18 || b === 19))
      || (a === 198 && b === 51 && c === 100)
      || (a === 203 && b === 0 && c === 113)
      || a >= 224;
  }
  const v6 = expandIpv6(address);
  if (!v6) return true;
  const [a, b] = v6;
  if (a === 0) {
    const mapped = v6.slice(0, 6).every((group, index) => group === (index === 5 ? 0xffff : 0));
    if (mapped) {
      const embedded = `${v6[6] >> 8}.${v6[6] & 255}.${v6[7] >> 8}.${v6[7] & 255}`;
      return isBlockedRemoteAddress(embedded);
    }
    return true;
  }
  return (a & 0xfe00) === 0xfc00
    || (a & 0xffc0) === 0xfe80
    || (a & 0xffc0) === 0xfec0
    || (a & 0xff00) === 0xff00
    || (a === 0x0064 && b === 0xff9b)
    || (a === 0x0100 && b === 0)
    || (a === 0x2001 && b <= 0x01ff)
    || (a === 0x2001 && b === 0x0db8)
    || a === 0x2002
    || (a === 0x3fff && (b & 0xf000) === 0)
    || a === 0x5f00
    || (a & 0xe000) !== 0x2000;
}

function validateRemoteUrl(value: string | URL) {
  let url: URL;
  try { url = value instanceof URL ? new URL(value.href) : new URL(value); }
  catch { throw new RemoteImageFetchError("Remote image URL is invalid", "INVALID_URL"); }
  if (url.protocol !== "https:") throw new RemoteImageFetchError("Only HTTPS image URLs are permitted", "HTTPS_REQUIRED");
  if (url.username || url.password) throw new RemoteImageFetchError("URL user information is not permitted", "USERINFO_REJECTED");
  if (url.port && url.port !== "443") throw new RemoteImageFetchError("Only the standard HTTPS port is permitted", "PORT_REJECTED");
  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal") || hostname.endsWith(".home.arpa")) {
    throw new RemoteImageFetchError("Local and internal hostnames are not permitted", "HOSTNAME_REJECTED");
  }
  if (hostname === "169.254.169.254" || hostname === "metadata.google.internal") throw new RemoteImageFetchError("Cloud metadata endpoints are not permitted", "METADATA_REJECTED");
  if (!isIP(hostname) && !hostname.includes(".")) throw new RemoteImageFetchError("Single-label hostnames are not permitted", "HOSTNAME_REJECTED");
  url.hash = "";
  return url;
}

const defaultResolver: RemoteImageResolver = async (hostname) => {
  const records = await dnsLookup(hostname, { all: true, verbatim: true });
  return records.map((record) => ({ address: record.address, family: record.family as 4 | 6 }));
};

export function createPinnedLookup(address: ResolvedAddress): LookupFunction {
  return (_hostname, options, callback) => {
    if (options.all) callback(null, [{ address: address.address, family: address.family }]);
    else callback(null, address.address, address.family);
  };
}

const defaultTransport: RemoteImageTransport = ({ url, address, maximumBytes, timeoutMs }) => new Promise((resolve, reject) => {
  let settled = false;
  const finish = (error?: Error, response?: RemoteImageResponse) => {
    if (settled) return;
    settled = true;
    clearTimeout(totalTimer);
    if (error) reject(error);
    else resolve(response!);
  };
  const totalTimer = setTimeout(() => {
    request.destroy(new RemoteImageFetchError("Remote image request timed out", "FETCH_TIMEOUT"));
  }, timeoutMs);
  const request = httpsRequest(url, {
    method: "GET",
    agent: false,
    headers: {
      Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif",
      "Accept-Encoding": "identity",
      "User-Agent": "B4GAMBLE-Media-Ingestion/1.0",
    },
    lookup: createPinnedLookup(address),
  }, (response) => {
    const chunks: Buffer[] = [];
    let received = 0;
    const contentLength = Number(response.headers["content-length"] || 0);
    if (contentLength > maximumBytes) {
      response.destroy();
      finish(new RemoteImageFetchError("Remote image exceeds the byte limit", "REMOTE_FILE_TOO_LARGE"));
      return;
    }
    response.on("data", (chunk: Buffer) => {
      received += chunk.length;
      if (received > maximumBytes) {
        response.destroy(new RemoteImageFetchError("Remote image exceeds the byte limit", "REMOTE_FILE_TOO_LARGE"));
        return;
      }
      chunks.push(chunk);
    });
    response.on("error", (error) => finish(error instanceof Error ? error : new Error(String(error))));
    response.on("end", () => finish(undefined, {
      status: response.statusCode || 0,
      headers: Object.fromEntries(Object.entries(response.headers).map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : value])),
      body: Buffer.concat(chunks),
    }));
  });
  request.setTimeout(Math.min(timeoutMs, 5_000), () => request.destroy(new RemoteImageFetchError("Remote image connection timed out", "FETCH_TIMEOUT")));
  request.on("error", (error) => finish(error instanceof Error ? error : new Error(String(error))));
  request.end();
});

function filenameFor(contentType: SupportedImageMime) {
  const extension = contentType === "image/jpeg" ? "jpg" : contentType.slice("image/".length);
  return `partner-creative.${extension}`;
}

export async function fetchRemoteImage(value: string | URL, options: RemoteImageFetchOptions = {}) {
  const resolver = options.resolver ?? defaultResolver;
  const transport = options.transport ?? defaultTransport;
  const maximumBytes = options.maximumBytes ?? Math.min(Number(process.env.MEDIA_MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024), 10 * 1024 * 1024);
  const timeoutMs = options.timeoutMs ?? 10_000;
  const maximumRedirects = options.maximumRedirects ?? 3;
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 1 || maximumBytes > 10 * 1024 * 1024) throw new RemoteImageFetchError("Invalid remote image byte limit", "INVALID_FETCH_CONFIGURATION");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 250 || timeoutMs > 30_000) throw new RemoteImageFetchError("Invalid remote image timeout", "INVALID_FETCH_CONFIGURATION");
  let url = validateRemoteUrl(value);
  const redirects: string[] = [];

  for (let redirect = 0; redirect <= maximumRedirects; redirect += 1) {
    const hostname = url.hostname.replace(/^\[|\]$/g, "");
    const addresses = await resolver(hostname).catch(() => {
      throw new RemoteImageFetchError("Remote image hostname could not be resolved", "DNS_FAILURE");
    });
    if (!addresses.length || addresses.some((record) => record.family !== 4 && record.family !== 6)) throw new RemoteImageFetchError("Remote image hostname has no usable address", "DNS_FAILURE");
    if (addresses.some((record) => isBlockedRemoteAddress(record.address))) throw new RemoteImageFetchError("Remote image resolved to a prohibited network", "SSRF_ADDRESS_BLOCKED");
    const response = await transport({ url, address: addresses[0], maximumBytes, timeoutMs });
    if (REDIRECT_CODES.has(response.status)) {
      const location = response.headers.location;
      if (!location) throw new RemoteImageFetchError("Remote redirect did not include a location", "INVALID_REDIRECT");
      if (redirect === maximumRedirects) throw new RemoteImageFetchError("Remote image exceeded the redirect limit", "TOO_MANY_REDIRECTS");
      redirects.push(url.href);
      url = validateRemoteUrl(new URL(location, url));
      continue;
    }
    if (response.status < 200 || response.status >= 300) throw new RemoteImageFetchError(`Remote image returned HTTP ${response.status}`, "REMOTE_HTTP_ERROR");
    const contentEncoding = response.headers["content-encoding"]?.trim().toLowerCase();
    if (contentEncoding && contentEncoding !== "identity") throw new RemoteImageFetchError("Compressed remote responses are not permitted", "CONTENT_ENCODING_REJECTED");
    const contentType = response.headers["content-type"]?.split(";", 1)[0].trim().toLowerCase() as SupportedImageMime | undefined;
    if (!contentType || !ALLOWED_CONTENT_TYPES.has(contentType)) throw new RemoteImageFetchError("Remote response is not an allowed raster image", "CONTENT_TYPE_REJECTED");
    try {
      const validated = validateMediaUpload({
        data: response.body,
        filename: filenameFor(contentType),
        declaredMimeType: contentType,
        type: "OTHER",
        maxSizeBytes: maximumBytes,
      });
      return { data: response.body, finalUrl: url, redirects, ...validated };
    } catch (error) {
      if (error instanceof MediaValidationError) throw new RemoteImageFetchError(error.message, error.code);
      throw error;
    }
  }
  throw new RemoteImageFetchError("Remote image could not be fetched", "FETCH_FAILED");
}
