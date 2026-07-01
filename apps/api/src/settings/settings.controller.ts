import { Controller, Get } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { PublicCache } from "../cache/public-cache.decorator";
import { PUBLIC_CACHE } from "../cache/public-cache.policies";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @PublicCache(PUBLIC_CACHE.settings)
  getPublicSettings() {
    return this.settings.getPublicSettings();
  }
}
