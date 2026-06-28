import type { MetadataRoute } from "next";
import { apiFetch } from "../lib/api";
import { absoluteSiteUrl, getSiteSettings } from "../lib/seo";
import type { CategoriesResponse, SeoSitemapResponse } from "../lib/types";

const staticPaths = ["/", "/novels", "/categories", "/about", "/faq", "/contact", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSiteSettings();
  const [entries, categories] = await Promise.all([
    apiFetch<SeoSitemapResponse>("/seo/sitemap").catch(() => ({ data: [] })),
    apiFetch<CategoriesResponse>("/categories").catch(() => ({ data: [] }))
  ]);
  return [
    ...staticPaths.map((path) => ({ url: absoluteSiteUrl(settings, path), changeFrequency: path === "/" ? "daily" as const : "monthly" as const, priority: path === "/" ? 1 : 0.6 })),
    ...categories.data.map((category) => ({ url: absoluteSiteUrl(settings, `/category/${category.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...entries.data.flatMap((novel) => [
      { url: absoluteSiteUrl(settings, `/novels/${novel.slug}`), lastModified: new Date(novel.updatedAt), changeFrequency: "daily" as const, priority: 0.9 },
      ...novel.chapters.map((chapter) => ({ url: absoluteSiteUrl(settings, `/novels/${novel.slug}/${chapter.slug}`), lastModified: new Date(chapter.updatedAt), changeFrequency: "weekly" as const, priority: 0.7 }))
    ])
  ];
}
