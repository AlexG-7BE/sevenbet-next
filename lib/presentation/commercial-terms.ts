type PaymentTiming = Readonly<{
  name?: string | null;
  supportsWithdrawals?: boolean | null;
  withdrawalTime?: string | null;
}>;

type MissingTermLabels = Readonly<{ notListed: string; notStated: string }>;

function compactDuration(value: string) {
  return value
    .replace(/\bone to two days\b/gi, "1–2d")
    .replace(/\bwithin one day\b/gi, "within 1d")
    .replace(/\bone day\b/gi, "1d")
    .replace(/(\d+(?:[.,]\d+)?)\s*(?:–|—|-)\s*(\d+(?:[.,]\d+)?)\s*hours?\b/gi, "$1–$2h")
    .replace(/(\d+(?:[.,]\d+)?)\s*(?:–|—|-)\s*(\d+(?:[.,]\d+)?)\s*days?\b/gi, "$1–$2d")
    .replace(/(\d+(?:[.,]\d+)?)\s*hours?\b/gi, "$1h")
    .replace(/(\d+(?:[.,]\d+)?)\s*days?\b/gi, "$1d")
    .replace(/\s+/g, " ")
    .trim();
}

function compactMethodName(name: string | null | undefined) {
  const value = (name ?? "").trim();
  const lower = value.toLocaleLowerCase("en");
  if (!value) return "";
  if (/bank\s*\/\s*card|card\s*\/\s*bank/.test(lower)) return "bank/card";
  if (/e[- ]?wallet|skrill|neteller|muchbetter|eco ?payz/.test(lower)) return "e-wallet";
  if (/visa|mastercard|debit|credit|card/.test(lower)) return "card";
  if (/bank|wire|transfer/.test(lower)) return "bank";
  if (/crypto|bitcoin|ethereum|usdt/.test(lower)) return "crypto";
  return value;
}

function compactTimingClause(clause: string, methodName: string) {
  const raw = compactDuration(clause.replace(/[.;]+$/g, "").trim());
  const reportedReview = raw.match(/^pending review reported as (.+)$/i);
  if (reportedReview) return `reported ${reportedReview[1]} review`;
  const review = raw.match(/^pending review(?: takes?| time)?\s*(.+)$/i);
  if (review) return `${review[1].replace(/^[:·-]\s*/, "")} review`;

  const processing = raw.match(/^(.+?)\s+processing\s+(.+)$/i);
  if (processing) return `${processing[2]} ${compactMethodName(processing[1]) || processing[1]}`;
  if (/^(?:typically\s+)?(?:within|up to|\d|one\b)/i.test(raw) && methodName) return `${raw.toLocaleLowerCase("en")} ${methodName}`;
  return raw;
}

function timingPriority(value: string) {
  if (/\breview\b/i.test(value)) return 0;
  if (/e-wallet/i.test(value)) return 1;
  if (/\bbank\b|\bcard\b/i.test(value)) return 2;
  return 3;
}

export function formatCompactPayout(payments: readonly PaymentTiming[], notListed: string) {
  const values = payments.flatMap((payment) => {
    if (payment.supportsWithdrawals === false || !payment.withdrawalTime?.trim()) return [];
    const method = compactMethodName(payment.name);
    return payment.withdrawalTime.split(";").map((clause) => compactTimingClause(clause, method)).filter(Boolean);
  });
  const unique = [...new Set(values)].sort((a, b) => timingPriority(a) - timingPriority(b));
  if (!unique.length) return notListed;
  return unique.slice(0, 3).join(" · ");
}

export function formatCompactWagering(
  multiplier: number | null | undefined,
  text: string | null | undefined,
  labels: MissingTermLabels,
) {
  if (typeof multiplier === "number" && Number.isFinite(multiplier)) return `${multiplier}x`;
  const value = text?.trim();
  if (!value) return labels.notListed;
  if (/not separately stated|not stated|not disclosed|not specified/i.test(value)) return labels.notStated;
  if (/\bno wagering(?: requirement)?\b/i.test(value)) return "No wagering";
  const compact = value.match(/(?:^|\s)(≤|up to\s+)?(\d+(?:[.,]\d+)?)\s*[x×]\b/i);
  if (compact) {
    const qualifier = compact[1]?.trim().toLocaleLowerCase("en") === "up to" ? "Up to " : compact[1] ?? "";
    return `${qualifier}${compact[2]}x`;
  }
  return value.length <= 36 ? value : labels.notStated;
}
