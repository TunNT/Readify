import type { MetadataRoute } from "next";
import { absoluteSiteUrl, getSiteSettings } from "../lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/library"] },
    sitemap: absoluteSiteUrl(settings, "/sitemap.xml"),
    host: absoluteSiteUrl(settings)
  };
}
