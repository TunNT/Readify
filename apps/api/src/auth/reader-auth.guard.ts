import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthenticatedUser } from "./auth.types";

export const READER_COOKIE = "novelark_reader_session";

export function cookieValue(header: string | undefined, name: string) {
  return header?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

@Injectable()
export class ReaderAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: { cookie?: string }; readerUser?: AuthenticatedUser }>();
    const token = cookieValue(request.headers.cookie, READER_COOKIE);
    if (!token) throw new UnauthorizedException("Reader login required");
    const session = await this.prisma.readerSession.findUnique({
      where: { tokenHash: createHash("sha256").update(token).digest("hex") },
      select: { expiresAt: true, user: { select: { id: true, email: true, displayName: true, role: true, isActive: true } } }
    });
    if (!session || session.expiresAt <= new Date() || !session.user.isActive || session.user.role !== "READER") {
      throw new UnauthorizedException("Reader session expired");
    }
    request.readerUser = session.user;
    return true;
  }
}
