import { Controller, Get, Param } from "@nestjs/common";
import { CatalogService } from "./catalog.service";

@Controller("pages")
export class PagesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get(":slug")
  getPage(@Param("slug") slug: string) {
    return this.catalog.getPage(slug);
  }
}
