import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export const siteSettingInclude = {
  logoAsset: { select: { publicUrl: true } },
  faviconAsset: { select: { publicUrl: true } },
  socialImageAsset: { select: { publicUrl: true } }
} as const;

export function presentSiteSetting(setting: {
  siteName: string;
  siteUrl: string;
  seoTitle: string;
  seoDescription: string;
  logoAssetId: string | null;
  faviconAssetId: string | null;
  socialImageAssetId: string | null;
  logoAsset: { publicUrl: string | null } | null;
  faviconAsset: { publicUrl: string | null } | null;
  socialImageAsset: { publicUrl: string | null } | null;
}) {
  return {
    siteName: setting.siteName,
    siteUrl: setting.siteUrl,
    seoTitle: setting.seoTitle,
    seoDescription: setting.seoDescription,
    logoAssetId: setting.logoAssetId,
    faviconAssetId: setting.faviconAssetId,
    socialImageAssetId: setting.socialImageAssetId,
    logoUrl: setting.logoAsset?.publicUrl ?? null,
    faviconUrl: setting.faviconAsset?.publicUrl ?? null,
    socialImageUrl: setting.socialImageAsset?.publicUrl ?? null
  };
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicSettings() {
    const setting = await this.prisma.siteSetting.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
      include: siteSettingInclude
    });
    return { data: presentSiteSetting(setting) };
  }

  async getSitemapEntries() {
    const novels = await this.prisma.novel.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: { slug: true, updatedAt: true, chapters: { orderBy: { number: "asc" }, select: { slug: true, updatedAt: true } } }
    });
    return { data: novels };
  }
}
