"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { completionRuleSummary, validateProgramSnapshot } from "@/lib/cms/program-validation";
import type {
  CmsBlock,
  CmsBlockType,
  CmsJsonValue,
  CmsLesson,
  CmsProgram,
  CmsProgramStep,
  EditorialStatus,
  ProgramBuilderSnapshot,
  ProgramValidationReport,
} from "@/lib/cms/types";

type Selection = { type: "program" | "step" | "lesson" | "block"; id: string };
type SaveState = "saved" | "unsaved" | "saving" | "error";

const blockTypes: CmsBlockType[] = [
  "TEXT", "HEADING", "CALLOUT", "IMAGE", "VIDEO", "QUOTE", "CHECKLIST", "QUIZ", "SCENARIO",
  "EXERCISE", "REFLECTION", "PRACTICAL_TASK", "RESOURCE_LINK", "SUMMARY", "DIVIDER",
  "RESPONSIBLE_GAMBLING_NOTICE", "RELATED_COMPARISON",
];

function uid(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function Field({ label, value, onChange, type = "text", hint }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; hint?: string }) {
  return (
    <label className="builderField">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 4, hint }: { label: string; value: string; onChange: (value: string) => void; rows?: number; hint?: string }) {
  return (
    <label className="builderField">
      <span>{label}</span>
      <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="builderField">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
      </select>
    </label>
  );
}

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="builderCheck"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>;
}

export function ProgramSettingsEditor({ program, onChange }: { program: CmsProgram; onChange: (program: CmsProgram) => void }) {
  const set = <K extends keyof CmsProgram>(key: K, value: CmsProgram[K]) => onChange({ ...program, [key]: value });
  return (
    <div className="builderForm">
      <div className="builderSectionTitle"><Badge tone="green">Program settings</Badge><h2>{program.title}</h2></div>
      <div className="builderTwoCol">
        <Field label="Internal name" value={program.internalName} onChange={(value) => set("internalName", value)} />
        <Field label="Public title" value={program.title} onChange={(value) => set("title", value)} />
        <Field label="Slug" value={program.slug} onChange={(value) => set("slug", slugify(value))} />
        <Field label="Language" value={program.language} onChange={(value) => set("language", value)} />
        <Field label="Estimated total minutes" type="number" value={program.estimatedTotalMinutes} onChange={(value) => set("estimatedTotalMinutes", Number(value))} />
        <Field label="Completion XP" type="number" value={program.xpCompletionReward} onChange={(value) => set("xpCompletionReward", Number(value))} />
        <SelectField label="Difficulty" value={program.difficulty} options={["Beginner", "Intermediate", "Advanced"]} onChange={(value) => set("difficulty", value as CmsProgram["difficulty"])} />
        <SelectField label="Progress saving" value={program.progressSavingBehavior} options={["LOCAL", "ACCOUNT", "HYBRID"]} onChange={(value) => set("progressSavingBehavior", value as CmsProgram["progressSavingBehavior"])} />
      </div>
      <TextArea label="Short description" value={program.summary} onChange={(value) => set("summary", value)} />
      <TextArea label="Full introduction" rows={6} value={program.introduction} onChange={(value) => set("introduction", value)} />
      <div className="builderTwoCol">
        <Field label="SEO title" value={program.seoTitle || ""} onChange={(value) => set("seoTitle", value)} />
        <Field label="Canonical URL" value={program.canonicalUrl || ""} onChange={(value) => set("canonicalUrl", value)} />
      </div>
      <TextArea label="SEO description" value={program.seoDescription || ""} onChange={(value) => set("seoDescription", value)} />
      <CheckboxField label="Certificate enabled" checked={program.certificateEnabled} onChange={(value) => set("certificateEnabled", value)} />
    </div>
  );
}

export function ProgramStepEditor({ step, onChange }: { step: CmsProgramStep; onChange: (step: CmsProgramStep) => void }) {
  const set = <K extends keyof CmsProgramStep>(key: K, value: CmsProgramStep[K]) => onChange({ ...step, [key]: value });
  return (
    <div className="builderForm">
      <div className="builderSectionTitle"><Badge tone="green">Step</Badge><h2>{step.title}</h2></div>
      <div className="builderTwoCol">
        <Field label="Title" value={step.title} onChange={(value) => set("title", value)} />
        <Field label="Short title" value={step.shortTitle} onChange={(value) => set("shortTitle", value)} />
        <Field label="Slug" value={step.slug} onChange={(value) => set("slug", slugify(value))} />
        <Field label="Estimated minutes" type="number" value={step.estimatedMinutes} onChange={(value) => set("estimatedMinutes", Number(value))} />
        <Field label="XP reward" type="number" value={step.xp} onChange={(value) => set("xp", Number(value))} />
        <SelectField label="Visibility" value={step.visibility} options={["PUBLIC", "REGISTERED", "HIDDEN"]} onChange={(value) => set("visibility", value as CmsProgramStep["visibility"])} />
      </div>
      <TextArea label="Description" value={step.description} onChange={(value) => set("description", value)} />
      <TextArea label="Learning objective" value={step.learningObjective} onChange={(value) => set("learningObjective", value)} />
      <TextArea label="Practical takeaway" value={step.practicalTakeaway} onChange={(value) => set("practicalTakeaway", value)} />
      <TextArea label="Completion message" value={step.completionMessage} onChange={(value) => set("completionMessage", value)} />
    </div>
  );
}

export function LessonEditor({ lesson, onChange }: { lesson: CmsLesson; onChange: (lesson: CmsLesson) => void }) {
  const set = <K extends keyof CmsLesson>(key: K, value: CmsLesson[K]) => onChange({ ...lesson, [key]: value });
  return (
    <div className="builderForm">
      <div className="builderSectionTitle"><Badge>Lesson</Badge><h2>{lesson.title}</h2></div>
      <div className="builderTwoCol">
        <Field label="Title" value={lesson.title} onChange={(value) => set("title", value)} />
        <Field label="Slug" value={lesson.slug} onChange={(value) => set("slug", slugify(value))} />
        <Field label="Estimated minutes" type="number" value={lesson.estimatedMinutes} onChange={(value) => set("estimatedMinutes", Number(value))} />
        <Field label="XP reward" type="number" value={lesson.xp} onChange={(value) => set("xp", Number(value))} />
        <SelectField label="Retry policy" value={lesson.retryPolicy} options={["UNLIMITED", "ONCE", "NO_RETRY"]} onChange={(value) => set("retryPolicy", value as CmsLesson["retryPolicy"])} />
      </div>
      <CheckboxField label="Required lesson" checked={lesson.required} onChange={(value) => set("required", value)} />
      <CheckboxField label="Allow contextual commercial references" checked={lesson.allowCommercialReferences} onChange={(value) => set("allowCommercialReferences", value)} />
      <TextArea label="Summary" value={lesson.summary} onChange={(value) => set("summary", value)} />
      <TextArea label="Learning objective" value={lesson.objective} onChange={(value) => set("objective", value)} />
      <TextArea label="Takeaway" value={lesson.takeaway} onChange={(value) => set("takeaway", value)} />
    </div>
  );
}

function stringData(block: CmsBlock, key: string) {
  return typeof block.data[key] === "string" ? block.data[key] as string : "";
}

function updateBlockData(block: CmsBlock, key: string, value: CmsJsonValue) {
  return { ...block, data: { ...block.data, [key]: value } };
}

function QuizBuilder({ block, onChange }: { block: CmsBlock; onChange: (block: CmsBlock) => void }) {
  const questions = Array.isArray(block.data.questions) ? clone(block.data.questions) as Array<Record<string, CmsJsonValue>> : [];
  const question = questions[0] || { id: uid("question"), type: "SINGLE_CHOICE", prompt: "", explanation: "", points: 1, required: true, order: 1000, options: [] };
  const options = Array.isArray(question.options) ? question.options as Array<Record<string, CmsJsonValue>> : [];
  function saveQuestion(next: Record<string, CmsJsonValue>) { onChange(updateBlockData(block, "questions", [next])); }
  function updateOption(index: number, key: string, value: CmsJsonValue) {
    const nextOptions = options.map((option, optionIndex) => ({ ...option, ...(key === "correct" && value === true ? { correct: optionIndex === index } : optionIndex === index ? { [key]: value } : {}) }));
    saveQuestion({ ...question, options: nextOptions });
  }
  return (
    <div className="builderSubEditor">
      <h3>Quiz Builder</h3>
      <div className="builderTwoCol">
        <Field label="Quiz title" value={stringData(block, "title")} onChange={(value) => onChange(updateBlockData(block, "title", value))} />
        <Field label="Passing score (%)" type="number" value={typeof block.data.passingScore === "number" ? block.data.passingScore : 100} onChange={(value) => onChange(updateBlockData(block, "passingScore", Number(value)))} />
      </div>
      <TextArea label="Question prompt" value={typeof question.prompt === "string" ? question.prompt : ""} onChange={(value) => saveQuestion({ ...question, prompt: value })} />
      <div className="builderOptions">
        {options.map((option, index) => (
          <div className="builderOption" key={String(option.id || index)}>
            <input aria-label={`Correct answer ${index + 1}`} type="radio" checked={option.correct === true} onChange={() => updateOption(index, "correct", true)} />
            <input aria-label={`Option ${index + 1}`} value={typeof option.label === "string" ? option.label : ""} onChange={(event) => updateOption(index, "label", event.target.value)} />
            <button type="button" onClick={() => saveQuestion({ ...question, options: options.filter((_, optionIndex) => optionIndex !== index) })}>Remove</button>
          </div>
        ))}
        <button className="builderSmallButton" type="button" onClick={() => saveQuestion({ ...question, options: [...options, { id: uid("option"), label: "New option", correct: false, order: (options.length + 1) * 1000 }] })}>Add option</button>
      </div>
      <TextArea label="Educational explanation" value={typeof question.explanation === "string" ? question.explanation : ""} onChange={(value) => saveQuestion({ ...question, explanation: value })} />
    </div>
  );
}

function ScenarioBuilder({ block, onChange }: { block: CmsBlock; onChange: (block: CmsBlock) => void }) {
  const choices = Array.isArray(block.data.choices) ? clone(block.data.choices) as Array<Record<string, CmsJsonValue>> : [];
  function updateChoice(index: number, key: string, value: CmsJsonValue) {
    const next = choices.map((choice, choiceIndex) => ({ ...choice, ...(key === "preferred" && value === true ? { preferred: choiceIndex === index } : choiceIndex === index ? { [key]: value } : {}) }));
    onChange(updateBlockData(block, "choices", next));
  }
  return (
    <div className="builderSubEditor">
      <h3>Scenario Builder</h3>
      <TextArea label="Situation" value={stringData(block, "situation")} onChange={(value) => onChange(updateBlockData(block, "situation", value))} />
      <div className="builderOptions">
        {choices.map((choice, index) => (
          <div className="builderScenarioChoice" key={String(choice.id || index)}>
            <div className="builderOption">
              <input aria-label={`Preferred choice ${index + 1}`} type="radio" checked={choice.preferred === true} onChange={() => updateChoice(index, "preferred", true)} />
              <input aria-label={`Choice ${index + 1}`} value={typeof choice.label === "string" ? choice.label : ""} onChange={(event) => updateChoice(index, "label", event.target.value)} />
              <button type="button" onClick={() => onChange(updateBlockData(block, "choices", choices.filter((_, choiceIndex) => choiceIndex !== index)))}>Remove</button>
            </div>
            <TextArea label="Feedback" rows={2} value={typeof choice.feedback === "string" ? choice.feedback : ""} onChange={(value) => updateChoice(index, "feedback", value)} />
          </div>
        ))}
        <button className="builderSmallButton" type="button" onClick={() => onChange(updateBlockData(block, "choices", [...choices, { id: uid("choice"), label: "New choice", feedback: "", preferred: false, order: (choices.length + 1) * 1000 }]))}>Add choice</button>
      </div>
    </div>
  );
}

function ExerciseBuilder({ block, onChange }: { block: CmsBlock; onChange: (block: CmsBlock) => void }) {
  return (
    <div className="builderSubEditor">
      <h3>Exercise Builder</h3>
      <SelectField label="Exercise type" value={stringData(block, "exerciseType") || "WRITTEN_REFLECTION"} options={["WRITTEN_REFLECTION", "BUDGET_PLANNER", "TIME_LIMIT_PLANNER", "RULES_CHECKLIST", "BONUS_TERM_COMPARISON", "SESSION_PLAN", "BREAK_PLAN"]} onChange={(value) => onChange(updateBlockData(block, "exerciseType", value))} />
      <TextArea label="Instructions" value={stringData(block, "instructions")} onChange={(value) => onChange(updateBlockData(block, "instructions", value))} />
      <TextArea label="Privacy notice" value={stringData(block, "privacyNotice")} onChange={(value) => onChange(updateBlockData(block, "privacyNotice", value))} hint="Personal answers remain separate from CMS content." />
      <TextArea label="Final takeaway" value={stringData(block, "finalTakeaway")} onChange={(value) => onChange(updateBlockData(block, "finalTakeaway", value))} />
    </div>
  );
}

export function LessonBlockEditor({ block, onChange }: { block: CmsBlock; onChange: (block: CmsBlock) => void }) {
  const contentKey = block.type === "HEADING" ? "text" : block.type === "CALLOUT" ? "text" : block.type === "SUMMARY" ? "takeaway" : "text";
  return (
    <div className="builderForm">
      <div className="builderSectionTitle"><Badge tone="dark">{block.type.replaceAll("_", " ")}</Badge><h2>{block.internalLabel}</h2></div>
      <div className="builderTwoCol">
        <Field label="Internal label" value={block.internalLabel} onChange={(value) => onChange({ ...block, internalLabel: value })} />
        <SelectField label="Block type" value={block.type} options={blockTypes} onChange={(value) => onChange({ ...block, type: value as CmsBlockType })} />
      </div>
      <CheckboxField label="Required for completion" checked={block.required} onChange={(value) => onChange({ ...block, required: value })} />
      {block.type === "QUIZ" && <QuizBuilder block={block} onChange={onChange} />}
      {block.type === "SCENARIO" && <ScenarioBuilder block={block} onChange={onChange} />}
      {(block.type === "EXERCISE" || block.type === "REFLECTION" || block.type === "PRACTICAL_TASK") && <ExerciseBuilder block={block} onChange={onChange} />}
      {!["QUIZ", "SCENARIO", "EXERCISE", "REFLECTION", "PRACTICAL_TASK", "DIVIDER"].includes(block.type) && (
        <TextArea label="Visible content" rows={8} value={stringData(block, contentKey)} onChange={(value) => onChange(updateBlockData(block, contentKey, value))} />
      )}
      {block.type === "IMAGE" && <Field label="Image alt text" value={stringData(block, "alt")} onChange={(value) => onChange(updateBlockData(block, "alt", value))} />}
      {block.type === "RELATED_COMPARISON" && <Field label="Internal affiliate link ID" value={stringData(block, "affiliateLinkId")} onChange={(value) => onChange(updateBlockData(block, "affiliateLinkId", value))} hint="Raw affiliate URLs are not accepted." />}
    </div>
  );
}

export function ProgramStructureTree({ snapshot, selection, issuesById, onSelect, onAddStep, onAddLesson, onAddBlock }: {
  snapshot: ProgramBuilderSnapshot;
  selection: Selection;
  issuesById: Map<string, number>;
  onSelect: (selection: Selection) => void;
  onAddStep: () => void;
  onAddLesson: (stepId: string) => void;
  onAddBlock: (lessonId: string) => void;
}) {
  return (
    <div className="structureTree" role="tree" aria-label="Program structure">
      <button className={selection.id === snapshot.program.id ? "selected" : ""} role="treeitem" type="button" onClick={() => onSelect({ type: "program", id: snapshot.program.id })}>
        <span>Program</span><strong>{snapshot.program.title}</strong>{issuesById.has(snapshot.program.id) && <em>{issuesById.get(snapshot.program.id)}</em>}
      </button>
      {snapshot.steps.map((step, stepIndex) => (
        <div className="treeBranch" key={step.id} role="group">
          <button className={selection.id === step.id ? "selected" : ""} role="treeitem" aria-level={2} type="button" onClick={() => onSelect({ type: "step", id: step.id })}>
            <span>Step {stepIndex + 1}</span><strong>{step.title}</strong>{issuesById.has(step.id) && <em>{issuesById.get(step.id)}</em>}
          </button>
          {step.lessons.map((lesson) => (
            <div className="treeBranch lessonBranch" key={lesson.id} role="group">
              <button className={selection.id === lesson.id ? "selected" : ""} role="treeitem" aria-level={3} type="button" onClick={() => onSelect({ type: "lesson", id: lesson.id })}>
                <span>Lesson</span><strong>{lesson.title}</strong>{issuesById.has(lesson.id) && <em>{issuesById.get(lesson.id)}</em>}
              </button>
              {lesson.blocks.filter((block) => !block.archived).map((block) => (
                <button className={`treeBlock ${selection.id === block.id ? "selected" : ""}`} key={block.id} role="treeitem" aria-level={4} type="button" onClick={() => onSelect({ type: "block", id: block.id })}>
                  <span>{block.type.replaceAll("_", " ")}</span><strong>{block.internalLabel}</strong>{issuesById.has(block.id) && <em>{issuesById.get(block.id)}</em>}
                </button>
              ))}
              <button className="treeAdd" type="button" onClick={() => onAddBlock(lesson.id)}>+ Add block</button>
            </div>
          ))}
          <button className="treeAdd" type="button" onClick={() => onAddLesson(step.id)}>+ Add lesson</button>
        </div>
      ))}
      <button className="treeAdd" type="button" onClick={onAddStep}>+ Add step</button>
    </div>
  );
}

export function ProgramValidationPanel({ report, onJump }: { report: ProgramValidationReport; onJump: (id: string) => void }) {
  return (
    <div className="validationPanel">
      <div className="validationSummary">
        <Badge tone={report.ok ? "green" : "warning"}>{report.ok ? "Ready for review" : `${report.errors} errors`}</Badge>
        <span>{report.warnings} warnings</span>
      </div>
      <div className="validationIssues">
        {report.issues.slice(0, 12).map((item) => (
          <button type="button" key={item.id} onClick={() => onJump(item.entityId)} className={item.severity}>
            <strong>{item.severity}</strong><span>{item.message}</span>
          </button>
        ))}
        {!report.issues.length && <p className="muted">No validation findings.</p>}
      </div>
    </div>
  );
}

export function ProgramBuilder({ initialSnapshot }: { initialSnapshot: ProgramBuilderSnapshot }) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(() => clone(initialSnapshot));
  const [selection, setSelection] = useState<Selection>({ type: "program", id: initialSnapshot.program.id });
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [message, setMessage] = useState("");
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState(initialSnapshot.program.updatedAt);
  const validation = useMemo(() => validateProgramSnapshot(snapshot), [snapshot]);
  const issuesById = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of validation.issues) map.set(item.entityId, (map.get(item.entityId) || 0) + 1);
    return map;
  }, [validation]);

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (saveState !== "unsaved" && saveState !== "error") return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);

  function change(mutator: (draft: ProgramBuilderSnapshot) => void) {
    setSnapshot((current) => { const draft = clone(current); mutator(draft); return draft; });
    setSaveState("unsaved");
    setMessage("");
  }

  function findSelection(id: string): Selection {
    if (id === snapshot.program.id) return { type: "program", id };
    for (const step of snapshot.steps) {
      if (step.id === id) return { type: "step", id };
      for (const lesson of step.lessons) {
        if (lesson.id === id) return { type: "lesson", id };
        if (lesson.blocks.some((block) => block.id === id)) return { type: "block", id };
      }
    }
    return { type: "program", id: snapshot.program.id };
  }

  function updateProgram(program: CmsProgram) { change((draft) => { draft.program = program; }); }
  function updateStep(next: CmsProgramStep) { change((draft) => { const step = draft.steps.find((item) => item.id === next.id); if (step) Object.assign(step, next); }); }
  function updateLesson(next: CmsLesson) { change((draft) => { for (const step of draft.steps) { const index = step.lessons.findIndex((item) => item.id === next.id); if (index >= 0) step.lessons[index] = next; } }); }
  function updateBlock(next: CmsBlock) { change((draft) => { for (const step of draft.steps) for (const lesson of step.lessons) { const index = lesson.blocks.findIndex((item) => item.id === next.id); if (index >= 0) lesson.blocks[index] = next; } }); }

  function addStep() {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    change((draft) => draft.steps.push({
      id, entity: "program-step", programId: draft.program.id, slug: `step-${draft.steps.length + 1}-${id.slice(-5)}`, title: "New Step", shortTitle: "New Step",
      description: "Add a concise step description.", learningObjective: "Describe what the learner should understand.", order: (draft.steps.length + 1) * 1000,
      estimatedMinutes: 8, xp: 40, completionMessage: "Step complete.", practicalTakeaway: "Add a practical takeaway.", prerequisites: [], visibility: "PUBLIC",
      relatedGuideIds: [], relatedResourceIds: [], completionRules: [{ id: uid("rule"), type: "ALL_REQUIRED_LESSONS_COMPLETED", operator: "AND" }],
      lessons: [], status: "DRAFT", createdAt: now, updatedAt: now, createdBy: draft.program.updatedBy, updatedBy: draft.program.updatedBy,
    }));
    setSelection({ type: "step", id });
  }

  function addLesson(stepId: string) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    change((draft) => {
      const step = draft.steps.find((item) => item.id === stepId); if (!step) return;
      step.lessons.push({
        id, entity: "lesson", programStepId: stepId, slug: `lesson-${step.lessons.length + 1}-${id.slice(-5)}`, title: "New Lesson", summary: "Add a short lesson summary.",
        objective: "Describe the learning objective.", order: (step.lessons.length + 1) * 1000, estimatedMinutes: 8, xp: 10, required: true, retryPolicy: "UNLIMITED",
        prerequisites: [], completionRules: [{ id: uid("rule"), type: "ALL_REQUIRED_BLOCKS_VIEWED", operator: "AND" }], takeaway: "Add the lesson takeaway.", recap: [],
        relatedResourceIds: [], allowCommercialReferences: false, blocks: [], status: "DRAFT", createdAt: now, updatedAt: now, createdBy: draft.program.updatedBy, updatedBy: draft.program.updatedBy,
      });
    });
    setSelection({ type: "lesson", id });
  }

  function addBlock(lessonId: string) {
    const id = crypto.randomUUID();
    change((draft) => { for (const step of draft.steps) { const lesson = step.lessons.find((item) => item.id === lessonId); if (lesson) lesson.blocks.push({ id, type: "TEXT", order: (lesson.blocks.length + 1) * 1000, internalLabel: "New text block", required: false, data: { text: "" } }); } });
    setSelection({ type: "block", id });
  }

  function move(direction: -1 | 1) {
    change((draft) => {
      const collections: Array<Array<{ id: string }>> = [draft.steps, ...draft.steps.map((step) => step.lessons), ...draft.steps.flatMap((step) => step.lessons.map((lesson) => lesson.blocks))];
      const collection = collections.find((items) => items.some((item) => item.id === selection.id));
      if (!collection) return;
      const index = collection.findIndex((item) => item.id === selection.id);
      const target = index + direction;
      if (target < 0 || target >= collection.length) return;
      [collection[index], collection[target]] = [collection[target], collection[index]];
    });
  }

  function duplicateSelected() {
    change((draft) => {
      const stepIndex = draft.steps.findIndex((item) => item.id === selection.id);
      if (stepIndex >= 0) {
        const copy = clone(draft.steps[stepIndex]);
        copy.id = crypto.randomUUID(); copy.slug = `${copy.slug}-copy-${copy.id.slice(-5)}`; copy.title += " Copy"; copy.prerequisites = []; copy.completionRules = [{ id: uid("rule"), type: "ALL_REQUIRED_LESSONS_COMPLETED", operator: "AND" }];
        copy.lessons = copy.lessons.map((lesson) => ({ ...lesson, id: crypto.randomUUID(), programStepId: copy.id, slug: `${lesson.slug}-copy-${copy.id.slice(-5)}`, prerequisites: [], completionRules: [{ id: uid("rule"), type: "ALL_REQUIRED_BLOCKS_VIEWED", operator: "AND" }], blocks: lesson.blocks.map((block) => ({ ...block, id: crypto.randomUUID() })) }));
        draft.steps.splice(stepIndex + 1, 0, copy); setSelection({ type: "step", id: copy.id }); return;
      }
      for (const step of draft.steps) {
        const lessonIndex = step.lessons.findIndex((item) => item.id === selection.id);
        if (lessonIndex >= 0) {
          const copy = clone(step.lessons[lessonIndex]); copy.id = crypto.randomUUID(); copy.slug = `${copy.slug}-copy-${copy.id.slice(-5)}`; copy.title += " Copy"; copy.prerequisites = []; copy.completionRules = [{ id: uid("rule"), type: "ALL_REQUIRED_BLOCKS_VIEWED", operator: "AND" }]; copy.blocks = copy.blocks.map((block) => ({ ...block, id: crypto.randomUUID() }));
          step.lessons.splice(lessonIndex + 1, 0, copy); setSelection({ type: "lesson", id: copy.id }); return;
        }
      }
      for (const step of draft.steps) for (const lesson of step.lessons) {
        const blockIndex = lesson.blocks.findIndex((item) => item.id === selection.id);
        if (blockIndex >= 0) { const copy = clone(lesson.blocks[blockIndex]); copy.id = crypto.randomUUID(); copy.internalLabel += " Copy"; lesson.blocks.splice(blockIndex + 1, 0, copy); setSelection({ type: "block", id: copy.id }); return; }
      }
    });
  }

  function moveLessonToStep(lessonId: string, targetStepId: string) {
    change((draft) => {
      let moving: CmsLesson | undefined;
      for (const step of draft.steps) {
        const index = step.lessons.findIndex((lesson) => lesson.id === lessonId);
        if (index >= 0) moving = step.lessons.splice(index, 1)[0];
      }
      const target = draft.steps.find((step) => step.id === targetStepId);
      if (moving && target) { moving.programStepId = target.id; target.lessons.push(moving); }
    });
  }

  function moveBlockToLesson(blockId: string, targetLessonId: string) {
    change((draft) => {
      let moving: CmsBlock | undefined;
      for (const step of draft.steps) for (const lesson of step.lessons) {
        const index = lesson.blocks.findIndex((block) => block.id === blockId);
        if (index >= 0) moving = lesson.blocks.splice(index, 1)[0];
      }
      for (const step of draft.steps) {
        const target = step.lessons.find((lesson) => lesson.id === targetLessonId);
        if (moving && target) { target.blocks.push(moving); return; }
      }
    });
  }

  function archiveSelected() {
    if (selection.type === "program") return;
    change((draft) => {
      if (selection.type === "step") draft.steps = draft.steps.filter((step) => step.id !== selection.id);
      if (selection.type === "lesson") for (const step of draft.steps) step.lessons = step.lessons.filter((lesson) => lesson.id !== selection.id);
      if (selection.type === "block") for (const step of draft.steps) for (const lesson of step.lessons) { const block = lesson.blocks.find((item) => item.id === selection.id); if (block) block.archived = true; }
    });
    setSelection({ type: "program", id: snapshot.program.id });
  }

  async function save() {
    setSaveState("saving"); setMessage("");
    try {
      const response = await fetch(`/api/admin/programs/${snapshot.program.id}/builder`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ snapshot, expectedUpdatedAt }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Save failed");
      setSnapshot(data.snapshot); setExpectedUpdatedAt(data.snapshot.program.updatedAt); setSaveState("saved"); setMessage("Draft saved and revision created.");
    } catch (error) { setSaveState("error"); setMessage(error instanceof Error ? error.message : "Save failed"); }
  }

  async function workflow(action: string) {
    setMessage("");
    try {
      const response = await fetch(`/api/admin/programs/${snapshot.program.id}/action`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Action failed");
      if (data.snapshot) { setSnapshot(data.snapshot); setExpectedUpdatedAt(data.snapshot.program.updatedAt); }
      if (data.program) setSnapshot((current) => ({ ...current, program: { ...current.program, ...data.program } }));
      setMessage(action === "publish" ? "Published snapshot updated. Existing user progress remains linked to stable IDs." : `Workflow action completed: ${action}.`);
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Action failed"); }
  }

  const selectedStep = snapshot.steps.find((step) => step.id === selection.id);
  const selectedLesson = snapshot.steps.flatMap((step) => step.lessons).find((lesson) => lesson.id === selection.id);
  const selectedBlock = snapshot.steps.flatMap((step) => step.lessons.flatMap((lesson) => lesson.blocks)).find((block) => block.id === selection.id);

  return (
    <div className="programBuilder">
      <header className="builderToolbar">
        <div><p className="eyebrow">Program Builder</p><h1>{snapshot.program.title}</h1><div className="badgeCluster"><Badge tone={snapshot.program.status === "PUBLISHED" ? "green" : "warning"}>{snapshot.program.status}</Badge><Badge>Draft v{snapshot.program.draftVersion}</Badge><Badge>Published v{snapshot.program.publishedVersion}</Badge></div></div>
        <div className="builderActions">
          <span className={`saveState ${saveState}`}>{saveState}</span>
          <button className="button ghost" type="button" onClick={() => move(-1)}>Move up</button>
          <button className="button ghost" type="button" onClick={() => move(1)}>Move down</button>
          <a className="button ghost" href={`/admin/programs/${snapshot.program.id}/preview`} target="_blank">Preview</a>
          <a className="button ghost" href={`/admin/programs/${snapshot.program.id}/revisions`}>Revisions</a>
          <button className="button gold" type="button" onClick={save} disabled={saveState === "saving"}>Save draft</button>
        </div>
      </header>
      {message && <div className="builderMessage" role="status">{message}</div>}
      <div className="builderWorkflow">
        <button type="button" onClick={() => workflow("request-review")}>Request review</button>
        <button type="button" onClick={() => workflow("request-changes")}>Request changes</button>
        <button type="button" onClick={() => workflow("approve")}>Approve</button>
        <button type="button" onClick={() => workflow("publish")} disabled={!validation.ok}>Publish</button>
        {selection.type !== "program" && <button type="button" onClick={duplicateSelected}>Duplicate selected</button>}
        {selection.type !== "program" && <button type="button" onClick={archiveSelected}>Archive selected</button>}
      </div>
      <div className="builderPanels">
        <aside className="builderTreePanel">
          <div className="builderPanelHeading"><strong>Structure</strong><span>{snapshot.steps.length} steps</span></div>
          <ProgramStructureTree snapshot={snapshot} selection={selection} issuesById={issuesById} onSelect={setSelection} onAddStep={addStep} onAddLesson={addLesson} onAddBlock={addBlock} />
        </aside>
        <main className="builderEditorPanel">
          {selection.type === "program" && <ProgramSettingsEditor program={snapshot.program} onChange={updateProgram} />}
          {selectedStep && <ProgramStepEditor step={selectedStep} onChange={updateStep} />}
          {selectedLesson && <><LessonEditor lesson={selectedLesson} onChange={updateLesson} /><div className="builderSubEditor"><SelectField label="Move lesson to step" value={selectedLesson.programStepId} options={snapshot.steps.map((step) => step.id)} onChange={(value) => moveLessonToStep(selectedLesson.id, value)} /></div></>}
          {selectedBlock && <><LessonBlockEditor block={selectedBlock} onChange={updateBlock} /><div className="builderSubEditor"><SelectField label="Move block to lesson" value={snapshot.steps.flatMap((step) => step.lessons).find((lesson) => lesson.blocks.some((block) => block.id === selectedBlock.id))?.id || ""} options={snapshot.steps.flatMap((step) => step.lessons.map((lesson) => lesson.id))} onChange={(value) => moveBlockToLesson(selectedBlock.id, value)} /></div></>}
        </main>
        <aside className="builderMetaPanel">
          <div className="builderPanelHeading"><strong>Validation</strong><span>{validation.issues.length} findings</span></div>
          <ProgramValidationPanel report={validation} onJump={(id) => setSelection(findSelection(id))} />
          <Card className="builderMetaCard" tone="soft">
            <h3>Completion</h3>
            <p className="muted">{selectedLesson ? completionRuleSummary(selectedLesson.completionRules) : selectedStep ? completionRuleSummary(selectedStep.completionRules) : completionRuleSummary(snapshot.program.completionRules)}</p>
          </Card>
          <Card className="builderMetaCard">
            <h3>Program totals</h3>
            <div className="builderMetrics"><span>Lessons <strong>{snapshot.steps.reduce((total, step) => total + step.lessons.length, 0)}</strong></span><span>Blocks <strong>{snapshot.steps.reduce((total, step) => total + step.lessons.reduce((lessonTotal, lesson) => lessonTotal + lesson.blocks.filter((block) => !block.archived).length, 0), 0)}</strong></span><span>Configured XP <strong>{snapshot.xpRules.filter((rule) => rule.active).reduce((total, rule) => total + rule.xp, 0)}</strong></span><span>Achievements <strong>{snapshot.achievements.filter((item) => item.active).length}</strong></span></div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export function NewProgramForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    const response = await fetch("/api/admin/programs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, slug: slugify(slug || title) }) });
    const data = await response.json();
    if (!response.ok) { setError(data.error || "Unable to create program"); return; }
    router.push(`/admin/programs/${data.program.id}/builder`);
  }
  return (
    <form className="builderForm" onSubmit={submit}>
      <Field label="Program title" value={title} onChange={(value) => { setTitle(value); if (!slug) setSlug(slugify(value)); }} />
      <Field label="Slug" value={slug} onChange={(value) => setSlug(slugify(value))} />
      {error && <p className="builderError">{error}</p>}
      <button className="button gold" type="submit">Create draft program</button>
    </form>
  );
}

export function ProgramListActions({ programId }: { programId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function act(action: "duplicate" | "archive") {
    setBusy(true);
    const response = await fetch(`/api/admin/programs/${programId}/action`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) return;
    if (action === "duplicate" && data.snapshot) router.push(`/admin/programs/${data.snapshot.program.id}/builder`);
    else router.refresh();
  }
  return <><button className="button ghost" type="button" disabled={busy} onClick={() => act("duplicate")}>Duplicate</button><button className="button ghost" type="button" disabled={busy} onClick={() => act("archive")}>Archive</button></>;
}
