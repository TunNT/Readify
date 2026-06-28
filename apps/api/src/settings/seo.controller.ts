import { Controller, Get } from "@nestjs/common";
import { SettingsService } from "./settings.service";

@Controller("seo")
export class SeoController {
  constructor(private readonly settings: SettingsService) {}

  @Get("sitemap")
  getSitemapEntries() {
    return this.settings.getSitemapEntries();
  }
}
