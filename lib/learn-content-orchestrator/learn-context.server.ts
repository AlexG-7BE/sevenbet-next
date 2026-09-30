import "server-only";

import { z } from "zod";

import { rfc3339UtcTimestampSchema } from "@/lib/learn-apply/contract";
import { PUBLISHED_LANGUAGE_ROUTE_PROFILES } from "@/lib/market/registry";
import { PUBLIC_CANONICAL_ORIGIN } from "@/lib/site";

import {
  LEARN_CONTENT_SOURCE_LOCALE,
  learnContentInventoryLocales,
  resolveLearnContentLaunchLocales,
  type LearnContentLocale,
} from "./config";
import {
  collectLearnContentSafeContext,
  LEARN_CONTENT_MAX_ARTICLE_INVENTORY,
  LearnContentInventoryLimitError,
  type LearnContentSafeContext,
} from "./safe-context.server";

/**
 * Read-only editorial context for the ChatGPT scheduled Learn task
 * (LEARN-CHATGPT-SCHEDULER-2026-09-30). It returns the same bounded public
 * metadata the retired server orchestrator gave its model and nothing else.
 */
export const learnContextInputSchema = z.object({
  targetLanguage: z.string().regex(/^[a-z]{2}$/).describe("A configured launch language slug, for example en."),
}).strict();

const localeEntrySchema = z.object({
  language: z.string().regex(/^[a-z]{2}$/),
  locale: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/),
  publicPathPrefix: z.string().regex(/^\/[a-z]{2}$/),
}).strict();

const publicUrlSchema = z.string().max(2_000).refine((value) => value.startsWith(`${PUBLIC_CANONICAL_ORIGIN}/`), "Expected a canonical public B4GAMBLE URL.");

export const learnContextResultSchema = z.object({
  generatedAt: rfc3339UtcTimestampSchema,
  target: localeEntrySchema,
  launchLocales: z.array(localeEntrySchema).min(1).max(PUBLISHED_LANGUAGE_ROUTE_PROFILES.length),
  sourceLocale: z.literal(LEARN_CONTENT_SOURCE_LOCALE),
  articles: z.array(z.object({
    id: z.string().uuid(),
    slug: z.string().min(1).max(200),
    title: z.string().min(1).max(500),
    category: z.string().min(1).max(80),
    locale: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/),
    publishedAt: rfc3339UtcTimestampSchema,
    updatedAt: rfc3339UtcTimestampSchema,
    url: publicUrlSchema,
  }).strict()).max(LEARN_CONTENT_MAX_ARTICLE_INVENTORY),
  categories: z.array(z.object({
    slug: z.string().min(1).max(80),
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(1_000),
  }).strict()).min(1).max(50),
  publicProgramme: z.object({
    route: z.literal("/10-steps"),
    applicationRoute: z.literal("/program"),
    missionCount: z.literal(10),
    description: z.string().min(1).max(500),
  }).strict(),
  protectedRoutes: z.array(z.enum(["/help", "/responsible-gambling"])).length(2),
}).strict();

export const LEARN_CONTEXT_ERROR_CODES = [
  "INVALID_INPUT",
  "TARGET_LANGUAGE_NOT_ALLOWED",
  "LAUNCH_LOCALES_INVALID",
  "CONTEXT_INVENTORY_LIMIT",
  "CONTEXT_UNAVAILABLE",
] as const;

export const learnContextErrorResultSchema = z.object({
  result: z.literal("ERROR"),
  error: z.object({
    code: z.enum(LEARN_CONTEXT_ERROR_CODES),
    message: z.string().min(1).max(300),
    retryable: z.boolean(),
  }).strict(),
}).strict();

export type LearnContextResult = z.infer<typeof learnContextResultSchema>;

export class LearnContextError extends Error {
  constructor(
    readonly code: (typeof LEARN_CONTEXT_ERROR_CODES)[number],
    message: string,
    readonly retryable = false,
  ) {
    super(message);
    this.name = "LearnContextError";
  }
}

type SafeContextCollector = (allowedLocales: readonly string[], now: Date) => Promise<LearnContentSafeContext>;

export type LearnContextDependencies = {
  environment?: Record<string, string | undefined>;
  collect?: SafeContextCollector;
  now?: () => Date;
};

export type LearnContextReader = (input: unknown) => Promise<LearnContextResult>;

export async function readLearnContext(input: unknown, dependencies: LearnContextDependencies = {}): Promise<LearnContextResult> {
  const parsed = learnContextInputSchema.safeParse(input);
  if (!parsed.success) throw new LearnContextError("INVALID_INPUT", "learn_context accepts exactly { targetLanguage } with a lowercase language slug.");

  let launchLocales: LearnContentLocale[];
  try {
    launchLocales = resolveLearnContentLaunchLocales(dependencies.environment ?? process.env);
  } catch {
    throw new LearnContextError("LAUNCH_LOCALES_INVALID", "The configured Learn launch languages are invalid.");
  }
  const target = launchLocales.find((candidate) => candidate.language === parsed.data.targetLanguage);
  if (!target) {
    throw new LearnContextError(
      "TARGET_LANGUAGE_NOT_ALLOWED",
      `targetLanguage must be one of the configured launch languages: ${launchLocales.map((candidate) => candidate.language).join(", ")}.`,
    );
  }

  const collect = dependencies.collect ?? ((locales, now) => collectLearnContentSafeContext(locales, undefined, now));
  let context: LearnContentSafeContext;
  try {
    context = await collect(learnContentInventoryLocales(target.locale), (dependencies.now ?? (() => new Date()))());
  } catch (error) {
    if (error instanceof LearnContentInventoryLimitError) {
      throw new LearnContextError("CONTEXT_INVENTORY_LIMIT", `The published Learn inventory exceeds the bounded ${LEARN_CONTENT_MAX_ARTICLE_INVENTORY}-Article context.`);
    }
    throw new LearnContextError("CONTEXT_UNAVAILABLE", "The Learn editorial context could not be read. Retry later.", true);
  }

  // Fields are copied one by one so nothing beyond the public allowlist can leak through.
  return learnContextResultSchema.parse({
    generatedAt: context.generatedAt,
    target,
    launchLocales,
    sourceLocale: LEARN_CONTENT_SOURCE_LOCALE,
    articles: context.articles.map(({ id, slug, title, category, locale, publishedAt, updatedAt, url }) => ({
      id, slug, title, category, locale, publishedAt, updatedAt, url,
    })),
    categories: context.categories.map(({ slug, title, description }) => ({ slug, title, description })),
    publicProgramme: {
      route: context.publicProgramme.route,
      applicationRoute: context.publicProgramme.applicationRoute,
      missionCount: context.publicProgramme.missionCount,
      description: context.publicProgramme.description,
    },
    protectedRoutes: [...context.protectedRoutes],
  });
}
