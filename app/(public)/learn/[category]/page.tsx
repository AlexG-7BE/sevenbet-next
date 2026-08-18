import { notFound, permanentRedirect } from "next/navigation";

import { getLearningCategory } from "@/lib/learning-center";

export default async function LearningCategoryRedirect({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!getLearningCategory(category)) notFound();
  permanentRedirect(`/learn?category=${encodeURIComponent(category)}`);
}
