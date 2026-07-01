import { Controller, Get, Query } from "@nestjs/common";
import { PublicAdsQueryDto } from "./ads.dto";
import { AdsService } from "./ads.service";
import { PublicCache } from "../cache/public-cache.decorator";
import { PUBLIC_CACHE } from "../cache/public-cache.policies";

@Controller("ads")
export class AdsController {
  constructor(private readonly ads: AdsService) {}
  @Get()
  @PublicCache(PUBLIC_CACHE.ads)
  list(@Query() query: PublicAdsQueryDto) {
    return this.ads.publicPlacements(query);
  }
}
