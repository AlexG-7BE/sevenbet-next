import type { LearnImageSource } from "@/lib/learn-apply/contract";
import { LearnApplyError } from "@/lib/learn-apply/errors";

const OPENAI_IMAGES_ENDPOINT = "https://api.openai.com/v1/images/generations";
export const LEARN_OPENAI_IMAGE_TIMEOUT_MS = 120_000;
export const DEFAULT_LEARN_OPENAI_IMAGE_MODEL = "gpt-image-2";

type GeneratedSource = Extract<LearnImageSource, { type: "generate" }>;

export type GeneratedImage = {
  data: Uint8Array;
  filename: string;
  mimeType: "image/webp";
  model: string;
};

export interface LearnImageGenerator {
  generate(source: GeneratedSource): Promise<GeneratedImage>;
}

type OpenAiImageConfig = {
  apiKey: string;
  model: string;
};

type OpenAiImageResponse = {
  data?: Array<{ b64_json?: unknown }>;
  usage?: { input_tokens?: unknown; output_tokens?: unknown };
};

type ImageProviderLog = {
  event: "learn_image_provider_operation";
  provider: "openai";
  model: string;
  latencyMs: number;
  success: boolean;
  errorCategory?: string;
  inputTokens?: number;
  outputTokens?: number;
};

function imageSize(aspectRatio: GeneratedSource["aspectRatio"]) {
  if (aspectRatio === "1:1") return "1024x1024";
  if (aspectRatio === "2:3" || aspectRatio === "9:16") return "1024x1536";
  return "1536x1024";
}

function defaultLogger(entry: ImageProviderLog) {
  console.info(JSON.stringify(entry));
}

function providerError(error: unknown) {
  if (error instanceof LearnApplyError) return error;
  if (error instanceof DOMException && ["AbortError", "TimeoutError"].includes(error.name)) {
    return new LearnApplyError("Image generation timed out.", "IMAGE_GENERATION_TIMEOUT", 504);
  }
  return new LearnApplyError("Image generation is unavailable.", "IMAGE_GENERATION_UNAVAILABLE", 502);
}

export class OpenAiLearnImageAdapter implements LearnImageGenerator {
  constructor(
    private readonly config: OpenAiImageConfig,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly logger: (entry: ImageProviderLog) => void = defaultLogger,
    private readonly now: () => number = performance.now.bind(performance),
    private readonly timeoutSignal: (milliseconds: number) => AbortSignal = AbortSignal.timeout,
  ) {}

  async generate(source: GeneratedSource): Promise<GeneratedImage> {
    const startedAt = this.now();
    let responseBody: OpenAiImageResponse | undefined;
    try {
      const response = await this.fetchImpl(OPENAI_IMAGES_ENDPOINT, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.config.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          prompt: source.prompt,
          size: imageSize(source.aspectRatio),
          quality: source.quality,
          background: source.background,
          output_format: "webp",
          n: 1,
        }),
        signal: this.timeoutSignal(LEARN_OPENAI_IMAGE_TIMEOUT_MS),
      });
      if (!response.ok) {
        throw new LearnApplyError(
          response.status === 429 ? "Image generation rate limit was reached." : "Image generation is unavailable.",
          response.status === 429 ? "IMAGE_GENERATION_RATE_LIMIT" : "IMAGE_GENERATION_UNAVAILABLE",
          response.status === 429 ? 429 : 502,
        );
      }
      responseBody = await response.json() as OpenAiImageResponse;
      const encoded = responseBody.data?.[0]?.b64_json;
      if (typeof encoded !== "string" || !encoded || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
        throw new LearnApplyError("Image provider returned invalid output.", "IMAGE_GENERATION_INVALID_OUTPUT", 502);
      }
      const data = Buffer.from(encoded, "base64");
      if (!data.byteLength || data.toString("base64") !== encoded) {
        throw new LearnApplyError("Image provider returned invalid output.", "IMAGE_GENERATION_INVALID_OUTPUT", 502);
      }
      this.logger({
        event: "learn_image_provider_operation",
        provider: "openai",
        model: this.config.model,
        latencyMs: Math.max(0, Math.round(this.now() - startedAt)),
        success: true,
        inputTokens: typeof responseBody.usage?.input_tokens === "number" ? responseBody.usage.input_tokens : undefined,
        outputTokens: typeof responseBody.usage?.output_tokens === "number" ? responseBody.usage.output_tokens : undefined,
      });
      return { data, filename: "generated.webp", mimeType: "image/webp", model: this.config.model };
    } catch (error) {
      const mapped = providerError(error);
      this.logger({
        event: "learn_image_provider_operation",
        provider: "openai",
        model: this.config.model,
        latencyMs: Math.max(0, Math.round(this.now() - startedAt)),
        success: false,
        errorCategory: mapped.code,
        inputTokens: typeof responseBody?.usage?.input_tokens === "number" ? responseBody.usage.input_tokens : undefined,
        outputTokens: typeof responseBody?.usage?.output_tokens === "number" ? responseBody.usage.output_tokens : undefined,
      });
      throw mapped;
    }
  }
}

export function learnImageGeneratorFromEnvironment(environment = process.env): LearnImageGenerator {
  if (environment.LEARN_IMAGE_GENERATION_ENABLED?.trim() !== "true") {
    throw new LearnApplyError("Learn image generation is not enabled.", "IMAGE_GENERATION_DISABLED", 503);
  }
  const apiKey = environment.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new LearnApplyError("Learn image generation is not configured.", "IMAGE_GENERATION_NOT_CONFIGURED", 503);
  const model = environment.LEARN_OPENAI_IMAGE_MODEL?.trim() || DEFAULT_LEARN_OPENAI_IMAGE_MODEL;
  if (!/^gpt-image-2(?:-\d{4}-\d{2}-\d{2})?$/.test(model)) {
    throw new LearnApplyError("Configured Learn image model is not approved.", "IMAGE_GENERATION_CONFIGURATION_INVALID", 503);
  }
  return new OpenAiLearnImageAdapter({ apiKey, model });
}
