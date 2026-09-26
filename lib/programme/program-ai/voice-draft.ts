export const PROGRAMME_VOICE_DRAFT_LIMIT = 4_000;

export type ProgrammeVoiceDraftSegment = {
  start: number;
  end: number;
  separator: string;
  conflicted: boolean;
};

export function beginProgrammeVoiceDraftSegment(draft: string): ProgrammeVoiceDraftSegment {
  return {
    start: draft.length,
    end: draft.length,
    separator: draft.length > 0 && !/\s$/.test(draft) ? " " : "",
    conflicted: false,
  };
}

export function applyProgrammeVoiceDraftText(
  draft: string,
  segment: ProgrammeVoiceDraftSegment,
  providerText: string,
): { draft: string; segment: ProgrammeVoiceDraftSegment; truncated: boolean } {
  if (segment.conflicted) return { draft, segment, truncated: false };
  const normalised = providerText.trim();
  const available = Math.max(
    0,
    PROGRAMME_VOICE_DRAFT_LIMIT - (draft.length - (segment.end - segment.start)),
  );
  const requested = `${normalised ? segment.separator : ""}${normalised}`;
  const replacement = requested.slice(0, available);
  const nextDraft = `${draft.slice(0, segment.start)}${replacement}${draft.slice(segment.end)}`;
  return {
    draft: nextDraft,
    segment: { ...segment, end: segment.start + replacement.length },
    truncated: replacement.length < requested.length,
  };
}

export function reconcileProgrammeVoiceDraftEdit(
  previous: string,
  next: string,
  segment: ProgrammeVoiceDraftSegment,
): ProgrammeVoiceDraftSegment {
  if (segment.conflicted || previous === next) return segment;
  let prefix = 0;
  while (prefix < previous.length && prefix < next.length && previous[prefix] === next[prefix]) prefix += 1;
  let suffix = 0;
  while (
    suffix < previous.length - prefix
    && suffix < next.length - prefix
    && previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix]
  ) suffix += 1;

  const oldChangeEnd = previous.length - suffix;
  if (oldChangeEnd <= segment.start) {
    const shift = next.length - previous.length;
    return { ...segment, start: segment.start + shift, end: segment.end + shift };
  }
  if (prefix >= segment.end) return segment;
  return { ...segment, conflicted: true };
}
