/**
 * RFC-057 §13: help pages must not load an image from `media.b4gamble.com`. The owner cookie
 * would not travel on that cross-site request, a blocker that blocks `b4gamble.com` may block
 * its media host, and — the reason that needs no speculation — the request itself names the
 * commercial domain in the help page's network log, which is the association the second
 * domain exists to avoid.
 *
 * So the help host serves guide images first-party, from the same content-addressed storage
 * keys the Learn pipeline already writes (RFC-052 §5, `content/learn/<sha256>.<ext>`). The
 * keys are a hash of the bytes, so a response can be cached for a year and a changed image is
 * a different key. `/api/media/*` itself stays COMMERCIAL and answers 404 here.
 */
export const HELP_MEDIA_PREFIX = "content/learn/";

export const HELP_MEDIA_ROUTE = "/api/help-media";

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  avif: "image/avif",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * The key this route will accept, or null. Deliberately narrow and purely syntactic: only the
 * Learn content prefix, only a lower-case hexadecimal checksum of a plausible length, only an
 * image extension. A request cannot reach another prefix of the bucket, and nothing about the
 * check depends on how the path was parsed upstream.
 */
export function helpMediaStorageKey(segments: readonly string[]): string | null {
  const key = segments.join("/");
  if (!key.startsWith(HELP_MEDIA_PREFIX)) return null;
  const name = key.slice(HELP_MEDIA_PREFIX.length);
  const match = /^([0-9a-f]{32,128})\.([a-z0-9]{3,4})$/.exec(name);
  if (!match) return null;
  return match[2] in CONTENT_TYPES ? key : null;
}

export function helpMediaContentType(key: string) {
  return CONTENT_TYPES[key.split(".").at(-1)?.toLowerCase() ?? ""] ?? null;
}

/** The public path a help page uses for a storage key. */
export function helpMediaPath(key: string) {
  return `${HELP_MEDIA_ROUTE}/${key}`;
}

/**
 * Rewrite one image address for the help host. An address already first-party stays as it is;
 * a storage URL whose path ends in a Learn content key becomes the help route; anything else
 * is refused (null), because a help page may not load it at all (§6, rule 1).
 */
export function helpMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith(`${HELP_MEDIA_ROUTE}/`)) return url;
  const path = url.startsWith("/") ? url : (() => {
    try {
      return new URL(url).pathname;
    } catch {
      return null;
    }
  })();
  if (!path) return null;
  const index = path.indexOf(`/${HELP_MEDIA_PREFIX}`);
  if (index < 0) return null;
  const key = path.slice(index + 1);
  return helpMediaStorageKey(key.split("/")) ? helpMediaPath(key) : null;
}
