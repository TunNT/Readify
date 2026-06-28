import type { Metadata } from "next";
import "./globals.css";
import { AdsRuntime } from "../components/ads/ads-runtime";
import { SiteSettingsProvider } from "../components/site-settings";
import { absoluteSiteUrl, getSiteSettings, jsonLd } from "../lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const socialImage = settings.socialImageUrl ? absoluteSiteUrl(settings, settings.socialImageUrl) : undefined;
  return {
    metadataBase: new URL(absoluteSiteUrl(settings)),
    title: { default: settings.seoTitle, template: `%s | ${settings.siteName}` },
    description: settings.seoDescription,
    applicationName: settings.siteName,
    icons: settings.faviconUrl ? { icon: settings.faviconUrl, shortcut: settings.faviconUrl, apple: settings.faviconUrl } : undefined,
    openGraph: { type: "website", siteName: settings.siteName, title: settings.seoTitle, description: settings.seoDescription, images: socialImage ? [{ url: socialImage }] : undefined },
    twitter: { card: socialImage ? "summary_large_image" : "summary", title: settings.seoTitle, description: settings.seoDescription, images: socialImage ? [socialImage] : undefined }
  };
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.siteName,
    url: absoluteSiteUrl(settings),
    description: settings.seoDescription,
    ...(settings.logoUrl ? { publisher: { "@type": "Organization", name: settings.siteName, logo: absoluteSiteUrl(settings, settings.logoUrl) } } : {})
  };
  return (
    <html lang="en">
      <body><SiteSettingsProvider settings={settings}><AdsRuntime>{children}</AdsRuntime></SiteSettingsProvider><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} /></body>
    </html>
  );
}
