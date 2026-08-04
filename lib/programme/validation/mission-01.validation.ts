import {
  missionOneTaskStates,
  type MomentMapInput,
} from "@/lib/programme/contract";
import {
  assertOnlyKeys,
  objectInput,
  parseTaskStates,
  stringList,
  text,
} from "@/lib/programme/validation/common";

const momentMapFields = [
  "situation",
  "cues",
  "thoughtOrFeeling",
  "response",
  "immediateConsequence",
  "noticeRule",
  "neutralFlags",
  "notSureFlags",
] as const;

export function parseMomentMap(value: unknown, complete: true): MomentMapInput;
export function parseMomentMap(
  value: unknown,
  complete?: false,
): Partial<MomentMapInput>;
export function parseMomentMap(value: unknown, complete = false) {
  const body = objectInput(value);
  assertOnlyKeys(body, momentMapFields);
  const result: Partial<MomentMapInput> = {
    situation: text(body.situation, "situation", complete),
    cues: stringList(body.cues, "cues", { required: complete, maximumItems: 12 }),
    thoughtOrFeeling: text(body.thoughtOrFeeling, "thoughtOrFeeling", complete),
    response: text(body.response, "response", complete),
    immediateConsequence: text(
      body.immediateConsequence,
      "immediateConsequence",
      complete,
    ),
    noticeRule: text(body.noticeRule, "noticeRule", complete),
    neutralFlags: stringList(body.neutralFlags, "neutralFlags", {
      maximumLength: 64,
    }) ?? [],
    notSureFlags: stringList(body.notSureFlags, "notSureFlags", {
      maximumLength: 64,
    }) ?? [],
  };
  return Object.fromEntries(
    Object.entries(result).filter(([, item]) => item !== undefined),
  );
}

export function parseMissionOneDraft(value: unknown) {
  const body = objectInput(value);
  assertOnlyKeys(body, ["taskStates", "momentMap"]);
  return {
    taskStates: parseTaskStates(body.taskStates, missionOneTaskStates),
    momentMap: parseMomentMap(body.momentMap ?? {}, false),
  };
}
