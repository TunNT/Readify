import { Controller, Get } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { PublicCache } from "../cache/public-cache.decorator";
import { PUBLIC_CACHE } from "../cache/public-cache.policies";

@Controller("home")
export class HomeController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @PublicCache(PUBLIC_CACHE.home)
  getHome() {
    return this.catalog.getHome();
  }
}
