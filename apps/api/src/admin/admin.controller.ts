import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UserRole } from "@prisma/client";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import { AdminAuthGuard } from "../auth/auth.guard";
import type { AuthenticatedUser } from "../auth/auth.types";
import { AdPlacementInputDto, AdStatusInputDto, AdminListQueryDto, ChapterInputDto, ContentPageInputDto, NovelInputDto, RankingInputDto, SiteSettingInputDto, TaxonomyInputDto, UserInputDto } from "./admin.dto";
import { AdminService } from "./admin.service";

const CONTENT_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR];

@Controller("admin")
@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("dashboard") dashboard() { return this.admin.dashboard(); }

  @Get("novels") @Roles(...CONTENT_ROLES) listNovels(@Query() query: AdminListQueryDto) { return this.admin.listNovels(query); }
  @Get("novels/:id") @Roles(...CONTENT_ROLES) getNovel(@Param("id") id: string) { return this.admin.getNovel(id); }
  @Post("novels") @Roles(...CONTENT_ROLES) createNovel(@Body() input: NovelInputDto, @CurrentUser() user: AuthenticatedUser) { return this.admin.createNovel(input, user); }
  @Patch("novels/:id") @Roles(...CONTENT_ROLES) updateNovel(@Param("id") id: string, @Body() input: NovelInputDto, @CurrentUser() user: AuthenticatedUser) { return this.admin.updateNovel(id, input, user); }
  @Delete("novels/:id") @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) deleteNovel(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) { return this.admin.deleteNovel(id, user); }

  @Post("novels/:novelId/chapters") @Roles(...CONTENT_ROLES) createChapter(@Param("novelId") novelId: string, @Body() input: ChapterInputDto, @CurrentUser() user: AuthenticatedUser) { return this.admin.createChapter(novelId, input, user); }
  @Patch("chapters/:id") @Roles(...CONTENT_ROLES) updateChapter(@Param("id") id: string, @Body() input: ChapterInputDto, @CurrentUser() user: AuthenticatedUser) { return this.admin.updateChapter(id, input, user); }
  @Delete("chapters/:id") @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) deleteChapter(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) { return this.admin.deleteChapter(id, user); }

  @Get("categories") @Roles(...CONTENT_ROLES) listCategories() { return this.admin.listTaxonomy("category"); }
  @Post("categories") @Roles(...CONTENT_ROLES) createCategory(@Body() input: TaxonomyInputDto, @CurrentUser() user: AuthenticatedUser) { return this.admin.createTaxonomy("category", input, user); }
  @Patch("categories/:id") @Roles(...CONTENT_ROLES) updateCategory(@Param("id") id: string, @Body() input: TaxonomyInputDto, @CurrentUser() user: AuthenticatedUser) { return this.admin.updateTaxonomy("category", id, input, user); }
  @Delete("categories/:id") @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) deleteCategory(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) { return this.admin.deleteTaxonomy("category", id, user); }

  @Get("tags") @Roles(...CONTENT_ROLES) listTags() { return this.admin.listTaxonomy("tag"); }
  @Post("tags") @Roles(...CONTENT_ROLES) createTag(@Body() input: TaxonomyInputDto, @CurrentUser() user: AuthenticatedUser) { return this.admin.createTaxonomy("tag", input, user); }
  @Patch("tags/:id") @Roles(...CONTENT_ROLES) updateTag(@Param("id") id: string, @Body() input: TaxonomyInputDto, @CurrentUser() user: AuthenticatedUser) { return this.admin.updateTaxonomy("tag", id, input, user); }
  @Delete("tags/:id") @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) deleteTag(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) { return this.admin.deleteTaxonomy("tag", id, user); }

  @Get("users") @Roles(UserRole.SUPER_ADMIN) listUsers() { return this.admin.listUsers(); }
  @Post("users") @Roles(UserRole.SUPER_ADMIN) createUser(@Body() input: UserInputDto, @CurrentUser() user: AuthenticatedUser) { return this.admin.createUser(input, user); }
  @Patch("users/:id") @Roles(UserRole.SUPER_ADMIN) updateUser(@Param("id") id: string, @Body() input: UserInputDto, @CurrentUser() user: AuthenticatedUser) { return this.admin.updateUser(id, input, user); }
  @Delete("users/:id") @Roles(UserRole.SUPER_ADMIN) deleteUser(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) { return this.admin.deleteUser(id, user); }

  @Get("ads") @Roles(UserRole.SUPER_ADMIN, UserRole.ADS_MANAGER) listAds() { return this.admin.listAds(); }
  @Post("ads") @Roles(UserRole.SUPER_ADMIN) createAd(@Body() input: AdPlacementInputDto, @CurrentUser() user: AuthenticatedUser) { return this.admin.createAd(input, user); }
  @Patch("ads/:id") @Roles(UserRole.SUPER_ADMIN) updateAd(@Param("id") id: string, @Body() input: AdPlacementInputDto, @CurrentUser() user: AuthenticatedUser) { return this.admin.updateAd(id, input, user); }
  @Patch("ads/:id/status") @Roles(UserRole.SUPER_ADMIN) updateAdStatus(@Param("id") id: string, @Body() input: AdStatusInputDto, @CurrentUser() user: AuthenticatedUser) { return this.admin.updateAdStatus(id, input.isEnabled, user); }
  @Delete("ads/:id") @Roles(UserRole.SUPER_ADMIN) deleteAd(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) { return this.admin.deleteAd(id, user); }

  @Post("assets/covers") @Roles(...CONTENT_ROLES) @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 5_000_000 } }))
  uploadCover(@UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer }, @CurrentUser() user: AuthenticatedUser) { return this.admin.uploadCover(file, user); }

  @Post("assets/site") @Roles(UserRole.SUPER_ADMIN) @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 5_000_000 } }))
  uploadSiteAsset(@UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer }, @CurrentUser() user: AuthenticatedUser) { return this.admin.uploadSiteAsset(file, user); }

  @Get("settings") @Roles(UserRole.SUPER_ADMIN) getSiteSettings() { return this.admin.getSiteSettings(); }
  @Patch("settings") @Roles(UserRole.SUPER_ADMIN) updateSiteSettings(@Body() input: SiteSettingInputDto, @CurrentUser() user: AuthenticatedUser) { return this.admin.updateSiteSettings(input, user); }

  @Get("pages") @Roles(...CONTENT_ROLES) listPages() { return this.admin.listPages(); }
  @Post("pages") @Roles(...CONTENT_ROLES) createPage(@Body() input: ContentPageInputDto, @CurrentUser() user: AuthenticatedUser) { return this.admin.createPage(input, user); }
  @Patch("pages/:id") @Roles(...CONTENT_ROLES) updatePage(@Param("id") id: string, @Body() input: ContentPageInputDto, @CurrentUser() user: AuthenticatedUser) { return this.admin.updatePage(id, input, user); }
  @Delete("pages/:id") @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) deletePage(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) { return this.admin.deletePage(id, user); }

  @Get("rankings") @Roles(...CONTENT_ROLES) listRankings() { return this.admin.listRankings(); }
  @Post("rankings") @Roles(...CONTENT_ROLES) saveRanking(@Body() input: RankingInputDto, @CurrentUser() user: AuthenticatedUser) { return this.admin.saveRanking(input, user); }
  @Delete("rankings/:id") @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) deleteRanking(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) { return this.admin.deleteRanking(id, user); }
}
