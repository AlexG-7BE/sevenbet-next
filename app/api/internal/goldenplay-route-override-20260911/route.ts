import { readFile } from "node:fs/promises";
import path from "node:path";

import { EditorialStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { parseCasinoIngestionBundle } from "@/lib/casino-ingestion/contract";
import { deterministicCasinoIngestionId, ingestCasinoBundle } from "@/lib/casino-ingestion/importer";
import prisma from "@/lib/db/prisma";
import { casinoService } from "@/lib/services/casino.service";

export const dynamic = "force-dynamic";

const CASINO_ID = "d9fcfd4c-bc96-4ed5-b9ea-192c6bf2f712";
const RELEASE = "GOLDENPLAY-FULL-PROFILE-2026-09-11";
const BUNDLE_PATH = "data/casino-ingestion/goldenplay-ie.v1.json";
const REVIEWED_AT = new Date("2026-09-11T00:00:00.000Z");
const SUPPORTED_GEOS = ["AT", "BE", "BR", "CH", "CL", "CZ", "DE", "DK", "FI", "FR", "GB", "HR", "IE", "IT", "LV", "NO", "NZ", "PL", "PT", "SE", "SI", "ZA"];
const PROMOTIONAL_GEOS = ["AT", "BE", "BR", "CH", "CZ", "DK", "FR", "HR", "IE", "NO", "PL", "PT", "SE", "SI", "ZA"];

function id(kind: string, key: string) {
  return deterministicCasinoIngestionId(`goldenplay:global:${kind}:${key}`);
}

function payment(input: {
  key: string;
  name: string;
  deposits: boolean;
  withdrawals: boolean;
  minDeposit?: string | null;
  maxDeposit?: string | null;
  minWithdrawal?: string | null;
  withdrawalTime?: string | null;
  depositTime?: string | null;
  type: string;
  crypto?: boolean;
  notes: string;
  sortOrder: number;
}) {
  return {
    id: id("payment", input.key),
    methodKey: input.key,
    name: input.name,
    supportsDeposits: input.deposits,
    supportsWithdrawals: input.withdrawals,
    currencies: ["EUR"],
    minimumDeposit: input.minDeposit ?? null,
    minimumWithdrawal: input.minWithdrawal ?? null,
    maximumWithdrawal: null,
    maximumDeposit: input.maxDeposit ?? null,
    depositProcessingTime: input.depositTime ?? (input.deposits ? "Instant / method-dependent" : null),
    withdrawalTime: input.withdrawalTime ?? null,
    fees: "No GoldenPlay fee reported; payment-provider fees may vary",
    depositFee: null,
    withdrawalFee: null,
    type: input.type,
    countries: [],
    verified: true,
    notes: input.notes,
    archived: false,
    crypto: input.crypto ?? false,
    sortOrder: input.sortOrder,
  };
}

function provider(key: string, name: string, sortOrder: number, options?: { live?: boolean; featured?: boolean }) {
  return {
    id: id("provider", key),
    providerKey: key,
    name,
    websiteUrl: null,
    gameCount: null,
    liveCasino: options?.live ?? false,
    featured: options?.featured ?? sortOrder < 5,
    verified: true,
    archived: false,
    verifiedAt: REVIEWED_AT.toISOString(),
    sortOrder,
  };
}

function category(key: string, name: string, sortOrder: number, featured: boolean) {
  return {
    id: id("category", key),
    categoryKey: key,
    name,
    gameCount: null,
    featured,
    icon: null,
    archived: false,
    sortOrder,
  };
}

function promo(input: {
  key: string;
  title: string;
  summary: string;
  type: string;
  sortOrder: number;
  percentage?: string | null;
  minimumDeposit?: string | null;
  maximumBonus?: string | null;
  freeSpins?: number | null;
  wageringMultiplier?: string | null;
  wageringText?: string | null;
  shortTerms?: string | null;
  amount?: string | null;
  maximumBet?: string | null;
  promoCode?: string | null;
  eligibility?: string | null;
  conditions?: string[];
  featured?: boolean;
  newPlayersOnly?: boolean;
  notes: string;
}) {
  return {
    id: id("bonus", input.key),
    slug: `goldenplay-${input.key}`,
    internalName: `GoldenPlay ${input.title}`,
    title: input.title,
    summary: input.summary,
    shortTerms: input.shortTerms ?? null,
    amount: input.amount ?? null,
    type: input.type,
    percentage: input.percentage ?? null,
    minimumDeposit: input.minimumDeposit ?? null,
    maximumBonus: input.maximumBonus ?? null,
    currency: "EUR",
    freeSpins: input.freeSpins ?? null,
    wageringMultiplier: input.wageringMultiplier ?? null,
    wageringBase: "BONUS",
    minimumOdds: null,
    maximumBet: input.maximumBet ?? null,
    wageringText: input.wageringText ?? null,
    eligibility: input.eligibility ?? "Eligible players in supported markets; current promotion terms and local restrictions apply.",
    eligibleGames: input.key === "welcome" ? ["Book of Dead"] : [],
    excludedGames: [],
    eligiblePaymentMethods: [],
    excludedPaymentMethods: [],
    newPlayersOnly: input.newPlayersOnly ?? false,
    existingPlayersAllowed: !(input.newPlayersOnly ?? false),
    promoCode: input.promoCode ?? null,
    importantConditions: input.conditions ?? [],
    termsUrl: null,
    startsAt: null,
    expiresAt: null,
    evergreen: false,
    featured: input.featured ?? false,
    exclusive: false,
    notes: input.notes,
    geoMode: "ALLOW" as const,
    allowedCountries: PROMOTIONAL_GEOS,
    blockedCountries: [],
    status: EditorialStatus.DRAFT,
    offerStatus: "DRAFT",
    sortOrder: input.sortOrder,
  };
}

export async function GET() {
  const actor = await prisma.adminUser.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN", "EDITOR"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (!actor) return NextResponse.json({ status: "NO_GOVERNED_ACTOR" }, { status: 500 });

  let casino = await casinoService.getCasinoById(CASINO_ID);
  if (casino.status !== EditorialStatus.DRAFT) {
    casino = await casinoService.transitionWorkflow(casino.id, EditorialStatus.DRAFT, actor.id, casino.updatedAt);
  }

  const bundle = parseCasinoIngestionBundle(JSON.parse(await readFile(path.join(process.cwd(), BUNDLE_PATH), "utf8")));
  const ingestion = await ingestCasinoBundle(prisma, bundle);

  const builder = await casinoService.getBuilderData(CASINO_ID);
  const current = builder.casino;

  const paymentMethods = [
    payment({ key: "visa", name: "Visa", deposits: true, withdrawals: true, minDeposit: "10", maxDeposit: "5000", minWithdrawal: "10", withdrawalTime: "Up to 10 business days in current cash-out guidance", type: "CARD", sortOrder: 0, notes: "Current EUR cashier research lists Visa for deposits and withdrawals; limits and processing vary by market/account." }),
    payment({ key: "mastercard", name: "Mastercard", deposits: true, withdrawals: true, minDeposit: "10", maxDeposit: "5000", minWithdrawal: "10", withdrawalTime: "Up to 10 business days in current cash-out guidance", type: "CARD", sortOrder: 1, notes: "Current EUR cashier research lists Mastercard for deposits and withdrawals; limits and processing vary by market/account." }),
    payment({ key: "apple-pay", name: "Apple Pay", deposits: true, withdrawals: false, minDeposit: "10", maxDeposit: "5000", type: "E_WALLET", sortOrder: 2, notes: "Listed as a current GoldenPlay deposit method. Withdrawal support was not established in the current cashier evidence." }),
    payment({ key: "google-pay", name: "Google Pay", deposits: true, withdrawals: false, minDeposit: "10", maxDeposit: "5000", type: "E_WALLET", sortOrder: 3, notes: "Listed as a current GoldenPlay deposit method. Withdrawal support was not established in the current cashier evidence." }),
    payment({ key: "skrill", name: "Skrill", deposits: true, withdrawals: true, minDeposit: "20", maxDeposit: "5000", minWithdrawal: "10", withdrawalTime: "Up to 4 business days in current cash-out guidance", type: "E_WALLET", sortOrder: 4, notes: "Current cashier evidence shows multiple Skrill routes with different deposit bands; exact route/limit is account-dependent." }),
    payment({ key: "neteller", name: "Neteller", deposits: true, withdrawals: true, minDeposit: "20", maxDeposit: "5000", minWithdrawal: "10", withdrawalTime: "Up to 4 business days in current cash-out guidance", type: "E_WALLET", sortOrder: 5, notes: "Current cashier evidence shows multiple Neteller routes with different deposit bands; exact route/limit is account-dependent." }),
    payment({ key: "cashlib", name: "Cashlib", deposits: true, withdrawals: false, minDeposit: "10", maxDeposit: "5000", type: "PREPAID", sortOrder: 6, notes: "Current EUR cashier evidence lists Cashlib as a deposit method." }),
    payment({ key: "mifinity", name: "MiFinity", deposits: true, withdrawals: false, minDeposit: "10", maxDeposit: "5000", type: "E_WALLET", sortOrder: 7, notes: "Current EUR cashier evidence lists MiFinity as a deposit method." }),
    payment({ key: "revolut", name: "Revolut", deposits: true, withdrawals: false, minDeposit: "10", maxDeposit: "5000", type: "E_WALLET", sortOrder: 8, notes: "Current GoldenPlay Ireland/EUR research lists Revolut as a deposit method." }),
    payment({ key: "instant-banking", name: "Instant Banking", deposits: true, withdrawals: false, minDeposit: "10", maxDeposit: "1000", type: "BANK_TRANSFER", sortOrder: 9, notes: "Current EUR cashier evidence lists Instant Banking as a deposit method." }),
    payment({ key: "flexepin", name: "Flexepin", deposits: true, withdrawals: false, minDeposit: "10", maxDeposit: "250", type: "PREPAID", sortOrder: 10, notes: "Current EUR cashier evidence lists Flexepin as a deposit method." }),
    payment({ key: "wire-transfer", name: "Wire Transfer", deposits: false, withdrawals: true, minWithdrawal: "50", withdrawalTime: "Up to 10 business days in current cash-out guidance", type: "BANK_TRANSFER", sortOrder: 11, notes: "Current GoldenPlay cash-out guidance lists wire transfer for withdrawals." }),
    payment({ key: "bitcoin", name: "Bitcoin (BTC)", deposits: true, withdrawals: true, type: "CRYPTO", crypto: true, sortOrder: 12, notes: "NetoPartners current GoldenPlay crypto material and partner-supplied Ireland data identify BTC support; availability varies by GEO." }),
    payment({ key: "ethereum", name: "Ethereum (ETH)", deposits: true, withdrawals: true, type: "CRYPTO", crypto: true, sortOrder: 13, notes: "NetoPartners current GoldenPlay crypto material and partner-supplied Ireland data identify ETH support; availability varies by GEO." }),
    payment({ key: "usdt", name: "Tether (USDT)", deposits: true, withdrawals: true, type: "CRYPTO", crypto: true, sortOrder: 14, notes: "NetoPartners current GoldenPlay crypto material and partner-supplied Ireland data identify USDT support; network availability varies by GEO/account." }),
    payment({ key: "usdc", name: "USD Coin (USDC)", deposits: true, withdrawals: true, type: "CRYPTO", crypto: true, sortOrder: 15, notes: "NetoPartners current GoldenPlay crypto material and partner-supplied Ireland data identify USDC support; network availability varies by GEO/account." }),
  ];

  const gameProviders = [
    provider("pragmatic-play", "Pragmatic Play", 0, { featured: true }),
    provider("netent", "NetEnt", 1, { featured: true }),
    provider("evolution-gaming", "Evolution Gaming", 2, { live: true, featured: true }),
    provider("play-n-go", "Play'n GO", 3, { featured: true }),
    provider("spinoro", "Spinoro", 4, { featured: true }),
    provider("inout-games", "InOut Games", 5),
    provider("games-global", "Games Global", 6),
    provider("wazdan", "Wazdan", 7),
  ];

  const gameCategories = [
    category("slots", "Slots", 0, true),
    category("live-casino", "Live Casino", 1, true),
    category("table-games", "Table Games", 2, true),
    category("instant-win", "Instant Win", 3, true),
    category("scratchcards", "Scratchcards", 4, false),
    category("crash-arcade", "Crash & Arcade", 5, false),
  ];

  const casinoBonuses = [
    promo({
      key: "welcome",
      title: "100% up to €555 + 100 Free Spins",
      summary: "GoldenPlay's current casino welcome package matches the first deposit 100% up to €555 and adds 100 free spins on Book of Dead.",
      type: "WELCOME",
      sortOrder: 0,
      percentage: "100",
      minimumDeposit: "10",
      maximumBonus: "555",
      freeSpins: 100,
      wageringMultiplier: "35",
      wageringText: "35× bonus wagering; current secondary terms evidence reports 40× wagering on free-spin winnings.",
      shortTerms: "Min €10 · 35× bonus wagering · 100 FS on Book of Dead",
      amount: "555",
      maximumBet: "2",
      promoCode: "GOLDEN100",
      newPlayersOnly: true,
      featured: true,
      conditions: [
        "100 free spins are on Book of Dead (Play'n GO)",
        "Current September 2026 promotion capture reports promo code GOLDEN100",
        "Current September 2026 promotion capture reports 35× bonus wagering",
        "Current secondary terms evidence reports 40× wagering on free-spin winnings",
        "Current secondary terms evidence reports a €2 maximum bonus bet",
        "Bonus availability and exact mechanics remain market-specific",
      ],
      notes: "Headline, €555 cap, 100 free spins and €10 minimum deposit are confirmed by current NetoPartners first-party material. Code/wagering/max-bet detail comes from current September 2026 promotion captures and should be rechecked when market-specific terms are available.",
    }),
    promo({
      key: "sports-welcome",
      title: "Sports welcome: 100% up to €150",
      summary: "GoldenPlay also runs a separate sportsbook welcome offer matching 100% up to €150.",
      type: "OTHER",
      sortOrder: 1,
      percentage: "100",
      minimumDeposit: "10",
      maximumBonus: "150",
      wageringMultiplier: "7",
      wageringText: "Current secondary sports terms evidence reports 7× wagering on deposit plus bonus.",
      shortTerms: "100% up to €150 · sportsbook offer",
      amount: "150",
      promoCode: "GOLDEN150",
      newPlayersOnly: true,
      conditions: ["Separate from the casino welcome package", "Current secondary terms evidence reports promo code GOLDEN150 and 7× wagering"],
      notes: "€150 sportsbook headline is confirmed by NetoPartners first-party material; code and wagering detail is secondary current evidence.",
    }),
    promo({ key: "spinomania", title: "Spinomania", summary: "Recurring GoldenPlay promotion described as a daily free-spins boost.", type: "FREE_SPINS", sortOrder: 2, shortTerms: "Daily free-spins promotion; current mechanics vary", notes: "Named by current NetoPartners/GoldenPlay promotional material; exact current amount, eligible games and expiry are not fixed in the public partner description." }),
    promo({ key: "big-draw", title: "The Big Draw", summary: "Recurring GoldenPlay draw promotion; current company-profile material describes deposit-linked entries and a recurring cash prize.", type: "OTHER", sortOrder: 3, shortTerms: "Recurring draw promotion", notes: "NetoPartners confirms The Big Draw as a recurring GoldenPlay promotion. Exact live terms should be read from the promotion page before external campaign copy." }),
    promo({ key: "double-deposit", title: "Double Deposit", summary: "Recurring GoldenPlay deposit promotion used for player retention.", type: "RELOAD", sortOrder: 4, shortTerms: "Recurring deposit promotion", notes: "Named by NetoPartners first-party GoldenPlay material; exact match amount and wagering are not stated in the public partner description." }),
    promo({ key: "drops-and-wins", title: "Drops & Wins", summary: "Pragmatic Play network campaign available within GoldenPlay's recurring promotion calendar.", type: "OTHER", sortOrder: 5, shortTerms: "Pragmatic Play provider campaign", notes: "Confirmed by NetoPartners GoldenPlay review; exact campaign window and prize mechanics are provider/market dependent." }),
    promo({ key: "cash-crash", title: "Cash Crash", summary: "Games Global provider campaign included in GoldenPlay's recurring promotion calendar.", type: "OTHER", sortOrder: 6, shortTerms: "Games Global provider campaign", notes: "Confirmed by NetoPartners GoldenPlay review; exact live mechanics are campaign-specific." }),
    promo({ key: "mystery-drop", title: "Mystery Drop", summary: "Wazdan provider campaign included in GoldenPlay's recurring promotion calendar.", type: "OTHER", sortOrder: 7, shortTerms: "Wazdan provider campaign", notes: "Confirmed by NetoPartners GoldenPlay review; exact live mechanics are campaign-specific." }),
    promo({ key: "reload-rewards", title: "Reload Bonuses & Free Spins", summary: "GoldenPlay uses ongoing reload bonuses, free spins and loyalty rewards after the welcome period.", type: "RELOAD", sortOrder: 8, shortTerms: "Ongoing retention rewards", notes: "NetoPartners confirms recurring reload/free-spin/loyalty rewards but does not publish one permanent set of mechanics." }),
    promo({ key: "seasonal-tournaments", title: "Seasonal Tournaments & Thematic Offers", summary: "GoldenPlay runs seasonal tournaments and thematic promotional offers as part of its recurring calendar.", type: "OTHER", sortOrder: 9, shortTerms: "Seasonal promotion calendar", notes: "Confirmed by NetoPartners first-party GoldenPlay review; exact dates and mechanics change by campaign." }),
  ];

  const next = {
    slug: current.slug,
    internalName: "GoldenPlay",
    title: "GoldenPlay",
    domain: "goldenplaywin.com",
    websiteUrl: "https://goldenplaywin.com/",
    operator: "Orgona LLC",
    tagline: "Casino + sportsbook with 950+ games and a €555 + 100 FS welcome offer",
    summary: "GoldenPlay is a 2025 casino and sportsbook brand in the NetoPartners / Anakatech portfolio. Current partner material lists 950+ games, desktop and mobile play, seven product languages, EUR accounts, leading casino providers, crypto support and a casino welcome offer of 100% up to €555 plus 100 free spins on Book of Dead.",
    description: "GoldenPlay combines casino and sportsbook under one brand. The casino catalogue covers slots, live casino, table games, instant-win, scratchcard and crash/arcade content. NetoPartners names Pragmatic Play, NetEnt, Evolution Gaming, Play'n GO and Spinoro as core suppliers, while later 2026 partner updates confirm InOut Games content and recurring provider campaigns involving Games Global and Wazdan. Payment evidence includes cards, major e-wallets, bank/voucher rails and BTC/ETH/USDT/USDC, with exact cashier availability depending on the player's GEO and account. Current support information lists live chat, a contact form and email support. GoldenPlay is associated with Orgona LLC and a current Tobique Gaming Commission B2C holder record expiring 25 July 2027. Responsible-gambling documentation is less complete than the product/payment evidence, so B4GAMBLE keeps disputed tool claims out of the canonical tool list until they are consistently evidenced.",
    foundedYear: 2025,
    language: "en",
    languages: ["en", "fr", "it", "de", "nl", "pl", "pt"],
    currencies: ["EUR"],
    editorScore: null,
    generalMetadata: {
      ...current.generalMetadata,
      featured: false,
      recommended: false,
      supportsMobile: true,
      internalNotes: `${RELEASE}: full CMS draft population. 950+ games, product languages, headline welcome offers, core providers and recurring promotions are from current NetoPartners first-party material. Detailed cashier/bonus mechanics use current September 2026 market/tested evidence and remain explicitly caveated where GEO-specific. No Founder-approved editor score assigned.`,
    },
    licenses: current.licenses,
    countries: current.countries,
    paymentMethods,
    gameProviders,
    gameCategories,
    casinoBonuses,
    seo: current.seo ? { ...current.seo, canonicalUrl: "https://b4gamble.com/casino/goldenplay" } : null,
  };

  await casinoService.saveCoreDraft(CASINO_ID, next, actor.id, new Date(current.updatedAt));

  await prisma.casino.update({
    where: { id: CASINO_ID },
    data: {
      license: "Tobique Gaming Commission B2C — Orgona LLC — current holder record expires 25 July 2027",
      domainLifecycleStatus: "ACTIVE",
      domainPublicationStatus: "DRAFT",
      responsibleGamblingMetadata: {
        status: "PARTIAL_CONTRADICTORY_PUBLIC_EVIDENCE",
        source: RELEASE,
        userAgreementResponsibleGamblingSectionReported: true,
        selfServiceToolSetPrimaryVerified: false,
        supportChannels: ["Live chat", "Contact form", "support@goldenphelp.com"],
        note: "Current sources disagree on whether deposit/loss/session limits are self-service. Do not present a definitive tool set until direct primary documentation is available.",
      },
      updatedBy: actor.id,
    },
  });

  await prisma.casinoSeo.upsert({
    where: { casinoId: CASINO_ID },
    create: {
      casinoId: CASINO_ID,
      title: "GoldenPlay Casino Review, Bonus & Payments | B4GAMBLE",
      description: "GoldenPlay review: €555 + 100 FS welcome bonus, 950+ games, providers, payments, crypto, licence, mobile support and recurring promotions.",
      canonicalUrl: "https://b4gamble.com/casino/goldenplay",
      robots: "noindex,follow",
      socialTitle: "GoldenPlay Casino Review | B4GAMBLE",
      socialDescription: "GoldenPlay casino and sportsbook profile with current bonus, game, payment, provider and licence information.",
    },
    update: {
      title: "GoldenPlay Casino Review, Bonus & Payments | B4GAMBLE",
      description: "GoldenPlay review: €555 + 100 FS welcome bonus, 950+ games, providers, payments, crypto, licence, mobile support and recurring promotions.",
      canonicalUrl: "https://b4gamble.com/casino/goldenplay",
      robots: "noindex,follow",
      socialTitle: "GoldenPlay Casino Review | B4GAMBLE",
      socialDescription: "GoldenPlay casino and sportsbook profile with current bonus, game, payment, provider and licence information.",
    },
  });

  const welcomeBonusId = id("bonus", "welcome");
  await prisma.casinoAffiliateLink.upsert({
    where: { slug: "goldenplay-welcome-offer" },
    create: {
      casinoId: CASINO_ID,
      casinoBonusId: welcomeBonusId,
      slug: "goldenplay-welcome-offer",
      title: "Claim GoldenPlay welcome offer",
      type: "OFFER",
      destinationUrl: "https://b4gamble.com/r/goldenplay-casino",
      campaign: "goldenplay-welcome",
      priority: 100,
      status: EditorialStatus.DRAFT,
      lastVerifiedAt: REVIEWED_AT,
      createdBy: actor.id,
      updatedBy: actor.id,
    },
    update: {
      casinoId: CASINO_ID,
      casinoBonusId: welcomeBonusId,
      title: "Claim GoldenPlay welcome offer",
      type: "OFFER",
      destinationUrl: "https://b4gamble.com/r/goldenplay-casino",
      campaign: "goldenplay-welcome",
      priority: 100,
      status: EditorialStatus.DRAFT,
      lastVerifiedAt: REVIEWED_AT,
      updatedBy: actor.id,
    },
  });

  await prisma.casinoAffiliateLink.upsert({
    where: { slug: "goldenplay-casino" },
    create: {
      casinoId: CASINO_ID,
      casinoBonusId: null,
      slug: "goldenplay-casino",
      title: "Visit GoldenPlay",
      type: "OFFER",
      destinationUrl: "https://b4gamble.com/r/goldenplay-casino",
      campaign: "goldenplay-casino",
      priority: 90,
      status: EditorialStatus.DRAFT,
      lastVerifiedAt: REVIEWED_AT,
      createdBy: actor.id,
      updatedBy: actor.id,
    },
    update: {
      casinoId: CASINO_ID,
      casinoBonusId: null,
      title: "Visit GoldenPlay",
      type: "OFFER",
      destinationUrl: "https://b4gamble.com/r/goldenplay-casino",
      campaign: "goldenplay-casino",
      priority: 90,
      status: EditorialStatus.DRAFT,
      lastVerifiedAt: REVIEWED_AT,
      updatedBy: actor.id,
    },
  });

  const populated = await casinoService.getBuilderData(CASINO_ID);
  return NextResponse.json({
    status: "FULL_DRAFT_POPULATED",
    casinoId: populated.casino.id,
    slug: populated.casino.slug,
    workflowStatus: populated.casino.status,
    supportedGeoCount: SUPPORTED_GEOS.length,
    countries: populated.casino.countries.length,
    licenses: populated.casino.licenses.length,
    payments: populated.casino.paymentMethods.length,
    providers: populated.casino.gameProviders.length,
    categories: populated.casino.gameCategories.length,
    bonuses: populated.casino.casinoBonuses.length,
    affiliateLinks: populated.casino.casinoLinks.length + populated.casino.casinoBonuses.reduce((count, bonus) => count + bonus.affiliateLinks.length, 0),
    validation: populated.validation,
    ingestion: ingestion.reconciliation,
  });
}
