import { Controller, Get, Param, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { ListChaptersQueryDto } from "./dto/list-chapters-query.dto";
import { ListNovelsQueryDto } from "./dto/list-novels-query.dto";
import { PublicCache } from "../cache/public-cache.decorator";
import { PUBLIC_CACHE } from "../cache/public-cache.policies";

@Controller("novels")
export class NovelsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @PublicCache(PUBLIC_CACHE.novelList)
  listNovels(@Query() query: ListNovelsQueryDto) {
    return this.catalog.listNovels(query);
  }

  @Get(":slug")
  @PublicCache(PUBLIC_CACHE.novel)
  getNovel(@Param("slug") slug: string) {
    return this.catalog.getNovel(slug);
  }

  @Get(":slug/chapters")
  @PublicCache(PUBLIC_CACHE.chapterList)
  listChapters(@Param("slug") slug: string, @Query() query: ListChaptersQueryDto) {
    return this.catalog.listChapters(slug, query);
  }

  @Get(":slug/chapters/:chapterSlug")
  @PublicCache(PUBLIC_CACHE.chapter)
  getChapter(@Param("slug") slug: string, @Param("chapterSlug") chapterSlug: string) {
    return this.catalog.getChapter(slug, chapterSlug);
  }
}
