import { createAuditEntry } from "@/lib/cms/audit";
import {
  addAuditEntry,
  archiveCmsRecord,
  createCmsRecord,
  getCmsRecord,
  listCmsRecords,
  listRevisions,
  restoreCmsRevision,
  updateCmsRecord,
} from "@/lib/cms/repository";
import { validateProgramSnapshot } from "@/lib/cms/program-validation";
import type {
  CmsAchievement,
  CmsLesson,
  CmsProgram,
  CmsProgramStep,
  CmsRecord,
  CmsUser,
  CmsXpRule,
  EditorialStatus,
  ProgramBuilderSnapshot,
} from "@/lib/cms/types";
import { transitionStatus } from "@/lib/cms/workflow";
import type { ProgramStep } from "@/lib/program";

const publishedStore = globalThis as typeof globalThis & {
  __sevenbetPublishedProgramSnapshots?: Record<string, ProgramBuilderSnapshot>;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeOrder<T extends { order: number }>(items: T[]) {
  return items.slice().sort((a, b) => a.order - b.order);
}

export function getProgramSnapshot(programId: string): ProgramBuilderSnapshot | null {
  const program = getCmsRecord("program", programId) as CmsProgram | undefined;
  if (!program) return null;
  const stepRecords = listCmsRecords("program-step") as CmsProgramStep[];
  const lessonRecords = listCmsRecords("lesson") as CmsLesson[];
  const steps = normalizeOrder(stepRecords.filter((step) => step.programId === programId && step.status !== "ARCHIVED")).map((step) => ({
    ...step,
    lessons: normalizeOrder(lessonRecords.filter((lesson) => lesson.programStepId === step.id && lesson.status !== "ARCHIVED")),
  }));
  return {
    program,
    steps,
    achievements: (listCmsRecords("achievement") as CmsAchievement[]).filter((item) => item.status !== "ARCHIVED"),
    xpRules: (listCmsRecords("xp-rule") as CmsXpRule[]).filter((item) => item.status !== "ARCHIVED"),
  };
}

function initializePublishedStore() {
  if (publishedStore.__sevenbetPublishedProgramSnapshots) return;
  publishedStore.__sevenbetPublishedProgramSnapshots = {};
  for (const record of listCmsRecords("program") as CmsProgram[]) {
    if (record.status !== "PUBLISHED") continue;
    const snapshot = getProgramSnapshot(record.id);
    if (snapshot) publishedStore.__sevenbetPublishedProgramSnapshots[record.id] = clone(snapshot);
  }
}

export function getPublishedProgramSnapshot(programId: string) {
  initializePublishedStore();
  const snapshot = publishedStore.__sevenbetPublishedProgramSnapshots?.[programId];
  return snapshot ? clone(snapshot) : null;
}

function recordDefaults<T extends CmsRecord>(record: T, actor: CmsUser): T {
  const timestamp = new Date().toISOString();
  return {
    ...record,
    createdAt: record.createdAt || timestamp,
    updatedAt: timestamp,
    createdBy: record.createdBy || actor.id,
    updatedBy: actor.id,
  };
}

function upsertRecord(record: CmsRecord, actor: CmsUser) {
  const existing = getCmsRecord(record.entity, record.id);
  if (existing) return updateCmsRecord(record.entity, record.id, record, actor);
  return createCmsRecord(record.entity, recordDefaults(record, actor), actor);
}

export function saveProgramSnapshot(input: ProgramBuilderSnapshot, actor: CmsUser, expectedUpdatedAt?: string) {
  // Capture the current public version before any working-copy records become drafts.
  initializePublishedStore();
  const current = getProgramSnapshot(input.program.id);
  if (!current) throw new Error("Program not found");
  if (expectedUpdatedAt && current.program.updatedAt !== expectedUpdatedAt) {
    throw new Error("This program was changed by another editor. Reload it before saving.");
  }

  const normalized: ProgramBuilderSnapshot = clone(input);
  normalized.steps = normalized.steps.map((step, stepIndex) => ({
    ...step,
    programId: normalized.program.id,
    order: (stepIndex + 1) * 1000,
    status: "DRAFT",
    lessons: step.lessons.map((lesson, lessonIndex) => ({
      ...lesson,
      programStepId: step.id,
      order: (lessonIndex + 1) * 1000,
      status: "DRAFT",
      blocks: lesson.blocks.map((block, blockIndex) => ({ ...block, order: (blockIndex + 1) * 1000 })),
    })),
  }));
  normalized.program = {
    ...normalized.program,
    status: "DRAFT",
    draftVersion: Math.max(normalized.program.draftVersion, normalized.program.publishedVersion + 1),
  };

  // Validate the complete graph before the first write. The Prisma implementation maps this unit to one transaction.
  const report = validateProgramSnapshot(normalized);
  const incomingStepIds = new Set(normalized.steps.map((step) => step.id));
  const incomingLessonIds = new Set(normalized.steps.flatMap((step) => step.lessons.map((lesson) => lesson.id)));

  upsertRecord(normalized.program, actor);
  for (const step of normalized.steps) {
    const { lessons, ...stepRecord } = step;
    upsertRecord(stepRecord, actor);
    for (const lesson of lessons) upsertRecord(lesson, actor);
  }
  for (const step of current.steps) {
    if (!incomingStepIds.has(step.id)) archiveCmsRecord("program-step", step.id, actor);
    for (const lesson of step.lessons) {
      if (!incomingLessonIds.has(lesson.id)) archiveCmsRecord("lesson", lesson.id, actor);
    }
  }

  addAuditEntry(createAuditEntry({
    actorId: actor.id,
    action: "update",
    entityType: "program",
    entityId: normalized.program.id,
    summary: `Saved Program Builder draft version ${normalized.program.draftVersion}`,
    metadata: { validationErrors: report.errors, validationWarnings: report.warnings },
  }));
  return { snapshot: getProgramSnapshot(normalized.program.id)!, validation: report };
}

export function transitionProgramWorkflow(programId: string, nextStatus: EditorialStatus, actor: CmsUser) {
  const snapshot = getProgramSnapshot(programId);
  if (!snapshot) throw new Error("Program not found");
  const status = transitionStatus(snapshot.program.status as EditorialStatus, nextStatus);
  const next = updateCmsRecord("program", programId, { status }, actor) as CmsProgram;
  addAuditEntry(createAuditEntry({
    actorId: actor.id,
    action: nextStatus === "IN_REVIEW" ? "request_review" : nextStatus === "APPROVED" ? "approve" : "update",
    entityType: "program",
    entityId: programId,
    summary: `Program status changed to ${nextStatus}`,
  }));
  return next;
}

export function publishProgram(programId: string, actor: CmsUser) {
  const snapshot = getProgramSnapshot(programId);
  if (!snapshot) throw new Error("Program not found");
  if (snapshot.program.status !== "APPROVED" && snapshot.program.status !== "SCHEDULED") {
    throw new Error("Program must be approved before publication.");
  }
  const validation = validateProgramSnapshot(snapshot);
  if (!validation.ok) throw new Error(`Publication blocked by ${validation.errors} validation error(s).`);

  const publishedAt = new Date().toISOString();
  for (const step of snapshot.steps) {
    updateCmsRecord("program-step", step.id, { status: "PUBLISHED" }, actor);
    for (const lesson of step.lessons) updateCmsRecord("lesson", lesson.id, { status: "PUBLISHED" }, actor);
  }
  updateCmsRecord("program", programId, {
    status: "PUBLISHED",
    publishedAt,
    publishedVersion: snapshot.program.draftVersion,
  }, actor);

  const published = getProgramSnapshot(programId)!;
  initializePublishedStore();
  publishedStore.__sevenbetPublishedProgramSnapshots![programId] = clone(published);
  addAuditEntry(createAuditEntry({
    actorId: actor.id,
    action: "publish",
    entityType: "program",
    entityId: programId,
    summary: `Published program version ${published.program.publishedVersion}`,
    metadata: { version: published.program.publishedVersion },
  }));
  return { snapshot: published, validation };
}

export function duplicateProgram(programId: string, actor: CmsUser) {
  const source = getProgramSnapshot(programId);
  if (!source) throw new Error("Program not found");
  const suffix = crypto.randomUUID().slice(0, 8);
  const idMap = new Map<string, string>();
  idMap.set(source.program.id, `program_${suffix}`);
  for (const step of source.steps) {
    idMap.set(step.id, `step_${suffix}_${step.order}`);
    for (const lesson of step.lessons) idMap.set(lesson.id, `lesson_${suffix}_${lesson.order}`);
  }
  const duplicate = clone(source);
  duplicate.program = {
    ...duplicate.program,
    id: idMap.get(source.program.id)!,
    slug: `${source.program.slug}-copy-${suffix}`,
    title: `${source.program.title} Copy`,
    internalName: `${source.program.internalName} Copy`,
    status: "DRAFT",
    publishedVersion: 0,
    draftVersion: 1,
    publishedAt: undefined,
  };
  duplicate.steps = duplicate.steps.map((step) => ({
    ...step,
    id: idMap.get(step.id)!,
    programId: duplicate.program.id,
    status: "DRAFT",
    prerequisites: step.prerequisites.map((item) => ({ ...item, targetId: item.targetId ? idMap.get(item.targetId) || item.targetId : undefined })),
    lessons: step.lessons.map((lesson) => ({
      ...lesson,
      id: idMap.get(lesson.id)!,
      programStepId: idMap.get(step.id)!,
      status: "DRAFT",
      prerequisites: lesson.prerequisites.map((item) => ({ ...item, targetId: item.targetId ? idMap.get(item.targetId) || item.targetId : undefined })),
      blocks: lesson.blocks.map((block) => ({ ...block, id: `${block.id}_${suffix}` })),
    })),
  }));
  createCmsRecord("program", recordDefaults(duplicate.program, actor), actor);
  for (const step of duplicate.steps) {
    const { lessons, ...stepRecord } = step;
    createCmsRecord("program-step", recordDefaults(stepRecord, actor), actor);
    for (const lesson of lessons) createCmsRecord("lesson", recordDefaults(lesson, actor), actor);
  }
  return getProgramSnapshot(duplicate.program.id)!;
}

export function getProgramRevisions(programId: string) {
  const snapshot = getProgramSnapshot(programId);
  if (!snapshot) return [];
  const entityIds = new Set([programId, ...snapshot.steps.map((step) => step.id), ...snapshot.steps.flatMap((step) => step.lessons.map((lesson) => lesson.id))]);
  return (["program", "program-step", "lesson"] as const)
    .flatMap((entity) => listCmsRecords(entity).flatMap((record) => entityIds.has(record.id) ? listRevisions(entity, record.id) : []))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function restoreProgramEntityRevision(entity: "program" | "program-step" | "lesson", id: string, revisionId: string, actor: CmsUser) {
  return restoreCmsRevision(entity, id, revisionId, actor);
}

function dataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function programSnapshotToPublicSteps(snapshot: ProgramBuilderSnapshot): ProgramStep[] {
  return snapshot.steps.map((step, index) => {
    const lesson = step.lessons[0];
    const blocks = lesson?.blocks.filter((block) => !block.archived) || [];
    const text = blocks.find((block) => block.type === "TEXT");
    const exercise = blocks.find((block) => block.type === "EXERCISE" || block.type === "REFLECTION");
    const scenario = blocks.find((block) => block.type === "SCENARIO");
    const quiz = blocks.find((block) => block.type === "QUIZ");
    const summary = blocks.find((block) => block.type === "SUMMARY");
    const scenarioChoices = Array.isArray(scenario?.data.choices) ? scenario.data.choices.map(dataObject) : [];
    const questions = Array.isArray(quiz?.data.questions) ? quiz.data.questions.map(dataObject) : [];
    const firstQuestion = questions[0] || {};
    const quizOptions = Array.isArray(firstQuestion.options) ? firstQuestion.options.map(dataObject) : [];
    const correctIndex = Math.max(0, quizOptions.findIndex((option) => option.correct === true));
    const recap = Array.isArray(summary?.data.recap) ? summary.data.recap.filter((item): item is string => typeof item === "string") : lesson?.recap || [];

    return {
      stableId: step.id,
      day: index + 1,
      title: step.title,
      focus: step.description,
      tasks: recap.slice(0, 3),
      estimatedTime: `${step.estimatedMinutes} min`,
      whyItMatters: step.learningObjective,
      keyTakeaway: step.practicalTakeaway || lesson?.takeaway || "Pause and review the practical takeaway.",
      lesson: typeof text?.data.text === "string" ? text.data.text : lesson?.summary || step.description,
      exercisePrompt: typeof exercise?.data.instructions === "string" ? exercise.data.instructions : "Write a short reflection before continuing.",
      scenario: {
        prompt: typeof scenario?.data.situation === "string" ? scenario.data.situation : "Which option best supports a planned decision?",
        options: scenarioChoices.map((choice) => ({
          label: typeof choice.label === "string" ? choice.label : "Option",
          feedback: typeof choice.feedback === "string" ? choice.feedback : "Review this choice against your plan.",
          recommended: choice.preferred === true,
        })),
      },
      quiz: {
        question: typeof firstQuestion.prompt === "string" ? firstQuestion.prompt : "What is the key takeaway?",
        options: quizOptions.map((option) => typeof option.label === "string" ? option.label : "Option"),
        correctIndex,
        explanation: typeof firstQuestion.explanation === "string" ? firstQuestion.explanation : "Review the lesson before continuing.",
      },
      recap,
      xp: {
        lesson: lesson?.xp || 0,
        scenario: typeof scenario?.data.xp === "number" ? scenario.data.xp : 0,
        quiz: typeof quiz?.data.xp === "number" ? quiz.data.xp : 0,
        guide: typeof exercise?.data.xp === "number" ? exercise.data.xp : 0,
      },
    };
  });
}
