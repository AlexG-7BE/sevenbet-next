import { timingSafeEqual, createHash } from "node:crypto";

import { PUBLISHED_LANGUAGE_ROUTE_PROFILES } from "@/lib/market/registry";

export const LEARN_CONTENT_STATE_KEY = "learn-content-orchestrator:v1";
export const LEARN_CONTENT_DEFAULT_MODEL = "gpt-6-astra";
export const LEARN_CONTENT_ALLOWED_MODELS = [LEARN_CONTENT_DEFAULT_MODEL] as const;
export const LEARN_CONTENT_DEFAULT_MIN_INTERVAL_HOURS = 24;
export const LEARN_CONTENT_MAX_STATE_BYTES = 4_096;
export const LEARN_CONTENT_ACTIVE_LEASE_HOURS = 12;
export const LEARN_CONTENT_MAX_PUBLICATION_ATTEMPTS = 3;

type LearnContentEnvironment = Record<string, string | undefined> & {
  CRON_SECRET?: string;
  LEARN_CONTENT_AUTONOMY_ENABLED?: string;
  LEARN_CONTENT_LOCALES?: string;
  LEARN_CONTENT_MIN_INTERVAL_HOURS?: string;
  LEARN_CONTENT_OPENAI_MODEL?: string;
  LEARN_MCP_ENABLED?: string;
  LEARN_MCP_ACTOR_ID?: string;
  LEARN_MCP_SERVICE_TOKEN?: string;
  OPENAI_API_KEY?: string;
};

export type LearnContentLocale = {
  language: string;
  locale: string;
};

export type LearnContentConfig = {
  openAiApiKey: string;
  learnMcpServiceToken: string;
  locales: LearnContentLocale[];
  minIntervalHours: number;
  model: string;
};

function requiredSecret(environment: LearnContentEnvironment, name: "OPENAI_API_KEY" | "LEARN_MCP_SERVICE_TOKEN") {
  const value = environment[name]?.trim();
  const minimumBytes = name === "LEARN_MCP_SERVICE_TOKEN" ? 32 : 20;
  if (!value || Buffer.byteLength(value) < minimumBytes) throw new Error(`${name} is required when Learn content autonomy is enabled`);
  return value;
}

function resolveLocales(raw: string | undefined) {
  const requested = (raw?.trim() || "en").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (!requested.length || requested.length > PUBLISHED_LANGUAGE_ROUTE_PROFILES.length || new Set(requested).size !== requested.length) {
    throw new Error("LEARN_CONTENT_LOCALES must contain unique published language slugs");
  }
  return requested.map((language) => {
    const profile = PUBLISHED_LANGUAGE_ROUTE_PROFILES.find((candidate) => candidate.language === language);
    if (!profile) throw new Error(`LEARN_CONTENT_LOCALES contains an unpublished language: ${language}`);
    return { language: profile.language, locale: profile.defaultLocale };
  });
}

function resolveMinInterval(raw: string | undefined) {
  if (!raw?.trim()) return LEARN_CONTENT_DEFAULT_MIN_INTERVAL_HOURS;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 24 || value > 720) {
    throw new Error("LEARN_CONTENT_MIN_INTERVAL_HOURS must be a whole number from 24 through 720");
  }
  return value;
}

function resolveModel(raw: string | undefined) {
  const value = raw?.trim() || LEARN_CONTENT_DEFAULT_MODEL;
  if (!(LEARN_CONTENT_ALLOWED_MODELS as readonly string[]).includes(value)) {
    throw new Error(`LEARN_CONTENT_OPENAI_MODEL must be one of: ${LEARN_CONTENT_ALLOWED_MODELS.join(", ")}`);
  }
  return value;
}

export function resolveLearnContentConfig(environment: LearnContentEnvironment = process.env): LearnContentConfig | null {
  if (environment.LEARN_CONTENT_AUTONOMY_ENABLED?.trim() !== "true") return null;
  if (environment.LEARN_MCP_ENABLED?.trim() !== "true") {
    throw new Error("LEARN_MCP_ENABLED must be true when Learn content autonomy is enabled");
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(environment.LEARN_MCP_ACTOR_ID?.trim() ?? "")) {
    throw new Error("LEARN_MCP_ACTOR_ID must be an exact UUID when Learn content autonomy is enabled");
  }
  return {
    openAiApiKey: requiredSecret(environment, "OPENAI_API_KEY"),
    learnMcpServiceToken: requiredSecret(environment, "LEARN_MCP_SERVICE_TOKEN"),
    locales: resolveLocales(environment.LEARN_CONTENT_LOCALES),
    minIntervalHours: resolveMinInterval(environment.LEARN_CONTENT_MIN_INTERVAL_HOURS),
    model: resolveModel(environment.LEARN_CONTENT_OPENAI_MODEL),
  };
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function authenticateLearnContentCron(request: Request, environment: LearnContentEnvironment = process.env) {
  const configured = environment.CRON_SECRET?.trim();
  if (!configured) return false;
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer ([^\s]+)$/);
  return Boolean(match) && timingSafeEqual(digest(match?.[1] ?? "invalid-cron-credential"), digest(configured));
}
