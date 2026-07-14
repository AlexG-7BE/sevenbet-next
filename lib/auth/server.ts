import "server-only";

import { createSevenBetAuth } from "@/lib/auth/config";

export const auth = createSevenBetAuth();

export type AuthSession = typeof auth.$Infer.Session;
