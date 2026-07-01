import { Controller, Get, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { SearchQueryDto } from "./dto/search-query.dto";
import { PublicCache } from "../cache/public-cache.decorator";
import { PUBLIC_CACHE } from "../cache/public-cache.policies";

@Controller("search")
export class SearchController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @PublicCache(PUBLIC_CACHE.search)
  search(@Query() query: SearchQueryDto) {
    return this.catalog.search(query);
  }
}
