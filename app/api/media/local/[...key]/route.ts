import { NextResponse } from "next/server";

import { readLocalStorageObject } from "@/lib/media/storage/local-storage.provider";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const mimeByExtension: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (process.env.NODE_ENV === "production") return new NextResponse("Not found", { status: 404 });
  try {
    const key = (await params).key.join("/");
    const data = await readLocalStorageObject(key);
    const extension = key.split(".").at(-1)?.toLowerCase() || "";
    return new NextResponse(data, {
      headers: {
        "Cache-Control": "no-store, private",
        "Content-Type": mimeByExtension[extension] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
