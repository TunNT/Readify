import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ListChaptersQueryDto } from "./dto/list-chapters-query.dto";
import { ListNovelsQueryDto, NovelSort } from "./dto/list-novels-query.dto";
import { PaginationQueryDto } from "./dto/pagination-query.dto";
import { RankingQueryDto } from "./dto/ranking-query.dto";
import { SearchQueryDto } from "./dto/search-query.dto";
import { novelCardSelect, paginationMeta, presentNovelCard } from "./novel.presenter";

@Injectable()
export class CatalogService {
  private readonly apiPublicUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService
  ) {
    this.apiPublicUrl = config.get<string>("API_PUBLIC_URL", "http://localhost:4000").replace(/\/$/, "");
  }

  private present = (novel: Parameters<typeof presentNovelCard>[0]) => presentNovelCard(novel, this.apiPublicUrl);

  private novelOrder(sort: NovelSort): Prisma.NovelOrderByWithRelationInput[] {
    if (sort === "chapters") return [{ sourceChapterCount: "desc" }, { title: "asc" }];
    if (sort === "rating") return [{ ratingAverage: "desc" }, { ratingCount: "desc" }, { title: "asc" }];
    if (sort === "title") return [{ title: "asc" }];
    return [{ sourceUpdatedAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }];
  }

  async listNovels(query: ListNovelsQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.NovelWhereInput = {
      isPublished: true,
      deletedAt: null,
      ...(search ? {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { authorName: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } }
        ]
      } : {}),
      ...(query.category ? { categories: { some: { category: { slug: query.category } } } } : {}),
      ...(query.status ? { status: query.status } : {})
    };
    const skip = (query.page - 1) * query.limit;
    const [total, novels] = await this.prisma.$transaction([
      this.prisma.novel.count({ where }),
      this.prisma.novel.findMany({
        where,
        select: novelCardSelect,
        orderBy: this.novelOrder(query.sort),
        skip,
        take: query.limit
      })
    ]);
    return { data: novels.map(this.present), meta: paginationMeta(total, query.page, query.limit) };
  }

  async search(query: SearchQueryDto) {
    return this.listNovels(Object.assign(new ListNovelsQueryDto(), query, { search: query.q }));
  }

  async getHome() {
    const rankingSelect = {
      position: true,
      novel: { select: novelCardSelect }
    } satisfies Prisma.RankingSelect;
    const [recommended, featured, hot, categories, novelCount, chapterAggregate] = await Promise.all([
      this.prisma.ranking.findMany({ where: { listKey: "recommended", novel: { isPublished: true, deletedAt: null } }, select: rankingSelect, orderBy: { position: "asc" } }),
      this.prisma.ranking.findMany({ where: { listKey: "featured", novel: { isPublished: true, deletedAt: null } }, select: rankingSelect, orderBy: { position: "asc" } }),
      this.prisma.ranking.findMany({ where: { listKey: "hot", novel: { isPublished: true, deletedAt: null } }, select: rankingSelect, orderBy: { position: "asc" } }),
      this.prisma.category.findMany({
        orderBy: [{ novels: { _count: "desc" } }, { name: "asc" }],
        select: { slug: true, name: true, icon: true, _count: { select: { novels: true } } }
      }),
      this.prisma.novel.count({ where: { isPublished: true, deletedAt: null } }),
      this.prisma.novel.aggregate({ where: { isPublished: true, deletedAt: null }, _sum: { sourceChapterCount: true } })
    ]);
    return {
      data: {
        recommended: recommended.map(({ novel }) => this.present(novel)),
        featured: featured.map(({ novel }) => this.present(novel)),
        hotRankings: hot.map(({ position, novel }) => ({ position, novel: this.present(novel) })),
        categories: categories.map(({ _count, ...category }) => ({ ...category, novelCount: _count.novels })),
        stats: { novelCount, chapterCount: chapterAggregate._sum.sourceChapterCount ?? 0, free: true }
      }
    };
  }

  async getNovel(slug: string) {
    const novel = await this.prisma.novel.findFirst({ where: { slug, isPublished: true, deletedAt: null }, select: novelCardSelect });
    if (!novel) throw new NotFoundException(`Novel '${slug}' was not found`);
    const [firstChapter, latestChapter] = await Promise.all([
      this.prisma.chapter.findFirst({ where: { novelId: novel.id }, orderBy: { number: "asc" }, select: { slug: true, number: true, title: true } }),
      this.prisma.chapter.findFirst({ where: { novelId: novel.id }, orderBy: { number: "desc" }, select: { slug: true, number: true, title: true } })
    ]);
    return { data: { ...this.present(novel), firstChapter, latestChapter } };
  }

  async listChapters(novelSlug: string, query: ListChaptersQueryDto) {
    const novel = await this.prisma.novel.findFirst({ where: { slug: novelSlug, isPublished: true, deletedAt: null }, select: { id: true, slug: true, title: true } });
    if (!novel) throw new NotFoundException(`Novel '${novelSlug}' was not found`);
    const skip = (query.page - 1) * query.limit;
    const [total, chapters] = await this.prisma.$transaction([
      this.prisma.chapter.count({ where: { novelId: novel.id } }),
      this.prisma.chapter.findMany({
        where: { novelId: novel.id },
        orderBy: { number: query.order },
        skip,
        take: query.limit,
        select: { slug: true, number: true, title: true, excerpt: true, publishedAt: true, sourceImportedAt: true }
      })
    ]);
    return {
      data: chapters.map(({ sourceImportedAt, ...chapter }) => ({ ...chapter, contentAvailable: Boolean(sourceImportedAt) })),
      novel,
      meta: paginationMeta(total, query.page, query.limit)
    };
  }

  async getChapter(novelSlug: string, chapterSlug: string) {
    const novel = await this.prisma.novel.findFirst({ where: { slug: novelSlug, isPublished: true, deletedAt: null }, select: { id: true, slug: true, title: true } });
    if (!novel) throw new NotFoundException(`Novel '${novelSlug}' was not found`);
    const chapter = await this.prisma.chapter.findUnique({
      where: { novelId_slug: { novelId: novel.id, slug: chapterSlug } },
      select: { id: true, slug: true, number: true, title: true, content: true, excerpt: true, publishedAt: true }
    });
    if (!chapter) throw new NotFoundException(`Chapter '${chapterSlug}' was not found`);
    const [previous, next] = await Promise.all([
      this.prisma.chapter.findFirst({ where: { novelId: novel.id, number: { lt: chapter.number } }, orderBy: { number: "desc" }, select: { slug: true, number: true, title: true } }),
      this.prisma.chapter.findFirst({ where: { novelId: novel.id, number: { gt: chapter.number } }, orderBy: { number: "asc" }, select: { slug: true, number: true, title: true } })
    ]);
    return { data: { ...chapter, contentAvailable: chapter.content.length > 0, novel, previous, next } };
  }

  async listCategories() {
    const categories = await this.prisma.category.findMany({
      orderBy: [{ novels: { _count: "desc" } }, { name: "asc" }],
      select: { slug: true, name: true, icon: true, _count: { select: { novels: true } } }
    });
    return { data: categories.map(({ _count, ...category }) => ({ ...category, novelCount: _count.novels })) };
  }

  async getCategory(slug: string, query: PaginationQueryDto) {
    const category = await this.prisma.category.findUnique({ where: { slug }, select: { id: true, slug: true, name: true, icon: true } });
    if (!category) throw new NotFoundException(`Category '${slug}' was not found`);
    const result = await this.listNovels(Object.assign(new ListNovelsQueryDto(), query, { category: slug }));
    return { ...result, category: { slug: category.slug, name: category.name, icon: category.icon } };
  }

  async getRankings(query: RankingQueryDto) {
    const skip = (query.page - 1) * query.limit;
    const [total, rankings] = await this.prisma.$transaction([
      this.prisma.ranking.count({ where: { listKey: query.list, novel: { isPublished: true, deletedAt: null } } }),
      this.prisma.ranking.findMany({
        where: { listKey: query.list, novel: { isPublished: true, deletedAt: null } },
        orderBy: { position: "asc" },
        skip,
        take: query.limit,
        select: { position: true, label: true, novel: { select: novelCardSelect } }
      })
    ]);
    return {
      data: rankings.map(({ novel, ...ranking }) => ({ ...ranking, novel: this.present(novel) })),
      meta: paginationMeta(total, query.page, query.limit)
    };
  }

  async getPage(slug: string) {
    const page = await this.prisma.contentPage.findUnique({
      where: { slug },
      select: { slug: true, title: true, contentHtml: true, importedAt: true, updatedAt: true }
    });
    if (!page) throw new NotFoundException(`Page '${slug}' was not found`);
    return { data: page };
  }
}
