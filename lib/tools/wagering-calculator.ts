export type WageringBase = "bonus" | "deposit-bonus";

export type WageringInput = Readonly<{
  deposit: number;
  bonus: number;
  multiplier: number;
  base: WageringBase;
  /** Share of each bet that counts towards wagering, 0–1. */
  contribution: number;
  /** Return to player, in percent. */
  rtp: number;
}>;

export type WageringResult = Readonly<{
  baseAmount: number;
  requiredTurnover: number;
  actualTurnover: number;
  expectedLoss: number;
  netValue: number;
}>;

/** Game contribution choices shown by the calculator, as typical casino weightings. */
export const WAGERING_CONTRIBUTIONS = [
  { key: "slots", value: 1 },
  { key: "tableGames", value: 0.5 },
  { key: "roulette", value: 0.2 },
  { key: "blackjack", value: 0.1 },
] as const;

const DEFAULT_RTP = 96;

function finiteAtLeastZero(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * Converts advertised bonus terms into the money a player must bet and the average
 * cost of that betting. Pure arithmetic over the entered figures: no operator data.
 */
export function calculateWagering(input: WageringInput): WageringResult {
  const deposit = finiteAtLeastZero(input.deposit);
  const bonus = finiteAtLeastZero(input.bonus);
  const multiplier = finiteAtLeastZero(input.multiplier);
  const contribution = Math.min(1, finiteAtLeastZero(input.contribution)) || 1;
  const rtp = Number.isFinite(input.rtp) ? Math.min(100, Math.max(0, input.rtp)) : DEFAULT_RTP;
  const baseAmount = input.base === "deposit-bonus" ? deposit + bonus : bonus;
  const requiredTurnover = baseAmount * multiplier;
  const actualTurnover = requiredTurnover / contribution;
  const expectedLoss = actualTurnover * (1 - rtp / 100);
  return { baseAmount, requiredTurnover, actualTurnover, expectedLoss, netValue: bonus - expectedLoss };
}
