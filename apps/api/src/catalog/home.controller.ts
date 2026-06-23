import { Controller, Get } from "@nestjs/common";
import { CatalogService } from "./catalog.service";

@Controller("home")
export class HomeController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  getHome() {
    return this.catalog.getHome();
  }
}
