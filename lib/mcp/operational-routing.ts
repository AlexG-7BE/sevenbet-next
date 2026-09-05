import { prisma } from "@/lib/db/prisma";
import { resolveCommercialMcpConfig, type CommercialMcpConfig } from "@/lib/mcp/commercial/config";
import { readBoundedBody } from "@/lib/mcp/commercial/http";
import { hashCommercialMcpPresentedToken } from "@/lib/mcp/commercial/provider";
import { resolveMediaMcpConfig } from "@/lib/mcp/media/config";

type Endpoint = "authorize" | "consent" | "register" | "token" | "revoke";

function configs(requestUrl: string) {
  return [resolveCommercialMcpConfig(requestUrl), resolveMediaMcpConfig(requestUrl)].filter((value): value is CommercialMcpConfig => Boolean(value));
}

function exactResource(requestUrl: string, resource: string | null | undefined) {
  const available = configs(requestUrl);
  if (!resource) return available.find((config) => new URL(config.resource).pathname === "/api/mcp/commercial") ?? null;
  return available.find((config) => config.resource === resource) ?? null;
}

function registrationResource(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const record = body as Record<string, unknown>;
  if (typeof record.resource === "string") return record.resource;
  if (Array.isArray(record.resources) && record.resources.length === 1 && typeof record.resources[0] === "string") return record.resources[0];
  return null;
}

export async function resolveOperationalMcpRequestConfig(request: Request, endpoint: Endpoint) {
  const requestUrl = request.url;
  if (endpoint === "authorize") return exactResource(requestUrl, new URL(requestUrl).searchParams.get("resource"));
  const raw = await readBoundedBody(request.clone(), endpoint === "register" ? 16 * 1024 : 8 * 1024);
  if (endpoint === "register") {
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return exactResource(requestUrl, null); }
    const selected = registrationResource(body);
    return exactResource(requestUrl, selected);
  }
  const form = new URLSearchParams(raw);
  if (endpoint === "consent") {
    const oauthQuery = form.get("oauth_query");
    return exactResource(requestUrl, oauthQuery ? new URLSearchParams(oauthQuery).get("resource") : null);
  }
  const resource = form.get("resource");
  if (resource) return exactResource(requestUrl, resource);
  if (endpoint === "token" && form.get("grant_type") === "refresh_token") {
    const presented = form.get("refresh_token");
    const token = presented ? await hashCommercialMcpPresentedToken(presented, "refresh_token") : null;
    const record = token ? await prisma.oauthRefreshToken.findUnique({ where: { token }, select: { resources: true } }) : null;
    return exactResource(requestUrl, record?.resources.length === 1 ? record.resources[0] : null);
  }
  return exactResource(requestUrl, null);
}

export function resolveOperationalMcpResourceConfig(requestUrl: string, resource: string | null | undefined) {
  return exactResource(requestUrl, resource);
}
