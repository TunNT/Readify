import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "node:path";
import { CatalogModule } from "./catalog/catalog.module";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { AdminModule } from "./admin/admin.module";
import { AdsModule } from "./ads/ads.module";
import { AuthModule } from "./auth/auth.module";
import { SettingsModule } from "./settings/settings.module";
import { PublicCacheModule } from "./cache/public-cache.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), "../../storage/covers"),
      serveRoot: "/covers"
    }),
    PrismaModule,
    PublicCacheModule,
    AuthModule,
    AdminModule,
    AdsModule,
    SettingsModule,
    CatalogModule,
    HealthModule
  ]
})
export class AppModule {}
