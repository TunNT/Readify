import { Controller, Get, Param, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { PaginationQueryDto } from "./dto/pagination-query.dto";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  listCategories() {
    return this.catalog.listCategories();
  }

  @Get(":slug")
  getCategory(@Param("slug") slug: string, @Query() query: PaginationQueryDto) {
    return this.catalog.getCategory(slug, query);
  }
}
