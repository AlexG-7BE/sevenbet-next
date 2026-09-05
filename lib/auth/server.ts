import "server-only";

import { getAuth, type SevenBetAuth } from "@/lib/auth/instance";

export { getAuth };

export type AuthSession = SevenBetAuth["$Infer"]["Session"];
