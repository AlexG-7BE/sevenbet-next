import { isSafePublicSlug, safePublicUrl } from "@/lib/public-casino/public-casino-validation";
import type {
  PublicCasinoBonus,
  PublicCasinoDTO,
  PublicOfferPresentation,
  PublicOfferPresentationRelation,
  PublishedCasinoSnapshotRecord,
  PublishedOfferCandidate,
} from "@/lib/public-casino/public-casino.types";

export interface PublishedOfferCorpusRow {
  casinoId: string;
  globalBonuses: unknown;
  marketBonusGroups: unknown;
  bonusMetadata: unknown;
}

export interface PublishedOfferCandidateRow {
  casinoId: string;
  sourceCountryCode: string | null;
  bonus: unknown;
  bonusMetadata: unknown;
}

export interface ResolvedPublishedOfferCandidate {
  candidate: PublishedOfferCandidate;
  relation: Exclude<PublicOfferPresentationRelation, "NONE">;
  sourceCountryCode: string | null;
  presentationCountryCode: string | null;
  currentMarketVerified: boolean;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value: unknown) {
  return text(value) || null;
}

function number(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function integer(value: unknown) {
  const parsed = number(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function date(value: unknown) {
  if (typeof value !== "string" && !(value instanceof Date)) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
}

function countryCode(value: unknown) {
  const normalized = text(value).toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

function countryCodes(value: unknown) {
  return [...new Set(list(value).flatMap((entry) => countryCode(entry) ?? []))].sort();
}

function geoMode(value: unknown) {
  const normalized = text(value).toUpperCase();
  return normalized === "ALLOW" || normalized === "BLOCK" ? normalized : "GLOBAL";
}

function mapPublishedBonus(value: unknown, now: Date): PublicCasinoBonus | null {
  const bonus = record(value);
  const startsAt = date(bonus.startsAt);
  const expiresAt = date(bonus.expiresAt);
  if (text(bonus.status).toUpperCase() !== "PUBLISHED" || text(bonus.offerStatus).toUpperCase() !== "ACTIVE") return null;
  if (startsAt && new Date(startsAt) > now) return null;
  if (expiresAt && new Date(expiresAt) < now) return null;

  const id = text(bonus.id);
  const slug = text(bonus.slug);
  const title = text(bonus.title);
  if (!id || !isSafePublicSlug(slug) || !title) return null;

  return {
    id,
    slug,
    title,
    summary: text(bonus.summary),
    type: text(bonus.type) || "OTHER",
    percentage: number(bonus.percentage),
    minimumDeposit: number(bonus.minimumDeposit),
    maximumBonus: number(bonus.maximumBonus),
    maximumBet: number(bonus.maximumBet),
    currency: nullableText(bonus.currency),
    freeSpins: integer(bonus.freeSpins),
    wageringMultiplier: number(bonus.wageringMultiplier),
    wageringText: nullableText(bonus.wageringText),
    eligibility: nullableText(bonus.eligibility),
    importantConditions: list(bonus.importantConditions).flatMap((entry) => text(entry) || []),
    termsUrl: safePublicUrl(bonus.termsUrl),
    startsAt,
    expiresAt,
    affiliate: { href: null, available: false },
  };
}

function candidate(
  casinoId: string,
  value: unknown,
  sourceCountryCode: string | null,
  extension: Record<string, unknown>,
  now: Date,
): PublishedOfferCandidate | null {
  const bonusRecord = record(value);
  const bonus = mapPublishedBonus(bonusRecord, now);
  if (!bonus) return null;
  const marketScoped = sourceCountryCode !== null;
  return {
    casinoId,
    bonus,
    sourceScope: marketScoped ? "MARKET" : "GLOBAL",
    sourceCountryCode,
    geoMode: marketScoped ? "ALLOW" : geoMode(extension.geoMode ?? bonusRecord.geoMode),
    allowedCountries: marketScoped ? [sourceCountryCode] : countryCodes(extension.allowedCountries ?? bonusRecord.allowedCountries),
    blockedCountries: marketScoped ? [] : countryCodes(extension.blockedCountries ?? bonusRecord.blockedCountries),
    sortOrder: integer(bonusRecord.sortOrder),
    lastVerifiedAt: date(bonusRecord.lastVerifiedAt),
  };
}

/** Maps the SQL-projected, bonus-only portion of current PUBLISHED snapshots. */
export function extractPublishedOfferCandidates(rows: PublishedOfferCorpusRow[], now = new Date()) {
  return rows.flatMap((row) => {
    const metadata = record(row.bonusMetadata);
    const global = list(row.globalBonuses).flatMap((value) => {
      const bonusId = text(record(value).id);
      return candidate(row.casinoId, value, null, record(metadata[bonusId]), now) ?? [];
    });
    const markets = list(row.marketBonusGroups).flatMap((entry) => {
      const group = record(entry);
      const sourceCountryCode = countryCode(group.countryCode);
      if (!sourceCountryCode) return [];
      return list(group.bonuses).flatMap((value) => {
        const bonusId = text(record(value).id);
        return candidate(row.casinoId, value, sourceCountryCode, record(metadata[bonusId]), now) ?? [];
      });
    });
    return [...global, ...markets];
  });
}

/** Maps the SQL whitelist projection without retaining raw snapshot objects. */
export function extractPublishedOfferCandidateRows(rows: PublishedOfferCandidateRow[], now = new Date()) {
  return rows.flatMap((row) => candidate(
    row.casinoId,
    row.bonus,
    countryCode(row.sourceCountryCode),
    record(row.bonusMetadata),
    now,
  ) ?? []);
}

export function extractOfferCandidatesFromPublishedRecords(
  published: PublishedCasinoSnapshotRecord[],
  now = new Date(),
) {
  return extractPublishedOfferCandidates(published.map((entry) => {
    const snapshot = record(entry.snapshot);
    const editor = record(record(snapshot.reviewBlocks).__sevenbetCasinoEditor);
    return {
      casinoId: entry.casinoId,
      globalBonuses: snapshot.casinoBonuses,
      marketBonusGroups: list(snapshot.countries).map((value) => {
        const market = record(value);
        return { countryCode: market.countryCode, bonuses: market.bonuses };
      }),
      bonusMetadata: editor.bonuses,
    };
  }), now);
}

export function relationForCandidate(
  candidate: PublishedOfferCandidate,
  presentationCountryCode?: string | null,
): Exclude<PublicOfferPresentationRelation, "NONE"> | null {
  const presentation = countryCode(presentationCountryCode);
  if (candidate.sourceScope === "MARKET") {
    return presentation && candidate.sourceCountryCode === presentation ? "EXACT" : "OTHER_MARKET";
  }
  if (candidate.geoMode === "ALLOW") {
    return presentation && candidate.allowedCountries.includes(presentation) ? "EXACT" : null;
  }
  if (candidate.geoMode === "BLOCK" && presentation && candidate.blockedCountries.includes(presentation)) return null;
  return "ROW";
}

export function materialOfferCompleteness(candidate: PublishedOfferCandidate) {
  const bonus = candidate.bonus;
  return Number(bonus.percentage !== null)
    + Number(bonus.minimumDeposit !== null)
    + Number(bonus.maximumBonus !== null)
    + Number(bonus.maximumBet !== null)
    + Number(Boolean(bonus.currency))
    + Number(bonus.freeSpins !== null)
    + Number(bonus.wageringMultiplier !== null || Boolean(bonus.wageringText))
    + Number(Boolean(bonus.eligibility))
    + Number(bonus.importantConditions.length > 0)
    + Number(Boolean(bonus.termsUrl));
}

function stableCandidateOrder(left: PublishedOfferCandidate, right: PublishedOfferCandidate) {
  const leftOrder = left.sortOrder ?? Number.POSITIVE_INFINITY;
  const rightOrder = right.sortOrder ?? Number.POSITIVE_INFINITY;
  return leftOrder - rightOrder
    || materialOfferCompleteness(right) - materialOfferCompleteness(left)
    || (right.lastVerifiedAt ?? "").localeCompare(left.lastVerifiedAt ?? "")
    || (left.sourceCountryCode ?? "").localeCompare(right.sourceCountryCode ?? "")
    || left.bonus.slug.localeCompare(right.bonus.slug);
}

function relationPriority(relation: Exclude<PublicOfferPresentationRelation, "NONE">) {
  return relation === "EXACT" ? 0 : relation === "ROW" ? 1 : 2;
}

function resolvedCandidate(
  candidate: PublishedOfferCandidate,
  relation: Exclude<PublicOfferPresentationRelation, "NONE">,
  presentationCountryCode: string | null,
): ResolvedPublishedOfferCandidate {
  return {
    candidate,
    relation,
    sourceCountryCode: candidate.sourceCountryCode,
    presentationCountryCode,
    currentMarketVerified: relation === "EXACT",
  };
}

export function resolvePublishedOfferCandidate(
  candidates: PublishedOfferCandidate[],
  presentationCountryCode?: string | null,
): ResolvedPublishedOfferCandidate | null {
  const presentation = countryCode(presentationCountryCode);
  const eligible = candidates.flatMap((entry) => {
    const relation = relationForCandidate(entry, presentation);
    return relation ? [{ candidate: entry, relation }] : [];
  });
  eligible.sort((left, right) => relationPriority(left.relation) - relationPriority(right.relation)
    || stableCandidateOrder(left.candidate, right.candidate));
  const selected = eligible[0];
  return selected ? resolvedCandidate(selected.candidate, selected.relation, presentation) : null;
}

export function resolvePublishedOfferInventory(
  candidates: PublishedOfferCandidate[],
  presentationCountryCode?: string | null,
): ResolvedPublishedOfferCandidate[] {
  const presentation = countryCode(presentationCountryCode);
  const exact = candidates
    .filter((entry) => relationForCandidate(entry, presentation) === "EXACT")
    .sort(stableCandidateOrder)
    .map((entry) => resolvedCandidate(entry, "EXACT", presentation));
  if (exact.length) return exact;
  const selected = resolvePublishedOfferCandidate(candidates, presentation);
  return selected ? [selected] : [];
}

export function publicOfferPresentation(
  resolved: ResolvedPublishedOfferCandidate | null,
  selectedOffer?: PublicCasinoBonus | null,
  presentationCountryCode?: string | null,
): PublicOfferPresentation {
  if (!resolved) return {
    selectedOffer: null,
    relation: "NONE",
    sourceCountryCode: null,
    presentationCountryCode: countryCode(presentationCountryCode),
    currentMarketVerified: false,
  };
  return {
    selectedOffer: selectedOffer ?? resolved.candidate.bonus,
    relation: resolved.relation,
    sourceCountryCode: resolved.sourceCountryCode,
    presentationCountryCode: resolved.presentationCountryCode,
    currentMarketVerified: resolved.currentMarketVerified,
  };
}

export function withOfferPresentation(
  casino: PublicCasinoDTO,
  candidates: PublishedOfferCandidate[],
  presentationCountryCode?: string | null,
): PublicCasinoDTO {
  const resolved = resolvePublishedOfferCandidate(candidates.filter((entry) => entry.casinoId === casino.id), presentationCountryCode);
  const existing = resolved && resolved.relation !== "OTHER_MARKET"
    ? casino.bonuses.find((bonus) => bonus.id === resolved.candidate.bonus.id) ?? null
    : null;
  return {
    ...casino,
    offerPresentation: publicOfferPresentation(resolved, existing, presentationCountryCode),
  };
}
