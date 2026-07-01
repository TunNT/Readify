import { Controller, Get } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { PublicCache } from "../cache/public-cache.decorator";
import { PUBLIC_CACHE } from "../cache/public-cache.policies";

@Controller("seo")
export class SeoController {
  constructor(private readonly settings: SettingsService) {}

  @Get("sitemap")
  @PublicCache(PUBLIC_CACHE.sitemap)
  getSitemapEntries() {
    return this.settings.getSitemapEntries();
  }
}
