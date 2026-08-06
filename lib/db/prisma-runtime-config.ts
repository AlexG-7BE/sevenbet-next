export type PrismaRuntimeConnectionMode = "pooled" | "direct" | "other" | "missing" | "invalid";

export type PrismaRuntimeConnectionInspection = {
  mode: PrismaRuntimeConnectionMode;
  warnings: string[];
};

const POOLED_HOST = "pooled.db.prisma.io";
const DIRECT_HOST = "db.prisma.io";

export function inspectPrismaRuntimeConnection(value: string | undefined): PrismaRuntimeConnectionInspection {
  if (!value) return { mode: "missing", warnings: ["DATABASE_URL is missing."] };

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { mode: "invalid", warnings: ["DATABASE_URL is not a valid URL."] };
  }

  if (url.hostname === DIRECT_HOST) {
    return {
      mode: "direct",
      warnings: ["Production runtime is using the direct Prisma Postgres endpoint; configure the pooled runtime endpoint."],
    };
  }

  if (url.hostname !== POOLED_HOST) {
    return { mode: "other", warnings: ["Production runtime is not using the approved Prisma Postgres pooled endpoint."] };
  }

  const warnings: string[] = [];
  if (url.searchParams.get("sslmode") !== "require") warnings.push("Pooled runtime DATABASE_URL must preserve sslmode=require.");
  if (url.searchParams.get("connection_limit") !== "1") warnings.push("Pooled runtime DATABASE_URL must set connection_limit=1.");
  if (url.searchParams.get("pool_timeout") === "0") warnings.push("Pooled runtime DATABASE_URL must not disable pool timeout.");
  return { mode: "pooled", warnings };
}

export function warnForUnsafePrismaRuntimeConnection(
  environment: { DATABASE_URL?: string; NODE_ENV?: string } = process.env,
  warn: (message: string) => void = console.warn,
) {
  if (environment.NODE_ENV !== "production") return;
  for (const warning of inspectPrismaRuntimeConnection(environment.DATABASE_URL).warnings) {
    warn(`[prisma-runtime-config] ${warning}`);
  }
}
