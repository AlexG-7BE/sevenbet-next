import type {
  CmsBlock,
  CmsJsonValue,
  CompletionRule,
  ProgramBuilderSnapshot,
  ProgramValidationIssue,
  ProgramValidationReport,
} from "@/lib/cms/types";

function objectValue(value: CmsJsonValue | undefined) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : undefined;
}

function arrayValue(value: CmsJsonValue | undefined) {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: CmsJsonValue | undefined) {
  return typeof value === "string" ? value : "";
}

function issue(
  issues: ProgramValidationIssue[],
  severity: ProgramValidationIssue["severity"],
  entityId: string,
  path: string,
  message: string,
) {
  issues.push({ id: `${entityId}:${path}:${issues.length}`, severity, entityId, path, message });
}

function hasDuplicateNumbers(values: number[]) {
  return new Set(values).size !== values.length;
}

function validateQuiz(block: CmsBlock, issues: ProgramValidationIssue[]) {
  const questions = arrayValue(block.data.questions);
  if (!questions.length) {
    issue(issues, "error", block.id, "questions", "Quiz must contain at least one question.");
    return;
  }

  let totalPoints = 0;
  for (const [index, rawQuestion] of questions.entries()) {
    const question = objectValue(rawQuestion);
    if (!question || !stringValue(question.prompt).trim()) {
      issue(issues, "error", block.id, `questions.${index}.prompt`, "Quiz question prompt is required.");
      continue;
    }
    const type = stringValue(question.type);
    const points = typeof question.points === "number" ? question.points : 1;
    totalPoints += Math.max(0, points);
    const options = arrayValue(question.options).map(objectValue).filter(Boolean);
    const correctCount = options.filter((option) => option?.correct === true).length;
    if (type === "SINGLE_CHOICE" && correctCount !== 1) {
      issue(issues, "error", block.id, `questions.${index}.options`, "Single-choice questions require exactly one correct option.");
    }
    if (type === "MULTIPLE_CHOICE" && correctCount < 1) {
      issue(issues, "error", block.id, `questions.${index}.options`, "Multiple-choice questions require at least one correct option.");
    }
    if (["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"].includes(type) && options.length < 2) {
      issue(issues, "error", block.id, `questions.${index}.options`, "Graded choice questions require at least two options.");
    }
    if (!stringValue(question.explanation).trim()) {
      issue(issues, "warning", block.id, `questions.${index}.explanation`, "Add an educational explanation for this answer.");
    }
  }

  const passingScore = typeof block.data.passingScore === "number" ? block.data.passingScore : 0;
  if (passingScore < 0 || passingScore > 100 || totalPoints <= 0) {
    issue(issues, "error", block.id, "passingScore", "Quiz passing score must be achievable and between 0 and 100.");
  }
}

function validateScenario(block: CmsBlock, issues: ProgramValidationIssue[]) {
  const choices = arrayValue(block.data.choices).map(objectValue).filter(Boolean);
  if (!stringValue(block.data.situation).trim()) {
    issue(issues, "error", block.id, "situation", "Scenario situation is required.");
  }
  if (choices.length < 2) {
    issue(issues, "error", block.id, "choices", "Scenario must contain at least two choices.");
  }
  if (!choices.some((choice) => choice?.preferred === true)) {
    issue(issues, "warning", block.id, "choices", "Identify a preferred or safer choice for educational feedback.");
  }
  const branchTargets = new Map<string, string>();
  for (const choice of choices) {
    const id = stringValue(choice?.id);
    const target = stringValue(choice?.followUpChoiceId);
    if (id && target) branchTargets.set(id, target);
  }
  for (const start of branchTargets.keys()) {
    const seen = new Set<string>();
    let cursor: string | undefined = start;
    while (cursor && branchTargets.has(cursor)) {
      if (seen.has(cursor)) {
        issue(issues, "error", block.id, "choices", "Scenario choices contain a circular branch.");
        break;
      }
      seen.add(cursor);
      cursor = branchTargets.get(cursor);
    }
  }
}

function validateRules(rules: CompletionRule[], entityId: string, blockIds: Set<string>, issues: ProgramValidationIssue[]) {
  for (const rule of rules) {
    if (rule.value !== undefined && rule.value < 0) {
      issue(issues, "error", entityId, `completionRules.${rule.id}`, "Completion rule values cannot be negative.");
    }
    if (rule.targetId && !blockIds.has(rule.targetId) && !rule.type.includes("LESSONS")) {
      issue(issues, "error", entityId, `completionRules.${rule.id}`, "Completion rule references a missing block.");
    }
  }
}

function validatePrerequisiteCycles(snapshot: ProgramBuilderSnapshot, issues: ProgramValidationIssue[]) {
  const edges = new Map<string, string[]>();
  for (const step of snapshot.steps) {
    edges.set(step.id, step.prerequisites.map((item) => item.targetId).filter((value): value is string => Boolean(value)));
    for (const lesson of step.lessons) {
      edges.set(lesson.id, lesson.prerequisites.map((item) => item.targetId).filter((value): value is string => Boolean(value)));
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(id: string): boolean {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const target of edges.get(id) || []) {
      if (edges.has(target) && visit(target)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  }

  for (const id of edges.keys()) {
    if (visit(id)) {
      issue(issues, "error", id, "prerequisites", "Circular prerequisite detected.");
      break;
    }
  }
}

export function validateProgramSnapshot(snapshot: ProgramBuilderSnapshot): ProgramValidationReport {
  const issues: ProgramValidationIssue[] = [];
  const { program, steps } = snapshot;

  if (!program.title.trim()) issue(issues, "error", program.id, "title", "Public program title is required.");
  if (!program.internalName.trim()) issue(issues, "error", program.id, "internalName", "Internal program name is required.");
  if (!program.summary.trim()) issue(issues, "error", program.id, "summary", "Program summary is required.");
  if (!program.seoTitle?.trim()) issue(issues, "warning", program.id, "seoTitle", "SEO title is missing.");
  if (!program.seoDescription?.trim()) issue(issues, "warning", program.id, "seoDescription", "SEO description is missing.");
  if (!steps.length) issue(issues, "error", program.id, "steps", "Program must contain at least one step.");
  if (hasDuplicateNumbers(steps.map((step) => step.order))) issue(issues, "error", program.id, "steps.order", "Step order positions must be unique.");

  const slugs = new Map<string, string>();
  const allIds = new Set<string>([program.id]);
  for (const step of steps) {
    allIds.add(step.id);
    if (!step.title.trim()) issue(issues, "error", step.id, "title", "Step title is required.");
    if (!step.learningObjective.trim()) issue(issues, "error", step.id, "learningObjective", "Step learning objective is required.");
    if (!step.practicalTakeaway.trim()) issue(issues, "error", step.id, "practicalTakeaway", "Step practical takeaway is required.");
    if (slugs.has(step.slug)) issue(issues, "error", step.id, "slug", `Duplicate slug also used by ${slugs.get(step.slug)}.`);
    slugs.set(step.slug, step.id);
    if (!step.lessons.length) issue(issues, "error", step.id, "lessons", "Step must contain at least one lesson.");
    if (hasDuplicateNumbers(step.lessons.map((lesson) => lesson.order))) issue(issues, "error", step.id, "lessons.order", "Lesson order positions must be unique within a step.");
    const stepBlockIds = new Set(step.lessons.flatMap((lesson) => lesson.blocks.filter((block) => !block.archived).map((block) => block.id)));

    for (const lesson of step.lessons) {
      allIds.add(lesson.id);
      if (!lesson.title.trim()) issue(issues, "error", lesson.id, "title", "Lesson title is required.");
      if (!lesson.objective.trim()) issue(issues, "error", lesson.id, "objective", "Lesson objective is required.");
      if (!lesson.takeaway.trim()) issue(issues, "error", lesson.id, "takeaway", "Lesson takeaway is required.");
      if (slugs.has(lesson.slug)) issue(issues, "error", lesson.id, "slug", `Duplicate slug also used by ${slugs.get(lesson.slug)}.`);
      slugs.set(lesson.slug, lesson.id);
      const activeBlocks = lesson.blocks.filter((block) => !block.archived);
      if (!activeBlocks.length) issue(issues, "error", lesson.id, "blocks", "Lesson cannot be empty.");
      if (hasDuplicateNumbers(activeBlocks.map((block) => block.order))) issue(issues, "error", lesson.id, "blocks.order", "Block order positions must be unique.");
      const blockIds = new Set(activeBlocks.map((block) => block.id));

      for (const block of activeBlocks) {
        allIds.add(block.id);
        if (!block.internalLabel.trim()) issue(issues, "warning", block.id, "internalLabel", "Add an internal label for easier navigation.");
        if (block.type === "QUIZ") validateQuiz(block, issues);
        if (block.type === "SCENARIO") validateScenario(block, issues);
        if (block.type === "EXERCISE" && !stringValue(block.data.instructions).trim()) issue(issues, "error", block.id, "instructions", "Exercise instructions are required.");
        if (block.type === "IMAGE" && !stringValue(block.data.alt).trim()) issue(issues, "error", block.id, "alt", "Image alt text is required.");
        if (block.type === "RELATED_COMPARISON" && !stringValue(block.data.affiliateLinkId).trim()) issue(issues, "error", block.id, "affiliateLinkId", "Comparison references must use an internal affiliate link ID.");
        const serialized = JSON.stringify(block.data).toLowerCase();
        if (serialized.includes("<script") || serialized.includes("javascript:")) issue(issues, "error", block.id, "data", "Unsafe script content is not allowed.");
      }
      validateRules(lesson.completionRules, lesson.id, blockIds, issues);
    }
    validateRules(step.completionRules, step.id, stepBlockIds, issues);
  }

  for (const step of steps) {
    for (const prerequisite of step.prerequisites) {
      if (prerequisite.targetId && !allIds.has(prerequisite.targetId)) issue(issues, "error", step.id, "prerequisites", "Step prerequisite references missing or archived content.");
    }
    for (const lesson of step.lessons) {
      for (const prerequisite of lesson.prerequisites) {
        if (prerequisite.targetId && !allIds.has(prerequisite.targetId)) issue(issues, "error", lesson.id, "prerequisites", "Lesson prerequisite references missing or archived content.");
      }
    }
  }

  validatePrerequisiteCycles(snapshot, issues);
  const errors = issues.filter((item) => item.severity === "error").length;
  const warnings = issues.filter((item) => item.severity === "warning").length;
  const suggestions = issues.filter((item) => item.severity === "suggestion").length;
  return { ok: errors === 0, issues, errors, warnings, suggestions };
}

export function completionRuleSummary(rules: CompletionRule[]) {
  if (!rules.length) return "No explicit completion rules configured";
  return rules.map((rule) => rule.type.toLowerCase().replaceAll("_", " ")).join(rules.some((rule) => rule.operator === "OR") ? " or " : " and ");
}
