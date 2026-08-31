const PROGRAMME_INTERNATIONALISATION_RELEASE_BRANCH = "feat/programme-internationalisation";

type ProgrammeReleaseEnvironment = {
  PROGRAM_AI_V1_ENABLED?: string;
  VERCEL_ENV?: string;
  VERCEL_GIT_COMMIT_REF?: string;
};

export type ProgrammeReleaseRuntimeResult =
  | { checked: false }
  | { checked: true; branch: typeof PROGRAMME_INTERNATIONALISATION_RELEASE_BRANCH; programmeAiV1Enabled: true };

/**
 * PR #106 deploys the canonical Programme UI, whose first mutation requires
 * PROGRAM-AI v1. Keep this temporary release-candidate guard exact so other
 * Preview branches and Production retain their independently governed flags.
 */
export function assertProgrammeReleaseRuntime(
  environment: ProgrammeReleaseEnvironment = process.env as ProgrammeReleaseEnvironment,
): ProgrammeReleaseRuntimeResult {
  if (
    environment.VERCEL_ENV !== "preview"
    || environment.VERCEL_GIT_COMMIT_REF !== PROGRAMME_INTERNATIONALISATION_RELEASE_BRANCH
  ) {
    return { checked: false };
  }
  if (environment.PROGRAM_AI_V1_ENABLED !== "true") {
    throw new Error(
      "PR #106 Preview runtime acceptance failed: PROGRAM_AI_V1_ENABLED must be exact true.",
    );
  }
  return {
    checked: true,
    branch: PROGRAMME_INTERNATIONALISATION_RELEASE_BRANCH,
    programmeAiV1Enabled: true,
  };
}
