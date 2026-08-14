import { notFound } from "next/navigation";

import { EditorialReviewRenderer } from "@/components/editorial-review/EditorialReviewRenderer";
import { editorialReviewService } from "@/lib/services";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editorial Preview | B4GAMBLE CMS", robots: { index: false, follow: false } };

export default async function EditorialPreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const preview = await editorialReviewService.resolvePreview((await params).token);
  if (!preview) notFound();
  const { content } = preview.revision;
  return <main className="pageShell"><div className="container"><p className="eyebrow">Draft editorial preview</p><h1>{content.title}</h1><p className="lead">{content.summary}</p></div><EditorialReviewRenderer document={content} /></main>;
}
