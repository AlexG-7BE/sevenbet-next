import { createContactTransport } from "@/lib/contact/factory.server";
import { handleContactPost } from "@/lib/contact/http.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleContactPost(request, {
    transport: createContactTransport(),
    logger: (metadata) => console.info("contact_delivery", metadata),
  });
}
