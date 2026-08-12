import "server-only";

import { ResendContactTransport } from "@/lib/contact/resend.server";
import { resolveContactRuntimeConfig } from "@/lib/contact/runtime-config";
import { DisabledContactTransport } from "@/lib/contact/transports";

export function createContactTransport() {
  const config = resolveContactRuntimeConfig();
  return config ? new ResendContactTransport(config) : new DisabledContactTransport();
}
