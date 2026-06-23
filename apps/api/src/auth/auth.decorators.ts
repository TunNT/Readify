import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import type { UserRole } from "@prisma/client";
import type { AuthenticatedUser } from "./auth.types";

export const ROLES_KEY = "admin_roles";
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  return context.switchToHttp().getRequest<{ adminUser: AuthenticatedUser }>().adminUser;
});
