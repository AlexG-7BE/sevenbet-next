import { readFile } from "node:fs/promises";
import path from "node:path";

import { EditorialStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { readCasinoEditorMetadata, writeCasinoEditorMetadata } from "@/lib/casino-builder/editor-metadata";
import { parseCasinoIngestionBundle } from "@/lib/casino-ingestion/contract";
import { ingestCasinoBundle } from "@/lib/casino-ingestion/importer";
import prisma from "@/lib/db/prisma";
import { casinoService } from "@/lib/services/casino.service";

export const dynamic = "force-dynamic";

const CASINO_ID = "d9fcfd4c-bc96-4ed5-b9ea-192c6bf2f712";
const RELEASE = "GOLDENPLAY-DRAFT-DATA-2026-09-11";
const BUNDLE_PATH = "data/casino-ingestion/goldenplay-ie.v1.json";

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

  const existingMetadata = readCasinoEditorMetadata(casino.reviewBlocks);
  if (existingMetadata.general.internalNotes?.includes(RELEASE)) {
    return NextResponse.json({
      status: "ALREADY_POPULATED",
      casinoId: casino.id,
      slug: casino.slug,
      workflowStatus: casino.status,
    });
  }

  const bundle = parseCasinoIngestionBundle(JSON.parse(
    await readFile(path.join(process.cwd(), BUNDLE_PATH), "utf8"),
  ));
  const ingestion = await ingestCasinoBundle(prisma, bundle);

  casino = await casinoService.getCasinoById(CASINO_ID);
  const metadata = readCasinoEditorMetadata(casino.reviewBlocks);
  metadata.general = {
    ...metadata.general,
    featured: false,
    recommended: false,
    internalNotes: `${RELEASE}: populated from existing Founder Office GoldenPlay/NetoPartners evidence. No score assigned. Exact RG tools and legal document URLs remain intentionally unset where not primary-verified.`,
  };

  casino = await casinoService.updateCasino(casino.id, {
    internalName: "GoldenPlay",
    title: "GoldenPlay",
    domain: "goldenplaywin.com",
    websiteUrl: "https://goldenplaywin.com/",
    operator: "Orgona LLC",
    tagline: "Casino and sportsbook with 950+ games, live casino and crypto support.",
    summary: "GoldenPlay is a 2025 casino and sportsbook brand in the NetoPartners portfolio, offering 950+ games, live casino, major game providers and crypto support. Market availability and legal eligibility remain GEO-specific.",
    description: "GoldenPlay combines casino and sportsbook products with slots, table games, live casino and instant-win content. Current partner information documents 950+ games, major providers including Pragmatic Play, NetEnt, Evolution Gaming, Play'n GO and Spinoro, EUR account support, crypto payments and a casino welcome offer of 100% up to €555 plus 100 free spins on Book of Dead with a €10 minimum deposit. Exact payment availability, promotional terms and legal eligibility remain market-specific.",
    foundedYear: 2025,
    language: "en",
    languages: ["en", "fr", "it", "de", "nl", "pl", "pt"],
    currencies: ["EUR"],
    editorScore: null,
    pros: [
      "Casino and sportsbook in one product",
      "950+ games with established providers and live casino",
      "Crypto support and mobile-web access",
      "Seven supported product languages identified in current partner material",
    ],
    cons: [
      "Launched in 2025, so operating history is short",
      "Payment availability and exact promotional terms vary by market",
      "Tobique B2C licensing is not equivalent to a local licence in every target market",
      "Exact responsible-gambling tool set is not yet primary-verified",
    ],
    responsibleGamblingTools: [],
    reviewBlocks: writeCasinoEditorMetadata(casino.reviewBlocks, metadata),
    lastReviewedAt: new Date("2026-09-11T00:00:00.000Z"),
    updatedBy: actor.id,
    expectedUpdatedAt: casino.updatedAt,
  });

  await prisma.casino.update({
    where: { id: casino.id },
    data: {
      license: "Tobique Gaming Commission B2C / Orgona LLC",
      domainLifecycleStatus: "ACTIVE",
      domainPublicationStatus: "DRAFT",
      responsibleGamblingMetadata: {
        status: "PARTIAL",
        source: RELEASE,
        note: "Responsible-gambling content is evidenced inside the User Agreement; exact current tool set and a separate RG URL are not primary-verified.",
      },
      updatedBy: actor.id,
    },
  });

  await prisma.casinoSeo.upsert({
    where: { casinoId: casino.id },
    create: {
      casinoId: casino.id,
      title: "GoldenPlay Casino Review | B4GAMBLE",
      description: "GoldenPlay casino and sportsbook draft: games, providers, payments, bonus terms and market-specific availability.",
      canonicalUrl: "/casino/goldenplay",
      robots: "noindex,follow",
      socialTitle: "GoldenPlay Casino Review | B4GAMBLE",
      socialDescription: "GoldenPlay casino and sportsbook profile with current product, payment, bonus and market information.",
    },
    update: {
      title: "GoldenPlay Casino Review | B4GAMBLE",
      description: "GoldenPlay casino and sportsbook draft: games, providers, payments, bonus terms and market-specific availability.",
      canonicalUrl: "/casino/goldenplay",
      robots: "noindex,follow",
      socialTitle: "GoldenPlay Casino Review | B4GAMBLE",
      socialDescription: "GoldenPlay casino and sportsbook profile with current product, payment, bonus and market information.",
    },
  });

  const populated = await casinoService.getCasinoById(casino.id);
  return NextResponse.json({
    status: "DRAFT_POPULATED",
    casinoId: populated.id,
    slug: populated.slug,
    workflowStatus: populated.status,
    domainPublicationStatus: populated.domainPublicationStatus,
    editorScore: populated.editorScore,
    countries: populated.countries.length,
    licenses: populated.licenses.length,
    payments: populated.paymentMethods.length,
    providers: populated.gameProviders.length,
    categories: populated.gameCategories.length,
    bonuses: populated.casinoBonuses.length,
    ingestion: ingestion.reconciliation,
  });
}
