import type { Metadata } from "next";
import { apiFetch } from "./api";
import type { SiteSettings, SiteSettingsResponse } from "./types";

export const fallbackSiteSettings: SiteSettings = {
  siteName: "WeAreNovelArk",
  siteUrl: "http://localhost:3000",
  seoTitle: "WeAreNovelArk",
  seoDescription: "Read free romance, fantasy, werewolf, and contemporary novels.",
  adsTxtContent: "",
  logoUrl: null,
  faviconUrl: null,
  socialImageUrl: null
};

export async function getSiteSettings() {
  try {
    const { data } = await apiFetch<SiteSettingsResponse>("/settings");
    return data;
  } catch {
    return fallbackSiteSettings;
  }
}

export function absoluteSiteUrl(settings: SiteSettings, pathOrUrl = "/") {
  try {
    return new URL(pathOrUrl, `${settings.siteUrl.replace(/\/$/, "")}/`).toString();
  } catch {
    return new URL(pathOrUrl, `${fallbackSiteSettings.siteUrl}/`).toString();
  }
}

export function pageMetadata(settings: SiteSettings, input: { title: string; description: string; path: string; image?: string | null; type?: "website" | "article" }): Metadata {
  const url = absoluteSiteUrl(settings, input.path);
  const image = input.image ? absoluteSiteUrl(settings, input.image) : settings.socialImageUrl ? absoluteSiteUrl(settings, settings.socialImageUrl) : undefined;
  const description = input.description.trim().slice(0, 320);
  return {
    title: input.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: input.type ?? "website",
      url,
      siteName: settings.siteName,
      title: input.title,
      description,
      images: image ? [{ url: image }] : undefined
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: input.title,
      description,
      images: image ? [image] : undefined
    }
  };
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
