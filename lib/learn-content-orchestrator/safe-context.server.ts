import "server-only";

import { EditorialStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { publicLearnArticlePath } from "@/lib/learn-apply/public-verification";
import { learningCategories } from "@/lib/learning-center";
import { PUBLISHED_LANGUAGE_ROUTE_PROFILES } from "@/lib/market/registry";
import { PUBLIC_CANONICAL_ORIGIN } from "@/lib/site";

export const LEARN_CONTENT_MAX_ARTICLE_INVENTORY = 500;

export type LearnContentArticleInventoryItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  locale: string;
  publishedAt: string;
  updatedAt: string;
  url: string;
};

export type LearnContentSafeContext = {
  generatedAt: string;
  articles: LearnContentArticleInventoryItem[];
  categories: Array<{ slug: string; title: string; description: string }>;
  locales: Array<{ language: string; locale: string; publicPathPrefix: string }>;
  publicProgramme: {
    route: "/10-steps";
    applicationRoute: "/program";
    missionCount: 10;
    description: string;
  };
  protectedRoutes: readonly ["/help", "/responsible-gambling"];
};

type ArticleInventoryReader = {
  article: {
    findMany(args: unknown): Promise<Array<{
      id: string;
      slug: string;
      title: string;
      category: string;
      locale: string;
      publishedAt: Date | null;
      updatedAt: Date;
    }>>;
  };
};

export async function collectLearnContentSafeContext(
  allowedLocales: readonly string[],
  database: ArticleInventoryReader = prisma,
  now = new Date(),
): Promise<LearnContentSafeContext> {
  const articles = await database.article.findMany({
    where: { status: EditorialStatus.PUBLISHED, locale: { in: [...allowedLocales] } },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    take: LEARN_CONTENT_MAX_ARTICLE_INVENTORY + 1,
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      locale: true,
      publishedAt: true,
      updatedAt: true,
    },
  });
  if (articles.length > LEARN_CONTENT_MAX_ARTICLE_INVENTORY) {
    throw new Error("Published Learn inventory exceeds the bounded autonomous context limit");
  }
  return {
    generatedAt: now.toISOString(),
    articles: articles.map((article) => ({
      id: article.id,
      slug: article.slug,
      title: article.title,
      category: article.category,
      locale: article.locale,
      publishedAt: article.publishedAt?.toISOString() ?? article.updatedAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      url: `${PUBLIC_CANONICAL_ORIGIN}${publicLearnArticlePath(article.locale, article.category, article.slug)}`,
    })),
    categories: learningCategories.map(({ slug, title, description }) => ({ slug, title, description })),
    locales: PUBLISHED_LANGUAGE_ROUTE_PROFILES
      .filter((profile) => allowedLocales.includes(profile.defaultLocale))
      .map((profile) => ({
        language: profile.language,
        locale: profile.defaultLocale,
        publicPathPrefix: `/${profile.publicSlug}`,
      })),
    publicProgramme: {
      route: "/10-steps",
      applicationRoute: "/program",
      missionCount: 10,
      description: "A private, free ten-mission Active Control Programme. Public editorial links may explain it but must never use private Programme or pause data.",
    },
    protectedRoutes: ["/help", "/responsible-gambling"],
  };
}
