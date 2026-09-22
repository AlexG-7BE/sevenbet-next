import "server-only";

import { ZodError } from "zod";

import { publicLearnArticlePath } from "@/lib/learn-apply/public-verification";
import { PUBLIC_CANONICAL_ORIGIN } from "@/lib/site";

import {
  LEARN_CONTENT_ACTIVE_LEASE_HOURS,
  LEARN_CONTENT_MAX_PUBLICATION_ATTEMPTS,
  authenticateLearnContentCron,
  resolveLearnContentConfig,
} from "./config";
import { parseLearnContentModelOutput } from "./contracts";
import {
  LearnContentPublisherError,
  McpLearnContentPublisher,
  type LearnContentPublisher,
} from "./mcp-publisher.server";
import {
  describeLearnContentProviderError,
  OpenAiLearnContentManagedSessionProvider,
  type LearnContentManagedSessionProvider,
} from "./openai-managed-session.server";
import { validateLearnContentPublication, validateLearnContentRoleTrace } from "./publication-validation";
import {
  collectLearnContentSafeContext,
  type LearnContentSafeContext,
} from "./safe-context.server";
import {
  PrismaLearnContentStateRepository,
  type LearnContentActiveRun,
  type LearnContentStateRepository,
} from "./state-repository.server";

type LearnContentEnvironment = Record<string, string | undefined>;

type SafeContextCollector = (allowedLocales: readonly string[], now: Date) => Promise<LearnContentSafeContext>;

export type LearnContentCronDependencies = {
  environment?: LearnContentEnvironment;
  now?: () => Date;
  state?: LearnContentStateRepository;
  sessions?: LearnContentManagedSessionProvider;
  publisher?: LearnContentPublisher;
  collectContext?: SafeContextCollector;
  log?: (entry: Record<string, string | number | boolean | null>) => void;
};

function response(result: string, code: string, status = 200, extra: Record<string, string | number | boolean | null> = {}) {
  return Response.json({ result, code, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}

function codeForError(error: unknown, fallback: string) {
  if (error instanceof ZodError) return "OUTPUT_CONTRACT_FAILURE";
  return fallback;
}

function metadataMatches(run: LearnContentActiveRun, output: ReturnType<typeof parseLearnContentModelOutput>, now: Date) {
  if (output.runMetadata.runId !== run.runId || output.runMetadata.model !== run.model || output.runMetadata.locale !== run.locale) return false;
  const generatedAt = new Date(output.runMetadata.generatedAt);
  return generatedAt >= new Date(run.startedAt) && generatedAt <= new Date(now.valueOf() + 5 * 60 * 1_000);
}

function absoluteHours(from: string, to: Date) {
  return (to.valueOf() - new Date(from).valueOf()) / (60 * 60 * 1_000);
}

function liveResultIsVerified(input: {
  result: Awaited<ReturnType<LearnContentPublisher["publish"]>>;
  expectedArticleId: string | null;
  expectedOperation: "CREATE" | "UPDATE";
  article: { locale: string; category: string; slug: string };
}) {
  const { result } = input;
  if (result.result !== "LIVE" || !result.verified || result.persistence !== "COMMITTED" || result.status !== "PUBLISHED") return false;
  if (input.expectedArticleId && result.articleId !== input.expectedArticleId) return false;
  const allowedOperations = input.expectedOperation === "CREATE" ? ["CREATED", "NO_CHANGE"] : ["UPDATED", "NO_CHANGE"];
  if (!allowedOperations.includes(result.operation)) return false;
  try {
    const expectedUrl = `${PUBLIC_CANONICAL_ORIGIN}${publicLearnArticlePath(input.article.locale, input.article.category, input.article.slug)}`;
    return new URL(result.url).href === expectedUrl;
  } catch {
    return false;
  }
}

export function createLearnContentCronHandler(dependencies: LearnContentCronDependencies = {}) {
  const environment = dependencies.environment ?? process.env;
  const now = dependencies.now ?? (() => new Date());
  const state = dependencies.state ?? new PrismaLearnContentStateRepository();
  const sessions = dependencies.sessions ?? new OpenAiLearnContentManagedSessionProvider();
  const publisher = dependencies.publisher ?? new McpLearnContentPublisher();
  const collectContext = dependencies.collectContext ?? ((locales, current) => collectLearnContentSafeContext(locales, undefined, current));
  const log = dependencies.log ?? ((entry) => console.info(JSON.stringify({ scope: "learn-content-orchestrator", ...entry })));

  return async function handleLearnContentCron(request: Request) {
    if (!environment.CRON_SECRET?.trim()) return response("BLOCKED", "CRON_UNAVAILABLE", 503);
    if (!authenticateLearnContentCron(request, environment)) return response("BLOCKED", "UNAUTHORIZED", 401);

    let config: NonNullable<ReturnType<typeof resolveLearnContentConfig>>;
    try {
      const resolved = resolveLearnContentConfig(environment);
      if (!resolved) return response("NO_OP", "AUTONOMY_DISABLED");
      config = resolved;
    } catch {
      log({ event: "configuration_blocked", code: "CONFIGURATION_INVALID" });
      return response("BLOCKED", "CONFIGURATION_INVALID", 503);
    }

    const current = now();
    let claim: Awaited<ReturnType<LearnContentStateRepository["claim"]>>;
    try {
      claim = await state.claim({
        now: current,
        minIntervalHours: config.minIntervalHours,
        locales: config.locales,
        model: config.model,
      });
    } catch {
      log({ event: "state_failure", code: "STATE_CLAIM_FAILED" });
      return response("BLOCKED", "STATE_CLAIM_FAILED", 503);
    }
    if (!("run" in claim)) {
      return response(claim.action === "HALTED" ? "BLOCKED" : "NO_OP", claim.code);
    }

    const run = claim.run;
    if (claim.action === "LAUNCH") {
      let context: LearnContentSafeContext;
      try {
        context = await collectContext([run.locale], current);
      } catch {
        await state.finish({ runId: run.runId, now: current, result: "FAILED", code: "SAFE_CONTEXT_FAILED" });
        log({ event: "run_failed", code: "SAFE_CONTEXT_FAILED", runId: run.runId });
        return response("BLOCKED", "SAFE_CONTEXT_FAILED", 503);
      }
      try {
        const started = await sessions.start({
          apiKey: config.openAiApiKey,
          runId: run.runId,
          requestId: run.requestId,
          model: run.model,
          locale: run.locale,
          context,
        });
        if (!await state.attachSession({ runId: run.runId, sessionId: started.sessionId, now: current })) {
          log({ event: "run_blocked", code: "SESSION_ATTACH_CONFLICT", runId: run.runId });
          return response("BLOCKED", "SESSION_ATTACH_CONFLICT", 409);
        }
        if (started.status === "failed") {
          await state.finish({ runId: run.runId, now: current, result: "FAILED", code: "MANAGED_SESSION_FAILED" });
          return response("BLOCKED", "MANAGED_SESSION_FAILED");
        }
        if (started.status === "requires_action") {
          await state.finish({ runId: run.runId, now: current, result: "FAILED", code: "UNEXPECTED_REQUIRED_ACTION", halt: true });
          return response("BLOCKED", "UNEXPECTED_REQUIRED_ACTION");
        }
        log({ event: "session_started", code: "SESSION_STARTED", runId: run.runId });
        return response("STARTED", started.status === "idle" ? "SESSION_READY" : "SESSION_IN_PROGRESS", 200, { runId: run.runId });
      } catch (error) {
        log({
          event: "run_retry_pending",
          code: "SESSION_START_FAILED",
          runId: run.runId,
          ...describeLearnContentProviderError(error),
        });
        return response("RETRY_PENDING", "SESSION_START_FAILED", 503, { runId: run.runId });
      }
    }

    if (!run.sessionId) {
      await state.finish({ runId: run.runId, now: current, result: "FAILED", code: "SESSION_ID_MISSING", halt: true });
      return response("BLOCKED", "SESSION_ID_MISSING");
    }
    if (absoluteHours(run.startedAt, current) >= LEARN_CONTENT_ACTIVE_LEASE_HOURS) {
      await state.finish({ runId: run.runId, now: current, result: "FAILED", code: "SESSION_TIME_LIMIT" });
      return response("BLOCKED", "SESSION_TIME_LIMIT");
    }

    let inspected: Awaited<ReturnType<LearnContentManagedSessionProvider["inspect"]>>;
    try {
      inspected = await sessions.inspect({ apiKey: config.openAiApiKey, sessionId: run.sessionId });
    } catch {
      log({ event: "reconcile_deferred", code: "SESSION_INSPECTION_FAILED", runId: run.runId });
      return response("RETRY_PENDING", "SESSION_INSPECTION_FAILED", 503);
    }
    if (inspected.status === "in_progress") {
      await state.touch({ runId: run.runId, now: current });
      return response("NO_OP", "SESSION_IN_PROGRESS", 200, { runId: run.runId });
    }
    if (inspected.status === "requires_action") {
      await state.finish({ runId: run.runId, now: current, result: "FAILED", code: "UNEXPECTED_REQUIRED_ACTION", halt: true });
      return response("BLOCKED", "UNEXPECTED_REQUIRED_ACTION");
    }
    if (inspected.status === "failed") {
      await state.finish({ runId: run.runId, now: current, result: "FAILED", code: inspected.code });
      return response("BLOCKED", inspected.code);
    }
    if (inspected.trace.usage) {
      log({
        event: "session_usage",
        code: "SESSION_IDLE",
        runId: run.runId,
        inputTokens: inspected.trace.usage.inputTokens,
        outputTokens: inspected.trace.usage.outputTokens,
        totalTokens: inspected.trace.usage.totalTokens,
      });
    }

    let output: ReturnType<typeof parseLearnContentModelOutput>;
    try {
      output = parseLearnContentModelOutput(inspected.output);
    } catch (error) {
      const code = codeForError(error, "OUTPUT_PARSE_FAILURE");
      await state.finish({ runId: run.runId, now: current, result: "BLOCKED", code });
      return response("BLOCKED", code);
    }
    if (!metadataMatches(run, output, current)) {
      await state.finish({ runId: run.runId, now: current, result: "BLOCKED", code: "RUN_METADATA_MISMATCH" });
      return response("BLOCKED", "RUN_METADATA_MISMATCH");
    }
    const roleValidation = validateLearnContentRoleTrace(output, inspected.trace);
    if (!roleValidation.ok) {
      await state.finish({ runId: run.runId, now: current, result: "BLOCKED", code: roleValidation.code });
      return response("BLOCKED", roleValidation.code);
    }
    if (output.resultClass === "NO_OP") {
      await state.finish({ runId: run.runId, now: current, result: "NO_OP", code: output.seoHandoff.decision });
      log({ event: "run_completed", code: output.seoHandoff.decision, runId: run.runId });
      return response("NO_OP", output.seoHandoff.decision);
    }
    if (output.resultClass === "BLOCKED") {
      await state.finish({ runId: run.runId, now: current, result: "BLOCKED", code: output.blocker.code });
      return response("BLOCKED", output.blocker.code);
    }

    let context: LearnContentSafeContext;
    try {
      context = await collectContext([run.locale], current);
    } catch {
      await state.finish({ runId: run.runId, now: current, result: "FAILED", code: "SAFE_CONTEXT_FAILED" });
      return response("BLOCKED", "SAFE_CONTEXT_FAILED", 503);
    }
    const publicationValidation = validateLearnContentPublication({
      result: output,
      run,
      context,
      allowedLocales: new Set(config.locales.map((locale) => locale.locale)),
      now: current,
    });
    if (!publicationValidation.ok) {
      await state.finish({ runId: run.runId, now: current, result: "BLOCKED", code: publicationValidation.code });
      return response("BLOCKED", publicationValidation.code);
    }
    if (run.publicationAttempts >= LEARN_CONTENT_MAX_PUBLICATION_ATTEMPTS) {
      await state.finish({ runId: run.runId, now: current, result: "FAILED", code: "PUBLICATION_RETRY_LIMIT", halt: true });
      return response("BLOCKED", "PUBLICATION_RETRY_LIMIT");
    }

    const attempt = await state.recordPublicationAttempt({ runId: run.runId, now: current });
    if (!attempt) return response("BLOCKED", "PUBLICATION_STATE_CONFLICT", 409);
    let published: Awaited<ReturnType<LearnContentPublisher["publish"]>>;
    try {
      published = await publisher.publish({ payload: output.learnApply, serviceToken: config.learnMcpServiceToken });
    } catch (error) {
      if (error instanceof LearnContentPublisherError && error.code === "MCP_AUTH_FAILED") {
        await state.finish({ runId: run.runId, now: current, result: "FAILED", code: error.code, halt: true });
        return response("BLOCKED", error.code);
      }
      const exhausted = attempt >= LEARN_CONTENT_MAX_PUBLICATION_ATTEMPTS;
      if (exhausted) await state.finish({ runId: run.runId, now: current, result: "FAILED", code: "MCP_TRANSPORT_RETRY_LIMIT", halt: true });
      return response(exhausted ? "BLOCKED" : "RETRY_PENDING", exhausted ? "MCP_TRANSPORT_RETRY_LIMIT" : "MCP_TRANSPORT_FAILED", exhausted ? 200 : 503);
    }

    if (published.result === "ERROR") {
      const exhausted = attempt >= LEARN_CONTENT_MAX_PUBLICATION_ATTEMPTS;
      const persistence = published.error.persistence === "COMMITTED" ? "COMMITTED" : published.error.persistence === "NOT_COMMITTED" ? "NOT_COMMITTED" : "UNKNOWN";
      const code = exhausted ? `MCP_${persistence}_RETRY_LIMIT` : `MCP_${persistence}_RETRY_PENDING`;
      if (exhausted) await state.finish({ runId: run.runId, now: current, result: "FAILED", code, halt: true });
      return response(exhausted ? "BLOCKED" : "RETRY_PENDING", code, exhausted ? 200 : 503);
    }
    if (!liveResultIsVerified({
      result: published,
      expectedArticleId: output.learnApply.article.articleId,
      expectedOperation: output.seoHandoff.decision,
      article: output.learnApply.article,
    })) {
      const exhausted = attempt >= LEARN_CONTENT_MAX_PUBLICATION_ATTEMPTS;
      const code = exhausted ? "PERSISTED_NOT_VERIFIED_LIMIT" : "PERSISTED_NOT_VERIFIED";
      if (exhausted) await state.finish({ runId: run.runId, now: current, result: "FAILED", code, halt: true });
      return response(exhausted ? "BLOCKED" : "RETRY_PENDING", code, exhausted ? 200 : 503);
    }

    await state.finish({ runId: run.runId, now: current, result: "PUBLISHED", code: published.operation });
    log({ event: "article_published", code: published.operation, runId: run.runId, articleId: published.articleId });
    return response("PUBLISHED", published.operation, 200, { runId: run.runId, articleId: published.articleId, verified: true });
  };
}
