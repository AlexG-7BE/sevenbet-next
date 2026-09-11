import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";
import { casinoService } from "@/lib/services/casino.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const existing = await prisma.casino.findUnique({
    where: { slug: "goldenplay" },
    select: { id: true, slug: true, title: true, status: true },
  });
  if (existing) return NextResponse.json({ status: "ALREADY_EXISTS", casino: existing });

  const actor = await prisma.adminUser.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN", "EDITOR"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (!actor) return NextResponse.json({ status: "NO_GOVERNED_ACTOR" }, { status: 500 });

  const casino = await casinoService.createDraft({
    slug: "goldenplay",
    internalName: "GoldenPlay",
    title: "GoldenPlay",
    domain: "goldenplay.com",
    websiteUrl: "https://goldenplay.com/",
    operator: "Orgona LLC",
    summary: "GoldenPlay casino profile for governed factual and commercial activation.",
    language: "en",
    createdBy: actor.id,
  });

  return NextResponse.json({
    status: "CREATED",
    casino: { id: casino.id, slug: casino.slug, title: casino.title, status: casino.status },
  });
}
