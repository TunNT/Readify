import { Controller, Get, Query } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { RankingQueryDto } from "./dto/ranking-query.dto";

@Controller("rankings")
export class RankingsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  getRankings(@Query() query: RankingQueryDto) {
    return this.catalog.getRankings(query);
  }
}
