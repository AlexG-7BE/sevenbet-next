import { ValidationError } from "@/lib/services/service-error";
import {
  booleanValue,
  member,
  stringList,
  text,
  assertOnlyKeys,
  objectInput,
} from "@/lib/programme/validation/common";
import {
  programAiMissionDefinition,
  type ProgramAiMissionNumber,
} from "@/lib/programme/program-ai/mission-registry";

export type ProgramAiStructuralArtifact = Record<string, string | number | boolean | string[]>;

const directions = ["understand", "pause", "reduce_impulse", "set_boundary", "research_later", "seek_support"] as const;
const goalStyles = ["notice_and_note", "pause_first", "use_one_boundary", "research_after_pause", "ask_for_support"] as const;
const realityChecks = ["make_it_smaller", "use_the_pause", "restart_next_day", "ask_for_support"] as const;
const signalCategories = ["body", "thought", "attention", "action_tendency", "not_sure"] as const;
const pauseMoves = ["three_slow_breaths", "leave_the_screen", "wait_ten_minutes", "message_support", "open_help"] as const;
const boundaryCategories = ["money", "time", "access", "pause"] as const;
const triggerTypes = ["before_access", "saved_early_signal", "scheduled_time", "custom_local"] as const;
const executionMethods = ["operator_limit", "bank_block", "device_or_site_block", "remove_payment", "trusted_contact", "leave", "self_exclusion_or_help", "custom_local"] as const;
const pressureChecks = ["easy_to_use", "needs_setup", "needs_support", "choose_another"] as const;
const scenarioChoices = ["unexpected_offer", "difficult_day", "social_prompt", "quick_return"] as const;
const decisionChecks = ["purpose", "time", "money", "terms", "mood", "exit"] as const;
const pauseRules = ["pause_before_access", "pause_before_payment", "pause_when_signal_appears", "pause_when_terms_are_unclear"] as const;
const frictionMethods = ["operator_limit", "bank_block", "device_or_site_block", "remove_saved_payment", "trusted_contact", "self_exclusion_or_help"] as const;
const bypassReasons = ["too_many_steps", "easy_to_disable", "another_device", "change_of_mind", "not_sure"] as const;
const fallbackMethods = ["leave", "wait_twenty_minutes", "open_help", "contact_support", "use_second_layer"] as const;
const supportModes = ["trusted_person", "professional_support", "peer_support", "protected_help", "not_ready"] as const;
const supportCardStyles = ["when_then", "short_prompt", "two_step"] as const;
const exitActions = ["leave_page", "close_account_tools", "open_help", "contact_support", "take_a_walk"] as const;
const comparisonSignals = ["licensing_status", "operator_identity", "material_terms", "withdrawal_conditions", "payments", "safer_gambling_tools", "offer_conditions"] as const;
const offerTermSignals = ["wagering_requirement", "expiry", "eligible_games", "deposit_condition", "withdrawal_limit", "unclear_terms"] as const;
const researchCriteria = ["licensing_status", "operator_identity", "terms", "withdrawals", "payments", "safer_gambling_tools", "offer_conditions"] as const;
const scenarioTypes = ["unexpected_offer", "urge_after_stress", "social_invitation", "unclear_terms"] as const;
const responseStrategies = ["pause_and_check", "leave_and_return", "use_boundary", "ask_for_support"] as const;
const planPriorityIds = ["starting_point", "goal", "early_signal", "pause_move", "boundary", "decision_checks", "friction", "support", "research", "fallback"] as const;

function exactList<T extends readonly string[]>(
  value: unknown,
  field: string,
  allowed: T,
  minimum: number,
  maximum: number,
) {
  const values = stringList(value, field, { required: true, maximumItems: maximum, maximumLength: 64 })!;
  if (values.length < minimum || values.some((item) => !allowed.includes(item))) {
    throw new ValidationError(`${field} contains unsupported values`);
  }
  return values;
}

function parseArtifact(
  missionNumber: ProgramAiMissionNumber,
  actionId: string,
  value: unknown,
): ProgramAiStructuralArtifact {
  const artifact = objectInput(value);
  const enumField = <T extends readonly string[]>(field: string, allowed: T) =>
    member(artifact[field], field, allowed, true)!;

  switch (`${missionNumber}:${actionId}`) {
    case "2:choose_direction":
      assertOnlyKeys(artifact, ["direction"]);
      return { direction: enumField("direction", directions) };
    case "2:build_7_day_goal":
      assertOnlyKeys(artifact, ["goalStyle", "reviewWindowDays"]);
      if (artifact.reviewWindowDays !== 7) throw new ValidationError("reviewWindowDays must be 7");
      return { goalStyle: enumField("goalStyle", goalStyles), reviewWindowDays: 7 };
    case "2:reality_check":
      assertOnlyKeys(artifact, ["realityCheck"]);
      return { realityCheck: enumField("realityCheck", realityChecks) };
    case "3:map_urge_sequence": {
      assertOnlyKeys(artifact, ["sequenceOrder"]);
      const sequenceOrder = exactList(artifact.sequenceOrder, "sequenceOrder", ["cue", "early_signal", "urge_builds", "choice_point"] as const, 4, 4);
      if (sequenceOrder.join("|") !== "cue|early_signal|urge_builds|choice_point") {
        throw new ValidationError("sequenceOrder must preserve the approved sequence");
      }
      return { sequenceOrder };
    }
    case "3:name_early_signal":
      assertOnlyKeys(artifact, ["earlySignalCategory"]);
      return { earlySignalCategory: enumField("earlySignalCategory", signalCategories) };
    case "3:choose_pause_move":
      assertOnlyKeys(artifact, ["pauseMove"]);
      return { pauseMove: enumField("pauseMove", pauseMoves) };
    case "4:choose_boundary":
      assertOnlyKeys(artifact, ["boundaryCategory", "triggerType"]);
      return { boundaryCategory: enumField("boundaryCategory", boundaryCategories), triggerType: enumField("triggerType", triggerTypes) };
    case "4:build_boundary_rule":
      assertOnlyKeys(artifact, ["executionMethod"]);
      return { executionMethod: enumField("executionMethod", executionMethods) };
    case "4:choose_execution":
      assertOnlyKeys(artifact, ["pressureCheck"]);
      return { pressureCheck: enumField("pressureCheck", pressureChecks) };
    case "5:run_decision_check":
      assertOnlyKeys(artifact, ["scenarioChoice"]);
      return { scenarioChoice: enumField("scenarioChoice", scenarioChoices) };
    case "5:build_three_checks":
      assertOnlyKeys(artifact, ["decisionChecks"]);
      return { decisionChecks: exactList(artifact.decisionChecks, "decisionChecks", decisionChecks, 3, 3) };
    case "5:commit_pause_rule":
      assertOnlyKeys(artifact, ["pauseRuleType"]);
      return { pauseRuleType: enumField("pauseRuleType", pauseRules) };
    case "6:choose_friction_layer":
      assertOnlyKeys(artifact, ["frictionMethods"]);
      return { frictionMethods: exactList(artifact.frictionMethods, "frictionMethods", frictionMethods, 1, 1) };
    case "6:build_friction_stack":
      assertOnlyKeys(artifact, ["frictionMethods"]);
      return { frictionMethods: exactList(artifact.frictionMethods, "frictionMethods", frictionMethods, 1, 2) };
    case "6:rehearse_bypass":
      assertOnlyKeys(artifact, ["fallbackMethod", "bypassReason"]);
      return { fallbackMethod: enumField("fallbackMethod", fallbackMethods), bypassReason: enumField("bypassReason", bypassReasons) };
    case "7:choose_support_route":
      assertOnlyKeys(artifact, ["supportModes"]);
      return { supportModes: exactList(artifact.supportModes, "supportModes", supportModes, 1, 2) };
    case "7:build_support_card":
      assertOnlyKeys(artifact, ["supportCardStyle"]);
      return { supportCardStyle: enumField("supportCardStyle", supportCardStyles) };
    case "7:choose_exit_action":
      assertOnlyKeys(artifact, ["exitActionType"]);
      return { exitActionType: enumField("exitActionType", exitActions) };
    case "8:learn_comparison_signals":
      assertOnlyKeys(artifact, ["comparisonSignals"]);
      return { comparisonSignals: exactList(artifact.comparisonSignals, "comparisonSignals", comparisonSignals, 2, 3) };
    case "8:decode_offer_terms":
      assertOnlyKeys(artifact, ["offerTermSignal"]);
      return { offerTermSignal: enumField("offerTermSignal", offerTermSignals) };
    case "8:build_research_checklist":
      assertOnlyKeys(artifact, ["researchCriteria"]);
      return { researchCriteria: exactList(artifact.researchCriteria, "researchCriteria", researchCriteria, 3, 5) };
    case "9:choose_scenario":
      assertOnlyKeys(artifact, ["scenarioType"]);
      return { scenarioType: enumField("scenarioType", scenarioTypes) };
    case "9:rehearse_response":
      assertOnlyKeys(artifact, ["responseStrategy"]);
      return { responseStrategy: enumField("responseStrategy", responseStrategies) };
    case "9:build_fallback_response":
      assertOnlyKeys(artifact, ["fallbackStrategy"]);
      return { fallbackStrategy: enumField("fallbackStrategy", responseStrategies) };
    case "10:review_my_plan":
      assertOnlyKeys(artifact, ["timelineReviewed"]);
      if (booleanValue(artifact.timelineReviewed, "timelineReviewed", true) !== true) {
        throw new ValidationError("timelineReviewed must be confirmed");
      }
      return { timelineReviewed: true };
    case "10:assemble_final_plan":
      assertOnlyKeys(artifact, ["planPriorityIds"]);
      return { planPriorityIds: exactList(artifact.planPriorityIds, "planPriorityIds", planPriorityIds, 1, 3) };
    case "10:choose_review_cadence":
      assertOnlyKeys(artifact, ["reviewCadenceDays"]);
      if (![7, 14, 30].includes(artifact.reviewCadenceDays as number)) {
        throw new ValidationError("reviewCadenceDays must be 7, 14 or 30");
      }
      return { reviewCadenceDays: artifact.reviewCadenceDays as number };
    default:
      throw new ValidationError("Action is not supported for this Mission");
  }
}

export function parseProgramAiMissionAction(missionNumber: ProgramAiMissionNumber, value: unknown) {
  const body = objectInput(value);
  assertOnlyKeys(body, ["action", "artifact"]);
  const definition = programAiMissionDefinition(missionNumber)!;
  const actionId = text(body.action, "action", true, 64)!;
  const action = definition.actions.find((item) => item.id === actionId);
  if (!action) throw new ValidationError("Action is not supported for this Mission");
  return { action, artifact: parseArtifact(missionNumber, actionId, body.artifact) };
}

export function parseProgramAiLocalWording(value: unknown) {
  const body = objectInput(value);
  assertOnlyKeys(body, ["localWording"]);
  return { localWording: text(body.localWording, "localWording", false, 600) ?? "" };
}
