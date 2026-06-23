import { Body, Controller, Delete, Get, Param, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { AuthenticatedUser } from "./auth.types";
import { CurrentReader } from "./reader-auth.decorator";
import { cookieValue, READER_COOKIE, ReaderAuthGuard } from "./reader-auth.guard";
import { ReaderAuthService } from "./reader-auth.service";
import { ReaderLoginDto, ReaderRegisterDto, ReaderSyncDto } from "./dto/reader-auth.dto";

type CookieOptions = { httpOnly?: boolean; secure?: boolean; sameSite?: "strict"; path?: string; expires?: Date };
type CookieResponse = { cookie(name: string, value: string, options: CookieOptions): void; clearCookie(name: string, options: CookieOptions): void };
type CookieRequest = { headers: { cookie?: string } };

@Controller("auth")
export class ReaderAuthController {
  constructor(private readonly auth: ReaderAuthService) {}

  @Post("register")
  async register(@Body() input: ReaderRegisterDto, @Res({ passthrough: true }) response: CookieResponse) {
    const result = await this.auth.register(input.email, input.password, input.displayName);
    this.setCookie(response, result.token, result.expiresAt);
    return { data: result.user };
  }

  @Post("login")
  async login(@Body() input: ReaderLoginDto, @Res({ passthrough: true }) response: CookieResponse) {
    const result = await this.auth.login(input.email, input.password);
    this.setCookie(response, result.token, result.expiresAt);
    return { data: result.user };
  }

  @Post("logout")
  async logout(@Req() request: CookieRequest, @Res({ passthrough: true }) response: CookieResponse) {
    await this.auth.logout(cookieValue(request.headers.cookie, READER_COOKIE));
    response.clearCookie(READER_COOKIE, { path: "/", sameSite: "strict", secure: this.auth.cookieSecure });
    return { data: { loggedOut: true } };
  }

  @Get("me")
  async me(@Req() request: CookieRequest) { return { data: await this.auth.currentUser(cookieValue(request.headers.cookie, READER_COOKIE)) }; }

  @Get("collections") @UseGuards(ReaderAuthGuard)
  collections(@CurrentReader() user: AuthenticatedUser) { return this.auth.collections(user.id); }

  @Post("sync") @UseGuards(ReaderAuthGuard)
  sync(@CurrentReader() user: AuthenticatedUser, @Body() input: ReaderSyncDto) { return this.auth.sync(user.id, input); }

  @Post("library/:slug")
  async saveLibrary(@Req() request: CookieRequest, @Param("slug") slug: string) {
    const user = await this.currentReader(request);
    return user ? this.auth.saveLibrary(user.id, slug) : { data: null };
  }

  @Delete("library/:slug")
  async removeLibrary(@Req() request: CookieRequest, @Param("slug") slug: string) {
    const user = await this.currentReader(request);
    return user ? this.auth.removeLibrary(user.id, slug) : { data: null };
  }

  @Post("history/:slug")
  async history(@Req() request: CookieRequest, @Param("slug") slug: string) {
    const user = await this.currentReader(request);
    return user ? this.auth.recordHistory(user.id, slug) : { data: { recorded: false } };
  }

  @Delete("collections/library")
  async clearLibrary(@Req() request: CookieRequest) {
    const user = await this.currentReader(request);
    return user ? this.auth.clear(user.id, "library") : { data: null };
  }

  @Delete("collections/history")
  async clearHistory(@Req() request: CookieRequest) {
    const user = await this.currentReader(request);
    return user ? this.auth.clear(user.id, "history") : { data: null };
  }

  private setCookie(response: CookieResponse, token: string, expiresAt: Date) {
    response.cookie(READER_COOKIE, token, { httpOnly: true, secure: this.auth.cookieSecure, sameSite: "strict", path: "/", expires: expiresAt });
  }

  private currentReader(request: CookieRequest) {
    return this.auth.currentUser(cookieValue(request.headers.cookie, READER_COOKIE));
  }
}
