import type {
  ProgrammeAiTurn,
  ProgrammeAiTurnResult,
} from "@/lib/programme/program-ai/contracts";
import type { ProgrammeLocale } from "@/lib/programme/presentation";

export type TranscriptionRequest = {
  locale: ProgrammeLocale;
  audio: Uint8Array;
  mimeType: string;
  fileName: string;
  durationMs: number;
};

export type TranscriptionResult = {
  transcript: string;
};

export interface TranscriptionPort {
  transcribe(request: TranscriptionRequest): Promise<TranscriptionResult>;
}

export interface ProgrammeAiPort {
  createTurn(input: ProgrammeAiTurn): Promise<unknown>;
}

export type ValidatedProgrammeAiPort = {
  createTurn(input: ProgrammeAiTurn): Promise<ProgrammeAiTurnResult>;
};
