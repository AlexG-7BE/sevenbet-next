import { MEDIA_MCP_PATH } from "@/lib/mcp/media/config";

type Environment = Record<string, string | undefined> & {
  BETTER_AUTH_URL?: string;
  COMMERCIAL_MCP_PUBLIC_ORIGIN?: string;
  MEDIA_OPERATIONS_MCP_PUBLIC_ORIGIN?: string;
  VERCEL_BRANCH_URL?: string;
  VERCEL_ENV?: string;
};

function origin(value: string) {
  const url = new URL(value);
  if (url.pathname !== "/" || url.search || url.hash) throw new Error("Media Operations OAuth Provider origin must contain only a scheme and host");
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("Media Operations OAuth Provider origin must use HTTPS");
  return url.origin;
}

export function resolveMediaMcpProviderResource(environment: Environment = process.env) {
  const mediaOrigin = environment.MEDIA_OPERATIONS_MCP_PUBLIC_ORIGIN?.trim();
  const commercialOrigin = environment.COMMERCIAL_MCP_PUBLIC_ORIGIN?.trim();
  const authOrigin = environment.BETTER_AUTH_URL?.trim();
  const configured = mediaOrigin || commercialOrigin || authOrigin;
  if (configured) {
    const selected = origin(configured);
    for (const candidate of [mediaOrigin, commercialOrigin, authOrigin].filter((value): value is string => Boolean(value))) {
      if (origin(candidate) !== selected) throw new Error("Media Operations MCP resource and Better Auth issuer must share one exact origin");
    }
    return `${selected}${MEDIA_MCP_PATH}`;
  }
  if (environment.VERCEL_ENV === "preview") {
    const host = environment.VERCEL_BRANCH_URL?.trim();
    if (!host || !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(host)) throw new Error("Media Operations OAuth Provider requires a valid Preview branch host");
    return `https://${host}${MEDIA_MCP_PATH}`;
  }
  if (environment.VERCEL_ENV === "production") return `https://b4gamble.com${MEDIA_MCP_PATH}`;
  return `http://localhost:3000${MEDIA_MCP_PATH}`;
}
