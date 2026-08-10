import { Prisma } from "@prisma/client";

import prisma from "@/lib/db/prisma";
import {
  CONTROL_PROGRAM_SLUG,
  controlProgrammePath,
} from "@/lib/programme/contract";

const actor = "system:rfc-002-rfc-008";

const missionContent = [
  {
    slug: "map-the-moment",
    description: "Reconstruct one decision moment and separate its situation, cue, response and immediate consequence.",
    objective: "Create a private Moment Map and one personal notice rule.",
    takeaway: "A visible sequence can be recognised earlier next time.",
    minutes: 20,
  },
  {
    slug: "set-a-seven-day-goal",
    description: "Turn the Moment Map into one specific, realistic and reviewable seven-day action.",
    objective: "Create a Current Goal with a cue, action, alternative, success signal and review date.",
    takeaway: "A useful goal describes an action the person can recognise and review.",
    minutes: 22,
  },
  {
    slug: "understand-the-urge",
    description: "Complete a short evidence-based learning interaction and identify one personal early signal.",
    objective: "Review one learning item and record an optional reflection.",
    takeaway: "An urge can be noticed without turning it into an automatic next action.",
    minutes: 20,
  },
  {
    slug: "build-one-boundary",
    description: "Create, select or revise one concrete personal rule.",
    objective: "Save one editable active boundary.",
    takeaway: "A boundary is more usable when it is concrete and written in advance.",
    minutes: 20,
  },
  {
    slug: "check-before-deciding",
    description: "Check material terms, source quality and uncertainty before a commercial decision.",
    objective: "Create a personal decision checklist.",
    takeaway: "A headline is not enough to evaluate an offer or operator.",
    minutes: 20,
  },
  {
    slug: "add-friction",
    description: "Choose one pause, limit, notification or environmental friction action.",
    objective: "Save one practical control action or a deliberate deferral.",
    takeaway: "A small amount of friction can create time for another decision.",
    minutes: 20,
  },
  {
    slug: "prepare-support",
    description: "Review support choices and select a contact or resource plan, or decline for now.",
    objective: "Create a private support plan or an informed deferral.",
    takeaway: "Support is easier to use when the route is prepared in advance.",
    minutes: 20,
  },
  {
    slug: "research-responsibly",
    description: "Apply the decision checklist to eligible information or choose a non-commercial alternative.",
    objective: "Save research criteria without requiring a referral.",
    takeaway: "Research should follow the person's criteria, not promotional pressure.",
    minutes: 22,
  },
  {
    slug: "rehearse-the-decision",
    description: "Complete a short scenario and implementation-intention exercise for a likely future moment.",
    objective: "Create a when/then decision rule.",
    takeaway: "A rehearsed response is easier to recognise when the situation returns.",
    minutes: 20,
  },
  {
    slug: "make-the-plan-reviewable",
    description: "Confirm, edit or reject the assembled plan and choose the next self-directed action.",
    objective: "Create a reviewable personal decision plan, pause, support, research or no-play outcome.",
    takeaway: "The final plan remains editable and belongs to the person who created it.",
    minutes: 22,
  },
] as const;

async function seed() {
  if (missionContent.length !== controlProgrammePath.length) {
    throw new Error("Approved mission content must contain exactly ten missions");
  }

  const existing = await prisma.program.findUnique({
    where: { slug: CONTROL_PROGRAM_SLUG },
    include: { steps: { where: { archivedAt: null } }, versions: true },
  });

  if (existing) {
    const publishedVersion = existing.versions.find(
      (version) => version.version === existing.publishedVersion && version.status === "PUBLISHED",
    );
    if (
      existing.status === "PUBLISHED" &&
      existing.steps.length === 10 &&
      publishedVersion
    ) {
      console.log(JSON.stringify({
        status: "already-published",
        programId: existing.id,
        publishedVersion: existing.publishedVersion,
        stepCount: existing.steps.length,
      }));
      return;
    }
    throw new Error(
      "A Control Program already exists but is not the expected published ten-step version; review it in Admin instead of overwriting it.",
    );
  }

  const publishedAt = new Date();
  const result = await prisma.$transaction(async (database) => {
    const program = await database.program.create({
      data: {
        slug: CONTROL_PROGRAM_SLUG,
        internalName: "B4GAMBLE Active Control Programme",
        title: "B4GAMBLE 10-Step Control Programme",
        summary: "Ten practical missions that turn difficult gambling-decision moments into a private, editable control plan.",
        introduction: "A self-directed educational programme for recognising cues, creating practical rules and reviewing decisions. It is not diagnosis or treatment.",
        estimatedTotalMinutes: missionContent.reduce((total, mission) => total + mission.minutes, 0),
        language: "en-GB",
        difficulty: "Self-directed",
        xpCompletionReward: 0,
        certificateEnabled: false,
        registrationRequirementPoint: "AFTER_MISSION_01",
        progressSavingBehavior: "ANONYMOUS_THEN_ACCOUNT",
        completionRules: {
          type: "ALL_TEN_MISSIONS_REVIEWED",
          rewardPolicy: "DETERMINISTIC_PROGRAMME_ACTIONS_ONLY",
        },
        seoTitle: "B4GAMBLE 10-Step Control Programme",
        seoDescription: "Build a private Moment Map, practical boundaries and a reviewable personal control plan.",
        canonicalUrl: "/program",
        publishedVersion: 1,
        draftVersion: 1,
        publishedAt,
        status: "PUBLISHED",
        createdBy: actor,
        updatedBy: actor,
      },
    });

    const steps = [];
    for (const [index, mission] of missionContent.entries()) {
      const title = controlProgrammePath[index];
      const step = await database.programStep.create({
        data: {
          programId: program.id,
          slug: `control-${String(index + 1).padStart(2, "0")}-${mission.slug}`,
          title,
          shortTitle: title,
          description: mission.description,
          learningObjective: mission.objective,
          status: "PUBLISHED",
          order: index + 1,
          estimatedMinutes: mission.minutes,
          xp: index === 0 ? 60 : index === 1 ? 80 : 0,
          completionMessage: `Mission ${String(index + 1).padStart(2, "0")} complete: ${mission.takeaway}`,
          practicalTakeaway: mission.takeaway,
          prerequisites: index === 0 ? [] : [{ type: "MISSION_COMPLETED", missionNumber: index }],
          visibility: "PUBLIC_PROGRAMME",
          relatedGuideIds: [],
          relatedResourceIds: [],
          completionRules: {
            type: "REQUIRED_PROGRAMME_ACTIONS_COMPLETED",
            missionNumber: index + 1,
          },
          createdBy: actor,
          updatedBy: actor,
        },
      });
      steps.push(step);
    }

    const snapshot = {
      schemaVersion: "active-control-program-v1",
      productAuthority: "RFC-002",
      persistenceAuthority: "RFC-008",
      program: {
        id: program.id,
        slug: program.slug,
        title: program.title,
        language: program.language,
      },
      missions: steps.map((step) => ({
        id: step.id,
        missionNumber: step.order,
        slug: step.slug,
        title: step.title,
        estimatedMinutes: step.estimatedMinutes,
        xp: step.xp,
      })),
    } satisfies Prisma.InputJsonValue;

    const version = await database.programVersion.create({
      data: {
        programId: program.id,
        version: 1,
        status: "PUBLISHED",
        snapshot,
        publishedAt,
        createdBy: actor,
      },
    });

    return { program, version, steps };
  });

  console.log(JSON.stringify({
    status: "published",
    programId: result.program.id,
    publishedVersion: result.version.version,
    stepCount: result.steps.length,
  }));
}

seed()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
