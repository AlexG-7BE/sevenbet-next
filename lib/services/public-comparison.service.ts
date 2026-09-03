import { mapPublishedCasino, projectPublicCasinoMarket } from "@/lib/public-casino/public-casino.mapper";
import type { PublicCasinoBonus, PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";
import type {
  PublicComparisonAction,
  PublicComparisonCandidate,
  PublicComparisonCasino,
  PublicComparisonEvidenceStatus,
  PublicComparisonGroup,
  PublicComparisonMarketState,
  PublicComparisonQuery,
  PublicComparisonReason,
  PublicComparisonResult,
  PublicComparisonValue,
} from "@/lib/public-comparison/public-comparison.types";
import { publicCasinoDiscoveryRepository } from "@/lib/repositories/public-casino-discovery.repository";
import type { DiscoveryContext, PublicCasinoDiscoveryStore } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import { resolvePublicVisitAction } from "@/lib/services/public-casino-discovery.service";
import { jurisdictionAllowsReferral, type CommercialJurisdictionAuthority } from "@/lib/jurisdiction/commercial-authority";
import type { GbOperatorEligibilityDecision } from "@/lib/jurisdiction/gb-operator-eligibility";
import { gbOperatorEligibilityService, type GbOperatorEligibilityAuthority } from "@/lib/services/gb-operator-eligibility.service";
import { isAffiliateRedirectEnabled } from "@/lib/affiliate-routing/redirect-validation";
import { currentPublicCasinoBrand } from "@/lib/public-brand";
import { isTemporaryDemoCasinoId } from "@/lib/demo-data/temporary-demo-authority";
import type { PublicCasinoInventoryMode } from "@/lib/public-casino-discovery/public-casino-discovery.types";
import { decidePublicCasinoDisposition, type PublicCasinoPresentationDisposition } from "@/lib/public-casino/presentation-disposition";

const internalRedirect = /^\/r\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
type ComparablePublicCasinoDTO = PublicCasinoDTO;
type DispositionedCasino = {
  casino: ComparablePublicCasinoDTO;
  disposition: PublicCasinoPresentationDisposition;
  action: PublicComparisonAction;
};

function marketState(casino: PublicCasinoDTO, country: string): PublicComparisonMarketState {
  const market = casino.countries.find((entry) => entry.countryCode === country);
  if (!market || market.availability === "UNKNOWN") return "UNKNOWN";
  return market.availability === "AVAILABLE" ? "AVAILABLE" : "UNAVAILABLE";
}

function marketLabel(state: PublicComparisonMarketState, country: string) {
  if (state === "AVAILABLE") return `Published available for ${country}`;
  if (state === "UNAVAILABLE") return `Published unavailable for ${country}`;
  return `${country} availability not published`;
}

function comparisonCompleteness(casino: ComparablePublicCasinoDTO) {
  const bonus = selectComparisonBonus(casino);
  return Number(Boolean(casino.summary))
    + Number(casino.editorScore !== null && casino.editorScore > 0)
    + Number(Boolean(casino.publishedAt || casino.lastReviewedAt))
    + Number(casino.licenses.length > 0)
    + Number(casino.payments.length > 0)
    + Number(Boolean(bonus))
    + Number(Boolean(bonus?.eligibility))
    + Number(Boolean(bonus?.importantConditions.length))
    + Number(casino.responsibleGamblingTools.length > 0);
}

function defaultCandidates(casinos: DispositionedCasino[], country: string) {
  return casinos
    .filter(({ casino, disposition }) => disposition === "PROMOTABLE" && marketState(casino, country) === "AVAILABLE" && comparisonCompleteness(casino) >= 7)
    .sort((a, b) => Number(b.casino.featured) - Number(a.casino.featured)
      || Number(b.casino.recommended) - Number(a.casino.recommended)
      || (b.casino.editorScore ?? -1) - (a.casino.editorScore ?? -1)
      || comparisonCompleteness(b.casino) - comparisonCompleteness(a.casino)
      || a.casino.name.localeCompare(b.casino.name, "en", { sensitivity: "base" })
      || a.casino.slug.localeCompare(b.casino.slug))
    .slice(0, 3);
}

function offerCompleteness(bonus: PublicCasinoBonus) {
  const hasText = (value: string | null) => Boolean(value?.trim());
  return Number(hasText(bonus.title))
    + Number(hasText(bonus.type))
    + Number(bonus.minimumDeposit !== null)
    + Number(bonus.wageringMultiplier !== null || hasText(bonus.wageringText))
    + Number(hasText(bonus.eligibility))
    + Number(bonus.importantConditions.length > 0);
}

function selectComparisonBonus(casino: PublicCasinoDTO) {
  return [...casino.bonuses].sort((a, b) => offerCompleteness(b) - offerCompleteness(a) || a.slug.localeCompare(b.slug))[0] ?? null;
}

function safeAction(
  casino: PublicCasinoDTO,
  country: string,
  state: PublicComparisonMarketState,
  context: DiscoveryContext,
  now: Date,
  authority?: CommercialJurisdictionAuthority | null,
  operatorEligibility?: GbOperatorEligibilityDecision | null,
  redirectEnabled = isAffiliateRedirectEnabled(),
): PublicComparisonAction {
  if (isTemporaryDemoCasinoId(casino.id)) return { available: false, href: null, label: `Visit ${casino.name}`, reason: "Fictional demonstration records never expose a commercial action." };
  if (state !== "AVAILABLE") return { available: false, href: null, label: `Visit ${casino.name}`, reason: "Declared market availability does not permit a commercial action." };
  if (!jurisdictionAllowsReferral(authority)) return { available: false, href: null, label: `Visit ${casino.name}`, reason: "Current market authority does not permit a commercial action." };
  if (!operatorEligibility?.referralEligible) return { available: false, href: null, label: `Visit ${casino.name}`, reason: "Required operator and commercial evidence is not currently complete." };
  const visit = resolvePublicVisitAction(context, casino.id, null, country, now, authority, operatorEligibility, redirectEnabled);
  const href = visit.available && visit.redirectSlug ? `/r/${visit.redirectSlug}` : null;
  if (!href || !internalRedirect.test(href)) return { available: false, href: null, label: `Visit ${casino.name}`, reason: "No governed internal action is currently available." };
  return { available: true, href, label: `Visit ${casino.name}`, reason: "Rechecked by the governed internal redirect route." };
}

function money(value: number | null, currency: string | null) {
  if (value === null) return null;
  if (!currency || !/^[A-Z]{3}$/.test(currency)) return `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(value)}${currency ? ` ${currency}` : ""}`;
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: Number.isInteger(value) ? 0 : 2 }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

function date(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}

function value(text: string | null | undefined, status: PublicComparisonEvidenceStatus, missing: PublicComparisonEvidenceStatus = "Unknown"): PublicComparisonValue {
  return text ? { text, status } : { text: missing === "Unavailable" ? "Not published" : missing, status: missing };
}

function listValue(items: string[], status: PublicComparisonEvidenceStatus, missing: PublicComparisonEvidenceStatus = "Unknown") {
  return value(items.length ? items.join(" · ") : null, status, missing);
}

function buildGroups(casinos: ComparablePublicCasinoDTO[], projected: PublicComparisonCasino[], country: string): PublicComparisonGroup[] {
  const bySlug = new Map(projected.map((casino) => [casino.slug, casino]));
  const rows = (definitions: Array<{ id: string; label: string; description: string; get: (casino: ComparablePublicCasinoDTO) => PublicComparisonValue }>) => definitions.map((definition) => ({
    id: definition.id,
    label: definition.label,
    description: definition.description,
    values: Object.fromEntries(casinos.map((casino) => [casino.slug, definition.get(casino)])),
  }));

  return [
    {
      id: "identity",
      label: "Identity and editorial context",
      rows: rows([
        { id: "editor-score", label: "Editorial score", description: "B4GAMBLE editorial assessment, not an operator rating.", get: (casino) => value(casino.editorScore === null ? null : `${casino.editorScore.toFixed(1)}/10`, "Editorial") },
        { id: "summary", label: "Review summary", description: "Summary supplied by the selected profile source.", get: (casino) => value(casino.summary, "Editorial") },
        { id: "freshness", label: "Profile date", description: "Review or snapshot date supplied by the selected source.", get: (casino) => value(date(casino.lastReviewedAt) ?? date(casino.publishedAt), "Published") },
      ]),
    },
    {
      id: "licensing-market",
      label: "Licensing and declared market context",
      rows: rows([
        { id: "licences", label: "Licence context", description: "Authority, jurisdiction and source verification state.", get: (casino) => listValue(casino.licenses.map((licence) => [licence.authority, licence.jurisdiction, licence.status, licence.lastVerifiedAt ? `checked ${date(licence.lastVerifiedAt)}` : null].filter(Boolean).join(" · ")), casino.licenses.some((licence) => licence.lastVerifiedAt) ? "Published" : "Operator-published") },
        { id: "market", label: `${country} availability`, description: "Exact published availability for the trusted request market; not a legal-eligibility guarantee.", get: (casino) => value(marketLabel(marketState(casino, country), country), "Operator-published") },
        { id: "minimum-age", label: "Minimum-age field", description: "Shown only when the profile supplies a market-specific value.", get: (casino) => { const age = casino.countries.find((entry) => entry.countryCode === country)?.minimumAge; return value(age === null || age === undefined ? null : `${age}+`, "Operator-published"); } },
        { id: "languages", label: "Languages", description: "Languages supplied by the profile source.", get: (casino) => listValue(casino.languages, "Operator-published") },
        { id: "currencies", label: "Currencies", description: "Profile and payment currencies supplied by the source.", get: (casino) => listValue([...new Set([...casino.currencies, ...casino.payments.flatMap((payment) => payment.currencies)])], "Operator-published") },
      ]),
    },
    {
      id: "offer",
      label: "Offer terms",
      rows: rows([
        { id: "offer-title", label: "Offer", description: "Offer field selected by generic completeness and stable ordering.", get: (casino) => value(selectComparisonBonus(casino)?.title, "Operator-published", "Unavailable") },
        { id: "offer-type", label: "Bonus type", description: "Offer classification supplied by the source.", get: (casino) => value(selectComparisonBonus(casino)?.type.replaceAll("_", " "), "Operator-published", "Unavailable") },
        { id: "percentage", label: "Percentage", description: "Headline percentage where supplied.", get: (casino) => { const amount = selectComparisonBonus(casino)?.percentage; return value(amount === null || amount === undefined ? null : `${amount}%`, "Operator-published"); } },
        { id: "maximum-bonus", label: "Maximum bonus", description: "Currencies can differ; compare the stated basis before drawing a conclusion.", get: (casino) => { const bonus = selectComparisonBonus(casino); return value(bonus ? money(bonus.maximumBonus, bonus.currency) : null, bonus?.currency ? "Operator-published" : "Not comparable", bonus ? "Unknown" : "Unavailable"); } },
        { id: "free-spins", label: "Free spins", description: "Stated quantity, not an assumed benefit.", get: (casino) => { const spins = selectComparisonBonus(casino)?.freeSpins; return value(spins === null || spins === undefined ? null : String(spins), "Operator-published"); } },
        { id: "minimum-deposit", label: "Minimum deposit", description: "Cash requirement stated by the source.", get: (casino) => { const bonus = selectComparisonBonus(casino); return value(bonus ? money(bonus.minimumDeposit, bonus.currency) : null, "Operator-published", bonus ? "Unknown" : "Unavailable"); } },
        { id: "wagering", label: "Wagering", description: "Missing wagering remains unknown and never becomes an advantage.", get: (casino) => { const bonus = selectComparisonBonus(casino); return value(bonus?.wageringText ?? (bonus?.wageringMultiplier === null || bonus?.wageringMultiplier === undefined ? null : `${bonus.wageringMultiplier}×`), "Operator-published", bonus ? "Unknown" : "Unavailable"); } },
        { id: "maximum-bet", label: "Maximum bet", description: "Maximum stake during wagering, where supplied.", get: (casino) => { const bonus = selectComparisonBonus(casino); return value(bonus ? money(bonus.maximumBet, bonus.currency) : null, "Operator-published", bonus ? "Unknown" : "Unavailable"); } },
        { id: "eligibility", label: "Eligibility", description: "Offer eligibility supplied by the source; not a B4GAMBLE eligibility decision.", get: (casino) => { const bonus = selectComparisonBonus(casino); return value(bonus?.eligibility, "Operator-published", bonus ? "Unknown" : "Unavailable"); } },
        { id: "conditions", label: "Important conditions", description: "Material restrictions shown before commercial action.", get: (casino) => { const bonus = selectComparisonBonus(casino); return listValue(bonus?.importantConditions ?? [], "Operator-published", bonus ? "Unknown" : "Unavailable"); } },
        { id: "expiry", label: "Expiry / current status", description: "Only offer fields marked current enter the projection.", get: (casino) => { const bonus = selectComparisonBonus(casino); return value(bonus ? date(bonus.expiresAt) ?? "Current · no fixed expiry supplied" : null, "Published", "Unavailable"); } },
      ]),
    },
    {
      id: "payments",
      label: "Payments and withdrawal evidence",
      rows: rows([
        { id: "methods", label: "Payment methods", description: "Methods supplied by the selected profile source.", get: (casino) => listValue(casino.payments.map((payment) => payment.name), "Operator-published") },
        { id: "deposit-support", label: "Deposit support", description: "Source-stated method capability, not a payment recommendation.", get: (casino) => listValue(casino.payments.filter((payment) => payment.supportsDeposits).map((payment) => payment.name), "Operator-published") },
        { id: "withdrawal-support", label: "Withdrawal support", description: "Source-stated method capability.", get: (casino) => listValue(casino.payments.filter((payment) => payment.supportsWithdrawals).map((payment) => payment.name), "Operator-published") },
        { id: "minimum-withdrawal", label: "Minimum withdrawal", description: "Values may differ by method and currency.", get: (casino) => listValue(casino.payments.filter((payment) => payment.minimumWithdrawal !== null).map((payment) => `${payment.name}: ${money(payment.minimumWithdrawal, payment.currencies[0] ?? null)}`), "Operator-published") },
        { id: "maximum-withdrawal", label: "Maximum withdrawal", description: "Values may differ by method and period.", get: (casino) => listValue(casino.payments.filter((payment) => payment.maximumWithdrawal !== null).map((payment) => `${payment.name}: ${money(payment.maximumWithdrawal, payment.currencies[0] ?? null)}`), "Operator-published") },
        { id: "withdrawal-time", label: "Withdrawal-time signal", description: "Stated timing is a signal, never a guarantee.", get: (casino) => listValue(casino.payments.filter((payment) => payment.withdrawalTime).map((payment) => `${payment.name}: ${payment.withdrawalTime}`), "Operator-published") },
        { id: "fees", label: "Fees", description: "Only source-supplied fee wording is shown.", get: (casino) => listValue(casino.payments.filter((payment) => payment.fees).map((payment) => `${payment.name}: ${payment.fees}`), "Operator-published") },
        { id: "crypto", label: "Crypto indication", description: "Whether any supplied payment method is marked as crypto.", get: (casino) => value(casino.payments.length ? (casino.payments.some((payment) => payment.crypto) ? "Crypto method indicated" : "No crypto method indicated") : null, "Operator-published") },
      ]),
    },
    {
      id: "safety-commercial",
      label: "Safety, review and commercial boundary",
      rows: rows([
        { id: "control-tools", label: "Responsible-gambling tools", description: "Verify current availability before relying on a real operator tool.", get: (casino) => listValue(casino.responsibleGamblingTools, "Operator-published") },
        { id: "review", label: "Full review", description: "Editorial review access remains independent of referral status.", get: (casino) => value(bySlug.get(casino.slug)?.reviewHref ? "Review profile available" : null, "Published", "Unavailable") },
        { id: "commercial", label: "Commercial action", description: "Available only through the governed internal redirect contract.", get: (casino) => { const action = bySlug.get(casino.slug)?.action; return value(action?.available ? "Governed action available" : action?.reason, action?.available ? "Policy-gated" : "Unavailable", "Unavailable"); } },
      ]),
    },
  ];
}

function filterDifferences(groups: PublicComparisonGroup[], slugs: string[]) {
  let hidden = 0;
  const filtered = groups.map((group) => ({
    ...group,
    rows: group.rows.filter((row) => {
      const cells = slugs.map((slug) => row.values[slug]);
      const same = cells.length > 1 && cells.every((cell) => cell?.text === cells[0]?.text && cell?.status === cells[0]?.status);
      if (same) hidden += 1;
      return !same;
    }),
  })).filter((group) => group.rows.length);
  return { groups: filtered, hidden };
}

export class PublicComparisonService {
  constructor(
    private readonly store: PublicCasinoDiscoveryStore = publicCasinoDiscoveryRepository,
    private readonly now = () => new Date(),
    private readonly operatorEligibility: GbOperatorEligibilityAuthority = gbOperatorEligibilityService,
    private readonly redirectEnabled = isAffiliateRedirectEnabled,
  ) {}

  async compare(query: PublicComparisonQuery, authority?: CommercialJurisdictionAuthority | null): Promise<PublicComparisonResult> {
    let published: Awaited<ReturnType<PublicCasinoDiscoveryStore["listPublished"]>>;
    let context: DiscoveryContext;
    const redirectEnabled = this.redirectEnabled();
    const commercialProjection = Boolean(
      redirectEnabled
      && jurisdictionAllowsReferral(authority)
      && authority?.countryCode === query.country,
    );
    try {
      published = (await this.store.listPublished(query.country)).filter((record) => !isTemporaryDemoCasinoId(record.casinoId));
      context = await this.store.loadContext(published.map((record) => record.casinoId), { includeAliases: false, includeCommercial: commercialProjection });
    } catch {
      return { status: "projection-unavailable", query, selectedSlugs: query.casinos, candidates: [], casinos: [], reasons: query.casinos.map((slug) => ({ slug, code: "PROJECTION_UNAVAILABLE", message: "The governed comparison projection is temporarily unavailable." })), groups: [], hiddenEqualRows: 0, defaulted: false, inventoryMode: "UNAVAILABLE" };
    }

    const now = this.now();
    const globalCasinos: ComparablePublicCasinoDTO[] = published.flatMap((record) => {
      const mapped = mapPublishedCasino(record, [], { redirectEnabled: false, now });
      const casino = mapped ? currentPublicCasinoBrand(mapped) : null;
      return casino?.source === "cms" && !isTemporaryDemoCasinoId(casino.id) ? [casino] : [];
    });
    const inventoryMode: PublicCasinoInventoryMode = "PUBLISHED_ONLY";
    const operatorDecisions = commercialProjection
      ? await this.operatorEligibility.evaluateMany(globalCasinos.map((casino) => casino.id), now)
      : new Map<string, GbOperatorEligibilityDecision>();
    const all: DispositionedCasino[] = globalCasinos.flatMap((globalCasino): DispositionedCasino[] => {
      const exactProfile = globalCasino.marketProfiles.find((profile) => profile.countryCode === query.country) ?? null;
      const casino = projectPublicCasinoMarket(globalCasino, query.country);
      const state = marketState(casino, query.country);
      const action = exactProfile?.availability === "AVAILABLE" && commercialProjection
        ? safeAction(casino, query.country, state, context, now, authority, operatorDecisions.get(casino.id), redirectEnabled)
        : { available: false, href: null, label: `Visit ${casino.name}`, reason: "No governed action is available for the exact trusted market." } satisfies PublicComparisonAction;
      const decision = decidePublicCasinoDisposition({
        casinoId: casino.id,
        requestCountryCode: query.country,
        marketProfile: exactProfile,
        governedVisitAvailable: action.available,
      });
      if (decision.disposition === "HIDDEN") return [];
      const boundedCasino = decision.disposition === "PROMOTABLE"
        ? casino
        : {
            ...casino,
            featured: false,
            recommended: false,
            bonuses: [],
            affiliate: { href: null, available: false },
            media: { ...casino.media, hero: null },
          };
      return [{ casino: boundedCasino, disposition: decision.disposition, action: decision.disposition === "PROMOTABLE" ? action : { ...action, available: false, href: null } }];
    });
    const candidates: PublicComparisonCandidate[] = all.map(({ casino, disposition }): PublicComparisonCandidate => {
      const state = marketState(casino, query.country);
      return { dataClassification: "PUBLISHED_RECORD", disposition, slug: casino.slug, name: casino.name, logo: casino.media.logo, editorScore: casino.editorScore, marketState: state, marketLabel: marketLabel(state, query.country) };
    }).sort((a, b) => (b.editorScore ?? -1) - (a.editorScore ?? -1) || a.name.localeCompare(b.name, "en", { sensitivity: "base" }) || a.slug.localeCompare(b.slug));

    const selected = query.selectionMode === "default" ? defaultCandidates(all, query.country) : query.casinos.flatMap((slug) => {
      const entry = all.find(({ casino }) => casino.slug === slug);
      return entry ? [entry] : [];
    });
    const selectedSlugs = query.selectionMode === "default" ? selected.map(({ casino }) => casino.slug) : query.casinos;
    const reasons: PublicComparisonReason[] = [];
    if (query.selectionMode === "explicit") for (const slug of query.casinos) {
      const entry = all.find(({ casino }) => casino.slug === slug);
      if (!entry) reasons.push({ slug, code: "UNKNOWN_OR_UNPUBLISHED", message: `${slug} is unknown, archived, hidden or absent from the exact-market public projection.` });
    }

    const comparable = selected.map(({ casino }) => casino);
    const projected = selected.map(({ casino, disposition, action }): PublicComparisonCasino => {
      const state = marketState(casino, query.country);
      return {
        id: casino.id,
        dataClassification: "PUBLISHED_RECORD",
        disposition,
        slug: casino.slug,
        name: casino.name,
        summary: casino.summary,
        logo: casino.media.logo,
        editorScore: casino.editorScore,
        publishedAt: casino.publishedAt,
        lastReviewedAt: casino.lastReviewedAt,
        reviewHref: `/casino/${casino.slug}`,
        marketState: state,
        action,
      };
    });
    const rawGroups = comparable.length >= 2 ? buildGroups(comparable, projected, query.country) : [];
    const differenceResult = query.differences ? filterDifferences(rawGroups, comparable.map((casino) => casino.slug)) : { groups: rawGroups, hidden: 0 };
    const status = query.selectionMode === "empty" || (query.selectionMode === "explicit" && !selectedSlugs.length)
      ? "empty"
      : comparable.length === 1 && reasons.length === 0
        ? "one-selected"
        : comparable.length >= 2
          ? "available"
          : "no-comparable";

    return {
      status,
      query,
      selectedSlugs,
      candidates,
      casinos: projected,
      reasons,
      groups: differenceResult.groups,
      hiddenEqualRows: differenceResult.hidden,
      defaulted: query.selectionMode === "default",
      inventoryMode,
    };
  }
}

export const publicComparisonService = new PublicComparisonService();
