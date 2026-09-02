import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

function privateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b, c] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 0)
    || (a === 192 && b === 168)
    || (a === 192 && b === 88 && c === 99)
    || (a === 198 && (b === 18 || b === 19))
    || (a === 198 && b === 51 && c === 100)
    || (a === 203 && b === 0 && c === 113);
}

function privateIpv6(address: string) {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  const mapped = normalized.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)?.[1];
  if (mapped) return privateIpv4(mapped);
  const hexadecimalMapped = normalized.match(/^::ffff:([a-f0-9]{1,4}):([a-f0-9]{1,4})$/);
  if (hexadecimalMapped) {
    const high = Number.parseInt(hexadecimalMapped[1], 16);
    const low = Number.parseInt(hexadecimalMapped[2], 16);
    return privateIpv4(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
  }
  return normalized === "::" || normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd")
    || /^fe[89a-f]/.test(normalized) || normalized.startsWith("ff") || normalized.startsWith("2001:db8:");
}

export function isPublicAddress(address: string) {
  const family = isIP(address);
  return family === 4 ? !privateIpv4(address) : family === 6 ? !privateIpv6(address) : false;
}

export async function assertPublicNetworkUrl(value: URL) {
  const hostname = value.hostname.toLowerCase().replace(/\.$/, "");
  if (value.protocol !== "https:" || value.username || value.password || !hostname
    || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new Error("UNSAFE_HEALTH_TARGET");
  }
  if (isIP(hostname)) {
    if (!isPublicAddress(hostname)) throw new Error("UNSAFE_HEALTH_TARGET");
    return;
  }
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((entry) => !isPublicAddress(entry.address))) throw new Error("UNSAFE_HEALTH_TARGET");
}
