import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { load } from "cheerio";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import { hashPassword } from "../auth/password";
import { presentSiteSetting, siteSettingInclude } from "../settings/settings.service";
import type { CacheNamespace } from "../cache/public-cache.decorator";
import { PublicCacheService } from "../cache/public-cache.service";
import { AdPlacementInputDto, AdminListQueryDto, ChapterInputDto, ContentPageInputDto, NovelInputDto, RankingInputDto, SiteSettingInputDto, TaxonomyInputDto, UserInputDto } from "./admin.dto";

type UploadedCover = { originalname: string; mimetype: string; size: number; buffer: Buffer };
type AdWithPriority = { priority: number; updatedAt: Date; createdAt: Date };

function adPriorityRank(ad: { priority: number }) {
  return ad.priority > 0 ? ad.priority : Number.MAX_SAFE_INTEGER;
}

function sortAdsByPriority<T extends AdWithPriority>(ads: T[]) {
  return ads.sort((left, right) => adPriorityRank(left) - adPriorityRank(right) || right.updatedAt.getTime() - left.updatedAt.getTime() || left.createdAt.getTime() - right.createdAt.getTime());
}

function isUniqueConstraintError(error: unknown, field: string) {
  const target = (error as { code?: string; meta?: { target?: unknown } }).meta?.target;
  return (error as { code?: string }).code === "P2002" && Array.isArray(target) && target.includes(field);
}

@Injectable()
export class AdminService {
  private readonly coverPath: string;
  constructor(private readonly prisma: PrismaService, private readonly cache: PublicCacheService, config: ConfigService) {
    this.coverPath = config.get<string>("LOCAL_ASSET_BASE_PATH", "storage/covers");
  }

  private audit(user: AuthenticatedUser, action: string, entityType: string, entityId?: string, metadata?: Prisma.InputJsonValue) {
    return this.prisma.auditLog.create({ data: { userId: user.id, action, entityType, entityId, metadata } });
  }

  async dashboard() {
    const [novels, chapters, categories, tags, users, ads, recent] = await Promise.all([
      this.prisma.novel.count({ where: { deletedAt: null } }), this.prisma.chapter.count(), this.prisma.category.count(),
      this.prisma.tag.count(), this.prisma.user.count(), this.prisma.adPlacement.count(),
      this.prisma.auditLog.findMany({ take: 12, orderBy: { createdAt: "desc" }, include: { user: { select: { displayName: true } } } })
    ]);
    return { data: { counts: { novels, chapters, categories, tags, users, ads }, recent } };
  }

  async listNovels(query: AdminListQueryDto) {
    const where: Prisma.NovelWhereInput = {
      ...(!query.includeDeleted ? { deletedAt: null } : {}),
      ...(query.search ? { OR: [{ title: { contains: query.search, mode: "insensitive" } }, { authorName: { contains: query.search, mode: "insensitive" } }] } : {})
    };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.novel.count({ where }),
      this.prisma.novel.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: { updatedAt: "desc" }, include: {
        coverAsset: true, categories: { include: { category: true } }, tags: { include: { tag: true } }, _count: { select: { chapters: true } }
      } })
    ]);
    return { data, meta: { page: query.page, limit: query.limit, total, totalPages: Math.max(1, Math.ceil(total / query.limit)) } };
  }

  async getNovel(id: string) {
    const data = await this.prisma.novel.findUnique({ where: { id }, include: {
      coverAsset: true, categories: { include: { category: true } }, tags: { include: { tag: true } }, chapters: { orderBy: { number: "asc" } }
    } });
    if (!data) throw new NotFoundException("Novel not found");
    return { data };
  }

  async createNovel(input: NovelInputDto, user: AuthenticatedUser) {
    if (!input.title || !input.slug) throw new BadRequestException("Title and slug are required");
    try {
      const data = await this.prisma.novel.create({ data: {
        title: input.title, slug: input.slug, authorName: input.authorName, description: input.description ?? "", status: input.status,
        isPublished: input.isPublished ?? false, coverAssetId: input.coverAssetId,
        categories: input.categoryIds?.length ? { create: input.categoryIds.map((categoryId) => ({ categoryId })) } : undefined,
        tags: input.tagIds?.length ? { create: input.tagIds.map((tagId) => ({ tagId })) } : undefined
      } });
      await this.audit(user, "CREATE", "Novel", data.id, { title: data.title });
      await this.invalidate("catalog", "home", "seo");
      return { data };
    } catch (error) {
      if (isUniqueConstraintError(error, "slug")) throw new ConflictException("A story with this slug already exists. Choose another slug or edit the existing story.");
      throw error;
    }
  }

  async updateNovel(id: string, input: NovelInputDto, user: AuthenticatedUser) {
    const exists = await this.prisma.novel.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException("Novel not found");
    const { categoryIds, tagIds, ...fields } = input;
    try {
      const data = await this.prisma.novel.update({ where: { id }, data: {
        ...fields,
        ...(categoryIds ? { categories: { deleteMany: {}, create: categoryIds.map((categoryId) => ({ categoryId })) } } : {}),
        ...(tagIds ? { tags: { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) } } : {})
      } });
      await this.audit(user, "UPDATE", "Novel", id, { fields: Object.keys(input) });
      await this.invalidate("catalog", "home", "seo");
      return { data };
    } catch (error) {
      if (isUniqueConstraintError(error, "slug")) throw new ConflictException("A story with this slug already exists. Choose another slug or edit the existing story.");
      throw error;
    }
  }

  async deleteNovel(id: string, user: AuthenticatedUser) {
    const data = await this.prisma.novel.update({ where: { id }, data: { deletedAt: new Date(), isPublished: false } });
    await this.audit(user, "DELETE", "Novel", id, { softDelete: true });
    await this.invalidate("catalog", "home", "seo");
    return { data };
  }

  async createChapter(novelId: string, input: ChapterInputDto, user: AuthenticatedUser) {
    if (!input.number || !input.slug || !input.title) throw new BadRequestException("Number, slug and title are required");
    const data = await this.prisma.chapter.create({ data: { novelId, number: input.number, slug: input.slug, title: input.title, content: input.content ?? "", excerpt: input.excerpt ?? "", publishedAt: input.publishedAt ? new Date(input.publishedAt) : null } });
    await this.syncChapterCount(novelId);
    await this.audit(user, "CREATE", "Chapter", data.id, { novelId, number: data.number });
    await this.invalidate("catalog", "home", "seo");
    return { data };
  }

  async updateChapter(id: string, input: ChapterInputDto, user: AuthenticatedUser) {
    const { publishedAt, ...fields } = input;
    const data = await this.prisma.chapter.update({ where: { id }, data: { ...fields, ...(publishedAt !== undefined ? { publishedAt: publishedAt ? new Date(publishedAt) : null } : {}) } });
    await this.audit(user, "UPDATE", "Chapter", id, { fields: Object.keys(input) });
    await this.invalidate("catalog", "home", "seo");
    return { data };
  }

  async deleteChapter(id: string, user: AuthenticatedUser) {
    const chapter = await this.prisma.chapter.delete({ where: { id } });
    await this.syncChapterCount(chapter.novelId);
    await this.audit(user, "DELETE", "Chapter", id);
    await this.invalidate("catalog", "home", "seo");
    return { data: { id } };
  }

  async listTaxonomy(type: "category" | "tag") {
    const data = type === "category"
      ? await this.prisma.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { novels: true } } } })
      : await this.prisma.tag.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { novels: true } } } });
    return { data };
  }

  async createTaxonomy(type: "category" | "tag", input: TaxonomyInputDto, user: AuthenticatedUser) {
    const data = type === "category" ? await this.prisma.category.create({ data: input }) : await this.prisma.tag.create({ data: { name: input.name, slug: input.slug } });
    await this.audit(user, "CREATE", type === "category" ? "Category" : "Tag", data.id, { name: data.name });
    await this.invalidate("catalog", "home");
    return { data };
  }

  async updateTaxonomy(type: "category" | "tag", id: string, input: TaxonomyInputDto, user: AuthenticatedUser) {
    const data = type === "category" ? await this.prisma.category.update({ where: { id }, data: input }) : await this.prisma.tag.update({ where: { id }, data: { name: input.name, slug: input.slug } });
    await this.audit(user, "UPDATE", type === "category" ? "Category" : "Tag", id);
    await this.invalidate("catalog", "home");
    return { data };
  }

  async deleteTaxonomy(type: "category" | "tag", id: string, user: AuthenticatedUser) {
    if (type === "category") await this.prisma.category.delete({ where: { id } }); else await this.prisma.tag.delete({ where: { id } });
    await this.audit(user, "DELETE", type === "category" ? "Category" : "Tag", id);
    await this.invalidate("catalog", "home");
    return { data: { id } };
  }

  async listUsers() {
    return { data: await this.prisma.user.findMany({ where: { role: { not: UserRole.READER } }, orderBy: { createdAt: "desc" }, select: { id: true, email: true, displayName: true, role: true, isActive: true, lastLoginAt: true, createdAt: true } }) };
  }

  async createUser(input: UserInputDto, actor: AuthenticatedUser) {
    if (!input.password) throw new BadRequestException("Password is required");
    const data = await this.prisma.user.create({ data: { email: input.email.toLowerCase(), displayName: input.displayName, role: input.role, isActive: input.isActive ?? true, passwordHash: hashPassword(input.password) }, select: { id: true, email: true, displayName: true, role: true, isActive: true } });
    await this.audit(actor, "CREATE", "User", data.id, { email: data.email, role: data.role });
    return { data };
  }

  async updateUser(id: string, input: UserInputDto, actor: AuthenticatedUser) {
    if (id === actor.id && input.isActive === false) throw new BadRequestException("You cannot deactivate your own account");
    const data = await this.prisma.user.update({ where: { id }, data: { email: input.email.toLowerCase(), displayName: input.displayName, role: input.role, isActive: input.isActive, ...(input.password ? { passwordHash: hashPassword(input.password), adminSessions: { deleteMany: {} } } : {}) }, select: { id: true, email: true, displayName: true, role: true, isActive: true } });
    await this.audit(actor, "UPDATE", "User", id, { role: data.role, active: data.isActive });
    return { data };
  }

  async deleteUser(id: string, actor: AuthenticatedUser) {
    if (id === actor.id) throw new BadRequestException("You cannot delete your own account");
    const data = await this.prisma.user.update({ where: { id }, data: { isActive: false, adminSessions: { deleteMany: {} } }, select: { id: true } });
    await this.audit(actor, "DELETE", "User", id, { softDelete: true });
    return { data };
  }

  async listAds() { return { data: sortAdsByPriority(await this.prisma.adPlacement.findMany()) }; }
  async createAd(input: AdPlacementInputDto, user: AuthenticatedUser) {
    const key = await this.generateAdKey(input);
    const data = await this.prisma.adPlacement.create({ data: { ...this.adData(input), key, isEnabled: true } });
    await this.audit(user, "CREATE", "AdPlacement", data.id, { key: data.key });
    await this.invalidate("ads");
    return { data };
  }
  async updateAd(id: string, input: AdPlacementInputDto, user: AuthenticatedUser) {
    const data = await this.prisma.adPlacement.update({ where: { id }, data: this.adData(input) });
    await this.audit(user, "UPDATE", "AdPlacement", id, { key: data.key });
    await this.invalidate("ads");
    return { data };
  }
  async updateAdStatus(id: string, isEnabled: boolean, user: AuthenticatedUser) {
    const data = await this.prisma.adPlacement.update({ where: { id }, data: { isEnabled } });
    await this.audit(user, isEnabled ? "ENABLE" : "DISABLE", "AdPlacement", id, { key: data.key });
    await this.invalidate("ads");
    return { data };
  }
  async deleteAd(id: string, user: AuthenticatedUser) {
    await this.prisma.adPlacement.delete({ where: { id } });
    await this.audit(user, "DELETE", "AdPlacement", id);
    await this.invalidate("ads");
    return { data: { id } };
  }
  private adData(input: AdPlacementInputDto) {
    if (input.scope !== "GLOBAL" && !input.scopeValue?.trim()) throw new BadRequestException("Scope value is required");
    if (input.location === "INLINE" && !input.wordInterval) throw new BadRequestException("Inline ads require a word interval");
    if (input.codeType === "EXTERNAL_SCRIPT") {
      this.assertSecureScriptSource(input.code);
    }
    if (input.codeType === "HTML") {
      const document = load(input.code, null, false);
      document("script[src]").each((_index, element) => {
        this.assertSecureScriptSource(document(element).attr("src") ?? "");
      });
    }
    if (input.startsAt && input.endsAt && new Date(input.startsAt) >= new Date(input.endsAt)) throw new BadRequestException("End time must be after start time");
    const { key: _ignoredKey, isEnabled: _ignoredEnabled, ...fields } = input;
    return { ...fields, priority: input.priority ?? 1, scopeValue: input.scope === "GLOBAL" ? null : input.scopeValue, startsAt: input.startsAt ? new Date(input.startsAt) : null, endsAt: input.endsAt ? new Date(input.endsAt) : null };
  }

  private assertSecureScriptSource(source: string) {
    try {
      const url = new URL(source.trim(), "https://wearenovelark.invalid");
      if (url.protocol !== "https:") throw new Error();
    } catch {
      throw new BadRequestException("External scripts must use a valid HTTPS or same-origin URL");
    }
  }

  private async generateAdKey(input: AdPlacementInputDto) {
    const rawBase = `${input.scope === "GLOBAL" ? "GLOBAL" : input.scopeValue}_${input.location}_${input.name}`;
    const base = rawBase.toUpperCase().normalize("NFKD").replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 100) || "AD_PLACEMENT";
    for (let suffix = 1; suffix < 10_000; suffix += 1) {
      const key = `${base}_${String(suffix).padStart(2, "0")}`;
      if (!await this.prisma.adPlacement.findUnique({ where: { key }, select: { id: true } })) return key;
    }
    throw new BadRequestException("Unable to generate a unique ad key");
  }

  private async syncChapterCount(novelId: string) {
    const count = await this.prisma.chapter.count({ where: { novelId } });
    await this.prisma.novel.update({ where: { id: novelId }, data: { sourceChapterCount: count } });
  }

  async uploadCover(file: UploadedCover, user: AuthenticatedUser) {
    if (!file || !file.mimetype.startsWith("image/") || file.size > 5_000_000) throw new BadRequestException("A cover image under 5 MB is required");
    return this.storeImageAsset(file, user, "COVER");
  }

  async uploadSiteAsset(file: UploadedCover, user: AuthenticatedUser) {
    const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/x-icon", "image/vnd.microsoft.icon"]);
    if (!file || !allowedTypes.has(file.mimetype) || file.size > 5_000_000) throw new BadRequestException("A PNG, JPG, WebP, or ICO image under 5 MB is required");
    return this.storeImageAsset(file, user, "SITE_ASSET");
  }

  private async storeImageAsset(file: UploadedCover, user: AuthenticatedUser, auditType: "COVER" | "SITE_ASSET") {
    const extension = extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, "") || ".jpg";
    const filename = `${randomUUID()}${extension}`;
    await mkdir(this.coverPath, { recursive: true });
    await writeFile(join(this.coverPath, filename), file.buffer);
    const data = await this.prisma.asset.create({ data: { provider: "LOCAL", localPath: join(this.coverPath, filename), storageKey: `covers/${filename}`, publicUrl: `/covers/${filename}`, contentType: file.mimetype, byteSize: file.size, checksum: createHash("sha256").update(file.buffer).digest("hex") } });
    await this.audit(user, "UPLOAD", "Asset", data.id, { filename, type: auditType });
    return { data };
  }

  async getSiteSettings() {
    const setting = await this.prisma.siteSetting.upsert({ where: { id: "default" }, update: {}, create: { id: "default" }, include: siteSettingInclude });
    return { data: presentSiteSetting(setting, { includeAdsTxt: true }) };
  }

  async updateSiteSettings(input: SiteSettingInputDto, user: AuthenticatedUser) {
    const setting = await this.prisma.siteSetting.upsert({
      where: { id: "default" },
      update: input,
      create: { id: "default", ...input },
      include: siteSettingInclude
    });
    await this.audit(user, "UPDATE", "SiteSetting", setting.id, { fields: Object.keys(input) });
    await this.invalidate("settings");
    return { data: presentSiteSetting(setting, { includeAdsTxt: true }) };
  }

  async listPages() { return { data: await this.prisma.contentPage.findMany({ orderBy: { title: "asc" } }) }; }
  async createPage(input: ContentPageInputDto, user: AuthenticatedUser) {
    const data = await this.prisma.contentPage.create({ data: { ...input, sourceUrl: `admin://${input.slug}` } });
    await this.audit(user, "CREATE", "ContentPage", data.id, { slug: data.slug });
    await this.invalidate("pages");
    return { data };
  }
  async updatePage(id: string, input: ContentPageInputDto, user: AuthenticatedUser) {
    const data = await this.prisma.contentPage.update({ where: { id }, data: input });
    await this.audit(user, "UPDATE", "ContentPage", id, { slug: data.slug });
    await this.invalidate("pages");
    return { data };
  }
  async deletePage(id: string, user: AuthenticatedUser) {
    await this.prisma.contentPage.delete({ where: { id } });
    await this.audit(user, "DELETE", "ContentPage", id);
    await this.invalidate("pages");
    return { data: { id } };
  }

  async listRankings() { return { data: await this.prisma.ranking.findMany({ orderBy: [{ listKey: "asc" }, { position: "asc" }], include: { novel: { select: { id: true, title: true, slug: true } } } }) }; }
  async saveRanking(input: RankingInputDto, user: AuthenticatedUser) {
    const data = await this.prisma.ranking.upsert({ where: { listKey_position: { listKey: input.listKey, position: input.position } }, update: { novelId: input.novelId, label: input.label }, create: input });
    await this.audit(user, "UPSERT", "Ranking", data.id, { listKey: data.listKey, position: data.position });
    await this.invalidate("home", "rankings");
    return { data };
  }
  async deleteRanking(id: string, user: AuthenticatedUser) {
    await this.prisma.ranking.delete({ where: { id } });
    await this.audit(user, "DELETE", "Ranking", id);
    await this.invalidate("home", "rankings");
    return { data: { id } };
  }

  private invalidate(...namespaces: CacheNamespace[]) {
    return this.cache.invalidate(...namespaces);
  }
}
