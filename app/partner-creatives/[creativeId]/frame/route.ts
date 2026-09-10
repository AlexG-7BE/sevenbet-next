import { retiredMediaResponse } from "@/lib/media-retirement/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ creativeId: string }> }) {
  void params;
  return retiredMediaResponse();
}
