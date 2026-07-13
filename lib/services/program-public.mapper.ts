import type {
  ProgramBuilderSnapshot,
} from "@/lib/cms/types";
import type { ProgramStep } from "@/lib/program";

function dataObject(
  value: unknown,
): Record<string, unknown> {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function programSnapshotToPublicSteps(
  snapshot: ProgramBuilderSnapshot,
): ProgramStep[] {
  return snapshot.steps.map((step, index) => {
    const lesson = step.lessons[0];

    const blocks =
      lesson?.blocks.filter(
        (block) => !block.archived,
      ) ?? [];

    const text = blocks.find(
      (block) => block.type === "TEXT",
    );

    const exercise = blocks.find(
      (block) =>
        block.type === "EXERCISE" ||
        block.type === "REFLECTION",
    );

    const scenario = blocks.find(
      (block) => block.type === "SCENARIO",
    );

    const quiz = blocks.find(
      (block) => block.type === "QUIZ",
    );

    const summary = blocks.find(
      (block) => block.type === "SUMMARY",
    );

    const scenarioChoices = Array.isArray(
      scenario?.data.choices,
    )
      ? scenario.data.choices.map(dataObject)
      : [];

    const questions = Array.isArray(
      quiz?.data.questions,
    )
      ? quiz.data.questions.map(dataObject)
      : [];

    const firstQuestion = questions[0] ?? {};

    const quizOptions = Array.isArray(
      firstQuestion.options,
    )
      ? firstQuestion.options.map(dataObject)
      : [];

    const correctIndex = Math.max(
      0,
      quizOptions.findIndex(
        (option) => option.correct === true,
      ),
    );

    const recap = Array.isArray(
      summary?.data.recap,
    )
      ? summary.data.recap.filter(
          (item): item is string =>
            typeof item === "string",
        )
      : lesson?.recap ?? [];

    return {
      stableId: step.id,
      day: index + 1,
      title: step.title,
      focus: step.description,
      tasks: recap.slice(0, 3),
      estimatedTime: `${step.estimatedMinutes} min`,
      whyItMatters: step.learningObjective,
      keyTakeaway:
        step.practicalTakeaway ||
        lesson?.takeaway ||
        "Pause and review the practical takeaway.",
      lesson:
        typeof text?.data.text === "string"
          ? text.data.text
          : lesson?.summary ||
            step.description,
      exercisePrompt:
        typeof exercise?.data.instructions ===
        "string"
          ? exercise.data.instructions
          : "Write a short reflection before continuing.",
      scenario: {
        prompt:
          typeof scenario?.data.situation ===
          "string"
            ? scenario.data.situation
            : "Which option best supports a planned decision?",
        options: scenarioChoices.map(
          (choice) => ({
            label:
              typeof choice.label === "string"
                ? choice.label
                : "Option",
            feedback:
              typeof choice.feedback === "string"
                ? choice.feedback
                : "Review this choice against your plan.",
            recommended:
              choice.preferred === true,
          }),
        ),
      },
      quiz: {
        question:
          typeof firstQuestion.prompt ===
          "string"
            ? firstQuestion.prompt
            : "What is the key takeaway?",
        options: quizOptions.map((option) =>
          typeof option.label === "string"
            ? option.label
            : "Option",
        ),
        correctIndex,
        explanation:
          typeof firstQuestion.explanation ===
          "string"
            ? firstQuestion.explanation
            : "Review the lesson before continuing.",
      },
      recap,
      xp: {
        lesson: lesson?.xp ?? 0,
        scenario:
          typeof scenario?.data.xp === "number"
            ? scenario.data.xp
            : 0,
        quiz:
          typeof quiz?.data.xp === "number"
            ? quiz.data.xp
            : 0,
        guide:
          typeof exercise?.data.xp === "number"
            ? exercise.data.xp
            : 0,
      },
    };
  });
}
