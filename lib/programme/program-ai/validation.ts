import { ValidationError } from "@/lib/services/service-error";
import {
  assertOnlyKeys,
  member,
  objectInput,
  stringList,
  text,
} from "@/lib/programme/validation/common";
import type {
  ProgrammeAiTurn,
  ProgrammeAiTurnResult,
  ProgrammeStartingPointValue,
} from "@/lib/programme/program-ai/contracts";

const inputModes = ["text", "voice"] as const;
const broadContexts = [
  "WORK",
  "HOME",
  "SOCIAL",
  "FINANCIAL_PRESSURE",
  "ONLINE_ACCESS",
  "OTHER",
  "NOT_SPECIFIED",
] as const;
const supportDispositions = ["CONTINUE", "SUPPORT_FIRST"] as const;
const clarificationReasons = [
  "DESIRED_CHANGE_UNCLEAR",
  "CONTEXT_UNCLEAR",
  "CONTRADICTION",
] as const;

function minimumText(value: string, field: string, minimum: number) {
  if (value.length < minimum) {
    throw new ValidationError(`${field} must contain at least ${minimum} characters`);
  }
  return value;
}

export function parseProgrammeAiTurn(value: unknown): ProgrammeAiTurn {
  const body = objectInput(value);
  assertOnlyKeys(body, ["inputMode", "situation", "clarificationAnswers"]);
  const situation = minimumText(text(body.situation, "situation", true, 4000)!, "situation", 20);
  if (situation.split(/\s+/).length < 4) {
    throw new ValidationError("situation must contain a substantive description");
  }
  return {
    inputMode: member(body.inputMode, "inputMode", inputModes, true)!,
    situation,
    clarificationAnswers: stringList(body.clarificationAnswers, "clarificationAnswers", {
      maximumItems: 2,
      maximumLength: 1000,
    }) ?? [],
  };
}

export function parseStartingPoint(value: unknown): ProgrammeStartingPointValue {
  const body = objectInput(value);
  assertOnlyKeys(body, [
    "startingPoint",
    "desiredChange",
    "broadContext",
    "continuationCue",
    "chosenBoundaryAction",
  ]);
  return {
    startingPoint: minimumText(text(body.startingPoint, "startingPoint", true, 320)!, "startingPoint", 10),
    desiredChange: minimumText(text(body.desiredChange, "desiredChange", true, 200)!, "desiredChange", 2),
    broadContext: member(body.broadContext, "broadContext", broadContexts, true)!,
    continuationCue: minimumText(text(body.continuationCue, "continuationCue", true, 200)!, "continuationCue", 2),
    chosenBoundaryAction: text(body.chosenBoundaryAction, "chosenBoundaryAction", false, 200),
  };
}

function parseCandidate(value: unknown, allowIncomplete = false) {
  const body = objectInput(value);
  assertOnlyKeys(body, [
    "startingPoint",
    "desiredChange",
    "broadContext",
    "continuationCue",
    "chosenBoundaryAction",
  ]);
  const candidate = {
    startingPoint: minimumText(
      text(body.startingPoint, "candidate.startingPoint", true, 320)!,
      "candidate.startingPoint",
      10,
    ),
    desiredChange: allowIncomplete && body.desiredChange === ""
      ? ""
      : minimumText(
          text(body.desiredChange, "candidate.desiredChange", true, 200)!,
          "candidate.desiredChange",
          2,
        ),
    broadContext: member(body.broadContext, "candidate.broadContext", broadContexts, true)!,
    continuationCue: allowIncomplete && body.continuationCue === ""
      ? ""
      : minimumText(
          text(body.continuationCue, "candidate.continuationCue", true, 200)!,
          "candidate.continuationCue",
          2,
        ),
    chosenBoundaryAction: text(body.chosenBoundaryAction, "candidate.chosenBoundaryAction", false, 200),
  };
  return candidate;
}

export function parseProgrammeAiPortResult(value: unknown): ProgrammeAiTurnResult {
  const body = objectInput(value);
  if (body.kind === "CLARIFICATION_REQUIRED") {
    assertOnlyKeys(body, ["kind", "prompt", "reason", "disposition"]);
    return {
      kind: "CLARIFICATION_REQUIRED",
      prompt: minimumText(text(body.prompt, "prompt", true, 240)!, "prompt", 8),
      reason: member(body.reason, "reason", clarificationReasons, true)!,
      disposition: member(body.disposition, "disposition", supportDispositions, true)!,
    };
  }
  if (body.kind === "STARTING_POINT_CANDIDATE") {
    assertOnlyKeys(body, ["kind", "candidate", "generation", "disposition"]);
    if (body.generation !== "PROVIDER") {
      throw new ValidationError("Provider result generation is not supported");
    }
    return {
      kind: "STARTING_POINT_CANDIDATE",
      candidate: parseCandidate(body.candidate),
      generation: "PROVIDER",
      disposition: member(body.disposition, "disposition", supportDispositions, true)!,
    };
  }
  throw new ValidationError("Programme AI result kind is not supported");
}

export function parseFallbackCandidate(value: unknown) {
  return parseCandidate(value, true);
}
