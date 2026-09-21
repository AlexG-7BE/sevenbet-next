import type { ArticleDocumentInput, AdminArticle } from "@/lib/articles/article-types";
import { articlePath } from "@/lib/articles/article-types";
import {
  languageRouteByLocale,
  marketProfileByLocale,
  publicMarketPath,
  DEFAULT_MARKET_PROFILE,
  type SupportedLocale,
} from "@/lib/market/registry";
import { absoluteUrl, siteUrl } from "@/lib/site";

export type LearnPublicVerification = {
  verified: boolean;
  checks: string[];
  attempts: number;
  failureCode: string | null;
  publicUrl: string;
};

type VerifierDependencies = {
  fetchImpl?: typeof fetch;
  wait?: (milliseconds: number) => Promise<void>;
  attempts?: number;
  timeoutMs?: number;
  origin?: string;
};

function configuredOrigin(environment = process.env) {
  const configured = environment.LEARN_APPLY_PUBLIC_ORIGIN?.trim();
  if (configured) {
    const url = new URL(configured);
    if (url.pathname !== "/" || url.search || url.hash || (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname))) {
      throw new Error("LEARN_APPLY_PUBLIC_ORIGIN must be an HTTPS or loopback origin");
    }
    if (environment.VERCEL_ENV === "production" && url.origin !== siteUrl) {
      throw new Error("Production Learn verification must use the canonical B4GAMBLE origin");
    }
    return url.origin;
  }
  if (environment.VERCEL_ENV === "preview") {
    const host = environment.VERCEL_BRANCH_URL?.trim();
    if (!host || !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(host)) throw new Error("Preview Learn verification requires VERCEL_BRANCH_URL");
    return `https://${host}`;
  }
  return siteUrl;
}

export function publicLearnArticlePath(locale: string, category: string, slug: string) {
  const typedLocale = locale as SupportedLocale;
  const market = marketProfileByLocale(typedLocale) ?? DEFAULT_MARKET_PROFILE;
  return publicMarketPath(market, typedLocale, articlePath({ category, slug }));
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&quot;", "\"")
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function attributes(tag: string) {
  const result: Record<string, string> = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    result[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? "");
  }
  return result;
}

function metaContent(html: string, kind: "name" | "property", key: string) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const parsed = attributes(match[0]);
    if (parsed[kind]?.toLowerCase() === key.toLowerCase()) return parsed.content ?? null;
  }
  return null;
}

function canonicalHref(html: string) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const parsed = attributes(match[0]);
    if (parsed.rel?.split(/\s+/).some((value) => value.toLowerCase() === "canonical")) return parsed.href ?? null;
  }
  return null;
}

function jsonLd(html: string) {
  const values: unknown[] = [];
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { values.push(JSON.parse(match[1])); } catch { /* Verification reports the missing schema below. */ }
  }
  return values;
}

function schemaType(value: unknown, type: string): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && (value as Record<string, unknown>)["@type"] === type);
}

function titleText(html: string) {
  return decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
}

function visibleTagText(html: string, tag: string) {
  const content = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] ?? "";
  return decodeHtml(content.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

async function responseText(fetchImpl: typeof fetch, url: string, timeoutMs: number) {
  const response = await fetchImpl(url, {
    cache: "no-store",
    headers: { "cache-control": "no-cache", accept: "text/html,application/xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  return { response, text: await response.text() };
}

export class LearnPublicVerifier {
  private readonly fetchImpl: typeof fetch;
  private readonly wait: (milliseconds: number) => Promise<void>;
  private readonly attempts: number;
  private readonly timeoutMs: number;
  private readonly origin: string;

  constructor(dependencies: VerifierDependencies = {}) {
    this.fetchImpl = dependencies.fetchImpl ?? fetch;
    this.wait = dependencies.wait ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
    this.attempts = dependencies.attempts ?? 3;
    this.timeoutMs = dependencies.timeoutMs ?? 8_000;
    this.origin = dependencies.origin ?? configuredOrigin();
  }

  async verify(article: AdminArticle, document: ArticleDocumentInput): Promise<LearnPublicVerification> {
    const path = publicLearnArticlePath(article.locale, article.category, article.slug);
    const collectionPath = path.slice(0, path.indexOf("/learn/") + "/learn".length);
    const publicUrl = `${this.origin}${path}`;
    const expectedCanonical = document.canonicalUrl
      ? new URL(document.canonicalUrl, siteUrl).href
      : absoluteUrl(path);
    const language = languageRouteByLocale(article.locale as SupportedLocale);
    const expectedSitemapUrl = absoluteUrl(path);
    const expectedTitle = document.seoTitle || `${document.title} | B4GAMBLE`;
    const expectedDescription = document.seoDescription || document.excerpt;
    const imageUrls = [...new Set([
      ...(document.heroImageUrl ? [document.heroImageUrl] : []),
      ...document.bodyBlocks.flatMap((block) => block.type === "image" ? [block.url] : []),
    ])];
    let failureCode = "PUBLIC_VERIFICATION_FAILED";
    let completedChecks: string[] = [];

    for (let attempt = 1; attempt <= this.attempts; attempt += 1) {
      const checks: string[] = [];
      try {
        const page = await responseText(this.fetchImpl, publicUrl, this.timeoutMs);
        if (!page.text.includes(`data-article-id="${article.id}"`)) throw new Error("ARTICLE_IDENTITY_MISSING");
        if (!page.text.includes(`data-article-updated-at="${article.updatedAt}"`)) throw new Error("ARTICLE_VERSION_MISMATCH");
        if (visibleTagText(page.text, "h1") !== document.title) throw new Error("ARTICLE_TITLE_MISMATCH");
        checks.push("article_http_and_identity");
        if (titleText(page.text) !== expectedTitle) throw new Error("SEO_TITLE_MISMATCH");
        if (metaContent(page.text, "name", "description") !== expectedDescription) throw new Error("SEO_DESCRIPTION_MISMATCH");
        if (canonicalHref(page.text) !== expectedCanonical) throw new Error("CANONICAL_MISMATCH");
        checks.push("seo_metadata");

        const robots = `${metaContent(page.text, "name", "robots") ?? ""},${page.response.headers.get("x-robots-tag") ?? ""}`.toLowerCase();
        if (language.indexable ? robots.includes("noindex") : !robots.includes("noindex")) {
          throw new Error(language.indexable ? "ACCIDENTAL_NOINDEX" : "INDEXING_POLICY_MISMATCH");
        }
        checks.push(language.indexable ? "indexable_robots" : "intentional_noindex_policy");

        const schemas = jsonLd(page.text);
        const articleSchema = schemas.find((value) => schemaType(value, "Article"));
        if (!articleSchema || articleSchema.headline !== document.title || articleSchema.mainEntityOfPage !== absoluteUrl(path)) {
          throw new Error("ARTICLE_JSON_LD_MISMATCH");
        }
        const breadcrumbs = schemas.find((value) => schemaType(value, "BreadcrumbList"));
        const breadcrumbItems = breadcrumbs?.itemListElement;
        if (!Array.isArray(breadcrumbItems) || breadcrumbItems.length !== 4 || (breadcrumbItems[3] as Record<string, unknown>)?.name !== document.title) {
          throw new Error("BREADCRUMB_JSON_LD_MISMATCH");
        }
        checks.push("article_and_breadcrumb_json_ld");

        if (document.heroImageUrl && metaContent(page.text, "property", "og:image") !== document.heroImageUrl) {
          throw new Error("OPEN_GRAPH_IMAGE_MISMATCH");
        }
        checks.push("open_graph");

        const collection = await responseText(this.fetchImpl, `${this.origin}${collectionPath}`, this.timeoutMs);
        if (!collection.text.includes(path)) throw new Error("LEARN_COLLECTION_MISSING_ARTICLE");
        checks.push("learn_collection");

        const sitemap = await responseText(this.fetchImpl, `${this.origin}/sitemap.xml`, this.timeoutMs);
        const sitemapEntry = `<loc>${expectedSitemapUrl}</loc>`;
        if (language.indexable && !sitemap.text.includes(sitemapEntry)) throw new Error("SITEMAP_MISSING_ARTICLE");
        if (!language.indexable && sitemap.text.includes(sitemapEntry)) throw new Error("SITEMAP_INDEXING_POLICY_MISMATCH");
        checks.push(language.indexable ? "sitemap" : "sitemap_exclusion_policy");

        for (const imageUrl of imageUrls) {
          const image = await this.fetchImpl(imageUrl, { cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(this.timeoutMs) });
          const contentType = image.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
          await image.body?.cancel().catch(() => undefined);
          if (!image.ok || !contentType?.startsWith("image/")) throw new Error("PUBLIC_IMAGE_UNREACHABLE");
        }
        if (imageUrls.length) checks.push("public_images");
        return { verified: true, checks, attempts: attempt, failureCode: null, publicUrl };
      } catch (error) {
        failureCode = error instanceof Error && /^[A-Z0-9_]+$/.test(error.message)
          ? error.message
          : error instanceof DOMException && ["AbortError", "TimeoutError"].includes(error.name)
            ? "PUBLIC_VERIFICATION_TIMEOUT"
            : "PUBLIC_VERIFICATION_FAILED";
        completedChecks = checks;
        if (attempt < this.attempts) await this.wait(attempt * 400);
      }
    }
    return { verified: false, checks: completedChecks, attempts: this.attempts, failureCode, publicUrl };
  }
}
