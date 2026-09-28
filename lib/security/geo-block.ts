import { NextResponse, type NextRequest } from "next/server";

import { PRODUCTION_CANONICAL_ORIGIN } from "@/lib/auth/runtime-canonical-host";
import { requestCountrySignalFromHeaders } from "@/lib/jurisdiction/request-country";
import { createCspNonce } from "@/lib/security/content-security-policy";
import { geoBlockPageHtml } from "@/lib/security/geo-block-page";

// Country geo-block with a personal owner bypass (Founder, 28 Sep 2026). Middleware calls
// geoBlockGate() before any content: a visitor from BLOCKED_COUNTRIES gets HTTP 451 unless
// they carry a valid owner cookie. The country comes only from the trusted Vercel signal.
// Static assets that skip middleware are covered by the Vercel Firewall rule in
// lib/security/geo-block-firewall-rule.ts.

export const OWNER_BYPASS_COOKIE = "b4g_owner";
export const OWNER_BYPASS_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
export const OWNER_BYPASS_KEY_MIN_LENGTH = 32;
export const OWNER_UNLOCK_PATH_MIN_LENGTH = 12;

const OWNER_TOKEN_VERSION = "v1";
// 32 signature bytes are 43 base64url characters; the last one carries 4 bits, so only its
// canonical spelling is accepted and every token has exactly one valid string.
const OWNER_TOKEN_PATTERN = /^v1\.(\d{10})\.([A-Za-z0-9_-]{42}[AEIMQUYcgkosw048])$/;
const OWNER_TOKEN_CLOCK_SKEW_SECONDS = 300;
const RESERVED_UNLOCK_SEGMENTS = new Set(["_next", "admin", "api", "unlock"]);
const CANONICAL_HOSTNAME = new URL(PRODUCTION_CANONICAL_ORIGIN).hostname;

export type GeoBlockConfig = {
  enabled: boolean;
  blockedCountries: ReadonlySet<string>;
  /** Null when unset or shorter than OWNER_BYPASS_KEY_MIN_LENGTH: no unlock, no bypass. */
  ownerKey: string | null;
  /** Null when unset, too short, malformed or reserved. */
  unlockPath: string | null;
};

export type GeoBlockEnvironment = {
  GEO_BLOCK_ENABLED?: string;
  BLOCKED_COUNTRIES?: string;
  OWNER_BYPASS_KEY?: string;
  OWNER_UNLOCK_PATH?: string;
};

function normalizeUnlockPath(value: string | undefined) {
  const path = value?.trim().replace(/\/+$/, "");
  if (!path || path.length < OWNER_UNLOCK_PATH_MIN_LENGTH || !/^(?:\/[A-Za-z0-9_-]+)+$/.test(path)) return null;
  const firstSegment = path.split("/")[1].toLowerCase();
  return RESERVED_UNLOCK_SEGMENTS.has(firstSegment) ? null : path;
}

export function geoBlockConfig(environment: GeoBlockEnvironment): GeoBlockConfig {
  const blockedCountries = new Set(
    (environment.BLOCKED_COUNTRIES ?? "")
      .split(/[\s,]+/)
      .map((value) => value.trim().toUpperCase())
      .filter((value) => /^[A-Z]{2}$/.test(value)),
  );
  const ownerKey = environment.OWNER_BYPASS_KEY?.trim() ?? "";
  return {
    enabled: environment.GEO_BLOCK_ENABLED?.trim().toLowerCase() === "true" && blockedCountries.size > 0,
    blockedCountries,
    ownerKey: ownerKey.length >= OWNER_BYPASS_KEY_MIN_LENGTH ? ownerKey : null,
    unlockPath: normalizeUnlockPath(environment.OWNER_UNLOCK_PATH),
  };
}

/** Named reads, so the edge bundle sees exactly which variables it needs. */
export function geoBlockConfigFromProcessEnv() {
  return geoBlockConfig({
    GEO_BLOCK_ENABLED: process.env.GEO_BLOCK_ENABLED,
    BLOCKED_COUNTRIES: process.env.BLOCKED_COUNTRIES,
    OWNER_BYPASS_KEY: process.env.OWNER_BYPASS_KEY,
    OWNER_UNLOCK_PATH: process.env.OWNER_UNLOCK_PATH,
  });
}

const encoder = new TextEncoder();

function encodeBase64Url(value: ArrayBuffer) {
  const binary = String.fromCharCode(...new Uint8Array(value));
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

function ownerTokenPayload(issuedAtSeconds: number) {
  return encoder.encode(["b4g-owner-bypass", OWNER_TOKEN_VERSION, String(issuedAtSeconds)].join("\u0000"));
}

function ownerSigningKey(ownerKey: string, usage: "sign" | "verify") {
  return crypto.subtle.importKey("raw", encoder.encode(ownerKey), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

/**
 * The cookie carries an HMAC of a versioned timestamp under OWNER_BYPASS_KEY, never the key.
 * A new key therefore invalidates every earlier cookie.
 */
export async function signOwnerBypassToken(ownerKey: string, nowMs = Date.now()) {
  const issuedAtSeconds = Math.floor(nowMs / 1000);
  const signature = await crypto.subtle.sign("HMAC", await ownerSigningKey(ownerKey, "sign"), ownerTokenPayload(issuedAtSeconds));
  return `${OWNER_TOKEN_VERSION}.${issuedAtSeconds}.${encodeBase64Url(signature)}`;
}

export async function verifyOwnerBypassToken(token: string | undefined, ownerKey: string | null, nowMs = Date.now()) {
  if (!token || !ownerKey) return false;
  const match = OWNER_TOKEN_PATTERN.exec(token);
  if (!match) return false;
  const issuedAtSeconds = Number(match[1]);
  const ageSeconds = nowMs / 1000 - issuedAtSeconds;
  if (ageSeconds < -OWNER_TOKEN_CLOCK_SKEW_SECONDS || ageSeconds > OWNER_BYPASS_MAX_AGE_SECONDS) return false;
  try {
    // WebCrypto HMAC verification compares in constant time.
    return await crypto.subtle.verify(
      "HMAC",
      await ownerSigningKey(ownerKey, "verify"),
      decodeBase64Url(match[2]),
      ownerTokenPayload(issuedAtSeconds),
    );
  } catch {
    return false;
  }
}

/** Constant-time: both values are MACed under a fresh random key and the MACs compared by verify(). */
export async function ownerKeyMatches(provided: string, ownerKey: string) {
  const key = await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(ownerKey));
  return crypto.subtle.verify("HMAC", key, expected, encoder.encode(provided));
}

/** b4gamble.com and www share one cookie; preview and local hosts get a host-only cookie. */
function ownerCookieDomain(hostname: string) {
  return hostname === CANONICAL_HOSTNAME || hostname.endsWith(`.${CANONICAL_HOSTNAME}`)
    ? CANONICAL_HOSTNAME
    : undefined;
}

function privateOwnerRedirect(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

async function ownerUnlockResponse(request: NextRequest, ownerKey: string, nowMs: number) {
  const response = privateOwnerRedirect(request);
  response.cookies.set({
    name: OWNER_BYPASS_COOKIE,
    value: await signOwnerBypassToken(ownerKey, nowMs),
    domain: ownerCookieDomain(request.nextUrl.hostname),
    httpOnly: true,
    maxAge: OWNER_BYPASS_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: true,
  });
  return response;
}

function ownerLogoutResponse(request: NextRequest) {
  const response = privateOwnerRedirect(request);
  response.cookies.set({
    name: OWNER_BYPASS_COOKIE,
    value: "",
    domain: ownerCookieDomain(request.nextUrl.hostname),
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: true,
  });
  return response;
}

export function geoBlockedResponse() {
  const nonce = createCspNonce();
  return new NextResponse(geoBlockPageHtml(nonce), {
    status: 451,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Language": "ru, en, kk",
      "Content-Security-Policy": `default-src 'none'; style-src 'nonce-${nonce}'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
      "Content-Type": "text/html; charset=utf-8",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

/** Path, host and nothing else: no IP, query string (which may hold the key) or user agent. */
function logUnknownCountry(request: NextRequest, config: GeoBlockConfig, pathname: string) {
  const ownerPath = config.unlockPath
    && (pathname === config.unlockPath || pathname.startsWith(`${config.unlockPath}/`));
  console.warn(JSON.stringify({
    event: "geo_block.country_unknown",
    host: request.nextUrl.hostname,
    path: ownerPath ? "[owner-path]" : pathname,
  }));
}

/**
 * Returns the response that ends the request (owner unlock/logout redirect or the 451 page),
 * or null when the request continues through the ordinary middleware. A wrong key and a
 * logout without a cookie continue as an ordinary visit, so the owner path reveals nothing.
 */
export async function geoBlockGate(
  request: NextRequest,
  config: GeoBlockConfig = geoBlockConfigFromProcessEnv(),
  nowMs = Date.now(),
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname.length > 1
    ? request.nextUrl.pathname.replace(/\/+$/, "")
    : request.nextUrl.pathname;

  if (config.unlockPath) {
    if (pathname === config.unlockPath && config.ownerKey) {
      const key = request.nextUrl.searchParams.get("key");
      if (key && await ownerKeyMatches(key, config.ownerKey)) {
        return ownerUnlockResponse(request, config.ownerKey, nowMs);
      }
    } else if (pathname === `${config.unlockPath}/logout` && request.cookies.has(OWNER_BYPASS_COOKIE)) {
      return ownerLogoutResponse(request);
    }
  }

  if (!config.enabled) return null;

  const countryCode = requestCountrySignalFromHeaders(request.headers)?.countryCode;
  if (!countryCode) {
    logUnknownCountry(request, config, pathname);
    return null;
  }
  if (!config.blockedCountries.has(countryCode)) return null;
  if (await verifyOwnerBypassToken(request.cookies.get(OWNER_BYPASS_COOKIE)?.value, config.ownerKey, nowMs)) {
    return null;
  }
  return geoBlockedResponse();
}
