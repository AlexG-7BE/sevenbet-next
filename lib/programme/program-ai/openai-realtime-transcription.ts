import type { ProgrammeLocale } from "@/lib/programme/presentation";
import { programmeTranscriptionLanguage } from "@/lib/programme/presentation";
import { ProgrammeProviderError } from "@/lib/programme/program-ai/provider-errors";
import {
  resolveProgramAiOpenAiConfig,
  type ProgramAiOpenAiConfig,
} from "@/lib/programme/program-ai/runtime-config";

const OPENAI_REALTIME_CALLS_URL = "https://api.openai.com/v1/realtime/calls";
export const PROGRAM_AI_REALTIME_SESSION_TIMEOUT_MS = 10_000;

type Dependencies = {
  fetchImpl?: typeof fetch;
  now?: () => number;
  timeoutSignal?: (milliseconds: number) => AbortSignal;
  logger?: (entry: Record<string, unknown>) => void;
};

export class OpenAiRealtimeTranscriptionAdapter {
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly timeoutSignal: (milliseconds: number) => AbortSignal;
  private readonly logger: (entry: Record<string, unknown>) => void;

  constructor(
    private readonly config: ProgramAiOpenAiConfig,
    dependencies: Dependencies = {},
  ) {
    this.fetchImpl = dependencies.fetchImpl ?? fetch;
    this.now = dependencies.now ?? performance.now.bind(performance);
    this.timeoutSignal = dependencies.timeoutSignal ?? AbortSignal.timeout.bind(AbortSignal);
    this.logger = dependencies.logger ?? ((entry) => console.info(JSON.stringify(entry)));
  }

  async createSession(input: {
    locale: ProgrammeLocale;
    safetyIdentifier: string;
    sdp: string;
  }) {
    const startedAt = this.now();
    try {
      const form = new FormData();
      form.set("sdp", input.sdp);
      form.set("session", JSON.stringify({
        type: "transcription",
        audio: {
          input: {
            transcription: {
              model: this.config.realtimeTranscriptionModel,
              languages: [programmeTranscriptionLanguage(input.locale)],
              delay: "minimal",
            },
            turn_detection: null,
          },
        },
      }));
      const response = await this.fetchImpl(OPENAI_REALTIME_CALLS_URL, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.config.apiKey}`,
          "OpenAI-Safety-Identifier": input.safetyIdentifier,
        },
        body: form,
        signal: this.timeoutSignal(PROGRAM_AI_REALTIME_SESSION_TIMEOUT_MS),
      });
      if (!response.ok) {
        throw new ProgrammeProviderError(
          response.status === 429 ? "PROVIDER_RATE_LIMIT" : "TRANSCRIPTION_FAILED",
        );
      }
      const answerSdp = await response.text();
      if (!answerSdp.trim() || answerSdp.length > 65_536) {
        throw new ProgrammeProviderError("TRANSCRIPTION_FAILED");
      }
      this.log(startedAt, true);
      return answerSdp;
    } catch (error) {
      const mapped = error instanceof DOMException && ["AbortError", "TimeoutError"].includes(error.name)
        ? new ProgrammeProviderError("PROVIDER_TIMEOUT")
        : error instanceof ProgrammeProviderError
          ? error
          : new ProgrammeProviderError("TRANSCRIPTION_FAILED");
      this.log(startedAt, false, mapped.providerCode);
      throw mapped;
    }
  }

  private log(startedAt: number, success: boolean, errorCategory?: string) {
    this.logger({
      event: "programme_provider_operation",
      provider: "openai",
      model: this.config.realtimeTranscriptionModel,
      operation: "transcription_realtime_session",
      latencyMs: Math.max(0, Math.round(this.now() - startedAt)),
      success,
      errorCategory,
    });
  }
}

export function realtimeTranscriptionAdapterFromEnvironment(environment = process.env) {
  const config = resolveProgramAiOpenAiConfig(environment);
  if (!config) throw new ProgrammeProviderError("PROVIDER_UNAVAILABLE");
  return new OpenAiRealtimeTranscriptionAdapter(config);
}
