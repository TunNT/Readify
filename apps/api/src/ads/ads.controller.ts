import { Controller, Get, Query } from "@nestjs/common";
import { PublicAdsQueryDto } from "./ads.dto";
import { AdsService } from "./ads.service";

@Controller("ads")
export class AdsController {
  constructor(private readonly ads: AdsService) {}
  @Get() list(@Query() query: PublicAdsQueryDto) { return this.ads.publicPlacements(query); }
}
