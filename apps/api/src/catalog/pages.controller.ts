import { Controller, Get, Param } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { PublicCache } from "../cache/public-cache.decorator";
import { PUBLIC_CACHE } from "../cache/public-cache.policies";

@Controller("pages")
export class PagesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get(":slug")
  @PublicCache(PUBLIC_CACHE.contentPage)
  getPage(@Param("slug") slug: string) {
    return this.catalog.getPage(slug);
  }
}
