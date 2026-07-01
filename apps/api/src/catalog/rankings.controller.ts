import { Controller, Get, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { RankingQueryDto } from "./dto/ranking-query.dto";
import { PublicCache } from "../cache/public-cache.decorator";
import { PUBLIC_CACHE } from "../cache/public-cache.policies";

@Controller("rankings")
export class RankingsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @PublicCache(PUBLIC_CACHE.rankings)
  getRankings(@Query() query: RankingQueryDto) {
    return this.catalog.getRankings(query);
  }
}
