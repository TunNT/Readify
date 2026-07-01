import type { PublicCachePolicy } from "./public-cache.decorator";

export const PUBLIC_CACHE = {
  ads: { namespace: "ads", originTtl: 60, browserTtl: 30, edgeTtl: 60, staleWhileRevalidate: 30 },
  categories: { namespace: "catalog", originTtl: 900, browserTtl: 300, edgeTtl: 1800 },
  category: { namespace: "catalog", originTtl: 300, browserTtl: 60, edgeTtl: 600 },
  chapter: { namespace: "catalog", originTtl: 3600, browserTtl: 300, edgeTtl: 3600, staleWhileRevalidate: 600 },
  chapterList: { namespace: "catalog", originTtl: 600, browserTtl: 300, edgeTtl: 900 },
  contentPage: { namespace: "pages", originTtl: 3600, browserTtl: 300, edgeTtl: 3600, staleWhileRevalidate: 600 },
  home: { namespace: "home", originTtl: 300, browserTtl: 60, edgeTtl: 300 },
  novel: { namespace: "catalog", originTtl: 600, browserTtl: 300, edgeTtl: 900 },
  novelList: { namespace: "catalog", originTtl: 300, browserTtl: 60, edgeTtl: 300 },
  rankings: { namespace: "rankings", originTtl: 300, browserTtl: 60, edgeTtl: 600 },
  search: { namespace: "catalog", originTtl: 60, browserTtl: 0, edgeTtl: 0, staleWhileRevalidate: 30 },
  settings: { namespace: "settings", originTtl: 3600, browserTtl: 300, edgeTtl: 3600, staleWhileRevalidate: 600 },
  sitemap: { namespace: "seo", originTtl: 3600, browserTtl: 300, edgeTtl: 21600, staleWhileRevalidate: 1800 }
} as const satisfies Record<string, PublicCachePolicy>;
