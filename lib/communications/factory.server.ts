import "server-only";

import { PrismaCommunicationAccountDirectory } from "@/lib/communications/account-directory.server";
import { resolveCommunicationRuntimeConfig } from "@/lib/communications/runtime-config";
import { CommunicationService } from "@/lib/communications/service";
import { DisabledEmailTransport } from "@/lib/communications/transports";

export function createDisabledCommunicationService() {
  return new CommunicationService(
    new PrismaCommunicationAccountDirectory(),
    new DisabledEmailTransport(),
    resolveCommunicationRuntimeConfig(),
  );
}
