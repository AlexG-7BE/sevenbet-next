import { NextResponse } from "next/server";

import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await prisma.adminUser.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN", "EDITOR"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (!actor) return NextResponse.json({ status: "NO_GOVERNED_ACTOR" }, { status: 500 });

  const casino = await prisma.casino.update({
    where: { slug: "goldenplay" },
    data: {
      domain: "goldenplaywin.com",
      websiteUrl: "https://goldenplaywin.com/",
      updatedBy: actor.id,
    },
    select: { id: true, slug: true, title: true, domain: true, websiteUrl: true, status: true },
  });

  return NextResponse.json({ status: "UPDATED", casino });
}
