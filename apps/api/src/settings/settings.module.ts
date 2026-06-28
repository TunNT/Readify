import { Module } from "@nestjs/common";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";
import { SeoController } from "./seo.controller";

@Module({ controllers: [SettingsController, SeoController], providers: [SettingsService], exports: [SettingsService] })
export class SettingsModule {}
