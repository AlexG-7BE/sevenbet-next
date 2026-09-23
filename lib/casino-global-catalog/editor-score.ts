/**
 * Editor Score — the six-component method approved for PR #256 and reused for
 * the EGO/SkillOnNet publication on 22 September 2026, stated once so every
 * casino is scored on the same basis and the components can be shown to
 * readers instead of an unexplained number.
 *
 * Counts are taken over the casino's AVAILABLE markets together with its
 * global catalog layer. The score is editorial only: it grants no commercial
 * eligibility, and partner status never participates.
 *
 * Arithmetic runs in integer hundredths so every boundary rounds half-up
 * exactly. The method reproduces twelve of the thirteen component sets
 * published on 22 September 2026; PlayOJO Bingo's user-experience component is
 * recorded there as 7.5 where the stated method yields 7.6 from the same
 * counts. The cause of that 0.1 is not established in the record, and the
 * casino's published score of 7.2 is unaffected either way.
 */

export interface EditorScoreInput {
  /**
   * Distinct regulators whose licence is recorded `Active` and is not flagged
   * as unverified, reachable from an AVAILABLE market.
   */
  verifiedRegulators: number;
  /** Distinct regulators recorded `Active` but flagged as not primary-verified. */
  unverifiedRegulators: number;
  gameCategories: number;
  paymentMethods: number;
  gameProviders: number;
  liveCasino: boolean;
  supportLanguages: number;
  /** True only when every AVAILABLE market records a support summary. */
  everyMarketDocumentsSupport: boolean;
}

export type EditorScoreComponentKey =
  | "trust"
  | "userExperience"
  | "payments"
  | "games"
  | "support"
  | "responsibleGambling";

export interface EditorScoreBreakdown {
  components: Record<EditorScoreComponentKey, number>;
  score: number;
}

const FLOOR = 600;
const CEILING = 900;

function clampHundredths(value: number, ceiling = CEILING) {
  return Math.max(FLOOR, Math.min(ceiling, value));
}

/** Half-up from hundredths to one decimal place, expressed back in hundredths. */
function roundToTenth(hundredths: number) {
  return Math.floor((hundredths + 5) / 10) * 10;
}

export function editorScoreBreakdown(input: EditorScoreInput): EditorScoreBreakdown {
  const raw: Record<EditorScoreComponentKey, number> = {
    trust: clampHundredths(600 + 50 * input.verifiedRegulators + 20 * input.unverifiedRegulators),
    userExperience: clampHundredths(680 + 25 * input.gameCategories),
    payments: clampHundredths(620 + 35 * input.paymentMethods),
    games: clampHundredths(620 + 15 * input.gameProviders + (input.liveCasino ? 50 : 0)),
    support: clampHundredths(660 + 30 * input.supportLanguages + (input.everyMarketDocumentsSupport ? 30 : 0), 860),
    responsibleGambling: clampHundredths(620 + 40 * input.verifiedRegulators, 820),
  };

  const rounded = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, roundToTenth(value)]),
  ) as Record<EditorScoreComponentKey, number>;

  const total = Object.values(rounded).reduce((carry, value) => carry + value, 0);
  // Half-up mean of the six rounded components, still in integer arithmetic.
  const score = Math.floor((total + 30) / 60);

  return {
    components: Object.fromEntries(
      Object.entries(rounded).map(([key, value]) => [key, value / 100]),
    ) as Record<EditorScoreComponentKey, number>,
    score: score / 10,
  };
}

/**
 * A licence counts toward trust only when the record says the regulator is
 * currently active. `Reported` — used where a registration was never read
 * against the regulator's own register — counts for nothing.
 */
export function classifyLicenceStatus(status: string | null | undefined) {
  const value = status?.trim() ?? "";
  if (!value.toLowerCase().startsWith("active")) return "IGNORED" as const;
  return /not primary-verified/i.test(value) ? "UNVERIFIED" as const : "VERIFIED" as const;
}

/** Collapses licence rows to one verdict per regulator: verified wins over flagged. */
export function countRegulators(
  licences: ReadonlyArray<{ authority: string; status: string | null }>,
) {
  const byAuthority = new Map<string, boolean>();
  for (const licence of licences) {
    const classification = classifyLicenceStatus(licence.status);
    if (classification === "IGNORED") continue;
    byAuthority.set(licence.authority, (byAuthority.get(licence.authority) ?? false) || classification === "VERIFIED");
  }
  const values = [...byAuthority.values()];
  return {
    verifiedRegulators: values.filter(Boolean).length,
    unverifiedRegulators: values.filter((value) => !value).length,
  };
}

/** Stable identity for a licence record, so duplicate rows collapse to one regulator. */
export function licenceIdentityKey(licence: {
  authority: string;
  licenseNumber?: string | null;
  jurisdiction?: string | null;
}) {
  return JSON.stringify([licence.authority, licence.licenseNumber ?? "", licence.jurisdiction ?? ""]);
}

export interface ScoreCountingMarket {
  availability: string;
  supportLanguages: string[];
  supportSummary: string | null;
  paymentKeys: string[];
  providerKeys: string[];
  categoryKeys: string[];
  liveCasino: boolean;
  /** Licence identities this market profile evidences. */
  licenceKeys: string[];
}

export interface ScoreCountingInput {
  markets: ScoreCountingMarket[];
  /** Global catalog rows, which belong to the brand rather than a market. */
  globalPaymentKeys: string[];
  globalProviderKeys: string[];
  globalCategoryKeys: string[];
  globalLiveCasino: boolean;
  licences: Array<{ key: string; authority: string; status: string | null }>;
}

/**
 * Counts are taken over the casino's AVAILABLE markets together with its
 * global catalog layer. A market recorded as unavailable describes somewhere
 * the casino is not offered, so it must not lift the score, and the global
 * layer is what the brand offers everywhere.
 *
 * A regulator counts only when an AVAILABLE market evidences its licence, so a
 * licence held solely for a market we do not publish cannot raise trust.
 */
export function editorScoreInputFromRecord(input: ScoreCountingInput): EditorScoreInput {
  const available = input.markets.filter((market) => market.availability === "AVAILABLE");
  const union = (selector: (market: ScoreCountingMarket) => readonly string[], global: readonly string[]) =>
    new Set([...available.flatMap(selector), ...global]).size;

  const reachableLicenceKeys = new Set(available.flatMap((market) => market.licenceKeys));
  const { verifiedRegulators, unverifiedRegulators } = countRegulators(
    input.licences.filter((licence) => reachableLicenceKeys.has(licence.key)),
  );

  return {
    verifiedRegulators,
    unverifiedRegulators,
    gameCategories: union((market) => market.categoryKeys, input.globalCategoryKeys),
    paymentMethods: union((market) => market.paymentKeys, input.globalPaymentKeys),
    gameProviders: union((market) => market.providerKeys, input.globalProviderKeys),
    liveCasino: input.globalLiveCasino || available.some((market) => market.liveCasino),
    supportLanguages: union((market) => market.supportLanguages, []),
    everyMarketDocumentsSupport: available.length > 0
      && available.every((market) => Boolean(market.supportSummary?.trim())),
  };
}
