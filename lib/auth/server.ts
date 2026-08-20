import "server-only";

import { auth } from "@/lib/auth/instance";

export { auth };

export type AuthSession = typeof auth.$Infer.Session;
