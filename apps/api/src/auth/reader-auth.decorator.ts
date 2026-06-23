import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthenticatedUser } from "./auth.types";

export const CurrentReader = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  return context.switchToHttp().getRequest<{ readerUser: AuthenticatedUser }>().readerUser;
});
