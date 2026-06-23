import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { verifyPassword } from "./password";

@Injectable()
export class AuthService {
  readonly cookieSecure: boolean;
  readonly sessionDays: number;

  constructor(private readonly prisma: PrismaService, config: ConfigService) {
    this.cookieSecure = config.get<string>("ADMIN_COOKIE_SECURE", "false") === "true";
    this.sessionDays = Number(config.get<string>("ADMIN_SESSION_DAYS", "7"));
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user?.isActive || user.role === "READER" || !verifyPassword(password, user.passwordHash)) throw new UnauthorizedException("Invalid email or password");
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + this.sessionDays * 86_400_000);
    await this.prisma.$transaction([
      this.prisma.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
      this.prisma.adminSession.create({ data: { userId: user.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt } }),
      this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    ]);
    return { token, expiresAt, user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role } };
  }

  async logout(token?: string) {
    if (token) await this.prisma.adminSession.deleteMany({ where: { tokenHash: createHash("sha256").update(token).digest("hex") } });
  }
}
