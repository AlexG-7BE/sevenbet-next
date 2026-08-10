import type {
  ProgrammeAiTurn,
  ProgrammeAiTurnResult,
} from "@/lib/programme/program-ai/contracts";

export type TranscriptionRequest = {
  audio: Uint8Array;
  mimeType: string;
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
