import { notFound, redirect } from "next/navigation";

export default async function RetiredAdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section === "program") redirect("/admin/programs");
  notFound();
}
