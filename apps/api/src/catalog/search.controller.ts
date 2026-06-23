import { Controller, Get, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { SearchQueryDto } from "./dto/search-query.dto";

@Controller("search")
export class SearchController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  search(@Query() query: SearchQueryDto) {
    return this.catalog.search(query);
  }
}
