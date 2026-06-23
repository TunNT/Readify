import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@prisma/client";
import { createHash } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { ROLES_KEY } from "./auth.decorators";
import type { AuthenticatedUser } from "./auth.types";

export const ADMIN_COOKIE = "novelark_admin_session";

function cookieValue(header: string | undefined, name: string) {
  return header?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: { cookie?: string }; adminUser?: AuthenticatedUser }>();
    const token = cookieValue(request.headers.cookie, ADMIN_COOKIE);
    if (!token) throw new UnauthorizedException("Admin login required");
    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash: createHash("sha256").update(token).digest("hex") },
      select: { expiresAt: true, user: { select: { id: true, email: true, displayName: true, role: true, isActive: true } } }
    });
    if (!session || session.expiresAt <= new Date() || !session.user.isActive) throw new UnauthorizedException("Admin session expired");
    request.adminUser = session.user;
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (roles?.length && !roles.includes(session.user.role)) throw new ForbiddenException("Insufficient permissions");
    return true;
  }
}
