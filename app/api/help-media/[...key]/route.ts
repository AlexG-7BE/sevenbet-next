import { NextResponse } from "next/server";

import { getMediaStorageProvider } from "@/lib/media/storage";
import { helpMediaContentType, helpMediaStorageKey } from "@/lib/site/help-media";

/**
 * RFC-057 §4.1 and §13: the help host's first-party image route, class `HELP`. It serves only
 * the content-addressed Learn keys of RFC-052 §5, so a help guide never asks the browser for
 * an image from `media.b4gamble.com`. `/api/media/*` stays COMMERCIAL and answers 404 here.
 *
 * The key is validated syntactically before anything is fetched (`helpMediaStorageKey`): only
 * the Learn content prefix, only a hexadecimal checksum, only an image extension. The bytes
 * are proxied from the configured storage provider and never re-encoded.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Content-addressed keys never change, so a year is honest and a changed image is a new key. */
const CACHE_CONTROL = "public, max-age=31536000, immutable";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = helpMediaStorageKey((await params).key ?? []);
  const contentType = key ? helpMediaContentType(key) : null;
  if (!key || !contentType) return new NextResponse("Not found", { status: 404 });

  let upstream: Response;
  try {
    upstream = await fetch(getMediaStorageProvider().getPublicUrl(key), { cache: "no-store" });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!upstream.ok || !upstream.body) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(upstream.body, {
    headers: {
      "Cache-Control": CACHE_CONTROL,
      // The stored type is ignored on purpose: the extension decided the key was acceptable,
      // and the same extension decides what the browser is told it received.
      "Content-Type": contentType,
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
