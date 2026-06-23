import { Module } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { CategoriesController } from "./categories.controller";
import { HomeController } from "./home.controller";
import { NovelsController } from "./novels.controller";
import { PagesController } from "./pages.controller";
import { RankingsController } from "./rankings.controller";
import { SearchController } from "./search.controller";

@Module({
  controllers: [HomeController, NovelsController, CategoriesController, RankingsController, SearchController, PagesController],
  providers: [CatalogService]
})
export class CatalogModule {}
