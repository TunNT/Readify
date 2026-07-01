import { Controller, Get, Param, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { PaginationQueryDto } from "./dto/pagination-query.dto";
import { PublicCache } from "../cache/public-cache.decorator";
import { PUBLIC_CACHE } from "../cache/public-cache.policies";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @PublicCache(PUBLIC_CACHE.categories)
  listCategories() {
    return this.catalog.listCategories();
  }

  @Get(":slug")
  @PublicCache(PUBLIC_CACHE.category)
  getCategory(@Param("slug") slug: string, @Query() query: PaginationQueryDto) {
    return this.catalog.getCategory(slug, query);
  }
}
