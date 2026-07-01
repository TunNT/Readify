"use client";

import Link from "next/link";
import { createContext, useContext } from "react";
import type { SiteSettings } from "../lib/types";

const SiteSettingsContext = createContext<SiteSettings>({ siteName:"WeAreNovelArk",siteUrl:"http://localhost:3000",seoTitle:"WeAreNovelArk",seoDescription:"Read free novels online.",adsTxtContent:"",logoUrl:null,faviconUrl:null,socialImageUrl:null });

export function SiteSettingsProvider({ settings, children }: { settings: SiteSettings; children: React.ReactNode }) {
  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

export function SiteBrand({ className, href = "/" }: { className?: string; href?: string }) {
  const settings = useSiteSettings();
  return <Link href={href} className={className}>{settings.logoUrl ? <img className="siteBrandImage" src={settings.logoUrl} alt={settings.siteName} /> : settings.siteName}</Link>;
}

export function SiteName({ className }: { className?: string }) {
  const { siteName } = useSiteSettings();
  return <span className={className}>{siteName}</span>;
}
