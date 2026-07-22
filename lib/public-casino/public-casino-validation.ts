import { absoluteUrl, siteUrl } from "@/lib/site";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const allowedSchemaTypes = new Set(["BreadcrumbList", "WebPage", "Review", "Organization"]);

export function isSafePublicSlug(value: string) {
  return slugPattern.test(value) && value.length <= 120;
}

export function safePublicUrl(value: unknown, options: { allowInternal?: boolean } = {}) {
  if (typeof value !== "string" || !value.trim()) return null;
  const candidate = value.trim();
  if (options.allowInternal && candidate.startsWith("/") && !candidate.startsWith("//")) return candidate;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && parsed.hostname === "localhost")) return null;
    if (parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function safeCanonical(value: unknown, slug: string) {
  const fallback = absoluteUrl(`/casino/${slug}`);
  const safe = safePublicUrl(value, { allowInternal: true });
  if (!safe) return fallback;
  try {
    const parsed = new URL(safe, siteUrl);
    if (parsed.origin !== new URL(siteUrl).origin) return fallback;
    return parsed.toString();
  } catch {
    return fallback;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function validatedStructuredData(value: unknown) {
  const entries = Array.isArray(value) ? value : [value];
  const safe = entries.flatMap((entry) => {
    if (!isRecord(entry) || entry["@context"] !== "https://schema.org") return [];
    const type = typeof entry["@type"] === "string" ? entry["@type"] : "";
    if (!allowedSchemaTypes.has(type)) return [];
    const output: Record<string, unknown> = { "@context": "https://schema.org", "@type": type };
    for (const key of ["name", "headline", "description", "datePublished", "dateModified"]) {
      if (typeof entry[key] === "string") output[key] = entry[key];
    }
    return [output];
  });
  if (!safe.length) return null;
  return Array.isArray(value) ? safe : safe[0];
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
