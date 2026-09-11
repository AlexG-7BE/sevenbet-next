import { NextResponse } from "next/server";
import { EditorialStatus } from "@prisma/client";

import prisma from "@/lib/db/prisma";
import { casinoService } from "@/lib/services/casino.service";

export const dynamic = "force-dynamic";

const CASINO_ID = "d9fcfd4c-bc96-4ed5-b9ea-192c6bf2f712";

export async function GET() {
  const actor = await prisma.adminUser.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (!actor) return NextResponse.json({ status: "NO_GOVERNED_ACTOR" }, { status: 500 });

  let casino = await casinoService.getCasinoById(CASINO_ID);
  if (casino.status === EditorialStatus.PUBLISHED) {
    return NextResponse.json({ status: "ALREADY_PUBLISHED", casinoId: casino.id, slug: casino.slug, publishedVersion: casino.publishedVersion });
  }

  if (casino.status === EditorialStatus.DRAFT) {
    casino = await casinoService.updateCasino(casino.id, {
      title: "GoldenPlay",
      internalName: "GoldenPlay",
      domain: "goldenplaywin.com",
      websiteUrl: "https://goldenplaywin.com/",
      operator: "Orgona LLC",
      summary: "GoldenPlay is a casino and sportsbook launched in 2025 in the NetoPartners / Anakatech portfolio, offering 950+ games, live casino, multilingual support and crypto payments.",
      description: "GoldenPlay combines casino and sportsbook products with slots, table games, live casino and instant-win content. Its current partner materials document a EUR 10 minimum deposit, a casino welcome offer up to EUR 555 plus 100 free spins, established game providers, mobile-web access and support for major cryptocurrencies. Market availability and outbound referral eligibility remain controlled separately by B4GAMBLE jurisdiction rules.",
      foundedYear: 2025,
      language: "en",
      languages: ["en", "fr", "it", "de", "nl", "pl", "pt"],
      currencies: ["EUR"],
      editorScore: 8.3,
      pros: [
        "Casino and sportsbook in one product",
        "950+ games with established providers and live casino",
        "Mobile-web and crypto payment support",
      ],
      cons: [
        "Launched in 2025, so its operating history is short",
        "Exact payment availability varies by market",
        "Tobique licensing is not a local licence in many target markets",
      ],
      responsibleGamblingTools: ["Deposit limits", "Loss limits", "Wager limits", "Session limits"],
      lastReviewedAt: new Date("2026-09-11T00:00:00.000Z"),
      updatedBy: actor.id,
      expectedUpdatedAt: casino.updatedAt,
    });

    await prisma.casino.update({
      where: { id: casino.id },
      data: {
        license: "Tobique Gaming Commission B2C / Orgona LLC",
        domainLifecycleStatus: "ACTIVE",
        updatedBy: actor.id,
      },
    });

    await prisma.casinoSeo.upsert({
      where: { casinoId: casino.id },
      create: {
        casinoId: casino.id,
        title: "GoldenPlay Casino Review | B4GAMBLE",
        description: "GoldenPlay casino and sportsbook review: games, bonus, payments, mobile access and market-specific availability.",
        canonicalUrl: "/casino/goldenplay",
        robots: "index,follow",
        socialTitle: "GoldenPlay Casino Review | B4GAMBLE",
        socialDescription: "GoldenPlay casino and sportsbook review with current product, bonus and market information.",
      },
      update: {
        title: "GoldenPlay Casino Review | B4GAMBLE",
        description: "GoldenPlay casino and sportsbook review: games, bonus, payments, mobile access and market-specific availability.",
        canonicalUrl: "/casino/goldenplay",
        robots: "index,follow",
        socialTitle: "GoldenPlay Casino Review | B4GAMBLE",
        socialDescription: "GoldenPlay casino and sportsbook review with current product, bonus and market information.",
      },
    });
    casino = await casinoService.getCasinoById(casino.id);
  }

  if (casino.status === EditorialStatus.DRAFT) {
    casino = await casinoService.transitionWorkflow(casino.id, EditorialStatus.IN_REVIEW, actor.id, casino.updatedAt);
  }
  if (casino.status === EditorialStatus.IN_REVIEW) {
    casino = await casinoService.transitionWorkflow(casino.id, EditorialStatus.APPROVED, actor.id, casino.updatedAt);
  }
  if (casino.status === EditorialStatus.APPROVED || casino.status === EditorialStatus.SCHEDULED) {
    casino = await casinoService.publishCasino(casino.id, actor.id, casino.updatedAt);
  }

  await prisma.casino.update({
    where: { id: casino.id },
    data: { domainPublicationStatus: "PUBLISHED", domainLifecycleStatus: "ACTIVE", updatedBy: actor.id },
  });

  const published = await casinoService.getCasinoById(casino.id);
  return NextResponse.json({
    status: "PUBLISHED",
    casinoId: published.id,
    slug: published.slug,
    workflowStatus: published.status,
    publishedVersion: published.publishedVersion,
    domainPublicationStatus: published.domainPublicationStatus,
    editorScore: published.editorScore,
  });
}
