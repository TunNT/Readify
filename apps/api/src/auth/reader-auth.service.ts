import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import type { UserRole } from "@prisma/client";
import { hashPassword, verifyPassword } from "./password";
import type { ReaderSyncDto } from "./dto/reader-auth.dto";

const novelSelect = {
  slug: true,
  title: true,
  authorName: true,
  _count: { select: { chapters: true } },
  coverAsset: { select: { publicUrl: true } }
} as const;

@Injectable()
export class ReaderAuthService {
  readonly cookieSecure: boolean;
  readonly sessionDays: number;

  constructor(private readonly prisma: PrismaService, config: ConfigService) {
    this.cookieSecure = config.get<string>("READER_COOKIE_SECURE", config.get<string>("ADMIN_COOKIE_SECURE", "false")) === "true";
    this.sessionDays = Number(config.get<string>("READER_SESSION_DAYS", "30"));
  }

  async register(email: string, password: string, displayName: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new ConflictException("An account with this email already exists");
    const user = await this.prisma.user.create({
      data: { email: normalizedEmail, displayName: displayName.trim(), passwordHash: hashPassword(password), role: "READER" },
      select: { id: true, email: true, displayName: true, role: true }
    });
    return this.createSession(user);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user?.isActive || user.role !== "READER" || !verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException("Invalid email or password");
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return this.createSession({ id: user.id, email: user.email, displayName: user.displayName, role: user.role });
  }

  private async createSession(user: { id: string; email: string; displayName: string; role: UserRole }) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + this.sessionDays * 86_400_000);
    await this.prisma.$transaction([
      this.prisma.readerSession.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
      this.prisma.readerSession.create({ data: { userId: user.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt } })
    ]);
    return { token, expiresAt, user };
  }

  async logout(token?: string) {
    if (token) await this.prisma.readerSession.deleteMany({ where: { tokenHash: createHash("sha256").update(token).digest("hex") } });
  }

  async currentUser(token?: string) {
    if (!token) return null;
    const session = await this.prisma.readerSession.findUnique({
      where: { tokenHash: createHash("sha256").update(token).digest("hex") },
      select: { expiresAt: true, user: { select: { id: true, email: true, displayName: true, role: true, isActive: true } } }
    });
    if (!session || session.expiresAt <= new Date() || !session.user.isActive || session.user.role !== "READER") return null;
    return session.user;
  }

  async sync(userId: string, input: ReaderSyncDto) {
    await this.mergeLibrary(userId, input.library);
    await this.mergeHistory(userId, input.history);
    return this.collections(userId);
  }

  async saveLibrary(userId: string, slug: string) {
    const novel = await this.findNovel(slug);
    await this.prisma.libraryItem.upsert({
      where: { userId_novelId: { userId, novelId: novel.id } },
      update: { savedAt: new Date() },
      create: { userId, novelId: novel.id }
    });
    return this.collections(userId);
  }

  async removeLibrary(userId: string, slug: string) {
    const novel = await this.findNovel(slug);
    await this.prisma.libraryItem.deleteMany({ where: { userId, novelId: novel.id } });
    return this.collections(userId);
  }

  async recordHistory(userId: string, slug: string) {
    const novel = await this.findNovel(slug);
    const current = await this.prisma.readingHistory.findFirst({ where: { userId, novelId: novel.id } });
    if (current) await this.prisma.readingHistory.update({ where: { id: current.id }, data: { updatedAt: new Date() } });
    else await this.prisma.readingHistory.create({ data: { userId, novelId: novel.id } });
    return { data: { recorded: true } };
  }

  async clear(userId: string, type: "library" | "history") {
    if (type === "library") await this.prisma.libraryItem.deleteMany({ where: { userId } });
    else await this.prisma.readingHistory.deleteMany({ where: { userId } });
    return this.collections(userId);
  }

  async collections(userId: string) {
    const [library, history] = await Promise.all([
      this.prisma.libraryItem.findMany({ where: { userId }, orderBy: { savedAt: "desc" }, include: { novel: { select: novelSelect } } }),
      this.prisma.readingHistory.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 20, include: { novel: { select: novelSelect } } })
    ]);
    const mapNovel = (novel: (typeof library)[number]["novel"], savedAt: Date) => ({
      slug: novel.slug,
      title: novel.title,
      coverUrl: novel.coverAsset?.publicUrl ?? "",
      authorName: novel.authorName,
      chapterCount: novel._count.chapters,
      savedAt: savedAt.toISOString()
    });
    return { data: { library: library.map((item) => mapNovel(item.novel, item.savedAt)), history: history.map((item) => mapNovel(item.novel, item.updatedAt)) } };
  }

  private async mergeLibrary(userId: string, items: ReaderSyncDto["library"]) {
    const novels = await this.resolveNovels(items.map((item) => item.slug));
    await this.prisma.$transaction(items.flatMap((item) => {
      const novel = novels.get(item.slug);
      if (!novel) return [];
      const savedAt = item.savedAt ? new Date(item.savedAt) : new Date();
      return [this.prisma.libraryItem.upsert({ where: { userId_novelId: { userId, novelId: novel.id } }, update: { savedAt }, create: { userId, novelId: novel.id, savedAt } })];
    }));
  }

  private async mergeHistory(userId: string, items: ReaderSyncDto["history"]) {
    const novels = await this.resolveNovels(items.map((item) => item.slug));
    for (const item of items) {
      const novel = novels.get(item.slug);
      if (!novel) continue;
      const updatedAt = item.savedAt ? new Date(item.savedAt) : new Date();
      const current = await this.prisma.readingHistory.findFirst({ where: { userId, novelId: novel.id } });
      if (current) {
        if (current.updatedAt < updatedAt) await this.prisma.readingHistory.update({ where: { id: current.id }, data: { updatedAt } });
      } else await this.prisma.readingHistory.create({ data: { userId, novelId: novel.id, updatedAt } });
    }
  }

  private async resolveNovels(slugs: string[]) {
    const novels = await this.prisma.novel.findMany({ where: { slug: { in: [...new Set(slugs)] }, deletedAt: null } });
    return new Map(novels.map((novel) => [novel.slug, novel]));
  }

  private async findNovel(slug: string) {
    const novel = await this.prisma.novel.findFirst({ where: { slug, deletedAt: null } });
    if (!novel) throw new NotFoundException("Story not found");
    return novel;
  }
}
