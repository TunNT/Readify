import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { CurrentUser } from "./auth.decorators";
import { ADMIN_COOKIE, AdminAuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import type { AuthenticatedUser } from "./auth.types";
import { LoginDto } from "./dto/login.dto";

type CookieOptions = { httpOnly?: boolean; secure?: boolean; sameSite?: "strict"; path?: string; expires?: Date };
type CookieResponse = { cookie(name: string, value: string, options: CookieOptions): void; clearCookie(name: string, options: CookieOptions): void };
type CookieRequest = { headers: { cookie?: string } };

@Controller("admin/auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  async login(@Body() input: LoginDto, @Res({ passthrough: true }) response: CookieResponse) {
    const result = await this.auth.login(input.email, input.password);
    response.cookie(ADMIN_COOKIE, result.token, { httpOnly: true, secure: this.auth.cookieSecure, sameSite: "strict", path: "/", expires: result.expiresAt });
    return { data: result.user };
  }

  @Post("logout")
  async logout(@Req() request: CookieRequest, @Res({ passthrough: true }) response: CookieResponse) {
    const token = request.headers.cookie?.split(";").map((part: string) => part.trim()).find((part: string) => part.startsWith(`${ADMIN_COOKIE}=`))?.slice(ADMIN_COOKIE.length + 1);
    await this.auth.logout(token);
    response.clearCookie(ADMIN_COOKIE, { path: "/", sameSite: "strict", secure: this.auth.cookieSecure });
    return { data: { loggedOut: true } };
  }

  @Get("me")
  @UseGuards(AdminAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return { data: user };
  }
}
