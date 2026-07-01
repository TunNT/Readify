import { Global, Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { PublicCacheInterceptor } from "./public-cache.interceptor";
import { PublicCacheService } from "./public-cache.service";

@Global()
@Module({
  providers: [
    PublicCacheService,
    { provide: APP_INTERCEPTOR, useClass: PublicCacheInterceptor }
  ],
  exports: [PublicCacheService]
})
export class PublicCacheModule {}
