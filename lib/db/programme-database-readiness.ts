import { createHash } from "node:crypto";

import { inspectPrismaRuntimeConnection } from "@/lib/db/prisma-runtime-config";

type DatabaseEnvironment = {
  DATABASE_URL?: string;
  DIRECT_URL?: string;
};

function safeUrl(value: string | undefined) {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function targetFingerprint(url: URL | null) {
  if (!url) return null;
  return createHash("sha256")
    .update([url.username, url.pathname, url.port || "5432"].join("\n"), "utf8")
    .digest("hex");
}

export function inspectProgrammeDatabaseReadiness(environment: DatabaseEnvironment) {
  const runtime = inspectPrismaRuntimeConnection(environment.DATABASE_URL);
  const runtimeUrl = safeUrl(environment.DATABASE_URL);
  const directUrl = safeUrl(environment.DIRECT_URL);
  const directMode = !environment.DIRECT_URL
    ? "missing"
    : !directUrl
      ? "invalid"
      : directUrl.hostname === "db.prisma.io"
        ? "direct"
        : "other";
  const runtimeFingerprint = targetFingerprint(runtimeUrl);
  const directFingerprint = targetFingerprint(directUrl);
  const warnings = [...runtime.warnings];
  if (directMode !== "direct") warnings.push("DIRECT_URL is not the approved Prisma Postgres direct endpoint.");
  if (directUrl && directUrl.searchParams.get("sslmode") !== "require") {
    warnings.push("DIRECT_URL must preserve sslmode=require.");
  }
  if (runtimeFingerprint && directFingerprint && runtimeFingerprint !== directFingerprint) {
    warnings.push("DATABASE_URL and DIRECT_URL do not resolve to the same redacted database identity.");
  }
  return {
    runtimeMode: runtime.mode,
    directMode,
    runtimeTargetFingerprint: runtimeFingerprint,
    directTargetFingerprint: directFingerprint,
    sameDatabaseIdentity: Boolean(runtimeFingerprint && runtimeFingerprint === directFingerprint),
    ready: runtime.mode === "pooled" && runtime.warnings.length === 0
      && directMode === "direct"
      && directUrl?.searchParams.get("sslmode") === "require"
      && Boolean(runtimeFingerprint && runtimeFingerprint === directFingerprint),
    warnings,
  };
}
