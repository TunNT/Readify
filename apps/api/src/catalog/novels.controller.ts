import { Controller, Get, Param, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { ListChaptersQueryDto } from "./dto/list-chapters-query.dto";
import { ListNovelsQueryDto } from "./dto/list-novels-query.dto";

@Controller("novels")
export class NovelsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  listNovels(@Query() query: ListNovelsQueryDto) {
    return this.catalog.listNovels(query);
  }

  @Get(":slug")
  getNovel(@Param("slug") slug: string) {
    return this.catalog.getNovel(slug);
  }

  @Get(":slug/chapters")
  listChapters(@Param("slug") slug: string, @Query() query: ListChaptersQueryDto) {
    return this.catalog.listChapters(slug, query);
  }

  @Get(":slug/chapters/:chapterSlug")
  getChapter(@Param("slug") slug: string, @Param("chapterSlug") chapterSlug: string) {
    return this.catalog.getChapter(slug, chapterSlug);
  }
}
