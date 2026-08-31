import type { ProgrammeLocale } from "@/lib/programme/presentation";
import { ProgrammeProviderError } from "@/lib/programme/program-ai/provider-errors";

type LocalePatterns = Readonly<{
  clinicalOrSafety: readonly RegExp[];
  commercialTerms: readonly RegExp[];
}>;

/**
 * Bounded lexical backstop for provider output. This complements the strict
 * schema and provider policy; it is deliberately not applied to user text.
 */
export const PROGRAMME_OUTPUT_SAFETY_PATTERNS: Record<ProgrammeLocale, LocalePatterns> = {
  "en-GB": {
    clinicalOrSafety: [/\bdiagnos(?:e|ed|es|is|tic)\b/i, /\brisk score\b/i, /\bsafe to gamble\b/i, /\bwhere to play\b/i, /\bsafest\b/i, /\bxp\b/i],
    commercialTerms: [/\bcasino(?:s)?\b/i, /\boperator(?:s)?\b/i, /\bbonus(?:es)?\b/i],
  },
  "de-DE": {
    clinicalOrSafety: [/\bdiagnos(?:e|tizier\w*)\b/i, /\brisikowert\b/i, /\bsicher spielen\b/i, /\bwo spielen\b/i, /\bsicherste\w*\b/i, /\bxp\b/i],
    commercialTerms: [/\bcasino(?:s)?\b/i, /\bglücksspielanbieter\w*\b/i, /\bboni\b|\bbonus\w*\b/i],
  },
  "es-ES": {
    clinicalOrSafety: [/\bdiagn[oó]stic\w*\b/i, /\bpuntuaci[oó]n de riesgo\b/i, /\bseguro jugar\b/i, /\bd[oó]nde jugar\b/i, /\bm[aá]s seguro\b/i, /\bxp\b/i],
    commercialTerms: [/\bcasino(?:s)?\b/i, /\boperador(?:es)?\b/i, /\bbono(?:s)?\b/i],
  },
  "sv-SE": {
    clinicalOrSafety: [/\bdiagnos\w*\b/i, /\briskpoäng\b/i, /\bsäkert att spela\b/i, /\bvar man spelar\b/i, /\bsäkrast\w*\b/i, /\bxp\b/i],
    commercialTerms: [/\bcasinon?\b|\bkasino(?:n)?\b/i, /\boperatör(?:er)?\b/i, /\bbonus(?:ar)?\b/i],
  },
  "da-DK": {
    clinicalOrSafety: [/\bdiagnos\w*\b/i, /\brisikoscore\b/i, /\bsikkert at spille\b/i, /\bhvor man spiller\b/i, /\bsikrest\w*\b/i, /\bxp\b/i],
    commercialTerms: [/\bkasino(?:er)?\b|\bcasino(?:er)?\b/i, /\boperatør(?:er)?\b/i, /\bbonus(?:ser)?\b/i],
  },
  "el-GR": {
    clinicalOrSafety: [/διαγν[ωώ]σ\p{L}*/iu, /βαθμολογ\p{L}* κινδ[υύ]νου/iu, /ασφαλ[εέ]ς να πα[ιί]ξ\p{L}*/iu, /πο[υύ] να πα[ιί]ξ\p{L}*/iu, /ασφαλ[εέ]στερ\p{L}*/iu, /\bxp\b/i],
    commercialTerms: [/καζ[ιί]νο/i, /π[αά]ροχ\p{L}*/iu, /μπ[οό]νους/i],
  },
  "it-IT": {
    clinicalOrSafety: [/\bdiagnos\w*\b/i, /\bpunteggio di rischio\b/i, /\bsicuro giocare\b/i, /\bdove giocare\b/i, /\bpiù sicur\w*\b/i, /\bxp\b/i],
    commercialTerms: [/\bcasin[oò]\b/i, /\boperator(?:e|i)\b/i, /\bbonus\b/i],
  },
  "pt-PT": {
    clinicalOrSafety: [/\bdiagn[oó]stic\w*\b/i, /\bpontuaç[aã]o de risco\b/i, /\bseguro jogar\b/i, /\bonde jogar\b/i, /\bmais segur\w*\b/i, /\bxp\b/i],
    commercialTerms: [/\bcasino(?:s)?\b/i, /\boperador(?:es)?\b/i, /\bb[oó]nus\b/i],
  },
  "nl-NL": {
    clinicalOrSafety: [/\bdiagnos\w*\b/i, /\brisicoscore\b/i, /\bveilig om te spelen\b/i, /\bwaar te spelen\b/i, /\bveiligst\w*\b/i, /\bxp\b/i],
    commercialTerms: [/\bcasino(?:'s|s)?\b/i, /\baanbieder(?:s)?\b/i, /\bbonussen?\b/i],
  },
  "fi-FI": {
    clinicalOrSafety: [/\bdiagnoos\w*\b/i, /\briskipiste\w*\b/i, /\bturvallista pelata\b/i, /\bmissä pelata\b/i, /\bturvallisin\w*\b/i, /\bxp\b/i],
    commercialTerms: [/\bkasino(?:t|a)?\b/i, /\bpeliyhtiö\w*\b/i, /\bbonukse\w*\b/i],
  },
  "nb-NO": {
    clinicalOrSafety: [/\bdiagnos\w*\b/i, /\brisikoscore\b/i, /\btrygt å spille\b/i, /\bhvor man spiller\b/i, /\btryggest\w*\b/i, /\bxp\b/i],
    commercialTerms: [/\bkasino(?:er)?\b|\bcasino(?:er)?\b/i, /\boperatør(?:er)?\b/i, /\bbonus(?:er)?\b/i],
  },
};

export function assertSafeProgrammeGeneratedText(
  value: string,
  { strictCommercialTerms = false }: { strictCommercialTerms?: boolean } = {},
) {
  const unsafe = Object.values(PROGRAMME_OUTPUT_SAFETY_PATTERNS).some((patterns) => (
    patterns.clinicalOrSafety.some((pattern) => pattern.test(value))
    || (strictCommercialTerms && patterns.commercialTerms.some((pattern) => pattern.test(value)))
  ));
  if (unsafe) throw new ProgrammeProviderError("PROVIDER_INVALID_OUTPUT");
  return value;
}
