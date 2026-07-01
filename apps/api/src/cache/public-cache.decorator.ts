import { SetMetadata } from "@nestjs/common";

export const PUBLIC_CACHE_POLICY = "public-cache-policy";

export type CacheNamespace = "ads" | "catalog" | "home" | "pages" | "rankings" | "seo" | "settings";

export type PublicCachePolicy = {
  namespace: CacheNamespace;
  originTtl: number;
  browserTtl: number;
  edgeTtl: number;
  staleWhileRevalidate?: number;
};

export const PublicCache = (policy: PublicCachePolicy) =>
  SetMetadata(PUBLIC_CACHE_POLICY, policy);
